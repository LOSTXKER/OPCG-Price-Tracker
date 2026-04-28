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
  set?: { code: string; name: string; nameEn: string | null; nameTh: string | null } | null;
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
