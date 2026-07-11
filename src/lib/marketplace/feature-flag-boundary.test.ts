import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const API_ROOTS = [
  "listings",
  "messages",
  "offers",
  "orders",
  "reviews",
  "saved",
  "saved-sellers",
  "seller",
] as const;

const GUARDED_UI_LAYOUTS = [
  "src/app/marketplace/layout.tsx",
  "src/app/messages/layout.tsx",
  "src/app/orders/layout.tsx",
  "src/app/saved/layout.tsx",
  "src/app/seller/layout.tsx",
  "src/app/settings/marketplace/layout.tsx",
] as const;

function collectRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectRouteFiles(path);
    return entry.name === "route.ts" ? [path] : [];
  });
}

describe("marketplace feature-flag boundary", () => {
  it("guards every handler in marketplace API route families", () => {
    const root = resolve(process.cwd(), "src/app/api");
    const routeFiles = API_ROOTS.flatMap((segment) =>
      collectRouteFiles(join(root, segment)),
    );

    expect(routeFiles).toHaveLength(18);

    for (const routeFile of routeFiles) {
      const source = readFileSync(routeFile, "utf8");
      const handlers = [...source.matchAll(/export const (GET|POST|PATCH|PUT|DELETE) =/g)];
      const guardCalls = source.match(
        /const blocked = await guardMarketplaceApi\(\);/g,
      );

      expect(
        guardCalls?.length,
        `${relative(process.cwd(), routeFile)} must guard every exported handler`,
      ).toBe(handlers.length);

      for (let index = 0; index < handlers.length; index += 1) {
        const start = handlers[index].index ?? 0;
        const end = handlers[index + 1]?.index ?? source.length;
        const handlerSource = source.slice(start, end);
        const guardIndex = handlerSource.indexOf("guardMarketplaceApi()");
        const authIndex = handlerSource.indexOf("requireAuthUser()");

        expect(guardIndex).toBeGreaterThanOrEqual(0);
        if (authIndex >= 0) expect(guardIndex).toBeLessThan(authIndex);
      }
    }
  });

  it.each(GUARDED_UI_LAYOUTS)("guards UI segment %s", (layoutPath) => {
    const source = readFileSync(resolve(process.cwd(), layoutPath), "utf8");
    expect(source).toContain('from "@/lib/marketplace/feature-flag"');
    expect(source).toContain("await assertMarketplaceEnabled();");
  });
});
