# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Typography

Use the semantic typography tokens defined in [src/app/globals.css](src/app/globals.css). They encode font-size, line-height, weight, tracking, and (where appropriate) muted color in a single class — components should apply one of them instead of stacking `text-* font-* tracking-* text-muted-foreground`.


| Token           | Use for                                                |
| --------------- | ------------------------------------------------------ |
| `.text-display` | Hero KPI numbers, portfolio totals (~36–42px)          |
| `.text-h1`      | Page titles                                            |
| `.text-h2`      | Section headings                                       |
| `.text-h3`      | Subsection headings                                    |
| `.text-h4`      | Card titles, panel headings                            |
| `.text-h5`      | Small headings, table captions                         |
| `.text-body`    | Default reading copy                                   |
| `.text-body-sm` | Secondary copy / dense panels                          |
| `.text-label`   | Form labels, inline labels                             |
| `.text-meta`    | Captions, helper text, muted aux (already muted color) |
| `.text-eyebrow` | Section eyebrows, table column headers (uppercase)     |
| `.text-micro`   | Pill / badge text                                      |
| `.text-overlay` | Image-overlay micro labels (last resort, ≤10px)        |
| `.text-code`    | Monospace / numeric mono                               |


Rules:

- **Avoid `text-[Xpx]` arbitrary sizes.** Pick the closest semantic token. The base scale (`text-xs` / `text-sm` / `text-base` / `text-lg`) is bumped slightly above the Tailwind defaults so Thai (Kanit) reads comfortably.
- **Avoid the `text-xs font-medium uppercase tracking-wider text-muted-foreground` pattern.** Use `.text-eyebrow` instead.
- Plain `text-xs / text-sm / text-base / text-lg / text-xl / text-2xl / text-3xl` are still fine when no semantic token matches (e.g. inline links, buttons, ad-hoc one-offs).
- `.text-meta` and `.text-eyebrow` ship their own `color: var(--muted-foreground)`. Override with `text-foreground` etc. only when the role genuinely differs.

## Breakpoints

We pin two breakpoints to specific responsibilities so layouts stay predictable across the app. Don't invent new boundaries unless you have a real reason — pick one of these.


