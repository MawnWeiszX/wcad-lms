import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@wcad/utils/supabase/server';
import { createPayPalOrder } from '@wcad/utils/payments';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { courseIds } = await req.json();
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'Faltan courseIds o el carrito está vacío' }, { status: 400 });
    }

    // Obtener datos de los cursos
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, price, is_free')
      .in('id', courseIds);

    if (coursesError || !coursesData || coursesData.length === 0) {
      return NextResponse.json({ error: 'Cursos no encontrados' }, { status: 404 });
    }

    interface CourseMin {
      id: string;
      title: string;
      price: number;
      is_free: boolean;
    }
    const courses = coursesData as unknown as CourseMin[];
    const totalAmount = courses.reduce((acc, c) => acc + Number(c.price), 0);
    const combinedTitle = `Compra de ${courses.length} cursos en WCAD`;

    // Crear la orden en PayPal (la conversión PEN -> USD se realiza dentro del helper)
    const order = await createPayPalOrder({
      courseId: courses[0].id, // Usamos la ID del primer curso como ref
      courseTitle: combinedTitle,
      amountInPen: totalAmount,
      studentId: user.id,
    });

    // Registrar la transacción local como pendiente con gateway_reference = PayPal Order ID
    const adminClient = createAdminClient();
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
        status: 'pending',
        payment_method: 'paypal',
        gateway_reference: order.id,
      })
      .select('id')
      .single();

    if (txError || !tx) {
      console.error('[PayPal Create Order] Error DB Transaction:', txError);
      return NextResponse.json({ error: 'Error al registrar transacción local' }, { status: 500 });
    }

    // Registrar los cursos en la tabla puente
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
      console.error('[PayPal Create Order] Error Bridge:', bridgeError);
    }

    return NextResponse.json({ id: order.id });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[PayPal Create Order] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 500 });
  }
}
