"use client"

import { useState } from "react"
import Image from "next/image"
import { Maximize2, XIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function CardImageLightbox({
  src,
  alt,
  children,
  className,
}: {
  src: string
  alt: string
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className={cn("group/lightbox relative cursor-zoom-in", className)}
      >
        {children}
        <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/0 transition-colors group-hover/lightbox:bg-black/40">
          <Maximize2 className="size-4 text-white opacity-0 drop-shadow-md transition-opacity group-hover/lightbox:opacity-100" />
        </span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] rounded-2xl border-0 bg-black/90 p-0 ring-0 sm:max-w-sm"
          onClick={() => setOpen(false)}
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative aspect-[63/88] w-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="rounded-2xl object-contain"
              sizes="(max-width: 640px) 90vw, 384px"
              priority
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute -top-10 right-0 rounded-full bg-black/60 p-1.5 text-white/80 transition-colors hover:bg-black/80 hover:text-white"
          >
            <XIcon className="size-5" />
          </button>
        </DialogContent>
      </Dialog>
    </>
  )
}
