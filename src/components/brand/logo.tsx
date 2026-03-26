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
  const imgSize = { sm: 26, md: 32, lg: 40 };
  const textSize = { sm: "text-sm", md: "text-lg", lg: "text-xl" };

  return (
    <span className={cn("inline-flex items-center gap-2 font-bold tracking-tight", textSize[size], className)}>
      <Image
        src="/meecard.png"
        alt="Meecard"
        width={imgSize[size]}
        height={imgSize[size]}
        className="shrink-0"
      />
      <span className={mono ? undefined : "text-foreground"}>Meecard</span>
    </span>
  );
}
