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
  const imgSize = { sm: 28, md: 34, lg: 42 };
  const textSize = { sm: "text-sm", md: "text-lg", lg: "text-xl" };
  const leading = { sm: "leading-[28px]", md: "leading-[34px]", lg: "leading-[42px]" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-bold tracking-tight", textSize[size], className)}>
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={imgSize[size]}
        height={imgSize[size]}
        className="shrink-0"
      />
      <span className={cn(mono ? undefined : "text-foreground", leading[size])}>Meecard</span>
    </span>
  );
}
