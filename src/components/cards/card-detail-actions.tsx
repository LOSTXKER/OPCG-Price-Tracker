"use client"

import { Heart, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CardDetailActions({ yuyuTeiUrl }: { yuyuTeiUrl: string }) {
  return (
    <div className="fixed right-0 bottom-14 left-0 z-30 border-t border-border bg-card px-4 py-2.5 lg:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <Button size="sm" variant="outline" className="flex-1 gap-1.5 rounded-lg">
          <Plus className="size-4" />
          Collection
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-lg">
          <Heart className="size-4" />
        </Button>
      </div>
    </div>
  )
}
