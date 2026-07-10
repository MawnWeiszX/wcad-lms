'use server';

import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Obtener cliente autenticado y verificar rol (desde JWT para evitar consulta extra a profiles)
async function getAuthorizedClient() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  
  const role = user.app_metadata?.role as string | undefined;
  if (!role || !['teacher', 'admin', 'profesor'].includes(role)) {
    throw new Error('Sin permisos');
  }
  return supabase;
}

interface CategoriesTableClient {
  from(table: string): {
    insert(payload: unknown): Promise<{ error: { message: string; code?: string } | null }>;
    update(payload: unknown): { eq(col: string, val: string): Promise<{ error: { message: string } | null }> };
    delete(): { eq(col: string, val: string): Promise<{ error: { message: string } | null }> };
    select(cols: string): { eq(col: string, val: string): { limit(n: number): Promise<{ data: { id: string }[] | null; error: unknown }> } };
  };
}

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

// ── Crear categoría ──────────────────────────────────────────
export async function createCategory(formData: FormData) {
  try {
    const supabase = await getAuthorizedClient() as unknown as CategoriesTableClient;
    const name = String(formData.get('name') ?? '').trim();
    const slug = String(formData.get('slug') ?? '').trim() || slugify(name);
    const description = String(formData.get('description') ?? '').trim() || null;

    if (!name) return { error: 'El nombre es requerido.' };

    const { error } = await supabase.from('categories').insert({ name, slug, description });
    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505')
        return { error: 'Ya existe una categoría con ese nombre o slug.' };
      return { error: 'Error al crear la categoría.' };
    }
    revalidatePath('/courses');
    return { success: true };
  } catch (err) {
    const errorObj = err as { message?: string };
    return { error: errorObj.message || 'Error de autorización.' };
  }
}

// ── Actualizar categoría ─────────────────────────────────────
export async function updateCategory(id: string, formData: FormData) {
  try {
    const supabase = await getAuthorizedClient() as unknown as CategoriesTableClient;
    const name = String(formData.get('name') ?? '').trim();
    const slug = String(formData.get('slug') ?? '').trim() || slugify(name);
    const description = String(formData.get('description') ?? '').trim() || null;

    if (!name) return { error: 'El nombre es requerido.' };

    const { error } = await supabase.from('categories').update({ name, slug, description }).eq('id', id);
    if (error) return { error: 'Error al actualizar la categoría.' };
    revalidatePath('/courses');
    return { success: true };
  } catch (err) {
    const errorObj = err as { message?: string };
    return { error: errorObj.message || 'Error de autorización.' };
  }
}

// ── Eliminar categoría ───────────────────────────────────────
export async function deleteCategory(id: string) {
  try {
    const supabase = await getAuthorizedClient() as unknown as CategoriesTableClient;

    // Verificar que no tenga cursos asignados
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (courses && courses.length > 0)
      return { error: 'No se puede eliminar una categoría que tiene cursos asignados.' };

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { error: 'Error al eliminar la categoría.' };
    revalidatePath('/courses');
    return { success: true };
  } catch (err) {
    const errorObj = err as { message?: string };
    return { error: errorObj.message || 'Error de autorización.' };
  }
}
