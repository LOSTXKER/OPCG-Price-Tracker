import { ImageResponse } from "next/og";
import { BRAND_GOLD, BRAND_SURFACE } from "@/lib/constants/brand";

// Owner ruling 2026-08-28: no "updated daily" claim anywhere on the site —
// prices are not scraped on a schedule (demo site).
export const alt = "Meecard — OPCG Card Prices";
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
          background: "#1C1C1E",
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
              background: BRAND_SURFACE,
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
            color: BRAND_GOLD,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          One Piece Card Game Prices
        </p>
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 40,
            color: "#B09A88",
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
