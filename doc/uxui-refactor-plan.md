# 🎨 UX/UI Refactor Master Plan — 2026-07-04

> **ไฟล์นี้ = แผนลงมือ refactor UX/UI ทั้งเว็บ** (ติ๊กได้ · ทำทีละข้อ · ไม่หลุด)
> หลักฐานฉบับเต็มต่อข้อ (ปัญหา/หลักฐาน file:line/วิธีแก้/หมายเหตุ verify) อยู่ที่ **[uxui-audit-findings-2026-07-04.md](uxui-audit-findings-2026-07-04.md)** — อ้างด้วย ID เช่น `HOME-01`
> ที่มา: audit ทั้งเว็บด้วย workflow 86 agents (13 กลุ่มหน้า + 6 มิติ cross-cutting) · ทุกข้อระดับ high ผ่าน adversarial verify กับโค้ดจริงแล้ว (62 ผ่าน / 5 ตกไป) · รวมที่เหลือ 230 ข้อ

---

## 0. กติกา (อ่านก่อนเริ่มทุก session)

1. **ทิศที่ล็อกแล้ว ห้ามสวน:** desktop = โครงเว็บเดิม · มือถือ (<md) = iOS grammar (large-title, frost, tap ≥44px, bottom-nav 5 แท็บ) · identity espresso+honey (VISION §1) · honey <5% ของจอ · เขียว/แดง = กำไร/ขาดทุนเท่านั้น · redesign = in-place
2. **ทำทีละ phase ตามลำดับ — ใน phase ทำทีละข้อ** ติ๊ก `[x]` เมื่อ **verify แล้วเท่านั้น** (tsc + lint + test + build + เปิดดูจริงถ้าเป็นงาน UI)
3. **ก่อนลงมือแต่ละข้อ เปิดอ่านรายละเอียดใน findings file เสมอ** — ข้อ med/low ยังไม่ผ่าน verify รายข้อ ต้องเช็คกับโค้ดปัจจุบันก่อน (โค้ดอาจเปลี่ยนไปแล้ว)
4. **permission เดิมใช้ทุกข้อ:** ลบไฟล์ / เพิ่ม dependency / แตะ schema / แตะ config → ⚠️ ถามเบสก่อน · ห้าม push master ตรง
5. **จบ session:** เขียนทับ PROGRESS.md ว่าอยู่ phase ไหน ข้อไหน + ติ๊กไฟล์นี้ · งานใหม่ที่โผล่ระหว่างทางให้จดเพิ่มท้าย phase ที่เกี่ยว อย่าแทรกคิว
6. **Phase 2–4 คืองานของ Nami (kit/token/state)** ทำต่อเนื่องได้เลย · **Phase 5 (ราย surface) เบสเป็นคนเลือกลำดับหน้า** ตาม working agreement เดิม

---

## 1. วินิจฉัยภาพรวม — เว็บป่วยตรงไหน

**ข่าวดี:** โครงใหญ่ถูกทางแล้ว — หน้า core (card detail, portfolio, sets, home) ผ่าน redesign มาหลายรอบจน **ไม่มีหน้าไหนต้องรื้อทั้งหน้า** (auditor 19 ทีมสรุปตรงกัน) · convention (typography token, Surface, breakpoint, skeleton) วางไว้ดีและหน้าใหม่ๆ ตามแล้ว

**ปัญหาจริงมี 5 กลุ่ม (เรียงตามน้ำหนัก):**

| # | กลุ่มปัญหา | อาการ | แก้ที่ phase |
|---|-----------|-------|-------------|
| 1 | **ซากจาก redesign หลายรอบ** | โค้ดตาย ~3,000+ บรรทัด (orphan 18+ ไฟล์) + query DB ที่เลี้ยงของตาย + comment โกหก — ทำให้ AI/คนแก้ผิดไฟล์ | P1 |
| 2 | **ของซ้ำซ้อนที่ยังไม่มี atom กลาง** | ระบบค้นหาเขียนซ้ำ 3 ชุด · delta ราคา 3 ตัว · empty state 2 ระบบ · sparkline 2 ตัว · ฟอร์ม auth/alert/admin copy-paste — แก้ 1 ที่ไม่จบ ต้อง 3-4 ที่ทุกครั้ง | P2 |
| 3 | **token มีแล้วแต่ adoption ต่ำ** | hairline 2 token แข่งกัน · elevation token ไม่มีใครใช้ · สี status ดิบ 660 จุด · radius ไม่มีมาตรฐาน — "สร้างระบบแล้วไม่ได้ migrate" | P3 |
| 4 | **มือถือหลุดเกณฑ์ที่ตัวเองตั้ง** | tap target 26–38px ทั่วแอป (เกณฑ์ ≥44px) · sort ตาราง market/search ใช้ไม่ได้บนมือถือ · settings หน้าลูก 10 หน้ายังเป็น desktop form | P0+P5 |
| 5 | **บั๊กที่ผู้ใช้เจ็บอยู่ตอนนี้** | ปุ่ม CTA โปรไฟล์ถูก bottom-nav ทับ · แท็บ active ไม่ติดทั้งแอป · deck เพิ่มการ์ดเกิน 1 ใบไม่ได้ · 2FA secret รั่วให้เว็บนอก · แก้ราคาทุนแล้วหน่วยเงินเพี้ยน | P0 |

