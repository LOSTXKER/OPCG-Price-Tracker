"use client";

import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";

import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminToolbar,
  AdminSearch,
} from "@/components/admin/admin-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { cn } from "@/lib/utils";
import type { SetData } from "./_components/types";
import { useDropRatesEditor } from "./_components/use-drop-rates-editor";
import { SetRow } from "./_components/set-row";

type FilterMode = "all" | "complete" | "incomplete";

function isSetComplete(set: SetData): boolean {
  if (set.dropRates.length === 0) return false;
  return set.dropRates.every(
    (dr) => dr.avgPerBox != null && dr.ratePerPack != null,
  );
}

export function DropRatesManager({
  initialSets,
  rarityCounts,
}: {
  initialSets: SetData[];
  rarityCounts: Record<string, number>;
}) {
  const sets = initialSets;
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const editor = useDropRatesEditor();

  const filteredSets = useMemo(() => {
    let result = sets;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.nameEn && s.nameEn.toLowerCase().includes(q)),
      );
    }

    if (filterMode === "complete") {
      result = result.filter(isSetComplete);
    } else if (filterMode === "incomplete") {
      result = result.filter((s) => !isSetComplete(s));
    }

    return result;
  }, [sets, searchQuery, filterMode]);

  const completeCounts = useMemo(() => {
    const complete = sets.filter(isSetComplete).length;
    return { complete, incomplete: sets.length - complete };
  }, [sets]);

  function toggleExpand(code: string) {
    setExpandedCode((prev) => (prev === code ? null : code));
  }

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="อัตราดรอป"
          description="ดูและแก้ไขอัตราการเปิดได้ในแต่ละชุดการ์ด บันทึกได้ทีละรายการหรือทั้งชุด"
          icon={BarChart3}
          meta={
            <>
              <span className="text-meta">{sets.length} ชุด</span>
              {completeCounts.incomplete > 0 && (
                <AdminStatusBadge tone="warning">
                  ไม่ครบ {completeCounts.incomplete}
                </AdminStatusBadge>
              )}
              {completeCounts.complete > 0 && (
                <AdminStatusBadge tone="success">
                  ครบ {completeCounts.complete}
                </AdminStatusBadge>
              )}
            </>
          }
        />
      }
    >
      <div className="sticky top-0 z-20">
        <AdminToolbar
          actions={
            <div className="flex items-center gap-1 rounded-lg border border-transparent dark:border-hair bg-muted/30 p-1">
              {(
                [
                  { key: "all", label: "ทั้งหมด", count: sets.length },
                  {
                    key: "complete",
                    label: "ครบ",
                    count: completeCounts.complete,
                  },
                  {
                    key: "incomplete",
                    label: "ไม่ครบ",
                    count: completeCounts.incomplete,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterMode(f.key)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium motion-base",
                    filterMode === f.key
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                  <span className="ml-1 opacity-60">{f.count}</span>
                </button>
              ))}
            </div>
          }
        >
          <AdminSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="ค้นหาชุดการ์ด (รหัส / ชื่อ)..."
            className="w-full sm:w-72"
          />
        </AdminToolbar>
      </div>

      {/* Set List */}
      <div className="space-y-2">
        {filteredSets.length === 0 && (
          <AdminEmptyState
            title="ไม่พบชุดการ์ดที่ตรงกับการค้นหา"
            description="ลองล้างตัวกรองหรือเปลี่ยนคำค้น"
          />
        )}

        {filteredSets.map((set) => {
          const expanded = expandedCode === set.code;
          return (
            <SetRow
              key={set.id}
              set={set}
              expanded={expanded}
              complete={isSetComplete(set)}
              rarityCounts={rarityCounts}
              onToggle={() => {
                toggleExpand(set.code);
                if (!expanded) editor.initEdit(set);
              }}
              editor={editor}
            />
          );
        })}
      </div>
    </AdminPage>
  );
}
