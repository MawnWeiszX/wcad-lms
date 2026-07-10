'use server';

import { createServerSupabaseClient, createAdminClient } from '@wcad/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function enrollInCourse(courseId: string, courseSlug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Debes iniciar sesión para inscribirte');
  }

  // 1. Obtener detalles del curso para validar que sea gratis
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('price, is_free')
    .eq('id', courseId)
    .single();

  if (courseError || !courseData) {
    throw new Error('Curso no encontrado');
  }

  const course = courseData as { price: number; is_free: boolean };
  const isFree = course.is_free || course.price === 0;
  if (!isFree) {
    throw new Error('Este curso requiere pago');
  }

  interface SafeAdminClient {
    from(table: string): {
      insert(payload: {
        student_id: string;
        course_id: string;
        status: string;
        transaction_id: string | null;
      }): Promise<{ error: { code?: string; message: string } | null }>;
    };
  }

  // 2. Usar admin client para bypasear la RLS de insert en enrollments
  const adminClient = createAdminClient() as unknown as SafeAdminClient;
  const { error: enrollError } = await adminClient
    .from('enrollments')
    .insert({
      student_id: user.id,
      course_id: courseId,
      status: 'active',
      transaction_id: null,
    });

  if (enrollError) {
    // Si ya está inscrito (violación de unicidad), redirigimos directo al aula
    if (enrollError.code !== '23505') {
      throw new Error(`Error de inscripción: ${enrollError.message}`);
    }
  }

  // Revalidar los paths para que se actualice el estado
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath('/dashboard');
}
