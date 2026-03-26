import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
  mono = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  mono?: boolean;
}) {
  const cfg = {
    sm: { img: 24, text: "text-base", gap: "gap-1.5" },
    md: { img: 30, text: "text-lg", gap: "gap-2" },
    lg: { img: 38, text: "text-2xl", gap: "gap-2.5" },
  }[size];

  return (
    <span className={cn("inline-flex items-center font-bold", cfg.gap, cfg.text, className)}>
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={cfg.img}
        height={cfg.img}
        className="shrink-0 select-none"
        priority
      />
      <span className={mono ? undefined : "text-foreground"}>Meecard</span>
    </span>
  );
}
