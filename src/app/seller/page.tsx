"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Package,
  Eye,
  ShoppingCart,
  DollarSign,
  Star,
  Plus,
  ArrowRight,
  Loader2,
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

const STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: "รอชำระ",
  PAID: "ชำระแล้ว",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "ส่งถึงแล้ว",
  COMPLETED: "สำเร็จ",
  CANCELLED: "ยกเลิก",
  DISPUTED: "มีปัญหา",
};

const STATUS_COLOR: Record<string, string> = {
  AWAITING_PAYMENT: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  PAID: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  SHIPPED: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  DELIVERED: "bg-green-500/15 text-green-700 dark:text-green-400",
  COMPLETED: "bg-green-500/15 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-400",
  DISPUTED: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
};

export default function SellerDashboard() {
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
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertCircle className="h-8 w-8" />
        <p>{error ?? "ไม่สามารถโหลดข้อมูลได้"}</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "สินค้าที่ขายอยู่",
      value: stats.activeListings,
      icon: Package,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/seller/listings",
    },
    {
      label: "ยอดเข้าชม",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "คำสั่งซื้อทั้งหมด",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      href: "/seller/orders",
    },
    {
      label: "รายได้ทั้งหมด",
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "คะแนนร้าน",
      value: stats.avgRating != null ? stats.avgRating.toFixed(1) : "—",
      sub: stats.reviewCount > 0 ? `${stats.reviewCount} รีวิว` : "ยังไม่มีรีวิว",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/seller/reviews",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ภาพรวมร้าน</h1>
          <p className="text-sm text-muted-foreground">
            จัดการสินค้าและติดตามยอดขายของคุณ
          </p>
        </div>
        <Button render={<Link href="/seller/listings/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          ลงขายสินค้า
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-lg font-bold">{card.value}</p>
                {card.sub && (
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                )}
              </div>
            </div>
          );
          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className="panel rounded-xl p-4 transition-colors hover:bg-muted/30"
            >
              {content}
            </Link>
          ) : (
            <div
              key={card.label}
              className="panel rounded-xl p-4 transition-colors hover:bg-muted/30"
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Pending Actions */}
      {stats.pendingOrders > 0 && (
        <div className="panel rounded-xl border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/15">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="font-medium">มีคำสั่งซื้อรอดำเนินการ</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingOrders} รายการที่ต้องตรวจสอบ
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/seller/orders" />}>
              ดูทั้งหมด
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="panel rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">คำสั่งซื้อล่าสุด</h2>
          <Link
            href="/seller/orders"
            className="text-sm text-primary hover:underline"
          >
            ดูทั้งหมด
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ShoppingCart className="mb-3 h-10 w-10 opacity-40" />
            <p className="font-medium">ยังไม่มีคำสั่งซื้อ</p>
            <p className="text-sm">คำสั่งซื้อจะปรากฏที่นี่เมื่อมีผู้ซื้อ</p>
          </div>
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
                  <p className="text-xs text-muted-foreground">
                    {order.listing.card.cardCode} • ผู้ซื้อ: {order.buyer.displayName ?? "ผู้ใช้"}
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
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/seller/listings"
          className="panel flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
            <Package className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="font-semibold">จัดการสินค้า</p>
            <p className="text-sm text-muted-foreground">
              ดู แก้ไข หรือลบสินค้าที่ลงขายอยู่ ({stats.totalListings} รายการ)
            </p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </Link>
        <Link
          href="/seller/listings/new"
          className="panel flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
            <Plus className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="font-semibold">ลงขายสินค้าใหม่</p>
            <p className="text-sm text-muted-foreground">
              สร้างประกาศขายการ์ดของคุณ
            </p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
