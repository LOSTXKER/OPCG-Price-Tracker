import { NextResponse } from "next/server";

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** @deprecated Use `forbidden()` instead */
export const unauthorized = forbidden;

export const actionStamp = (userId: string) => ({
  actionBy: userId,
  actionAt: new Date(),
});

export { parseJsonBody } from "@/lib/api/request-body";
