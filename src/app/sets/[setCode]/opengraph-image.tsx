import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const alt = "Set Detail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function SetOG(props: {
  params: Promise<{ setCode: string }>;
}) {
  const { setCode } = await props.params;
  const code = decodeURIComponent(setCode);

  const cardSet = await prisma.cardSet.findUnique({ where: { code } });
  if (!cardSet) {
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
          Set not found
        </div>
      ),
      { ...size },
    );
  }

  const product = await prisma.product.findUnique({ where: { code } });
  const cardCount = await prisma.card.count({
    where: product
      ? { productCards: { some: { productId: product.id } } }
      : { setId: cardSet.id },
  });
  const setName = cardSet.nameEn ?? cardSet.name;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
          fontFamily: "sans-serif",
          padding: 60,
        }}
      >
        {/* Meecard branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 10,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, color: "white" }}>
              M
            </span>
          </div>
          <span style={{ fontSize: 24, color: "#94a3b8", fontWeight: 600 }}>
            Meecard
          </span>
        </div>

        {/* Set code */}
        <span
          style={{
            fontSize: 36,
            color: "#6366f1",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {code.toUpperCase()}
        </span>

        {/* Set name */}
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            maxWidth: 900,
            marginTop: 12,
            lineHeight: 1.2,
          }}
        >
          {setName}
        </span>

        {/* Card count */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 40,
            fontSize: 26,
            color: "#a5b4fc",
          }}
        >
          <span>{cardCount.toLocaleString()} cards</span>
          <span>·</span>
          <span>One Piece Card Game</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
