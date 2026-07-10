import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@wcad/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { token, issuer_id, payment_method_id, installments, courseIds } = body;

    if (!token || !payment_method_id || !courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos o carrito vacío' }, { status: 400 });
    }

    const tokenMp = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!tokenMp) {
      return NextResponse.json({ error: 'Mercado Pago no está configurado en el servidor' }, { status: 500 });
    }

    // 1. Obtener datos de los cursos desde la BD
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, price, slug, is_free')
      .in('id', courseIds);

    if (coursesError || !coursesData || coursesData.length === 0) {
      return NextResponse.json({ error: 'Cursos no encontrados en la base de datos' }, { status: 404 });
    }

    interface CourseMin {
      id: string;
      title: string;
      price: number;
      slug: string;
      is_free: boolean;
    }
    const courses = coursesData as unknown as CourseMin[];
    const totalAmount = courses.reduce((acc, c) => acc + Number(c.price), 0);
    const description = `Inscripción a: ${courses.map((c) => c.title).join(', ')}`.substring(0, 250);

    // 2. Ejecutar el cargo directamente en la API de Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenMp}`,
        'X-Idempotency-Key': `mp_pay_${user.id}_${Date.now()}`,
      },
      body: JSON.stringify({
        token,
        issuer_id,
        payment_method_id,
        transaction_amount: totalAmount,
        installments: Number(installments || 1),
        description: description,
        payer: {
          email: user.email,
        },
        metadata: {
          course_ids: courseIds,
          student_id: user.id,
        },
      }),
    });

    const paymentResult = await mpResponse.json();

    if (!mpResponse.ok || paymentResult.status === 'rejected') {
      console.error('[MercadoPago Card payment] Failed:', paymentResult);
      return NextResponse.json({
        error: paymentResult.message || 'Pago rechazado por el banco. Intente con otra tarjeta.',
        status: paymentResult.status,
      }, { status: 400 });
    }

    if (paymentResult.status === 'approved') {
      const adminClient = createAdminClient();

      // 3. Registrar la transacción aprobada localmente (course_id queda NULL ya que es multi-curso)
      const { data: tx, error: txError } = await (adminClient as unknown as {
        from: (table: string) => {
          insert: (values: unknown) => {
            select: (cols: string) => {
              single: () => Promise<{ data: { id: string } | null; error: unknown }>
            }
          }
        }
      })
        .from('transactions')
        .insert({
          student_id: user.id,
          amount: totalAmount,
          currency: 'PEN',
          status: 'approved',
          payment_method: 'mercadopago',
          gateway_reference: String(paymentResult.id),
          gateway_data: paymentResult,
        })
        .select('id')
        .single();

      if (txError || !tx) {
        console.error('[MercadoPago Card Payment] Error DB Transaction:', txError);
        return NextResponse.json({ error: 'Error al registrar transacción en base de datos' }, { status: 500 });
      }

      // 4. Registrar los cursos comprados en la tabla puente transaction_courses
      const txCoursesPayload = courses.map((c) => ({
        transaction_id: tx.id,
        course_id: c.id,
      }));

      const { error: bridgeError } = await (adminClient as unknown as {
        from: (table: string) => {
          insert: (values: unknown) => Promise<{ error: unknown }>
        }
      })
        .from('transaction_courses')
        .insert(txCoursesPayload);

      if (bridgeError) {
        console.error('[MercadoPago Card Payment] Error Bridge:', bridgeError);
      }

      // 5. Activar la inscripción (enrollment) por cada curso
      const enrollmentsPayload = courses.map((c) => ({
        student_id: user.id,
        course_id: c.id,
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
        console.error('[MercadoPago Card Payment] Error enrollments:', enrollError);
      }

      // Revalidar caché de los cursos correspondientes
      courses.forEach((c) => {
        if (c.slug) revalidatePath(`/courses/${c.slug}`);
      });
      revalidatePath('/dashboard');

      return NextResponse.json({ success: true, paymentId: paymentResult.id });
    }

    return NextResponse.json({
      status: paymentResult.status,
      message: 'El pago está en proceso de verificación.',
    });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[MercadoPago Card Payment] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 500 });
  }
}