**สุขภาพราย area** (จำนวนข้อ high/med/low หลัง verify · ยิ่ง high มาก = เจ็บมาก):

| Area | H | M | L | ธีมปัญหาหลัก |
|------|---|---|---|--------------|
| commerce (ปิด flag) | 6 | 7 | 1 | pattern เก่าก่อน redesign ทั้งโซน + duplicate ไฟล์คู่ buyer/seller |
| home + market-overview | 5 | 5 | 2 | ISR ตาย + orphan + toolbar มือถือ + ค้นหาซ้ำ 3 ชุด |
| discovery (search/trending/compare) | 4 | 7 | 2 | มือถือ sort ไม่ได้ + state ไม่ลง URL + compare มือถือบีบ |
| card-detail | 4 | 8 | 2 | โค้ดตายจาก 8 pass + ไฟล์ยักษ์ + trust link หลอก |
| track (watchlist/saved/alerts) | 4 | 7 | 2 | ปุ่มจิ๋ว 5 ตัว/แถว + alert ซ้ำ + 3 ชื่อ 3 ไอคอนสับสน |
| honey + pricing | 4 | 8 | 2 | nav 7 ไอคอนไร้ label + hardcode ซ้ำ 5 จุด + PLAY จืดผิดบุคลิก |
| identity (profile/auth) | 4 | 7 | 3 | CTA ถูก nav ทับ + auth copy-paste + trust ซ้ำ 3 ชั้น |
| kit (ui/shared) | 4 | 6 | 3 | orphan 4 ไฟล์ + PriceTag ยังไม่มีจริง + shared/ 42 ไฟล์ไร้หมวด |
| settings + /more | 3 | 7 | 3 | หน้าลูก 10 หน้ายังไม่เป็น iOS + 2FA QR รั่ว + save pattern คนละแบบ |
| portfolio | 3 | 7 | 4 | orphan ~720 บรรทัด + เพิ่มการ์ดทีละใบ + หน่วยเงิน edit เพี้ยน |
| play (decks/calculators) | 3 | 7 | 2 | deck-calc ยังเป็นโค้ดก่อน redesign + qty ล็อก 1 + ลบไม่ confirm |
| content (guide/blog/about) | 3 | 8 | 1 | blog ไร้สไตล์ + guide copy-paste 6 หน้า + สีสาด 8 hue |
| states (cross) | 3 | 6 | 3 | ไม่มีหน้า 404 + spinner 9 จุด + skeleton drift |
| tokens (cross) | 3 | 4 | 3 | hairline/elevation/radius/status ยัง adopt ไม่จบ |
| chrome (cross) | 3 | 7 | 2 | settings gutter ซ้อน + /u/[handle] scaffold ผิด + footer เยื้อง |
| sets | 1 | 8 | 3 | แข็งแรงสุดในแอป — เหลือ tap target + funnel ไป calculator |
| responsive/a11y (cross) | 2 | 5 | 2 | SegmentedControl ไม่มี a11y จริง + aria-label ขาด 14 จุด |
| admin | 2 | 4 | 2 | มี AdminDataTable แล้วแต่ 8 หน้าไม่ใช้ |
| ia-nav (cross) | 1 | 6 | 2 | แท็บ active ไม่ติด (game prefix) + palette ค้นได้แค่การ์ด |

---

## 2. แผนงาน — 8 Phases

> ลำดับออกแบบให้ "เคลียร์พื้นก่อนสร้าง": แก้ของพัง → ลบของตาย → สร้าง atom กลาง → กวาด token → กวาด state → แล้วค่อยไล่ราย surface (ได้ atom ใหม่ไปใช้พอดี) · Phase 5 ทำสลับ/ขนานกับ 2–4 ได้ถ้าเบสอยากเห็นหน้าไหนก่อน

### Phase 0 — แก้ของพัง/เสี่ยงจริง ตอนนี้เลย (17 ข้อ · เกือบทั้งหมด effort S)
> เกณฑ์คัดเข้า phase นี้: ผู้ใช้กดแล้วไม่ทำงาน / ข้อมูลเสี่ยงเพี้ยน / ความปลอดภัย / perf ที่แก้ 1 บรรทัด — ทุกข้อผ่าน verify แล้ว

