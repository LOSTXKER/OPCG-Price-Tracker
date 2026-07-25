import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Currency } from "@/lib/i18n";
import { formatByCurrency } from "@/lib/utils/currency";

const preference = vi.hoisted(() => ({
  currency: "THB" as Currency,
}));

vi.mock("@/stores/ui-store", () => ({
  useUIStore: (
    selector: (state: { currency: Currency }) => unknown,
  ) => selector({ currency: preference.currency }),
}));

import { Price } from "./price-inline";
import { PriceTag } from "@/components/ui/price-tag";

describe("preference-aware price atoms", () => {
  it.each<Currency>(["THB", "JPY", "USD"])(
    "renders Price and PriceTag in %s",
    (currency) => {
      preference.currency = currency;
      const expected = formatByCurrency(980, currency, 250).primary;

      expect(
        renderToStaticMarkup(<Price jpy={980} thb={250} />),
      ).toContain(expected);
      expect(
        renderToStaticMarkup(
          <PriceTag
            jpy={980}
            thb={250}
            showChange={false}
          />,
        ),
      ).toContain(expected);
    },
  );
});
