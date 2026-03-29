import { NextResponse } from "next/server";

export const cardInclude = {
  set: { select: { code: true, name: true, nameEn: true, nameTh: true } },
} as const;

export const userPublicSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
  sellerRating: true,
  sellerReviewCount: true,
} as const;

/**
 * Validates that `value` is an array of strings. Returns the string[]
 * on success, or a 400 NextResponse on failure.
 */
export function asStringArray(
  value: unknown,
  field: string
): string[] | NextResponse {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    return NextResponse.json(
      { error: `${field} must be an array of strings` },
      { status: 400 }
    );
  }
  for (const v of value) {
    if (typeof v !== "string") {
      return NextResponse.json(
        { error: `${field} must contain only strings` },
        { status: 400 }
      );
    }
  }
  return value as string[];
}