- [x] `SETTINGS-03` 🔴 **2FA QR ส่ง TOTP secret ให้ api.qrserver.com** → เบสอนุมัติเพิ่ม lib `qrcode` · สร้าง QR ฝั่ง client (`QRCode.toDataURL`) — secret ไม่ออกนอกเครื่องแล้ว
- [x] `PORTFOLIO-03` แก้ราคาทุนใน edit dialog แล้วหน่วยเงินเพี้ยน → แปลงสกุลไป-กลับเหมือน add flow + symbol prefix + string-compare กัน round-trip drift (single + bulk dialog)
- [x] `IA-NAV-01` + `IA-NAV-07` + `CHROME-06` แท็บ active ไม่ติดทั้งแอปเมื่ออยู่ใต้ `/opcg/` → `isNavActive` helper เดียวใน lib/game (strip prefix + owner-aware), More = fallback, ลบ TOOL_LINKS
- [x] `CHROME-01` (= `IDENTITY-02`) แถบ CTA "ทักผู้ขาย" หน้าโปรไฟล์ถูก bottom-nav ทับ → ยกขึ้น `calc(4rem+safe)` + เพิ่ม pb ให้เนื้อหาพ้น 2 แถบ
- [x] `COMMERCE-03` เปิดแชทมือถือแล้ว order panel ทับทั้งจอ ปิดไม่ได้ → default ปิดบน <lg + backdrop แตะปิด (desktop lg:static คงเดิม)
- [x] `PLAY-01` deck-calculator ตั้งจำนวนการ์ด >1 ไม่ได้ → qty stepper ต่อแถว (1-4) + addCard bump แทน reset + คง dialog เปิด (card mode)
- [x] `PLAY-02` ลบเด็คทั้งใบไม่มี confirm → useConfirm dialog ก่อนลบ
- [x] `TRACK-01` กดกระดิ่งบนการ์ดที่มี alert แล้ว = สร้างซ้ำ → ถ้ามี alert แล้ว route ไป /settings/alerts (จัดการ) แทนสร้างซ้ำ · *inline sheet เต็มรูป = Phase 5 (entry มีแค่ boolean)*
- [x] `HONEY-04` ปุ่ม "จ่ายด้วย Honey" จาก /pricing ตกผิดแท็บ → sync `?tab=` กับ URL (Suspense) — ได้ back/share ฟรี
- [x] `IDENTITY-05` login แล้วเด้งไป /settings แทน /profile → แก้ redirect param เป็น /profile · *server-component conversion (ตัด spinner) = defer, auth-sensitive*
- [x] `IDENTITY-08` เมนู "ดูรายการขาย" กดแล้วเงียบ + Report toast ปลอม → wire ดูรายการขาย → tab listings จริง + Report เปลี่ยนเป็น "กำลังมา" (i18n `profileReportSoon` ×3)
- [x] `SETTINGS-01` /settings โชว์ marketplace ทั้งที่ปิด flag → filter ด้วย publicConfig ทั้ง sidebar + mobile index
- [x] `CONTENT-01` บทความ blog render ไร้สไตล์ → เขียน `.prose` ใน globals.css map กับ token (ไม่เพิ่ม dependency)
- [x] `STATES-02` ไม่มีหน้า 404 → `src/app/not-found.tsx` KumaEmptyState หมีหลงทาง + ปุ่มกลับหน้าแรก/ค้นหา
- [x] `CHROME-02` settings ห่อ PageContainer ซ้อน 2 ชั้น gutter บวม → `inShell` ทั้ง 4 จุด (gutter เหลือ 20px มือถือ)
- [x] `CHROME-03` (= `IDENTITY-04`) /u/[handle] + /@handle scaffold ซ้อน → เพิ่ม `/^\/u\/.+/` + `/^\/@.+/` เข้า FULL_WIDTH_ROUTES
- [x] `HOME-01` + `DISCOVERY-11` **perf:** home ตัด searchParams (ISR ทำงาน) + market-overview/trending ตัด force-dynamic → **ยืนยัน build: `/` `/market-overview` `/trending` prerendered static** · legacy `/cards?search=` → /search · trending tab อ่าน client-side (Suspense)
- [ ] `SETS-05` + `CONTENT-03` (⏭️ **ย้ายไป Phase 5** — query-restructure ต่อ set/guide มี correctness risk (ต้องพอ cover ต่อกลุ่ม) ควรทำตอนทำ surface นั้นพร้อม context เต็ม ไม่ใช่ config-only)

### Phase 1 — ลบของตาย (~3,000+ บรรทัด · ⚠️ ทั้ง phase ต้องให้เบสอนุมัติรายการลบก่อนลงมือ)
> ทำเป็น PR เดียว "ลบล้วน ไม่แก้พฤติกรรม" — review ง่าย เสี่ยงศูนย์ · ทุกไฟล์กู้ได้จาก git เสมอ

- [ ] `HOME-03` ชุด home preview 5 ไฟล์ (~400 บรรทัด) + query newestSet/totalValue ที่เลี้ยงของตาย
- [ ] `CARD-DETAIL-04` SourceMarketsTable + PriceChart + CardListingsSection (~800 บรรทัด) — ย้าย CHART_PERIODS/type ที่ยังใช้ออกก่อน
- [ ] `CARD-DETAIL-01` query จริงที่ป้อน props ที่ไม่มีใครอ่าน (getCommunityPrice, getChartSources) + `CARD-DETAIL-11` dead exports/fields + `CARD-DETAIL-12` indexed-mode chart ที่ comment บอกเองว่า removed
- [ ] `PORTFOLIO-01` orphan 3 ไฟล์ (~720 บรรทัด รวม donut ที่ VISION ห้ามแล้ว) + transactions API ตายใน hook
- [ ] `HONEY-02` honey-hero + daily-missions-card (~560 บรรทัด)
- [ ] `SETS-09` pull-rates-table (กำพร้า + drift แล้ว)
- [ ] `KIT-03` ui/card.tsx · layout/section.tsx · layout/section-card.tsx · ui/separator.tsx (orphan ทั้ง 4) + `KIT-13` slot ตายของ Surface
- [ ] `IDENTITY-13` dead code ใน profile hero (buildTrustChips ฯลฯ) · `IA-NAV-07` TOOL_LINKS · `TOKENS-10` .status-warn
- [ ] `PLAY-07` (ครึ่งลบ) branch compact ตายใน PurchaseConfig — ส่วน extract QtyStepper ไปทำ Phase 2
- [ ] `TOKENS-08` ตัดสินชะตา `/proto/*` 13 ไฟล์ (⚠️ เบสเคยสั่งเก็บเป็น reference — ถามอีกรอบว่าถึงเวลาลบยัง)

