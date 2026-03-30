import { ImageResponse } from "next/og";
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
            background: "#0f0f23",
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
            "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
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
                background: "#1e1e3f",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6366f1",
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
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: 8,
              }}
            >
              <span
                style={{ fontSize: 22, fontWeight: 800, color: "white" }}
              >
                M
              </span>
            </div>
            <span style={{ fontSize: 22, color: "#94a3b8", fontWeight: 600 }}>
              Meecard
            </span>
          </div>

          {/* Card code */}
          <span style={{ fontSize: 24, color: "#6366f1", fontWeight: 600 }}>
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
            style={{ display: "flex", gap: 16, fontSize: 22, color: "#a5b4fc" }}
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
