import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ALL_GAMES } from "@/lib/game/constants"

import {
  GameFilterChips,
  getGameFilterTargetIndex,
  getLaunchReadyGameChips,
  type GameChip,
} from "./game-filter-chips"

const opcg: GameChip = { slug: "opcg", label: "OPCG" }
const pokemon: GameChip = { slug: "pokemon", label: "Pokémon" }

function renderRail(games: GameChip[], activeGame = ALL_GAMES) {
  return renderToStaticMarkup(
    <GameFilterChips games={games} activeGame={activeGame} onSelect={() => undefined} />,
  )
}

function renderSelect(games: GameChip[], activeGame = ALL_GAMES) {
  return renderToStaticMarkup(
    <GameFilterChips
      games={games}
      activeGame={activeGame}
      onSelect={() => undefined}
      variant="select"
    />,
  )
}

describe("GameFilterChips", () => {
  it("keeps game context visible when the collection has one launch-ready game", () => {
    const markup = renderRail([opcg])

    expect(markup).toContain('role="radiogroup"')
    expect(markup.match(/role="radio"/g)).toHaveLength(2)
    expect(markup).toContain('aria-label="One Piece"')
    expect(markup).toContain('data-slot="game-logo"')
    expect(markup).toContain('data-game="opcg"')
    expect(markup).toContain("%2Fgames%2Fone-piece-logo.png")
    expect(markup).toContain("One Piece")
    expect(markup).not.toContain("Pokémon")
  })

  it("keeps the ready game visible while excluding a passed roadmap game", () => {
    const markup = renderRail([opcg, pokemon])

    expect(getLaunchReadyGameChips([opcg, pokemon])).toEqual([opcg])
    expect(markup).toContain('role="radiogroup"')
    expect(markup.match(/role="radio"/g)).toHaveLength(2)
    expect(markup).toContain("%2Fgames%2Fone-piece-logo.png")
    expect(markup).not.toContain("pokemon-logo.png")
    expect(markup).not.toContain("Pokémon")
  })

  it("supports two launch-ready games and removes duplicate chips", () => {
    const chips = getLaunchReadyGameChips(
      [opcg, pokemon, { ...pokemon, label: "Duplicate" }],
      new Set(["opcg", "pokemon"]),
    )

    expect(chips).toEqual([opcg, pokemon])
  })

  it("renders nothing when there are no data games", () => {
    const markup = renderRail([])

    expect(markup).toBe("")
  })

  it("offers a compact toolbar scope without turning it into a third tab rail", () => {
    const allMarkup = renderSelect([opcg])
    const gameMarkup = renderSelect([opcg, pokemon], "opcg")

    expect(allMarkup).toContain('data-slot="game-scope-select"')
    expect(allMarkup).toContain('aria-label="กรองตามเกม: ทุกเกม"')
    expect(allMarkup).toContain("h-11")
    expect(allMarkup).toContain("sm:h-9")
    expect(allMarkup).toContain("เกม:")
    expect(allMarkup).not.toContain('role="radiogroup"')
    expect(gameMarkup).toContain('aria-label="กรองตามเกม: One Piece"')
    expect(gameMarkup).toContain('data-slot="game-logo"')
    expect(gameMarkup).toContain('data-game="opcg"')
    expect(gameMarkup).toContain("%2Fgames%2Fone-piece-logo.png")
    expect(gameMarkup).toContain("One Piece")
    expect(gameMarkup).not.toContain("Pokémon")
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
