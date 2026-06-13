import Image from "next/image";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { CardRow } from "./types";

/** Data-quality badges — flags missing EN name / image / price, else "complete". */
export function StatusBadges({ card }: { card: CardRow }) {
  const missing: { label: string; key: string }[] = [];
  if (!card.nameEn) missing.push({ label: "EN", key: "en" });
  if (!card.imageUrl) missing.push({ label: "IMG", key: "img" });
  if (card.latestPriceJpy == null) missing.push({ label: "¥", key: "price" });

  if (missing.length === 0) {
    return (
      <AdminStatusBadge tone="success" dot>
        ครบ
      </AdminStatusBadge>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-1">
      {missing.map((m) => (
        <span
          key={m.key}
          className="status-warning rounded px-1 py-px text-overlay leading-tight"
        >
          {m.label}
        </span>
      ))}
    </div>
  );
}

/** Card thumbnail with a large hover-preview tooltip. */
export function ImageCell({ card }: { card: CardRow }) {
  if (!card.imageUrl) {
    return (
      <div
        className="flex items-center justify-center rounded bg-muted text-meta"
        style={{ width: 40, height: 56 }}
      >
        ?
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-block cursor-default" />}>
        <Image
          src={card.imageUrl}
          alt={card.nameEn ?? card.nameJp}
          width={40}
          height={56}
          className="rounded"
          unoptimized
        />
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className="overflow-hidden rounded-lg border-0 bg-transparent p-0 shadow-2xl"
      >
        <Image
          src={card.imageUrl}
          alt={card.nameEn ?? card.nameJp}
          width={200}
          height={280}
          className="rounded-lg"
          unoptimized
        />
      </TooltipContent>
    </Tooltip>
  );
}
