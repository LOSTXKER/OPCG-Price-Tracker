"use client"

import { useCallback, useState, type KeyboardEvent } from "react"

/**
 * The ONE keyboard model for every search surface (home hero · Cmd-K palette ·
 * inline CardSearch). Each surface still builds its own flat item array and
 * decides what each index means inside `onSelect` (card vs set vs nav vs recent);
 * this hook owns only the shared mechanics: a single `activeIdx`, ↑/↓ clamping,
 * Enter (select active, else commit), and Escape. Replaces the byte-identical
 * onKeyDown each surface used to carry.
 *
 * `arrowUpFloor`: -1 lets ArrowUp deselect back to the input (palette + hero);
 * 0 keeps a row always highlighted once you enter the list (inline CardSearch).
 */
export function useSearchKeyboardNav({
  length,
  onSelect,
  onCommit,
  onEscape,
  arrowUpFloor = -1,
}: {
  /** Number of navigable items in the current flat list. */
  length: number
  /** Enter with a highlighted row → act on that index. */
  onSelect: (index: number) => void
  /** Enter with nothing highlighted → commit (e.g. full-text search). Optional. */
  onCommit?: () => void
  /** Escape pressed. */
  onEscape: () => void
  arrowUpFloor?: number
}) {
  const [activeIdx, setActiveIdx] = useState(-1)

  const resetActive = useCallback(() => setActiveIdx(-1), [])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, arrowUpFloor))
      } else if (e.key === "Enter") {
        if (activeIdx >= 0 && activeIdx < length) {
          e.preventDefault()
          onSelect(activeIdx)
        } else if (onCommit) {
          e.preventDefault()
          onCommit()
        }
      } else if (e.key === "Escape") {
        onEscape()
      }
    },
    [length, activeIdx, onSelect, onCommit, onEscape, arrowUpFloor],
  )

  return { activeIdx, setActiveIdx, onKeyDown, resetActive }
}