| Prefix | Width    | Use for                                                                                                                                                                       |
| ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sm:`  | ≥ 640px  | **Data layout boundary** — table → list fallback, grid columns scaling up. Anything dense (`<table>`, multi-column grids) hides on `<sm` and renders a list/card layout.      |
| `md:`  | ≥ 768px  | **Chrome boundary** — desktop header vs mobile header, sidebar vs sheet/drawer, bottom-nav vs full-width footer. Anything related to navigation chrome flips at `md:`.        |
| `lg:`  | ≥ 1024px | **Optional polish** — nice-to-have extra columns (e.g. 4-column preview row, sibling grid). Don't put critical UI at `lg:` only.                                              |
| `xl:`  | ≥ 1280px | **Marketing density** — only used for marketplace grid going from 3 → 4 columns. Avoid otherwise.                                                                             |


Concrete consequences:

- **Tables**: hide the `<table>` on `<sm` and ship a list fallback (`<div className="divide-y sm:hidden">`). Don't rely on `overflow-x-auto` alone — horizontal scroll on phones is a UX regression. See [src/components/cards/card-table.tsx](src/components/cards/card-table.tsx) and [src/components/portfolio/assets-table/](src/components/portfolio/assets-table/) for the pattern.
- **Bottom nav padding**: routes that render in the global chrome (anything not in `CHROMELESS_ROUTES` in [src/components/layout/main-chrome.tsx](src/components/layout/main-chrome.tsx)) already get bottom padding from `<PageContent>` for the bottom-nav. Don't double-pad in the page itself.
- **Chromeless shells** (admin, seller, messages, auth): own their own `<main>` padding. They don't have a bottom-nav so they don't need bottom-nav padding either. Use `<PageContainer inShell>` to inherit max-width without re-applying `px-*`.
- **Mobile-first**: write the mobile rule with no prefix, then layer in `sm:` / `md:` / `lg:`. Don't write desktop-first with `max-md:` / `max-sm:` overrides — it inverts the mental model and makes diffs harder to read.

## Component Kit (canon — เช็คตารางนี้ก่อนสร้าง component ใหม่)

**กฎเหล็ก:** ก่อนสร้าง component ใหม่ **ต้องเช็คตารางนี้ก่อน** — ถ้ามี canonical แล้วให้ใช้/ต่อยอดอันนั้น ห้ามสร้างซ้ำ. จะ deprecate ของเดิมหรือเพิ่ม canonical ใหม่ = อัปเดตตารางนี้ในคอมมิตเดียวกัน. เป้าหมาย: ตอบได้ใน 10 วิว่า "kit ทางการมีอะไร" และของซ้ำทุกคู่เหลือตัวเดียว.

### ✅ Canonical — ใช้อันนี้

| หมวด | Component | ไฟล์ | ใช้เมื่อ |
| --- | --- | --- | --- |
| Surface / panel | `Surface` | `ui/surface.tsx` | กล่อง/พาเนลทุกใบ (variant + padding) |
| Section heading | `SectionHead` | `shared/section-head.tsx` | หัวข้อ section + action ขวา |
| Segmented / tab เลือก 1 จาก N | `SegmentedControl` · `Tabs` | `ui/segmented-control.tsx` · `ui/tabs.tsx` | pill/แท็บเลือกหนึ่งจากหลายตัว |
| List row (มือถือ) | `GroupedList`/`GroupedRow` · `ListRow` | `ui/grouped-list.tsx` · `ui/list-row.tsx` | แถวรายการ iOS-style |
| Empty state | `EmptyState` (หมี Kuma) | `shared/empty-state.tsx` | หน้า/ลิสต์ว่าง |
| ตัวเลขใหญ่ (KPI / ราคา hero) | `HeroNumber` | `ui/hero-number.tsx` | พอร์ตรวม / ราคา hero |
| Sparkline | `MiniSparkline` | `ui/mini-sparkline.tsx` | กราฟจิ๋วในแถว/การ์ด |
| Loading (ศูนย์ spinner) | `Skeleton` · `LoadingState` · `PageSkeleton` | `ui/skeleton.tsx` · `shared/loading-state.tsx` · `shared/page-skeleton.tsx` | โครงโหลด |
| Filter / toolbar | `FilterToolbar` · `GameFilterChips` | `shared/filter-toolbar.tsx` · `shared/game-filter-chips.tsx` | แถบกรอง/สลับมุมมอง |
| Page shell | `PageContainer` · `PageHeader` | `layout/page-container.tsx` · `layout/page-header.tsx` | max-width + หัวหน้า (+ bottom-nav padding) |
| ปุ่มย้อน (มือถือ) | `BackButton` · `Breadcrumb` | `shared/back-button.tsx` · `shared/breadcrumb.tsx` | ปุ่มย้อน honey inline ข้างหัวข้อ |
| Badge | `Badge` · `RarityBadge` · `ConditionBadge` · `GameBadge` | `ui/badge.tsx` · `shared/*-badge.tsx` | ป้ายสถานะ / rarity / สภาพ / เกม |
| Money | `PriceTag` | `ui/price-tag.tsx` | ราคา + %change (▲/▼) ทุกที่ |
| Toggle เปิด/ปิด | `Switch` | `ui/switch.tsx` | สวิตช์ on/off (settings) · hit ≥44px แต่แรก |
| ปุ่มไอคอนล้วน | `IconButton` | `ui/icon-button.tsx` | ปุ่ม icon-only (`ghost`/`solid`) · บังคับ `aria-label` |
| ดาวเรตติ้ง | `RatingStars` | `ui/rating-stars.tsx` | ดาว read-only สี amber (honey) เดียว ทุกที่ |
| Pill บันทึกแล้ว/ผิดพลาด | `SavedPill` | `shared/saved-pill.tsx` | feedback pill success/error (parent คุม timing) |
| Stepper จำนวน | `QtyStepper` | `ui/qty-stepper.tsx` | +/- จำนวน (`variant` split/joined · min/max · `showInput`) — drop/add-card/deck |
| ฟอร์มชื่อพอร์ต inline | `PortfolioNameForm` | `portfolio/portfolio-name-form.tsx` | create/rename พอร์ต inline (`sm`/`md`) |

### 🚧 ยุบต่อ (Phase 2.x — เหลือจุดเดียว)

- **`EditionToggle`** (`cards/card-detail/edition-toggle.tsx`) → `SegmentedControl` (KIT-10 ที่เหลือ) — **ยังไม่ยุบ**: migrate = tap 40→28px regression + active `bg-foreground/10`≠`bg-primary/15` + ทับ KIT-05 lift → ทำคู่ **Phase 5 tap + KIT-05** — 2.3

### ⛔ Deprecated / กำลังยุบ (อย่าใช้ในของใหม่ · ยุบตาม Phase 2)

| เดิม (อย่าใช้) | → ใช้แทน | finding |
| --- | --- | --- |
| `Delta` (`cards/card-detail/grade-value.tsx`) · `DirectionPill` (`alerts/alert-form.tsx`, local) | คงไว้ — ไม่ map เข้า `PriceTag` ตรงๆ (`Delta` มี abs+pct combo mode, `DirectionPill` เป็นปุ่ม toggle ไม่ใช่ตัวโชว์ค่า) — 2.2 migrate `DeltaText`/`ChangePill`/chip ใน `PriceDisplay` เสร็จแล้ว, ลบไฟล์เดิมทิ้งแล้ว | KIT-02 |
| `shared/sparkline.tsx` (`Sparkline`) | `ui/mini-sparkline.tsx` (`MiniSparkline`) | KIT-08 |
| `ViewToggle` (`ui/toolbar.tsx`) | `SegmentedControl` — ยุบเสร็จแล้ว, ลบ ViewToggle ทิ้ง (icon = `label` slot) · `EditionToggle` เหลือ (tap regression) | KIT-10 |
| toggle เขียนมือใน settings (×2) | `ui/switch.tsx` (`Switch`) — ยุบเสร็จแล้ว, ลบ local ทิ้ง (privacy toggle เดิม h-5 w-9 → ทรงมาตรฐาน) | SETTINGS-09 |
| IconButton เขียนเองใน 2 ไฟล์ portfolio + inline | `ui/icon-button.tsx` (`IconButton`) — ยุบเสร็จแล้ว, ลบ local ทิ้ง | PORTFOLIO-06 |
| ดาวเรตติ้งเขียนเอง 6 จุด (4 สี) | `ui/rating-stars.tsx` (`RatingStars`) — ยุบเสร็จแล้ว, เป็น amber เดียว | COMMERCE-13 |
| feedback pill ก๊อป 5 จุด | `shared/saved-pill.tsx` (`SavedPill`) — ยุบเสร็จแล้ว | SETTINGS-10 |
| stepper จำนวนเขียนเอง 3 จุด | `ui/qty-stepper.tsx` (`QtyStepper`) — ยุบครบ 3/3 (deck = `variant="joined"` + `min={0}` เก็บ behavior Minus→ลบการ์ด) | PLAY-07 |
| ฟอร์มชื่อพอร์ต inline ก๊อป 4 จุด | `portfolio/portfolio-name-form.tsx` (`PortfolioNameForm`) — ยุบเสร็จแล้ว, ลบ form ซ้ำทิ้ง | RESPONSIVE-04 |

> รายละเอียดการยุบทั้งหมด: `doc/uxui-refactor-plan.md` §Phase 2 · หลักฐานราย ID: `doc/uxui-audit-findings-2026-07-04.md`

## API Routes

### Use `apiHandler` wrappers — don't reinvent error handling

Every route under `src/app/api/**/route.ts` should be wrapped in either:

- `apiHandler(handler)` — for user-facing routes; catches unhandled errors and returns a consistent `500 { error }` envelope.
- `adminApiHandler(handler)` — for admin-gated routes; same as `apiHandler` but enforces admin auth first.

Inside the handler, **don't** wrap the entire body in `try { ... } catch { return 500 }`. The handler already does that and the inner catch only adds duplicate logging and conflicting error messages. Use `try/catch` only when you need to:

- Map a specific exception to a 4xx (e.g. `P2002` → `409`).
- Convert an error into graceful degradation (e.g. return `{ count: 0 }` when Stripe is down).

In those cases, narrow the `try` to just the call that can throw — not the whole handler.

### Auth helpers

- `requireAuthUser()` — for user routes; returns `{ ok: false, response }` with a 401 you can early-return.
- `requireAdmin()` / `requireAdminUser()` — for admin routes (use `adminApiHandler` instead when possible).

Don't manually re-check `if (!user) return 401` after these — they already do that.

### Validation

Every `POST` / `PATCH` body should be validated with a Zod schema kept in `src/lib/<feature>/schemas.ts` and parsed via `parseJsonBody(req, Schema)`. Hand-rolled `if (typeof x === ...) return 400` checks are technical debt — they drift from the type and get duplicated across endpoints.

### Response envelope

Routes have historically returned a different shape per endpoint (`{ user }`, `{ orders, total }`, `{ saved: true }`, raw arrays...). For new and refactored routes, follow these conventions:


| Route type                          | Success                                                                                                               | Error                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| User-facing (CRUD, GET single/list) | `NextResponse.json({ data })` or named keys (`{ listing }`, `{ orders, total }`) when the legacy shape already exists | `NextResponse.json({ error: "..." }, { status })` |
| Mutation acknowledgements           | `NextResponse.json({ ok: true, ... })`                                                                                | `{ error }`                                       |
| Cron / internal jobs                | `NextResponse.json({ ok: true, ...stats })` (keep existing shape)                                                     | `{ error }`                                       |


Rules:

- **Always** use `{ error: "..." }` on the failure path — never `{ message }`, `{ err }`, etc. Status code carries the meaning; the body is only there for humans.
- For new endpoints, prefer `{ data }` over arbitrary key names so callers don't have to memorize the field. Existing routes can stay with their named keys until the next break.
- Don't mix `{ ok: true, data }` with `{ data }` in the same route family — pick one and stick with it within `src/app/api/<feature>/`.
- 5xx errors come from `apiHandler` automatically (`{ error: "Internal server error" }`). Don't re-emit them inside the handler.
## คำสั่งหลัก
- ติดตั้ง: `npm install`
- รัน dev: `npm run dev`  ·  build: `npm run build` (รัน `prisma generate` ก่อน)  ·  start: `npm run start`
- test: `npm run test` (vitest)  ·  lint: `npm run lint` (eslint)
- data: `npm run pipeline` / `scrape:daily` / `db:seed` / `translate:thai` (ดู `scripts/`)

## 🔄 วงจรการทำงาน (บังคับ — กันหลุด 3 อย่าง)
1. **เริ่มงาน** → อ่าน `SPEC.md` (อะไรคือเสร็จ) + `PLAN.md` (ทำถึง task ไหน) + `PROGRESS.md` (สถานะสด) ก่อนแตะโค้ด
2. **งานใหญ่/หลายขั้น** → อัปเดต `PLAN.md` ก่อนลงมือ (แตกเป็น task ติ๊กได้) · ทำทีละ task ไม่กระโดด
3. **ก่อนเคลม "เสร็จ"** → verify ครบทุกข้อใน `SPEC.md` (รัน lint + test + build + เปิดดูจริง) — ห้ามเคลมลอยๆ
4. **ก่อนจบงาน** → เขียนทับ `PROGRESS.md` (ทำอะไรไป · ค้างตรงไหน · NEXT) + ติ๊ก `PLAN.md`

## permission (3 ชั้น)
- ✅ ทำได้เลย: แก้โค้ดตามที่สั่ง · รัน test/lint/build
- ⚠️ ถามก่อน: ลบไฟล์ · แก้ Prisma schema/migration · เพิ่ม dependency · แตะ config (next/vercel/env) · รัน scrape/seed ที่เขียน DB จริง
- ⛔ ห้าม: push เข้า `master` ตรงๆ · commit secret (.env) · ลบ/ปิด test เพื่อให้ผ่าน · `prisma migrate reset` บน DB จริง
