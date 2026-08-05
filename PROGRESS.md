# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-08-05 — **แก้บั๊ก "แถบเมนูทะลุ popup ทั้งเว็บ" + วางสเกลชั้นซ้อน (z-index) กลางทั้งโปรเจกต์** บนสาขา `feat/seo-pillar-content` (verify ครบ · ยังไม่ merge)

## 🔨 รอบล่าสุด — ชั้นซ้อน (z-index) ทั้งเว็บ

**อาการที่เบสเจอ**: กดอะไรที่เด้ง popup แล้วแถบเมนูทะลุขึ้นมาทับ — reproduce ได้จริงด้วย Chrome จริง (playwright-core ยิงเข้า Chrome ของเครื่อง) หน้าแรกจอ 390px: พิมพ์ในช่องค้นหา → **แถบโฆษณาลอย + แถบแท็บล่างทับรายการผลลัพธ์** และกดโดนแท็บแทนการ์ด

**ต้นเหตุ**: ทั้งเว็บไม่มีสเกลชั้นซ้อน — header (desktop+mobile), แถบแท็บล่าง, dialog, sheet, popover, menu, tooltip **อยู่ที่ `z-50` เท่ากันหมด** เลยตัดสินกันด้วยลำดับใน DOM ซึ่งแถบแท็บล่าง render ท้ายสุดใน `layout.tsx` → ชนะทุกครั้ง. ซ้ำร้าย `position: sticky/fixed` ที่มี z-index สร้าง stacking context → ตัวเลขที่เขียนข้างในถูก re-base ยกไม่ขึ้นไม่ว่าใส่เท่าไหร่

**สิ่งที่ทำ**
- **สเกลกลางใน `src/app/globals.css` (`@theme`)**: `z-sticky 30 · z-ad 35 · z-floating 40 · z-chrome 50 · z-dropdown 55 · z-modal 70 · z-popup 80 · z-toast 90 · z-skip 100` — เขียนกติกาไว้ใน `AGENTS.md` §Stacking layers แล้ว
- **ย้ายทุก fixed/sticky มาใช้ token** (~20 ไฟล์): header ×2 · bottom-nav · admin/seller shell · floating ad · compare bar · scroll-to-top · sticky buy · profile CTA · drop-calc tray · admin bulk/save bar · sticky sub-nav 4 จุด
- **kit กลาง**: dialog/sheet → `z-modal` (พื้นหลังกับตัว modal **ชั้นเดียวกันตั้งใจ**) · popover/menu/tooltip/select → `z-popup` · select เลิกใช้ `z-[110]` และลบคอมเมนต์เก่าที่บอกผิดว่า modal เป็น `z-[100]`
- **บั๊กจริง 4 ตัวที่ผู้ใช้เจอ**
  1. ช่องค้นหาหน้าแรก — `<section relative z-30>` เป็นเพดานขังอยู่ → เอา z-30 ออก แล้วให้ตัว wrapper ยกเป็น `z-dropdown` เฉพาะตอนเปิด
  2. `SetPicker` `z-30` → `z-dropdown` (แก้จุดเดียว ครอบคลุมหน้าแรก/ค้นหา/drop-calculator/watchlist/portfolio)
  3. toast ของ honey — เดิม `z-50` และอยู่ใน "แถบเดียวกับ" แถบแท็บพอดี → **มองไม่เห็นเลย 100%** ตอนนี้ `z-toast` + ยกให้พ้นแถบแท็บ/โฆษณา
  4. กระดิ่งแจ้งเตือน — แผงเดิมเป็น div `fixed z-50` ที่เกิดในหัวเว็บ sticky (ขังถาวร ไม่มีเลขไหนช่วยได้) → เปลี่ยนเป็น `Popover` canonical (portal ออก body, ได้ Escape/โฟกัสฟรี)

