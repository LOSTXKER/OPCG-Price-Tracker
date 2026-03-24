import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const textSize = { sm: "text-sm", md: "text-base", lg: "text-lg" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold tracking-tight", textSize[size], className)}>
      <span className="text-foreground">Kuma</span>
      <span className="text-muted-foreground font-normal">Tracker</span>
    </span>
  );
}
