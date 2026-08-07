# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-07 — **SEO ครบทั้ง 3 รอบจาก audit — push เข้า master หมดแล้ว** (R1+R2 = `130af6e` · R3 = commit นี้ ตามคำสั่งเบส) · รายงาน audit: artifact "ตรวจ SEO ทั้งเว็บ Meecard" https://claude.ai/code/artifact/ca79b001-d4d4-4b2d-9294-36c210a3813b · ติ๊กราย task: PLAN.md §SEO Round 1–3

## 🔨 รอบล่าสุด — Round 3 (ยังไม่ commit)

ไฮไลต์: **/guide จัดใหม่** — การ์ดบทขึ้นจอแรก (เดิม prose 1.5 จอ) บทนำย่อ+ย้ายลงในคอลัมน์อ่าน แก้ breadcrumb "Guide" อังกฤษ · **ลิงก์ในเนื้อความ** คู่มือทุกหน้า (เดิมกักท้ายหน้า) · **/guide/versions ได้ section "การ์ดวันพีซมีภาษาไทยไหม"** (KIDZ & KITZ — ข้อเท็จจริง verify แล้ว: การ์ดพิมพ์ไทยยังไม่มี) + Article schema + วันที่ · **trending ได้ section "น่าเก็บ/น่าลงทุน"** · **rarities เลิก hardcode ราคา** (ดึง DB จริง + ตารางเทียบ parallel ใช้การ์ดจริง OP05-119) · **Honey จอแรกเลิกเป็นกล่องเทา** · **รูปชุดแก้ราก** (fallback เคยหยิบการ์ดข้ามชุด → เลือกรหัสชุดตัวเองก่อน + onError) · WebSite schema +alternateName −SearchAction · Breadcrumb JSON-LD ไทยตรง UI (การ์ด/ค้นหา/ภาพรวมตลาด/guide ทั้งหมด)

**Verify**: tsc 0 · lint 0 · vitest 140 ไฟล์/776 · build 209 หน้า · เปิดดูจริง :3001 มือถือ+desktop

**Known state**: dev DB ราคา scrape ล่าสุด 5 เม.ย. 2569 (วันที่บนหน้า/ราคา rarities สะท้อนข้อมูลเก่าตามจริง — prod จะสดเอง) · marketplace flag ใน dev เปิดอยู่ · พอร์ต 3000 = Bill Tracker · meecard ทดสอบที่ :3001 (`meecard-start-3001`) · `STATIC_CONTENT_UPDATED` ใน sitemap.ts อัปเดตมือเมื่อแก้เนื้อหานิ่ง

## 🔗 รอบเพิ่มเติมหลัง R3 (ยังไม่ commit): CTA สองชั้นทั้งเว็บ
เบสชี้จาก screenshot ว่าลิงก์ CTA แบบ text จมเกิน → ตั้งนโยบาย 2 ชั้น: ในเนื้อความ=plain (ถูกแล้ว) · ก้าวถัดไป=canonical ใหม่ 2 ตัว **`ArrowLink`** + **`RelatedPageCard`** (ลง AGENTS.md แล้ว) กวาด 7 จุด: set detail ×2 · deck-calc (ตัดบล็อกซ้ำ) · drop-calc (list→RelatedPages) · trending · search · home strip — verify ครบ (tsc/lint/test 776/build/เปิดดูจริง)

**+ หน้าชุด intro** (เบสชี้อีกจุด): ย่อหน้า data dump (ทวน rarity/กล่อง/ใบแพงสุดที่ตาเห็นบนหน้าอยู่แล้ว) → ประโยคเดียว 129 ตัวอักษร + SectionHead พร้อม "ดูชุดทั้งหมด" เป็น action ขวา **เต็มความกว้าง content** (จำกัดคอลัมน์แล้วลิงก์ลอยกลางหน้า — เบสชี้) — กติกาใหม่ที่ test ล็อกไว้: **intro ห้ามทวนของที่หน้าโชว์**

**+ กวาด intro ทุกหน้า** (เบสสั่งตรวจทั้งเว็บ): แก้เพิ่ม 3 จุด — หน้าแรก (1 ประโยค ตัด methodology/how-to) · market-overview (เลิกเล่าซ้ำแผง KPI เหลือประโยคเดียว+ชุดมูลค่าสูงสุด) · compare (<li>→<p> + breadcrumb ไทย) — หน้าอื่นสำรวจแล้วผ่านกติกา · verify: tsc/lint/test 776/build/curl HTML จริงทั้ง 3 หน้า

## ⬆️ อัปเกรด Next.js 16.2.1 → 16.3.0 + rename middleware → proxy
**dependency**: `package.json` (`next` + `eslint-config-next` = `16.3.0` pin เป๊ะตามเดิม ไม่ใส่ `^`) · `package-lock.json` · `.claude/launch.json` (+config `meecard-start-auto` เปิดพอร์ตว่างเอง เพราะ :3001 มี session อื่นจองอยู่) — React คงที่ 19.2.4

**rename ตาม Next 16**: `src/middleware.ts` → **`src/proxy.ts`** + `export async function middleware` → `proxy` (test คู่กันย้ายเป็น `src/proxy.test.ts` ด้วย) · codemod ทางการรันไม่ได้เพราะ tree สกปรก จึงทำมือตาม doc เป๊ะ · **ไม่ต้องแตะ**: `src/lib/supabase/middleware.ts` (คนละไฟล์ helper) · header `x-middleware-next` / `x-middleware-request-x-game` (ชื่อภายในของ Next ยังเหมือนเดิม) · `export const config.matcher` (ไม่เปลี่ยน) · ไม่มี `skipMiddlewareUrlNormalize` ให้แก้ · **ผลที่ได้**: build ไม่เตือน deprecated แล้ว

**Verify (รันซ้ำหลัง rename)**: tsc 0 · lint 0 error (35 warning เดิม — `<img>`/unused var/`window.location.href`) · vitest 140 ไฟล์/776 · build 209 หน้า Turbopack · เปิดดูจริง :3002 มือถือ+desktop ไม่มี console/server error · curl 23 route = 200 หมด · proxy ทำงานครบ: `/sets`→308 `/opcg/sets` · `/opcg/portfolio`→308 `/portfolio` · `/@handle`+`/opcg`+`/all/search` rewrite ถูก

## NEXT
1. **push เมื่อเบสรีวิวเสร็จ** — commit แล้วบน branch `chore/next-16.3` (ห้าม push master ตรงๆ ตาม AGENTS.md)
2. **SEO-OPS บน Vercel (ค้างมานาน — ตอนนี้สำคัญสุด)**: ตั้ง `NEXT_PUBLIC_APP_URL` เป็นโดเมนจริง (canonical/og:url ทั้งเว็บชี้ตามค่านี้) · Google Search Console + ใส่ `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` · submit /sitemap.xml
3. เช็คบน production หลัง deploy: ป้าย "อัปเดตล่าสุด" ต้องเป็นวันปัจจุบัน (ถ้าเก่า = cron scrape มีปัญหา) · ลองแชร์ลิงก์ผ่าน LINE/FB ดู preview ใหม่
4. งาน SEO เชิงเนื้อหาระยะถัดไป (นอกแผน 3 รอบ — ทำเมื่อพร้อม): เขียนบทความ blog 2-3 ชิ้นแรกแล้วปลด noindex · backfill `releaseDate` ของชุด (FAQ "ชุดล่าสุด" จะได้ตอบแม่น) · พิจารณา character hub (/cards/character/luffy) เก็บ query ระดับตัวละคร · แยก URL /en /jp + hreflang ถ้าจะ rank ภาษาอื่น
