# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history แล้ว) · hook โหลดไฟล์นี้เข้าทุก session
> session ใหม่: อ่านอันนี้ก่อนเริ่ม แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-14 — **Design phase: P0a merged (PR #7) · P0b (ads+consent) เสร็จ verified · URL strategy = B**

## ▶ สถานะตอนนี้
- **P0a merged เข้า master แล้ว** (PR #7) · master @ `e9796f9`
- branch ทำงาน: `redesign/p0b-ads-consent` — P0b verified, กำลังจะเปิด PR
- เบสเคาะ: **URL strategy = B (`/[game]/` prefix)** · roadmap P0→P5 ใน REDESIGN.md

## ✅ P0a — Nav IA foundation (merged PR #7)
- bottom-nav **freeze 5 tab นิ่ง** (Market·Browse·Decks·Portfolio·More) · Search ย้าย header · badge → Portfolio
- `/decks` hub · header desktop align · menu-sheet Tools→hub · ui-store `currentGame` · i18n +6 keys

## ✅ P0b — AdSlot + Consent (verified: tsc clean · lint 0err/78warn · test 36/36 · build ✓)
- `<AdSlot placement>` (`src/components/ads/`) — FREE-only + route-excluded + house-ad (Upgrade-to-Pro) · null เมื่อซ่อน · AdSense dormant จนตั้ง `NEXT_PUBLIC_ADSENSE_CLIENT`
- `ConsentBanner` + `adConsent` (persist) dormant จน env · migrate HomeAdCard→AdSlot + mobile home ad · billing `adFree` key · i18n +5 keys (parity 1491)

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

## ▶ NEXT
1. **merge PR P0b** (ads+consent) — เบส review/merge หรือสั่งผม
2. **P0c** (ปิดท้าย P0) — command palette (nav shortcuts) · footer มือถือเข้าถึงได้ · design-token pass (`.text-price` + `--game-accent`)
3. จบ P0 → **P1 core pages** (card-detail แย่สุด → home/cards/sets) · วาง AdSlot จริงตามหน้า (browse-in-feed, card-detail-mid)
4. (เมื่ออนุมัติ) จัดบ้าน docs ตาม REDESIGN.md §8
