# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history แล้ว) · hook โหลดไฟล์นี้เข้าทุก session
> session ใหม่: อ่านอันนี้ก่อนเริ่ม แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-13 — **เข้า Design phase แล้ว · เขียนแผน [REDESIGN.md](REDESIGN.md) เสร็จ · รอเบสเคาะ §6 ก่อนลงมือ P0**

## ✅ master พร้อม (verified)
- branch: `master` @ `0b24fb2` (สะอาด, ยังไม่มี commit ของ design phase) · tsc clean · lint **0 errors / 80 warnings** · test 36/36 · build ✓ (static 145/145)
- refactor phase merge เข้า master หมดแล้ว (PR #3/#4/#5) · ไม่มี branch ค้าง

## 🎨 Design phase — แผนพร้อมแล้ว (อ่าน REDESIGN.md เป็นหลัก)
**[REDESIGN.md](REDESIGN.md) = SSOT ของ design phase** (จาก audit 7 ด้าน + synthesize 4 ด้าน ผ่าน workflow)
- **โจทย์:** ผู้ใช้บอก UX ใช้ยาก + ใช้มือถือเป็นหลัก · ต้องรองรับอนาคต: multi-game (Pokémon), meta cards, tier list, deck builder, marketplace, ads
- **insight สำคัญ:** ฐาน design แข็งแรง (typography tokens 788 จุด / 0 arbitrary px / dark mode ครบ) → ปัญหาอยู่ที่ **IA/nav/ความหนาแน่นมือถือ** = refine ไม่ใช่รื้อ
- **IA ใหม่:** bottom-nav 4+More นิ่ง (Market·Browse·Decks·Portfolio·More) เลิกสลับ tab ตาม flag · GameSwitcher pill · Decks hub · AdSlot named placements
- **roadmap:** P0 foundation (chrome/tokens/primitives) → P1 core pages (card-detail แย่สุด) → P2 portfolio/tools → P3 marketplace → P4 Pokémon → P5 meta/tier/deck

## ⚠️ รอเบสเคาะ (REDESIGN.md §6) ก่อนลงมือ
1. **URL strategy multi-game** — (A) flat+state vs (B) `/[game]/` prefix · **ผมแนะนำ B** (เบสอยากรองรับอนาคต + redesign แตะทุกหน้าอยู่แล้ว = จังหวะถูกสุด)
2. Portfolio per-game vs mixed · 3. CardType enum ขยาย vs string · 4. เริ่ม phase ไหน (แนะนำ P0)

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
1. **เบสเคาะ REDESIGN.md §6** (URL strategy + phase เริ่มต้น)
2. ผมแตก task P0 ลง PLAN.md → ลงมือ (branch + PR, ห้าม push master ตรง)
3. (เมื่ออนุมัติ) จัดบ้าน docs ตาม §8
