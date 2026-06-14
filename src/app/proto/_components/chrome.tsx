"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Menu, Search, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/proto", label: "หน้าแรก", exact: true },
  { href: "/proto/browse", label: "ราคา" },
  { href: "/proto/marketplace", label: "ตลาด" },
  { href: "/proto/portfolio", label: "พอร์ต" },
  { href: "/proto/more", label: "เพิ่มเติม" },
]

function isActive(path: string, href: string, exact?: boolean) {
  return exact ? path === href : path === href || path.startsWith(href + "/")
}

/** Game switcher pill — exported in case a page wants it inline. */
export function GameSwitcher({ className }: { className?: string }) {
  return (
    <button className={cn("surface-2 hairline flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold", className)}>
      <span className="size-2 rounded-full" style={{ background: "#d8453a" }} />
      One Piece
      <ChevronDown className="size-3.5 text-muted-foreground" />
    </button>
  )
}

/**
 * Top navigation bar — desktop-web first, fully responsive. Content is PUBLIC
 * (no login wall, SEO-friendly): "เข้าสู่ระบบ / สมัคร" are optional actions on
 * the right, never a gate. Mobile collapses the links into a menu sheet.
 */
function TopNav() {
  const path = usePathname() ?? "/proto"
  const [open, setOpen] = useState(false)

  return (
    <header className="frost sticky top-0 z-40" style={{ boxShadow: "inset 0 -1px 0 0 var(--p-hair)" }}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 lg:px-8">
        {/* logo */}
        <Link href="/proto" className="flex items-center gap-2 pr-2">
          <span className="text-xl">🐻</span>
          <span className="text-lg font-extrabold tracking-tight text-foreground">Meecard</span>
        </Link>

        {/* desktop nav links */}
        <nav className="ml-2 hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => {
            const active = isActive(path, n.href, n.exact)
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn("ease-chrome rounded-lg px-3 py-2 text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                style={active ? { background: "var(--p-honey-soft)", color: "var(--primary)" } : undefined}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* search — full field on desktop, icon on mobile */}
        <Link href="/proto/browse" className="surface-2 hairline ease-chrome hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground sm:flex lg:w-64">
          <Search className="size-4 shrink-0" />
          <span className="truncate">ค้นการ์ด · เซ็ต...</span>
        </Link>
        <Link href="/proto/browse" className="flex size-9 items-center justify-center rounded-full surface-2 hairline sm:hidden">
          <Search className="size-4" />
        </Link>

        <GameSwitcher className="hidden lg:flex" />

        {/* auth — optional, not a wall */}
        <div className="hidden items-center gap-1.5 md:flex">
          <button className="ease-chrome rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">เข้าสู่ระบบ</button>
          <button className="ease-chrome rounded-lg px-3.5 py-2 text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>สมัครฟรี</button>
        </div>

        {/* mobile menu toggle */}
        <button onClick={() => setOpen((v) => !v)} className="flex size-9 items-center justify-center rounded-full surface-2 hairline md:hidden">
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* mobile menu sheet */}
      {open && (
        <div className="md:hidden" style={{ boxShadow: "inset 0 1px 0 0 var(--p-hair)" }}>
          <nav className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-3">
            {NAV.map((n) => {
              const active = isActive(path, n.href, n.exact)
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={cn("rounded-xl px-3 py-2.5 text-sm font-semibold", active ? "surface-2 hairline" : "text-muted-foreground")}
                  style={active ? { color: "var(--primary)" } : undefined}
                >
                  {n.label}
                </Link>
              )
            })}
            <div className="mt-2 flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--p-hair)" }}>
              <GameSwitcher />
              <div className="flex-1" />
              <button className="text-sm font-semibold text-muted-foreground">เข้าสู่ระบบ</button>
              <button className="rounded-lg px-3 py-1.5 text-sm font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>สมัครฟรี</button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

/** Wraps every prototype page with the top navbar (no sidebar, no bottom-nav). */
export function ProtoChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      <main className="min-w-0">{children}</main>
      <ProFooterHint />
    </>
  )
}

/** A calm footer strip — reinforces "browse free, no login needed". */
function ProFooterHint() {
  return (
    <footer className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 border-t pt-6 text-xs text-muted-foreground" style={{ borderColor: "var(--p-hair)" }}>
        <Sparkles className="size-3.5" style={{ color: "var(--primary)" }} />
        ดูราคา · ตลาด · การ์ดทั้งหมดได้ฟรี ไม่ต้องสมัคร · เข้าสู่ระบบเมื่ออยากบันทึก portfolio หรือซื้อขาย
      </div>
    </footer>
  )
}
