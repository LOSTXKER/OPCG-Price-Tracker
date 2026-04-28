"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import {
  Package,
  Eye,
  ShoppingCart,
  DollarSign,
  Star,
  Plus,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Stats = {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalViews: number;
  avgRating: number | null;
  reviewCount: number;
  recentOrders: RecentOrder[];
};

type RecentOrder = {
  id: number;
  status: string;
  priceThb: number;
  createdAt: string;
  listing: {
    card: {
      cardCode: string;
      nameEn: string | null;
      nameJp: string;
      imageUrl: string | null;
    };
  };
  buyer: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
};

const STATUS_LABEL_KEY: Record<string, "orderStatusAwaitingPayment" | "orderStatusPaidExt" | "orderStatusShippedExt" | "orderStatusDelivered" | "orderStatusCompleted" | "orderStatusCancelled" | "orderStatusDisputed"> = {
  AWAITING_PAYMENT: "orderStatusAwaitingPayment",
  PAID: "orderStatusPaidExt",
  SHIPPED: "orderStatusShippedExt",
  DELIVERED: "orderStatusDelivered",
  COMPLETED: "orderStatusCompleted",
  CANCELLED: "orderStatusCancelled",
  DISPUTED: "orderStatusDisputed",
};

const STATUS_COLOR: Record<string, string> = {
  AWAITING_PAYMENT: "bg-warning-soft text-warning",
  PAID: "bg-info-soft text-info",
  SHIPPED: "bg-info-soft text-info",
  DELIVERED: "bg-success-soft text-success",
  COMPLETED: "bg-success-soft text-success",
  CANCELLED: "bg-danger-soft text-danger",
  DISPUTED: "bg-warning-soft text-warning",
};

export default function SellerDashboard() {
  const lang = useUIStore((s) => s.language);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seller/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then((data) => setStats(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingState variant="spinner" />;
  }

  if (error || !stats) {
    return (
      <EmptyState
        variant="error"
        icon={AlertCircle}
        title={error ?? t(lang, "sellerLoadFailed")}
      />
    );
  }

  const statCards = [
    {
      label: t(lang, "sellerStatActiveListings"),
      value: stats.activeListings,
      icon: Package,
      href: "/seller/listings",
    },
    {
      label: t(lang, "sellerStatTotalViews"),
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
    },
    {
      label: t(lang, "sellerStatTotalOrders"),
      value: stats.totalOrders,
      icon: ShoppingCart,
      href: "/seller/orders",
    },
    {
      label: t(lang, "sellerStatTotalRevenue"),
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      tone: "primary" as const,
    },
    {
      label: t(lang, "sellerStatRating"),
      value: stats.avgRating != null ? stats.avgRating.toFixed(1) : "—",
      sub: stats.reviewCount > 0
        ? t(lang, "sellerStatReviewsCount").replace("{n}", String(stats.reviewCount))
        : t(lang, "sellerStatNoReviews"),
      icon: Star,
      href: "/seller/reviews",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "sellerDashboardTitle")}
        description={t(lang, "sellerDashboardDesc")}
        actions={
          <Button render={<Link href="/seller/listings/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            {t(lang, "sellerListSell")}
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const inner = (
            <StatCard
              label={card.label}
              value={card.value}
              sub={card.sub}
              icon={card.icon}
              tone={card.tone}
              className="h-full transition-colors hover:bg-muted/30"
            />
          );
          return card.href ? (
            <Link key={card.label} href={card.href} className="block">{inner}</Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      {/* Pending Actions */}
      {stats.pendingOrders > 0 && (
        <Surface variant="subtle" padding="md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-soft">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">{t(lang, "sellerPendingOrdersTitle")}</p>
                <p className="text-meta text-muted-foreground">
                  {t(lang, "sellerPendingOrdersDesc").replace("{n}", String(stats.pendingOrders))}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/seller/orders" />}>
              {t(lang, "viewAll")}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </Surface>
      )}

      {/* Recent Orders */}
      <Surface variant="panel" padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-h3">{t(lang, "sellerRecentOrders")}</h2>
          <Link
            href="/seller/orders"
            className="text-sm text-primary hover:underline"
          >
            {t(lang, "viewAll")}
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <EmptyState
            variant="plain"
            icon={ShoppingCart}
            title={t(lang, "noOrdersYet")}
            description={t(lang, "sellerNoOrdersDesc")}
            size="sm"
          />
        ) : (
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
              >
                {order.listing.card.imageUrl && (
                  <Image
                    src={order.listing.card.imageUrl}
                    alt={order.listing.card.nameEn ?? order.listing.card.nameJp}
                    width={40}
                    height={56}
                    className="rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {order.listing.card.nameEn ?? order.listing.card.nameJp}
                  </p>
                  <p className="text-meta">
                    {order.listing.card.cardCode} • {t(lang, "buyer")}: {order.buyer.displayName ?? t(lang, "user")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold">
                    ฿{order.priceThb.toLocaleString()}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_COLOR[order.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABEL_KEY[order.status] ? t(lang, STATUS_LABEL_KEY[order.status]) : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Surface>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/seller/listings"
          className="panel flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{t(lang, "sellerManageListings")}</p>
            <p className="text-sm text-muted-foreground">
              {t(lang, "sellerManageListingsDesc").replace("{n}", String(stats.totalListings))}
            </p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </Link>
        <Link
          href="/seller/listings/new"
          className="panel flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{t(lang, "sellerNewListing")}</p>
            <p className="text-sm text-muted-foreground">
              {t(lang, "sellerNewListingDesc")}
            </p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
