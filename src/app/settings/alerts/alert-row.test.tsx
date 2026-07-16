import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MOCK_POKEMON_ALERTS } from "@/lib/mock/multigame-demo";

import { AlertRow } from "./alert-row";

describe("AlertRow multi-game navigation", () => {
  it("links Pokémon alerts to the Pokémon card namespace", () => {
    const alert = MOCK_POKEMON_ALERTS[0];
    if (!alert) throw new Error("Missing Pokémon alert fixture");

    const markup = renderToStaticMarkup(
      <AlertRow
        alert={alert}
        feedback={null}
        busy={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(markup.match(/href="\/pokemon\/cards\/SV1a-205"/g)).toHaveLength(2);
    expect(markup).not.toContain('href="/opcg/cards/SV1a-205"');
    expect(markup).toContain("md:hidden");
    expect(markup).toContain("hidden items-center md:flex");
  });
});
