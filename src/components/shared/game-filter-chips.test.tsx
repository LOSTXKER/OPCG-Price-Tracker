import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ALL_GAMES } from "@/lib/game/constants"

import {
  GameFilterChips,
  getGameFilterTargetIndex,
  type GameChip,
} from "./game-filter-chips"

const opcg: GameChip = { slug: "opcg", label: "OPCG" }
const pokemon: GameChip = { slug: "pokemon", label: "Pokémon" }

function renderRail(games: GameChip[], activeGame = ALL_GAMES) {
  return renderToStaticMarkup(
    <GameFilterChips games={games} activeGame={activeGame} onSelect={() => undefined} />,
  )
}

describe("GameFilterChips", () => {
  it("renders All, One Piece, and the Pokémon teaser for one OPCG collection", () => {
    const markup = renderRail([opcg])

    expect(markup.match(/role="radio"/g)).toHaveLength(2)
    expect(markup).toContain(">ทุกเกม</span>")
    expect(markup).toContain(">One Piece</span>")
    expect(markup).not.toContain(">OPCG</span>")
    expect(markup).toContain('href="/coming-soon?game=pokemon"')
    expect(markup).toContain(">Pokémon</span>")
    expect(markup).toContain(">เร็ว ๆ นี้</span>")
    expect(markup).toContain("h-11")
    expect(markup).toContain("before:inset-y-1")
    expect(markup).toContain("before:bg-muted/50")
    expect(markup).toContain("md:h-8")
    expect(markup).toContain("md:bg-muted/50")
    expect(markup).toContain("md:p-0.5")
    expect(markup).toContain("md:before:hidden")
    expect(markup).toContain("before:bg-primary/15")
    expect(markup).toContain("overflow-x-auto")
    expect(markup.match(/tabindex="0"/g)).toHaveLength(1)
    expect(markup.match(/tabindex="-1"/g)).toHaveLength(1)
  })

  it("keeps multi-game entries live and does not duplicate Pokémon as a teaser", () => {
    const markup = renderRail([opcg, pokemon])

    expect(markup.match(/role="radio"/g)).toHaveLength(3)
    expect(markup).toContain(">One Piece</span>")
    expect(markup).toContain(">Pokémon</span>")
    expect(markup).not.toContain('href="/coming-soon?game=pokemon"')
    expect(markup).not.toContain(">เร็ว ๆ นี้</span>")
  })

  it("keeps a single Pokémon data game selectable instead of hiding the rail", () => {
    const markup = renderRail([pokemon], "pokemon")

    expect(markup.match(/role="radio"/g)).toHaveLength(2)
    expect(markup).toContain(">ทุกเกม</span>")
    expect(markup).toContain(">Pokémon</span>")
    expect(markup).toContain('aria-checked="true"')
    expect(markup).not.toContain('href="/coming-soon?game=pokemon"')
  })

  it("renders only the roadmap teaser when there are no data games", () => {
    const markup = renderRail([])

    expect(markup).not.toContain('role="radiogroup"')
    expect(markup).not.toContain('role="radio"')
    expect(markup).toContain('href="/coming-soon?game=pokemon"')
    expect(markup).toContain(">เร็ว ๆ นี้</span>")
  })

  it.each([
    ["ArrowRight", 0, 3, 1],
    ["ArrowDown", 2, 3, 0],
    ["ArrowLeft", 0, 3, 2],
    ["ArrowUp", 1, 3, 0],
    ["Home", 2, 3, 0],
    ["End", 0, 3, 2],
    ["Tab", 1, 3, null],
  ] as const)("maps %s from index %s with %s items to %s", (key, current, count, expected) => {
    expect(getGameFilterTargetIndex(key, current, count)).toBe(expected)
  })

  it("leaves no radio target when the current item is missing", () => {
    expect(getGameFilterTargetIndex("ArrowRight", -1, 3)).toBeNull()
    expect(getGameFilterTargetIndex("ArrowRight", 0, 0)).toBeNull()
  })
})
