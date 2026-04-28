export type ScheduleRule = {
  id: number;
  templateId: number;
  slotType: string;
  dayOfWeek: number | null;
  specificDates: string[] | null;
  poolGroup: string | null;
  poolPickCount: number | null;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  template?: {
    id: number;
    code: string;
    name: string;
    nameEn: string | null;
    icon: string;
    category: string;
  };
};

export type Template = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionTh: string | null;
  icon: string;
  category: string;
  trackType: string;
  conditions: Record<string, unknown>;
  rewards: Record<string, unknown>;
  target: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  scheduleRules: ScheduleRule[];
};

export type BonusRule = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  category: string;
  requirement: string;
  requirementValue: number;
  rewards: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export type PreviewMission = {
  templateId: number;
  code: string;
  name: string;
  icon: string;
  rewards: { honey: number; tickets?: number };
  target: number;
};

export const TRACK_TYPES = ["AUTO_PATH", "MANUAL", "ACTION_COUNT"] as const;
export const CATEGORIES = ["DAILY", "MONTHLY", "SPECIAL"] as const;
export const SLOT_TYPES = [
  "CORE",
  "DAY_OF_WEEK",
  "RANDOM_POOL",
  "FIXED_DATE",
  "SEQUENTIAL",
] as const;
export const BONUS_REQUIREMENTS = [
  "ALL_COMPLETE",
  "COUNT_COMPLETE",
  "STREAK_DAYS",
] as const;
export const CONDITION_TYPES = [
  "visit_path",
  "action_count",
  "visit_unique",
  "manual_confirm",
] as const;
export const DAY_NAMES = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."] as const;

export const TRACK_TYPE_LABELS: Record<string, string> = {
  AUTO_PATH: "ตรวจอัตโนมัติจาก URL",
  MANUAL: "กดยืนยันเอง",
  ACTION_COUNT: "นับจากแอ็กชัน",
};

export const SLOT_TYPE_LABELS: Record<string, string> = {
  CORE: "หลัก (ทุกวัน)",
  DAY_OF_WEEK: "ตามวันในสัปดาห์",
  RANDOM_POOL: "สุ่มจากกลุ่ม",
  FIXED_DATE: "วันที่กำหนด",
  SEQUENTIAL: "เรียงตามลำดับ",
};

export const BONUS_REQ_LABELS: Record<string, string> = {
  ALL_COMPLETE: "ทำครบทั้งหมด",
  COUNT_COMPLETE: "ทำครบ N ภารกิจ",
  STREAK_DAYS: "ติดต่อกัน N วัน",
};

export const CATEGORY_LABELS: Record<string, string> = {
  DAILY: "รายวัน",
  MONTHLY: "รายเดือน",
  SPECIAL: "พิเศษ",
};
