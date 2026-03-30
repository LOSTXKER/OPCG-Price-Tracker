import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface RelatedPageItem {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
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
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:bg-muted/40"
          >
            <div className="mt-0.5 shrink-0 text-primary">
              <item.icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold transition-colors group-hover:text-primary">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
