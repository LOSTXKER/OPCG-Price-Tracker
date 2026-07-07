import Link from "next/link";
import { ExternalLink, Pencil, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatJpy } from "@/lib/utils/currency";
import { ImageCell, StatusBadges } from "./card-cells";
import { CardEditForm } from "./card-edit-form";
import type { CardRow } from "./types";

export function CardMobileRow({
  card,
  editing,
  editData,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditChange,
}: {
  card: CardRow;
  editing: boolean;
  editData: Record<string, string>;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditChange: (field: string, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <ImageCell card={card} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/cards/${card.id}`}
              className="font-mono text-xs font-bold hover:text-primary"
            >
              {card.baseCode}
            </Link>
            {card.isParallel && (
              <span className="rounded-sm bg-warning-soft px-1 text-xs font-medium text-warning">
                {card.rarity.startsWith("P-") ? card.rarity : "PA"}
              </span>
            )}
            <span className="text-meta">{card.set.code.toUpperCase()}</span>
          </div>
          <p className="mt-1 truncate text-xs">{card.nameJp}</p>
          {card.nameEn && (
            <p className="truncate text-meta">{card.nameEn}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2 text-meta">
            <span>{card.rarity}</span>
            <span>·</span>
            <span className="font-price">
              {card.latestPriceJpy != null ? formatJpy(card.latestPriceJpy) : "—"}
            </span>
            <StatusBadges card={card} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={editing ? onCancelEdit : onStartEdit}
            aria-label={editing ? "ยกเลิก" : "แก้ไข"}
          >
            {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
          </Button>
          <Link
            href={`/admin/cards/${card.id}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground motion-base hover:bg-muted hover:text-foreground"
            title="แก้ไขฉบับเต็ม"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>
      {editing && (
        <div className="rounded-lg border border-transparent dark:border-hair bg-muted/20 p-3">
          <CardEditForm
            card={card}
            editData={editData}
            saving={saving}
            onChange={onEditChange}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        </div>
      )}
    </div>
  );
}
