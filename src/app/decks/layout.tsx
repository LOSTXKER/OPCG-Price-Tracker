import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decks & Tools",
  description:
    "Build and price One Piece Card Game decks, compare cards, and estimate booster pull rates.",
  alternates: { canonical: "/opcg/decks" },
};

export default function DecksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
