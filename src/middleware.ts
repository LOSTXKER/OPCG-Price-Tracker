import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { clientEnv } from "@/lib/env";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = await updateSession(request);

  const needsAuth =
    pathname.startsWith("/marketplace/create") ||
    pathname.startsWith("/messages") ||
    (pathname.startsWith("/admin") && !pathname.startsWith("/admin-login"));

  if (needsAuth) {
    const { createServerClient } = await import("@supabase/ssr");
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = clientEnv();
    const supabase = createServerClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const isAdminPath = pathname.startsWith("/admin");
      const loginUrl = new URL(isAdminPath ? "/admin-login" : "/login", request.url);
      if (!isAdminPath) loginUrl.searchParams.set("redirect", pathname);
      return Response.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
