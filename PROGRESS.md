# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-04 — **UX/UI Refactor Phase 0 เสร็จ 16/17 (verify ครบ) · branch `fix/uxui-phase-0`**

## ✅ เสร็จ session นี้ — Phase 0 (แก้ของพัง/เสี่ยงจริง) ตามแผน doc/uxui-refactor-plan.md
เบสสั่ง "เริ่ม Phase 0 ได้" — แก้ 16 ข้อ (branch `fix/uxui-phase-0`, ยังไม่ merge). แผนแม่บท + หลักฐาน 230 findings อยู่ `doc/uxui-refactor-plan.md` + `doc/uxui-audit-findings-2026-07-04.md` (ทำ session ก่อน).

**แก้แล้ว (16):**
1. `IA-NAV-01/07`+`CHROME-06` — แท็บ active ไม่ติดใต้ `/opcg/` → `isNavActive` helper เดียวใน `lib/game/constants.ts` (strip game prefix + owner-aware), header + bottom-nav ใช้ร่วม, More = fallback tab, ลบ `TOOL_LINKS` ตาย
2. `PORTFOLIO-03` — edit dialog ราคาทุนหน่วยเงินเพี้ยน (โชว์ JPY ดิบ) → แปลง display↔JPY + symbol prefix + string-compare กัน round-trip drift (`single-edit-dialog` + `bulk-edit-dialog`)
3. `CHROME-01`/`IDENTITY-02` — CTA "ทักผู้ขาย" ถูก bottom-nav ทับ → ยกขึ้น `bottom:calc(4rem+safe)` + pb เนื้อหาพ้น 2 แถบ
4. `COMMERCE-03` — chat order panel ทับจอมือถือปิดไม่ได้ → default ปิด <lg + backdrop แตะปิด (desktop lg:static คงเดิม)
5. `PLAY-01` — deck-calc qty ล็อก 1 → stepper ต่อแถว (1-4) + addCard bump แทน reset + คง dialog เปิด · `PLAY-02` ลบเด็คมี confirm แล้ว
6. `TRACK-01` — กระดิ่งการ์ดที่มี alert → route ไป `/settings/alerts` แทนสร้างซ้ำ (inline sheet = Phase 5, entry มีแค่ boolean)
7. `HONEY-04` — `/honey` sync `?tab=` กับ URL (Suspense) — deep-link จาก pricing + back ทำงาน
8. `IDENTITY-05` redirect `/profile` (ไม่ใช่ /settings) · `IDENTITY-08` wire "ดูรายการขาย"→tab จริง + Report = "กำลังมา" (honest)
9. `SETTINGS-01` — gate marketplace section ด้วย flag (sidebar + mobile index) · `CHROME-02` settings gutter ซ้อน → `inShell` (20px มือถือ) · `CHROME-03`/`IDENTITY-04` `/u/` + `/@` เข้า FULL_WIDTH_ROUTES
10. `CONTENT-01` — blog `.prose` เขียนเองใน globals.css map token (ไม่เพิ่ม dependency) · `STATES-02` `not-found.tsx` หมีหลงทาง + ปุ่มกลับ
11. `HOME-01`+`DISCOVERY-11` **perf** — home ตัด searchParams + market-overview/trending ตัด force-dynamic → **build ยืนยัน `/` `/market-overview` `/trending` = static prerendered** · `/cards?search=`→/search · trending tab อ่าน client-side

**verify:** tsc 0 · lint 0 error (34 warning เดิม) · test 56/56 · **build ✓** (ยืนยัน index.html + market-overview.html prerendered, trending `○ 5m`) · i18n +5 key ×3 (confirmDeleteDeck/decrease/increase + rename profileReportSent→profileReportSoon) parity ครบ · **ยังไม่ได้เปิด browser จริงดู** (เบสช่วยเช็คได้)

## ⏭️ NEXT
1. **⏸️ `SETTINGS-03` (2FA QR รั่วให้ api.qrserver.com) — รอเบสเคาะ:** จะเพิ่ม lib `qrcode` (สร้าง QR ฝั่ง client) มั้ย? เขียน QR encoder เองไม่คุ้ม/เสี่ยง — นี่คือข้อ security ที่ severity สูงสุดใน Phase 0 ควรจบก่อน
2. เบสเปิด browser จริงเช็ค Phase 0 (โดยเฉพาะ: แท็บ active ติดถูกทุกหน้าใต้ /opcg/ · portfolio edit ราคาทุนหน่วยถูก · deck qty stepper · chat มือถือ · profile CTA ไม่ถูกทับ) → ถ้าโอเคเปิด PR `fix/uxui-phase-0`
3. `SETS-05` + `CONTENT-03` (query trim) ย้ายไป Phase 5 surface work (correctness risk ต้องมี context เต็ม)
4. **Phase 1 (ลบของตาย ~3,000 บรรทัด)** — ⚠️ ต้องเบสอนุมัติรายการลบก่อน (list ใน แผน §Phase 1)
5. งานทั้งหมดบน branch `fix/uxui-phase-0` แยกจาก master · ห้าม push master ตรง

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings, อ้างด้วย ID)
