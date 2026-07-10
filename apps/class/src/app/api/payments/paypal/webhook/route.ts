import { NextResponse } from 'next/server';
import { createAdminClient } from '@wcad/utils/supabase/server';
import { getPayPalOrder } from '@wcad/utils/payments';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = body.event_type;

    console.log(`[PayPal Webhook] Recibido evento: ${eventType}`);

    if (eventType !== 'PAYMENT.CAPTURE.COMPLETED' && eventType !== 'CHECKOUT.ORDER.APPROVED') {
      return NextResponse.json({ received: true });
    }

    const adminClient = createAdminClient();
    let orderId = '';
    const captureData = body.resource;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      orderId = body.resource.supplementary_data?.related_ids?.order_id || '';
      if (!orderId && Array.isArray(body.resource.links)) {
        const orderLink = body.resource.links.find((l: { rel: string; href: string }) => l.rel === 'up');
        if (orderLink?.href) {
          const parts = orderLink.href.split('/');
          orderId = parts[parts.length - 1];
        }
      }
    } else if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      orderId = body.resource.id;
    }

    if (!orderId) {
      console.warn('[PayPal Webhook] No se pudo identificar el orderId en el evento.');
      return NextResponse.json({ received: true });
    }

    // Buscar transacción local por gateway_reference
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
      console.warn(`[PayPal Webhook] Transacción local no encontrada para orden PayPal: ${orderId}`);
      return NextResponse.json({ received: true });
    }

    if (tx.status === 'approved') {
      return NextResponse.json({ success: true, message: 'Pago ya procesado previamente' });
    }

    // Verificar el estado real de la transacción en PayPal
    try {
      const paypalOrder = await getPayPalOrder(orderId);
      const paypalStatus = paypalOrder?.status; // APPROVED o COMPLETED

      console.log(`[PayPal Webhook] Verificación de orden ${orderId} en PayPal. Estado: ${paypalStatus}`);

      if (paypalStatus !== 'APPROVED' && paypalStatus !== 'COMPLETED') {
        console.warn(`[PayPal Webhook] Transacción ${orderId} rechazada. Estado real en pasarela: ${paypalStatus}`);
        return NextResponse.json(
          { error: `El estado de la orden en PayPal (${paypalStatus}) no es APPROVED o COMPLETED` },
          { status: 400 }
        );
      }
    } catch (verifyError) {
      console.error(`[PayPal Webhook] Error al verificar la orden ${orderId} con PayPal:`, verifyError);
      return NextResponse.json(
        { error: 'No se pudo verificar el estado del pago con PayPal' },
        { status: 500 }
      );
    }

    // 1. Actualizar transacción
    await (adminClient as unknown as {
      from: (table: string) => {
        update: (values: unknown) => {
          eq: (col: string, val: unknown) => Promise<{ error: unknown }>
        }
      }
    })
      .from('transactions')
      .update({
        status: 'approved',
        gateway_data: captureData,
      })
      .eq('id', tx.id);

    // 2. Obtener cursos de la tabla puente
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
      console.error('[PayPal Webhook] Error al buscar cursos puente:', bridgeError);
      return NextResponse.json({ received: true });
    }

    // 3. Crear las inscripciones (enrollments)
    const enrollmentsPayload = txCourses.map((tc: { course_id: string }) => ({
      student_id: tx.student_id,
      course_id: tc.course_id,
      status: 'active',
      transaction_id: tx.id,
    }));

    await (adminClient as unknown as {
      from: (table: string) => {
        upsert: (values: unknown, opts: unknown) => Promise<{ error: unknown }>
      }
    })
      .from('enrollments')
      .upsert(enrollmentsPayload, { onConflict: 'student_id,course_id' });

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

    console.log(`[PayPal Webhook] ${txCourses.length} inscripciones activadas vía webhook.`);
    return NextResponse.json({ success: true });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[PayPal Webhook] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 200 });
  }
}
