"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type MarketCondition = "bull" | "bear" | "neutral" | "new-set";

const MARKET_CONFIG: Record<MarketCondition, {
  emoji: string;
  message: string;
  icon: typeof TrendingUp;
  colorClass: string;
  bgClass: string;
}> = {
  bull: {
    emoji: "🐻",
    message: "ตลาดวันนี้สดใส! การ์ดขึ้นเยอะกว่าลง",
    icon: TrendingUp,
    colorClass: "text-price-up",
    bgClass: "from-price-up/10 to-transparent",
  },
  bear: {
    emoji: "🐻",
    message: "ตลาดวันนี้ลงหน่อย Kuma กอดการ์ดแน่น",
    icon: TrendingDown,
    colorClass: "text-price-down",
    bgClass: "from-price-down/10 to-transparent",
  },
  neutral: {
    emoji: "🐻",
    message: "ตลาดวันนี้ทรงตัว นั่งจิบชาสบาย ๆ",
    icon: Minus,
    colorClass: "text-muted-foreground",
    bgClass: "from-muted/50 to-transparent",
  },
  "new-set": {
    emoji: "🐻",
    message: "ชุดใหม่เพิ่งออก! Kuma ตื่นเต้นมาก",
    icon: TrendingUp,
    colorClass: "text-foreground",
    bgClass: "from-muted to-transparent",
  },
};

export function KumaMarketBanner({
  condition = "neutral",
  indexChange,
  className,
}: {
  condition?: MarketCondition;
  indexChange?: number;
  className?: string;
}) {
  const config = MARKET_CONFIG[condition];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "panel relative overflow-hidden",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-r", config.bgClass)} />

      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        <motion.span
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-4xl sm:text-5xl select-none"
        >
          {config.emoji}
        </motion.span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium sm:text-base">{config.message}</p>
          {indexChange !== undefined && (
            <div className="mt-1 flex items-center gap-1.5">
              <Icon className={cn("size-4", config.colorClass)} />
              <span className={cn("font-price text-sm font-semibold", config.colorClass)}>
                {indexChange >= 0 ? "+" : ""}
                {indexChange.toFixed(1)}% วันนี้
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
