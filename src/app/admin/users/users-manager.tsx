"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Award,
  Gift,
  X,
  Zap,
  Flame,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";

type UserRow = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  honeyPoints: number;
  checkinStreak: number;
  tier: string;
  createdAt: string;
  _count: { honeyTransactions: number };
};

type UserDetail = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    honeyPoints: number;
    checkinStreak: number;
    lastCheckinAt: string | null;
    tier: string;
    tierExpiresAt: string | null;
    badges: { id: number; name: string; nameEn: string | null; grantedAt: string }[];
  };
  transactions: {
    id: number;
    amount: number;
    type: string;
    reason: string;
    createdAt: string;
  }[];
};

export function UsersManager() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/honey/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const res = await fetch(`/api/admin/honey/users/${userId}`);
      if (res.ok) {
        setSelectedUser(await res.json());
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantUserId) return;
    setGranting(true);
    try {
      const res = await fetch("/api/admin/honey/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: grantUserId,
          amount: Number(grantAmount),
          reason: grantReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Granted! New balance: ${data.honeyPoints}`);
        setGrantAmount("");
        setGrantReason("");
        setGrantUserId(null);
        loadUsers();
        if (selectedUser?.user.id === grantUserId) {
          loadUserDetail(grantUserId);
        }
      } else {
        toast.error(data.error || "Failed");
      }
    } finally {
      setGranting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        icon={Users}
        badge={<Badge variant="secondary">{total} total</Badge>}
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {/* Grant Modal */}
      {grantUserId && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-card p-4 shadow-sm dark:border-amber-500/30">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Grant Honey
            </h3>
            <button onClick={() => { setGrantUserId(null); }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              type="number"
              placeholder="Amount"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Reason"
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
            />
          </div>
          <Button onClick={handleGrant} disabled={granting || !grantAmount || !grantReason} size="sm">
            <Send className="h-3.5 w-3.5" /> {granting ? "Granting..." : "Grant"}
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Users List */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Honey</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Streak</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Tier</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="cursor-pointer border-b border-border/20 transition-colors hover:bg-muted/20"
                    onClick={() => loadUserDetail(u.id)}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{u.displayName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {u.honeyPoints.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="flex items-center justify-end gap-1 text-orange-500">
                        <Flame className="h-3 w-3" /> {u.checkinStreak}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                      {u.tier}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setGrantUserId(u.id); }}
                        className="rounded p-1.5 text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-500/10"
                        title="Grant Honey"
                      >
                        <Gift className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <AdminPagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        </div>

        {/* User Detail */}
        <div className="lg:col-span-2">
          {detailLoading && (
            <div className="rounded-xl border border-border/50 bg-card p-8 text-center text-muted-foreground">Loading...</div>
          )}
          {selectedUser && !detailLoading && (
            <div className="space-y-4 rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold">{selectedUser.user.displayName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-900/20">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{selectedUser.user.honeyPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="rounded-lg bg-orange-500/5 p-3 text-center">
                  <p className="text-2xl font-bold text-orange-500">{selectedUser.user.checkinStreak}</p>
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Tier: <span className="font-medium text-foreground">{selectedUser.user.tier}</span></p>
                {selectedUser.user.lastCheckinAt && (
                  <p>Last check-in: {new Date(selectedUser.user.lastCheckinAt).toLocaleString()}</p>
                )}
                {selectedUser.user.badges.length > 0 && (
                  <p className="mt-1">
                    Badges: {selectedUser.user.badges.map((b) => b.nameEn ?? b.name).join(", ")}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Transaction History</p>
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {selectedUser.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-2 rounded px-2 py-1 text-xs">
                      <Zap className={`h-3 w-3 shrink-0 ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`} />
                      <span className="flex-1 truncate text-muted-foreground">{tx.reason}</span>
                      <span className={`shrink-0 font-bold tabular-nums ${tx.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </div>
                  ))}
                  {selectedUser.transactions.length === 0 && (
                    <p className="py-4 text-center text-muted-foreground">No transactions</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {!selectedUser && !detailLoading && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-12 text-center text-muted-foreground">
              <Users className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm">Click a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
