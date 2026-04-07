"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ScrollText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 50, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchLogs = useCallback(async (page: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (entityFilter) params.set("entity", entityFilter);
    if (actionFilter) params.set("action", actionFilter);

    const res = await fetch(`/api/admin/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setPagination(data.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 });
    setLoading(false);
  }, [entityFilter, actionFilter]);

  useEffect(() => {
    void fetchLogs(1);
  }, [fetchLogs]);

  function handleFilterChange(setter: (v: string) => void, value: string) {
    setter(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      /* fetchLogs will re-run via the useEffect dependency change */
    }, 400);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit Logs"
        icon={ScrollText}
        badge={
          pagination.total > 0 ? (
            <Badge variant="secondary">{pagination.total.toLocaleString()} entries</Badge>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Filter by entity..."
          value={entityFilter}
          onChange={(e) => handleFilterChange(setEntityFilter, e.target.value)}
          className="w-48"
        />
        <Input
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => handleFilterChange(setActionFilter, e.target.value)}
          className="w-48"
        />
      </div>

      {loading ? (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Entity</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Entity ID</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/20">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16">
          <ScrollText className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No logs found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Entity</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Entity ID</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="default" className="text-[11px]">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{log.entity}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{log.entityId ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{log.userId?.slice(0, 12) ?? "—"}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-xs text-muted-foreground">
                    {log.details ? JSON.stringify(log.details).slice(0, 100) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={(p) => void fetchLogs(p)}
      />
    </div>
  );
}
