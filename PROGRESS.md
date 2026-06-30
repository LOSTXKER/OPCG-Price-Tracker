# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-30 — **(1) รื้อ Portfolio ใหม่ตาม VISION §5.3** + **(2) multi-game `/[game]/` URL namespace — routing core (Phase 1) เสร็จ+verify** → **ยังไม่ commit** (รอเบสรีวิว) · branch `ui/sets-redesign` · verify: tsc 0 · lint 0 err · test 56/56 · build ✓

## ✅ เสร็จ session นี้ (2) — Multi-game `/[game]/` URL (เบสสั่ง "URL แยกเกมทั้งแอป · ทำ UI ก่อน")
เลือกกลยุทธ์ **middleware-rewrite + cookie/header resolver** (mirror `getServerLanguage` · ปลอดภัย incremental · **ไม่ย้าย 102 route จริง · ไม่แก้ 180 ลิงก์**):
- `src/lib/game/constants.ts` (GAME_COOKIE `kuma-game` · GAME_HEADER `x-game` · DEFAULT `opcg` · `GAME_SCOPED_SEGMENTS` allowlist 11 feature · isGamePrefix/isGameScopedSegment) · `src/lib/game/server.ts` `getServerGame()` (header→cookie→default · mirror lang resolver)
- `middleware.ts`: `/opcg/portfolio` **rewrite→flat `/portfolio`** (URL คงไว้) + inject `x-game` + set cookie · legacy `/portfolio` **redirect→`/{currentGame}/portfolio`** (ลิงก์เก่าใช้ได้หมด namespace ทั้งแอปทันที ไม่ครึ่งๆ) · `updateSession` refactor backward-compat (no-opts = เดิมเป๊ะ · opts รองรับ rewrite+session merge) · GameSwitcher นำทาง swap game segment + persist cookie
- **verify (2 รอบ bypass on/off):** `/portfolio`→307→`/opcg/portfolio` · `/opcg/portfolio`→200 · `/all/portfolio`→200 · `/sets`→307→`/opcg/sets` · `/messages`→302→login (**auth ไม่พัง**) · `/settings`/`/honey`/`/api`/`/` flat ไม่แตะ · ไม่มี loop · cookie set ถูก · build ✓
- **Phase 1 = URL namespaced ทั้งแอปแล้ว**
- **Phase 2 — portfolio scoped ✅:** `useGameScope()` (client, อ่าน game จาก URL prefix) · `usePortfolioApi(scope)` filter assets/stats/allocation ตามเกม · gameBreakdown คง cross-game · `/all/portfolio`=รวมทุกเกม+breakdown · `/opcg/portfolio`=เกมเดียว · `/pokemon/portfolio`=empty state (scoped) · verify lint0/tsc/test56/build + curl `/opcg`,`/all`,`/pokemon` portfolio+sets =200
- ⏭️ **เหลือ:** หน้าอื่น (sets/cards/search/trending...) อ่าน `getServerGame()` scope server-side · sitemap prefixed · 307→308 · rename middleware→proxy · DEFER: gameId NOT NULL backfill + Pokémon data

## ✅ เสร็จ session นี้ (1) — Portfolio redesign (เบสสั่ง "รื้อใหม่หมด ... /workflow")

## ✅ เสร็จ session นี้ — Portfolio redesign (เบสสั่ง "รื้อใหม่หมด ... /workflow")
เบสเคาะ 2 จุด: **(1)** multi-game = ทำ UI game-aware รอบนี้ (ไม่แยก URL — มีแต่ data OPCG · แยก URL = milestone ถัดไป ทั้งแอป) **(2)** อนุมัติ migrate netInvested

**Data layer (ฉันทำเอง — เป็น contract):**
- **migration** `PortfolioSnapshot.netInvestedJpy Int?` (additive nullable ปลอดภัย) · apply prod ด้วย `prisma db execute` (`ADD COLUMN IF NOT EXISTS`) + `migrate resolve --applied` **ตาม precedent P4.2 ไม่แตะ drift M5** · cron `snapshot-portfolios` เขียน netInvested = totalCost · snapshot เก่า null → UI fallback
- API: portfolio include `card.set.game` (fragment `portfolioCardInclude` แยก ไม่กระทบ 12 consumer ของ `cardInclude`) · history `?portfolioId` + คืน netInvested
- types: `AssetRow`+game/THB · `HistoryPoint`{value,cost,netInvested,isInflow} · `GameBreakdown` · `GameRef`
- hook `use-portfolio-api`: map game ต่อใบ · `gameBreakdown` · history scoped ต่อพอร์ต + ตรวจ **inflow notch** (netInvested กระโดด = เพิ่มการ์ด ไม่ใช่กำไร) · P/L scrub = value−netInvested ที่จุดนั้น (honest)

