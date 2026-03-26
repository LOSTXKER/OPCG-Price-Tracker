import { NextRequest } from "next/server";

/**
 * Validates the Bearer token from the Authorization header against CRON_SECRET.
 * Rejects missing, empty, or placeholder secrets.
 */
export function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret === "your-cron-secret-here") return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  return token.length > 0 && token === secret;
}
