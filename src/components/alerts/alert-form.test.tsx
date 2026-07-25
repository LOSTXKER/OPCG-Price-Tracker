import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Currency } from "@/lib/i18n";
import {
  currencySymbol,
  formatJpyAmount,
  jpyToDisplayValue,
} from "@/lib/utils/currency";

const preference = vi.hoisted(() => ({
  currency: "THB" as Currency,
}));

vi.mock("@/stores/ui-store", () => ({
  useUIStore: (
    selector: (state: { language: "TH"; currency: Currency }) => unknown,
  ) => selector({ language: "TH", currency: preference.currency }),
}));

vi.mock("@/hooks/use-tier-limits", () => ({
  useTierLimits: () => ({ limits: { lineAlerts: false } }),
}));

vi.mock("@/components/shared/upgrade-dialog", () => ({
  useUpgradeDialog: () => ({ openUpgradeDialog: vi.fn() }),
}));

import { AlertFormBody } from "./alert-form";

function renderForm() {
  return renderToStaticMarkup(
    <AlertFormBody
      value={{
        direction: "BELOW",
        channels: ["EMAIL"],
        target: "206",
      }}
      onChange={vi.fn()}
      currentPriceJpy={980}
      submitting={false}
      onSubmit={vi.fn()}
      submitLabel="สร้างแจ้งเตือน"
    />,
  );
}

describe("AlertFormBody display currency", () => {
  it.each<Currency>(["THB", "JPY", "USD"])(
    "renders the target input and market-price hint in the user's %s preference",
    (currency) => {
      preference.currency = currency;

      const markup = renderForm();

      expect(markup).toContain(`ราคาตลาด: ${formatJpyAmount(980, currency)}`);
      expect(markup).toContain(`>${currencySymbol(currency)}</span>`);
      expect(markup).toContain(
        `placeholder="${Math.round(jpyToDisplayValue(980, currency))}"`,
      );

      if (currency !== "JPY") {
        expect(markup).not.toContain("ราคาตลาด: ¥980");
      }
    },
  );
});
