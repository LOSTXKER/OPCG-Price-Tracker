import { cn } from "@/lib/utils"

export interface CardGridProps {
  children: React.ReactNode
  className?: string
}

export function CardGrid({ children, className }: CardGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  )
}