### Phase 2 — ประกาศ kit ทางการ + ยุบของซ้ำ (หัวใจของ "พัฒนาต่อง่าย ไม่ซ้ำซ้อน")
> ปลายทาง: ตอบได้ใน 10 วินาทีว่า "kit ทางการมีอะไร" และของซ้ำทุกคู่เหลือตัวเดียว · ทำเป็นชุดย่อย แต่ละชุด verify จบในตัว

**2.1 ประกาศ canon (ทำก่อน — ครึ่งวัน)**
- [ ] เพิ่มตาราง "Component Kit ทางการ" ใน AGENTS.md: canonical (Surface · SectionHead · SegmentedControl · ListRow/GroupedList · EmptyState · PriceTag(ใหม่) · HeroNumber · Sparkline · Skeleton/LoadingState · FilterToolbar · PageContainer/PageHeader) + รายการ deprecated + กฎ "จะสร้าง component ใหม่ต้องเช็คตารางนี้ก่อน" (`KIT recompose`)

**2.2 Money atoms (ทุกหน้าใช้ — คุ้มสุด)**
- [ ] `KIT-02` + `HOME-07` สร้าง **PriceTag** ตัวเดียว (ราคา + ลูกศร ▲/▼ + delta, ใช้ --price-up/down เท่านั้น) → ยุบ DeltaText / ChangePill / DeltaPill / ชิปใน PriceDisplay
- [x] `KIT-08` รวม sparkline 2 ตัว → เหลือ `ui/mini-sparkline.tsx` ตัวเดียว (gradient เป็น prop `fill?`, default line-only · migrate 5 จุด · ลบ `shared/sparkline.tsx`) · watchlist เปลี่ยนเป็น line-only ให้ตรง market/portfolio (แก้ตรงที่ finding บ่น) · verify tsc0/lint0/test56/build✓ + review workflow 4 มิติ 0 confirmed defect
- [~] `KIT-05` **hero ราคา card-detail ใช้ `HeroNumber` แล้ว** (count-up + `live` ตอน scrub + null-guard "—") · **เลื่อนการยก EditionToggle/SourceLogo/grades ขึ้น kit** — เหตุผล: ทั้ง 3 ยังถูกใช้แค่ใน feature `cards` ตัวเดียว ไม่มี consumer ข้าม feature (marketplace/comps ยังไม่สร้าง) → ย้ายตอนนี้ = churn เปล่า · `grades.ts` เป็น domain logic ควรไป `lib/` ไม่ใช่ `ui/` · `edition-toggle` ทับ KIT-10 (recompose จาก SegmentedControl) ทำทีเดียวใน 2.3 · ยกจริงเมื่อมี consumer ข้าม feature (SourceLogo = ตัวแรก)

**2.3 Control atoms**
- [~] `KIT-10` ยุบ pill → SegmentedControl — **ViewToggle เสร็จ** (ลบ ViewToggle, migrate home-market + filter-toolbar · icon = `label` slot · blast radius contained ไม่มี caller ส่ง custom modes) · **`EditionToggle` เหลือ** (migrate = tap 40→28px regression + active สีต่าง + ทับ KIT-05 → ทำคู่ Phase 5 tap + KIT-05) · GameFilterChips = canonical แล้ว · FilterTabs = SKIP
- [x] `SETTINGS-09` `ui/switch.tsx` (ยุบ toggle 2 ตัว, hit ≥44px) · [x] `SETTINGS-10` `shared/saved-pill.tsx` (ยุบ feedback pill 5 จุด, presentational, คงสี emerald/red)
- [x] `PLAY-07` `ui/qty-stepper.tsx` — ยุบ stepper **ครบ 3/3** (drop + add-card = `split` · deck = `variant="joined"` + `min={0}` เก็บ behavior Minus ที่ qty 1 → ลบการ์ด)
- [x] `PORTFOLIO-06` `ui/icon-button.tsx` (ghost/solid, ยุบ local 2 + inline 1) · [x] `COMMERCE-13` `ui/rating-stars.tsx` (ยุบ 6 จุด → amber เดียว)
- [x] `RESPONSIVE-04` `portfolio/portfolio-name-form.tsx` — ยุบฟอร์ม inline ชื่อพอร์ต 4 จุด (sm/md variant, +aria-label ผ่าน i18n save/cancel)

