"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker"

/**
 * Navigator-mode SetPicker for the home hero: picking a set LEAVES the page for
 * `/opcg/sets/{code}` instead of filtering anything in place (owner decision
 * 2026-08-26 — users browse by set first, so the hero's primary action is a
 * direct jump to a set's price wall). The market toolbar's SetPicker below
 * keeps its filter-in-place semantics; the two deliberately differ.
 *
 * The trigger leads with a fanned stack of the latest booster covers — the box
 * art is the product's one saturated element (การ์ด = พระเอก), so the hero's
 * primary control shows real art instead of a form-field glyph.
 */
export function HeroSetPicker({ sets }: { sets: SetPickerItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // The picked code doubles as the pending UI: the trigger swaps to the chosen
  // set's box art + code while the route transition runs, so the tap never
  // reads as dead. router.push has no built-in pending state of its own.
  const [picked, setPicked] = useState<string | null>(null)

  // Latest boosters lead the fan. releaseDate is NULL in the DB for all sets,
  // so "latest" falls back to reverse code order — same rule as pickRecentSets.
  const fanned = useMemo(
    () =>
      sets
        .filter((s) => s.type === "BOOSTER" && s.imageUrl)
        .sort((a, b) => b.code.localeCompare(a.code))
        .slice(0, 3),
    [sets],
  )

  return (
    <div
      aria-busy={isPending}
      className={isPending ? "pointer-events-none opacity-80" : undefined}
    >
      <SetPicker
        sets={sets}
        selectedCode={picked}
        onSelect={(code) => {
          if (!code) return
          setPicked(code)
          startTransition(() => router.push(`/opcg/sets/${code}`))
        }}
        variant="inline"
        prominent
        align="left"
        // min-h (not h-*) so this wins over the variant's `h-11 sm:h-9` without
        // an order-dependent equal-specificity fight — see home-market-overview.
        // Taller than the search bar below (h-12) so the hierarchy — set first,
        // search second — reads at a glance; raised elevation for the same job.
        triggerClassName="tap-safe min-h-14 rounded-xl px-3.5 text-base shadow-[var(--elev-raised)] aria-expanded:rounded-b-none"
        triggerLeading={
          fanned.length > 0 ? (
            <span aria-hidden className="flex shrink-0 items-center -space-x-2.5">
              {fanned.map((s, i) => (
                <Image
                  key={s.code}
                  src={s.imageUrl!}
                  alt=""
                  width={48}
                  height={72}
                  className="relative h-9 w-6 rounded-[5px] bg-muted object-cover object-top shadow-[0_0_0_2px_var(--background)]"
                  style={{ zIndex: fanned.length - i }}
                />
              ))}
            </span>
          ) : undefined
        }
      />
    </div>
  )
}
