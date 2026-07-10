import crypto from 'crypto';

/**
 * Genera una URL firmada para un video de Bunny.net Stream.
 * Usa HMAC-SHA256 con el BUNNY_TOKEN_KEY.
 *
 * @param videoId - GUID del video en Bunny.net
 * @param expirationHours - Horas de validez del token (default: 2)
 * @returns URL firmada del reproductor de video
 */
export function getSignedVideoUrl(
  videoId: string,
  expirationHours: number = 2
): string {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const tokenKey = process.env.BUNNY_TOKEN_KEY;

  if (!libraryId || !tokenKey) {
    throw new Error(
      'Variables de entorno BUNNY_LIBRARY_ID y BUNNY_TOKEN_KEY son requeridas'
    );
  }

  const expirationTime = Math.floor(Date.now() / 1000) + expirationHours * 3600;
  const baseUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

  // Generar token con HMAC-SHA256
  const hashableBase = tokenKey + videoId + String(expirationTime);
  const token = crypto
    .createHash('sha256')
    .update(hashableBase)
    .digest('hex');

  return `${baseUrl}?token=${token}&expires=${expirationTime}`;
}

/**
 * Genera la URL pública de un video trailer (sin protección de token).
 * Solo usar para trailers/previews públicos.
 */
export function getPublicVideoUrl(videoId: string): string {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!libraryId) {
    throw new Error('Variable de entorno BUNNY_LIBRARY_ID es requerida');
  }
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
}

/**
 * Genera la URL del thumbnail de un video en Bunny.net.
 */
export function getVideoThumbnailUrl(videoId: string): string {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  if (!libraryId) {
    throw new Error('Variable de entorno BUNNY_LIBRARY_ID es requerida');
  }
  return `https://vz-${libraryId}.b-cdn.net/${videoId}/thumbnail.jpg`;
}
