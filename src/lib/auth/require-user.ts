import { redirect } from "next/navigation";
import { getAuthUser } from "./get-auth-user";

/**
 * Page-level guard. Redirects unauthenticated visitors to `/login` and
 * returns the upserted app-level user when authenticated.
 *
 * Pair with `requireAdmin` (which redirects to `/admin-login`); use
 * `requireAuthUser` for API routes instead.
 */
export async function requireUser(redirectTo: string = "/login") {
  const user = await getAuthUser();
  if (!user) redirect(redirectTo);
  return user;
}
