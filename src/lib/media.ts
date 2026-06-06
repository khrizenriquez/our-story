export function resolveMediaPath(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path) || path.startsWith('data:')) return path;
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\/+/, '')}`;
}

export function isImageMedia(mediaType: string, mediaPath: string): boolean {
  const value = `${mediaType} ${mediaPath}`.toLowerCase();
  return value.includes('image') || value.includes('photo') || /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(mediaPath);
}

export function isVideoMedia(mediaType: string, mediaPath: string): boolean {
  const value = `${mediaType} ${mediaPath}`.toLowerCase();
  return value.includes('video') || value.includes('gif') || /\.(mp4|mov|webm)$/i.test(mediaPath);
}

export function isAudioMedia(mediaType: string, mediaPath: string): boolean {
  const value = `${mediaType} ${mediaPath}`.toLowerCase();
  return value.includes('audio') || /\.(opus|mp3|m4a|wav)$/i.test(mediaPath);
}
