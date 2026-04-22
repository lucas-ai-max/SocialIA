/**
 * Normaliza URLs antigas do Supabase Storage que foram salvas sem o segmento
 * "/public/". O endpoint "/storage/v1/object/<bucket>/..." exige JWT; o
 * correto para uso em <img src> e fetch anonimo e "/storage/v1/object/public/<bucket>/...".
 */
export function normalizeStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("/storage/v1/object/public/")) return url;
  if (url.includes("/storage/v1/object/sign/")) return url;
  return url.replace("/storage/v1/object/", "/storage/v1/object/public/");
}
