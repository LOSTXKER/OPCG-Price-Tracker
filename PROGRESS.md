# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history แล้ว) · hook โหลดไฟล์นี้เข้าทุก session
> session ใหม่: อ่านอันนี้ก่อนเริ่ม แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-14 — **Declutter Batch 5 (honey มือถือ) + Batch 6 (desktop balance) เสร็จ + verified → declutter sweep ครบทุก batch · core redesign P0–P2 + P4 foundation + multi-game seam ครบ**

## ▶ สถานะตอนนี้
- merged ทั้งหมด: **P0 (#7/#8/#9) · P1.1–P1.5 (#10–#14) · P2.1/2.2 (#15/#16) · P4.1 (#17) · P4.2 (#18)** = 12 PR
- **P4.2 migration deployed เข้า Supabase prod แล้ว** (gameId 6 ตาราง)
- **P4 decisions:** Portfolio per-game · CardType ขยาย enum · schema approved

## ✅ P0a — Nav IA foundation (merged PR #7)
- bottom-nav **freeze 5 tab นิ่ง** (Market·Browse·Decks·Portfolio·More) · Search ย้าย header · badge → Portfolio
- `/decks` hub · header desktop align · menu-sheet Tools→hub · ui-store `currentGame` · i18n +6 keys

## ✅ P0b — AdSlot + Consent (merged PR #8)
- `<AdSlot placement>` (`src/components/ads/`) — FREE-only + route-excluded + house-ad · null เมื่อซ่อน · AdSense dormant จนตั้ง `NEXT_PUBLIC_ADSENSE_CLIENT`
- `ConsentBanner` + `adConsent` (persist) dormant จน env · migrate HomeAdCard→AdSlot + mobile home ad · billing `adFree`

## ✅ P0c — polish (verified: tsc clean · lint 0err/78warn · test 36/36 · build ✓ · parity 1492×3)
- command palette: "Pages" nav shortcuts (9 หน้า) — ค้นหน้าได้ไม่ใช่แค่การ์ด + keyboard nav
- footer มือถือเข้าถึงได้ (เลิก `hidden md:block` + pb clear bottom-nav)
- design tokens: `.text-price`/`.text-price-lg` + `--game-accent` (adopt บน PriceTag ตอน P1)

## 🎨 Design phase — แผนพร้อมแล้ว (อ่าน REDESIGN.md เป็นหลัก)
**[REDESIGN.md](REDESIGN.md) = SSOT ของ design phase** (จาก audit 7 ด้าน + synthesize 4 ด้าน ผ่าน workflow)
- **โจทย์:** ผู้ใช้บอก UX ใช้ยาก + ใช้มือถือเป็นหลัก · ต้องรองรับอนาคต: multi-game (Pokémon), meta cards, tier list, deck builder, marketplace, ads
- **insight สำคัญ:** ฐาน design แข็งแรง (typography tokens 788 จุด / 0 arbitrary px / dark mode ครบ) → ปัญหาอยู่ที่ **IA/nav/ความหนาแน่นมือถือ** = refine ไม่ใช่รื้อ
- **IA ใหม่:** bottom-nav 4+More นิ่ง (Market·Browse·Decks·Portfolio·More) เลิกสลับ tab ตาม flag · GameSwitcher pill · Decks hub · AdSlot named placements
- **roadmap:** P0 foundation (chrome/tokens/primitives) → P1 core pages (card-detail แย่สุด) → P2 portfolio/tools → P3 marketplace → P4 Pokémon → P5 meta/tier/deck

## ⚠️ decision ที่ยังเหลือ (REDESIGN.md §6) — เคาะตอนถึง P4
- ✅ URL strategy = **B (`/[game]/` prefix)** · ✅ เริ่ม P0
- ยังไม่เคาะ (ไม่บล็อก P0): Portfolio per-game vs mixed · CardType enum ขยาย vs string → เคาะตอน P4 (multi-game)

## ⬜ งานค้างเดิม (ไม่บล็อก design)
- **R4 data-fetching pages** (orders/saved/seller/admin ~10 หน้า) → ทำตอน redesign แต่ละหน้า
- **i18n interpolation** (3 ตัวมี `${var}`) · **component กลางๆ 400-580 บรรทัด** · **M0** cron `leaderboard-rewards` ไม่อยู่ใน vercel.json

## ✅ จัดบ้าน docs (REDESIGN §8 — DONE 2026-06-14 ผ่าน workflow)
- ลบ `docs/` dup + archive `detailed-plan`→`doc/archive/detailed-plan-2026-04-28.md` + `MTOP.pdf`→`doc/archive/` · rewrite 4 reference docs (data-pipeline R2+SNKRDUNK+crons · honey-economy weekly=scaffolding · honey-action runbook · MARKETPLACE BUILT-vs-PENDING) **cross-checked vs code จริง**
- โครงสุดท้าย: **root = 5 SSOT** (REDESIGN/SPEC/PLAN/PROGRESS/AGENTS) · **doc/ = 4 active reference + archive/** · fix cross-refs (PLAN/SPEC/REDESIGN) + side bug schemas.ts path + SPEC trial 7→14 (code = 14)
- ✅ README เขียนใหม่ (Meecard overview + getting started + docs map) · CLAUDE.md เกือบว่างโดยตั้งใจ (`@AGENTS.md` import — context จริงอยู่ `.claude/CLAUDE.md`)

## เครื่องมือ / สภาพแวดล้อม
- **`gh` login แล้ว** (LOSTXKER) → PR/merge ผ่าน CLI · **ห้าม push master ตรง** ใช้ PR เสมอ
- ถือ [AGENTS.md](AGENTS.md): typography tokens (ห้าม `text-[Xpx]`) · breakpoints (`sm:` data / `md:` chrome) · table→list `<sm`
- mock previews: portfolio-mock-preview, honey-mock-preview (เทียบ before/after)
- workflow audit output เต็ม: `/tmp/redesign_synth/` (audit.md + ia/design-system/future-arch/roadmap-docs.md)

## ✅ P1.1 — card-detail mobile (merged #10)
- ย่อรูปบนมือถือ · reorder (image → header/actions/price/info → siblings full-width → related) · AdSlot `card-detail-mid` · tap target h-11

## ✅ P1.2 — card-detail sticky bar (verified: tsc clean · lint 0err/78warn · test 36/36 · build ✓)
- `CardDetailStickyBar` มือถือ: ราคา + Add-to-Portfolio ลอยเหนือ bottom-nav เสมอ (desktop ใช้ inline)
- **defer มีเหตุผล**: chart-collapse (quick-view อยู่บนแล้ว + Recharts collapsed เสี่ยง) · `.text-price` adoption (PriceDisplay มี size system, force = regress)

## ✅ P1.3 — ListRow primitive (merged #12)
- `ui/list-row.tsx` · adopt ใน CardListRow → ใช้ทั่ว cards/sets/trending · MobileAssetCard/OrderCard คง bespoke

## ✅ P1.4 — cards browse (merged #13)
- browse จริง = `HomeMarketOverview` · filter → bottom sheet · AdSlot `browse-in-feed` · i18n applyFilters

## ✅ P1.5 — sets page (merged #14) → P1 หน้าหลักครบ (card-detail · cards-browse · sets)

## ✅ P2.1 — portfolio (merged #15) · Hero stat row ยุบบนมือถือ

## ✅ P2.2 — tools tap-targets (verified: tsc clean · lint 0err/78warn · test 36/36 · build ✓)
- drop-calc stepper size-7→9 + input h-7→9 · want-list remove p-0.5→1.5 + aria-label · (drop/deck calc mobile-structured อยู่แล้ว = tabs/list)

## ✅ P4.1 — GameSwitcher + Pokémon stub (verified: tsc clean · lint 0err/78warn · test 36/36 · build ✓ · parity 1494) — โค้ดล้วน ไม่แตะ DB
- `pokemon.ts` stub config (comingSoon) + register · `getActiveGameConfigs()` · GameConfig +flags (shortName/comingSoon/supports*/deckRules)
- `GameSwitcher` pill (header มือถือ+desktop) — OPCG active, Pokémon "เร็วๆ นี้" disabled · อ่าน/เซ็ต `currentGame` (persist)

