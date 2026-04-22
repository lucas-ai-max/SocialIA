export function normalizeStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("/storage/v1/object/public/")) return url;
  if (url.includes("/storage/v1/object/sign/")) return url;
  return url.replace("/storage/v1/object/", "/storage/v1/object/public/");
}