**บั๊กที่ทำพังเองระหว่างแก้แล้วแก้กลับ** (สแกนเจอ ไม่ได้หลุดออกไป): ยกช่องค้นหาไป `z-popup` (80) ทำให้มันทะลุ Cmd+K palette (70) → เลยเพิ่มชั้น `z-dropdown` 55 ไว้เหนือ chrome แต่ใต้ modal · และการแยก backdrop ไปชั้น 60 ทำให้ dialog ซ้อน dialog เสียฉากหลัง (`blurBackdrop` ของ FilterModal) → รวมกลับเป็น `z-modal` ชั้นเดียว

**Verify** — tsc 0 · lint 0 error (29 warning เดิม นอก scope) · test 134 files / 739 tests · build 209 หน้า · **ยิง Chrome จริงบน production build** ทั้ง 390px และ 1440px: ผลลัพธ์ค้นหา/set picker/แผงแจ้งเตือน อยู่เหนือแถบแท็บ · palette ทับช่องค้นหาถูกต้อง · dialog ซ้อน dialog ฉากหลังคลุมถูก · select ใน dialog อยู่บนสุด

## ⚠️ เรื่องคอมมิต — ต้องดู

คอมมิต **`d186d1f`** และ **`13121de`** (ข้อความว่า card-detail) **กวาดงาน z-index ไปด้วย** เพราะคอมมิตตอนที่ยังแก้ไม่เสร็จ — โค้ดครบ ไม่หาย แต่ประวัติปนกัน ถ้าอยากได้คอมมิตแยกต้อง `git rebase -i` แยกเอง

## ⏭ NEXT

1. **เบสเปิดดูด้วยตา** (รายละเอียดข้อ "จุดที่ต้องดู" ข้างล่าง) แล้วค่อย merge
2. **ยังไม่ได้แก้ — SetPicker ไม่ได้ portal** เลยยังโดนขังใน 3 ที่: (ก) ในกล่อง `FilterModal` โดน `overflow-y-auto` ตัด (desktop) (ข) `drop-calculator/card-picker.tsx:254` เป็น `div.sticky.top-32` — **sticky สร้าง stacking context แม้ไม่มี z-index** เลยยกไม่ขึ้น (ค) `admin/cards/cards-browser.tsx:299` `sticky z-20` แบบเดียวกัน → ทางแก้จริงคือเปลี่ยน SetPicker เป็น `Popover` แต่ต้องรักษาทรง "ปุ่ม+ลิสต์ติดกัน กว้างเท่ากัน" ที่เบสสั่งไว้ เลยยังไม่แตะ
3. ค้างเดิม: **SEO** สาขานี้ยังไม่ merge · บน Vercel ต้องตั้ง `NEXT_PUBLIC_APP_URL` เป็นโดเมนจริง + สมัคร Google Search Console → ใส่ `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` → submit sitemap
4. ค้างเดิม: เครื่องหมายเกม 3 แบบทั่วเว็บ (จุดสี header · `Layers3` MINE · `Gamepad2` picker) — ต้องเลือกอันเดียว
5. ค้างเดิม: ตัวเลือกเกมในพอร์ตโชว์ทั้งที่มีเกมเดียว
6. ค้างเดิม: จะใช้บล็อกจริงต้องสร้างตาราง BlogPost ก่อน (⚠️ migration = ต้องขออนุญาตเบส)

## 👀 จุดที่อยากให้เบสดูด้วยตาบน preview

