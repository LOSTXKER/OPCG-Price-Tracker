"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Library,
  CreditCard,
  BarChart3,
  ArrowLeft,
  ArrowLeftRight,
  Globe,
  ImageIcon,
  Award,
  LogOut,
  Shield,
  Settings,
  ScrollText,
  FileText,
  Menu,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { createClient } from "@/lib/supabase/client";

const NAV_SECTIONS = [
  {
    label: "Data",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/sets", label: "Sets", icon: Library },
      { href: "/admin/cards", label: "Cards", icon: CreditCard },
      { href: "/admin/drop-rates", label: "Drop Rates", icon: BarChart3 },
    ],
  },
  {
    label: "Matching",
    items: [
      { href: "/admin/yuyutei-matching", label: "Yuyutei", icon: ArrowLeftRight },
      { href: "/admin/snkrdunk-matching", label: "SNKRDUNK", icon: Globe },
      { href: "/admin/image-matching", label: "Images", icon: ImageIcon },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/honey", label: "Honey", icon: Award },
      { href: "/admin/blog", label: "Blog", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/config", label: "Config", icon: Settings },
      { href: "/admin/logs", label: "Audit Logs", icon: ScrollText },
    ],
  },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: "Admin",
  sets: "Sets",
  cards: "Cards",
  "drop-rates": "Drop Rates",
  "yuyutei-matching": "Yuyutei Matching",
  "snkrdunk-matching": "SNKRDUNK Matching",
  "image-matching": "Image Matching",
  honey: "Honey",
  blog: "Blog",
  config: "Config",
  logs: "Audit Logs",
  shop: "Shop",
  users: "Users",
  achievements: "Achievements",
  raffle: "Raffle",
  events: "Events",
  new: "New",
};

function NavContent({
  pathname,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav className="flex-1 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin-login");
    router.refresh();
  };

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
            <Shield className="h-5 w-5 text-destructive" />
            <span className="text-sm font-bold">Admin Panel</span>
          </div>
          <NavContent
            pathname={pathname}
            onLogout={() => void handleLogout()}
          />
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
                <Shield className="h-5 w-5 text-destructive" />
                <span className="text-sm font-bold">Admin Panel</span>
              </div>
              <NavContent
                pathname={pathname}
                onLogout={() => void handleLogout()}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold">Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Breadcrumb pathname={pathname} labelMap={BREADCRUMB_LABELS} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
