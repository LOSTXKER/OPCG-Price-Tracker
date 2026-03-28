"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Globe,
  LogOut,
  Moon,
  Search,
  Star,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

import { CommandSearchModal } from "@/components/shared/command-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useUIStore, type Language, type Currency } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "ภาพรวม" },
  { href: "/sets", label: "ชุดการ์ด" },
  { href: "/pull-calculator", label: "คำนวณดรอปเรท" },
  { href: "/marketplace", label: "ซื้อขาย" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AuthUser = {
  email?: string;
  user_metadata?: { avatar_url?: string; full_name?: string };
};

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: "TH", label: "ไทย" },
  { value: "EN", label: "English" },
  { value: "JP", label: "日本語" },
];

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "THB", label: "฿ THB" },
  { value: "JPY", label: "¥ JPY" },
  { value: "USD", label: "$ USD" },
];

const CURRENCY_SYMBOL: Record<Currency, string> = { THB: "฿", JPY: "¥", USD: "$" };

export function Header() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const currency = useUIStore((s) => s.currency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user ?? null);
      setAuthLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoaded(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
    <header className="sticky top-0 z-50 hidden border-b border-border/60 bg-background/80 backdrop-blur-xl md:block">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-14 items-center">
          {/* Logo */}
          <Link href="/" className="mr-8 flex shrink-0 items-center gap-2">
            <Image
              src="/meecard.png"
              alt="Meecard"
              width={28}
              height={28}
              className="shrink-0 select-none"
              priority
            />
            <span className="text-base font-bold tracking-tight">Meecard</span>
          </Link>

          {/* Left nav */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-foreground" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Portfolio */}
            <Link
              href="/portfolio"
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                isActive(pathname, "/portfolio")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="size-3.5" />
              พอร์ตโฟลิโอ
            </Link>

            {/* Watchlist */}
            <Link
              href="/watchlist"
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                isActive(pathname, "/watchlist")
                  ? "text-amber-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className={cn("size-3.5", isActive(pathname, "/watchlist") && "fill-current")} />
              รายการโปรด
            </Link>

            {/* Search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-40 items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-muted-foreground/50 transition-colors hover:bg-muted/50 lg:w-48"
            >
              <Search className="size-3.5 shrink-0" />
              <span className="flex-1 text-left text-xs">ค้นหา...</span>
              <kbd className="rounded border border-border/50 bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/40">/</kbd>
            </button>

            {/* Profile / Auth — includes settings */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:outline-none">
                {authLoaded && authUser ? (
                  <Avatar size="sm">
                    {authUser.user_metadata?.avatar_url ? (
                      <AvatarImage src={authUser.user_metadata.avatar_url} alt="" />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {(authUser.user_metadata?.full_name ?? authUser.email ?? "U")
                        .slice(0, 1)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="size-3.5" />
                )}
                <span className="text-xs font-medium">{language}</span>
                <span className="text-border">·</span>
                <span className="text-xs font-medium">{CURRENCY_SYMBOL[currency]} {currency}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-48">
                {authLoaded && authUser && (
                  <>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <p className="truncate text-xs text-muted-foreground">
                          {authUser.email}
                        </p>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="size-4" />
                      โปรไฟล์
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <Globe className="size-4" />
                    ภาษา
                    <span className="ml-auto text-xs text-muted-foreground">{language}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={language} onValueChange={(v) => setLanguage(v as Language)}>
                      {LANG_OPTIONS.map((l) => (
                        <DropdownMenuRadioItem key={l.value} value={l.value}>
                          {l.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <span className="flex size-4 items-center justify-center font-price text-xs font-bold">¤</span>
                    สกุลเงิน
                    <span className="ml-auto text-xs text-muted-foreground">{currency}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                      {CURRENCY_OPTIONS.map((c) => (
                        <DropdownMenuRadioItem key={c.value} value={c.value}>
                          {c.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="gap-2">
                  {mounted && resolvedTheme === "dark" ? (
                    <Sun className="size-4" />
                  ) : (
                    <Moon className="size-4" />
                  )}
                  {mounted && resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>

                {authLoaded && authUser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => void handleLogout()}
                    >
                      <LogOut className="size-4" />
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </>
                )}

                {!authUser && authLoaded && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/login")}>
                      <User className="size-4" />
                      เข้าสู่ระบบ
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

    <CommandSearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
