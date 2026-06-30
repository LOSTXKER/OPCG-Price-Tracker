import type { GameRef } from "@/lib/types/portfolio";

export type AlertCardSummary = {
  id: number;
  cardCode: string;
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  /** `game` (via set) drives the in-view game chips on the unified alerts list. */
  set?: { code: string; name: string; nameEn: string | null; nameTh: string | null; game: GameRef | null } | null;
};

export type AlertChannelValue = "EMAIL" | "LINE" | "PUSH";

export type PriceAlertItem = {
  id: number;
  userId: string;
  cardId: number;
  targetPrice: number;
  direction: "ABOVE" | "BELOW";
  channels: AlertChannelValue[];
  isActive: boolean;
  triggeredAt: string | null;
  createdAt: string;
  card: AlertCardSummary;
};
