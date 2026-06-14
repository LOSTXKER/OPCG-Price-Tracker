import Link from "next/link"
import { ArrowRight, LineChart, Wallet } from "lucide-react"

export default function ProtoIndex() {
  return (
    <div className="px-5 pb-16 pt-14">
      <div className="glow-honey -mx-5 -mt-14 px-5 pb-8 pt-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary)" }}>
          Meecard · VISION
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
          Warm-premium prototype 🐻
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          ธีมหมี + น้ำผึ้ง · near-black อุ่น · honey-gold accent · ตัวเลข tabular · calm บนเงิน
          — เปิดบนมือถือดูจะได้ฟีลเต็ม
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {[
          { href: "/proto/card-detail", icon: LineChart, title: "Card Detail", desc: "5-zone · edition JP/EN · grade rail re-price · sold comps" },
          { href: "/proto/portfolio", icon: Wallet, title: "Portfolio", desc: "hero + finger-scrub · KPI quartet · movers · holdings" },
        ].map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="surface-1 hairline ease-chrome flex items-center gap-4 rounded-2xl p-4 hover:surface-2"
          >
            <span className="surface-2 hairline flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ color: "var(--primary)" }}>
              <p.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-foreground">{p.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{p.desc}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        prototype เท่านั้น · ไม่กระทบแอปจริง · token scoped ใน <code>.proto-root</code>
      </p>
    </div>
  )
}
