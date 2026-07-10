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

    const { transactionId, rejectionReason } = await req.json();
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

    if (tx.status === 'rejected') {
      return NextResponse.json({ success: true, message: 'La transacción ya estaba rechazada' });
    }

    // 1. Obtener cursos de la tabla puente
    const { data: txCourses } = await (adminClient as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: unknown) => Promise<{ data: { course_id: string }[] | null; error: unknown }>
        }
      }
    })
      .from('transaction_courses')
      .select('course_id')
      .eq('transaction_id', tx.id);

    // 2. Actualizar la transacción a rechazada con el motivo
    const { error: updateError } = await (adminClient as unknown as {
      from: (table: string) => {
        update: (values: unknown) => {
          eq: (col: string, val: unknown) => Promise<{ error: unknown }>
        }
      }
    })
      .from('transactions')
      .update({
        status: 'rejected',
        approved_by: user.id, // Guardamos quién la rechazó
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason || 'Comprobante no válido',
      })
      .eq('id', tx.id);

    if (updateError) {
      console.error('[Reject Payment] Error DB:', updateError);
      return NextResponse.json({ error: 'Error al rechazar transacción' }, { status: 500 });
    }

    // 3. Si existían inscripciones previas vinculadas, las expiramos
    if (txCourses && txCourses.length > 0) {
      const courseIds = txCourses.map((tc: { course_id: string }) => tc.course_id);
      await (adminClient as unknown as {
        from: (table: string) => {
          update: (values: unknown) => {
            eq: (col: string, val: unknown) => {
              in: (col: string, vals: unknown[]) => Promise<{ error: unknown }>
            }
          }
        }
      })
        .from('enrollments')
        .update({ status: 'expired' })
        .eq('student_id', tx.student_id)
        .in('course_id', courseIds);
    }

    // Revalidar paths en la caché del portal
    revalidatePath('/payments');
    revalidatePath('/dashboard');

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorObj = err as { message?: string };
    console.error('[Reject Payment] Exception:', err);
    return NextResponse.json({ error: errorObj.message || 'Error interno' }, { status: 500 });
  }
}
