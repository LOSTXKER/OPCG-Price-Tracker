import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { Surface } from "@/components/ui/surface";

export interface RelatedPageItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * One card of the grid, exported on its own so a page can drop a SINGLE
 * next-step CTA (e.g. "เปิดเครื่องคำนวณ" under the drop-rate table) in the
 * exact same visual grammar as the "เพิ่มเติม" grid — no hand-rolled
 * text-link CTAs per page (owner call, เบส 2026-08-07).
 */
export function RelatedPageCard({
  item,
  className,
}: {
  item: RelatedPageItem;
  className?: string;
}) {
  return (
    <Surface
      as={Link}
      variant="outline"
      interactive
      href={item.href}
      className={`group ease-chrome flex items-start gap-3 p-4 transition-all ${className ?? ""}`}
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <item.icon className="size-[18px] text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-h5 motion-base group-hover:text-primary">
          {item.title}
        </p>
        <p className="mt-0.5 text-meta leading-relaxed">{item.description}</p>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </Surface>
  );
}

export function RelatedPages({
  title = "เพิ่มเติม",
  items,
}: {
  title?: string;
  items: RelatedPageItem[];
}) {
  return (
    <section className="mt-12 space-y-4">
      <h2 className="text-h3">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <RelatedPageCard key={item.href} item={item} />
        ))}
      </div>
    </section>
  );
}
