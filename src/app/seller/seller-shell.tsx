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
import { PageContainer, type PageWidth } from "@/components/layout/page-container";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { t, type Language, type TranslationKey } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

type NavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

/**
 * Narrow-detail seller routes use a single-column layout (forms + record
 * detail). All other seller pages get the default wide dashboard width.
 */
const NARROW_SELLER_ROUTES: ReadonlyArray<RegExp> = [
  /^\/seller\/listings\/new\/?$/,
  /^\/seller\/listings\/[^/]+\/?$/,
  /^\/seller\/orders\/[^/]+\/?$/,
];

function resolveSellerWidth(pathname: string): PageWidth {
  return NARROW_SELLER_ROUTES.some((re) => re.test(pathname)) ? "narrow" : "default";
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/seller", labelKey: "sellShellOverview", icon: LayoutDashboard, exact: true },
  { href: "/seller/listings", labelKey: "sellShellMyListings", icon: Package },
  { href: "/seller/orders", labelKey: "sellShellOrders", icon: ShoppingCart },
  { href: "/seller/reviews", labelKey: "sellShellReviews", icon: Star },
  { href: "/seller/settings", labelKey: "sellShellShopSettings", icon: Settings },
];

function buildBreadcrumbLabels(lang: Language): Record<string, string> {
  return {
    home: t(lang, "home"),
    seller: t(lang, "sellShellSellerCenter"),
    listings: t(lang, "sellShellMyListings"),
    orders: t(lang, "sellShellOrders"),
    reviews: t(lang, "sellShellReviews"),
    settings: t(lang, "sellShellShopSettings"),
    new: t(lang, "sellShellNewListing"),
  };
}

function NavContent({
  pathname,
  lang,
  onNavigate,
}: {
  pathname: string;
  lang: Language;
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ease-chrome ${
                active
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {t(lang, item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors ease-chrome hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t(lang, "sellShellBackToHome")}
      </Link>
    </>
  );
}

export function SellerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lang = useUIStore((s) => s.language);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-hair bg-muted/20 md:flex">
        <div className="sticky top-0 flex h-dvh flex-col p-3">
          <Link href="/" className="mb-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-meta transition-colors ease-chrome hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
          <div className="mb-6 flex items-center gap-2 px-3 pt-1">
            <Store className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">{t(lang, "sellShellSellerCenter")}</span>
          </div>
          <NavContent pathname={pathname} lang={lang} />
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Mobile Header */}
        <header className="sticky top-0 z-chrome flex items-center gap-3 border-b border-hair bg-background px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-3" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Link href="/" className="mb-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-meta transition-colors ease-chrome hover:bg-muted hover:text-foreground" onClick={() => setMobileOpen(false)}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to site
              </Link>
              <div className="mb-4 flex items-center gap-2 px-3 pt-1">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold">{t(lang, "sellShellSellerCenter")}</span>
              </div>
              <NavContent
                pathname={pathname}
                lang={lang}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{t(lang, "sellShellSellerCenter")}</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8">
          <PageContainer inShell width={resolveSellerWidth(pathname)}>
            <Breadcrumb pathname={pathname} labelMap={buildBreadcrumbLabels(lang)} />
            {children}
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
