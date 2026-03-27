"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  CreditCard,
  BarChart3,
  LogOut,
  Shield,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/sets", label: "Sets", icon: Library },
  { href: "/admin/cards", label: "Cards", icon: CreditCard },
  { href: "/admin/drop-rates", label: "Drop Rates", icon: BarChart3 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin-login");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/50 bg-muted/20 md:flex">
        <div className="sticky top-0 flex h-dvh flex-col p-3">
          <div className="mb-6 flex items-center gap-2 px-3 pt-2">
            <Shield className="h-5 w-5 text-destructive" />
            <span className="text-sm font-bold">Admin Panel</span>
          </div>

          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-6 md:pb-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] transition-colors ${
                active ? "font-medium text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
