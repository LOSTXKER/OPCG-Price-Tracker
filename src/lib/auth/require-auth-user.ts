import { NextResponse } from "next/server";
import { getAuthUser, type AuthUser } from "./get-auth-user";

/**
 * Requires an authenticated user inside an API route handler.
 * Returns the user on success, or a 401 NextResponse on failure
 * — matching the `parseJsonBody` envelope so callers can early-return.
 */
export async function requireAuthUser(): Promise<
  { ok: true; user: AuthUser } | { ok: false; response: NextResponse }
> {
  const dbUser = await getAuthUser();
  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user: dbUser };
}
