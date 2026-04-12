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
    <div className={cn("panel flex items-center gap-3 border-l-2 border-primary/25 px-4 py-4", className)}>
      {(Icon || iconNode) && (
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", bg)}>
          {iconNode ?? (Icon && <Icon className={cn("size-5", color)} />)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-price text-lg font-bold text-foreground">{value}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
