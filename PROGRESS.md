# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **Phase 2.4 เสร็จครบ: ยุบระบบค้นหา 3 surface เหลือ engine เดียว** (branch `feat/phase2.4-search-engine` · รอ PR merge) · **browser กลับมาใช้ได้แล้ว** → verify ของจริงได้ (session ก่อนล่ม)

## ✅ Phase 2.4 — ระบบค้นหา engine เดียว (เสร็จ, verify แข็ง, รอ merge)
3 ชิ้นกลางใหม่ + migrate 3 surface (คงหน้าตา+พฤติกรรมเดิมเป๊ะ):
- **`hooks/use-search-keyboard-nav.ts`** — activeIdx + ↑↓/Enter/Esc ที่เดิมเขียนซ้ำ 3 ที่ (`arrowUpFloor`: 0=card-search / -1=palette+hero · Enter preventDefault กัน hero form double-submit)
- **`shared/search-result-row.tsx`** — เนื้อในแถวผลค้นหา (thumb+ชื่อ+set+rarity+ราคา) ที่ก๊อป 3 จุด → ตัวเดียว · props คุม divergence, default=หน้าตา dropdown เดิม (hero ส่ง `size=sm/blur/uppercase/font-price`, palette ส่ง `contain/rounded-lg`, dropdown = default)
- **`useCardSearch`** +AbortController +`error` boolean +`keepPreviousOnError` (additive — deck-calc/marketplace ไม่กระทบ)
- **command-search (Cmd+K) + hero (หน้าแรก)** เลิก fetch เอง → `useCardSearch` · **card-search** ใช้ keyboard hook · `SearchResultsDropdown` ใช้ `SearchResultRow` ภายใน
- verify: **tsc0 · lint0err · test56/56 · build✓** + **live browser 3 surface** (hero blur/UPPERCASE/font-price · palette pages+ค้นการ์ด set ตัวเล็ก · add-dialog dropdown · arrow-nav+Down→Enter dispatch ถูกใบ · 0 console error) + **adversarial review 5 มิติ** (2 confirmed low = per-fetch `setActiveIdx(-1)` reset ตกหล่น → **แก้แล้ว** effect reset-on-results ทั้ง palette+hero · 5 refuted ถูกต้อง)

## ⚠️ เบสต้อง eyeball ของจริง (เหลือน้อยลง — ฉัน live-test แล้วส่วนใหญ่)
- Phase 2.4 นี้ = ฉันเทสต์ browser จริงครบ 3 surface แล้ว **ควรไม่มีอะไรเพี้ยน** — แต่ scrub ราคา/count-up ตอนโหลดยังควรเห็นด้วยตา
- **atom เก่า #65/#66/#67** (ยังไม่มีใคร eyeball): ดาว amber ทั้งเว็บ · sparkline เส้นล้วน · market view toggle SegmentedControl · deck/drop stepper · settings privacy toggle โต → เปิด opcg-price-tracker.vercel.app หรือ localhost เช็คได้
> ถ้าเจออะไรเพี้ยน: search row → แก้ `search-result-row.tsx` ที่เดียว · ดาว → `rating-stars.tsx` · view toggle → SegmentedControl size

## ⏭️ NEXT — Phase 2 ที่เหลือ (ทำบน master สะอาดได้เลย · browser พร้อมแล้ว)
1. **2.5 flow copy-paste** (เลือกทำได้เลย — ส่วนใหญ่ dedup คงหน้าตา, browser ช่วย verify):
   - `CONTENT-02` guide kit (6 หน้า public → curl/browser verify ง่าย · GuideCallout/GuideSourceList/GuidePrevNext/CardThumbStrip) — **finding แนะนำทำพ่วง visible touch** (CONTENT-07/08/09) ถ้าอยากเห็นผลด้วยตา
   - `IDENTITY-01/10` auth kit (AuthShell/OAuthButtons/PasswordInput/PasswordRules/FormError, 4 หน้า)
   - `HONEY-03/07` (STREAK_TIERS single source · login-gate preview ใช้ component จริง) · `SETS-04`/`DISCOVERY-10` · `ADMIN-02/06` AdminDataTable 8 หน้า · `COMMERCE-02/04/05/06`
2. **2.6** `KIT-09` จัดโฟลเดอร์ 3 ชั้น (mechanical) · `IDENTITY-11` แยก settings · `KIT-04/06`
3. **EditionToggle → SegmentedControl** (KIT-10 ที่เหลือ) — ⏸️ ทำคู่ Phase 5.0 tap-target
- แล้ว **Phase 3** token sweep · **4** states · **5** mobile ราย surface (เบสเลือกหน้า · browser พร้อมช่วยแล้ว) · 6-7

## ⚠️ ค้าง/ข้อควรรู้
- **ARIA combobox บน search** = เลื่อน Phase 5.0/`RESPONSIVE-01` (2.x = dedup ล้วน · `SearchResultRow`+dropdown ทำให้เติม role=option ที่เดียวจบทีหลัง) · lint warning `aria-expanded on textbox` = pre-existing เดิม จะหายตอนนั้น
- **debounce command/hero = 0ms** จงใจคง behavior เดิม (HOME-09 "debounce จริง 250-300ms" เป็นงานเปลี่ยน behavior แยก)
- scout เชียร์ bump tap →44px / a11y = **Phase 5.0 ไม่ใช่ 2.x**
- **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** · `lastSale`/`lowestAsk` (grades.ts) จงใจเก็บ
- branch merged เก่ายังไม่ลบ: `feat/phase2.2-sparkline-hero`·`2.3-control-atoms`·`2.4-search-recent` (+#59-#63) — ลบได้

## กฎเหล็ก
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น
- migrate atom = คงหน้าตาเดิมเป๊ะ (ยกเว้นที่ finding สั่งเปลี่ยนสี) · verify ด้วยตา (browser พร้อมแล้ว) · adversarial review workflow ก่อน PR
- เช็ค `AGENTS.md` §Component Kit canon ก่อนสร้าง component ใหม่

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
