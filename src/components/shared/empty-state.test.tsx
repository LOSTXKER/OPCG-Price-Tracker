import { renderToStaticMarkup } from "react-dom/server";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("keeps the standard empty-state rendering as the default", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        title="Nothing here"
        description="Try another filter"
        action={<button>Retry</button>}
      />,
    );

    expect(markup).toContain("panel px-6");
    expect(markup).toContain('<p class="text-h4 text-foreground">Nothing here</p>');
    expect(markup).toContain('<div class="mt-1"><button>Retry</button></div>');
  });

  it("renders the product appearance with a caller-provided mascot", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        appearance="product"
        mascot={<span data-mascot="kuma">🐻</span>}
        title="No results"
        description="Try another search"
      />,
    );

    expect(markup).toContain("panel flex flex-col items-center justify-center gap-4 bg-accent/30");
    expect(markup).toContain('<span data-mascot="kuma">🐻</span>');
    expect(markup).toContain('<h2 class="text-h3">No results</h2>');
  });

  it("preserves the branded dashed, admin, and minimal layouts", () => {
    const dashed = renderToStaticMarkup(
      <EmptyState appearance="product" variant="dashed" icon={Search} title="No listings" />,
    );
    const admin = renderToStaticMarkup(
      <EmptyState appearance="admin" icon={Search} title="No rows" description="Create one" />,
    );
    const minimal = renderToStaticMarkup(
      <EmptyState appearance="minimal" icon={Search} title="No ranking" />,
    );

    expect(dashed).toContain("border-dashed border-border py-16");
    expect(dashed).toContain('<p class="text-h3 text-foreground">No listings</p>');
    expect(admin).toContain("rounded-xl bg-muted/50 p-4");
    expect(admin).toContain('<p class="font-medium text-muted-foreground">No rows</p>');
    expect(minimal).toContain("flex flex-col items-center gap-2 py-14 text-center");
    expect(minimal).toContain('<p class="text-meta text-muted-foreground/60">No ranking</p>');
  });
});
