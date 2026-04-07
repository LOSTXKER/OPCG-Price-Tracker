import { NextRequest, NextResponse } from "next/server";
import { createLog } from "@/lib/logger";
import { checkIsAdmin } from "@/lib/auth";
import { unauthorized } from "@/lib/api/admin-helpers";

const log = createLog("api");

/**
 * Wraps an API route handler with top-level try/catch.
 * Logs errors and returns a generic 500 response to avoid leaking internals.
 */
export function apiHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      log.error(`${request.method} ${request.nextUrl.pathname}`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

/**
 * Wraps an admin API route handler: checks admin auth, adds try/catch + error logging.
 * Works for both plain handlers and handlers with route context (dynamic segments).
 */
export function adminApiHandler<TArgs extends unknown[]>(
  handler: (request: NextRequest, ...args: TArgs) => Promise<NextResponse>,
): (request: NextRequest, ...args: TArgs) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: TArgs) => {
    if (!(await checkIsAdmin())) return unauthorized();
    try {
      return await handler(request, ...args);
    } catch (error) {
      log.error(`${request.method} ${request.nextUrl.pathname}`, error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
