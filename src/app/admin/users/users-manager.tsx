"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award,
  Gift,
  Zap,
  Flame,
  Send,
  Users,
  UserPlus,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminToolbar, AdminSearch } from "@/components/admin/admin-toolbar";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/shared/stat-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
    avatarUrl: string | null;
    honeyPoints: number;
    checkinStreak: number;
    lastCheckinAt: string | null;
    tier: string;
    tierExpiresAt: string | null;
    createdAt: string;
    badges: {
      id: number;
      name: string;
      nameEn: string | null;
      grantedAt: string;
    }[];
  };
  transactions: {
    id: number;
    amount: number;
    type: string;
    reason: string;
    createdAt: string;
  }[];
};

type Stats = {
  totalUsers: number;
  totalHoney: number;
  activeToday: number;
  newThisWeek: number;
};

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  FREE: { label: "Free", className: "bg-muted text-muted-foreground" },
  PRO: { label: "Pro", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  PRO_PLUS: { label: "Pro+", className: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400" },
  LIFETIME_PRO: { label: "Lifetime", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  LIFETIME_PRO_PLUS: { label: "Lifetime+", className: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 dark:from-amber-500/15 dark:to-orange-500/15 dark:text-amber-400" },
};

function TierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.FREE;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-micro", config.className)}>
      {config.label}
    </span>
  );
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UsersManager() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [grantUser, setGrantUser] = useState<UserRow | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/honey/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        if (data.stats) setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setSelectedUser(null);
    setSheetOpen(true);
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
    if (!grantUser) return;
    setGranting(true);
    try {
      const res = await fetch("/api/admin/honey/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: grantUser.id,
          amount: Number(grantAmount),
          reason: grantReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`ให้ Honey สำเร็จ! ยอดใหม่: ${data.honeyPoints}`);
        setGrantAmount("");
        setGrantReason("");
        setGrantUser(null);
        loadUsers();
        if (selectedUser?.user.id === grantUser.id) {
          loadUserDetail(grantUser.id);
        }
      } else {
        toast.error(data.error || "ไม่สำเร็จ");
      }
    } finally {
      setGranting(false);
    }
  };

  const userColumns: Column<UserRow>[] = [
    {
      key: "user",
      header: "ผู้ใช้",
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.displayName ?? u.email} />}
            <AvatarFallback>{getInitials(u.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{u.displayName ?? "—"}</p>
            <p className="truncate text-meta">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "honey",
      header: "Honey",
      headerClassName: "text-right",
      className: "text-right font-bold tabular-nums text-amber-600 dark:text-amber-400",
      sortable: true,
      sortFn: (a, b) => a.honeyPoints - b.honeyPoints,
      render: (u) => u.honeyPoints.toLocaleString(),
    },
    {
      key: "streak",
      header: "สตรีค",
      headerClassName: "text-right",
      className: "text-right",
      render: (u) => (
        <span className="inline-flex items-center justify-end gap-1 text-orange-500">
          <Flame className="size-3" /> {u.checkinStreak}
        </span>
      ),
    },
    {
      key: "tier",
      header: "ระดับ",
      headerClassName: "text-center",
      className: "text-center",
      render: (u) => <TierBadge tier={u.tier} />,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-10",
      className: "text-right",
      render: (u) => (
        <button
          aria-label="ให้ Honey"
          onClick={(e) => {
            e.stopPropagation();
            setGrantUser(u);
          }}
          className="rounded p-1.5 text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-500/10"
          title="ให้ Honey"
        >
          <Gift className="size-3.5" />
        </button>
      ),
    },
  ];

  const statCards = stats
    ? [
        {
          label: "ผู้ใช้ทั้งหมด",
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          label: "Honey หมุนเวียน",
          value: stats.totalHoney.toLocaleString(),
          icon: Award,
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-100 dark:bg-amber-500/10",
        },
        {
          label: "เช็คอินวันนี้",
          value: stats.activeToday.toLocaleString(),
          icon: CalendarCheck,
          color: "text-green-500",
          bg: "bg-green-500/10",
        },
        {
          label: "สมาชิกใหม่สัปดาห์นี้",
          value: stats.newThisWeek.toLocaleString(),
          icon: UserPlus,
          color: "text-violet-500",
          bg: "bg-violet-500/10",
        },
      ]
    : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="ผู้ใช้งาน"
        description="จัดการผู้ใช้ ดูข้อมูล Honey และให้คะแนน"
        icon={Users}
        badge={<Badge variant="secondary">{total} คน</Badge>}
      />

      {/* Stat Cards */}
      {statCards && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      <AdminToolbar>
        <AdminSearch
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="ค้นหาอีเมลหรือชื่อ..."
          className="w-64"
        />
      </AdminToolbar>

      {/* Users Table (full width) */}
      <AdminDataTable
        columns={userColumns}
        data={users}
        rowKey={(u) => u.id}
        loading={loading}
        emptyMessage="ไม่พบผู้ใช้"
        emptyDescription="ลองค้นหาด้วยคำค้นอื่น"
        onRowClick={(u) => loadUserDetail(u.id)}
        compact
      />

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={20}
        onPageChange={setPage}
      />

      {/* Grant Honey Dialog */}
      <Dialog open={!!grantUser} onOpenChange={(open) => { if (!open) setGrantUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="size-4 text-amber-600 dark:text-amber-400" />
              ให้ Honey
            </DialogTitle>
            {grantUser && (
              <DialogDescription>
                ให้คะแนนแก่ <strong>{grantUser.displayName ?? grantUser.email}</strong>
                {grantUser.displayName && (
                  <span className="text-muted-foreground"> ({grantUser.email})</span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              type="number"
              placeholder="จำนวน Honey"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
            />
            <Input
              placeholder="เหตุผล"
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleGrant}
              disabled={granting || !grantAmount || !grantReason}
              size="sm"
            >
              <Send className="size-3.5" />
              {granting ? "กำลังดำเนินการ..." : "ให้ Honey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          {detailLoading && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              กำลังโหลด...
            </div>
          )}
          {selectedUser && !detailLoading && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    {selectedUser.user.avatarUrl && (
                      <AvatarImage
                        src={selectedUser.user.avatarUrl}
                        alt={selectedUser.user.displayName ?? selectedUser.user.email}
                      />
                    )}
                    <AvatarFallback>{getInitials(selectedUser.user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="truncate">
                      {selectedUser.user.displayName ?? "—"}
                    </SheetTitle>
                    <SheetDescription className="truncate">
                      {selectedUser.user.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-900/20">
                    <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {selectedUser.user.honeyPoints.toLocaleString()}
                    </p>
                    <p className="text-meta">Honey</p>
                  </div>
                  <div className="rounded-lg bg-orange-500/5 p-3 text-center">
                    <p className="text-2xl font-bold tabular-nums text-orange-500">
                      {selectedUser.user.checkinStreak}
                    </p>
                    <p className="text-meta">สตรีค</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">ระดับ</span>
                    <TierBadge tier={selectedUser.user.tier} />
                  </div>
                  {selectedUser.user.tierExpiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">หมดอายุ</span>
                      <span className="text-foreground">
                        {new Date(selectedUser.user.tierExpiresAt).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                  )}
                  {selectedUser.user.lastCheckinAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">เช็คอินล่าสุด</span>
                      <span className="text-foreground">
                        {new Date(selectedUser.user.lastCheckinAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">สมัครเมื่อ</span>
                    <span className="text-foreground">
                      {new Date(selectedUser.user.createdAt).toLocaleDateString("th-TH")}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                {selectedUser.user.badges.length > 0 && (
                  <div>
                    <p className="mb-2 text-eyebrow">
                      ตราสัญลักษณ์
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.user.badges.map((b) => (
                        <Badge key={b.id} variant="secondary" className="text-xs">
                          {b.nameEn ?? b.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transactions */}
                <div>
                  <p className="mb-2 text-eyebrow">
                    ประวัติธุรกรรม
                  </p>
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {selectedUser.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted/30"
                      >
                        <Zap
                          className={cn(
                            "size-3 shrink-0",
                            tx.amount > 0 ? "text-green-500" : "text-red-500",
                          )}
                        />
                        <span className="flex-1 truncate text-muted-foreground">
                          {tx.reason}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-bold tabular-nums",
                            tx.amount > 0 ? "text-green-500" : "text-red-500",
                          )}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                    {selectedUser.transactions.length === 0 && (
                      <p className="py-4 text-center text-meta">
                        ไม่มีธุรกรรม
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Grant from Sheet */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const row = users.find((u) => u.id === selectedUser.user.id);
                    if (row) setGrantUser(row);
                  }}
                >
                  <Gift className="size-3.5 text-amber-600 dark:text-amber-400" />
                  ให้ Honey
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
