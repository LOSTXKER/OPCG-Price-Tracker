import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigationMock = vi.hoisted(() => ({
  search: "demo=multigame",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/watchlist",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(navigationMock.search),
}));

vi.mock("@/hooks/use-auth-state", () => ({
  useAuthState: () => ({ authed: true }),
}));

vi.mock("@/stores/ui-store", () => ({
  useUIStore: (selector: (state: { language: "TH" }) => unknown) =>
    selector({ language: "TH" }),
}));

vi.mock("./watchlist-client", () => ({
  default: () => <div>cards</div>,
}));

vi.mock("@/app/settings/alerts/alerts-manager-client", () => ({
  AlertsManagerClient: () => <div>alerts</div>,
}));

import WatchlistTabs from "./watchlist-tabs";

describe("watchlist tabs", () => {
  it("aligns the selected indicator with the responsive tab-list edge", () => {
    navigationMock.search = "demo=multigame";
    const markup = renderToStaticMarkup(<WatchlistTabs />);

    expect(markup).toContain(">รายการโปรด</h1>");
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain("group-data-horizontal/tabs:h-11");
    // 44px rail at every width; the indicator overlaps the hairline instead of
    // stacking a second line above it.
    expect(markup).not.toContain("md:group-data-horizontal/tabs:h-10");
    expect(markup).not.toContain("group-data-horizontal/tabs:h-8");
    expect(markup).toContain("group-data-horizontal/tabs:after:-bottom-px");
    expect(markup).not.toContain("group-data-horizontal/tabs:after:bottom-0");
    expect(markup).not.toContain(
      "group-data-horizontal/tabs:after:bottom-[-5px]",
    );
    expect(markup).not.toContain('data-slot="watchlist-quota-status"');
  });

  it("uses the active alerts lens as the page heading", () => {
    navigationMock.search = "tab=alerts";
    const markup = renderToStaticMarkup(<WatchlistTabs />);

    expect(markup).toContain(">แจ้งเตือนราคา</h1>");
    expect(markup).not.toContain(">รายการโปรด</h1>");
  });
});
