import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

export const actionStamp = (userId: string) => ({
  actionBy: userId,
  actionAt: new Date(),
});

export { parseJsonBody } from "@/lib/api/request-body";
