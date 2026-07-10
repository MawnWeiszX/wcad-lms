// ── Tipos ───────────────────────────────────────────────────
export interface Lesson {
  id: string; title: string; duration_seconds: number;
  position: number; is_free: boolean; bunny_video_id: string | null;
}
export interface Module { id: string; title: string; position: number; lessons: Lesson[]; }
export interface Course {
  id: string; title: string; slug: string;
  short_description: string | null; description: string | null;
  price: number; currency: string; level: string;
  category_id: string | null; is_published: boolean; is_free: boolean;
  thumbnail_url: string | null; trailer_video_id: string | null;
  what_you_learn: string[]; requirements: string[];
  total_duration_seconds: number; students_count: number;
}
export interface Category { id: string; name: string; }
export interface Teacher { full_name: string | null; avatar_url: string | null; bio: string | null; }
export interface Props {
  course: Course; modules: Module[]; teacher: Teacher | null;
  category: { name: string } | null; categories: Category[];
  bunnyConfigured: boolean; bunnyLibraryId: string;
}

// ── Helpers ─────────────────────────────────────────────────
export function fmtDuration(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m > 0 ? `${m}m` : '< 1m'}`;
}
export function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

// ── Form state type ─────────────────────────────────────────
export interface CourseForm {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  price: string;
  currency: string;
  level: string;
  category_id: string;
  is_free: boolean;
  is_published: boolean;
  what_you_learn: string[];
  requirements: string[];
}
