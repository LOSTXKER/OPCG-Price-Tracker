"use client";

import { Check, Loader2, Sparkles, XCircle } from "lucide-react";
import {
  AdminBulkBar,
  AdminBulkAction,
} from "@/components/admin/admin-bulk-bar";

interface BulkBarProps {
  selectedCount: number;
  aiRunning: boolean;
  bulkBusy: boolean;
  canApprove: boolean;
  onAiSuggest: () => void;
  onAiRecheck: () => void;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
}

export function YuyuteiBulkBar({
  selectedCount,
  aiRunning,
  bulkBusy,
  canApprove,
  onAiSuggest,
  onAiRecheck,
  onApprove,
  onReject,
  onClear,
}: BulkBarProps) {
  return (
    <AdminBulkBar
      selectedCount={selectedCount}
      onClear={onClear}
      label={(n) => `${n} รายการที่เลือก`}
    >
      <AdminBulkAction
        variant="violet"
        onClick={onAiSuggest}
        disabled={aiRunning}
        icon={
          aiRunning ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )
        }
      >
        AI แนะนำ
      </AdminBulkAction>

      <AdminBulkAction
        variant="violet-outline"
        onClick={onAiRecheck}
        disabled={aiRunning}
        icon={<Sparkles className="size-3.5" />}
      >
        รันใหม่
      </AdminBulkAction>

      <AdminBulkAction
        variant="success"
        onClick={onApprove}
        disabled={bulkBusy || !canApprove}
        icon={<Check className="size-3.5" />}
      >
        อนุมัติ
      </AdminBulkAction>

      <AdminBulkAction
        variant="danger"
        onClick={onReject}
        disabled={bulkBusy}
        icon={<XCircle className="size-3.5" />}
      >
        ปฏิเสธ
      </AdminBulkAction>
    </AdminBulkBar>
  );
}
