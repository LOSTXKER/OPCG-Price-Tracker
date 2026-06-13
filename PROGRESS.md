# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history แล้ว) · hook โหลดไฟล์นี้เข้าทุก session
> session ใหม่: อ่านอันนี้ก่อนเริ่ม แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-14 — **P2.1 portfolio merged (#15) · P2.2 tools tap-targets เสร็จ verified · core UI redesign (P0+P1+P2) เกือบครบ · URL strategy = B**

## ▶ สถานะตอนนี้
- merged: **P0 (#7/#8/#9) + P1.1–P1.5 (#10–#14) + P2.1 (#15)** · master @ `77da275`
- branch ทำงาน: `redesign/p2-tools` — P2.2 verified, กำลังจะเปิด PR
- เบสเคาะ: **URL strategy = B (`/[game]/` prefix)** · roadmap P0→P5 ใน REDESIGN.md
- เบสสั่ง "ทำรวดเดียวไม่หยุดถาม" → ผมลุย UI ที่ปลอดภัยต่อ, หยุดที่กำแพง schema/decision

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

## 📋 แผนจัดบ้าน docs (REDESIGN.md §8 — ⚠️ รออนุมัติก่อนลบ/ย้าย)
- docs รก 11 ไฟล์ → เป้า 5 active (REDESIGN/SPEC/PLAN/PROGRESS/AGENTS) + 3 reference + archive
- `docs/MARKETPLACE_OVERHAUL.md` = dup ของ `doc/` (byte-identical) · `doc/MTOP.pdf` 957KB binary · README เป็น bootstrap template · CLAUDE.md เกือบว่าง

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

## 🧱 กำแพงที่ต้องเบสเคาะก่อนทำต่อ (ทำเองไม่ได้)
- **P4 multi-game/Pokémon** + **P5 tier/meta/deck-builder** = ต้อง **Prisma schema migration** (⚠️ permission: ขออนุมัติ) + decision ค้าง: **Portfolio per-game vs mixed**, **CardType enum ขยาย vs string** (REDESIGN.md §6)
- **P3 marketplace** = งาน UI ใหญ่มาก (listing wizard mobile, messaging chrome, sticky buy bar) · flag ปิดอยู่ ไม่เร่ง · ทำได้ถ้าเบสสั่ง

## ▶ NEXT
1. **merge PR P2.2** → core UI redesign (P0+P1+P2) เสร็จเป็นกอบเป็นกำ
2. เบสเคาะทิศ: (a) P3 marketplace UI (ใหญ่ ทำได้เลย) · (b) P4/P5 — **เคาะ decision §6 + อนุมัติ schema ก่อน** · (c) จัดบ้าน docs §8 · (d) จบรอบ deploy/ดูจริง
