"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ScrollText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminToolbar, AdminSearch, AdminFilterSelect } from "@/components/admin/admin-toolbar";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LogEntry = {
  id: number;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  details: unknown;
  createdAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-500/15 text-green-600",
  UPDATE: "bg-blue-500/15 text-blue-600",
  DELETE: "bg-red-500/15 text-red-500",
  SCRAPE: "bg-purple-500/15 text-purple-600",
  MATCH: "bg-amber-500/15 text-amber-600",
  APPROVE: "bg-emerald-500/15 text-emerald-600",
  REJECT: "bg-red-500/15 text-red-500",
  GRANT: "bg-orange-500/15 text-orange-600",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = useCallback(
    async (page: number) => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);

      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setPagination(
        data.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
      );
      setLoading(false);
    },
    [entityFilter, actionFilter],
  );

  useEffect(() => {
    void fetchLogs(1);
  }, [fetchLogs]);

  const columns: Column<LogEntry>[] = [
    {
      key: "time",
      header: "เวลา",
      className: "whitespace-nowrap text-xs text-muted-foreground",
      render: (log) => new Date(log.createdAt).toLocaleString("th-TH"),
    },
    {
      key: "action",
      header: "การกระทำ",
      render: (log) => (
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
            ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground",
          )}
        >
          {log.action}
        </span>
      ),
    },
    {
      key: "entity",
      header: "ประเภท",
      className: "text-xs",
      render: (log) => log.entity,
    },
    {
      key: "entityId",
      header: "ID",
      className: "font-mono text-xs text-muted-foreground",
      render: (log) => log.entityId ?? "—",
    },
    {
      key: "userId",
      header: "ผู้ใช้",
      className: "font-mono text-xs text-muted-foreground",
      render: (log) => log.userId?.slice(0, 12) ?? "—",
    },
    {
      key: "details",
      header: "รายละเอียด",
      className: "max-w-xs",
      render: (log) => {
        const hasDetails = log.details && JSON.stringify(log.details) !== "{}";
        if (!hasDetails) return <span className="text-xs text-muted-foreground/50">—</span>;

        const isExpanded = expandedId === log.id;
        return (
          <button
            onClick={() => setExpandedId(isExpanded ? null : log.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="truncate max-w-[200px]">
              {JSON.stringify(log.details).slice(0, 80)}
            </span>
            {isExpanded ? (
              <ChevronUp className="size-3 shrink-0" />
            ) : (
              <ChevronDown className="size-3 shrink-0" />
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="บันทึกระบบ"
        description="ตรวจสอบกิจกรรมและการเปลี่ยนแปลงทั้งหมดในระบบ"
        icon={ScrollText}
        badge={
          pagination.total > 0 ? (
            <Badge variant="secondary">
              {pagination.total.toLocaleString()} รายการ
            </Badge>
          ) : undefined
        }
      />

      <AdminToolbar>
        <AdminSearch
          value={entityFilter}
          onChange={setEntityFilter}
          placeholder="กรองตามประเภท..."
          className="w-48"
        />
        <AdminSearch
          value={actionFilter}
          onChange={setActionFilter}
          placeholder="กรองตามการกระทำ..."
          className="w-48"
        />
      </AdminToolbar>

      <AdminDataTable
        columns={columns}
        data={logs}
        rowKey={(log) => log.id}
        loading={loading}
        emptyMessage="ไม่พบบันทึกระบบ"
        emptyDescription="ยังไม่มีกิจกรรมที่บันทึกไว้"
        stickyHeader
        renderExpandedRow={(log) => {
          if (!log.details) return null;
          return (
            <pre className="max-h-60 overflow-auto rounded-lg bg-muted/30 p-3 text-xs">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          );
        }}
        isRowExpanded={(log) => expandedId === log.id}
        onRowClick={(log) => {
          if (log.details && JSON.stringify(log.details) !== "{}") {
            setExpandedId(expandedId === log.id ? null : log.id);
          }
        }}
      />

      <AdminPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        perPage={pagination.limit}
        onPageChange={(p) => void fetchLogs(p)}
      />
    </div>
  );
}
