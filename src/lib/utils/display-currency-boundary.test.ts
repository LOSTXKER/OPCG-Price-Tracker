import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const UI_ROOTS = ["src/app", "src/components"] as const;

/**
 * These surfaces deliberately show a native or transactional currency.
 * Adding an entry is a review decision: user-facing market/value surfaces
 * should use Price, PriceTag, or a preference-aware currency formatter.
 */
const NATIVE_CURRENCY_ALLOWLIST = {
  "src/app/cards/[code]/opengraph-image.tsx":
    "OpenGraph output is cacheable and cannot read a browser-local preference.",
  "src/components/cards/card-detail/price-history-table.tsx":
    "The crawlable price-history table must ship in the first HTML response, so it renders on the server and cannot read the browser currency store.",
  "src/app/guide/rarities/page.tsx":
    "The guide explains Japanese source-market price ranges in JPY.",
  "src/app/market-overview/page.tsx":
    "The server-rendered market summary is crawlable SEO copy — it cannot read a browser-local currency preference.",
  "src/app/marketplace/[listingId]/page.tsx":
    "Marketplace SEO metadata uses the listing's canonical transaction currency.",
  "src/app/search/search-seo-blocks.tsx":
    "Server-rendered search results exist for crawlers and no-JS clients; the hydrated client list is preference-aware.",
  "src/app/orders/[id]/page.tsx":
    "An order receipt preserves the actual THB transaction and JPY listing amounts.",
  "src/app/seller/listings/page.tsx":
    "Seller inventory preserves the native asking-price contract while editing listings.",
  "src/app/seller/orders/[id]/page.tsx":
    "A seller order receipt preserves the actual transaction currencies.",
  "src/app/seller/page.tsx":
    "Seller revenue and order totals are actual THB transaction amounts.",
  "src/app/trending/page.tsx":
    "The auto-generated Thai summary sentence is canonical server output for crawlers, not personalized browser UI.",
  "src/app/trending/trending-movers-sections.tsx":
    "The server-rendered mover lists must be in the first HTML response, so they cannot depend on the client currency store.",
  "src/components/marketplace/create-wizard/step-pricing.tsx":
    "The asking-price input is explicitly labeled JPY and persists priceJpy.",
  "src/components/messages/conversation-item.tsx":
    "Offer activity preserves the negotiated THB transaction amount.",
  "src/components/messages/make-offer-dialog.tsx":
    "Offer entry and comparison use the marketplace's negotiated THB amount.",
  "src/components/messages/offer-card.tsx":
    "Offer cards preserve the negotiated THB transaction amount.",
  "src/components/messages/order-sidebar.tsx":
    "Order chat preserves the listing and market amounts used by the transaction.",
  "src/components/orders/order-card.tsx":
    "Order cards preserve actual THB and source JPY transaction amounts.",
  "src/components/portfolio/portfolio-share-card.tsx":
    "The share renderer is already preference-aware and only splits its formatted symbol for layout.",
} as const;

function collectTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["admin", "api", "proto"].includes(entry.name)) return [];
      return collectTsxFiles(path);
    }

    if (!entry.name.endsWith(".tsx") || entry.name.includes(".test.")) return [];
    return [path];
  });
}

function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/(^|\s)\/\/.*$/gmu, "$1");
}

describe("display-currency UI boundary", () => {
  it("keeps fixed/native currency rendering behind an explicit allowlist", () => {
    const root = process.cwd();
    const uiFiles = UI_ROOTS.flatMap((directory) =>
      collectTsxFiles(resolve(root, directory)),
    );
    const offenders = uiFiles
      .filter((file) => {
        const source = withoutComments(readFileSync(file, "utf8"));
        return (
          /\bformat(?:Jpy|Thb|Usd)\s*\(/u.test(source) ||
          /[¥฿]/u.test(source)
        );
      })
      .map((file) => relative(root, file))
      .sort();

    expect(offenders).toEqual(
      Object.keys(NATIVE_CURRENCY_ALLOWLIST).sort(),
    );
  });
});