**2.4 ระบบค้นหา — ยุบ 3 ชุดเหลือ engine เดียว (`DISCOVERY-04` = `HOME-05` = `KIT-07`)**
- [~] แตก **`useRecentSearches` เสร็จ** (`hooks/use-recent-searches.ts` · recent localStorage+state+push/remove/clear/refresh) → migrate ทั้ง 3 (card-search·command-search·hero-search) ยุบ readRecent/writeRecent/pushRecent ซ้ำ · dedup unify เป็น case-insensitive · **เหลือ:** `SearchResultRow` กลาง (command/hero ยัง render row เอง ไม่ผ่าน `SearchResultsDropdown`) + ให้ command/hero ใช้ `useCardSearch` แทน fetch ซ้ำ + keyboard-nav — **entangled + core interaction → เลื่อน browser** (card-search ใช้ useCardSearch+SearchResultsDropdown อยู่แล้ว = reference)
- [ ] ระหว่างทางเก็บด้วย: `HOME-09`/`DISCOVERY-08` debounce จริง 250-300ms · `HOME-08` ARIA combobox · `DISCOVERY-09` ผลลัพธ์ 3 ทางเข้าเป็นชุดเดียว (การ์ด+เซ็ต+หน้า+ค้นรูป)

**2.5 Flow ที่ copy-paste กันเป็นคู่/สาม**
- [x] `TRACK-04` **`hooks/use-alert-submit.ts` เสร็จ** — hook เดียว owns validate+convert JPY+401/403+error · migrate 3 dialog (card-set·create·edit) ผ่าน `submit({target, request, onSuccess, onGated})` · **คงพฤติกรรมต่าง dialog ไว้** (card-set = เช็ค+prefill+1300ms · create/edit = ปิดทันที) — การ unify success behavior (drift) = งาน UX แยก (VISION §106 อยากให้ prefill) ทำตอน browser
- [ ] `IDENTITY-01` + `IDENTITY-10` auth kit: AuthShell / OAuthButtons / PasswordInput (แก้ a11y ปุ่มตาในตัว) / PasswordRules / FormError — 4 หน้า auth ใช้ชุดเดียว
- [ ] `CONTENT-02` guide kit: GuideCallout / GuideSourceList / GuidePrevNext / CardThumbStrip (ตอนนี้ก๊อป 6 หน้า)
- [ ] `SETS-04` SetPosterTile เดียว (index + other-sets) · `DISCOVERY-10` trending ใช้ MarketTable กลางแทนตารางเขียนเอง
- [ ] `HONEY-03` STREAK_TIERS + getStreakReward เป็น single source (ตอนนี้ hardcode 5 จุด + popover 3 ชุด) · `HONEY-07` login-gate preview ใช้ component จริง+mock data (เลิกวาดสำเนา 284 บรรทัด)
- [ ] `ADMIN-02` (+ปิด `ADMIN-01`, `RESPONSIVE-03` ในตัว) หน้า list admin 8+ หน้า migrate เข้า AdminDataTable · `ADMIN-06` useAdminForm ยุบฟอร์ม copy 7 ชุด
- [ ] `COMMERCE-02` รวมหน้า create listing 2 ไฟล์ · `COMMERCE-04` OrderTimeline/OrderDetail ร่วม buyer/seller · `COMMERCE-05`+`COMMERCE-06` shipping/condition/status เป็น constants เดียว

**2.6 จัดบ้านโครงโฟลเดอร์**
- [ ] `KIT-09` จัด 3 ชั้น: ui/ = primitive · shared/ = composite ข้ามฟีเจอร์ · ของผูกฟีเจอร์เดียว (notification-bell, streak-*, upgrade-*) ย้ายเข้าโฟลเดอร์ feature
- [ ] `IDENTITY-11` แยก 12 ไฟล์ settings ออกจาก components/profile → components/settings
- [ ] `KIT-04` เคาะชะตา ui/ListRow: migrate mobile rows เข้า หรือ rename local ListRow ของ watchlist กันชื่อชน · `KIT-06` มาตรฐาน size prop เดียว (sm|md|lg) · `HONEY-05` rename honey-sidebar → honey-status-bar + แตกไฟล์

### Phase 3 — Token discipline sweep (ความสม่ำเสมอ + สวยงามระดับระบบ)
> ส่วนใหญ่ mechanical — เห็นผลเป็น "ทั้งแอปดูเป็นแอปเดียวกัน" · อิง TOKENS/CHROME/สี

