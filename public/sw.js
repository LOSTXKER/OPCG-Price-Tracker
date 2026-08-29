/**
 * Meecard service worker — deliberately almost empty.
 *
 * Its ONLY jobs are (1) to make the site installable on Android Chrome, which
 * still wants a registered worker with a real fetch handler before it offers
 * "Add to Home screen", and (2) to show a readable page instead of the browser's
 * dinosaur when a phone loses signal mid-navigation.
 *
 * What it deliberately does NOT do: cache HTML, JS, CSS or API responses. This
 * site ships prices; a stale-serving worker would show yesterday's number with
 * no way for a visitor to tell, and a bad cache entry can pin a phone to a
 * broken build until someone clears site data by hand. Everything except a
 * failed navigation is passed straight to the network untouched.
 */

const CACHE = "meecard-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      // A failed precache must not block activation — the worker is still
      // useful (and installability still holds) without the offline page.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only page loads are handled. Assets, API calls and anything cross-origin
  // fall through to the network exactly as if no worker existed.
  if (request.mode !== "navigate" || request.method !== "GET") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      return (
        cached ??
        new Response("ออฟไลน์อยู่ — ลองใหม่เมื่อมีเน็ต", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }),
  );
});
