"use client";

import { useState, useCallback } from "react";
import { Loader2, ChevronDown, Zap, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTypeInfo, ALL_TYPES } from "./honey-type-labels";

interface Transaction {
  id: number;
  amount: number;
  type: string;
  reason: string;
  createdAt: string;
  user: { displayName: string | null; email: string };
}

interface HoneyTransactionListProps {
  initialTransactions: Transaction[];
  initialHasMore: boolean;
}

const PAGE_SIZE = 30;

export function HoneyTransactionList({
  initialTransactions,
  initialHasMore,
}: HoneyTransactionListProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const loadMore = useCallback(async (currentPage: number, currentType: string, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(PAGE_SIZE),
      });
      if (currentType) params.set("type", currentType);

      const res = await fetch(`/api/admin/honey/transactions?${params}`);
      if (!res.ok) return;
      const data = await res.json();

      const mapped = data.transactions.map((tx: Transaction & { createdAt: string }) => ({
        ...tx,
        createdAt: tx.createdAt,
      }));

      if (append) {
        setTransactions((prev) => [...prev, ...mapped]);
      } else {
        setTransactions(mapped);
      }
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFilterChange = (newType: string) => {
    setTypeFilter(newType);
    setPage(1);
    loadMore(1, newType, false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMore(nextPage, typeFilter, true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="size-3.5 text-muted-foreground" />
        <select
          value={typeFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 py-1 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
        >
          <option value="">ทุกประเภท</option>
          {ALL_TYPES.map((type) => (
            <option key={type} value={type}>
              {getTypeInfo(type).label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30 text-meta">
              <th className="px-3 py-2 text-left font-medium">ผู้ใช้</th>
              <th className="px-3 py-2 text-left font-medium">ประเภท</th>
              <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">รายละเอียด</th>
              <th className="px-3 py-2 text-right font-medium">จำนวน</th>
              <th className="px-3 py-2 text-right font-medium">วันที่</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {transactions.map((tx) => {
              const typeInfo = getTypeInfo(tx.type);
              return (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Zap
                        className={cn(
                          "size-3 shrink-0",
                          tx.amount > 0 ? "text-green-500" : "text-red-500",
                        )}
                      />
                      <span className="max-w-[120px] truncate text-sm">
                        {tx.user.displayName ?? tx.user.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      className={cn(
                        "text-overlay",
                        typeInfo.bg,
                        typeInfo.text,
                      )}
                    >
                      {typeInfo.label}
                    </Badge>
                  </td>
                  <td className="hidden max-w-[250px] truncate px-3 py-2 text-meta sm:table-cell">
                    {tx.reason}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        tx.amount > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-meta">
                    {new Date(tx.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            ไม่พบธุรกรรม
          </p>
        )}
      </div>

      {hasMore && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/50 bg-muted/20 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
          {loading ? "กำลังโหลด..." : "โหลดเพิ่ม"}
        </button>
      )}
    </div>
  );
}
