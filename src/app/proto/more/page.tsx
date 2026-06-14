"use client"

import Link from "next/link"
import {
  Bell, Calculator, Crown, Heart, Layers, ListChecks, MessageSquare,
  Sparkles, Settings, ShieldCheck, Tag, Target, Trophy, User, type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tile = { label: string; icon: LucideIcon; href: string; pro?: boolean }
type Group = { eyebrow: string; tiles: Tile[] }

const GROUPS: Group[] = [
  {
    eyebrow: "Play",
    tiles: [
      { label: "Deck Builder", icon: Layers, href: "/proto/card-detail" },
      { label: "Meta / Tier", icon: Trophy, href: "/proto/card-detail" },
      { label: "Missions", icon: Target, href: "/proto/card-detail" },
      { label: "Honey", icon: Sparkles, href: "/proto/card-detail" },
    ],
  },
  {
    eyebrow: "Track",
    tiles: [
      { label: "Watchlist", icon: Heart, href: "/proto/card-detail" },
      { label: "Wishlist", icon: ListChecks, href: "/proto/card-detail" },
      { label: "Drop Calc", icon: Calculator, href: "/proto/card-detail" },
      { label: "Alerts", icon: Bell, href: "/proto/card-detail" },
    ],
  },
  {
    eyebrow: "Trade",
    tiles: [
      { label: "Sell / List", icon: Tag, href: "/proto/marketplace" },
      { label: "My Listings", icon: ListChecks, href: "/proto/marketplace" },
      { label: "Orders", icon: ShieldCheck, href: "/proto/marketplace" },
      { label: "Escrow", icon: ShieldCheck, href: "/proto/marketplace" },
      { label: "Inbox", icon: MessageSquare, href: "/proto/marketplace" },
    ],
  },
  {
    eyebrow: "Account",
    tiles: [
      { label: "Profile", icon: User, href: "/proto/portfolio" },
      { label: "Meecard Pro", icon: Crown, href: "/proto/portfolio", pro: true },
      { label: "Settings", icon: Settings, href: "/proto/portfolio" },
    ],
  },
]

export default function ProtoMore() {
  return (
    <div className="mx-auto max-w-[460px] pb-12 lg:max-w-5xl">
      <div className="px-4 pt-5 lg:px-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">เพิ่มเติม</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">ทุกเครื่องมือ · จัดกลุ่มให้หาง่าย</p>
      </div>

      <div className="mt-5 space-y-7 px-4 lg:px-8">
        {GROUPS.map((g) => (
          <section key={g.eyebrow}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.eyebrow}
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5 lg:grid-cols-6">
              {g.tiles.map((t) => (
                <TileButton key={t.label} tile={t} />
              ))}
            </div>
          </section>
        ))}

        <p className="pt-1 text-center text-[11px] text-muted-foreground">
          prototype · VISION More hub
        </p>
      </div>
    </div>
  )
}

function TileButton({ tile }: { tile: Tile }) {
  const { icon: Icon, label, href, pro } = tile
  return (
    <Link
      href={href}
      className={cn(
        "ease-chrome surface-1 hairline flex aspect-square min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 hover:brightness-110",
      )}
      style={pro ? { background: "var(--p-honey-soft)" } : undefined}
    >
      <Icon className="size-5" style={{ color: "var(--primary)" }} />
      <span className="text-center text-[11px] font-medium leading-tight text-foreground">
        {label}
      </span>
    </Link>
  )
}
