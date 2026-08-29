import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
// Baked at build time. `public/` is guaranteed to exist during the build but
// not inside a serverless function at request time, so this must not be
// deferred to runtime.
export const dynamic = "force-static";

/**
 * The icon iOS puts on the home screen when someone adds Meecard from Safari's
 * Share sheet — so it is the mark people actually tap, and it shows the bear
 * rather than an "M" glyph nobody associates with the site.
 *
 * The artwork is already composed on disk (bear centred on the espresso brand
 * colour, opaque, with room for iOS to bite its rounded corners out of), so
 * this route just hands the bytes over. No `next/og` pass: rendering a 567KB
 * PNG through satori only to re-emit a PNG is slower and, at that size, falls
 * over.
 */
export default async function AppleIcon() {
  const icon = await readFile(
    path.join(process.cwd(), "public", "icons", "apple-touch-icon.png"),
  );

  return new Response(new Uint8Array(icon), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
