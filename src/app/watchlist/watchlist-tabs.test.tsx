import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/watchlist",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("demo=multigame"),
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
    const markup = renderToStaticMarkup(<WatchlistTabs />);

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain("group-data-horizontal/tabs:h-11");
    expect(markup).toContain("md:group-data-horizontal/tabs:h-9");
    expect(markup).not.toContain("group-data-horizontal/tabs:h-8");
    expect(markup).toContain("group-data-horizontal/tabs:after:bottom-0");
    expect(markup).not.toContain(
      "group-data-horizontal/tabs:after:bottom-[-5px]",
    );
  });
});
