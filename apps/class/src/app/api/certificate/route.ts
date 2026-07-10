import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/** Escapa caracteres especiales de HTML para prevenir XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseSlug = searchParams.get('course');

  if (!courseSlug) {
    return new NextResponse('Falta el slug del curso', { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  // 1. Obtener perfil
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const profile = profileData as { full_name: string | null } | null;

  // 2. Obtener curso
  const { data: courseData } = await supabase
    .from('courses')
    .select('id, title')
    .eq('slug', courseSlug)
    .single();

  if (!courseData) {
    return new NextResponse('Curso no encontrado', { status: 404 });
  }

  const course = courseData as { id: string; title: string };

  // 3. Validar inscripción
  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('enrolled_at')
    .eq('student_id', user.id)
    .eq('course_id', course.id)
    .single();

  if (!enrollmentData) {
    return new NextResponse('No estás inscrito en este curso', { status: 403 });
  }

  const enrollment = enrollmentData as { enrolled_at: string };

  // 4. Verificar que el estudiante completó TODAS las lecciones del curso
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modulesData, error: modulesError } = await (supabase as any)
    .from('modules')
    .select('id, lessons(id)')
    .eq('course_id', course.id);

  if (modulesError || !modulesData) {
    return new NextResponse('Error al cargar las lecciones del curso', { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules = (modulesData as any[]) ?? [];
  const lessonIds = modules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .flatMap((m) => m.lessons?.map((l: any) => l.id) ?? [])
    .filter(Boolean);
  const totalLessons = lessonIds.length;

  if (totalLessons === 0) {
    return new NextResponse('Este curso aún no tiene lecciones', { status: 400 });
  }

  const { count: completedCount } = await supabase
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .in('lesson_id', lessonIds)
    .not('completed_at', 'is', null);

  if ((completedCount ?? 0) < totalLessons) {
    return new NextResponse(
      `Debes completar todas las lecciones para obtener tu certificado (${completedCount ?? 0}/${totalLessons} completadas)`,
      { status: 403 }
    );
  }

  const studentName = escapeHtml(profile?.full_name ?? user.email ?? 'Estudiante');
  const courseTitle = escapeHtml(course.title);
  // Usar fecha de la última lección completada como fecha del certificado
  const { data: lastProgress } = await supabase
    .from('lesson_progress')
    .select('completed_at')
    .eq('student_id', user.id)
    .in('lesson_id', lessonIds)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single() as { data: { completed_at: string } | null };

  const completionDate = lastProgress?.completed_at ?? enrollment.enrolled_at;
  const issueDate = escapeHtml(new Date(completionDate as string).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));

  // Generar HTML del certificado imprimible
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Certificado — ${courseTitle}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          background-color: #f3f4f6;
          font-family: 'Plus Jakarta Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }

        .certificate-container {
          width: 297mm;
          height: 210mm;
          padding: 20mm;
          box-sizing: border-box;
          background-color: #ffffff;
          border: 15px solid #1e1b4b;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }

        .border-inner {
          position: absolute;
          top: 10px;
          bottom: 10px;
          left: 10px;
          right: 10px;
          border: 2px solid #818cf8;
          pointer-events: none;
        }

        .header {
          margin-top: 10mm;
        }

        .logo {
          font-size: 28px;
          font-weight: 800;
          color: #1e1b4b;
          letter-spacing: -0.5px;
          margin-bottom: 5px;
        }

        .logo span {
          color: #6366f1;
        }

        .cert-title {
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          color: #6366f1;
          letter-spacing: 4px;
        }

        .content {
          margin: 15mm 0;
        }

        .presents {
          font-size: 18px;
          color: #4b5563;
          font-style: italic;
        }

        .student-name {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          font-weight: 700;
          color: #1e1b4b;
          margin: 10px 0;
          border-bottom: 2px solid #e5e7eb;
          display: inline-block;
          padding-bottom: 5px;
          min-width: 50%;
        }

        .accomplished {
          font-size: 16px;
          color: #4b5563;
          max-width: 600px;
          margin: 15px auto;
          line-height: 1.6;
        }

        .course-title {
          font-weight: 700;
          color: #1e1b4b;
          font-size: 22px;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 0 15mm;
          margin-bottom: 10mm;
        }

        .signature-block {
          width: 50mm;
          text-align: center;
        }

        .signature-line {
          border-top: 1px solid #9ca3af;
          margin-top: 15px;
          padding-top: 5px;
          font-size: 12px;
          color: #4b5563;
          font-weight: 600;
        }

        .seal {
          width: 35mm;
          height: 35mm;
          border: 4px double #818cf8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 1px;
          transform: rotate(-10deg);
        }

        /* Ocultar botones de impresión al imprimir */
        @media print {
          body {
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .certificate-container {
            box-shadow: none;
            border: 15px solid #1e1b4b !important;
            width: 100vw;
            height: 100vh;
            page-break-after: avoid;
            page-break-before: avoid;
          }
          .no-print {
            display: none;
          }
        }

        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #6366f1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
          transition: all 0.2s;
          z-index: 999;
        }

        .print-btn:hover {
          background-color: #4f46e5;
          transform: translateY(-1px);
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
      
      <div class="certificate-container">
        <div class="border-inner"></div>
        
        <div class="header">
          <div class="logo">WCAD<span>Service</span></div>
          <div class="cert-title">Certificado de Finalización</div>
        </div>

        <div class="content">
          <div class="presents">Por cuanto se certifica que</div>
          <div class="student-name">${studentName}</div>
          <div class="accomplished">
            ha completado y aprobado satisfactoriamente todos los requisitos académicos del curso de especialización:
            <br>
            <span class="course-title">${courseTitle}</span>
          </div>
        </div>

        <div class="footer">
          <div class="signature-block">
            <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-style: italic; color: #4b5563;">WCAD Administration</div>
            <div class="signature-line">Dirección Académica</div>
          </div>
          
          <div class="seal">
            WCAD<br>VERIFICADO
          </div>
          
          <div class="signature-block">
            <div style="font-size: 14px; color: #4b5563; margin-bottom: 5px;">${issueDate}</div>
            <div class="signature-line">Fecha de Emisión</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
