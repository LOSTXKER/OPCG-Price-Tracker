# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-04 — **ทำ SEO ทั้งเว็บครบ P0→P3 บนสาขา `feat/seo-pillar-content`** (ยังไม่ merge · verify ครบแล้ว)

## 🔨 รอบล่าสุด — SEO Pillar + เนื้อหารายหน้า (95 ไฟล์)

เบสสั่ง "ทำหมดเลย" ต่อจากแผน `doc/seo-content-plan.md` · แผนติ๊กแล้วใน PLAN.md §SEO

**P0 โครงสร้าง** — ย้าย canonical ออกจาก layout ราก (ตัวที่ทำให้ /guide, /opcg/decks ประกาศตัวเป็นหน้าซ้ำของหน้าแรก) · meta ไทยระดับ site + `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` · robots เหลือเฉพาะ crawl control แล้วปล่อยหน้า noindex ให้ Google อ่านป้ายได้จริง · redirect 308 (ยกเว้นเส้นที่ขึ้นกับคุกกี้เกม → คง 307 กันพังตอนมีเกมที่ 2) · `/proto` 11 หน้า noindex,nofollow · JSON-LD: Organization + Product ราคา THB/priceValidUntil และเลิกเคลม InStock

**P1 หน้ารบ** — หน้าการ์ด: แก้ `displayLang = hydrated ? lang : "EN"` → `"TH"` (บรรทัดเดียวที่ทำให้ ~3,800 หน้าถูก index เป็นอังกฤษ) · H1 มีรหัสการ์ด (parallel เลิก H1 ซ้ำ) · intro + FAQ auto ต่อใบ · **ลบ section ข้อมูลปลอม** (Sample sale history / Sample listings) แทนด้วยตารางประวัติราคาจริง · ย้าย viewCount ออกจาก render + เปลี่ยนเป็น ISR 1 ชม. · หน้าชุด: H1 มีชื่อชุด · intro/FAQ auto · **ดึงตารางอัตราออกออกจาก dialog มาไว้ใน HTML** (50/51 ชุดมีข้อมูล) · ISR + prerender 51 หน้า

**P2 หน้าแรก/เครื่องมือ/guide** — หน้าแรก H1 เลิกซ่อน + H2 เหนือตาราง + แถบลิงก์ชุด + FAQ long-tail · trending/search/deck-calculator render ฝั่ง server แล้ว (เดิม Google เห็นหน้าว่าง) · drop-calculator มีบทอธิบายอัตราออก · guide ทุกหน้าใส่ชื่อเกมใน title/H1 + /guide/buying ขยายจาก ~160 คำ เป็น ~1,400 คำ

**P3 หน้าใหม่** — `/opcg/most-expensive` (อันดับสดจาก DB) · `/guide/authenticity` (แท้-ปลอม) · `/guide/versions` (JP/EN)

**Verify**: tsc 0 · lint 0 error (28 warning เดิมนอก scope) · test 134 files / 734 tests · build 209 หน้า · ตรวจ HTML จริงจาก `next start`

## ⚠️ ข้อเท็จจริงที่แก้ความเข้าใจผิด (ตรวจ DB จริงแล้ว — อย่าเชื่อของเก่า)

- **`Card.nameTh` ไม่ใช่ภาษาไทยเลยสักใบ** (3,838 ใบเป็นสำเนาชื่ออังกฤษ) → ห้ามเคลมว่า "ค้นด้วยชื่อไทยได้" · แต่ **`effectTh` เป็นไทยจริง 3,478 ใบ** ซึ่งคือเนื้อไทยจริงที่ได้จากการแก้ภาษา
- `CardSet.nameTh` ว่างทั้ง 51 ชุด → หน้าไหนห้ามสัญญาชื่อชุดภาษาไทย
- `latestPriceThb` ว่างทั้งหมด → ราคาบาททุกที่ต้องแปลงจาก JPY ด้วย `jpyToThb`
- **ตาราง BlogPost ไม่มีใน DB** → /blog แสดง empty state โดยดีไซน์ ยังไม่ใช่ระบบที่ใช้งานได้
- เครื่อง dev ตั้ง `NEXT_PUBLIC_BYPASS_AUTH=true` → ทดสอบหน้า auth-gated (deck-calculator, honey) ต้อง build ใหม่ด้วย `NEXT_PUBLIC_BYPASS_AUTH=false` ไม่งั้นเห็นผลผิด

## 🔒 การตัดสินใจที่ต้องรักษา

