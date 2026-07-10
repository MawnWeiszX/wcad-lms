import { NextResponse } from 'next/server';
import { createAdminClient } from '@wcad/utils/supabase/server';
import { getMercadoPagoPayment } from '@wcad/utils/payments';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    let paymentId = searchParams.get('data.id') || searchParams.get('id');
    let topic = searchParams.get('type') || searchParams.get('topic');

    if (!paymentId || !topic) {
      const body = await req.json().catch(() => ({}));
      if (body.data?.id) {
        paymentId = body.data.id;
      }
      if (body.type) {
        topic = body.type;
      }
    }

    if (topic !== 'payment' || !paymentId) {
      return NextResponse.json({ received: true });
    }

    console.log(`[MercadoPago Webhook] Procesando pago ID: ${paymentId}`);

    const payment = await getMercadoPagoPayment(paymentId);

    if (payment.status === 'approved') {
      const adminClient = createAdminClient();

      // Buscar la transacción local por el ID de preferencia (gateway_reference)
      const { data: tx, error: txError } = await (adminClient as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: unknown) => {
              single: () => Promise<{ data: { id: string; student_id: string; status: string } | null; error: unknown }>
            }
          }
        }
      })
        .from('transactions')
        .select('id, student_id, status')
        .eq('gateway_reference', payment.preference_id)
        .single();

      if (txError || !tx) {
        console.warn(`[MercadoPago Webhook] Transacción no encontrada para preferencia: ${payment.preference_id}`);
        return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
      }

      if (tx.status === 'approved') {
        return NextResponse.json({ success: true, message: 'Pago ya procesado previamente' });
      }

      // 1. Actualizar estado de la transacción en la base de datos
      const { error: updateTxError } = await (adminClient as unknown as {
        from: (table: string) => {
          update: (values: unknown) => {
            eq: (col: string, val: unknown) => Promise<{ error: unknown }>
          }
        }
      })
        .from('transactions')
        .update({
          status: 'approved',
          gateway_data: payment,
        })
        .eq('id', tx.id);

      if (updateTxError) {
        console.error('[MercadoPago Webhook] Error actualizando transacción:', updateTxError);
        return NextResponse.json({ error: 'Error actualizando transacción' }, { status: 500 });
      }

      // 2. Obtener los cursos vinculados desde la tabla puente transaction_courses
      const { data: txCourses, error: bridgeError } = await (adminClient as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: unknown) => Promise<{ data: { course_id: string }[] | null; error: unknown }>
          }
        }
      })
        .from('transaction_courses')
        .select('course_id')
        .eq('transaction_id', tx.id);

      if (bridgeError || !txCourses || txCourses.length === 0) {
        console.error('[MercadoPago Webhook] Error al buscar cursos puente:', bridgeError);
        return NextResponse.json({ error: 'No se encontraron cursos para esta transacción' }, { status: 500 });
      }

      // 3. Crear las inscripciones (enrollments) por cada curso
      const enrollmentsPayload = txCourses.map((tc: { course_id: string }) => ({
        student_id: tx.student_id,
        course_id: tc.course_id,
        status: 'active',
        transaction_id: tx.id,
      }));

      const { error: enrollError } = await (adminClient as unknown as {
        from: (table: string) => {
          upsert: (values: unknown, opts: unknown) => Promise<{ error: unknown }>
        }
      })
        .from('enrollments')
        .upsert(enrollmentsPayload, { onConflict: 'student_id,course_id' });

      if (enrollError) {
        console.error('[MercadoPago Webhook] Error activando inscripciones:', enrollError);
        return NextResponse.json({ error: 'Error al registrar inscripciones' }, { status: 500 });
      }

      // 4. Revalidar caché de los cursos adquiridos
      const courseIds = txCourses.map((tc: { course_id: string }) => tc.course_id);
      const { data: courses } = await (adminClient as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            in: (col: string, vals: unknown[]) => Promise<{ data: { slug: string }[] | null; error: unknown }>
          }
        }
      })
        .from('courses')
        .select('slug')
        .in('id', courseIds);

      if (courses) {
        courses.forEach((c: { slug: string }) => {
          if (c.slug) revalidatePath(`/courses/${c.slug}`);
        });
      }
      revalidatePath('/dashboard');

      console.log(`[MercadoPago Webhook] ${txCourses.length} inscripciones activadas con éxito.`);
    } else if (payment.status === 'rejected') {
      const adminClient = createAdminClient();
      await (adminClient as unknown as {
        from: (table: string) => {
          update: (values: unknown) => {
            eq: (col: string, val: unknown) => Promise<{ error: unknown }>
          }
        }
      })
        .from('transactions')
        .update({
          status: 'rejected',
          gateway_data: payment,
        })
        .eq('gateway_reference', payment.preference_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[MercadoPago Webhook] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 200 });
  }
}
