# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (log อยู่ใน git history แล้ว) · hook โหลดไฟล์นี้เข้าทุก session
> session ใหม่: อ่านอันนี้ก่อนเริ่ม แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-13 (R2 fetch-migration รอบใหญ่)

## ⚠️ ตำแหน่งโปรเจกต์เปลี่ยนแล้ว
- **ที่อยู่ใหม่: `~/dev/OPCG-Price-Tracker-master`** (ย้ายออกจาก `~/Desktop/dev` ที่ iCloud sync กินไฟล์)
- ของเดิมที่ `~/Desktop/dev` = backup เก่า (iCloud) — ยืนยันที่ใหม่โอเคแล้วค่อยลบทิ้ง + ปิด iCloud Desktop sync
- ถ้า session นี้ยัง root อยู่ที่ `~/Desktop/dev/...` ให้ **รีสตาร์ท Claude Code จาก `~/dev/OPCG-Price-Tracker-master`**

## ทำถึงไหน (refactor — เบสสั่ง "Refactor ก่อน เดี๋ยวค่อยปรับ Design")
- **commit + push แล้ว**: branch `refactor/mobile-ux-and-data-layer` (commit `5925fc6`, 73 ไฟล์) → push origin แล้ว · ยังไม่เปิด PR (gh ไม่ได้ติดตั้ง — เปิดผ่านลิงก์ GitHub)
- เนื้องาน: R0 (chromeless auth, sets table fallback) · R1 (typography token) · R2 (lib/api/client.ts + shared-resource.ts + migrate 9 hooks + section-addresses) · lint errors 29→0 (useHydrated, daysSince/daysUntil, hoist hooks) · ซ่อม earn.test stub
- **R2 รอบใหม่ (workflow 91-agent): migrate raw `fetch('/api')` → `@/lib/api/client` ใน 44 client files** (internal /api fetch 99→6, เหลือเฉพาะ FormData upload) · แตก `PortfolioMockPreview` ออกเป็นไฟล์แยก (portfolio-client 661→509) · ซ่อม 2 lint error ใหม่ (setState-in-effect → ห่อ setTimeout(…,0) ตาม pattern use-portfolio-api) · net −422 บรรทัด
- **R2 ปิด FormData: เพิ่ม `apiForm` helper (multipart, ไม่ set Content-Type) + refactor `ensureOk` ร่วม** → migrate 5 FormData upload ที่เหลือ (photo-search /api/cards/identify · listings/upload ×2 · me/cover · me/avatar)
- **R2 admin (workflow 18-agent): migrate admin client raw fetch + legacy `adminJsonFetch` → `adminFetch` ใน 9 ไฟล์** (13 raw sites + 14 adminJsonFetch calls) · เพิ่ม `adminForm` helper + migrate image-uploader · ระวัง GET/POST default trap (adminJsonFetch default POST แต่ adminFetch default GET) — verify ผ่าน 0 high-sev · **`adminJsonFetch` retired** (`src/lib/api/admin-client.ts` ไม่มีใคร import แล้ว — ลบได้)
- **ผลรวม: client code ไม่มี raw `fetch('/api')` เหลือเลย (0)** — ทุก client API call ผ่าน `@/lib/api/client` (user) หรือ `@/lib/admin/admin-fetch` (admin)
- verify ที่ `~/dev` (สด ไม่มี iCloud): lint 0 errors/81 warn ✓ · tsc clean ✓ · test 36/36 ✓ · **build ผ่าน** Compiled 6.8s, static 145/145 ✓

## ค้าง / ติดอะไร
- เปิด PR: https://github.com/LOSTXKER/OPCG-Price-Tracker/pull/new/refactor/mobile-ux-and-data-layer
- ✅ zombie junk ลบแล้ว (svg×5, meecard.png ซ้ำ, `use-portfolio-api 2.ts` เก่า) · **`docs/MARKETPLACE_OVERHAUL.md` ไม่ใช่ junk** — เป็นแผนงาน (PLAN.md อ้างถึง) commit เก็บแล้ว
- repo อื่นที่ย้ายมาด้วย (anajak-stock-main, Git/{anajak-erp,anajak-stock,bestos,bill-tracker}) คัดลอก source+.git แล้ว แต่ยังไม่ได้ npm install — install ตอนจะใช้
- R2 ค้าง: ลบ `src/lib/api/admin-client.ts` (dead code — รอ confirm) · แตก client components ยักษ์ที่เหลือ · R3 i18n 152 ไฟล์ · R4 client→server pages
- yuyutei/snkrdunk: บาง mutation handler ไม่มี try/catch (unhandled reject ถ้า fail) — pre-existing ตั้งแต่ใช้ adminJsonFetch ไม่ใช่ของใหม่ · ใช้ `toastOnError` ของ adminFetch เก็บงานได้ถ้าจะปรับ
- เดิม: cron leaderboard-rewards ไม่อยู่ใน vercel.json (M0)

## R3 แตก client components ยักษ์ (เริ่มแล้ว — user-facing ก่อน)
- ✅ `compare-client` 634→357 → แตก `_components/card-rail.tsx` (151) + `_components/compare-dossier.tsx` (175)
- ✅ `today-card` 642→5 (barrel) → แตก `streak-card.tsx` (325) + `streak-info-popover.tsx` (178) + `today-missions-card.tsx` (144) · importer (missions-tab) ใช้ barrel เดิมต่อได้
- ค้าง user-facing: price-hub (567) · alerts-manager (502) · search-client (497)
- ค้าง admin (ใหญ่สุด): snkrdunk-match (973) · cards-browser (792) · yuyutei (766)

## ▶ NEXT (ทำต่อทันที)
1. (เบส) เปิด PR + ลบ backup เก่าเมื่อพร้อม
2. แตก user-facing ตัวถัดไป: today-card (642) / price-hub (567)
3. รวม empty-state / R3 i18n เป็น batch (152 ไฟล์)
