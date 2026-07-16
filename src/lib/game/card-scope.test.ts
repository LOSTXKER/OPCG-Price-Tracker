import { describe, expect, it } from "vitest"

import { buildCardSetScope } from "./card-scope"

describe("card set game scope", () => {
  it("includes unlinked legacy sets only for the default OPCG scope", () => {
    expect(buildCardSetScope("opcg", "OP13")).toEqual({
      code: "OP13",
      OR: [
        { game: { is: { slug: "opcg" } } },
        { gameId: null },
      ],
    })
  })

  it("requires an explicit relation for a non-default game", () => {
    expect(buildCardSetScope("pokemon")).toEqual({
      OR: [{ game: { is: { slug: "pokemon" } } }],
    })
  })

  it("leaves the aggregate scope unrestricted", () => {
    expect(buildCardSetScope("all")).toEqual({})
  })
})
