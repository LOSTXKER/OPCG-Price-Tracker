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
  const imgSize = { sm: 22, md: 28, lg: 36 };
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-lg" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold tracking-tight", textSize[size], className)}>
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={imgSize[size]}
        height={imgSize[size]}
        className="shrink-0 rounded-full"
      />
      <span className={mono ? undefined : "text-foreground"}>Meecard</span>
    </span>
  );
}
