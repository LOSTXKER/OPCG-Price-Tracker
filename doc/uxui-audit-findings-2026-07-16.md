# 🔍 UX/UI Audit รอบสอง — 2026-07-16

> ตรวจทั้งเว็บด้วย workflow 22 ทีม (14 กลุ่มหน้า + 8 มิติ cross-cutting) เทียบกับ convention ใน AGENTS.md + VISION.md และเทียบกับ audit เดิม 2026-07-04
> ข้อที่ซ้ำกับของเดิมจะมี ID เดิมกำกับ (เช่น `TRACK-03`) · ข้อใหม่ = `NEW`
> ✅ = ผ่านการ verify ซ้ำกับโค้ดจริงแล้ว · ❌ = verify แล้วพบว่าไม่จริง (ตัดทิ้ง) · ข้อที่ไม่มีเครื่องหมาย = ยังไม่ผ่าน verify รายข้อ (รอบ verify โดน session limit ตัด ~24 ตัว) — **ก่อนลงมือแก้ข้อไหน ให้เปิดโค้ดเช็คก่อนเสมอ**

**รวม 319 ข้อ** (สูง 27 · กลาง 150 · ต่ำ 142) · ข้อใหม่ที่ audit เดิมไม่เคยเจอ 155 ข้อ

## 🎯 บทสรุป — เว็บ "ไม่สม่ำเสมอ" ตรงไหน (อ่านส่วนนี้ส่วนเดียวก็พอ)

ความรู้สึกว่า "UI ไม่สม่ำเสมอ" มีที่มาจริง 6 เรื่องใหญ่ เรียงตามผลกระทบ:

1. **ทองมี 2 เฉดทั่วเว็บ** — สี amber ดิบถูกใช้เป็นสีของ Honey/Pro/ล็อก ~80 จุด แข่งกับสีทอง honey ของแบรนด์ → เห็นเป็น "ทองเพี้ยน" ข้างกันบ่อยมาก (ข้อ x-color.1 · ตัวการอันดับหนึ่งของความรู้สึกไม่สม่ำเสมอ)
2. **ตัวเลขขึ้น-ลงแสดงคนละแบบใน 3 หน้า market** — หน้าแรกตัดลูกศร ▲/▼ ทิ้ง (ขัดกฎ VISION) · trending มีลูกศร+ทศนิยม 2 ตำแหน่ง · market-overview ใช้ป้ายเขียนเอง — ทั้งที่มี `PriceTag` เป็นตัวกลางแล้ว (home.2) + เลข hero ใช้คนละฟอนต์ข้ามหน้า (x-typography.1)
3. **หน้า trending เขียนตารางเองทั้งชุด** ทั้งที่มีตารางกลางที่หน้าแรก/ค้นหาใช้ร่วมกัน → แถวการ์ดหน้าตาไม่เหมือนกันข้ามหน้า (home.1)
4. **ปุ่ม/ชิปตัวกรองใน FilterModal เขียนซ้ำเอง 5 หน้า** — ชิป rarity หน้าตาต่างกันข้ามหน้า ทั้งที่ modal เป็นตัวเดียวกัน (x-controls.1)
5. **โซน/หน้าตกยุคที่ยังไม่ถูก redesign** — deck-calculator (ทั้งหน้า) · /saved (ทั้งหน้า) · settings หน้าลูก 10 หน้า · commerce ทั้งโซน (ปิด flag อยู่ — 5 ข้อสูง ต้องเก็บก่อนเปิด)
6. **เรื่องความซื่อสัตย์ของข้อมูลบน card-detail (สำคัญสุดเชิงธุรกิจ)** — กราฟราคาพล็อตข้อมูลจำลองทั้งที่ดึงข้อมูลจริงมาแล้ว และ % เปลี่ยนแปลงตามช่วงเวลาถูก "ประดิษฐ์" จากสูตรขยายค่า 30 วัน โดยไม่ติดป้ายประมาณ (card-detail.1, card-detail.2) — หน้านี้คือ trust core ควรแก้ก่อนเรื่องความสวยทั้งหมด

**สิ่งที่แก้ไปแล้วใน branch `feat/portfolio-watchlist-teardown` (รอบนี้):**
- 🏗️ **รื้อ Portfolio ใหม่ทั้งหน้า** — ยุบ 2 แท็บ (ภาพรวม/เจาะลึก) เป็นหน้าเดียวแบบ Robinhood: เลขรวมใหญ่ → กราฟลาก → สี่ช่องสถิติ → มูฟเวอร์ → รายการการ์ด · จอใหญ่เป็น 2 คอลัมน์จริง (rail ขวา = สถิติ/มูฟเวอร์/แยกตามเกม/สัดส่วน) · skeleton + หน้าตัวอย่างตอนยังไม่ล็อกอินตามโครงใหม่
- 🏗️ **รื้อ toolbar + ตาราง Watchlist** — จัดเข้า grammar เดียวกับตารางหน้าแรก (แถวเลือกชุดเด่นก่อน · ค้นหายุบเป็นไอคอน · ของบนจอลดลงครึ่งหนึ่ง) · ตารางจอใหญ่โชว์ 24H/7D/30D พร้อมกันแบบ CoinMarketCap กดหัวคอลัมน์เรียงได้ · ป้ายปักหมุด/กระดิ่งเลิกบังรูปการ์ด
- 🔧 เก็บตามผล audit อีก 12 จุด: delta ในตารางพอร์ตใช้ PriceTag (มีลูกศรครบ) · สวิตช์การ์ดส่วนตัวใช้ Switch กลาง 2 จุด · ปุ่มลบใน bulk-edit มองเห็นบนมือถือ · หัวตารางเลิกมุดใต้ header · ลิงก์มูฟเวอร์เสีย ("#") · ปุ่มฟอร์มแจ้งเตือน ≥44px · ชื่อการ์ดยาวมีจุดไข่ปลา · error state แท็บแจ้งเตือนใช้ EmptyState กลาง · หัวใจ = รายการโปรดความหมายเดียว (เมนู /saved เปลี่ยนเป็น Bookmark) · กวาดชื่อ "รายการจับตา/Watchlist" เหลือ "รายการโปรด" ชื่อเดียว 3 ภาษา · copy หน้าว่างเลิกสอนให้ "กดดาว" (ไอคอนเป็นหัวใจแล้ว)

**ลำดับที่แนะนำสำหรับรอบถัดไป:**
1. 🚨 card-detail ความซื่อสัตย์ข้อมูล 2 ข้อ (กราฟ mock + % ประดิษฐ์) — trust core
2. 🎨 กวาด "ทองสองเฉด" (amber → honey token) + บังคับ PriceTag/ลูกศรทุก delta — แก้ความรู้สึกไม่สม่ำเสมอได้มากสุดต่อแรงที่ลง
3. 🧩 trending → MarketTable กลาง + ชิป facet ใน FilterModal เป็น component เดียว
4. 📄 /saved teardown (โค้ดตกยุคทั้งหน้า) + deck-calculator เข้า kit
5. 🧹 ขออนุมัติลบซากโค้ดกำพร้ารอบใหม่ (~2,000 บรรทัด: ชุด portfolio manager/hub เดิม + อีก 14 ไฟล์จาก x-duplication)
6. ⚙️ settings หน้าลูก 10 หน้า (แผนเดิม Phase 5 ใน uxui-refactor-plan.md)

---

## สารบัญ + สุขภาพราย area

| Area | สูง | กลาง | ต่ำ | ใหม่ |
|---|---|---|---|---|
| [Portfolio](#portfolio) | 1 | 6 | 10 | 15 |
| [Watchlist + Saved + Alerts](#watchlist-track) | 0 | 6 | 9 | 8 |
| [หน้าแรก + market-overview + trending](#home) | 2 | 8 | 6 | 8 |
| [ค้นหา + เทียบการ์ด + palette](#discovery) | 2 | 7 | 8 | 9 |
| [Card detail](#card-detail) | 3 | 5 | 7 | 6 |
| [Sets](#sets) | 1 | 7 | 5 | 3 |
| [Honey + Pricing](#honey) | 1 | 9 | 9 | 9 |
| [Settings + /more](#settings) | 1 | 7 | 7 | 7 |
| [Auth + Profile](#identity) | 1 | 6 | 8 | 5 |
| [Guide + Blog + เนื้อหา](#content) | 2 | 7 | 5 | 4 |
| [Decks + เครื่องคิดเลข](#play) | 1 | 8 | 7 | 7 |
| [Marketplace (ปิด flag)](#commerce) | 5 | 12 | 7 | 10 |
| [Chrome กลาง (header/nav/footer)](#chrome) | 0 | 7 | 6 | 8 |
| [Admin](#admin) | 0 | 3 | 5 | 1 |
| [✂️ ตัวอักษร (cross)](#x-typography) | 1 | 6 | 7 | 8 |
| [✂️ กล่อง/ระยะ/มุมโค้ง (cross)](#x-surface) | 0 | 8 | 4 | 7 |
| [✂️ วินัยสี (cross)](#x-color) | 1 | 9 | 2 | 3 |
| [✂️ control ซ้ำแบบ (cross)](#x-controls) | 2 | 5 | 4 | 8 |
| [✂️ loading/empty/error (cross)](#x-states) | 0 | 8 | 9 | 8 |
| [✂️ ไอคอน + สำนวน (cross)](#x-icons-copy) | 1 | 4 | 4 | 5 |
| [✂️ tap target + a11y (cross)](#x-tap-a11y) | 0 | 7 | 9 | 12 |
| [✂️ โค้ดซ้ำ/กำพร้า (cross)](#x-duplication) | 2 | 5 | 4 | 4 |

<a id="portfolio"></a>
## Portfolio

**ภาพรวม:** พอร์ตหลัง redesign รอบล่าสุดสุขภาพดีกว่าที่ audit เก่า (2026-07-04) บันทึกไว้มาก — จาก 14 ข้อเดิมแก้ไปแล้วราว 10 ข้อ (multi-pick เพิ่มการ์ด, สกุลเงินใน dialog แก้ไข, ปุ่มตาจำข้ามหน้า, ยืนยันก่อนเปิดสาธารณะ, IconButton/NameForm เข้า kit, mask เป็นค่ากลางหมด) และโครงหลักใช้ token + Surface + tap-safe สม่ำเสมอ จุดที่เหลือกระจุกอยู่ 3 กลุ่ม: (1) ลำดับ zone ของหน้า detail ยังไม่ตรง VISION §5.3 — กราฟถูกซ่อนหลังแท็บ "insights" ผู้ใช้เปิดหน้ามาไม่เห็น, (2) การรื้อรอบล่าสุดทิ้งซากโค้ดกำพร้าไว้ ~1,000 บรรทัด (ชุด manager/hub เก่า + ขั้นกรอกจำนวน/ราคาตอนเพิ่มการ์ด), (3) dialog แก้ไขรายการเป็นมุมสุดท้ายที่ยังเขียน component มือเอง (สวิตช์ 2 ขนาดไม่เท่ากัน, ช่องจำนวนดิบ, ปุ่มลบที่มองไม่เห็นบนมือถือ, delta ไม่มีลูกศร) — เหมาะเก็บพร้อมกันตอนรื้อหน้าใหม่

### 🔴 portfolio.1 [NEW] ลำดับ zone หน้า detail ไม่ตรง VISION §5.3 — กราฟถูกซ่อนหลังแท็บที่สอง ผู้ใช้เปิดหน้ามาไม่เห็นกราฟเลย ❌ (verify แล้วไม่จริง — ข้ามได้)
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** VISION.md:123-124 spec zones on ONE surface: header → Hero → scrub chart full-bleed → range → KPI quartet (Market Value · Cost Basis · P/L · ROI% 2×2) → Movers → Holdings. Actual: src/app/portfolio/[id]/portfolio-detail-client.tsx:347-409 splits into two tabs — overview = HeroPanel → GameChips → AssetsTable (NO chart at all), insights = hero(again) → chart → by-game → movers → allocation. The scrub chart (the signature Robinhood moment, fully built per spec in portfolio-scrub-chart.tsx) only renders after the user discovers the second tab; movers live on a different tab from holdings; the hero number is composed twice (portfolio-hero-panel.tsx wrapping PortfolioHero vs PortfolioHero+chart in the insights Surface). KPI row deviates: portfolio-hero-panel.tsx:56-105 = P/L · Cost · Best · Worst (Best/Worst duplicate the movers' job; ROI% missing as a stat). Range selector renders ABOVE the chart (portfolio-scrub-chart.tsx:206-221) instead of below it per the zone order.
- **ทางแก้:** ตอนรื้อหน้าใหม่ให้กลับไปหน้าเดียวตามลำดับ §5.3: หัวเรื่อง → เลขรวมใหญ่ → กราฟลาก (เต็มกว้าง) → แถบเลือกช่วงเวลา (ใต้กราฟ) → สี่ช่องสถิติ (มูลค่า·ทุน·กำไร/ขาดทุน·ผลตอบแทน%) → มูฟเวอร์ → รายการการ์ด — ถ้ายังอยากคงแท็บตาม §2 (Holdings·Performance) อย่างน้อยต้องมีกราฟย่อบนแท็บแรก และตัด Best/Worst ออกจากแถวสถิติเพราะซ้ำกับมูฟเวอร์
- **หมายเหตุ verify:** ALREADY FIXED. The finding describes the committed master state, but the current working tree (branch feat/portfolio-watchlist-teardown, uncommitted — PROGRESS.md updated 2026-07-16 confirms "รวม Portfolio Hub เข้าหน้ารายละเอียดแล้ว", awaiting เบส's review) has already torn the tabs down. /Users/lostxker/dev/Git/meecard/src/app/portfolio/[id]/portfolio-detail-client.tsx:325-413 now renders ONE Robinhood-style page — the code comment literally says "Single Robinhood-style page (VISION §5.3) — no more overview/insights tabs". Zone order on mobile: Hero (order-1) → PortfolioScrubChart (order-2, visible immediately on open) → KPIs (order-3) → Movers (order-4) → game chips → Holdings (order-6). So the headline claim "กราฟถูกซ่อนหลังแท็บที่สอง ผู้ใช้เปิดหน้ามาไม่เห็นกราฟเลย" no longer matches the code: the chart renders right under the hero on first paint, movers share the page with holdings, and the double hero composition is gone (PortfolioHeroPanel is now referenced only by portfolio-financial-guard.test.tsx, documented at src/components/portfolio/portfolio-kpis.tsx:19-21). Two minor letter-of-spec residues survive the fix: (1) KPI quartet is P/L · Cost Basis · Best · Worst (portfolio-kpis.tsx:47-96) instead of §5.3's Market Value · Cost Basis · P/L · ROI% — partly defensible since the hero IS market value, but Best/Worst does overlap the movers' job; (2) the range selector still sits above the chart (portfolio-scrub-chart.tsx:204-221) rather than below per the zone order. Those residues are low/medium cosmetic items at best — "high" severity is not honest for the current code, since the entire high-severity substance (chart invisible behind a second tab) is already resolved. If anything is worth carrying forward, it is a small follow-up on the KPI quartet composition and range-pill placement during the review of the teardown branch.

### 🟡 portfolio.2 [NEW] เพิ่มการ์ดหลายใบแล้วกำหนดจำนวน/ราคาทุนไม่ได้เลย — ทุกใบลงเป็น 1 ใบ ราคาทุนว่าง ต้องไล่เปิด dialog แก้ทีละแถว
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** src/components/portfolio/add-card-dialog.tsx:36-40 — onSubmit maps every picked card to `{ card, quantity: 1, purchasePrice: null }`; comment says 'edit qty / purchase price afterwards in the holdings table'. The step that used to capture qty/price (add-card-detail-step.tsx, with QtyStepper + cost input) is now orphaned (zero importers). Consequence: a collector adding 3 copies of one card, or wanting P/L, must add → find row → pencil → SingleEditDialog → type → save, per card; until then the hero shows the 'performance incomplete' note (portfolio-hero-panel.tsx:107-110) because cost basis is null.
- **ทางแก้:** ตอนรื้อใหม่ให้แถบตัวอย่างการ์ดที่เลือก (preview strip ใน add-card-select-step.tsx:471-508) มีปุ่ม +/- จำนวนและช่องราคาทุนแบบเร็วต่อใบ (ใช้ QtyStepper จาก kit) หรืออย่างน้อยมีขั้น 'ใส่รายละเอียด' หลังยืนยันแบบไม่บังคับ — จะได้ไม่เสียข้อดีของการเลือกทีละหลายใบที่เพิ่งทำมา

### 🟡 portfolio.3 [NEW] ปุ่มลบใน dialog แก้ไขหลายรายการมองไม่เห็นบนมือถือ (โผล่เฉพาะตอนเอาเมาส์ชี้)
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** src/components/portfolio/assets-table/bulk-edit-dialog.tsx:101-106 — delete button has `opacity-0 transition-all group-hover:opacity-100`; touch devices have no hover so the Trash2 control is invisible (still tappable but undiscoverable). The same dialog is the primary bulk-management surface on phones (opened from AssetsToolbar 'แก้ไขหลายรายการ').
- **ทางแก้:** ให้ปุ่มลบแสดงตลอดบนมือถือ (เช่น `opacity-100 sm:opacity-0 sm:group-hover:opacity-100` หรือแสดงจางๆ ด้วย opacity ต่ำแทนซ่อนสนิท) — ตรงกับกฎ mobile-first ใน AGENTS.md

### 🟡 portfolio.4 [NEW] delta ในตารางการ์ด (24h, กำไร/ขาดทุน) ไม่มีลูกศร ▲/▼ และเขียนเองแทนที่จะใช้ PriceTag จาก kit — หน้าเดียวกันมีทั้งแบบมีลูกศรและไม่มี ✅
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** VISION.md §4 rule 3: '▲/▼ บนทุก delta — สีคือ reinforcement, ลูกศรคือความหมาย'; kit canon: PriceTag = 'ราคา + %change (▲/▼) ทุกที่'. Violations: assets-table/action-menu.tsx:47-62 ChangeCell renders only +/− sign + color; assets-table/desktop-row.tsx:128-148 P/L cell same; assets-table/mobile-card.tsx:65-75 same. Meanwhile the SAME page's hero (portfolio-hero.tsx:107-112), hero panel (portfolio-hero-panel.tsx:71-76), movers (portfolio-movers.tsx:82,155-159) and by-game panel (portfolio-game-breakdown.tsx:135-140) all hand-roll lucide ArrowUp/ArrowDown — so holdings rows are the odd ones out, and none of the six spots use the canonical PriceTag.
- **ทางแก้:** ยุบการแสดง delta ทั้งหกจุดในหน้าให้ผ่าน `PriceTag` (โหมด changeOnly changeStyle=plain) ตัวเดียว — ได้ลูกศรครบตามกฎ ตาบอดสี/ขาวดำยังอ่านได้ และแก้สไตล์ครั้งหน้าแก้ที่เดียว
- **หมายเหตุ verify:** Verified all six cited spots at the exact lines: ChangeCell (action-menu.tsx:47-62), desktop-row P/L (128-148), mobile-card pct (65-75) render sign+color with no arrow, while portfolio-hero (107-112), hero-panel (71-76), movers (82, 155-159), and game-breakdown (135-140) hand-roll lucide ArrowUp/ArrowDown on the SAME /portfolio/[id] page. Zero PriceTag usage anywhere in src/components/portfolio/. Not a documented exception: AGENTS.md kit table exempts only Delta (grade-value) and DirectionPill (alert-form); VISION.md §4 rule 3 and the §3 PriceTag atom row exist verbatim as cited. Git history (bcbd3eb "minimal pass") shows arrows were deliberately KEPT on the hero delta while table cells never had them — drift, not intent. Not fixed on master. Caveat on the PROPOSAL only: 4 of 6 spots are abs-money+pct combos with hideBalance/MASKED handling that PriceTag (changeOnly = %-only) cannot render today — the kit table cites that exact combo as why Delta was kept out — so collapsing all six requires extending PriceTag, not a drop-in swap. A11y is also slightly softer than implied since the +/− text sign remains readable in grayscale. Severity med is honest: visible same-page inconsistency violating an explicit VISION rule on the flagship money page, but no functional break.

### 🟡 portfolio.5 [NEW] สวิตช์เปิด/ปิด 'การ์ดส่วนตัว' เขียนมือ 2 ชุดคนละขนาดใน dialog แก้ไข ทั้งที่ kit มี Switch แล้ว (ไม่มี role=switch ด้วย) ✅
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** Kit canon (AGENTS.md): Switch at ui/switch.tsx is THE toggle (SETTINGS-09 already consolidated the settings copies). But assets-table/single-edit-dialog.tsx:197-209 hand-rolls an h-5 w-9 track+thumb, and assets-table/bulk-edit-dialog.tsx:157-169 hand-rolls ANOTHER one at h-4 w-7 — two different sizes for the same control in the same feature. Neither has role="switch"/aria-checked (the kit Switch does), and neither meets the 44px tap rule the kit Switch ships with.
- **ทางแก้:** แทนทั้งสองจุดด้วย `Switch` จาก kit (ขนาดเดียว 44×24 + tap ≥44px + aria ครบ) แล้วลบสวิตช์เขียนมือทิ้ง — เป็นคู่สุดท้ายของ pattern ที่ SETTINGS-09 ไล่ยุบไปแล้ว
- **หมายเหตุ verify:** Verified against master. Both hand-rolled switches exist exactly as cited: single-edit-dialog.tsx:197-209 (h-5 w-9) and bulk-edit-dialog.tsx:157-169 (h-4 w-7) — two sizes for the same privacy toggle in the same feature, neither with role="switch"/aria-checked/aria-pressed, neither meeting 44px tap (bulk ~20px, single ~42px). Kit Switch (ui/switch.tsx) has role=switch + aria-checked + 44×24 + ≥44px tap expander and is imported only by 2 settings files. Not a documented exception: AGENTS.md kit table's intentional-difference list covers CardItem tiles only, and SETTINGS-09 was explicitly scoped to /settings/notifications + /settings/privacy (audit doc line 1237) — it consolidated the identical defect (2 hand-rolled switches, different sizes, one being the same h-5 w-9), making these the leftover pair. Not fixed elsewhere: the Phase 5 tap commit (a9fa182) touched these files but only added .tap-safe to the trash buttons, skipping the switches. Severity med matches the audit's own MED grade for the identical SETTINGS-09 defect. One implementation caveat for the proposal: both current tracks are nested inside a wrapping <button>, and kit Switch is itself a <button> — a straight swap would produce invalid nested buttons, so the row needs restructuring (e.g. label + Switch side by side).

### 🟡 portfolio.6 [NEW] ซากโค้ดกำพร้ารุ่นใหม่ ~1,020 บรรทัดจากการรื้อ hub ทิ้ง — ชุด manager/hub เก่า + ขั้นกรอกรายละเอียดตอนเพิ่มการ์ด ไม่มีใคร import แต่ test ยังรันดูแลอยู่
- **หน้า:** /portfolio + /portfolio/[id]
- **หลักฐาน:** Since /portfolio became a redirect gateway (src/app/portfolio/page.tsx:46 redirects to detail), these have ZERO production importers (verified by grep across src): portfolio-manager.tsx (515 lines, imported only by its own 302-line test), portfolio-manager-summary.tsx (75, only by manager), portfolio-manager-skeleton.tsx (66, only by tests), portfolio-hub-card.tsx (193, zero importers), add-card-detail-step.tsx (173, zero importers — replaced by CardBatchPickerDialog). Same failure mode as PORTFOLIO-01 (which was fixed) recurring one redesign generation later: next editor reads/maintains UI that cannot render.
- **ทางแก้:** ขอเบสยืนยันแล้วลบ 5 ไฟล์ + test ที่ผูกกับมัน (portfolio-manager.test.tsx และส่วน PortfolioSidebar-only ใน detail-skeleton test ให้คงไว้เฉพาะที่ทดสอบของจริง) — ถ้าอยากได้หน้า hub กลับมาในอนาคตค่อยเขียนใหม่บน spec ใหม่ อย่าเก็บของเก่ารอ

### 🟡 portfolio.7 [PORTFOLIO-08] หัวตารางการ์ดที่ตั้งใจให้ลอยค้าง มุดหายหลัง header หลักของเว็บตอนเลื่อน
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** src/components/portfolio/assets-table/desktop-table.tsx:33 thead `sticky top-0 z-10 bg-background` but both global headers are `sticky top-0 z-50` (layout/header.tsx:92, layout/header-mobile.tsx:30) — the thead pins at viewport top, exactly under the app header, so column labels are covered whenever the user scrolls. Unchanged since the 2026-07-04 audit; the planned fix (TOKENS-04 `--chrome-h` var) is still open.
- **ทางแก้:** ตรึงด้วยความสูง header จริง (รอ `--chrome-h` จาก TOKENS-04 แล้วใช้ `top-[var(--chrome-h)]`) หรือถอด sticky ออกไปก่อนถ้ารายการส่วนใหญ่ไม่ยาวพอให้คุ้ม

### ⚪ portfolio.8 [NEW] ป้ายสวิตช์การ์ดส่วนตัวใช้คำสั่งการ ('เปิดเผย') แทนคำบอกสถานะ — การ์ดที่เปิดเผยอยู่แล้วมีป้ายว่า 'เปิดเผย' ชวนงงว่ากดแล้วจะเกิดอะไร
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** single-edit-dialog.tsx:193-195 and bulk-edit-dialog.tsx:155 render `{isPrivate ? t('privateCard') : t('unmarkPrivate')}` — th.ts:1432 unmarkPrivate = 'เปิดเผย' (an ACTION string, EN 'Make public') shown as the current-state label when the card is already public. bulk-edit's own `title` attr uses the correct action pair (markAsPrivate/unmarkPrivate), so state and action vocabulary are mixed in the visible label.
- **ทางแก้:** ป้ายข้างสวิตช์ควรบอกสถานะเสมอ (เช่น 'ส่วนตัว' / 'แสดงในพอร์ตสาธารณะ') แล้วให้ตัวสวิตช์เป็นคนบอกทิศทางการกด — เพิ่มคีย์คำแปลสถานะฝั่งเปิดเผย 1 คีย์

### ⚪ portfolio.9 [NEW] ช่องจำนวนใน dialog แก้ไขเป็นช่องตัวเลขดิบ ไม่ใช้ QtyStepper จาก kit — จุดเดียวในเว็บที่แก้จำนวนโดยไม่มีปุ่ม +/-
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** Kit canon (PLAY-07): QtyStepper is THE quantity control ('drop/add-card/deck'). single-edit-dialog.tsx:131-137 and bulk-edit-dialog.tsx:112-118 use bare `<input type=number>` (bulk's is w-14, fiddly on phones). The only portfolio QtyStepper user was add-card-detail-step.tsx which is now orphaned — so the live portfolio flow has zero steppers while drop-calc/deck do.
- **ทางแก้:** เปลี่ยนช่องจำนวนทั้งสอง dialog เป็น `QtyStepper` (variant ตามพื้นที่ · min 1 · showInput) ให้แตะ +/- ได้บนมือถือเหมือนหน้าอื่น

### ⚪ portfolio.10 [NEW] หัวข้อ 3 ส่วนในแท็บ insights ใช้คนละแบบ (text-h5 มีกรอบ vs text-eyebrow) และไม่มีส่วนไหนใช้ SectionHead จาก kit
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** Sibling sections in the same tab: portfolio-game-breakdown.tsx:56 heading = `text-h5` inside its own padded header block; portfolio-movers.tsx:95 = `text-eyebrow`; portfolio-allocation-panel.tsx:28 = `text-eyebrow`. Kit canon has SectionHead ('หัวข้อ section + action ขวา') which none of them use — three treatments for the same role on one screen.
- **ทางแก้:** เลือกลำดับศักดิ์เดียว (แนะนำ text-h5 ผ่าน SectionHead ทุกแผง) ตอนรื้อหน้าใหม่ จะได้แก้ทีเดียวจบ

### ⚪ portfolio.11 [PORTFOLIO-14] แผงสัดส่วนการถือครองแบนไม่มีกล่อง ขณะพี่น้องทุกแผงในแท็บเดียวกันห่อ Surface — ท้ายหน้าเหมือนยังทำไม่เสร็จ
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** Still as audited: portfolio-allocation-panel.tsx:26-27 renders a flat `border-t border-hair` section while its siblings in the same insights tab are Surface panels (portfolio-detail-client.tsx:372 chart panel, :402 movers panel).
- **ทางแก้:** ห่อ allocation ด้วย Surface เหมือน movers (ทางง่ายสุด) หรือถ้าจะไปทาง editorial แบนก็ต้องแบนทั้งแท็บพร้อมกัน — ตัดสินตอนรื้อ zone ใหม่ทีเดียว

### ⚪ portfolio.12 [NEW] แถวมูฟเวอร์ที่ไม่มีรหัสการ์ดลิงก์ไป '#' — แตะแล้วเด้งขึ้นบนสุดของหน้าแทนที่จะไปหน้าการ์ด
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** portfolio-movers.tsx:70 and :113 — `href={code ? `/opcg/cards/${code}` : "#"}`; a row whose asset has no baseCode/cardCode becomes a dummy anchor that scrolls to top on tap (and hardcodes the /opcg prefix rather than the current game).
- **ทางแก้:** ถ้าไม่มีรหัสให้ render เป็น div เฉยๆ (ไม่ใช่ลิงก์) และสร้างเส้นทางจาก slug เกมของแถวแทน hardcode /opcg

### ⚪ portfolio.13 [NEW] หน้า preview ตอนยังไม่ล็อกอินวาดด้วยมือจนหน้าตาไม่ตรงหน้าจริงแล้ว (pill สลับพอร์ต/ตัวเลขคนละแบบ)
- **หน้า:** /portfolio + /portfolio/[id] (logged-out)
- **หลักฐาน:** portfolio-mock-preview.tsx:20-47 hand-rolls the top bar: pill = Surface subtle + `text-h4` name + Badge, while the real switcher pill (portfolio-switcher.tsx:133-153) is rounded-xl border bg-card + briefcase icon chip + text-sm name + meta privacy line — visibly different design. Hero hardcodes '¥15,580' (JPY) though the app default display currency is THB. The drift the old PORTFOLIO-04 warned about has happened to the preview.
- **ทางแก้:** ให้ preview ประกอบจาก component จริง (PortfolioSwitcher แบบ disabled + PortfolioHeroPanel ด้วย props ปลอม) หรืออย่างน้อยลอกหน้าตาปัจจุบันให้ตรง แล้วใส่หมายเหตุใน detail ว่าแก้หน้าจริงต้องแก้ preview ด้วย

### ⚪ portfolio.14 [NEW] ความกว้างหน้าไม่เท่ากันระหว่างทางผ่าน (gateway) กับหน้าจริง — เขียน max-w เองทั้งที่ระบบ chrome มีตัวคุมความกว้างกลาง
- **หน้า:** /portfolio → /portfolio/[id]
- **หลักฐาน:** portfolio-client.tsx:31 and :114 wrap content in hand-rolled `mx-auto max-w-6xl`, while the detail page renders bare and inherits PageContainer's default 7xl. main-chrome.tsx:74-77 explicitly says widths should be declared in ROUTE_WIDTH 'instead of hand-rolling mx-auto max-w-...'. Visible effect: the gateway's PortfolioDetailSkeleton renders at 6xl then the real detail pops to 7xl after redirect.
- **ทางแก้:** ถอด max-w-6xl ที่เขียนเองออก ให้ทั้งสองหน้าใช้ความกว้างเดียวกันผ่าน ROUTE_WIDTH (จะ default 7xl หรือประกาศ 6xl ทั้งคู่ก็ได้ แต่ต้องที่เดียว)

### ⚪ portfolio.15 [NEW] แท็บ overview/insights เป็นสถานะชั่วคราวในหน้า — รีเฟรช/ย้อนกลับ/แชร์ลิงก์แล้วเด้งกลับ overview เสมอ
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** portfolio-detail-client.tsx:109 `const [tab, setTab] = useState<PortfolioTab>("overview")` — the sub-tab (which VISION §2 treats as hub navigation) never reaches the URL, unlike ?add=1 which does (line 101, 175).
- **ทางแก้:** สะท้อนแท็บลง query (?tab=insights) ด้วย router.replace แบบเดียวกับ ?add=1 — bookmark/แชร์มุมมองผลตอบแทนได้ และปุ่มย้อนไม่กลืนสถานะ

### ⚪ portfolio.16 [NEW] ยังมีวงหมุน (Loader2) ค้างอยู่ 4 จุดใน area ขัดกฎ 'ศูนย์ spinner' ของ VISION
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** VISION §4.6 'ศูนย์ spinner: skeleton รูปร่างตรงกับ layout จริง … mutation = optimistic + .rise'. Live spinners: portfolio-selector.tsx:261 (row pending in the manage dialog), add-card-select-step.tsx:397 (load-more in picker), portfolio-share-dialog.tsx:195/212/230 (image-generation buttons), portfolio-name-form.tsx:77 (save button). Share-image generation is arguably legitimate work-in-progress, but the picker load-more and row-pending states have skeleton/optimistic alternatives.
- **ทางแก้:** จุดโหลดเพิ่มใน picker ใช้แถว skeleton ต่อท้ายแทนวงหมุน · แถว pending ใน dialog จัดการพอร์ตใช้ optimistic + จาง · ปุ่มสร้างรูปแชร์คงไว้ได้แต่ควรตัดสินเป็นข้อยกเว้นที่จดไว้

### ⚪ portfolio.17 [NEW] ไอคอนกุญแจ 'ส่วนตัว' ในรายการพอร์ตทาสี amber ดิบจาก palette แทน token
- **หน้า:** /portfolio/[id] (dialog จัดการพอร์ต)
- **หลักฐาน:** portfolio-selector.tsx:237 `text-amber-600/80 dark:text-amber-400/80` on the Lock icon — the only raw Tailwind palette color on chrome in the whole area; VISION identity says secondary icons stay neutral and the only warm accent is the honey token (--primary). Everywhere else the same private state uses neutral (switcher pill portfolio-switcher.tsx:146) or Badge neutral (mock preview).
- **ทางแก้:** เปลี่ยนเป็น text-muted-foreground (ตามที่ pill ใช้) หรือ text-primary ถ้าตั้งใจเน้น — อย่างใดอย่างหนึ่งทั้ง area

<a id="watchlist-track"></a>
## Watchlist + Saved + Alerts

**ภาพรวม:** หน้า watchlist หลังรื้อใหม่อยู่ในสภาพดีมาก — ปัญหาเก่าส่วนใหญ่ (ปุ่มจิ๋ว 5 ตัว, window.confirm, skeleton เพี้ยน, สี amber, sparkline xl:) ถูกแก้แล้ว แถวสะอาด แตะได้ ≥44px และ alerts ย้ายมาเป็นแท็บคู่กันแล้ว ความเจ็บที่เหลือกระจุกอยู่ 3 จุด: (1) หน้า /saved ยังเป็นโค้ดยุคเก่าทั้งหน้า — ไม่ใช้ชุด component กลางเลย (ราคา/เปลี่ยนหน้า/โครงหน้า) ลบทีเดียวทั้งจอกระพริบเป็นโครงโหลด และมือถือเห็นทีละใบเดียว (2) กล่องสร้างแจ้งเตือน 2 ทางเข้าบนหน้าเดียวกันยังมีพฤติกรรมคนละแบบ (เติมราคาให้ vs ช่องว่าง, เต็มจอ vs กล่องเล็ก) (3) ไอคอนหัวใจถูกใช้ทั้ง watchlist และรายการที่บันทึกของ marketplace — จะชนกันทันทีเมื่อเปิด marketplace กลับมา

### 🟡 watchlist-track.1 [TRACK-03] หัวใจถูกใช้ 2 ความหมาย: watchlist กับรายการที่บันทึก (marketplace) — จะชนกันเมื่อเปิด marketplace
- **หน้า:** bottom-nav + header + /watchlist + /saved + more + header-user-menu
- **หลักฐาน:** Watchlist now uses Heart everywhere: bottom-nav.tsx:21 `icon: Heart` for /watchlist, header.tsx:187 `<Heart className="size-3.5 text-primary" />`, watchlist-tabs.tsx:24 cards tab icon Heart, watchlist-heart.tsx (card toggle button). BUT saved listings ALSO use Heart in more-client.tsx:255-256 `icon={Heart} iconClassName="bg-destructive/10 text-destructive"` and header-user-menu.tsx:249-251 `<Heart .../> savedListings`, while the actual save action + /saved page use Bookmark (marketplace/[listingId]/save-button.tsx:46 `<Bookmark ... fill-primary>`, saved/page.tsx:6,127,146 icon={Bookmark}). Labels are near-synonyms too: th.ts:17 watchlistNav="รายการโปรด" vs th.ts:19 savedListings="รายการที่บันทึก". Hidden today because marketplaceEnabled=false (saved/layout.tsx:8) but collides the day the flag opens.
- **ทางแก้:** ล็อกหัวใจ = watchlist อย่างเดียว (ตอนนี้ทำถูกแล้วทุกจุด) แล้วให้รายการที่บันทึกของ marketplace ใช้ Bookmark ให้ครบทุกจุด — เปลี่ยนไอคอนใน more-client และ header-user-menu จาก Heart เป็น Bookmark (และเลิกย้อมแดง destructive บนไอคอนเมนู) พร้อมปรับป้ายเป็น "ประกาศที่บันทึก" ให้ชัดว่าเป็นของ marketplace ก่อนเปิด flag กลับมา

### 🟡 watchlist-track.2 [TRACK-04] สร้างแจ้งเตือนราคา 2 ทางเข้าบนหน้าเดียวกัน ได้ประสบการณ์คนละแบบ (เติมราคาให้ vs ช่องว่าง, เต็มจอ vs กล่องเล็ก)
- **หน้า:** /watchlist (ทั้งแท็บการ์ดและแท็บแจ้งเตือน)
- **หลักฐาน:** Same page, two create-alert flows: (A) row bell → CardSetAlertDialog: pre-fills target with current price (card-set-alert-dialog.tsx:57-65 initialTarget from currentPriceJpy), shows a checkmark for 1300ms before closing (:92-99 setTimeout 1300), small centered dialog `sm:max-w-sm` (:129). (B) header "+ สร้าง Alert" → AlertCreateDialog: target starts EMPTY even after picking a card that has latestPriceJpy (alert-create-dialog.tsx:45-49, :54), closes instantly on success (:77-80), and is full-screen on mobile (:89-91). VISION §5.1 zone 9 says Set Alert should pre-fill. The refactor plan explicitly left this drift as "งาน UX แยก" after the useAlertSubmit unification (doc/uxui-refactor-plan.md:124).
- **ทางแก้:** เลือกพฤติกรรมเดียว: เติมราคาปัจจุบันให้ทุกทางเข้า (ตามทิศ VISION) + ผลลัพธ์หลังสร้างเหมือนกัน (แนะนำปิดทันทีแล้วโชว์ป้าย "บันทึกแล้ว" บนแถว แบบที่แท็บแจ้งเตือนทำอยู่) และใช้เปลือกกล่องแบบเดียวกันทั้งสองทางเข้า

### 🟡 watchlist-track.3 [RESPONSIVE-05] ปุ่มเลือกทิศทาง/ช่องทางแจ้งเตือนในฟอร์ม alert สูงแค่ 32px เรียงชิดกัน — กดพลาดง่ายบนมือถือ
- **หน้า:** ฟอร์มแจ้งเตือนราคา (ใช้จาก /watchlist, card detail)
- **หลักฐาน:** alert-form.tsx:193 DirectionPill `h-8 rounded-md border px-2 text-xs` (32px) in a `grid grid-cols-2 gap-1.5` (:94); ChannelPill :226 `h-8` in `grid grid-cols-3 gap-1.5` (:140) — three 32px buttons side-by-side with 6px gaps on a phone dialog. Target input also `h-9` (:123). The rest of the app now enforces ≥44px on mobile (button-variants.ts sm=`min-h-11`, watchlist toolbar controls h-11). This is the surviving half of RESPONSIVE-05 (the watchlist FilterPill half was fixed — FilterModal ToggleRow is min-h-11, watchlist-toolbar.tsx:408).
- **ทางแก้:** ยกความสูงปุ่มในฟอร์มเป็น h-11 บนมือถือ (แล้วค่อยลดเหลือเดิมที่ md: ตามแบบแผน min-h ที่ใช้ทั้งแอป) — แก้ที่ alert-form.tsx ไฟล์เดียว ได้ผลทุกทางเข้า

### 🟡 watchlist-track.4 [NEW] ลบรายการที่บันทึกใน /saved ทำทั้งจอกระพริบเป็นโครงโหลด และไม่มีถามยืนยัน — ต่างจาก watchlist สิ้นเชิง
- **หน้า:** /saved
- **หลักฐาน:** saved/page.tsx:90-101 handleRemove awaits `fetchSaved()` which sets `setLoading(true)` (:61-62) → the WHOLE grid unmounts into a skeleton on every single-item removal; no confirm dialog before removing; feedback only on failure (toast.error). Contrast watchlist removeSingle (watchlist-client.tsx:355-396): useConfirm destructive dialog → optimistic removal of just that row → success toast → silent background reload. VISION §4.6: mutation = optimistic. Same job (เอาของออกจากรายการที่เก็บไว้) = two opposite experiences.
- **ทางแก้:** ทำให้เหมือน watchlist: ถามยืนยันก่อนลบ (useConfirm ตัวเดียวกัน) แล้วลบเฉพาะใบนั้นออกจากรายการทันที (optimistic) + คืนกลับถ้าพลาด — เลิกโหลดทั้งหน้าใหม่หลังลบ

### 🟡 watchlist-track.5 [TRACK-06] มือถือ /saved เห็นการ์ดทีละ 1 ใบเต็มจอ — ไม่ตรงมาตรฐานตาราง 2 คอลัมน์ของทั้งแอป
- **หน้า:** /saved
- **หลักฐาน:** saved/page.tsx:157 `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` — base (mobile) = 1 column of aspect-[3/4] full-width tiles (:175), so one card per screen. App canon CardGrid is 2 columns from base: card-grid.tsx:12 `grid grid-cols-2 gap-4 sm:grid-cols-3 ...`. Unchanged since the 2026-07-04 audit.
- **ทางแก้:** เริ่ม 2 คอลัมน์ตั้งแต่จอเล็กตามมาตรฐานแอป (grid-cols-2 sm:grid-cols-2 lg:grid-cols-3) — รูปกระชับขึ้นและกวาดตาง่ายขึ้นทันที

### 🟡 watchlist-track.6 [TRACK-07] หน้า /saved เป็น client ทั้ง route 277 บรรทัด — ผิดโครงจาก watchlist และตั้ง metadata ไม่ได้
- **หน้า:** /saved
- **หลักฐาน:** saved/page.tsx:1 `"use client"` on the whole route file (277 lines: types + fetch + grid UI + pagination in one file, no Metadata export). Watchlist pattern is server page.tsx (metadata, watchlist/page.tsx:5-11) + client component. Unchanged since the audit.
- **ทางแก้:** แยกเป็น page.tsx ฝั่ง server (ใส่ metadata) + saved-client.tsx ตามโครงเดียวกับ watchlist — เหมาะทำพร้อมรอบเก็บกวาด /saved ก่อนเปิด marketplace

### ⚪ watchlist-track.7 [TRACK-05] โครงโหลดของ /saved ยังไม่ตรงหน้าจริง 2 จุด (route = แถวรายการ, ในหน้า = กริดคนละสัดส่วน)
- **หน้า:** /saved
- **หลักฐาน:** Route-level saved/loading.tsx:10-22 renders 8 list rows in a panel, but the real page is a card grid. In-page loading (saved/page.tsx:118-123) uses LoadingState variant="skeleton-grid" which is `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` of h-44 blocks (loading-state.tsx:46,51) while the actual grid is 1-col mobile / sm:2 / lg:3 of tall aspect-[3/4] cards (page.tsx:157,175). The spinner half of TRACK-05 is fixed; the shape-drift half remains (VISION §4.6: skeleton ต้องรูปร่างตรง layout จริง).
- **ทางแก้:** ทำ skeleton ทรงเดียว (การ์ดสูง 3/4 + แถวข้อความ ตามคอลัมน์จริงของหน้า) แล้วใช้ร่วมกันทั้ง loading.tsx และตอนโหลดในหน้า จะได้ไม่ drift อีก

### ⚪ watchlist-track.8 [NEW] AlertCreateDialog เขียนเปลือกกล่องเต็มจอมือถือเองทั้งที่มี ResponsiveDialogContent ใน kit แล้ว
- **หน้า:** /watchlist (กล่องสร้างแจ้งเตือน)
- **หลักฐาน:** alert-create-dialog.tsx:89-91 hand-rolls `max-md:!inset-0 max-md:!max-h-none max-md:!max-w-none max-md:!translate-x-0 max-md:!translate-y-0 max-md:!rounded-none md:h-auto md:max-h-[85dvh] md:w-full md:max-w-[34rem]` — byte-for-byte the same result as the canonical ResponsiveDialogContent (responsive-dialog-content.tsx:19-21, same 34rem / 85dvh). Also written desktop-first with `max-md:` + `!important` overrides, which AGENTS.md explicitly forbids ("Don't write desktop-first with max-md:").
- **ทางแก้:** เปลี่ยนมาใช้ ResponsiveDialogContent จาก kit แทนคลาสที่เขียนเอง — ลดของซ้ำและตัด max-md:! ทิ้งทั้งชุด

### ⚪ watchlist-track.9 [NEW] /saved เขียนตัวเปลี่ยนหน้าเอง ทั้งที่มี Pagination กลางใน kit
- **หน้า:** /saved
- **หลักฐาน:** saved/page.tsx:249-271 hand-rolled prev/next Buttons + `paginationPageOf` text, while the Component Kit canon lists `Pagination` (ui/pagination.tsx, "เปลี่ยนหน้ารายการฝั่งผู้ใช้ — ปุ่มมือถือ ≥44px, compact range ใต้ sm") as the one to use. The hand-rolled buttons are size="sm" without the kit's mobile page-range behavior.
- **ทางแก้:** แทนด้วย Pagination จาก kit (ส่ง page/totalPages/onPageChange) — ได้ปุ่ม ≥44px และหน้าตาเดียวกับหน้าอื่นฟรี

### ⚪ watchlist-track.10 [NEW] /saved แสดงราคาด้วยการจัดรูปแบบเอง ไม่ผ่าน PriceTag ที่เป็นมาตรฐานทุกหน้า
- **หน้า:** /saved
- **หลักฐาน:** saved/page.tsx:211-219 renders price as `<span className="font-bold font-price">{formatJpy(...)}</span>` + THB in text-meta — hand-rolled. Kit canon: `PriceTag` = "ราคา + %change (▲/▼) ทุกที่" (ui/price-tag.tsx); watchlist rows use it (watchlist-list-view.tsx:233-247, :392-404). Different weight/format from every other price in the app.
- **ทางแก้:** เปลี่ยนเป็น PriceTag (โหมดไม่โชว์ %เปลี่ยนแปลง) ให้ราคาบน /saved หน้าตาเดียวกับทุกหน้า

### ⚪ watchlist-track.11 [NEW] หน้า /watchlist หน้าเดียว มีภาษา error/รายการว่าง 2 แบบระหว่างแท็บการ์ดกับแท็บแจ้งเตือน
- **หน้า:** /watchlist (cards tab vs alerts tab)
- **หลักฐาน:** Cards tab error → EmptyState kit with preset="error" + retry (watchlist-client.tsx:497-516). Alerts tab error → hand-rolled `Surface variant="outline" p-6 text-center` + plain <p> + retry (alerts-manager-client.tsx:268-282). Inside the alerts tab itself, FilteredEmpty is another hand-rolled dashed box (`rounded-xl border border-dashed border-hair bg-card/50 px-6 py-10`, :362-383) while ActiveEmpty right next to it uses the EmptyState kit (:385-407). Same page, three vocabularies for "ไม่มีของ/พัง".
- **ทางแก้:** ให้แท็บแจ้งเตือนใช้ EmptyState ตัวเดียวกับแท็บการ์ดทั้งกรณี error และกรณีกรองแล้วว่าง (variant dashed + ปุ่ม "ดูทุกเกม" ผ่าน action prop) — ลบกล่องเขียนเอง 2 ใบ

### ⚪ watchlist-track.12 [TRACK-01] กดกระดิ่งการ์ดที่มีแจ้งเตือนแล้ว: เมนูเขียนเป็นสถานะ ("มีแจ้งเตือนทำงานอยู่") แต่จริงๆ เป็นปุ่มพาไปอีกแท็บ และไปถึงก็ไม่ชี้ว่าอันไหน
- **หน้า:** /watchlist
- **หลักฐาน:** watchlist-client.tsx:469-479 — bell on a card with hasActiveAlert routes to `?tab=alerts` (duplicate-create fixed ✓). But the dropdown item label is `watchlistHasAlert` = "มีแจ้งเตือนทำงานอยู่" (watchlist-list-view.tsx:477-479, th.ts:497) — reads as a status, not an action — and landing on the alerts tab shows the FULL alert list with no scroll-to/highlight of that card's alert; user must find it manually. Refactor plan notes the full inline sheet was deferred to Phase 5 (uxui-refactor-plan.md:74).
- **ทางแก้:** ขั้นสั้น: เปลี่ยนข้อความเมนูเป็นคำสั่ง เช่น "จัดการแจ้งเตือนของการ์ดนี้" และส่ง card code ไปกับ URL เพื่อเลื่อน/ไฮไลต์แถวนั้นในแท็บแจ้งเตือน · ขั้นเต็ม: sheet แสดงแจ้งเตือนของการ์ดใบนั้นตามแผน Phase 5

### ⚪ watchlist-track.13 [NEW] ปุ่ม LINE ที่ล็อกอยู่ในฟอร์มแจ้งเตือนใช้สี amber ดิบ — เกิด "ทอง 2 เฉด" ข้างสี honey ของแบรนด์
- **หน้า:** ฟอร์มแจ้งเตือนราคา (ทุกทางเข้า)
- **หลักฐาน:** alert-form.tsx:230 `border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10` and :234 `text-amber-600 dark:text-amber-400` hardcoded for the locked LINE channel — Tailwind amber (#f59e0b family), not the honey token --primary #E9B970. Same amber family also in upgrade-dialog.tsx:147,182, so it has become a de-facto second gold. VISION §1: honey-gold คือ accent interactive เดียว; the equivalent amber on watchlist-star was already purged (TRACK-11 fixed).
- **ทางแก้:** ตัดสินให้จบว่าสถานะ "ล็อก/ต้องอัปเกรด" ใช้สีอะไร — ถ้าจะเป็นทอง ให้ใช้ token primary/honey ไม่ใช่ amber ดิบ แล้วกวาดทั้ง alert-form และ upgrade-dialog ในคอมมิตเดียว

### ⚪ watchlist-track.14 [NEW] แท็บแจ้งเตือนไม่มีช่องค้นหา/เรียงลำดับเลย ขณะที่แท็บการ์ดข้างกันมีครบ
- **หน้า:** /watchlist?tab=alerts
- **หลักฐาน:** AlertsManagerClient renders only game chips + active/history sections (alerts-manager-client.tsx:284-322) — no search, sort, or filter — while the sibling cards tab has the full toolbar (search/set/sort/filter/period, watchlist-toolbar.tsx:128-187). A user with many alerts (multi-alert per card is a supported feature) has to scan the whole list to find one.
- **ทางแก้:** ยังไม่ต้องยกชุดเครื่องมือทั้งแผง — เริ่มจากช่องค้นหาชื่อ/รหัสการ์ดหนึ่งช่องพอ (ใช้ ToolbarSearch ตัวเดียวกับแท็บการ์ด) เมื่อรายการยาวเกินหนึ่งจอ

### ⚪ watchlist-track.15 [NEW] ชื่อการ์ดยาวในแถวแจ้งเตือนถูกตัดทิ้งเฉยๆ ไม่มีจุดไข่ปลา (truncate วางบนกล่อง flex)
- **หน้า:** /watchlist?tab=alerts
- **หลักฐาน:** alert-row.tsx:116 — the card-name Link is `className="flex min-h-11 items-center truncate ..."`. `truncate` (overflow-hidden + text-overflow ellipsis + nowrap) sits on a flex container; text-overflow does not apply to a flex container's anonymous text item, so long names hard-clip at the edge with no "…". Compare watchlist rows which put truncate/line-clamp on a plain block <p> (watchlist-list-view.tsx:336).
- **ทางแก้:** ห่อข้อความชื่อด้วย <span className="truncate"> ข้างใน Link (คง flex ไว้ที่ตัวลิงก์) เหมือนแถว watchlist — จุดไข่ปลาจะกลับมา

<a id="home"></a>
## หน้าแรก + market-overview + trending

**ภาพรวม:** โครงหลักของหน้าแรกแข็งแรง (hero ค้นหา + ตาราง market ใช้ kit กลางเกือบครบ ระบบค้นหายุบเป็น engine เดียวแล้ว, HOME-01/03/05/08/11 แก้แล้วจริง) แต่ความไม่สม่ำเสมอ "ข้ามหน้า" ยังชัด: trending เขียนตาราง+แถวมือถือเองทั้งชุดแทนที่จะใช้ MarketTable กลาง ทำให้แถวการ์ดหน้า trending หน้าตาไม่เหมือนหน้าแรก (ลูกศร ▲/▼ มี/ไม่มีสลับกัน ทศนิยมไม่เท่ากัน) และ /market-overview ยังมี DeltaPill + หัว section 3 สำนวนของตัวเอง นอกจากนี้มีช่องโหว่ UX ที่มองไม่เห็นจากตา เช่น โหลดตารางพังแล้วเงียบ (หน้า /search มีป้ายผิดพลาด+ปุ่มลองใหม่ แต่หน้าแรกไม่มี) และมุมมองตารางแบบรูป (grid) เปลี่ยนการเรียงไม่ได้เลยทุกขนาดจอ งานที่คุ้มสุดคือยุบ trending เข้า MarketTable + รวมตัวแสดง delta เป็น PriceTag ตัวเดียวแบบมีลูกศรเสมอ

### 🔴 home.1 [DISCOVERY-10] หน้า trending เขียนตารางและแถวมือถือเองทั้งชุด ทั้งที่มีตารางกลาง MarketTable อยู่แล้ว
- **หน้า:** /opcg/trending vs / (home) vs /search
- **หลักฐาน:** src/app/trending/trending-tabs.tsx:44-102 (MobileTrendingItem hand-rolled), :104-174 (TrendingRow hand-rolled <tr>), :262-331 (own Surface mobile list + own <table>) — same job as the shared MarketTable (src/components/market/market-table.tsx:29-35 docstring: "used by BOTH the homepage and /search") + MobileCardItem (src/components/home/mobile-card-item.tsx:18-88). Visible drift already: trending shows ▲/▼ arrows + decimals={2} (trending-tabs.tsx:96,160) while the home table hides arrows + 1 decimal (market-table-row.tsx:120-124); sparkline 80px (trending-tabs.tsx:166) vs 88px (market-table-row.tsx:129); trending rows have no watchlist star column and a different set-link style (plain text vs dotted underline, trending-tabs.tsx:144-149 vs market-table-row.tsx:98-104).
- **ทางแก้:** แปลง TrendingCardRow ให้เข้าโครง CardRow แล้วให้หน้า trending แสดงผลผ่าน MarketTable + buildMarketColumns (มี showViews รองรับแท็บคนดูมากสุดอยู่แล้ว) เหลือ trending-tabs ทำหน้าที่คุมแท็บ/ช่วงเวลาอย่างเดียว — แก้ดีไซน์แถวการ์ดครั้งเดียวจะมีผลทุกหน้า และหน้าตาแถวการ์ดจะเหมือนกันทั้งเว็บ

### 🔴 home.2 [HOME-07] ตัวเลข % ขึ้น-ลงแสดงคนละแบบใน 3 หน้า: หน้าแรกตัดลูกศรทิ้ง (ขัดกฎ VISION) ส่วน market-overview ยังมี DeltaPill เขียนเองซ้ำกับ PriceTag
- **หน้า:** / (home), /opcg/market-overview, /opcg/trending
- **หลักฐาน:** VISION.md §4 rule 3 mandates ▲/▼ on every delta (color = reinforcement only). But the home/search market table passes showArrow={false}: src/components/market/market-table-row.tsx:120-124, src/components/home/sections/mini-table.tsx:73, src/components/home/mobile-card-item.tsx:83 — while trending uses the default arrow (trending-tabs.tsx:96,160) and market-overview uses its own hand-rolled DeltaPill WITH arrow (src/app/market-overview/_components/hero-market-card.tsx:227-293, page-private _components) even though PriceTag declares itself "the ONE money atom" (src/components/ui/price-tag.tsx:57-61). Result: 3 market pages, 3 delta looks (plain no-arrow / plain arrow 2-decimals / soft pill arrow).
- **ทางแก้:** เลิกส่ง showArrow={false} ในตาราง market ทุกจุด (ให้ลูกศรติดมาเสมอ) และย้ายความสามารถของ DeltaPill (ป้ายช่วงเวลา + โทนพื้นอ่อน) เข้าเป็น variant ของ PriceTag แล้วลบ DeltaPill ทิ้ง — ให้เหลือตัวแสดงราคา/เดลต้าตัวเดียวทั้งเว็บตาม kit canon

### 🟡 home.3 [NEW] โหลดตาราง market หน้าแรกพังแล้วเงียบ ไม่มีข้อความผิดพลาดหรือปุ่มลองใหม่ (หน้า /search มี)
- **หน้า:** / (home)
- **หลักฐาน:** src/hooks/use-market-cards.ts:53,105-108 sets an error state ("Failed to load cards") but src/components/home/home-market-overview.tsx never reads m.error anywhere — on fetch failure the table silently keeps stale rows at full opacity. Contrast: /search renders EmptyState variant="error" + retry button for the same failure (src/app/search/search-client.tsx:515-524). User changing filter/page on a flaky connection sees nothing happen with zero feedback.
- **ทางแก้:** แสดงสถานะผิดพลาดใน HomeMarketOverview แบบเดียวกับ /search (EmptyState variant=error + ปุ่มลองใหม่ ที่ยิง fetch ล่าสุดซ้ำ) เพื่อให้สองหน้าที่ใช้ตารางเดียวกันตอบสนองเหมือนกัน

### 🟡 home.4 [NEW] มุมมองแบบรูป (grid) เปลี่ยนการเรียงลำดับไม่ได้เลย ทั้งมือถือและจอใหญ่
- **หน้า:** / (home)
- **หลักฐาน:** src/components/home/home-market-overview.tsx:112-115 — mobile sort dropdown is gated to `m.viewMode === "table"`; the desktop toolbar row (:224-251) contains no sort control (desktop sorting exists only via table column headers, which disappear in grid view); the grid branch (:352-363) offers only the 24h/7d/30d display toggle which changes the % shown, not the order. So in grid view there is no way on any screen size to switch e.g. from price-desc to biggest 7d movers.
- **ทางแก้:** แสดงตัวเลือกการเรียง (dropdown เดียวกับที่ใช้บนมือถือ) ในมุมมอง grid ด้วย ทั้งสอง breakpoint — ใช้ ToolbarSortDropdown ตัวเดิม ไม่ต้องสร้างใหม่

### 🟡 home.5 [HOME-02] รายการมือถือของตาราง market ปักตัวเลข 24 ชม. ตายตัว แม้ผู้ใช้เรียงตาม 7 วัน/30 วัน
- **หน้า:** / (home) มือถือ
- **หลักฐาน:** src/components/home/mobile-card-item.tsx:31 (`const c24 = card.priceChange24h`) + :83 — the mobile list row always renders the 24h pill; the 24h/7d/30d period control lives only in the grid branch (home-market-overview.tsx:352-363). Mobile sort by change7d/change30d is now possible (:206-220, the fixed half of HOME-02) but the number displayed next to each row stays 24h, so the list looks unsorted/random when sorted by 7d.
- **ทางแก้:** ส่งค่า sort ปัจจุบัน (หรือ changePeriod) ลงไปให้ MobileCardItem เลือกโชว์ % ช่วงเวลาที่ตรงกับการเรียง — ให้ตัวเลขที่เห็นตรงกับเกณฑ์ที่ผู้ใช้เลือกเสมอ

### 🟡 home.6 [HOME-10] หัว section ใน market-overview มี 3 สำนวน (ขนาด/โครงต่างกัน) และไม่ใช้ SectionHead ตัวกลางของ kit
- **หน้า:** /opcg/market-overview
- **หลักฐาน:** src/app/market-overview/market-overview-client.tsx:222-253 — local `SectionHeader` (h2 text-h3, floating on canvas) vs :141-157 inline header (h2 text-h4 inside Surface panel, layout copy-pasted) vs src/app/market-overview/_components/rarity-breakdown.tsx:48-57 (another inline h2 text-h4 header). The shared kit `SectionHead` (src/components/shared/section-head.tsx:7, canon per AGENTS.md) is not used anywhere on this page. Sibling sections read as different hierarchy levels for no data reason.
- **ทางแก้:** ขยาย SectionHead กลางให้รับ caption/hint/action แล้วให้ทุก section บนหน้านี้ใช้ตัวเดียวกันขนาดเดียวกัน (text-h3) — ลบ SectionHeader local และ header ที่เขียน inline ทิ้ง

### 🟡 home.7 [NEW] แถบแท็บ scope ของตาราง market หน้าแรกเขียนเอง ขณะที่หน้า trending ใช้ SegmentedControl — งานเดียวกันหน้าตาคนละแบบ ✅
- **หน้า:** / (home) vs /opcg/trending
- **หลักฐาน:** src/components/home/home-market-overview.tsx:161-176 hand-rolls tab buttons (border-b-2 -mb-px underline pattern) for choosing list scope (ทั้งหมด/ยอดนิยม), while trending implements the identical "scope of the card list" control as SegmentedControl (trending-tabs.tsx:238-243). Kit canon (AGENTS.md Component Kit) lists SegmentedControl · Tabs (ui/tabs.tsx has a variant="line" underline style) as the canonical pick-1-of-N controls — a hand-rolled duplicate where canon exists.
- **ทางแก้:** เลือกภาษาเดียวสำหรับ "เลือก scope ของลิสต์การ์ด" ทั้งเว็บ: ถ้าจะคงแบบขีดเส้นใต้ ให้ย้ายไปใช้ Tabs variant line จาก kit แล้วหน้าอื่นที่ทำงานเดียวกันใช้ตาม — ไม่เขียนปุ่มแท็บเองในไฟล์หน้า
- **หมายเหตุ verify:** Confirmed. home-market-overview.tsx:161-176 hand-rolls border-b-2/-mb-px underline tabs for list scope (all/popular) while trending-tabs.tsx:238-243 uses SegmentedControl for the identical job (gainers/losers/mostViewed) — both verified at HEAD. ui/tabs.tsx really has variant="line" (underline via after: bar) and is used elsewhere, so the proposal is viable. Not a documented exception: AGENTS.md kit's only segmented-control deferral is EditionToggle; KIT-10's "FilterTabs = SKIP" is a different honey component. Not fixed: no TabBar atom exists and the pattern persists in 4 files (sets-page-client.tsx:113, home, admin-sub-nav.tsx:59, profile-tabs-nav.tsx:102). Corroborating: the project already logged this debt as SETS-03 (🟠 MED, uxui-audit-findings-2026-07-04.md:487-494) and PLAN.md:11 lists pending "TabBar" consolidation in Phase 2 — so this finding partially duplicates SETS-03 (dedupe when planning; fix should cover all 4 sites, not just home). Severity med matches the project's own MED rating for the same issue.

### 🟡 home.8 [NEW] กล่อง "หน้าที่เกี่ยวข้อง" ใน trending และ market-overview ปักข้อความไทย/อังกฤษตายตัว ไม่ผ่านระบบแปลภาษา ✅
- **หน้า:** /opcg/trending, /opcg/market-overview
- **หลักฐาน:** src/app/market-overview/page.tsx:178-184 and src/app/trending/page.tsx:109-115 pass hardcoded strings to RelatedPages ("การ์ดที่ราคาขยับมากที่สุด", English title "Market Overview" mixed with Thai descriptions) while every other block on both pages goes through t(lang,...). The same RelatedPages component on the home page is fully localized (src/components/home/home-seo-content.tsx:47-86 uses t(lang,...)). EN/JP users get a Thai/English mixed block at the bottom of both pages.
- **ทางแก้:** ย้ายข้อความของ RelatedPages ทั้งสองหน้าเข้า key แปลภาษาแบบเดียวกับหน้าแรก (หรือทำผ่าน client component ที่อ่าน lang ได้ เนื่องจากสองหน้านี้เป็น ISR)
- **หมายเหตุ verify:** CONFIRMED. Evidence matches exactly: market-overview/page.tsx:178-184 and trending/page.tsx:109-115 pass hardcoded Thai/English strings to RelatedPages while every other block on both pages uses t(lang,...) (trending-tabs.tsx and market-overview-client.tsx are fully localized; trending even renders LocalizedBreadcrumb right above the hardcoded block). Home (home-seo-content.tsx:47-86) AND marketplace/page.tsx:227-235 both localize the same component via t(lang,...), so the localized pattern already exists. Not an exception: RelatedPages has no kit-table/doc carve-out; PLAN.md:411-412 (R3 i18n hardening backlog, ~152 files) explicitly plans to sweep hardcoded Thai — this is known-category unfixed debt, not intentional design. Not fixed on master (clean tree). Two caveats: (1) finding undercounts — search/page.tsx:65-69 hardcodes the identical three items verbatim and sets/page.tsx:105+ hardcodes four more, so the fix should cover those siblings; (2) related-pages.tsx:14 also defaults the section heading to hardcoded "เพิ่มเติม" which neither page overrides. Severity med is honest: visible TH/EN mixing for EN/JP users on live indexed pages of a product advertising TH/EN/JP support, but it is auxiliary bottom-of-page nav, not functional breakage. Proposal is sound — both pages are ISR (revalidate=300), so client-convert (useUIStore pattern like HomeSeoContent) is the correct mechanism per the project's i18n architecture.

### 🟡 home.9 [DISCOVERY-13] โครงหัวหน้า (breadcrumb + ชื่อหน้า) ประกอบคนละแบบระหว่าง trending กับ market-overview
- **หน้า:** /opcg/trending vs /opcg/market-overview
- **หลักฐาน:** trending renders LocalizedBreadcrumb as a separate block ABOVE the header (src/app/trending/page.tsx:102-104) and its PageHeader has no breadcrumb slot (trending-tabs.tsx:336-344), while market-overview embeds a manually-labelled Breadcrumb INSIDE PageHeader's breadcrumb prop (market-overview-client.tsx:64-82). Two breadcrumb components (LocalizedBreadcrumb w/ labelKey vs Breadcrumb w/ t() labels) and two placements for the same job — sibling stat pages start with a different eye-line.
- **ทางแก้:** เลือกแบบเดียว: PageHeader + breadcrumb ใน slot (แบบ market-overview) เป็นมาตรฐานของหน้าลูกทุกหน้า แล้วให้ trending (และหน้า family เดียวกัน) ย้ายตาม พร้อมยุบ Breadcrumb/LocalizedBreadcrumb ให้เหลือทางเรียกเดียว

### 🟡 home.10 [HOME-06] ทางเข้า "เลือกชุดการ์ด" บนมือถือยังจมอยู่ใต้ hero + ไฮไลต์ + โฆษณา ~2 จอ ทั้งที่ผู้ใช้เริ่มจากชุดก่อน
- **หน้า:** / (home) มือถือ
- **หลักฐาน:** src/app/page.tsx:86-119 — order: search hero → highlights band → AdSlot (md:hidden) → market table (mt-9). The only set entry in content is the SetPicker row inside the table toolbar (home-market-overview.tsx:182-192 — now full-width + prominent, a partial fix), still ~2 screens of scroll away on mobile. Owner-approved direction (browse-by-set first, CMC category style) proposed a visible set rail above the table; plan line 173 (HOME-06) remains unchecked.
- **ทางแก้:** เพิ่มแถวชุดการ์ดเลื่อนแนวนอน (ชุดล่าสุด 6-8 ชุดพร้อมรูปกล่อง + ปุ่มไป /sets) เหนือตาราง market บนมือถือ — แตะครั้งเดียวกรองตารางทันที

### ⚪ home.11 [NEW] การ์ดที่เพิ่งค้นหา ลบทีละรายการไม่ได้บนมือถือ — ปุ่มกากบาทโผล่เฉพาะตอนเมาส์ชี้
- **หน้า:** / (home) hero search มือถือ
- **หลักฐาน:** src/components/home/hero-search-bar.tsx:325-333 — the per-row remove button is `opacity-0 ... group-hover:opacity-100` with tabIndex={-1}, p-1.5 (~26px hit area, no tap-safe). Touch devices have no hover, and tapping the row commits the search instead — so individual recent-search deletion is unreachable on the primary platform (only "ล้างทั้งหมด" works).
- **ทางแก้:** บนจอสัมผัส (<md) ให้ปุ่มกากบาทแสดงตลอด (opacity-100) + ใส่ tap-safe ให้พื้นที่แตะถึง 44px — เมาส์ค่อยใช้พฤติกรรม hover เดิม

### ⚪ home.12 [HOME-12] ลิงก์ "ดูการ์ดทั้งหมด" ส่งพารามิเตอร์ sort ที่หน้าแรกไม่เคยอ่าน — วันนี้รอดเพราะบังเอิญตรงค่าตั้งต้น
- **หน้า:** /opcg/market-overview → /
- **หลักฐาน:** src/app/market-overview/market-overview-client.tsx:101 — href="/?sort=price_desc" but src/app/page.tsx:17-19 deliberately reads no searchParams (ISR) and use-market-cards.ts:38 hardcodes the default sort to "price_desc". Works today only by coincidence; if the default changes the link silently stops meaning what it says.
- **ทางแก้:** เปลี่ยนเป็น href="/" เฉยๆ (ตัดพารามิเตอร์หลอกทิ้ง) หรือถ้าต้องการ deep-link การเรียงจริง ให้หน้าแรกอ่าน sort แล้วส่งเข้า useMarketCards

### ⚪ home.13 [HOME-09] ช่องค้นหา hero ยิงคำขอทุกตัวอักษร (หน่วงเวลา 0ms) — เปลืองเซิร์ฟเวอร์โดยเฉพาะการพิมพ์ภาษาไทย
- **หน้า:** / (home)
- **หลักฐาน:** src/components/home/hero-search-bar.tsx:44-49 — useCardSearch({ debounceMs: 0 }) with comment "zero debounce (instant feel)"; typing "luffy" = 5 API requests. Abort + keepPreviousOnError mitigate flicker, but the request-per-keystroke cost remains; doc/uxui-refactor-plan.md §2.4 still lists the 250-300ms debounce as open work.
- **ทางแก้:** ปรับ debounceMs เป็น ~200-250ms จุดเดียว (engine กลางรองรับอยู่แล้ว) — ความรู้สึกทันใจยังอยู่เพราะผลลัพธ์เดิมค้างไว้ระหว่างรอ

### ⚪ home.14 [NEW] trending ไม่บอกความสดของข้อมูล ขณะที่ market-overview มีป้าย "อัปเดตล่าสุด X ที่แล้ว"
- **หน้า:** /opcg/trending vs /opcg/market-overview
- **หลักฐาน:** market-overview shows a freshness chip in its header (market-overview-client.tsx:74-81, lastUpdatedAt from CardPrice max scrapedAt); trending — fed by the same daily cron (trending/page.tsx:12-14 comment) — has no freshness indicator anywhere (TrendingPageHeader = title+description only, trending-tabs.tsx:336-344). Sister stat pages give different trust context for the same data.
- **ทางแก้:** ดึง scrapedAt ล่าสุดแบบเดียวกันมาแสดงเป็นป้ายเวลาใน header ของ trending — ใช้ชิ้นเดิมจาก market-overview (ควรยกเป็น component กลาง)

### ⚪ home.15 [NEW] หัวข้อใหญ่ของ hero หน้าแรกประกอบ class ตัวอักษรเองแทนการใช้ token กลาง
- **หน้า:** / (home)
- **หลักฐาน:** src/components/home/home-search-hero.tsx:43 — h1 stacks `text-3xl font-extrabold leading-[1.12] tracking-tight ... sm:text-5xl`; AGENTS.md typography rules say components apply one semantic token instead of stacking text-*/font-*/tracking-* (closest existing roles: .text-h1 / .text-display). No other page composes its title this way.
- **ทางแก้:** ถ้าจงใจให้ hero ใหญ่กว่าปกติ ให้ประกาศเป็น token ใหม่ (เช่น .text-hero) ใน globals.css แล้วเรียกใช้ที่เดียว — กันหน้าอื่นลอกแบบ stack class ต่อ

### ⚪ home.16 [NEW] ไฟล์ pagination ใน components/home เป็นซากส่งต่อ 1 บรรทัดที่ไม่มีใครเรียกใช้แล้ว
- **หน้า:** / (home) — dead code
- **หลักฐาน:** src/components/home/pagination.tsx:1 — single-line re-export of ui/pagination; repo-wide grep finds zero importers (all consumers import @/components/ui/pagination directly). Leftover shim from the pagination consolidation.
- **ทางแก้:** ลบไฟล์ทิ้ง (ขออนุมัติก่อนลบตาม permission) — ลดโอกาสที่คนใหม่ import ผิดทาง

<a id="discovery"></a>
## ค้นหา + เทียบการ์ด + palette

**ภาพรวม:** โซนค้นหา/เทียบการ์ด/แผงค้นหาด่วน (Cmd+K) แข็งแรงขึ้นมากจากการยุบเครื่องยนต์ค้นหาเหลือชุดเดียว (useCardSearch + SearchResultRow + useRecentSearches ใช้ร่วมกันครบ 3 ทางเข้าแล้ว และ winner ของ compare เปลี่ยนเป็นสีทองตามกฎแล้ว) แต่จุดอ่อนใหญ่ยังอยู่ที่มือถือทั้งหมด: หน้าเทียบการ์ดบีบ 6 ช่องลงจอเดียวจนอ่านไม่ได้ แผงค้นหาด่วนยังเป็นหน้าต่างเดสก์ท็อปย่อส่วน และมุมมองกริดของหน้าค้นหาเรียงลำดับ/เปลี่ยนช่วงเวลาไม่ได้เลย ส่วนความไม่สม่ำเสมอที่เหลือเป็นเรื่องเปลือกที่ต่างกันทั้งที่เนื้อในเหมือนกัน: กล่องเลือกการ์ดของ compare ไม่ใช้เปลือกเต็มจอแบบเดียวกับ portfolio/watchlist, แถวค้นหาล่าสุดทำงานคนละแบบ 3 ที่, และลิงก์ปลายทางบางจุด hardcode /opcg ขณะที่บางจุดอิงเกมปัจจุบัน

### 🔴 discovery.1 [DISCOVERY-02] หน้าเทียบการ์ดบนมือถือบีบทุกช่องลงจอเดียว — ตัวเลขใหญ่ในช่องกว้าง ~50px อ่านไม่ได้
- **หน้า:** /compare
- **หลักฐาน:** compare-client.tsx:164-165 gridColumnCount = max(cards, tier lanes) + upsell (PRO = 5+1 = 6 lanes even with 0 cards picked); compare-section.tsx:57 GRID_CLASS = "mx-auto grid w-full max-w-fit gap-3 sm:gap-6" with NO overflow-x-auto and no <sm clamp; NumericCell renders text-3xl (compare-section.tsx:171) inside a ~50px lane on a 390px screen. Stale contradictory comment still present at compare-client.tsx:175-179: "Mobile still overflows via the overflow-x-auto wrappers on each grid" immediately followed by "No horizontal scroll" — the mobile case was forgotten when scroll wrappers were removed.
- **ทางแก้:** ต่ำกว่า sm ให้เลิก render ช่องว่าง/ช่องชวนอัปเกรด (เหลือปุ่ม + เดียวท้ายแถว) แล้วจำกัดช่องที่เห็นไว้ 2-3 ช่องพร้อมเลื่อนข้างแบบ snap (ตาม re-compose ที่เสนอไว้ในรายงานเดิม) — เดสก์ท็อปคงโครงเดิม และลบคอมเมนต์เก่าที่ขัดกันใน compare-client.tsx:175-179 ทิ้ง

### 🔴 discovery.2 [DISCOVERY-01] เลือกการ์ดเทียบไว้แล้วกดดูการ์ดใบหนึ่ง กดย้อนกลับ = รายการที่เลือกหายหมด
- **หน้า:** /compare
- **หลักฐาน:** compare-client.tsx:106-110 clears the compare store on unmount (useCompareStore.getState().clear() in cleanup) while card-rail.tsx:72-75 renders a Link to /opcg/cards/[code] inside the rail itself — tapping a card then pressing back wipes the whole selection; no state in URL (compare-store.ts:28-29 "In-memory only ... deliberately do NOT persist").
- **ทางแก้:** เก็บรหัสการ์ดที่เลือกลง URL (?cards=OP01-001,OP13-118) ให้กดย้อนกลับ/รีเฟรช/แชร์แล้วรายการยังอยู่ — ยังคงเจตนา "จบงานแล้วล้าง" ได้เพราะออกไปหน้าอื่นโดยไม่กลับมา URL นี้ state ก็ไม่ตามไป

### 🟡 discovery.3 [DISCOVERY-05] แผงค้นหาด่วนบนมือถือยังเป็นหน้าต่างเดสก์ท็อปย่อส่วน (ลอยที่ 15vh + ปุ่ม ESC + ผลลัพธ์สูงแค่ครึ่งจอ)
- **หน้า:** ทุกหน้า (ทางเข้าค้นหาเดียวของมือถือนอกหน้าแรก)
- **หลักฐาน:** command-search.tsx:206 DialogContent className="top-[15vh] ... max-w-lg"; :249-254 renders a literal "ESC" DialogClose button (useless on touch); :262 results capped at max-h-[50vh] under the on-screen keyboard. header-mobile.tsx:58-61 confirms the mobile header search icon opens this exact modal.
- **ทางแก้:** ต่ำกว่า md ให้ render เป็นหน้าค้นหาเต็มจอ: ช่องพิมพ์ติดขอบบน + ผลลัพธ์เต็มความสูง + ปุ่ม "ยกเลิก" แทน ESC (ซ่อน kbd hint บนจอสัมผัส) — ใช้เปลือกแบบ ResponsiveDialogContent ที่มีอยู่แล้วได้เลย

### 🟡 discovery.4 [DISCOVERY-03] มุมมองกริดของหน้าค้นหาบนมือถือ: เรียงลำดับไม่ได้เลย + สลับช่วงเวลา 24h/7d ไม่ได้
- **หน้า:** /search
- **หลักฐาน:** search-client.tsx:237-246 the 8-option sort dropdown (ToolbarSortDropdown) is wrapped in "hidden sm:block"; :249-261 the change-period SegmentedControl (grid view only) is also "hidden sm:block". Table view is now covered by MarketTable's built-in mobile sort (market-table.tsx:91-108) but it only exposes column sorts (rarity/price/24h/7d/30d per market-columns.ts:50-60) — "newest" and "name A-Z" (SORT_KEYS search-client.tsx:55-64) are unreachable on mobile in both views, and grid view has no sort control at all.
- **ทางแก้:** โชว์ตัวเรียงลำดับตัวเต็ม (8 ตัวเลือก) บนมือถือด้วย — แถวควบคุมมี flex-wrap อยู่แล้ว หรือรวม sort มือถือของ MarketTable กับ dropdown ตัวเต็มให้เป็นตัวเดียวกัน แล้วโชว์ปุ่มช่วงเวลาในมุมมองกริดบนมือถือด้วย

### 🟡 discovery.5 [DISCOVERY-07] ตัวกรอง/เรียงลำดับ/หน้า/มุมมองของหน้าค้นหาไม่ลง URL — รีเฟรชหรือกดย้อนกลับแล้วหายหมด
- **หน้า:** /search
- **หลักฐาน:** use-search.ts:42-55 — sort, page, viewMode, changePeriod, filters (set/rarities/types/colors/variant/min-maxPrice) are all plain useState; only q is read from the URL (:40 searchParams.get("q")). User filters a set + opens page 3, taps a card, presses back → everything resets to price_desc page 1.
- **ทางแก้:** sync sort/set/rarity/page/viewMode ลง searchParams ด้วย router.replace แบบเดียวกับที่ ?q= ทำอยู่ (ทำหลังจบ DISCOVERY-01 จะได้ใช้ pattern เดียวกันทั้งคู่)

### 🟡 discovery.6 [DISCOVERY-09] ค้นหา 3 ทางเข้าให้ผลลัพธ์คนละชุด — hero เจอการ์ด+ชุด+ค้นด้วยรูป แต่ Cmd+K (ทางเดียวของมือถือ) ไม่มีชุดการ์ดและค้นด้วยรูป
- **หน้า:** หน้าแรก · แผงค้นหาด่วน · /search
- **หลักฐาน:** hero-search-bar.tsx:91-101 + :259-276 matches card sets, :188 embeds PhotoSearchButton; command-search.tsx offers only cards (results) + NAV_ACTIONS pages (:151-158) — typing a set code like "OP09" gives no set link and there is no photo search; /search returns cards only. VISION §2 requires universal search to teleport to cards/sets/features from one box.
- **ทางแก้:** ประกอบชุดผลลัพธ์กลางชุดเดียว (การ์ด + ชุดการ์ด + หน้าเพจ + ปุ่มค้นด้วยรูป) แล้วให้ทั้ง hero และแผงค้นหาด่วนใช้ร่วมกัน — โครง engine กลางพร้อมแล้ว เหลือแค่ยกส่วน sets/photo จาก hero มาเป็นของกลาง

### 🟡 discovery.7 [DISCOVERY-08] hero กับแผงค้นหาด่วนยังยิงคำค้นทุกตัวอักษร (หน่วง 0ms) — เซิร์ฟเวอร์รับเต็มๆ ~14 คำขอต่อประโยคเดียว
- **หน้า:** หน้าแรก · แผงค้นหาด่วน
- **หลักฐาน:** command-search.tsx:113-116 useCardSearch({ limit: 8, debounceMs: 0 }) and hero-search-bar.tsx:45-49 useCardSearch({ limit: 6, debounceMs: 0 }) — both explicitly opt out of the engine's 300ms default (use-card-search.ts:21). AbortController cancels stale responses client-side but every keystroke still hits /api/cards on the server.
- **ทางแก้:** ตั้งหน่วง 150-250ms ให้สองจุดนี้ (เครื่องยนต์กลางรองรับอยู่แล้ว แค่เปลี่ยนตัวเลข) — ความรู้สึก "ไว" ยังอยู่แต่โหลดเซิร์ฟเวอร์ลดเป็นเท่าตัว

### 🟡 discovery.8 [NEW] ขอบเขตเกมและลิงก์ปลายทางไม่ตรงกันระหว่างทางเข้าค้นหา — บางจุดอิงเกมปัจจุบัน บางจุดตอก /opcg ตายตัว ✅
- **หน้า:** แผงค้นหาด่วน · หน้าแรก · /search · /compare
- **หลักฐาน:** Inconsistent within the same engine: card-search.tsx:49-52 scopes queries to currentGame, and use-search.ts:172 submits to `/${game}/search`, but command-search.tsx:113-116 passes NO game (searches all games) and hardcodes /opcg in goToCard (:121), commitSearch (:134) and all NAV_ACTIONS (:50-56); card-search.tsx:84+:106, hero-search-bar.tsx:79+:111-116, card-rail.tsx:73, compare-floating-bar.tsx:88, photo-search-button.tsx:344 all hardcode /opcg/... too. VISION §5.7 bans scattered hardcoded game prefixes (canonical = /[game]/ segment rewrite).
- **ทางแก้:** ให้ทุกทางเข้าค้นหา/เทียบอ่าน game slug จาก store/context เดียว (แบบที่ CardSearch กับ use-search ทำแล้ว) แล้วประกอบลิงก์จากตัวแปรนั้น — เก็บก่อนเปิดเกมที่สอง ไม่งั้นลิงก์ครึ่งแอปจะพาไปผิด namespace
- **หมายเหตุ verify:** CONFIRMED — every cited line matches current master: CardSearch scopes queries to currentGame (card-search.tsx:49-52) but hardcodes /opcg links (:84,:106); use-search.ts:172 is route-param driven (/${game}/search, required for /all/search); command-search.tsx passes no game to useCardSearch (:113-116 → all-games results per use-card-search.ts:30) while hardcoding /opcg at :121,:134 and in NAV_ACTIONS (:50-52,55-56); hero-search-bar.tsx:79,111-116, card-rail.tsx:73, compare-floating-bar.tsx:88, photo-search-button.tsx:344 all hardcode /opcg. Not a documented exception: VISION §5.7 canon is middleware-resolved /[game]; PLAN.md P4.3 Phase 1 explicitly chose "don't touch the 180 links, middleware resolves flat → /{currentGame}", yet commit 6537e26 (2026-07-11) later hardcoded /opcg into ~66 files with no documented rationale — active drift against the stated strategy, not blessed anywhere. Not fixed. Caveat on severity: impact is zero TODAY (ROUTABLE_GAME_PREFIXES pinned to opcg, Pokémon comingSoon with no data, GameSwitcher never sets currentGame to a comingSoon game — no link can land in a wrong namespace yet), so "med" is honest only as pre-multi-game debt in the path of the active owner-ordered P4.3 workstream (66 files and growing; the P4.3 Phase 2 backlog covers server getServerGame() reads but not these client link constructors). "high" would be dishonest; med is the right ceiling.

### 🟡 discovery.9 [NEW] กล่องเลือกการ์ดของหน้าเทียบใช้เปลือกคนละแบบกับตัวมาตรฐาน — มือถือได้กล่องลอย 90dvh แทนเต็มจอ ✅
- **หน้า:** /compare vs portfolio/watchlist
- **หลักฐาน:** card-picker-modal.tsx:62-64 wraps the shared CardPickerForm in a raw DialogContent with hand-tuned "h-[90dvh] max-w-2xl ... md:h-[80dvh]", while the canonical multi-pick shell (card-batch-picker-dialog.tsx:55) uses ResponsiveDialogContent (responsive-dialog-content.tsx:19-20 = full-screen <md, centered card ≥md, per the Component Kit table). Same inner form, two different dialog behaviors on mobile depending on which page you add cards from.
- **ทางแก้:** เปลี่ยน CardPickerModal ให้ใช้ ResponsiveDialogContent เป็นเปลือก (เนื้อใน CardPickerForm + footer เดิมคงไว้ได้หมด) — มือถือจะได้เต็มจอเหมือนเพิ่มการ์ดใน portfolio/watchlist
- **หมายเหตุ verify:** Verified against source: card-picker-modal.tsx:62-64 wraps CardPickerForm in raw DialogContent (h-[90dvh] max-w-2xl, md:h-[80dvh]) which renders as a centered floating box on mobile, while card-batch-picker-dialog.tsx:55 (portfolio/watchlist) uses the canonical ResponsiveDialogContent (full-screen <md per responsive-dialog-content.tsx:19-20). No documented exception in AGENTS.md kit table or doc/uxui-refactor-plan.md, and not fixed on master. Git history shows the divergence is accidental: ResponsiveDialogContent was created (6537e26) 3 minutes before CardPickerModal was converted to Dialog primitives (4308007) on 2026-07-11 — parallel work that never converged, no recorded rationale. Severity med is defensible (visible mobile divergence in the same add-cards flow) though borderline low, since 90dvh at full-width-minus-2rem is near-full-screen anyway. Proposal is sound; note compare needs md:max-w-2xl md:h-[80dvh] className overrides on the shell since its desktop size differs from the shell default md:max-w-[34rem].

### ⚪ discovery.10 [DISCOVERY-13] สามหน้าพี่น้อง (ค้นหา/มาแรง/เทียบ) ประกอบหัวหน้ากันคนละแบบ — /search ไม่มีชื่อหน้าที่มองเห็นเลย
- **หน้า:** /search · /trending · /compare
- **หลักฐาน:** search/page.tsx:60 h1 is sr-only (no visible title) + :61 standalone LocalizedBreadcrumb; compare-client.tsx:214-231 uses PageHeader with a Breadcrumb passed via the breadcrumb prop (manual t() labels); trending/page.tsx:102-104 uses LocalizedBreadcrumb + its own TrendingPageHeader component. Two breadcrumb components and three header compositions for sibling pages.
- **ทางแก้:** เลือก pattern เดียว: PageHeader รับ breadcrumb prop (แบบ compare) ใช้ทั้งสามหน้า และให้ /search มีชื่อหน้าสั้นๆ เหนือช่องค้นหา

### ⚪ discovery.11 [NEW] แถวค้นหาล่าสุดทำงานคนละแบบ 3 ที่ — hero ลบทีละรายการ/ล้างทั้งหมดได้ ที่อื่นทำไม่ได้ และกดแล้วผลต่างกัน
- **หน้า:** หน้าแรก · แผงค้นหาด่วน · กล่องค้นหาใน dialog
- **หลักฐาน:** Same concept, three behaviors: hero-search-bar.tsx:299 (clear-all button) + :328-332 (per-row X remove) and tapping navigates to /search; command-search.tsx:363-379 recent rows navigate immediately but have no remove/clear affordance; card-search.tsx:88-92 tapping a recent only fills the input (selectRecent → setQuery), also no remove. All three share useRecentSearches, so capability drift is purely UI.
- **ทางแก้:** เคาะพฤติกรรมมาตรฐานหนึ่งแบบ (แตะ = ค้นเลย + ปุ่ม X ลบรายตัว + ล้างทั้งหมด) แล้วใส่ให้ครบทั้ง 3 ที่ — logic มีใน hook กลางอยู่แล้ว (remove/clear) แค่ไม่ได้ต่อ UI

### ⚪ discovery.12 [NEW] ข้อความอังกฤษหลุดในแผงค้นหาด่วนทั้งที่ระบบแปลมีครบ
- **หน้า:** แผงค้นหาด่วน · หน้าแรก
- **หลักฐาน:** command-search.tsx:352-356 hardcodes "Search failed. Please try again." (a translation key loadFailed already exists — i18n/en.ts:338, and /search uses t(lang,"loadFailed") for the same failure); command-search.tsx:234 aria-label="Clear search" and hero-search-bar.tsx:331 aria-label="Remove" are also raw English while sibling buttons use t().
- **ทางแก้:** เปลี่ยน 3 จุดนี้เป็น t(lang, ...) — ใช้ key loadFailed / clearAll / remove ที่มีอยู่แล้ว

### ⚪ discovery.13 [NEW] สถานะกำลังโหลดของหน้าเทียบเป็นข้อความลอยท้ายหน้า ไม่ใช่โครงโหลดตามเลย์เอาต์
- **หน้า:** /compare
- **หลักฐาน:** compare-client.tsx:325-329 renders `{loading && <div className="py-8 text-center ...">{t(lang,"loading")}</div>}` at the bottom of the page while lanes show only "—" placeholders — violates VISION §4.6 (skeleton must mirror the real layout; the chart's own Suspense fallback at :296 does it right with a 350px Skeleton).
- **ทางแก้:** ตอนเพิ่มการ์ดแล้วข้อมูลกำลังมา ให้ช่องการ์ดนั้นแสดงโครงโหลด (รูป + แถวราคา) แทนข้อความท้ายหน้า

### ⚪ discovery.14 [NEW] ปุ่มหลักเขียนมือเองหลายจุดในโซนนี้ + ไอคอนกุญแจใช้สี amber ดิบนอกระบบ token
- **หน้า:** /compare · แผงค้นหาด่วน
- **หลักฐาน:** Hand-rolled primary buttons with drifting paddings instead of ui/button: compare-client.tsx:308-314 ("rounded-lg bg-primary px-4 py-1.5 text-sm"), command-search.tsx:241-248 ("rounded-lg bg-primary px-3 py-1.5 text-xs"), card-picker-modal.tsx:95-99 (DialogClose styled "bg-primary px-4 py-1.5"). Plus compare-client.tsx:304 Lock icon uses raw `text-amber-500/60` instead of the honey/primary token.
- **ทางแก้:** แทนด้วย <Button> ของระบบ (DialogClose ใช้ render prop ได้) และเปลี่ยนสีกุญแจเป็น text-primary — ลด vocabulary ปุ่มให้เหลือชุดเดียว

### ⚪ discovery.15 [NEW] ไฟล์ตาย: search-pagination.tsx เหลือแค่บรรทัด re-export ที่ไม่มีใครเรียกใช้แล้ว
- **หน้า:** /search
- **หลักฐาน:** src/app/search/search-pagination.tsx is a single line `export { Pagination as SearchPagination } from "@/components/ui/pagination"` — grep across src finds zero importers (search-client.tsx:13 imports Pagination from the kit directly).
- **ทางแก้:** ลบไฟล์ทิ้ง (ขออนุญาตเบสตามกฎ permission ก่อนลบ)

### ⚪ discovery.16 [NEW] PhotoSearchButton เป็นของใช้ข้ามหน้า แต่ตัวไฟล์อยู่ในโฟลเดอร์ route ของ /search
- **หน้า:** /search · หน้าแรก
- **หลักฐาน:** src/app/search/photo-search-button.tsx (424 lines) is imported by src/components/home/hero-search-bar.tsx:9 — a components/ file reaching into an app/ route folder, against the KIT-09 rule that cross-feature widgets live under src/components/. Will also be needed by the palette when DISCOVERY-09 lands.
- **ทางแก้:** ย้ายไป src/components/search/photo-search-button.tsx ด้วย git mv + แก้ importer 2 จุด (แบบเดียวกับที่ทำ KIT-09)

### ⚪ discovery.17 [NEW] กล่อง "เพิ่มเติม" ท้ายหน้า hardcode ข้อความไทยปน English และลิงก์ /opcg ตายตัว ไม่ผ่านระบบแปล
- **หน้า:** /search (+ ซ้ำอีก 7 หน้า)
- **หลักฐาน:** search/page.tsx:65-69 passes literal strings ("ชุดการ์ด", "Trending", "เปรียบเทียบ") + hardcoded /opcg hrefs to RelatedPages; related-pages.tsx:14 defaults title="เพิ่มเติม" hardcoded. The component ignores the language store entirely while the app is TH/EN/JP; same pattern repeats on 8 pages (trending/page.tsx:111-113 etc.) with slightly different copy per page for the same destinations.
- **ทางแก้:** ให้ RelatedPages รับ labelKey/descriptionKey แล้วแปลผ่าน t() (แบบ LocalizedBreadcrumb) และรวมชุด copy ของปลายทางยอดนิยม (sets/trending/compare) ไว้ที่เดียวไม่ให้แต่ละหน้าเขียนเอง

<a id="card-detail"></a>
## Card detail

**ภาพรวม:** card-detail ผ่านการเก็บงานมาหลายรอบจนโครงแข็งแรง — ไฟล์ยักษ์ถูกแตกเป็น hook+โซนแล้ว (273 บรรทัด) ปุ่มบนมือถือขยายครบ ≥44px ตาราง feed มีป้าย "ตัวอย่าง" ครบ และ nested scroll ถูกถอดแล้ว แต่จุดอ่อนที่เหลือกระจุกอยู่ที่ "ความซื่อสัตย์ของตัวเลข" บนหน้าที่เป็นแกนความน่าเชื่อถือ: กราฟราคาพล็อตข้อมูลจำลองโดยไม่มีป้ายกำกับ ทั้งที่ประวัติราคาจริงถูกดึงจากฐานข้อมูลมาแล้วแต่ถูกทิ้ง, % เปลี่ยนแปลงตามช่วงเวลาถูกประดิษฐ์จากสูตรขยายค่า 30 วันโดยไม่ติดป้ายประมาณ และแถวขายล่าสุด (ข้อมูลจริง) ยังลิงก์ไปตารางตัวอย่าง นอกจากนี้การถอด CTA มือถือและ nested scroll รอบล่าสุดทิ้งซากโค้ดกำพร้าไว้อีกชุด (~200+ บรรทัด) ที่ควรกวาดก่อนงานรอบหน้าจะแก้ผิดไฟล์

### 🔴 card-detail.1 [NEW] กราฟราคาพล็อตข้อมูลจำลอง ทั้งที่ประวัติราคาจริงถูกดึงมาแล้วแต่ถูกทิ้ง และไม่มีป้าย "ตัวอย่าง" บนกราฟ ✅
- **หน้า:** /cards/[code]
- **หลักฐาน:** src/app/cards/[code]/page.tsx:82 builds real chart history (`let chartData = buildChartData(card.prices)`) + fallback block :94-104, passes it as `card.chartData` (:166) — but grep confirms NO component ever reads `chartData` (only the type decl at src/components/cards/card-detail/types.ts:83). The rendered chart instead uses synthetic data: use-card-detail-model.ts:200-217 `seriesList` comes from `mockGradeSeries(...)` (mock.ts:29-77 — deterministic fabricated curve seeded from one base price). The chart section shows the header "ราคาย้อนหลัง · {grade}" with range pills and NO SampleBadge/SampleDisclosure (card-detail-chart-section.tsx:62-75), while the two feeds on the same page badge every simulated row (recent-sales.tsx:216-221, asks-rail.tsx:161-172). Worse, when the selected grade has real data (isEst=false) the fabricated line renders SOLID (card-chart.tsx:398 `strokeDasharray={primary.isEst ? "7 5" : undefined}`) — the page's own honesty signal says "real" over invented points.
- **ทางแก้:** ให้กราฟใช้ประวัติราคาจริงจาก `card.chartData` สำหรับเกรด Raw (ข้อมูลมีอยู่แล้ว ถูกส่งถึงมือ component แล้วด้วย) และคงเส้นจำลองเฉพาะเกรดที่ยังไม่มีข้อมูลจริงพร้อมป้าย "ตัวอย่าง"/est บนกราฟแบบเดียวกับที่ feed ทำ — ถ้ายังไม่พร้อมพล็อตข้อมูลจริง อย่างน้อยต้องติดป้ายกำกับบนกราฟ และตัดการส่ง `chartData` ที่ตายทิ้งเพื่อไม่ให้คนแก้ต่อเข้าใจผิดว่ากราฟใช้ข้อมูลจริง
- **หมายเหตุ verify:** CONFIRMED — every evidence line held up under independent reading. (1) Dead real data: src/app/cards/[code]/page.tsx:82 builds chartData via buildChartData (src/lib/data/card-detail.ts:299-315) from up to 120 real scraped price rows (cardDetailInclude take:120, card-detail.ts:51-66), fallback :94-104, passed at :166 — grep of all of src shows the only other occurrence is the type decl at src/components/cards/card-detail/types.ts:83; no component ever reads it. (2) Synthetic chart: use-card-detail-model.ts:200-217 seriesList comes solely from mockGradeSeries → mockSeries (mock.ts:29-62), a deterministic fabricated curve seeded from one base price and rescaled to land on the headline. (3) Missing disclosure: card-detail-chart-section.tsx:58-76 renders header + range pills with no SampleBadge/SampleDisclosure, while the SAME page badges every simulated feed (recent-sales.tsx:214-221, asks-rail.tsx:159-172 via market-feed-shared.tsx SampleBadge). (4) Solid-line claim verified: card-chart.tsx:398,409 dash only when primary.isEst, and grades.ts:99 hardcodes raw value.isEst=false — raw is also the default selected grade when it has data (use-card-detail-model.ts:185-187), so the common case renders the fabricated line SOLID, contradicting grades.ts's own documented policy (header lines 10-15: "a modeled number is never read as real"). Refutation attempts failed: mock.ts's header documents the mock SERIES as intentional prototype scaffolding (เบส: "ถ้าอันไหนไม่มี ใช้ mockdata ไปก่อน" — swap when pipeline lands), but nothing documents leaving the chart UNLABELED; no AGENTS.md kit exception; the 2026-07-04 audit's CARD-DETAIL-01 covers different dead props (getCommunityPrice/getChartSources) and chartData has no "intentionally kept" comment like daysSinceUpdate does; git history (ff7848a "honesty badges", 0d6902e "honest chart") shows honesty work but HEAD still lacks any chart-level marker. Severity "high" is honest: it's the centerpiece of the highest-traffic page on a price-truth product, violating the repo's own honesty rule while sibling surfaces badge correctly; minimum fix (badge the chart like the feeds) is cheap. Two caveats for the fixer: (a) repo is a prototype, not the live site, so no live users are currently misled — high is still fair as a consistency finding but this is context; (b) the proposal's "just plot card.chartData for Raw" understates effort — the 120 rows mix sources/grades/SELL-SOLD types and real history depth may be shallow (daily pipeline described in-code as not yet live), so a real Raw line needs per-source/grade filtering; the chart already has an honest single-dot/no-data state to absorb sparse cases (card-chart.tsx:186-198). The disclosure half of the proposal is unconditionally valid; killing the dead chartData prop is also safe (no consumer).

### 🔴 card-detail.2 [NEW] % เปลี่ยนแปลงใต้ราคาหลักถูก "ประดิษฐ์" ตามช่วงเวลาด้วยสูตรขยายค่า 30 วัน โดยไม่ติดป้ายประมาณ ✅
- **หน้า:** /cards/[code]
- **หลักฐาน:** use-card-detail-model.ts:194-197 — `rangeFactor = Math.sqrt(days/30)` แล้ว `rangeDeltaPct = datum.delta30d.pct * rangeFactor`: เลือกช่วง 1Y จะโชว์ %30วันจริง × 3.49, ช่วง 7D จะย่อ × 0.48 — ตัวเลขที่ไม่มีอยู่จริงในระบบ. ค่านี้ไหลเข้า mock series (:204-207) แล้วกลายเป็น `shownDelta` (:219-223) ที่ render ผ่าน `Delta` พร้อมข้อความช่วงเวลา ("1 ปี") ใน card-detail-price.tsx:170-175 — ส่วน `EstMark` ผูกกับ `datum.value.isEst` เท่านั้น (:167-169) ดังนั้นเกรด Raw ที่ราคาจริง จะโชว์ % 1Y ที่ประดิษฐ์ขึ้นแบบไม่มีเครื่องหมายใดๆ บนหน้า trust core ที่สถาปัตยกรรม est/isEst เข้มงวดทุกจุดอื่น (grades.ts:10-14 ประกาศกติกาเองว่า "modeled number is never read as real")
- **ทางแก้:** ช่วงเวลาที่ไม่มีข้อมูลจริง (ทุกช่วงยกเว้น 1M ตอนนี้) ให้ซ่อน % หรือแสดงพร้อมป้าย est ตามกติกาเดียวกับราคา — หรือแสดงเฉพาะ Δ30d จริงคงที่ไม่ว่าเลือกช่วงไหน จนกว่าประวัติราคาจริงต่อช่วงจะถูกพล็อต (แก้พร้อมข้อกราฟด้านบนได้ในงานเดียว)
- **หมายเหตุ verify:** CONFIRMED — every evidence point matches current code on master. (1) use-card-detail-model.ts:194-197 has exactly rangeFactor=√(days/30) applied to the real 30d pct: 1Y≈×3.488, 7D≈×0.483, matching the finding's ×3.49/×0.48. (2) The scaled pct flows into mockSeries (mock.ts:38-41 sets series start = base/(1+pct/100), scaled to land on the real hero price), so shownDelta (:222-223, open→latest) reproduces the fabricated % and renders at :170-175 of card-detail-price.tsx with the range label ("ใน 1 ปี") when not scrubbing. (3) EstMark is gated only on datum.value.isEst (:167-169); Raw grade has value.isEst=false and delta30d.isEst=false (grades.ts:99,105), so the fabricated 1Y % renders with no marker — and worse, rendering never reads delta30d.isEst at all, so even PSA-10's flagged-est delta (grades.ts:129) loses its flag. The chart's dashed-est affordance is gated the same way, so Raw's fully-mock line renders solid. (4) Not a documented exception: absent from AGENTS.md kit table and doc/uxui-refactor-plan.md. Origin commit ad3f61d shows the scaling was intentional prototype modeling ("7D/3M/1Y/All are MODELED... swap for real per-range history"), but the explanatory comment was dropped in refactor 8f6b85f and it contradicts the project's own declared rule (grades.ts:10-14 "a modeled number is never read as real") and PLAN.md:302 "เลิก fabricate". Other mock data on the same page IS labeled (sample-titled sections, EstMark, dashed lines) — this % is the outlier. (5) Not fixed. Severity high is honest: trust-core page, concrete unlabeled %-claim on the real-data grade, breaching the codebase's own honesty architecture; prototype status tempers real-world harm but not the consistency breach. Proposal is sound; note the fix should also thread delta30d.isEst through to the Delta rendering, which the data model already carries.

### 🔴 card-detail.3 [CARD-DETAIL-03] แถว "ขายล่าสุด" เป็นราคาจริง แต่กดแล้วพาไปตารางที่เป็นข้อมูลตัวอย่างล้วน (ตัวเลขคนละชุด)
- **หน้า:** /cards/[code]
- **หลักฐาน:** ยังอยู่ครบตาม finding เดิม: card-detail-buy-box.tsx:74-76 แถว lastSold (ข้อมูลจริงจาก marketRows sold prices — use-card-detail-model.ts:367-385) เป็น `<a href="#sources">` แต่ #sources render `<RecentSales sales={saleHistory} isSample>` แบบ hardcode isSample เสมอ (card-detail.tsx:199) โดย saleHistory = `mockRecentSales(...)` (use-card-detail-model.ts:387-395) — ผู้ใช้เห็นราคาขายจริง กดต่อแล้วเจอตารางตัวเลขปลอมที่ไม่ตรงกัน. โซน reference-markets ต่อแหล่ง (VISION §5.1 zone 7, VISION.md:104) ยังหายทั้งโซน
- **ทางแก้:** ระยะสั้น: ให้แถวขายล่าสุดลิงก์ออกไปแหล่งจริง (`sourceUrl()` มีอยู่แล้วใน source-logo.tsx:41-50) แทน #sources · ระยะกลาง: คืนตารางราคาต่อแหล่งจาก marketRows ที่คำนวณอยู่แล้วในโมเดล เพื่อให้ลิงก์มีปลายทางข้อมูลจริง

### 🟡 card-detail.4 [NEW] โฆษณาข้างกราฟอยู่ในโซนราคา — ขัดข้อห้ามเด็ดขาดของ VISION โดยคอมเมนต์ในโค้ดยอมรับเอง ❌ (verify แล้วไม่จริง — ข้ามได้)
- **หน้า:** /cards/[code] (desktop lg+)
- **หลักฐาน:** card-detail-chart-section.tsx:122-127 render `<AdSlot placement="card-detail-chart-side">` เป็นคอลัมน์ข้างกราฟราคา (โซน 5 ของ pricing surface) บนจอ lg+ — VISION.md:108 ระบุ "ห้าม: ... ad ในโซนราคา/sold เด็ดขาด" และ VISION.md:151 ย้ำ banlist "ห้ามเด็ดขาด card-detail ราคา/sold". คอมเมนต์ใน card-detail.tsx:242 ยอมรับเองว่า "The chart-side ad stays hidden <lg (that one IS in the price zone)" — คือรู้ว่าอยู่ในโซนต้องห้ามแต่ยังโชว์บน desktop. ปัจจุบัน ADSENSE_CLIENT ว่าง (placements.ts:40) = house ads เท่านั้น จึงยังไม่เจ็บเต็ม แต่พอเปิดโฆษณาจริงจะผิดกติกาทันที
- **ทางแก้:** ย้ายช่องโฆษณาข้างกราฟออกจากโซนราคา (เช่นย้ายไปใต้ส่วนข้อมูลการ์ดเหมือนช่อง info-below ที่ทำถูกแล้ว) หรือถ้าตั้งใจยกเว้นบน desktop ต้องแก้ข้อความใน VISION ให้ตรงกับที่ทำจริง — พร้อมเพิ่ม allowlist โซนโฆษณา + unit test ตามที่ VISION §5.6 วางไว้ กันหลุดซ้ำ
- **หมายเหตุ verify:** Every cited fact verifies (AdSlot at card-detail-chart-section.tsx:122-127 sits beside the zone-5 chart on lg+; VISION.md:108/151 bans it; card-detail.tsx:242 comment matches; ADSENSE_CLIENT empty), BUT this is an intentional owner exception, not drift: commit 94ed47e (2026-06-18, authored by LOSTXKER) added the ad "per request" and states verbatim "this overrides the earlier 'ads stay off the price surface' call (VISION §4.6); kept as an explicit owner trade-off." The <lg hiding was a deliberate follow-up mitigation (a5e0a30: "hide price-zone ads <lg"), and the placement was knowingly reaffirmed in the 2026-07-11 consolidation (8f6b85f). Proposing to move the ad would revert an explicit owner call (same class as the set-detail FilterSelect exception). Residual legit item = VISION.md text was never amended to record the desktop exception (plus the still-missing AD_ZONES allowlist VISION §5.6 planned) — that is low-severity doc drift, not a med design violation; "จะผิดกติกาทันที" mischaracterizes an owner-approved trade-off as a rule breach.

### 🟡 card-detail.5 [NEW] การเก็บกวาดครั้งก่อนทิ้งซากโค้ดกำพร้ารอบใหม่ ~200+ บรรทัด (แถบซื้อมือถือ · กล่องเลื่อน feed · export ที่ไม่มีคนใช้)
- **หน้า:** src/components/cards/** · src/app/cards/
- **หลักฐาน:** (1) card-detail-sticky-buy.tsx (78 บรรทัด) + use-sticky-buy.ts (35 บรรทัด) — 0 importer หลัง commit a0400db "remove mobile CTA" ถอดจุดเรียกแต่ไม่ลบไฟล์. (2) market-feed-scroll.tsx (65 บรรทัด) — 0 importer หลังเลิก nested scroll + ค่าคงที่ marketFeedTableScroll/marketFeedListScroll/marketFeedStickyHead ใน market-table-layout.tsx:17-25 ก็ 0 คนใช้. (3) asks-rail.tsx:40-46 `listingMatchesGrade` export พร้อมคอมเมนต์โกหกว่า "Used by card-detail's buy box" — 0 importer. (4) placements.ts:10 ประเภทช่องโฆษณา "card-detail-mid" ไม่มีใครใช้. (5) src/app/cards/loading.tsx เป็น skeleton ตารางตลาดเต็มหน้า ทั้งที่ /cards เหลือแค่ redirect (src/app/cards/page.tsx:14). (6) types.ts:96,99 field `snkrdunkPrices.minPriceUsd`/`lastSoldUsd` ถูกส่งจาก server แต่โมเดลอ่านเฉพาะ psa10AskUsd/psa10SoldUsd (use-card-detail-model.ts:164-165)
- **ทางแก้:** ลบเป็นชุดเดียวแบบ "ลบล้วนไม่แก้พฤติกรรม" ตามแนว Phase 1 เดิม (ขออนุมัติรายการลบก่อนตามกติกา): 4 ไฟล์กำพร้า + export/ค่าคงที่/field ที่ไม่มีผู้ใช้ + แก้คอมเมนต์ที่เล่าเรื่องไม่ตรงโค้ด — กัน AI/คนรอบหน้าแก้ผิดไฟล์ซ้ำรอยที่ audit เดิมเจอ

### 🟡 card-detail.6 [NEW] การนับยอดเข้าชมเขียนฐานข้อมูลแบบรอผลก่อนเรนเดอร์ทุกครั้งที่เปิดหน้า — ถ่วงหน้าที่คนเข้าเยอะสุด
- **หน้า:** /cards/[code]
- **หลักฐาน:** src/app/cards/[code]/page.tsx:66-69 `await prisma.card.update({ data: { viewCount: { increment: 1 } } })` ถูก await เดี่ยวๆ ก่อน Promise.all ของ query อื่นทั้งหมด บนหน้า force-dynamic (:23) — ทุก pageview เสียเวลารอเขียน DB หนึ่งรอบเต็มก่อนเริ่มดึงข้อมูลจริง และไม่มีการกันบอท/นับซ้ำ. เป็น pattern เดียวกับที่ audit เดิมสั่งแก้ฝั่ง blog (CONTENT-05 "view count เลิก block TTFB") แต่ฝั่ง card ไม่ถูกไล่เก็บ
- **ทางแก้:** เปลี่ยนเป็นเขียนแบบไม่รอผล (fire-and-forget หรือ after() ของ Next) หรือย้ายไปนับฝั่ง client/route แยกแบบเดียวกับที่จะแก้ blog — หน้าโหลดเร็วขึ้นหนึ่งรอบ DB ทันทีทุก pageview

### 🟡 card-detail.7 [CARD-DETAIL-05] ราคาบนชิปเกรดที่เป็นค่าประมาณ (PSA 9/8 · BGS) ไม่มีป้าย est ขณะที่ราคาหลักตัวเดียวกันมี
- **หน้า:** /cards/[code]
- **หลักฐาน:** card-detail-price.tsx:140-147 ราคาแนบบนชิปเกรด (`hint = gradeDisplayValues[tier.key]`) โชว์เป็นตัวเลขเปล่าทุกเกรดรวมถึงค่า model (PSA 9 = ×0.5, PSA 8 = ×0.32, BGS = ×1.15 จาก grades.ts:70-71) ขณะที่ hero ใส่ EstMark (:167-169) — ผู้ใช้ scan เทียบราคาบน rail แล้วแยกจริง/ประมาณไม่ได้ ขัดกติกาที่ grades.ts ประกาศเอง ("a modeled number is never read as real"). ส่วน sticky bar ในหลักฐานเดิมถูกถอดไปแล้ว เหลือเฉพาะจุดชิป
- **ทางแก้:** ติด EstMark (หรือเครื่องหมาย ~ ตัวจิ๋ว) บนราคาชิปทุกตัวที่ `gradeData[key].value.isEst` — กติกาเดียวทั่วหน้า: ตัวเลข model ต้องมีเครื่องหมายทุกจุดที่ปรากฏ

### 🟡 card-detail.8 [CARD-DETAIL-10] โซนตามสเปคยังหาย: แถบ Population (ghost) ไม่มีเลย และ Lowest Ask คำนวณแล้วแต่ไม่ถูกแสดง
- **หน้า:** /cards/[code]
- **หลักฐาน:** VISION.md:100-101 กำหนด zone 3 stat รอง `Lowest Ask` + zone 4 population strip (no-data = ghost ไม่ซ่อน) — ปัจจุบันไม่มีไฟล์ population ใดๆ ใน src/components/cards/** และ `lowestAsk`/`lastSale` ถูกคำนวณครบทุกเกรดใน grades.ts:59-67,103,123-125 แต่ grep ทั้งโฟลเดอร์พบแค่ `lastSaleSource` ที่ถูกอ่าน (use-card-detail-model.ts:324-325) — field ที่เหลือคำนวณทิ้งทุก render (ซาก CARD-DETAIL-11 ที่ค้างการตัดสินใจ) และหน้า trust anchor บางกว่าสเปค
- **ทางแก้:** ตัดสินใจให้ขาดแล้วบันทึก: ถ้าจะทำตามสเปค เติม Lowest Ask เป็น stat รองใต้ hero จาก `datum.lowestAsk` ที่มีอยู่ (ติด est ตามกติกา) + แถบ population แบบ ghost รอข้อมูลจริง — ถ้ายังไม่ทำ ให้ตัด field ที่คำนวณทิ้งออกจาก grades.ts พร้อมจดเหตุผล

### ⚪ card-detail.9 [KIT-02] เครื่องหมาย delta สองภาษาในแอปเดียว: card-detail ใช้ +/− แต่ทุกหน้าอื่นใช้ลูกศร ▲/▼ ผ่าน PriceTag
- **หน้า:** /cards/[code] เทียบกับ ทุกหน้าที่ใช้ PriceTag (หน้าแรก · ค้นหา · watchlist · portfolio)
- **หลักฐาน:** grade-value.tsx:24-69 `Delta` แสดงทิศด้วยเครื่องหมาย +/− (:58,64) ส่วน kit กลาง ui/price-tag.tsx:99,115 ใช้ไอคอน ArrowUp/ArrowDown — VISION.md:84 กฎตายตัวข้อ 3 สั่ง "▲/▼ บนทุก delta". เส้นทางผู้ใช้จริงคือ grid (▲2.4%) → กดเข้า detail (+2.4%) เห็นสองสำนวนติดกัน. หมายเหตุ: AGENTS.md บันทึกไว้แล้วว่า Delta ไม่ยุบเข้า PriceTag เชิงโครงสร้าง (combo abs+pct) — แต่เรื่อง "เครื่องหมาย" ยังไม่เคยถูกเคาะ
- **ทางแก้:** ไม่ต้องยุบ component — แค่ให้ `Delta` ใช้ลูกศรชุดเดียวกับ PriceTag (หรือเคาะเป็นลายลักษณ์ว่า card-detail จงใจใช้ +/− แล้วแก้ข้อความใน VISION) เพื่อให้ delta ทั้งแอปพูดภาษาเดียว

### ⚪ card-detail.10 [NEW] ป้าย "ขายแล้ว" ใช้สีเขียว price-up ทั้งที่ไม่ใช่กำไร/ขาดทุน — ผิดกติกาสงวนสี
- **หน้า:** /cards/[code]
- **หลักฐาน:** use-card-detail-model.ts:326-333 provenance ของราคาหลัก: `kindColor: heroIsSold ? "var(--price-up-text)" : "var(--muted-foreground)"` แล้ว render เป็น pill พื้น+ตัวอักษรเขียวใน card-detail-price.tsx:66-78 — ป้ายบอกชนิดข้อมูล (ขายแล้ว vs ราคาตั้งขาย) ไม่ใช่กำไร/ขาดทุน ขัด VISION.md:27 "เขียว/แดง สงวนไว้แค่กำไร/ขาดทุน · ห้ามใช้บน chrome"
- **ทางแก้:** เปลี่ยนป้าย "ขายแล้ว" เป็นโทน neutral (foreground/muted) หรือ honey บางๆ ตามภาษา selected ของระบบ — เก็บเขียว/แดงไว้ให้ delta อย่างเดียว

### ⚪ card-detail.11 [CARD-DETAIL-13] หัวข้อ section บนหน้าเดียวกันมี 2 สำนวน และ dialog ตั้งแจ้งเตือนถูกฝังซ้ำ 2 ชุดสำหรับการ์ดใบเดียว
- **หน้า:** /cards/[code]
- **หลักฐาน:** ยังอยู่ตาม finding เดิม: recent-sales.tsx:211-221 และ asks-rail.tsx:156-173 ประกอบ `<h2 className="text-h3">` + SampleBadge + คำอธิบายเอง เพราะ `SectionHead` กลาง (shared/section-head.tsx:7) มีแค่ช่อง action ไม่มีช่อง badge/คำอธิบาย ขณะที่โซนอื่นหน้าเดียวกันใช้ SectionHead (card-detail.tsx:205,253) · CardSetAlertDialog ถูก mount 2 อินสแตนซ์: card-detail-buy-box.tsx:102-108 + asks-rail.tsx:295-301 (state เปิด/ปิดแยกกันคนละใบ)
- **ทางแก้:** เพิ่มช่อง badge/description ให้ SectionHead กลางแล้วให้สอง feed ใช้ตัวเดียวกัน · ยก CardSetAlertDialog ขึ้นไป mount ครั้งเดียวที่ card-detail แล้วส่งคำสั่งเปิดลงไปให้ asks-rail แบบเดียวกับที่ buy box ทำอยู่

### ⚪ card-detail.12 [CARD-DETAIL-14] สถานะ "เลือกอยู่" ทั้งหน้า (ชิปเกรด · JP/EN · ตัวกรอง) ใช้เทากลาง ขัดตัวอักษร VISION ที่ให้ honey = selected
- **หน้า:** /cards/[code]
- **หลักฐาน:** ยังอยู่ตาม finding เดิม: ชิปเกรด active = `bg-foreground/10` (card-detail-price.tsx:131) · EditionToggle active = `bg-foreground/10` (edition-toggle.tsx:31,45) · SEGMENT_ACTIVE = `bg-foreground/10` (market-feed-shared.tsx:18) — VISION.md:24 กำหนด honey-gold เป็น accent ของ selected. ชิปเกรดคือแกน re-pricing หลักของหน้า (StockX model) แต่แยก selected/idle ยากในแวบแรก. หมายเหตุ: AGENTS.md จดเหตุผลชะลอ EditionToggle→SegmentedControl ไว้แล้ว (ทำคู่ Phase 5)
- **ทางแก้:** ตัดสินใจให้ขาดแล้วบันทึกลง VISION: ถ้ายึด one-gold-CTA ให้เพิ่ม contrast ของ selected (ring เข้มขึ้น + พื้นเข้มขึ้น) — หรือตาม VISION เดิม ให้เฉพาะชิปเกรด selected ใช้ honey บางๆ (ยังต่ำกว่างบ 5%) ส่วน range/edition คง neutral — ทำพร้อมรอบ Phase 5 tap + KIT-05 ที่วางแผนไว้แล้ว

### ⚪ card-detail.13 [CARD-DETAIL-08] ความสูงกราฟประกาศซ้ำ 4 จุดใน 2 ไฟล์ — แก้ที่เดียวไม่ครบแล้วเพี้ยนเงียบ
- **หน้า:** /cards/[code]
- **หลักฐาน:** เหลือครึ่งหลังของ finding เดิม (ส่วน sticky offset แก้แล้วด้วย var(--chrome-h)): `h-[210px] sm:h-[280px] lg:h-[320px]` ประกาศซ้ำที่ card-detail-chart-section.tsx:56 (chartHeights) + card-chart.tsx:193 (empty state), :202 (single-point state), :301 (svg className) — สถานะว่าง/จุดเดียว/เส้นจริง ต้องสูงตรงกันเป๊ะไม่งั้น layout กระโดดตอนสลับ state
- **ทางแก้:** ให้ ScrubChart และ state ว่าง/จุดเดียว รับ class ความสูงจากผู้เรียกจุดเดียว (chartHeights ที่มีอยู่แล้วใน chart-section) หรือประกาศเป็นค่าคงที่ export เดียวในไฟล์ chart

### ⚪ card-detail.14 [STATES-08] โครงกระดูกตอนโหลด (loading) ไม่ตรงหน้าจริง: ขนาดปุ่มเก่า มีแถวไอคอนที่ถูกถอดไปแล้ว และความสูงกราฟไม่ตรง
- **หน้า:** /cards/[code]
- **หลักฐาน:** src/app/cards/[code]/loading.tsx:20-23 skeleton ปุ่ม header เป็น `size-9` แต่ของจริงเป็น size-11 บนมือถือ (card-detail-identity.tsx:29,41) · :53-56 มี skeleton คู่ไอคอน size-9 ใน buy box ที่หน้าจริงไม่มีแล้ว (CardDetailBuyBox ปัจจุบันคือ CTA ทอง + ปุ่มคู่ + แถวขายล่าสุด) · :72 กราฟ h-72 (288px) แต่ของจริง h-[210px] บนมือถือ — โครงโหลดกระตุกตอนสลับเป็นหน้าจริง
- **ทางแก้:** ปรับ skeleton ให้ตรง layout ปัจจุบัน (ปุ่ม size-11→sm:size-9, ตัดแถวไอคอนผี, กราฟใช้ความสูงชุดเดียวกับ chartHeights) — งานเล็กทำแทรกได้ตอนแตะไฟล์ loading รอบหน้า

### ⚪ card-detail.15 [CARD-DETAIL-12] กลไกกราฟหลายเส้น (overlay/เทียบเกรด) ยังค้างในไฟล์ทั้งที่ส่งเส้นเดียวเสมอ
- **หน้า:** /cards/[code]
- **หลักฐาน:** เหลือบางส่วนจาก finding เดิม (โหมด indexed ถูกตัดแล้ว): card-chart.tsx ยังมี branch วาดหลาย series — `drawn.map` วาดจุดปลายทุกเส้น (:427-438), จุด scrub ทุกเส้น (:451-452), tooltip หลายแถว `32 + idx * 19` (:464-472) — แต่ผู้เรียกเดียวส่ง seriesList ยาว 1 เสมอ (use-card-detail-model.ts:208-216 คืน array 1 ตัวตายตัว) · `rebaseToIndex` (:58-61) เหลือผู้ใช้เดียวคือไฟล์ test ของตัวเอง (chart-scale.test.ts:3)
- **ทางแก้:** ตัดโค้ด multi-series ให้ chart รับเส้นเดียวตรงๆ และย้าย/ลบ rebaseToIndex (เก็บใน lib แยกถ้าหน้า compare จะใช้ต่อ) — ถ้าจะคืน overlay เทียบเกรดในอนาคตค่อยดึงกลับจาก git history

<a id="sets"></a>
## Sets

**ภาพรวม:** โซนชุดการ์ดยังเป็นโซนที่แข็งแรงที่สุดตามที่ audit เดิมสรุป — โครงหน้า ดี ข้อค้นพบเก่าถูกแก้ไปแล้ว 2 เรื่อง (SetPosterTile รวมร่างแล้ว, ไฟล์กำพร้า pull-rates-table ถูกลบแล้ว) และหน้า set detail ได้ skeleton ของตัวเองแล้ว แต่ปัญหาใหญ่สุดยังค้าง: ปุ่มควบคุมบนมือถือทั้ง 2 หน้าสูงแค่ 26–40px ต่ำกว่ากติกา 44px และตอนนี้ยิ่งชัดเพราะแถบแท็บฝาแฝดที่หน้าแรกถูกแก้ (min-h-11) แล้วแต่หน้า sets ไม่ถูกแก้ตาม เจอของใหม่ 3 เรื่อง: ตัวสลับหน่วย pack/box/carton ใน drop-rate เขียนมือทั้งที่ drop-calculator ใช้ SegmentedControl ตัวจริงกับหน่วยชุดเดียวกันเป๊ะ, ป้ายประเภทชุด (Booster Pack ฯลฯ) มี 2 สำนวนภาษาอังกฤษล้วนไม่ผ่านระบบแปล, และสีน้ำผึ้งถูกเอาไปทาตัวเลข % ที่กดไม่ได้ ขัดกฎ accent

### 🔴 sets.1 [SETS-01] ปุ่มควบคุมหลักบนมือถือทั้ง 2 หน้าเตี้ยกว่า 44px ทั้งหมด — และตกขบวนการแก้ที่หน้าแรกได้ไปแล้ว
- **หน้า:** /sets, /sets/[setCode]
- **หลักฐาน:** src/app/sets/sets-page-client.tsx:113 type tab "border-b-2 px-2.5 py-2.5 text-xs" (~38-40px, NO min-h-11) while its twin at src/components/home/home-market-overview.tsx:167 already got "min-h-11" added — sets fell behind its own pattern. src/components/sets/set-detail-content.tsx:263 rarity jump chip "rounded-full px-2.5 py-1.5" (~32px); src/app/sets/[setCode]/set-page-client.tsx:85 DropRateDialog trigger "px-3 py-1.5 text-xs" (~30px); :114 unit toggle buttons "px-3 py-1 text-xs" (~26px); mobile FilterSelect uses SelectTrigger size=sm h-8 (32px) and SegmentedControl size=sm (28px) at set-detail-content.tsx:387-395 — all render on mobile (lg:hidden block).
- **ทางแก้:** เพิ่มความสูงแตะขั้นต่ำ 44px บนมือถือให้ครบทุกตัว: ใส่ min-h-11 ที่แท็บประเภทชุดให้ตรงกับฝาแฝดที่หน้าแรก แล้วแก้ที่ atom กลาง (SegmentedControl / SelectTrigger เพิ่มขนาดมือถือ) ให้ชิป rarity, ปุ่ม drop rate และตัวสลับหน่วยได้พร้อมกันทุกหน้า

### 🟡 sets.2 [NEW] ตัวสลับหน่วย pack/box/carton ใน drop-rate เขียนมือ ทั้งที่หน้า drop-calculator ใช้ SegmentedControl ตัวจริงกับหน่วยชุดเดียวกัน ✅
- **หน้า:** /sets/[setCode] (DropRateDialog) vs /drop-calculator
- **หลักฐาน:** src/app/sets/[setCode]/set-page-client.tsx:108-123 hand-rolls the segmented row ("inline-flex rounded-lg bg-muted/60 p-0.5" + buttons with active "bg-background text-foreground") over the same PULL_UNITS/UNIT_I18N_KEYS constants that src/components/drop-calculator/purchase-config.tsx:48-56 renders with the canonical <SegmentedControl> (active = bg-primary/15 text-primary). Same concept, two controls with different active styles; segmented-control.tsx:103-107 documents itself as "Single source of truth for tab-like pill controls... replaces ad-hoc segmented rows" (AGENTS.md Component Kit rule: ห้ามสร้างซ้ำ).
- **ทางแก้:** เปลี่ยนตัวสลับหน่วยใน DropRateDialog เป็น SegmentedControl แบบเดียวกับ drop-calculator (ส่ง options จาก PULL_UNITS เหมือนกันเป๊ะ) — ได้ทั้งหน้าตาตรงกัน สถานะ active สีเดียวกัน และแก้เรื่องความสูงปุ่มไปพร้อมกัน
- **หมายเหตุ verify:** CONFIRMED. set-page-client.tsx:108-123 hand-rolls the unit switcher (active bg-background text-foreground, ~26px tall buttons) while purchase-config.tsx:47-56 uses canonical SegmentedControl (active bg-primary/15 text-primary) — over literally the same constants: drop-calculator/types.ts re-exports PULL_UNITS/UNIT_I18N_KEYS from @/lib/constants/ui, the same module set-page-client imports. segmented-control.tsx:102-107 self-documents as single source of truth replacing ad-hoc segmented rows. Not an intentional exception: KIT-10 in doc/uxui-refactor-plan.md line 112 lists only EditionToggle as the deferred leftover; DropRateDialog's toggle appears nowhere in the plan or audit findings. The EditionToggle deferral rationale (tap 40→28px regression) doesn't apply here — it inverts: hand-rolled buttons are ~26px, so migrating IMPROVES tap size to the 44px standard and adds radiogroup/arrow-key a11y. Severity med is fair: explicit kit-rule violation + a11y/tap deficits on two conceptually-linked surfaces, but one small dialog control, no functional bug.

### 🟡 sets.3 [NEW] ป้ายประเภทชุดมี 2 สำนวน ไม่ตรงกันระหว่างหน้า และเป็นอังกฤษล้วนไม่ผ่านระบบแปล ✅
- **หน้า:** /sets, /sets/[setCode]
- **หลักฐาน:** src/app/sets/sets-page-client.tsx:29-35 hardcodes TYPE_LABEL {BOOSTER: "Booster Pack", STARTER: "Starter Deck", ...} used for filter tabs (:119) and section heads (:143) — English-only while every neighbouring string on the page goes through t(lang,...). Meanwhile set detail derives the same concept differently: src/lib/data/set-detail.ts:206 setType = set.type.replaceAll("_"," ") → hero eyebrow shows raw enum "BOOSTER"/"EXTRA BOOSTER" (set-hero.tsx:73), not "Booster Pack". Also src/app/sets/page.tsx:100 EmptyState title hardcoded English "No card sets yet". Thai users see English group headers on a Thai UI (owner preference: pure-Thai copy).
- **ทางแก้:** รวมป้ายประเภทชุดไว้ที่เดียว (เช่น constants + คีย์แปลใน i18n) แล้วให้ทั้งแท็บกรอง หัวกลุ่ม และ eyebrow ของ hero อ่านจากแหล่งเดียวกัน พร้อมคำไทยครบทุกภาษา และแก้ข้อความหน้าว่างให้ผ่าน t(lang,...) ด้วย
- **หมายเหตุ verify:** CONFIRMED, and understated. All cited evidence verified: sets-page-client.tsx:29-35 TYPE_LABEL hardcoded English used in tabs (:119) + section heads (:143) while neighbors use t(lang,...); set-detail.ts:206 replaceAll("_"," ") flows via [setCode]/page.tsx:73 to set-hero.tsx:73 eyebrow showing raw enum "BOOSTER"/"EXTRA BOOSTER" vs /sets' "Booster Pack"; sets/page.tsx:100 EmptyState title hardcoded "No card sets yet". No documented exception in AGENTS.md kit table or doc/uxui-refactor-plan.md / audit findings; not fixed on master. Bonus: TWO more divergent copies exist — portfolio/add-card-types.ts:29 ("Booster", no "Pack") and admin/sets/sets-manager.tsx:34 (Thai "บูสเตอร์แพ็ค") — 4 surfaces, 4 phrasings, strengthening the single-source proposal. Nuance for the fix: th.ts guide labels intentionally keep "Booster Pack (OP-xx)" as English product nouns, so per-language values may legitimately stay English for some types (but "OTHER"→"อื่นๆ" is translated everywhere localized). Severity med is honest: user-visible copy inconsistency on the app's primary browse flow (users pick set first) + i18n gap, but no functional breakage.

### 🟡 sets.4 [SETS-02] หน้ารวมชุดเรียงเก่าสุดขึ้นก่อน สวนทางกับแถบ "ชุดอื่นๆ" ที่เรียงใหม่สุดขึ้นก่อน
- **หน้า:** /sets vs /sets/[setCode]
- **หลักฐาน:** src/app/sets/page.tsx:35 orderBy [{type: "asc"},{code: "asc"}] puts OP01 first (newest sets — the ones collectors track — end up rows deep on a 3-col phone grid), while src/lib/data/set-detail.ts:63 getOtherSets orders [{releaseDate: "desc"}] newest-first. Same "browse sets" job, opposite order on adjacent pages.
- **ทางแก้:** เรียงหน้ารวมชุดใหม่สุดขึ้นก่อน (releaseDate desc) ให้ตรงกับแถบชุดอื่นๆ และพฤติกรรมจริงของนักสะสม — แก้ orderBy จุดเดียว

### 🟡 sets.5 [SETS-03] แถบแท็บขีดเส้นใต้ยังเขียนมือซ้ำหลายที่ และตอนนี้ drift หนักขึ้น (หน้าแรกได้ min-h-11 แล้ว หน้า sets ยังไม่ได้)
- **หน้า:** /sets (+ home, admin, profile)
- **หลักฐาน:** src/app/sets/sets-page-client.tsx:103-131 hand-rolled underline tab bar with class "ease-chrome relative -mb-px shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-semibold" — near-identical twin at src/components/home/home-market-overview.tsx:167 which has since gained "min-h-11" that sets never received; the predicted drift (audit SETS-03) has now materialised. No TabBar atom exists in the kit despite 4 call sites.
- **ทางแก้:** ยกเป็น TabBar atom กลางตัวเดียว (รับ options + active + onChange รองรับทั้ง button/Link สูง ≥44px ในตัว) แล้วย้ายทั้ง sets, หน้าแรก, admin, profile มาใช้ — จบ drift และแก้ tap target พร้อมกัน

### 🟡 sets.6 [SETS-05] ทั้ง 2 หน้า query เกินที่ใช้จริงบนหน้าแบบ force-dynamic
- **หน้า:** /sets, /sets/[setCode]
- **หลักฐาน:** src/app/sets/page.tsx:43-51 loads EVERY card with an image in the whole DB (where setId in <all sets>) just to pick one cover image per set. src/lib/data/set-detail.ts:31-41 joins the latest PSA10 price row per card and :183 maps psa10PriceUsd + isParallel into CardData, but SetCardTile (set-card-tile.tsx) never renders either field — fetched and dropped on every page view. Both pages are dynamic = "force-dynamic" (page.tsx:19, [setCode]/page.tsx:15). Note: plan deliberately parked this in Phase 5 (correctness risk) — still open in code.
- **ทางแก้:** หน้ารวม: เปลี่ยนเป็น query รูปปกแบบหนึ่งแถวต่อชุด (distinct ต่อ setId) หรือเก็บรูปปกไว้ที่ตาราง CardSet เลย · หน้า detail: ตัด join ราคา PSA10 กับ field ที่ไม่ได้แสดงออกจนกว่าจะมี UI ใช้จริง (ตามแผน Phase 5)

### 🟡 sets.7 [SETS-07] กรองจนไม่เหลือการ์ดแล้วเจอทางตัน — ข้อความจืดไม่มีปุ่มล้างตัวกรอง ไม่ใช้ EmptyState กลาง
- **หน้า:** /sets/[setCode]
- **หลักฐาน:** src/components/sets/set-detail-content.tsx:429-433 filtered-empty is a bare <div className="py-16 text-center text-sm text-muted-foreground">{t(lang,"noData")}</div> with no way forward, while the same file uses the canonical EmptyState for the no-cards case at :201. VISION §4.6: empty state ต้องมี illustration + 1 บรรทัด + CTA เดียว.
- **ทางแก้:** เปลี่ยนเป็น EmptyState พร้อมปุ่ม "ล้างตัวกรอง" ที่รีเซ็ต activeType/activeColor กลับเป็น all — จุดเดียวจบ

### 🟡 sets.8 [SETS-08] กล่อง drop rate เป็นทางตัน ไม่ต่อไปหาเครื่องคำนวณที่ละเอียดกว่า และเครื่องคำนวณก็รับลิงก์พร้อมชุดที่เลือกไม่ได้
- **หน้า:** /sets/[setCode] → /drop-calculator
- **หลักฐาน:** src/app/sets/[setCode]/set-page-client.tsx:84-213 DropRateDialog has no Link/CTA to /drop-calculator anywhere (no Link import in the file). src/app/drop-calculator/drop-calculator-client.tsx:32 selectedCode starts "" and never reads a URL search param — users who just viewed a set's drop rates must re-pick the set from scratch.
- **ทางแก้:** เพิ่มปุ่มท้ายกล่อง "คำนวณละเอียดในเครื่องคำนวณ" ลิงก์ไป /drop-calculator?set=<code> และให้เครื่องคำนวณอ่านค่าจาก URL มาเลือกชุดให้อัตโนมัติ — ต่อทางเดินฟีเจอร์เด่นให้ครบ

### ⚪ sets.9 [SETS-06] skeleton ตอนโหลดยังทรงไม่ตรงหน้าจริง — คอลัมน์กริดหน้ารวมไม่ตรง และหน้า detail บนจอใหญ่ไม่มีแถบข้าง
- **หน้า:** /sets, /sets/[setCode]
- **หลักฐาน:** Half of SETS-06 is fixed ([setCode]/loading.tsx now exists) but: src/app/sets/loading.tsx:21 skeleton grid is "lg:grid-cols-5" while the real grid is "lg:grid-cols-6 xl:grid-cols-7" (sets-page-client.tsx:152) — cards visibly reflow when content arrives. And src/app/sets/[setCode]/loading.tsx:32-37 renders the mobile pill-row layout at every width, while the real page at lg: has a w-52 left sidebar + no pill row (set-detail-content.tsx:303-308). VISION §4.6: skeleton รูปร่างตรงกับ layout จริง.
- **ทางแก้:** แก้คอลัมน์ skeleton หน้ารวมให้ตรง lg:6/xl:7 และเพิ่มโครงแถบข้างซ้ายให้ skeleton หน้า detail ที่จอ lg ขึ้นไป ให้ตอนโหลดเสร็จภาพไม่กระโดด

### ⚪ sets.10 [SETS-10] การ์ดที่ไม่มีรูปในกำแพงการ์ดใช้ Skeleton กะพริบค้างถาวร สื่อผิดว่ากำลังโหลด และไม่ตรงกับหน้ารวมที่ใช้ไอคอนนิ่ง
- **หน้า:** /sets/[setCode] vs /sets
- **หลักฐาน:** src/components/sets/set-card-tile.tsx:57 renders <Skeleton className="absolute inset-0 size-full" /> permanently when card.imageUrl is null (pulsing forever), while the index/other-sets tile shows a static Package icon (set-poster-tile.tsx:50-52) and the hero shows the same static icon (set-hero.tsx:64-66). VISION zero-spinner rule: skeleton = loading state only.
- **ทางแก้:** เปลี่ยนเป็นไอคอนนิ่งบนพื้น surface-1 แบบเดียวกับหน้ารวม — สงวน Skeleton ไว้สำหรับสถานะกำลังโหลดจริงเท่านั้น

### ⚪ sets.11 [SETS-11] ตัวเลขใน drop rate เขียน font เองแทน token กลาง และชื่อชุดใน hero หยิบ token มาแล้วทับน้ำหนัก+สี
- **หน้า:** /sets/[setCode]
- **หลักฐาน:** src/app/sets/[setCode]/set-page-client.tsx:138 "font-mono text-sm font-bold tabular-nums", :196 same, :202 "font-mono text-xs font-semibold" — hand-stacked instead of .text-price/.text-code used by SetCardTile on the same page. src/components/sets/set-hero.tsx:87 "text-h3 mt-0.5 font-normal text-muted-foreground" — takes a heading token then overrides weight+color, against AGENTS.md "one token, don't stack overrides".
- **ทางแก้:** เปลี่ยนตัวเลขในกล่อง drop rate เป็น .text-price/.text-code และให้ชื่อชุดใน hero ใช้ token ที่ตรงบทบาทจริง (เช่น text-h4 + สี muted) หรือเพิ่ม token คำโปรยถ้าใช้ซ้ำหลายหน้า

### ⚪ sets.12 [NEW] สีน้ำผึ้งถูกทาบนตัวเลข % ที่กดไม่ได้ในกล่อง drop rate — ขัดกฎ accent สงวนไว้สำหรับของที่กดได้
- **หน้า:** /sets/[setCode]
- **หลักฐาน:** src/app/sets/[setCode]/set-page-client.tsx:155 and :202 paint the static pull-chance percentage with text-primary (honey), and set-hero.tsx:122 tints the Crown icon text-primary — VISION §1: honey-gold = "accent interactive เดียว" (active tab · selected · focus ring · CTA), accent <5% of screen, "icons = neutral". Static data colored honey dilutes the meaning of honey as the interactive signal.
- **ทางแก้:** เปลี่ยนตัวเลข % เป็นสีตัวอักษรปกติ (เน้นด้วยน้ำหนัก/ขนาดแทนสี) และไอคอนมงกุฎเป็นสีกลาง — เก็บสีน้ำผึ้งไว้ให้ของที่กดได้เท่านั้น

### ⚪ sets.13 [SETS-12] จุด scrollspy/กระโดดหัวข้อใช้เลขลอย 4 ค่าไม่ตรงกันแทนความสูง header จริง
- **หน้า:** /sets/[setCode]
- **หลักฐาน:** src/components/sets/set-detail-content.tsx:189 scrollspy threshold top<=150, :213-217 scrollToRarity computes window.scrollTo with hardcoded -132 despite :408 already declaring scroll-mt-32 (128px), :308 sidebar sticky top-32 — four slightly different approximations of the chrome height; a header height change breaks all jumps. Plan already groups this under TOKENS-04 (--chrome-h var).
- **ทางแก้:** รวมเป็นค่ากลางค่าเดียว (ตัวแปร --chrome-h ตามแผน TOKENS-04) แล้วให้ปุ่มกระโดดใช้ scrollIntoView + scroll-mt แทนการคำนวณตำแหน่งเอง

<a id="honey"></a>
## Honey + Pricing

**ภาพรวม:** พื้นที่ honey/pricing/raffle ถูกเก็บงานไปแล้วหลายข้อจากรอบ audit ก่อน (nav มือถือมีป้ายครบ, deep-link ?tab= ใช้ได้, แตกไฟล์ใหญ่, เลข streak ใช้แหล่งเดียว, FilterTabs สูง 44px แล้ว) แต่ยังมีปัญหาค้างที่กระทบผู้ใช้จริง: popover "วิธีได้ Honey" บนการ์ดยอด Honey ยังโชว์เลขรางวัลผิดจากของจริงทุกรายการ, หน้า /honey ยังจืดผิดบุคลิก PLAY (ไม่มีตัวเลขพระเอก), สีเขียวกำไรถูกใช้เป็นสถานะ "ทำเสร็จ" ทั่วทั้งแท็บ, สี admin ทาทับปุ่มหลักในตู้จับรางวัล, และหน้า pricing ยังไม่ขายแผนไหนเป็นพิเศษ + ตารางเทียบใช้บนมือถือไม่ได้จริง นอกจากนี้เจอของใหม่: ปุ่มกดหลักเกือบทั้งหน้าสูงแค่ 32px ต่ำกว่ามาตรฐานที่ล็อกไว้ และมีไฟล์/โค้ดตายที่หลอกคนมาแก้ทีหลังเกิดซ้ำอีกรอบ

### 🔴 honey.1 [HONEY-03] popover "วิธีได้ Honey" โชว์เลขรางวัลผิดจากของจริงทุกรายการ (เลขค้างจากรอบก่อนที่การแก้ HONEY-03 ตกหล่นไฟล์นี้)
- **หน้า:** /honey (การ์ดยอด Honey → popover วิธีได้ Honey)
- **หลักฐาน:** src/app/honey/components/how-to-earn-popover.tsx:13-19 hardcodes EARN_METHODS: check-in "10–30 pt", sell "10 pt", review "15 pt", refer "50 pt" — but server truth is src/lib/honey/index.ts:59-70 CHECKIN=5 (FREE streak ladder 5/10/15 per src/lib/honey/streak.ts:35-39), MARKETPLACE_SELL=25, REVIEW=5, REFERRAL=150. Every number in the guide popover is wrong today. The HONEY-03 fix migrated 5 files to lib/honey/streak but missed this one. Also the residual popover duplication remains: StreakGuideContent (guide-contents.tsx:49-78) and StreakInfoPopover (streak-info-popover.tsx:33-82) are two different streak explainers on the same page.
- **ทางแก้:** ย้ายเลขทั้งหมดใน EARN_METHODS ไปอ่านจากแหล่งเดียวกับ server (export ค่า reward จาก lib/honey ฝั่ง client-safe แบบเดียวกับ streak.ts) ห้ามพิมพ์เลขลอยใน UI อีก และถือโอกาสยุบตัวอธิบาย streak 2 ชุดให้เหลือชุดเดียว

### 🟡 honey.2 [NEW] ปุ่มกดหลักเกือบทั้งพื้นที่ honey สูงแค่ 32–36px ต่ำกว่ามาตรฐานแตะ 44px ที่ล็อกไว้
- **หน้า:** /honey (ทุกแท็บ)
- **หลักฐาน:** Primary action buttons across the area are h-8 (32px) or h-9 (36px) with no mobile bump: claim button mission-card.tsx:49, "ไปทำภารกิจ" link mission-card.tsx:67, disabled claim :78, share button today-missions-card.tsx:118 + monthly-missions.tsx:117, shop redeem shop-tab.tsx:104, raffle confirm/cancel raffle-tab.tsx:437,446, free-ticket claim raffle-tab.tsx:143, check-in streak-card.tsx:186 (h-9), free-ticket row :267. Project direction locks มือถือ <md = iOS grammar tap ≥44px; the same page's tab nav and SegmentedControl were already fixed to h-11 (honey-tab-nav.tsx:193, segmented-control.tsx:239) so the buttons are now the odd ones out.
- **ทางแก้:** เพิ่มความสูงปุ่มบนมือถือเป็น ≥44px (h-11 บน base แล้วค่อยลดที่ md:) หรืออย่างน้อยขยายพื้นที่แตะด้วยแนวทางเดียวกับ tap-safe ที่ใช้กับปุ่มปิด toast แล้ว — ทำเป็นชุดเดียวกับงาน Phase 5 tap

### 🟡 honey.3 [HONEY-06] /honey จืดผิดบุคลิก PLAY — ไม่มีตัวเลขพระเอก ไม่มี motion สนุก ทั้งที่เป็นหน้า gamification
- **หน้า:** /honey
- **หลักฐาน:** stat-card.tsx:14-15 comment "the four cards intentionally share visual weight so they sit as a quiet status strip"; Honey balance renders text-h1 not .text-display (stat-card.tsx:54-58); no .text-display anywhere on /honey; motion is motion-base only (no --motion-play / .rise / count-up on claim or check-in). Violates VISION §1 (PLAY = spring delight) and §4.1 (one hero number per screen — this screen has zero).
- **ทางแก้:** ยกยอด Honey เป็นตัวเลขพระเอกตัวเดียวของหน้า (.text-display + count-up ตอนเคลม/เช็คอิน) ลดตั๋ว/streak/rank เป็นแถวรอง และใช้ spring motion กับจังหวะเคลมรางวัล ตามข้อเสนอ re-compose ใน audit เดิม

### 🟡 honey.4 [HONEY-07] หน้า preview ก่อน login ยังเป็นสำเนาวาดมือที่หน้าตาคนละแบบกับของจริง (ตอนนี้ยิ่งห่างกว่าตอน audit)
- **หน้า:** /honey (ยังไม่ login)
- **หลักฐาน:** honey-mock-preview.tsx:27-53 MOCK_NAV_GROUPS duplicates GROUPS from honey-tab-nav.tsx:24-50; mock stat cards :62-145 have amber/blue/orange/purple tinted boxes that the real HoneyStatCard no longer has; MockMobileTabs:248 still hides labels with "hidden sm:inline" while the real mobile nav now always shows labels (honey-tab-nav.tsx:200). Users see one design logged-out and a different one logged-in, and every redesign must be done twice.
- **ทางแก้:** ให้ mock ประกอบจาก component จริง (HoneyStatusBar/HoneyTabNav) โดยป้อนข้อมูลตัวอย่าง หรืออย่างน้อย import GROUPS ตัวเดียวกัน — เลิกวาดสำเนา

### 🟡 honey.5 [HONEY-08] สีเขียวกำไร (price-up) ยังถูกใช้เป็นสถานะ "ทำเสร็จ/ได้รับแล้ว" ทั่วทั้งพื้นที่ honey
- **หน้า:** /honey (ภารกิจ, กิจกรรม, ความสำเร็จ, โบนัส)
- **หลักฐาน:** text-price-up used for claimed/done states: mission-card.tsx:38,173 (claimed checkmark), bonus-row.tsx:49, achievements-tab.tsx:99,127, referral-tab.tsx:110 (copied checkmark), honey-toast.tsx:39,44 (earn accent), types.ts:198 (TX_DEFAULT_POSITIVE); activity-tab.tsx:142 pairs text-price-up with text-destructive for +/- honey amounts. VISION §1 reserves เขียว/แดง for profit/loss only.
- **ทางแก้:** เปลี่ยนสถานะเคลมแล้ว/สำเร็จเป็น primary (honey) หรือ muted+เครื่องหมายถูก และรายการหักลบใน activity ใช้ muted แทนแดง destructive ตามที่ audit เสนอไว้

### 🟡 honey.6 [HONEY-09] สี hex ที่ admin กรอกเองยังถูกทาทับปุ่มหลักและชื่อการ์ดตู้จับรางวัลตรงๆ
- **หน้า:** /honey?tab=raffle, /raffle/winners
- **หลักฐาน:** raffle-tab.tsx:305 style={color: accent} on machine title, :401 and :463-467 style={backgroundColor: accent, color:"#fff"} on the primary CTA buttons (ซื้อตั๋ว/ดูผล) — arbitrary admin hex can be red/green (collides with gain/loss semantics) and #fff text has no contrast guarantee; winners-list.tsx:177 also tints the card title. The sanctioned decorative use (border-top strip, winners-list.tsx:156) exists right next to it.
- **ทางแก้:** จำกัดสีตู้ไว้แค่ชั้นตกแต่ง (แถบขอบบน/พื้นรูป) แบบเดียวกับ winners-list ส่วนปุ่มและหัวข้อใช้ token ปกติ (primary/foreground) ทุกใบ

### 🟡 honey.7 [HONEY-10] หน้า pricing ยังไม่ "ขาย" แผนไหนเลย — การ์ด 3 ใบน้ำหนักเกือบเท่ากัน ปุ่มสีเดียวกันหมด ป้าย 2 อันแย่งกันเอง
- **หน้า:** /pricing
- **หลักฐาน:** lib/billing/plans.ts:238 vs :254 — ctaClass ของ PRO และ PRO_PLUS identical ("bg-primary text-primary-foreground hover:bg-primary/90"); Pro card differentiation on /pricing = only border-foreground/30 (plan-cards.tsx:189); "popular" badge (plan-cards.tsx:84 bg-foreground) and Pro+ badge (plans.ts:247 bg-foreground) are the same neutral style competing side by side.
- **ทางแก้:** ให้ Pro เป็นแผนแนะนำเดียว: ป้าย honey-gold + ปุ่มเด่นเฉพาะ Pro ส่วนแผนอื่นใช้ปุ่มขอบ (outline) ตามหลัก honey = จุดเน้นเดียวของ action หลัก

### 🟡 honey.8 [HONEY-11] หัวคอลัมน์ตารางเทียบแผนตั้ง sticky top-0 เลื่อนแล้วมุดหายใต้ header ของเว็บ
- **หน้า:** /pricing (desktop)
- **หลักฐาน:** plan-feature-comparison.tsx:156,166 th uses "sticky top-0 z-10 bg-background" but the site header is sticky top-0 z-50 (layout/header.tsx:92), so scrolled column headers slide under it — user loses track of which column is Pro/Pro+ in a ~20-row table. Note the --chrome-h token now exists (globals.css:127) so the fix is one class.
- **ทางแก้:** เปลี่ยน top-0 เป็น top-[var(--chrome-h)] (token มีอยู่แล้ว) หรือทำ sticky ภายในกรอบของตารางเอง

### 🟡 honey.9 [HONEY-12] ตารางเทียบแผนบนมือถือเป็นการ์ด 3 ใบเรียงยาว เทียบข้ามแผนไม่ได้จริง
- **หน้า:** /pricing (มือถือ)
- **หลักฐาน:** plan-feature-comparison.tsx:86-147 — below sm renders 3 stacked plan cards, each repeating every feature section (~20 rows × 3 plans); to compare a single feature the user must scroll and memorize values, and FAQ is pushed very far down.
- **ทางแก้:** ใช้ตัวสลับแผนแบบ segmented (FREE|PRO|PRO+) ปักไว้ด้านบนแล้วโชว์รายการชุดเดียว หรือแถวละ feature + ค่า 3 คอลัมน์แบบย่อ ให้เทียบได้ในจอเดียว

### 🟡 honey.10 [STATES-09] หน้าว่างของ honey ยังจืดที่สุดในแอป — ไม่มีหมี ไม่มีปุ่มชวนทำต่อ แถมแต่ละแท็บทำหน้าว่างกันคนละแบบ
- **หน้า:** /honey (ทุกแท็บ)
- **หลักฐาน:** honey/components/empty-state.tsx:5 wraps shared EmptyState with appearance="minimal" (faded icon, no mascot, no CTA) — used by achievements/rankings; meanwhile shop-tab.tsx:55-59, raffle-tab.tsx:102-110 and activity-tab.tsx:92-117 hand-roll their own inline empty blocks (activity's has a CTA, the others don't). VISION reserves the Kuma bear for empty states and PLAY surfaces should delight; the shared EmptyState already has kuma presets (shared/empty-state.tsx:74-91) but honey never uses them.
- **ทางแก้:** ให้ทุกแท็บใช้ EmptyState กลางตัวเดียว เปิดโหมดหมี Kuma + ปุ่มชวน 1 ปุ่ม (เช่น "ไปทำภารกิจแรก") แทน minimal และลบ empty เขียนมือ 3 จุด

### ⚪ honey.11 [HONEY-14] หัวตาราง leaderboard ใช้คำแปลผิดคีย์ — คอลัมน์ชื่อผู้เล่นขึ้นว่า "ไม่ระบุชื่อ"
- **หน้า:** /honey?tab=rankings (desktop)
- **หลักฐาน:** rankings-tab.tsx:98 <th>{t(lang, "anonymous")}</th> as the player-name column header and :100 t(lang, "days") as the streak column header — reused keys that read wrong as headers.
- **ทางแก้:** เพิ่มคีย์เฉพาะ เช่น leaderboardPlayer / leaderboardStreak แล้วใช้แทน

### ⚪ honey.12 [NEW] การ์ดแผนทั้ง 3 ใบใน /pricing ใช้ตัวเลขพระเอก (.text-display) พร้อมกัน ขัดกฎ 1 ตัวต่อหน้า
- **หน้า:** /pricing
- **หลักฐาน:** plan-cards.tsx:121 and :144 render .text-display for the price of every plan (FREE included) — 3 hero numbers on one screen, violating VISION §4.1 ("one hero number / screen, เกิน 1 = clutter bug"). Fixing together with HONEY-10 (Pro as the single hero) resolves both.
- **ทางแก้:** ให้ราคาแผน Pro ใบเดียวเป็น .text-display ส่วน FREE/Pro+ ไล่ลงมาใช้ขนาดรอง — เสริมการขาย Pro ตาม HONEY-10 ไปในตัว

### ⚪ honey.13 [NEW] ป้ายตัวคูณจากแพ็กเกจใช้สี amber เขียนสด ทั้งที่ป้ายตัวคูณ event ข้างๆ ใช้ token primary
- **หน้า:** /honey
- **หลักฐาน:** honey-status-bar.tsx:101 plan-multiplier pill uses hardcoded "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" while the seasonal-event pill right beside it (:110) uses "border-primary/30 bg-primary/5 text-primary" — same concept (ตัวคูณ Honey), two color systems side by side; honey-toast.tsx:37,42 also hardcodes amber-500 for milestone toasts.
- **ทางแก้:** ใช้ token primary (honey) กับป้ายตัวคูณทั้งสองใบให้เป็นชุดเดียวกัน และเลิกเขียนสี amber ดิบใน toast

### ⚪ honey.14 [NEW] toast ของ honey เดาประเภทข้อความจากการค้นหาคำในข้อความที่แปลแล้ว — ภาษาญี่ปุ่นไม่เข้าเงื่อนไขเลย
- **หน้า:** /honey (ทุก action ที่เด้ง toast)
- **หลักฐาน:** honey-toast.tsx:26-33 classifies the toast by lc.includes("check-in")/"เช็คอิน"/"mission"/"ภารกิจ" on the already-localized message string — JP messages (チェックイン etc.) never match, so JP users always get the fallback Award icon/accent; any copy change silently breaks the mapping.
- **ทางแก้:** ส่งประเภท (earn/milestone/redeem) มากับ message จาก use-honey-data ตรงๆ แทนการเดาจากข้อความ

### ⚪ honey.15 [NEW] ข้อความหลายจุดใน honey เขียนคำแปล 3 ภาษาฝังในไฟล์เอง แทนระบบแปลกลาง แถมก๊อปฟังก์ชันซ้ำ
- **หน้า:** /honey (achievements, rankings, สถานะแรงก์)
- **หลักฐาน:** Inline per-language literal maps bypass t(): achievements-tab.tsx:15-19 FILTER_LABELS, rankings-tab.tsx:14-17 SORT_LABELS, rank-progress.tsx:35-49 builds TH/JP/EN sentences by hand; streakDayText is copy-pasted identically in honey-status-bar.tsx:21-25 and guide-contents.tsx:9-13. Everything else in the area uses TranslationKey + t() (e.g. activity-tab FILTER_LABEL_KEYS) — two translation systems in one folder.
- **ทางแก้:** ย้ายข้อความเหล่านี้เข้าไฟล์แปลกลางเป็นคีย์ปกติ และยุบ streakDayText เหลือฟังก์ชันเดียว

### ⚪ honey.16 [NEW] โค้ดตาย/กำพร้าเกิดซ้ำอีกรอบใน honey — ไฟล์ที่ไม่มีใคร import และค่าที่ไม่มีใครใช้
- **หน้า:** /honey
- **หลักฐาน:** (1) honey/components/_shared/claim-row.tsx (67 lines) has ZERO importers repo-wide yet its docstring claims it's "used by every claim/list pattern" — same trap class as the deleted honey-hero/daily-missions-card orphans (HONEY-02). (2) types.ts:23-31 HONEY_TABS + HoneyTabDef exported but never imported (nav uses its own GROUPS). (3) types.ts:187-199 TX_TYPE_STYLE bg/fg rainbow classes are dead — activity-tab.tsx:131 consumes only .icon. (4) streak-card.tsx:13-14 re-hardcodes thresholds 7/30 instead of reading STREAK_TIERS[].min it already imports.
- **ทางแก้:** ลบ claim-row.tsx, HONEY_TABS และ field สีที่ไม่ใช้ใน TX_TYPE_STYLE (ขออนุญาตก่อนลบไฟล์ตามกติกา) และให้ streak-card อ่าน 7/30 จาก STREAK_TIERS

### ⚪ honey.17 [NEW] ปุ่ม "ใช้ Honey แลก Pro" ใน /pricing ซ้อนปุ่มไว้ในลิงก์ (ปุ่มในลิงก์ = HTML ผิดกติกา) ทั้งที่ไฟล์เดียวกันใช้ลายที่ถูกอยู่แล้ว
- **หน้า:** /pricing
- **หลักฐาน:** pricing-client.tsx:447-455 wraps <Button> inside <Link> producing <a><button>…</button></a> (nested interactive elements — double tab stop for keyboard/screen reader), while the same file uses the correct Base UI pattern Button render={<Link …/>} at :253-254 and :370-371 (and raffle-tab.tsx:399 does too).
- **ทางแก้:** เปลี่ยนเป็น Button render={<Link href="/honey?tab=shop"/>} ให้เหมือนจุดอื่นในไฟล์

### ⚪ honey.18 [NEW] honey มีหัวข้อ section ของตัวเอง ซ้ำหน้าที่กับ SectionHead ตัวกลางใน kit
- **หน้า:** /honey
- **หลักฐาน:** honey/components/_shared/section-header.tsx:11-31 local SectionHeader (title + description + right pill, h2.text-h3) duplicates the canon SectionHead (shared/section-head.tsx:7 — title + right action, h2.text-h3) from the Component Kit table; kit rule says extend the canonical instead of creating a parallel one.
- **ทางแก้:** เพิ่ม slot description/pill ให้ SectionHead กลาง แล้วให้ honey ใช้ตัวกลาง (หรือประกาศตัว honey เข้า kit อย่างเป็นทางการในตาราง) — เลือกทางเดียวไม่ให้มีสองตัว

### ⚪ honey.19 [NEW] เส้นตายสิ้นเดือนเดียวกันถูกโชว์คนละรูปแบบใน 2 แท็บข้างกัน (นาฬิกาถอยหลัง d h:m:s กับ "เหลือ X วัน Y ชม.")
- **หน้า:** /honey (raffle vs ภารกิจรายเดือน)
- **หลักฐาน:** raffle-tab.tsx:23-45 useRaffleCountdown renders "3d 04:12:33" (per-second, font-mono) while monthly-missions.tsx:28,54-56 useMonthCountdown renders localized "เหลือ {days} วัน {hours} ชม." — both count to the same end-of-month draw; two hooks + two formats for one deadline.
- **ทางแก้:** เลือกรูปแบบเดียว (แนะนำแบบวัน+ชั่วโมงอ่านง่าย ไม่ต้องเดินวินาที) แล้วใช้ hook เดียวทั้งสองจุด

<a id="settings"></a>
## Settings + /more

**ภาพรวม:** โครงหลักของ settings แข็งแรงขึ้นมากจากรอบก่อน — เรื่องใหญ่ที่เคยแดง (marketplace หลุด flag, QR 2FA รั่ว, ปุ่มย้อน, Switch/SavedPill) แก้จบแล้วจริงในโค้ด แต่ปัญหา "ความไม่สม่ำเสมอ" ก้อนใหญ่สุดยังอยู่ครบ: หน้าแม่เป็นภาษา iOS grouped-inset แต่หน้าลูกทั้ง 10 ยังเป็นฟอร์มแบบ desktop เหมือนเดิมทุกหน้า, สีไอคอน/สีตกแต่งยัง hardcode คนละชุดกับ /more, รูปแบบบอกผล "บันทึกแล้ว" ยังมี 4 แบบ และ 4 หน้ายังใช้ spinner ขัดกฎ zero-spinner นอกจากนี้เจอของใหม่ที่ควรเก็บ: ลบที่อยู่ได้ทันทีโดยไม่มีการยืนยัน, การ์ดเขียนมือซ้ำ Surface ในหน้า notifications/subscription, และ empty state เขียนมือ 3 จุดทั้งที่มีตัวกลางอยู่แล้ว

### 🔴 settings.1 [SETTINGS-02] หน้าลูก settings ทั้ง 10 หน้ายังเป็นฟอร์มแบบจอใหญ่ ขณะที่หน้าแม่เป็นรายการแบบ iOS — ภาษาหน้าจอสะดุดกลางทางบนมือถือ
- **หน้า:** /settings/account, /settings/privacy, /settings/notifications, /settings/security, /settings/addresses, /settings/billing, /settings/subscription, /settings/export, /settings/marketplace
- **หลักฐาน:** grep for GroupedRow/GroupedSection in src/components/settings/*.tsx returns ZERO hits — every child page still renders desktop Surface forms on both breakpoints: src/components/settings/section-security.tsx:235 `<Surface variant="outline" padding="lg">`, src/components/settings/account-privacy-section.tsx:101 local `<Card>` (Surface wrapper), src/components/settings/section-notifications.tsx:243-247 hand-rolled card. Meanwhile the parent index src/app/settings/page.tsx:39-84 is full iOS grouped-inset (`GroupedSection`/`GroupedRow`, md:hidden). Tapping any row on mobile jumps from iOS list grammar into a desktop form.
- **ทางแก้:** ทยอยแปลงหน้าลูกบนมือถือเป็น GroupedSection/GroupedRow ตามแผนเดิม เริ่มจากหน้าที่เป็นสวิตช์ล้วน (privacy, notifications, export) — Switch อยู่ช่อง trailing ของแถว, ข้อความอธิบายเป็น footer ใต้การ์ด — แล้วตามด้วย account/addresses/billing/security ส่วนจอใหญ่คงโครง Surface เดิม

### 🟡 settings.2 [SETTINGS-04] เปลี่ยนภาษา/สกุลเงิน/ธีม อยู่ใน /more ที่เดียว — คนเปิดหน้า "ตั้งค่า" หาไม่เจอ
- **หน้า:** /settings vs /more
- **หลักฐาน:** src/app/more/more-client.tsx:288-345 has the full Preferences group (Language/Currency/Theme via Select trailing) but SETTINGS_SECTIONS in src/app/settings/settings-shell.tsx:33-43 has no preferences entry at all — /settings offers account/privacy/subscription/billing/security/notifications/marketplace/addresses/export only. On desktop /more is not in normal nav, so desktop users have no Settings path to language at all.
- **ทางแก้:** เพิ่มกลุ่ม "ค่าที่ใช้ทั่วไป" (ภาษา/สกุลเงิน/ธีม) เข้า /settings — ลอกแถว GroupedRow + Select จาก more-client มาใช้ได้เลย และคงทางลัดใน /more ไว้ตามเดิม

### 🟡 settings.3 [SETTINGS-07] 4 หน้าลูกยังโหลดด้วยวงกลมหมุน ขัดกฎ "ศูนย์ spinner" ทั้งที่หน้า alerts ในโฟลเดอร์เดียวกันทำ skeleton ถูกแบบแล้ว
- **หน้า:** /settings/addresses, /settings/billing, /settings/security, /settings/subscription
- **หลักฐาน:** Loader2 spinners: src/components/settings/section-addresses.tsx:205-208, section-billing.tsx:40-43, section-security.tsx:309-312 (MFA) + 420-423 (login history), section-subscription.tsx:371-372 (payment method). Violates VISION §4.6 zero-spinner rule. The reference implementation exists in the same area: src/app/settings/alerts/alerts-manager-client.tsx:250-266 renders layout-shaped Skeletons.
- **ทางแก้:** แทน spinner ด้วย Skeleton รูปร่างตรงกับเนื้อหาจริง (แถวที่อยู่ 2-3 แถว, แถวใบเสร็จ, แถวประวัติเข้าระบบ, แถวบัตร) ตามแบบหน้า alerts

### 🟡 settings.4 [SETTINGS-06] รูปแบบบอกผล "บันทึกแล้ว" ยังมี 4 แบบใน settings — ผู้ใช้ต้องเรียนรู้ใหม่ทุกหน้า
- **หน้า:** /settings/security, /settings/notifications, /settings/privacy, /settings/account, /settings/addresses
- **หลักฐาน:** section-security.tsx:271-276 password success = green banner box; section-notifications.tsx:177-181 + account-privacy-section.tsx:191-193 = SavedPill 2s; account-profile-info.tsx:51-70 name/bio/handle save closes silently with no confirmation; section-addresses.tsx:96-97 form save just closes the form. Sonner toast is installed (src/components/ui/sonner.tsx) but grep for toast/sonner in settings components returns zero hits.
- **ทางแก้:** เคาะให้เหลือ 2 แบบตามที่วางไว้: สวิตช์/เลือกค่า = บันทึกอัตโนมัติ + SavedPill · ฟอร์มที่กดปุ่มบันทึก = toast แล้วไล่ปรับ security banner กับจุดที่บันทึกเงียบให้เข้าเกณฑ์

### 🟡 settings.5 [SETTINGS-08] สีไอคอน/สีตกแต่งในหน้าลูกยัง hardcode สีดิบคนละชุดกับ /more — จอ settings สีสดกระจาย ขัดกฎ "chrome จืด" และเขียว/แดงหลุดไปอยู่บนของตกแต่ง
- **หน้า:** /settings/export, /settings/notifications, /settings/subscription, /settings/marketplace, /settings (index), /more
- **หลักฐาน:** Raw Tailwind colors: section-export.tsx:37 pink-100/pink-600, :44 blue-100/blue-600, :23,30 bg-success/10 decorative green; section-notifications.tsx:82-83 blue, :104 amber, :115-116 purple, :93-94 market row uses text-success decoratively, :246 ring-amber-500/20; section-subscription.tsx:346-358 trial CTA full amber (bg-amber-600 text-white) instead of primary, :402-404 usage bars bg-amber-500/bg-blue-500/bg-purple-500; section-marketplace.tsx:30 pink. Meanwhile /more uses semantic tokens (more-client.tsx:195-213 bg-info-soft/bg-success-soft/bg-warning-soft) but /settings index rows use the default honey wash with no color at all (settings/page.tsx:73-80) — the two sibling hubs speak different icon-color languages. Bonus drift in /more itself: honey count hardcodes text-amber-600 (more-client.tsx:154) and "รายการที่บันทึก" uses destructive red tile (:256) same as logout (:376).
- **ทางแก้:** map ไอคอนทุกจุดเข้า *-soft tokens ชุดเดียว (มีครบใน globals.css แล้ว) และเคาะภาษาเดียวให้ hub ทั้งสองหน้า (settings index กับ /more) — เขียว/แดงสงวนให้กำไร/ขาดทุน, ทอง honey สงวนให้จุด interactive

### 🟡 settings.6 [NEW] ลบที่อยู่จัดส่งได้ทันทีโดยไม่มีการยืนยัน — กดพลาดจากเมนูจุดสามจุดแล้วข้อมูลหายเลย
- **หน้า:** /settings/addresses
- **หลักฐาน:** src/components/settings/section-addresses.tsx:105-110 handleDelete fires apiDelete immediately; reachable from the mobile overflow menu item at :302-308 and desktop trash icon at :270-278 — no confirm step, no undo. The shared ConfirmDialog kit exists and is used for the exact same situation by alerts in the same settings area (alerts-manager-client.tsx:176-183 confirms before deleting an alert).
- **ทางแก้:** ครอบการลบด้วย useConfirm (confirm-dialog กลาง) แบบเดียวกับหน้า alerts — หัวข้อ "ลบที่อยู่นี้?" + ปุ่มยืนยันโทนแดง

### 🟡 settings.7 [NEW] การ์ดเขียนมือซ้ำ Surface ใน notifications/subscription — มุมโค้งไม่เท่ากันในหน้าเดียว
- **หน้า:** /settings/notifications, /settings/subscription
- **หลักฐาน:** Hand-rolled `rounded-xl bg-card p-5 shadow-[var(--panel-shadow)]` at section-notifications.tsx:243-247 and section-subscription.tsx:366, 397 — byte-for-byte what `Surface variant="outline"` provides (ui/surface.tsx:16) except radius drifts (rounded-xl vs kit's rounded-lg). Both pages also use real Surface elsewhere (section-notifications.tsx:205), so two card radii coexist on the same screen.
- **ทางแก้:** เปลี่ยน 3 จุดเป็น `<Surface variant="outline" padding="lg">` ให้มุมโค้ง/เงามาจากที่เดียว

### 🟡 settings.8 [SETTINGS-12] แถวตัวตนผู้ใช้เขียนมือซ้ำ 3 ชุด (/settings มือถือ · /more · sidebar จอใหญ่) และป้ายกลุ่มเดียวกันแปลไม่ตรงกัน: มือถือ "อื่นๆ" จอใหญ่ "เพิ่มเติม"
- **หน้า:** /settings, /more
- **หลักฐาน:** Identity row markup (avatar + tier badge + chevron, min-h-[68px]) duplicated: src/app/settings/page.tsx:41-65, src/app/more/more-client.tsx:125-163, plus a third sidebar variant settings-shell.tsx:145-169. i18n keys duplicated with drift: th.ts:702-703 settingsGeneral="ทั่วไป"/settingsMore="อื่นๆ" (used by mobile index page.tsx:68-69) vs th.ts:1259-1260 settingsGroupGeneral="ทั่วไป"/settingsGroupMore="เพิ่มเติม" (used by desktop sidebar shell:174) — the same section group is labelled differently per breakpoint, visible to users.
- **ทางแก้:** แยกเป็น IdentityRow ตัวเดียว (props: ปลายทาง, ข้อมูลท้ายแถว) ให้ 3 จุดใช้ร่วม และยุบ i18n เหลือชุดเดียว — เคาะคำว่า "เพิ่มเติม" ให้ตรงกับแท็บล่าง

### ⚪ settings.9 [NEW] empty state เขียนมือ 3 จุดในหน้าลูก ทั้งที่มี EmptyState กลาง (หมี Kuma) และหน้า alerts ข้างๆ ก็ใช้อยู่
- **หน้า:** /settings/addresses, /settings/billing, /settings/marketplace
- **หลักฐาน:** Hand-rolled icon-in-muted-box empties: section-addresses.tsx:210-224, section-billing.tsx:45-52, section-marketplace.tsx:87-98 — none import shared/empty-state.tsx (grep EmptyState in src/components/settings = zero hits). alerts-manager-client.tsx:388 in the same settings area uses the canonical EmptyState. Related to the tracked two-system empty-state problem (STATES-03) but these three use neither system.
- **ทางแก้:** เปลี่ยน 3 จุดเป็น EmptyState กลาง (variant dashed + CTA เดิม เช่นปุ่มเพิ่มที่อยู่) ให้หน้าตา/ระยะห่างตรงกับทั้งแอป

### ⚪ settings.10 [SETTINGS-13] /settings บนจอใหญ่แสดงเนื้อหาบัญชีซ้ำกับ /settings/account (สอง URL เนื้อเดียว) และหัวหน้าลูกมีคำอธิบายบ้างไม่มีบ้าง
- **หน้า:** /settings, /settings/account, /settings/security, /settings/export
- **หลักฐาน:** src/app/settings/page.tsx:86-89 desktop branch renders <SectionAccount> — identical content to /settings/account — and the sidebar marks account active for both (settings-shell.tsx:184 `active = isIndex ? id === "account" : ...`). Headers now share SettingsSectionHeader but description presence varies: security (section-security.tsx:232), account (section-account.tsx:22), export (section-export.tsx:50) pass title only, while billing/privacy/notifications/subscription pass description.
- **ทางแก้:** ให้ /settings บนจอใหญ่พาไป /settings/account แทนการวาดซ้ำ และเติมคำอธิบายสั้นๆ ให้ครบทุกหน้าลูกผ่าน SettingsSectionHeader เดิม

### ⚪ settings.11 [SETTINGS-11] settings เติมที่ว่างท้ายหน้าซ้ำกับที่โครงกลางให้แล้ว (~64px เกินจำเป็น)
- **หน้า:** /settings/* ทุกหน้า
- **หลักฐาน:** settings-shell.tsx:216 content wrapper adds pb-16 while /settings matches NO_MOBILE_FOOTER_ROUTES (main-chrome.tsx:52) so PageContent already applies pb-32 mobile / md:pb-24 (main-chrome.tsx:189). Violates AGENTS "don't double-pad".
- **ทางแก้:** ตัด pb-16 ออกจาก settings-shell (ถ้าอยากได้ที่หายใจท้ายฟอร์มบนจอใหญ่ ใช้ md:pb-8 พอ)

### ⚪ settings.12 [NEW] Card/CardHeader ก๊อปกัน 2 ไฟล์ในหน้า account ทั้งที่ Surface มีช่อง header ให้อยู่แล้ว
- **หน้า:** /settings/account, /settings/privacy
- **หลักฐาน:** account-cover-image.tsx:355-388 duplicates the local Card + CardHeader from account-privacy-section.tsx:196-225 — the file even comments "mirrors AccountPrivacySection's Card/CardHeader". The Surface kit already ships header/footer slots (ui/surface.tsx:84-95).
- **ทางแก้:** ย้าย CardHeader (eyebrow+title+feedback) ไปเป็นตัวกลางตัวเดียว หรือใช้ช่อง header ของ Surface แล้วลบสำเนา

### ⚪ settings.13 [NEW] ปุ่ม/ช่องกรอกเขียนมือหลายจุดในหน้า account ทั้งที่ kit มีของให้แล้ว (IconButton · Button · Textarea)
- **หน้า:** /settings/account, /settings/subscription
- **หลักฐาน:** Icon-only edit/cancel buttons hand-rolled: account-profile-info.tsx:287-305, account-social-links.tsx:91-110 (kit canon: ui/icon-button.tsx, the same consolidation already done for portfolio in PORTFOLIO-06). Outline-style buttons hand-rolled: account-cover-image.tsx:314-347. Raw <textarea> hand-rolled twice while ui/textarea.tsx exists: account-profile-info.tsx:150-156, section-subscription.tsx:437-440.
- **ทางแก้:** เปลี่ยนปุ่มไอคอนเป็น IconButton, ปุ่มขอบเป็น Button variant=outline, และช่องข้อความเป็น Textarea กลาง — หน้าตา/จุดกด/สถานะ focus จะตรงกันทั้งแอป

### ⚪ settings.14 [NEW] โค้ดจัดการ alerts อยู่ผิดบ้าน — โฟลเดอร์ settings/alerts เหลือแค่ทางเบี่ยง แต่ตัวจริงถูกเรียกใช้จาก /watchlist
- **หน้า:** /settings/alerts, /watchlist
- **หลักฐาน:** src/app/settings/alerts/page.tsx:8-10 is now a pure redirect to /watchlist?tab=alerts, but alerts-manager-client.tsx / alert-row.tsx / alert-groups.tsx (~770 lines + tests) still live in that folder and are imported only by src/app/watchlist/watchlist-tabs.tsx:7 — misleading home for the next person editing watchlist.
- **ทางแก้:** ย้าย component ชุด alerts ไป src/components/alerts/ (มีโฟลเดอร์นี้อยู่แล้ว) หรือใต้ watchlist แล้วคง route redirect ไว้ตามเดิม

### ⚪ settings.15 [NEW] /more บนจอใหญ่ไม่มีหัวเว็บเลย — เข้าหน้านี้แล้วไม่เหลือทางไปค้นหา/เมนูหลัก
- **หน้า:** /more (desktop)
- **หลักฐาน:** main-chrome.tsx:34 NO_HEADER_FOOTER_ROUTES=["/more"] hides Header+Footer at EVERY width (SiteChrome/FooterChrome return null, :122,149); bottom-nav is mobile-only, so desktop /more (reachable by URL, back-button from /settings index shell:134 points here too) is a dead-end page with no global nav or search. The owner call documented in more-client.tsx:117-121 reasons about mobile duplication; the previous audit's recompose note already suggested restoring the header on md+ only.
- **ทางแก้:** ซ่อนหัวเว็บเฉพาาะจอเล็ก (<md) แล้วคืนหัวเว็บปกติบนจอใหญ่ — เนื้อหา 2 คอลัมน์เดิมใช้ได้ตามเดิม

<a id="identity"></a>
## Auth + Profile

**ภาพรวม:** งาน auth kit (Phase 2.5) ทำได้ดีมาก — ทั้ง 4 หน้า auth ใช้โครงร่วมชุดเดียว (AuthShell/OAuthButtons/PasswordInput) และปุ่มขนาด sm ถูกแก้ให้แตะได้ ≥44px ที่ระดับ atom แล้ว จุดที่ยังเจ็บจริงคือหน้าโปรไฟล์สาธารณะ: ข้อมูลความน่าเชื่อถือ (คะแนน/ดีล/เวลาตอบ/ตราผู้ขาย) ยังโชว์ซ้ำ 3-4 ชั้นก่อนถึงเนื้อหา, ปุ่ม "บันทึกผู้ขาย" 2 จุดบนจอเดียวสถานะไม่ตรงกัน, และหน้าโหลด (skeleton) ของหน้าเดียวกันถูกเขียนซ้ำ 2 ไฟล์จนหน้าตาไม่ตรงกันและไม่ตรงของจริง นอกจากนี้แท็บในโปรไฟล์ยังเขียน empty state และดาวเรตติ้งเองแทนที่จะใช้ชุด component กลาง (EmptyState หมี Kuma / RatingStars) และข้อความผิดพลาดในหน้า auth ยังเป็นภาษาอังกฤษล้วนทั้งที่ทั้งเว็บรองรับ 3 ภาษา

### 🔴 identity.1 [IDENTITY-03] ข้อมูลความน่าเชื่อถือผู้ขายโชว์ซ้ำ 3-4 ชั้นก่อนถึงเนื้อหาจริง
- **หน้า:** /profile/[userId] · /u/[handle] · /@handle
- **หลักฐาน:** public-profile-client.tsx:272-298 stacks ProfileSellerCard → ProfileTrustBlock → ProfileReviewsPreview back-to-back. Verified badge appears 3x: profile-hero.tsx:137-145 (next to name), profile-seller-card.tsx:71-76, profile-trust-block.tsx:142-149. Deals + response time appear 2x: profile-seller-card.tsx:61-70 vs profile-trust-block.tsx:151-174. Rating + review count appear 2x: profile-seller-card.tsx:54-60 vs profile-reviews-preview.tsx:65-71. lastSeen appears 2x: hero ActivityPill (profile-hero.tsx:154-159) vs trust block trustLastSeen (profile-trust-block.tsx:176-193). topReview quote (profile-seller-card.tsx:79-104) overlaps ReviewsPreview's featured reviews (same rating>=4 + has-comment criteria).
- **ทางแก้:** รวม ProfileSellerCard + ProfileTrustBlock เป็นแถบความน่าเชื่อถือแถบเดียว (คะแนน·ดีล·เวลาตอบ·ตราผู้ขาย·ที่อยู่·ขนส่ง) ตัด topReview ทิ้งให้ ReviewsPreview ทำหน้าที่รีวิวเด่นที่เดียว และให้ตราผู้ขายอยู่แค่ข้างชื่อในฮีโร่จุดเดียว — ตรงข้อเสนอ re-compose ใน audit เดิมและ VISION §5.5 (ตราระดับผู้ขาย 1 อัน + แผ่นสถิติ)

### 🟡 identity.2 [NEW] แท็บโปรไฟล์เขียนหน้าว่างเองทุกแท็บ ไม่ใช้ EmptyState (หมี Kuma) ที่เป็นตัวกลาง ✅
- **หน้า:** /profile/[userId] · /u/[handle] (แท็บ listings/collection/reviews + โปรไฟล์ว่าง)
- **หลักฐาน:** shared/empty-state.tsx:48-59 declares itself "Single source of truth for no data" with Kuma presets, yet: listings-tab.tsx:63-84, collection-tab.tsx:80-101, reviews-tab.tsx:69-80 each hand-roll the same icon-tile + text + CTA layout (rounded-2xl bg-muted/60 icon box), and empty-profile-panel.tsx:30-63 hand-rolls a dashed panel (EmptyState has variant="dashed"). Secondary inline empties (collection-tab.tsx:173-176, listings-tab.tsx:147-150) are bare <p> tags. VISION §1 reserves the bear mascot for empty/onboarding states — none of these use it.
- **ทางแก้:** แปลงหน้าว่างทั้ง 4 จุดให้ใช้ EmptyState ตัวกลาง (ส่ง icon/title/action ผ่าน prop, ใช้ variant dashed สำหรับ EmptyProfilePanel) จะได้หน้าตาหน้าว่างแบบเดียวกับ portfolio/watchlist และได้หมี Kuma ตามตัวตนแบรนด์ฟรีๆ
- **หมายเหตุ verify:** Verified against source: all cited line ranges match. Three profile tabs (listings-tab.tsx:63-84, collection-tab.tsx:80-101, reviews-tab.tsx:69-80) hand-roll the identical icon-tile+text+CTA empty layout, empty-profile-panel.tsx:30-63 hand-rolls a dashed panel, and inline empties are bare <p> tags — while shared/empty-state.tsx self-declares as single source of truth with Kuma presets and a dashed variant. grep shows zero EmptyState imports anywhere in src/components/profile/. Not a documented exception: AGENTS.md kit table lists EmptyState as canonical with no profile carve-out, and uxui-refactor-plan.md Phase 4 STATES-03/07 (empty-state consolidation) is still open — corroborating the debt, not excusing it. Not technically blocked (variant="plain" exists for inside-Surface use) and not already fixed (clean master, files touched in recent kit sweeps without migration). VISION.md line 29 confirms Kuma is reserved for exactly these empty states. Severity med is fair: 4 hand-rolled blocks + 3 bare inline empties on public-facing pages, kit-rule violation + missed brand mascot, but purely cosmetic/consistency with no functional impact.

### 🟡 identity.3 [IDENTITY-07] ปุ่ม "บันทึกผู้ขาย" 2-3 จุดบนจอเดียว ถือสถานะแยกกัน กดแล้วอีกจุดไม่เปลี่ยน
- **หน้า:** /profile/[userId] · /u/[handle] (มือถือ)
- **หลักฐาน:** save-seller-button.tsx:38 useState(initialSaved) per-instance. Rendered 3x per page: profile-hero.tsx:127-129 (desktop cluster, hidden sm:flex) + :205-207 (mobile row, sm:hidden) via actionsSlot, plus profile-mobile-cta-bar.tsx:37-44. On a phone the hero mobile row AND the sticky CTA bar are both visible — tapping save in the bar leaves the hero button showing stale state (and vice versa). Mobile also shows duplicate Message+Save controls twice on one screen.
- **ทางแก้:** ยกสถานะ saved ขึ้นไปที่ PublicProfileLayout แล้วส่งลงเป็น prop ให้ทุกปุ่มตรงกัน หรือทางที่ง่ายกว่า: ตัดปุ่มบันทึกออกจากแถบล่างให้เหลือปุ่มทักผู้ขายอย่างเดียว (แถวแอคชันในฮีโร่มีปุ่มบันทึกอยู่แล้ว) — ลดทั้งบั๊กและความซ้ำในจอเดียว

### 🟡 identity.4 [IDENTITY-05] หน้า /profile (ของตัวเอง) ยังเด้ง 2 จังหวะฝั่งเบราว์เซอร์พร้อมวงกลมหมุนเปล่า ขัดกฎศูนย์ spinner
- **หน้า:** /profile (me)
- **หลักฐาน:** profile/(me)/page.tsx:12-37 is a client component doing getUser → fetch /api/me → router.replace (2 round-trips before any content), and :39-43 renders a hand-rolled spinner (animate-spin rounded-full border-2). Same hand-rolled spinner duplicated in profile/(me)/layout.tsx:16-20. Violates VISION §4.6 zero-spinner rule and bypasses the kit's Skeleton/LoadingState. Redirect-param bug was fixed but the server-component conversion tracked in IDENTITY-05 was deferred and is still pending. Bonus edge: with auth bypass on and /api/me returning no user (page.tsx:17-21), nothing fires and the spinner spins forever.
- **ทางแก้:** เปลี่ยนเป็น server component: อ่าน session ฝั่งเซิร์ฟเวอร์แล้ว redirect(`/profile/${id}`) จบในจังหวะเดียว — ไม่ต้องมีวงกลมหมุนเลย และลบ spinner ที่ก๊อปกัน 2 ไฟล์ทิ้ง

### 🟡 identity.5 [NEW] ข้อความผิดพลาดหน้า auth เป็นภาษาอังกฤษล้วน ทั้งที่ป้ายกำกับรอบตัวเป็น 3 ภาษา ✅
- **หน้า:** /login · /register · /forgot-password · /reset-password
- **หลักฐาน:** Every label/button uses t(lang,...) but all error copy is hardcoded English: login-client.tsx:22-23 ("Invalid email", "Password is required"), :42 ("Sign in failed. Please try again."), :57 ("Demo account unavailable"); register-client.tsx:23-29 ("Password must be at least 8 characters", "Passwords do not match"); reset-password-client.tsx:21-27. Raw supabase error.message is also shown verbatim in English (login-client.tsx:80, register-client.tsx:61). All four page.tsx Suspense fallbacks show hardcoded "Loading…". Owner's copy standard is pure Thai.
- **ทางแก้:** เพิ่มกุญแจคำแปลสำหรับข้อความผิดพลาดใน zod schema และทำตัวแปลงข้อความผิดพลาดจาก supabase เป็นคำไทยที่คนอ่านรู้เรื่อง (เช่น "อีเมลหรือรหัสผ่านไม่ถูกต้อง") ส่วน fallback "Loading…" เปลี่ยนเป็นโครงโหลดหรือคำผ่าน t()
- **หมายเหตุ verify:** Every cited line verified verbatim at HEAD: zod messages, "Sign in failed...", "Demo account unavailable", raw supabase error.message passthrough (login:80, register:61, forgot:40, reset:55), and "Loading…" fallbacks in all four page.tsx:16. Labels around them all use t(lang,...) with TH/EN/JP keys present. Not a documented exception — the auth-kit refactor (uxui-refactor-plan.md:125, IDENTITY-01/10) explicitly preserved schema/supabase strings as-is, and IDENTITY-09 is a different issue (checklist vs validation). Not previously tracked or fixed. Finding is actually understated: i18n key passwordMismatch already exists in all 3 languages and is used in settings/section-security.tsx:207, so the identical error is translated in Settings but hardcoded English on /register and /reset-password. Severity med is honest — first-touch pages + pure-Thai copy standard, but no functional breakage and small effort.

### 🟡 identity.6 [NEW] หน้าโปรไฟล์เดียวกันมีโครงโหลด (skeleton) 2 ไฟล์ที่เขียนซ้ำและเพี้ยนจากกัน
- **หน้า:** /profile/[userId] vs /u/[handle] (/@handle)
- **หลักฐาน:** Both routes render the same PublicProfileClient, but each has its own near-duplicate loading.tsx that has drifted: u/[handle]/loading.tsx uses cover h-24 sm:h-32 md:h-40 + avatar size-20 sm:size-24 + card tiles aspect-[63/88] (:38, matches real CollectionCard), while profile/(public)/[userId]/loading.tsx uses cover h-32 sm:h-40 + avatar size-24 + aspect-[3/4] (:38, matches nothing on the page). Real avatar is size-24 sm:size-28 md:size-32 (profile-hero.tsx:100) so neither matches, and both show pill-shaped tab skeletons though real tabs are underline style. VISION §4.6: skeleton must mirror the real layout.
- **ทางแก้:** แตกโครงโหลดเป็น component เดียว (เช่น profile-loading-skeleton.tsx) ให้ทั้ง 2 เส้นทางเรียกใช้ แล้วปรับขนาดให้ตรงหน้าจริง (ปก/รูปคน/สัดส่วนการ์ด 63:88/แท็บขีดเส้นใต้) — แก้ที่เดียวไม่ drift อีก

### 🟡 identity.7 [IDENTITY-09] เกณฑ์รหัสผ่านโชว์ 3 ข้อ แต่ระบบบังคับจริงแค่ความยาว 8 ตัว
- **หน้า:** /register · /reset-password (+ settings security)
- **หลักฐาน:** register-client.tsx:24 and reset-password-client.tsx:21 zod schemas enforce only .min(8), but lib/auth/password-rules.ts:9-14 renders a 3-item checklist (length/uppercase/number) via PasswordRules. The lib file's own comment admits: "NOT wired into any zod schema... enforcing all three is IDENTITY-09, out of scope". Users see unchecked items yet submission succeeds.
- **ทางแก้:** เลือกทางเดียว: บังคับครบ 3 ข้อใน schema (แนะนำ — แก้ที่ getPasswordRules ให้ export ตัวตรวจตัวเดียวกันไปใช้ใน zod) หรือติดป้ายว่า 2 ข้อหลังเป็นแค่คำแนะนำ ให้สิ่งที่ผู้ใช้เห็นกับสิ่งที่ระบบบังคับเล่าเรื่องเดียวกัน

### ⚪ identity.8 [IDENTITY-12] แท็บคอลเลกชันเป็นทางตัน: บอก "แสดง 24 จาก 500" แต่ไม่มีทางดูต่อ ต่างจากแท็บพี่น้อง
- **หน้า:** /profile/[userId] · /u/[handle] (แท็บ collection)
- **หลักฐาน:** collection-tab.tsx:194-200 renders collectionShowingFirst as plain text with no action. Sibling tabs both offer a path: reviews-tab.tsx:237-246 has a load-more Button, listings-tab.tsx:123-133 has a "view all on marketplace" link in the header. Same page, three tabs, three different behaviors for "there is more".
- **ทางแก้:** เพิ่มปุ่ม "ดูเพิ่ม" แบบเดียวกับแท็บรีวิว (ยิง API แบ่งหน้า) หรืออย่างน้อยลิงก์ไปดูคอลเลกชันเต็ม ให้พฤติกรรม 3 แท็บสอดคล้องกัน

### ⚪ identity.9 [IDENTITY-14] หน้าโปรไฟล์ส่วนตัว (private) ใช้ความกว้าง/ระยะขอบคนละค่ากับหน้าโปรไฟล์ปกติ และจบแบบทางตัน
- **หน้า:** /profile/[userId] (โปรไฟล์ที่ตั้งค่าส่วนตัว)
- **หลักฐาน:** private-profile-view.tsx:25,33 uses max-w-7xl px-4 while the public view on the same route uses max-w-5xl px-5 (public-profile-client.tsx:240) — same URL, two different page widths. The view ends at :39 with no CTA, violating the empty-state rule (illustration + 1 line + 1 CTA, VISION §4.6).
- **ทางแก้:** ปรับกรอบให้ตรงหน้า public (max-w-5xl px-5) และเติมปุ่มเดียว เช่น "กลับหน้าแรก" หรือ "ดูตลาด" — หรือใช้ EmptyState กลางไปเลย

### ⚪ identity.10 [COMMERCE-13] แท็บรีวิวเขียนดาวเรตติ้งเอง 2 จุด ทั้งที่หน้าเดียวกันใช้ RatingStars ตัวกลางอยู่แล้ว
- **หน้า:** /profile/[userId] · /u/[handle] (แท็บ reviews)
- **หลักฐาน:** reviews-tab.tsx:128-139 (showcase header) and :208-220 (per-review row) hand-roll star loops with fill-amber-400 / Math.round logic that duplicates ui/rating-stars.tsx:26-38 exactly. The same page already uses the kit component in profile-reviews-preview.tsx:114 and profile-seller-card.tsx:96. COMMERCE-13 consolidated 6 hand-rolled star renderers into RatingStars but these two spots were missed.
- **ทางแก้:** แทนที่ 2 จุดด้วย RatingStars (ส่ง value/size ตรงๆ) — ลดโค้ดซ้ำ ~25 บรรทัดและกันสีดาวเพี้ยนในอนาคต

### ⚪ identity.11 [NEW] เศษความไม่สม่ำเสมอใน auth kit: ปุ่มตาช่องยืนยันรหัสไม่ตรงกัน 2 หน้า + กล่องสำเร็จก๊อปกัน 2 ไฟล์
- **หน้า:** /register · /reset-password · /forgot-password
- **หลักฐาน:** Register's confirm field shows the eye toggle (register-client.tsx:150 showToggle) while reset's confirm hides it (reset-password-client.tsx:104 showToggle={false}) — PasswordInput's own doc says "false for masked confirm fields" (password-input.tsx:43) so register contradicts the kit's stated convention. Also the success box markup is copy-pasted byte-identical between forgot-password-client.tsx:50-53 and reset-password-client.tsx:69-72 — a success twin of FormError that never got extracted.
- **ทางแก้:** เคาะทางเดียวว่าช่องยืนยันรหัสมีปุ่มตาหรือไม่ (แนะนำ: ไม่มี ตามที่ PasswordInput ระบุ) แล้วแตกกล่องสำเร็จเป็น FormSuccess ใน components/auth/ คู่กับ FormError

### ⚪ identity.12 [IDENTITY-04] โค้ดหน้าโปรไฟล์ 2 เส้นทางก๊อปกัน: generateMetadata + การส่ง prop 16 ตัวซ้ำ 2 ไฟล์
- **หน้า:** /profile/[userId] vs /u/[handle]
- **หลักฐาน:** profile/(public)/[userId]/page.tsx:20-38 and u/[handle]/page.tsx:27-47 duplicate the metadata-building logic (desc template, OG/twitter blocks) with drift already visible (name fallback "User" vs "@handle"). Both page bodies also repeat the identical 16-prop spread into PublicProfileClient (page.tsx:131-147 vs u/[handle]/page.tsx:82-97). The IDENTITY-04 fix landed only the FULL_WIDTH_ROUTES part; its proposal to fold the copied metadata/render into one helper was never done.
- **ทางแก้:** แตก helper กลาง เช่น buildProfileMetadata(user) + <PublicProfilePageBody serialized isOwner> ใน lib/profile ให้ 2 route บางลงเหลือแค่หา user — แก้ครั้งเดียวไม่ drift

### ⚪ identity.13 [IDENTITY-06] ป้ายลิงก์โซเชียลในฮีโร่แตะยากบนมือถือ (~30px ไม่มีตัวขยายพื้นที่แตะ)
- **หน้า:** /profile/[userId] · /u/[handle] (hero)
- **หลักฐาน:** social-link-chip.tsx:8-9 CHIP_CLASS uses px-2.5 py-1 text-micro (~28-30px tall) on interactive <a>/<button> elements with no tap-safe class and no min-height — below the 44px standard. Contrast: neighboring controls were fixed (handle copy button has tap-safe at profile-hero.tsx:260; Button atom now has min-h-11 on mobile at button-variants.ts:23). These chips are the residual per-page spot the plan earmarked under IDENTITY-06.
- **ทางแก้:** เติม class tap-safe ให้ CHIP_CLASS (มีระบบขยายพื้นที่แตะ 44px กลางอยู่แล้วใน globals.css:366-379) — แก้บรรทัดเดียวจบ

### ⚪ identity.14 [NEW] CollectionCard รับ prop hideQty/showLock แล้วทิ้งเงียบๆ — เจ้าของมองไม่เห็นว่าการ์ดใบไหนตั้งเป็นส่วนตัว
- **หน้า:** /profile/[userId] (แท็บ collection)
- **หลักฐาน:** collection-card.tsx:26-29 accepts hideQty/showLock "for back-compat... ignored at runtime", while collection-tab.tsx:183-184 still computes and passes showLock={isOwner && !!c.isPrivate}. The owner's cue for which cards are private was silently dropped, and the privacy flag hidePortfolioQty now flows into a no-op — dead wiring that misleads readers of the code.
- **ทางแก้:** ตัดสินใจทางเดียว: ถ้าเลิกโชว์ตัวล็อกจริง ให้ลบ prop และโค้ดคำนวณฝั่งผู้เรียกทิ้งทั้งเส้น หรือถ้าเจ้าของยังต้องรู้ว่าการ์ดไหนส่วนตัว ให้คืนสัญลักษณ์ล็อกมุมการ์ดเฉพาะ owner view

### ⚪ identity.15 [IDENTITY-11] profile-data-context ยังค้างอยู่ใน components/profile ทั้งที่คนใช้มีแต่หน้า settings
- **หน้า:** src/components/profile/ (โครงสร้างโค้ด)
- **หลักฐาน:** grep shows profile-data-context.tsx is imported only by 7 files under src/app/settings/** (settings-shell, account, privacy, notifications, marketplace, subscription, index) — zero imports from profile surfaces. The IDENTITY-11 move relocated 13 settings files to components/settings/ but left this one behind as "shared" when it is settings-only.
- **ทางแก้:** ย้ายไฟล์ไป components/settings/ ให้ครบตามเจตนา IDENTITY-11 (git mv + แก้ import 7 จุด) — โฟลเดอร์ profile จะเหลือแต่ของ public profile จริงๆ

<a id="content"></a>
## Guide + Blog + เนื้อหา

**ภาพรวม:** สุขภาพโดยรวมของกลุ่มหน้าเนื้อหาดีขึ้นมากหลังงาน guide-kit (CONTENT-01/02/07 แก้แล้ว — ทุกหน้า guide ใช้ PageHeader + component กลาง 4 ตัว, blog มี .prose แล้ว) แต่ยังเหลือปัญหาค้างชุดใหญ่: หน้า guide ยังสาดสีตกแต่ง 8+ เฉดขัดตัวตน espresso+honey และดึงการ์ดทั้งตาราง (~2,700 แถว) ทุกครั้งที่เปิดหน้าโดยไม่มี cache · ฝั่ง blog เป็นจุดที่หลุดความสม่ำเสมอที่สุดตอนนี้ — ป้ายหมวด/วันที่/ข้อความตรึงภาษาไทย-อังกฤษไม่ตามภาษาที่ผู้ใช้เลือก และหน้าบทความยังประกอบหัวหน้าเองไม่ผ่าน PageHeader · พบของใหม่ 4 เรื่อง: ข้อมูลสี rarity/สีการ์ดถูกประกาศซ้ำในหน้า guide จนสีแดงเพี้ยนไม่ตรงกับส่วนอื่นของแอป, โครงโหลดหน้า guide ไม่ตรงกับหน้าจริง, หน้า guide/sets เขียนกล่องว่างเองแทน EmptyState กลาง

### 🔴 content.1 [CONTENT-03] หน้า guide ดึงการ์ดทั้งตารางทุกครั้งที่เปิด และปิด cache ทั้ง 7 หน้า ทำให้หน้าคู่มือโหลดช้าโดยไม่จำเป็น
- **หน้า:** /guide/card-types, /guide/rarities, /guide/colors (+ทุกหน้า guide, /blog)
- **หลักฐาน:** src/app/guide/card-types/page.tsx:188-212 prisma.card.findMany with no `take` (loads every card with image, ~2,756 rows per request, keeps only 4/type) · src/app/guide/rarities/page.tsx:232-256 same pattern (all non-parallel cards, keeps 4/rarity) · src/app/guide/colors/page.tsx:135-151 all LEADER cards, keeps 6/color · every guide page declares `export const dynamic = "force-dynamic"` (getting-started:27, card-types:27, rarities:24, colors:15, sets:17, buying:15, guide/page.tsx:26) so nothing is ever cached; blog/page.tsx:13 and blog/[slug]/page.tsx:16 are force-dynamic too. Plan moved this to Phase 5 but it is still live.
- **ทางแก้:** จำกัดจำนวนแถวที่ดึงต่อกลุ่ม (query แยกต่อกลุ่มพร้อม limit หรือใช้ take) และเปลี่ยนหน้า guide เป็นหน้านิ่ง/ISR แล้วแปลภาษาฝั่งเครื่องผู้ใช้ตามแบบแผน i18n ที่วางไว้แล้ว (คงตัวหน้าเป็น server component เพื่อรักษา metadata แล้วย้ายข้อความลง client child แบบ home-seo-content)

### 🔴 content.2 [CONTENT-09] หน้า guide สาดสีตกแต่ง 8+ เฉดบนโครงหน้า ขัดตัวตน espresso-neutral + honey<5% จนดูเป็นแอปคนละตัว
- **หน้า:** /guide/getting-started, /guide/card-types, /guide/rarities, /guide/buying
- **หลักฐาน:** VISION §1 reserves green/red for P/L and says borders/secondary/icons = neutral. Live violations: getting-started:203-206 need-boxes use border-orange/amber/rose-500; :267-313 board diagram amber/rose/orange; :366-380 DON!! cards amber/rose icons; :428,:437 win-condition icons rose-500/blue-500 · card-types:59-123 five card-types get orange/blue/purple/amber/rose icon tints; :160-165 keyword chips add emerald+sky (8 hues on one page) · buying:124,:131 pros/cons icons text-emerald-500 / text-red-500 (red-500 here vs rose-500 elsewhere for the same decorative role) · guide-callout.tsx:15 the component's own comment says the blue/amber/rose/pink/red tones are "legacy — prefer semantic", yet pages still pass them: card-types:487 tone="amber", rarities:488,:599 tone="pink", sets:256 tone="blue", colors:388 tone="red".
- **ทางแก้:** คงสีเฉพาะจุดที่สีคือข้อมูลจริง (6 สีการ์ด, สีระดับความหายาก) แล้วเปลี่ยนสีตกแต่งทั้งหมดเป็นโทนกลาง (bg-muted + text-muted-foreground) กับ honey จุดเดียว · เปลี่ยน GuideCallout ทุกจุดให้ใช้โทนความหมาย info/warning ที่ component รองรับอยู่แล้ว แล้วลบโทนตกแต่ง 5 ตัวทิ้งจาก component

### 🟡 content.3 [NEW] หน้า blog ตรึงข้อความ/วันที่เป็นภาษาไทย-อังกฤษ ไม่ตามภาษาที่ผู้ใช้เลือก ต่างจากหน้า guide ที่แปลครบ 3 ภาษา ✅
- **หน้า:** /blog, /blog/[slug], /guide/sets
- **หลักฐาน:** blog/page.tsx:22-27 CATEGORY_LABELS hardcoded Thai ("วิเคราะห์ตลาด"…) rendered regardless of lang (line 98) · blog/[slug]/page.tsx:60-78 CATEGORY_CTA titles/descriptions hardcoded Thai; :146 hardcoded English "views"; :185 RelatedPages title="เพิ่มเติม" hardcoded · dates pinned to Thai locale everywhere: blog/page.tsx:111 and blog/[slug]/page.tsx:137 `toLocaleDateString("th-TH")`, guide/sets/page.tsx:344-347 same — while sibling guide pages translate everything via t(lang,…). Also architecture drift: blog list is force-dynamic yet reads language from the client store (blog-page-header.tsx:9, blog-empty-state.tsx:10 useUIStore) instead of getServerLanguage — the sanctioned pattern for dynamic pages — so the page body and header resolve language from two different sources.
- **ทางแก้:** ย้ายป้ายหมวด/หัวข้อ CTA/คำว่า views เข้าคลังคำแปล t() ให้ครบ 3 ภาษา · เลือกรูปแบบวันที่ตามภาษาที่ resolve ได้ (th-TH/en-US/ja-JP) แทนตรึง th-TH · เปลี่ยนหน้า blog (ซึ่ง dynamic อยู่แล้ว) ให้อ่านภาษาจาก getServerLanguage แหล่งเดียว ตัด client component ที่มีไว้แค่อ่านภาษาออก
- **หมายเหตุ verify:** All cited evidence verified line-by-line: blog/page.tsx:22-27 CATEGORY_LABELS hardcoded Thai rendered at :98, :111 th-TH date; blog/[slug]/page.tsx:60-78 CATEGORY_CTA Thai, :137 th-TH date, :146 English "views", :185 title="เพิ่มเติม"; blog-page-header.tsx:9 / blog-empty-state.tsx:10 read lang from client Zustand store on a force-dynamic page while lib/i18n/server.ts documents getServerLanguage as the pattern for exactly this case (guide/sets uses it correctly). No documented exception in AGENTS.md kit table or doc/uxui-refactor-plan.md (blog items there are CONTENT-01/04/05/07/12 = styling/TTFB/header, not i18n); not already fixed on master. Proposal is cheap — i18n.ts already ships getLocale() mapping TH/EN/JP → th-TH/en-US/ja-JP and blog keys exist in all 3 dictionaries. Finding even honestly self-discloses the guide/sets:344-347 th-TH date blemish. Minor understatement: hardcoded-Thai RelatedPages items also exist on /trending, so scope is slightly broader than claimed. Severity med is fair: visible language breakage for EN/JP users (incl. Buddhist-era dates) on a public page of a product that lists TH/EN/JP as core, but secondary surface, no functional breakage.

### 🟡 content.4 [CONTENT-07] หน้าบทความ blog ยังประกอบหัวหน้าเอง ไม่ผ่าน PageHeader — หัวหน้าเล็กกว่าพี่น้องทุกหน้าบนมือถือ
- **หน้า:** /blog/[slug]
- **หลักฐาน:** blog/[slug]/page.tsx:122-128 hand-rolls `<BackButton …/> <h1 className="text-h1 break-words leading-tight">` inside a raw <header>, while blog list (blog-page-header.tsx:12) and all 7 guide pages now use PageHeader (which provides the mobile iOS large-title). The guide half of CONTENT-07 was fixed in the guide-kit branch; the blog half was not.
- **ทางแก้:** เปลี่ยนหัวบทความไปใช้ PageHeader (รับ breadcrumb + title + meta ได้อยู่แล้ว) เหมือนหน้าพี่น้อง จะได้ทั้งหัวใหญ่บนมือถือและตำแหน่งปุ่มย้อนมาตรฐานเดียวกัน

### 🟡 content.5 [CONTENT-05] นับยอดเข้าชมบทความแบบเขียนฐานข้อมูลก่อนวาดหน้า — หน่วงหน้าทุกครั้งและเลขเฟ้อจากบอท
- **หน้า:** /blog/[slug]
- **หลักฐาน:** blog/[slug]/page.tsx:85-88 `await prisma.blogPost.update({ …viewCount: { increment: 1 } })` runs blocking before the JSX returns, on every request (force-dynamic), no bot filtering; :146 then renders `(post.viewCount + 1)`.
- **ทางแก้:** ย้ายการนับไปหลังตอบหน้าแล้วด้วย after() ของ next/server (ยิงแล้วไม่รอ) — ถ้าอยากให้เลขน่าเชื่อถือขึ้นค่อยกรอง user-agent ของบอทภายหลัง

### 🟡 content.6 [CONTENT-06] หน้า coming-soon ใช้ปุ่มซ้อนในลิงก์ (HTML ผิด, screen reader สับสน) และเป็นทางตันไม่มีช่องทางให้กดรับแจ้งเตือน
- **หน้า:** /coming-soon
- **หลักฐาน:** coming-soon/page.tsx:52-57 `<Link href="/" className="mt-8"><Button size="lg">…</Button></Link>` — anchor wrapping button (invalid interactive nesting), while the repo convention is `Button render={<Link/>}` (about-client.tsx:144, contact-client.tsx:129). Page still has only a back-home CTA; VISION §5.7 specifies coming-soon games should offer notify-me.
- **ทางแก้:** เปลี่ยนเป็น Button render={<Link href="/"/>} ตามแบบแผนเดียวกับหน้า about/contact และเพิ่มปุ่มรอง "แจ้งเตือนเมื่อเปิด" ให้ผู้ใช้ทิ้งความสนใจไว้ได้ ไม่จบที่ทางตัน

### 🟡 content.7 [CONTENT-11] หน้า guide/sets ยังทำตัวเป็นหน้าเลือกดูชุดซ้ำกับ /sets ทั้งหน้า — รายการยาวทับเนื้อหาสอน
- **หน้า:** /guide/sets
- **หลักฐาน:** guide/sets/page.tsx:303-363 renders EVERY CardSet from the DB grouped by type with no cap, even though :290-300 already links to /opcg/sets ("ดูทุกชุด"). On mobile the educational content (pack structure, card code format) is followed by an unbounded list duplicating the browse page.
- **ทางแก้:** จำกัดรายการต่อกลุ่มเหลือ 4-5 ชุดล่าสุด + ปุ่ม "ดูทั้งหมด N ชุด" ลิงก์ไป /sets — ให้หน้า guide สอนแนวคิด ส่วนหน้า /sets เป็นที่เลือกดู

### 🟡 content.8 [NEW] ข้อมูลสีระดับความหายากและสีการ์ดถูกประกาศซ้ำในหน้า guide ไม่ดึงจากแหล่งกลาง — สีแดงเพี้ยนไม่ตรงกับส่วนอื่นของแอปแล้ว ✅
- **หน้า:** /guide/rarities, /guide/colors
- **หลักฐาน:** Canonical data exists: src/lib/constants/rarities.ts BASE_RARITIES/PARALLEL_RARITIES (codes+names+hex) and src/lib/constants/card-config.ts:16-21 CARD_COLORS (classes + trilingual labels). guide/rarities/page.tsx:47-133 re-declares all 10 rarity codes/names/hex by hand (values match today, will drift on next change) and :143-152 re-declares parallel tiers · guide/colors/page.tsx:36-81 re-declares 6 card colors with DIFFERENT values already: Red #DC2626 (red-600) vs canonical bg-red-500 (#EF4444), Black #374151 (gray-700) vs canonical bg-gray-800 — and within the same page line 303/316 the multicolor demo uses bg-red-500, so two different reds appear on one page.
- **ทางแก้:** ให้หน้า guide import จาก BASE_RARITIES/PARALLEL_RARITIES และ CARD_COLORS โดยตรง (ใช้ทั้งชื่อ ลำดับ และสี) ลบตารางที่พิมพ์ซ้ำทิ้ง — สีการ์ด/สี rarity จะตรงกันทั้งแอปโดยอัตโนมัติ
- **หมายเหตุ verify:** Verified against source. guide/rarities/page.tsx:47-133 and :143-152 hand-duplicate BASE_RARITIES/PARALLEL_RARITIES (values match today = drift risk; parallel list already omits P-P). guide/colors/page.tsx:36-81 hand-declares colors that ALREADY diverge from CARD_COLORS: Red #DC2626 vs bg-red-500, Black #374151 vs bg-gray-800, Yellow #EAB308 vs bg-yellow-400/500 — and lines 303/316 of the same page use bg-red-500, so two different reds render on one page. All hexes are live UI (inline style swatches/borders), not dead data. No documented exception: AGENTS.md guide-kit entry covers layout components only; uxui-refactor-plan CONTENT-09 (b9f53c2) reduced decorative hues but did not centralize this data; still unfixed on master. Minor nits: finding equates bg-red-500 with #EF4444 (Tailwind v3 hex; v4 OKLCH ≈ #FB2C36) — mismatch holds either way; proposal is slightly optimistic since guide parallel names are i18n'd and color cards carry extra copy not in the constants (import covers code/order/color only). Severity med is honest: visible inconsistency already shipped on two public pages, no functional breakage.

### 🟡 content.9 [CHROME-04] ความกว้างหน้าอ่านประกาศ 2 ที่และขัดกัน — max-w-3xl ในหน้าเป็นโค้ดตายที่หลอกคนแก้ทีหลัง
- **หน้า:** /guide/* (6 หน้าลูก), /blog/[slug]
- **หลักฐาน:** main-chrome.tsx:77-82 maps /blog/.+ and /guide/.+ to width "reading" = max-w-2xl (page-container.tsx:10, 672px), but every child page also wraps content in `mx-auto max-w-3xl` (getting-started:165, card-types:228, rarities:284, colors:179, sets:179, buying:66, blog/[slug]/page.tsx:121,184) — the inner 768px can never apply because the outer container caps at 672px.
- **ทางแก้:** เลือกความจริงหนึ่งเดียว: ลบ mx-auto max-w-3xl ในหน้าทั้ง 7 ทิ้ง แล้วถ้าต้องการหน้ากว้าง 768px ให้แก้ ROUTE_WIDTH เป็น narrow ที่ main-chrome ที่เดียว

### ⚪ content.10 [CONTENT-10] หัวข้อ/ตัวอักษรในหน้า guide ยังสลับระหว่าง token กลางกับขนาดพิมพ์เอง — บทบาทเดียวกันได้คนละขนาด
- **หน้า:** /guide/card-types, /guide/getting-started, /guide/rarities, /guide/sets
- **หลักฐาน:** card-types/page.tsx:274,:326 card-type names use `text-xl font-semibold` while the identical role in rarities/page.tsx:344,:392 uses `text-h4` · body copy flips between the token and hand-stack within one page: getting-started:370,:379 `text-body-sm leading-relaxed text-muted-foreground` vs :344,:361,:450 `text-sm leading-relaxed text-muted-foreground` for the same reading-copy role · monetary/mono text ignores `.text-code`: rarities:352,:398,:427 `font-mono font-semibold`, sets:278,:352 `font-mono text-sm/text-xs` (AGENTS.md typography table: use semantic tokens instead of stacking).
- **ทางแก้:** กวาดหน้า guide รอบเดียว: หัวชื่อใน tile ใช้ text-h4 ให้ตรงกันทุกหน้า, เนื้อความใช้ text-body-sm token เดียว, ตัวเลข/รหัส monospace ใช้ .text-code — จะเหลือคำตอบเดียวต่อบทบาท

### ⚪ content.11 [CONTENT-08] เศษงานหน้า buying ที่ยังไม่เข้าชุดพี่น้อง: ป้ายนำทางตรึงอังกฤษ กล่องใช้คนละผิว และ prefix ฟอนต์เกินจำเป็น
- **หน้า:** /guide/buying
- **หลักฐาน:** buying/page.tsx:192 GuidePrevNext prev label hardcoded "Sets" (not via t(), the plan itself flags this as a leftover nit); :78 breadcrumb label hardcoded "Buying Guide" · shop/tip cards use Surface variant="panel" (:93,:150) while every equivalent content card in the other 5 guide pages uses variant="outline" · :89,:95,:143,:153,:164 redundant `font-sans` prefix that no sibling page uses.
- **ทางแก้:** แปลป้าย "Sets"/"Buying Guide" ผ่าน t() · เปลี่ยนกล่องเป็น variant="outline" ให้ตรงพี่น้อง · ตัด font-sans ที่ไม่มีผลออก

### ⚪ content.12 [NEW] โครงโหลดของหน้า guide ไม่ตรงกับหน้าจริง — หน้าลูกแบบบทความกลับเห็นโครงตาราง 6 ช่องของหน้ารวม
- **หน้า:** /guide, /guide/* (6 หน้าลูก)
- **หลักฐาน:** src/app/guide/loading.tsx:7-20 renders a CENTERED hero panel + 6-tile grid; the real landing uses a left-aligned PageHeader (guide/page.tsx:158) with no centered panel, and all 6 child pages (which share this segment loading.tsx and are force-dynamic with DB queries) are single-column max-w-3xl articles — so navigating guide → child flashes a grid skeleton shaped like the index, the same pattern STATES-05 flagged for sets/marketplace/blog detail. Violates VISION §4.6 "skeleton รูปร่างตรงกับ layout จริง".
- **ทางแก้:** แก้ guide/loading.tsx ให้เป็นโครงหัวซ้าย+ตาราง (ตรงหน้ารวม) และเพิ่ม loading.tsx รูปคอลัมน์เดียว (หัวเรื่อง + ย่อหน้า) ให้หน้าลูก — หรือถ้าแก้ CONTENT-03 เป็นหน้านิ่งแล้ว โครงโหลดหน้าลูกจะแทบไม่โผล่เอง

### ⚪ content.13 [NEW] หน้า guide/sets เขียนกล่องว่างเองแทนที่จะใช้ EmptyState กลาง (หมี Kuma)
- **หน้า:** /guide/sets
- **หลักฐาน:** guide/sets/page.tsx:365-371 hand-rolls `<div className="rounded-xl border border-dashed py-12 text-center"><p…>{t(lang, "guideSetEmpty")}</p></div>` while the Component Kit canon (AGENTS.md) lists EmptyState (shared/empty-state.tsx) as the canonical empty surface — blog already complies via BlogEmptyState (blog-empty-state.tsx:12 uses EmptyState variant="dashed").
- **ทางแก้:** เปลี่ยนเป็น EmptyState variant="dashed" พร้อมไอคอน/ข้อความเดิม ให้หน้าว่างหน้าตาเดียวกันทั้งแอป

### ⚪ content.14 [CONTENT-12] การ์ดบทความใน blog สูงไม่เท่ากันเมื่อโพสต์ไม่มีรูปปก
- **หน้า:** /blog
- **หลักฐาน:** blog/page.tsx:84-94 the aspect-[16/9] image block renders only `{post.coverImage && …}` — posts without a cover lose the whole block, so grid cards get random heights when mixed.
- **ทางแก้:** ใส่กล่องรักษาสัดส่วน 16/9 เสมอ (พื้น bg-muted + โลโก้หมีจางๆ เป็นรูปสำรอง) ให้ตารางการ์ดนิ่งทุกกรณี

<a id="play"></a>
## Decks + เครื่องคิดเลข

**ภาพรวม:** พื้นที่ PLAY (ศูนย์รวมเครื่องมือ /decks + เครื่องคิดราคาเด็ค + เครื่องคิดโอกาสดรอป) สุขภาพครึ่งๆ กลางๆ: drop-calculator ถูกปรับเข้าระบบใหม่เกือบครบแล้ว (FilterModal / SegmentedControl / QtyStepper) เหลือเก็บตก แต่ deck-calculator ยังเป็นหน้าตกยุค — หัวข้อ/ตัวหนังสือ/ปุ่มสลับเด็ค/กล่องค้นหายังเขียนเองไม่ใช้ชุดกลาง ทำให้เครื่องคิดเลขสองหน้าพี่น้องกันดูเป็นคนละแอป ซึ่งตรงกับข้อร้องเรียนหลักของเจ้าของพอดี งานเก่าที่ track ไว้ (PLAY-03..12) ส่วนใหญ่ยังไม่ได้ทำ และรอบนี้เจอเพิ่มอีก 7 จุด เช่น แท็บมือถือเขียนเองทั้งที่มี SegmentedControl ในหน้าเดียวกัน แถวผลค้นหาไม่ใช้ SearchResultRow (ไม่มีรูป/ราคา) และตาราง kit ใน AGENTS.md เคลมว่า drop-calc ใช้ CardItem ทั้งที่โค้ดจริงไม่ได้ใช้

### 🔴 play.1 [PLAY-03] deck-calculator ยังเป็นหน้าตกยุค — ตัวหนังสือ/หัวข้อ/ปุ่มสลับเด็ค/ราคารวมไม่ใช้ชุดกลาง ทำให้ดูคนละแอปกับ drop-calculator พี่น้องกัน
- **หน้า:** /deck-calculator (เทียบ /drop-calculator)
- **หลักฐาน:** src/app/deck-calculator/deck-calculator-client.tsx:316,353 headings use `text-sm font-semibold` instead of .text-h5 token; :296,:309,:341-347,:367,:422,:442-444 `text-muted-foreground text-sm` stacks instead of .text-meta/.text-body-sm; :274-288 hand-rolled deck-switch pills (template-string active `border-primary bg-primary/10`) instead of SegmentedControl; :310 total value = PriceTag size="lg" (text-3xl per src/components/ui/price-tag.tsx:13) instead of HeroNumber/.text-display — while sibling drop-calc uses .text-display hero (src/components/drop-calculator/want-list.tsx:108); :229-232 PageHeader has no icon while drop-calc passes icon={Calculator} (drop-calculator-client.tsx:213); :465-535 DeckMockPreview duplicates the same legacy markup. VISION §3 lists deck cost as a HeroNumber use case explicitly.
- **ทางแก้:** ยกเครื่องหน้านี้เข้าชุดกลางให้เท่ากับ drop-calculator: หัวข้อ → .text-h5, ตัวหนังสือรอง → .text-meta, ราคารวม → HeroNumber (.text-display ตัวเดียวของหน้า), ปุ่มสลับเด็ค → SegmentedControl, ใส่ icon ใน PageHeader ให้เหมือนพี่น้อง และแก้ DeckMockPreview ที่ก๊อปโครงเก่าไว้พร้อมกัน — ถ้าจะทำเต็มให้จัดโครงใหม่ตาม VISION §5.4 (มือถือ: หัวเด็ค + ราคารวม hero + แถวการ์ด + ปุ่ม "เพิ่มการ์ด" ลอยล่างเปิดแผ่นค้นหาค้างไว้)

### 🟡 play.2 [PLAY-06] หน้า /decks บอกว่า "เด็คของฉัน เร็วๆ นี้" ทั้งที่ผู้ใช้สร้างเด็คได้แล้วจริงใน deck-calculator — คนใหม่งงว่าเด็คตัวเองหายไปไหน
- **หน้า:** /decks
- **หลักฐาน:** src/app/decks/page.tsx:101-106 `myDecks` section renders a dashed box with comingSoon copy, while /api/decks already stores user decks created via /deck-calculator (deck-calculator-client.tsx:109-120 createDeck posts to /api/decks). Half the hub (3 of 6 tiles, :32-34) is also disabled comingSoon, so the page has two separate coming-soon zones.
- **ทางแก้:** เลิกโกหกผู้ใช้: ถ้ามีเด็คจริงให้ดึงรายชื่อเด็คจาก /api/decks มาแสดงพร้อมลิงก์ไป deck-calculator ถ้ายังไม่มีให้ขึ้น EmptyState พร้อมปุ่ม "สร้างเด็คแรก" ชี้ไปที่เดียวกัน (คงช่องเครื่องมือที่ปิดไว้ 3 ช่องตาม VISION §5.4 ได้)

### 🟡 play.3 [NEW] แท็บมือถือ "เลือกการ์ด/ดูผลลัพธ์" ใน drop-calculator เขียนเอง ทั้งที่หน้าเดียวกันใช้ SegmentedControl อยู่แล้ว — สองหน้าตาปุ่มสลับในหน้าเดียว ✅
- **หน้า:** /drop-calculator
- **หลักฐาน:** src/app/drop-calculator/drop-calculator-client.tsx:256-286 hand-rolled tab buttons (active = `bg-background text-foreground`, h-10 = 40px < 44px tap rule) while PurchaseConfig in the same page uses the kit SegmentedControl (src/components/drop-calculator/purchase-config.tsx:47-56, active = bg-primary/15 text-primary, h-11). SegmentedControl already supports icon + badge slots (src/components/ui/segmented-control.tsx:13-15) so the count chip and icons need no custom code.
- **ทางแก้:** เปลี่ยนแท็บมือถือเป็น SegmentedControl fullWidth (icon = LayoutGrid/ListChecks, badge = จำนวนใบที่เลือก) ให้ปุ่มสลับทั้งหน้าใช้ภาษาเดียวกันและได้ที่กด ≥44px ฟรี
- **หมายเหตุ verify:** Confirmed. drop-calculator-client.tsx:256-286 hand-rolls the mobile tab switcher (raw buttons, h-10=40px, active bg-background text-foreground) with no SegmentedControl import, while purchase-config.tsx:47-56 in the same view uses the kit SegmentedControl (h-11=44px, active bg-primary/15 text-primary per segmented-control.tsx:239,276). Icon+badge slots exist in the kit (segmented-control.tsx:13-15, rendered 281-291), so the count chip needs no custom code. Not a documented exception: AGENTS.md kit table makes SegmentedControl canonical for one-of-N tab controls; KIT-10's only deferral is EditionToggle (whose tap-regression rationale doesn't apply — this migration improves tap 40→44px). Not a duplicate (PLAY-07..12 cover the page but not this control; PLAY-11 cites the tabs only for missing sticky summary) and not fixed on master or any feat/phase5-* branch. Severity med matches the repo's own calibration (PLAY-08 tap targets and PLAY-10 duplication both MED). Minor nit: semantically ui/tabs.tsx is an equally valid kit target since these switch content panes, but AGENTS.md groups it with SegmentedControl so the proposal's direction stands.

### 🟡 play.4 [NEW] กล่องค้นหาการ์ดใน deck-calculator ไม่ใช้ SearchResultRow — ผลค้นหาไม่มีรูป ไม่มีราคา ไม่มีปุ่มลูกศรเลื่อน ต่างจากช่องค้นหาทุกจุดในเว็บ ✅
- **หน้า:** /deck-calculator
- **หลักฐาน:** src/app/deck-calculator/deck-calculator-client.tsx:446-456 renders search results as plain text buttons (name + code only — no thumbnail, no price, no rarity) although the kit canon says SearchResultRow is the shared row body for every search surface (src/components/shared/search-result-row.tsx:23-30, shows thumb + name + set/rarity + price). useCardSearch is used (:75) but useSearchKeyboardNav is not — no arrow-key/Enter selection unlike hero/palette/inline search. Dialog also uses plain DialogContent (:427) instead of ResponsiveDialogContent (full-screen on mobile, cf. card-batch-picker-dialog.tsx:56). On a price-calculator page, users add cards without ever seeing the price in the picker.
- **ทางแก้:** เปลี่ยนแถวผลค้นหาไปใช้ SearchResultRow (ได้รูป+ราคา+ความหายากฟรี) + ต่อ useSearchKeyboardNav ให้เลื่อนด้วยลูกศรได้ และห่อด้วย ResponsiveDialogContent ให้เต็มจอบนมือถือเหมือนตัวเลือกการ์ดกลางของ portfolio/watchlist
- **หมายเหตุ verify:** CONFIRMED. All evidence verified against current code: deck-calculator-client.tsx:446-456 renders search results as bare name+code buttons (no thumb/price/rarity) even though useCardSearch (:75) already returns imageUrl and latestPriceJpy — the same file shows both for cards already added (:375-405). useSearchKeyboardNav absent (grep: only hero-search-bar/card-search/command-search use it); dialog is plain DialogContent sm:max-w-md (:427) while ResponsiveDialogContent exists and is used by card-batch-picker/filter-modal. No documented exception: AGENTS.md carve-outs cover CardItem tiles only, and doc/uxui-refactor-plan.md:180 (PLAY-03, unchecked) explicitly marks deck-calc as the last pre-redesign page awaiting kit migration — confirming debt, not intent. Not already fixed. Two nuances: (1) finding overstates canon slightly — AGENTS.md/component doc name hero/palette/inline as SearchResultRow surfaces, not literally "every search surface"; deck-calc predates the consolidation. (2) The ResponsiveDialogContent leg of the proposal conflicts with VISION §5.4 which kills modal-per-add entirely (persistent search rail / bottom-sheet) — that part is interim polish; SearchResultRow + keyboard-nav legs survive any container. Severity med is fair: real gap (price picker on a price calculator hides prices) but flow works and page is queued for full recompose (PLAY spine).

### 🟡 play.5 [PLAY-08] ที่กดเล็กกว่า 44px ยังเหลือหลายจุด: ปุ่มลบใน want list (~26px), ชิปตัวกรองใน FilterModal ของ drop-calc, ปุ่มสลับเด็ค (~34px)
- **หน้า:** /drop-calculator, /deck-calculator (มือถือ)
- **หลักฐาน:** PARTIALLY FIXED since the 2026-07-04 audit: stepper now ≥44px (qty-stepper.tsx:7 size-11) and trash button uses icon-sm = size-11 (button-variants.ts:27). Still remaining: src/components/drop-calculator/want-list.tsx:94 remove X = p-1.5 + size-3.5 icon ≈ 26px; src/components/drop-calculator/card-picker.tsx:114,141 facet chips have `py-1 text-xs` with no `min-h-11 md:min-h-0` (the search page's identical chips DO have it — src/app/search/search-client.tsx rarity chips "min-h-11 ... md:min-h-0"); src/app/deck-calculator/deck-calculator-client.tsx:279 deck pills py-1.5 ≈ 34px.
- **ทางแก้:** เก็บตกสามจุดที่เหลือ: ใส่ min-h-11 md:min-h-0 ให้ชิปตัวกรองแบบเดียวกับหน้า /search, ขยายปุ่มลบใน want list เป็น ≥44px บนมือถือ (หรือใช้ IconButton จากชุดกลาง), และถ้าเปลี่ยนปุ่มสลับเด็คเป็น SegmentedControl ตามข้ออื่นก็ได้ 44px อัตโนมัติ

### 🟡 play.6 [PLAY-09] สีเขียวกำไร/แดงขาดทุนถูกยืมมาใช้กับ % โอกาสดรอป — ขัดกฎ VISION ที่สงวนเขียว/แดงไว้แค่กำไร/ขาดทุน
- **หน้า:** /drop-calculator
- **หลักฐาน:** src/components/drop-calculator/want-list.tsx:90,108,117 — `chance >= 0.5 ? "text-price-up" : chance >= 0.1 ? "text-chance-mid" : "text-destructive"` (text + hero number + progress bar all reuse profit-green and destructive-red). The chance token set is half-built: globals.css:165 defines only --chance-mid, no --chance-high/--chance-low. VISION §1: green/red reserved for gain/loss only.
- **ทางแก้:** เพิ่ม token --chance-high / --chance-low ใน globals.css (โทนแยกจากเขียวกำไร/แดงขาดทุน) แล้วให้ want list อ้าง token ชุด chance ล้วนทั้งสามจุด

### 🟡 play.7 [PLAY-10] โครงหน้าจอ drop-calculator ก๊อปซ้ำสองชุด (มือถือ/จอใหญ่) และทั้งสองชุดถูกวาดลงหน้าเว็บพร้อมกันเสมอ
- **หน้า:** /drop-calculator
- **หลักฐาน:** src/app/drop-calculator/drop-calculator-client.tsx:289-334 (mobile tabs branch) vs :338-381 (desktop 2-col branch) — CardPicker (10 props) + PurchaseConfig + WantList duplicated wholesale. Both branches are merely CSS-hidden (`lg:hidden` / `hidden lg:grid`) so BOTH mount: the full card grid (potentially 100+ images), two FilterModal instances (each CardPicker owns its own showFilters state, card-picker.tsx:43), and two WantLists exist in the DOM on every device.
- **ทางแก้:** แยกเป็นสองชิ้นย่อย (PickerPane / ResultsPane) แล้วให้มือถือกับจอใหญ่เรียกชิ้นเดียวกัน — แก้ครั้งเดียวไม่ต้องตามสองที่ และลดการวาดกริดการ์ดซ้ำสองรอบ

### 🟡 play.8 [NEW] เพิ่มการ์ดในเด็คแล้วเงียบสนิท — ไม่มีคำยืนยันใน dialog, เพิ่มใบที่ครบ 4 แล้วก็ไม่บอก, ผลค้นหาไม่โชว์ว่าใบไหนอยู่ในเด็คแล้ว
- **หน้า:** /deck-calculator (หนักสุดบนมือถือ)
- **หลักฐาน:** src/app/deck-calculator/deck-calculator-client.tsx:122-144 addCard succeeds silently — the dialog stays open (by design, PLAY-01) but shows no confirmation while covering the deck list on mobile; :132 `Math.min(MAX_COPIES, existingQty + 1)` silently no-ops when a card is already at 4 copies; :446-456 result rows carry no "already in deck ×N" indicator. The kit has SavedPill (shared/saved-pill.tsx) exactly for this success/error feedback role.
- **ทางแก้:** โชว์ผลตอบรับในแถวผลค้นหา: ใบที่อยู่ในเด็คแล้วให้ขึ้นจำนวน ×N ค้างไว้ (แตะแล้วเลขเด้งเพิ่ม = เห็นผลทันที) และถ้าครบ 4 ใบให้ขึ้นป้าย "ครบ 4 ใบแล้ว" แทนการเงียบ

### 🟡 play.9 [NEW] ตารางชุดกลางใน AGENTS.md เคลมว่า drop-calc ใช้ CardItem แต่โค้ดจริงสร้างการ์ดกริดเองทั้งใบ — เอกสารกับของจริงขัดกัน
- **หน้า:** /drop-calculator + AGENTS.md
- **หลักฐาน:** AGENTS.md kit table row "การ์ด grid tile (canonical)": `CardItem` — "การ์ดในมุมมอง grid ทุกหน้า (หน้าแรก · ค้นหา · watchlist · drop-calc · ตาราง)" explicitly names drop-calc. But src/components/drop-calculator/card-picker.tsx:153-190 builds its own tile (image + rarity badge + price + selection ring) and card-item.tsx has no selected/selectable prop at all (grep for selected|selectable|onSelect returns nothing) — so the canonical claim is impossible today. Whoever next builds a selectable grid will trust the table and hit the same wall.
- **ทางแก้:** เลือกทางเดียวแล้วทำให้ตรง: (ก) เพิ่มโหมดเลือก (selected + วงแหวน) ให้ CardItem แล้วย้าย CardPicker มาใช้ หรือ (ข) แก้ตารางชุดกลางให้ตรงความจริง — ระบุ CardPicker tile เป็นข้อยกเว้นแบบเดียวกับ SetCardTile/TopCardTile พร้อมเหตุผล

### ⚪ play.10 [PLAY-12] โครงตอนโหลด (skeleton) ไม่ตรงกับหน้าจริงทั้งสองเครื่องคิดเลข — โหลดเสร็จแล้วหน้ากระโดดเปลี่ยนโครง
- **หน้า:** /deck-calculator, /drop-calculator
- **หลักฐาน:** src/app/deck-calculator/loading.tsx:12-31 draws a 2-column grid (deck list + summary) but the real page is single-column (deck-calculator-client.tsx:228 space-y-6, no grid); the same page then shows two MORE different skeletons (:48-53 authed-null, :211-225 loading) — three shapes for one page. src/app/drop-calculator/loading.tsx:7-11 breadcrumb skeleton shows on mobile where the breadcrumb is hidden, and :13-20 draws a 2-col grid while the page actually opens on the set-picker empty panel. Violates VISION §4 rule 6 (skeleton must match real layout).
- **ทางแก้:** วาด skeleton ตามสภาพแรกจริงของแต่ละหน้า (deck = หัว + แถวช่องกรอก + รายการคอลัมน์เดียว · drop = หัว + กล่องเลือกชุด) ซ่อน breadcrumb ผีบนมือถือ และยุบ skeleton สามชุดของ deck-calculator ให้เหลือชุดเดียวที่ใช้ร่วมกัน

### ⚪ play.11 [PLAY-11] บนมือถือ เลือกการ์ดใน drop-calculator แล้วไม่เห็น % สด — ต้องรู้เองว่าให้สลับไปแท็บผลลัพธ์
- **หน้า:** /drop-calculator (มือถือ)
- **หลักฐาน:** src/app/drop-calculator/drop-calculator-client.tsx:255-286 the results tab only carries a count badge (:280-284); while on the "เลือกการ์ด" tab there is no live summary or sticky CTA, so first-time users can finish picking and never discover the result pane.
- **ทางแก้:** เพิ่มแถบลอยล่างตอนอยู่แท็บเลือกการ์ดและมีของใน want list ("N ใบ · โอกาส X% → ดูผลลัพธ์") กดแล้วสลับแท็บ — ตรงกับตำแหน่งปุ่มหลักลอยล่างที่ VISION §2 กำหนด

### ⚪ play.12 [PLAY-05] หน้า /decks เขียนหัวหน้าเองไม่ผ่าน PageHeader — มือถือไม่ได้หัวใหญ่ 34px แบบหน้าอื่น และป้ายเกมโชว์ slug ดิบ
- **หน้า:** /decks
- **หลักฐาน:** PARTIALLY FIXED: metadata now exists via src/app/decks/layout.tsx:3-8 (title + canonical). Still remaining: src/app/decks/page.tsx:84 hand-rolled `<h1 className="text-h1">` instead of PageHeader (which gives mobile .text-large-title 34px, page-header.tsx:52-56); :85-87 hand-rolled game pill renders raw `{currentGame}` slug ("opcg" uppercased by CSS) instead of getGameConfig shortName / the GameBadge pattern.
- **ทางแก้:** เปลี่ยนหัวหน้าไปใช้ PageHeader (ได้หัวใหญ่บนมือถือเหมือนหน้าอื่นทันที โดยส่งป้ายเกมเข้า badge slot) และให้ป้ายเกมอ่านชื่อย่อจาก getGameConfig แทน slug ดิบ

### ⚪ play.13 [PLAY-04] สลับเด็คทีไร ยิงโหลดรายชื่อเด็คใหม่ทั้งชุดทุกครั้งโดยไม่จำเป็น
- **หน้า:** /deck-calculator
- **หลักฐาน:** src/app/deck-calculator/deck-calculator-client.tsx:102 loadDecks useCallback deps = [activeDeck, lang] + :104-107 useEffect([loadDecks]) — every setActiveDeck changes the callback identity and re-runs the effect, re-fetching /api/decks although deck state is already synced locally via setDecks map (:136,:157,:170).
- **ทางแก้:** โหลดรายชื่อเด็คครั้งเดียวตอนเปิดหน้า (แยกตรรกะ "เลือกเด็คแรก" ออกด้วย functional set) แล้วตัด activeDeck ออกจาก deps

### ⚪ play.14 [NEW] กล่องหน้าว่างเขียนเอง 4 จุดใน area นี้ ทั้งที่มี EmptyState กลาง (หมี Kuma) รองรับครบแล้ว
- **หน้า:** /drop-calculator, /deck-calculator, /decks
- **หลักฐาน:** src/app/drop-calculator/drop-calculator-client.tsx:227-243 hand-rolled Surface + icon circle + copy + CTA; src/components/drop-calculator/card-picker.tsx:193 bare `<p>` for no-results; src/app/deck-calculator/deck-calculator-client.tsx:421-424 dashed box for no decks; src/app/decks/page.tsx:103-105 dashed box. The kit EmptyState supports icon/title/description/action + variants panel/dashed (src/components/shared/empty-state.tsx:7-45) and /search already uses it (search-client.tsx:17).
- **ทางแก้:** แทนทั้งสี่จุดด้วย EmptyState จากชุดกลาง (เลือก variant panel/dashed ตามบริบท ใส่ปุ่มชวนทำต่อใน action slot) — หน้าว่างทั้งเว็บจะพูดภาษาเดียวกันและได้หมี Kuma ตามตัวตนแบรนด์

### ⚪ play.15 [NEW] ชิปตัวกรองความหายากใน FilterModal ของ drop-calc หน้าตาไม่ตรงกับหน้า /search และในโมดัลเดียวกันมีชิปสองสไตล์
- **หน้า:** /drop-calculator (เทียบ /search)
- **หลักฐาน:** src/components/drop-calculator/card-picker.tsx:114-118 rarity chips active = solid `bg-primary text-primary-foreground` while the same rarity facet on /search uses per-rarity color fill (search-client.tsx rarity chips: `style={{backgroundColor: RARITY_HEX[r.code]}}` + text-white) — same facet, two different active looks. Within drop-calc's own modal, variant chips (:140-144) use a third style `border-primary/40 bg-primary/5 text-primary`. Drop-calc chips also lack aria-pressed which the /search chips have.
- **ทางแก้:** ให้ชิปความหายากใน drop-calc ใช้สูตรเดียวกับหน้า /search (สีตามระดับความหายากตอนเลือก + aria-pressed) — หรือถ้าจะให้ถาวร ให้ถอดแถวชิป facet ออกมาเป็นชิ้นกลางใช้ร่วมกันทุก FilterModal

### ⚪ play.16 [NEW] ลบเด็ค/ลบการ์ด/แก้จำนวนพลาด แต่ข้อความบอกว่า "เพิ่มไม่สำเร็จ" — ก๊อปข้อความผิดความหมาย
- **หน้า:** /deck-calculator
- **หลักฐาน:** src/app/deck-calculator/deck-calculator-client.tsx:159 (setCardQuantity), :172 (removeCard), :182 (deleteDeck) all fall back to `t(lang, "addFailed")` = "เพิ่มไม่สำเร็จ" (src/lib/i18n/th.ts:500). A failed deck deletion tells the user an ADD failed.
- **ทางแก้:** แยกข้อความผิดพลาดตามการกระทำ (เพิ่มไม่สำเร็จ / ลบไม่สำเร็จ / แก้จำนวนไม่สำเร็จ) — เพิ่มกุญแจ i18n ที่ขาดสองตัวแล้วชี้ให้ถูกจุด

<a id="commerce"></a>
## Marketplace (ปิด flag)

**ภาพรวม:** โซน commerce (ปิด flag อยู่) ยังเป็นโซนที่ค้าง pattern เก่าก่อน redesign มากที่สุด — ของซ้ำคู่ buyer/seller ยังอยู่ครบตามที่ audit เดิมพบ (หน้าลงขาย 2 ไฟล์, หน้ารายละเอียดออเดอร์ 2 ไฟล์, ค่าคงที่วิธีส่ง/สภาพการ์ด/สถานะประกาศซ้ำ 3-6 จุดค่าไม่ตรงกัน) และการกระทำเรื่องเงิน (ซื้อเลย, รับข้อเสนอ, ยกเลิกออเดอร์) ยังทำงานด้วยแตะครั้งเดียวไม่มีหน้ายืนยัน ขัด VISION §5.5 ตรงๆ นอกจากนี้ยังพบของใหม่ที่ kit กลางมีแล้วแต่โซนนี้เขียนเอง (Pagination, PriceTag, ConditionBadge, SavedPill) ทำให้หน้าตาไม่เข้าชุดกับส่วนอื่นของเว็บ ข่าวดีคือ browse marketplace ใช้ FilterModal/FilterToolbar/EmptyState ตามระบบใหม่แล้ว, COMMERCE-03 (แชทมือถือ) และ COMMERCE-13 (ดาว RatingStars) ที่แก้ไปแล้วยังคงสภาพดี และ spinner ส่วนใหญ่ถูกแทนด้วย skeleton แล้ว — งานกลุ่มนี้ควรเก็บให้จบก่อนเปิด flag ตามแผน Phase 7

### 🔴 commerce.1 [COMMERCE-01] ซื้อเลย/รับข้อเสนอ สร้างออเดอร์จริงด้วยแตะครั้งเดียว ไม่มีหน้าสรุปยืนยัน
- **หน้า:** /marketplace/[listingId], /messages/[listingId]
- **หลักฐาน:** src/app/marketplace/[listingId]/listing-actions.tsx:29-39 handleBuyNow → apiPost("/api/orders") directly on click, no confirm sheet (error toast WAS added since the last audit — partial fix). Same in chat: src/components/messages/chat-layout.tsx:307-317 handleBuyNow, and accepting an offer is also one tap: src/components/messages/offer-card.tsx:90-99 onAccept fires PATCH immediately. VISION.md §5.5 line 141 explicitly requires a confirm sheet ("ไม่ใช่ tap เดียว") with line item + total before creating a real Order.
- **ทางแก้:** ทำแผ่นยืนยันก่อนสร้างออเดอร์ตัวเดียวใช้ร่วม 3 จุด (ซื้อเลยหน้าประกาศ, ซื้อเลยในแชท, รับข้อเสนอ): สรุปการ์ด+ราคา+ผู้ขาย+ยอดรวม แล้วปุ่มยืนยันทองปุ่มเดียว ตาม VISION §5.5

### 🔴 commerce.2 [NEW] ยกเลิกออเดอร์/แจ้งชำระเงิน แตะเดียวทำทันที ไม่มีถามยืนยัน — ขัดกับปุ่มลบประกาศที่มี confirm
- **หน้า:** /orders, /orders/[id], /seller/orders, /seller/orders/[id], /messages/[listingId]
- **หลักฐาน:** Cancel order = irreversible, fired directly with no confirm: src/app/orders/page.tsx:299-307 (cancel button in list row), src/app/orders/[id]/page.tsx:404-410, src/app/seller/orders/page.tsx:238-246, src/app/seller/orders/[id]/page.tsx:431-440. "แจ้งชำระแล้ว" (PAID) is also one tap: orders/[id]/page.tsx:394-403 and messages/order-sidebar.tsx:153-163. Inconsistent with the same area: deleting a listing DOES use useConfirm (src/app/seller/listings/page.tsx:180-188).
- **ทางแก้:** ใช้ useConfirm (ตัวเดียวกับลบประกาศ) ครอบทุกปุ่มที่เปลี่ยนสถานะออเดอร์แบบย้อนกลับไม่ได้ อย่างน้อย ยกเลิกออเดอร์ กับ แจ้งชำระเงิน ทั้งฝั่งผู้ซื้อและผู้ขาย

### 🔴 commerce.3 [COMMERCE-02] หน้าลงขายมี 2 ไฟล์ซ้ำกัน ~95% (marketplace/create กับ seller/listings/new)
- **หน้า:** /marketplace/create, /seller/listings/new
- **หลักฐาน:** src/app/marketplace/create/create-client.tsx (184 lines) vs src/app/seller/listings/new/page.tsx (177 lines): identical state block (:29-48 both), identical handleSubmit (:61 vs :60 — same /api/cards lookup + /api/listings POST), identical wizard JSX. Differences are only translation-key prefixes (mktCreate* vs sellNew*), cancel href, and a max-w-lg wrapper. Still exactly as reported 2026-07-04; both files continue to require paired edits.
- **ทางแก้:** รวมเป็น component เดียว เช่น CreateListingFlow ที่รับ cancelHref/หัวข้อเป็น prop ไว้ใน components/marketplace/create-wizard แล้วให้ 2 route เรียกใช้ + ยุบชุดคำแปลซ้ำเหลือชุดเดียว

### 🔴 commerce.4 [COMMERCE-04] หน้ารายละเอียดออเดอร์ผู้ซื้อ/ผู้ขายซ้ำทั้ง type, fetch, timeline — และเริ่ม drift แล้ว
- **หน้า:** /orders/[id], /seller/orders/[id]
- **หลักฐาน:** type OrderDetail duplicated field-for-field: src/app/orders/[id]/page.tsx:30-60 vs src/app/seller/orders/[id]/page.tsx:37-67. getTimelineSteps duplicated (:62-70 vs :78-85). Timeline JSX ~70 lines copy-pasted (:245-319 vs :276-350). Drift already happened: buyer connector uses bg-hair (:274) while seller still uses bg-border (:305). VISION §3 defines CustodyTimeline as a single atom for exactly this block.
- **ทางแก้:** แยก OrderTimeline + OrderDetail view เป็น component กลางใน components/orders รับ prop role=buyer|seller ให้ 2 หน้าเหลือเฉพาะ action panel ที่ต่างกัน (เป็นฐานของ CustodyTimeline ตาม VISION ด้วย)

### 🔴 commerce.5 [COMMERCE-05] ตัวเลือกวิธีส่งประกาศ 3 ที่ 3 ชุดค่าไม่ทับกันเลย — แก้ไขประกาศแล้วค่าเดิมหาย ข้อมูลใน DB ปนหลายรูปแบบ
- **หน้า:** /marketplace/create, /seller/listings/[id], /seller/orders/[id]
- **หลักฐาน:** Three disjoint SHIPPING_OPTIONS sets: create-wizard/step-shipping.tsx:14-20 ("EMS/Kerry", "Pickup (นัดรับ)"...), seller/listings/[id]/page.tsx:56-61 ("ส่งทั่วไทย (Kerry/Flash)", "EMS / ไปรษณีย์ลงทะเบียน"... — zero overlap, so the edit page's checkboxes never match values saved by the wizard and old values can't be unchecked), seller/orders/[id]/page.tsx:69-76 (third set, partly t()-translated so the value written to Order.shippingMethod changes with UI language). Condition labels also declared 3 ways: step-pricing.tsx:11-19 (i18n keys), seller/listings/[id]/page.tsx:48-54 + seller/listings/page.tsx:91-97 (hardcoded English), marketplace-browse/types.ts:39 (raw codes).
- **ทางแก้:** สร้าง src/lib/marketplace/constants.ts เดียว: เก็บค่าเป็น key คงที่ (เช่น kerry, ems, pickup) แสดงผลผ่านคำแปล แล้ว import ทุกจุด — ต้องทำก่อนเปิด flag ไม่งั้นข้อมูลปนแล้วต้อง migrate

### 🟡 commerce.6 [COMMERCE-06] mapping สถานะออเดอร์/ประกาศขาย ประกาศซ้ำ ≥6 จุด — ป้ายและสีสถานะเดียวกันไม่เหมือนกันข้ามหน้า
- **หน้า:** /orders, /seller, /seller/orders, /messages, /seller/listings
- **หลักฐาน:** Order status configs: components/orders/order-status-badge.tsx:7-39 (.status-* classes), app/seller/page.tsx:59-77 (own STATUS_LABEL_KEY + STATUS_COLOR using bg-*-soft text-* — note .status-info uses --info-text while dashboard uses text-info, subtly different pair), components/messages/order-status-tracker.tsx:16-35 (msgOrderStatus* keys), components/messages/conversation-item.tsx:16-24 (msgConvStatus* keys — a 4th translation-key family for the same statuses), plus getTimelineSteps ×2 (buyOrderStep*/sellOrderStep*). Label drift is user-visible: buyer tab uses "orderStatusPaid/Shipped" (app/orders/page.tsx:36-37) but seller tab uses "...PaidExt/ShippedExt" (app/seller/orders/page.tsx:29-30). Listing status also split: seller/listings/page.tsx:83-89 colored soft pills vs chat-panel.tsx:35-41 plain outline Badge.
- **ทางแก้:** สร้าง config เดียวใน src/lib/orders (labelKey + status-token class ต่อสถานะ) ให้ badge/tracker/timeline/dashboard/conversation อ่านที่เดียว และยุบชุดคำแปลสถานะเหลือชุดเดียว ทำแบบเดียวกันกับสถานะประกาศขาย

### 🟡 commerce.7 [COMMERCE-07] มือถือ: ราคาและปุ่มซื้อ/ทักแชทอยู่ใต้ fold — ต้องเลื่อนผ่านรูปเต็มจอก่อน
- **หน้า:** /marketplace/[listingId]
- **หลักฐาน:** src/app/marketplace/[listingId]/page.tsx:213 grid lg:grid-cols-[420px_1fr] — on mobile single column the DOM order is: gallery (aspect 63/88 full-width ≈500px, :216-229) → "ดูประวัติราคา" link → identity block (:236-270) → price+CTA Surface only at :273. The answer the buyer came for (price, buy button) is below the first screen.
- **ทางแก้:** มือถือให้ราคา+ปุ่มหลักขึ้นทันทีใต้ชื่อการ์ด (สลับลำดับบล็อกด้วย order-* ไม่ต้องรื้อหน้า) หรือทำแถบปุ่มติดขอบล่างตาม ACTION grammar ใน VISION §2

### 🟡 commerce.8 [COMMERCE-08] จุดว่างของแชทยังเป็นข้อความลอยๆ ไม่มีทางไปต่อ ไม่ใช้ EmptyState กลาง
- **หน้า:** /messages
- **หลักฐาน:** src/components/messages/chat-panel.tsx:72-84 no-thread-selected state = bare <p> with only a back button, no CTA; src/components/messages/conversation-sidebar.tsx:98-103 empty conversation list = bare <p>, no CTA to /marketplace. The same area already uses the canonical EmptyState (Kuma) for error/loading states (chat-panel.tsx:134-152), so these two spots are the leftovers.
- **ทางแก้:** ใช้ EmptyState หมี Kuma + ปุ่ม "ไปดูตลาด" (/marketplace) ทั้งใน sidebar ว่างและ panel ยังไม่เลือกห้อง ให้เข้าชุดกับ state อื่นในหน้าเดียวกัน

### 🟡 commerce.9 [COMMERCE-09] ช่องพิมพ์แชทติดขอบล่างสุดของจอ ไม่มี pb-safe — home indicator บน iPhone ทับปุ่มส่ง
- **หน้า:** /messages/[listingId]
- **หลักฐาน:** src/components/messages/chat-input.tsx:53 input bar = p-3 only, no pb-safe, while the chat shell is h-dvh flush to the bottom (chat-layout.tsx:385) and /messages is chromeless (main-chrome.tsx:22) so nothing else pads the safe area. .pb-safe already exists in globals.css:419. (The filter-tab tap-target half of this finding is fixed — conversation-sidebar.tsx:73 now has min-h-11.)
- **ทางแก้:** เติม pb-safe ที่แถบพิมพ์ข้อความ (บรรทัดเดียวจบ) — ส่วน recompose แชทมือถือเต็มรูปตาม VISION §5.5 ค่อยทำตอน Phase 7

### 🟡 commerce.10 [COMMERCE-10] ทุกหน้าออเดอร์/ผู้ขายยัง fetch ฝั่ง client — ผู้ใช้เห็นโครงโหลด 2 ชั้นคนละหน้าตา
- **หน้า:** /orders, /orders/[id], /seller/**, /messages
- **หลักฐาน:** Spinners are gone (partial fix since audit) but the double-loading remains: route loading.tsx shows one skeleton shape (e.g. app/orders/loading.tsx:10-29 tab pills + rows) then the client component's useEffect fetch shows a second, different skeleton (app/orders/page.tsx:52-82 fetch + LoadingState skeleton-list :181-186; same pattern seller/orders/page.tsx:131, seller/listings/page.tsx:254, seller/page.tsx:110-112 PageSkeleton). Meanwhile /marketplace already fetches on the server (app/marketplace/page.tsx:98-178) so loading.tsx there works as intended — the area is split between two architectures.
- **ทางแก้:** ทยอยย้าย fetch แรกของ orders/seller ไปเป็น server component แบบเดียวกับ /marketplace ให้ loading.tsx ทำงานจริงชั้นเดียว (ระหว่างรอ ให้ปรับ skeleton ฝั่ง client ให้รูปร่างตรงกับ loading.tsx)

### 🟡 commerce.11 [COMMERCE-11] ตัวกรองสถานะ + จุดว่าง + วิธีแจ้ง error ของออเดอร์ buyer/seller คนละแบบโดยไม่มีเหตุผล
- **หน้า:** /orders, /seller/orders
- **หลักฐาน:** Filter: buyer mobile uses a Select dropdown (app/orders/page.tsx:141-168) + SegmentedControl on desktop (:171-178), seller uses SegmentedControl in overflow-x-auto at all sizes (app/seller/orders/page.tsx:108-128). Empty state: buyer EmptyState variant=dashed no mascot no CTA (:205-211) vs seller mascot="kuma" (:148-155). Mutation error: buyer renders an inline dismissible banner (:214-221) vs seller uses toast.error (:91). Same feature, two roles, three divergences.
- **ทางแก้:** เลือกแบบเดียวทั้งคู่: SegmentedControl เลื่อนแนวนอน (เห็น count ทุกแท็บ), EmptyState หมี Kuma + ปุ่ม "ไปดูตลาด"/"ดูประกาศ", และ error ใช้ toast แบบเดียวกัน

### 🟡 commerce.12 [COMMERCE-12] หน้าแก้ไขประกาศโหลดรายการทั้งร้าน (limit=100) มาหาใบเดียว — เกิน 100 ใบจะแก้ไขไม่ได้
- **หน้า:** /seller/listings/[id]
- **หลักฐาน:** src/app/seller/listings/[id]/page.tsx:88-95 apiGet("/api/seller/listings?limit=100") then .find(item => item.id === Number(listingId)) client-side. A listing older than the first 100 rows throws "Listing not found" and becomes uneditable; every open also over-fetches the whole shop.
- **ทางแก้:** เพิ่ม GET /api/listings/[id] ที่เช็คความเป็นเจ้าของ (หรือ query ?id= ที่ endpoint เดิม) แล้วดึงใบเดียวตรงๆ

### 🟡 commerce.13 [NEW] แบ่งหน้า (ก่อนหน้า/ถัดไป) เขียนเอง 5 จุดในโซนเดียว ทั้งที่มี Pagination กลางใน kit แล้ว
- **หน้า:** /marketplace, /orders, /seller/orders, /seller/listings, /seller/reviews
- **หลักฐาน:** AGENTS.md kit table lists ui/pagination.tsx as canonical (mobile buttons ≥44px, compact range) and it IS used by /search and home. But commerce hand-rolls prev/next in 5 places: marketplace-browse/index.tsx:339-363, app/orders/page.tsx:240-262, app/seller/orders/page.tsx:178-200, app/seller/listings/page.tsx:430-452, app/seller/reviews/page.tsx:251-273 — all with size="sm" buttons (h-8 ≈32px, below the 44px tap rule) and even two different i18n keys for the same summary ("pageOf" in browse :351 vs "paginationPageOf" elsewhere).
- **ทางแก้:** แทนทั้ง 5 จุดด้วย Pagination กลางจาก ui/pagination.tsx (ได้ปุ่มมือถือ ≥44px และช่วงเลขหน้าฟรี) แล้วลบโค้ดแบ่งหน้าเขียนเองทิ้ง

### 🟡 commerce.14 [NEW] สัญญาณ "ถูก/แพงกว่าตลาด" อันเดียวกันแสดงผล 4-5 แบบ และเอาสีเขียวกำไรมาทาเป็นพื้นป้าย
- **หน้า:** /marketplace, /marketplace/[listingId], /messages/[listingId], /marketplace/create
- **หลักฐาน:** Same price-vs-market signal rendered differently everywhere: listing-card.tsx:104-118 PriceTag changeOnly plain (no arrow); browse-list.tsx:40-42 solid Badge bg-price-up/90 text-white with hardcoded English "Best Deal" (app is TH/EN/JP); [listingId]/page.tsx:282-307 hand-colored font-mono ±% plus a bg-price-up/90 badge and a variant="destructive" badge; order-sidebar.tsx:113-123 Badge variant default/destructive/secondary; step-pricing.tsx:133-146 yet another variant mapping. Violations: VISION §4.3 requires ▲/▼ on every delta (most spots have none), and VISION §1 reserves green/red for profit/loss and forbids them on chrome — a solid green badge background with hardcoded text-white is chrome usage.
- **ทางแก้:** กำหนดวิธีแสดง "เทียบราคาตลาด" แบบเดียว: ใช้ PriceTag (ลูกศร+สี token) สำหรับตัวเลข และถ้าต้องมีป้าย "คุ้ม" ให้เป็นป้ายโทนกลาง/honey ไม่ใช่พื้นเขียวทึบ + ผ่านคำแปลทุกภาษา แล้วกวาดทั้ง 5 จุดให้ใช้ชุดเดียว

### 🟡 commerce.15 [NEW] ตัวเลขเงินในหน้าออเดอร์ไม่ใช้ตัวเลขความกว้างคงที่/PriceTag — ราคาแสดงคนละแบบข้ามหน้า
- **หน้า:** /orders/[id], /seller/orders/[id], /orders, /seller
- **หลักฐาน:** VISION §4.2 requires tabular mono numerals on all money. But: app/orders/[id]/page.tsx:210-217 uses text-lg font-bold ฿..toLocaleString() (no tabular-nums/font-price), app/seller/orders/[id]/page.tsx:234-241 text-xl font-bold, components/orders/order-card.tsx:101-107 formatThb in plain font-bold, while app/seller/page.tsx:266-268 correctly uses font-price and browse-list.tsx:53 uses tabular-nums. The kit table says PriceTag is canonical for money everywhere; the commerce order pages hand-roll it in 3 typographic styles.
- **ทางแก้:** ให้ราคาบนหน้าออเดอร์ทุกจุดใช้ PriceTag (หรืออย่างน้อย .font-price/tabular-nums) แบบเดียวกับหน้า market/portfolio — กวาดทีเดียวทั้ง order-card + order detail 2 หน้า

### 🟡 commerce.16 [NEW] ปุ่มลบรูปที่อัปโหลดมองไม่เห็นบนมือถือ (โผล่เฉพาะตอน hover) + จออัปโหลดรูปเขียนซ้ำ 2 แบบ
- **หน้า:** /marketplace/create, /seller/listings/new, /seller/listings/[id]
- **หลักฐาน:** Remove-photo buttons are opacity-0 group-hover:opacity-100 — invisible on touch devices where hover never fires: create-wizard/step-shipping.tsx:210-217 (p-0.5 ≈18px hit area) and seller/listings/[id]/page.tsx:370-376 (h-5 w-5 = 20px, also far below 44px). The two photo-upload UIs are separate hand-rolled implementations that have already diverged: the wizard validates 5MB file size (step-shipping.tsx:88) but the edit page's handlePhotoUpload (:127-154) has no size check, so a big file only fails at the server.
- **ทางแก้:** ทำ PhotoUploader กลางตัวเดียว (dropzone + thumbnail + ปุ่มลบที่มองเห็นตลอดและกดได้ ≥44px + เช็คขนาดไฟล์ที่เดียว) แล้วใช้ทั้ง wizard และหน้าแก้ไข

### 🟡 commerce.17 [NEW] ค้นหาในรายการขายของฉันยิง API ทุกตัวอักษรโดยไม่มี debounce และยิงซ้ำตอนกดค้นหา
- **หน้า:** /seller/listings
- **หลักฐาน:** app/seller/listings/page.tsx: fetchListings useCallback deps include searchQuery (:111-137) and useEffect re-runs on every fetchListings identity change (:139-143) → a network request per keystroke with no debounce. The submit handler (:150-154) then calls fetchListings() again manually (without an abort signal), duplicating the request. Inconsistent with marketplace browse which applies search only on submit (marketplace-browse/index.tsx:172-191).
- **ทางแก้:** เอา searchQuery ออกจาก deps ของ effect แล้วให้ค้นหาทำงานเฉพาะตอน submit แบบเดียวกับหน้า marketplace (หรือถ้าอยากได้ live-search ให้ debounce 250-300ms)

### ⚪ commerce.18 [COMMERCE-13] ดาวคะแนนผู้ขายยังเหลือแบบพิมพ์ตัวอักษร ★ เอง 2 จุด (ซาก COMMERCE-13)
- **หน้า:** /marketplace/[listingId], /marketplace (มุมมองรายการ)
- **หลักฐาน:** RatingStars kit is canonical and used in listing-card/review-section/seller-reviews, but two spots still print a raw star character: app/marketplace/[listingId]/page.tsx:350-352 `★ ${sellerRating.toFixed(1)}` in the seller panel, and marketplace-browse/browse-list.tsx:49 `★${rating.toFixed(1)}` in the list row.
- **ทางแก้:** แทนข้อความ ★ ทั้ง 2 จุดด้วย RatingStars (size sm) + ตัวเลข ให้เหมือนการ์ด grid

### ⚪ commerce.19 [NEW] บล็อกรีวิว (สรุปคะแนน + แถวรีวิว) เขียนซ้ำ 2 ชุด ฝั่งหน้าประกาศกับฝั่งผู้ขาย
- **หน้า:** /marketplace/[listingId], /seller/reviews
- **หลักฐาน:** components/marketplace/review-section.tsx:49-93 (text-display average + RatingStars + count + review rows of Avatar/name/stars/date/comment) vs app/seller/reviews/page.tsx:128-170 + 209-248 — same summary card and same row layout re-implemented, the seller one adding a distribution bar. Edits to review presentation must be made twice.
- **ทางแก้:** ยก ReviewSummary + ReviewRow เป็น component กลางใน components/marketplace (หรือ shared) ให้ 2 หน้าใช้ร่วม โดย distribution bar เป็น slot เสริมของฝั่งผู้ขาย

### ⚪ commerce.20 [NEW] ป้ายสภาพการ์ดแสดง 4 แบบ: ConditionBadge / Badge เปล่า / ข้อความดิบ / label อังกฤษ
- **หน้า:** /marketplace, /marketplace/[listingId], /marketplace/create, /seller/listings
- **หลักฐาน:** Kit has ConditionBadge (shared/condition-badge.tsx) and listing-card.tsx:89 uses it — but the same concept elsewhere: [listingId]/page.tsx:250 plain <Badge variant="outline">{condition}</Badge> (raw code), browse-list.tsx:45 plain text in a meta line, step-preview.tsx:90 plain Badge, seller/listings/page.tsx:338 local CONDITION_LABEL English strings.
- **ทางแก้:** ใช้ ConditionBadge ทุกจุดที่โชว์สภาพการ์ด (ที่เหลือให้เป็นข้อความผ่านคำแปลจาก constants กลางข้อ COMMERCE-05)

### ⚪ commerce.21 [RESPONSIVE-02] ปุ่มไอคอนล้วนในแชทไม่มี aria-label และไม่ใช้ IconButton กลาง
- **หน้า:** /messages/[listingId]
- **หลักฐาน:** components/messages/offer-card.tsx:109-116 reject button is a destructive icon-only X with no aria-label; components/messages/order-sidebar.tsx:230-234 profile link is a ghost icon-only Button (ExternalLink) with no aria-label. The kit's IconButton (ui/icon-button.tsx) exists specifically to force aria-label on icon-only buttons.
- **ทางแก้:** เปลี่ยน 2 จุดเป็น IconButton พร้อม aria-label ผ่านคำแปล (เก็บพร้อมงานกวาด aria-label 14 จุดใน Phase 5.0)

### ⚪ commerce.22 [NEW] ปุ่มย้อนกลับในโซน commerce ใช้คนละแบบ: Breadcrumb กลาง vs ปุ่ม ghost ลูกศรเขียนเอง
- **หน้า:** /orders, /orders/[id], /marketplace/[listingId], /seller/**
- **หลักฐาน:** marketplace detail uses the canonical Breadcrumb (app/marketplace/[listingId]/page.tsx:208-210), seller shell auto-renders Breadcrumb (seller-shell.tsx:174), buyer orders list uses Breadcrumb (app/orders/page.tsx:130-137) — but both order detail pages hand-roll a ghost Button + ArrowLeft in the breadcrumb slot instead (app/orders/[id]/page.tsx:166-171, app/seller/orders/[id]/page.tsx:195-200), and error states repeat the same hand-rolled button (:131-134, :162-165).
- **ทางแก้:** ให้หน้า order detail ใช้ Breadcrumb/BackButton กลางแบบเดียวกับหน้าอื่น (มือถือได้ปุ่มวงกลมย้อนกลับมาตรฐานเดียวกับ settings ที่แก้ไปแล้ว)

### ⚪ commerce.23 [COMMERCE-14] เส้นคั่นแถวผู้ขายใน ListingCard เป็นสีขาวโปร่ง 4% — โหมดสว่างมองไม่เห็น
- **หน้า:** /marketplace
- **หลักฐาน:** components/marketplace/listing-card.tsx:121 `border-t border-white/[0.04]` — hardcoded white instead of the hairline token; invisible white-on-white in light mode. Every other divider in the area uses border-hair / var(--p-hair) (e.g. order-card.tsx:116).
- **ทางแก้:** เปลี่ยนเป็น border-hair ให้เข้าระบบ hairline เดียวกับทั้งแอป (แก้บรรทัดเดียว)

### ⚪ commerce.24 [NEW] แจ้งผลบันทึกหน้าแก้ไขประกาศเป็นข้อความ+setTimeout เขียนเอง ทั้งที่มี SavedPill กลาง
- **หน้า:** /seller/listings/[id]
- **หลักฐาน:** app/seller/listings/[id]/page.tsx:181-182 setSuccess(true) + setTimeout 3000, rendered as a bare <p className="text-sm text-success"> (:252-254) and error as bare <p> (:251). The kit's SavedPill (shared/saved-pill.tsx) was created (SETTINGS-10) exactly for this success/error feedback pattern and is used across settings.
- **ทางแก้:** แทนข้อความบันทึกสำเร็จ/ผิดพลาดด้วย SavedPill กลาง ให้ feedback หน้าตาเดียวกับ settings ทั้งแอป

<a id="chrome"></a>
## Chrome กลาง (header/nav/footer)

**ภาพรวม:** เปลือกส่วนกลาง (header · bottom-nav · footer · main-chrome) โครงหลักแข็งแรงขึ้นมากจากรอบแก้ก่อน — แท็บ active, ระยะกัน bottom-nav, ปุ่มย้อน แก้แล้วจริง แต่ยังมีรอยรั่ว 2 กลุ่ม: (1) วินัยสี/ไอคอนบน chrome ยังหลุด — สีเขียวกำไรโผล่บนแถบบนสุดทุกหน้า, ไอคอนแถวเดียวกันใช้หลักสีคนละแบบ 3 อย่าง, ป้ายตัวเลขแจ้งเตือนเขียนเอง 7 จุดตัดเลขไม่เท่ากัน (2) ของที่เขียนเองแทนชุดกลาง — กระดิ่งแจ้งเตือนทำ popup ลอยเองทั้งที่มี Popover กลาง, footer เขียนกรอบเอง, ความกว้างหน้าอ่านประกาศ 2 ที่ขัดกัน นอกจากนี้ลิงก์ใน chrome เกือบทั้งหมดฝังคำว่า opcg ตายตัว ซึ่งจะพังทันทีที่เพิ่มเกมที่สอง

### 🟡 chrome.1 [NEW] แถบสถิติบนสุด (desktop) ทาสีเขียวกำไรให้ตัวเลขที่ไม่ใช่กำไร — ขัดกฎสงวนเขียว/แดง ✅
- **หน้า:** ทุกหน้า (desktop header ticker)
- **หลักฐาน:** src/components/layout/header-market-ticker.tsx:84 total market value styled `text-price-up` permanently + :87 TrendingUp icon also `text-price-up`. The value is a static market total, not a gain/loss delta. VISION §1: green/red reserved for profit/loss only, explicitly "ห้ามใช้บน chrome". This green sits in the persistent header on every desktop page.
- **ทางแก้:** เปลี่ยนตัวเลขมูลค่ารวมในแถบบนสุดเป็นสีตัวอักษรปกติ (text-foreground) และไอคอนเป็นสี muted — เก็บเขียว/แดงไว้ให้ตัวเลขที่เป็นกำไร/ขาดทุนจริงเท่านั้น
- **หมายเหตุ verify:** Confirmed. header-market-ticker.tsx:84 hardcodes text-price-up on the static "มูลค่ารวม" total (not a delta) and :87 colors the TrendingUp icon green too — permanently, no condition. Component renders inside the sticky desktop-only global header (header.tsx, hidden md:block), i.e., chrome on every desktop page. VISION.md:27 explicitly reserves green/red for gain/loss and says "ห้ามใช้บน chrome". No exception documented in AGENTS.md kit table or doc/uxui-refactor-plan.md/audit findings (ticker is only cited there for padding/scrollbar issues). The recent "clarify price colors" commit (a0400db) skipped this file, so it is not fixed. Sibling chips in the same ticker use text-foreground, making this the inconsistent one. Severity med is fair: purely cosmetic but site-wide persistent chrome, violates an explicit documented rule, and the green+TrendingUp pairing implies a market-up signal with no data behind it.

### 🟡 chrome.2 [CHROME-08] ไอคอนทางลัด 3 ตัวใน header ใช้หลักสีคนละแบบ (amber ดิบ · honey ค้างตลอด · emoji)
- **หน้า:** ทุกหน้า (desktop header)
- **หลักฐาน:** src/components/layout/header.tsx — same row, 3 grammars: :166-171 Briefcase active = raw `text-amber-500 dark:text-amber-400` (not honey token), inactive = muted; :187 Heart = `text-primary` ALWAYS even when inactive (accent on idle chrome, violates honey <5% + neutral icons); :208 Honey = 🍯 emoji, :211 count in raw `text-amber-600 dark:text-amber-400`. Also two vocabularies for active bg: header.tsx:141/161 `bg-[var(--p-honey-soft)]` vs header-user-menu.tsx:106 `bg-primary/15`. CHROME-08 fixed the blue bookmark but this residual drift remains.
- **ทางแก้:** ให้ไอคอนทั้งสามใช้กติกาเดียวกับลิงก์เมนูข้างๆ: ตอนปกติเป็นสี muted, ตอน active เป็น text-primary + พื้น honey-soft — เลิกใช้ amber ดิบและเลิกให้หัวใจติดสีค้างตลอด แล้วเลือก class พื้น active แบบเดียวทั้งไฟล์

### 🟡 chrome.3 [NEW] กระดิ่งแจ้งเตือนเขียน popup ลอยเองทั้งระบบ ทั้งที่มี Popover กลางในชุด kit ✅
- **หน้า:** ทุกหน้า (header desktop + มือถือ)
- **หลักฐาน:** src/components/layout/notification-bell.tsx:39 manual `useState(open)`, :87-95 hand-rolled mousedown click-outside listener (no Escape close, no focus management, trigger lacks aria-expanded/aria-haspopup), :133 hand-positioned `absolute right-0 top-full z-50 mt-2 w-[22rem]` panel with raw `shadow-lg` instead of elevation token. AGENTS.md kit canon: Popover (ui/popover.tsx) — "ห้ามคำนวณตำแหน่ง/portal เอง" (Escape + focus behavior come free). Every other header menu (game switcher, user menu, lang/currency) already uses DropdownMenu/Popover primitives.
- **ทางแก้:** ย้าย panel กระดิ่งไปใช้ Popover/PopoverContent กลาง — ได้ปิดด้วย Escape, focus ถูกต้อง, ตำแหน่งอัตโนมัติ และเงาเป็น token เดียวกับ popup อื่นทั้งแอป
- **หมายเหตุ verify:** Verified against master: all cited lines match exactly (line 39 useState, lines 87-95 mousedown-only click-outside, line 133 hand-positioned panel with raw shadow-lg vs Popover's var(--elev-overlay)). No Escape handling, no focus management, trigger lacks aria-expanded/aria-haspopup. Sibling header menus (header-user-menu, game-switcher, header-market-ticker) all use DropdownMenu/Popover primitives — the bell is the sole hand-rolled popup in the header. No documented exception in AGENTS.md kit table or doc/uxui-refactor-plan.md (KIT-09 only relocated the file; TRACK-01 is a different bell). Not fixed on any branch — recent a11y commits only added .tap-safe. Severity med is honest: global-header a11y gap (keyboard/SR users) but pointer users unaffected. Nitpick: "ทุกหน้า" excludes chromeless routes (admin/auth), which don't render this header.

### 🟡 chrome.4 [NEW] ป้ายตัวเลขแจ้งเตือนเขียนเอง 7 จุด ตัดเลขคนละเกณฑ์ (9+ กับ 99+) และใช้ตัวอักษรคนละ token ✅
- **หน้า:** bottom-nav · header user menu · กระดิ่งแจ้งเตือน · /more · /messages
- **หลักฐาน:** Same concept (red unread-count pill) hand-rolled 7 times with different caps and tokens: bottom-nav.tsx:42 `>99 → 99+` (uses .text-overlay — AGENTS says overlay is for image-overlay labels only), header-user-menu.tsx:114 `>99 → 99+` (text-micro), notification-bell.tsx:127/155/163 `>9 → 9+`, more-client.tsx:57 CountBadge `>99 → 99+`, conversation-item.tsx:97 `>9 → 9+`. Same unread count can read "12" on the More tab but "9+" on the bell simultaneously.
- **ทางแก้:** ยกป้ายตัวเลขเป็น component กลางตัวเดียว (ต่อยอด CountBadge ที่มีใน more-client อยู่แล้ว ย้ายเข้า kit) กำหนดเกณฑ์ตัดเลขเดียว แล้วให้ทั้ง 7 จุดเรียกใช้ — พร้อมเพิ่มแถวในตาราง kit ของ AGENTS.md
- **หมายเหตุ verify:** CONFIRMED at all cited lines: 7 hand-rolled count pills — bottom-nav.tsx:41-42 (99+, text-overlay = documented token misuse, globals.css:660 says image-overlay last resort while text-micro:653 is "reserved for chips and badges"), header-user-menu.tsx:113-114 (99+, text-micro), notification-bell.tsx:127/155/163 (9+, mixed text-micro/text-overlay even within the same component), more-client.tsx:54-61 CountBadge (99+, text-micro), conversation-item.tsx:96-97 (9+, text-micro). No canonical component in AGENTS.md kit table, no exception in doc/uxui-refactor-plan.md, not fixed. Bonus scatter: tier-banner.ts:19-22 has an 8th formatCount util calling 99+ the "Instagram convention" — which the 9+ spots contradict. Caveats that don't invalidate: (1) the "12 on More vs 9+ on bell" example conflates two data sources (More=messages, bell=notifications+alerts); the real repro is More tab "12" vs conversation row "9+" for one conversation; (2) "red" is 5/7 (conversation-item is bg-primary, bell price-tab bg-success); (3) 3 of 7 spots are behind marketplaceEnabled=false, but 4 are live in prod and the bottom-nav(99+/overlay) vs bell(9+/micro) divergence is visible simultaneously today. Severity med is honest — same class/scale as prior consolidations (SavedPill x5, RatingStars x6) plus a token violation; not high (nothing broken), not low.

### 🟡 chrome.5 [NEW] แท็บ "เพิ่มเติม" ขึ้นป้ายเลขข้อความค้างอยู่ แต่เปิดแผ่นแล้วไม่มีทางเข้าข้อความให้เห็น
- **หน้า:** bottom-nav + MoreSheet (มือถือ)
- **หลักฐาน:** bottom-nav.tsx:121,147-153 — More tab badge = unreadMessages. But more-sheet.tsx:61-76 tile grid has NO messages entry (Honey/Decks/Alerts/Trending/Guide/Settings only), so the badge's cause is invisible after tapping; user must go "ดูเมนูทั้งหมด" → /more → หมวดบัญชี. Worse: use-header-data.ts:64 fetches unread count for any authed user regardless of flag, while more-client.tsx:246-266 renders the messages row only inside `marketplaceEnabled &&` — with the flag off, the badge points to a destination that exists nowhere on mobile.
- **ทางแก้:** ถ้าเลขที่ขึ้นบนแท็บมาจากข้อความ ให้แผ่น MoreSheet มีช่องข้อความพร้อมป้ายเลขเดียวกัน (แสดงตาม flag เดียวกับ /more) และถ้าปิด marketplace อยู่ก็อย่านับข้อความขึ้นป้ายบนแท็บเลย

### 🟡 chrome.6 [NEW] ลิงก์ใน chrome ฝัง "/opcg/" ตายตัวทุกจุด — เพิ่มเกมที่สองเมื่อไหร่ ผู้ใช้จะถูกดีดกลับเกมเก่า
- **หน้า:** header · bottom-nav · footer · MoreSheet · กระดิ่งแจ้งเตือน
- **หลักฐาน:** Hardcoded game prefix across all chrome nav: header-constants.ts:19-20 (`/opcg/sets`, `/opcg/decks`), bottom-nav.tsx:20 (`/opcg/sets`), footer.tsx:37-46 (6 links `/opcg/...`), more-sheet.tsx:64-73 (`/opcg/decks`, `/opcg/trending`, `/opcg/compare`), notification-bell.tsx:266,304,338 (`/opcg/search`, `/opcg/cards/...`). VISION §5.7: game = namespace, switcher swaps only the `[game]` segment and "อยู่ feature เดิม" — but every chrome link teleports back to opcg regardless of current game. Middleware already redirects un-prefixed URLs to the cookie game, so the plumbing for the fix exists.
- **ทางแก้:** ให้ลิงก์ใน chrome ประกอบจากเกมปัจจุบัน (helper เดียว เช่น gameHref(currentGame, "/sets")) หรือใช้เส้นทางไม่ใส่ชื่อเกมแล้วให้ middleware พาไปเกมใน cookie — ทำครั้งเดียวก่อนเปิด Pokémon จะได้ไม่ต้องไล่แก้ 5 ไฟล์ตอนไฟลนก้น

### 🟡 chrome.7 [CHROME-04] ความกว้างหน้าอ่าน (blog/guide) ประกาศ 2 ที่และขัดกัน — ตัวในเป็นโค้ดตายที่หลอกคนแก้
- **หน้า:** /blog/[slug] · /guide/* (6 หน้า)
- **หลักฐาน:** main-chrome.tsx:78-80 ROUTE_WIDTH pins /blog/.+ and /guide/.+ to "reading" (max-w-2xl = 672px), but pages still wrap an inner `mx-auto max-w-3xl` that can never be reached: blog/[slug]/page.tsx:121,184, blog/[slug]/loading.tsx:15, guide/buying:66, getting-started:165, card-types:228, colors:179, sets:179, rarities:284. CHROME-04 still unfixed.
- **ทางแก้:** เลือกความจริงหนึ่งเดียว: ลบตัวห่อ max-w-3xl ในหน้าออกทั้ง 9 จุด แล้วถ้าอยากได้กว้าง 768px ให้แก้ ROUTE_WIDTH เป็น narrow ที่เดียวใน main-chrome

### ⚪ chrome.8 [CHROME-12] สองแถวของ header desktop ยังใช้ระยะขอบไม่เท่ากัน — โลโก้กับชิปแถวบนเยื้องกัน 8px
- **หน้า:** ทุกหน้า (desktop 768–1023px)
- **หลักฐาน:** header.tsx:111 nav row `px-4 lg:px-8` vs header-market-ticker.tsx:66 ticker row `px-6 lg:px-8` — at md widths the logo sits at 16px while the first ticker chip sits at 24px (the mismatch CHROME-12 flagged, now mutated in direction but still present; aligned only at lg+).
- **ทางแก้:** ปรับสองแถวให้ใช้ระยะขอบชุดเดียวกัน (เช่น px-6 lg:px-8 ทั้งคู่) จะได้ขอบซ้าย-ขวาตรงแนวกันตอน chrome โปร่งใส

### ⚪ chrome.9 [CHROME-07] footer ยังเขียนกรอบความกว้างเองแทนที่จะใช้ PageContainer กลาง
- **หน้า:** ทุกหน้าที่มี footer
- **หลักฐาน:** footer.tsx:83 hand-rolls `mx-auto max-w-7xl px-5 pt-10 pb-28 md:px-6 md:py-12 md:pb-12 lg:px-8`. Gutter values currently match PageContainer by copy-paste, but the next gutter change will silently drift again (exactly how the previous px-4 misalignment happened). CHROME-07 still open in plan.
- **ทางแก้:** เปลี่ยนตัวห่อใน footer เป็น <PageContainer> แล้วคงเฉพาะระยะบน-ล่างของตัวเอง — ระยะขอบข้างจะเกาะค่ากลางอัตโนมัติตลอดไป

### ⚪ chrome.10 [NEW] Honey ใช้สัญลักษณ์คนละตัวข้ามพื้นผิว — emoji 🍯 ใน header แต่ไอคอน Sparkles ใน MoreSheet//more
- **หน้า:** header desktop · เมนูผู้ใช้ · MoreSheet · /more
- **หลักฐาน:** header.tsx:208 and header-user-menu.tsx:222 render Honey as 🍯 emoji; more-sheet.tsx:63 and more-client.tsx:272 render it as lucide Sparkles icon. Owner's stated preference (memory + IA-NAV-05 precedent): one icon per concept site-wide.
- **ทางแก้:** เคาะสัญลักษณ์เดียวให้ Honey (แนะนำ 🍯 ที่เป็นตัวตนแบรนด์ หรือทำ HoneyIcon กลาง) แล้วใช้ตัวเดียวกันทุกจุด

### ⚪ chrome.11 [NEW] ปุ่มลอย (เลื่อนขึ้นบน · แถบเปรียบเทียบ) โผล่บนหน้าที่ไม่มี bottom-nav แต่ยังเว้นระยะเผื่อ bottom-nav
- **หน้า:** admin · seller · messages · หน้า login/register (มือถือ)
- **หลักฐาน:** layout.tsx:114-116 renders CompareFloatingBar + ScrollToTop outside the MainChrome/chromeless gate, so they appear on chromeless routes too. Both hardcode a bottom-nav clearance that doesn't exist there: scroll-to-top.tsx:41 `fixed bottom-20 ... md:bottom-8`, compare-floating-bar.tsx:48 `fixed ... bottom-20 ... md:bottom-6` — on mobile admin/seller/messages/auth they float 80px above nothing, and the compare bar can overlay the chat input or login form if compare items exist.
- **ทางแก้:** ให้สองตัวนี้เช็ค chromeless route เดียวกับ MainChrome (หรือย้ายเข้าไปใน gate เดียวกัน) แล้วบนหน้าที่ไม่มี bottom-nav ใช้ระยะล่างปกติ

### ⚪ chrome.12 [NEW] กระดิ่งแจ้งเตือนหายไปทั้งปุ่มจนกว่าจะโหลดสำเร็จ — chrome กระตุกและหายได้เป็นนาทีถ้าเรียกครั้งแรกพลาด
- **หน้า:** header ทุกหน้า (ผู้ใช้ล็อกอิน)
- **หลักฐาน:** notification-bell.tsx:109 `if (!loaded) return null` — bell renders nothing until the first /api/notifications fetch resolves, so header icons pop in and shift; if that fetch fails, apiTry returns null, `loaded` stays false and the bell vanishes until the next 60s poll (:75-78). VISION §4 zero-spinner rule: loading should hold shape, not collapse chrome.
- **ทางแก้:** แสดงปุ่มกระดิ่งทันที (ยังไม่ต้องมีเลข) แล้วค่อยเติมป้ายเลขเมื่อข้อมูลมา — chrome จะนิ่ง ไม่ขยับ และไม่มีวันหายทั้งปุ่ม

### ⚪ chrome.13 [IA-NAV-03] /more บน desktop ยังเป็นหน้าลอยไร้ chrome — ไม่มี header/โลโก้ให้กลับ
- **หน้า:** /more (desktop)
- **หลักฐาน:** main-chrome.tsx:34 NO_HEADER_FOOTER_ROUTES=["/more"] hides Header/Footer at every width while bottom-nav.tsx:132 is `md:hidden` — desktop /more has zero chrome. more-client.tsx:79-80 comment acknowledges it's reachable by URL on desktop. The owner call (2026-07-03) targeted mobile duplication; desktop wasn't the motivation. IA-NAV-03 still open.
- **ทางแก้:** ซ่อน header/footer เฉพาะจอเล็ก (<md) ตามเจตนาเดิม — บน desktop ให้ /more ได้ header ปกติ (ห่อด้วย hidden md:block กลับด้าน) หรือ redirect ไป /settings

<a id="admin"></a>
## Admin

**ภาพรวม:** ภาพรวมโซนแอดมินแข็งแรงขึ้นมากจากรอบตรวจก่อน — ตารางรายการหลักย้ายเข้า AdminDataTable แล้ว 9 หน้า (ได้ list บนมือถือฟรี), ฟอร์ม 7 ตัวย้ายเข้า useAdminForm แล้ว, หน้า admin-login แก้เป็น token ครบแล้ว (ADMIN-03 ปิดได้), และทุกตารางที่เขียนเองก็มี list สำรองบนมือถือแล้ว (ADMIN-01 ส่วนเลื่อนแนวนอนหายแล้ว) งานที่เหลือเป็นเก็บตก: หน้า config ยังเป็นช่องพิมพ์อิสระทั้งหมด (พิมพ์ True แทน true = ค่าถูกอ่านเป็น false เงียบๆ), ปุ่มจัดการในตารางฮันนี่ยังเล็กกว่ามาตรฐานแตะ 44px และโผล่บนมือถือด้วย, หน้า blog ยังเขียนตารางเองซ้ำกับของกลาง, กับสีดิบตกค้าง ~30 จุดในเครื่องมือจับคู่และฮันนี่

### 🟡 admin.1 [ADMIN-04] หน้าตั้งค่าระบบเป็นช่องพิมพ์อิสระทั้งหมด — สวิตช์เปิดปิดตลาดต้องพิมพ์ true/false เอง พิมพ์ผิดแล้วพังเงียบ
- **หน้า:** /admin/config
- **หลักฐาน:** src/app/admin/config/page.tsx:38-43 marketplace_enabled is a free-text field (placeholder "false", help says type true/false); :131-144 notification flags same; :278-287 every field in every group renders the same plain <Input> with no type/validation. src/lib/admin/config.ts:77-80 parseBool is strict `raw === "true" || raw === "1"` — typing "True"/"TRUE" saves successfully but silently reads as false, flipping the whole marketplace zone with no warning.
- **ทางแก้:** เพิ่มชนิดให้ ConfigField: ค่าเปิด/ปิด → ใช้ Switch (ui/switch.tsx มีอยู่แล้วใน kit), ค่าเปอร์เซ็นต์/จำนวน → ช่องตัวเลขพร้อมขอบเขตต่ำสุด-สูงสุด, ค่า cron → ช่องข้อความพร้อมตัวอย่างและตรวจรูปแบบ แล้วตรวจค่าก่อนบันทึก — ค่าที่อ่านไม่ได้ให้ปัดทิ้งพร้อมแจ้งเตือนบอกว่าช่องไหนผิด

### 🟡 admin.2 [ADMIN-01] ปุ่มแก้ไข/ลบ/สวิตช์สถานะในตารางฮันนี่เล็กกว่ามาตรฐานแตะ 44px — และหลังย้ายเข้าตารางกลาง ปุ่มชุดเดียวกันนี้โผล่บนมือถือด้วย
- **หน้า:** /admin/honey/missions/bonus, /admin/honey/missions/templates, /admin/honey/missions/schedule, /admin/honey/shop
- **หลักฐาน:** bonus-list.tsx:102-111 status toggle is a bare <button> wrapping an h-5 w-5 icon (~20px hit area, title only — no aria-label); :121-135 edit/delete use Button size="icon-xs" (28px). Same pattern: templates-list.tsx:145-159, schedule-list.tsx:124-130, honey-shop-manager.tsx:175-181. All 4 lists pass only columns/data to AdminDataTable (e.g. bonus-list.tsx:169) so the default mobile fallback (admin-data-table.tsx:299-300, sm:hidden stacked cells) renders these sub-44px controls on phones too. Residual of ADMIN-01 — the horizontal-scroll half was fixed by the migration, the tap-size half was not.
- **ทางแก้:** ในคอลัมน์จัดการของ 4 รายการนี้ ขยับปุ่มเป็นขนาดแตะได้จริง (อย่างน้อยบนมือถือ เช่น ส่ง renderMobileRow ที่ให้ปุ่มสูง ≥44px) และเปลี่ยนสวิตช์สถานะจากปุ่มเปล่าเป็น Switch จาก kit (ui/switch.tsx ออกแบบ hit ≥44px มาแต่แรก) พร้อมใส่ aria-label

### 🟡 admin.3 [ADMIN-02] หน้าบทความยังเขียนตารางเอง 2 ชุด (ตารางจอใหญ่ + รายการมือถือ) ซ้ำกับที่ AdminDataTable ให้ฟรี
- **หน้า:** /admin/blog
- **หลักฐาน:** src/app/admin/blog/page.tsx:106-171 hand-rolled desktop <table> (hidden sm:table) + :173-204 hand-rolled mobile <ul className="divide-y divide-hair sm:hidden"> — both duplicate what AdminDataTable (admin-data-table.tsx) already provides. It is the last list page in admin not on the shared table (9 others migrated). The refactor plan deferred it because the page is a server component (doc/uxui-refactor-plan.md:131), but the duplication still exists on master.
- **ทางแก้:** แตกส่วนตารางออกเป็น client component เล็กๆ แล้วใช้ AdminDataTable เหมือนหน้าอื่น — หรือถ้าตัดสินใจคงไว้ ให้จดข้อยกเว้นนี้ในตาราง kit ของ AGENTS.md เพื่อไม่ให้ถูกนับเป็นงานค้างซ้ำอีก

### ⚪ admin.4 [NEW] สองหน้าจับคู่ข้อมูลใช้ภาษาการโหลดคนละแบบ — SNKRDUNK ใช้วงหมุน แต่ Yuyutei ใช้โครงโหลดตามผัง
- **หน้า:** /admin/snkrdunk-matching, /admin/yuyutei-matching
- **หลักฐาน:** snkrdunk-match-client.tsx:470-474 table loading state = centered <Loader2 className="mx-auto size-6 animate-spin"> spinner, while the sibling tool has purpose-built skeleton rows (yuyutei-matching/yuyutei-skeleton-rows.tsx:4-33, Skeleton shaped like the real row). Violates VISION §4 rule 6 (zero-spinner: skeleton must match real layout) and makes two near-identical admin tools feel different.
- **ทางแก้:** ทำแถวโครงโหลดแบบเดียวกับของ Yuyutei ให้หน้า SNKRDUNK — หรือสกัดแถวโครงโหลดของเครื่องมือจับคู่เป็นตัวกลางใน components/admin/matching-ui.tsx แล้วใช้ร่วมกันทั้งสองหน้า

### ⚪ admin.5 [ADMIN-05] สีดิบตกค้าง ~30 จุดใน 6 ไฟล์ — โทนม่วงของงาน AI กับโทนเหลืองของฮันนี่ยังไม่ผ่าน token
- **หน้า:** /admin/yuyutei-matching, /admin/honey/shop, /admin/honey/raffle
- **หลักฐาน:** Partially swept since last audit (matching-ui.tsx StatusBadge now uses success/info/warning/danger tokens) but raw palette remains: yuyutei-match-row.tsx:260,455 bg-violet-600 buttons; yuyutei-ai-panel.tsx:25-81 violet-500/600/700 throughout; admin-bulk-bar.tsx:82-84 violet tone map; honey-shop-manager.tsx:40-45 raw badge colors (purple/amber/blue/emerald/violet); prize-editor.tsx:12-14 amber/slate/orange tier borders; raffle-card.tsx:92-103 amber. (honey-type-labels.ts:9-26 is arguably legit — categorical chart hues need to be distinct.)
- **ทางแก้:** กำหนดโทนกลางหนึ่งตัวสำหรับ "งาน AI" (เช่นผูกกับ token info หรือเพิ่ม semantic ใหม่ตัวเดียว) แล้วกวาดแทนสีม่วงทั้ง 3 ไฟล์ ส่วนสีเหลืองฮันนี่ให้ใช้ token warning/honey ที่มีอยู่ — ยกเว้นชุดสีแยกหมวดของกราฟใน honey-type-labels ที่ปล่อยได้

### ⚪ admin.6 [ADMIN-08] แถบแท็บของฮันนี่เขียนเองกับมือ ทั้งที่แท็บย่อยของภารกิจที่ซ้อนอยู่ข้างในใช้ AdminSubNav ตัวกลาง — สองแถบคนละฝีมือบนจอเดียว
- **หน้า:** /admin/honey/*
- **หลักฐาน:** honey/layout.tsx:40-57 hand-rolled <nav> mapping HONEY_TABS (7 tabs, own active/hover classes) while the nested missions/layout.tsx:11-18 uses the shared AdminSubNav component — two tab bars with slightly different styling stacked on the same screen.
- **ทางแก้:** เปลี่ยน honey/layout.tsx ให้ใช้ AdminSubNav ตัวเดียวกับแท็บย่อยของภารกิจ แล้วลบแถบที่เขียนเองทิ้ง

### ⚪ admin.7 [ADMIN-07] ฟังก์ชันแปลงเวลาสัมพัทธ์ถูกเขียนซ้ำในหน้าแดชบอร์ด ทั้งที่มีตัวกลางอยู่แล้ว
- **หน้า:** /admin
- **หลักฐาน:** admin/page.tsx:124-134 defines its own relativeTime(date: Date) while lib/utils/time.ts:8 already exports relativeTime(dateStr: string) — the only difference is the accepted input type; matching pages already re-export the lib version via matching-ui.tsx:12.
- **ทางแก้:** ขยาย relativeTime ใน lib/utils/time.ts ให้รับได้ทั้ง Date และข้อความ แล้วลบตัวที่เขียนซ้ำในหน้าแดชบอร์ดทิ้ง

### ⚪ admin.8 [ADMIN-06] ฟอร์มจับรางวัลกับตัวแก้ระดับสมาชิกยังใช้โครงฟอร์มแบบเก่าที่ก๊อปกันมา — จุดสุดท้ายที่ยังไม่ย้ายเข้า useAdminForm
- **หน้า:** /admin/honey/raffle, /admin/honey/ranks
- **หลักฐาน:** raffle-form.tsx (571 lines): :145 dirty check via JSON.stringify compare, :276-277 document.getElementById(FORM_ID)?.requestSubmit() hack — the exact pattern useAdminForm was built to replace (7 other forms migrated). rank-tiers-editor.tsx:59,67,182-184 uses the same JSON.stringify snapshot pattern. Both were documented defers in the plan (raffle = nested prize array) but remain the odd ones out.
- **ทางแก้:** ทยอยย้ายสองตัวนี้เข้า useAdminForm (เพิ่มการรองรับช่องแบบรายการซ้อนถ้าจำเป็น) หรืออย่างน้อยเปลี่ยนท่ากดบันทึกจาก getElementById มาใช้ submitFromBar ที่ hook กลางมีให้แล้ว เพื่อให้เหลือโครงฟอร์มแบบเดียวทั้งโซน

<a id="x-typography"></a>
## ✂️ ตัวอักษร (cross)

**ภาพรวม:** ระบบ token ตัวอักษรวางไว้ดีมากและ adoption โดยรวมสูง (ขนาดตัวอักษรกำหนดเองแบบ text-[Xpx] เหลือ 0 จุดในโค้ดจริง) แต่ความไม่สม่ำเสมอที่เหลือกระจุกใน 3 กลุ่ม: (1) token ตัวเลขเงิน (.text-price / .text-display / .text-code) ประกาศไว้แล้วแต่ตัว kit เอง (PriceTag) และหลายหน้ายังไม่ใช้ ทำให้ "ตัวเลขราคา" ซึ่งเป็นหัวใจของเว็บมีหน้าตาต่างกันข้ามหน้า — ชัดสุดคือเลข hero ที่หน้า market-overview เป็น mono แต่ portfolio/card-detail เป็น sans, (2) หน้าที่ migrate ครึ่งเดียว (deck-calculator, compare, guide/card-types) ยังใช้ stack เก่าปนกับ token ใหม่ในหน้าเดียวกัน, (3) ข้อที่ audit เดิมเจอแล้วยังไม่ถูกเก็บ (HOME-10, PLAY-03/05, SETS-11, CONTENT-10, DeltaPill ใน KIT-02) ยังอยู่ในโค้ดครบ. แก้กลุ่มแรกที่ atom กลางจุดเดียวจะได้ผลทั้งแอปทันที.

### 🔴 x-typography.1 [NEW] เลขใหญ่ hero ใช้คนละแบบอักษรข้ามหน้า — mono บน market-overview/drop-calc แต่ sans บน portfolio/card-detail
- **หน้า:** /market-overview, /portfolio, /cards/[id], /drop-calculator
- **หลักฐาน:** src/components/ui/hero-number.tsx:82 canonical HeroNumber = `text-display tabular-nums` (Kanit sans) used by portfolio-hero.tsx:79 and card-detail-price.tsx:160; but src/app/market-overview/_components/hero-market-card.tsx:49 hand-rolls `font-price text-display` (mono 36px) and src/components/drop-calculator/want-list.tsx:107 `font-mono text-display tabular-nums`; src/app/portfolio/portfolio-mock-preview.tsx:52 also hand-rolls `text-display tabular-nums` instead of HeroNumber. Same VISION §3/§4.1 hero atom renders in 2 typefaces on sibling MONEY pages.
- **ทางแก้:** ให้เลข hero ทุกจอผ่าน HeroNumber ตัวเดียว — ถ้าอยากได้แบบ mono ให้เพิ่ม prop ใน HeroNumber แล้วเคาะเป็นมาตรฐานเดียว (mono หรือ sans) ทั้งแอป จากนั้นแก้ hero-market-card, want-list, portfolio-mock-preview ให้เรียกผ่าน HeroNumber แทนเขียนเอง

### 🟡 x-typography.2 [NEW] token .text-price ประกาศเป็นมาตรฐานราคาแล้ว แต่ PriceTag (atom เงินทางการ) ไม่ใช้ + อีก ~10 จุดสะกดเองด้วย stack — ราคาขนาดเดียวกันหนาไม่เท่ากันแล้วแต่หน้า
- **หน้า:** ทุกหน้าที่มีราคา: หน้าแรก, /trending, /market-overview, /search, /seller/*
- **หลักฐาน:** src/app/globals.css:674-683 declares `.text-price` (15px w600 mono) with note "replaces ad-hoc .font-price vs .text-code drift. Adopt on PriceTag in P1" — but src/components/ui/price-tag.tsx:9-14 PRICE_SIZE uses raw stacks (`sm: text-sm font-medium` = 15px w500, vs .text-price 15px w600). Meanwhile the same role is hand-spelled as `font-price text-sm font-semibold` in market-overview-client.tsx:201, trending-tabs.tsx:83, mobile-card-item.tsx:76, hero-search-bar.tsx:250, rarity-breakdown.tsx:107, seller/page.tsx:266, seller/listings/page.tsx:359; home featured-card.tsx:60 uses `font-price text-xl font-bold` while PriceTag md = `text-xl font-semibold` (bold vs semibold on the same tier).
- **ทางแก้:** ให้ PRICE_SIZE ใน PriceTag อ่านจาก token (.text-price / .text-price-lg) ตามที่ globals.css ตั้งใจไว้ แล้วกวาดจุดที่สะกด `font-price text-sm font-semibold` เองให้เหลือ `.text-price` หรือเรียก PriceTag — แก้ที่ atom เดียวได้ผลทุกตาราง/ทุกแถว

### 🟡 x-typography.3 [HOME-10] market-overview: หัว section พี่น้องในหน้าเดียวใช้ text-h3 กับ text-h4 ปนกัน + เขียน header เอง 3 แบบทั้งที่มี SectionHead กลาง (ข้อเดิมยังอยู่ครบ)
- **หน้า:** /market-overview
- **หลักฐาน:** src/app/market-overview/market-overview-client.tsx:144 `<h2 className="text-h4">` (Top sets, inline in Surface) vs :239 `<h2 className="text-h3">` inside local SectionHeader (defined :222, used :98) — while shared components/shared/section-head.tsx (h2 text-h3) is not imported by this file at all. Exactly as HOME-10 documented; still in code.
- **ทางแก้:** ใช้ SectionHead กลางกับทุก section ในหน้า (ได้ text-h3 ระดับเดียวกันอัตโนมัติ) แล้วลบ SectionHeader ที่เขียนไว้ในไฟล์กับ header ที่เขียน inline ทิ้ง

### 🟡 x-typography.4 [KIT-02] DeltaPill ยังอยู่ใน market-overview — ป้าย %เปลี่ยนแปลง หน้าตาคนละแบบกับ PriceTag ที่ใช้ทั้งแอป (แผนเดิมสั่งยุบแล้วยังไม่ได้ยุบ)
- **หน้า:** /market-overview เทียบกับ หน้าแรก/watchlist/portfolio
- **หลักฐาน:** src/app/market-overview/_components/hero-market-card.tsx:227-293 local DeltaPill: rounded-full pill, 2 decimals (`delta.toFixed(2)`), text-micro/text-xs, colors via inline style color-mix — while canonical PriceTag changeOnly (ui/price-tag.tsx) renders rounded-md chip, 1 decimal, token classes. doc/uxui-refactor-plan.md line 107 (KIT-02+HOME-07) explicitly lists DeltaPill among components to fold into PriceTag; still used at market-overview-client.tsx:197,309.
- **ทางแก้:** เปลี่ยน DeltaPill เป็น PriceTag changeOnly (เพิ่ม prop ป้ายช่วงเวลา `period` เข้า PriceTag ถ้าจำเป็น เพราะเป็นความสามารถเดียวที่ PriceTag ยังไม่มี) แล้วลบ DeltaPill ทิ้ง

### 🟡 x-typography.5 [NEW] ราคาบน /compare เป็นที่เดียวในแอปที่เลขเงินไม่ใช้ mono + ขนาดเลขใหญ่ 2 ระบบไม่ตรงกันเองในหน้าเดียว
- **หน้า:** /compare
- **หลักฐาน:** src/app/compare/_components/compare-section.tsx:146 PriceCell `text-2xl font-semibold tabular-nums ... sm:text-3xl md:text-4xl` (sans — every other price in the app is font-price/mono) vs :171 NumericCell `text-3xl ... sm:text-4xl` (different ramp for the same visual role in the same grid); :195 ChangeValue hand-rolls its own delta instead of PriceTag; :29 section `<h2 className="text-h2 sm:text-h1">` renders at page-title size competing with the page's PageHeader h1.
- **ทางแก้:** ให้เลขเงินใน PriceCell ใช้ font-price/mono เหมือนทั้งแอป, เคาะ ramp เดียวให้ PriceCell/NumericCell, เปลี่ยน ChangeValue เป็น PriceTag changeOnly และลดหัว section ลงเป็น text-h3 ตาม SectionHead

### 🟡 x-typography.6 [PLAY-03] deck-calculator ยังใช้หัวข้อ/ตัวเลข stack ยุคก่อน token — สองเครื่องคิดเลข (deck vs drop) หน้าตาคนละยุค (ข้อเดิม แก้ไปครึ่งเดียว)
- **หน้า:** /deck-calculator เทียบ /drop-calculator
- **หลักฐาน:** src/app/deck-calculator/deck-calculator-client.tsx:316,:353 `<h3 className="text-sm font-semibold">` (should be .text-h5); :279 deck-switch pill hand-rolls `rounded-lg border px-3 py-1.5 text-sm font-medium` instead of SegmentedControl; card codes `font-mono text-xs` :342,:386,:454 instead of .text-code; DeckMockPreview :499 `font-price text-lg font-bold`, :505,:518 same old stacks — while sibling drop-calculator uses text-eyebrow/text-h3/text-display properly (want-list.tsx:105-107).
- **ทางแก้:** เก็บตกให้จบไฟล์: หัวข้อ→.text-h5, รหัสการ์ด→.text-code, ราคา→PriceTag/.text-price, pill สลับเด็ค→SegmentedControl และแก้ DeckMockPreview ที่ก๊อป markup เก่าไว้ให้ตรงกัน

### 🟡 x-typography.7 [PLAY-05] /decks เขียน h1 เองไม่ผ่าน PageHeader — มือถือไม่ได้หัวใหญ่ 34px แบบหน้าพี่น้องทุกหน้า
- **หน้า:** /decks
- **หลักฐาน:** src/app/decks/page.tsx:84 `<h1 className="text-h1">` hand-rolled (28px on mobile) — page-header.tsx:33 explicitly says not to hand-roll this; guide/blog/calculator siblings all use PageHeader and get .text-large-title (34px) on mobile. Guide pages were fixed under CONTENT-07 but /decks was not.
- **ทางแก้:** เปลี่ยนเป็น PageHeader (title + description) — ได้หัวใหญ่บนมือถือและโครง header มาตรฐานฟรี (ทำพร้อมแยก server/client ตาม PLAY-05 เดิม)

### ⚪ x-typography.8 [CONTENT-10] guide/card-types ยังเหลือหัวข้อ text-xl font-semibold ปนกับ text-h2 ในหน้าเดียว + h3 สะกด text-sm font-semibold แทน .text-h5 กระจายหลายหน้า guide (ส่วนที่เหลือของข้อเดิม)
- **หน้า:** /guide/card-types, /guide/getting-started, /guide/rarities, /guide/sets
- **หลักฐาน:** src/app/guide/card-types/page.tsx:274,:326 `<h2 className="text-xl font-semibold">` (20px w600) vs sibling `<h2 className="text-h2">` :369,:444,:468 (22px w700) in the same page; `<h3 className="text-sm font-semibold">` (= .text-h5 respelled) at getting-started:369,:378,:402,:429,:438, rarities:623, sets:310. Original CONTENT-10 spots in getting-started/rarities/sets were fixed by the guide-kit pass; these remain.
- **ทางแก้:** แทน text-xl font-semibold ที่เป็นหัวการ์ดด้วย .text-h4 (หรือ .text-h2 ถ้าเป็นหัว section จริง) และแทน h3 text-sm font-semibold ทั้งหมดด้วย .text-h5 ให้ 6 หน้า guide ใช้ชุดเดียวกันจบ

### ⚪ x-typography.9 [SETS-11] หน้า set: เลขในกล่องอัตราดรอปสะกด font-mono เอง + หัวตารางไม่ใช้ .text-eyebrow + ชื่อชุดหยิบ text-h3 มาแก้ทับ และ h1 ใช้ .text-display (token ตัวเลข) เป็นชื่อหน้า (ข้อเดิมยังอยู่ + จุดเพิ่ม)
- **หน้า:** /sets/[setCode]
- **หลักฐาน:** src/app/sets/[setCode]/set-page-client.tsx:138,:196 `font-mono text-sm font-bold tabular-nums` instead of .text-price; :165 dialog `<thead className="text-xs font-medium text-muted-foreground">` (not .text-eyebrow like market/portfolio tables); src/components/sets/set-hero.tsx:87 `text-h3 font-normal text-muted-foreground` stacks overrides on a token; set-hero.tsx:84 `<h1 className="text-display">` uses the KPI-number token (tabular-nums) as the page title instead of .text-h1/.text-large-title.
- **ทางแก้:** เลขในกล่อง→.text-price, หัวตาราง→.text-eyebrow, ชื่อชุดรอง→.text-h4 + text-muted-foreground (ไม่ stack ทับ) และเคาะว่า h1 โค้ดชุดควรเป็น .text-large-title/.text-h1 แทน .text-display

### ⚪ x-typography.10 [NEW] .text-code แทบไม่ถูกใช้ (2 ไฟล์) — รหัสการ์ด/รหัสชุดถูกสะกดเอง 3 แบบ (font-mono text-xs · font-mono text-sm tracking-wide · text-meta ที่เป็น sans)
- **หน้า:** /deck-calculator, /guide/sets, /marketplace/[listingId], card components ทั่วแอป
- **หลักฐาน:** grep `.text-code` = 2 adopter files vs hand-rolls: deck-calculator-client.tsx:342,:386,:454 `font-mono text-xs`; guide/sets/page.tsx:352 `font-mono text-xs`; marketplace/[listingId]/page.tsx:244 `font-mono text-sm tracking-wide`; while some card-code spots render sans via `text-meta` (e.g. components grep shows code rendered with text-meta) — same concept, 3 looks.
- **ทางแก้:** ล็อกว่า "รหัสการ์ด/ชุด = .text-code" ที่เดียว แล้วกวาดจุด font-mono text-xs/sm ที่เป็นรหัสให้ใช้ token เดียว (จุดที่เป็น sans ให้เคาะว่าตั้งใจหรือหลุด)

### ⚪ x-typography.11 [NEW] ป้ายตัวพิมพ์ใหญ่ (eyebrow) ถูกสะกดเองอีก 3-4 แบบนอก .text-eyebrow — โดยเฉพาะแบบ mono ของ market-overview
- **หน้า:** /market-overview, /decks, โปรไฟล์สาธารณะ, /admin/drop-rates
- **หลักฐาน:** market-overview period-chip.tsx:30 and hero-market-card.tsx:251,:285 `text-micro font-mono uppercase tracking-wider` (a mono eyebrow variant that exists nowhere else); decks/page.tsx:85 `text-micro uppercase tracking-wide text-muted-foreground`; profile/public/social-link-chip.tsx:36 `text-micro uppercase tracking-wider text-muted-foreground/80`; admin/drop-rates/_components/set-row.tsx:100 `font-mono text-sm font-bold uppercase tracking-wide` — AGENTS.md says use .text-eyebrow for this role.
- **ทางแก้:** จุดที่เป็นป้ายกำกับ (ไม่ใช่ตัวหนังสือในชิป) เปลี่ยนเป็น .text-eyebrow · ถ้าอยากคงกลิ่น mono ของ market-overview ให้เคาะเป็น variant เดียวใน globals.css ไม่ใช่สะกดกันเองต่อไฟล์

### ⚪ x-typography.12 [NEW] heading token ถูก stack น้ำหนัก/สีทับหลายจุด — ขัดกฎ "token เดียวจบ" และเกิดน้ำหนัก extrabold ที่ไม่มีในระบบ
- **หน้า:** /u/[handle], หน้าแรก, /cards/[id], /search
- **หลักฐาน:** profile/public/profile-hero.tsx:135 `<h1 className="... text-h1 font-extrabold">` overrides the token's w700; home-search-hero.tsx:43 `<h1 className="text-3xl font-extrabold ... sm:text-5xl">` invents a one-off ramp + the only extrabold weights in the app; card-detail-specs.tsx:125 `text-h5 font-bold` overrides w600; photo-search-button.tsx:307 `text-h5 font-semibold` (redundant no-op noise).
- **ทางแก้:** ตัด override น้ำหนักบน token ออก (ให้ token คุมเอง) — ถ้าอยากได้หัว hero หนาพิเศษของหน้าแรก ให้ประกาศเป็น token/クラสเดียวใน globals.css แล้วใช้ร่วมกับ profile hero ให้เป็นเสียงเดียว

### ⚪ x-typography.13 [NEW] หัวคอลัมน์ตารางมี 3 มาตรฐาน — market ใช้ .text-eyebrow เต็ม, portfolio ใช้ .text-eyebrow แต่กด opacity + override น้ำหนัก, dialog หน้า set ไม่ใช้เลย
- **หน้า:** หน้าแรก/ตาราง market, /portfolio/[id], /sets/[setCode]
- **หลักฐาน:** market/market-table.tsx:137 `<tr className="border-b border-hair text-eyebrow text-muted-foreground">` (canonical per AGENTS "table column headers → .text-eyebrow") vs portfolio/assets-table/desktop-table.tsx:35-41 `text-eyebrow text-muted-foreground/60` + every `<th className="... font-medium">` overriding the token's w600 down to w500; sets/[setCode]/set-page-client.tsx:165 `<thead className="text-xs font-medium text-muted-foreground">` no uppercase at all.
- **ทางแก้:** เคาะหัวตารางเป็น .text-eyebrow + text-muted-foreground แบบเดียว (ไม่กด opacity ไม่ override น้ำหนัก) แล้วแก้ 2 ตารางที่เพี้ยนให้ตรง

### ⚪ x-typography.14 [NEW] /pricing มี .text-display 3 ตัวพร้อมกัน (ราคาแผนทุกใบ) — ขัดกฎ VISION "เลข hero ตัวเดียวต่อจอ"
- **หน้า:** /pricing, /settings (Subscription)
- **หลักฐาน:** billing/plan-cards.tsx:121 and :144 apply `.text-display` to every plan card's price — PlanCards renders 3 plans side-by-side on /pricing and again inside Settings Subscription, so 3 hero-size numbers compete on one screen; VISION §4.1: "One hero number / screen — .text-display ตัวเดียวต่อหน้า · เกิน 1 = clutter bug".
- **ทางแก้:** ให้แผนแนะนำ (Pro) ใบเดียวคง .text-display ส่วนแผนอื่นลดลง .text-h2/.text-price-lg — สอดคล้องกับ HONEY-10 เดิมที่ให้ Pro เป็นแผนแนะนำเดียวอยู่แล้ว

<a id="x-surface"></a>
## ✂️ กล่อง/ระยะ/มุมโค้ง (cross)

**ภาพรวม:** โครงใหญ่ของระบบกล่อง/พาเนลถือว่าชนะแล้ว — Surface ถูกใช้กว้าง, border-hair แทนที่ arbitrary hairline ครบ, และ overlay หลัก (dialog/sheet/popover/dropdown/select) ย้ายมาใช้เงาจาก token กลางแล้ว แต่ยังเหลือ "เศษค้าง" ที่ทำให้แต่ละหน้าดูคนละมือ: มุมโค้งไม่มีมาตรฐานเดียว (การ์ดปกติ 12px แต่โปรไฟล์/คู่มือ/dialog บางตัวถูกดันเป็น rounded-2xl), เงายังมี 2 ภาษา (token กลาง vs shadow-lg/xl/2xl เขียนมือ) รวมถึงการ์ดนิ่งๆ ที่แอบใส่เงาใหญ่ผิดกฎ elevation, เส้นขอบยังมี 2 สี (--p-hair vs --border) ปนกันในจอเดียว, และมีชิ้นส่วนเขียนมือซ้ำของที่มีใน kit แล้ว (สวิตช์เปิด/ปิดใน portfolio, empty state ในแท็บโปรไฟล์, popup แจ้งเตือน/ปฏิทิน) — ทั้งหมดเป็นงานกวาดที่ชี้จุดได้ชัด ไม่ต้องรื้อโครง

### 🟡 x-surface.1 [TOKENS-02] เงายังพูด 2 ภาษา — overlay/แถบลอยบางตัวใช้ shadow-lg/xl/2xl เขียนมือ แทน token เงากลางที่ตัวหลักย้ายไปแล้ว
- **หน้า:** หน้าแรก (ช่องค้นหา hero), header ทุกหน้า (กระดิ่งแจ้งเตือน), เปรียบเทียบการ์ด, ข้อความ, admin
- **หลักฐาน:** Canonical overlays already use the token: dialog.tsx:64 / sheet.tsx:56 / popover.tsx:44 / dropdown-menu.tsx:45 / select.tsx:97 all `shadow-[var(--elev-overlay)]`; floating bars compare-floating-bar.tsx:52 + admin-save-bar.tsx:58 use `--elev-raised`. Stragglers still hardcode: src/components/home/hero-search-bar.tsx:156,209 (`shadow-lg`, dropdown `shadow-xl`), src/components/layout/notification-bell.tsx:133 (`shadow-lg`), src/components/shared/search-results-dropdown.tsx:35 (`shadow-lg`), src/components/admin/admin-bulk-bar.tsx:44 (`shadow-2xl` — the twin compare-floating-bar uses the token), src/components/messages/chat-layout.tsx:448 (drawer `shadow-xl`), src/app/admin/honey/raffle/raffle-form.tsx:523 (`shadow-lg`), src/app/compare/compare-chart.tsx:82 (tooltip `shadow-xl`), src/app/admin/cards/_components/card-cells.tsx:68 (TooltipContent override `shadow-2xl`). Result: popups of the same layer cast visibly different shadows (TOKENS-02 was only half-finished).
- **ทางแก้:** กวาดจุดที่เหลือให้จบ: popup/dropdown/ลิ้นชักทุกตัว → shadow-[var(--elev-overlay)] · แถบลอย (admin-bulk-bar) → --elev-raised · แล้วประกาศกฎ "ห้ามใช้ shadow-lg/xl/2xl ตรงๆ" ใน AGENTS.md เพื่อปิดประตู drift รอบใหม่

### 🟡 x-surface.2 [NEW] การ์ดนิ่งๆ ใส่เงาใหญ่ ผิดกฎ elevation (เงาสงวนไว้แค่ bottom-nav / sheet / dialog)
- **หน้า:** หน้า admin-login และ 6 หน้าหลักตอนยังไม่ล็อกอิน (portfolio ×2, watchlist, honey, settings, deck-calculator)
- **หลักฐาน:** VISION §4.4: inline card = flat + hairline only; layered shadow reserved for bottom-nav / bottom-sheet / dialog. Violations: src/components/shared/login-gate.tsx:47 — AuthPreviewGate login card `<Surface variant="outline" className="... rounded-2xl p-8 ... shadow-lg">` (static card floating over a blurred preview, shown to every guest on 6 pages); src/app/admin-login/page.tsx:84 — hand-rolled `rounded-2xl border border-hair bg-card p-6 shadow-2xl` login card. Both also override Surface radius to 2xl and bypass Surface padding variants (p-8 / hand-rolled div).
- **ทางแก้:** ตัด shadow-lg / shadow-2xl ออกจากการ์ดนิ่งทั้งสองจุด ให้เหลือ hairline ตามกฎ (ถ้าอยากให้เด่นเหนือ backdrop ใช้ variant="hero" ของ Surface) และ admin-login เปลี่ยนกล่องเขียนมือเป็น Surface

### 🟡 x-surface.3 [TOKENS-06] มุมโค้งยังไม่มีมาตรฐานเดียว — การ์ดทั่วแอป 12px แต่โปรไฟล์/คู่มือ/dialog บางตัวถูกดันเป็น rounded-2xl (~22px)
- **หน้า:** โปรไฟล์สาธารณะ, คู่มือ (guide), ตั้งค่า, หน้าแรก, dialog หลายตัว (ค้นหาด่วน, เลือกการ์ดเทียบ, ดูรูปสินค้า)
- **หลักฐาน:** Surface/.panel = var(--radius) 12px (surface.tsx:16-18, globals.css:296-300) but 37 uses of rounded-2xl + 2 rounded-3xl re-skin the same concepts: Surface overridden per-page — profile-achievements.tsx:59, profile-completeness.tsx:161, guide/card-types/page.tsx:267,318, login-gate.tsx:47; hand-rolled 2xl panels — empty-profile-panel.tsx:30, section-subscription.tsx:346, guide/rarities/page.tsx:332; DialogContent radius overridden from canonical rounded-xl (dialog.tsx:64) to 2xl in command-search.tsx:206, compare/card-picker-modal.tsx:64, marketplace/[listingId]/image-gallery.tsx:106; kit itself split: grouped-list.tsx:35 + billing/plan-cards.tsx:198 = rounded-2xl vs Surface = rounded-lg; lone rounded-3xl at profile-cover.tsx:56. (Bare `rounded` 156 จุดจากรอบก่อนถูกกวาดหมดแล้ว — เหลือแค่เคาะมาตรฐาน)
- **ทางแก้:** เคาะมาตรฐานครั้งเดียวแล้วบันทึกใน AGENTS.md: การ์ด/พาเนล = ค่าเดียว (rounded-lg ตาม Surface), dialog = rounded-xl ห้าม override รายหน้า, grouped-list แบบ iOS อนุญาต 2xl เป็นข้อยกเว้นที่ประกาศชัด — จากนั้นลบ rounded-2xl/3xl ที่เป็น override รายหน้าออก (~30 จุด)

### 🟡 x-surface.4 [TOKENS-03] เส้นขอบยังมี 2 สี 5 วิธีเขียน — border-hair / ring-hair / .hairline / border-border / ring-border ปนกันในจอเดียว
- **หน้า:** ทั้งแอป (เห็นชัดตรงการ์ดข้างกันขอบเข้มไม่เท่ากัน)
- **หลักฐาน:** Current counts (proto excluded): `border border-hair` 74 + `ring-1 ring-hair` 20 + `.hairline` utility 29 vs legacy `border-border` 59 + `ring-border` 14 — two different colors (--p-hair rgba translucent vs --border opaque #E5D9CE). Same-file collisions: alert-form.tsx:196,229 toggles between border-border (idle) and border-hair (hover); the kit's own EmptyState uses border-border (empty-state.tsx:128,175) while sibling kit components use border-hair; set-picker.tsx:135,217, admin-bulk-bar.tsx:44, messages/order-sidebar.tsx:145, marketplace create-wizard step-shipping.tsx:149-230 still on border-border. First half of TOKENS-03 done (border-[var(--p-hair)] = 0), second half ("กวาด border-border/ring-border ที่เหลือ") not.
- **ทางแก้:** ปิดงาน TOKENS-03 ส่วนที่เหลือ: codemod border-border→border-hair / ring-border→ring-hair ใน feature files (~73 จุด) เหลือ --border ไว้เฉพาะ primitive ของ shadcn ที่จำเป็น แล้วเลือกวิธีเขียนเดียวต่อบริบท (border-hair เป็นหลัก, .hairline เฉพาะกรณีห้าม clip มุม)

### 🟡 x-surface.5 [NEW] สวิตช์เปิด/ปิดเขียนมือโผล่ใหม่ใน portfolio ทั้งที่ kit มี Switch แล้ว — ตอนนี้มีสวิตช์ 3 ขนาดในแอป
- **หน้า:** portfolio (กล่องแก้ไขการ์ดรายใบ และแก้ไขหลายใบ)
- **หลักฐาน:** ui/switch.tsx is the canonical 44×24 Switch (docstring: "The one on/off Switch (SETTINGS-09)"). But src/components/portfolio/assets-table/single-edit-dialog.tsx:197-209 hand-rolls a `h-5 w-9` track + `size-4 rounded-full bg-white shadow-sm` knob, and bulk-edit-dialog.tsx:157-169 hand-rolls an even smaller `h-4 w-7` track + `size-3` knob — the exact pattern SETTINGS-09 eliminated from settings, alive in portfolio with two more divergent sizes (and shadow-sm knobs vs canonical shadow+ring). SETTINGS-09 scoped only settings ×2, so these were never tracked.
- **ทางแก้:** แทนสวิตช์เขียนมือทั้ง 2 จุดด้วย Switch จาก kit (ส่ง checked/onCheckedChange ได้ตรงๆ พฤติกรรมเดิม) ได้ทั้งหน้าตาเดียวกันทั้งแอปและพื้นที่กดมาตรฐาน ≥44px ฟรี

### 🟡 x-surface.6 [NEW] พาเนลเขียนมือ (border+bg+มุมโค้งประกอบเอง) ยังหลงเหลือแทนที่จะใช้ Surface — แต่ละจุดเพี้ยนกันคนละนิด
- **หน้า:** เมนูลัด (more-sheet ทุกหน้า), portfolio, โปรไฟล์สาธารณะ, คู่มือ, ตั้งค่า, ผู้ชนะ raffle, admin-login
- **หลักฐาน:** Hand-rolled panel blocks that Surface exists to replace: src/components/layout/more-sheet.tsx:93,105,125 (`rounded-xl border border-hair bg-card` ×3 in global nav sheet); portfolio-switcher.tsx:133 (same combo); add-card-detail-step.tsx:64,137 (`rounded-xl border border-hair bg-muted/20`); empty-profile-panel.tsx:30 (`rounded-2xl border-dashed bg-card`); reviews-tab.tsx:123 (`rounded-xl border border-hair bg-background/60` — yet another bg); winners-list.tsx:197; section-subscription.tsx:346 (`rounded-2xl border-amber-500/20 bg-amber-500/5`); guide/rarities/page.tsx:332 (`rounded-2xl border bg-card` — bare `border` = wrong hairline color); admin-login/page.tsx:84. Each picks its own radius (lg/xl/2xl), border token (hair vs bare border) and bg (card / muted-20 / background-60), so "a box" renders differently per page.
- **ทางแก้:** ไล่แทนด้วย Surface (variant outline/subtle + padding prop) จุดไหนที่ Surface ยังไม่มีท่า (เช่น เส้นประ) ให้เพิ่มเป็น variant กลางครั้งเดียวแทนการเขียนมือกระจาย

### 🟡 x-surface.7 [NEW] แท็บโปรไฟล์สาธารณะเขียน empty state เอง 4 จุด ไม่ใช้ EmptyState กลาง — หน้าว่างของโปรไฟล์หน้าตาคนละแบบกับทั้งแอป
- **หน้า:** โปรไฟล์สาธารณะ (แท็บของสะสม / ประกาศขาย / รีวิว, โปรไฟล์ส่วนตัว)
- **หลักฐาน:** Kit canon: shared/empty-state.tsx (Kuma bear, variants panel/dashed/error). Profile tabs hand-roll their own: collection-tab.tsx:82-97 (`size-14 rounded-2xl bg-muted/60` icon plate + copy + CTA), listings-tab.tsx:67, reviews-tab.tsx:73, private-profile-view.tsx:35 (`size-16 rounded-2xl bg-muted/60`) — same job as EmptyState with a different icon-plate surface, no Kuma, duplicated markup ×4.
- **ทางแก้:** ยุบทั้ง 4 จุดเข้า EmptyState (มี slot icon/action อยู่แล้ว) — ได้หน้าว่างภาษาเดียวทั้งแอป และแก้หน้าตาครั้งเดียวจบที่ component เดียว

### 🟡 x-surface.8 [NEW] popup เขียนเอง 2 จุด (กระดิ่งแจ้งเตือน, ปฏิทิน raffle) ทั้งที่ kit ห้ามคำนวณตำแหน่ง/portal เอง
- **หน้า:** header ทุกหน้า (กระดิ่ง), admin honey raffle
- **หลักฐาน:** AGENTS.md kit table for Popover: "ห้ามคำนวณตำแหน่ง/portal เอง". src/components/layout/notification-bell.tsx:133 hand-positions `absolute right-0 top-full z-50 ... shadow-lg` dropdown (no Escape/focus handling from Base UI, hardcoded shadow); src/app/admin/honey/raffle/raffle-form.tsx:521-523 builds its own `fixed inset-0` backdrop + `absolute left-0 top-full z-50 ... shadow-lg` calendar panel with bare `border`.
- **ทางแก้:** ย้ายทั้งสองจุดไปใช้ Popover/PopoverContent กลาง — ได้ตำแหน่ง, ปุ่ม Escape, focus behavior และเงา token ฟรี แล้วลบ backdrop/z-index เขียนมือทิ้ง

### ⚪ x-surface.9 [TOKENS-09] safe-area ยังเขียนแบบเก่าหลงเหลือ ทั้งที่มี .pb-safe utility พร้อม comment สั่งให้เลิกแล้ว
- **หน้า:** แบนเนอร์ความยินยอม (ทุกหน้า), toast ของ honey
- **หลักฐาน:** globals.css:415-421 defines .pb-safe with a comment saying to use it "instead of the repeated pb-[env(safe-area-inset-bottom)] arbitrary-value pattern", but src/components/ads/consent-banner.tsx:25 still uses `pb-[env(safe-area-inset-bottom)]` and src/app/honey/components/honey-toast.tsx:50 uses `bottom-[env(safe-area-inset-bottom,1rem)]`.
- **ทางแก้:** เปลี่ยน consent-banner มาใช้ .pb-safe · honey-toast ถ้าต้องเป็น bottom ให้เพิ่ม utility คู่ (.bottom-safe) ที่เดียวใน globals.css แล้วใช้ร่วม

### ⚪ x-surface.10 [KIT-13] ช่อง header/footer ของ Surface ไม่มีผู้ใช้ + มีบั๊กแฝง: ถ้าใครใช้จะได้พาเนลซ้อนพาเนล (พื้น+เงา 2 ชั้น)
- **หน้า:** ไม่มีหน้า (แฝงใน component กลาง)
- **หลักฐาน:** src/components/ui/surface.tsx:84-95 — when header/footer is passed, the body div gets `cn(surfaceVariants({ padding }))` with no variant, so defaultVariants kicks in and the inner div receives `.panel` again (nested bg + shadow + radius inside the outer panel). Grep confirms zero callers pass header=/footer= to Surface (all `header={` hits are AdminPage/AdminDataTable), so the slot is dead weight with a landmine.
- **ทางแก้:** เลือกทางเดียว: ลบ slot header/footer ทิ้ง (ไม่มีผู้ใช้) หรือแก้ให้ body ใช้ variant "ghost" — อย่าปล่อยกับดักไว้ใน primitive กลาง

### ⚪ x-surface.11 [NEW] เงาเล็กๆ หลุดบน chrome ชิ้นเล็ก + เอฟเฟกต์ยกการ์ดเขียนเองนอกระบบกลาง
- **หน้า:** โปรไฟล์สาธารณะ (การ์ดสะสม), header (ป้ายอัปเกรด), ปุ่มย้อน, admin sub-nav
- **หลักฐาน:** globals.css:469-497 defines .group-lift/.hover-lift as THE card-hover ("tuned in ONE place for the whole site"), but src/components/profile/public/cards/collection-card.tsx:49 hand-rolls `group-hover/binder:-translate-y-0.5 group-hover/binder:shadow-md` with different values. Small chrome shadows outside the allowed 3 surfaces: upgrade-badge.tsx:107 `shadow-sm` pill, back-button.tsx:30 `shadow-sm`, empty-profile-panel.tsx:31 `shadow-sm` icon plate, admin-sub-nav.tsx:92 active tab `shadow-sm` (canonical SegmentedControl active has no shadow).
- **ทางแก้:** collection-card เปลี่ยนไปใช้ .group-lift · ตัด shadow-sm บน pill/ปุ่ม/แท็บออก (ให้ hairline หรือสีพื้นทำงานแทน) เพื่อให้เงาเหลือความหมายเดียวคือ "ชั้นลอย"

### ⚪ x-surface.12 [NEW] ระยะห่างหลุดจังหวะ 4px scale ประปราย (gap-5 / gap-7 / p-7) + เลขมหัศจรรย์ pl-[52px]
- **หน้า:** หน้าชุด (set hero), คู่มือ, เกี่ยวกับ/ติดต่อ, admin config, การ์ดกริด
- **หลักฐาน:** VISION §4.5 pins the rhythm at gap-2/3/4/6. Off-rhythm steps: gap-5 ×8 (e.g. card-grid.tsx:12 `md:gap-5`, review-section.tsx:51, admin/config/page.tsx:259), gap-7 ×2 (set-hero.tsx:47 `sm:gap-7` + its loading twin), p-7 ×3 (guide/page.tsx:180, about-client.tsx:120, contact-client.tsx:83 `sm:p-7`). Magic number: bulk-edit-dialog.tsx:109 `pl-[52px]` alignment. All 4px-divisible but invent in-between steps the scale doesn't define.
- **ทางแก้:** ปัดเข้าขั้นที่ใกล้ที่สุด (gap-5→4 หรือ 6, p-7→p-6, gap-7→gap-6) ตอนแตะไฟล์นั้นๆ · pl-[52px] เปลี่ยนเป็นโครงสร้าง (spacer ความกว้างเท่ารูป) แทนเลขฝังมือ

<a id="x-color"></a>
## ✂️ วินัยสี (cross)

**ภาพรวม:** วินัยสีดีขึ้นชัดจาก audit รอบก่อน — จุดสีดิบลดจาก ~660 เหลือ ~193 จุด (ไม่นับสีที่เป็นข้อมูล เช่น สีการ์ด/rarity) และของที่แก้แล้วจริง ได้แก่ ป้ายสถานะออเดอร์ใช้ .status-*, หน้า admin-login เข้า token, ผู้ชนะหน้า compare เปลี่ยนเป็น honey, bookmark น้ำเงิน/จุดแดงบน header หายแล้ว ปัญหาใหญ่สุดที่เหลือคือ "ทองสองเฉด": amber ดิบทำหน้าที่เป็นสีระบบของ Honey/Pro/ล็อกทั่วแอปราว 80 จุด (รวมใน kit กลางอย่าง SegmentedControl และ CardItem) แข่งกับ honey token ตัวจริง ขัดกฎ "accent เดียว" ตรงๆ ส่วนเขียว/แดงที่สงวนไว้กำไร/ขาดทุนยังถูกยืมไปเป็นสถานะ "สำเร็จ/เคลมแล้ว" ทั่วโซน Honey และ % โอกาสดรอปใน drop-calculator เหมือนเดิม

### 🔴 x-color.1 [NEW] ทองสองเฉดทั่วแอป — amber ดิบทำหน้าที่เป็นสีระบบของ Honey/Pro/ล็อก (~80 จุด) แข่งกับ honey token
- **หน้า:** header, /more, /honey, /settings/subscription, /compare, /portfolio, โปรไฟล์, kit กลาง (SegmentedControl, UpgradeDialog, AlertForm)
- **หลักฐาน:** VISION §1: honey-gold = accent เดียว. But raw amber-500/600 is used as a de-facto second system color (~80 instances outside data/canon files): header.tsx:211 honey balance `text-amber-600 dark:text-amber-400`; more-client.tsx:155 same for honey points; honey-status-bar.tsx:101 multiplier pill amber; honey-toast.tsx:37,42 honey variant amber; honey-mock-preview.tsx:62-158 whole panels `border-amber-500/25 bg-amber-500/[0.04]`; section-subscription.tsx:346-356 upgrade CTA `<Button className="bg-amber-600 text-white hover:bg-amber-700">` (a gold CTA that is not honey primary), :402 usage bar `bg-amber-500`; segmented-control.tsx:271-272 kit atom locked state `hover:bg-amber-500/10 hover:text-amber-700` ; alert-form.tsx:230,234 Pro-locked option amber + `<Lock className="text-amber-600">`; upgrade-dialog.tsx:147,182; compare-client.tsx:304 `<Lock className="text-amber-500/60">`; portfolio-hub-card.tsx:113 + portfolio-selector.tsx:237 private-lock amber; profile-achievements.tsx:62-64,163-173; profile-hero.tsx:334-349 achievement pill amber. Meanwhile the same "gold" concept in header Pro badge already uses `bg-primary/15 text-primary` (header-constants.ts:35-36) — two golds on the same screens.
- **ทางแก้:** เคาะครั้งเดียวว่าทองมีกี่เฉด: ถ้าตั้งใจให้ Honey currency/Pro มีทองของตัวเอง ให้ประกาศ token กลาง (เช่น --gold หรือ --honey-currency) ใน globals.css แล้วกวาด amber-* ทั้งหมดมาอ่าน token นั้น; ถ้าไม่ตั้งใจ ให้ใช้ text-primary / bg-primary/15 แบบเดียวกับป้าย Pro บน header ที่แก้แล้ว เริ่มจาก atom กลางก่อน (SegmentedControl สถานะล็อก, UpgradeDialog, ปุ่มอัปเกรดใน settings) แล้วค่อยไล่รายหน้า — แก้ที่ atom ได้ผลทุกหน้าฟรี

### 🟡 x-color.2 [HONEY-08] โซน Honey ยังยืมเขียวกำไร (price-up) มาเป็นสถานะ "สำเร็จ/เคลมแล้ว/คัดลอกแล้ว" ทั้งระบบ
- **หน้า:** /honey ทุกแท็บ (missions, achievements, activity, referral, bonus)
- **หลักฐาน:** Still alive after 2026-07-04 audit: mission-card.tsx:38 `<CheckCircle2 className="text-price-up">` and :173 `claimed && "text-price-up"`; achievements-tab.tsx:99,127; _shared/bonus-row.tsx:49 `claimed ? "text-price-up" : "text-primary"`; _shared/claim-row.tsx:43; honey-toast.tsx:39,44 success variant `border-price-up/30`/`text-price-up`; referral-tab.tsx:110 copied state `<Check className="text-price-up">`; honey/types.ts:198 `TX_DEFAULT_POSITIVE = { bg: "bg-price-up/10", fg: "text-price-up" }`; activity-tab.tsx:142 mixes families: `positive ? "text-price-up" : "text-destructive"`. VISION §1 reserves green/red for P/L only. (streak-card instance from the original finding is fixed.)
- **ทางแก้:** เปลี่ยนสถานะ "เคลมแล้ว/สำเร็จ" เป็น honey (text-primary) หรือ muted + เครื่องหมายถูก ตามที่ finding เดิมเสนอ ส่วนรายการหักลบใน activity ใช้ muted แทน destructive และ toast สำเร็จใช้ .status-success — คงเขียว/แดงไว้ให้ตัวเลขราคาเท่านั้น

### 🟡 x-color.3 [TOKENS-01] ป้าย Pro ยังมี 3 แหล่ง 3 เฉด — hex ฝังมือเหลือใน LIFETIME_PRO, profile-types, tier-banner
- **หน้า:** header, โปรไฟล์สาธารณะ /u/[handle], /profile
- **หลักฐาน:** Partially fixed: header-constants.ts:35-36,38 PRO/PRO_PLUS now `bg-primary/15 text-primary` — but :37 LIFETIME_PRO still `bg-[#73533E]/15 text-[#73533E] dark:text-[#E0B865]` (hand-copied light-mode --primary hex); profile-types.ts:113 Pro+ `bg-amber-600 text-white` and :115 Pro `bg-[#73533E] text-white ring-[#A57E61]/30`; tier-banner.ts:8-12 PRO=`bg-amber-700 dark:bg-amber-900`, PRO_PLUS=`bg-yellow-600` — the same membership tier renders 3 different golds depending on surface.
- **ทางแก้:** รวมนิยามป้ายระดับสมาชิกเป็นแหล่งเดียว (TIER_DISPLAY ใน shared) แล้วอ่านจาก token: bg-primary/15 text-primary สำหรับป้ายโปร่ง และ bg-primary text-primary-foreground สำหรับป้ายทึบบนรูป cover — ลบ hex กับ amber/yellow ทิ้งทั้ง 3 ไฟล์

### 🟡 x-color.4 [NEW] CardItem (การ์ด grid ทางการที่ใช้ทุกหน้า) ทาป้าย "PSA 10" ด้วย amber ดิบ — ทองแปลกปลอมใน atom ที่ถูกใช้ซ้ำมากที่สุด
- **หน้า:** หน้าแรก, /search, /watchlist, /drop-calculator, /sets — ทุกหน้าที่มีมุมมอง grid
- **หลักฐาน:** card-item.tsx:182 `<span className="font-medium text-amber-500">PSA 10</span>` inside the canonical grid tile (AGENTS.md kit canon: "การ์ดในมุมมอง grid ทุกหน้า"). No other surface colors the PSA 10 label amber — card detail grade UI, price-mode-control, and market table all use neutral/token colors. One raw amber accent multiplied across every card grid in the app.
- **ทางแก้:** เปลี่ยนป้าย PSA 10 ใน CardItem เป็นสีตามระบบ — text-muted-foreground (ป้ายรอง) หรือ text-primary ถ้าต้องการเน้น — ให้ตรงกับหน้า card detail ที่ไม่ใช้ amber กับเกรดอยู่แล้ว จุดเดียวแก้ได้ทุกหน้า

### 🟡 x-color.5 [SETTINGS-08] หน้าลูก settings ยังสาดสีดิบ pink/blue/purple/amber บน icon tile และแถบการใช้งาน
- **หน้า:** /settings/export, /settings/marketplace, /settings/notifications, /settings/subscription
- **หลักฐาน:** Still alive: section-export.tsx:37 `bg-pink-100 ... text-pink-600`, :44 blue; section-marketplace.tsx:30 pink; section-notifications.tsx:82-83 blue, :104-105 amber, :115-116 purple, :246 `ring-amber-500/20`; section-subscription.tsx:402-404 usage bars `bg-amber-500`/`bg-blue-500`/`bg-purple-500`. Meanwhile /more uses semantic soft tokens (bg-info-soft, bg-success-soft) for identical tiles — same concept, two languages.
- **ทางแก้:** map icon tile กับแถบการใช้งานทุกตัวไปใช้ *-soft tokens ชุดเดียวกับ /more (มีครบใน globals.css แล้ว: info/success/warning/danger-soft + primary) — จอ settings จะกลับมา "chrome จืด" ตาม identity

### 🟡 x-color.6 [PLAY-09] drop-calculator ยังทาสีเขียวกำไร/แดง destructive ให้ % โอกาสดรอป — token ชุด chance ทำครึ่งเดียว
- **หน้า:** /drop-calculator
- **หลักฐาน:** Unchanged since audit: want-list.tsx:90 `chance >= 0.5 ? "text-price-up" : chance >= 0.1 ? "text-chance-mid" : "text-destructive"`, same pattern at :108 and :117 (`bg-price-up`/`bg-chance-mid`/`bg-destructive` progress bar). globals.css defines only --chance-mid; chance-high/low never created, so the scale borrows P/L green and error red.
- **ทางแก้:** เติม token --chance-high/--chance-low ใน globals.css (โทนแยกจาก price-up/down เช่น โทน honey เข้ม-อ่อน) แล้วให้ want-list อ่าน token ชุด chance ล้วน 3 ระดับ

### 🟡 x-color.7 [HONEY-09] สีตู้จับรางวัล (admin กรอก hex อะไรก็ได้) ยังถูกทาลงปุ่ม CTA และหัวข้อการ์ดตรงๆ — preset ใน admin มีทั้งเขียวและแดง
- **หน้า:** /honey (raffle tab), /raffle/winners, /admin/honey/raffle
- **หลักฐาน:** raffle-tab.tsx:305 `style={accent ? { color: accent } : undefined}` on card title, :401 and :464-465 `style={{ backgroundColor: accent, color: "#fff" }}` on the primary CTA buttons; accent = machine.color from admin. raffle-form.tsx:71-80 preset palette includes "#10b981" (green) and "#ef4444" (red) — so a green/red CTA that collides with P/L semantics is one admin click away, contrast unguaranteed, and honey stops being the only interactive accent.
- **ทางแก้:** จำกัด machine.color ไว้ชั้นตกแต่งเท่านั้น (แถบขอบบน/tint พื้นรูป แบบที่ winners-list ทำ) ปุ่มและหัวข้อคง token ปกติ และตัดเขียว/แดงออกจาก preset ใน admin เพื่อกันชนความหมายกำไร/ขาดทุน

### 🟡 x-color.8 [KIT-01] header เหลือหางจากรอบก่อน — ไอคอนพอร์ตสี amber ซ้อนใน pill ที่เป็น honey อยู่แล้ว + ยอด Honey สี amber
- **หน้า:** header ทุกหน้า (desktop)
- **หลักฐาน:** Mostly fixed (blue Bookmark, red-400 ping, amber watchlist star are gone — Heart uses text-primary, ping uses bg-danger, WatchlistHeart uses primary). Remaining: header.tsx:169 portfolio Briefcase icon `text-amber-500 dark:text-amber-400` when active, rendered inside a pill that is simultaneously `bg-[var(--p-honey-soft)] ... text-primary` — two golds in one control; :211 honey balance `text-amber-600 dark:text-amber-400`.
- **ทางแก้:** ไอคอนพอร์ตตอน active ใช้ text-primary เหมือนตัวหนังสือใน pill เดียวกัน และยอด Honey ใช้สีเดียวกับที่เคาะในข้อ "ทองสองเฉด" (token กลางตัวเดียว)

### 🟡 x-color.9 [CONTENT-09] หน้า guide ยังมีสีตกแต่งดิบหลาย hue + กล่อง callout ประกาศ tone เก่าว่า legacy แต่ยังเปิดให้ใช้
- **หน้า:** /guide/getting-started, /guide/rarities, /guide/buying
- **หลักฐาน:** getting-started/page.tsx:203-206 deck-needs cards orange/amber/rose, :267-280 DON!!/Life/Leader tiles amber/rose/orange, :366-376,:428-437 section icons amber/rose/blue; rarities/page.tsx:510-519 SR/R icon tiles purple/blue; guide-callout.tsx:6-15 still exports decorative tones blue/amber/rose/pink/red with its own comment "the decorative hues above are legacy"; buying/page.tsx:124,131 pros/cons `<Check className="text-emerald-500">` / `<X className="text-red-500">` instead of --success/--danger tokens. Card-color and rarity-tier hex (colors/rarities pages) are domain data and fine.
- **ทางแก้:** คงสีที่เป็นข้อมูลจริง (สีการ์ด/rarity) แล้วเปลี่ยนสีตกแต่งเป็น neutral + honey จุดเดียว, ✓/✗ ใช้ text-success-text/text-danger-text, และตัด tone เก่าออกจาก GuideCallout ให้เหลือ semantic tones (info/warning) ที่มีอยู่แล้ว — ไล่ migrate ผู้เรียกทีละหน้า

### 🟡 x-color.10 [TOKENS-07] งานกวาดสีสถานะดิบ → .status-*/semantic คืบแล้วแต่ยังไม่จบ (เหลือ ~193 จุดจาก 660)
- **หน้า:** ทั้งแอป (เหลือหนักที่ honey, settings, guide, โปรไฟล์, admin)
- **หลักฐาน:** Raw palette classes (amber/green/red/blue/purple/... -NNN) now ~193 instances outside data-color files (was 660 at audit time); .status-* adopted in 19 files including order-status-badge.tsx:11-38 (fully tokenized — good reference). Remaining clusters are the ones itemized in the other findings here (honey ~amber, settings tiles, guide, profile achievement chips, admin violet). Dead .status-warn class already removed.
- **ทางแก้:** เดินต่อตามแผนเดิม Phase 3: migrate เฉพาะสีที่มีความหมายเป็นสถานะทีละ feature โดยใช้ order-status-badge เป็นต้นแบบ — เหลือกลุ่มใหญ่ 4 กลุ่มตามข้ออื่นในรายงานนี้ ส่วนสีที่เป็นข้อมูล (สีการ์ด 6 สี, rarity, แรงค์ Bronze/Silver/Gold) ไม่ต้องแตะ

### ⚪ x-color.11 [ADMIN-05] admin เหลือสีนอกระบบเป็นหย่อม — violet ทั้งชุด AI/bulk + ป้ายประเภท Honey สายรุ้ง
- **หน้า:** /admin/yuyutei-matching, /admin/honey/*
- **หลักฐาน:** Partially fixed (green-600 buttons and duplicate StatusBadge from the original finding are gone; STATUS_TABS use semantic tokens). Remaining: yuyutei-ai-panel.tsx:25-81 entire panel violet-500/600/700; admin-bulk-bar.tsx:82-84 `bg-violet-600 text-white`; yuyutei-match-row.tsx:260,455 violet buttons; honey-shop-manager.tsx:40-45 per-type rainbow (purple/amber/blue/emerald/violet); honey-type-labels.ts:9-25 14 transaction types each with its own raw hue + hsl chartColor.
- **ทางแก้:** ถ้าจะให้ "งาน AI" มีสีประจำ ให้ประกาศเป็น token เดียว (เช่น --accent-ai) แทน violet กระจาย 4 ไฟล์ ส่วนป้ายประเภทธุรกรรม Honey ใน admin เป็นสีจำแนกข้อมูล พอรับได้ แต่ควรลดเหลือชุดสีที่เคาะไว้กลางที่เดียว — ทำท้ายคิวได้เพราะกระทบเฉพาะแอดมิน

### ⚪ x-color.12 [NEW] หน้ารายละเอียดสินค้า marketplace ใช้เขียวกำไรกับป้าย "คุ้มกว่าตลาด" — เขียว/แดงถูกยืมไปบอกความคุ้มของดีล
- **หน้า:** /marketplace/[listingId] (ปิด flag อยู่)
- **หลักฐาน:** marketplace/[listingId]/page.tsx:289 `diffPct < 0 ? "text-price-up" : "text-price-down"` — greener when listing is cheaper than market (deal quality, not P/L); :299 `<Badge className="bg-price-up/90 border-0 text-white">` best-deal badge painted solid green; :304 above-market uses `variant="destructive"` (error red family) — three semantics (P/L, deal, error) sharing two reds/greens on one screen.
- **ทางแก้:** ป้าย "คุ้ม N%" เปลี่ยนเป็น honey (จุดขายของแพลตฟอร์ม ไม่ใช่กำไรผู้ใช้) หรือ .status-success ส่วนแพงกว่าตลาดใช้ .status-warning — เก็บใน Phase 7 ก่อนเปิด flag marketplace

<a id="x-controls"></a>
## ✂️ control ซ้ำแบบ (cross)

**ภาพรวม:** โครง control กลางถือว่าแข็งแรงแล้ว — SegmentedControl/FilterModal/ToolbarSearch/ToolbarSortDropdown ถูกใช้ครอบเกือบทุกหน้า, pill ช่วงเวลามีไอคอนนำครบเกือบหมด, `<select>` ดิบเหลือแค่ฝั่ง admin ที่ตั้งใจ. จุดที่ยังทำให้ "รู้สึกคนละแอป" เหลือ 4 กลุ่ม: (1) ข้างใน FilterModal แต่ละหน้าเขียนปุ่ม facet เองจนชิป rarity หน้าตาต่างกันข้ามหน้า (2) card-detail ใช้สี "เลือกแล้ว" เป็น neutral สวนทางทั้งแอปที่ใช้ honey (3) หน้า ค้นหา บนมือถือกดเรียง/เปลี่ยนช่วงเวลาไม่ได้ทั้งที่หน้าอื่นทำได้ (4) โซน commerce (ปิด flag) ยังเป็นแพทเทิร์นเก่า — แท็บกล่องข้อความ/ช่องค้นหาเขียนเอง และตัวกรองสถานะผู้ซื้อ-ผู้ขายคนละแบบ.

### 🔴 x-controls.1 [NEW] ปุ่ม facet ใน FilterModal เขียนซ้ำเอง 5 หน้า — ชิป rarity หน้าตาไม่เหมือนกันข้ามหน้า
- **หน้า:** หน้าแรก (ตารางตลาด), ค้นหา, marketplace, portfolio (เพิ่มการ์ด), drop-calculator
- **หลักฐาน:** Every FilterModal consumer hand-rolls its own facet chip buttons: src/components/home/home-market-overview.tsx:270-299 (chips = border-primary/40 bg-primary/5, NO aria-pressed); src/app/search/search-client.tsx:286-305 (rarity chip active = solid RARITY_HEX background + text-white, aria-pressed present); src/components/portfolio/add-card-select-step.tsx:83-99 (RARITY_HEX solid, no aria-pressed); src/components/marketplace/marketplace-browse/browse-toolbar.tsx:24-93 (local `FacetChips` component with radio/pressed semantics, primary tint); src/components/drop-calculator/card-picker.tsx:142 (primary tint). Same facet (rarity) renders as a honey-tint outline chip on Home but a solid rarity-coloured chip on Search/Add-card — inside the same canonical modal. a11y also drifts (aria-pressed มี/ไม่มีสลับกัน).
- **ทางแก้:** แตก component กลาง `FacetChipGroup` (ต่อยอดจาก `FacetChips` ที่ marketplace เขียนไว้แล้ว — ตัวเดียวที่มี radio/pressed semantics ครบ) เข้า shared/ คู่กับ FilterModal ในตาราง kit ของ AGENTS.md แล้ว migrate ทั้ง 5 หน้า พร้อมเคาะดีไซน์ชิป rarity แบบเดียว (แนะนำ: ใช้จุดสี rarity + กรอบ primary แบบหน้าแรก เพื่อไม่ให้สีสาดใน modal) — แก้ครั้งเดียวได้ทั้งความสม่ำเสมอและ a11y

### 🔴 x-controls.2 [DISCOVERY-03] หน้า ค้นหา บนมือถือ (มุมมองการ์ด) กดเรียงลำดับ/เปลี่ยนช่วงเวลาไม่ได้ — หน้าอื่นทำได้
- **หน้า:** ค้นหา (เทียบกับ หน้าแรก, watchlist)
- **หลักฐาน:** src/app/search/search-client.tsx:237-247 wraps ToolbarSortDropdown in `<div className="hidden sm:block">` and :250-259 wraps the 24h/7d/30d period pill in `hidden sm:block` — both invisible below 640px. In grid view there is no fallback (table view gets MarketTable's built-in mobile sort, market-table.tsx:50,91). Meanwhile the same job is solved on mobile elsewhere: home grid shows the period pill at all sizes (src/components/home/home-market-overview.tsx:352-362) and watchlist gives mobile a full-width sort dropdown (src/app/watchlist/watchlist-toolbar.tsx:150-159). Mobile grid users see % change ที่เปลี่ยนช่วงเวลาไม่ได้ และเรียงผลลัพธ์ไม่ได้เลย
- **ทางแก้:** เอา `hidden sm:block` ออก แล้วจัดแถว control ของหน้า ค้นหา ตามแบบ watchlist (ช่องค้นหา + ชุด + เรียง + ตัวกรอง ในตาราง 2 คอลัมน์บนมือถือ) — pill ช่วงเวลาให้โชว์ทุกขนาดจอเหมือนหน้าแรก

### 🟡 x-controls.3 [KIT-10] สถานะ "เลือกแล้ว" บน card-detail ใช้สี neutral (bg-foreground/10) สวนทางทั้งแอปที่ใช้ honey
- **หน้า:** card-detail (เทียบกับทุกหน้า)
- **หลักฐาน:** Three controls on the trust-core page share a neutral selected state: EditionToggle (src/components/cards/card-detail/edition-toggle.tsx:31,45 `bg-foreground/10 text-foreground`), grade rail chips (src/components/cards/card-detail/card-detail-price.tsx:130-132 same classes), and ConditionFilter used in recent-sales + asks-rail (src/components/cards/card-detail/market-feed-shared.tsx:18 `SEGMENT_ACTIVE = "bg-foreground/10 text-foreground"`). The canonical active state is `bg-primary/15 text-primary` (src/components/ui/segmented-control.tsx:275-276) — used by the chart-range pill on the SAME page (card-detail-chart-section.tsx:65-75), so card-detail mixes two selected-state colour languages. VISION §1 กำหนดว่า honey = selected state; AGENTS.md tracks only the EditionToggle piece (KIT-10, deferred คู่ Phase 5 tap) แต่ scope จริงกว้างกว่า (ConditionFilter ×2 + grade rail)
- **ทางแก้:** ตอนทำ KIT-10/Phase 5 ให้กวาดทั้งครอบครัวเดียวกัน: EditionToggle → SegmentedControl และเปลี่ยน SEGMENT_ACTIVE + grade rail active เป็น bg-primary/15 text-primary (หรือถ้าเบสตั้งใจให้ card-detail เป็น neutral ทั้งหน้า ต้องจดกติกานี้ใน AGENTS.md และเปลี่ยน chart range ให้เข้าชุดเดียวกัน — ตอนนี้ครึ่งๆ กลางๆ)

### 🟡 x-controls.4 [COMMERCE-11] ตัวกรองสถานะออเดอร์: ฝั่งผู้ซื้อกับผู้ขายใช้ control คนละแบบ
- **หน้า:** orders (ผู้ซื้อ), seller/orders, seller/listings, seller/reviews
- **หลักฐาน:** Buyer orders (src/app/orders/page.tsx:140-178) renders a Select dropdown on mobile (`sm:hidden`) + SegmentedControl on desktop (`hidden sm:block`), while the seller side does the same job with a horizontally-scrolling SegmentedControl at ALL sizes (src/app/seller/orders/page.tsx:108-109, src/app/seller/listings/page.tsx:217-238, src/app/seller/reviews/page.tsx:173-174). The count badge span `rounded-full bg-muted px-1.5 text-xs tabular-nums` is also copy-pasted in all 4 files (orders/page.tsx:118, seller/listings:232, seller/orders:121, seller/reviews:113). Marketplace ปิด flag อยู่ — ยังไม่โดนผู้ใช้จริง แต่ต้องจบก่อนเปิด
- **ทางแก้:** เคาะแบบเดียว (แนะนำ SegmentedControl เลื่อนแนวนอน แบบฝั่งผู้ขาย — แตะครั้งเดียวถึง ไม่ต้องเปิด dropdown) ใช้ทั้งสองฝั่ง แล้วย้าย badge จำนวนไปเป็น helper/prop เดียว — เก็บใน Phase 7 ก่อนเปิด flag

### 🟡 x-controls.5 [NEW] แท็บกล่องข้อความเขียนเอง + สี active เป็น honey ทึบ (ผิดภาษา selected ของแอป)
- **หน้า:** messages
- **หลักฐาน:** src/components/messages/conversation-sidebar.tsx:65-82 hand-rolls the ทั้งหมด/ซื้อ/ขาย tab row as plain buttons with active = `bg-primary text-primary-foreground` (solid honey fill) — every other one-of-N control in the app uses SegmentedControl's `bg-primary/15 text-primary`. VISION §5.5 explicitly specs the inbox split as segmented. The sidebar also hand-rolls its search input (lines 84-94, Input + absolute Search icon, h-11 sm:h-8) instead of ToolbarSearch. โซนนี้ปิด flag อยู่
- **ทางแก้:** เปลี่ยนแถวแท็บเป็น SegmentedControl (ได้ keyboard/radiogroup ฟรี) และช่องค้นหาเป็น ToolbarSearch — เก็บใน Phase 7 คู่กับงานแชท (COMMERCE-09)

### 🟡 x-controls.6 [NEW] ช่องค้นหาเขียนเองต่างหน้าต่างแบบ ทั้งที่มี ToolbarSearch กลาง
- **หน้า:** seller/listings, portfolio (เพิ่มการ์ด), messages
- **หลักฐาน:** Canonical ToolbarSearch exists (src/components/ui/toolbar.tsx:66-138, min-h-11 + bg-muted/30 + clear button) but: src/app/seller/listings/page.tsx:242-251 hand-rolls an input (h-10, bg-background, focus:ring-primary — different height/fill/focus, no clear button); src/components/portfolio/add-card-select-step.tsx:423-445 hand-rolls another (h-11, bg-muted/30, own clear button) while its twin picker for the SAME job uses ToolbarSearch (src/components/drop-calculator/card-picker.tsx:73); src/components/messages/conversation-sidebar.tsx:85-93 rolls a third via Input. ผลคือช่องค้นหาสูง/สี/พฤติกรรมปุ่มล้างไม่เท่ากันข้ามหน้า
- **ทางแก้:** migrate ทั้ง 3 จุดเข้า ToolbarSearch (มี prop containerClassName/size รองรับ context ต่างกันอยู่แล้ว) — งานเชิงกลไก เสี่ยงต่ำ

### 🟡 x-controls.7 [NEW] แถบแท็บขีดเส้นใต้เขียนเอง 3 ที่ พฤติกรรมและสี active ไม่ตรงกัน ทั้งที่ kit มี Tabs variant="line"
- **หน้า:** หน้าแรก (ตารางตลาด), ชุดการ์ด (หน้ารวม), โปรไฟล์สาธารณะ
- **หลักฐาน:** Three hand-rolled underline tab bars drift from each other: src/components/home/home-market-overview.tsx:161-176 (plain buttons, no role=tab/no keyboard nav, active text = text-primary); src/app/sets/sets-page-client.tsx:103-131 (uses aria-pressed — wrong semantics for tabs, no keyboard nav, active = text-primary); src/components/profile/public/profile-tabs-nav.tsx:77-124 (full tablist + roving tabindex, but active text = text-foreground — different colour from the other two). Meanwhile ui/tabs.tsx:26-70 (Base UI, full a11y, `variant="line"` underline style) is already canon in the kit table and used by watchlist-tabs.tsx:10. หมายเหตุ: การใช้แบบขีดเส้นใต้ (ไม่ใช่ pill) ในบริบทเหล่านี้ = ตั้งใจ, ปัญหาคือเขียนเอง 3 สำเนาที่ไม่ตรงกันเอง
- **ทางแก้:** เคาะสี active label เดียว (primary หรือ foreground) แล้วยุบ 3 จุดเข้า Tabs variant="line" ของ kit (หรือแตก TabBar กลางถ้า Tabs ของ Base UI ผูก panel เกินจำเป็น) — ได้ keyboard/screen-reader ที่หน้าแรกกับชุดการ์ดฟรี

### ⚪ x-controls.8 [NEW] pill ช่วงเวลากราฟบน card-detail ไม่มีไอคอนนำ (CalendarRange) เหมือนกราฟหน้าอื่น
- **หน้า:** card-detail
- **หลักฐาน:** src/components/cards/card-detail/card-detail-chart-section.tsx:65-75 uses SegmentedControl variant="pill" without `leadingIcon`, while every other chart-range pill ships CalendarRange (src/components/portfolio/portfolio-scrub-chart.tsx:163,190,217; src/app/compare/compare-client.tsx:259) and every %-window pill ships TrendingUpDown (home-market-overview.tsx:357, watchlist-summary.tsx:31, set-detail-content.tsx:344,390, trending-tabs.tsx:254, search-client.tsx:257) — canonical per the 2026-07-07 filter-pill audit ที่เติมไอคอนไป 6 จุดแล้วแต่ตกจุดนี้
- **ทางแก้:** เติม `leadingIcon={CalendarRange}` หนึ่งบรรทัด (ทำได้ทันที ไม่ต้องรอ Phase 5)

### ⚪ x-controls.9 [NEW] FilterChips ใน shared/ เป็น component กำพร้า — เหลือแต่คนยืม type
- **หน้า:** ทั้งแอป (โค้ดตาย)
- **หลักฐาน:** src/components/shared/filter-chips.tsx (131 lines, dropdown-chip filter row) has zero consumers of the component itself — only the `FilterDefinition` type is imported (src/app/page.tsx:13, src/components/home/home-market-overview.tsx:7, both `import type`). ชื่อยังชนกับแนวคิด facet chips ที่แต่ละหน้าเขียนเองใน FilterModal ทำให้คน/AI หยิบผิดไฟล์ได้
- **ทางแก้:** ย้าย type FilterDefinition ไปไว้กับ market-types แล้วลบ component ทิ้ง (⚠️ ลบไฟล์ = ขออนุมัติเบสก่อน ตามกติกา) — หรือถ้าจะทำ FacetChipGroup กลางตามข้อแรก ใช้ชื่อ/ไฟล์นี้เป็นบ้านใหม่ไปเลย

### ⚪ x-controls.10 [NEW] ปุ่มเลือกช่วงเวลาใน admin (กราฟ Honey) เขียนเอง ไม่ใช้ SegmentedControl
- **หน้า:** admin/honey
- **หลักฐาน:** src/app/admin/honey/honey-charts.tsx:62-78 hand-rolls 7/14/30-วัน period buttons on a `bg-muted/50 p-0.5` track with active `bg-primary/15 text-primary` — visually mimicking SegmentedControl but without radiogroup/keyboard support. Neighbouring admin pages already migrated (src/app/admin/drop-rates/drop-rates-manager.tsx and src/app/admin/cards/cards-browser.tsx:288-291 use SegmentedControl/ViewModeControl). นี่คือ segmented เขียนมือจุดสุดท้ายที่เหลือทั้ง repo
- **ทางแก้:** สลับเป็น SegmentedControl (options 3 ตัว) — งาน 10 นาที ปิด backlog กลุ่ม A ของ audit ตัวกรองได้สนิท

### ⚪ x-controls.11 [NEW] FilterToolbar ประกาศเป็นตัวกลางแต่มีผู้ใช้จริงหน้าเดียว — docstring ชี้ทางผิด
- **หน้า:** marketplace (ผู้ใช้เดียว), หน้าแรก/ค้นหา/portfolio (ยังประกอบเอง)
- **หลักฐาน:** src/components/shared/filter-toolbar.tsx:54-67 docstring claims it "Replaces the bespoke filter rows in home-market-overview.tsx / browse-toolbar.tsx / assets-toolbar.tsx / search-client.tsx" but only browse-toolbar.tsx actually imports it; home (home-market-overview.tsx:157-252), search (search-client.tsx:193-270), portfolio assets-toolbar and watchlist all compose Toolbar primitives directly with bespoke row layouts. ไม่ผิดผลลัพธ์ทางสายตา (primitive เดียวกัน) แต่ comment โกหก = คนต่อไปสร้างแถวใหม่ซ้ำอีก
- **ทางแก้:** แก้ docstring ให้ตรงความจริง (canonical = ระดับ primitive; FilterToolbar = composition สำเร็จรูปทางเลือก) หรือตัดสินใจ migrate หน้าที่เหลือเข้า FilterToolbar จริงๆ ตอนทำ Phase 5 รายหน้า — อย่าปล่อยสถานะครึ่งกลาง

<a id="x-states"></a>
## ✂️ loading/empty/error (cross)

**ภาพรวม:** โครงหลักของระบบ state ถูกวางไว้ดีแล้ว — มี loading.tsx ครบ 36 segment, กติกากลาง (Skeleton / LoadingState / EmptyState / PageSkeleton) ครบ และหน้า commerce ที่เคยเป็น spinner (orders/saved/seller/messages) ย้ายมาใช้ skeleton เรียบร้อย แต่ยังมี "หางแถว" ที่ทำให้แต่ละหน้าให้ความรู้สึกไม่เหมือนกัน: หน้า settings 4 หน้ายังหมุน spinner สวนกฎศูนย์ spinner, หน้าแรกกลืน error เงียบๆ (ของเก่าค้างจอโดยไม่บอกอะไร), ข้อความ "ไม่มีข้อมูล" เปล่าๆ ไม่ผ่าน EmptyState กระจายอยู่ ~10 จุด และ skeleton หลายไฟล์รูปร่างไม่ตรงหน้าจริง (breadcrumb ผีบนมือถือ / saved / drop-calc) งานส่วนใหญ่คือเก็บกวาดให้ทุก async surface พูดภาษาเดียวกัน ไม่ใช่รื้อระบบ

### 🟡 x-states.1 [SETTINGS-07] หน้า settings 4 หน้า ยังโหลดข้อมูลด้วย spinner หมุน — สวนกฎศูนย์ spinner ทั้งที่หน้าพี่น้อง (alerts) ทำ skeleton ถูกแล้ว
- **หน้า:** /settings/addresses · /settings/billing · /settings/security · /settings/subscription
- **หลักฐาน:** src/components/settings/section-addresses.tsx:205-207 `loading ? <Loader2 className="size-5 animate-spin"/>` (address list) · section-billing.tsx:40-42 same pattern (billing history) · section-security.tsx:309-311 (loadingMfa) and 420-422 (loadingSessions) · section-subscription.tsx:371-372 (loadingPM). VISION §4 rule 6 = zero spinner; sibling /settings/alerts (alerts-manager-client.tsx:254-259) already renders Skeleton rows correctly, and LoadingState skeleton-list exists in the kit.
- **ทางแก้:** แทน spinner ทั้ง 5 จุดด้วย Skeleton รูปร่างตามเนื้อหาจริง (แถวที่อยู่ 2-3 แถว, แถวใบแจ้งหนี้, แถว session, การ์ดบัตรจ่ายเงิน) ตามแบบที่หน้า alerts ทำไว้แล้ว หรือใช้ LoadingState variant="skeleton-list" ให้จบในบรรทัดเดียว

### 🟡 x-states.2 [NEW] ตารางราคาหน้าแรกกลืนความผิดพลาดเงียบๆ — โหลดพลาดแล้วผู้ใช้เห็นข้อมูลเก่าค้างจอ ไม่มีข้อความ ไม่มีปุ่มลองใหม่
- **หน้า:** / (หน้าแรก — ตาราง market overview)
- **หลักฐาน:** src/hooks/use-market-cards.ts:53,105-107 sets `error` state on fetch failure (`setError("Failed to load cards")`) but keeps stale `cards`; src/components/home/home-market-overview.tsx consumes the hook (line 97 `const m = useMarketCards(...)`) yet `m.error` is never rendered anywhere in the file (grep for "error" = 0 hits). Contrast: /search handles the same situation properly (search-client.tsx:516 renders fetchError with retry).
- **ทางแก้:** เมื่อ m.error ไม่ว่าง ให้แสดง EmptyState variant="error" พร้อมปุ่ม "ลองใหม่" แบบเดียวกับหน้า /search และ /marketplace — เปลี่ยนแท็บ/ตัวกรองแล้วพังต้องรู้ตัว ไม่ใช่เห็นเลขเก่าเงียบๆ

### 🟡 x-states.3 [NEW] ข้อความ "ไม่มีข้อมูล" เปล่าๆ ไม่ผ่าน EmptyState กลาง กระจาย ~9 จุด — หน้าว่างแต่ละหน้าหน้าตาคนละเรื่อง
- **หน้า:** /trending · / (market overview) · /u/[handle] (แท็บ listings/reviews/collection) · market-table ทุกหน้าที่ใช้
- **หลักฐาน:** Plain `<p className="py-12 text-center text-sm text-muted-foreground">` instead of the canonical EmptyState kit: trending-tabs.tsx:264 and :313 (noData) · home-market-overview.tsx:369 (noData) · market-table.tsx:125 and :189 (emptyText, duplicated mobile/desktop) · profile/public/tabs/listings-tab.tsx:148, reviews-tab.tsx:187, collection-tab.tsx:174. EmptyState (shared/empty-state.tsx) has `variant="plain" size="sm"` and `appearance="minimal"` built for exactly this, and its own docstring (line 56) says it replaces this pattern.
- **ทางแก้:** กวาดทั้ง 9 จุดให้เรียก EmptyState (appearance="minimal" หรือ variant="plain" size="sm") — โดยเฉพาะจุดที่ว่างเพราะตัวกรอง ให้เติมปุ่ม "ล้างตัวกรอง" ไปด้วยในรอบเดียวกัน

### 🟡 x-states.4 [STATES-08] skeleton รูปร่างไม่ตรงหน้าจริงหลายไฟล์ — breadcrumb ผีโผล่บนมือถือ + saved/drop-calc/deck-calc โครงคนละแบบกับหน้าโหลดเสร็จ
- **หน้า:** /cards/[code] · /orders/[id] · /saved · /drop-calculator · /deck-calculator (+ทุกหน้าที่ใช้ PageSkeleton)
- **หลักฐาน:** Breadcrumb ghost: real breadcrumb hides on mobile (breadcrumb.tsx:64-69 `md:hidden` back button vs `hidden md:flex` trail) but page-skeleton.tsx:25-33 and cards/[code]/loading.tsx:7 draw the breadcrumb strip unconditionally → page jumps up when content arrives. Shape drift: saved/loading.tsx renders 8 list rows in a panel while the real page is a card grid `sm:grid-cols-2 lg:grid-cols-3` of aspect-[3/4] tiles (saved/page.tsx:157), and the in-page LoadingState skeleton-grid (saved/page.tsx:119-123, h-44 blocks in 2/3/4 cols) is a third shape; drop-calculator/loading.tsx still draws breadcrumb + lg:grid-cols-2 while the real first paint is a set-picker empty panel.
- **ทางแก้:** แก้ที่ตัวกลางจุดเดียวก่อน: เติม `hidden md:flex` ให้แถบ breadcrumb ใน PageSkeleton แล้ววาดปุ่มย้อนวงกลมแทนบนมือถือ จากนั้นปรับ saved (ทั้ง loading.tsx และ in-page) เป็น grid การ์ด 3:4 คอลัมน์เท่าหน้าจริง และ drop/deck-calculator วาดตามสภาพแรกจริงของหน้า

### 🟡 x-states.5 [STATES-07] หน้าว่างยังเป็นทางตัน ไม่มีปุ่มไปต่อ — ออเดอร์ว่างไม่ชวนไปตลาด, กรองการ์ดจนว่างไม่มีปุ่มล้างตัวกรอง
- **หน้า:** /orders · /sets · /sets/[setCode]
- **หลักฐาน:** orders/page.tsx:206-211 EmptyState `noOrdersYet` has no `action` prop (error state right above it does have retry) · sets-page-client.tsx:134 `<EmptyState variant="plain" title={t(lang,"noCardsFound")} />` no clear-filter action · set-detail-content.tsx:428-432 filtered-empty is still a bare `<div className="py-16 text-center...">{t(lang,"noData")}</div>` — not even EmptyState — with no reset button. VISION §4 rule 6: empty state ต้องมี illustration + 1 บรรทัด + CTA เดียว
- **ทางแก้:** เติม action ให้ครบ: orders ว่าง → ปุ่ม "ไปดูตลาด" (/marketplace) · sets และ set detail ที่ว่างเพราะตัวกรอง → ปุ่ม "ล้างตัวกรอง" รีเซ็ต facet กลับ all และเปลี่ยน set-detail ให้ใช้ EmptyState กลางด้วย

### 🟡 x-states.6 [COMMERCE-08] แชท: ช่องรายชื่อบทสนทนาว่างเป็นข้อความลอยๆ และหน้าแชทว่างไม่มีปุ่มพาไปเริ่มคุย
- **หน้า:** /messages · /messages/[listingId]
- **หลักฐาน:** conversation-sidebar.tsx:98-103 empty list = bare `<p className="text-sm text-muted-foreground">` (no EmptyState, no CTA) · chat-panel.tsx:146-152 empty thread now uses EmptyState minimal but still has no action (title `startConversation` only). Loading/error paths in the same files already migrated to the kit (chat-panel.tsx:127-145 has skeleton + retry) — empty is the one state left behind.
- **ทางแก้:** ใช้ EmptyState + ปุ่ม "ไปดูตลาด" (/marketplace) ใน sidebar ว่าง และคำแนะนำสั้นๆ ใน panel ว่า การคุยเริ่มจากหน้าประกาศขาย ให้ครบสามสถานะเหมือน loading/error ที่ทำแล้ว

### 🟡 x-states.7 [NEW] หน้า auth ทั้ง 4 โชว์คำว่า "Loading…" ภาษาอังกฤษกลางจอแทน skeleton — ก๊อปโค้ดเดียวกัน 4 ไฟล์
- **หน้า:** /login · /register · /forgot-password · /reset-password
- **หลักฐาน:** src/app/(auth)/login/page.tsx:14-18 `Suspense fallback={<div className="...">Loading…</div>}` — identical hardcoded-English centered text duplicated in register/page.tsx, forgot-password/page.tsx, reset-password/page.tsx (grep confirms 3 more copies). This is the prerendered HTML users see on every cold visit before hydration; the rest of the app shows shaped skeletons.
- **ทางแก้:** สร้าง fallback กลางตัวเดียว (skeleton ทรงฟอร์ม: โลโก้ + ช่องกรอก 2 แถว + ปุ่ม) ใช้ร่วมทั้ง 4 หน้า — ตัดคำภาษาอังกฤษออกจากแอปไทย และลดโค้ดซ้ำ 4 จุดเหลือ 1

### 🟡 x-states.8 [STATES-09] แท็บ achievements/rankings ใน Honey (ฝั่ง PLAY ที่ควรมีพลัง) ได้ empty แบบจืดสุดในแอป ไม่มีหมี ไม่มี CTA
- **หน้า:** /honey (แท็บ achievements, rankings)
- **หลักฐาน:** src/app/honey/components/empty-state.tsx:4-6 wraps shared EmptyState with `appearance="minimal"` (icon at 20% opacity + one muted line, no mascot, no action), used by achievements-tab.tsx:10 and rankings-tab.tsx:9. VISION §1 reserves the bear for empty states and marks PLAY surfaces as springy/delightful — this is the exact inversion the previous audit flagged and it is still in place.
- **ทางแก้:** เปลี่ยน wrapper ของ honey ให้ส่ง preset หมี + ปุ่มชวนทำต่อ (เช่น "ทำภารกิจแรก" ลิงก์ไปแท็บ missions) แทน appearance=minimal

### ⚪ x-states.9 [STATES-10] หน้า redirect โปรไฟล์ยังใช้ spinner ทำมือ (border-trick) ก๊อปซ้ำ 2 ไฟล์ — คนละภาษากับ loading อื่นทั้งแอป
- **หน้า:** /profile
- **หลักฐาน:** src/app/profile/(me)/page.tsx:40-42 and layout.tsx:17-19 both hand-roll `<div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"/>`. loading-state.tsx's own docstring (line 22-24) says it was built to replace exactly this "profile redirect" block, but the migration never happened.
- **ทางแก้:** แทนทั้ง 2 จุดด้วย skeleton บางๆ หรือ LoadingState ตัวกลาง แล้วลบ div ทำมือทิ้ง (หน้านี้เป็นแค่ทาง redirect — ใช้ของกลางจุดเดียวพอ)

### ⚪ x-states.10 [NEW] กระดิ่งแจ้งเตือนไม่โผล่จนกว่า API จะตอบ — โหลดพลาดแล้วกระดิ่งหายไปทั้งอันแบบเงียบๆ
- **หน้า:** ทุกหน้า (header)
- **หลักฐาน:** notification-bell.tsx:109 `if (!loaded) return null` and fetchNotifications (lines 51-61) only calls `setLoaded(true)` on success — `apiTry` returning null (network/API failure) leaves the bell unmounted forever, and even on success the icon pops into the header after the fetch round-trip. Also the price tab loading uses raw `animate-pulse` divs (line 229) instead of the Skeleton kit.
- **ทางแก้:** วางปุ่มกระดิ่งไว้ตลอด (badge ค่อยโผล่ตามข้อมูล) และถ้าโหลดพลาดให้เปิด dropdown แล้วเห็นข้อความ+ปุ่มลองใหม่ แทนการหายไปเฉยๆ · เปลี่ยน animate-pulse ดิบเป็น Skeleton

### ⚪ x-states.11 [NEW] skeleton ทำมือด้วย animate-pulse ดิบ 6 ไฟล์ ข้าม Skeleton กลาง — shimmer/มุมโค้งไม่เหมือนที่อื่น
- **หน้า:** /more · header (search, more sheet, กระดิ่ง) · /portfolio/[id] · /admin/image-matching
- **หลักฐาน:** Raw `animate-pulse ... bg-muted` divs instead of `<Skeleton/>`: more-client.tsx:182 · more-sheet.tsx:96-97 · hero-search-bar.tsx:217-220 · notification-bell.tsx:229 · portfolio-detail-client.tsx:48 (dynamic import loading) · admin/image-matching/image-match-client.tsx:190. page-skeleton.tsx:6-8 docstring explicitly warns raw animate-pulse "differs visually from <Skeleton/>'s shimmer + radius".
- **ทางแก้:** แทนทุกจุดด้วย <Skeleton/> จาก ui/skeleton.tsx (ขนาด/ทรงเดิม) ให้ shimmer เหมือนกันทั้งแอป

### ⚪ x-states.12 [NEW] โหลดข้อมูลใน dialog/แผงย่อยยังเป็นข้อความ "กำลังโหลด" เปล่าๆ — จุดเด่นสุดคือ dialog เพิ่มการ์ดเข้าพอร์ต
- **หน้า:** dialog เพิ่มเข้าพอร์ต (ทุกหน้าการ์ด) · /compare · admin (users, yuyutei/snkrdunk matching)
- **หลักฐาน:** card-add-to-portfolio.tsx:239-242 portfolio list loading = `<p>{t(lang,"loading")}</p>` · compare-client.tsx:326-330 bottom-of-page loading = plain centered text · admin/users/users-manager.tsx:396-399 detail sheet = "กำลังโหลด..." text · yuyutei-match-client.tsx:499-501 and snkrdunk-match-client.tsx:387-390 mobile list = "กำลังโหลดรายการ…" text. All are data loads (not button pending) that should be shaped skeletons per VISION §4 rule 6.
- **ทางแก้:** จุดฝั่งผู้ใช้ (add-to-portfolio, compare) เปลี่ยนเป็น Skeleton แถวเท่าจำนวนที่คาด · ฝั่ง admin ใช้ LoadingState skeleton-list กวาดในรอบเดียว

### ⚪ x-states.13 [NEW] watchlist ห่อด้วย Suspense fallback={null} — HTML แรกที่ server ส่งมาเป็นหน้าเปล่า จนกว่า JS จะพร้อม
- **หน้า:** /watchlist
- **หลักฐาน:** src/app/watchlist/page.tsx:15 `<Suspense fallback={null}>` around WatchlistTabs (a client component using useSearchParams). The prerendered HTML for direct visits contains nothing; watchlist/loading.tsx (a proper WatchlistSkeleton) only shows on client-side navigations, so cold loads flash a blank page before hydration.
- **ทางแก้:** ใช้ <WatchlistSkeleton/> (มีอยู่แล้วใน watchlist-skeleton.tsx) เป็น fallback แทน null ให้เปิดตรงๆ ก็เห็นโครงหน้าเหมือน navigate มา

### ⚪ x-states.14 [STATES-01] LoadingState ตั้งค่าเริ่มต้นเป็น spinner ทั้งที่กฎคือศูนย์ spinner — เป็นกับดักให้คนเขียนหน้าใหม่พลาด
- **หน้า:** component กลาง (shared/loading-state.tsx)
- **หลักฐาน:** loading-state.tsx:33 `variant = "spinner"` is still the default even though every current call site (8 files: orders, saved, seller ×3, chat-layout, chat-panel, marketplace-browse) now explicitly passes a skeleton variant — the spinner branch (lines 89-104) survives only as a default-trap. The 2026-07-04 audit already proposed flipping the default.
- **ทางแก้:** เปลี่ยน default เป็น skeleton-list แล้วพิจารณาลบ variant spinner ทิ้ง (เหลือไว้เฉพาะถ้ามีที่ใช้จริง) — ปิดประตูไม่ให้ spinner กลับมาเอง

### ⚪ x-states.15 [STATES-04] หน้า error หลักยังทำปุ่ม/เลย์เอาต์เอง ไม่ใช้ Button + EmptyState ของระบบ — หน้าตาไม่เข้าชุดกับ error state อื่น
- **หน้า:** ทุกหน้า (error boundary)
- **หลักฐาน:** src/app/error.tsx now has Thai copy + retry + home link (the dead-end part of STATES-04 is fixed) but still hand-rolls: raw inline SVG icon (lines 22-35), raw-class buttons (lines 52-63) instead of <Button>, and its own layout instead of EmptyState variant="error" that every in-page error uses.
- **ทางแก้:** ประกอบใหม่ด้วย EmptyState variant="error" + <Button> สองปุ่มเดิม (ลองใหม่ / กลับหน้าแรก) ให้หน้าตาเดียวกับ error ในหน้าอื่นทั้งแอป

### ⚪ x-states.16 [STATES-12] หน้า critical error ยังใช้สีเทาเย็น #1C1C1E ไม่ใช่ espresso ของแบรนด์
- **หน้า:** ทุกหน้า (global error)
- **หลักฐาน:** src/app/global-error.tsx:19 hardcodes `backgroundColor: "#1C1C1E"` with English-only copy ("Critical Error") — comment claims it mirrors the app's CSS variables but the real canvas is espresso #100C09 (VISION §1). Unchanged since the previous audit.
- **ทางแก้:** แก้ค่าสี hardcode ให้ตรง token ปัจจุบัน (#100C09 + warm foreground) และแปลข้อความเป็นไทย — ไฟล์นี้ต้อง inline style อยู่แล้ว แก้แค่ค่า

### ⚪ x-states.17 [NEW] admin ทุกหน้าลูกใช้ skeleton หน้า dashboard ร่วมกันไฟล์เดียว — เข้า/admin/cards เห็นโครง KPI 4 ใบทั้งที่หน้าจริงเป็นตาราง
- **หน้า:** /admin/* (ทุกหน้าลูก ~20 หน้า)
- **หลักฐาน:** src/app/admin/loading.tsx is the only loading boundary in the whole admin tree (4 KPI tiles + 4 panels, dashboard-shaped) — no sub-segment has its own loading.tsx, so navigating to table pages (cards, users, logs, honey/*) flashes the dashboard skeleton then swaps to a completely different table layout.
- **ทางแก้:** เพิ่ม loading.tsx ทรงตาราง (TableSkeleton จาก page-skeleton.tsx มีอยู่แล้ว) ให้ segment ที่เป็นตารางหนักๆ อย่าง cards/users/logs — ไม่ต้องครบทุกหน้า เอาเฉพาะหน้าที่เข้าบ่อย

<a id="x-icons-copy"></a>
## ✂️ ไอคอน + สำนวน (cross)

**ภาพรวม:** ภาษาไอคอนดีขึ้นมากจากรอบ audit ก่อน — หัวใจ=รายการจับตา, กระเป๋า=พอร์ต ตรงกันทั้งแอปแล้ว, ชื่อแท็บ nav ตรงกันทุกจอแล้ว (IA-NAV-06 แก้แล้ว), แท็บ Honey มือถือมีป้ายชื่อแล้ว (HONEY-01 แก้แล้ว) แต่ปัญหาที่เหลือย้ายไปอยู่ที่ "ชื่อเรียก" แทน: watchlist มีชื่อไทย 3 ชื่อ + อังกฤษอีก 1 โผล่พร้อมกันบนจอเดียว และข้อความหน้าว่างยังสอนให้ "กดดาว" ทั้งที่ไอคอนเปลี่ยนเป็นหัวใจไปแล้ว ฝั่งไอคอนเหลือกระดิ่งที่ถูกใช้ 2 ความหมาย (แจ้งเตือนระบบ vs แจ้งเตือนราคา) และงานกวาดข้อความ hardcode (R3) ยังค้างอยู่ราว 120+ ไฟล์ ทำให้ผู้ใช้ภาษาอังกฤษ/ญี่ปุ่นเจอไทยปนเป็นระยะ

### 🔴 x-icons-copy.1 [TRACK-03] Watchlist ถูกเรียก 4 ชื่อ — 3 ชื่อโผล่พร้อมกันบนจอเดียว
- **หน้า:** /watchlist · bottom-nav · การ์ดทุกใบ (tooltip) · /register · /settings/export · /pricing · /honey (missions)
- **หลักฐาน:** Same screen, three names: page h1 uses watchlistNav = "รายการโปรด" (src/app/watchlist/watchlist-tabs.tsx:70 + src/lib/i18n/th.ts:17), the tab right under it uses watchlistTabCards = "การ์ดที่ติดตาม" (watchlist-tabs.tsx:24 + th.ts:510), and the empty state says "ยังไม่มีการ์ดในรายการจับตา" (th.ts:343 via src/components/shared/empty-state.tsx:77). "รายการจับตา" also at th.ts:763 (watchlist), :732 (exportWatchlist), :668/:1331 (feature limits), :820 (showcase). Fourth name = English loanword: registerSubtitle "สร้างบัญชีเพื่อใช้งาน Portfolio และ Watchlist" (th.ts:1140), missionCheckWatchlistHint "เช็คการ์ดที่จับตาในหน้า Watchlist" (th.ts:901). EN/JP are internally consistent ("Watchlist"/"ウォッチリスト" everywhere) — only Thai splinters. Icons are now unified (Heart everywhere) so the icon half of TRACK-03 is fixed; the naming half is still live.
- **ทางแก้:** เคาะชื่อไทยทางการชื่อเดียว (แนะนำ "รายการจับตา" เพราะตรงหน้าที่ติดตามราคามากกว่า "รายการโปรด" ที่ให้ความรู้สึกว่าเป็นของชอบเฉยๆ) แล้วกวาดทุก key ใน th.ts ให้ใช้คำเดียวกัน รวมถึงเลิกเขียน "Watchlist" ทับศัพท์ในประโยคไทย (หน้า register + ภารกิจ Honey)

### 🟡 x-icons-copy.2 [NEW] หน้ารายการจับตาว่างยังสอนให้ "กดดาว" ทั้งที่ไอคอนเปลี่ยนเป็นหัวใจแล้ว
- **หน้า:** /watchlist (สถานะว่าง — จังหวะเริ่มใช้งานครั้งแรกของแท็บหลัก)
- **หลักฐาน:** th.ts:344 emptyWatchlistDesc = "กดดาวที่การ์ดที่สนใจเพื่อติดตามราคา", en.ts:344 = "Star cards you're interested in to track prices", jp.ts:344 = "スターを付けて" — but the actual control is a Heart: src/components/shared/watchlist-heart.tsx:89 renders <Heart> (file itself was renamed from watchlist-star), and no star-shaped watchlist button remains anywhere (Star imports now only in rating-stars/reviews). Copy was missed during the Star→Heart migration; a new user follows the instruction and cannot find any star.
- **ทางแก้:** แก้ข้อความ 3 ภาษาให้ตรงของจริง เช่น "กดรูปหัวใจที่การ์ดที่สนใจเพื่อติดตามราคา" / "Tap the heart on cards..." / "ハートを付けて..."

### 🟡 x-icons-copy.3 [NEW] กระดิ่ง 2 แบบสำหรับแจ้งเตือนราคา และกระดิ่งแบบเดียวกันมี 2 ความหมาย
- **หน้า:** /watchlist · /more · เมนูผู้ใช้บน header · MoreSheet · header มือถือ · หน้าการ์ด · /settings
- **หลักฐาน:** Price alerts render as Bell on the destination surfaces: watchlist alerts tab (src/app/watchlist/watchlist-tabs.tsx:25), row markers (watchlist-list-view.tsx:318,436), filter toggle (watchlist-toolbar.tsx:459), card-detail set-alert button (src/components/cards/card-detail/card-detail-identity.tsx:53) — but every menu link to that same destination /watchlist?tab=alerts uses BellRing (src/app/more/more-client.tsx:236, src/components/layout/header-user-menu.tsx:256, src/components/layout/more-sheet.tsx:65). Meanwhile Bell is double-booked for the system notification feed in the mobile header (src/components/layout/notification-bell.tsx:124) and settings notifications (src/app/settings/settings-shell.tsx:39). Bonus mismatch: honey mission "เช็คพอร์ต" uses icon "Wallet" (src/lib/honey/missions.ts:80) while portfolio = Briefcase everywhere else (bottom-nav.tsx:22, header.tsx:165, more-client.tsx:224).
- **ทางแก้:** ล็อก 1 ไอคอน = 1 ความหมาย: เลือกกระดิ่งแบบเดียว (แนะนำ BellRing) ให้ "แจ้งเตือนราคา" ทุกจุด ทั้งปุ่มบนแถว/แท็บ/เมนู แล้วสงวน Bell ธรรมดาให้ "การแจ้งเตือนระบบ" อย่างเดียว · เปลี่ยนไอคอนภารกิจเช็คพอร์ตจาก Wallet เป็น Briefcase

### 🟡 x-icons-copy.4 [R3] ข้อความ hardcode ไทย/อังกฤษไม่ผ่านระบบแปล — ผู้ใช้ EN/JP เห็นไทยปน (R3 ยังค้าง)
- **หน้า:** หน้า error ทั้งเว็บ · /blog · /blog/[slug] · หน้าแรก (FAQ) · marketplace ลงประกาศ · /seller
- **หลักฐาน:** src/app/error.tsx:37-62 — error page is all hardcoded Thai ("เกิดข้อผิดพลาด", "ลองใหม่", "กลับหน้าแรก") with no t(); EN/JP users crash into Thai. src/app/blog/page.tsx:22-26 category labels hardcoded Thai, no language handling in the whole file. src/app/blog/[slug]/page.tsx:65-76 related-pages list mixes hardcoded English titles ("Trending", "Market Overview", "Marketplace") with hardcoded Thai titles ("ชุดการ์ด", "ตลาดราคา") in the same block, + :185 title="เพิ่มเติม". Shared component defaults leak Thai to all languages: src/components/shared/faq-section.tsx:11 default "คำถามที่พบบ่อย" rendered on home via home-seo-content.tsx:180; related-pages.tsx:14 default "เพิ่มเติม". src/components/marketplace/create-wizard/step-shipping.tsx:23-29 province list + string compare "อื่น ๆ" at :166. Sweep found ~122 tsx files containing Thai strings; PLAN.md:411-412 tracks this as R3 (152 files).
- **ทางแก้:** ทำ R3 เป็นชุดๆ ตามที่วางไว้ แต่จัดลำดับใหม่ให้เริ่มจากจุดที่ผู้ใช้ทุกภาษาเจอ: หน้า error → ค่า default ของ component กลาง (FaqSection/RelatedPages ให้ caller ส่งข้อความเสมอหรืออ่านจาก t()) → blog → marketplace

### 🟡 x-icons-copy.5 [NEW] ชื่อฟีเจอร์สลับไทย/ทับศัพท์ข้ามหน้า — ฟีเจอร์เดียวมี 2-3 ชื่อ
- **หน้า:** /pricing · /about · /honey (missions) · /register · /opcg/market-overview · nav ทุกจอ
- **หลักฐาน:** Drop calculator: nav = "คำนวณดรอป" (th.ts:9,507) but pricing FAQ says "Drop Calculator" (th.ts:661) and about page "Drop Calculator, Deck Calculator" (th.ts:1806). Deck: nav = "สร้างเด็ค" (th.ts:10) vs "คำนวณราคาเด็ค" (th.ts:2231) vs "Deck Calculator" (th.ts:1806). Sets: nav = "ชุดการ์ด" (th.ts:3) but market-overview stats say "จำนวนเซ็ต"/"เซ็ตที่มูลค่าสูงสุด" (th.ts:1083,1085) and mission "สำรวจเซ็ตการ์ด" (th.ts:894) — สลับ ชุด/เซ็ต. Missions write loanwords in Thai sentences: "เข้าดู Marketplace" (th.ts:892-893), "หน้า Watchlist" (th.ts:901). Register: "Portfolio และ Watchlist" (th.ts:1140) while nav says พอร์ตโฟลิโอ/รายการโปรด. Matches owner's stated preference for pure-Thai copy.
- **ทางแก้:** เพิ่มตาราง "ชื่อเรียกทางการ" (1 ฟีเจอร์ = 1 ชื่อไทย) ไว้ใน AGENTS.md ข้างตาราง Component Kit แล้วกวาด th.ts ให้ตรงตาราง — ชุดการ์ด (ไม่ใช้เซ็ต) · คำนวณดรอป · สร้างเด็ค · พอร์ต · รายการจับตา ฯลฯ

### ⚪ x-icons-copy.6 [NEW] ไอคอน "แก้ไข" ใช้ 2 แบบ (Pencil กับ Edit2) แม้ในตารางเดียวกัน
- **หน้า:** /portfolio (ตารางสินทรัพย์) · /watchlist · /settings · /seller
- **หลักฐาน:** In the same portfolio assets table: bulk-edit button uses Edit2 (src/components/portfolio/assets-table/assets-toolbar.tsx:3,82) while the per-row edit button uses Pencil (assets-table/action-menu.tsx:3,27) — both render on one screen (desktop-row.tsx:19, index.tsx:11). App-wide: Pencil in 20 files (watchlist-toolbar.tsx:6, settings/alerts/alert-row.tsx:146, settings/account-profile-info.tsx:303, seller/listings/page.tsx, admin ×10) vs Edit2 only in 4 portfolio files (portfolio-hub-card.tsx:147, portfolio-manager.tsx:358, portfolio-selector.tsx:275, assets-toolbar.tsx:82).
- **ทางแก้:** เลือกไอคอนแก้ไขตัวเดียว (แนะนำ Pencil ที่ใช้เยอะสุด) แล้วเปลี่ยน 4 จุดใน portfolio ให้ตรงกัน — งานกวาดสั้นๆ ไฟล์เดียวต่อจุด

### ⚪ x-icons-copy.7 [RESPONSIVE-02] ปุ่มไอคอนล้วนยังขาด aria-label เหลือ 8 จุด (จากเดิม ~18)
- **หน้า:** /honey (toast) · dialog เพิ่มการ์ดเข้าพอร์ต · /admin
- **หลักฐาน:** Remaining after the earlier sweep: honey toast close X (src/app/honey/components/honey-toast.tsx:58 — bare <button> with only <X/>), add-card back button (src/components/portfolio/add-card-detail-step.tsx:50 — ArrowLeft only), admin-shell.tsx:165 (LogOut) + :296 (PanelLeft), snkrdunk mapping-row.tsx:141,161,170 (RefreshCw/Check/X), honey-transaction-list.tsx:179 (ChevronDown). Previously-flagged spots are now fixed (search-client.tsx:174, add-card-select-step.tsx:439/499 all have aria-label) so this is the residue of RESPONSIVE-02.
- **ทางแก้:** เติม aria-label ผ่าน t() ทั้ง 8 จุด หรือเปลี่ยนไปใช้ IconButton ของ kit ที่บังคับ aria-label อยู่แล้ว

### ⚪ x-icons-copy.8 [NEW] aria-label ที่มีอยู่ ~20 จุดเป็นอังกฤษ hardcode — ผู้ใช้โปรแกรมอ่านจอภาษาไทยได้ยินอังกฤษ
- **หน้า:** /more · /orders · แชท · /settings · ค้นหา · ทั่วแอป
- **หลักฐาน:** 20 hardcoded-English aria-labels in user-facing code while the repo convention is aria-label={t(lang,...)} (used 180+ places): more-client.tsx:301/323 "Language"/"Currency", orders/page.tsx:146 "Filter orders by status", chat-panel.tsx:91/115 "Go back"/"Toggle order panel", chat-layout.tsx:430 "Close order panel", account-profile-hero.tsx:52 "Change avatar", scroll-to-top.tsx:39 "Scroll to top", card-mini-preview-dialog.tsx:66 "Close", command-search.tsx:234 + hero-search-bar.tsx:181 "Clear search", hero-search-bar.tsx:330 "Remove", watchlist-skeleton.tsx:7 "Loading watchlist", conversation-sidebar.tsx:58 "Back to site", ui/toolbar.tsx:131 "Clear".
- **ทางแก้:** เปลี่ยนเป็น t() key ที่มีอยู่แล้ว (close/clearAll/back ฯลฯ มีครบ 3 ภาษา) — เก็บไปพร้อมชุดงาน R3 ได้

### ⚪ x-icons-copy.9 [KIT-01] ไอคอนลัดบน header desktop ยังใช้สีดิบ/ไม่เท่ากัน — Briefcase สีส้ม amber แต่ Heart สี honey ค้างถาวร
- **หน้า:** header desktop ทุกหน้า
- **หลักฐาน:** src/components/layout/header.tsx:165-171 — Briefcase uses raw text-amber-500/dark:text-amber-400 when active (not the honey token its own active pill uses); header.tsx:187 — sibling Heart is text-primary permanently even when inactive (VISION §1: chrome icons = neutral, honey < 5% of screen); header.tsx:211 honey counter also raw text-amber-600/amber-400. Original KIT-01 blue Bookmark is gone, but the amber-vs-honey split between two adjacent quick-links remains.
- **ทางแก้:** ให้ไอคอน quick-link เป็น neutral (muted-foreground) ตอน inactive และ text-primary ตอน active เหมือนกันทั้งคู่ · เลิก amber-500 ดิบ (ถ้าตั้งใจใช้โทนทองของ Honey ให้ประกาศเป็น token)

<a id="x-tap-a11y"></a>
## ✂️ tap target + a11y (cross)

**ภาพรวม:** งานกวาด tap ≥44px ระดับ atom สำเร็จแล้วจริงบน master — Button/SegmentedControl/Select/IconButton/QtyStepper มี min-h-11 หรือ tap-safe, SegmentedControl ได้ keyboard nav + focus ring จริง, มี reduced-motion ครอบ CSS animation ทั้งแอป และ aria-current ครบ ทำให้ finding เก่าส่วนใหญ่ (RESPONSIVE-01/02/05/07/09, IA-NAV-08, CARD-DETAIL-07, SETS-01 ฝั่ง atom, HONEY-13) ปิดแล้ว. ที่เหลือแบ่ง 3 กลุ่ม: (1) เศษระดับหน้า/feature ที่แก้ที่ atom กลางไม่ถึง (sets, drop-calculator, honey missions, compare bar, ปุ่ม × ประวัติค้นหาหน้าแรกที่มองไม่เห็นบนจอสัมผัส) (2) ของใหม่ที่ drift จากมาตรฐานที่เพิ่งวางเอง (Tabs ไม่มีฐาน 44px มือถือ, SetPicker/กระดิ่งแจ้งเตือนเขียนกล่องลอยเองไม่มี Escape, ไฟล์กำพร้าใน watchlist) (3) การเคลื่อนไหวฝั่ง JS (smooth scroll + framer-motion) ที่หลุดจากตาข่าย reduced-motion ของ CSS. ไม่มีข้อไหนถึงขั้นทำแอปพัง แต่รวมกันคือรอยรั่วที่จะขยายถ้าโค้ดใหม่ยัง copy แบบผิดต่อ.

### 🟡 x-tap-a11y.1 [NEW] ปุ่มลบ/ล้างประวัติค้นหาในช่องค้นหาหน้าแรก มองไม่เห็นบนจอสัมผัส เล็กเกินเกณฑ์ และหลุดจากคีย์บอร์ด
- **หน้า:** / (hero search)
- **หลักฐาน:** src/components/home/hero-search-bar.tsx:325-333 — per-row remove button: `opacity-0 ... group-hover:opacity-100` (no hover on touch → invisible on mobile), `tabIndex={-1}` (keyboard-excluded), `focus-visible:outline-none` with NO ring replacement (focus indicator removed), `p-1.5` + size-3.5 icon ≈26px, aria-label="Remove" hardcoded English (line 330). Clear-all button lines 297-303: `px-1.5 py-0.5 text-meta` ≈24px tall.
- **ทางแก้:** โชว์ปุ่ม × ตลอดเวลาบนจอสัมผัส (ตัด opacity-0 ใต้ md หรือใช้ media pointer:coarse) + เติม tap-safe, ใส่ focus-visible:ring แทนการปิด outline เปล่าๆ, รองรับการลบผ่านคีย์บอร์ด (ปุ่ม Delete ใน keyboard nav หรือเลิก tabIndex=-1), ย้าย aria-label เข้า i18n และขยายปุ่มล้างทั้งหมดให้ถึงเกณฑ์แตะ

### 🟡 x-tap-a11y.2 [NEW] SetPicker กับกระดิ่งแจ้งเตือนยังเขียนกล่องลอยเอง — กด Escape ปิดไม่ได้ ไม่มีบทบาทให้โปรแกรมอ่านจอ ทั้งที่มี Popover กลางแล้ว
- **หน้า:** ทุกหน้า (header) · หน้าแรก · market overview
- **หลักฐาน:** src/components/shared/set-picker.tsx:100-108 — click-outside via `document.addEventListener("mousedown")` only, no Escape / no focus management; trigger :123-127 has aria-expanded but no aria-haspopup/aria-controls; panel :216+ is a plain absolute div with no role. src/components/layout/notification-bell.tsx:87-94 same pattern, panel :133 hand-positioned `absolute right-0 top-full` with `shadow-lg` (not --elev-overlay). AGENTS.md kit canon declares Popover canonical: "ห้ามคำนวณตำแหน่ง/portal เอง".
- **ทางแก้:** ย้ายทั้งสองจุดไปประกอบบน Popover กลาง (ได้ Escape, focus behavior, ตำแหน่ง และบทบาทฟรี) — SetPicker เป็น control เด่นที่ผู้ใช้แตะบ่อยสุดตามพฤติกรรม browse-by-set จึงคุ้มทำก่อน

### 🟡 x-tap-a11y.3 [NEW] Tabs (ui/tabs.tsx) เป็น atom เดียวในชุดที่ยังไม่มีฐานแตะ 44px บนมือถือ — คนใช้ต้องจำไปแก้เองทีละจุดและมีจุดหลุดแล้ว
- **หน้า:** /watchlist · กระดิ่งแจ้งเตือน (และผู้ใช้ Tabs รายต่อไป)
- **หลักฐาน:** src/components/ui/tabs.tsx:27 TabsList `h-8` (32px), :61 trigger `h-[calc(100%-1px)]` ≈31px — ไม่มี min-h-11 มือถือ ต่างจากพี่น้องทุกตัว: button-variants.ts (ทุก size มี min-h-11 sm:min-h-0), segmented-control.tsx:239 (h-11 min-w-11), select.tsx:53 (min-h-11 sm:min-h-0). ผล: caller ต้อง patch เอง — src/app/watchlist/watchlist-tabs.tsx:97,103 เติม h-11/min-h-11 เองแล้ว แต่ src/components/layout/notification-bell.tsx:150 ไม่ได้เติม → แท็บ ระบบ/ราคา ในกระดิ่ง ~31px บนมือถือ
- **ทางแก้:** เพิ่มฐานมือถือใน TabsList/TabsTrigger เอง (min-h-11 + md: กลับขนาดกะทัดรัด แบบเดียวกับ Button/SegmentedControl) แล้วถอด override รายหน้าที่ watchlist ออก — แก้ไฟล์เดียวได้ทั้งแอปและกันจุดหลุดใหม่

### 🟡 x-tap-a11y.4 [NEW] ปุ่มแชร์ภารกิจ Honey เขียนเองซ้ำกัน 2 ไฟล์ สูงแค่ 32px ทั้งที่ปุ่มรับรางวัลข้างกันใช้ Button ได้ 44px
- **หน้า:** /honey (missions)
- **หลักฐาน:** src/app/honey/components/monthly-missions.tsx:115-121 and src/app/honey/components/today-missions-card.tsx:116-123 — identical raw `<button className="inline-flex h-8 items-center gap-1 rounded-lg border ...">` (32px, no focus-visible, no min-h). ปุ่ม claim ในแถวเดียวกันใช้ Button (mission-card.tsx:45-49) ซึ่งมี min-h-11 มือถือจาก button-variants
- **ทางแก้:** เปลี่ยนเป็น Button size="xs" (ได้ 44px มือถือ + focus ring ฟรี) และยุบให้เหลือจุดเดียว เช่นส่งผ่าน MissionRow/shared component แทน copy-paste

### 🟡 x-tap-a11y.5 [PLAY-08] จุดแตะเล็กที่เหลือใน drop-calculator: ปุ่มลบการ์ด ~26px และชิปกรอง rarity/ชุด ~26px
- **หน้า:** /drop-calculator
- **หลักฐาน:** src/components/drop-calculator/want-list.tsx:94 — remove button `p-1.5` + icon 3.5 ≈26px (มี aria-label แล้ว แต่ไม่มี tap-safe/min-h); src/components/drop-calculator/card-picker.tsx:114,140 — filter chips `px-2.5 py-1 text-xs` ≈26px. ส่วน stepper ของ PLAY-08 แก้แล้ว (purchase-config.tsx:3,58 ใช้ QtyStepper ซึ่ง size-11 มือถือ)
- **ทางแก้:** เติม tap-safe หรือ min-h-11 ให้ปุ่มลบ และยกชิปกรองเป็น min-h-11 บนมือถือตามแบบ game-filter-chips.tsx ที่ทำถูกแล้ว

### 🟡 x-tap-a11y.6 [SETS-01] จุดแตะเล็กที่เหลือในหน้า sets: แท็บประเภทชุด ~38px และชิป rarity ~32px
- **หน้า:** /sets · /sets/[setCode]
- **หลักฐาน:** src/app/sets/sets-page-client.tsx:111-118 — type tabs `px-2.5 py-2.5 text-xs` ≈38px, no min-h-11/tap-safe; src/components/sets/set-detail-content.tsx:263 — rarity scrollspy chip `shrink-0 rounded-full px-2.5 py-1.5` ≈32px. ส่วน atom กลางของ SETS-01 (SegmentedControl h-11, SelectTrigger min-h-11) แก้เสร็จแล้ว — เหลือ control ระดับหน้า 2 จุดนี้
- **ทางแก้:** เติม min-h-11 บนมือถือให้แท็บและชิป (คงหน้าตากะทัดรัดด้วยเทคนิค before: painted frame แบบที่ SegmentedControl ใช้ หรือ tap-safe) — ระวังไม่แตะ FilterSelect ของ set-detail ที่เบสล็อกไว้แล้ว

### 🟡 x-tap-a11y.7 [NEW] ปุ่มล้างใน compare bar ลอยเล็ก 32px ชิดปุ่มหลัก — กดพลาดทีเดียวรายการเทียบหายหมดไม่มี undo
- **หน้า:** ทุกหน้า (compare floating bar)
- **หลักฐาน:** src/components/compare/compare-floating-bar.tsx:103-110 — clear button `size-8` (32px) no tap-safe, adjacent to CTA :87-96 `h-9` (36px, below 44px mobile baseline); onClick={clear} ล้างทั้งชุดทันทีไม่มี confirm/undo
- **ทางแก้:** ขยายปุ่มล้างเป็น size-11 หรือเติม tap-safe + เว้นระยะจาก CTA, ยก CTA เป็น min-h-11 บนมือถือ และพิจารณา undo สั้นๆ (toast) หลังล้าง

### ⚪ x-tap-a11y.8 [NEW] ตัวเลือกหน่วย กล่อง/ซอง/ใบ ใน dialog อัตราดรอปเขียนแท็บเอง สูง ~26px ทั้งที่มี SegmentedControl
- **หน้า:** /sets/[setCode] (drop-rate dialog)
- **หลักฐาน:** src/app/sets/[setCode]/set-page-client.tsx:108-122 — raw buttons `rounded-lg px-3 py-1 text-xs` inside `bg-muted/60 p-0.5` track ≈26px tall, no keyboard nav / focus ring / 44px — ทำหน้าที่เดียวกับ SegmentedControl (kit canon) ทุกประการ
- **ทางแก้:** แทนด้วย SegmentedControl size="sm" — ได้เกณฑ์แตะมือถือ + arrow-key + focus ring ฟรีในบรรทัดเดียว

### ⚪ x-tap-a11y.9 [NEW] แท็บมือถือ เลือกการ์ด/ผลลัพธ์ ใน drop-calculator เขียนเอง (40px) แทนที่จะใช้ SegmentedControl
- **หน้า:** /drop-calculator
- **หลักฐาน:** src/app/drop-calculator/drop-calculator-client.tsx:256-283 — hand-rolled two-button track `flex rounded-lg ... p-0.5` with `h-10` buttons (40px), no keyboard pattern / focus-visible; SegmentedControl canon มี fullWidth + badge slot รองรับตัวนับ wantCards อยู่แล้ว
- **ทางแก้:** แทนด้วย SegmentedControl fullWidth (ตัวนับส่งผ่าน badge slot) — ได้ 44px มือถือ + keyboard ฟรี และลดของซ้ำ

### ⚪ x-tap-a11y.10 [NEW] การเลื่อนจอแบบนุ่มฝั่ง JS และ compare bar (framer-motion) ไม่หยุดเมื่อผู้ใช้ปิดการเคลื่อนไหว
- **หน้า:** /search · /honey (activity) · /sets/[setCode] · /cards/[code] · ปุ่มขึ้นบนสุด · compare bar
- **หลักฐาน:** Explicit `behavior:"smooth"` in JS bypasses the CSS `scroll-behavior:auto !important` override (globals.css:722): src/app/search/use-search.ts:192, src/app/honey/components/activity-tab.tsx:105, src/components/shared/scroll-to-top.tsx:38, src/components/sets/set-detail-content.tsx:214-216, src/components/cards/card-detail/use-card-detail-tabs.ts:23. Also src/components/compare/compare-floating-bar.tsx:6 uses framer-motion `motion.div`/AnimatePresence with no MotionConfig/useReducedMotion (CSS animation-duration override does not affect WAAPI/JS animation) — ขัด VISION §4 ข้อ 7 ที่บอกทุก animation ต้อง honor
- **ทางแก้:** สร้าง helper กลาง prefersReducedMotion() ที่คืน "auto"/"smooth" ให้ทุกจุดเรียก และครอบ compare bar ด้วย useReducedMotion ของ framer-motion

### ⚪ x-tap-a11y.11 [RESPONSIVE-02] ปุ่มไอคอนล้วน 2 จุดสุดท้ายยังไม่มีชื่อให้โปรแกรมอ่านจอ
- **หน้า:** /honey (toast) · portfolio add-card dialog
- **หลักฐาน:** src/app/honey/components/honey-toast.tsx:58-63 — close × button has tap-safe but no aria-label; src/components/portfolio/add-card-detail-step.tsx:50-55 — back button (ArrowLeft) has tap-safe but no aria-label. ทั้งคู่เป็น raw <button> แทนที่จะใช้ IconButton ซึ่งบังคับ aria-label ผ่าน type อยู่แล้ว (ที่เหลือของ RESPONSIVE-02 ปิดหมดแล้ว)
- **ทางแก้:** เปลี่ยนทั้งสองเป็น IconButton หรือเติม aria-label ผ่าน i18n — สองบรรทัดจบ

### ⚪ x-tap-a11y.12 [RESPONSIVE-06] คลาส scrollbar-none ปลอม (ไม่มีนิยามจริง) ยังค้าง 7 จุด — แถบเลื่อนโผล่บนราง chip
- **หน้า:** /honey · /raffle · โปรไฟล์สาธารณะ
- **หลักฐาน:** `scrollbar-none` has no definition anywhere (globals.css has only .no-sb at line 466): src/app/honey/components/honey-tab-nav.tsx:173, src/app/honey/components/_shared/filter-tabs.tsx:27, src/app/honey/components/raffle-tab.tsx:215, src/app/honey/components/honey-mock-preview.tsx:233, src/components/profile/public/profile-tabs-nav.tsx:81, src/components/profile/public/profile-hero.tsx:325, src/components/profile/public/tabs/tab-toolbar.tsx:71
- **ทางแก้:** find-replace ทั้ง 7 จุดเป็น .no-sb ให้เหลือคำเดียวทั้งแอป

### ⚪ x-tap-a11y.13 [NEW] aria-label ปนภาษาอังกฤษ ~12 จุด ทั้งที่ระบบแปลภาษามีและใช้อยู่ทุกที่
- **หน้า:** หน้าแรก · /settings · /messages · /orders · /more · /watchlist
- **หลักฐาน:** Hardcoded English accessible names while the rest of the app uses t(lang,...): hero-search-bar.tsx:181 "Clear search", :330 "Remove", settings/account-profile-hero.tsx:52 "Change avatar", ui/toolbar.tsx:131 "Clear", messages/chat-layout.tsx:430 "Close order panel", chat-panel.tsx:91 "Go back", :115 "Toggle order panel", conversation-sidebar.tsx:58 "Back to site", more-client.tsx:301 "Language", :323 "Currency", orders/page.tsx:146 "Filter orders by status", watchlist-skeleton.tsx:7 "Loading watchlist"
- **ทางแก้:** ย้ายทั้งหมดเข้า key i18n — ผู้ใช้โปรแกรมอ่านจอภาษาไทยจะได้ยินภาษาเดียวกับหน้าจอ

### ⚪ x-tap-a11y.14 [NEW] WatchlistRowActions เป็นไฟล์กำพร้าจากงานรื้อ watchlist และแบบข้างในยังต่ำกว่าเกณฑ์แตะ
- **หน้า:** /watchlist
- **หลักฐาน:** src/app/watchlist/watchlist-row-actions.tsx — grep ทั้ง repo ไม่มี importer (orphan); ภายในปุ่มลบใช้ size-7/size-8 (28/32px) ไม่มี tap-safe/min-h/focus-visible — ถ้ามีคนหยิบไปใช้ต่อจะพาแบบต่ำกว่าเกณฑ์ไปด้วย
- **ทางแก้:** ลบไฟล์ทิ้ง (ขออนุมัติเบสตามกติกาลบไฟล์) หรือถ้าตั้งใจเก็บไว้ใช้ต่อ ให้เขียนใหม่บน IconButton ก่อน

### ⚪ x-tap-a11y.15 [NEW] ปุ่มจิ๋วฝั่ง admin — รวมถึงแถวมือถือของตาราง cards ที่ปุ่มแก้ไขกว้างแค่ 28px
- **หน้า:** /admin/*
- **หลักฐาน:** src/app/admin/cards/_components/card-mobile-row.tsx:72 — edit link `size-7` (28px) ทั้งที่ไฟล์นี้คือ mobile fallback row โดยเฉพาะ; src/app/admin/snkrdunk-matching/_components/mapping-row.tsx:141-176 — 4 action buttons `p-1.5` ≈26px; src/components/admin/admin-toolbar.tsx:60 clear `p-0.5` ≈20px; src/components/admin/admin-bulk-bar.tsx:52 `p-1`; src/app/admin/honey/ranks/_components/tier-row.tsx:103 `size-7`
- **ทางแก้:** เปลี่ยนเป็น IconButton หรือเติม tap-safe — เริ่มจาก card-mobile-row ที่ตั้งใจทำเพื่อมือถืออยู่แล้วแต่ปุ่มยังจิ๋ว

### ⚪ x-tap-a11y.16 [NEW] จุดแตะเล็กตกค้างกระจายรายหน้า (ตั้งค่า/ราฟเฟิล/โปรไฟล์/ออเดอร์)
- **หน้า:** /settings/account · /honey (raffle) · โปรไฟล์สาธารณะ · /orders
- **หลักฐาน:** src/components/settings/account-cover-image.tsx:314-322 — upload button raw `px-3 py-1.5 text-sm` ≈38px (should be kit Button which carries min-h-11); src/app/honey/components/raffle-tab.tsx:205-211 — winners view-all link `px-1.5 py-0.5 text-xs` ≈22px; src/components/profile/public/profile-completeness.tsx:188-196 — step links `px-1.5 py-1 text-xs` ≈26px; src/components/orders/order-card.tsx:117 — chat link `px-3 py-1.5 text-xs` ≈30px (marketplace flag ปิดอยู่ ความเร่งด่วนต่ำ)
- **ทางแก้:** เก็บกวาดด้วยสูตรเดียวกับที่ใช้มา: เปลี่ยน raw button เป็น Button ของ kit หรือเติม tap-safe/min-h-11 บนมือถือ — ทำทีละไฟล์ตอนแตะหน้านั้นตามกติกา Phase 5

<a id="x-duplication"></a>
## ✂️ โค้ดซ้ำ/กำพร้า (cross)

**ภาพรวม:** พื้นที่นี้ดีขึ้นมากจาก audit รอบ 2026-07-04 — ของตายชุดเก่า (Phase 1) ถูกลบเกือบหมดจริง และของซ้ำหลายคู่ถูกยุบเข้า kit กลางแล้ว (ระบบค้นหา, alert, auth, guide, admin form) แต่พบ "ขยะรอบใหม่" 15 ไฟล์ ~1,100 บรรทัดที่เพิ่งกลายเป็นไฟล์กำพร้าจากการ redesign รอบหลังๆ (watchlist, card-detail, portfolio, honey) และ commit ล่าสุดยังเสียแรงแก้ไฟล์ตายเหล่านี้ซ้ำอยู่ ปัญหาเชิงระบบคือทุกรอบ redesign ทับของเดิมแล้วไม่มีขั้นตอนกวาดไฟล์ที่ไม่มีใครเรียกใช้ ส่วนโซน commerce (ปิด flag) ยังเป็นแหล่ง copy-paste ใหญ่ที่สุดที่ค้างจาก audit เดิม (หน้าออเดอร์ผู้ซื้อ/ผู้ขาย, ตัวเลือกวิธีส่ง 3 ชุด, สีสถานะ 2 แหล่ง)

### 🔴 x-duplication.1 [NEW] ไฟล์กำพร้ารอบใหม่ 14 ไฟล์ ~940 บรรทัด เกิดหลังลบของตายรอบก่อน — และ commit ล่าสุดยังเสียแรงแก้ไฟล์ตายเหล่านี้ซ้ำ
- **หน้า:** ทั้ง src/ (watchlist, card-detail, portfolio, honey, search, shared, lib)
- **หลักฐาน:** Zero importers verified by path+export-name grep across src/+scripts/: (1) src/components/shared/card-search.tsx (184L, superseded by CardPickerForm in a65b171 but file left behind; still edited by a11y sweep 6537e26 2026-07-11 while already dead); (2) src/components/portfolio/portfolio-hub-card.tsx (193L); (3) src/components/portfolio/add-card-detail-step.tsx (173L, orphaned by multi-pick flow bd3bd2e); (4) src/components/cards/card-detail/card-detail-sticky-buy.tsx (78L) + use-sticky-buy.ts (35L) + market-feed-scroll.tsx (65L) — orphaned by a0400db "remove mobile CTA" (3 commits ago), sticky-buy still edited by 66e1fc3 2026-07-12 while dead; (5) src/app/watchlist/watchlist-row-actions.tsx (57L, orphaned by watchlist redesign c45945c); (6) src/app/honey/components/_shared/claim-row.tsx (66L, docstring still claims "used by every claim/list pattern on /honey" — comment now lies); (7) src/hooks/use-marketplace-fees.ts (29L); (8) src/lib/utils/json-field.ts (55L); (9) shim files with 0 importers: src/components/kuma/kuma-empty-state.tsx (2L), src/components/home/pagination.tsx (1L), src/app/search/search-pagination.tsx (1L), src/lib/plan-features.ts (4L deprecated re-export). Same failure mode the previous audit verified for HOME-03/HONEY-02: sweep commits keep touching dead files.
- **ทางแก้:** ลบทั้ง 14 ไฟล์ในคำสั่งเดียว (PR "ลบล้วน ไม่แก้พฤติกรรม" แบบเดียวกับ Phase 1 เดิม — ขออนุมัติเบสก่อนลบตาม permission) แล้วเพิ่มขั้นตอนถาวรกันเกิดซ้ำ: ทุกครั้งที่ redesign แทนที่ component เก่า ให้ grep หา importer ของไฟล์เก่าก่อนปิดงาน หรือรันเครื่องมือหาไฟล์ที่ไม่มีใครเรียกใช้ (เช่น knip) เป็นประจำ — ไม่งั้นอีก 2 สัปดาห์จะมีกองใหม่อีก

### 🔴 x-duplication.2 [COMMERCE-04] หน้ารายละเอียดออเดอร์ผู้ซื้อ/ผู้ขาย ยัง copy กันทั้งไฟล์ + เส้นเวลาสถานะออเดอร์ประกาศซ้ำ 3 ที่ด้วยชุดคำแปล 3 ชุด
- **หน้า:** /orders/[id] · /seller/orders/[id] · /messages
- **หลักฐาน:** Still live: src/app/orders/[id]/page.tsx:30 `type OrderDetail` + :62 `getTimelineSteps` duplicated at src/app/seller/orders/[id]/page.tsx:37 + :78 (442 vs 472 lines, same 5 steps createdAt→completedAt). Third copy: src/components/messages/order-status-tracker.tsx:16-34 `STEPS` + `STATUS_ORDER` for the same 5 order statuses. Each copy uses its own i18n key family for identical concepts — buyOrderStep*, sellOrderStep*, msgOrderStatus* (21 keys in src/lib/i18n/th.ts alone, ×3 languages). VISION §3 defines CustodyTimeline as the single atom for this.
- **ทางแก้:** สร้าง component เส้นเวลาออเดอร์ตัวเดียวใน components/orders (ตามแนว CustodyTimeline ใน VISION) รับบทบาทผู้ซื้อ/ผู้ขายเป็น prop + ยุบชุดคำแปล 3 ชุดเหลือชุดเดียว — ทำก่อนเปิด flag ตลาดซื้อขาย เพราะตอนนี้แก้ bug ฝั่งเดียวอีก 2 ฝั่งหลุดแน่นอน (โซนนี้ปิด flag อยู่ ผู้ใช้ยังไม่เจ็บวันนี้)

### 🟡 x-duplication.3 [COMMERCE-05] ตัวเลือกวิธีส่งสินค้าประกาศ 3 ที่ ค่าคนละชุด — ค่าที่เซฟลงฐานข้อมูลปนหลายรูปแบบ รวมถึงข้อความที่แปลตามภาษาจอ
- **หน้า:** /seller/listings/new (wizard) · /seller/listings/[id] · /seller/orders/[id]
- **หลักฐาน:** Still live, 3 incompatible value sets: src/components/marketplace/create-wizard/step-shipping.tsx:14 SHIPPING_OPTIONS = ["EMS/Kerry", "Pickup (นัดรับ)", ...] vs src/app/seller/listings/[id]/page.tsx:56 SHIPPING_OPTIONS = [{value:"ส่งทั่วไทย (Kerry/Flash)"...}] (no overlap with wizard values → edit page checkboxes can never match saved data) vs src/app/seller/orders/[id]/page.tsx:70-76 getShippingOptions(lang) = ["Kerry Express", "Flash Express", t(lang,"sellOrderShipEms"), ...] — translated display strings are written to Order.shippingMethod, so the stored value changes with the UI language.
- **ทางแก้:** รวมเป็นค่าคงที่ชุดเดียวใน src/lib/marketplace (เก็บเป็นรหัสคงที่ลงฐานข้อมูล แสดงผลผ่านระบบแปลภาษา) แล้วให้ทั้ง 3 หน้าอ่านจากที่เดียว — ต้องทำก่อนเปิด flag ไม่งั้นข้อมูลเก่าต้องมาไล่แปลงทีหลัง

### 🟡 x-duplication.4 [COMMERCE-06] ตารางสี/ป้ายสถานะออเดอร์ยังมี 2 แหล่งความจริง — badge กลางมีอยู่แล้วแต่หน้า seller dashboard ประกาศ map ของตัวเองซ้ำ
- **หน้า:** /seller · /orders · /seller/orders
- **หลักฐาน:** Raw colors were fixed (both now use semantic tokens) but the mapping is still declared twice: src/components/orders/order-status-badge.tsx:7-38 exports ORDER_STATUS_CONFIG (labelKey + status-* class per status) while src/app/seller/page.tsx:59 STATUS_LABEL_KEY + :69-77 STATUS_COLOR re-declare the exact same 7 statuses → same labels/colors maintained in two places; adding a status (e.g. REFUNDED) requires remembering both or they silently drift.
- **ทางแก้:** ให้หน้า seller dashboard เลิกประกาศ map เอง — import ORDER_STATUS_CONFIG จาก order-status-badge (หรือย้าย config ไป src/lib/orders แล้วให้ทุกจุดอ่านที่เดียว) — งานเล็ก แก้ได้ทันทีไม่ต้องรอเปิด flag

### 🟡 x-duplication.5 [COMMERCE-02] หน้าลงขายซ้ำ 2 ไฟล์ถูกแก้แล้วด้วยการ redirect — แต่ไฟล์เก่า 184 บรรทัดยังค้างเป็นศพในโปรเจค
- **หน้า:** /marketplace/create
- **หลักฐาน:** src/app/marketplace/create/page.tsx now just calls redirect("/seller/listings/new") — the COMMERCE-02 duplication is functionally resolved. But src/app/marketplace/create/create-client.tsx (184L, the near-95% copy of seller/listings/new/page.tsx) has zero importers and still sits in the tree with its duplicate translation keys (mktCreate*) — a trap for the next person who greps "create listing".
- **ทางแก้:** ลบ create-client.tsx (ขออนุมัติเบส) + กวาดคำแปลชุด mktCreate* ที่ไม่มีใครใช้แล้วออกจากไฟล์ภาษา 3 ไฟล์

### 🟡 x-duplication.6 [CHROME-11] ตรรกะ "แท็บไหน active" ยัง copy กัน 4 ไฟล์ในโซน admin/seller — และเริ่ม drift แล้ว (1 ใน 4 เขียนเงื่อนไขไม่เหมือนเพื่อน)
- **หน้า:** /admin · /seller · /admin/honey
- **หลักฐาน:** The scrolled-header half of CHROME-11 is fixed (useScrolled hook shared, header.tsx:54 + header-mobile.tsx:25) and bottom-nav uses isNavActive — but 4 identical local `function isActive(href, exact)` copies remain: src/app/admin/admin-shell.tsx:112, src/app/seller/seller-shell.tsx:78, src/app/admin/honey/layout.tsx:33 (all `pathname.startsWith(href)`), and src/components/admin/admin-sub-nav.tsx:38 which already drifted to `pathname === href || pathname.startsWith(href + "/")` — the exact drift the original finding predicted.
- **ทางแก้:** แยกเป็น isPathActive(pathname, href, {exact}) ตัวเดียวใน lib (ข้างๆ isNavActive ที่มีอยู่แล้วใน lib/game) แล้วให้ 4 ไฟล์ import ใช้ร่วม — เลือกพฤติกรรมแบบ admin-sub-nav (กัน /admin/honey ไป match /admin/honey-x) เป็นมาตรฐาน

### 🟡 x-duplication.7 [NEW] ตัวช่วยแสดง "เวลาที่ผ่านมา" เขียนซ้ำ 3 ชุด — ชุดที่ใช้ในกล่องแชท hardcode ภาษาไทย ผู้ใช้ EN/JP เห็นไทยปน
- **หน้า:** /messages · /admin · ทุกหน้าที่โชว์เวลาที่ผ่านมา
- **หลักฐาน:** Canonical language-aware helpers exist at src/lib/utils/relative-time.ts:9 (formatRelativeAgo) + :43 (formatRelativeAgoShort, i18n via t()). But: (1) src/lib/utils/time.ts:27 formatRelativeShort re-implements the same logic with hardcoded Thai strings ("เมื่อสักครู่", "X นาที") and is used by src/components/messages/conversation-item.tsx:11,81 — chat list shows Thai relative times to EN/JP users (behind marketplace flag today); (2) src/app/admin/page.tsx:124 hand-rolls a third relativeTime with its own Thai strings.
- **ทางแก้:** ให้ conversation-item กับ admin dashboard เรียก formatRelativeAgoShort ตัวกลางแทน แล้วลบ formatRelativeShort กับ relativeTime ฉบับเขียนเองทิ้ง — เหลือแหล่งเดียวใน lib/utils/relative-time

### ⚪ x-duplication.8 [ADMIN-05] โซน admin จับคู่ราคา (yuyutei/snkrdunk) มี component ชื่อเดียวกันคนละ implementation 3 คู่: StatusBadge · SortableHeader · PriceTag
- **หน้า:** /admin/yuyutei-matching · /admin/snkrdunk-matching
- **หลักฐาน:** (1) StatusBadge ×2: src/components/admin/matching-ui.tsx:23 hand-rolls its own span+STATUS_STYLES while src/app/admin/snkrdunk-matching/_components/match-ui.tsx:17 correctly wraps AdminStatusBadge (the ADMIN-05 raw colors were tokenized, but the duplicate implementation remains); (2) SortableHeader ×2 with different APIs: src/components/shared/sortable-header.tsx (activeCol+dir, used by market-table) vs match-ui.tsx:67 (ascKey/descKey tri-state); (3) match-ui.tsx:25 exports `PriceTag` — a namesake shadowing the canonical kit atom ui/price-tag.tsx, guaranteed import confusion.
- **ทางแก้:** ให้ matching-ui เปลี่ยนไป wrap AdminStatusBadge แบบเดียวกับ snkrdunk · เปลี่ยนชื่อ PriceTag ใน match-ui เป็นชื่อเฉพาะ (เช่น MappingPrice) กันชนกับ kit · ส่วน SortableHeader ถ้าไม่คุ้มรวม ให้เขียน docstring ระบุขอบเขตว่าตัวไหนใช้ที่ไหน

### ⚪ x-duplication.9 [NEW] watchlist-client.tsx โตเป็น 630 บรรทัด state 15+ ก้อนในไฟล์เดียว — โค้ดใหม่จาก redesign ที่เพิ่งเกินเกณฑ์ ~400 บรรทัดทันทีที่เกิด
- **หน้า:** /watchlist
- **หลักฐาน:** src/app/watchlist/watchlist-client.tsx = 630 lines: 15+ useState (items/loading/error/removingIds/selected/editMode/period/sortKey/filters/search/gameFilter/addOpen/alertTarget/alertOpen/sparklines, lines 91-142), data fetching via apiTry (:237), multiple useEffect (:204-268) plus render orchestration — same god-component shape CARD-DETAIL-02 had before it was split into use-card-detail-model.ts + zone components (now 273 lines).
- **ทางแก้:** แตก data hook เดียว (use-watchlist-model: โหลด/ลบ/เลือก/กรอง/เรียง) ออกจากส่วนแสดงผล ตามแบบเดียวกับที่ card-detail เพิ่งทำสำเร็จ — ทำตอนนี้ยังถูก เพราะโค้ดเพิ่งเขียน คนเขียนยังจำได้

### ⚪ x-duplication.10 [PORTFOLIO-01] เศษตกค้างจากการลบ orphan portfolio รอบก่อนยังเหลือ: type และ prop ที่ไม่มีใครใช้
- **หน้า:** /portfolio/[id]
- **หลักฐาน:** PORTFOLIO-01's file deletions happened, but two documented leftovers survived: src/components/portfolio/assets-table/utils.ts:5 `export type HoldingsView = "grid" | "list"` — 0 references anywhere; assets-table/index.tsx:26,43 + assets-toolbar.tsx:28,42 still thread a `leading` prop that no caller ever passes.
- **ทางแก้:** ลบ type HoldingsView และ prop leading ทิ้งในรอบเดียว (แก้ 3 ไฟล์ ไม่กระทบพฤติกรรม)

### ⚪ x-duplication.11 [NEW] หน้าต่างซูมรูปการ์ด (lightbox) เขียนเองซ้ำ 3 แบบ ทั้งที่มีตัวกลาง CardMiniPreviewDialog อยู่แล้ว
- **หน้า:** /cards/[code] · /marketplace/[listingId] · ทุกจุดที่กดรูปการ์ด
- **หลักฐาน:** Canonical global lightbox exists: src/components/shared/card-mini-preview-dialog.tsx (docstring: "shown when a card image is clicked anywhere", mounted in app/layout.tsx, opened via CardImageButton + card-preview-store). But two pages hand-roll their own zoom Dialog instead: src/components/cards/card-detail.tsx:262-270 (inline Dialog + Image, own close-button styling) and src/app/marketplace/[listingId]/image-gallery.tsx:102-110 (own Dialog). Admin's matching-ui.tsx:78 Lightbox is a legitimately different job (side-by-side comparison).
- **ทางแก้:** ตัดสินให้จบ: ถ้า card-detail ตั้งใจให้ซูมเปล่าๆ ไม่มีปุ่ม CTA (เพราะอยู่ในหน้ารายละเอียดแล้ว) ให้เพิ่มโหมด "ซูมอย่างเดียว" ใน CardMiniPreviewDialog แล้วให้ทั้ง 2 หน้าเรียกตัวกลาง — เหลือ implementation เดียวสำหรับ "กดรูปแล้วขยาย" ทั้งเว็บ
