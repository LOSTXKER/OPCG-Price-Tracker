import { ImageResponse } from "next/og";

export const alt = "Meecard — OPCG Card Prices Updated Daily";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: 20,
            }}
          >
            <span style={{ fontSize: 52, fontWeight: 800, color: "white" }}>
              M
            </span>
          </div>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            Meecard
          </span>
        </div>
        <p
          style={{
            fontSize: 28,
            color: "#a5b4fc",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          One Piece Card Game Prices Updated Daily
        </p>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 40,
            color: "#94a3b8",
            fontSize: 20,
          }}
        >
          <span>Price Tracking</span>
          <span>·</span>
          <span>Portfolio</span>
          <span>·</span>
          <span>Charts</span>
          <span>·</span>
          <span>Marketplace</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
