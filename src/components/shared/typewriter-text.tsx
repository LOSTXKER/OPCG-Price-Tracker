"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Typewriter that cycles a list of words — types one out, holds, deletes, then
 * moves to the next, looping forever (Fastwork-style rotating headline).
 *
 * - Honors `prefers-reduced-motion`: renders a single static word, no caret blink.
 * - Decorative by design — the caller should wrap it in `aria-hidden` and provide
 *   an `sr-only` static heading so screen readers get stable text, not a stream
 *   of partial words.
 * - SSR-safe: first paint shows `words[0]` fully typed (matches the server), and
 *   the animation only begins after mount.
 */
export function TypewriterText({
  words,
  className,
  typeMs = 65,
  deleteMs = 30,
  holdMs = 1500,
}: {
  words: string[]
  className?: string
  typeMs?: number
  deleteMs?: number
  holdMs?: number
}) {
  // `null` until the animation produces its first frame — render then falls back
  // to the full first word, so the static / reduced-motion / SSR cases need no
  // synchronous setState inside the effect.
  const [typed, setTyped] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce || words.length <= 1) return

    let idx = 0
    let char = (words[0] ?? "").length
    let phase: "hold" | "delete" | "type" = "hold"
    let timer: ReturnType<typeof setTimeout>

    const step = () => {
      if (phase === "hold") {
        phase = "delete"
        timer = setTimeout(step, deleteMs)
        return
      }
      if (phase === "delete") {
        char -= 1
        setTyped(words[idx % words.length].slice(0, Math.max(0, char)))
        if (char <= 0) {
          idx += 1
          phase = "type"
          timer = setTimeout(step, typeMs * 2)
        } else {
          timer = setTimeout(step, deleteMs)
        }
        return
      }
      // type
      char += 1
      const word = words[idx % words.length]
      setTyped(word.slice(0, char))
      if (char >= word.length) {
        phase = "hold"
        timer = setTimeout(step, holdMs)
      } else {
        timer = setTimeout(step, typeMs)
      }
    }

    timer = setTimeout(step, holdMs)
    return () => clearTimeout(timer)
  }, [words, typeMs, deleteMs, holdMs])

  const text = typed ?? words[0] ?? ""

  return (
    <>
      <span className={cn("tw-text", className)}>{text}</span>
      <span aria-hidden className="tw-caret">|</span>
    </>
  )
}
