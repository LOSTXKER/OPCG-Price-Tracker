import Link from "next/link"
import { getHomeData, mapCardToTrending, type TrendingCard } from "@/lib/data/home"
import { Delta, FoilThumb, Panel } from "@/components/v2/ui"

export const revalidate = 300

const yen = (n: number | null) => (n == null ? "—" : "¥" + n.toLocaleString("en-US"))
const cardName = (c: TrendingCard) => c.nameEn ?? c.nameJp

function CardRow({ c, rank, i = 0 }: { c: TrendingCard; rank?: number; i?: number }) {
  return (
    <Link
      href={`/cards/${encodeURIComponent(c.cardCode)}`}
      className="ease-chrome flex items-center gap-3 px-3 py-2.5 hover:surface-2"
      style={i ? { boxShadow: "inset 0 1px 0 0 var(--v-hair)" } : undefined}
    >
      {rank != null && <span className="tnum w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">{rank}</span>}
      <FoilThumb src={c.imageUrl} alt={cardName(c)} className="w-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{cardName(c)}</p>
        <p className="text-[11px] text-muted-foreground">{c.set?.code ?? ""} · {c.rarity}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tnum text-sm font-bold text-foreground">{yen(c.priceJpy)}</p>
        <Delta pct={c.priceChange24h} className="justify-end" />
      </div>
    </Link>
  )
}

function Column({ title, cards, ranked }: { title: string; cards: TrendingCard[]; ranked?: boolean }) {
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 py-3" style={{ boxShadow: "inset 0 -1px 0 0 var(--v-hair)" }}>
        <h2 className="text-sm font-extrabold tracking-tight text-foreground">{title}</h2>
      </div>
      <div>
        {cards.slice(0, 8).map((c, i) => (
          <CardRow key={c.cardCode} c={c} i={i} rank={ranked ? i + 1 : undefined} />
        ))}
        {cards.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>}
      </div>
    </Panel>
  )
}

export default async function V2Home() {
  const { topGainers, topLosers, highestPriced, totalCards, totalValue } = await getHomeData()
  const gainers = topGainers.map(mapCardToTrending)
  const losers = topLosers.map(mapCardToTrending)
  const highest = highestPriced.map(mapCardToTrending)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
      {/* build banner */}
      <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--v-honey-soft)", color: "var(--primary)" }}>
        🏗️ V2 (กำลัง build จริง) · data จริงจาก <code className="font-mono">getHomeData()</code> · ของจริงอยู่ที่{" "}
        <Link href="/" className="underline">/</Link>
      </div>

      {/* hero — real market stats */}
      <section className="glow-honey -mx-4 mt-2 px-4 py-6 lg:-mx-8 lg:px-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground lg:text-4xl">ตลาดการ์ด OPCG</h1>
        <p className="mt-1 text-sm text-muted-foreground">ราคากลางรายวัน · Yuyutei · SNKRDUNK</p>
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">การ์ดทั้งหมด</p>
            <p className="tnum text-2xl font-extrabold text-foreground">{totalCards.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">มูลค่ารวมตลาด</p>
            <p className="tnum text-2xl font-extrabold text-foreground">฿{Math.round(totalValue).toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* real gainers / losers / highest-priced */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Column title="🔥 มาแรง (24h)" cards={gainers} />
        <Column title="📉 ร่วงแรง (24h)" cards={losers} />
        <Column title="💎 ราคาสูงสุด" cards={highest} ranked />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ตาราง ​market เต็ม (sort · filter · 7d/30d) + การ์ด/พอร์ต/ตลาด = หน้าถัดไปที่จะ build เข้าโฟลเดอร์นี้
      </p>
    </div>
  )
}
