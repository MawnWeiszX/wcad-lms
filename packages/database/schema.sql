-- ============================================
-- WCAD LMS — Esquema de Base de Datos
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enums ──────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE enrollment_status AS ENUM ('active', 'refunded', 'expired');
CREATE TYPE transaction_status AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'chargeback');
CREATE TYPE payment_method AS ENUM ('card', 'bank_transfer', 'cash', 'wallet');

-- ── Profiles ───────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'student',
  country_code CHAR(2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Categories ─────────────────────────────
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Courses ────────────────────────────────
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT,
  description TEXT,
  thumbnail_url TEXT,
  trailer_video_id TEXT, -- GUID de Bunny.net (acceso público)
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_free BOOLEAN NOT NULL DEFAULT false,
  level course_level NOT NULL DEFAULT 'beginner',
  total_duration_seconds INT NOT NULL DEFAULT 0,
  students_count INT NOT NULL DEFAULT 0,
  what_you_learn TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Modules ────────────────────────────────
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Lessons ────────────────────────────────
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  bunny_video_id TEXT, -- GUID del video en Bunny
  duration_seconds INT NOT NULL DEFAULT 0,
  position SMALLINT NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Enrollments ────────────────────────────
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status enrollment_status NOT NULL DEFAULT 'active',
  transaction_id UUID,
  UNIQUE(student_id, course_id)
);

-- ── Lesson Progress ────────────────────────
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  watch_seconds INT NOT NULL DEFAULT 0,
  UNIQUE(student_id, lesson_id)
);

-- ── Transactions ───────────────────────────
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status transaction_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  gateway_reference TEXT,
  gateway_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Transaction Courses (Tabla Puente) ──────
CREATE TABLE transaction_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(transaction_id, course_id)
);

-- Añadir FK de enrollments a transactions después de crear transactions
ALTER TABLE enrollments 
  ADD CONSTRAINT enrollments_transaction_id_fkey 
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- ── Índices ────────────────────────────────
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_courses_title_trgm ON courses USING gin(title gin_trgm_ops);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_position ON modules(course_id, position);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lessons_position ON lessons(module_id, position);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_lesson_progress_student_id ON lesson_progress(student_id);
CREATE INDEX idx_transactions_student_id ON transactions(student_id);
CREATE INDEX idx_transactions_course_id ON transactions(course_id);
CREATE INDEX idx_transaction_courses_transaction_id ON transaction_courses(transaction_id);
CREATE INDEX idx_transaction_courses_course_id ON transaction_courses(course_id);

-- ── Trigger: handle_new_user ───────────────
-- Crea automáticamente un perfil cuando un usuario se registra via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Trigger: sincronizar rol al JWT (app_metadata) ──────────
-- Escribe el campo `role` del perfil en auth.users.raw_app_meta_data
-- para que el middleware del portal pueda leerlo desde el token JWT
-- sin necesidad de realizar una consulta a la base de datos.
CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Omitir si el rol no cambió (evita updates innecesarios en auth.users)
  IF (TG_OP = 'UPDATE' AND OLD.role IS NOT DISTINCT FROM NEW.role) THEN
    RETURN NEW;
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_role_change
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_to_jwt();

-- ── Trigger: update_updated_at ─────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_courses
  BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Trigger: recalcular duración total del curso ──
CREATE OR REPLACE FUNCTION recalculate_course_duration()
RETURNS TRIGGER AS $$
DECLARE
  v_old_course_id UUID;
  v_new_course_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT course_id INTO v_old_course_id FROM modules WHERE id = OLD.module_id;
    v_new_course_id := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old_course_id := NULL;
    SELECT course_id INTO v_new_course_id FROM modules WHERE id = NEW.module_id;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT course_id INTO v_old_course_id FROM modules WHERE id = OLD.module_id;
    SELECT course_id INTO v_new_course_id FROM modules WHERE id = NEW.module_id;
  END IF;
  
  -- Recalcular para el curso antiguo
  IF v_old_course_id IS NOT NULL THEN
    UPDATE courses SET total_duration_seconds = (
      SELECT COALESCE(SUM(l.duration_seconds), 0)
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = v_old_course_id
    )
    WHERE id = v_old_course_id;
  END IF;

  -- Recalcular para el nuevo curso (si cambió de módulo/curso)
  IF v_new_course_id IS NOT NULL AND (v_old_course_id IS NULL OR v_new_course_id != v_old_course_id) THEN
    UPDATE courses SET total_duration_seconds = (
      SELECT COALESCE(SUM(l.duration_seconds), 0)
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE m.course_id = v_new_course_id
    )
    WHERE id = v_new_course_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER recalc_duration_on_lesson_change
  AFTER INSERT OR UPDATE OR DELETE ON lessons
  FOR EACH ROW EXECUTE FUNCTION recalculate_course_duration();

-- ── Trigger: actualizar students_count ─────
CREATE OR REPLACE FUNCTION update_students_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      UPDATE courses SET students_count = students_count + 1 WHERE id = NEW.course_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si cambia a activo, sumar
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE courses SET students_count = students_count + 1 WHERE id = NEW.course_id;
    -- Si deja de estar activo, restar
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE courses SET students_count = students_count - 1 WHERE id = NEW.course_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'active' THEN
      UPDATE courses SET students_count = students_count - 1 WHERE id = OLD.course_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_course_students_count
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_students_count();

-- ══════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════

-- Habilitar RLS en TODAS las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_courses ENABLE ROW LEVEL SECURITY;

-- ── Policies: profiles ─────────────────────
-- Estudiantes ven solo su propio perfil
CREATE POLICY "Estudiantes ven su propio perfil" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Profesores y admins son públicos para todos
CREATE POLICY "Profesores y admins son públicos" ON profiles
  FOR SELECT TO authenticated USING (role IN ('teacher', 'admin'));