- [ ] `TOKENS-03` hairline เหลือ token เดียว: ลงทะเบียน --p-hair ใน @theme → ใช้ `border-hair` ได้จริง + กวาด border-border/NN ที่เหลือ
- [ ] `TOKENS-02` map overlay ทุกตัว (dialog/sheet/dropdown/popover/palette) → --elev-overlay · แถบลอย → --elev-raised (token สร้างแล้วแต่ 0 คนใช้)
- [ ] `TOKENS-01` ป้าย Pro เลิก hex ฝังมือ 2 เฉด → token primary · `TOKENS-06` เคาะมาตรฐาน radius (การ์ด=rounded-xl · chip=md/sm · แบน bare `rounded` 156 จุด)
- [ ] `TOKENS-05` ปิด backlog motion 23 ไฟล์ (+ เพิ่ม --dur-slower หรือ .motion-progress ที่ขาด · ตัดสิน --ease-spring: ใช้จริงกับ PLAY หรือถอด)
- [ ] `TOKENS-04` (+`CARD-DETAIL-08`, `PORTFOLIO-08`, `HONEY-11`, `SETS-12`) นิยาม `--chrome-h` แล้วให้ sticky/scrollspy/scroll-margin ทุกจุดอ่านจาก var เดียว — จบปัญหา magic number 7+ จุด + sticky มุดหลัง header
- [ ] **วินัยเขียว/แดง (identity):** `KIT-01`+`CHROME-08` chrome ไอคอน (bookmark น้ำเงิน, ดาว amber) → neutral/honey · `DISCOVERY-06` compare winner → honey · `PLAY-09` โอกาสดรอป → token --chance-* · `HONEY-08` claimed/done → honey/muted · `HONEY-09` machine.color จำกัดชั้น decorative · `TRACK-11` ดาว watchlist amber → primary
- [ ] `TOKENS-07` สี status ดิบ 660 จุด → .status-*/semantic **ทีละ feature** (เริ่ม orders/alerts/notifications ที่เป็นสถานะจริง · สีที่เป็นข้อมูล เช่น สีการ์ด/rarity ไม่แตะ)
- [ ] `RESPONSIVE-06` แทน `scrollbar-none` (no-op ปลอม 9 จุด) → `.no-sb` · `TOKENS-09` เก็บ pb-safe ตกค้าง 3-4 จุด
- [ ] `CHROME-07`+`KIT-11` footer ใช้ PageContainer (จบ gutter เยื้อง 4px ทุกหน้า) · `CHROME-09` แก้ dead scroll ~128px ท้ายทุกหน้า (ให้ footer เคลียร์ bottom-nav ที่เดียว) · `CHROME-12` header 2 แถว padding ให้ตรงกัน
- [ ] `ADMIN-03` admin-login เลิก shadcn-zinc → token espresso · `ADMIN-05` กวาด raw palette ~35 จุด 9 ไฟล์ admin
- [ ] `CONTENT-09`+`CONTENT-10` guide ลดสีตกแต่ง 8 hue → neutral+honey, หัวข้อเข้า token เดียว · `CONTENT-08` ปรับหน้า buying ให้เข้าชุดพี่น้อง · `SETTINGS-08` icon tiles → *-soft tokens ชุดเดียวกับ /more

### Phase 4 — States: loading / empty / error (กฎ "ศูนย์ spinner" ให้จริง)
- [ ] `STATES-03` ยุบ empty state 2 ระบบ → EmptyState เดียว + prop mascot/preset (หมี Kuma) + เขียนกฎสั้นใน AGENTS.md ว่าเมื่อไหร่ใช้หมี
- [ ] `STATES-01` (+`SETTINGS-07`, `COMMERCE-10`, `TRACK-05`, `STATES-10`) กวาด spinner 9+ จุด → skeleton รูปร่างตรง content (orders/saved/seller/messages/settings 4 หน้า/profile)
- [ ] `STATES-05`+`STATES-06`+`SETS-06` เพิ่ม loading.tsx ราย segment ที่ยืม skeleton หน้าอื่นอยู่: sets/[setCode] · marketplace/[listingId] · blog/[slug] · u/[handle] · profile/[userId] · raffle/winners
- [ ] `STATES-08` (+`TRACK-10`, `PORTFOLIO-12`, `PLAY-12`) แก้ skeleton drift: breadcrumb ผีบนมือถือ (แก้ที่ PageSkeleton กลาง) + skeleton ที่ไม่ตรง layout จริง
- [ ] `STATES-07` (+`SETS-07`, `COMMERCE-08`, `STATES-11`) empty state ทุกจุดมี CTA: orders→ตลาด · sets→ล้างตัวกรอง · chat→EmptyState มาตรฐาน
- [ ] `STATES-04`+`STATES-12` หน้า error: เพิ่มทางออก "กลับหน้าแรก" + ภาษาไทย + ใช้ Button/EmptyState ของระบบ · global-error เข้า palette espresso
- [ ] `STATES-09` สลับบุคลิกให้ถูกขั้ว: honey (PLAY) ได้หมี+CTA · portfolio (MONEY) ลด spring bounce → --motion-money

### Phase 5 — Mobile pass ราย surface (เบสเลือกลำดับหน้า · ทำหน้าไหนเปิดหมวดนั้นใน findings file ประกอบ)
> ก่อนไล่รายหน้า ทำ **5.0 ฐานระบบ** ก่อน — แก้ที่ atom กลางแล้วทุกหน้าได้ฟรี

**5.0 ฐานระบบ (ทำก่อนทุกหน้า)**
- [ ] **Tap target ≥44px ที่ atom กลาง:** `SETS-01` SegmentedControl/SelectTrigger เพิ่ม size มือถือ · `RESPONSIVE-05` pill filter · `HONEY-13` FilterTabs · `IA-NAV-08` ปุ่มแว่น header — (จุดที่เหลือรายหน้าไปเก็บตอนทำหน้านั้น: `CARD-DETAIL-07`, `PORTFOLIO-09`, `PLAY-08`, `IDENTITY-06`, `COMMERCE-09`)
- [ ] `RESPONSIVE-01` SegmentedControl a11y จริง (focus ring + arrow key/roving tabindex — comment เคลมไว้แต่โค้ดไม่มี) — ไฟล์เดียวได้ทั้งแอป
- [ ] `RESPONSIVE-02` เติม aria-label ปุ่ม icon-only ~14 จุด + ขยาย hit area
- [ ] `RESPONSIVE-07` reduce-motion ครอบ animate-in/out ทั้ง 24 จุด (block เดียวใน globals.css)

