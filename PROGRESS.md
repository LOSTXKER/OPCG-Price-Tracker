# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-05 — **Phase 0 + Phase 1 เสร็จ ขึ้น master หมดแล้ว (PR #57–#60 merged) · master สะอาด · เริ่มต่อได้ที่ Phase 2**

## ✅ เสร็จแล้ว ขึ้น master (session ล่าสุด — ทุกอย่างผ่าน branch+PR ไม่ push master ตรง)
- **PR #57** — Sheet ทางลัด "ดูเพิ่มเติม" มือถือ (bottom-sheet แทนเด้งไปหน้า /more เต็ม) · ไอคอนทั้งเว็บ: **รายการโปรด = Heart, พอร์ต = Briefcase** (14 จุด) · **รวม /watchlist เป็น 2 แท็บ** (การ์ดที่ติดตาม / แจ้งเตือนราคา — `?tab=alerts`, /settings/alerts → redirect, ถอด entry จาก settings)
- **PR #58** — footer มือถือ: **ซ่อนเฉพาะหน้าแอป** (พอร์ต/watchlist/honey/settings/decks/compare/search/orders/saved) · เก็บบนหน้าคอนเทนต์ + desktop (`FooterChrome` + `NO_MOBILE_FOOTER_ROUTES` ใน main-chrome)
- **PR #59** — Phase 1: ลบ dead code **~2,800 บรรทัด** (17 ไฟล์เต็ม + 13 จุดแก้ · delete-only)
- **PR #60** — Phase 1: extract-then-delete อีก **~560** (ย้าย `CHART_PERIODS`→lib/constants, `type CardListing`→card-detail/types แล้วลบ price-chart + card-listings-section + prune buildHeroMeta)
- **Phase 1 รวมลบ ~3,360 บรรทัด** (ตรง plan ประเมิน) · verify ทุก PR: **tsc0 · lint0 · build✓ · test 56/56**
- ก่อนหน้า (อยู่ใน #57): ปุ่มย้อนมือถือ inline honey ทั้งแอป

## ⏭️ NEXT — Phase 2 เป็นต้นไป (ตาม doc/uxui-refactor-plan.md · ลำดับ "สร้าง atom → กวาด token → กวาด state → ราย surface")
1. **Phase 2 — ประกาศ kit ทางการ + ยุบของซ้ำ** ← **แนะนำทำต่อ** (งาน Nami ทำต่อเนื่องได้เลย ไม่ต้อง gate เบส)
2. **Phase 3 — Token discipline sweep** (ความสม่ำเสมอระดับระบบ)
3. **Phase 4 — States: loading/empty/error** (กฎ "ศูนย์ spinner")
4. **Phase 5 — Mobile pass ราย surface** (⚠️ เบสเลือกลำดับหน้า · เปิดหมวดใน findings ประกอบ) — รวม `TRACK-02/03/08/09` (watchlist), `SETS-05`+`CONTENT-03` (query-restructure, correctness risk)
5. **Phase 6 — IA + naming polish** · **Phase 7 — Commerce/Admin** (ทำก่อนเปิด marketplace flag)

## ⚠️ ค้าง/ข้อควรรู้
- **KIT-13** (dead slot ของ Surface) ยังไม่ verify — agent verify Phase 1 กลุ่มนั้นส่งผลขยะ (เช็คแค่ KIT-03 4 ไฟล์ที่ลบไปแล้ว) → เก็บ verify ตอนทำ Phase 2
- `lastSale`/`lowestAsk` fields (grades.ts) + EST consts = **จงใจเก็บไว้** (earmark ทำ stat โซน 3 · CARD-DETAIL-10) — อย่าเผลอลบ
- เบสยังไม่เปิด browser จริงเช็ค Phase 0 บางข้อ (2FA QR ฯลฯ) — optional
- **กฎเหล็ก session นี้: ห้าม push master ตรง** — branch + PR + merge เท่านั้น · ลบ dead code = verify reference จริงก่อนเสมอ + delete-only PR

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings, อ้างด้วย ID)
