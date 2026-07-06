# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-06 — **#69 (2.4 search) + #70 (2.5 guide) merged เข้า master · 2.5 auth kit เสร็จรอ PR** (branch `feat/phase2.5-auth-kit`) · verify: **tsc0 · lint0err · test56/56 · build✓** · browser ใช้ได้

## ✅ เข้า master แล้ว (2 PR ผ่าน static + live browser + adversarial review)
### #69 — Phase 2.4 ระบบค้นหา engine เดียว
`useSearchKeyboardNav` + `SearchResultRow` + `useCardSearch`(+abort/error/keepPrev) · command-search+hero เลิก fetch เอง → engine กลาง · คงหน้าตา+พฤติกรรมเป๊ะทุก surface · review 5 มิติ (2 confirmed low = per-fetch reset ตกหล่น → แก้แล้ว)

### #70 — Phase 2.5 guide kit (+CONTENT-07/08 visible ที่เบสอนุมัติ)
4 component `components/guide/`: `GuideSourceList`·`GuideCallout`·`GuidePrevNext`·`CardThumbStrip` · migrate 6 หน้าลูก guide · CONTENT-07 PageHeader large-title ทุกหน้า + CONTENT-08 หน้า buying restyle เข้าชุด (Check/X, callout, badge, footer) · review 6 หน้า **0 confirmed** (5 canonical preserving · buying 2 nit คงเดิม)

## 🔜 เสร็จ รอเปิด PR — Phase 2.5 auth kit (`feat/phase2.5-auth-kit`, base master)
5 component `components/auth/` + `lib/auth/password-rules.ts`: `AuthShell` (hero slot 2-col login/register · 1-col forgot/reset) · `OAuthButtons` (Google/FB, owns signInOAuth) · `PasswordInput` (`leftIcon`/`showToggle`/`hint`/`labelClassName` · **IDENTITY-10 a11y: ปุ่มตา focusable + aria-label/aria-pressed** ที่เดียวจบ 5 จุด) · `PasswordRules` (+`getPasswordRules` single source) · `FormError` · migrate login/register/forgot/reset+section-security · คงหน้าตา+schema/supabase/redirect เป๊ะ (IDENTITY-09 นอก scope) · review 5 surface **0 confirmed** · eyeball register(2-col)/forgot(1-col) + ปุ่มตา focus ring ยืนยัน a11y · +i18n keys `showPassword`/`hidePassword` (en/th/jp)

## ⚠️ เบสต้อง eyeball / ตัดสิน
- **guide buying** 2 จุด (ฉันคงเดิมไว้ให้ตัดสิน): (1) callout "วิธีอ่านราคา" heading เป็น amber ในกล่องฟ้า — อยากให้ neutral (`text-foreground`) ไหม · (2) ปุ่มย้อน "Sets" ยังเป็นอังกฤษ (ก๊อปจากเดิม) — อยาก i18n ไหม
- **guide มือถือ**: หัวข้อ large-title 34px (ฉัน eyeball desktop แล้ว มือถือควรเช็ค) · **CONTENT-09** (ลดสี callout รุ้ง→โทนเดียว) = เบสไม่เลือกรอบนี้ เปิดไว้
- **atom เก่า #65/#66/#67** ยังไม่มีใคร eyeball: ดาว amber · view toggle · stepper (opcg-price-tracker.vercel.app / localhost)
- **2.4**: scrub ราคา/count-up ตอนโหลด (motion) ควรเห็นด้วยตา
- **auth kit**: /login redirect ใน dev (auth bypass) → eyeball login บน preview/prod · <lg hero ซ่อน (ถูก) · ปุ่มตา Tab เข้าถึงได้แล้ว (a11y)
> dev server รันอยู่ localhost:3000

## ⏭️ NEXT — Phase 2.5/2.6 ที่เหลือ
1. **2.5 ที่เหลือ**: `HONEY-03/07` · `SETS-04`/`DISCOVERY-10` · `ADMIN-02/06` AdminDataTable 8 หน้า · `COMMERCE-02/04/05/06` · `CONTENT-03` guide perf (query take + ISR, แยก PR)
2. **2.6**: `KIT-09` จัดโฟลเดอร์ 3 ชั้น · `IDENTITY-11` แยก settings · `KIT-04/06`
3. **EditionToggle → SegmentedControl** — ⏸️ คู่ Phase 5.0 tap
- แล้ว **Phase 3** token · **4** states · **5** mobile ราย surface (เบสเลือกหน้า) · 6-7

## ⚠️ ค้าง/ข้อควรรู้
- **ARIA combobox บน search** = เลื่อน Phase 5.0/`RESPONSIVE-01` (2.x = dedup ล้วน) · lint warning `aria-expanded on textbox` = pre-existing
- **debounce command/hero = 0ms** จงใจคง behavior เดิม
- guide: `GuideCallout` ส่ง body เป็น children (คงมาร์กอัปเดิม) · `CardThumbStrip` render แค่แถว (caller คุม Surface/eyebrow/caption) · `internal` prop = Link vs external anchor
- **อย่า migrate `Delta`/`DirectionPill` เข้า PriceTag** · `lastSale`/`lowestAsk` (grades.ts) จงใจเก็บ
- branch merged เก่ายังไม่ลบ: `feat/phase2.2-*`·`2.3-*`·`2.4-search-recent` (+#59-#63)

## กฎเหล็ก
- **ห้าม push master ตรง** — branch + PR + merge เท่านั้น
- migrate atom = คงหน้าตาเดิมเป๊ะ (ยกเว้น finding/เบสสั่งเปลี่ยน) · verify ด้วยตา (browser พร้อม) · adversarial review workflow ก่อน PR
- เช็ค `AGENTS.md` §Component Kit canon ก่อนสร้าง component ใหม่

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings) · **kit canon:** `AGENTS.md` §Component Kit
