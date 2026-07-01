# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-01 — **MINE multi-game VISION redesign (Phase A–E build)** (เบส: "ทำให้ครบจบเสร็จ · รื้อ UX/UI ใหม่ได้ · ดูตาม VISION · /workflow" → design workflow 6-agent ออก spec → build [NO-SCHEMA] Phase A–E)

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` (จาก design workflow · แยก [NO-SCHEMA] vs [SCHEMA-GATED])
- **VISION:** §1 identity · §2 IA/TRACK · §4 discipline · §5.3 portfolio · §5.7 multi-game · §6 schema (⚠️ gated)

## ✅ เสร็จ session นี้ (3 commit)
**หลักการ:** MINE = กองเดียวรวมทุกเกม flat URL · 2 ปุ่มเกมไม่ทับกัน (header pill = นำทาง catalog เท่านั้น · in-page chips = กรอง list) · honey <5% · per-game tint = ชั้นบางทับ honey (crest/glow/frame · จาก `GameConfig.accentTint` · pokemon=เหลืองบาง opcg=baseline) · green/red = P/L เท่านั้น

- **commit ก่อนหน้า `a8ae7fa`** — multi-game พื้นฐาน (per-page filter · teaser · badge · scope label · add-card ข้ามเกม · null-game · mock `?demo=multigame`)
- **commit `5f76687` (Phase A–C):**
  - **A identity:** `GameConfig.accentTint` + `getGameAccentTint()` · `GameBadge` tint dot + size · `GameFilterChips` allValue
  - **B watchlist/alerts:** summary scope ตามเกม (เลิก OPCG leak) · grid badge · bell amber→honey · alert chip unit + all-count · **alert จัดกลุ่มตามเกมพับได้** (`alert-groups.tsx`) · filtered-empty "ดูทุกเกม"
  - **C portfolio:** `GameCrest` atom · wire `PortfolioGameBreakdown` เดิม (all-games only) + deep-link กดแถว→scope + tint share bar · scoped hero tint glow · `PortfolioScopedHonestyStrip` แทน note กราฟ (Cost vs Market + P/L · ไม่ปลอมกราฟ)
- **commit นี้ (Phase D–E):**
  - **D switcher:** eyebrow "เลือกแคตตาล็อกเกม" (navigate-framed) · crest dot tint ต่อเกม · **MINE-route ⓘ hint** "ตัวกรองเกมอยู่ในหน้านี้ →" (dismiss-once · ui-store) — แก้ความสับสน 2 ปุ่มเกม
  - **E coming-soon:** per-game tint (glow + badge + "เร็วๆ นี้" chip) บน `/coming-soon`

i18n ใหม่: showAllGames · alertsUnit · byGame · browseCatalog · switcherMineHint (th/en/jp)
**verify ทุก commit:** tsc 0 · lint 0 err (1 warning เดิม) · test 56/56 · build ✓

## ⚠️ verify ภาพจริง — เบสต้อง login + `?demo=multigame`
เห็นได้เมื่อมี 2 เกม (OPCG จริง + Pokémon mock · ต้อง login) · เปิด `/portfolio` `/watchlist` `/settings/alerts` + `?demo=multigame`:
- portfolio: chip [ทุกเกม ฿รวม][OPCG][Pokémon] · **breakdown block กดแถว→scope** · กด Pokémon → hero glow เหลือง + honesty strip แทนกราฟ
- watchlist: summary ตามเกม · badge grid+list · bell honey
- alerts: **กลุ่มเกมพับได้** + crest · chip "N แจ้งเตือน"
- switcher (ทุกหน้า): dot สีตามเกม · บนหน้า MINE มี ⓘ hint

## ⏭️ DEFER (ตั้งใจ · บอกเบสแล้ว)
- **Phase F desktop 2-rail** (portfolio/watchlist/alerts lg: side-rail) — layout refactor ใหญ่ · verify ภาพไม่ได้ (ต้อง login) · เสี่ยง regress mobile ที่ polished แล้ว → ทำตอน iterate ภาพได้
- **switcher per-row data** ("128 ใบ · ฿42,300") — ต้อง endpoint summary + fetch ใน header (perf) → ทำพร้อม data จริง
- **pinning เกม** — low value ตอนมี 2 เกม
- **notify-me form + `/api/notify/[game]`** — ฟอร์มเก็บอีเมลต้องมี `GameNotifySignup` table (durable) ไม่งั้นหลอกผู้ใช้ → ไป Phase G
- **movers/holdings tint ring · alert set-subheader** — polish รอง

## ⛔ SCHEMA-GATED (Phase G · เบสอนุมัติก่อน migrate — VISION §6)
1. **per-game `PortfolioSnapshot`** (gameId + netInvestedJpy) → กราฟพอร์ตแยกเกมจริง (แทน honesty strip)
2. **`Card.gameId` NOT NULL + `@@unique` + gameMeta** → 2 เกมจริง (เลิกพึ่ง `?demo=multigame`)
3. **`GameNotifySignup` table** → notify-me durable
4. **named watchlists** · Game.accentTint/sortOrder/isComingSoon columns · TransactionType+SELL + indexPriceJpy

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. MINE = unified cross-game · flat URL · in-page chips (owner amendment) — ไม่แยก /[game]/ silo
2. filter = local state ต่อหน้า · header pill = catalog เท่านั้น (revert 1f07ff9)
3. per-game tint = crest/glow/frame เท่านั้น · **ห้าม `--game-tint`/tint บน fill/CTA/ring** (opcg ดูปกติแต่ pokemon พัง) · ต่อ element inline
4. portfolio breakdown = all-games view เท่านั้น · unmount ตอน scoped (one-hero rule)
5. mock demo = client-only · ลบเมื่อ data จริงมา

## ⏭️ NEXT
1. **เบส login + `?demo=multigame` เช็ก visual 3 หน้า + switcher hint** (มือถือ+desktop) → บอกปรับตรงไหน
2. เบสตัดสิน SCHEMA-GATED (Phase G) — จะแตะ DB ทำ per-game chart / real 2-game data / notify / named watchlist ไหม
3. (ถ้าเอา) Phase F desktop 2-rail — ทำตอน iterate ภาพได้
