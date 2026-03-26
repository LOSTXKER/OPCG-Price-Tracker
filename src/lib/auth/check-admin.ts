import { getAdminUser } from "./get-admin-user";

/**
 * For use in API routes -- returns true/false instead of redirecting.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const admin = await getAdminUser();
  return admin !== null;
}
