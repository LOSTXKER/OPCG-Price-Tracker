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
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Surface } from "@/components/ui/surface";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { t, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { apiDelete, apiGet, apiPatch, apiTry } from "@/lib/api/client";

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

const STATUS_TABS: ReadonlyArray<{ key: string; labelKey: TranslationKey }> = [
  { key: "ALL", labelKey: "orderStatusAll" },
  { key: "ACTIVE", labelKey: "listingStatusActive" },
  { key: "SOLD", labelKey: "listingStatusSold" },
  { key: "RESERVED", labelKey: "listingStatusReserved" },
  { key: "CANCELLED", labelKey: "listingStatusCancelled" },
];

const STATUS_BADGE: Record<string, { labelKey: TranslationKey; class: string; icon: typeof CheckCircle }> = {
  ACTIVE: { labelKey: "listingStatusActive", class: "bg-success-soft text-success", icon: CheckCircle },
  SOLD: { labelKey: "listingStatusSold", class: "bg-info-soft text-info", icon: CheckCircle },
  RESERVED: { labelKey: "listingStatusReserved", class: "bg-warning-soft text-warning", icon: AlertCircle },
  EXPIRED: { labelKey: "listingStatusExpired", class: "bg-muted text-muted-foreground", icon: XCircle },
  CANCELLED: { labelKey: "listingStatusCancelled", class: "bg-danger-soft text-danger", icon: XCircle },
};

const CONDITION_LABEL: Record<string, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
};

export default function SellerListingsPage() {
  const lang = useUIStore((s) => s.language);
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (activeTab !== "ALL") params.set("status", activeTab);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());

    const json = await apiTry(apiGet<ApiResponse>(`/api/seller/listings?${params}`));
    setData(json);
    setLoading(false);
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
      const ok = await apiTry(apiPatch(`/api/listings/${id}`, { status: "CANCELLED" }));
      if (ok !== null) await fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (id: number) => {
    setActionLoading(id);
    try {
      const ok = await apiTry(apiPatch(`/api/listings/${id}`, { status: "ACTIVE" }));
      if (ok !== null) await fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t(lang, "sellListDeleteConfirm"))) return;
    setActionLoading(id);
    try {
      const ok = await apiTry(apiDelete(`/api/listings/${id}`));
      if (ok !== null) await fetchListings();
    } finally {
      setActionLoading(null);
    }
  };

  const totalAll = data
    ? Object.values(data.statusCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "sellerListingsTitle")}
        description={t(lang, "sellerListingsDesc")}
        actions={
          <Button render={<Link href="/seller/listings/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            {t(lang, "sellerListingNew")}
          </Button>
        }
      />

      <div className="overflow-x-auto">
        <SegmentedControl
          value={activeTab}
          onChange={handleTabChange}
          ariaLabel="Filter listings by status"
          options={STATUS_TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? totalAll
                : (data?.statusCounts[tab.key] ?? 0);
            return {
              value: tab.key,
              label: t(lang, tab.labelKey),
              badge:
                count > 0 ? (
                  <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums">
                    {count}
                  </span>
                ) : undefined,
            };
          })}
        />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(lang, "searchByCardCodeOrName")}
          className="h-10 w-full rounded-lg border border-[var(--p-hair)] bg-background pl-9 pr-4 text-sm transition-colors ease-chrome placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>

      {/* Content */}
      {loading ? (
        <LoadingState variant="spinner" label={t(lang, "loading")} />
      ) : !data || data.listings.length === 0 ? (
        <KumaEmptyState
          variant="dashed"
          icon={Package}
          title={t(lang, "noListingsFound")}
          description={
            searchQuery
              ? t(lang, "noListingsTrySearch")
              : t(lang, "sellerNoListingsYet")
          }
          action={
            <Button variant="outline" render={<Link href="/seller/listings/new" />}>
              <Plus className="mr-2 h-4 w-4" />
              {t(lang, "listFirstItem")}
            </Button>
          }
        />
      ) : (
        <>
          {/* Listings Table */}
          <div className="space-y-2">
            {data.listings.map((listing) => {
              const badge = STATUS_BADGE[listing.status];
              const badgeLabel = badge ? t(lang, badge.labelKey) : listing.status;
              const badgeClass = badge?.class ?? "bg-muted text-muted-foreground";
              const isLoading = actionLoading === listing.id;

              return (
                <Surface
                  key={listing.id}
                  variant="panel"
                  padding="sm"
                  interactive
                  className="flex items-center gap-4 transition-colors ease-chrome"
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
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-meta">
                      <span>{listing.card.cardCode}</span>
                      <span>{listing.card.rarity}</span>
                      <span>{CONDITION_LABEL[listing.condition] ?? listing.condition}</span>
                      <span>x{listing.quantity}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-meta">
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
                      <p className="text-meta">
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
                        {t(lang, "edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/marketplace/${listing.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                        {t(lang, "viewListing")}
                      </DropdownMenuItem>
                      {listing.status === "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => handleDeactivate(listing.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          {t(lang, "deactivateListing")}
                        </DropdownMenuItem>
                      )}
                      {listing.status === "CANCELLED" && (
                        <DropdownMenuItem
                          onClick={() => handleReactivate(listing.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t(lang, "reactivateListing")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t(lang, "delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Surface>
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
                {t(lang, "previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t(lang, "paginationPageOf").replace("{page}", String(data.page)).replace("{total}", String(data.totalPages))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t(lang, "next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
