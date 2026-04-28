import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { PrivacySettingsUpdate } from "@/lib/users";
import { clientEnv } from "@/lib/env";

export const RESERVED_HANDLES = new Set([
  "admin", "administrator", "api", "auth", "billing", "cards", "checkout",
  "community", "dashboard", "deck", "decks", "drop-calculator", "explore",
  "help", "home", "honey", "image", "images", "login", "logout", "marketplace",
  "me", "messages", "news", "notifications", "onboarding", "orders", "page",
  "pages", "portfolio", "pricing", "privacy", "profile", "public", "saved",
  "search", "seller", "settings", "share", "signup", "signin", "static",
  "stats", "support", "terms", "user", "users", "watchlist", "wrap", "you",
  "meecard", "root", "system", "null", "undefined",
]);

export type ProfileUpdate = {
  displayName?: string;
  bio?: string | null;
  profileVisibility?: string;
  showCollection?: boolean;
  showListings?: boolean;
  showDecks?: boolean;
  showStats?: boolean;
  showWatchlist?: boolean;
  hidePortfolioPrices?: boolean;
  hidePortfolioQty?: boolean;
  profileSummaryOnly?: boolean;
  handle?: string | null;
  socialLine?: string | null;
  socialIg?: string | null;
  socialTwitter?: string | null;
  socialFacebook?: string | null;
  coverImageUrl?: string | null;
};

const SOCIAL_LIMITS = {
  socialLine: 60,
  socialIg: 60,
  socialTwitter: 60,
  socialFacebook: 120,
} as const;

export type BuildProfileUpdateResult =
  | {
      ok: true;
      /** Fields to write to `prisma.user.update`. */
      userData: Record<string, unknown>;
      /** Fields to write to `UserPrivacySettings` via `upsertPrivacySettings`. */
      privacyData: PrivacySettingsUpdate;
    }
  | { ok: false; response: NextResponse };

/**
 * Validate a `PATCH /api/me` body and split the update into:
 * - the columns that still live on the `User` row, and
 * - the columns that live on the `UserPrivacySettings` 1:1 satellite.
 *
 * Returns a 4xx NextResponse for any validation error so the route stays a
 * thin shell. Performs a uniqueness check for the optional `handle`.
 */
export async function buildProfileUpdate(
  userId: string,
  body: ProfileUpdate,
): Promise<BuildProfileUpdateResult> {
  const userData: Record<string, unknown> = {};
  const privacyData: PrivacySettingsUpdate = {};

  if (body.displayName !== undefined) {
    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim().slice(0, 120)
        : "";
    if (!displayName) {
      return {
        ok: false,
        response: NextResponse.json({ error: "displayName is required" }, { status: 400 }),
      };
    }
    userData.displayName = displayName;
  }

  if (body.bio !== undefined) {
    userData.bio = typeof body.bio === "string"
      ? body.bio.trim().slice(0, 500) || null
      : null;
  }

  if (body.profileVisibility !== undefined) {
    const valid = ["public", "friends", "private"];
    if (valid.includes(body.profileVisibility)) {
      privacyData.profileVisibility = body.profileVisibility;
    }
  }

  for (const key of [
    "showCollection",
    "showListings",
    "showDecks",
    "showStats",
    "showWatchlist",
    "hidePortfolioPrices",
    "hidePortfolioQty",
    "profileSummaryOnly",
  ] as const) {
    if (body[key] !== undefined) {
      privacyData[key] = !!body[key];
    }
  }

  for (const key of ["socialLine", "socialIg", "socialTwitter", "socialFacebook"] as const) {
    const raw = body[key];
    if (raw === undefined) continue;
    if (raw === null || raw === "") {
      userData[key] = null;
      continue;
    }
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim().slice(0, SOCIAL_LIMITS[key]);
    userData[key] = trimmed || null;
  }

  if (body.coverImageUrl !== undefined) {
    const raw = body.coverImageUrl;
    if (raw === null || raw === "") {
      userData.coverImageUrl = null;
    } else if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 2048) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Cover image URL is too long" },
            { status: 400 },
          ),
        };
      }
      // Restrict cover URLs to the configured Supabase storage origin so a
      // user can't set arbitrary remote URLs (which would leak referer headers
      // and bypass next/image's allowlist).
      const allowedOrigin = clientEnv().NEXT_PUBLIC_SUPABASE_URL;
      try {
        const url = new URL(trimmed);
        const allowed = new URL(allowedOrigin);
        if (url.origin !== allowed.origin) {
          return {
            ok: false,
            response: NextResponse.json(
              { error: "Cover image URL must be hosted on Supabase storage" },
              { status: 400 },
            ),
          };
        }
      } catch {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Cover image URL is invalid" },
            { status: 400 },
          ),
        };
      }
      userData.coverImageUrl = trimmed;
    }
  }

  if (body.handle !== undefined) {
    const raw = body.handle;
    if (raw === null || raw === "") {
      userData.handle = null;
    } else if (typeof raw === "string") {
      const handle = raw.trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Handle must be 3-24 chars: lowercase letters, numbers, underscore" },
            { status: 400 },
          ),
        };
      }
      if (RESERVED_HANDLES.has(handle)) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "This handle is reserved" },
            { status: 400 },
          ),
        };
      }
      const existing = await prisma.user.findUnique({
        where: { handle },
        select: { id: true },
      });
      if (existing && existing.id !== userId) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "This handle is already taken" },
            { status: 409 },
          ),
        };
      }
      userData.handle = handle;
    }
  }

  const hasUserUpdate = Object.keys(userData).length > 0;
  const hasPrivacyUpdate = Object.keys(privacyData).length > 0;
  if (!hasUserUpdate && !hasPrivacyUpdate) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No fields to update" }, { status: 400 }),
    };
  }

  return { ok: true, userData, privacyData };
}
