import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@wcad/utils/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const courseIdsStr = formData.get('courseIds') as string | null;
    const method = formData.get('method') as string | null; // 'yape' o 'plin'

    if (!file || !courseIdsStr || !method) {
      return NextResponse.json({ error: 'Faltan campos requeridos (file, courseIds, method)' }, { status: 400 });
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'El voucher seleccionado supera el límite de 5MB.' }, { status: 400 });
    }

    let courseIds: string[] = [];
    try {
      courseIds = JSON.parse(courseIdsStr);
    } catch {
      return NextResponse.json({ error: 'Formato de courseIds inválido' }, { status: 400 });
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    if (method !== 'yape' && method !== 'plin') {
      return NextResponse.json({ error: 'Método de pago manual no válido' }, { status: 400 });
    }

    // 1. Obtener datos de los cursos desde la BD
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

    // 2. Subir archivo a Supabase Storage (bucket: 'vouchers')
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}_cart_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vouchers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload Voucher] Error en Storage:', uploadError);
      return NextResponse.json({ error: 'Error al subir el comprobante de pago. Verifica que el bucket "vouchers" esté creado en Supabase.' }, { status: 500 });
    }

    // 3. Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('vouchers')
      .getPublicUrl(filePath);

    // 4. Crear la transacción local como 'pending' usando el admin client (course_id queda NULL para multi-curso)
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
        payment_method: method,
        voucher_url: publicUrl,
      })
      .select('id')
      .single();

    if (txError || !tx) {
      console.error('[Upload Voucher] Error DB Transaction:', txError);
      return NextResponse.json({ error: 'Error al registrar la transacción en la base de datos' }, { status: 500 });
    }

    // 5. Registrar relaciones en la tabla puente transaction_courses
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
      console.error('[Upload Voucher] Error Bridge:', bridgeError);
    }

    return NextResponse.json({ success: true, transactionId: tx.id });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[Upload Voucher] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 500 });
  }
}
