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
      <h2 className="text-h2">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group ease-chrome flex items-start gap-3 rounded-xl border border-[var(--p-hair)] bg-card p-4 transition-all hover:border-primary/30 hover:bg-foreground/[0.04]"
          >
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="size-[18px] text-primary" />
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
