import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isAuthBypassed } from "@/lib/env";
import {
  ALL_GAMES,
  GAME_AGNOSTIC_FEATURES,
  GAME_COOKIE,
  GAME_COOKIE_MAX_AGE,
  GAME_HEADER,
  isActiveGamePrefix,
  isGameNamespaceRoute,
  isGameScopedSegment,
  resolveActiveGamePrefix,
} from "@/lib/game/constants";

const GAME_COOKIE_OPTS = {
  path: "/",
  maxAge: GAME_COOKIE_MAX_AGE,
  sameSite: "lax" as const,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const seg1 = segments[0];

  if (pathname.startsWith("/@")) {
    const handle = pathname.slice(2).split("/")[0];
    if (handle && /^[a-z0-9_]{3,24}$/i.test(handle)) {
      const url = request.nextUrl.clone();
      url.pathname = `/u/${handle.toLowerCase()}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Game namespace ────────────────────────────────────────────────────────
  // `/opcg/portfolio` → rewrite to the flat `/portfolio` route (URL stays
  // prefixed), expose the game via the `x-game` header + persist the cookie.
  // None of the game-scoped features are middleware-auth-gated, so this branch
  // never needs the login redirect below.
  const gameSegment = segments[1];

  // Unified cross-game features are canonical at their flat path. Registered
  // game identities (including `all`) may only act as a removable prefix here;
  // they must never turn account/system routes into aliases.
  if (
    (isActiveGamePrefix(seg1) || seg1 === ALL_GAMES) &&
    gameSegment &&
    GAME_AGNOSTIC_FEATURES.has(gameSegment)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + segments.slice(1).join("/");
    return NextResponse.redirect(url);
  }

  // Only launch-ready games + real game-owned segments may rewrite. `/all` is
  // valid solely for aggregate search; roadmap games do not own catalog routes.
  if (isGameNamespaceRoute(seg1, gameSegment)) {
    const game = seg1;
    const url = request.nextUrl.clone();
    url.pathname = "/" + segments.slice(1).join("/"); // "/" when path is just "/opcg"

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(GAME_HEADER, game);

    if (isAuthBypassed()) {
      const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
      res.cookies.set(GAME_COOKIE, game, GAME_COOKIE_OPTS);
      return res;
    }

    const { response } = await updateSession(request, { rewriteTo: url, requestHeaders });
    response.cookies.set(GAME_COOKIE, game, GAME_COOKIE_OPTS);
    return response;
  }

  // Legacy un-prefixed feature (`/portfolio`, `/cards/...`) → redirect to the
  // visitor's current game so every browse URL is canonically namespaced. The
  // redirected request hits the rewrite branch above (no loop).
  if (isGameScopedSegment(seg1)) {
    const cookieGame = request.cookies.get(GAME_COOKIE)?.value;
    const game = resolveActiveGamePrefix(cookieGame);
    const url = request.nextUrl.clone();
    url.pathname = `/${game}${pathname}`;
    return NextResponse.redirect(url);
  }

  // ── Non-namespaced routes (account / system / api / content) ──────────────
  if (isAuthBypassed()) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  const needsAdminAuth =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin-login");

  if (needsAdminAuth && !user) {
    const loginUrl = new URL("/admin-login", request.url);
    return Response.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
