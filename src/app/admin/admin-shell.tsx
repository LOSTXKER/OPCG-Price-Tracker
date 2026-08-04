"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { createClient } from "@/lib/supabase/client";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "ข้อมูล",
    items: [
      { href: "/admin", label: "แดชบอร์ด", icon: LayoutDashboard, exact: true },
      { href: "/admin/sets", label: "ชุดการ์ด", icon: Library },
      { href: "/admin/cards", label: "การ์ด", icon: CreditCard },
      { href: "/admin/drop-rates", label: "อัตราดรอป", icon: BarChart3 },
    ],
  },
  {
    label: "การจับคู่",
    items: [
      { href: "/admin/yuyutei-matching", label: "Yuyutei", icon: ArrowLeftRight },
      { href: "/admin/snkrdunk-matching", label: "SNKRDUNK", icon: Globe },
      { href: "/admin/image-matching", label: "รูปภาพ", icon: ImageIcon },
    ],
  },
  {
    label: "เนื้อหา",
    items: [
      { href: "/admin/honey", label: "Honey", icon: Award },
      { href: "/admin/blog", label: "Blog", icon: FileText },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { href: "/admin/users", label: "ผู้ใช้", icon: Users },
      { href: "/admin/config", label: "การตั้งค่า", icon: Settings },
      { href: "/admin/logs", label: "บันทึกระบบ", icon: ScrollText },
    ],
  },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  home: "หน้าแรก",
  admin: "แอดมิน",
  sets: "ชุดการ์ด",
  cards: "การ์ด",
  "drop-rates": "อัตราดรอป",
  "yuyutei-matching": "จับคู่ Yuyutei",
  "snkrdunk-matching": "จับคู่ SNKRDUNK",
  "image-matching": "จับคู่รูปภาพ",
  honey: "Honey",
  blog: "บล็อก",
  config: "การตั้งค่า",
  logs: "บันทึกระบบ",
  shop: "ร้านค้า",
  users: "ผู้ใช้",
  achievements: "ความสำเร็จ",
  raffle: "สุ่มรางวัล",
  events: "อีเวนต์",
  ranks: "ระดับแรงค์",
  new: "สร้างใหม่",
};

/* ── Nav Content ── */

function NavContent({
  pathname,
  collapsed,
  onLogout,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-eyebrow text-muted-foreground/50">
                {section.label}
              </p>
            )}
            {collapsed && (
              <div className="mx-auto my-2 h-px w-6 bg-border/30" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg text-sm motion-base",
                      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                      active
                        ? "bg-primary/15 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "shrink-0 motion-base",
                        collapsed ? "size-5" : "size-4",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={cn("space-y-1 border-t border-hair pt-3", collapsed && "flex flex-col items-center")}>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "ออกจากระบบ" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm text-muted-foreground motion-base hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "justify-center p-2.5" : "w-full gap-3 px-3 py-2",
          )}
        >
          <LogOut className={collapsed ? "size-5" : "size-4"} />
          {!collapsed && "ออกจากระบบ"}
        </button>
      </div>
    </>
  );
}

/* ── Theme Toggle ── */

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();

  if (!mounted) return null;

  const isDark = theme === "dark";
  const label = isDark ? "โหมดสว่าง" : "โหมดมืด";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg text-sm text-muted-foreground motion-base hover:bg-muted hover:text-foreground",
        collapsed ? "justify-center p-2.5" : "w-full px-3 py-2",
      )}
    >
      {isDark ? (
        <Sun className={collapsed ? "size-5" : "size-4"} />
      ) : (
        <Moon className={collapsed ? "size-5" : "size-4"} />
      )}
      {!collapsed && label}
    </button>
  );
}

/* ── Shell ── */

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Async tick keeps the setState out of the synchronous effect body
    // (react-hooks/set-state-in-effect) while staying hydration-safe —
    // the server cannot know the stored preference.
    const id = window.setTimeout(() => {
      if (localStorage.getItem("admin-sidebar-collapsed") === "true") setCollapsed(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin-login");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-hair bg-muted/10 transition-[width] duration-[var(--dur-base)] md:flex",
          collapsed ? "w-[60px]" : "w-56",
        )}
      >
        <div className="sticky top-0 flex h-dvh flex-col p-2">
          {/* Back link */}
          <Link
            href="/"
            title={collapsed ? "กลับไปหน้าเว็บไซต์" : undefined}
            className={cn(
              "mb-1 flex items-center rounded-lg text-muted-foreground/60 motion-base hover:bg-muted hover:text-foreground",
              collapsed ? "justify-center p-2" : "gap-2 px-3 py-1.5 text-xs",
            )}
          >
            <ArrowLeft className={collapsed ? "size-4" : "size-3.5"} />
            {!collapsed && "กลับไปหน้าเว็บไซต์"}
          </Link>

          {/* Logo */}
          <div
            className={cn(
              "mb-5 flex items-center gap-2.5 pt-1",
              collapsed ? "justify-center px-0" : "px-3",
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="size-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="text-sm font-bold tracking-tight">แผงแอดมิน</span>
              </div>
            )}
          </div>

          <NavContent
            pathname={pathname}
            collapsed={collapsed}
            onLogout={() => void handleLogout()}
          />

          {/* Theme + Collapse */}
          <div className={cn("space-y-1 border-t border-hair pt-2", collapsed && "flex flex-col items-center")}>
            <ThemeToggle collapsed={collapsed} />

            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? "ขยายเมนู" : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm text-muted-foreground/60 motion-base hover:bg-muted hover:text-foreground",
                collapsed ? "justify-center p-2.5" : "w-full gap-3 px-3 py-2",
              )}
            >
              {collapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <>
                  <PanelLeftClose className="size-4" />
                  ย่อเมนู
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Mobile Header */}
        <header className="sticky top-0 z-chrome flex items-center gap-3 border-b border-hair bg-background px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-3" showCloseButton={false}>
              <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
              <Link
                href="/"
                className="mb-1 flex items-center gap-2 rounded-lg px-3 py-1.5 text-meta motion-base hover:bg-muted hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                <ArrowLeft className="size-3.5" />
                กลับไปหน้าเว็บไซต์
              </Link>
              <div className="mb-5 flex items-center gap-2.5 px-3 pt-1">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="size-4 text-primary" />
                </div>
                <span className="text-sm font-bold tracking-tight">แผงแอดมิน</span>
              </div>
              <NavContent
                pathname={pathname}
                collapsed={false}
                onLogout={() => void handleLogout()}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="size-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">แอดมิน</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <PageContainer inShell>
            <Breadcrumb pathname={pathname} labelMap={BREADCRUMB_LABELS} />
            {children}
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
