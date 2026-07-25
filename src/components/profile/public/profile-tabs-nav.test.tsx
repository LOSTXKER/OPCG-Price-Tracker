import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent } from "@/components/ui/tabs";

import { ProfileTabsNav } from "./profile-tabs-nav";

describe("ProfileTabsNav", () => {
  it("uses the canonical tab relationship and preserves a touch-sized rail", () => {
    const markup = renderToStaticMarkup(
      <Tabs defaultValue="listings">
        <ProfileTabsNav
          lang="TH"
          tabs={[
            { key: "listings", labelKey: "tabListings", count: 12 },
            { key: "reviews", labelKey: "tabReviews", count: 3 },
          ]}
        />
        <TabsContent value="listings">listings panel</TabsContent>
        <TabsContent value="reviews">reviews panel</TabsContent>
      </Tabs>,
    );

    expect(markup).toContain('role="tablist"');
    expect(markup.match(/role="tab"/g)).toHaveLength(2);
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain("min-h-11");
    expect(markup).toContain("overflow-x-auto");
    expect(markup).not.toContain('aria-controls="-panel-');
  });
});
