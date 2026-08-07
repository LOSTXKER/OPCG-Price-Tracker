import { NextRequest, NextResponse } from "next/server";
import {
  getRedirectUrl,
  getRewrittenUrl,
  isRewrite,
} from "next/experimental/testing/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const proxyMocks = vi.hoisted(() => ({
  authBypassed: true,
  updateSession: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  isAuthBypassed: () => proxyMocks.authBypassed,
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => proxyMocks.updateSession(...args),
}));

import { proxy } from "@/proxy";

const ORIGIN = "https://meecard.test";

function request(pathname: string) {
  return new NextRequest(`${ORIGIN}${pathname}`);
}

async function runProxy(pathname: string): Promise<NextResponse> {
  return (await proxy(request(pathname))) as NextResponse;
}

beforeEach(() => {
  proxyMocks.authBypassed = true;
  proxyMocks.updateSession.mockReset();
  proxyMocks.updateSession.mockImplementation(() => {
    throw new Error("Auth session should not be consulted when auth is bypassed");
  });
});

describe("game namespace proxy", () => {
  it.each([
    "/opcg/settings",
    "/opcg/admin",
    "/opcg/seller",
    "/all/trending",
    "/pokemon/cards/OP09-093_p2",
    "/pokemon/portfolio",
    "/dragonball/cards/OP09-093_p2",
  ])("does not alias an invalid game-prefixed route: %s", async (pathname) => {
    const response = await runProxy(pathname);

    expect(isRewrite(response)).toBe(false);
    expect(getRedirectUrl(response)).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("rewrites a valid active-game card route", async () => {
    const response = await runProxy("/opcg/cards/OP09-093_p2");

    expect(isRewrite(response)).toBe(true);
    expect(getRewrittenUrl(response)).toBe(`${ORIGIN}/cards/OP09-093_p2`);
    expect(response.headers.get("x-middleware-request-x-game")).toBe("opcg");
    expect(response.cookies.get("kuma-game")?.value).toBe("opcg");
  });

  it("keeps aggregate search available without exposing other aggregate aliases", async () => {
    const response = await runProxy("/all/search?q=luffy");

    expect(isRewrite(response)).toBe(true);
    expect(getRewrittenUrl(response)).toBe(`${ORIGIN}/search?q=luffy`);
    expect(response.headers.get("x-middleware-request-x-game")).toBe("all");
  });

  it("falls back to the default game when a legacy URL carries an inactive game cookie", async () => {
    const legacyRequest = request("/cards/OP09-093_p2");
    legacyRequest.cookies.set("kuma-game", "pokemon");

    const response = (await proxy(legacyRequest)) as NextResponse;

    expect(getRedirectUrl(response)).toBe(`${ORIGIN}/opcg/cards/OP09-093_p2`);
  });

  it.each([
    ["/opcg/portfolio/1", "/portfolio/1"],
    ["/all/watchlist", "/watchlist"],
  ])("redirects cross-game routes to their flat canonical URL: %s", async (pathname, canonical) => {
    const response = await runProxy(pathname);

    expect(isRewrite(response)).toBe(false);
    expect(getRedirectUrl(response)).toBe(`${ORIGIN}${canonical}`);
  });
});

describe("feature-gated route ordering", () => {
  it.each(["/messages", "/messages/123", "/marketplace/create"])(
    "lets the route layout enforce its feature flag before auth: %s",
    async (pathname) => {
      proxyMocks.authBypassed = false;
      proxyMocks.updateSession.mockResolvedValue({
        response: NextResponse.next(),
        user: null,
      });

      const response = await runProxy(pathname);

      expect(getRedirectUrl(response)).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("continues to protect admin before routing", async () => {
    proxyMocks.authBypassed = false;
    proxyMocks.updateSession.mockResolvedValue({
      response: NextResponse.next(),
      user: null,
    });

    const response = await runProxy("/admin/users");

    expect(getRedirectUrl(response)).toBe(`${ORIGIN}/admin-login`);
  });
});
