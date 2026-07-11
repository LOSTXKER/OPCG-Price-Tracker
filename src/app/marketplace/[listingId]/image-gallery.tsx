"use client";

import { useState } from "react";
import Image from "next/image";
import { Maximize2, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  alt: string;
  /** true for the official card image (uses card aspect ratio) */
  isCard?: boolean;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <Surface
        variant="panel"
        className={cn(
          "bg-muted flex aspect-[63/88] items-center justify-center",
          className
        )}
      >
        <span className="text-muted-foreground text-sm">No image</span>
      </Surface>
    );
  }

  const current = images[selected] ?? images[0];
  const hasMultiple = images.length > 1;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main image */}
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group/main relative w-full cursor-zoom-in overflow-hidden rounded-xl bg-popover p-0"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden",
            current.isCard ? "aspect-[63/88]" : "aspect-square"
          )}
        >
          <Image
            src={current.src}
            alt={current.alt}
            fill
            className="object-contain transition-transform duration-[var(--dur-base)] group-hover/main:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 400px"
            preload={selected === 0}
          />
        </div>
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 motion-base group-hover/main:bg-black/30">
          <Maximize2 className="size-5 text-white opacity-0 drop-shadow-md motion-base group-hover/main:opacity-100" />
        </span>
      </button>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                "ease-chrome relative size-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                i === selected
                  ? "border-primary ring-primary/30 ring-2"
                  : "border-hair hover:border-muted-foreground/50"
              )}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] rounded-2xl border-0 bg-black/90 p-0 ring-0 sm:max-w-md"
          onClick={() => setLightboxOpen(false)}
        >
          <DialogTitle className="sr-only">{current.alt}</DialogTitle>
          <div
            className={cn(
              "relative w-full",
              current.isCard ? "aspect-[63/88]" : "aspect-square"
            )}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              className="rounded-2xl object-contain"
              sizes="(max-width: 640px) 90vw, 448px"
            />
          </div>
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute -top-10 right-0 rounded-full bg-black/60 p-1.5 text-white/80 motion-base hover:bg-black/80 hover:text-white"
          >
            <XIcon className="size-5" />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
