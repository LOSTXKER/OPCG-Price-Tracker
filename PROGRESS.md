# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-01 — **Unified card-search + MINE-family IA convergence** (เบส: "search ควรเป็นอันเดียวทั้งเว็บ · 3 หน้า personal ใช้งานง่ายเหมือนกัน" → workflow usability audit 5 agent → เบสเคาะ 4 ข้อ → build P1–P7)

## ✅ เสร็จ session นี้ — P1–P7 (task #11,12,13)
**โจทย์:** audit เจอ 3 หน้า personal = "3 แอปคนละคนทำ" · watchlist ไม่มีปุ่มเพิ่มการ์ด · badge แท็บพอร์ตนับข้อความ (ไม่เกี่ยว) · ปุ่มสลับเกมบนหน้า personal กดแล้วตาย · card search ~10 แบบทั้งเว็บ ไม่แชร์โค้ด
**เบสเคาะ:** (1) IA รวม 3 หน้าเป็นกลุ่ม **TRACK ในเมนู More** · (2) สลับเกมบนหน้า personal = **กรอง collection หน้านั้น** · (3) คงชื่อ "รายการโปรด" · (4) placeholder = **"ค้นหาชื่อหรือรหัส..."** ทั้งเว็บ

- **P1 trust fix ✅** — ย้าย unread-badge ออกจากแท็บพอร์ต → ปุ่ม More (bottom-nav) · watchlist ได้ปุ่ม **"เพิ่มการ์ด"** (header + empty state) → `WatchlistAddDialog` (CardSearch pick) เพิ่มในที่ ไม่เด้งออก /cards
- **P2 `CardSearch` กลาง ✅** (`src/components/shared/card-search.tsx`) — navigate+pick mode · game scope (default currentGame · ผ่าน useCardSearch + fetch-cards `game=`) · keyboard ↑↓↵Esc · recent searches · **ชุบ `SearchResultsDropdown` ที่ตาย** กลับมาใช้ · placeholder `searchByNameOrCode`
- **P3 double Cmd-K ✅** — ถอด Cmd-K binding + ป้าย ⌘K ออกจาก hero-search-bar (header palette เป็นเจ้าของ Cmd-K ที่เดียว) · **ไม่ downgrade hero bar เป็น CardSearch** (hero รวยกว่า: Sets+Popular+กล้อง)
- **P4 alert-create-dialog → CardSearch ✅** (pick step) · **nuance:** compare-picker / hero-bar / deck-calc / portfolio-add = **browse grid รวย** (set filter + sort + infinite scroll) → **ห้ามยุบเป็น CardSearch** (ของหาย) · CardSearch เหมาะแค่ search-select จริง = watchlist-add ✓ · alert ✓
- **P6 IA + switcher scope ✅** — game-switcher `switchGame` เซ็ต `mineGameFilter` ด้วย (สลับเกมบนหน้า MINE = กรอง collection ทันที ไม่ใช่ dead control) · portfolio/watchlist/alerts อ่าน `gameFilter` จาก `useUIStore(mineGameFilter)` ตัวเดียว (one control = one thing · session-only, ไม่ persist) · **mobile-menu กลุ่ม TRACK ใหม่** (Portfolio + Watchlist + Alerts รวมใต้ header เดียว · watchlist ออกจาก Browse · portfolio/alerts ออกจาก My Account)
- **P7 placeholder เดียว ✅** — `searchByNameOrCode` = "ค้นหาชื่อหรือรหัส..." ทั้งเว็บ
- i18n: เพิ่ม key `trackGroup` (th ของฉัน · en Mine · jp マイデータ)
- **verify:** tsc 0 · lint 0 err (25 warn เดิมทั้งหมด) · test 56/56 · build ✓ compiled

## ⏭️ DEFER โดยตั้งใจ (อย่าเผลอทำใน push ที่ไม่รีวิว)
- **P5 toolbar convergence** — รวม toolbar ของ Watchlist/Portfolio/Alerts/search เป็น `FilterToolbar` ตัวเดียว = refactor ใหญ่/เสี่ยงเกินกว่าจะยัดใน batch นี้ · แยก PR รอบหน้า
- **browse-picker unification** — compare/portfolio-add/deck-calc/hero-bar คง browse grid เดิม (รวยกว่า CardSearch) ไม่ยุบ
- P4 marketplace-select — รอ marketplace flag เปิด
- Phase 3 saved chips — รอ marketplace flag

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. MINE (portfolio/watchlist/alerts/saved) = **unified cross-game** flat URL + game-chips กรอง in-view · GAME'S (cards/sets/market/trending/compare/decks/calc) = แยก `/[game]/`
2. `mineGameFilter` = session-only store (ไม่ persist) · driven จากทั้ง in-page chips และ header switcher (one control)
3. CardSearch เฉพาะ search-select จริง (watchlist-add · alert) · browse tool รวยห้ามยุบ
4. chips self-hide เมื่อ <2 เกม (เกมเดียว = ไม่โชว์เลย)

## ⚠️ gotchas
- **runtime visual ยังไม่เปิดดูจริง** — verify แค่ compile/test/build · เบสควร login preview เช็ก: TRACK group ในเมนู More · watchlist "เพิ่มการ์ด" flow · สลับเกม header → chips หน้า MINE กรองตาม · alert create pick
- branch `ui/sets-redesign` = commit ก่อนหน้า (portfolio redesign + multi-game) merge เข้า master แล้ว (PR #49–52) · batch นี้ = commit ใหม่บนยอด

## ⏭️ NEXT
1. เบสเปิด preview เช็ก visual MINE surfaces (มือถือ) — TRACK menu · watchlist add · switcher→chips filter
2. P5 FilterToolbar convergence (แยก PR · refactor ใหญ่)
3. multi-game Phase 2 — หน้า browse อ่าน `getServerGame()` scope server-side + sitemap prefixed + `middleware.ts`→`proxy.ts`
