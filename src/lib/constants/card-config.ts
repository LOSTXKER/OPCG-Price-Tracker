import type { Language } from "@/stores/ui-store";

export interface CardColorConfig {
  value: string;
  dotClass: string;
  bgClass: string;
  label: Record<Language, string>;
}

export interface CardTypeConfig {
  code: string;
  label: Record<Language, string>;
}

export const CARD_COLORS: CardColorConfig[] = [
  { value: "Red",    dotClass: "bg-red-500",    bgClass: "bg-red-500",    label: { TH: "แดง",    EN: "Red",    JP: "赤" } },
  { value: "Green",  dotClass: "bg-green-500",  bgClass: "bg-green-500",  label: { TH: "เขียว",  EN: "Green",  JP: "緑" } },
  { value: "Blue",   dotClass: "bg-blue-500",   bgClass: "bg-blue-500",   label: { TH: "ฟ้า",    EN: "Blue",   JP: "青" } },
  { value: "Purple", dotClass: "bg-purple-500", bgClass: "bg-purple-500", label: { TH: "ม่วง",   EN: "Purple", JP: "紫" } },
  { value: "Black",  dotClass: "bg-neutral-800 dark:bg-neutral-300", bgClass: "bg-gray-800", label: { TH: "ดำ", EN: "Black", JP: "黒" } },
  { value: "Yellow", dotClass: "bg-yellow-500", bgClass: "bg-yellow-400", label: { TH: "เหลือง", EN: "Yellow", JP: "黄" } },
  { value: "multi",  dotClass: "bg-gradient-to-r from-red-400 to-blue-400", bgClass: "bg-gradient-to-r from-red-400 to-blue-400", label: { TH: "หลายสี", EN: "Multi", JP: "多色" } },
];

export const CARD_TYPE_ORDER = ["LEADER", "CHARACTER", "EVENT", "STAGE", "DON"] as const;

export const CARD_TYPES: CardTypeConfig[] = [
  { code: "LEADER",    label: { TH: "ลีดเดอร์",    EN: "Leader",    JP: "リーダー" } },
  { code: "CHARACTER", label: { TH: "คาแรคเตอร์", EN: "Character", JP: "キャラ" } },
  { code: "EVENT",     label: { TH: "อีเวนท์",     EN: "Event",     JP: "イベント" } },
  { code: "STAGE",     label: { TH: "สเตจ",        EN: "Stage",     JP: "ステージ" } },
  { code: "DON",       label: { TH: "DON!!",       EN: "DON!!",     JP: "DON!!" } },
];

export function getCardTypeLabel(code: string, lang: Language): string {
  return CARD_TYPES.find((ct) => ct.code === code)?.label[lang] ?? code;
}

export function getColorOptions(lang: Language): { value: string; label: string }[] {
  return CARD_COLORS.map((cc) => ({ value: cc.value, label: cc.label[lang] }));
}
