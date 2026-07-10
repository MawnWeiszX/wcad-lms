import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Users, Search, BookOpen, Calendar } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Estudiantes' };
export const dynamic = 'force-dynamic';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/`);

  // Obtener IDs de cursos del profesor
  const { data: coursesRaw } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', user.id);

  const courses = coursesRaw as unknown as { id: string; title: string }[] | null;

  const courseIds = courses?.map((c) => c.id) ?? [];

  // Obtener inscripciones con datos del estudiante y curso
  interface StudentProfile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    country_code: string | null;
  }
  interface CourseMin {
    id: string;
    title: string;
  }
  interface EnrollmentData {
    id: string;
    enrolled_at: string;
    status: string;
    student: StudentProfile | StudentProfile[] | null;
    course: CourseMin | CourseMin[] | null;
  }

  const studentRelation = q
    ? 'student:profiles!enrollments_student_id_fkey!inner(id, full_name, avatar_url, email, country_code)'
    : 'student:profiles!enrollments_student_id_fkey(id, full_name, avatar_url, email, country_code)';

  let enrollmentsQuery = supabase
    .from('enrollments')
    .select(`
      id, enrolled_at, status,
      ${studentRelation},
      course:courses!enrollments_course_id_fkey(id, title)
    `)
    .in('course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  if (q) {
    interface QueryBuilderLoose {
      ilike(col: string, pattern: string): QueryBuilderLoose;
    }
    enrollmentsQuery = (enrollmentsQuery as unknown as QueryBuilderLoose).ilike('student.full_name', `%${q}%`) as typeof enrollmentsQuery;
  }

  const { data: enrollmentsRaw } = await enrollmentsQuery;

  const enrollments = enrollmentsRaw as unknown as EnrollmentData[] | null;

  const totalStudents = new Set(
    enrollments?.map((e) => {
      const s = Array.isArray(e.student) ? e.student[0] : e.student;
      return s?.id;
    }).filter(Boolean)
  ).size;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Estudiantes</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {totalStudents} estudiantes únicos · {enrollments?.length ?? 0} inscripciones totales
          </p>
        </div>
        {/* Buscador funcional via searchParams */}
        <form method="GET" className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar estudiante..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </form>
      </div>

      {/* Tabla */}
      {!enrollments || enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-24 text-center">
          <Users className="mb-3 h-12 w-12 text-[var(--color-text-muted)]" />
          <p className="text-base font-semibold text-[var(--color-text)]">Sin estudiantes aún</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Aparecerán aquí cuando alguien se inscriba en tus cursos.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            <div className="col-span-4">Estudiante</div>
            <div className="col-span-4">Curso</div>
            <div className="col-span-2 text-center">País</div>
            <div className="col-span-2 text-center">Inscrito</div>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {enrollments.map((enrollment) => {
              const student = Array.isArray(enrollment.student) ? enrollment.student[0] : enrollment.student;
              const course = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
              const enrolledAt = new Date(enrollment.enrolled_at);
              const formatted = enrolledAt.toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric',
              });

              return (
                <div key={enrollment.id} className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-[var(--color-surface-alt)]">
                  {/* Estudiante */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]">
                      {student?.avatar_url ? (
                        <Image src={student.avatar_url} alt="" fill className="object-cover" />
                      ) : (
                        (student?.full_name ?? 'E').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-text)]">
                        {student?.full_name ?? 'Estudiante'}
                      </p>
                      {student?.email && (
                        <p className="truncate text-xs text-[var(--color-text-muted)]">{student.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Curso */}
                  <div className="col-span-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <BookOpen className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    <span className="truncate">{course?.title ?? '—'}</span>
                  </div>

                  {/* País */}
                  <div className="col-span-2 text-center text-sm text-[var(--color-text-muted)]">
                    {student?.country_code ?? '—'}
                  </div>

                  {/* Fecha */}
                  <div className="col-span-2 flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatted}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
