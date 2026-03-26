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
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-lg" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold tracking-tight", textSize[size], className)}>
      <span className={mono ? undefined : "text-foreground"}>OPCG</span>
      <span className={mono ? "opacity-60 font-normal" : "text-muted-foreground font-normal"}>Price Tracker</span>
    </span>
  );
}
