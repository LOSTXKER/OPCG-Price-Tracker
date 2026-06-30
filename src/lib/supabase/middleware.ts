import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";

export async function updateSession(
  request: NextRequest,
  opts?: { rewriteTo?: URL; requestHeaders?: Headers },
): Promise<{ response: NextResponse; user: User | null }> {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = clientEnv();

  // Build the base response. With no opts this is exactly `NextResponse.next({ request })`
  // (unchanged behaviour). The game middleware passes `rewriteTo` (strip the
  // `/[game]` prefix to the flat route) + `requestHeaders` (inject `x-game`), so
  // the session-cookie refresh and the rewrite share one response.
  const make = (): NextResponse => {
    const init = opts?.requestHeaders
      ? { request: { headers: opts.requestHeaders } }
      : { request };
    return opts?.rewriteTo
      ? NextResponse.rewrite(opts.rewriteTo, init)
      : NextResponse.next(init);
  };

  let supabaseResponse = make();

  const supabase = createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = make();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  return { response: supabaseResponse, user };
}
