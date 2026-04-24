"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Settings,
  Menu,
  Store,
  ArrowLeft,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/shared/breadcrumb";

const NAV_ITEMS = [
  { href: "/seller", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/seller/listings", label: "สินค้าของฉัน", icon: Package },
  { href: "/seller/orders", label: "คำสั่งซื้อ", icon: ShoppingCart },
  { href: "/seller/reviews", label: "รีวิว", icon: Star },
  { href: "/seller/settings", label: "ตั้งค่าร้าน", icon: Settings },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  seller: "ศูนย์ผู้ขาย",
  listings: "สินค้าของฉัน",
  orders: "คำสั่งซื้อ",
  reviews: "รีวิว",
  settings: "ตั้งค่าร้าน",
  new: "ลงขายใหม่",
};

function NavContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับหน้าหลัก
      </Link>
    </>
  );
}

export function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/50 bg-muted/20 md:flex">
        <div className="sticky top-0 flex h-dvh flex-col p-3">
          <Link href="/" className="mb-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
          <div className="mb-6 flex items-center gap-2 px-3 pt-1">
            <Store className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">ศูนย์ผู้ขาย</span>
          </div>
          <NavContent pathname={pathname} />
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-3" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Link href="/" className="mb-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" onClick={() => setMobileOpen(false)}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to site
              </Link>
              <div className="mb-4 flex items-center gap-2 px-3 pt-1">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold">ศูนย์ผู้ขาย</span>
              </div>
              <NavContent
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">ศูนย์ผู้ขาย</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb pathname={pathname} labelMap={BREADCRUMB_LABELS} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
