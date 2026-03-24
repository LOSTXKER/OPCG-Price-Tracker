"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type KumaMood = "happy" | "excited" | "calm" | "worried" | "searching" | "shrug" | "sad" | "lost";
type KumaEmptyPreset = "no-results" | "empty-portfolio" | "empty-watchlist" | "not-found" | "error";

const PRESETS: Record<KumaEmptyPreset, { mood: KumaMood; emoji: string; title: string; description: string }> = {
  "no-results": {
    mood: "shrug",
    emoji: "🐻",
    title: "ไม่เจอการ์ดที่ค้นหา",
    description: "ลองเปลี่ยนคำค้นหาหรือปรับ filter ดูนะ",
  },
  "empty-portfolio": {
    mood: "sad",
    emoji: "🐻",
    title: "ยังไม่มีการ์ดในพอร์ต",
    description: "เพิ่มการ์ดใบแรกให้ Kuma ถือหน่อย!",
  },
  "empty-watchlist": {
    mood: "calm",
    emoji: "🐻",
    title: "ยังไม่มีการ์ดในรายการจับตา",
    description: "กดดาวที่การ์ดที่สนใจเพื่อติดตามราคา",
  },
  "not-found": {
    mood: "lost",
    emoji: "🗺️",
    title: "หลงทางแล้ว...",
    description: "ไม่เจอหน้าที่ค้นหา ลองกลับหน้าแรกดู",
  },
  error: {
    mood: "worried",
    emoji: "🐻",
    title: "มีบางอย่างผิดพลาด",
    description: "ลองรีเฟรชหน้านี้อีกครั้ง",
  },
};

export function KumaEmptyState({
  preset,
  title,
  description,
  action,
  className,
}: {
  preset?: KumaEmptyPreset;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const config = preset ? PRESETS[preset] : null;
  const displayTitle = title || config?.title || "ไม่มีข้อมูล";
  const displayDesc = description || config?.description;
  const emoji = config?.emoji || "🐻";

  return (
    <div
      className={cn(
        "panel flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-5xl select-none"
      >
        {emoji}
      </motion.div>
      <div className="space-y-1">
        <h2 className="font-sans text-base font-semibold">{displayTitle}</h2>
        {displayDesc && (
          <p className="max-w-sm text-sm text-muted-foreground">{displayDesc}</p>
        )}
      </div>
      {action}
    </div>
  );
}
