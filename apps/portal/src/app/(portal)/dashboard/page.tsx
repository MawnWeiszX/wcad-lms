import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  Eye,
  ChevronRight,
  Clock,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Panel' };
export const dynamic = 'force-dynamic';

function formatCurrency(amount: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="animate-fade-in-up rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
          <p className="mt-2 text-3xl font-bold text-[var(--color-text)]">{value}</p>
          {sub && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{sub}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default async function PortalDashboard() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`${process.env.NEXT_PUBLIC_CLASS_URL ?? 'http://localhost:3000'}/`);

  // Cursos del profesor
  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, title, slug, students_count, is_published, price, currency, total_duration_seconds, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  interface DashboardCourse {
    id: string;
    title: string;
    slug: string;
    students_count: number;
    is_published: boolean;
    price: number;
    currency: string;
    total_duration_seconds: number;
    created_at: string;
  }

  const courses = coursesData as unknown as DashboardCourse[] | null;
  const totalCourses = courses?.length ?? 0;
  const publishedCourses = courses?.filter((c) => c.is_published).length ?? 0;

  // Ingresos aprobados (sumando los precios de los cursos del profesor en transacciones aprobadas)
  const courseIds = courses?.map((c) => c.id) ?? [];
  let totalRevenue = 0;
  if (courseIds.length > 0) {
    const { data: txCoursesData } = await supabase
      .from('transaction_courses')
      .select(`
        course_id,
        courses!inner(price, teacher_id),
        transactions!inner(status)
      `)
      .in('course_id', courseIds)
      .eq('transactions.status', 'approved');

    if (txCoursesData) {
      interface TxCourseData {
        course_id: string;
        courses: { price: number | string | null } | null;
        transactions: { status: string } | null;
      }
      totalRevenue = (txCoursesData as unknown as TxCourseData[]).reduce((acc, tc) => {
        const price = tc.courses?.price ? Number(tc.courses.price) : 0;
        return acc + price;
      }, 0);
    }
  }

  // Últimas inscripciones
  const { data: recentEnrollmentsData } = await supabase
    .from('enrollments')
    .select(`
      id, enrolled_at,
      student:profiles!enrollments_student_id_fkey(full_name, avatar_url),
      course:courses!enrollments_course_id_fkey(title, slug)
    `)
    .in('course_id', courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])
    .order('enrolled_at', { ascending: false })
    .limit(8);

  interface DashboardEnrollment {
    id: string;
    enrolled_at: string;
    student: { full_name: string | null; avatar_url: string | null } | { full_name: string | null; avatar_url: string | null }[] | null;
    course: { title: string; slug: string } | { title: string; slug: string }[] | null;
  }

  const recentEnrollments = recentEnrollmentsData as unknown as DashboardEnrollment[] | null;

  // Cantidad de estudiantes únicos
  let uniqueStudentsCount = 0;
  if (courseIds.length > 0) {
    const { data: enrollmentsForCount } = await supabase
      .from('enrollments')
      .select('student_id')
      .in('course_id', courseIds)
      .eq('status', 'active');
    if (enrollmentsForCount) {
      uniqueStudentsCount = new Set((enrollmentsForCount as unknown as { student_id: string }[]).map(e => e.student_id)).size;
    }
  }

  const now = new Date();
  const firstName = user.email?.split('@')[0] ?? 'Profesor';

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
          Buen día, {firstName} 👋
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Aquí está el resumen de tu actividad.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Cursos publicados"
          value={String(publishedCourses)}
          sub={`${totalCourses} en total`}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Users}
          label="Estudiantes totales"
          value={String(uniqueStudentsCount)}
          sub="estudiantes únicos"
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={DollarSign}
          label="Ingresos totales"
          value={formatCurrency(totalRevenue)}
          sub="transacciones aprobadas"
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Tasa de publicación"
          value={totalCourses > 0 ? `${Math.round((publishedCourses / totalCourses) * 100)}%` : '0%'}
          sub={`${publishedCourses} de ${totalCourses} cursos`}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mis cursos recientes */}
        <div className="animate-fade-in-up animation-delay-100 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-semibold text-[var(--color-text)]">Mis cursos</h2>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              Ver todos
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!courses || courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-[var(--color-text-muted)]" />
              <p className="text-sm font-medium text-[var(--color-text)]">Sin cursos aún</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Crea tu primer curso para comenzar.</p>
              <Link
                href="/courses/new"
                className="mt-4 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)]"
              >
                Crear curso
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Ícono */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-alt)]">
                    <BookOpen className="h-5 w-5 text-[var(--color-text-muted)]" />
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">{course.title}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.students_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor((course.total_duration_seconds ?? 0) / 3600)}h
                      </span>
                    </div>
                  </div>
                  {/* Estado */}
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.is_published
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {course.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas inscripciones */}
        <div className="animate-fade-in-up animation-delay-200 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-semibold text-[var(--color-text)]">Últimas inscripciones</h2>
            <Link
              href="/students"
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
            >
              Ver todas
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!recentEnrollments || recentEnrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="mb-3 h-10 w-10 text-[var(--color-text-muted)]" />
              <p className="text-sm font-medium text-[var(--color-text)]">Sin inscripciones aún</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Aparecerán cuando alguien compre tus cursos.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {recentEnrollments.map((enrollment) => {
                const student = Array.isArray(enrollment.student) ? enrollment.student[0] : enrollment.student;
                const course = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
                const enrolledAt = new Date(enrollment.enrolled_at);
                const diffDays = Math.floor((now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24));
                const timeAgo = diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`;

                return (
                  <div key={enrollment.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-xs font-bold text-[var(--color-primary)]">
                      {(student?.full_name ?? 'E').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {student?.full_name ?? 'Estudiante'}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-muted)]">
                        {course?.title ?? 'Curso'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--color-text-muted)]">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