**Components (workflow 7 agent ขนาน · คนละไฟล์ ไม่ชน · ฉัน verify อ่านทุกตัว):**
- atom `HeroNumber` (`src/components/ui/hero-number.tsx`): text-display + count-up rAF + scrub-bind (`live` → instant, ปล่อย → ease snap-back) · honor reduced-motion
- `PortfolioHero` (scrub-bound: valueJpy/deltaJpy/deltaPct/live) + delta pill glow ≤14% · `PortfolioScrubChart` (Recharts area honey · pointer-scrub → onScrub · range pill honey-active · inflow ReferenceDot) · `PortfolioKpi` (2×2 hairline quartet) · `PortfolioMovers` (เรียง abs THB swing 24h) · `PortfolioGameBreakdown` (null เมื่อ ≤1 เกม → ติดเมื่อเกม 2 มา = `/all/portfolio` พร้อมเสียบ) · `PortfolioHoldingSheet` (tap tile → detail sheet: avg cost/market/P-L + ลิงก์การ์ด) · `PortfolioAllocationPanel` (donut→bars honey-restrained)
- wire `portfolio-client`: header→**hero+scrub**→KPI quartet→game breakdown→movers→holdings→allocation→tx · collection grid tile **tap→holding sheet** (เดิม→/cards) · ลบ `portfolio-summary-bar` · ย้าย `MiniSparkline` → `src/components/ui/mini-sparkline.tsx` (watchlist ใช้ด้วย) แก้ import

**2 bug ที่ฉันเจอตอนอ่านโค้ด agent (compile ผ่านแต่ runtime เพี้ยน) → fix แล้ว:**
1. scrub-chart ไม่มี `<XAxis dataKey="label">`/`<YAxis domain>` → inflow notch + scrub cursor วางผิดตำแหน่ง + เส้นแบนติด 0 → เพิ่ม axes ซ่อน + tighten Y domain (Robinhood zoom)
2. KPI ROI ยังโชว์ลูกศร/สีตอน hideBalance (leak ทิศกำไร) → ทำให้ neutral เท่า P/L

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. multi-game: **รอบนี้ game-aware UI (คง /portfolio)** · แยก URL `/[game]/portfolio` + `/all/portfolio` = milestone ถัดไป ทำตอน Pokémon data มา (ไม่สร้าง namespace ครึ่งๆ ทั้งแอป)
2. netInvested = totalCost ตอนนี้ (ยังไม่มี SELL/realized) · เก็บเป็น field แยกเพื่อ forward-compat
3. holding tap→sheet เฉพาะ **collection grid** (tile เทอร์ส) · list view (mobile-card/desktop-row) คงรายละเอียด inline + ลิงก์ /cards เดิม
4. typography/▲▼: ใช้ lucide ArrowUp/Down (ไม่ใช่ unicode ▲▼ ที่ถอดไปทั้งเว็บ)

## ⚠️ gotchas
- **ยังไม่ commit** — เบสรีวิวก่อน · push master ห้าม (เบส override เอง) · ไฟล์ portfolio ตอนนี้ = งานเบสสั่ง ไม่ใช่ของทีมอื่นแล้ว (gotcha เก่าหมดอายุ)
- **runtime visual ยังไม่ได้เปิดดูจริง** — ต้อง login + มี portfolio data · verify แค่ compile/test/build · เบสเปิด preview เช็ก: hero count-up · finger-scrub บนมือถือ (ลากกราฟ → hero เปลี่ยนสด) · inflow notch · KPI/movers/allocation บนจอเล็ก
- migration drift M5 ยังมี (ก่อน session นี้) — ฉันเลี่ยงด้วย db execute เหมือน P4.2 · ไม่ได้แก้ drift (อยู่ใน PLAN M5)
- orphan `portfolio-allocation-chart.tsx` (donut เก่า ไม่มี importer) — ⚠️ รอเบสยืนยันก่อนลบ
- snapshot cron ต้อง deploy โค้ดใหม่ก่อนถึงจะเก็บ netInvested จริง (คอลัมน์มีใน prod แล้ว · โค้ดเก่าเขียนไม่มี field = null ก็ไม่ error)

## ⏭️ NEXT (session หน้า)
1. **เบสเปิด preview เช็ก visual** portfolio (มือถือ+desktop) — finger-scrub · hero · KPI · movers · holding sheet · ถ้าจุดไหนไม่เป๊ะ ปรับ
2. **เบสเคาะ commit** — stage งาน portfolio redesign (data layer + 7 component + wire) · ลบ orphan allocation-chart มั้ย
3. **multi-game Phase 2** — page อ่าน `getServerGame()` scope data ทีละหน้า (เริ่ม portfolio → `/all/portfolio` aggregate hero ข้ามเกม → sets/cards/search...) + sitemap prefixed + `middleware.ts`→`proxy.ts` · หรือเลือกหน้าอื่น redesign (ค้าง: /trending /compare /honey /seller /settings /marketplace)
