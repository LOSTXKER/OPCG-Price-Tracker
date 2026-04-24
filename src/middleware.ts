import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vanity URL: /@handle → /u/handle (works regardless of auth bypass)
  if (pathname.startsWith("/@")) {
    const handle = pathname.slice(2).split("/")[0];
    if (handle && /^[a-z0-9_]{3,24}$/i.test(handle)) {
      const url = request.nextUrl.clone();
      url.pathname = `/u/${handle.toLowerCase()}`;
      return NextResponse.rewrite(url);
    }
  }

  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  const needsAuth =
    pathname.startsWith("/marketplace/create") ||
    pathname.startsWith("/messages") ||
    (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login"));

  if (needsAuth && !user) {
    const isAdminPath = pathname.startsWith("/admin");
    const loginUrl = new URL(isAdminPath ? "/admin-login" : "/login", request.url);
    if (!isAdminPath) loginUrl.searchParams.set("redirect", pathname);
    return Response.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
