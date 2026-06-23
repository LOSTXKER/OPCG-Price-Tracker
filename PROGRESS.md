# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-24 — **CMC table + minimal home + คืนความอุ่น hover ทั้งแอป → COMMITTED** · branch `redesign/market-table-cmc-warm` commit `32f28e9` (68 files) · lint 0 · tsc 0 · build ✓ · review workflow 4 โซน = clean · **ยังไม่ push/PR** (รอเบส) · prod live opcg-price-tracker.vercel.app (PR #38 `d73a25d`)

## 🧹 REFACTOR (audit 5 มิติ — เบสสั่ง "ทำหมด") — ทำเป็น batch
> audit เต็มรันผ่าน workflow แล้ว · คะแนนเฉลี่ย ~7/10 (type-safety/API 8 · design-system 7 · reuse 6 · i18n 5)
- **✅ Batch A (quick wins) — committed `eb6cdec`:** eslint `_`-prefix (lint 84→26) · ลบ ~18 dead vars + `card-table.tsx` (191 บรรทัด dead) · chart trend สี→`var(--price-up/down)` · portfolio-summary eyebrow→`.text-eyebrow` · share links `meecard.com`→`clientEnv().NEXT_PUBLIC_APP_URL`
- **✅ Pagination — committed `70b6859`:** 4 algorithm → 1 util `src/lib/utils/pagination.ts buildPageRange()` · ลบ cards-pagination dead · (ข้าม border-normalize: --p-hair เข้มกว่า /40,50 จะขัด minimal)
- **✅ %-change — committed `cbc7a3f`:** mini-table inline → ChangePill กลาง (price-display+DeltaText ปล่อยไว้ — token family เดียวกันอยู่แล้ว ไม่คุ้มเสี่ยง)
- **เบสยืนยัน: ทำหมดจริงๆ รวมงานใหญ่** (prototype ก็เอา) → ลำดับทำต่อ:
- **✅ A5 — committed `a5b23b1`:** ตัด inner try/catch→500 + log ใน 5 routes (cards · admin/cards · admin/drop-rates · admin/image-matching · admin/sets)
- **⬜ B เหลือ:** brand.ts (hex) · guide import RARITIES · CONDITION_LABELS · SOURCE_MARKETS · `<ListRowSkeleton>` · Card→Surface (portfolio-summary) · **Surface rollout** (guide/* + profile/section-* + shadcn Card → Surface · งานใหญ่)
- **⬜ C (big):** **i18n sweep ~1,900 บรรทัด** (messages · marketplace wizard · seller · hero suggestions) — ⚠️ parallel workflow แก้ th/en/jp.ts ชนกัน → ทำ sequential หรือ workflow คืน {key,th,en,jp} เป็น data แล้ว apply กลาง · แตก `card-detail.tsx` 1,028→hooks · split `missions.ts` 1,180 · `formatRelativeShort` respect lang · admin/cards+6 honey routes Zod · cron createMany/merge · requireAuthUser path เดียว · avatar/cover ไม่ leak error
- **domain = ไม่ใช่ปัญหา:** repo นี้ = prototype (memory `meecard-is-prototype`) ไม่เกี่ยวกับ meecardtcg.com (เว็บ launch คนละ codebase) · share-link→env ที่แก้ = good practice เฉยๆ ไม่ต้องตั้ง Vercel/เปลี่ยน default

## 🎯 โปรเจคใหญ่ที่กำลังทำ (ข้ามหลาย session) — อ่าน memory `warmkit-redesign-rollout`
ไล่ redesign **ทุกหน้า**ให้ใช้ภาษาดีไซน์เดียวกับ **card-detail** ("warm primitive kit": `.surface-1`+`.hairline` flat · `SectionHead` · honey accent จุดเดียว · `.tnum` · `.ease-chrome` · spacing โปร่ง) · ref: `src/components/cards/card-detail.tsx` · tokens: `src/app/globals.css`
**ข้อตกลงกับเบส:** ทำ **ทีละหน้า** · เบสนำว่าหน้าไหน + layout ยังไง · งานฉัน = **สร้าง component กลางที่ทุกหน้าใช้ร่วมกัน** (ไม่ inline ทิ้งๆ) โค้ดสะอาด ต่อยอดง่าย · layout ค่อยๆ ทำ
**บทเรียนสำคัญ:** dark mode → ความต่าง kit เก่า/ใหม่ (hover/border/เงา) **แทบมองไม่เห็น** → ของจริงที่ตาเห็นคือ **composition (ความแน่น)** → แก้ layout/composition ที่เห็นจริง **ไม่ใช่สลับ token**
**ยืนยันรอบนี้ (สำคัญ):** card-detail (north-star) ใช้ **active tab แบบ neutral** (`text-foreground` + underline สี foreground) **ไม่ใช่ honey** — honey สงวนไว้แค่ glow/focus/sort-icon/image-hover-ring → **ห้ามยัด honey เข้า active-state คิดว่าเป็น convention** (มันขัดความตั้งใจของ kit)

## ✅ เสร็จ session นี้ (2026-06-23 บ่าย) — รีวิวหน้าแรกระดับ world-class + แก้ contrast
> โจทย์เบส: "UXUI ดีรึยัง ควรปรับอะไร ให้สวย ทันสมัย ระดับเว็บโลก + ใช้ impeccable skill"
- **impeccable `critique`** (product register) — รัน 3 เลนส์อิสระบน screenshot จริง + detector (`detect.mjs` = สะอาด `[]`) → score **27/40** (Acceptable ขอบบน) · เห็นตรงกันทั้ง 3: ของดี (palette espresso+honey, hairline band, ตาราง CMC-grade) แต่ติด hero กินจอแรก + จุดทำลาย trust
- **[Fix 2 — SHIPPED] contrast/WCAG fix** (กลาง สะอาด): placeholder `muted-foreground/40` (~2:1 ตก AA) → full `muted-foreground` (6.4:1) ที่ hero search + market search + min/max price · ตัด double-dim `.text-eyebrow + /60` (token มี muted color เองอยู่แล้ว) ที่ featured-card / hero dropdown labels / noData · ไฟล์: `hero-search-bar.tsx` `home-market-overview.tsx` `sections/featured-card.tsx` `sections/mini-table.tsx` · `Input` base มี `placeholder:text-muted-foreground` อยู่แล้ว (home แค่เลิก override)

## ✅ เสร็จ รอบ 3 (เบสสั่ง: ออกแบบตารางใหม่ + ลบ chip กลับ dropdown + เผื่อเกรด) — lint 0 · tsc 0 · build ผ่าน
> แผนเต็ม (เบส approve): `~/.claude/plans/concurrent-bubbling-rabin.md`
- **ตารางตลาดใหม่ CMC/Coinbase = shared kit ใหม่ `src/components/market/`** ใช้**ทั้ง home + /search** (เลิกต่างคนต่างทำ):
  - `change-pill.tsx` (ป้าย % สีเขียว/แดง + tint) · `sparkline` ต่อแถว (`lg:`) ใช้ `shared/sparkline.tsx` + data ที่ hook fetch อยู่แล้วแต่ไม่เคย render
  - `market-table.tsx` + `market-table-row.tsx` (column-model-driven · mobile list + desktop table) · `market-columns.ts` (`buildMarketColumns({showViews})` + `MARKET_GRADE_TIERS`) · `price-mode-control.tsx`
  - `use-sparklines.ts` (hook กลาง · สกัดจาก use-market-cards · เพิ่มให้ /search ด้วย)
  - **ลบ:** `market-row.tsx` · `search/search-table-row.tsx` · `shared/set-chip-rail.tsx` (revert chip กลับ SetPicker dropdown)
- **เกรด design-first:** ตารางโชว์ **Raw + PSA10 (ของจริงเท่านั้น)** · `MARKET_GRADE_TIERS` filter `real:true` · PSA9/8/BGS (ปั้น) ใส่ได้ทีหลังโดยติด est (gate = `real`) · PSA10 mode → pills+sparkline = `—` (กัน JPY trend หลอกบนราคา USD)
- **30d:** เอาคอลัมน์ 30d เดี่ยวออก (lg เป็น sparkline) — เหลือ 24h+7d+กราฟ แบบ CMC (default ในแผนที่เบส approve)
- mobile-card-item: ใช้ ChangePill + sparkline จิ๋ว · **grid-card ไม่แตะ** (ใช้ PriceDisplay shared — เลี่ยง blast radius)
- **คงจากรอบก่อน (ไม่ revert):** contrast/WCAG fix · honey crown บน featured · ตัด `~` ราคา featured
- **⚠️ ไม่ทำ (ตั้งใจ):** typewriter หัว (เบสขอเอง Fastwork) · ยุบ top-bar (header ทั้งแอป — เบสนำ)

### ปรับตาม feedback เบส (รอบดูตารางจริง) — tsc 0 · lint 0 · build ผ่าน
- **% เอาพื้นหลังออก** → ChangePill = ตัวเลขสีล้วน (ไม่มี tint/pill)
- **เอาช่อง search ในตาราง home ออก** (desktop inline + mobile row) — hero search ด้านบนพอแล้ว
- **SetPicker เด่นขึ้น** → เพิ่ม prop `prominent` (honey accent) + ย้ายมาช่องกลาง toolbar (แทน search) flex-1 max-w-xs + มี row เลือกชุดบนมือถือด้วย
- **เพิ่มคอลัมน์ 30d** (lg) + **เก็บ sparkline 7d** (lg) — ตอนนี้ตาราง: price·24h·7d(md)·30d(lg)·กราฟ(lg)
- **ตาราง minimal** → เอาเส้นคั่นแถว (border-b) ออก เหลือ header underline + hover (mobile คง divide-y)

### รอบ "minimal ทั้งหน้า" (เบส: "Minimal กว่านี้ ทำให้มันทั้งหน้า") — tsc 0 · lint 0 · build ผ่าน
- **band ไฮไลต์** (`page.tsx`): เอา `divide-x/divide-y/border-y` + per-cell padding ออก → ใช้ `gap` (ช่องว่าง) ล้วน ไม่มีเส้น/กล่อง
- **ตาราง flat** (`home-market-overview`): เอา `.panel` (กรอบ/พื้น card) + `border-b` ใต้ toolbar ออก → ลอยบนหน้าเหมือน band · เหลือเส้นเดียว = underline ใต้หัวตาราง
- /search ยังเก็บ Surface panel ของตัวเอง (เบสโฟกัส home · row ก็ minimal ตาม component กลาง)

### รอบ "คืนความอุ่น hover" (เบส: หน้าแรกสีไม่เหมือนหน้าอื่น · ต้องมีเหลือง/น้ำตาลตอน hover แบบเดิม · เทียบ live meecardtcg.com)
- **เจอเหตุ:** warm-kit migration (a5e0a30) เปลี่ยน `hover:bg-muted` (cream อุ่น) → `hover:bg-foreground/[0.04]` (เทากลาง) **ทั่วแอป** · live meecardtcg.com = เวอร์ชันเก่าก่อน warm-kit จึงยังอุ่น = สิ่งที่เบสคิดถึง
- **แก้ (home + market, ใช้ร่วม /search):** `hover:bg-foreground/[0.04]`→`hover:bg-muted/70` · `/[0.06]`+`/[0.09]`→`hover:bg-muted` · `active:bg-foreground/[0.06]`→`active:bg-muted` · (sed across src/components/home + src/components/market)
- **หลักสำคัญ:** hover = warm **muted/cream** (เหลืองน้ำตาลอ่อน) · honey (`--p-honey-soft`) สงวนเป็น **active/selection** เท่านั้น (set picker active, nav) — ไม่ปนกัน
- **✅ คืนความอุ่นทั้งแอปแล้ว** (เบสสั่ง): sed `(hover|active):bg-foreground/*` → `bg-muted*` ทั่ว src/ (47 ไฟล์ ~91 จุด) · review workflow 4 โซน = clean (active/honey อยู่คนละ branch ไม่ชน · ไม่มี cream บนพื้นเข้ม) · committed `32f28e9`

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. ภาพ "SAMPLE" การ์ด featured → **เบส: ปล่อยไว้ ไม่ต้องสน**
2. SetChipRail (chip เลือกชุด) → **เบส: ไม่เอา ชุดเยอะ ใช้ dropdown** → ลบแล้ว กลับ SetPicker เดิม

## 📋 critique backlog ที่เหลือ (ยังไม่ทำ — เบสพัก hero ไว้ก่อน)
- **[P1] hero กินจอแรก ดันตาราง (ของจริง) ตกขอบ** — เบสเลือก **"คง hero ไว้ก่อน"** (จะกลับมาเรื่อง layout/data-first ทีหลัง)
- [P1] search ซ้ำซ้อน 2-3 จุด (ticker pill + hero bar + table filter) → เลือก model เดียว + table search เปลี่ยน label เป็น "กรองรายการ"
- [P1] value-prop ที่ชัด (`heroSearchTitle` "เช็คราคาการ์ดเกม ทุกใบ ทุกเกรด") เป็น `sr-only` คนตาดีไม่เห็น → เอามาโชว์จริง (หมายเหตุ: copy ไม่มี typo — "ของของ" คืออ่านภาพเบลอผิด)
- [P2] top chrome ~14-16 เป้าก่อนเจอ content → ยุบ utility เข้า avatar menu (**= งาน header ทั้งแอป เบสนำ**)
- ~~set browsing~~ → **เบสเลือก dropdown (SetPicker เดิม)** ปิดเรื่องนี้
- [P2] ไม่มี identity One Piece/OPTCG นอกจากรูปการ์ด → ใส่เบาๆ ใน empty state/microcopy
- [x] ~~number format `~268,800` vs `268,800`~~ → **ตัด `~` แล้ว (เสร็จ)**

## ⚠️ gotchas
- **dev server (:3000) cache SSR เก่า** ถ้ามี `revalidate=300` → server-component change ไม่โผล่ · restart dev = วิธีแก้ (ฉัน kill เองไม่ได้ — permission · เบส restart)
- เรนเดอร์จริง: Chrome headless ผ่าน CDP ได้ full-page/scroll/click
- **impeccable skill ผูกกับ repo bestos** (`/Users/lostxker/dev/Git/bestos/.claude/skills/impeccable`) — เปิด session ที่ meecard เลย invoke `/impeccable` ตรงๆ ไม่ได้ · ฉันอ่าน reference มาใช้วิธีเอง + รัน `detect.mjs` ได้

## ⏭️ NEXT (session หน้า)
1. **เบสเปิดดูตารางใหม่จริง** (`/` + `/search`): sparkline ท้ายแถว (`lg:`) · ป้าย % สี · Raw↔PSA10 · มือถือไม่ h-scroll · เลือกชุด dropdown ยังกรองได้ → บอกปรับ/พอ · **ยังไม่ commit — รอเบส OK**
2. **เบสเคาะ hero** เมื่อพร้อม → data-first (ยุบ hero ดันตาราง/movers ขึ้นเหนือ fold แบบ CMC) หรือคงไว้
3. ถ้าเบสเอา: ยุบ top-bar header (งานทั้งแอป) · identity OPTCG ใน empty state/microcopy · grid-card ใช้ ChangePill (ต้องแก้ PriceDisplay shared)
4. อนาคต: PSA9/8/BGS data จริง → เปิด tier ใน `MARKET_GRADE_TIERS` (real:true) + est marker
4. เบสเลือกหน้าถัดไป redesign (ค้าง: /portfolio /decks /honey /seller /settings /marketplace) + แนว layout
5. shared-kit มีแล้ว: `SetTile` · `SectionHead` · `TypewriterText` · ว่าที่ถัดไป: RankBadge/ImagePlaceholder/page-hero
