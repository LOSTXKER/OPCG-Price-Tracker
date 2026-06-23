import { ImageResponse } from "next/og";
import { BRAND_GOLD, BRAND_GRADIENT } from "@/lib/constants/brand";
import { prisma } from "@/lib/db";
import { formatJpy } from "@/lib/utils/currency";

export const alt = "Card Detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CardOG(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;
  const card = await prisma.card.findUnique({
    where: { cardCode: decodeURIComponent(code) },
    include: { set: { select: { code: true, nameEn: true, name: true } } },
  });

  if (!card) {
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
          Card not found
        </div>
      ),
      { ...size },
    );
  }

  const displayName = card.nameEn ?? card.nameJp;
  const priceText =
    card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "N/A";
  const setName = card.set.nameEn ?? card.set.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #1C1C1E 0%, #231E1A 50%, #1C1C1E 100%)",
          fontFamily: "sans-serif",
          padding: 60,
        }}
      >
        {/* Card image area */}
        <div
          style={{
            width: 340,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              width={300}
              height={420}
              style={{ borderRadius: 12, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 300,
                height: 420,
                background: "#2C2724",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: BRAND_GOLD,
                fontSize: 80,
                fontWeight: 800,
              }}
            >
              ?
            </div>
          )}
        </div>

        {/* Card info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingLeft: 48,
            gap: 16,
          }}
        >
          {/* Meecard branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: BRAND_GRADIENT,
                borderRadius: 8,
              }}
            >
              <span
                style={{ fontSize: 22, fontWeight: 800, color: "white" }}
              >
                M
              </span>
            </div>
            <span style={{ fontSize: 22, color: "#B09A88", fontWeight: 600 }}>
              Meecard
            </span>
          </div>

          {/* Card code */}
          <span style={{ fontSize: 24, color: BRAND_GOLD, fontWeight: 600 }}>
            {card.cardCode}
          </span>

          {/* Card name */}
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.2,
              maxWidth: 600,
            }}
          >
            {displayName}
          </span>

          {/* Rarity + Set */}
          <div
            style={{ display: "flex", gap: 16, fontSize: 22, color: "#C49A70" }}
          >
            <span>{card.rarity}</span>
            <span>·</span>
            <span>{setName}</span>
          </div>

          {/* Price */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 12,
            }}
          >
            <span style={{ fontSize: 52, fontWeight: 800, color: "#22c55e" }}>
              {priceText}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
