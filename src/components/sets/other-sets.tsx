import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { SectionHead } from "@/components/shared/section-head";
import type { OtherSet } from "@/lib/data/set-detail";

/**
 * "Browse other sets" rail at the bottom of a set-detail page (เบส) — poster
 * tiles linking to each set, matching the sets-index card (shadow + lift hover).
 */
export function OtherSets({
  sets,
  title,
  viewAllLabel,
}: {
  sets: OtherSet[];
  title: string;
  viewAllLabel: string;
}) {
  if (sets.length === 0) return null;

  return (
    <section className="space-y-4">
      <SectionHead
        title={title}
        action={
          <Link
            href="/sets"
            className="text-sm font-medium text-primary hover:underline"
          >
            {viewAllLabel}
          </Link>
        }
      />
      <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {sets.map((s) => {
          const displayName = s.nameEn ?? s.name;
          return (
            <Link
              key={s.id}
              href={`/sets/${s.code}`}
              aria-label={displayName}
              className="group flex flex-col gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="surface-1 group-lift relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-[var(--panel-shadow)]">
                {s.boxImageUrl ? (
                  <Image
                    src={s.boxImageUrl}
                    alt={displayName}
                    fill
                    sizes="(max-width: 640px) 30vw, (max-width: 1024px) 16vw, 12vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="size-7 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-h5 block truncate text-foreground">
                  {s.code.toUpperCase()}
                </span>
                <p className="text-meta truncate">{displayName}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
