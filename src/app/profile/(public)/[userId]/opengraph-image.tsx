import { ImageResponse } from "next/og";
import { BRAND_GOLD, BRAND_SURFACE } from "@/lib/constants/brand";
import { ListingStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const alt = "Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProfileOG(props: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await props.params;
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      displayName: true,
      avatarUrl: true,
      tier: true,
      handle: true,
      sellerRating: true,
      sellerReviewCount: true,
      _count: {
        select: {
          listings: { where: { status: ListingStatus.ACTIVE } },
          achievements: true,
          portfolios: true,
        },
      },
    },
  });

  if (!user) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1C1C1E",
            color: "white",
            fontSize: 48,
          }}
        >
          Profile not found
        </div>
      ),
      { ...size },
    );
  }

  const setCount = await prisma.portfolioItem
    .findMany({
      where: { portfolio: { userId }, isPrivate: false },
      select: { card: { select: { setId: true } } },
      take: 5000,
    })
    .then((rows) => new Set(rows.map((r) => r.card.setId)).size)
    .catch(() => 0);

  const name = user.displayName ?? "Collector";
  const tierLabel = tierLabelFor(user.tier);
  const ratingText = user.sellerRating != null ? user.sellerRating.toFixed(1) : "—";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1C1C1E",
          fontFamily: "sans-serif",
          padding: 60,
          color: "white",
        }}
      >
        {/* Header brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BRAND_SURFACE,
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: "white" }}>M</span>
          </div>
          <span style={{ fontSize: 22, color: "#B09A88", fontWeight: 600 }}>Meecard</span>
        </div>

        {/* Hero */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            marginTop: 56,
            flex: 1,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 999,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: BRAND_SURFACE,
              border: "6px solid rgba(224, 184, 101, 0.4)",
              flexShrink: 0,
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                width={220}
                height={220}
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 100, fontWeight: 800, color: "white" }}>
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>

          {/* Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  background: BRAND_SURFACE,
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {tierLabel}
              </span>
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.05,
                maxWidth: 720,
              }}
            >
              {name}
            </div>
            {user.handle && (
              <div style={{ fontSize: 28, color: BRAND_GOLD, fontWeight: 600 }}>
                @{user.handle}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 36,
          }}
        >
          <Stat label="Rating" value={ratingText} sub={`${user.sellerReviewCount} reviews`} />
          <Stat label="Sets" value={setCount.toString()} />
          <Stat label="Achievements" value={user._count.achievements.toString()} />
          <Stat label="Listings" value={user._count.listings.toString()} />
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(224, 184, 101, 0.18)",
        borderRadius: 16,
        padding: "20px 28px",
        flex: 1,
        gap: 4,
      }}
    >
      <span style={{ fontSize: 14, color: "#B09A88", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 44, fontWeight: 800, color: "white" }}>{value}</span>
      {sub && <span style={{ fontSize: 14, color: "#8B7866" }}>{sub}</span>}
    </div>
  );
}

function tierLabelFor(tier: string): string {
  if (tier === "PRO_PLUS" || tier === "LIFETIME_PRO_PLUS") return "Pro+";
  if (tier === "PRO" || tier === "LIFETIME_PRO") return "Pro";
  return "Collector";
}
