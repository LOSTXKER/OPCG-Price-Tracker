import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function ErrorBanner({
  message = "Failed to load data. Please try again.",
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "panel flex flex-col items-center gap-3 border-destructive/20 py-12 text-center",
        className
      )}
    >
      <AlertTriangle className="size-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">{message}</p>
    </div>
  )
}
