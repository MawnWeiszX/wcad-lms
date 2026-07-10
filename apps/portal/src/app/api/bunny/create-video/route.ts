import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@wcad/utils/supabase/server';
import crypto from 'crypto';

/**
 * POST /api/bunny/create-video
 *
 * Crea un video en Bunny.net Stream y devuelve el videoId y la URL
 * de subida directa (TUS). El API key NUNCA sale al cliente.
 *
 * Body: { title: string, lessonId: string }
 * Returns: { videoId: string, uploadUrl: string }
 */
export async function POST(request: Request) {
  // 1. Verificar autenticación
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Verificar que Bunny está configurado
  const apiKey = process.env.BUNNY_API_KEY;
  const libraryId = process.env.BUNNY_LIBRARY_ID;

  if (!apiKey || !libraryId) {
    return NextResponse.json(
      {
        error: 'Bunny.net no configurado',
        hint: 'Agrega BUNNY_API_KEY y BUNNY_LIBRARY_ID en .env.local',
      },
      { status: 503 }
    );
  }

  // 3. Parsear body
  const { title, lessonId } = await request.json() as { title: string; lessonId: string };
  if (!title || !lessonId) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // 4. Verificar que la lección pertenece a un curso del usuario
  const { data: lesson } = await supabase
    .from('lessons')
    .select(`
      id,
      module:modules!lessons_module_id_fkey(
        course:courses!modules_course_id_fkey(teacher_id)
      )
    `)
    .eq('id', lessonId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lessonData = lesson as any;
  const lessonModule = lessonData ? (Array.isArray(lessonData.module) ? lessonData.module[0] : lessonData.module) : null;
  const course = lessonModule ? (Array.isArray(lessonModule.course) ? lessonModule.course[0] : lessonModule.course) : null;

  if (course?.teacher_id !== user.id) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  // 5. Crear video en Bunny.net
  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!createRes.ok) {
    const errorText = await createRes.text();
    return NextResponse.json(
      { error: `Error de Bunny.net: ${errorText}` },
      { status: createRes.status }
    );
  }

  const { guid: videoId } = await createRes.json() as { guid: string };

  // 6. Generar firma TUS y expiración (2 horas)
  const expirationTime = Math.floor(Date.now() / 1000) + 7200;
  const signatureInput = libraryId + apiKey + String(expirationTime) + videoId;
  const signature = crypto
    .createHash('sha256')
    .update(signatureInput)
    .digest('hex');

  // 7. URL de subida directa (TUS)
  const uploadUrl = `https://video.bunnycdn.com/tusupload/${videoId}`;

  return NextResponse.json({
    videoId,
    uploadUrl,
    signature,
    expirationTime,
  });
}
