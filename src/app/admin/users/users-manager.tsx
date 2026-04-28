"use client";

import { useState } from "react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatCard, type StatCardTone } from "@/components/shared/stat-card";
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
import { useAdminList } from "@/lib/admin/use-admin-list";
import { useAdminUrlState } from "@/lib/admin/use-admin-url-state";
import { adminFetch, buildAdminQuery } from "@/lib/admin/admin-fetch";

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

interface UsersResponse {
  users: UserRow[];
  total: number;
  totalPages: number;
  stats?: Stats;
}

const PER_PAGE = 20;

const TIER_CONFIG: Record<string, { label: string; tone: AdminStatusTone }> = {
  FREE: { label: "Free", tone: "neutral" },
  PRO: { label: "Pro", tone: "info" },
  PRO_PLUS: { label: "Pro+", tone: "primary" },
  LIFETIME_PRO: { label: "Lifetime", tone: "warning" },
  LIFETIME_PRO_PLUS: { label: "Lifetime+", tone: "warning" },
};

function TierBadge({ tier }: { tier: string }) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.FREE;
  return <AdminStatusBadge tone={config.tone}>{config.label}</AdminStatusBadge>;
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
  const { state, patch } = useAdminUrlState({
    defaults: { page: 1, search: "" },
  });
  const { page, search } = state;

  const { data, loading, refetch } = useAdminList<UsersResponse, typeof state>({
    url: (p) =>
      `/api/admin/honey/users?${buildAdminQuery({
        page: p.page,
        limit: PER_PAGE,
        search: p.search || undefined,
      })}`,
    params: state,
  });
  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const stats = data?.stats ?? null;

  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [grantUser, setGrantUser] = useState<UserRow | null>(null);
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);

  const loadUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setSelectedUser(null);
    setSheetOpen(true);
    try {
      const detail = await adminFetch<UserDetail>(`/api/admin/honey/users/${userId}`);
      setSelectedUser(detail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantUser) return;
    setGranting(true);
    try {
      const result = await adminFetch<{ honeyPoints: number }>("/api/admin/honey/grant", {
        method: "POST",
        body: {
          userId: grantUser.id,
          amount: Number(grantAmount),
          reason: grantReason,
        },
      });
      toast.success(`ให้ Honey สำเร็จ! ยอดใหม่: ${result.honeyPoints}`);
      const grantedUserId = grantUser.id;
      setGrantAmount("");
      setGrantReason("");
      setGrantUser(null);
      void refetch();
      if (selectedUser?.user.id === grantedUserId) {
        void loadUserDetail(grantedUserId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สำเร็จ");
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
      className: "text-right font-bold tabular-nums text-warning",
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
        <span className="inline-flex items-center justify-end gap-1 text-warning">
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
          className="rounded p-1.5 text-warning transition-colors hover:bg-warning-soft"
          title="ให้ Honey"
        >
          <Gift className="size-3.5" />
        </button>
      ),
    },
  ];

  const statCards: Array<{
    label: string;
    value: string;
    icon: typeof Users;
    tone: StatCardTone;
  }> | null = stats
    ? [
        {
          label: "ผู้ใช้ทั้งหมด",
          value: stats.totalUsers.toLocaleString(),
          icon: Users,
          tone: "info",
        },
        {
          label: "Honey หมุนเวียน",
          value: stats.totalHoney.toLocaleString(),
          icon: Award,
          tone: "warning",
        },
        {
          label: "เช็คอินวันนี้",
          value: stats.activeToday.toLocaleString(),
          icon: CalendarCheck,
          tone: "success",
        },
        {
          label: "สมาชิกใหม่สัปดาห์นี้",
          value: stats.newThisWeek.toLocaleString(),
          icon: UserPlus,
          tone: "primary",
        },
      ]
    : null;

  return (
    <AdminPage
      header={
        <AdminPageHeader
          title="ผู้ใช้งาน"
          description="จัดการผู้ใช้ ดูข้อมูล Honey และให้คะแนน"
          icon={Users}
          meta={<Badge variant="secondary">{total.toLocaleString()} คน</Badge>}
        />
      }
    >
      {/* Stat Cards */}
      {statCards && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-1 bg-background/85 px-1 py-2 backdrop-blur supports-backdrop-filter:bg-background/70">
        <AdminToolbar>
          <AdminSearch
            value={search}
            onChange={(v) => patch({ search: v, page: 1 })}
            placeholder="ค้นหาอีเมลหรือชื่อ..."
            className="w-full sm:w-64"
          />
        </AdminToolbar>
      </div>

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
        perPage={PER_PAGE}
        onPageChange={(p) => patch({ page: p })}
      />

      {/* Grant Honey Dialog */}
      <Dialog open={!!grantUser} onOpenChange={(open) => { if (!open) setGrantUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="size-4 text-warning" />
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
                  <div className="status-warning rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {selectedUser.user.honeyPoints.toLocaleString()}
                    </p>
                    <p className="text-meta text-warning/80">Honey</p>
                  </div>
                  <div className="status-info rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold tabular-nums">
                      {selectedUser.user.checkinStreak}
                    </p>
                    <p className="text-meta text-info/80">สตรีค</p>
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
                            tx.amount > 0 ? "text-success" : "text-danger",
                          )}
                        />
                        <span className="flex-1 truncate text-muted-foreground">
                          {tx.reason}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 font-bold tabular-nums",
                            tx.amount > 0 ? "text-success" : "text-danger",
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
                  <Gift className="size-3.5 text-warning" />
                  ให้ Honey
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPage>
  );
}
