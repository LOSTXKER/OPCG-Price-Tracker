"use client";

import { useEffect } from "react";

/**
 * Registers `/sw.js` once the page is idle. Renders nothing.
 *
 * Registration is deferred past `load` on purpose: the worker exists to make
 * the site installable and to hold an offline page, neither of which is worth
 * competing with the first paint for.
 *
 * Localhost is skipped — a worker left registered on `localhost:3000` outlives
 * `npm run dev` and serves its cached offline page to every other local project
 * on that port. Production and preview deployments register normally.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // A failed registration costs nothing — the site works without it.
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
