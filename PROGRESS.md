# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-02 — **Portfolio Minimal Editorial** (เบส: "ไม่ดีเลย ใช้ impeccable + รื้อใหม่หมด minimal ทันสมัย เข้ากับหน้าแรก/card detail แบบ CMC·Coinbase·TCGplayer·Collectr")

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` (จาก design workflow · แยก [NO-SCHEMA] vs [SCHEMA-GATED])
- **VISION:** §1 identity · §2 IA/TRACK · §4 discipline · §5.3 portfolio · §5.7 multi-game · §6 schema (⚠️ gated)

## ✅ เสร็จ session นี้ (3 commit)
**หลักการ:** MINE = กองเดียวรวมทุกเกม flat URL · 2 ปุ่มเกมไม่ทับกัน (header pill = นำทาง catalog เท่านั้น · in-page chips = กรอง list) · honey <5% · per-game tint = ชั้นบางทับ honey (crest/glow/frame · จาก `GameConfig.accentTint` · pokemon=เหลืองบาง opcg=baseline) · green/red = P/L เท่านั้น

- **commit ก่อนหน้า `a8ae7fa`** — multi-game พื้นฐาน (per-page filter · teaser · badge · scope label · add-card ข้ามเกม · null-game · mock `?demo=multigame`)
- **commit `5f76687` (Phase A–C):**
  - **A identity:** `GameConfig.accentTint` + `getGameAccentTint()` · `GameBadge` tint dot + size · `GameFilterChips` allValue
  - **B watchlist/alerts:** summary scope ตามเกม (เลิก OPCG leak) · grid badge · bell amber→honey · alert chip unit + all-count · **alert จัดกลุ่มตามเกมพับได้** (`alert-groups.tsx`) · filtered-empty "ดูทุกเกม"
  - **C portfolio:** `GameCrest` atom · wire `PortfolioGameBreakdown` เดิม (all-games only) + deep-link กดแถว→scope + tint share bar · scoped hero tint glow · `PortfolioScopedHonestyStrip` แทน note กราฟ (Cost vs Market + P/L · ไม่ปลอมกราฟ)
- **commit นี้ (Phase D–E):**
  - **D switcher:** eyebrow "เลือกแคตตาล็อกเกม" (navigate-framed) · crest dot tint ต่อเกม · **MINE-route ⓘ hint** "ตัวกรองเกมอยู่ในหน้านี้ →" (dismiss-once · ui-store) — แก้ความสับสน 2 ปุ่มเกม
  - **E coming-soon:** per-game tint (glow + badge + "เร็วๆ นี้" chip) บน `/coming-soon`

i18n ใหม่: showAllGames · alertsUnit · byGame · browseCatalog · switcherMineHint (th/en/jp)
**verify ทุก commit:** tsc 0 · lint 0 err (1 warning เดิม) · test 56/56 · build ✓

## ⚠️ verify ภาพจริง — เบสต้อง login + `?demo=multigame`
เห็นได้เมื่อมี 2 เกม (OPCG จริง + Pokémon mock · ต้อง login) · เปิด `/portfolio` `/watchlist` `/settings/alerts` + `?demo=multigame`:
- portfolio: chip [ทุกเกม ฿รวม][OPCG][Pokémon] · **breakdown block กดแถว→scope** · กด Pokémon → hero glow เหลือง + honesty strip แทนกราฟ
- watchlist: summary ตามเกม · badge grid+list · bell honey
- alerts: **กลุ่มเกมพับได้** + crest · chip "N แจ้งเตือน"
- switcher (ทุกหน้า): dot สีตามเกม · บนหน้า MINE มี ⓘ hint

## 🔁 รีวิวแผนรอบ 2026-07-02 (เบสสั่ง re-review หลังเปลี่ยน model) — เบสเคาะแล้ว
**จุดที่แผนเดิมเรียงผิด:** เรียงตาม "แตะ/ไม่แตะ DB" แต่ไม่ได้เรียงตาม "user เห็นผลเมื่อไหร่" — UI multi-game ทั้งหมด+Phase G มองไม่เห็นจนกว่ามีเกม 2 จริง · **คอขวดจริง = Pokémon data pipeline** (หาแหล่ง+scraper+seed · ไม่ใช่ UI/schema) · Phase F desktop กลับเป็นงานเดียวที่เห็นผลทุก user วันนี้
**ลำดับใหม่ (เบสเคาะ):** (1) ปิดงวด → PR ✅ (2) Phase F desktop 2-rail (3) สำรวจ Pokémon data (4) Phase G migrations มัดรวมทีเดียวตอน data พร้อม
**mock `?demo=multigame`:** เบสเคาะ **ปล่อยไว้ใน prod** (discoverability ต่ำ · display-only)

## ⏭️ DEFER (ตั้งใจ · บอกเบสแล้ว)
- **Phase F desktop 2-rail** → เลื่อนขึ้นเป็นงานถัดไปหลัง PR (ทำแบบ iterate กับเบสบน preview)
- **switcher per-row data** ("128 ใบ · ฿42,300") — ต้อง endpoint summary → ทำพร้อม data จริง
- **pinning เกม** — low value ตอนมี 2 เกม
- **notify-me form + `/api/notify/[game]`** — ต้องมี `GameNotifySignup` table ไม่งั้นหลอกผู้ใช้ → ไป Phase G
- **ตัดถาวร (ตัดสิน 2026-07-02):** tint ring บนรูป movers/holdings (แถวมี GameBadge แล้ว ring = noise ขัด "ไม่รก") · alert set-subheader (AlertRow โชว์ set ต่อใบแล้ว กลุ่มระดับเกมพอ)

## ⛔ SCHEMA-GATED (Phase G · เบสอนุมัติก่อน migrate — VISION §6)
1. **per-game `PortfolioSnapshot`** (gameId + netInvestedJpy) → กราฟพอร์ตแยกเกมจริง (แทน honesty strip)
2. **`Card.gameId` NOT NULL + `@@unique` + gameMeta** → 2 เกมจริง (เลิกพึ่ง `?demo=multigame`)
3. **`GameNotifySignup` table** → notify-me durable
4. **named watchlists** · Game.accentTint/sortOrder/isComingSoon columns · TransactionType+SELL + indexPriceJpy

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
0. **ห้าม bottom-sheet ทั้งเว็บ** (เบส veto 2026-07-02) — modal ทุกตัว = Dialog กลางจอ · กวาดแล้ว 3 จุด (portfolio manage · tx history · home filter) + ลบ holding-sheet orphan · drawer ซ้าย/ขวาของเมนู + micro-animation 8-16px = คนละ pattern ไม่แตะ · **ของใหม่ห้ามใช้ `side="bottom"`**
1. MINE = unified cross-game · flat URL · in-page chips (owner amendment) — ไม่แยก /[game]/ silo
2. filter = local state ต่อหน้า · header pill = catalog เท่านั้น (revert 1f07ff9)
3. per-game tint = crest/glow/frame เท่านั้น · **ห้าม `--game-tint`/tint บน fill/CTA/ring** (opcg ดูปกติแต่ pokemon พัง) · ต่อ element inline
4. portfolio breakdown = all-games view เท่านั้น · unmount ตอน scoped (one-hero rule)
5. mock demo = client-only · ลบเมื่อ data จริงมา

## 🎨 Visual pass หน้าพอร์ต (2026-07-02 · เบส: "UXUI ยังไม่สวย" → screenshot-driven ผ่าน Chrome จริง)
PR #55 merged แล้ว · จากนั้นเบสให้ feedback ความสวย → ทำ visual pass บน branch (commit `4f3e5a6`):
- **Pass 1 declutter**: ตัด breadcrumb+h1 block (เงินขึ้นก่อน · sr-only h1) · chip ชื่อล้วน+w-fit (เงินต่อเกมอยู่ที่ panel "แยกตามเกม" ที่เดียว) · ลบ ScopedHonestyStrip (ซ้ำ KPI เป๊ะ → note บรรทัดเดียว) · "อื่นๆ"→OPCG + หน่วยการ์ด · pill ซ่อนยอดตอน scoped (totalVisible) · empty chart กระชับ+dashed · **GameBadge fold null→OPCG** (การ์ดที่ set ไม่ผูกเกมได้ป้ายถูก) + badge overlay บน grid tiles
- **Pass 2 desktop 2-rail**: `lg:grid-cols-[1fr_340px]` ซ้าย=hero→chips→chart→KPI→movers · ขวา sticky=แยกตามเกม→สัดส่วน · การ์ดเต็มกว้างล่าง · mobile คอลัมน์เดิม
- **workflow ที่ใช้ได้ผล**: dev server localhost:3000 มี session "Test" login ค้าง → ฉันเปิด Chrome เห็นภาพจริง iterate เองได้ (ไม่ต้องรอ deploy/เบสเช็กทุกรอบ) — ใช้ pattern นี้กับ watchlist/alerts ต่อ
- verify: tsc0 · lint 0 err · test 56/56 · build ✓ · screenshot ยืนยัน all-games/scoped/grid-badge

## 🎨 Portfolio iterate ต่อ (2026-07-02 บ่าย · เบส feedback 3 รอบ · commit 4310888→09ae7e5→bcbd3eb)
- **รอบ "ขวาซ้ำซ้อน + list ไม่เอา grid"**: ตัด grid+toggle ทิ้ง (list เดียว · thumbnail aspect การ์ดจริง 63:88) · KPI 4→2 · ตัด allocation
- **รอบ "เอา UXUI เว็บเดิม (meecardtcg live) แต่ดีกว่าตาม vision"** — เบสส่ง screenshot เว็บ live: รื้อกลับเป็นโครงเดิม = **sidebar ซ้าย** (ทุกพอร์ต+ลิสต์+สร้างใหม่ · lg: only, มือถือใช้ pill) + **แท็บ ภาพรวม|ข้อมูลเชิงลึก** (SegmentedControl · key เดิมมีอยู่แล้ว) + **PortfolioHeroPanel ใหม่** (มูลค่า+delta+แถว 4 สถิติ กำไร/ต้นทุน/ดีสุด/แย่สุด + glow ≤12% ตาม P/L หรือสีเกมตอน scoped) → chips → **สินทรัพย์ list ทันที** · เชิงลึก = hero scrub+กราฟ / แยกตามเกม / มูฟเวอร์ / สัดส่วน (allocation คืนที่นี่) · **ลบ portfolio-kpi.tsx** (แทนด้วย stat row)
- **รอบ "minimal ทันสมัย"**: delta pill พื้นสี → ข้อความเปล่า▲ · sidebar 2 กล่อง→1 · ปุ่มแก้ไขมีขอบ→ghost icon (ถอด showLabel) · เพิ่มอากาศ p-5/6
- ปุ่มประวัติธุรกรรม → Receipt icon บนหัว (เบสสั่งเอาปุ่มใหญ่ออก)
- ทุกรอบ verify: tsc0 · lint 0 err · test 56/56 · build ✓ + Chrome screenshot (1512 + 500px มือถือ · device-mode DevTools เปิดผ่าน key ไม่ได้ ใช้ resize 500 แทน · resize ต้องระวัง window ชิดขอบจอ = bounds error)

## 🎯 Proto-first rebuild (2026-07-02 เย็น · เบส: "ยังไม่ถูกใจ รื้อใหม่ ทำ proto ให้ดูก่อน")
เปลี่ยนวิธีจาก iterate หน้าจริง → **proto ให้เลือกก่อน** (วิธีเดียวกับ card-detail สำเร็จ):
- สร้าง `/proto/portfolio/{a,b,c}` (3 agents ขนาน · mock กลาง `proto-data.ts` การ์ดจริง+รูป R2/pokemontcg.io · เปิดดูไม่ต้อง login): A=Robinhood minimal · B=Collectr gallery · C=StockX terminal
- เบสเลือก **A+C** → proto D v1 (ต่อท่อน) → เบสติ "รวมโง่ๆ + ฟีเจอร์ไม่ครบ" → **D v2** = เครื่องมือเดียว (money band ซ้ายเลข+สถิติฝัง | ขวากราฟ · context band · ตาราง terminal ฟีเจอร์ครบกดได้จริง)
- เบสเคาะ D v2 + **ตัดมูฟเวอร์วันนี้ + แยกตามเกม band** → **พอร์ตเข้า /portfolio จริงแล้ว** (commit `a3169ff`):
  - money band: PortfolioHero จริง (scrub-bind · scope label/tint) + dl ต้นทุน/ROI/จำนวน (scoped ตาม assets) | กราฟ scrub จริงขวา (scoped → note บรรทัดเดียว)
  - game filter = **text tabs ใน toolbar ตาราง** (`leading` slot ใหม่ใน assets-table/toolbar · <2 เกมซ่อน)
  - ตารางคอลัมน์ใหม่: การ์ด(63:88)/เกม(dot·ซ่อนเกมเดียว)/ต้นทุน/ราคา/24h/**sparkline 7 วันจริง** (fetch `/api/cards/sparklines` แบบ watchlist · dev DB ไม่มี history → "—" ปกติ)/กำไร/มูลค่า/แก้ไข ghost
  - ตัดจากหน้า: แท็บ overview-insights · sidebar · **ลบไฟล์ portfolio-hero-panel.tsx** · breakdown/movers/allocation ถอด import (ไฟล์คงอยู่)
- verify ทุกขั้น: tsc0 · lint 0 err · test 56/56 · build ✓ · Chrome เทียบ proto

## 🖥️ Single-screen redesign หน้าพอร์ต (2026-07-02 · เบส: "รื้อ UXUI ให้สวย ใช้ง่าย ดูโปร · ออกแบบใหม่ไม่ต้องอิงอะไร")
เลิกโครงแท็บ **ภาพรวม|ข้อมูลเชิงลึก** → **หน้าจอเดียวไหลต่อกัน** (money band → KPI → context → holdings → insights):
- **Money band** (`lg:grid-cols-[minmax(280px,5fr)_7fr]`): PortfolioHero scrub-bind ซ้าย + scrub chart ขวา (mobile stack) · scoped game = honest note แทนกราฟ (เหมือนเดิม)
- **KPI quartet** 2×2/4-col hairline grid: มูลค่าตลาด · ต้นทุน · P/L · ROI (P/L มาจาก `stats.unrealizedPnl` · "—" ตอนไม่มี cost)
- **Context band** (border-y thin): มูฟเวอร์ chips รูปเล็ก+delta (variant `chips` ใหม่ใน `portfolio-movers.tsx`) + game-filter chips tint-dot (ย้ายจาก text tabs ใน toolbar มาที่นี่ · ≥2 เกมเท่านั้น)
- **Holdings**: table sm+ / list <sm เดิม · toolbar คืน heading "สินทรัพย์ · N" (ไม่มี leading game tabs แล้ว)
- **Insights**: `PortfolioGameBreakdown` + allocation — 2 คอลัมน์เมื่อมีทั้งคู่ · panel เดี่ยว = เต็มกว้าง (ไม่บีบครึ่งจอ)
- **mobile-card.tsx**: ลดจาก 3 บรรทัด+notes+24h/7d → **2 บรรทัดสะอาด** (ชื่อ+code×qty | มูลค่า+P/L%) · notes/24h/7d ย้ายไป edit dialog
- **loading.tsx + portfolio-mock-preview.tsx**: เขียนใหม่ mirror layout ใหม่ (เลิก grid เก่า · ไม่มี layout jump ตอนโหลด)
- ไม่แตะ API/hook/Prisma · Dialog เดิม (ไม่มี bottom sheet) · per-game chart ยัง gated
- verify: tsc0 · lint 0 err · test 56/56 · build ✓ · Chrome จริง (desktop + mobile 390px · all-games + `?demo=multigame` scoped)
- **หมายเหตุ**: dev overlay โชว์ hydration warning ที่ `portfolio-client.tsx:89` (`<h1>{t(lang,...)}</h1>` · persisted lang store) = pre-existing app-wide ไม่ได้เกิดจาก redesign นี้

## 🔀 คืนแท็บ + multi-portfolio discoverable (2026-07-02 เย็น · เบสสั่งหลัง single-screen)
เบสขอ 2 อย่าง: (1) แยกแท็บ ภาพรวม|ข้อมูลเชิงลึก กลับมา (2) ให้ผู้ใช้รู้ว่าเพิ่มพอร์ตได้และชนลิมิตต้องซื้อแผน:
- **แท็บกลับมา แต่คงของใหม่ทั้งหมด**: ภาพรวม = hero สด (ไม่ scrub) + KPI quartet 2×2 + context band (movers chips + game chips) + holdings · เชิงลึก = money band (hero scrub + กราฟ `[5fr_7fr]`) + แยกตามเกม + movers list เต็ม + สัดส่วน · skeleton (inline + `loading.tsx`) + mock preview ปรับตามแท็บภาพรวม (ตัดก้อนกราฟ + เพิ่ม tab pill)
- **switcher** (`portfolio-switcher.tsx`): dropdown มี item "**+ สร้างพอร์ตใหม่**" ตรงๆ (ปกติ = เปิด manage dialog โหมดสร้างทันทีผ่าน prop `initialCreating` ใหม่ · ชนลิมิต = Lock + badge PRO → upgrade dialog) + header โชว์ตัวนับ **"N/max พอร์ต"** ทุก tier (PRO+ = "N พอร์ต") ทั้ง dropdown label และ DialogDescription
- **selector** (`portfolio-selector.tsx`): ปุ่มสร้างตอนชนลิมิตเปลี่ยนเป็น upsell block ชัดเจน (Lock + "แผนของคุณสร้างได้สูงสุด N พอร์ต · อัปเกรดเพื่อเพิ่มพอร์ต →" พื้น primary/6) — พฤติกรรม `openUpgradeDialog({featureKey:"portfolioCount"})` เดิม
- i18n ใหม่ th/en/jp: `portfolioCountOf` ("{n}/{max} พอร์ต") · `portfolioCountOnly` · `portfolioLimitUpTo` · `upgradeForMorePortfolios` (⚠️ `portfolioLimitReached` มีอยู่แล้วท้ายไฟล์ — เลยตั้งชื่อใหม่ `portfolioLimitUpTo` กัน dup key)
- **บั๊กที่เจอระหว่างทำ**: Base UI Menu บังคับ `GroupLabel` ต้องอยู่ใน `Group` — ใส่ label เปล่าแล้วหน้า crash "MenuGroupRootContext is missing" → ครอบ `DropdownMenuGroup` แก้แล้ว
- verify: tsc0 · lint 0 err · test 56/56 · build ✓ · Chrome จริง: สลับแท็บ ✓ · dropdown เห็น "สร้างพอร์ตใหม่ [PRO]" + "1/1 พอร์ต" ✓ · คลิกชนลิมิต → upgrade dialog "จำนวนพอร์ต" ✓ · manage dialog (มือถือ 390px) เห็น "1/1 พอร์ต" + upsell block ✓

## 🧹 Minimal Editorial rebuild (2026-07-02 ค่ำ · เบสปัด wow pass "ไม่ดีเลย" → "impeccable + minimal เข้ากับหน้าแรก/card detail · CMC/Coinbase/TCGplayer/Collectr")
**Wow pass (การ์ดพัด+glow+stagger) ถูกรื้อทิ้งทั้งหมด** — เบสไม่เอา decorative chrome · ทิศใหม่ = ภาษาเดียวกับหน้าแรก+card detail (frameless editorial):
- **ติดตั้ง Impeccable** (`npx impeccable install --providers=cursor --scope=project` → `.cursor/skills/impeccable/` + pre-edit hook) · เขียน `PRODUCT.md` (สังเคราะห์จาก VISION — จำเป็นสำหรับ skill) · `npx … detect.mjs` บน portfolio = **0 findings** ทั้งก่อน/หลัง · **eslint ignore `.cursor/**` + `.impeccable/**`** (สคริปต์ third-party เคยโดนสแกน 130 warnings ปลอม)
- **ลบไฟล์ `portfolio-hero-showcase.tsx`** (การ์ดพัด) · ถอด `.rise` stagger, KPI quartet กล่อง, `Surface` ทุกจุดในหน้า
- **แท็บ = underline บน hairline** (pattern `home-market-overview` เป๊ะ: `-mb-px border-b-2` active=primary) แทน SegmentedControl pill
- **Hero บรรทัดเดียว** (pattern `card-detail.tsx` L622): eyebrow → `text-display leading-none` + delta ▲/▼ สีเปล่า + meta "N การ์ด" — บน canvas ตรงๆ · scoped glow game tint คงไว้ (18%)
- **Stat strip แบน** แทน KPI กล่อง: ต้นทุน · กำไร/ขาดทุน · ROI เป็น eyebrow + `text-price tnum` แถวเดียวคั่น hairline บน (Coinbase asset stats)
- **มูฟเวอร์ = inline text rail** (variant `chips`→`inline` ใน portfolio-movers): ชื่อ muted + delta% — ไม่มี ring/รูป/pill
- **Game filter กลับเป็น text underline tabs ใน toolbar** (`leading` slot) + tint dot · toolbar heading `.text-h5`+pill → `.text-eyebrow` + count เงียบ
- **ตาราง CMC**: เพิ่มคอลัมน์ **7d sparkline** (lg+) — `useSparklines` hook เดิม + `Sparkline` shared (pattern market-table-row/watchlist) · dev DB ไม่มี history → "—" ปกติ
- **Action row icons = ghost** (เลิก border+bg-card)
- **แท็บเชิงลึก flat**: movers + allocation ถอด Surface → section คั่น `border-t` + pt-5 (breakdown คง panel เดิม — เป็น clickable group)
- skeleton ×2 + mock preview ตามโครงใหม่ (tabs → hero line → stat strip → list)
- verify: impeccable detect [] · tsc0 · lint 0 err (34 warnings เดิม) · test 56/56 · build ✓ · Chrome light+dark + mobile 390px + แท็บเชิงลึก + `?demo=multigame`

## ⏭️ NEXT
1. เบสเปิด `localhost:3000/portfolio` + `?demo=multigame` (desktop+มือถือ) เคาะความสวย / สั่งปรับ
2. watchlist + alerts ปรับเข้าภาษาเดียวกับโครงใหม่ → PR
3. ลบ /proto/portfolio หลังพอใจ (หรือเก็บเป็น reference) · Pokémon data survey · Phase G
4. (ถ้าอยากเก็บ) แก้ hydration warning จาก persisted lang/currency store แบบ app-wide
