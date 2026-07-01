# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-01 — **MINE multi-game UX เฟส 1+1.5+2 (+ mock Pokémon)** (เบส: "ออกแบบยังไงไม่ให้งง ดูเว็บระดับโลก" → workflow 7-agent → "เริ่มเลย" → "ทำต่อให้จบ ขอ mockdata ก่อน")

## ✅ เสร็จ session นี้
**หลักการเดียว:** "ของฉัน" = กองเดียวรวมทุกเกมเป็น default · เกม = ป้าย + ตัวกรองในหน้า ไม่ใช่โหมด (Robinhood/Coinbase/Collectr) · header pill = แคตตาล็อกเท่านั้น (NN/g "devastating")

### เฟส 1 — trust fixes โครงสร้าง
chip filter **แยกต่อหน้า** (ลบ shared `mineGameFilter` จาก ui-store → local `useState`) · `useGameFilterReset` reset→ทุกเกมเมื่อเกม active หลุด data · ล้าง comment โกหก · **coming-soon teaser** ในราง chip

### เฟส 1.5 — safe correctness
**add-card/alert ค้นข้ามทุกเกม** (`<CardSearch game="all">`) · **null-game fold** (`gameBreakdown` → DEFAULT_GAME ให้ยอด chip ตรง hero)

### เฟส 2 — mock Pokémon + multi-game UI เห็นได้จริง
- **mock client-only** `src/lib/mock/multigame-demo.ts` — เปิดด้วย **`?demo=multigame`** ต่อท้าย URL → inject Pokémon (พอร์ต 3 · watchlist 2 · alert 2) เข้าลิสต์ · `useSyncExternalStore` (hydration-safe ไม่ setState-in-effect) · **ไม่แตะ DB/schema · ลบง่าย**
- **badge เกมทุกแถว** — `GameBadge` กลาง (`src/components/shared/game-badge.tsx`) โชว์เมื่อ ≥2 เกม: portfolio list (desktop-row+mobile-card) · watchlist list · alert-row (grid ใช้ chip rail แทน)
- **ป้าย scope hero** ("· Pokémon" สี primary) + **ซ่อนกราฟตอนกรองเกม** + note (กราฟ = whole-portfolio · per-game history ต้องแตะ DB → ซ่อนแทนโชว์ผิด) · derive `activeScrub` กัน stale
- **teaser exclusion** — เกมที่เป็น chip จริงแล้ว ไม่โชว์ teaser ซ้ำ
- **fix: พอร์ตไม่โชว์ chip** (เบสแจ้ง) — `PortfolioGameChips` + `availableGames` กรอง `b.game &&` (ต้องมี game object) ต่างจาก watchlist/alerts ที่ทน null → OPCG set ที่ `gameId` ยัง null หายจาก chip พอร์ต · แก้เป็น `slug ?? DEFAULT_GAME` (สอดคล้อง watchlist/alerts · ปลอดภัยทั้งกรณี backfill แล้ว/ยัง)

**ไฟล์ใหม่:** `hooks/use-game-filter.ts` · `lib/mock/multigame-demo.ts` · `components/shared/game-badge.tsx`
**ไฟล์แก้:** ui-store · use-portfolio-api · game-filter-chips · portfolio-hero · portfolio-client · assets-table{index,desktop-table,desktop-row,mobile-card} · watchlist-client · watchlist-list-view · watchlist-add-dialog · alerts-manager-client · alert-row · alert-create-dialog · i18n th/en/jp (+`chartAllGamesOnly`)

**verify:** tsc 0 · lint 0 err (1 warning เดิม `p.loadTransactions`) · test 56/56 · build ✓

## ⚠️ ยังไม่ได้ verify ภาพจริง — เบสต้องเช็ก (สำคัญ)
mock inject เข้า **ผลลัพธ์ fetch ที่สำเร็จ** → **ต้อง login ก่อนถึงเห็น 2 เกม** (OPCG จริง + Pokémon mock). ผม verify เองไม่ได้ (ไม่มี credential · unauthed = fetch 401 = ไม่ inject). **เบส login แล้วเปิด:**
- `/portfolio?demo=multigame` · `/watchlist?demo=multigame` · `/settings/alerts?demo=multigame`
- ควรเห็น: chip rail [ทุกเกม][OPCG][Pokémon] · badge "Pokémon" ท้ายแถว · กดชิป Pokémon → hero ป้าย "· Pokémon" + กราฟหาย+note · teaser ไม่ซ้ำ
- **ถอด `?demo=multigame` = กลับปกติ** (เกมเดียว + teaser "เร็วๆ นี้")
- ⚠️ mock row กด edit/delete จะ error (id ติดลบ ไม่มีใน DB) — เป็น demo ดูอย่างเดียว

## ⛔ GATED — รอเบสเคาะ (แตะ schema DB)
1. **กราฟพอร์ต per-game history จริง** — `PortfolioSnapshot` ไม่มี per-game (ตอนนี้ซ่อนกราฟตอนกรองแทน) · ต้องเพิ่มคอลัมน์/ตาราง (อนุมัติ migrate)
2. **หลาย named watchlist** (CMC-style) — watchlist ตอนนี้ list เดียว/user

## ⏭️ เฟสถัดไป (ไม่เร่ง · ไม่แตะ schema)
จัดกลุ่ม alert เกม→set พับได้ · สร้าง alert จากกระดิ่งบนการ์ด · ยอด sticky scroll · ตัวเลขกำกับ chip · badge บน grid views · **ลบ mock demo เมื่อ Pokémon data จริงมา**

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. MINE = unified cross-game · เกม = ตัวกรองในหน้า ไม่แยก URL/silo
2. filter เกม = **local state ต่อหน้า** — ยกเลิกมติเดิม "one shared mineGameFilter" (shared = dead-end)
3. header pill = แคตตาล็อกเท่านั้น · ห้ามกรอง MINE เงียบๆ (revert 1f07ff9)
4. chips self-hide <2 เกมจริง · teaser coming-soon โชว์ถ้ามีเกม comingSoon (ไม่ซ้ำกับ chip จริง)
5. add-card ใน MINE = ค้นข้ามทุกเกม เกมมาจากการ์ด
6. mock = client-only demo (`?demo=multigame`) ไม่แตะ DB · ลบเมื่อ data จริงมา

## ⏭️ NEXT
1. **เบส login เปิด 3 หน้า + `?demo=multigame` เช็ก visual** (มือถือ+desktop) — chip/badge/scope/กราฟหาย/teaser
2. commit เฟส 1+1.5+2 (branch `ui/sets-redesign` · ยังไม่ push master — เบสเคาะ)
3. เบสตัดสิน GATED — จะแตะ schema ทำ per-game history + named watchlist ไหม
