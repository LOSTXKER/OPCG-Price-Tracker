# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-07 — **SEO ครบทั้ง 3 รอบจาก audit — push เข้า master หมดแล้ว** (R1+R2 = `130af6e` · R3 = commit นี้ ตามคำสั่งเบส) · รายงาน audit: artifact "ตรวจ SEO ทั้งเว็บ Meecard" https://claude.ai/code/artifact/ca79b001-d4d4-4b2d-9294-36c210a3813b · ติ๊กราย task: PLAN.md §SEO Round 1–3

## 🔨 รอบล่าสุด — Round 3 (ยังไม่ commit)

ไฮไลต์: **/guide จัดใหม่** — การ์ดบทขึ้นจอแรก (เดิม prose 1.5 จอ) บทนำย่อ+ย้ายลงในคอลัมน์อ่าน แก้ breadcrumb "Guide" อังกฤษ · **ลิงก์ในเนื้อความ** คู่มือทุกหน้า (เดิมกักท้ายหน้า) · **/guide/versions ได้ section "การ์ดวันพีซมีภาษาไทยไหม"** (KIDZ & KITZ — ข้อเท็จจริง verify แล้ว: การ์ดพิมพ์ไทยยังไม่มี) + Article schema + วันที่ · **trending ได้ section "น่าเก็บ/น่าลงทุน"** · **rarities เลิก hardcode ราคา** (ดึง DB จริง + ตารางเทียบ parallel ใช้การ์ดจริง OP05-119) · **Honey จอแรกเลิกเป็นกล่องเทา** · **รูปชุดแก้ราก** (fallback เคยหยิบการ์ดข้ามชุด → เลือกรหัสชุดตัวเองก่อน + onError) · WebSite schema +alternateName −SearchAction · Breadcrumb JSON-LD ไทยตรง UI (การ์ด/ค้นหา/ภาพรวมตลาด/guide ทั้งหมด)

**Verify**: tsc 0 · lint 0 · vitest 140 ไฟล์/776 · build 209 หน้า · เปิดดูจริง :3001 มือถือ+desktop

**Known state**: dev DB ราคา scrape ล่าสุด 5 เม.ย. 2569 (วันที่บนหน้า/ราคา rarities สะท้อนข้อมูลเก่าตามจริง — prod จะสดเอง) · marketplace flag ใน dev เปิดอยู่ · พอร์ต 3000 = Bill Tracker · meecard ทดสอบที่ :3001 (`meecard-start-3001`) · `STATIC_CONTENT_UPDATED` ใน sitemap.ts อัปเดตมือเมื่อแก้เนื้อหานิ่ง

## NEXT
1. **SEO-OPS บน Vercel (ค้างมานาน — ตอนนี้สำคัญสุด)**: ตั้ง `NEXT_PUBLIC_APP_URL` เป็นโดเมนจริง (canonical/og:url ทั้งเว็บชี้ตามค่านี้) · Google Search Console + ใส่ `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` · submit /sitemap.xml
3. เช็คบน production หลัง deploy: ป้าย "อัปเดตล่าสุด" ต้องเป็นวันปัจจุบัน (ถ้าเก่า = cron scrape มีปัญหา) · ลองแชร์ลิงก์ผ่าน LINE/FB ดู preview ใหม่
4. งาน SEO เชิงเนื้อหาระยะถัดไป (นอกแผน 3 รอบ — ทำเมื่อพร้อม): เขียนบทความ blog 2-3 ชิ้นแรกแล้วปลด noindex · backfill `releaseDate` ของชุด (FAQ "ชุดล่าสุด" จะได้ตอบแม่น) · พิจารณา character hub (/cards/character/luffy) เก็บ query ระดับตัวละคร · แยก URL /en /jp + hreflang ถ้าจะ rank ภาษาอื่น
