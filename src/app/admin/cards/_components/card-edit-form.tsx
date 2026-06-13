import { Check, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFormField } from "@/components/admin/admin-form-field";
import type { CardRow } from "./types";

/** Quick-edit form for EN/TH names + image URL. Used in the expanded table
 *  row and inside the mobile card. Cmd/Ctrl+Enter saves, Esc cancels. */
export function CardEditForm({
  card,
  editData,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  card: CardRow;
  editData: Record<string, string>;
  saving: boolean;
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-meta">
        แก้ไขการ์ด <span className="font-mono">{card.baseCode}</span> ·{" "}
        <span>{card.nameJp}</span>
      </p>
      <div
        className="grid gap-3 sm:grid-cols-3"
        onKeyDown={handleKey}
      >
        <AdminFormField label="ชื่อ EN">
          <Input
            placeholder="ชื่อภาษาอังกฤษ"
            value={editData.nameEn || ""}
            onChange={(e) => onChange("nameEn", e.target.value)}
            autoFocus
          />
        </AdminFormField>
        <AdminFormField label="ชื่อ TH">
          <Input
            placeholder="ชื่อภาษาไทย"
            value={editData.nameTh || ""}
            onChange={(e) => onChange("nameTh", e.target.value)}
          />
        </AdminFormField>
        <AdminFormField label="URL รูปภาพ">
          <Input
            placeholder="https://..."
            value={editData.imageUrl || ""}
            onChange={(e) => onChange("imageUrl", e.target.value)}
            className="font-mono text-xs"
          />
        </AdminFormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          <X className="size-3.5" />
          ยกเลิก
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          บันทึก
        </Button>
      </div>
    </div>
  );
}