- **หน้าแรก มือถือ** — พิมพ์ค้นหาแล้วรายการยาวจะ**คลุมทับแถบแท็บล่าง**บางส่วน (เมื่อก่อนแท็บทับรายการ) ถ้าอยากให้รายการหยุดเหนือแถบแท็บ ต้องปรับ `max-h-[60vh]` ในช่องค้นหา
- **หน้าแรก desktop** — ถ้าเปิดรายการค้นหาค้างไว้แล้วเลื่อนหน้า ช่องค้นหา+รายการจะ**ลอยทับหัวเว็บ** (เมื่อก่อนมุดใต้หัวเว็บแต่โดนตัด) ถ้าไม่ชอบ ทางแก้คือปิดรายการตอนเลื่อน ไม่ใช่ลดเลขชั้น
- **กระดิ่งแจ้งเตือน** — เปลี่ยนกลไกทั้งก้อนเป็น Popover: ขอบซ้ายบนมือถือ 16px เท่าเดิม แต่ขอบขวาเหลือ ~22px (เดิม 16px) · ขอบกล่องเป็น ring แทน border · ลองกด Esc / แตะนอกกล่อง / หมุนจอแนวนอน
- **toast honey** — ลอยสูงขึ้นจากเดิมมาก (พ้นแถบแท็บ+โฆษณา) เพราะเมื่อก่อนมองไม่เห็นเลย
- **admin — ตัวเลือกเดือนในหน้า raffle**: ฉากรับคลิกปิดตอนนี้คลุมหัว admin ด้วย (คลิกหัวเว็บ = ปิดตัวเลือกก่อน 1 ครั้ง)

## 🔒 การตัดสินใจที่ต้องรักษา (z-index)

- **`z-dropdown` (55) อยู่เหนือ `z-chrome` (50) โดยตั้งใจ** — dropdown ที่ไม่ได้ portal ต้องชนะแถบแท็บให้ได้ แต่ต้องอยู่ **ใต้** modal เสมอ
- **`z-modal` คลุมทั้งฉากหลังและตัว modal** — ถ้าแยกฉากหลังลงไปชั้นล่าง dialog ที่เปิดซ้อน dialog จะเสียฉากหลังทันที (ลำดับที่ถูกต้องมาจากลำดับ DOM ของ portal ไม่ใช่จากตัวเลข)
- **`z-popup` (80) อยู่เหนือ modal** เพราะ select/menu เปิดจากในกล่อง modal ได้
- **ห้ามแก้ dropdown ที่ถูกขังด้วยการเพิ่มตัวเลข** — ถ้ามันอยู่ใน `sticky` / `transform` / `overflow-hidden` ต้อง portal (ใช้ `Popover`) เท่านั้น
- sonner (toast กลาง) ใช้ชั้นของตัวเองสูงกว่าทุกอย่าง — ปล่อยไว้ ตั้งใจ
- `/proto/**` ไม่แตะ (มี shell ของตัวเอง ไม่ปนกับ chrome หลัก)

## 🔒 การตัดสินใจเดิมที่ยังมีผล (SEO / UI)

- SEO copy อยู่ใน `src/lib/seo/copy/*.ts` ไม่ใช่ dictionary i18n · ห้ามตัดชื่อการ์ดใน title ด้วย "…" · ไม่ทำ `/guide/shops` · ห้ามเคลมว่า Bandai มี "ฟีเจอร์กันปลอม" · ห้ามใส่คำสัญญาเวลาตอบกลับ
- **`Card.nameTh` ไม่ใช่ไทยสักใบ** (3,838 ใบเป็นสำเนาอังกฤษ) แต่ `effectTh` เป็นไทยจริง 3,478 ใบ · `CardSet.nameTh` ว่างทั้ง 51 ชุด · `latestPriceThb` ว่างทั้งหมด (ต้องแปลงจาก JPY) · ตาราง BlogPost ไม่มีใน DB
- ราคาที่ผู้ใช้เห็นต้องตามสกุลเงินที่เลือก (มีเทสต์ยาม `display-currency-boundary.test.ts`)
- card picker ไม่มีเลขขั้น · ลิสต์มือถือ ซ้าย=identity ขวา=money stack · แถบแท็บ = แท็บ + ปุ่มของหน้าเท่านั้น · set เป็น control เด่นนอก FilterModal
- เครื่อง dev ตั้ง `NEXT_PUBLIC_BYPASS_AUTH=true` → ทดสอบหน้า auth-gated ต้อง build ใหม่ด้วย `false`
