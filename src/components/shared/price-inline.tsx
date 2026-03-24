"use client";

import { formatJpy, formatThb, formatUsd, jpyToThb, jpyToUsd } from "@/lib/utils/currency";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function Price({
  jpy,
  className,
}: {
  jpy: number;
  className?: string;
}) {
  const currency = useUIStore((s) => s.currency);

  let text: string;
  switch (currency) {
    case "THB":
      text = `~${formatThb(Math.round(jpyToThb(jpy)))}`;
      break;
    case "USD":
      text = formatUsd(jpyToUsd(jpy));
      break;
    case "JPY":
    default:
      text = formatJpy(jpy);
      break;
  }

  return <span className={cn("font-price", className)}>{text}</span>;
}
