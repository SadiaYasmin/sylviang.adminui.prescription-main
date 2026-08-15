import { BASE_URL_Host } from '@env/environment';

/**
 * US-083: resolves a stored image field (a relative "/uploads/..." URL from the backend)
 * into an absolute URL for an <img> src. Passes a data: URI or already-absolute URL
 * through unchanged — form components bind the same field to either a persisted URL or a
 * freshly-picked file's data URI before it's uploaded, so both must work here.
 */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('/') ? `${BASE_URL_Host}${url}` : url;
}
