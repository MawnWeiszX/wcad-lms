import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@wcad/utils/supabase/server';
import { capturePayPalOrder } from '@wcad/utils/payments';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Falta orderId' }, { status: 400 });
    }

    console.log(`[PayPal Capture] Capturando orden ID: ${orderId}`);

    // Ejecutar captura del pago
    const capture = await capturePayPalOrder(orderId);

    if (capture.status === 'COMPLETED') {
      const adminClient = createAdminClient();

      // Buscar transacción por gateway_reference
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
        .eq('gateway_reference', orderId)
        .single();

      if (txError || !tx) {
        console.error(`[PayPal Capture] Transacción local no encontrada para orden PayPal: ${orderId}`);
        return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
      }

      if (tx.status === 'approved') {
        return NextResponse.json({ success: true, message: 'Inscripción ya procesada previamente' });
      }

      // 1. Actualizar transacción
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
          gateway_data: capture,
        })
        .eq('id', tx.id);

      if (updateTxError) {
        console.error('[PayPal Capture] Error actualizando transacción:', updateTxError);
        return NextResponse.json({ error: 'Error actualizando transacción' }, { status: 500 });
      }

      // 2. Obtener los cursos desde la tabla puente
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
        console.error('[PayPal Capture] Error al buscar cursos puente:', bridgeError);
        return NextResponse.json({ error: 'No se encontraron cursos asociados' }, { status: 500 });
      }

      // 3. Crear las inscripciones activas (enrollments)
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
        console.error('[PayPal Capture] Error creando inscripciones:', enrollError);
        return NextResponse.json({ error: 'Error al registrar inscripciones' }, { status: 500 });
      }

      // 4. Revalidar cache de los cursos
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

      console.log(`[PayPal Capture] ${txCourses.length} inscripciones activadas con éxito.`);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `La captura de PayPal retornó estado: ${capture.status}` }, { status: 400 });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[PayPal Capture] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 500 });
  }
}