- **SEO copy อยู่ใน `src/lib/seo/copy/*.ts` ไม่ใช่ dictionary i18n** — เพราะข้อความ SEO ต้องแทรกข้อมูลจริง (ราคา/จำนวน/วันที่) ซึ่ง `t()` ทำไม่ได้ และกันไฟล์ dictionary 2,800 บรรทัดบวมกว่าเดิม
- **ห้ามตัดชื่อการ์ดใน title ด้วย "…"** — เสียคำค้นที่คนพิมพ์จริง ให้ตัดส่วนอื่น (rarity/ชื่อชุด) แทน
- **ไม่ทำ `/guide/shops`** — ช่องทางซื้ออยู่ใน /guide/buying หมดแล้ว จะแย่งอันดับกันเอง และยืนยันชื่อร้านไทยรายตัวไม่ได้ (ลิสต์ที่ยังลอยอยู่เป็นของปี 2022 · หน้า official shop ของ Bandai เองระบุว่ากำลังย้ายร้าน)
- **ห้ามเขียนว่า Bandai มี "ฟีเจอร์กันปลอม" อย่างเป็นทางการ** — ไม่มีประกาศแบบนั้น ทุกวิธีในหน้า authenticity ต้องกรอบว่าเป็นข้อสังเกตของนักสะสม และ "เพิ่ม/ลดความน่าสงสัย" ไม่ใช่พิสูจน์
- **ห้ามใส่คำสัญญาเวลาตอบกลับ** (เดิมมี "ภายใน 1–3 วันทำการ") — ไม่มีอะไรในระบบรองรับ
- ราคาที่ผู้ใช้เห็นต้องตามสกุลเงินที่เลือก (มีเทสต์ยาม `display-currency-boundary.test.ts`) · ยกเว้นได้เฉพาะ surface ที่ render ฝั่ง server เพื่อ crawler ซึ่งอ่าน store ไม่ได้ — ต้องขึ้นทะเบียนพร้อมเหตุผล
- กติกาเดิมยังมีผล: card picker ไม่มีเลขขั้น · ลิสต์มือถือ ซ้าย=identity ขวา=money stack · แถบแท็บ = แท็บ + ปุ่มของหน้าเท่านั้น · set เป็น control เด่นนอก FilterModal

## 👀 จุดที่อยากให้เบสดูด้วยตาบน preview

- หน้าแรก: H1 เป็นประโยคจริงแล้ว (ขนาด desktop ลดจาก 5xl → 4xl กันกินพื้นที่) + มีแถบลิงก์ชุดเพิ่มมา
- หน้าชุด: หัวข้อ rarity ยาวขึ้นเพราะมีคำไทยกำกับ ("Parallel Super Rare (พาราเรลซูเปอร์แรร์)") — ดูที่จอ 360px ว่าตัดบรรทัดสวยไหม · ตารางอัตราออก + FAQ อยู่ใต้กำแพงการ์ด (ยาว)
- /guide/card-types เปลี่ยนทรง (glossary เป็นการ์ดเรียง + jump-nav) · /guide/sets เหลือ 12 ชุดล่าสุด + ลิงก์ดูทั้งหมด · /guide/buying ยาวขึ้นมาก
- /opcg/decks ไทล์เครื่องมือเหลือ 1 คอลัมน์บนมือถือ (เพราะมีคำอธิบายใต้ชื่อ)
- /opcg/trending โชว์ 10 อันดับ 24 ชม. สองที่ (ในตารางกดได้ + ในบล็อก SEO) — ตั้งใจ แต่ผู้ใช้เห็นซ้ำ
- /opcg/search หลัง JS ทำงาน รายการฝั่ง server จะถูกแทนที่ด้วยรายการ client (เห็นผล → skeleton → ผล)

## ⏭ NEXT

1. **เบสรีวิว PR แล้ว merge** (สาขา `feat/seo-pillar-content` — ยังไม่ push เข้า master ตามกฎ)
2. **งานที่โค้ดทำแทนไม่ได้ ต้องทำบน Vercel**: ตั้ง `NEXT_PUBLIC_APP_URL` เป็นโดเมนจริง (ถ้าไม่ตั้ง canonical/sitemap/OG จะชี้ `https://meecard.app` ตาม default) · สมัคร Google Search Console → ใส่ `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` → submit sitemap
3. ค้างเดิม: เครื่องหมายเกม 3 แบบทั่วเว็บ (จุดสี header · `Layers3` MINE · `Gamepad2` picker) — จะยึด 1 concept 1 icon ต้องเลือกอันเดียว
4. ค้างเดิม: ตัวเลือกเกมในพอร์ตโชว์ทั้งที่มีเกมเดียว
5. ถ้าจะเอาบล็อกมาใช้จริง ต้องสร้างตาราง BlogPost ก่อน (⚠️ migration = ต้องขออนุญาตเบส)