-- Admins y profesores ven todos los perfiles
CREATE POLICY "Admins y profesores ven todos los perfiles" ON profiles
  FOR SELECT TO authenticated USING (
    (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) IN ('admin', 'teacher', 'profesor'))
  );

-- Un usuario solo puede actualizar su propio perfil
CREATE POLICY "Usuarios actualizan su propio perfil" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Policies: categories ───────────────────
-- Lectura pública de categorías
CREATE POLICY "Categorías visibles para todos" ON categories
  FOR SELECT USING (true);

-- Solo admins pueden gestionar categorías
CREATE POLICY "Solo admins gestionan categorías" ON categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Policies: courses ──────────────────────
-- Cursos publicados visibles para todos
CREATE POLICY "Cursos publicados visibles para todos" ON courses
  FOR SELECT USING (is_published = true);

-- Teachers ven todos sus cursos (publicados o no)
CREATE POLICY "Teachers ven sus propios cursos" ON courses
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

-- Teachers solo modifican sus propios cursos
CREATE POLICY "Teachers modifican sus cursos" ON courses
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers crean cursos" ON courses
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers eliminan sus cursos" ON courses
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- ── Policies: modules ──────────────────────
-- Módulos de cursos publicados visibles para todos
CREATE POLICY "Módulos visibles de cursos publicados" ON modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = modules.course_id AND is_published = true)
  );

-- Teachers ven módulos de sus cursos
CREATE POLICY "Teachers ven módulos de sus cursos" ON modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM courses WHERE id = modules.course_id AND teacher_id = auth.uid())
  );

-- Teachers gestionan módulos de sus cursos
CREATE POLICY "Teachers gestionan módulos" ON modules
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM courses WHERE id = modules.course_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM courses WHERE id = modules.course_id AND teacher_id = auth.uid())
  );

-- ── Policies: lessons ──────────────────────
-- Lecciones de cursos publicados (metadata visible, video protegido por app)
CREATE POLICY "Lecciones visibles de cursos publicados" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id AND c.is_published = true
    )
  );

-- Teachers ven lecciones de sus cursos
CREATE POLICY "Teachers ven lecciones de sus cursos" ON lessons
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id AND c.teacher_id = auth.uid()
    )
  );

-- Teachers gestionan lecciones de sus cursos
CREATE POLICY "Teachers gestionan lecciones" ON lessons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id AND c.teacher_id = auth.uid()
    )
  );

-- ── Policies: enrollments ──────────────────
-- Estudiantes ven solo sus propias inscripciones
CREATE POLICY "Estudiantes ven sus inscripciones" ON enrollments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Teachers ven inscripciones de sus cursos
CREATE POLICY "Teachers ven inscripciones de sus cursos" ON enrollments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM courses WHERE id = enrollments.course_id AND teacher_id = auth.uid())
  );

-- Solo el servidor (service_role) puede crear inscripciones
CREATE POLICY "Solo server crea inscripciones" ON enrollments
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ── Policies: lesson_progress ──────────────
-- Estudiantes ven y gestionan su propio progreso
CREATE POLICY "Estudiantes gestionan su progreso" ON lesson_progress
  FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers ven progreso de alumnos en sus cursos
CREATE POLICY "Teachers ven progreso en sus cursos" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN courses c ON c.id = m.course_id
      WHERE l.id = lesson_progress.lesson_id AND c.teacher_id = auth.uid()
    )
  );

-- ── Policies: transactions ─────────────────
-- Estudiantes ven sus propias transacciones
CREATE POLICY "Estudiantes ven sus transacciones" ON transactions
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Teachers ven transacciones de sus cursos
CREATE POLICY "Teachers ven transacciones de sus cursos" ON transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM courses WHERE id = transactions.course_id AND teacher_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM transaction_courses tc
      JOIN courses c ON c.id = tc.course_id
      WHERE tc.transaction_id = transactions.id AND c.teacher_id = auth.uid()
    )
  );

-- Solo el servidor (service_role) puede crear/modificar transacciones
CREATE POLICY "Solo server gestiona transacciones" ON transactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Policies: transaction_courses ──────────
-- Estudiantes ven relacion de cursos de sus transacciones
CREATE POLICY "Estudiantes ven relacion de cursos de sus transacciones" ON transaction_courses
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM transactions WHERE id = transaction_courses.transaction_id AND student_id = auth.uid())
  );

-- Teachers ven relacion de cursos de sus transacciones
CREATE POLICY "Teachers ven relacion de cursos de sus transacciones" ON transaction_courses
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM courses WHERE id = transaction_courses.course_id AND teacher_id = auth.uid())
  );

-- Solo el servidor (service_role) gestiona relacion de cursos de transacciones
CREATE POLICY "Solo server gestiona relacion de cursos de transacciones" ON transaction_courses
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ══════════════════════════════════════════════
-- STORAGE BUCKETS & POLICIES (DOCUMENTACIÓN)
-- ══════════════════════════════════════════════
-- Supabase Storage buckets y objetos se administran en el esquema 'storage'.
--
-- 1. Crear el bucket público 'vouchers':
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('vouchers', 'vouchers', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- 2. Políticas RLS para storage.objects del bucket 'vouchers':
--
-- A. Permitir lectura pública de vouchers (para admins/profesores):
-- CREATE POLICY "Lectura pública de vouchers" ON storage.objects
--   FOR SELECT USING (bucket_id = 'vouchers');
--
-- B. Permitir a los estudiantes autenticados subir sus vouchers:
-- CREATE POLICY "Alumnos autenticados suben vouchers" ON storage.objects
--   FOR INSERT TO authenticated 
--   WITH CHECK (bucket_id = 'vouchers' AND auth.uid() = owner);
