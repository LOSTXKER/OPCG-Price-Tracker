import { describe, expect, it } from "vitest"

import { mapHeaderSetResponse } from "./use-header-sets"

describe("mapHeaderSetResponse", () => {
  it("maps the API card count without leaking the internal _count envelope", () => {
    const [set] = mapHeaderSetResponse([
      {
        code: "OP03",
        name: "強大な敵",
        nameEn: "Mighty Enemies",
        nameTh: "ศัตรูผู้แข็งแกร่ง",
        type: "BOOSTER",
        releaseDate: null,
        imageUrl: null,
        _count: { cards: 121 },
      },
    ])

    expect(set).toMatchObject({ code: "OP03", cardCount: 121 })
    expect(set).not.toHaveProperty("_count")
  })
})
