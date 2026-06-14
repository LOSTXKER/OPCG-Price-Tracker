"use client"

import { useSyncExternalStore } from "react"

/**
 * Dev-phase toggle for the V2 warm-premium theme. Flips the WHOLE app between
 * v1 (default) and v2 by setting the `mc_v2` cookie + reloading. An inline
 * script in the root <head> adds the `.v2` class to <html> before paint (no
 * FOUC, no forced-dynamic → pages stay static / SEO-safe), and .v2 re-skins
 * every page at once since all components use the design tokens it overrides.
 * Remove / gate before production (or set .v2 unconditionally to ship v2).
 */
const noop = () => () => {}
const readCookie = () => document.cookie.split("; ").includes("mc_v2=1")

export function V2ThemeToggle() {
  // SSR-safe external read (server → off, client → actual cookie). No effect.
  const on = useSyncExternalStore(noop, readCookie, () => false)

  function toggle() {
    const next = !on
    document.cookie = `mc_v2=${next ? "1" : "0"}; path=/; max-age=${next ? 31536000 : 0}`
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="สลับธีม V2 (warm-premium) ทั้งแอป"
      className="fixed bottom-4 right-4 z-[100] flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold shadow-lg backdrop-blur"
      style={{
        background: on ? "#e9b970" : "rgba(20,16,12,0.85)",
        color: on ? "#1a1207" : "#f6efe6",
        borderColor: "rgba(233,185,112,0.4)",
      }}
    >
      🔮 V2 {on ? "ON" : "OFF"}
    </button>
  )
}
