import { NextRequest, NextResponse } from "next/server";
import { createLog } from "@/lib/logger";
import { getAdminUser } from "@/lib/auth";
import { forbidden } from "@/lib/api/admin-helpers";

export type AdminUser = NonNullable<Awaited<ReturnType<typeof getAdminUser>>>;

const log = createLog("api");

/**
 * Wraps an API route handler with top-level try/catch.
 * Logs errors and returns a generic 500 response to avoid leaking internals.
 */
export function apiHandler<TArgs extends unknown[]>(
  handler: (request: NextRequest, ...args: TArgs) => Promise<NextResponse>,
): (request: NextRequest, ...args: TArgs) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: TArgs) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      log.error(`${request.method} ${request.nextUrl.pathname}`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

/**
 * Wraps an admin API route handler: checks admin auth, adds try/catch + error logging.
 * The resolved admin user is passed as the second argument to the handler.
 */
export function adminApiHandler<TArgs extends unknown[]>(
  handler: (request: NextRequest, admin: AdminUser, ...args: TArgs) => Promise<NextResponse>,
): (request: NextRequest, ...args: TArgs) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: TArgs) => {
    const admin = await getAdminUser();
    if (!admin) return forbidden();
    try {
      return await handler(request, admin, ...args);
    } catch (error) {
      log.error(`${request.method} ${request.nextUrl.pathname}`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
