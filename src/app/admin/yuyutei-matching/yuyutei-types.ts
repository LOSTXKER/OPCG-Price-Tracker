import type { MatchingCard } from "@/components/admin/matching-ui";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";

export type MappingCard = MatchingCard;

export interface Mapping {
  id: number;
  setCode: string;
  yuyuteiId: string;
  scrapedCode: string;
  scrapedRarity: string | null;
  scrapedName: string;
  scrapedImage: string | null;
  priceJpy: number;
  matchedCardId: number | null;
  matchedCard: MappingCard | null;
  matchMethod: string | null;
  geminiScore: number | null;
  status: string;
  updatedAt: string;
  actionAt: string | null;
  actionByUser: { displayName: string | null; email: string } | null;
  candidates: MappingCard[];
}

export interface SetInfo {
  code: string;
  name: string;
  nameEn: string | null;
}

export interface ApiResponse extends PaginatedApiResponse {
  mappings: Mapping[];
  sets: SetInfo[];
  counts: {
    matched: number;
    pending: number;
    suggested: number;
    rejected: number;
  };
}

export type AiLogEntry = {
  code: string;
  result: "ok" | "fail" | "skip" | "processing";
  msg: string;
};

export const METHOD_INFO: { key: string; label: string; desc: string }[] = [
  { key: "exact", label: "Exact (รหัสตรง)", desc: "รหัสตรง cardCode เป๊ะ" },
  { key: "auto-parallel", label: "Auto Parallel", desc: "จับคู่ parallel จาก rarity" },
  { key: "auto-parallel-any", label: "Auto Parallel (any)", desc: "parallel ที่ใกล้เคียงที่สุด" },
  { key: "auto-basecode", label: "Auto BaseCode", desc: "จาก baseCode + rarity ในเซ็ตเดียวกัน" },
  { key: "admin", label: "Admin (เลือกเอง)", desc: "แอดมินเลือกจับคู่เอง" },
  { key: "admin-bulk", label: "Admin (ยกชุด)", desc: "แอดมิน approve ยกชุด" },
  { key: "gemini", label: "AI Gemini Vision", desc: "AI เปรียบเทียบรูปภาพจาก Gemini Vision" },
  { key: "cached", label: "Cached (จำไว้)", desc: "เคยจับคู่ไว้แล้ว (yuyuteiId ตรง)" },
];

export function yuyuHd(url: string | null): string | null {
  if (!url) return null;
  return url.replace(/\/\d+_\d+\//, "/front/");
}

export const API = "/api/admin/yuyutei-matching";
