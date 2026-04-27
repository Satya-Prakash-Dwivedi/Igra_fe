/**
 * Resolves a potentially relative URL from the backend into a full URL.
 * Handles both S3 URLs (starting with http) and local proxy paths (starting with /api/v1).
 */
export function resolveApiUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}
