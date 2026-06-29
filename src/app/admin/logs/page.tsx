"use client";

import { useState } from "react";
import {
  ScrollText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminToolbar, AdminSearch } from "@/components/admin/admin-toolbar";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import {
  AdminStatusBadge,
  type AdminStatusTone,
} from "@/components/admin/admin-status-badge";
import { Badge } from "@/components/ui/badge";
import { useAdminList } from "@/lib/admin/use-admin-list";
import { useAdminUrlState } from "@/lib/admin/use-admin-url-state";
import { buildAdminQuery } from "@/lib/admin/admin-fetch";

type LogEntry = {
  id: number;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  details: unknown;
  createdAt: string;
};

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  totalPages: number;
}

const ACTION_TONES: Record<string, AdminStatusTone> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "danger",
  SCRAPE: "primary",
  MATCH: "warning",
  APPROVE: "success",
  REJECT: "danger",
  GRANT: "warning",
};

const PER_PAGE = 50;

export default function AdminLogsPage() {
  const { state, patch } = useAdminUrlState({
    defaults: { page: 1, entity: "", action: "" },
  });
  const { page, entity, action } = state;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, loading } = useAdminList<LogsResponse, typeof state>({
    url: (p) =>
      `/api/admin/logs?${buildAdminQuery({
        page: p.page,
        limit: PER_PAGE,
        entity: p.entity || undefined,
        action: p.action || undefined,
      })}`,
    params: state,
  });
  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const columns: Column<LogEntry>[] = [
    {
      key: "time",
      header: "เวลา",
      className: "whitespace-nowrap text-meta",
      render: (log) => new Date(log.createdAt).toLocaleString("th-TH"),
    },
    {
      key: "action",
      header: "การกระทำ",
      render: (log) => (
        <AdminStatusBadge tone={ACTION_TONES[log.action] ?? "neutral"}>
          {log.action}
        </AdminStatusBadge>
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
        if (!hasDetails) return <span className="text-meta text-muted-foreground/50">—</span>;

        const isExpanded = expandedId === log.id;
        return (
          <button
            onClick={() => setExpandedId(isExpanded ? null : log.id)}
            className="flex items-center gap-1 text-meta motion-base hover:text-foreground"
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
    <AdminPage
      header={
        <AdminPageHeader
          title="บันทึกระบบ"
          description="ตรวจสอบกิจกรรมและการเปลี่ยนแปลงทั้งหมดในระบบ"
          icon={ScrollText}
          meta={
            total > 0 ? (
              <Badge variant="secondary">{total.toLocaleString()} รายการ</Badge>
            ) : undefined
          }
        />
      }
    >
      <div className="sticky top-0 z-20 -mx-1 bg-background/85 px-1 py-2 backdrop-blur supports-backdrop-filter:bg-background/70">
        <AdminToolbar>
          <AdminSearch
            value={entity}
            onChange={(v) => patch({ entity: v, page: 1 })}
            placeholder="กรองตามประเภท..."
            className="w-full sm:w-48"
          />
          <AdminSearch
            value={action}
            onChange={(v) => patch({ action: v, page: 1 })}
            placeholder="กรองตามการกระทำ..."
            className="w-full sm:w-48"
          />
        </AdminToolbar>
      </div>

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
            <pre className="max-h-60 overflow-auto rounded-lg bg-muted/30 p-3 text-code">
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
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={PER_PAGE}
        onPageChange={(p) => patch({ page: p })}
      />
    </AdminPage>
  );
}
