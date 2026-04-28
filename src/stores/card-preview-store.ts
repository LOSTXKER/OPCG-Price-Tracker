import { create } from "zustand";

export interface CardPreviewData {
  cardCode: string;
  cardId?: number | null;
  nameJp: string;
  nameEn?: string | null;
  nameTh?: string | null;
  rarity: string;
  imageUrl?: string | null;
  setCode?: string | null;
  priceJpy?: number | null;
  priceThb?: number | null;
  priceChange24h?: number | null;
  priceChange7d?: number | null;
  priceChange30d?: number | null;
  psa10PriceUsd?: number | null;
}

interface CardPreviewState {
  open: boolean;
  card: CardPreviewData | null;
  show: (card: CardPreviewData) => void;
  close: () => void;
}

export const useCardPreviewStore = create<CardPreviewState>((set) => ({
  open: false,
  card: null,
  show: (card) => set({ open: true, card }),
  close: () => set({ open: false }),
}));