## ✅ P4.2 — game-scoping schema (merged #18 + **deployed prod แล้ว**)
- `gameId Int?` (nullable) + FK SetNull + index บน Card/Portfolio/Deck/Listing/Yuyutei/Snkrdunk · Game back-relations
- migration `20260614000000_add_game_scoping` (additive ล้วน) · **apply เข้า Supabase prod แล้ว** ผ่าน `db execute` + `migrate resolve --applied` (option 1, ไม่แตะ drift) · verify gameId ครบ 6 ตาราง
- defer P4.3: enum ขยาย · backfill · NOT NULL · @@unique([gameId,cardCode])

## ⚠️ เจอ Prisma drift (มีมาก่อน, ตั้งเป็น M5 ใน PLAN)
- DB มี `20260422000000_add_saved_profile` (ไม่มีใน repo) · repo มี `20260429000000_drop_watchlist_note_target` (DB ยังไม่ mark applied) → ควรเคลียร์ด้วย `migrate resolve` ตอนมีเวลา + backup

## 🧹 Declutter audit (screenshot ทุกหน้า mobile+desktop) — เบสเลือก B (live pages ก่อน)
- แคป 22 หน้า × 2 (mobile 390 + desktop 1440) · 2 review workflows · 10 high + 48 med (JSON: /tmp/{mobile,desktop}-findings.json)
- **insight:** หน้าส่วนใหญ่ดีอยู่แล้ว — card-detail/drop-calc 5/5 มือถือ · toolbars (set-detail/trending/watchlist) wrap ดีอยู่แล้ว · **home รกสุด (2/5)** = ตัวจริง
- ✅ **Batch 1 home declutter** (#20) — toolbar wrap, featured stack, tap targets, hero-search
- ✅ **Batch 3+4 tap+token sweep** (#21) — compare X 36px, h2→.text-h2, badge/label tokens
- ✅ **Batch 5 honey declutter (มือถือ)** — ยุบ detail 3 การ์ด `hidden sm:block` + คง rank-progress strip `sm:hidden` (review จับ: ซ่อนหมดจะเสีย "+N 🍯 ถึงขั้นถัดไป" ไม่มีทางเข้าถึงอื่น) · tab `px-3 sm:px-4`
- ✅ **Batch 6 desktop balance** — card-detail grid 4/8 + price-hub divider symmetric 24px (แก้ gutter เบี้ยว 1px/20px เดิม) · drop-calc sidebar `xl:320px` (revert `xl:grid-cols-6` — review จับ regression ขยายจอแล้วการ์ดหด 156→135px) · login+register token sweep (`text-eyebrow`/`text-body-sm` size-faithful)
- **method:** ground-truth read + adversarial review workflow (5 agents) แทน pixel-capture · ตัด 6 findings ที่ stale/compliant/policy-conflict (login lg→md panel premise ผิด, want-list text-xs compliant) · verify: tsc clean · lint 0err/78warn · test 36/36 · build ✓
- ⬜ (เก็บตก) decks + deck-calc mobile review schema พลาด · honey ticket-used-this-month หายบนมือถือ (low-value, ยอมรับได้)

## ▶ NEXT
1. **P3 marketplace** (ตามที่เบสเลือก B = marketplace track ทีหลัง) — ตรวจ commerce flow (เปิด flag local + login) → overhaul mobile → เปิด flag จริง · M3 backend ค้าง (OrderEvent, auto-complete cron, escrow/Stripe Connect, DISPUTED)
2. **P4.3+ Pokémon** (ต้องหาแหล่งข้อมูลก่อน)
3. **เก็บกวาด:** M5 Prisma drift (แตะ DB จริง + backup) · docs §8 (11→5 active) · M0 cron `leaderboard-rewards` ไม่อยู่ใน vercel.json
