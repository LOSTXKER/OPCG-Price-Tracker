"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Loader2,
  Package,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  AlertCircle,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ListingItem = {
  id: number;
  priceJpy: number;
  priceThb: number | null;
  condition: string;
  quantity: number;
  status: string;
  viewCount: number;
  createdAt: string;
  card: {
    cardCode: string;
    nameJp: string;
    nameEn: string | null;
    imageUrl: string | null;
    rarity: string;
    set: {
      code: string;
      name: string;
    };
  };
  _count: {
    offers: number;
    savedBy: number;
  };
};

type ApiResponse = {
  listings: ListingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  statusCounts: Record<string, number>;
};

const STATUS_TABS = [
  { key: "ALL", label: "ทั้งหมด" },
  { key: "ACTIVE", label: "กำลังขาย" },
  { key: "SOLD", label: "ขายแล้ว" },
  { key: "RESERVED", label: "จอง" },
  { key: "CANCELLED", label: "ยกเลิก" },
];

const STATUS_BADGE: Record<string, { label: string; class: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: "กำลังขาย", class: "bg-green-500/15 text-green-700 dark:text-green-400", icon: CheckCircle },
  SOLD: { label: "ขายแล้ว", class: "bg-blue-500/15 text-blue-700 dark:text-blue-400", icon: CheckCircle },
  RESERVED: { label: "จอง", class: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400", icon: AlertCircle },
  EXPIRED: { label: "หมดอายุ", class: "bg-muted text-muted-foreground", icon: XCircle },
  CANCELLED: { label: "ยกเลิก", class: "bg-red-500/15 text-red-700 dark:text-red-400", icon: XCircle },
};

const CONDITION_LABEL: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
};

export default function SellerListingsPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/seller/listings?${params}`);
      if (!res.ok) throw new Error("Failed to load listings");
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleDeactivate = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) await fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (id: number) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (res.ok) await fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ต้องการลบประกาศนี้จริงหรือไม่?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) await fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const totalAll = data
    ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">สินค้าของฉัน</h1>
          <p className="text-sm text-muted-foreground">
            จัดการสินค้าที่คุณลงขาย
          </p>
        </div>
        <Button render={<Link href="/seller/listings/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          ลงขายใหม่
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? totalAll
              : (data?.statusCounts[tab.key] ?? 0);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาด้วยรหัสการ์ดหรือชื่อ..."
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-4 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <Package className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">ไม่พบสินค้า</p>
          <p className="mb-4 text-sm">
            {searchQuery
              ? "ลองค้นหาด้วยคำค้นอื่น"
              : "คุณยังไม่มีสินค้าที่ลงขาย"}
          </p>
          <Button variant="outline" render={<Link href="/seller/listings/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            ลงขายสินค้าแรกของคุณ
          </Button>
        </div>
      ) : (
        <>
          {/* Listings Table */}
          <div className="space-y-2">
            {data.listings.map((listing) => {
              const badge = STATUS_BADGE[listing.status] ?? {
                label: listing.status,
                class: "bg-muted text-muted-foreground",
                icon: AlertCircle,
              };
              const isLoading = actionLoading === listing.id;

              return (
                <div
                  key={listing.id}
                  className="panel flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/20"
                >
                  {/* Card Image */}
                  {listing.card.imageUrl ? (
                    <Image
                      src={listing.card.imageUrl}
                      alt={listing.card.nameEn ?? listing.card.nameJp}
                      width={48}
                      height={67}
                      className="shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-[67px] w-[48px] shrink-0 items-center justify-center rounded bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/marketplace/${listing.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {listing.card.nameEn ?? listing.card.nameJp}
                      </Link>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{listing.card.cardCode}</span>
                      <span>{listing.card.rarity}</span>
                      <span>{CONDITION_LABEL[listing.condition] ?? listing.condition}</span>
                      <span>x{listing.quantity}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {listing.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {listing._count.savedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {listing._count.offers}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">
                      ¥{listing.priceJpy.toLocaleString()}
                    </p>
                    {listing.priceThb != null && (
                      <p className="text-xs text-muted-foreground">
                        ฿{listing.priceThb.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={isLoading}
                        />
                      }
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/seller/listings/${listing.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                        แก้ไข
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/marketplace/${listing.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        ดูหน้าสินค้า
                      </DropdownMenuItem>
                      {listing.status === "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => handleDeactivate(listing.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          ปิดการขาย
                        </DropdownMenuItem>
                      )}
                      {listing.status === "CANCELLED" && (
                        <DropdownMenuItem
                          onClick={() => handleReactivate(listing.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          เปิดขายอีกครั้ง
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        ลบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="text-sm text-muted-foreground">
                หน้า {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
