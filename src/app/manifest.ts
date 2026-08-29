import type { MetadataRoute } from "next";

/**
 * The install card a phone shows when someone adds Meecard to their home
 * screen — and what the app looks like once it is there.
 *
 * `display: "standalone"` is the point of the exercise: launched from the home
 * screen the site opens without the browser's URL bar, so the fixed bottom nav
 * sits where a native tab bar would. `id` is pinned so a later change to
 * `start_url` doesn't make the phone treat this as a *different* app and leave
 * the old icon stranded on the home screen.
 *
 * The bear — not the "M" glyph — is the icon, because that is the mark someone
 * already recognises in the header. Two purposes ship on purpose: `maskable`
 * (Android crops it to the launcher's shape, so the bear sits inside the 62%
 * safe circle) and `any` (everywhere else, where the bear can breathe wider).
 * Both are flattened onto the espresso brand colour — a transparent icon turns
 * into a floating smudge on a light launcher wallpaper.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Meecard — เช็คราคาการ์ดวันพีช",
    short_name: "Meecard",
    description:
      "เช็คราคาการ์ดวันพีชทุกใบ ทุกเกรด — ราคากลางอ้างอิงตลาดญี่ปุ่น พร้อมกราฟราคาย้อนหลัง พอร์ตสะสม และรายการโปรด",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "th",
    dir: "ltr",
    categories: ["shopping", "finance", "entertainment"],
    // Matches `--background` in globals.css: the splash the phone paints before
    // React boots. Dark is the site's default theme, so the launch flash is
    // dark rather than a white slab that then turns brown.
    background_color: "#100C09",
    theme_color: "#100C09",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "รายการโปรด",
        short_name: "รายการโปรด",
        url: "/watchlist",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "พอร์ตสะสม",
        short_name: "พอร์ต",
        url: "/portfolio",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "ค้นหาการ์ด",
        short_name: "ค้นหา",
        url: "/search",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
