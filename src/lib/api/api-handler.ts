import { NextRequest, NextResponse } from "next/server";
import { createLog } from "@/lib/logger";

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
