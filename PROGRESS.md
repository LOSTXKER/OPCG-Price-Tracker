# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-07 — **SEO Round 1 + Round 2 เสร็จ verify ครบ และ commit+push เข้า master แล้ว (`130af6e`, เบสสั่งเอง)** จาก audit SEO 12 ทีม (รายงาน: artifact "ตรวจ SEO ทั้งเว็บ Meecard" https://claude.ai/code/artifact/ca79b001-d4d4-4b2d-9294-36c210a3813b) · รายละเอียด+ติ๊กราย task: PLAN.md §SEO Round 1 + §SEO Round 2

## 🔨 สองรอบที่เพิ่งจบ (วันเดียวกัน)

**Round 1 "หยุดเลือด"** — FAQ บ้านเดียวต่อเรื่อง (/about#methodology · การ์ด 4→2 ข้อ เลิกก๊อป 3,838 หน้า · hub 9→6) · Marketplace ผูก flag · sitemap วันที่จริง+ไม่มี cap (ไฟล์เดียว — Next ไม่มี index ให้ generateSitemaps) · /blog noindex · trending เลิกซ้ำ+ใส่ฝั่งราคาลง

**Round 2 "คันโยกอันดับ"** — helper `buildPageMetadata` แล้ว og ตรงหน้าตัวเองทั้งเว็บ (แชร์ LINE/FB ไม่เป็นหน้าแรกแล้ว, set/อันดับได้ og:image รูปจริง) · วันที่อัปเดตโชว์จริง 3 หน้าข้อมูล + เลิกเคลม "เรียลไทม์" · keyword ชนกันเคลียร์หมด (/guide/sets reposition · /decks noindex · หน้ารองเขียน meta ตาม intent ตัวเอง) · title/desc เข้าเกณฑ์ ≤60/≤160 ทั้งเว็บ (วัดจริง) · หน้าการ์ด: H1 sr-only "ราคา+รหัส" visual เดิมเป๊ะ · Product JSON-LD THB เสมอ

**Verify รอบสุดท้าย (หลังรวมงาน 4 ทีมขนาน + งานแกนกลาง)**: tsc 0 · lint 0 · vitest 136 ไฟล์/752 ผ่านหมด (test ใหม่: card-detail-identity, json-ld) · build 209 หน้า · curl HTML จริงจาก `next start` :3001 ครบทุกกลุ่ม

**เฝ้าระวัง / known state**
- dev DB: marketplace flag **เปิด** (ลิงก์ marketplace เลยโชว์ในเครื่อง — prod ปิดจะซ่อนเอง) · ราคา scrape ล่าสุด 5 เม.ย. 2569 = วันที่บนหน้าโชว์ข้อมูลเก่าตามจริง (บน prod จะเป็นวันปัจจุบัน)
- พอร์ต 3000 = โปรเจค Bill Tracker ของเบส · meecard prod ทดสอบที่ :3001 (`meecard-start-3001` ใน .claude/launch.json)
- `STATIC_CONTENT_UPDATED` ใน sitemap.ts ต้องอัปเดตมือเมื่อแก้เนื้อหาหน้านิ่ง
- รูปการ์ดแตก 2 จุด (EB01-001 หน้า getting-started · กล่อง OP04 หน้ารวมชุด) — ยังไม่ซ่อม (Round 3)

## NEXT (Round 3 — ความสวย + เก็บแต้ม ตามรายงาน audit)
1. **ศูนย์คู่มือ /guide**: ย่อบทนำเหลือย่อหน้าเดียว เอาการ์ดบทขึ้นก่อน (ตอนนี้ text 1.5 จอก่อนถึงลิสต์บท) + จำกัดความกว้างคอลัมน์อ่านบน desktop ให้เท่ากันทุกหน้า guide (hub เต็มจอ แต่ authenticity ทำถูกแล้ว)
2. ลิงก์ในเนื้อความ guide (แท้-ปลอม/เวอร์ชัน/ความหายาก → หน้าราคา/เครื่องมือ) — ตอนนี้ลิงก์กักอยู่ท้ายหน้า
3. /guide/versions เพิ่ม section ผู้จัดจำหน่ายทางการไทย (KIDZ & KITZ + งานแข่ง — verify แล้ว: การ์ดพิมพ์ไทยยังไม่มีจริง เนื้อหาเดิมถูก) เก็บ keyword "การ์ดวันพีซ ภาษาไทย"
4. trending เพิ่ม section สั้น "ดูยังไงว่าใบไหนน่าเก็บ" เก็บ keyword "น่าเก็บ/น่าลงทุน"
5. คู่มือความหายาก: ราคาตัวอย่าง hardcode → ดึงจากระบบ
6. ซ่อมรูปแตก 2 จุด · Honey จอแรกเอาคำอธิบายขึ้นก่อน skeleton · Breadcrumb JSON-LD ภาษาไทยให้ตรง UI (หลายหน้า)
7. SEO-OPS (เบสทำบน Vercel): ตั้ง NEXT_PUBLIC_APP_URL โดเมนจริง · Google Search Console + submit sitemap — **สำคัญ: og:url/canonical ตอนนี้ชี้ตาม env นี้**

> commit แล้ว: `130af6e` (57 ไฟล์, push master ตามคำสั่งเบส 2026-08-07) — Vercel จะ deploy อัตโนมัติ อย่าลืมข้อ 7 (NEXT_PUBLIC_APP_URL) ไม่งั้น canonical/og:url บน prod ชี้ผิดโดเมน
