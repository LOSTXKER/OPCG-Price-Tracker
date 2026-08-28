"use client"

import { useEffect } from "react"

import { useUIStore } from "@/stores/ui-store"

/**
 * Tells the header which set this card belongs to.
 *
 * The header's set control normally reads the code out of the URL, but a card
 * page's URL carries only the card — and the set cannot be derived from the
 * card code: reprints and promos keep their original code while living in a
 * different set (measured on real data: 16 of 100 cards, e.g. `OP09-006_r1`
 * is in ST23, `P-029_r1` is in ST16). The server already resolved the true set
 * for this page, so publish it and let the header read it.
 *
 * Clears on unmount so the control goes back to "choose a set" the moment you
 * leave — a stale set name would claim you are browsing somewhere you aren't.
 */
export function ActiveSetPublisher({ setCode }: { setCode: string }) {
  const setActiveSetCode = useUIStore((s) => s.setActiveSetCode)

  useEffect(() => {
    setActiveSetCode(setCode)
    return () => setActiveSetCode(null)
  }, [setCode, setActiveSetCode])

  return null
}
