# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-01 — **MINE multi-game VISION redesign (Phase A–E build)** (เบส: "ทำให้ครบจบเสร็จ · รื้อ UX/UI ใหม่ได้ · ดูตาม VISION · /workflow" → design workflow 6-agent ออก spec → build [NO-SCHEMA] Phase A–E)

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

## ⏭️ NEXT
1. เบสเปิด `localhost:3000/portfolio?demo=multigame` เทียบ proto D → เคาะ/สั่งปรับ
2. มือถือ fine-tune (mobile list ใช้ MobileAssetCard เดิม — ยังไม่ได้ปรับตาม proto)
3. watchlist + alerts ปรับเข้าภาษาเดียวกับโครงใหม่ → PR
4. ลบ /proto/portfolio หลังพอใจ (หรือเก็บเป็น reference) · Pokémon data survey · Phase G
