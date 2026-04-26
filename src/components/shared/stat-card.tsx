import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: LucideIcon
  iconNode?: React.ReactNode
  color?: string
  bg?: string
  className?: string
  children?: React.ReactNode
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconNode,
  color = "text-primary",
  bg = "bg-primary/10",
  className,
  children,
}: StatCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-border",
      className,
    )}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-price text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground/70">{sub}</p>}
        </div>
        {(Icon || iconNode) && (
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", bg)}>
            {iconNode ?? (Icon && <Icon className={cn("size-[18px]", color)} />)}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
