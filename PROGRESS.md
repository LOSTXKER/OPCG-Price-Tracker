# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **Mobile iOS rollout: Batch 2 (Settings/More) + สำรวจ batch ถัดไปแล้วสรุปว่าไม่ต้องแตะเพิ่ม** (เบสถาม "desktop/มือถือควรแยกดีไซน์กันมั้ย" → ยืนยัน desktop=เว็บเดิม, มือถือ=iOS native, สั่ง "ไปต่อ batch ถัดไป")

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` · **VISION:** identity §1 (ห้ามเปลี่ยน) + IA §2

## ✅ เสร็จ session นี้ — Batch 2: Settings/More มือถือ → grouped-inset list

`src/app/settings/page.tsx` มือถือ (`md:hidden` เท่านั้น — desktop sidebar+content ไม่แตะเลย): เดิมเป็น flat link list (ไอคอนเทา + ข้อความ) → เปลี่ยนเป็น **grouped-inset table view** จริงตาม `/proto/ios/more` ที่พิสูจน์แล้ว — ใช้ `GroupedSection`/`GroupedRow` ที่ย้ายเข้า production ตั้งแต่ Batch 0:
- Identity row (avatar+ชื่อ+tier badge) ห่อด้วย `GroupedSection` เป็นการ์ดของตัวเอง (เดิมเป็น plain link แถวเดียว)
- 2 กลุ่ม "ทั่วไป"/"เพิ่มเติม" (จาก `SETTINGS_SECTIONS` เดิม ไม่เพิ่ม/ลด section) → `GroupedRow` ต่อแถว (icon-in-circle + chevron + ≥52px tap target แทน icon เทาแบนๆ)
- Title `text-h1` → `.text-large-title` (ใช้เฉพาะ branch มือถือ ไม่ต้องพึ่ง media-query fallback เพราะ desktop เรนเดอร์คนละ branch อยู่แล้ว)
- ไม่เพิ่ม i18n key ใหม่ (ใช้ label เดิมทั้งหมด) · ไม่แตะ logic/data (`useProfileData` เหมือนเดิม)

**verify:** tsc 0 · lint 0 err (34 warning เดิม) · test 56/56 · build ✓ (`/settings` prerender สำเร็จ) · impeccable detect [] (`settings/page.tsx`) · curl smoke `/`,`/settings`,`/watchlist`,`/portfolio`,`/opcg/cards/OP01-001` ทั้งหมด 200

## 🔍 สำรวจ batch ถัดไป (card detail / portfolio / watchlist) — สรุป: **ไม่แตะเพิ่มรอบนี้**
อ่านโค้ดจริงทั้ง 3 หน้าก่อนแก้ (กันมั่วดะ) แล้วพบว่า **ต่างจาก Settings ตรงที่ทั้ง 3 หน้านี้ผ่าน mobile-first redesign มาแล้วรอบก่อนๆ (P1–P2 ใน PLAN.md)** ไม่ใช่ flat-list แบบ Settings ที่เพิ่งพบปัญหา:
- **Watchlist** (`watchlist-list-view.tsx`): thumbnail เป็น portrait `aspect-[63/88]` อยู่แล้ว, toolbar เป็น dense data-toolbar (search/sort/filter dropdown/bulk-select) ที่ wrap ได้ดีอยู่แล้ว ไม่ใช่ horizontal-scroll anti-pattern — บังคับเข้า `GroupedRow` primitive จะ**ตัดฟีเจอร์ checkbox/pin/alert/actions-menu ทิ้ง** (ไม่มีที่ใส่ใน `GroupedRow` ซึ่งออกแบบมาสำหรับ navigation row เดียว ไม่ใช่ multi-action row) → เสี่ยง regression ไม่คุ้ม
- **Portfolio hub** (`portfolio-hub-card.tsx`) + **detail** (`portfolio-detail-client.tsx`): thumbnail portrait อยู่แล้ว, มี dashboard hero/switcher/tabs/hero-panel/allocation ครบตาม proto v3 ที่ต้องการอยู่แล้ว (เป็นผลจาก "Hub+Detail split" + "Panel restore" session ก่อนหน้า) — เป็นหน้า data-dense (ตาราง/สถิติ) ไม่ใช่ navigation menu จึง**ไม่เข้ากับ grouped-inset grammar** (นั่นสำหรับ Settings-style list เท่านั้น)
- **Card detail**: ผ่าน "world-class pass" มา 8 รอบแล้ว (ดู PLAN.md §Card detail) เป็นหน้าเทรดที่ซับซ้อนสุดในเว็บ แตะเพิ่มโดยไม่มี browser เปิดดูจริง = เสี่ยงสูงเกินไป
- **สิ่งที่ทั้ง 3 หน้าได้ "ฟรี" ไปแล้วจาก Batch 1**: title ใหญ่แบบ iOS (`PageHeader`→`.text-large-title`) + header โปร่งใส/frost ตอน scroll (`header-mobile.tsx`) เพราะเป็น chrome กลางที่ทุกหน้าใช้ร่วมกัน

**สรุปคือ Settings/More เป็นหน้าเดียวที่มีช่องว่างจริงระหว่าง grammar เดิมกับ iOS grammar** (flat list vs grouped-inset) — หน้าที่เหลือดีอยู่แล้วจากงาน redesign รอบก่อนๆ, บังคับเปลี่ยนต่อจะเป็นการ "ปรับเพราะอยากปรับ" ไม่ใช่แก้ gap จริง

## เสร็จรอบก่อน — Batch 0 (atoms) + Batch 1 (chrome + home มือถือ) บนหน้าจริง
เบสยืนยันแล้ว: **desktop คงของเดิมเป๊ะ (ชอบแล้ว ตามภาพที่ส่ง) · มือถือ (<md) เปลี่ยนเป็น iOS grammar** — เริ่ม rollout จริงบนหน้าเว็บ (ไม่ใช่ proto อีกต่อไป) โดยใช้ประโยชน์จากโครงที่มีอยู่แล้ว (desktop `<table>` vs มือถือ list เป็นคนละ markup อยู่แล้ว, header แยกไฟล์มือถือ/เดสก์ท็อปอยู่แล้ว):

- **Batch 0 — atoms เข้า production**: ย้าย `GroupedSection`/`GroupedRow` จาก proto → `src/components/ui/grouped-list.tsx` — **`GroupedRow` เขียนใหม่ให้ delegate ไปที่ `ListRow` เดิม** (atom ที่มีอยู่แล้วตาม REDESIGN.md §4.3) แทนที่จะ duplicate แถว เพื่อให้แอปมี row primitive เดียว (แค่เพิ่ม icon-circle leading + `destructive` color) · proto 5 ไฟล์ import จากที่ใหม่แทน + ลบไฟล์ proto เดิม
- **Batch 1a — Chrome มือถือ** (ทุกหน้าได้ผลพร้อมกัน, desktop ไม่แตะ):
  - [`header-mobile.tsx`](src/components/layout/header-mobile.tsx): เดิม solid bg ตลอด → เปลี่ยนเป็น **transparent บนสุด → `.frost .hairline-b` ตอน scroll** (pattern เดียวกับ desktop header ที่มีอยู่แล้ว + `/proto/ios` nav bar ที่พิสูจน์แล้ว)
  - [`page-header.tsx`](src/components/layout/page-header.tsx): title ใช้ `.text-large-title` แทน `.text-h1` ตรงๆ — CSS token ใหม่นี้มี **media query ในตัวเอง** (34px มือถือ → 32px ที่ ≥768px ซึ่งตรงกับขนาด `.text-h1` เดิมเป๊ะ) ดังนั้น desktop (`≥md`) หน้าตาเหมือนเดิม 100% ไม่มี regression ส่วนมือถือได้ large-title ใหญ่ขึ้น
  - [`bottom-nav.tsx`](src/components/layout/bottom-nav.tsx): เปลี่ยน `pb-[env(safe-area-inset-bottom)]` → `.pb-safe` utility ใหม่ (ผลลัพธ์เหมือนเดิมทุกประการ แค่สะอาดขึ้น)
- **Batch 1b — Home/Market มือถือ** ([`mobile-card-item.tsx`](src/components/home/mobile-card-item.tsx) — ใช้ร่วมกันทั้ง home และ `/sets`, market table ทุกที่): thumbnail จาก square `size-11` → **portrait `aspect-[63/88] w-11`** (สัดส่วนการ์ดจริง ตรง VISION "การ์ด=พระเอก") + เพิ่ม `hairline` ring + `min-h-[52px]` explicit tap target — โครงสร้าง rank/ชื่อ/code/sparkline/ราคา/delta เดิมทั้งหมดคงไว้ครบ (ไม่เสียฟีเจอร์) · skeleton ปรับให้ตรงชนิดเดียวกัน (กัน layout shift)
- **จงใจไม่แตะ**: toolbar/tabs ใน `home-market-overview.tsx` — โค้ดใช้ class ร่วมกันระหว่าง mobile/desktop โดยไม่มี `md:hidden` แยกชัดเจนในหลายจุด เสี่ยงกระทบ desktop โดยไม่ตั้งใจ + ของเดิมอ่านได้ดีอยู่แล้ว (underline tabs, icon-only filter บนมือถือ) จึงข้ามในรอบนี้

**verify:** tsc0 · lint0 (34 warning เดิม) · test56 · build✓ · impeccable detect [] (ทุกไฟล์ที่แตะ) · curl smoke ทั้งหน้าจริง (`/`, `/settings`, `/watchlist`, `/portfolio`, `/opcg/sets`, `/opcg/cards/OP01-001`) และ proto (`/proto/ios/*`) 200 ไม่มี server error

## ⚠️ ยังไม่ได้ทำ — เบสต้องเปิดดูเอง
เครื่องมือเปิด browser จริงไม่พร้อมใช้งาน session นี้เหมือนรอบก่อนๆ — verify จำกัดแค่ build/lint/test/curl **ยังไม่เห็นภาพจริงทั้งมือถือและเดสก์ท็อป**

## ⏭️ NEXT
1. **สำคัญที่สุด**: เบสเปิดเว็บจริงเช็ค 2 อย่าง:
   - **Desktop (≥1024px)** ต้องเหมือนเดิมทุกจุด ทั้ง `/settings` (sidebar+content เดิม) และหน้าอื่นๆ ที่แตะใน Batch 0+1
   - **มือถือ (390px)** `/settings` ต้องเห็น grouped-inset card list ใหม่ (การ์ดโค้งมน มี icon วงกลมสี, chevron) แทน flat list เดิม — ที่เหลือ (`/`, `/watchlist`, `/portfolio`) เห็น large-title + frost header จาก Batch 1
2. **ยังไม่มีงานค้างจาก "แผน 4 batch" เดิม** — สำรวจแล้วสรุปว่า Watchlist/Portfolio/Card-detail ไม่ต้องแตะเพิ่ม (เหตุผลเต็มด้านบน) เว้นแต่เบสเห็นจุดเฉพาะที่อยากปรับหลังเปิดดูจริง
3. `/proto/ios/*` ยังเก็บไว้เป็น reference (ยังไม่ลบ)
