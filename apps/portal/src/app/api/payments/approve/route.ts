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

    // Validar rol de administrador o profesor directamente desde el JWT
    const role = user.app_metadata?.role as string | undefined;
    if (!role || !['admin', 'teacher', 'profesor'].includes(role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { transactionId } = await req.json();
    if (!transactionId) {
      return NextResponse.json({ error: 'Falta transactionId' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Obtener detalles de la transacción
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
      .eq('id', transactionId)
      .single();

    if (txError || !tx) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
    }

    if (tx.status === 'approved') {
      return NextResponse.json({ success: true, message: 'La transacción ya estaba aprobada' });
    }

    // 1. Obtener cursos desde la tabla puente
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
      console.error('[Approve Payment] Error al buscar cursos puente:', bridgeError);
      return NextResponse.json({ error: 'Error: No hay cursos asociados a esta transacción' }, { status: 400 });
    }

    // 2. Actualizar la transacción a aprobada
    const { error: updateError } = await (adminClient as unknown as {
      from: (table: string) => {
        update: (values: unknown) => {
          eq: (col: string, val: unknown) => Promise<{ error: unknown }>
        }
      }
    })
      .from('transactions')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', tx.id);

    if (updateError) {
      console.error('[Approve Payment] Error DB:', updateError);
      return NextResponse.json({ error: 'Error al actualizar transacción' }, { status: 500 });
    }

    // 3. Crear las inscripciones (enrollments) para todos los cursos
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
      console.error('[Approve Payment] Error enroll:', enrollError);
      return NextResponse.json({ error: 'Error al registrar inscripción' }, { status: 500 });
    }

    // Revalidar caché de los cursos del estudiante
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

    // Revalidar paths en la caché del portal
    revalidatePath('/payments');
    revalidatePath('/dashboard');

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[Approve Payment] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 500 });
  }
}