**5.1 รายหน้า (เรียงตามที่เสนอ — เบสสลับได้):**
- [ ] **หน้าแรก:** `HOME-02` sort/period ใช้ได้บนมือถือ (⚠️ ห้าม bottom sheet — เบส veto ไว้ใน comment) · `HOME-04` แยก SetPicker เต็มแถว + ปุ่ม ≥44px · `HOME-06` set rail แนวนอน (พฤติกรรม browse-by-set) · ข้อเสนอ first fold ใหม่อยู่ใน findings §HOME recompose
- [ ] **Watchlist (แท็บหลักใหม่):** `TRACK-02` แถวมือถือเลิกปุ่มจิ๋ว 5 ตัว → iOS grammar (โหมดเลือก/swipe) · `TRACK-03` ล็อก 1 ไอคอน 1 ชื่อ (ดาว=watchlist ทุกที่) · `TRACK-08` ทางเข้า "จัดการแจ้งเตือน" จาก watchlist (พิจารณาย้าย /settings/alerts → /alerts) · `TRACK-09` เลิก window.confirm · `TRACK-12`/`TRACK-13`
- [ ] **Card detail:** `CARD-DETAIL-02` แตกไฟล์ยักษ์เป็น hook+โซน (ก่อนแก้ UX ข้ออื่นจะได้แก้ง่าย) · `CARD-DETAIL-03` แถวขายล่าสุดเลิกลิงก์ไปตารางตัวอย่าง (trust!) · `CARD-DETAIL-05` est mark ครบทุกจุด · `CARD-DETAIL-06` sticky bar label ตามแหล่งจริง · `CARD-DETAIL-09` เลิก nested scroll → 8 แถว + sheet · `CARD-DETAIL-10` เติม zone ที่หาย (population ghost + Lowest Ask) · `CARD-DETAIL-13`/`14`
- [ ] **Portfolio:** `PORTFOLIO-02` เพิ่มการ์ดหลายใบไม่ต้องเปิด dialog 20 รอบ (คง step select + toast) · `PORTFOLIO-04` hub ใช้ HeroNumber เดียวกับ detail · `PORTFOLIO-07` hideBalance ลง store จำข้ามหน้า/เซสชัน (privacy) · `PORTFOLIO-10` toggle สาธารณะต้องมี confirm · `PORTFOLIO-09`/`11`/`13`/`14`
- [ ] **Search/Trending/Compare:** `DISCOVERY-03` sort บนมือถือ · `DISCOVERY-07` filter/sort/page ลง URL · `DISCOVERY-01` compare ลง URL (back ไม่หาย) · `DISCOVERY-02` compare มือถือ snap-scroll 2-3 เลน (ดู recompose) · `DISCOVERY-05` Cmd+K มือถือ → full-screen sheet · `DISCOVERY-12`/`13`
- [ ] **Settings หน้าลูก 10 หน้า (งานใหญ่สุดใน phase นี้ — `SETTINGS-02` effort L):** rollout grouped-inset ทีละหน้า เริ่ม privacy/notifications/export (toggle ล้วน) → account/addresses/billing/security · `SETTINGS-04` เพิ่มกลุ่ม Preferences (ภาษา/สกุลเงิน/ธีม) ใน /settings · [x] `SETTINGS-05`+`CHROME-10` **ปุ่มย้อนวงกลมเดียวกับทั้งแอป — เสร็จแล้ว** (2026-07-04 เบสเจอตอนรีวิว: settings ใช้ `Breadcrumb` กลางแทน text-link เอง · มือถือได้ปุ่มวงกลม chevron → /settings · desktop trail 3 ชั้น) · `SETTINGS-06` เคาะ save pattern 2 แบบ (auto-save+SavedPill / ปุ่ม save+toast) · `SETTINGS-11`/`12`/`13` — โครงเสนอเต็มใน findings §SETTINGS recompose
- [ ] **Honey + Pricing:** `HONEY-01` nav 7 ไอคอน → icon+label หรือ segmented 3 กลุ่ม · `HONEY-06` ยอด Honey เป็น hero เดียว + spring motion ตามบุคลิก PLAY · `HONEY-10` pricing ให้ Pro เป็นแผนแนะนำเดียว (ขายให้เป็น) · `HONEY-12` ตารางเทียบมือถือ · `HONEY-14` · recompose เต็มใน findings
- [ ] **Decks/Calculators:** `PLAY-03` deck-calc migrate เข้า token/kit (หน้าเดียวที่ยังเป็นโค้ดก่อน redesign) · `PLAY-05` แยก server/client + PageHeader · `PLAY-06` "เด็คของฉัน" เลิกโกหกว่า coming soon · `PLAY-10`/`11` · ถ้าจะทำเต็ม: recompose deck-calculator ตาม VISION §5.4 (โครงใน findings)
- [ ] **Profile:** `IDENTITY-03` trust ซ้ำ 3 ชั้น → trust strip เดียว · `IDENTITY-07` ปุ่ม save ผู้ขาย state sync · `IDENTITY-09` password checklist ตรง validation · `IDENTITY-12`/`14` · recompose ลำดับ stack ใน findings
- [ ] **/more + nav:** `IA-NAV-02` จัดกลุ่มใหม่ตาม VISION (ตัดแถวซ้ำ bottom-nav, เติม blog/about/contact) · `IA-NAV-03` /more บน desktop ต้องมี chrome (ตอนนี้เป็นหน้าลอยไร้ทางออก) · โครงเสนอใน findings §IA-NAV recompose
- [ ] **Content:** `CONTENT-04` ปุ่มย้อนซ้อน 2 อัน blog · `CONTENT-05` view count เลิก block TTFB · `CONTENT-06` coming-soon เพิ่ม notify-me · `CONTENT-07`+`CHROME-05` guide/blog/decks ใช้ PageHeader (ได้ large-title ฟรี 7 หน้า) · `CONTENT-11` guide/sets เลิกทำตัวเป็นหน้า browse · `CONTENT-12` · `CHROME-04` ความกว้างหน้าอ่านประกาศที่เดียว

