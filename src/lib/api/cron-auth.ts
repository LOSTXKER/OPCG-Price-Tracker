import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { createLog } from "@/lib/logger";

const log = createLog("cron");

/**
 * Validates the Bearer token from the Authorization header against CRON_SECRET.
 * Rejects missing, empty, or placeholder secrets.
 */
export function authorizeCron(request: NextRequest | Request): boolean {
  const secret = serverEnv().CRON_SECRET;
  if (!secret || secret === "your-cron-secret-here") return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  return token.length > 0 && token === secret;
}

/**
 * Wraps a cron handler with auth + try/catch.
 * The inner function receives the request and returns a plain object
 * which is merged into `{ ok: true, ... }`. Errors are logged and
 * returned as a generic 500 (no internal message leakage).
 */
export function cronHandler(
  handler: (request: NextRequest) => Promise<Record<string, unknown>>,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    if (!authorizeCron(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const result = await handler(request);
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      log.error("Cron error", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
