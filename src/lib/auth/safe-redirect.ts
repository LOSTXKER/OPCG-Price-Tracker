const INTERNAL_REDIRECT_BASE = "https://meecard.local";

/**
 * Keep post-auth navigation on Meecard. Besides blocking absolute URLs, the
 * URL origin check rejects protocol-relative and backslash-normalized paths
 * before they reach `router.push` or `NextResponse.redirect`.
 */
export function getSafeInternalRedirect(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value?.startsWith("/")) return fallback;

  try {
    const url = new URL(value, INTERNAL_REDIRECT_BASE);
    if (url.origin !== INTERNAL_REDIRECT_BASE) return fallback;
    const decodedPathname = decodeURIComponent(url.pathname);
    if (decodedPathname.startsWith("//") || decodedPathname.includes("\\")) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