### Phase 6 — IA + naming polish (เล็กแต่ทำให้ "รู้สึกเป็นแอปเดียว")
- [ ] `IA-NAV-06` ชื่อปลายทางเดียวทุก platform ("หน้าแรก"/"ชุดการ์ด" ทั้ง desktop nav + bottom-nav + palette)
- [ ] `IA-NAV-05` ล็อกภาษาไอคอน: Wallet=Portfolio ทุกที่ · Star/Bookmark สงวนให้ Watchlist
- [ ] `IA-NAV-04` command palette ครบทุก destination (เซ็ต + เครื่องมือ 3 ตัว + market-overview + guide + pricing)
- [ ] `IA-NAV-09` เคาะ URL โปรไฟล์สาธารณะ canonical เดียว (/u vs /profile/[id])
- [ ] `CHROME-11` ยุบ logic active-route/scrolled-header ที่ก๊อปหลายไฟล์ (ต่อจาก Phase 0 ข้อแท็บ)

### Phase 7 — Commerce + Admin เก็บกวาด (ทำก่อนเปิด marketplace flag)
> commerce ปิด flag อยู่ = ไม่บล็อกใคร แต่ **ต้องเสร็จก่อนเปิด flag** (หลายข้อคือ trust/เงินจริง)

- [ ] `COMMERCE-01` ซื้อเลย = confirm sheet ก่อนสร้างออเดอร์ (VISION: "ไม่ใช่ tap เดียว") + ทุก mutation แจ้ง error เมื่อ apiTry คืน null
- [ ] `COMMERCE-07` มือถือ: ราคา+CTA ขึ้นก่อน gallery (ตอนนี้ราคาอยู่ใต้ fold)
- [ ] `COMMERCE-11` filter สถานะ + empty state ให้ buyer/seller หน้าตาเดียวกัน · `COMMERCE-12` แก้ไข listing โหลดทั้งร้าน 100 ใบ (เกิน 100 = แก้ไม่ได้) → endpoint รายใบ
- [ ] `COMMERCE-09` แชท: pb-safe + tap target แท็บกรอง · แชทมือถือ recompose ตาม VISION §5.5 (StickyContextCard + bottom-sheet — โครงใน findings §COMMERCE recompose)
- [ ] `COMMERCE-14` เส้นคั่น ListingCard มองไม่เห็นใน light mode
- [ ] `ADMIN-04` /admin/config: flag/percent เป็นช่อง text ล้วน (พิมพ์ผิด = พังเงียบ) → typed fields + validate · `ADMIN-07`/`ADMIN-08`

---

## 3. งานที่จงใจ "ไม่ทำ" (กันหลงเอง)

- **ไม่รื้อหน้าไหนทั้งหน้า** — audit 19 ทีมยืนยันโครงหลักดีแล้ว ปัญหาอยู่ระดับ component/token/state
- **ไม่แตะ schema DB** ใน plan นี้ (population จริง, Grade enum, per-game snapshot = backlog เดิมใน PLAN.md ที่ gated เบสอนุมัติ)
- **ไม่ทำ i18n hardcode sweep** (= R3 ใน PLAN.md แยกอยู่แล้ว) และ**ไม่ migrate fetch → helper** (= R2) — แต่ถ้าไฟล์ไหนถูกแตะใน phase 2/5 อยู่แล้ว ให้เก็บ 2 เรื่องนี้ไปด้วยเลย
- **ไม่เปิด marketplace flag** — Phase 7 คือ "เตรียมพร้อม" การเปิดเป็นการตัดสินใจธุรกิจของเบส (PLAN.md M3)

## 4. วิธี track + จุดเช็คอิน

- ติ๊กไฟล์นี้ + เขียนทับ PROGRESS.md ทุกจบ session (กติกาเดิม)
- **จุดเช็คอินกับเบส:** จบ Phase 0 (เปิดดูของที่แก้จริง) → อนุมัติรายการลบ Phase 1 → จบ 2.2+2.3 (ดู atom ใหม่บนหน้าจริง) → เลือกลำดับหน้า Phase 5 → ก่อนเริ่ม Phase 7 (ตัดสินใจ timeline marketplace)
- ทุก phase = branch ของตัวเอง เปิด PR เข้า master (ห้าม push ตรง)
