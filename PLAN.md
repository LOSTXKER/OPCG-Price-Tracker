# Meecard — PLAN (งานโค้ดค้างจริง — ขุดจาก doc/ + เทียบโค้ดแล้ว 2026-06-13)

> งานใหญ่แตกเป็น task ติ๊กได้ · ทำทีละอัน · ติ๊กเมื่อ **verify แล้ว** (ไม่ใช่แค่เขียนเสร็จ)
> ลำดับ milestone = ข้อเสนอ — เบสสลับได้ · แผนธุรกิจ/north star อยู่ `doc/archive/detailed-plan-2026-04-28.md` (archived snapshot) ไม่ใช่ไฟล์นี้

## 📱 Mobile home + chrome "กลาง 5" (owner selected · 2026-08-29)

> เบสเลือกจากหน้าเทียบ `/proto/mobile-home`: **โครงหน้าแบบ A "จัดระเบียบ" + แถบล่างแบบ "กลาง 5"** (ปุ่มค้นหานูนกลางแถบล่าง · รายการโปรดขึ้นเป็นไอคอนหัวใจบน navbar มือถือ) · ขอบเขต = หน้าแรกฝั่งมือถือ + chrome มือถือเท่านั้น ไม่แตะ desktop chrome (งานอีก session เพิ่งขึ้น master)

- [x] **MHOME-01 — Chrome มือถือ:** `bottom-nav.tsx` ถอด `/watchlist` ออกจากแท็บ แล้วแทรกปุ่มค้นหาทรงกลมนูนกลางแถบ (2 แท็บ + FAB + 2 แท็บ · FAB เปิด search modal ผ่าน `setSearchOpen` ไม่ใช่ลิงก์ · ≥44px · aria ครบ) · `header-mobile.tsx` ถอดปุ่มค้นหาออก (ย้ายลงล่างแล้ว) แล้วใส่ไอคอนหัวใจ → `/watchlist` แทนช่องเดิม
- [x] **MHOME-02 — Hero หด:** `home-search-hero.tsx` ถอด `px-4` ที่ซ้อนกับ gutter หน้า · โปรยเหลือ 1 บรรทัด + บรรทัด meta (`N ใบ · M ชุด · อัปเดตล่าสุด <วันที่จริง>`) · แก้ `buildHomeHeroLead` ใน `lib/seo/copy/home.ts` ให้สั้นลงโดยคง keyword "การ์ดวันพีช"/OPTCG และห้ามสัญญา schedule
- [x] **MHOME-03 — หัวแถบชุดบรรทัดเดียว:** `home-set-strip.tsx` บนมือถือให้หัวเป็นแถวเดียว (h2 ซ้าย + "ดูชุดทั้งหมด" ขวา) ซ่อนบรรทัดคำอธิบายใต้หัวเฉพาะ `<sm` · desktop คงของเดิม (ลูกศร + คำอธิบาย)
- [x] **MHOME-04 — แถบควบคุม 3→2 แถว + ขอบเดียว:** `home-market-overview.tsx` รวมแถวเลือกชุด/ตัวกรอง/มุมมองเป็นแถวเดียว · แถวติดหนึบ = ราง grade + ชุดเรียง (ราคา | เปลี่ยนแปลง + ปุ่มช่วงเวลากดวน) · ทุกบล็อกใช้ขอบ 20px เดียวกัน (เลิก `px-4` ซ้อน, sticky `-mx-5 px-5`) · sticky ใช้ token `z-sticky` แทน `z-10`
- [x] **MHOME-05 — ระยะห่างหน้าแรก:** `page.tsx` ลด `mt-9 sm:mt-12` เป็นระยะ section มาตรฐาน 4px scale บนมือถือ (desktop คงเดิม)
- [x] **MHOME-06 — Verify:** tsc ผ่าน · lint **0 errors** (26 warnings เดิม) · test **154 ไฟล์/924 ข้อผ่าน** (เพิ่ม `mobile-home-layout.test.tsx` 6 ข้อล็อกกติกาใหม่ + อัปเดต 2 เทสต์เดิมที่ล็อกค้นหาไว้บน header มือถือ) · build **214 หน้า** · เปิดจริง 375×812: ขอบซ้าย 20px ตรงกันทุกบล็อก (h1 · meta · h2 · pill แรก · SetPicker · ราง grade) · ราคาชิดขวา 355 ตรงกับป้ายเรียง 354 · sticky เกาะที่ 56px พอดี · FAB ค้นหา hit-test ผ่าน เปิด modal + โฟกัสช่องพิมพ์จริง · หัวใจ 44px ลิงก์ `/watchlist` · console 0 error · Light mode ปุ่มค้นหาใช้สีเดียวกับ CTA หลักของเว็บ (`#73533e` ขาวบนน้ำตาล ผ่าน AA) · desktop 1280px ไม่กระทบ (ตารางเดิม · ราง grade เหลือ 1 · chrome มือถือซ่อนหมด) · **แถวราคาแรก 608px → 496px (เร็วขึ้น 112px ≈ 2 แถว)** วัดเทียบ production จริง
- [ ] **MHOME-07 — เก็บบ้าน:** ลบ `/proto/mobile-home` เมื่อเบสรับงานบนเว็บจริงแล้ว (ตอนนี้เก็บไว้ให้ย้อนดูแบบที่ไม่ได้เลือก)

## 📐 Site-wide market canvas (owner direction · 2026-08-28)

> ขยายพื้นที่ข้อมูลของหน้าปกติให้ใกล้เว็บตลาดอย่าง CoinMarketCap/CoinGecko โดยคง mobile เดิมและคง reading/form/dialog widths ที่ตั้งใจแคบ ไม่เปลี่ยน spacing, typography, query, state หรือ workflow

- [x] **CANVAS-01 — Live reference + layout audit:** วัด DOM live ที่ 1280/1440/1920px, แยก CMC แบบเกือบ fluid ออกจาก CoinGecko แบบ cap 1680px และเลือก Meecard cap 1400px เป็นก้าวที่พอดีกับจำนวนคอลัมน์ปัจจุบัน; independent layout assessment + detector ก่อนแก้ไม่มี finding
- [x] **CANVAS-02 — Canonical width:** เปลี่ยน `PageContainer` default จาก 1280px เป็น 1400px และให้ `wide` คงความหมายเป็น canvas 1600px โดย route แบบ reading/article/narrow/full ไม่เปลี่ยน
- [x] **CANVAS-03 — Duplicate-cap cleanup:** ให้ Footer ใช้ `PageContainer`; ถอด cap 1280px ซ้ำจาก Card Detail/runtime loading และ cap 1152px ซ้ำจาก Portfolio gateway เพื่อรับความกว้างจาก shell กลาง
- [x] **CANVAS-04 — Regression + rendered verification:** width contract 3/3 · detector `[]` · independent React/Next/a11y review ไม่มี finding · TypeScript ผ่าน · full test 152 files / 907 tests · lint 0 errors (33 warnings เดิม/นอก scope) · build 210 หน้า · Browser จริง Home 390/768/1280/1440/1920 และ Set/Card/Portfolio 390/1440/1920 ยืนยัน shell 1400px, usable data 1336px, Footer alignment, loading parity, no-overflow และ console/hydration error 0
- [x] **CANVAS-05 — Full-screen comparison trial:** ทดลอง near-fluid cap 1920px + gutter 16px ตามขนาดจริงของ CMC ที่ 1280/1440/1920/2560px และเปิดดู Home/Set/Card/Portfolio จริง; layout ไม่ล้น แต่หน้าการ์ดกับพื้นที่ข้อมูลรู้สึกกว้างติดขอบและความสัมพันธ์หลวมเกินไป
- [x] **CANVAS-06 — Owner visual decision:** คืนเวอร์ชัน 1400px / `wide` 1600px / desktop gutter 32px ที่ owner เลือกหลังเทียบ render จริง โดยคง mobile, reading/form/dialog widths และ duplicate-cap cleanup เดิม

## 📊 Homepage market status composition (owner direction · 2026-08-28)

> ย้าย “การ์ดทั้งหมด / มูลค่ารวม / JPY/THB” ออกจาก desktop header มาอยู่กับการ์ดมูลค่าสูงสุดตามภาพอ้างอิง โดยซ้ายเป็นข้อมูลหลัก ขวาเป็นสถิติรอง และคงราคาขึ้น/ลงกับตารางตลาดเดิม
>
> ⛔ **ทิศทางนี้ถูกยกเลิกทั้งหัวข้อ 2026-08-28 (รอบดึก).** การย้อน Navbar กลับเป็นตัวเดิมพาชิป การ์ดทั้งหมด/มูลค่ารวม/JPY-THB กลับเข้า ticker ทำให้ตัวเลขโผล่ 2 ที่บนหน้าแรก เบสส่งภาพแล้วสั่ง **"ส่วนนี้ขอแบบเดิม แต่ขอเพิ่มคอลัมด้านขวาไว้เป็นช่องสำหรับโฆษณา"**
>
> ผลลัพธ์: แถวไฮไลต์หน้าแรกกลับเป็น 3 บล็อกเดิม (มูลค่าสูงสุด · ขึ้น · ลง) ไม่มีกล่องตัวเลขแล้ว · ตัวเลขรวมอยู่บน ticker ที่เดียว · เพิ่มคอลัมน์ที่ 4 เป็นช่องโฆษณา (zone `home-highlight-rail`) แสดงเฉพาะจอ ≥1280px · ลบ `HomeMarketStatus` + test ทิ้ง และถอดคิวรี aggregate ที่ไม่มีใครใช้ออกจาก `lib/data/home.ts`
>
> ข้อ HOME-STATUS-01..05 ด้านล่าง = บันทึกว่าเคยทำอะไร **ไม่ใช่สถานะปัจจุบัน**

- [x] **HOME-STATUS-01 — Data + composition:** ส่ง total value และ exchange rate จาก server data ของหน้าแรก แล้วประกอบ canonical `Surface` เดียวแบบซ้ายมูลค่าสูงสุด / ขวา 3 metric rows โดยมูลค่ารวมยังลิงก์ไป Market Overview; ถ้าไม่มี priced card ฝั่ง metric ยังอยู่ครบด้วย neutral fallback
- [x] **HOME-STATUS-02 — Header cleanup:** ถอด market-stat pills ออกจาก desktop utility row โดยคง auth/profile/preferences/upgrade behavior และความสูง chrome เดิม
- [x] **HOME-STATUS-03 — Regression:** ล็อก data contract, link, metric order, neutral money color, exact owner values, partial-data fallback และไม่ให้ client header ยิง `/api/cards?limit=1` กับ `/api/exchange-rate` ที่ไม่มีผู้ใช้แล้ว
- [x] **HOME-STATUS-04 — Verification:** detector `[]` · focused 25/25 · TypeScript ผ่าน · full test 152 files / 908 tests · lint 0 errors (33 warnings เดิม/นอก scope) · build 210 หน้า · Browser จริง 390/768/1024/1280px Light/Dark ยืนยัน layout 6+3+3, ราคาไม่แตกที่ 1024px, link ไป Market Overview, no-overflow/overlay/console/hydration และไม่มี market-stat client requests
- [x] **HOME-STATUS-05 — One-column desktop density:** ลด `HomeMarketStatus` จาก 2 เหลือ 1 grid column ตั้งแต่ `lg`; 1024px ใช้ 3 tracks และ `xl` ใช้ 4 tracks เพื่อสงวนคอลัมน์หลังราคาลงสำหรับ ad inventory · compact featured card ฝั่งซ้ายโดย metrics ยังอยู่ขวา · เพิ่ม inset focus ring + regression topology · detector `[]` · independent review ไม่เหลือ P0/P1 · targeted lint 0 errors · TypeScript ผ่าน · full test 152 files / 909 tests · build 211 หน้า · Browser 390/768/1024/1280px ยืนยัน 0→2→3→4 tracks, status span 2→1, ค่า/ราคาไม่ตัด, ความสูง 3 กลุ่มเท่ากัน, no-overflow/overlay/console; full lint ถูกบล็อกเฉพาะ concurrent `src/app/proto/navbar/page.tsx:583` นอก scope
- [x] **HOME-COPY-RESTORE-01 — Restore original section composition:** คืน subtitle `เครื่องมือครบชุด…` ใต้หัวฟีเจอร์ และคืนประโยคจำนวนการ์ด/ชุดไว้ใต้หัว `ราคาตลาดการ์ดวันพีชวันนี้` ตามภาพ owner โดยคง Hero/Search/Navbar และ HomeMarketStatus ใหม่ทั้งหมด · detector `[]` · focused 17/17 · full 152 files / 907 tests · lint 0 errors (33 warnings เดิม) · build 210 หน้า · Browser 390/639/640/1280px Light/Dark ยืนยันตำแหน่ง copy, 1→3 columns, tabs breakpoint, no overflow/error overlay/hydration

## 🔎 Navbar search-first + profile preferences (owner direction · 2026-08-27) — ⛔ ถูกย้อนออกแล้ว 2026-08-28

> **สถานะจริง: ทิศทางนี้ถูกยกเลิก.** วันที่ 2026-08-28 ลองต่ออีก 3 รอบ (Command Deck 2 แถว → หน้าตาแบบ proto → 3 ชั้นมีชีพจรตลาด) เบสดูแล้วเทียบกับของเดิมบนเว็บจริง แล้วเคาะว่า **"กลับไปแบบเก่าดีกว่า"** → desktop chrome ย้อนกลับเป็นโครง 2 แถวที่ commit ไว้ (ticker: Game→Set · การ์ดทั้งหมด/มูลค่ารวม/JPY-THB · ค้นหา · อัปเกรด · ภาษา/สกุลเงิน/ธีม | แถวล่าง: Meecard · เมนู · พอร์ต/รายการโปรด/Honey · โปรไฟล์)
>
> ข้อ HEADER-SEARCH-01..05 ด้านล่างเก็บไว้เป็นบันทึกว่าเคยทำอะไรและทำไมถึงไม่เอา **ไม่ใช่สถานะปัจจุบันของโค้ด** · ของที่รอดมา: `/more` ยังคุมภาษา/สกุลเงิน/ธีมบนมือถือ, Hero หน้าแรกยังไม่มี input ซ้ำ, ค้นหาด้วยรูป + ผลลัพธ์ชุดการ์ดใน palette ยังอยู่
>
> เดิมตั้งใจ: ทำให้ Search เป็นจุดเริ่มค้นหาหลักแบบ CoinGecko/CMC, ลด utility ที่แย่งสายตาบน desktop chrome และรวมภาษา/สกุลเงิน/ธีมไว้กับเมนูบัญชี

- [x] **HEADER-SEARCH-01 — Desktop hierarchy:** ย้าย Search มาเป็น control หลักท้าย primary navbar, คง `/` และ `⌘/Ctrl+K`, รองรับค้นหาการ์ด/ชุด/รูปภาพ และใช้ responsive width 80/112/176px หลัง owner คืน Set hub + utility labels โดย Browser 768/1024/1280/1440/1536px ไม่ล้น
- [x] **HEADER-SEARCH-02 — Profile preferences:** รวมภาษา/สกุลเงิน/ธีมไว้ใน dropdown บัญชีพร้อม `Test · ตั้งค่าทั่วไป`, chevron, current value และ keyboard submenu; guest ใช้ settings dropdown เดียว ส่วน `/more` มือถือรองรับ System/Light/Dark ด้วย persistence เดียวกัน
- [x] **HEADER-SEARCH-03 — Home dedupe:** ถอด input ซ้ำออกจาก Hero แต่คง H1/SEO subtitle ให้มองเห็น และให้ตารางตลาดขึ้นเร็วขึ้นโดยมี Search ใน chrome เป็นทางเข้าหลักเพียงจุดเดียวต่อ viewport
- [x] **HEADER-SEARCH-04 — Regression + verification:** Impeccable detector `[]` · independent layout review ไม่เหลือ finding · focused 32/32 · full test 150 files / 901 tests · TypeScript ผ่านใน build · lint 0 errors (33 warnings เดิม) · build 210 หน้า · Browser จริง 320/390/768/1024/1280/1440/1536px Light/Dark ยืนยัน click/`/`/`⌘K`, card/set/photo search, preference persistence, Escape/focus restoration, ไม่มี overflow และ console ไม่มี warning/error; guest branch ล็อกด้วย source/regression โดยไม่ได้ logout บัญชีทดสอบจริง
- [x] **HEADER-SEARCH-05 — Owner hierarchy correction:** คง Game → Set ใน primary row ข้าง Meecard, คืน hub `ชุดการ์ด`, แสดงชื่อ พอร์ต/รายการโปรด/Honey ทุก desktop breakpoint และจัดความกว้าง catalog/nav/search ใหม่โดยไม่ลด capability เดิม · Impeccable layout detector `[]` · focused 32/32 · full 150 files / 901 tests · lint 0 errors (33 warnings เดิม) · build 210 หน้า · Browser จริง 768/1024/1280/1366/1440/1536px ยืนยัน requested labels + Set hub + Search อยู่ใน viewport, Game/Set picker และ Escape/focus ผ่าน, `/opcg/sets` นำทางจริง, TH/JP ไม่ทำให้หน้า overflow และ fresh-tab console ไม่มี warning/error

## 🃏 Set detail “First-card-first” (owner selected A · 2026-08-27)

> ขอบเขตรอบนี้คือหน้ารายละเอียดชุดการ์ดเท่านั้น: ยกภาพ/รหัส/ความน่าเชื่อถือให้อ่านเร็ว และให้เห็นการ์ดใบแรกเร็วขึ้น โดยคง query/URL/grade/filter เดิม · ไม่รวม global header, bottom ad, schema/data cleanup

- [x] **SET-FIRST-A-01 — Hero + semantics:** ย่อ hero แบบ mobile-first, ย้ายปุ่มย้อนเข้า context, แยกจำนวนหมายเลขการ์ด/เวอร์ชันพิเศษ/เวอร์ชันทั้งหมด และทำ top-card trust strip ที่บอกชื่อ+รหัส+แหล่งราคาอย่างซื่อสัตย์
- [x] **SET-FIRST-A-02 — Mobile controls:** รวบตัวเลือก grade และแถว period/rarity/filter เป็น 2 แถว, target ≥44px, ไม่ clip ที่ 390/768px และคง desktop sidebar เดิม
- [x] **SET-FIRST-A-03 — Regression:** ล็อก visible card-code ไม่หลุด machine suffix, count semantics, heading/accessibility, control labels และ filter/grade behavior
- [x] **SET-FIRST-A-04 — Verification:** Impeccable detector `[]` · TypeScript ผ่าน · focused 46/46 · full test 149 files / 892 tests · lint 0 errors (33 warnings เดิม) · build 210 หน้า · Browser 390×630/844, 768×900, 1280×720 Light/Dark ยืนยัน first card เข้า fold มือถือ, Set Detail ไม่ล้นที่ 390/768, controls ≥44px, FilterModal/Escape/focus/console ผ่าน และ user-like grade switch ไม่กระโดด; global header overflow ที่ 1280 กับ fixed bottom ad เป็นของเดิมนอก scope
- [x] **SET-FIRST-A-05 — Owner hierarchy correction:** คืนปุ่มย้อนเป็นแถวเหนือ Hero บนมือถือ, ลดสถิติ Hero เหลือ “การ์ดทั้งหมด” เพียงค่าเดียว, คืนปุ่มอัตราดรอปแบบมีข้อความ และคงการ์ดมูลค่าสูงสุดเป็นหลักฐานราคา
- [x] **SET-FIRST-A-06 — Context + reverify:** คืนคำอธิบายสั้นใต้ H2 ราคา, ถอด paragraph ที่ผิดกลุ่มออกจาก FAQ; Impeccable detector `[]` · independent React/Next/a11y review ไม่พบ finding · focused 47/47 · TypeScript ผ่าน · full test 149 files / 893 tests · lint 0 errors (33 warnings เดิม) · build 210 หน้า · Browser จริง 390×844, 768×900, 1280×800 Light/Dark ยืนยันปุ่มย้อนเหนือ Hero, `การ์ดทั้งหมด 174 ใบ`, ปุ่มอัตราดรอปมีข้อความ/เปิด dialog/Escape คืน focus, intro อยู่ใต้ H2, ไม่มี paragraph ซ้ำก่อน FAQ, ไม่มี overflow ที่ 390/768 และ console ไม่มี warning/error; global header overflow ที่ 1280 เป็นของเดิมนอก scope
- [x] **SET-FIRST-A-07 — Restore approved Hero composition:** คืนโครง Hero แบบเดิมตามภาพ owner: flex row ทุกขนาด, box art ใหญ่ด้านซ้าย, identity + `การ์ด` + การ์ดมูลค่าสูงสุด + ปุ่มอัตราดรอปอยู่คอลัมน์ขวา โดยคงปุ่มย้อนเหนือ Hero และ logic grade/SEO/card URL เดิม
- [x] **SET-FIRST-A-08 — OP13 release date + reverify:** เติมวันวางจำหน่าย OP13 `2025-08-23` จาก Bandai Japan เป็น catalog fallback ใต้ชื่อชุดโดยไม่เขียน DB บางแถว; เพิ่ม DB-precedence + a11y identity/tap target regression · Impeccable detector `[]` · independent React/Next/a11y review ถูกแก้ครบ · focused 47/47 · TypeScript ผ่าน · full test 149 files / 893 tests · lint 0 errors (33 warnings เดิม) · build 210 หน้า · Browser จริง 320×800, 390×844, 768×900, 1280×800 Light/Dark ยืนยัน geometry ตรงภาพ, วันที่/DOM order ถูก, top-card link 47px + accessible name, Drop dialog/Escape/focus และ console ผ่าน; ไม่มี overflow ที่ 320/390/768 ส่วน global header overflow ที่ 1280 เป็นของเดิมนอก scope

- [x] **SET-FIRST-A-09 — Sticky mobile grade controls:** รวมแถวเกรดกับแถว period/rarity/filter เป็น sticky control group เดียวใต้ global chrome บนมือถือ/แท็บเล็ต; outer เดียวใช้ `top-[var(--chrome-h)] z-sticky` และ `getStickyChromeHeight()` วัดความสูงรวม จึงคง desktop sidebar, touch target และ rarity offset เดิม
- [x] **SET-FIRST-A-10 — Sticky regression + browser verify:** ล็อก DOM order `sticky → grade → compact controls` · focused 9/9 · TypeScript ผ่าน · Impeccable detector `[]` · full test 149 files / 893 tests · lint 0 errors (33 warnings เดิม) · build 210 หน้า · Browser จริง 320/390/768/1023/1024/1280px Light/Dark ยืนยัน sticky top 56px มือถือ/100px แท็บเล็ต, สูงรวม 114px, rarity jump เว้น 16px ใต้ toolbar, FilterModal z70 เหนือ z30 + Escape คืน focus, breakpoint 1024 สลับเป็น sidebar และไม่มี overflow ที่ 320/390/768/1023/1024; global header overflow ที่ 1280 เป็นของเดิมนอก scope

## 🧪 Mobile navbar direction prototypes (2026-08-27)

- [x] **HEADER-NAV-PROTO-01** — ทำ route แยก `/proto/header-nav` ให้เทียบ 3 ทิศทางที่อยู่กึ่งกลางระหว่าง capsule ใหญ่กับ breadcrumb ที่เงียบเกินไป: A Pack Spotlight / B Latest Pack Shelf / C Set Stamp ใช้ภาพแพ็กจริง OP13–OP15 ใน home-fold context, กดสลับแบบ/ธีม/ชุดได้ และมี popover ตัวอย่างสำหรับเกม/ทุกชุด/แจ้งเตือน โดยไม่แตะ production header
- [x] **HEADER-NAV-PROTO-02** — Browser 390×844 + 1280×720 ผ่าน: ทุกแบบคงแถว 56px, action targets 44px, long set name truncate โดยไม่ดันไอคอน, Light/Dark + portaled popover อ่านได้, no horizontal overflow/console error, Escape คืน focus; Impeccable detector `[]` · lint 0 error (34 warning เดิม) · test 149/878 · build 210 หน้า

## 🧭 Global Game → Set navbar (2026-08-27)

- [x] **HEADER-SET-NAV-01** — ย้ายบริบทเกมและทางไปชุดการ์ดขึ้น chrome กลางทุกหน้าที่ใช้ site header: desktop อยู่แถวบนโดยไม่เพิ่มความสูงรวม, mobile คง header แถวเดียวและใช้ control กะทัดรัด `Game › ชุด`; เลือกชุดแล้วนำทางไป `/{game}/sets/{code}` ไม่กรองหน้าปัจจุบัน · topology test ล็อก 56/100px + route helper ผ่าน
- [x] **HEADER-SET-NAV-02** — ตัวเลือกชุดค้นหารหัส/ชื่อได้, ปักชุดล่าสุด, แบ่ง Booster / Extra Booster / Starter+อื่น ๆ, ใช้ลิงก์จริงพร้อมรูปและ fallback, มีทางไปหน้าชุดทั้งหมด และรองรับ Arrow/Enter/Escape/focus restoration · pure regression ครบ 51 ชุด + Browser 390px ยืนยันเปิด/ปิดคืน focus และค้นหา OP03 ด้วย ArrowDown/Enter ไป route จริง
- [~] **HEADER-SET-NAV-03** — ถอดตัวเลือกชุดที่ซ้ำออกจาก hero หน้าแรกแต่คง search/H1/SEO เดิม; เพิ่ม i18n + regression tests และตรวจ browser จริงที่ 390×667, 390×844, 768×900 และ 1280×720 ทั้ง light/dark โดยห้ามเพิ่มความสูง mobile chrome หรือทำให้แถวแรกชน ad/bottom nav · code/test/build/HTTP ผ่าน; Browser mobile 390×844 + 569×811 Light/Dark/no-overflow ผ่านแล้ว เหลือ exact 390×667/768/1280 และ first-row เทียบ ad/bottom nav
- [x] **HEADER-SET-NAV-04 (owner visual correction)** — เบสไม่ชอบ compound capsule ใหญ่บน mobile: ถอด `surface-2`/hairline/rounded wrapper, เปลี่ยนเป็น breadcrumb แบน `OPCG › ชุดการ์ด`, ลด label เป็น semantic `text-label` โดยคง 44px targets/56px row/สอง action เดิม · focused 11/11 · lint 0 error · full 878/878 · build 209 หน้า · Browser Light/Dark 390/569px ไม่มี overflow, menu/dialog/keyboard/focus/console ผ่าน
- [x] **HEADER-SET-NAV-05 (owner-selected Pack Spotlight)** — ย้าย direction A จาก `/proto/header-nav` เข้า production mobile header: general route แสดงภาพ/รหัส/ชื่อชุดล่าสุด ส่วนหน้าชุดยึดชุดใน route จริง, แยก action เกม/ชุด, ไม่มี capsule และคง dialog/search/navigation เดิม; เพิ่ม compact fallback ต่ำกว่า 360px (ปุ่มชุด ≥44px และซ่อน Theme ที่ซ้ำกับ `/more` เฉพาะหน้ารอง) · Browser 320×667, 390×667/844, 768×900, 1280×720 Light/Dark/no-overflow/console ผ่าน, Escape คืน focus + ค้นหา OP03 ไป route จริง · Impeccable `[]` · lint 0 error (34 warning เดิม) · test 149/881 · build 210 หน้า
- [x] **HEADER-SET-NAV-06 (owner icon + visual unification)** — คืน game selector เป็น grammar เดิมที่อ่านชื่อชัด แล้ววางไอคอนหมวกฟาง / Poké Ball จาก asset เจ้าของไว้หน้าชื่อทุก surface (global switcher, MINE game filter, card picker); mobile set trigger ใช้ capsule + PackageOpen + label บรรทัดเดียว + chevron เหมือน desktop แต่ยังเปิด full-screen Dialog และคง route/launch gate/keyboard/focus เดิม · หน้ารอง mobile คืนพื้นที่ 44px จาก Theme ที่ซ้ำใน `/more` ให้ชื่อชุดอ่านได้ และแก้ mobile market sort rail ไม่ให้หน้า 320px ล้น · Browser 320/390/768/1280 Light/Dark, OP03, menu/filter/card-picker, target 44px, alpha/aspect, overflow/console ผ่าน · Impeccable `[]` · lint 0 error (34 warning เดิม) · test 149/878 · build 210 หน้า
- [x] **HEADER-SET-NAV-07 (owner catalog polish)** — ถอดหมวดปัก “ชุดล่าสุด” ออกจากตัวเลือกชุด แต่คงทุกชุดไว้ครบภายใต้ Booster / Extra Booster / Starter+อื่น ๆ และเก็บ sticky category header ให้แนบขอบ scrollport แบบทึบ ไม่มีช่องว่างหรือภาพรายการลอดตอนเลื่อน · Browser 390×844 + 1280×720 Light/Dark ยืนยันหัวหมวด `top` ตรง scrollport, background ทึบ, รอยต่อหมวด/ค้นหา OP03/Escape คืน focus/no-overflow/console ผ่าน · Impeccable `[]` · lint 0 error (34 warning เดิม) · test 149/878 · build 210 หน้า
- [x] **HEADER-SET-NAV-08 (owner mobile chrome correction)** — คืนชื่อ `Meecard` ข้างหมีบน mobile และใช้ GameSwitcher standalone capsule แบบเดียวกับ desktop; จัด mobile chrome เป็น identity/actions 56px + Game→Set 44px เพื่อให้ครบที่ 320px โดย sync `--chrome-h`/sticky offsets เป็น 100px · Browser หน้าแรก/OP03 ที่ 320/390/569/767/768/1280 ยืนยัน Meecard + capsule เกม, ชื่อชุดยาว, touch target ≥44px, no overflow, sticky rarity top=100px, Dialog/menu Escape คืน focus และ console localhost สะอาด · React review + Impeccable `[]` · lint 0 error (34 warning เดิม) · test 149/878 · build 210 หน้า
- [x] **HEADER-SET-NAV-09 (owner top-row correction)** — ยุบ mobile chrome กลับเป็นแถวบน 56px แถวเดียวตาม feedback: `Meecard + Game → Set + utility` อยู่บรรทัดเดียว, GameSwitcher ยังคง standalone แบบ desktop, จอ 320px ซ่อนเฉพาะ wordmark/connector และคงปุ่มทุกตัว ≥44px; หน้าแรกให้ Bell ส่วนหน้ารองให้ Search เพื่อไม่บีบทางเลือกชุด, คืน `--chrome-h` มือถือ 56px / desktop 100px · Browser หน้าแรก+OP03 ที่ 320×667, 390×667, 767×720, 768×720 ยืนยัน no overflow, sticky rarity ชิด chrome (gap 0px mobile / overlap hairline 1px desktop), menu/Dialog Escape คืน focus และ console ไม่มี warning/error · Impeccable `[]` · lint 0 error (34 warning เดิม) · test 149/878 · build 210 หน้า
- [x] **HEADER-SET-NAV-10 (owner missing-utility correction)** — คืน utility มือถือให้ครบตาม grammar เดิม: Home = Bell + Theme, หน้ารอง = Search + Bell + Theme, guest ใช้ Login แทน Bell; ยังอยู่แถวบนเดียว 56px และทุก target ≥44px โดยต่ำกว่า 360px ย่อเฉพาะ Game เป็น crest, wordmark/connector/set label ตามพื้นที่แทนการซ่อนฟังก์ชัน · Browser หน้าแรก+OP03 ที่ 320/390/576/767/768px ยืนยันปุ่มครบ/no overflow/Theme ไม่ขยับ layout/menu+Dialog Escape คืน focus/console ไม่มี warning-error · React review + Impeccable `[]` · lint 0 error (34 warning เดิม) · test 149/879 · build 210 หน้า
- [x] **HEADER-SET-NAV-11 (owner logo-only rebalance)** — ถอด wordmark `Meecard` ออกจาก mobile chrome ให้เหลือหมีเป็น home affordance 44px, จัด rhythm `Logo · Game → Set · utilities` ด้วย gap 4px และ cap ปุ่มชุด 224px ตั้งแต่ 480px เพื่อไม่ยืดผิดสัดส่วน; คง Search/Bell/Theme/Login, desktop header และ keyboard behavior เดิม · Browser หน้าแรก+OP03 ที่ 320/390/576/767/768px ยืนยัน touch target ≥44px/no overflow/Light-Dark/menu+Dialog Escape คืน focus/console สะอาด · React review + layout detector `[]` · lint 0 error (34 warning เดิม) · test 149/879 · build 210 หน้า
- [x] **HEADER-SET-NAV-12 (owner home search utility)** — แสดง Search icon ใน mobile navbar บนหน้าแรกด้วย โดยคง Logo/Game/Set/Bell/Theme/Login และแถวสูง 56px ครบ; ใช้ search modal กลางเดิมและคืน focus หลัง Escape · Browser Home 320/390/576/767 + desktop boundary 768 ผ่าน, ทุก target ≥44px, ไม่มี overflow/console error · layout detector `[]` · lint 0 errors (34 warnings เดิม) · test 149 files / 879 tests · build 210 หน้า
- [x] **HEADER-SET-NAV-13 (owner explicit set label)** — เปลี่ยน label ย่อของปุ่มชุดบน mobile จาก `ชุด` เป็น `เลือกชุด` โดยไม่เปลี่ยนข้อความ surface อื่น; ซ่อน Package icon ที่แคบและเลื่อน connector Game→Set ไป ≥430px เพื่อคง dropdown chevron · Browser 320/390px อ่านคำเต็ม, แถว 56px/targets ≥44px/Search-Bell-Theme ครบ, no overflow/console error, Dialog Escape คืน focus · i18n TH/EN/JP lock · React review + layout detector `[]` · tsc ผ่าน · lint 0 errors (34 warnings เดิม) · test 149 files / 882 tests · build 210 หน้า
- [x] **HEADER-SET-NAV-14 (release)** — release scope ผ่าน secret/schema/config/dependency audit, แยก production `037ccad` และ prototype `072276a`, PR #119 ผ่าน Vercel Preview แล้ว merge เข้า default branch `master` ที่ `0b2461f` (repo ไม่มี `main`, ห้าม direct push) · fetch ยืนยัน `origin/master` ตรง merge commit · Vercel Production `dpl_AeAvooHEKRjr1k7goNkEKJhBEWjQ` Ready และ alias หลักตอบ 200 · Browser Production 390×844 + 1280×720 และ OP03 ผ่าน: `เลือกชุด`/Search/targets/ไม่มี “ชุดล่าสุด”/Escape คืน focus/no overflow/console สะอาด

## 🎛️ Recent-sales inline filters (2026-08-26)

- [x] **RECENT-SALES-FILTERS-01** — แสดงตัวกรองสภาพและแหล่งขายแบบ inline โดยไม่ซ่อนใน `FilterModal`, วางตัวเลือกช่วงเวลาไว้ฝั่งขวา และคง shared range state, tier locks, filtering, table/list breakpoints และ empty states เดิม · focused 8/8 · lint 0 error · test 868/868 · build 209 หน้า · Browser 390/768/1024/1440px ยืนยัน filters visible, range ชิดขวา, no overflow และ state sync
- [x] **RECENT-SALES-FILTERS-02** — บังคับ `สภาพ` และ `ตลาด` เป็นคนละบรรทัดทุก viewport โดยคงตัวเลือกช่วงเวลาไว้ฝั่งขวาและไม่เปลี่ยน filtering behavior · focused 8/8 · lint 0 error · test 868/868 · build 209 หน้า · Browser 390/1440px ยืนยันคนละบรรทัด, range ชิดขวา, no overflow/overlay/error
- [x] **RECENT-SALES-FILTERS-03** — ทดลองย้ายหัวข้อ `สภาพ` และ `ตลาด` มาอยู่หน้ารางตัวเลือกในแต่ละบรรทัด โดยคง rail เลื่อนแนวนอน, ช่วงเวลาฝั่งขวา และ filtering behavior เดิม · focused 9/9 · lint 0 error · test 869/869 · build 209 หน้า · Browser 390/1440px ยืนยัน label อยู่หน้า rail, center delta 0, range ชิดขวา และ no overflow/overlay/page error
- [x] **RECENT-SALES-FILTERS-04** — คืนหัวข้อ `สภาพ` ไปอยู่เหนือ segmented rail, เปลี่ยน `ตลาด` เป็น dropdown ฝั่งขวา และคงตัวเลือกช่วงเวลาชิดขวา, exact-source filtering, tier lock และ responsive behavior เดิม · focused 8/8 · lint 0 error · test 868/868 · build 209 หน้า · Browser 390/768/1024/1440px ยืนยัน responsive topology, dropdown เลือก SNKRDUNK ได้จริง และ no overflow/overlay/page error
- [x] **RECENT-SALES-FILTERS-05** — polish แถบควบคุมให้เป็นระบบเดียวกัน: รวม `ตลาด` + `ช่วงเวลา` เป็นกลุ่มรองฝั่งขวา, ย้ายหัวข้อ `ตลาด` เข้าใน dropdown, ทำ Select เป็น soft control โทนเดียวกับ segmented rails และรักษา responsive/filter behavior เดิม · focused 3/3 · lint 0 error · test 868/868 · build 209 หน้า · Browser light/dark 390/768/1024/1440px ยืนยัน baseline, responsive grouping, dropdown/range interaction และ no overflow/overlap/page error
- [x] **RECENT-SALES-FILTERS-06** — คืน UI ตามแบบเดิม: ช่วงเวลาอยู่ซ้ายคู่ปุ่ม `ตัวกรอง`, ย้าย facet `สภาพ` + `ตลาด` กลับเข้า `FilterModal` และรักษา exact-source/grade filtering, shared range state, tier locks และ responsive table/list เดิม · focused 3/3 · lint 0 error · test 868/868 · build 209 หน้า · Browser light/dark 390/768/1024/1440px ยืนยัน controls อยู่บรรทัดเดียว, modal filter/apply/reset/keyboard ใช้งานจริง และ no overflow/page error

## 📉 Card detail price-history dedupe (2026-08-26)

- [x] **CARD-HISTORY-DEDUP-01** — เอาตาราง “ประวัติราคา” ที่ซ้ำกับกราฟออกจากหน้าการ์ด, ย้าย anchor ไปที่กราฟ, ถอด prop/data derivation ที่มีไว้เพื่อตารางนี้ และคงประวัติการซื้อขายล่าสุดไว้; กราฟ Raw อ่าน `CardPrice` ชุดเดียวกันแทนเส้นจำลอง, ช่วงยาวผ่าน API ที่ gate tier ฝั่ง server · focused 61/61 · lint 0 error · test 865/865 · build 209 หน้า · Browser 390×844 และ 1440×900 ไม่มี overflow/overlay/page error
- [ ] **CARD-HISTORY-DATA-01** — แยก provenance ของราคา seed กับราคา scrape จริง แล้วล้าง/backfill OP13-118_p3 ก่อนใช้กราฟนี้เป็นหลักฐานตลาดจริง; ต้องออกแบบ schema/data cleanup และขออนุมัติก่อนแตะ migration หรือข้อมูล

## 📅 OP03 Japanese release date (2026-08-26)

- [x] **SET-RELEASE-OP03-01** — เก็บวันวางขายญี่ปุ่น OP03 จาก Bandai ใน catalog fallback เฉพาะหน้ารายละเอียด (ไม่ทำให้ global latest-set เพี้ยนระหว่าง DB ยัง backfill ไม่ครบ), แสดง label + วันเต็มใน Set Hero เดิม · regression 9/9 · lint 0 error (35 warning เดิม) · test 845/845 · build 209 หน้า · Browser 390×844 และ 1440×900 ไม่มี overflow/overlay/console error

## 🐛 Honey mission create race (2026-08-26)

- [x] **HONEY-RACE-01** — daily/monthly `UserMissionPeriod` get-or-create รับ P2002 แล้วอ่าน row ที่ request คู่แข่งสร้าง; mission tracking retry P2034 สูงสุด 3 ครั้ง · regression 6/6 · lint 0 error (35 warning เดิม) · test 843/843 · build 209 หน้า · browser จริง GET/POST missions = 200 ไม่มี overlay/console error

## 🧭 เลือกชุดได้ทุกหน้า — N1 (2026-08-27)

- [x] **NAV-SET-N1-01** — ย้ายตัวเลือกชุดจากแถบ ticker ขึ้นแถวเมนูหลัก (ข้างโลโก้), ตัดเมนู "ชุดการ์ด" ที่ซ้ำออก, ให้ปุ่มบอกชุดปัจจุบัน และรู้จักชุดจากหน้าการ์ดด้วย (`getHeaderCardSetCode` อ่านจากคำนำหน้ารหัสการ์ด แล้วจะโชว์ก็ต่อเมื่อ match ชุดจริง) · รหัสชุดเป็นตัวใหญ่ทั้งปุ่มและรายการให้ตรงกับ `SetPosterTile` · มือถือถอดปุ่มสลับธีมออกจาก header (มีอยู่แล้วใน "ดูเพิ่มเติม") คืนความกว้างให้ชื่อชุด · เพิ่ม prop `compactBelowLg` ให้ `GameSwitcher` (ตราสัญลักษณ์อย่างเดียวต่ำกว่า lg) เพราะเกม+ชุดสองป้ายพร้อมกันดันแถวล้นที่ md · ป้ายไล่ระดับ: รหัสเสมอ → ชื่อเต็มที่ xl (desktop) / 430px (มือถือ) · tsc 0 · lint 0 error (34 warning เดิม) · test **888/888** · build 210 หน้า · Browser 320 / 375 / 768 / 1024 / 1280 / 1440 ไม่มี horizontal overflow และ tap target ≥44px ครบทุกจุด

## 🏠 Homepage hero set picker (2026-08-26)

- [x] **HOME-HERO-SET-01** — เพิ่ม dropdown เลือกชุด (`HeroSetPicker` ครอบ `SetPicker` เดิมโหมด navigate) เป็น CTA หลักในฮีโร่หน้าแรก — กดชุดแล้วเด้งไป `/opcg/sets/{code}` พร้อม pending state; ย่อช่องค้นหา (h-14→h-12, rounded-2xl→xl) + typewriter เป็นตัวรอง · SSR test ใหม่ล็อกลำดับ dropdown ก่อน input · tsc 0 · lint 0 error (34 warning) · test 868/868 · build 209 หน้า · Browser 390×844 (trigger 48px, popover ทับเนื้อหาถูกชั้น, nav ถึง op03 จริง) และ 1440×900 ไม่มี console error
- [x] **HOME-HERO-SET-02 (bolder pass)** — เบสติงว่ายังไม่สวย: trigger นำด้วย fan รูปกล่องชุดล่าสุด 3 ใบ (`triggerLeading` prop ใหม่บน `SetPicker`, รูป fixed-size ไม่ใช้ fill), label prominent อ่านสี foreground เต็ม, trigger สูง min-h-14 + `--elev-raised`, สองแท่งจัดแนวเดียวกัน `sm:max-w-xl` · impeccable detector `[]` · tsc 0 · lint 0 error · test 869/869 · build 209 หน้า · Browser มือถือ/desktop มืด+สว่าง ยืนยัน fan แสดงถูก popover ถูกชั้น (ปมภาพแท่งเข้มก่อนหน้า = artifact ของ Browser pane capture ไม่ใช่บั๊กเว็บ — DOM/computed ถูกตลอด)

## 🏠 Homepage latest-set placement (2026-08-26)

- [x] **HOME-SETS-ORDER-01** — ย้าย “ชุดการ์ดวันพีชล่าสุด” จากใต้ search hero ไปไว้หลังตารางตลาดและ pagination โดยคง crawlable links, responsive rail/grid และข้อมูลเดิม · regression 7/7 · lint 0 error (35 warning เดิม) · test 844/844 · build 209 หน้า · Browser 390×844 และ 1280×720 ยืนยันลำดับ/spacing/no-overflow/no-overlay

## 🔍 SEO Pillar + Content (2026-08-04 — จาก audit 11 ทีม · แผนเต็ม: [doc/seo-content-plan.md](doc/seo-content-plan.md))

> เป้า: เว็บอ่านออกโดย Google เป็น "เว็บไทยเรื่องราคาการ์ดวันพีซ" — โครง 3 ชั้น หน้าแรก → หน้าชุด → หน้าการ์ด + เสาความรู้ /guide
> ข้อเท็จจริงจาก DB (ตรวจ 2026-08-04): การ์ด 3,838 ใบ · **`Card.nameTh` ไม่ใช่ภาษาไทยเลยสักใบ** (เป็นสำเนาชื่ออังกฤษ — ห้ามเคลมว่าค้นด้วยชื่อไทยได้) แต่ **`effectTh` เป็นไทยจริง 3,478 ใบ** · ชุด 51 (`CardSet.nameTh` ว่างทั้งหมด) · `latestPriceThb` ว่างทั้งหมด (ต้องแปลงจาก JPY ด้วย `jpyToThb`) · ตาราง BlogPost **ไม่มีใน DB** (บล็อกยังไม่ทำงานจริง) · drop rate มี 50/51 ชุด

- [x] **SEO-P0 โครงสร้างพื้นฐาน** — ย้าย canonical ออกจาก layout ราก · meta ไทยระดับเว็บ + verification จาก env · robots แยกหน้าที่ (crawl control) · redirect 308 · `/proto` noindex · `/saved` metadata · sitemap เพิ่ม about/contact/honey/raffle/most-expensive/guide ใหม่ · JSON-LD: Organization + Product ราคา THB/priceValidUntil ไม่เคลม InStock
- [x] **SEO-P1 หน้ารบ** — หน้าการ์ด (render ไทย · H1+title มีรหัสการ์ด · ย่อหน้าเปิด+FAQ auto · ลบ section ปลอม → ตารางราคาจริง · ย้าย viewCount ออกจาก render) · หน้าชุด (H1 มีชื่อชุด · intro auto · drop rate ใน HTML · FAQ)
- [x] **SEO-P2 หน้าแรก + เครื่องมือ + guide** — H1 หน้าแรกโชว์จริง + H2 เหนือตาราง + แถบชุด · server-render trending/search/deck-calc · เนื้อ drop-calculator · retitle guide 7 หน้า + ขยาย guide/buying
- [x] **SEO-P3 หน้าใหม่** — `/opcg/most-expensive` (อันดับสดจาก DB) · `/guide/authenticity` (แท้-ปลอม) · `/guide/versions` (JP/EN — **แทน guide/shops ที่ยกเลิก**: ช่องทางซื้อถูก /guide/buying คลุมหมดแล้ว จะแย่งอันดับกันเอง + ยืนยันชื่อร้านไทยรายตัวไม่ได้) + ลิงก์จากฮับ/sitemap
- [x] **SEO-V ตรวจรับ** — tsc 0 · lint 0 error (28 warning เดิม) · test 134 files/734 · build 209 หน้า · ตรวจ HTML จริงจาก `next start` (จำลอง production ด้วย `NEXT_PUBLIC_BYPASS_AUTH=false` เพราะเครื่อง dev เปิด bypass ไว้ทำให้หน้า auth-gated ทดสอบเพี้ยน) — title/H1/canonical ถูกทุกหน้า · `/proto` = noindex,nofollow · canonical ไม่มีหน้าไหนชี้ "/" นอกจากหน้าแรก
- [ ] **SEO-OPS (ต้องทำบน Vercel — โค้ดทำแทนไม่ได้)** — ตั้ง `NEXT_PUBLIC_APP_URL` เป็นโดเมนจริง (ไม่งั้น canonical/sitemap/OG ชี้ `https://meecard.app` ตาม default) · สมัคร Google Search Console แล้วใส่ `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` · submit sitemap

## 🎨 SEO Round 3 — ความสวย + เก็บแต้ม (2026-08-07 — รอบสุดท้ายจาก audit)

- [x] **R3-A ศูนย์คู่มือ /guide จัดใหม่** — การ์ดบทขึ้นจอแรกทันที (เดิม prose 1.5 จอกั้น) · บทนำ 4→2 ย่อหน้าย้ายลงใต้ลิสต์บทในคอลัมน์อ่าน · พบราก width: hub หลุด `ROUTE_WIDTH` regex ใน main-chrome (subpage ได้ max-w-2xl อัตโนมัติ) — แก้ที่ hub ให้ตรงค่าเรนเดอร์จริง (672px ไม่ใช่ max-w-3xl ที่เป็น class ตายในไฟล์) · แถมแก้ breadcrumb "Guide" อังกฤษ hardcode → คีย์ `guideBreadcrumbGuide` 3 ภาษา (ทั้งที่ตาเห็น + JSON-LD ทั้ง 7 หน้า)
- [x] **R3-B ลิงก์ในเนื้อความ guide** — rarities→most-expensive · colors→search · card-types→rarities · authenticity: red flag→search + FAQ→rarities/versions · versions: เนื้อความ→sets + FAQ links · แก้ anchor ผิดปลายทาง (GuideSourceList "ราคากลาง" ชี้ most-expensive → search)
- [x] **R3-C /guide/versions เก็บ "การ์ดวันพีซ ภาษาไทย"** — section ใหม่ 3 ย่อหน้า + FAQ 1 ข้อ: การ์ดพิมพ์ไทยยังไม่มี (ข้อเท็จจริง verify จากเว็บจริง) · KIDZ & KITZ = ผู้นำเข้า/จัดจำหน่ายทางการ + งานแข่ง · Bandai worldwide simultaneous release 2026 · ทั้งสองหน้า guide-deep ได้ Article JSON-LD (datePublished/dateModified) + "อัปเดตล่าสุด" ที่มองเห็น
- [x] **R3-D trending เก็บ "น่าเก็บ/น่าลงทุน"** — H2 "การ์ดวันพีซใบไหนน่าเก็บตอนนี้ ดูยังไงจากข้อมูล" + 3 ย่อหน้าสอนอ่านตาราง + ลิงก์ most-expensive + disclaimer ไม่ใช่คำแนะนำการลงทุน
- [x] **R3-E rarities เลิก hardcode ราคา** — ช่วงราคา min/median/max ต่อ tier คำนวณจาก DB จริง (unstable_cache 1h) + ป้าย "จากข้อมูลจริง X ใบ" + วันที่ snapshot · TR/DON ไม่มีข้อมูล = บอกตรงๆ ไม่เดา · ตารางเทียบ parallel ใช้การ์ดใบเดียวกันจริง (หาคู่ SEC↔P อัตโนมัติ) ลิงก์เข้าหน้าการ์ด
- [x] **R3-F เก็บตก** — Honey จอแรก crawler/ไม่ล็อกอิน: explainer ขึ้นก่อน เหลือ loading เดียว (เลิกกล่องเทา 4 ก้อน + test SSR order) · รูปชุด: ราก = fallback เลือกการ์ดข้ามชุด (OP01-047_p2 โผล่บนกล่อง OP04 เพราะเรียง cardCode รวม) → เลือกการ์ดรหัสชุดตัวเองก่อน + onError fallback บน tile · EB01-001 เช็คแล้วโหลดได้ปกติ (อาการชั่วคราวตอน audit) · WebSite schema: +alternateName −SearchAction (Google เลิกใช้) · Breadcrumb JSON-LD ไทยตรง UI: หน้าการ์ด (เลิกยัดคีย์เวิร์ด) + search + market-overview · hero subtitle เลิกเคลม "Live" (EN/JP)
- [x] **R3-V ตรวจรับ** — tsc 0 · lint 0 · vitest 140 ไฟล์/776 ผ่าน (test ใหม่: honey-client SSR order · rarity-price-format · guide-authenticity/versions links) · build 209 หน้า · เปิดดูจริง :3001 มือถือ+desktop (guide hub การ์ดบทจอแรก · trending section ใหม่ · honey · versions KIDZ & KITZ + Article schema)

## 🔗 CTA link sweep — สองชั้นทั้งเว็บ (2026-08-07 — owner call จาก screenshot เบส)

- [x] **นโยบาย**: ลิงก์ในเนื้อความ/ท้าย FAQ = plain link (ซ่อนถูกแล้ว ห้ามแตะ) · ลิงก์ "ก้าวถัดไป" = 2 แกรมม่า canonical: `ArrowLink` (text ทอง + ลูกศร แบบ "เริ่มเลย" guide hub) กับ `RelatedPageCard` (การ์ดเดี่ยวแกรมม่า RelatedPages) — ลงทะเบียนใน AGENTS.md kit table แล้ว
- [x] **กวาดครบ 7 จุด**: set detail "ดูชุดทั้งหมด" (text-meta จม→ArrowLink) · CTA เครื่องคำนวณใต้ตาราง drop rate (text จิ๋ว→RelatedPageCard + เพิ่ม calculatorDesc TH/EN) · deck-calculator ตัดบล็อก "อ่านต่อ" ที่ซ้ำ RelatedPages ห่างกัน 200px (audit R1 minor) + เพิ่ม rarities ลงกริด · drop-calculator "อ่านต่อ" list เปล่า→RelatedPages (readNext copy เปลี่ยนเป็น title+description, ลบ field ตายของ deck) · trending ลิงก์ท้าย section น่าเก็บ→ArrowLink · search "ดูทั้งหมด"→ArrowLink · home set strip→ArrowLink (ChevronRight→ArrowRight เข้าท่าเดียว)
- [x] **verify**: tsc 0 · lint 0 · vitest 140/776 · build 209 หน้า · เปิดดูจริง :3001 (การ์ด CTA + arrow-link บนหน้า set)
- [x] **กวาด intro ทุกหน้า ตามกติกาเดียวกัน** (เบสสั่ง "ตรวจทุกหน้า" 2026-08-07) — สำรวจครบทุก surface ที่มี intro ใต้หัวข้อ: แก้ 3 จุดที่เข้าข่าย: **หน้าแรก** (3 ท่อน→1 ประโยค: ตัด methodology ที่บรรทัดวันที่+/about ถืออยู่ และตัด how-to ที่ตารางข้างล่างโชว์เอง — คง OPTCG+วันพีช) · **market-overview** (summary เล่าซ้ำแผง KPI ทุกตัวเลข→1 ประโยค เหลือเฉพาะชุดมูลค่าสูงสุดที่ไม่มี tile + ลบ delta ที่ไม่ใช้) · **compare** (ย่อหน้าเต็มเคย render เป็น <li>→<p> + จำกัดคอลัมน์ + breadcrumb JSON-LD ไทยตรง UI) · ผ่านแล้วไม่แตะ: sets index · trending · most-expensive · guide ทั้งหมด · search · pricing · tools อื่น · แก้ปมชุดแรก: intro หน้าชุดเต็มความกว้าง content (max-w-3xl ทำ "ดูชุดทั้งหมด" ลอยกลางหน้า + ประโยคตัดกลางคำ — ตอนนี้ชิดขอบกริดเป๊ะ วัดแล้ว 1356=1356px, 1 บรรทัด)
- [x] **หน้าชุด: intro เลิกเป็น data dump** (owner call จาก screenshot 2026-08-07) — ย่อหน้าเดิมอัด rarity breakdown + กล่อง/ซอง + ใบแพงสุด ซึ่ง**ตาเห็นบนหน้าอยู่แล้วทุกตัว** (hero โชว์ใบแพงสุด · กำแพงราคาคือ rarity breakdown · drop rate มีเรื่องกล่อง) → เหลือประโยคเดียว 129 ตัวอักษร (ชนิดชุด + วันวางขายถ้ามี + จำนวนใบ + อัปเดตทุกวัน + สะกดทั้งสอง) · หัว section ใช้ SectionHead + ArrowLink "ดูชุดทั้งหมด" เป็น action ขวา · ลบ rarityBreakdown ที่ตายแล้ว · test อัปเดตเป็นล็อกว่า "ห้ามทวนของที่หน้าโชว์" · verify: tsc/lint/test 776/build + วัด DOM จริง

## 🩸 SEO Round 1 — หยุดเลือด (2026-08-07 — จาก audit 12 ทีม · รายงาน: artifact "ตรวจ SEO ทั้งเว็บ Meecard")

> เป้า: ตัดแพทเทิร์นที่โดนหักคะแนนระดับโดเมนก่อน แล้วค่อยทำ Round 2 (og/วันที่/cannibalization) และ Round 3 (ความสวย guide hub)

- [x] **R1-A FAQ บ้านเดียวต่อเรื่อง** — methodology เหลือบ้านเดียวที่ `/about#methodology` (ติด id แล้ว) หน้าอื่น 1 ประโยค + ลิงก์ผ่าน prop `link` ของ FaqSection: home long-tail · sets index+รายชุด (ตัดข้อก๊อป 51 หน้า) · card (4→2 ข้อ ตัด Raw/PSA + parallel ตายตัวที่ก๊อป 3,838 หน้า) · search · market-overview (5→4 ข้อ, Raw/PSA → ลิงก์ /guide/rarities) · deck-calc · guide/buying · ยุบซ้ำ: home ตัด seoFaq2 (ทับ long-tail) · guide hub 9→6 (ตัด Q1 ทับ intro / Q2 ทับข้อเงิน / Q6 methodology + ย่อคำตอบแท้-ปลอมเหลือ 2 ประโยค+ลิงก์ authenticity) · pricing ตัด 2 ข้อเก่าที่ทับ buildPricingFaq · ลบ dict key ที่ตายแล้วทั้ง 3 ภาษา
- [x] **R1-B กวาด Marketplace ที่ปิด flag** — home (explore tile + seoFaq7) และ /sets (RelatedPages) ผูก `isMarketplaceEnabled()` แล้ว — flag เปิดโชว์/ปิดซ่อนอัตโนมัติ · คำเคลมใน seoFaq1A + guideHomeFaqA3 ตัดออกทั้ง 3 ภาษา (หมายเหตุ: dev DB flag เปิดอยู่ ลิงก์จึงโชว์ตอนทดสอบ — บน prod ที่ flag ปิดจะหายเอง)
- [x] **R1-C sitemap วันที่จริง** — เลิก `new Date()`: หน้าราคาใช้ scrapedAt ล่าสุดจริง (aggregate เดียว) · sets ใช้ updatedAt · หน้านิ่งใช้ `STATIC_CONTENT_UPDATED` (แก้มือเมื่อแก้ copy) · เอา cap 5000 + changeFrequency/priority ออก — การ์ดครบ 3,838 ใบ (verify แล้ว) · **จบที่ไฟล์เดียว ไม่ใช่ generateSitemaps**: Next ไม่สร้าง index ที่ /sitemap.xml ให้ (ลองแล้ว 404 + route ชนกับ metadata) และเรามีแค่ ~3.9k URL ห่างเพดาน 50k มาก — comment ไว้ในไฟล์แล้วว่าเมื่อไหร่ค่อยกลับมาแยก
- [x] **R1-D /blog กัน thin content** — `noindex, follow` แบบมีเงื่อนไข (index เมื่อโพสต์จริง ≥3, MIN_POSTS_TO_INDEX ใน blog/page.tsx) + เอาออกจาก sitemap (verify: meta robots ขึ้นจริง)
- [x] **R1-E trending เลิกซ้ำ + ใส่ฝั่งลง** — 3 section server = ลง 24 ชม. / ขึ้น 7 วัน / ขึ้น 30 วัน ใช้ losers24h ที่ query อยู่แล้ว (ไม่มี query ใหม่) + intro อัปเดตตาม · test ล็อกพฤติกรรมใหม่แล้ว

## 🎯 SEO Round 2 — คันโยกอันดับ (2026-08-07 — ทำต่อจาก Round 1 ในวันเดียวกัน)

- [x] **R2-A openGraph ต่อหน้า** — helper กลาง `buildPageMetadata` (src/lib/seo/page-metadata.ts: title/desc/canonical → og:url ตรง canonical + twitter) แล้วไล่ใช้ทั้งเว็บ: guide 9 หน้า (ogType article) · เครื่องมือ 4 หน้า · sets index+รายชุด (og:image = รูปกล่อง/ใบแพงสุด) · most-expensive + trending (og:image = การ์ด Top 1) · search · market-overview · pricing · about · contact · honey · raffle · blog — แชร์ LINE/FB ได้ preview ของหน้าตัวเองแล้ว (verify ด้วย curl ทุกกลุ่ม)
- [x] **R2-B วันที่อัปเดตมองเห็นได้** — "อัปเดตล่าสุด: {วันที่}" (text-meta) บน home (ใต้ H2 ตลาด) · most-expensive · trending (PageHeader children) จาก scrapedAt จริง · เคลม "เรียลไทม์" → "อัปเดตทุกวัน/คำนวณจากราคาล่าสุด" ครบ 3 key × 3 ภาษา
- [x] **R2-C เคลียร์ keyword ชนกัน** — /guide/sets → "ชุดการ์ดวันพีซมีกี่แบบ?" (เลิกชน /opcg/sets) · /decks noindex+หลุด sitemap+เปลี่ยน title (เลิกชน deck-calculator) · หน้ารอง (pricing/about/contact/honey/raffle) เขียน meta ตาม intent ตัวเอง เลิกนำด้วย "เช็คราคาการ์ดวันพีซ" และเลิกซ้ำแบรนด์กับ template
- [x] **R2-D title ≤60 / description ≤160 ทั้งเว็บ** — home 64→56 · trending 65→53 (+ตัดเคลม "ราคาเยน" ที่เลิกโชว์แล้ว) · guide ทั้ง 9 หน้า (สูงสุด 70→≤60, desc สูงสุด 210→≤160) · sets index 203→~150 + รายชุดใช้ clampDesc ไล่ตัด segment · การ์ดรายใบ 190-210→129-150 (วัด worst-case แล้ว) — ทุกตัววัดจริงด้วยสคริปต์
- [x] **R2-E หน้าการ์ด** — H1 accessible text = "ราคา {ชื่อ} {รหัส}" ผ่าน sr-only (visual เหมือนเดิม 100% + test ล็อก) · Product JSON-LD ใช้ตรรกะเดียวกับราคาบนหน้า: THB เสมอ ไม่มีเคส JPY/฿0 (+ json-ld.test.ts ใหม่) · เพิ่ม "OPTCG" บนหน้าแรก 2 จุด
- [x] **R2-V ตรวจรับ** — tsc 0 · lint 0 · vitest 136 ไฟล์/752 ผ่าน (test ใหม่ 2 ไฟล์: card-detail-identity, json-ld) · build 209 หน้า · ตรวจ HTML จริงจาก next start :3001: og:title/og:url ตรงหน้าตัวเองทุกกลุ่ม · วันที่ขึ้นจริง 3 หน้า · H1 การ์ด + THB + guide/sets H1 + decks noindex ตรงตามสเปกหมด

- [x] **R1-V ตรวจรับ** — tsc 0 · lint 0 · vitest 134 ไฟล์/742 ผ่านหมด (อัปเดต 2 test ที่ล็อก FAQ 4 ข้อเดิมให้ล็อกพฤติกรรมใหม่) · build 209 หน้า · ตรวจ HTML จริงจาก `next start` ที่ :3001 (พอร์ต 3000 โดน Bill Tracker ยึด): sitemap 3,914 URL ไม่มี blog · /blog noindex · trending มี "ราคาลงแรงสุด" ใน HTML และไม่ซ้ำตารางบน · FAQ set/card ไม่มีข้อ methodology ก๊อป + ลิงก์ /about#methodology ขึ้นจริง · guide hub เหลือ 6 ข้อ

## 🧭 UX/UI Refactor Master Plan (2026-07-04 — แผนคุมงาน UI ทั้งหมดต่อจากนี้)

> จาก audit ทั้งเว็บ (workflow 86 agents · 19 auditors + adversarial verify) ได้ 230 findings — **checklist รายข้อ + กติกา: [doc/uxui-refactor-plan.md](doc/uxui-refactor-plan.md)** · หลักฐานราย finding: [doc/uxui-audit-findings-2026-07-04.md](doc/uxui-audit-findings-2026-07-04.md) · ที่นี่ติ๊กระดับ phase เท่านั้น
> แผนนี้ดูดซับงานค้างเดิม: R1 empty-state → Phase 4 · แตก client ยักษ์ → Phase 2/5 · Declutter Batch 5–6 → Phase 5 (honey/desktop balance)

- [x] **Phase 0** แก้ของพัง/เสี่ยงจริง — **17/17 เสร็จ + verify (tsc0/lint0/test56/build✓ prerender static)** · `SETTINGS-03` แก้แล้ว (เบสอนุมัติ lib qrcode) · `SETS-05`/`CONTENT-03` ย้ายไป Phase 5 (query risk) · branch `fix/uxui-phase-0` รอ merge
- [ ] **Phase 1** ลบของตาย ~3,000+ บรรทัด / orphan 18+ ไฟล์ (⚠️ เบสอนุมัติรายการลบก่อน)
- [ ] **Phase 2** ประกาศ kit ทางการใน AGENTS.md + ยุบของซ้ำ (PriceTag เดียว · search engine เดียวจาก 3 ชุด · auth kit · Switch/QtyStepper/TabBar · AdminDataTable 8 หน้า)
- [ ] **Phase 3** token sweep (hairline เดียว · elevation adoption · radius มาตรฐาน · status 660 จุด · วินัยเขียว/แดง)
- [ ] **Phase 4** states (หน้า 404 · ศูนย์ spinner · loading.tsx ราย segment · empty ทุกจุดมี CTA)
- [ ] **Phase 5** mobile pass ราย surface — เบสเลือกลำดับหน้า (เริ่ม 5.0: tap ≥44px + a11y ที่ atom กลาง)
- [ ] **Phase 6** IA/naming polish (ชื่อ/ไอคอนปลายทางเดียว · palette ครบ destination)
- [ ] **Phase 7** commerce + admin เก็บกวาด (**ก่อนเปิด marketplace flag**)

### Card picker visual hierarchy polish — 2026-07-25

> ปรับ dialog “เลือกการ์ด” จากภาพใช้งานจริงให้ลำดับ `เกม → ชุด → ค้นหา/กรอง → เลือกการ์ด` อ่านต่อเนื่องขึ้น ลดพื้นที่โล่ง และทำรายการกดเลือกง่าย โดยคง launch-ready gate, multi-select, review/submit และ FilterModal เดิม

- [x] **CPV1 — Control hierarchy:** จัดเป็น filter workspace 2 ชั้นโดยไม่มีเลขขั้น: game context + set อยู่ด้านบน, search + filter อยู่ด้านล่าง; 1 เกม live เป็น read-only context และ 2+ เกมจึงใช้ Select จริง
- [x] **CPV2 — Result density:** เกม+ชุดอยู่แถวเดียวบน desktop/stack บน mobile, search+filter กระชับ, result ใช้ `ListRow` มี divider/whole-row selection และ Marketplace จอสั้นได้พื้นที่รายการเพิ่ม
- [x] **CPV3 — Regression coverage:** ล็อก no-number UI, game→set→search DOM order, launch-ready filtering, static/2-game Select branch, value forwarding, result anatomy และ `aria-pressed` selected state
- [x] **CPV4 — Verification:** focused 5 files / 20 tests + full 128 files / 698 tests + TypeScript + lint 0 errors + build 157 pages ผ่าน; Browser Watchlist/Portfolio/Marketplace ที่ 390×667, 390×844 และ 1280×720 ยืนยัน layout ไม่มีเลขขั้น, selection เดิมทำงาน และไม่มี horizontal overflow

### Card-detail shared portfolio acquisition form — 2026-07-25

> ให้ “เพิ่มเข้าพอร์ต” บนหน้ารายละเอียดการ์ดใช้ฟอร์มรายการซื้อ canonical ชุดเดียวกับ flow เพิ่มการ์ดในหน้าพอร์ต โดยคงขั้นเลือก/สร้างพอร์ต, idempotent batch mutation, required cost/date, zero-cost semantics และ feedback เดิม

- [x] **CPA1 — Shared form contract:** แยก `CardAcquisitionForm` + draft/validation/payload builder เป็นแกนเดียวสำหรับจำนวน · ต้นทุนต่อใบ · วันที่ได้มา · โน้ต โดย single-card กับ batch flow ใช้ component identity เดียวกัน
- [x] **CPA2 — Card-detail adoption:** ส่งข้อมูลการ์ดเต็มเข้า quick-add, วางตัวเลือกพอร์ตเหนือ shared form, นับเพดาน 999 แยกตาม condition และคง loading/error/create-portfolio/idempotency/success/close guards เดิม
- [x] **CPA3 — Regression coverage:** ล็อก shared form identity, note/zero-cost/date payload, existing NM quantity, multi-portfolio explicit selection, pending selection lock และ accessible success status; helper/form quick-add ชุดเก่าถูกถอดแล้ว
- [x] **CPA4 — Verification:** focused 3 files / 14 tests + TypeScript + lint 0 errors + full 128 files / 696 tests + production build 157 pages ผ่าน; Browser Card Detail และ Portfolio Add ที่ 390/768/1440px ยืนยันฟอร์มกลาง, interaction, no-overflow และ console error 0 โดยไม่กดบันทึกข้อมูลจริง

### Homepage mobile price hierarchy polish — 2026-07-25

> แก้ trailing metrics ในรายการตารางหน้าแรกบนมือถือจากภาพใช้งานจริง: ราคาและ % เปลี่ยนแปลงต้องอ่านเป็นคนละชั้น ไม่ไหลมาติดกัน โดยคงข้อมูล, sparkline, ความสูงแถว และ desktop table เดิม

- [x] **HMP1 — Explicit metric stack:** จัดราคาไว้บรรทัดบนและ % เปลี่ยนแปลงไว้บรรทัดล่างแบบชิดขวา โดยใช้ `PriceTag`/typography เดิมและไม่เพิ่มความกว้างแถว
- [x] **HMP2 — Regression coverage:** เพิ่ม focused test ล็อกโครงสองชั้น, sparkline adjacency, graded placeholder และยืนยันว่า price element ไม่กลับไปเป็น inline
- [x] **HMP3 — Verification:** focused 3 files / 4 tests + TypeScript + lint 0 errors + full 125 files / 676 tests + build 157 pages ผ่าน; Browser Raw ที่ 320/390px ยืนยัน stack 4px ชิดขวาและตัวแถวไม่ล้น, 640px สลับ desktop table ถูกต้อง, error overlay/console error 0; graded geometry ผ่าน static render test

### Site-wide display currency consistency — 2026-07-25

> ราคาที่เป็นข้อมูลเพื่อผู้ใช้ตัดสินใจต้องแสดงตามสกุลเงินใน `useUIStore`; คงสกุลเงินจริงไว้เฉพาะบริบทที่เป็นหลักฐานต้นทาง/ธุรกรรม/SEO เช่น source-native Yuyutei/SNKRDUNK, invoice และ JSON-LD

- [x] **CUR1 — Reproduce + inventory:** เพิ่ม failing regression จาก dialog แจ้งเตือนที่ช่องกรอกเป็น THB แต่ราคาตลาดยังเป็น JPY และ audit จุดฟอร์แมตราคาฝั่งผู้ใช้ทั้งเว็บ
- [x] **CUR2 — Shared display contract:** ให้ alert create/edit/preview และ user-facing price surfaces ใช้ formatter กลางตาม currency preference โดยไม่แปลงข้อมูลที่ส่ง API หรือสกุลเงินจริงของธุรกรรม
- [x] **CUR3 — Whole-site guard:** เพิ่ม regression/static contract กันการเรียก native-only formatter หรือ hardcode สัญลักษณ์เงินใน price surfaces ที่ต้องตาม preference
- [x] **CUR4 — Verification:** focused/full tests + TypeScript/lint/build + Browser THB/JPY/USD ที่ alert และ representative public/private routes พร้อมตรวจ no-overflow/console

### Market overview decision-first redesign — 2026-07-24

> ปรับ `/opcg/market-overview` ให้ผู้ใช้ตอบได้เร็วว่า “ตลาดมีมูลค่าเท่าไร · กำลังขึ้นหรือลง · อะไรเป็นตัวนำตลาด” โดยรักษาข้อมูล Raw/7-day contract เดิม ใช้ component kit กลาง และแก้ mobile overlap ที่รายการเซ็ตโดยไม่แตะ query/schema

- [x] **MOR1 — Runtime + contract audit:** เปิดดูจริงที่ 390/1440px, trace server/client/data contract และยืนยันปัญหา hierarchy, density และชื่อเซ็ตทับมูลค่าบนมือถือ
- [x] **MOR2 — Snapshot hierarchy:** ใช้ subtitle ที่มีอยู่, จัด market value/breadth/secondary stats ให้สแกนง่ายและไม่ตัด label บนมือถือ
- [x] **MOR3 — Ranked content:** ทำหัว section ให้เป็นภาษากลางเดียวกัน, ปรับ top cards/rarity/top sets แบบ mobile-first และแก้ชื่อ/ราคา/จำนวนไม่ให้ทับกัน
- [x] **MOR4 — State parity + verification:** ปรับ loading/tests แล้วตรวจ focused/full test, TypeScript, lint, build และ Browser 320/390/640/768/1440px Light/Dark + focus/interaction/no-overflow/console

### Portfolio share flex card — 2026-07-24

> Refactor หน้าต่างแชร์พอร์ตและภาพ export ให้เป็นผลงานที่อยากโพสต์จริง: จุดเด่นต้องเป็นมูลค่าพอร์ต + ผลตอบแทน + ภาพการ์ด, รักษาแบรนด์ espresso+honey, ใช้ข้อมูลจริงเท่านั้น และคง download/copy/native-share flow เดิม

- [x] **PSF1 — Audit + visual contract:** ตรวจ component/diff/runtime ปัจจุบัน, ล็อกข้อมูลและ interaction ที่ต้องรักษา และออกแบบ hierarchy ใหม่โดยไม่ใช้ gradient/blur
- [x] **PSF2 — Share artwork:** จัดองค์ประกอบภาพ export ใหม่ให้เต็มพื้นที่, มี identity/hero metric/collection showcase/brand footer ชัด และมี fallback รูปที่ซื่อสัตย์
- [x] **PSF3 — Responsive dialog:** ทำ preview/action hierarchy ให้เหมาะกับมือถือและเดสก์ท็อป, touch target/keyboard/focus/สถานะกำลังสร้างรูปครบ
- [x] **PSF4 — Verification:** regression 9 cases + focused/full test + TypeScript + lint + Browser 390/768/1440px + PNG download/no-overflow ผ่านแล้ว; production build ผ่านหลังยุบ `DeltaPill` ในงาน Market Overview และอนุญาต network สำหรับ Google Fonts
- [x] **PSF5 — Finance-share contract:** เทียบ pattern จากผลิตภัณฑ์พอร์ตหุ้นปัจจุบัน แล้วล็อก preset, disclosure/privacy และ hierarchy ที่เหมาะกับพอร์ตการ์ด
- [x] **PSF6 — Preset + section controls:** เพิ่ม preset เลือกเร็วและสวิตช์เปิด/ปิดผลตอบแทน, ต้นทุน, สัดส่วนพอร์ต, การ์ดเด่น, ราคาการ์ด, จำนวน และวันที่ โดยใช้ component kit กลาง
- [x] **PSF7 — Adaptive artwork:** เพิ่ม portfolio-mix/contribution visual และทำทุก combination reflow เต็ม canvas โดยไม่เหลือช่องว่างหรือสร้างข้อมูลปลอม
- [x] **PSF8 — Customization verification:** เพิ่ม regression coverage แล้วตรวจ TypeScript/lint/test/build + Browser 390/768/1440px + preset/toggle/keyboard/no-overflow และเปิด PNG จริงทุก narrative หลัก

### Advertising hard reset + two-format replan — 2026-07-24

> Owner สั่งถอด Google Ads mockup/พื้นที่โฆษณาปัจจุบันออกจากทุกหน้าก่อน แล้วค่อยกลับมาทำระบบใหม่ 2 แบบ: (1) Google Ads เป็น mockup เท่านั้น ไม่เชื่อม network และ (2) พื้นที่โฆษณาที่ลูกค้าติดต่อ MeeCard โดยตรง; รอบ reset ห้ามเหลือ slot, skeleton, consent state หรือช่องว่างใน runtime

- [x] **AHR1 — Whole-site removal:** ถอด caller/component/registry/test/consent state และข้อความเฉพาะระบบโฆษณาเดิม โดยรักษา `featAdFree` ซึ่งยังเป็นสิทธิ์แพ็กเกจใน product contract
- [x] **AHR2 — Placement architecture plan:** ทำแผนราย route/section แยก Google mockup กับ direct-sold inventory, ระบุ mobile/desktop geometry, density, priority, CTA และเส้นทางที่งดโฆษณา
- [x] **AHR3 — Clean-runtime verification:** ยืนยันด้วย static scan + tests + TypeScript/lint/build + Browser ว่าไม่มี ad DOM, Google ad script/request หรือ reserved blank space เหลือ
- [x] **AHR4 — Rebuild P0 (owner อนุมัติ 2026-07-24):** implementation ใช้ component/registry กลางและแยก provider สองแบบชัดเจน
  - [x] **AHR4.1 — Central inventory kit:** สร้าง `AdInventorySlot`, registry, Google mock renderer และ Direct Sponsor renderer โดยไม่มี Google network/script และมี tier/route/content-state gates กลาง
  - [x] **AHR4.2 — P0 placements:** วาง Home, Search, Set Detail และ Card Detail ตาม matrix ที่อนุมัติ พร้อม mobile/desktop geometry และ inactive-state collapse
  - [x] **AHR4.3 — Regression coverage:** ล็อก provider separation, route/zone contract, paid `adFree`, loading/empty behavior, i18n และ no-network markers
  - [x] **AHR4.4 — Full verification:** TypeScript/lint/test/build + Browser 390/768/1440px ตรวจ Light/Dark, semantic CTA, no-overflow, no overlay และไม่มี Google Ads asset/request ผ่าน
- [x] **AHR5 — Single-slot sponsor override correction (owner feedback 2026-07-24):** implementation + automated gates เสร็จ; Browser Home/Search/Set/Card ผ่านครบ 390/768/1280px
  - [x] **AHR5.1 — Provider-neutral inventory:** เปลี่ยน zone ID/registry เป็นชื่อตามตำแหน่ง, เพิ่ม strategy `GOOGLE_ONLY` / `DIRECT_THEN_GOOGLE` และลด hero billboard เป็น leaderboard ที่ไม่แย่งข้อมูลหลัก
  - [x] **AHR5.2 — Active-only Direct:** ลบ `AVAILABLE`/public contact state และข้อความสามภาษา; Direct registry ว่างเป็นค่าเริ่มต้น และ render ได้เฉพาะแคมเปญ `ACTIVE`
  - [x] **AHR5.3 — Regression coverage:** ล็อก Google fallback, active Direct override, provider exclusivity, no-network mock และห้ามมีข้อความเปิดขายพื้นที่ใน runtime
  - [x] **AHR5.4 — Verification:** focused/full tests + TypeScript/lint/build + Browser Home/Search/Set/Card ผ่านครบ 390/768/1280px แบบ visual
  - [x] **AHR5.5 — Card marketplace adjacency (owner feedback):** rename `card-detail-after-sales` → `card-detail-marketplace-rail` และย้ายออกจากประวัติซื้อขายไปเป็นคอลัมน์ขวาคู่กับ “ขายอยู่บน Meecard” บน desktop / stack ต่อใต้ marketplace บน mobile; grid ยุบเต็มความกว้างเมื่อ ad ถูกซ่อนและจำนวน slot เท่าเดิม
- [x] **AHR6 — Visibility-first creative + contextual rows (owner feedback 2026-07-24):** เปลี่ยน mock จากกรอบโล่งเป็นภาพ creative จริงจำลอง, ตัด tail slot ที่มองเห็นต่ำ และวางโฆษณาแนวนอนเฉพาะจังหวะที่อ่านต่อเนื่อง
  - [x] **AHR6.1 — Visual Google mock:** สร้างภาพสินค้า TCG สมมติแบบไม่มีแบรนด์/ตัวละครจริง, เก็บ asset ในโปรเจกต์ และ render copy/CTA แบบ local-only ที่ปรับได้ทั้ง leaderboard/rectangle
  - [x] **AHR6.2 — No-tail inventory:** ถอด Search/Set/Card tail slots และ Search above-table slot; ย้าย Home tail เข้า table row โดยไม่มีช่องว่างเมื่อ adFree
  - [x] **AHR6.3 — Minimal market tables:** Home/Search ใช้ canonical `MarketTable` แบบ canvas เหมือนกัน และแทรก leaderboard เป็น row หลังรายการที่ 8 ทั้ง desktop/mobile/grid
  - [x] **AHR6.4 — Set heading boundary:** เปลี่ยนโฆษณากลาง Set เป็น leaderboard และวางก่อนหัวข้อ rarity ถัดไปเท่านั้น ไม่คั่นกลาง card grid
  - [x] **AHR6.5 — Verification:** 119 test files / 644 tests + TypeScript/lint/build ผ่าน; Browser Home/Search/Set/Card ที่ 390/768/1280px ผ่าน no-tail, row placement, Minimal table, no-overflow และไม่มี Google Ads network
- [x] **AHR7 — Upper ads → global bottom anchor (owner feedback 2026-07-25):** คง contextual slots เดิม แต่ถอดโฆษณาช่วงบน 3 จุด แล้วแทนด้วย Google mock แนวนอนลอยล่างจอพร้อมปุ่มปิด
  - [x] **AHR7.1 — Global anchor contract:** เพิ่ม zone กลางแบบ `DIRECT_THEN_GOOGLE`, mount ครั้งเดียวใน global chrome และคง denylist/`adFree`/fail-closed contract
  - [x] **AHR7.2 — Upper-only removal:** ถอด `home-after-hero`, `set-detail-after-hero`, `card-detail-chart-rail`; คง Home/Search row, Set before-rarity และ Card marketplace rail
  - [x] **AHR7.3 — Dismiss + responsive safety:** ปุ่มปิดแตะได้ ≥44px, จำการปิดใน session, อยู่เหนือ BottomNav บนมือถือ และไม่ชน floating controls/เนื้อหา
  - [x] **AHR7.4 — Verification:** 128 test files / 693 tests + TypeScript/lint/build ผ่าน; Browser Home/Search/Set/Card ที่ 390/768/1280px ยืนยัน contextual placement เดิมยังอยู่, upper หาย, loading/empty/error/not-found ไม่มี anchor, dismiss ข้าม route/reload ได้, no-overflow และไม่มี Google network

- [x] **AHR8 — Restore Card chart rail (owner correction 2026-07-25):** คงการถอดโฆษณาหลัง hero/header ของหน้าอื่น แต่คืน rectangle ข้างกราฟใน Card Detail
  - [x] **AHR8.1 — Registry/provider contract:** คืน `card-detail-chart-rail` เป็น `DIRECT_THEN_GOOGLE`; Google mock เป็นค่าเริ่มต้นและ Direct `ACTIVE` แทนช่องเดิม 1:1
  - [x] **AHR8.2 — Responsive adjacency:** desktop วางข้างกราฟ; mobile stack ต่อใต้กราฟ; เมื่อ slot ถูกซ่อนกราฟต้องกลับมาเต็มความกว้างโดยไม่เหลือช่องว่าง
  - [x] **AHR8.3 — Verification:** 128 files / 696 tests + TypeScript/lint/build ผ่าน; Browser 390/768/1280px ยืนยัน chart rail, marketplace rail และ bottom anchor อยู่ครบ โดย Home/Set upper ads ยังไม่กลับมา

### Package-limit clarity + ad placement reset — 2026-07-24

> ทำให้ทุกจุดอัปเกรดบอกตัวเลขลิมิตปัจจุบันเทียบแพ็กเกจถัดไปจาก source เดียว และย้ายโฆษณาออกจากข้อมูลตัดสินใจไปอยู่ท้ายเนื้อหาสาธารณะ โดยรองรับพื้นที่ Google Ads/โฆษณาของเว็บทั้งมือถือและเดสก์ท็อป
> **Historical:** งาน quota ยังใช้อยู่ แต่ implementation โฆษณาของ PLA3–PLA5 ถูก supersede โดย AHR hard reset

- [x] **PLA1 — Whole-site audit:** ตรวจ surface ที่เปิด Upgrade Dialog, quota/usage UI, live AdSlot caller และเส้นทาง public/private/transactional พร้อม Browser หลักฐาน mobile + desktop
- [x] **PLA2 — Limit delta contract:** ผูก feature ที่มีโควตากับ `TIER_LIMITS`, เลือกแพ็กเกจถัดไปตาม tier ปัจจุบัน และแสดง “ปัจจุบัน → หลังอัปเกรด” ใน Upgrade Dialog โดยไม่ hardcode ซ้ำตามหน้า
- [x] **PLA3 — Ad placement governance:** ถอด placement/caller เดิมทั้งหมด, ใช้ allowlist + denylist + responsive size registry กลาง และให้ paid tier คืน `null` โดยไม่เหลือช่องว่าง
- [x] **PLA4 — New responsive placements:** วาง slot ใหม่เฉพาะ section boundary/tail ของหน้าสาธารณะ; ห้ามแทรก chart/ราคา/ตาราง/ขั้นตอนทำงาน/ข้อมูลส่วนตัว และมี first-party house ad เมื่อ Google Ads ยังไม่พร้อม
- [x] **PLA5 — Verification:** regression tests สำหรับ tier delta/route governance + i18n parity + TypeScript/lint/test/build + Browser mobile/desktop ทั้ง Upgrade Dialog และตำแหน่งโฆษณาใหม่

### Quota visibility + Google Ads mockup correction — 2026-07-24

> ทำให้ผู้ใช้เห็น “ใช้ไปเท่าไร / ลิมิตเท่าไร / ต้องอัปเกรดเป็นอะไร” ก่อนชนกำแพงในทุกระบบที่หน้า Pricing ระบุโควตา และให้ตำแหน่ง Google Ads เป็นเพียงกรอบ mockup ที่ไม่โหลด network/script จริง
> **Historical:** งาน quota ยังใช้อยู่ แต่ Google mockup ของ QVA4–QVA5 ถูกถอนตาม AHR

- [x] **QVA1 — Pricing-to-product audit:** ไล่ entitlement/limit ทุกแถวจาก `/pricing` ไปยังหน้าและ API ที่ใช้จริง พร้อมระบุจุดที่ขาด usage/limit/upgrade context
- [x] **QVA2 — Shared quota UI:** ใช้/ต่อยอด component กลางให้แสดง current/max, progress, tier และ CTA อัปเกรดจาก source เดียว โดยรองรับมือถือและเดสก์ท็อป
- [x] **QVA3 — Product surfaces:** เติม quota visibility ให้ Watchlist, Portfolio, Decks, Alerts และ surface อื่นที่มีโควตาตาม Pricing โดยไม่เพิ่มกล่องซ้ำซ้อน
- [x] **QVA4 — Ad mockup only:** เปลี่ยน network-first placement ให้เป็นกรอบ Google Ads mockup ระบุขนาด/ตำแหน่งชัด และยืนยันว่าไม่มี Google script/request/consent flow
- [x] **QVA5 — Verification:** เพิ่ม regression tests, ตรวจ i18n, TypeScript/lint/test/build และเปิด Browser ทดสอบ mobile/desktop ในหน้าหลักที่แก้

### Quota tone + ad density rebalance — 2026-07-24

> ลด quota จาก panel เชิงขายให้เป็นสถานะประกอบที่เบาและสุภาพ โดยยังเห็น current/max ชัด ส่วน Google Ads mockup เพิ่มเฉพาะรอยต่อเนื้อหาสาธารณะที่อ่านจบเป็นช่วง ๆ และคุมความถี่ไม่ให้กลายเป็นความรกแบบใหม่
> **Historical:** quiet quota ยังใช้อยู่ แต่ placement/density ของ QAD3–QAD4 ถูก supersede โดยแผนโฆษณาใหม่

- [x] **QAD1 — Visual pressure audit:** เปิดดู quota/ad ปัจจุบันทั้งมือถือและเดสก์ท็อป พร้อม trace component/caller เพื่อแยกว่าอะไรเด่นเกินและหน้าใดมีพื้นที่โฆษณาน้อยจริง
- [x] **QAD2 — Quiet quota treatment:** ยุบ quota meter ให้กะทัดรัด สีเป็นกลาง ไม่มี CTA เชิงขายเมื่อ usage ปกติ; แสดง upgrade affordance เฉพาะใกล้เต็ม/เต็ม โดยรักษา a11y และแพ็กเกจถัดไปจาก source กลาง
- [x] **QAD3 — Responsible ad expansion:** เพิ่ม Google Ads mockup ตาม section boundary ของหน้าสาธารณะแบบ long-form/list โดยใช้ zone registry เดิม, จำกัด density ต่อหน้า และไม่แทรกข้อมูลตัดสินใจ/ฟอร์ม/private flow
- [x] **QAD4 — Verification:** เพิ่ม/แก้ regression tests, i18n parity, TypeScript/lint/test/build และ Browser visual mobile/desktop ตรวจ no-overflow + จังหวะเนื้อหา

### Contextual quota placement polish — 2026-07-24

> ถอดตัวเลขลิมิตออกจาก navigation และ quota row กลางหน้า แล้ววาง current/max ไว้กับบริบทที่เกี่ยวข้องโดยตรง: Watchlist เป็น metadata ใต้ชื่อหน้า, จำนวนพอร์ตอยู่กับตัวสลับพอร์ต และลิมิตการ์ดอยู่กับรายการการ์ด

- [x] **CQP1 — Placement audit:** เทียบ runtime mobile/desktop และ trace state/caller เพื่อเลือกตำแหน่งที่ไม่ซ้ำ navigation หรือสร้าง panel ใหม่
- [x] **CQP2 — Watchlist relocation:** คืนแท็บเป็นชื่ออย่างเดียว ย้าย current/max ไปเป็น metadata ใต้ชื่อหน้าตามแท็บที่เปิด และใช้ warning เฉพาะตัวเลขเมื่อใกล้เต็ม/เต็ม
- [x] **CQP3 — Portfolio relocation:** ลบ quota row; ผูกจำนวนพอร์ตกับ switcher/sidebar และผูก card-entry quota กับ holdings toolbar; พอร์ตว่างไม่แสดง usage ปกติและ Insights ไม่เห็น card quota
- [x] **CQP4 — Verification:** regression tests + React review + TypeScript/lint/test/build ผ่าน และ Browser production/cold-dev ที่ 390/1440px ยืนยัน hierarchy, no-overflow และ console ไม่มี error

### Portfolio holdings summary dedupe — 2026-07-24

> ยุบจำนวนรายการซื้อ/จำนวนใบ/card-entry quota ให้เป็น summary เดียว เพื่อไม่ให้ผู้ใช้เห็นข้อมูลนับซ้ำสองบรรทัดในหัว holdings

- [x] **PHD1 — One summary:** ยุบเป็น `1 รายการซื้อ · รวม 1 ใบ · ใช้ไป 1/30` กลุ่มเดียว โดยไม่แยกหัว `รายการซื้อ` ซ้ำ
- [x] **PHD2 — Verification:** sync TH/EN/JP + regression test + TypeScript/lint/build และ Browser 390/1440px ตรวจ wrap/no-overflow/console

### Contextual quota hierarchy polish — 2026-07-24

> แยก “จำนวนข้อมูลในหน้าปัจจุบัน” ออกจาก “โควตาบัญชี” ให้เห็นเป็นคนละชั้น: Watchlist ใช้ ratio badge ที่หัวหน้าตามแท็บ ส่วน Portfolio ใช้ summary แบบไม่พูดจำนวนซ้ำและวาง quota เป็นสถานะรองแยกกลุ่ม

- [x] **QHP1 — Watchlist header:** เปลี่ยน H1 ตามแท็บ (`รายการโปรด` / `แจ้งเตือนราคา`), ย้าย current/max เป็น neutral `LimitCounter` badge ข้างหัว และลบบรรทัด quota ใต้ H1 โดยแท็บยังเป็นข้อความอย่างเดียว
- [x] **QHP2 — Portfolio toolbar:** ถ้า purchase count เท่ากับจำนวนใบให้แสดงเฉพาะจำนวนรายการซื้อ; ถ้าต่างกันจึงแสดงยอดรวมใบ และแยก `ใช้ไป` + ratio badge ออกจาก summary
- [x] **QHP3 — Canon + verification:** เพิ่ม accessible label/data-state ให้ badge กลาง, ปรับ regression tests และตรวจ React/TypeScript/lint/test/build + responsive no-overflow/console

### Portfolio Insights sparse-data polish — 2026-07-24

> ลด KPI ที่ให้บริบทซ้ำกันและไม่สร้าง “กราฟปลอม” จากข้อมูลวันเดียว: ผู้ใช้ต้องอ่านได้ทันทีว่า `0` คือได้มาฟรี ไม่ใช่ข้อมูลหาย และเห็นกราฟเฉพาะเมื่อมีประวัติต่างวันพอให้ลากเส้นจริง

- [x] **PIS1 — KPI hierarchy:** ยุบ Cost coverage เข้า Average cost, แสดงต้นทุนศูนย์เป็นสถานะ `ฟรี`, และลด count summary ที่จำนวนแบบเท่ากับจำนวนใบ
- [x] **PIS2 — Honest history:** ซ่อน History ทั้ง section เมื่อมีข้อมูลประวัติน้อยกว่า 2 วันหรือกำลังดู game scope ที่ไม่มี persisted history
- [x] **PIS3 — Parity + verification:** ปรับ preview/skeleton/tests/i18n ให้ตรงกัน แล้วตรวจ React/TypeScript/lint/test/build + responsive contract + cold Browser no-overflow/console

### Drop calculator guided selection flow — 2026-07-24

> ลดภาระบนหน้าเดียวให้ผู้ใช้เลือกชุด/กรอง/เลือกการ์ดก่อน แล้วค่อยกดคำนวณเพื่อดูผล โดยคงค่าที่เลือกไว้และใช้ filter surface กลางของเว็บ

- [x] **DCF1 — Selection workspace:** ย้ายตัวเลือกชุดมาอยู่กับ search/filter ฝั่งเนื้อหา, ถอด set action จาก page header และทำ card grid มือถือให้กะทัดรัดขึ้น
- [x] **DCF2 — Selected preview tray:** แสดงแถบพรีวิวการ์ดที่เลือกแบบลอยเหนือ mobile bottom-nav พร้อมลบรายใบ/ล้างทั้งหมดและ CTA คำนวณ
- [x] **DCF3 — Guided results:** ถอดแท็บเลือกการ์ด/ผลลัพธ์, ให้ CTA พาเข้าสถานะผลลัพธ์และกลับมาแก้รายการได้โดยไม่เสีย selection
- [x] **DCF4 — Canon + verification:** คง `FilterModal`/`SetPicker`/`Button` กลาง, ทำ facet option ให้ตรงหน้าค้นหา, sync TH/EN/JP และ verify test/lint/type/build + Browser desktop/mobile
- [x] **DCF5 — Set-page density:** จัด desktop เป็น sidebar ซ้าย + card wall ขวา, ใช้ grid 3/4/5/6 และ anatomy แบบ image-forward เท่าหน้าชุดการ์ด
- [x] **DCF6 — Compact selection dock:** ยุบ selected tray เป็น dock แถวเดียว, ลด CTA/thumbnail chrome และกันพื้นที่เหนือ mobile bottom-nav
- [x] **DCF7 — Visual recheck:** เทียบขนาดจริงกับหน้าชุดที่ desktop, ตรวจ mobile 390px, interaction, console, focused/full verification
- [x] **DCF8 — Remove set gate:** ลบหน้า empty-state เลือกชุด, auto-start ด้วยชุดล่าสุดจาก API และคง fallback แบบ compact เฉพาะกรณีไม่มีข้อมูลชุด
- [x] **DCF9 — Three-step wizard:** เพิ่ม progress ด้านบน `เลือกชุด → เลือกการ์ด → ผลลัพธ์` พร้อม completed/current/future state ที่ responsive และ accessible
- [x] **DCF10 — Loading + verification:** ปรับ route loading ให้เป็น wizard + card workspace จริง แล้ว verify initial load/step transition/desktop/mobile + full checks
- [x] **DCF11 — Focused tool header:** ตัด visual breadcrumb ที่ซ้ำ, ยุบ PageHeader/คำอธิบายบนมือถือ และรวม header + progress เป็นโซนเดียวแบบไม่มี panel ซ้อน
- [x] **DCF12 — Quiet wizard + result focus:** ลด wizard เป็น progress rail กะทัดรัด, ตัดหัวผลลัพธ์ซ้ำ/ปุ่มย้อนเต็มแถว และย้ายโอกาสรวมขึ้นเป็นข้อมูลแรกของ result panel
- [x] **DCF13 — Loading + visual verification:** sync loading/test กับ hierarchy ใหม่ แล้ว verify selection/results ที่ desktop/mobile, no overflow, interaction และ full checks
- [x] **DCF14 — Header breathing rhythm:** เพิ่มระยะจาก site header และแก้ `mb-0` ที่หักล้างช่องว่างชื่อหน้า→wizard; sync loading แล้ววัด desktop/mobile production preview

### Portfolio add feedback + acquisition lots — 2026-07-23

> แก้ flow เพิ่มการ์ดให้ผู้ใช้เห็นทุกสถานะ และทำให้แต่ละรายการสื่อชัดว่าบันทึกต้นทุน/รายละเอียดได้ ส่วนการแยกการ์ดซ้ำเป็นคนละล็อตต้องผ่าน schema/migration gate ก่อน เพราะกระทบต้นทุน โควตา และข้อมูลเดิม

- [x] **PAL1 — Picker feedback:** initial/search loading, error + retry และสถานะกำลังบันทึกต้องมองเห็นและเข้าถึงได้
- [x] **PAL2 — Save affordance:** บันทึกสำเร็จมี feedback ชัด และแต่ละรายการมี action แบบข้อความให้รู้ว่าบันทึกต้นทุน/รายละเอียดได้
- [x] **PAL3 — Acquisition-lot contract (✅ เบสอนุมัติ schema/migration 2026-07-23):** คง `PortfolioItem` เป็น holding หลักต่อ card+condition เพื่อรักษา quota/count/public contract และเพิ่ม `PortfolioLot` เป็นรายการซื้อย่อย (qty/unit cost/date/note); backfill ของเดิมเป็น opening balance 1 ล็อตโดยไม่แต่งประวัติ และให้ known/unknown cost คงความหมายเดิม — deploy migration พร้อม security hardening และทดสอบ Browser mutation จริงผ่านแล้ว
  - [x] **PAL3.1 — Additive schema:** เพิ่ม `PortfolioLot` + source enum, relation/index และ migration ที่ backfill 1 opening-balance lot ต่อ holding โดยยังเก็บ field aggregate เดิมไว้ช่วง rollout
  - [x] **PAL3.2 — One mutation path:** ให้ single/batch add สร้าง lot ใหม่, quota นับ parent holding และ lot edit/delete ทำงานใน transaction เดียวพร้อม aggregate compatibility
  - [x] **PAL3.3 — Honest financial reads:** อ่านผลรวมต้นทุนจริงจาก lots, แยก known/unknown/zero cost และไม่คำนวณ P&L เมื่อ coverage ไม่ครบ
  - [x] **PAL3.4 — Holding contract + flat owner UX:** backend ยังรวม holding เพื่อ quota/share/Insights แต่ Owner Overview แสดงหนึ่งแถวต่อรายการซื้อและแก้ไขรายการนั้นโดยตรงทั้ง desktop/mobile
  - [x] **PAL3.5 — Downstream safety:** quota/profile/share/snapshot/export/dashboard/achievement ยังรักษาความหมาย parent holding และไม่เปิดเผยข้อมูล lot/cost ใน public surface
- [x] **PAL3.6 — Verification:** migration dry-run/postflight + service/API/UI regressions + TypeScript/lint/test/build ผ่าน; Browser เพิ่มรายการซื้อได้ `201`, ลบได้ `200`, console ไม่มี error และคืนข้อมูลทดสอบให้จำนวนเดิมแล้ว
- [x] **PAL4 — Verification:** regression tests + i18n parity + TypeScript/lint/test/build + Browser flow เปิด/เลือกการ์ดและแก้ไขรายการโดยไม่เขียนข้อมูลทดสอบจริง
- [x] **PAL5 — Required acquisition facts:** รายการซื้อใหม่ทุกทางต้องมีวันที่ได้มาและต้นทุนต่อใบ โดยต้นทุน `0` = ได้มาฟรี; ข้อมูลเก่าที่ไม่ทราบยังคง `null` และห้ามเดาย้อนหลัง
- [x] **PAL6 — Consistent create UX:** ตั้งวันที่วันนี้ให้อัตโนมัติแต่แก้ได้ และใช้กติกาเดียวกันในเพิ่มการ์ดแบบหลายใบ, เพิ่มจากหน้าการ์ด และเพิ่มรายการซื้อใต้การ์ดเดิม พร้อมข้อความบอกว่าต้นทุนเป็นช่องบังคับ
- [x] **PAL7 — Server enforcement + verification:** POST สร้าง item/batch/lot ปฏิเสธวันที่หรือต้นทุนที่ขาดผ่าน Zod source เดียว; regression ครอบ local date/zero cost/missing fields/submit payload ทั้ง 3 ทาง และ TypeScript/lint/test/build + Browser flow จริงผ่าน

### Portfolio per-card acquisition details — 2026-07-24

> เมื่อเลือกเพิ่มหลายการ์ด วันที่ได้มาและโน้ตต้องเป็นของแต่ละใบจริง เพราะผู้ใช้อาจได้การ์ดคนละวันและมีบริบทต่างกัน; วันที่เริ่มต้นเป็นวันนี้ทุกใบ ส่วนโน้ตเป็น optional disclosure เพื่อไม่ให้ฟอร์มยาวเกินจำเป็น

- [x] **PAD1 — Per-card draft contract:** ย้ายวันที่ได้มาและโน้ตเข้า draft รายการ์ด โดยคงวันที่วันนี้เป็นค่าเริ่มต้นครั้งเดียวต่อการเปิด dialog และคง API/schema เดิมที่รองรับ per-item อยู่แล้ว
- [x] **PAD2 — Compact per-card UI:** แสดงวันที่บังคับกรอกใน Surface ของแต่ละใบ และใช้ disclosure “เพิ่มโน้ต” ตาม pattern เดิมของ repo; ถอดกล่องวันที่/โน้ตรวมด้านล่าง
- [x] **PAD3 — Regression coverage:** ล็อก multi-card payload ที่วันที่/โน้ตต่างกัน, missing-date rejection, note trim/null, unique field IDs และ submit จริงผ่าน dialog
- [x] **PAD4 — Verification:** React review + i18n parity + TypeScript/lint/test/build + Browser desktop/mobile ตรวจ isolation, no-overflow และ console

### Portfolio clarity pass — 2026-07-23

> ลดภาระความเข้าใจของผู้ใช้ใหม่โดยไม่เปลี่ยน visual direction: แยก “แบบการ์ด/จำนวนใบ/รายการซื้อ” ให้ชัด, ให้เพิ่มการ์ดพร้อมบันทึกรายละเอียดการซื้อได้ใน flow เดียว และให้ตัวเลขทุกคอลัมน์บอกหน่วยตรงกัน

- [x] **PCL1 — Count language:** ใช้คำเรียกแบบการ์ดและจำนวนใบให้ตรงกันทั้ง Overview/Insights/empty/loading/i18n
- [x] **PCL2 — Guided acquisition flow:** หลังเลือกการ์ดให้กรอกจำนวน ต้นทุนต่อใบ วันที่ และโน้ตก่อนบันทึก; การ์ดที่มีอยู่แล้วต้องสื่อว่าเป็น “รายการซื้อใหม่”
- [x] **PCL3 — Comparable numbers:** ระบุราคาตลาดต่อใบให้ชัด และถอด KPI/กราฟว่างที่ซ้ำหรือดูเหมือนเสียโดยยังรักษาข้อมูลจริง
- [x] **PCL4 — Verification:** regression tests + React review + TypeScript/lint/test/build + Browser flow การ์ดใหม่/การ์ดเดิมและ Insights จริง
- [x] **PCL5 — Acquisition field alignment:** จัดช่องจำนวนและต้นทุนต่อใบให้เริ่มเส้นเดียวกันตั้งแต่ `sm`, ใช้ control สูง 40px เท่ากัน และคง mobile stack เดิม; มี regression test + Browser Light/Dark geometry check

### Portfolio flat purchase rows — 2026-07-23

> เปลี่ยน Overview จากหนึ่งแถวต่อ holding ที่ซ่อนรายการซื้อไว้ข้างใน เป็นหนึ่งแถวต่อรายการซื้อ เพื่อให้ต้นทุน วันที่ จำนวน และกำไรของแต่ละรายการอ่านได้ทันที โดยยังคง holding เป็น contract ภายในสำหรับ quota/public data

- [x] **PFR1 — Flat row model:** แปลง owner-only holdings/lots เป็นแถวรายการซื้อแบบ derived data โดยรักษา known/unknown/zero-cost และ quantity ของ lot
- [x] **PFR2 — Desktop/mobile UX:** แสดงการ์ดซ้ำเป็นคนละแถวพร้อมวันที่/โน้ตที่ช่วยแยกแยะ และให้ action แก้ไข/ลบทำกับ lot นั้นโดยตรง โดย editor มีเฉพาะข้อมูลของรายการซื้อ; metadata ใช้ `N ใบ` แทน `×N`, แสดงสถานะ “ไม่ระบุวันที่” เมื่อข้อมูลว่าง และแยกบรรทัดกันข้อความถูกตัด
- [x] **PFR3 — Summary/state parity:** ปรับจำนวนรายการ, sort/search/hide balance, loading skeleton, mock preview และ TH/EN/JP ให้ตรงกับโครงใหม่
- [x] **PFR4 — Verification:** regression + responsive fallback tests, React review, TypeScript/lint/test/build และ Browser desktop พร้อม direct save จริงโดยไม่เปลี่ยนค่าธุรกิจ
- [x] **PFR5 — Owner table clarity:** ถอด legacy condition (`NM` ฯลฯ) ออกจาก owner row, แยกจำนวนเป็นคอลัมน์ sortable บน desktop และ field มี label ใน mobile list โดยไม่เปลี่ยน backend identity contract
- [x] **PFR6 — Dark header parity:** ให้หัวตาราง inherit สี panel แทน `bg-background`, ใช้ semantic muted text โดยไม่ซ้อน opacity, รองรับหัว localized ยาวแบบ wrap และ sync loading/mock preview
- [~] **PFR7 — Verification:** regression + responsive state parity + React review + TypeScript/lint/build ผ่าน; Browser Light/Dark ที่ 1280px ยืนยัน 6 columns/contrast/fixed layout/no overflow หลังแก้ localized wrap แล้ว เหลือ actual visual recheck EN/JP ที่ 640/768px เพราะ in-app Browser รอบนี้คง viewport 1280px
- [x] **PFR8 — Note-first row identity:** ถอดเลข `รายการซื้อ #N` ออกจาก visual row, ย้ายวันที่ไปอยู่กับรหัสการ์ด และใช้บรรทัดที่สามเป็น note preview หรือ affordance “เพิ่มโน้ต” ทั้ง desktop/mobile
- [x] **PFR9 — Details interaction:** เปลี่ยน trailing action จาก “แก้ไข” เป็น “รายละเอียด”, ให้กดพื้นที่ว่างของ row เปิด purchase details ได้ โดย card image/name ยังไปหน้าการ์ดและ nested actions ไม่ยิงซ้ำ
- [x] **PFR10 — State parity + verification:** sync skeleton/mock/TH-EN-JP, regression interaction/a11y, React review, TypeScript/lint/test/build และ Browser Light/Dark ตรวจ row/card/details destinations
- [x] **PFR11 — Trailing action polish:** ถอดหน้าตา “รายละเอียด” ที่ลอยเหมือนคอลัมน์ข้อมูล, ทำ affordance ปลายแถวให้กะทัดรัดแต่ยังชัดว่ากดได้ และคืนพื้นที่ให้ข้อมูลหลักโดยรักษา row click + keyboard path
- [x] **PFR12 — State parity + verification:** sync desktop/mobile/mock/skeleton/colgroup, regression a11y + responsive, React review, TypeScript/lint/test/build และ Browser Dark/Light ตรวจ visual hierarchy/overflow
- [x] **PFR13 — Date truth + mobile density:** แสดงวันที่ได้มาเสมอโดยใช้สถานะ “ไม่ระบุวันที่” แทนการหายเงียบ, ย้ายจำนวนเข้า identity metadata และยุบ market/cost/P&L เป็น metric strip แถวเดียวบนมือถือ
- [x] **PFR14 — Compact financial hero:** จัดกำไร/ขาดทุนกับต้นทุนเคียงกันตั้งแต่มือถือ, ลด padding/spacing เฉพาะจอเล็ก และ sync runtime/mock/skeleton โดยไม่ลด hierarchy ของมูลค่าพอร์ต
- [x] **PFR15 — Verification:** regression วันที่จริง/null, responsive state parity, React/a11y review, TypeScript/lint/test/build และ Browser ตรวจข้อมูลจริง/โครง desktop; mobile ใช้ responsive regression เพราะ Browser รอบนี้คง viewport 1280px

### Whole-site selection-control audit + refactor — 2026-07-21

> ตรวจทุก production caller ของ Tabs, SegmentedControl, ViewModeControl, GradeControl และปุ่มเลือกแบบเขียนมือ เพื่อแก้ active alignment/สัดส่วน/geometry ที่รากโดยไม่ทำให้ component ที่ตั้งใจยาวตามข้อความเสีย และ sync loading/mock/tests ให้ไม่ drift

- [x] **SC1 — Inventory + intent:** ทำรายการ caller ทั้งเว็บ แยก control ที่ควรแบ่งเท่ากัน, content-width, horizontal rail และ icon-only พร้อมระบุ hand-rolled duplicate/risk ก่อนแก้
- [x] **SC2 — Canonical contract:** เพิ่มหรือปรับ opt-in API ที่ component กลางเฉพาะเมื่อมี caller ซ้ำจริง; คง keyboard/ARIA/focus/touch target และหลีกเลี่ยง global style change ที่กระทบหน้าอื่น
- [x] **SC3 — Caller migration + state parity:** ย้าย production callers ที่ผิด contract, ถอด class override ซ้ำ และปรับ skeleton/mock/preview ให้ geometry ตรง runtime
- [x] **SC4 — Verification:** regression tests + React/Next review + TypeScript/lint/test/build + Browser representative routes ที่ 390/768/1440px Light/Dark, active ทั้งสองฝั่ง และ no horizontal overflow

### Raw / PSA price lens — Watchlist + Set detail — 2026-07-19

> เพิ่มตัวเลือก Raw/PSA 10 แบบเดียวกับหน้าแรกให้ `/watchlist` และ `/opcg/sets/[setCode]` โดยใช้ราคาจริงจาก SNKRDUNK เท่านั้น, ไม่แตะ schema/dependency/config และไม่แสดง %/กราฟ Raw ปนในโหมด PSA

- [x] **RP1 — Data contract:** ส่ง `psa10PriceUsd` แบบ flattened จาก Watchlist API; Set detail ใช้ field ที่ query อยู่แล้วและคง `null` เมื่อไม่มีข้อมูลจริง
- [x] **RP2 — Watchlist lens:** reuse `PriceModeControl`; ราคา/การเรียงตามราคาเปลี่ยนตาม Raw/PSA, ซ่อน period/change/sparkline และ movement facet ใน PSA โดยไม่กระทบ search/game/set/alert/select flow
- [x] **RP3 — Set-detail lens:** reuse `PriceModeControl` ใน controls เดิม; tile ทุก breakpoint เปลี่ยนราคา Raw/PSA และซ่อน period/% Raw ใน PSA พร้อม fallback `—`
- [x] **RP4 — Verification:** targeted regression tests + lint/test/TypeScript/build + Browser `/watchlist` และ `/opcg/sets/op03` ที่ 390/768/1440px Light/Dark, สลับ Raw/PSA, no overflow/console error

### Shared grade lens — whole-site consistency — 2026-07-19

> ขยาย price lens ให้ตรงกับ grade ladder บน card detail: Raw + PSA 10 ใช้ราคาตลาดจริง; PSA 9 / PSA 8 / BGS 9.5 ยังคำนวณจาก PSA 10 ใน data layer แต่ UI ไม่แสดงป้าย `est.` ตาม owner decision และ `CardCondition` (NM/LP/ฯลฯ) ยังคงเป็นคนละแกน

- [x] **GR1 — Shared contract:** ย้าย grade keys/tier metadata/สูตรประมาณไป SSOT ฝั่ง client-safe พร้อม helper สำหรับ availability + ราคา และให้ card detail ใช้ registry เดียวกัน
- [x] **GR2 — Canonical control:** เพิ่ม `GradeControl` แบบ responsive ครบทุก tier และใช้ร่วมกันทุก listing surface (`PriceModeControl` เหลือ compatibility adapter)
- [x] **GR3 — Whole-site migration:** หน้าแรก · ค้นหา · รายการโปรด · หน้าชุด ใช้ grade state/ราคา/การกรองเดียวกัน
- [x] **GR4 — Stable tables:** Watchlist และ shared MarketTable คงโครง ราคา/24H/7D/30D/ประวัติ เหมือน Raw ทุก grade; ข้อมูล history ที่ไม่มีจริงใช้ `—` และปิด sort ที่สื่อผิด
- [x] **GR5 — Verification:** regression tests + TypeScript/lint/test/build + Browser ครบ Home/Search/Watchlist/OP03/card detail ที่ 390/768/1440px พร้อมตรวจ Light/Dark บน surface ตัวแทน
- [x] **GR6 — Horizontal grade rail:** เปลี่ยน `GradeControl` จาก dropdown เป็นปุ่มเลือกแนวนอนที่เลื่อนซ้าย–ขวาได้ และ verify ทุก listing surface บนมือถือ+desktop
- [x] **GR7 — Owner polish + responsive audit:** เอา `est.` ออกจาก grade rail/ราคา/card detail ทั้งเว็บโดยคง calculation contract เดิม แล้วตรวจ UX/UI จริงที่ 390/640/768/1440px ทั้ง Light/Dark, keyboard, active visibility และ no overflow

### Nested card-picker filter backdrop — 2026-07-20

> เมื่อเปิดตัวกรองซ้อนบน dialog เลือกการ์ด ให้ desktop เบลอ dialog ชั้นหลังอย่างชัดเจน โดยไม่เปลี่ยน backdrop ของ FilterModal หน้าอื่นและไม่กระทบ mobile/focus/Escape

- [x] **NB1 — Dialog contract:** รองรับการ force-render backdrop เฉพาะ nested dialog จาก canonical `DialogContent`
- [x] **NB2 — Picker behavior:** เปิด blur backdrop เฉพาะ `FilterModal` ภายใน card picker
- [x] **NB3 — Verification:** regression test + lint/test/TypeScript/build และตรวจ desktop nested flow, Escape/focus, mobile ไม่ถอย

### Canonical market table + 30-day graph — 2026-07-20

> ให้ตารางรายการโปรดใช้โครง/คอลัมน์/ความหนาแน่นเดียวกับตารางหน้าแรก และกำหนด sparkline กลางของหน้าแรก · ค้นหา · รายการโปรด · พอร์ตเป็นข้อมูล Raw ย้อนหลัง 30 วันจริง ไม่ใช่แค่เปลี่ยนป้ายชื่อ

- [x] **MT1 — 30-day data contract:** เปลี่ยน endpoint/hook กลางเป็น 30 วันย้อนหลังจาก Raw snapshot จริงล่าสุดของการ์ดแต่ละใบ, เก็บ snapshot ล่าสุดต่อวัน และเพิ่ม regression test ยืนยันช่วง query/series
- [x] **MT2 — Shared desktop anatomy:** ตารางรายการโปรด reuse column registry/spacing/sticky header/ราคา/rarity/set จากหน้าแรก พร้อมคง edit/alert/remove และแสดง `—` สำหรับ history เกรดที่ไม่มีข้อมูลจริง
- [x] **MT3 — Mobile consistency:** list fallback ใต้ `sm` ใช้ความหนาแน่น/ข้อมูลหลักแบบหน้าแรกโดยคง selection และเมนูต่อแถว, ไม่มี horizontal overflow
- [x] **MT4 — Verification:** targeted tests + lint/test/TypeScript/build + Browser หน้าแรก/รายการโปรดที่ 390/768/1440px ทั้ง Light/Dark, Raw/graded, sort/actions/no overflow

### Portfolio detail visual rebuild — 2026-07-20

> รักษา 2 แท็บและ data/action contract เดิม แต่ยกชื่อพอร์ตเป็น page identity, ทำแท็บเป็น navigation rail, ใช้ game filter ร่วมกันทั้งสองแท็บ และจัด Insights ให้ใช้พื้นที่ desktop อย่างมีลำดับ โดยไม่ย้อนกลับไปเป็น Minimal Editorial ที่เคยถูกปฏิเสธ

- [x] **PF1 — Shared shell:** header ชัดเจน + action group responsive + line tabs 2 แท็บ + shared game rail โดยคง switch/create/rename/privacy/delete/hide/share/add behavior
- [x] **PF2 — Overview:** ลด KPI ซ้ำ, จัด hero/stat hierarchy และ assets section ให้ต่อเนื่องกับตารางหน้าแรก โดยรักษา financial completeness และ mobile list fallback
- [x] **PF3 — Insights:** chart/movers/allocation/by-game เป็น responsive dashboard grid, ไม่มีกราฟรายเกมปลอม และไม่มีทางตันหลังเลือก game filter
- [~] **PF4 — States + verification:** skeleton/guest preview + tests/lint/TypeScript/build ผ่าน; Browser 390/1440 Light ทั้งสองแท็บ/no overflow ผ่าน แต่ automated 768/Dark ถูก Browser URL policy บล็อกระหว่างสลับ theme จึงต้อง recheck ภาพจริงรอบถัดไป

### Portfolio flat summary + Insights dedupe — 2026-07-20

> เก็บรอบ feedback หลังเปิดดูจริง: ลด summary ที่เป็นการ์ดใหญ่, ให้ตัวเลขหลักมีแหล่งเดียวทั้งหน้า และแยก presentation ของ Insights ออกจาก client controller โดยคง financial honesty/game-scope/action contract เดิม

- [x] **PD1 — Shared flat summary:** ย้ายมูลค่า/P&L/จำนวนการ์ด/ต้นทุนออกมาเป็น summary ร่วมเหนือ content ของทั้ง 2 แท็บ, ไม่มี Surface/เงา/มุมการ์ด และถอด best/worst ที่ซ้ำเชิง UX กับข้อมูลในตาราง/Movers
- [x] **PD2 — Dedupe Insights:** เอา hero ซ้ำออก, ใช้กราฟเป็น section แบน, แสดง composition เพียงมิติเดียว (หลายเกม = by-game, มิฉะนั้น = allocation) และจำกัด movers ให้เป็นสรุป 24 ชม. กระชับ
- [x] **PD3 — Refactor + financial truth:** แยก Insights presentation ออกจาก `portfolio-detail-client`, ลด state/derived value ที่ไม่จำเป็น, แก้สูตร monetary swing 24 ชม. และเพิ่ม regression tests โดยไม่เปลี่ยน API/schema
- [~] **PD4 — States + verification:** skeleton/guest preview + tests 67 files/352 tests + lint 0 errors + TypeScript + build 156 routes + diff-check ผ่าน; Browser 390/768/1440px Light/Dark ยังตรวจไม่ได้เพราะ dev server เข้าไม่ถึงและ Browser URL policy หยุดหลัง error page

### Portfolio separator-density polish — 2026-07-20

> เก็บรอบภาพจริงหลัง flat-summary: เหลือเส้นเฉพาะ navigation/table ที่ช่วยสแกนข้อมูล ส่วน summary, Insights และรายการสรุปสั้นใช้ whitespace + alignment แทน เพื่อไม่ให้ทั้งหน้าดูเป็นตารางเส้นซ้อนกัน

- [x] **PS1 — Structural hierarchy:** คงเส้นฐานแท็บและหัวตารางที่มีหน้าที่จริง; ถอดเส้นรอบ/แบ่ง summary และเส้นใต้ toolbar ที่ซ้ำกับหัวตาราง
- [x] **PS2 — Insights breathing room:** ถอด outer/divide/center rules, เปลี่ยนรายการ composition/movers เป็น spacing และเปลี่ยนกราฟว่างจากกรอบเส้นประเป็นสถานะเงียบที่ยังคงความสูง
- [x] **PS3 — State parity:** ปรับ skeleton/guest preview และ regression contracts ให้ mirror โครง separator-light โดยคง mobile row dividers ที่ช่วยอ่าน list
- [~] **PS4 — Verification:** targeted 6 files/19 tests + full 67 files/352 tests + lint 0 errors + TypeScript + build 156 routes + diff-check ผ่าน; Browser จริง Overview/Insights ที่ viewport 1275px ทั้ง Light/Dark ไม่มี overflow/error overlay และ responsive contract ของ 390/768/1440 ถูกล็อกใน markup/source แต่ binding Browser รอบนี้ไม่มี viewport-resize จึงยังไม่ได้ถ่ายภาพสามขนาดซ้ำ

### Portfolio analytical Insights — 2026-07-20

> แทนข้อสรุป flat-only ของรอบก่อนเฉพาะแท็บ Insights: ใช้ Surface เท่าที่มีหน้าที่จริง 1 การ์ดหลัก + 2 การ์ดรอง, ย้ายมูลค่า/P&L เข้าอยู่กับกราฟ และทำ sparse history ให้เห็นตั้งแต่วันแรกโดยไม่สร้างข้อมูลย้อนหลังปลอม

- [x] **PI1 — Honest insight model:** helper กลางสำหรับ live point รายวัน, Top 1/Top 3 concentration, 24h portfolio impact + coverage และ tracked span พร้อม regression tests
- [x] **PI2 — Primary value surface:** Insights ใช้ `Surface hero` รวมมูลค่า/P&L/ต้นทุน/coverage/tracked span + กราฟ 7D/30D/90D; Overview คง flat summary ของตัวเองและไม่เกิดข้อมูลซ้ำข้ามแท็บ
- [x] **PI3 — Sparse chart truth:** รองรับ 0/1/หลาย snapshot, จุด Today/Live, partial-price marker, same-day dedupe และ all-games-only history โดยไม่สร้างเส้นหรือจุดศูนย์ปลอม
- [x] **PI4 — Diagnostic panels:** `Surface panel` สองใบสำหรับโครงสร้างพอร์ตและตัวขับเคลื่อน 24 ชม. แบบ 7/5 desktop, stack บนมือถือ, ไม่มี nested card/divider soup
- [x] **PI5 — States + verification:** i18n/skeleton/guest preview/tests ครบ แล้วตรวจ TypeScript/lint/test/build + Browser 390/768/1440px Light/Dark, keyboard, range rail และ no overflow

### Portfolio reference panel layout — 2026-07-20

> รอบ feedback จากภาพหน้า live เดิม: คืนโครง sidebar + panel ที่สแกนง่าย โดยพอร์ตเฉพาะ composition จากประวัติเดิมเข้ากับ route/data-honesty ปัจจุบัน ห้าม revert ทั้งไฟล์และห้ามคืน gradient/blur

- [x] **PR1 — Responsive shell:** Page heading + desktop sidebar 280px + mobile switcher + segmented tabs/action row โดยคง create/switch/manage/hide/share/add และ game scope เดิม
- [x] **PR2 — Overview panels:** Hero Surface สำหรับมูลค่า/P&L/ต้นทุน/ผลงาน และ Assets Surface ที่ครอบ toolbar+table/list โดยไม่สร้าง nested card หรือข้อมูลซ้ำเกินจำเป็น
- [x] **PR3 — Insights dashboard:** KPI 4 ใบ + History Surface + Allocation Surface ตามภาพอ้างอิง โดยคง sparse live point, coverage, hideBalance และ all-games-only history ตามข้อมูลจริง
- [x] **PR4 — State parity + verification:** ปรับ skeleton/guest preview/tests แล้วตรวจ TypeScript/lint/test/build + Browser 390/768/1440px Light/Dark, interaction และ no horizontal overflow

### Portfolio Collector Vault — 2026-07-21

> รื้อ visual hierarchy ของหน้าพอร์ตให้เป็น workspace ของนักสะสมที่แตกต่างจากหน้า market ทั่วไป: ใช้ภาพการ์ดจริงและ solid espresso stage สร้าง premium identity โดยคงทุก mutation, data-honesty, 2 tabs, game scope, hide/share/add และ responsive table/list contract เดิม

- [x] **PV1 — Immersive identity:** ย้ายชื่อพอร์ต/สถานะ/ยอดหลัก/actions/tabs เข้า Collector Vault stage เดียว ลด page-header/summary ซ้ำ และทำ desktop/mobile hierarchy ใหม่โดยไม่ใช้ gradient/blur
- [x] **PV2 — Collection showcase:** แสดง top holdings จากข้อมูลจริงเป็น card-art stack ที่มี fallback, จำกัดเป็น visual summary ไม่สร้างราคา/สถิติจำลอง และไม่แย่งพื้นที่ใช้งานบนจอเล็ก
- [x] **PV3 — Usable workspace:** จัด sidebar, game rail, holdings panel และ Insights ให้ต่อเนื่องจาก stage; คง keyboard/ARIA/touch target, mobile list fallback และ dialogs/mutations เดิมทั้งหมด
- [x] **PV4 — State parity + verification:** ปรับ loading/guest preview/tests แล้วตรวจ targeted tests + TypeScript/lint/test/build + Browser 390/768/1440px Light/Dark, ทั้ง 2 tabs, actions และ no horizontal overflow

### Portfolio Collector Vault rollback — 2026-07-21

> Owner เปิดดูของจริงแล้วเลือกกลับไปใช้ Portfolio reference panel layout เดิม ถอดเฉพาะ visual experiment รอบ Collector Vault โดยรักษา Insights, data-honesty, actions/mutations, game scope และ responsive contracts ที่มีอยู่ก่อนรอบนี้

- [x] **PVR1 — Restore runtime composition:** คืน PageHeader + desktop sidebar + mobile/tablet heading switcher + action row + segmented tabs + Overview hero/assets panels
- [x] **PVR2 — Restore state parity:** คืน loading skeleton และ guest preview ให้ mirror reference panel layout เดิม พร้อมถอด vault-only props/components/tests
- [x] **PVR3 — Preserve accepted fixes:** เก็บ mobile toolbar wrap และป้าย `P/L` ที่เป็น usability fix ไม่ผูกกับ Collector Vault
- [x] **PVR4 — Verification:** targeted Portfolio tests + TypeScript/lint/test/build + Browser 390/768/1440px Light/Dark, Overview/Insights/actions และ no horizontal overflow/runtime error

### Portfolio line tabs — 2026-07-22

> Owner ขอให้แท็บ `ภาพรวม / ข้อมูลเชิงลึก` ใช้เส้นฐานและเส้น active แบบเดียวกับ Watchlist แทน segmented pill โดยคง layout, state และ actions เดิม

- [x] **PLT1 — Canonical line anatomy:** ใช้ `TabsList variant="line"` เฉพาะ Portfolio พร้อม baseline เต็มพื้นที่, honey underline และ touch target 44/40px โดยไม่แก้ Tabs กลาง
- [x] **PLT2 — State parity:** ปรับ runtime, guest preview และ loading skeleton ให้ geometry ตรงกัน พร้อม regression tests ล็อก line variant/indicator
- [x] **PLT3 — Verification:** targeted tests + TypeScript + lint + full test 405/405 + build 156 routes และ Browser 390/768/1440px ทั้ง Overview/Insights พร้อม Light/Dark representative, no overflow

### Meaningful game selection — 2026-07-22

> Historical MGS ถูก HGL (Header) และ FGR (ทุก data surface) supersede แล้ว: Header `GameSwitcher` แสดง registered live/roadmap เสมอ ส่วน in-page filters และ card-picker game step แสดงตั้งแต่มี launch-ready game จริง 1 เกม; Pokémon ตอนนี้ยัง roadmap/blocked กดได้เฉพาะ Header ไป `/coming-soon` โดยไม่เปลี่ยน active game

- [x] **MGS1 — Inventory + decision boundary:** ตรวจ Header, Portfolio, Watchlist, Alerts, card picker, preview/skeleton/tests และยืนยันว่า global Header selector เป็นคนละหน้าที่กับตัวกรองข้อมูลตามหน้า
- [x] **MGS2 — Superseded by HGL + FGR:** กฎเดิมที่ซ่อน Header/filter/picker เมื่อมีเกมเดียวถูกยกเลิกทั้งหมด; ทุกจุดยังคงไม่ปน coming-soon teaser
- [x] **MGS3 — State + parity (historical):** เดิม normalize scope กลับ `ทุกเกม` เมื่อ control ถูกซ่อน; FGR เปลี่ยนเป็นรักษา valid single-game scope เพราะ control มองเห็นแล้ว โดย filter ของ MINE ยังเป็น local และไม่ผูกกับ Header
- [x] **MGS4 — Historical verification before HGL:** targeted 8 files / 30 tests + TypeScript/lint/full 89 files / 410 tests/build 156 pages + Browser Portfolio/Watchlist/Alerts/card picker ที่ 390/768/1440px, Light/Dark, demo multi-game, keyboard และ no overflow

### Canonical Header GameSwitcher + launch gate — 2026-07-24

> Historical decision ถูก owner ขยายต่อใน FGR 2026-07-25: Header ต้องอยู่ และ per-surface game context ก็ต้องอยู่แม้มี live game เดียว; launch gate ของเกมใหม่ยังคงเดิม

- [x] **HGL1 — Contract audit:** ยืนยัน local Header/filters/picker หายจริงจาก working-tree change, production ยังมี Header switcher และ multi-game state/namespace ยังอยู่
- [x] **HGL2 — Canonical Header:** คืน Header GameSwitcher จุดเดียวทั้ง mobile/desktop พร้อม live game + coming-soon teaser โดยไม่คืน rail/chip ซ้ำตามหน้า
- [x] **HGL3 — Single launch gate:** ให้ config lifecycle + route readiness + data readiness ขับ active selectors, routable prefixes และ seed `Game.isActive` จาก source เดียว; gate ต้อง fail closed
- [x] **HGL4 — Regression + docs:** เพิ่ม positive/negative readiness tests, Header rendering test และ sync MINE/VISION/legacy plan wording ที่ขัด decision ใหม่
- [x] **HGL5 — Verification:** focused/full tests + TypeScript/lint/build + Browser 390/768/1440px ผ่าน; owner อนุมัติ seed แล้ว และ live DB preflight ผ่าน OPCG 51 sets / 3,838 cards / 3,831 priced cards โดย Pokémon ยัง inactive/empty

### Full-surface game context restoration — 2026-07-25

> Owner ยืนยันว่า game UI ที่หายใน card picker, Portfolio, Watchlist และ surface ใกล้เคียงเป็น regression เช่นเดียวกับ Header: UI ต้องคงอยู่เป็น context แม้มี launch-ready game เดียว แต่ roadmap/blocked game ห้ามกลายเป็นตัวเลือกใช้งานหรือ fake data

- [x] **FGR1 — Reproduce + fail path:** browser/test ยืนยัน Header กลับมาแล้ว แต่ card-picker game step และ MINE game filters หายเพราะ render gate `>= 2`; seed ไม่เปลี่ยนอาการและตัดสมมติฐาน DB ออก
- [x] **FGR2 — Restore picker context:** แสดง launch-ready game step ก่อนเลือกการ์ดเสมอ แม้มี OPCG ตัวเดียว โดยไม่แสดง Pokémon ที่ blocked
- [x] **FGR3 — Restore MINE context:** แสดง game filter/context ใน Portfolio, Watchlist และ Alerts เมื่อ surface มีข้อมูลจาก launch-ready game อย่างน้อย 1 เกม พร้อมรักษา local filter semantics
- [x] **FGR4 — State parity + docs:** sync tests, comments, preview/loading ที่เกี่ยวข้อง และแก้ mine-multigame contract ที่ขัด owner decision ล่าสุด
- [x] **FGR5 — Verification:** focused 9 files / 39 tests + full 124 files / 674 tests + TypeScript/lint/build 157 pages + Browser 390/768/1440px ตรวจ picker/Portfolio/Watchlist/Alerts, keyboard, no overflow และ fresh-tab console error 0

### Integrated MINE game scope — 2026-07-25

> Owner เปิดดู game rail ที่เพิ่งคืนแล้วพบว่า `ทุกเกม | One Piece` ลอยเป็นแถวใหม่และดูเหมือนแท็บชุดที่สาม โดยเฉพาะตอนมี launch-ready game เดียว; เปลี่ยน MINE surfaces ให้ใช้ compact game scope ใน toolbar เดียวกัน ขณะที่ card picker ยังคงขั้นเลือกเกมแบบเด่นเพราะเป็นคนละ workflow

- [x] **IGS1 — Compact canonical scope:** ต่อ `GameFilterChips` ให้รองรับ compact Select ที่แสดง `เกม: <scope>` พร้อมเฉพาะ `ทุกเกม` + launch-ready games, keyboard/focus/touch target ครบ และไม่ปน roadmap Pokémon
- [x] **IGS2 — Integrated placement:** Watchlist Cards วาง scope คู่ search ตั้งแต่ `sm` และรวมทั้งแถวที่ `lg`; Portfolio วาง scope คู่ tabs ตั้งแต่ `md` และรวม tabs/scope/actions ที่ `lg`; Alerts วาง scope บน baseline เดียวกับหัวรายการ โดยมือถือคงลำดับอ่านชัดและแก้ 320px overflow ของ result/header controls
- [x] **IGS3 — State parity:** ปรับ Watchlist/Portfolio preview + skeleton และ Alerts skeleton ให้ mirror runtime รวมความสูง switcher/toolbar และ search reserve โดย selector ไม่เป็น sibling row ลอยอีก
- [x] **IGS4 — Verification:** focused 6 files / 36 tests + TypeScript + lint 0 errors + full 128 files / 696 tests + production build 157 pages + Browser 320/390/640/768/1024/1440px Light/Dark ตรวจ Watchlist/Alerts/Portfolio, card-picker order, keyboard/focus/scope switching, no horizontal overflow และ fresh-tab console error 0

### Dev hydration bundle recovery — 2026-07-25

> หลังแก้ IGS แล้ว dev server เดิมส่ง SSR จาก source ใหม่ แต่ client chunk ยังเป็น layout รุ่นก่อน จึงเกิด hydration mismatch พร้อมกันทั้ง `HeaderMobile` และ `WatchlistSkeleton`; production build ไม่พบอาการ

- [x] **DHR1 — Reproduce:** แท็บใหม่บน `localhost:3000/watchlist` reproduce 100% และ console ชี้ literal class ใหม่ฝั่ง SSR ชน literal class เก่าฝั่ง client
- [x] **DHR2 — Trace + falsify:** ยืนยัน source ไม่มี server/client branch, เวลา, locale หรือ random ใน fail path; mismatch หลาย component และ production build ที่สะอาดตัดสมมติฐาน logic/extension ออก
- [x] **DHR3 — Recover safely:** หยุด dev PID เดิม, ย้าย `.next/dev` ไป `/private/tmp/meecard-next-dev-hydration-20260725` แบบกู้คืนได้ และเปิด `npm run dev` ใหม่
- [x] **DHR4 — Verify:** fresh tabs ของ Watchlist Cards, Alerts และ Portfolio ใช้ bundle/class รุ่นเดียวกัน; console error 0 ทุก run และ hydration mismatch ไม่กลับมา

### Portfolio sidebar total removal — 2026-07-22

> Owner ขอเอาการ์ดสรุป `ทุกพอร์ต` ที่ซ้ำเหนือรายการพอร์ตในหน้า Detail ออก โดยคงข้อมูลพอร์ต, การสลับ/จัดการพอร์ต, hide balance และ summary หลักใน workspace ไว้เหมือนเดิม

- [x] **PST1 — Runtime:** ถอด cross-portfolio total Surface และ derived presentation ที่ไม่มี consumer ออกจาก sidebar โดยให้รายการพอร์ตขึ้นเป็น panel แรก; ย้าย hide-balance action เข้า toolbar ให้ desktop ยังใช้ได้
- [x] **PST2 — State parity:** ถอดกล่องเดียวกันจาก guest preview และ loading skeleton พร้อมปรับ regression assertions/order
- [x] **PST3 — Verification:** targeted 3 files / 8 tests + TypeScript + lint 0 errors + full 89 files / 410 tests + build 156 pages + Browser `/portfolio/1` ที่ 390/768/1440px, Light/Dark representative, hide/show interaction และ no overflow/console error

### Portfolio create affordance gating — 2026-07-22

> Owner ต้องการให้ผู้ใช้เห็น affordance `สร้างพอร์ตใหม่` แบบ action ปกติแม้ชนโควตา แล้วค่อยอธิบายการอัปเกรดหลังผู้ใช้กด แทนการวางข้อความขายแผนยาวใน sidebar ตั้งแต่แรก

- [x] **PCA1 — Consistent affordance:** ใช้ Plus + `สร้างพอร์ตใหม่` anatomy เดียวทั้ง sidebar, management dialog และ quick-switch dropdown ไม่ว่าชนโควตาหรือไม่
- [x] **PCA2 — Honest gate:** เมื่อยังมีโควตาเปิด create flow เดิม; เมื่อเต็มให้เปิด canonical upgrade dialog `portfolioCount` โดยไม่ mount create dialog/ยิง mutation, ปิด management dialog ก่อน และเลือก Pro/Pro+ ตามโควตาที่เต็ม
- [x] **PCA3 — Verification:** regression non-limit/at-limit markup + tier routing, targeted 6 tests, TypeScript, full lint/test 89 files / 412 tests, build 156 pages และ Browser at-limit interaction ที่ 390/768/1440px พร้อม focus/single-dialog/Light-Dark/no overflow/console error

### Dev nested API 404 recurrence — 2026-07-22

> `ensureOk` แจ้ง routing-level HTML 404 จาก nested Route Handlers หลายตัวหลัง dev restart; ต้องแยก source bug ออกจาก Turbopack dev filesystem cache ก่อนเปลี่ยนโค้ด และห้ามกลบ error ใน API client/hook

- [x] **D4041 — Reproduce/trace/falsify:** ยืนยัน `/api/cards/sparklines` และ nested siblings คืน HTML 404 เฉพาะ dev ที่ port 3001 ขณะที่ source ไม่มี 404 branch และ production route เดียวกันคืน JSON 200; port 3000 เป็น CARMETA คนละ repo
- [x] **D4042 — Recover dev state:** หยุด Meecard dev, ย้ายเฉพาะ `.next/dev` ไป `/tmp` แบบกู้คืนได้ แล้ว cold start โดยไม่แก้ `apiFetch`, hook, route หรือ middleware
- [x] **D4043 — Verification:** nested API matrix 5/5 คืน 200 JSON, Portfolio fresh-tab console สะอาด, targeted 2 files / 4 tests, full 89 files / 412 tests, lint 0 errors, TypeScript และ production build 156 pages ผ่าน

### Portfolio Dime-style summary hierarchy — 2026-07-22

> Owner ชี้ว่า Overview summary อ่านยากและซ้ำ: value/P&L แสดงสองรอบและ best/worst ปนกับข้อมูลการเงิน จึงยืมลำดับการอ่านจาก Dime โดยไม่ลอก visual theme และไม่สร้างข้อมูล 24 ชม. ที่ไม่มีจริง

- [x] **PDS1 — Information decision:** เหลือ value เป็น hero จุดเดียว, cost เป็น metadata, divider และ P/L แถวเดียวที่ให้เปอร์เซ็นต์เด่นกว่า amount; ถอด best/worst เพราะซ้ำกับ holdings ด้านล่าง
- [x] **PDS2 — Runtime + truth states:** ปรับ complete/partial/zero-cost/hidden-balance/single-game scope ให้ hierarchy ใหม่โดยไม่เปลี่ยน `PortfolioStats` หรือสร้าง ROI ปลอม; coverage แสดงเฉพาะเมื่อ cost ไม่ครบ
- [x] **PDS3 — State parity:** sync guest preview, loading skeleton และ regression assertions ให้ anatomy value → cost → divider → P/L ตรง runtime พร้อมล็อก P/L occurrence เดียว
- [x] **PDS4 — Verification:** targeted 3 files / 18 tests, full 89 files / 415 tests, TypeScript, lint 0 errors, build 156 pages และ Browser 390/768/1440px Light/Dark + hidden balance ผ่านโดยไม่มี overflow/console error

### Portfolio gradient financial card — 2026-07-22

> Owner เลือกให้ Overview summary เป็นการ์ดไล่สีอ่อนตามภาพอ้างอิง แต่คงเฉพาะข้อมูลการเงินที่จำเป็น: มูลค่า, ROI, กำไร/ขาดทุน และต้นทุน; ห้ามคืน best/worst หรือข้อมูลผลงานรายใบ

- [x] **PGF1 — Visual contract:** ใช้ gradient อ่อนที่รองรับ Light/Dark และเปลี่ยนโทนตามทิศ P/L โดยไม่เพิ่ม blur, decoration หรือสี hardcode ที่อ่านยาก
- [x] **PGF2 — Runtime + truth states:** จัด hero เป็น value + ROI pill และแถวล่างเฉพาะ P/L กับต้นทุน พร้อมรักษา complete/partial/zero-cost/hidden-balance semantics และไม่สร้าง daily change
- [x] **PGF3 — State parity:** sync guest preview, loading skeleton และ regression tests ให้ anatomy/gradient/no-performance ตรง runtime
- [x] **PGF4 — Verification:** targeted 4 files / 23 tests, full 89 files / 416 tests, TypeScript, lint 0 errors, build 156 pages และ Browser 390/768/1440px Light/Dark + hidden balance ผ่านโดยไม่มี overflow/console error

### Portfolio numeric consistency + amount-only privacy — 2026-07-22

> Owner พบว่าตัวเลขการเงินดูเหมือนคนละฟอนต์, ตารางขยับเมื่อกดซ่อนยอด และต้องการให้ privacy mask ซ่อนเฉพาะจำนวนเงินโดยคงเปอร์เซ็นต์ไว้ พร้อมเพิ่มภาพการ์ดจริงใน Insights โดยไม่สร้างข้อมูลใหม่

- [x] **PNP1 — Numeric typography:** ทำให้ summary, holdings และ Insights ใช้ semantic numeric/price typography เดียวกันตามบทบาท โดยไม่เปลี่ยนฟอนต์ทั้งเว็บหรือสร้าง arbitrary size ใหม่
- [x] **PNP2 — Stable amount-only masking:** mask เฉพาะจำนวนเงินทุก Portfolio surface, คง ROI/24h/P&L percentages และล็อก geometry ของ desktop table/mobile rows ไม่ให้คอลัมน์ขยับระหว่าง show/hide
- [x] **PNP3 — Insights card identity:** เพิ่มภาพการ์ดจริงพร้อม fallback ในจุดที่อ้างถึงการ์ดรายใบใน Insights และ sync guest preview/loading skeleton โดยคง data-honesty และ responsive contract
- [x] **PNP4 — Verification:** targeted 5 files / 29 tests, TypeScript, full 89 files / 420 tests, lint 0 errors, build 156 pages และ Browser 390/768/1440px Light/Dark ผ่าน; desktop/tablet column delta = 0px, mobile trailing delta = 0px, percentages/images/no-overflow/console error ผ่าน

### Portfolio holdings simplification — 2026-07-22

> Owner ต้องการให้รายการถือครองอ่านง่ายขึ้นโดยเหลือเฉพาะข้อมูลที่ใช้ตัดสินใจ: การ์ด, ราคาตลาด, ต้นทุน และกำไร/ขาดทุน; ถอด 24 ชม., กราฟ 30 วัน และมูลค่าถือครองที่ซ้ำกับราคา/จำนวนออกทั้ง desktop และ mobile

- [x] **PHS1 — Information contract:** ใช้ต้นทุนรวม = ราคาซื้อต่อใบ × จำนวน, รักษา `null` = ไม่ทราบ, เรียง P/L ตามจำนวนเงินหลักและให้ค่าที่หายอยู่ท้าย พร้อมถอด Portfolio-only sparkline fetch โดยคง shared hook/API สำหรับหน้าอื่น
- [x] **PHS2 — Responsive holdings UI:** desktop เหลือ 5 คอลัมน์คงที่ Card · Price · Total cost · P/L · action; mobile ใช้ identity + metric grid 3 ช่องที่มี label ชัด พร้อมคง amount-only privacy, เปอร์เซ็นต์ และ action เดิม
- [x] **PHS3 — State parity:** guest preview reconcile ตัวเลขกับ summary, loading skeleton ใช้โครงเดียวกัน, เพิ่ม `totalCost` TH/EN/JP และ regression tests ล็อกว่าไม่มี 24h/graph/holding value ค้างใน holdings
- [x] **PHS4 — Verification:** targeted 5 files / 25 tests, TypeScript, full 89 files / 423 tests, lint 0 errors, build 156 pages และ Browser 390/768/1440px Light/Dark ผ่าน; hide/show geometry delta = 0, mobile menu ไม่มี 24h/value, ไม่มี overflow/console error หรือ Portfolio sparkline request

### Portfolio gateway consolidation — 2026-07-16

> ยกเลิก Manager Hub ที่โล่งและแสดงข้อมูลซ้ำ ให้ `/portfolio` เป็น gateway ไปพอร์ตล่าสุด และรวมการสลับ/จัดการไว้ใน Detail โดยไม่แตะ schema/dependency/config

- [x] **PG1 — Gateway:** server auth + ownership-validated `portfolio-last-active` cookie + deterministic fallback; guest/zero/error/loading ใช้โครง Detail
- [x] **PG2 — Detail flow:** ตัด breadcrumb/back/ยอดรวมซ้ำ, create → `?add=1`, ล้าง query เมื่อปิด และ delete current → next/zero ด้วย replace navigation
- [x] **PG3 — Consolidated management:** switcher dialog จัดการ rename/privacy/delete ได้ทุกพอร์ต พร้อม confirmation, pending/error และ touch target ≥44px
- [x] **PG4 — Compatibility:** global links คง `/portfolio`, mobile footer ครอบคลุม detail, API ordering เพิ่ม `id desc` และไม่ลบ Manager files เดิม
- [x] **Verification:** unit/component/browser 390/640/768/1440 Light/Dark TH/EN/JP + lint/test/TypeScript/build/diff-check

### UX/UI implementation batch — 2026-07-11

> งานตาม audit responsive 390×844 / 768×1024 / 1440×900 · รักษา espresso+honey/Kanit · ไม่แตะ schema/dependency/config

- [x] **P0 — usability blockers:** contrast light mode, finite loading/error/empty states, dialog/focus/keyboard/search/form accessibility
- [x] **P1 — interaction kit:** mobile tap targets, SegmentedControl keyboard behavior, canonical Pagination, admin table mobile fallbacks
- [x] **P2 — dedup/structure:** canonical empty/picker/plan/popover/settings/loading patterns และแยก card-detail orchestration โดยคง behavior
- [x] **P3 — route/polish:** game namespace allowlist + feature guards, canonical links, LCP image priority, reduced-motion coverage
- [x] **Verification:** test + lint + build + browser smoke 105 routes ที่ไม่ใช่ `/proto` และ visual matrix 390/768/1440 ทั้ง light/dark

### UX Truth & Safety batch — 2026-07-11

> ปิดจุดที่หน้าจอสื่อไม่ตรงกับ behavior จริงก่อนปรับ IA/visual รอบถัดไป · ไม่แตะ schema/dependency/config

- [x] **T1 — Pricing/Checkout truth:** guest CTA ไม่เงียบ, เก็บ plan intent ผ่าน auth, error กู้คืนได้, success กลับหน้า subscription พร้อม confirmation, copy trial/limits ตรงระบบจริง และป้องกัน Lifetime/stale webhook/delayed-payment race
- [x] **T2 — Marketplace truth:** Condition/API ตรงกัน, URL เป็น source of truth, CTA/สถานะชำระอธิบาย flow จริง, badge ผู้ขายไม่สื่อว่า KYC และ loading/empty/error มีทางไปต่อ
- [x] **T3 — Card data transparency:** จำกัดข้อมูลซื้อขายจำลองเป็น preview สั้น, ระบุชัดว่าไม่ใช่ธุรกรรมจริง และเลิก nested vertical scroll ที่ไม่จำเป็นบนมือถือ
- [x] **Verification:** 19 test files / 131 tests + lint 0 errors + TypeScript + build 155 pages + browser matrix Pricing/Marketplace/Card ที่ 390/768/1440 ทั้ง Light/Dark

### Mobile home market toolbar — 2026-07-12

> แก้เฉพาะหัวตารางหน้าแรกใต้ `sm:` จากภาพใช้งานจริง · desktop และ `/search` ต้องคง behavior/layout เดิม

- [x] **M1 — Mobile hierarchy:** ให้ SetPicker เป็น control หลักเต็มพื้นที่; แยก price mode, sort, filter และ view control เป็นแถวที่อ่านง่ายโดยไม่บีบข้อความ
- [x] **M2 — Interaction:** ทุก control ≥44px, sort ยังใช้ column model เดียว, keyboard/ARIA เดิมไม่ถอย และไม่มี horizontal overflow
- [x] **Verification:** targeted lint/test + `npm run lint` + `npm run test` + `npm run build` + browser 375/390/768/1440 ทั้ง Light/Dark

### Mobile home toolbar visual-density polish — 2026-07-12

> รอบเก็บภาพจริง: ลดความหนักของกรอบโดยไม่ลด hit area และทำให้ utility controls อ่านเป็นกลุ่มเดียว

- [x] **D1 — Grouping:** ย้าย Filter ไปอยู่กลุ่มเดียวกับ List/Grid ด้านขวา และคง Price mode เป็นกลุ่มซ้าย
- [x] **D2 — Surface density:** จำกัดความกว้าง sort, ลดน้ำหนัก border/fill ของ prominent SetPicker และใช้ radius ที่นุ่มขึ้นอย่างเป็นระบบ
- [x] **Verification:** ตรวจ 375/390 Light/Dark + List/Grid + dropdown + no overflow และรัน lint/test/build

### Canonical toolbar controls — 2026-07-12

> ทำให้ Raw/PSA, ตัวกรอง, เรียง และตัวเลือกมุมมองใช้ component/shape/state ชุดเดียวกันทั้งเว็บ โดยคง control เฉพาะทางที่มีหน้าที่ต่างกันจริง

- [x] **C1 — Canonical primitives:** ล็อกสัญญา FilterButton, ToolbarSortDropdown, ViewModeControl และ action ภายใน FilterModal ให้มี radius/state/tap target/a11y เดียว
- [x] **C2 — Public surfaces:** ย้าย Home, Search, Watchlist, Public Profile, Marketplace, Drop Calculator และ card picker มาใช้ primitive กลางโดยไม่เปลี่ยน behavior
- [x] **C3 — Admin consistency:** แทน view toggle เขียนมือใน Admin Cards ด้วย control กลาง พร้อม keyboard/ARIA ครบ
- [x] **Verification:** targeted tests + lint + TypeScript + build; Home 390/768/1440 Light/Dark และ spot-check Search/Watchlist/Marketplace/Card picker/Admin ที่ 390

### Responsive control radius correction — 2026-07-12

> แก้สัดส่วนความมนที่ราก: mobile control สูง 44px ต้องใช้ radius ใหญ่กว่า desktop compact control โดยไม่สร้าง component/token เพิ่ม

- [x] **R1 — Canonical radius:** Segmented track ใช้ outer radius `rounded-xl → lg`; segment และ toolbar action ใช้ inner radius `rounded-lg → md`; pill variant คง `rounded-full`
- [x] **Verification:** lint + test + TypeScript + build และ browser Home/Search/Watchlist/Marketplace/Admin ที่ 390 เทียบ Home 768/1440

### Client API 404 regression — 2026-07-12

> หา URL ที่ทำให้ `apiFetch` โยน 404 จากหน้าจริงก่อนแก้ และรักษา Marketplace guard ที่ตั้งใจคืน 404 เมื่อ feature flag ปิด

- [x] **A1 — Reproduce/trace:** จับได้ว่า Home/Search → `useSparklines` → `/api/cards/sparklines`; dev route registry ค้างและคืน HTML 404 ขณะที่ production route เดียวกันตอบ JSON 200
- [x] **A2 — No-code recovery:** หยุด dev server แล้วย้าย `.next/dev` ที่เสียไปไว้ใน `/tmp` เพื่อให้ Next สร้าง cache ใหม่ (cold restart อย่างเดียวไม่พอ); ไม่แก้ `apiFetch`/hook/route เพื่อกลบ 404 และไม่กระทบ Marketplace guard ที่ตั้งใจไว้
- [x] **Verification:** Home และ dev API สำคัญ (`sparklines`, `config/public`, `honey/ranks`, `messages/unread-count`) ตอบ 200 หลังสร้าง cache ใหม่; production build ผ่านและ Browser ไม่มี console error

### Canonical toolbar action shape — 2026-07-12

> แยก shape hierarchy ให้ถูกชั้น: segmented track เป็นกรอบครอบกลุ่ม ส่วน Filter/Sort เป็นตัว action จึงต้องใช้ radius ระดับเดียวกับ segment ด้านใน

- [x] **S1 — Root shape:** track คง `rounded-xl → lg`; Filter/Sort ใช้ `rounded-lg → md` โดยไม่เพิ่ม component/prop หรือ consumer override
- [x] **Verification:** lint + test + TypeScript + build; browser Home 390/768 และ spot-check Search/Watchlist/Marketplace ที่ 390; ไม่มี overflow/console error

### Segmented active-edge alignment — 2026-07-12

> แก้ active layer มือถือที่สูงเท่ากรอบแต่มี padding/radius คนละแนว ทำให้เส้นโค้งของตัวเลือกแรก/สุดท้ายไม่ตรงกับ track

- [x] **E1 — Concentric edge:** default track มือถือไม่มี horizontal inset; segment แรก/สุดท้ายใช้ outer-side radius เดียวกับ track ขณะที่ด้านในคง segment radius และ desktop inset เดิม
- [x] **Verification:** สลับ first/last selection ใน Raw/PSA และ List/Grid ที่ 390 พร้อมเทียบ 768; lint + test + TypeScript + build

### Price-mode visual proportion — 2026-07-12

> Raw/PSA 10 มี label กว้างต่างกันจน active Raw เป็นก้อน 44×44px; แก้เฉพาะ grade selector ไม่บังคับ segmented control ทุกชนิดให้กว้างเท่ากัน

- [x] **Q1 — Mobile 50/50 (ถูกแทนด้วย W1):** PriceModeControl เคยใช้ track กว้างคงที่บนมือถือและแบ่ง Raw/PSA 10 เท่ากันผ่าน `fullWidth`; ภาพใช้งานจริงทำให้เปลี่ยนเป็น content-fit ใน W1
- [x] **Verification:** สลับ Raw/PSA 10 ที่ 390 และตรวจ no overflow ที่ 390/640/768; lint + test + TypeScript + build

### Price-mode intrinsic sizing correction — 2026-07-12

> ภาพใช้งานจริงพบว่า fixed 144px + 50/50 บีบฝั่งที่มีไอคอนจน `PSA 10` ถูกตัด; ผู้ใช้เลือกให้แต่ละ segment กว้างตามเนื้อหาแทนความสมมาตร

- [x] **W1 — Content-fit segments:** ยกเลิก fixed width และ `fullWidth` เฉพาะ PriceModeControl ทุก breakpoint ให้ Raw/PSA จองพื้นที่ตาม icon + label + padding โดยคง visual frame/hitbox ตาม responsive geometry เดิม
- [x] **Verification:** ข้อความ Raw/PSA 10 แสดงครบเมื่อสลับ active ที่ 320/390/768/1440px, ไม่มี horizontal overflow และ radiogroup/keyboard เดิมไม่ถอย; lint + test + TypeScript + build

### Mobile toolbar compact visual shell — 2026-07-12

> ลดเฉพาะกรอบที่มองเห็นของ utility controls บนมือถือ โดยคง hit target 44px, desktop geometry และ CTA/form controls เดิม

- [x] **V1 — Compact primitives:** Filter/Sort และ SegmentedControl แบบ opt-in ใช้ visual frame 36px ภายใน hitbox 44px โดยไม่มี hit area ซ้อน
- [x] **V2 — Toolbar adoption:** Home/Search/Watchlist/Marketplace/card picker/Admin ใช้ compact primitives; Raw/PSA เดิม 144px แบบ 50/50 (ถูกแทนด้วย W1), mobile sort กว้างคงที่ และ SetPicker toolbar สูง 40px
- [x] **Verification:** unit + lint + TypeScript + test + build; browser 320/375/390/640/768/1440 ไทย/อังกฤษ Light/Dark และตรวจ tap boundary/no overflow

### Horizontal rail static-fade removal — 2026-07-12

> ผู้ใช้พบทั้ง Card Detail section nav และ grade selector จมใต้ mask; audit พบ 13/44 horizontal rails ใช้ bilateral fade แบบคงที่ซึ่งไม่ดู overflow/scroll position

- [x] **R1 — Reproduce:** section nav เริ่ม offset 0 และ grade rail เริ่ม offset 4px ภายใน mask 0–16px; grade rail ยังถูก fade แม้ `scrollWidth === clientWidth`
- [x] **R2 — Whole-site sweep:** ถอด `scroll-fade-x` จากทั้ง 13 consumers + ลบ helper กลาง และคืน local safe-gutter patch ที่ไม่จำเป็น เพื่อคง layout เดิม
- [x] **Verification:** `rg` เหลือ 0 usage; Browser representative rails 320/390/768/1440 ทั้ง Light/Dark + scroll endpoints/no new page overflow; lint/test/TypeScript/build

### Site-wide flat surfaces — remove gradient + blur — 2026-07-12

> ผู้ใช้สั่งถอด gradient/blur ทุก section ทั้งเว็บ; scope = เอฟเฟ็กต์ที่ render จริงใน production, admin, prototype และ generated app artwork/OG โดยคงเฉพาะ `next/image` blur placeholder ซึ่งเป็นกลไกโหลดรูป ไม่ใช่ surface styling

- [x] **F1 — Audit + boundary:** พบ 52 gradient code sites และ 49 blur/backdrop/filter declarations/references; ไม่มี conic gradient หรือ mask gradient ค้างจากงานก่อนหน้า; ล็อกว่า fade animation, shadow และ image loading placeholder ไม่อยู่ใน scope
- [x] **F2 — Flat foundation + chrome:** แทน gradient/glow/frost กลางด้วย semantic solid fills; ถอด blurred ambient, backdrop blur, translucent fallback และ fade overlay จาก header/footer/modal/sheet/dropdown/sticky bars
- [x] **F3 — Flat feature surfaces:** แทน profile/auth/portfolio/honey/admin/commerce gradients และ blurred decorations ด้วยสีทึบ; multi-color indicator ใช้ solid semantic color; login gate ใช้ opaque scrim แทน blur
- [x] **F4 — Flat charts + generated artwork:** แทน SVG/Recharts area gradients ด้วย solid fill + opacity; ถอด SVG tooltip blur filter; เปลี่ยน icon/OG/share artwork และ prototypes เป็นพื้นทึบ
- [x] **Verification:** source audit เหลือ 0 rendered gradient และ 0 visual blur/backdrop/filter (ยกเว้น `next/image` placeholder); Browser 320/390/768/1440 Light/Dark บน Home/Card/Portfolio/Profile/Honey/Admin/Compare + modal/dropdown/chart; lint/test/TypeScript/build
- [x] **F5 — Locked exception: overhead light:** คืน ambient light กลางจากขอบบนเพียงจุดเดียวใน `PageContent` พร้อมสีแยก Light/Dark; ส่วน mask, backdrop blur, section gradient และ component blur ยังต้องเป็นศูนย์
- [x] **F5 Verification:** source/runtime มี rendered gradient+blur เพียง `.hero-search-glow` หนึ่ง element ต่อหน้า; Browser 390/1440 Light/Dark + no overflow/console error; lint/test/TypeScript/build

### Card-detail mobile floating CTA removal — 2026-07-12

> ผู้ใช้สั่งเอา CTA ที่ลอยตามหน้าจอเมื่อเลื่อนลงออก; CTA ซื้อขาย/เพิ่มพอร์ตใน hero buy box ต้องคงอยู่ และ Desktop ต้องไม่เปลี่ยน

- [x] **B1 — Remove floating behavior:** ถอด `CardDetailStickyBuy`, sentinel และ `useStickyBuy` wiring ออกจาก runtime เพื่อไม่ render fixed bar และไม่ผูก scroll/resize observer
- [x] **B2 — Remove reserved gap:** ลด mobile bottom padding ที่เคยเผื่อ sticky CTA โดยให้ global `PageContent`/footer รับผิดชอบระยะหลบ bottom nav ตามเดิม
- [x] **Verification:** Browser card detail ที่ 390px เลื่อนทั้งหน้าแล้วไม่มี floating CTA แต่ inline CTA ยังครบ; 768/1440 layout เดิม, ไม่มี overflow/console error; lint + test + TypeScript + build

### Price direction color parity — 2026-07-12

> ประวัติรอบก่อน: ผู้ใช้เคยเลือกให้ Light เหมือน Dark แต่ข้อสรุปนี้ถูกแทนด้วย readability correction ด้านล่างหลังดูภาพจริง

- [x] **K1 — Shared market palette:** ให้ Light `--price-up/down` และ text roles ใช้ `#46D68B / #FF6155` เหมือน Dark เพื่อครอบคลุม PriceTag, table, portfolio, chart และ card detail
- [x] **K2 — Status isolation:** แยก `--success-text` และ `--danger-text` ใน Light ให้คง accessible สีเดิม จึงไม่กระทบ form feedback, error และสถานะระบบ
- [x] **Verification:** Browser Light/Dark บน Home/Card Detail/Portfolio ได้ computed market colors ชุดเดียวกัน แต่ success/error status Light คงสีเดิม; ไม่มี overflow/console error; lint + test + TypeScript + build

### Price direction Light-mode readability correction — 2026-07-12

> หลังดูภาพจริง ผู้ใช้ให้ความสำคัญกับการอ่านบนพื้นขาวมากกว่า palette parity; งานนี้แทนข้อสรุป K1 เฉพาะ Light mode โดย Dark mode ต้องคงเดิม

- [x] **L1 — Split market roles:** Light chart/fill ใช้ `#34C759 / #FF3B30` และข้อความราคาใช้สีเข้ม `#187A3E / #C5221F`; consumer ที่เคยใช้ primitive เป็นข้อความเปลี่ยนมาใช้ text role
- [x] **L2 — Preserve semantics:** Dark price palette คง `#46D68B / #FF6155`; Light success/danger แยกค่าคงที่จาก market token และ share/OG surfaces ใช้บทบาทสีตรงหน้าที่
- [x] **Verification:** Browser Home/Card Detail/Portfolio ที่ 390/1440px ทั้ง Light/Dark ไม่มี overflow/console error; lint 0 errors + test 132/132 + TypeScript + build 155/155

### Price direction Light-mode saturation correction — 2026-07-12

> สีข้อความ Light รอบก่อนอ่านง่ายแต่หม่นเกินไป; เพิ่ม saturation โดยยังรักษา WCAG AA บนพื้นขาว และไม่เปลี่ยน chart/fill, status หรือ Dark mode

- [x] **N1 — Vivid readable text:** Light price text ใช้เขียว `#00853D` และแดง `#D93025` (contrast ≥4.5:1 บนขาว)
- [x] **N2 — Scope isolation:** chart/fill Light, success/danger Light และ price palette Dark คงเดิม
- [x] **N3 — Soft-surface contrast:** chip/soft fill ใช้ text-on-soft hue เดียวกันที่เข้มกว่า เพื่อรักษา contrast ≥4.5:1 ถึง fill 22% โดยไม่ทำให้ข้อความราคาบนพื้นปกติหม่นลง
- [x] **Verification:** Browser Home/Card Detail/Portfolio/Market Overview/Watchlist soft chips ที่ 390/1440px ทั้ง Light/Dark ไม่มี overflow/console error; lint 0 errors + test 132/132 + TypeScript + build 155/155

### Search result facet parity — 2026-07-15

> หน้า `/opcg/search` ใช้ฐานข้อมูลการ์ดเดียวกับหน้าแรก แต่มีเพียง rarity/version และแสดง option ที่ไม่มีผลสำหรับคำค้น; ปรับให้หมวดตรงกับหน้าแรกและ scope ตาม query + game โดยไม่เปลี่ยน filter เฉพาะ domain ของ Marketplace/Watchlist

- [x] **SF1 — Facet data:** ส่ง rarity/type/color/variant availability ที่คำนวณจากคำค้นและเกมปัจจุบัน; ซ่อน option 0 ผล, rarity รวม base+parallel family และจำกัด set/results ด้วย game scope
- [x] **SF2 — Search controls:** เพิ่ม Type/Color/Price ใน FilterModal เดิม, ต่อ state/request/reset/badge ให้ครบ และคง SetPicker/Sort ไว้นอก modal
- [x] **SF3 — Multicolor indicator:** คืนวงกลมหลายสีแบบ gradient ที่ canonical `CARD_COLORS` ให้ Search, Set detail และ card picker ใช้ภาพเดียวกัน
- [x] **Verification:** targeted unit/API tests + lint + test + TypeScript + build; Browser `/opcg/search?q=op13` ที่ 390/768/1440px ทั้ง Light/Dark ตรวจ apply/reset, long labels, no overflow และ console 0 errors
- [x] **SF4 — Search toolbar affordance:** เพิ่ม visual outline/fill ที่ชัดให้ Filter และ Sort เฉพาะแถบผลค้นหา โดยคง hitbox/ความสูง compact เดิม และไม่เปลี่ยน toolbar หน้าอื่น
- [x] **SF4 Verification:** ตรวจ `/opcg/search?q=op13` ที่ 390/768/1440px ทั้ง Light/Dark, focus/dropdown/no overflow พร้อม lint + test + TypeScript + build
- [x] **SF5 — Search SetPicker overlay:** ปลด overflow clipping เฉพาะ controls Surface ให้ Set dropdown วางเหนือผลลัพธ์ได้ โดยรักษามุมล่างของ toolbar และคง table Surface ที่ต้อง clip ไว้เดิม
- [x] **SF5 Verification:** ตรวจ open/select/outside-close ที่ 320/390/768px ทั้ง Light/Dark, popup width/overlay hit-test/no new horizontal overflow พร้อม lint + test + TypeScript + build

### Watchlist price-check UX — 2026-07-15

> ทำให้ `/watchlist` เช็กราคาและจัดการแจ้งเตือนได้เร็วขึ้น โดยคง API/schema/dependency/config เดิม, ไม่ลบไฟล์ และไม่แตะงาน Search ที่ค้างใน shared toolbar

- [x] **WU1 — Shared shell:** เรียง H1 → canonical Tabs → context/summary → controls → results; sync เฉพาะ `tab` ใน URL โดยรักษา query อื่น และให้ CTA บนหัวเปลี่ยนตามแท็บ/สถานะข้อมูล
- [x] **WU2 — Cards controls:** ทำ summary compact, period อยู่ใน context band, SetPicker เลือกทีละชุดตามเกม, responsive toolbar 2 แถวบนมือถือ/แถวเดียวบน desktop และ FilterModal ใช้ draft Apply/Reset/Cancel จริง
- [x] **WU3 — Cards results/states:** List มือถือทั้งแถวเปิดรายละเอียด, desktop เป็น semantic table, Grid เหลือ Compare + More, selection bar แทนหัวผลลัพธ์, แยก loading/error/empty/filtered-empty และ sync `watchlist-store`
- [x] **WU4 — Alerts:** ใช้ shell/H2 เดียวกับหน้า, คง active/history, game filter, dialog และ deep link เดิม พร้อม controlled dialog/page status
- [x] **WU5 — Tests + verification:** unit 20 ข้อเฉพาะงาน + ทั้งชุด 195/195, lint 0 errors, TypeScript/build/diff-check ผ่าน; Browser Cards+Alerts ไม่มี overflow/touch target หลุดที่ 320/390/640/768/1024/1440px และแถวแรก 390px อยู่ที่ 452/417px — ภาษา EN/JP ตรวจ copy+build, theme ใช้ semantic tokens เดิมโดยไม่เพิ่มสี hardcode
- [x] **WU6 — Context declutter (2026-07-16):** เอามูลค่าราคาอ้างอิงและ mover chips ขึ้น/ลงออกจาก context band พร้อมถอด logic คำนวณที่ไม่ใช้; Browser 390/1280px ไม่มี overflow, period ยังแตะได้ 44×44px และ console 0 errors

### Watchlist flat results-first — 2026-07-16

> ลดชั้นก่อนถึงรายการให้เหลือ H1 → Tabs → Game rail → Controls → Results; คง behavior/API/schema/dependency/config เดิม และไม่ทับงาน Search/Portfolio ใน shared worktree

- [x] **WF1 — Cards composition:** เอา context/summary Surface ออกจาก runtime, game rail ไม่มี count ซ้ำ และย้าย period ไปอยู่กับ result controls
- [x] **WF2 — Responsive controls:** มือถือคง Search+Set / Sort+Filter สองแถวและ result controls สองแถว; `sm+` ยุบ result controls เป็นแถวเดียว โดย selection bar แทนทั้งแถว
- [x] **WF3 — Alerts hierarchy:** เอาหัวจัดการที่ซ้ำออก, game rail ไม่มี count และใช้ semantic H2 แบบกะทัดรัดสำหรับ Active/History พร้อม count
- [x] **WF4 — States + tests:** ปรับ skeleton/mock ให้ mirror layout ใหม่และเพิ่ม regression tests สำหรับ period, selection replacement และ heading hierarchy
- [~] **WF Verification:** lint 0 errors + test 219/219 + TypeScript + build 156/156 + `git diff --check` ผ่าน; browser geometry/keyboard/touch/no-content-overflow ผ่าน 320/390/640/768/1024/1440px ใน TH/Dark และ Light/console รอบสุดท้ายผ่านแล้ว — เหลือ smoke EN/JP เต็มหน้า

### Canonical compact controls + game rail — 2026-07-16

> แก้จากภาพใช้งานจริง: time filter และ List/Grid ใช้ component กลางอยู่แล้วแต่ geometry เฉพาะหน้า/ค่า responsive กลางทำให้สัดส่วนไม่เป็นระบบ; game rail ซ่อน All + One Piece เมื่อมีข้อมูลเกมเดียว ทั้งที่ต้องสื่อโครงหลายเกมให้ชัด

- [x] **CC1 — Whole-site audit:** ตรวจ period/range `SegmentedControl`, `ViewModeControl` และ `GameFilterChips` ทุก caller เพื่อแยกปัญหาที่รากออกจาก override เฉพาะหน้า
- [x] **CC2 — Canonical proportion:** ให้ period/range ใช้ compact visual shell กลาง, icon-only view segments สมส่วน และคง hit target ≥44px ทุก viewport ใต้ `md` โดยถอด geometry override ของ Watchlist
- [x] **CC3 — Canonical game rail:** เมื่อมีเกมจริงอย่างน้อยหนึ่งเกมให้แสดง “ทุกเกม” + เกมนั้นเสมอ, ใช้ชื่อ “One Piece” จาก config กลาง และคง Pokémon “เร็ว ๆ นี้” เป็น teaser ที่ไม่ปน radiogroup
- [x] **CC4 — Tests + verification:** เพิ่ม regression tests สำหรับ visual contract/single-game rail/keyboard/empty range; Browser Watchlist/Home/Search/Card Detail/Pricing ที่ 390/640/768/1440px และ Watchlist matrix เดิม 320/1024px ผ่าน Light/Dark, keyboard, touch target และ no overflow; lint 0 errors + test 219/219 + TypeScript + build 156/156 + diff-check ผ่าน

### Watchlist control alignment follow-up — 2026-07-16

> เก็บรายละเอียดจากภาพใช้งานจริง: ไอคอนใน ViewMode active ต้องอยู่กึ่งกลางพอดี และ period ต้องมีไอคอนนำหน้าเหมือน visual language เดิม โดยแก้ที่ canonical component เท่าที่จำเป็น

- [x] **CA1 — Root-cause audit:** วัด DOM จริงพบ active frame อยู่กลาง แต่ hidden label wrapper ยังเป็น flex child จึงสร้าง gap และดัน SVG ซ้าย 2px; ตรวจ period caller, skeleton/mock และ shared callers ครบ
- [x] **CA2 — Canonical alignment:** icon-only ViewMode ไม่ render label wrapper ที่ซ้ำกับ `aria-label`; คืน `TrendingUpDown` นำหน้า Watchlist 24h/7d/30d และ sync mock/skeleton โดยคง keyboard/ARIA/touch target เดิม
- [x] **CA3 — Tests + verification:** regression tests ล็อก icon-only/showLabels/period icon; Browser 320/390/768/1440px Light/Dark ได้ SVG↔button center delta 0px, ไม่มี overflow/console error; lint + test 233/233 + TypeScript + build 156/156 + diff-check ผ่าน

### Watchlist selected-tab edge alignment — 2026-07-16

> เก็บ selected state จากภาพใช้งานจริง: ปุ่มแท็บสูงกว่าราง แต่ underline ถูกเลื่อนต่ำกว่าเส้นฐาน จึงดูเป็นเส้นสองชั้นที่หลุดจากตัวเลือก; แก้เฉพาะ caller Watchlist เพื่อไม่เปลี่ยน Tabs กลางของหน้าอื่น

- [x] **TA1 — Reproduce + falsify:** วัด DOM จริงที่ 390px พบ TabsList สูง 32px, trigger สูง 44px และ underline `bottom: -5px`; ทดลองแยกแก้ความสูง/ตำแหน่งแล้วไม่พอ ต้องจัดทั้งสองค่าให้ใช้ edge เดียวกัน
- [x] **TA2 — Caller-specific alignment:** ให้ Watchlist TabsList สูงเท่ากับ trigger 44/36px ด้วย orientation modifier ที่ merge กับค่า base ตรงตัว และวาง active underline ทับเส้นฐาน โดยคง canonical Tabs ของ caller อื่น
- [x] **TA3 — Tests + verification:** regression test ล็อก class merge ของ list/indicator; Production Browser Cards/Alerts ที่ 390/640/768/1440px ทั้ง Light/Dark ได้ list=trigger 44/36px, indicator `bottom: 0`, ไม่มี overflow/error overlay; lint 0 errors + test 243/243 + TypeScript + build 156/156 + diff-check ผ่าน

### Watchlist minimal hierarchy — 2026-07-16

> ปรับภาพรวมตามหน้าแรก: ลด navigation/controls ที่ซ้ำ, ให้รายการลอยบน canvas และแสดงคอลัมน์เสริมเฉพาะเมื่อมีข้อมูลจริง โดยรักษา period icon, canonical controls, URL tabs และ flow เพิ่ม/แก้ไขเดิม

- [x] **WM1 — Home comparison:** เทียบ DOM/geometry หน้าแรกกับ Watchlist จริง และแยกปัญหาเป็น hierarchy หลายชั้น, panel ซ้ำ และคอลัมน์ว่าง
- [x] **WM2 — Results-first composition:** ตัด breadcrumb ซ้ำ, ลดน้ำหนัก CTA, ซ่อน game rail ที่ไม่มีทางเลือกจริง และยุบ game/context/display ให้อยู่แถวเดียวกัน
- [x] **WM3 — Flat useful results:** ทำ desktop table เป็น canvas, ซ่อน history เมื่อไม่มี sparkline และรวม pin/alert กับ action cell เพื่อตัด status column
- [x] **WM4 — State parity:** ปรับ loading/guest preview/Alerts/tests ให้สะท้อนโครงใหม่โดยคง touch target มือถือและ edit/empty/error behavior
- [x] **WM Verification:** Browser Cards/Alerts + list/grid ที่ 390/640/768/1440px Light/Dark ไม่มี overflow/console error; lint 0 errors (30 warnings เดิม) + test 270/270 + TypeScript + build 156/156 + diff-check ผ่าน

### Portfolio Manager — 2026-07-15

> เปลี่ยน `/portfolio` จาก dashboard ที่ซ้ำยอดเป็น manager สำหรับเลือกและจัดการพอร์ต โดยคง `/portfolio/[id]` เป็นหน้ารายละเอียด และรักษางาน Search/Watchlist ที่ค้างใน worktree ไว้ทั้งหมด

- [x] **PM1 — Server contract:** `GET /api/portfolio` ส่ง effective tier + quota จาก server (`null` = ไม่จำกัด), `POST` บังคับเลือก privacy และ mutation ส่งผลสำเร็จ/ล้มเหลวแบบมี status/error
- [x] **PM2 — Atomic batch add:** เพิ่ม `POST /api/portfolio/items/batch` ที่ตรวจ owner/quota/card/holding ทั้งชุดก่อนเขียนใน transaction; holding เดิมไม่กิน quotaเพิ่มและ retry ไม่สร้างรายการซ้ำ
- [x] **PM3 — Shared creation/quick add:** เพิ่ม `PortfolioCreateForm/Dialog` (ชื่อ + privacy ไม่มีค่าเริ่มต้น), สร้างสำเร็จเปิด batch pickerของพอร์ตนั้นทันที และ quick-add จากหน้าการ์ดไม่สร้าง `Default` หรือเลือกพอร์ตแรกเงียบ ๆ
- [x] **PM4 — Responsive manager:** PageHeader ขนาดเล็ก + summary กะทัดรัด; mobile rows ใต้ `sm`, desktop table ตั้งแต่ `sm`, cost ที่ `lg`, explicit open/add/manage actions, copy/item/game metadata และ quota upgrade dialog
- [x] **PM5 — Reliable management:** rename รอ API และคงฟอร์มเมื่อ fail; private→public ต้อง confirm, public→private ทำทันที พร้อม toast/rollback; error+Retry มาก่อน empty state
- [x] **PM6 — Shared privacy:** ย้าย hide-balance เข้า persisted UI store ให้ Hub/Detail ใช้ค่าเดียวกันและ mask ยอดเงิน/P&L ครบ; skeleton/auth/guest preview ใช้รูปทรง manager เดียวกัน
- [x] **PM7 — Copy + kit + tests:** เติม TH/EN/JP, อัปเดต canonical Component Kit และเพิ่ม API/unit/markup tests สำหรับ privacy/quota/batch/responsive links/counts/masking
- [x] **PM Verification:** lint + test + TypeScript + build + `git diff --check`; browser 390/640/768/1440px, Light/Dark, TH/EN/JP, keyboard/focus, touch target ≥44px, create→auto-add, manage/quota/error/retry และ hide balanceข้าม Hub→Detail→reload

### Portfolio Manager — visual hierarchy round 2 — 2026-07-16

> ปรับตามภาพใช้งานจริง: ลดพื้นที่ว่างและตัวเลขซ้ำ, ทำความสัมพันธ์ระหว่างยอดรวม/ซ่อนยอด/กำไรให้ชัด และลด action ที่แย่งน้ำหนักกัน โดยไม่เปลี่ยนสูตรหรือ flow ที่ทำไว้ใน PM1–PM7

- [x] **PM8 — Compact snapshot:** ยุบ summary เป็น snapshot ซ้าย=มูลค่ารวม+จำนวนพอร์ต/รายการ/ใบ, ขวา=กำไร+ROIและต้นทุน; ย้ายปุ่มซ่อนยอดมาอยู่ติดกับยอดที่ควบคุม
- [x] **PM9 — Rich manager rows:** ทำ mobile card และ `sm+` table row ให้ thumbnail/name/privacy/count เป็นกลุ่มเดียว, แยก value กับ P/L ให้อ่านเร็ว, ลด action hierarchy เหลือเปิดพอร์ตเด่น + เพิ่มการ์ดรอง + manage menu
- [x] **PM10 — Header/copy/state parity:** เมื่อเต็มโควตาใช้ข้อความอัปเกรดที่บอกผลชัด, เพิ่มคำช่วยเลือกพอร์ต TH/EN/JP และปรับ skeleton/guest preview/empty ให้ mirror composition ใหม่
- [x] **PM11 — Round-2 verification:** อัปเดต markup tests แล้วตรวจ 390/640/768/1440px, Light/Dark, TH/EN/JP, keyboard/focus/touch target/no overflow/no hydration error พร้อม lint/test/TypeScript/build/diff-check

### Portfolio Manager — minimal hierarchy round 3 — 2026-07-16

> ลด Hub ให้เป็นหน้าสำหรับเลือก/เปิด/เพิ่ม/จัดการพอร์ตจริง ๆ: ไม่มี dashboard ซ้ำกับแถว และไม่แสดงผลตอบแทนรวมเมื่อข้อมูลราคา/ต้นทุนไม่ครบ

- [x] **PM12 — Honest financial rollup:** เพิ่มตัวคำนวณ coverage กลางสำหรับมูลค่า/ต้นทุน/P&L/ROI; ค่า performance เป็น nullable เมื่อข้อมูลไม่ครบ และให้ Detail/Share/Breakdown ใช้ guard เดียวกันโดยไม่แตะ schema/API contract
- [x] **PM13 — Minimal manager hierarchy:** เหลือ H1 เดียว + toolbar + responsive list เดียว; 0 พอร์ตมี CTA เดียว, 1 พอร์ตไม่มียอดรวม, 2+ พอร์ตแสดงยอดรวมหนึ่งบรรทัด และตัด table/P&L/ROI/cost/item count/game badge/open button ออกจาก Hub
- [x] **PM14 — State/i18n parity:** แถวใช้รูปไม่เกิน 2 ใบ + privacy/copy count/estimated value + add/manage 44px; skeleton/guest/error/empty/masking และ TH/EN/JP mirror โครงใหม่
- [x] **PM15 — Minimal-manager verification:** เพิ่ม unit/markup tests แล้วตรวจ 390/640/768/1440px, Light/Dark, TH/EN/JP, keyboard/focus/touch target/no overflow พร้อม lint/test/TypeScript/build/diff-check

## 🎨 Redesign (in-place · ทิศเต็มใน [VISION.md](VISION.md) · **ไม่มีเวอร์ชัน v1/v2**)

> แก้ของเดิมทีละ surface ตาม spine VISION §7 · ทุก surface = adopt atom kit + verify (tsc/lint/build/test) + เปิดดูจริง · ⚠️ ข้อที่แตะ schema = เบสอนุมัติก่อน
> 📌 กฎ design-system: การ์ดใหญ่ = `.panel` · `surface-*`/`hairline` = chip/control/nested · `.hairline` เป็น unlayered → อย่าผสมกับ ring/shadow บน element เดียว

### Foundation — token + atom kit + states (บล็อกทุก surface)

- [x] warm primitive kit + `--p-*` → `globals.css` (dark+light) · proto เหลือแต่ `.proto-root` var
- [x] token motion/elevation: `--dur-fast/base/slow` + `--ease-chrome/spring` + `--elev-flat/raised/overlay` (light+dark) · wire `.ease-chrome`/`.rise` → token · refactor button base → `duration-[var(--dur-base)] ease-[var(--ease-chrome)]` · verify ✓ (เหลือ: ทยอย migrate 20 ไฟล์ที่ยัง hardcode `duration-*` ตอนแตะหน้านั้นๆ)
- [ ] atom kit (สร้าง/รวม): `PriceTag` · `HeroNumber` · `GradeChip`/`GradeRail` · `EditionToggle` · `SourceBadge` · `SellerChip` · `PriceLadder` · `CustodyTimeline` · `EventCard` _(มีแล้ว: ListRow · Surface · Skeleton · AdInventorySlot)_
- [ ] state system: skeleton รูปร่างตาม content ทุก async + `EmptyState`+CTA · ศูนย์ spinner
- [x] **iOS design language tokens** (2026-07-03 · ส่วนหนึ่งของ showcase ด้านล่าง): `.hairline-b` (คู่ `.hairline-t` เดิม) · safe-area utilities (`.pt/pb/pl/pr-safe`) · `.text-large-title` (34px collapsing-nav large title) · `.frost` มีอยู่แล้วนำมาต่อยอด — ไม่แตะของเดิม

### 🍎 iOS Design Language — Showcase ✅ (2026-07-03 · เบส: "ทำ UXUI ทั้งเว็บทันสมัย มือถือแบบ Apple iOS ลองทำตัวอย่างมาดู")

> ทิศ = "iOS grammar × Meecard skin" — เอาไวยากรณ์ iOS (large title collapse, frosted chrome, grouped-inset list, safe-area, tap≥44px) มาทับตัวตน espresso+honey เดิม (VISION §1 ห้ามเปลี่ยน) · scope ใหญ่เกินกวาดทั้งเว็บรอบเดียว → proto-first ที่ `/proto/ios/*` ก่อน (เปิดดูไม่ต้อง login)

- [x] token additions ใน `globals.css` (ดูด้านบน) — ผ่าน Impeccable hook หลัง suppress 2 finding เดิม (`--ease-spring` bounce ที่ VISION.md ตั้งใจ + `.section-heading` side-tab เดิมนอก scope) ด้วย reason ที่บันทึกใน `.impeccable/config.json`
- [x] shell กลาง `src/app/proto/ios/` — `IosShell` (frosted collapsing nav + back-button อัตโนมัติ + bottom tab bar มือถือ/side rail desktop ตรง VISION §2) · atoms `LargeTitle`/`GroupedSection`/`GroupedRow` · mock data กลาง `_data.ts` (การ์ดจริงจาก R2/pokemontcg.io)
- [x] 6 หน้า showcase: ตลาด (home) · portfolio hub · portfolio detail (`SegmentedControl`+sparkline) · card detail (grade chips กดสลับราคา+chart+sticky buy bar เดียวที่ใช้ทอง) · watchlist (pin/alert micro icons) · more/settings (grouped-inset เต็มรูปแบบ) — home เขียนเองเป็น reference แล้ว delegate 5 หน้าที่เหลือให้ subagent ขนาน (ส่ง shell+atoms+mock ที่ล็อกแล้วกันดริฟต์)
- [x] แก้บั๊กที่เจอตอน verify: `react-hooks/set-state-in-effect` ใน shell (lazy initializer แทน setState ใน effect) · RSC serialization error ใน more/page (Server Component ส่ง icon component เข้า client `GroupedRow` ไม่ได้ → เปลี่ยนเป็น `"use client"`) · `next/image` domain ของ `images.pokemontcg.io` ขาดใน `next.config.ts` (เพิ่ม 1 entry) · unify hide-balance เป็น dot `••••` ทั้งหมด (ตรง `MASKED` convention จริง)
- [x] verify: tsc0 · lint0 (34 warning เดิม) · test56 · build✓ (6 route ขึ้นจริง) · impeccable detect [] · curl smoke 200 ทุก route
- [x] **⚠️ เบสเคาะทิศ iOS โอเค แต่สั่งต่อ**: "อยากได้เว็บก็ดี มือถือก็ดี เอา UI ปัจจุบันมาปรับ" → "ทำ proto ก่อนนะ" (ยังไม่ให้ rollout หน้าจริง)
- [x] **Proto v2 — desktop จริง** (2026-07-03) — `IosShell` ตัด side rail (จำลอง iPad) ออก เปลี่ยนเป็น **top header แบบเว็บจริง** (จำลองโครง `header.tsx` จริง: logo·nav links·search·avatar, frost ตอน scroll, active=honey pill) · เพิ่ม desktop composition ต่อจอ (มือถือไม่แตะเลย): ตลาด `lg:grid-cols-6` movers + 7d column · portfolio hub `lg:grid-cols-3` · portfolio detail insights `lg:grid-cols-2` + ปุ่มเพิ่มการ์ดย้ายเข้า header trailing · card detail ห่อ `max-w-6xl` ให้ตรง header (sticky rail offset พอดีกับ header 56px โดยบังเอิญ) · watchlist +7d column · more คงเดิม (max-w-2xl ถูกอยู่แล้ว) · verify: tsc0/lint0/test56/build✓/detect[]/curl smoke ครบ
- [x] **⚠️ เบสถาม-ยืนยันทิศสุดท้าย**: "อยากได้ desktop เดิม แต่มือถือเป็น iOS ทำไม่ได้หรอ" → ยืนยันทำได้ (responsive ปกติ, desktop/มือถือมี markup แยกกันอยู่แล้วหลายจุด) → เบสสั่ง "เริ่มเลย"
- [x] **Rollout หน้าจริง — Batch 0+1 (2026-07-03)**: **desktop คงเดิมเป๊ะทุกจุด · มือถือ (<md) เท่านั้นที่เปลี่ยน**
  - Batch 0: ย้าย `GroupedSection`/`GroupedRow` จาก proto → `src/components/ui/grouped-list.tsx` — `GroupedRow` delegate ไปที่ `ListRow` เดิม (ไม่ duplicate row primitive)
  - Batch 1a chrome มือถือ: `header-mobile.tsx` transparent→frost ตอน scroll (pattern เดียวกับ desktop header) · `page-header.tsx` ใช้ `.text-large-title` (token มี media query ในตัว 34px มือถือ→32px ที่ ≥768px ตรงกับ `.text-h1` เดิมเป๊ะ = desktop ไม่เปลี่ยน) · `bottom-nav.tsx` ใช้ `.pb-safe` แทน arbitrary value
  - Batch 1b home มือถือ: `mobile-card-item.tsx` thumbnail square→portrait `aspect-[63/88]` (ตรง VISION การ์ด=พระเอก) + `min-h-[52px]` — ฟีเจอร์เดิมครบ (rank/sparkline/ราคา/delta) · ตั้งใจข้าม toolbar/tabs ใน `home-market-overview.tsx` (class ใช้ร่วม mobile/desktop ไม่แยกชัด เสี่ยงกระทบ desktop)
  - verify: tsc0/lint0/test56/build✓/detect[]/curl smoke ครบทั้งหน้าจริงและ proto
- [x] **⚠️ ยังไม่ได้เปิด browser จริงดู** (tool ไม่พร้อม session นี้) — เบสต้องเช็ค desktop (ต้องเหมือนเดิม) + มือถือ (ต้องเป็น iOS) ก่อนไป batch ถัดไป → เบสถาม "desktop/มือถือควรแยกดีไซน์กันมั้ย" ยืนยันทิศเดิม สั่งไปต่อโดยยังไม่เปิดดูเอง
- [x] **Batch 2 — Settings/More มือถือ (2026-07-03)**: `src/app/settings/page.tsx` มือถือ (`md:hidden` เท่านั้น) — flat link list → **grouped-inset table view** จริง (`GroupedSection`/`GroupedRow`) ตาม `/proto/ios/more` ที่พิสูจน์แล้ว: identity row เป็นการ์ดของตัวเอง + 2 กลุ่ม "ทั่วไป"/"เพิ่มเติม" เป็น `GroupedRow` (icon-circle+chevron+≥52px tap) + title `.text-large-title` · desktop sidebar+content ไม่แตะ · ไม่เพิ่ม i18n key · verify tsc0/lint0/test56/build✓/detect[]/curl smoke ครบ
- [x] **สำรวจ batch ถัดไป (card detail/portfolio/watchlist) → สรุปไม่แตะเพิ่ม**: อ่านโค้ดจริงแล้วพบว่าทั้ง 3 หน้าผ่าน mobile redesign มาแล้ว (P1–P2 + Hub/Detail split + Panel restore) — thumbnail portrait อยู่แล้ว, ได้ large-title/frost header ฟรีจาก Batch 1 (chrome กลาง) · บังคับ `GroupedRow` เข้า watchlist จะตัดฟีเจอร์ checkbox/pin/alert/actions-menu ทิ้ง (ไม่มีที่ใส่ใน primitive navigation-row) · portfolio/card-detail เป็นหน้า data-dense ไม่ใช่ navigation menu จึงไม่เข้ากับ grouped-inset grammar (นั่นสำหรับ Settings-style list เท่านั้น) · รายละเอียดเต็มใน PROGRESS.md
- [x] **Batch 3 — "More" sheet มือถือ (2026-07-03)**: `mobile-menu-sheet.tsx` (drawer จากแท็บ "เพิ่มเติม" ใน bottom-nav) เขียนใหม่เป็น grouped-inset เต็มรูปแบบ — user block เป็นการ์ด (กด→`/settings`) · ทุก section เป็น `GroupedSection`/`GroupedRow` icon-circle สี semantic · พฤติกรรมเดิมครบ (auth gate/flag gate/badge/pending dot/Select ภาษา-สกุลเงิน/theme toggle/close-on-nav) · ปรับ primitive: `ListRow` รองรับ `href`+`onClick` พร้อมกัน, `GroupedRow` +`active`, `GroupedSection` +`className` · sheet bg `bg-muted/30`+กว้าง 320px · verify tsc0/lint0/test56/build✓/detect[]/curl ครบ
- [x] **Batch 4 — "เพิ่มเติม" เป็นหน้าเต็ม `/more` (2026-07-03)**: ตาม iOS HIG (แท็บ = destination ห้ามเปิด overlay — เบสถาม "หน้าเต็มดีกว่ามั้ยตามหลัก" → ใช่) — สร้าง `/more` (เนื้อหา grouped-inset ชุดเดียวกับ sheet Batch 3 · `useHeaderData` เดิม · URL จริง back/refresh ได้) · bottom-nav "เพิ่มเติม" → `TabLink` ปกติ · **ลบ `mobile-menu-sheet.tsx`** (git เก็บที่ `ea4b02d`) + ลบ `mobileMenuOpen`/`toggleMobileMenu` ตายแล้วจาก ui-store · verify tsc0/lint0/test56/build✓ (route ขึ้น static)/detect[]/curl 200
- [x] **`/more` desktop 2-column polish (2026-07-03)**: เบสเปิดจอกว้างเห็น `/more` เป็นคอลัมน์เดียวยืดๆ ถามว่าตามหลักควรทำเป็นหน้าเลยมั้ย → สรุป: ใช่ ตามหลัก responsive ห้าม redirect ตามขนาดจอ, จุดที่ต้องแก้จริงคือ layout ไม่ใช่ยกเลิกการเป็นหน้า — `more-client.tsx`: container `md:max-w-4xl` + section ที่ไม่ใช่ user-card ห่อด้วย `flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-x-6` (มือถือ flex คอลัมน์เดียวเป๊ะเหมือนเดิม) + sign-out `md:col-span-2` · verify tsc0/lint0/test56/build✓/detect[]/curl(grep คลาสจริงใน HTML)
- [x] เบสเปิดดูจริง: มือถือ `/more` ไม่เปลี่ยนจากเดิม + desktop กว้างเป็น 2 คอลัมน์แล้ว (ยืนยันผ่าน browser จริงใน audit ด้านล่าง)
- [x] **Mobile UX full audit ด้วย browser จริง (2026-07-03)** — เบสสั่ง "ตรวจสอบให้ครบทุกหน้าทุกส่วนว่ารองรับมือถือหมดรึยัง รวม UX จริง" — เปิด browser ที่ viewport 390×844 ไล่ตรวจ ~30 หน้า (screenshot + DOM overflow-check script + hydration-error watch + กด UX flow จริง: portfolio tabs, add-card dialog, trending/search filter) เจอบั๊กจริง 5 ตัว แก้ครบ:
  - `scroll-to-top.tsx`: regex เช็ค card-detail route เขียนก่อนมี `/[game]/` namespace เลยไม่ match `/opcg/cards/x` + middleware rewrite ทำ server/client เห็นคนละ pathname → hydration mismatch จริง → derive จาก `isGamePrefix()` + gate `useHydrated()`
  - `header-mobile.tsx`: lazy initializer อ่าน `window.scrollY` ตรงๆ เสี่ยง mismatch ถ้า scroll position เหลือตอน mount → gate `useHydrated()` เดียวกัน
  - `portfolio-hub-card.tsx`: `relative z-10` บน div ธรรมดา (name/price, thumbnail row) ลอยทับ stretched-link ทำให้แตะกลางการ์ดไม่นำทาง (ยืนยันจริงด้วยคลิกอัตโนมัติ) → ถอด z-index ที่ไม่จำเป็นออก
  - `trending-tabs.tsx`: segmented control 3 ปุ่ม label ยาวล้น 390px จริง (ทั้งหน้าเลื่อนแนวนอนได้ — แย่กว่า contained scroll) → ห่อ `overflow-x-auto` ตาม pattern tab-scroll เดิม
  - `search-client.tsx`: `SetPicker` ใช้ `flex-1 min-w-0` ในแถว `flex-wrap` ถูกบีบแคบจนข้อความตัดบรรทัดซ้อนทับแทนที่จะ wrap ทั้งก้อน → `basis-full sm:basis-auto`
  - เจอแต่ไม่แก้: `DropdownMenuTrigger` hydration error จาก third-party `@base-ui/react/menu` เอง (เช็คเวอร์ชันใหม่ก่อนแตะ) · hardcoded "Home" breadcrumb ~17 ไฟล์ (อยู่ใน R3 backlog แล้ว) · portfolio best=worst เมื่อมี asset เดียวที่มีต้นทุน (ถูกตาม logic เป็น product call ไม่ใช่บั๊ก)
  - verify: tsc0/lint0/test56/build✓/impeccable detect[]/curl smoke ครบ + **verify ด้วย browser จริงทุกจุด** (screenshot ก่อน/หลัง + คลิกทดสอบยืนยัน fix การ์ดพอร์ต)
  - ยังไม่ครอบคลุม: settings sub อีก 7 หน้า, `/profile`+`/u/[handle]`, `/register`, `/market-overview`, `/about`, `/contact`, `/coming-soon`, `/raffle/winners`, honey sub-tabs — รายละเอียดเต็มใน PROGRESS.md
- [x] **Breadcrumb มือถือ → iOS back link (2026-07-03)** — เบสถาม "มือถือควรมี breadcrumb มั้ย" → ตามหลัก iOS HIG/NN:g ไม่ควร → แก้ที่ `breadcrumb.tsx` ที่เดียว: desktop trail เต็มเหมือนเดิม (`hidden md:flex`) · มือถือหน้าลูกลึก (items ≥3) ได้ปุ่ม `< หน้าแม่` แบบ settings sub-pages (derive อัตโนมัติจาก items ไม่ต้องแก้ per-page) · หน้าแท็บหลักไม่ render อะไรบนมือถือ · SEO ไม่กระทบ (JSON-LD แยก) · verify tsc0/lint0/test56/build✓/detect[] + browser จริง 4 กรณี (มือถือ deep/top-level/card-detail + desktop)
- [x] **ปุ่มย้อน → iOS pill + card detail ได้ด้วย (2026-07-03 ต่อ)** — pill `rounded-full bg-muted` ≥36px chevron honey กดเข้มขึ้น truncate ได้ · card detail ถอด mobile meta ที่ซ้ำกับ identity chips ทิ้ง เปลี่ยนเป็น pill `< [ชื่อชุด]` กลับหน้า set · verify ครบ + screenshot ทั้ง 2 หน้า
- [x] **ปุ่มย้อนขั้นสุดท้าย: ไอคอนวงกลมล้วน (2026-07-03 เบสเคาะ)** — "ไม่ต้องมีคำอะไร" → วงกลม `size-9` chevron honey เหมือนกันทุกหน้าลูกลึก · ชื่อหน้าแม่ยังอยู่ใน `aria-label`/`title` · verify ครบ + browser จริง
- [x] **Bottom-nav มือถือ: relabel + ตัดเด็ค + ปุ่มค้นหาเด่นกลาง (2026-07-03 เบสสั่งตรงๆ)** — ⚠️ **แก้ IA ที่เคย freeze 5 tab ไว้ตอน P0a** (2026-06-13): "ตลาด"→"หน้าแรก", "เรียกดู"→"ชุดการ์ด", ตัดแท็บ "เด็ค" ออก (หน้า `/decks` ยังอยู่ เข้าถึงผ่าน command search) แทนที่ด้วยปุ่มค้นหา action-only (ไม่ใช่ route) ทรงวงกลมลอยเด่น `bg-primary` เหนือแถบ เรียก `setSearchOpen(true)` เปิด `CommandSearchModal` เดิม · verify tsc0/lint0/test56/build✓/detect[] + browser จริง (screenshot + คลิกทดสอบเปิด search สำเร็จ)
- [x] **ปรับต่อ: ปุ่มค้นหา → รายการโปรดธรรมดา + `/more` ตัด header/footer (2026-07-03 เบสสั่งต่อ)** — เบสปัดปุ่มค้นหาลอยทิ้ง เปลี่ยนกลับเป็น `TabLink` ปกติ (`/watchlist`, Bookmark icon) เหมือนแท็บอื่น · `/more`: เพิ่ม `SiteChrome` component ใน `main-chrome.tsx` (ซ่อน Header+Footer เมื่อ `CHROMELESS_ROUTES` หรือ `NO_HEADER_FOOTER_ROUTES=["/more"]`) แยกจาก `MainChrome` เดิมที่เหลือคุมแค่ `BottomNav` (ซ่อนเฉพาะ chromeless — `/more` ยังโชว์ bottom-nav) · เหตุผล: `/more` มีลิงก์ไปทุกที่ในตัวเองอยู่แล้ว header/footer เว็บซ้ำซ้อน · ⚠️ เจอ dev-server cache ค้าง (ครั้งที่ 3 ใน session) แก้ไม่ขึ้นจนกว่าจะ `rm -rf .next` เต็ม + restart ใหม่ทั้งหมด (ไม่พอแค่ `.next/dev`) · verify tsc0/lint0/test56/build✓/detect[] + browser จริงหลัง restart สะอาด ยืนยัน `/more` ไม่มี header/footer เลย ส่วนหน้าอื่นไม่กระทบ
- [x] **`/more` ตัดหัวข้อ H1 + gutter มือถือทั้งเว็บ 16px→20px (2026-07-03 เบสสั่งต่อ)** — ลบ `<PageHeader title="เพิ่มเติม">` ออกจาก `more-client.tsx` (ซ้ำซ้อนหลังตัด site header ไปแล้ว) · gutter: แก้ต้นทาง `page-container.tsx` (`px-4`→`px-5` มือถือ, md/lg เดิม) + sync จุด `-mx-4`/`px-4` แบบ cancel-then-reapply ทั้งหมด 8 ไฟล์ (`grouped-list.tsx`, `header-mobile.tsx`, `settings/page.tsx`, `trending-tabs.tsx`, `sets-page-client.tsx`, `set-detail-content.tsx`, `market-overview-client.tsx`, profile public page 2 ไฟล์) ให้ตรงฐานใหม่ · verify tsc0/lint0/test56/build✓/detect[] + browser จริงวัด gutter ด้วย `getBoundingClientRect()` ยืนยัน 20px ทุกจุด + overflow-check หน้าที่มีแถวเลื่อนแนวนอนไม่ล้น
- [ ] ต่อ audit หน้าที่เหลือ (list ใน PROGRESS.md) + ตัดสินใจเรื่อง `@base-ui/react/menu` hydration bug (เช็คอัปเดตเวอร์ชันก่อน) + เปิด PR รวม branch `ui/sets-redesign` เข้า master เมื่อเบสพร้อม

### Card detail — trust core ✅ (proto visionary layout · เต็มภาพ · est-labeled fill)

- [x] **rework layout ตรง proto visionary** (เบสเลือก): grid `340px/1fr` · ซ้าย sticky = รูป+identity+EditionToggle+CTA · ขวา = hero + **3-stat box** (Last Sale·Lowest Listing·Sales 30d) + grade chips **outline-selected** + chart card + **tabs** (Comps/Listings/Population/Specs)
- [x] **เติมตัวอย่าง + ติดป้าย est ทุกตัวที่ไม่ใช่ของจริง** (เบสเลือก) — ของจริง (Raw A=Yuyutei · PSA 10=SNKR) ไม่ติดป้าย · per-stat `EstMark` (title+aria) · recent-prices ติด Sold/Listed จาก type จริง
- [x] adopt primitive pass แรก (glow image + sticky desktop + frost bar)
- [x] `GradeRail` (Raw A/B/C · PSA 10/9/8 · BGS) → re-price ทั้งหน้า · `EditionToggle` JP/EN (EN=soon) · atoms ใหม่: `grades.ts` · `grade-value`(PriceTag/Amount/Delta) · `grade-rail` · `edition-toggle` · `recent-sales` · `population-strip`
- [x] stat row: hero (เกรดที่เลือก) + Δ30d + freshness + "est." disclosure (tooltip+aria) — **เลิก fabricate ask, last-sale = ข้อมูลจริงเท่านั้น + source attribution**
- [x] Recent prices feed (ทุกแถวติดป้าย Sold/Listed จาก `type` จริง + เกรดจริงต่อแถว) · chart bound เกรด · population strip (graded, sample-labeled)
- [x] honesty/a11y fix รอบรีวิว: focus ring · aria-pressed (เลิก fake tablist) · `key={card.id}` กัน stale · sticky bar grade-aware · i18n 9 keys ×3 · Delta neutral 0%
- [x] **proto-e UX pass:** production/proto audit → left acquire rail รวมรูป+buy+asks เป็น region เดียว · chart-dominant main · quiet grade rail + JP/EN off-track · hero/triad/chart/recent receipt grade-locked · scrub morphs hero · reconciler/outlier annotations · mobile sticky bar + bottom padding · ลด number repetition บน fold · verify lint+tsc+Browser screenshots
- [x] **world-class card detail pass 2:** mobile breadcrumb → short meta · Raw/Graded/Pop mode + controlled population tab · grade rail filter ตาม mode · price instrument polish (hero/triad/chart/range controls) · sticky buy bar แสดงหลังผ่าน chart zone เท่านั้น · empty asks/action rail ใช้งานได้จริง · i18n TH/EN/JP · verify lint+tsc+Chrome screenshots+console 0
- [x] **world-class card detail pass 3:** mobile first fold กระชับขึ้น · premium/trust left rail · chart latest/high/low markers · CTA wording + empty asks ให้ตัดสินใจง่ายขึ้น · verify lint+tsc+test+Chrome screenshots+console 0
- [x] **world-class card detail pass 4:** ตัด Listings tab ใต้กราฟที่ซ้ำกับ asks rail · ทำ CTA rail ให้คนใหม่เข้าใจทันที · sticky mobile พาไป section ซื้อ/ขายบนหน้าเดียว · verify lint+tsc+test+screenshots
- [x] **world-class card detail pass 5:** เอา desktop image/acquire rail ออกจาก sticky ให้เลื่อนตามหน้า · mobile sticky CTA คงเดิมหลังผ่าน chart · verify lint+tsc+test+Browser screenshots
- [x] **world-class card detail pass 6:** minimal JP/EN edition-first reference price · Raw/PSA10 condition · market evidence จาก source จริงเท่านั้น · CTA มี label ชัด · verify lint+tsc+test+Browser checks
- [x] **world-class card detail pass 7:** แยกใต้กราฟเป็นตั้งขายล่าสุด/ขายล่าสุด · More grades แบบข้อมูลไม่พอสำหรับ PSA 9/8/BGS · ย้าย utility CTA ไปหัวหน้า · left rail เบาลง · verify lint+tsc+test+Browser checks
- [x] **world-class card detail pass 8:** price-first hierarchy จริงขึ้น · ตัด honey glow หลัง hero · left rail เหลือรูปอย่างเดียว · ย้าย market/action/trade หลังกราฟให้เต็มความกว้าง desktop · action strip เบาลงและ label ชัด · verify tsc+lint+test+Browser console/no-scroll checks
- [x] **พอร์ต proto-h (CMC dashboard) เข้าหน้าจริง `/cards/[code]`** (เบสเลือก h · in-place · reuse DB layer) ✅:
  - [x] s0: i18n keys ที่ขาด ×3 ภาษา (gradePrices·referenceSources·marketStats·range30d·volume30d·population·viewSaleHistory·viewAllGrades·medianSources·soldTab·asksTab·buyOnMeecard·cardInfo·midPrice·itemsUnit)
  - [x] s1: export `ScrubChart`/`RANGES`/`dateAtIndex` จาก `card-chart.tsx` (reuse SVG โดยไม่เอา hero wrapper)
  - [x] s2: rewrite `card-detail.tsx` เป็นโครง h — top 3-col (identity·price-instrument+GradeLadder·market-stats rail) → tabs → mid 2-col (chart กว้าง·grade-ledger rail) → แหล่งอ้างอิง(asks/sold)·ขายบน Meecard·ข้อมูลการ์ด·related · mobile sticky buy · selectedGrade(GradeKey) raw-first default แทน raw/psa10 toggle · ของ modeled ติด EstMark ทุกตัว · **raw=Yuyutei-only (กัน SNKRDUNK USD ปนราคา graded)**
  - [x] s3: verify tsc 0 · lint 0 · test 36 pass · hydration 0 (clean restart) · screenshot desktop+mobile เทียบ proto-h fidelity สูง
  - [x] s4: adversarial review workflow (5 มิติ, 16 agents) → confirmed 6/12 → แก้หมด: hero EstMark (modeled grade), `relativeTime` ใน render → `relativeDaysLabel` pure จาก `daysSinceUpdate` + mounted-gate source time, currency guard (hydrated→THB), h1→`.text-h3`, `Parallel`→i18n · +ตาเห็นเอง: source row label = เกรดจริงของแหล่ง (PSA 10) ไม่ใช่เกรดที่เลือก
- [x] **multi-source pricing + เทียบกราฟข้ามตระกูล (chunk A–C)** ✅: ตารางแหล่งราคาเต็มกว้าง (ask/sold native ¥/$ · sort · raw=Yuyutei-only) · hero verb ซื่อสัตย์ (ขายล่าสุด/ราคาตั้งขาย + source) · recent-sales = sold จริงเท่านั้น · กราฟ indexed % (`rebaseToIndex`+test) · **cross-family pill "เทียบกับ PSA 10 ⇄ Raw A"** (chart-only · ไม่แตะ table/hero · stable per-grade color · ปุ่มล้าง · caption %) · verify tsc 0/lint 0/test 40/hydration 0 + CDP screenshot desktop+mobile ทั้ง 2 branch
- [ ] **เปลี่ยน est → ข้อมูลจริง** เมื่อมี schema: Grade enum (Raw A/B/C·PSA 9/8) + edition JP/EN column + `Comp`/population tables (⚠️ เบสอนุมัติ migrate) — โครง UI พร้อม swap แล้ว

### Portfolio — honesty + Robinhood hero ✅ (รื้อใหม่ตาม VISION §5.3 · เบสสั่ง 2026-06-30 · workflow build 7 agent)

- [x] ⚠️ **netInvested** → `PortfolioSnapshot.netInvestedJpy Int?` (additive nullable · apply prod ด้วย `db execute` IF NOT EXISTS + `migrate resolve --applied` ตาม precedent P4.2 · ไม่แตะ drift M5) · cron เขียนไปข้างหน้า · snapshot เก่า null → UI fallback `totalCost`
- [x] hero (`HeroNumber` atom count-up + scrub-bind) + finger-scrub chart (pointer-events, range 1D·1W·1M·3M·1Y·ALL honey-active) + **inflow notch** (honey dot จาก isInflow) · KPI quartet 2×2 hairline · movers (เรียง abs THB swing) · holding detail sheet (tap tile บน collection grid)
- [x] **game-aware** (namespace-ready, ยังไม่แยก URL): API `card.set.game` · `gameBreakdown` ใน hook · `PortfolioGameBreakdown` (collapse เหลือ 1 เกมตอนนี้ → null · ติดเมื่อมีเกม 2) · = โครงหน้ารวม `/all/portfolio` พร้อมเสียบ
- [x] verify: tsc 0 · lint 0 err · test 56/56 · build ✓ · อ่าน component ทุกตัว fix 2 bug (scrub ไม่มี XAxis/YAxis → notch/cursor เพี้ยน + เส้นแบน · KPI ROI leak ทิศตอน hideBalance)
- [ ] ⏭️ **แยก URL `/[game]/portfolio` + `/all/portfolio` aggregate** = milestone ถัดไป (อยู่ §Multi-game + P4.3 ด้านล่าง · ทำตอน Pokémon data มา · component ชุดนี้เสียบเข้าได้เลย)
- [ ] 🧹 orphan: `portfolio-allocation-chart.tsx` (donut เก่า ไม่มี importer แล้วหลัง allocation rewrite เป็น bar) · `portfolio-item.tsx`/`portfolio-summary.tsx` ฯลฯ ที่ลบไปแล้ว — ⚠️ เบสยืนยันก่อนลบ allocation-chart
- [x] **Single-screen redesign** (2026-07-02 · เบส: "สวย ใช้ง่าย ดูโปร") — เลิกแท็บ ภาพรวม|ข้อมูลเชิงลึก → หน้าจอเดียว: money band (hero scrub + chart) → KPI quartet 2×2 (มูลค่า·ต้นทุน·P/L·ROI) → context band (movers chips + game-filter chips) → holdings → insights grid (breakdown+allocation) · `mobile-card` เหลือ 2 บรรทัด · `loading.tsx`+`portfolio-mock-preview` เขียนใหม่ mirror layout · movers เพิ่ม variant `chips` · verify tsc0/lint0/test56/build✓ + Chrome desktop+390px · ไม่แตะ API/schema
- [x] **คืนแท็บ + multi-portfolio discoverable** (2026-07-02 เย็น · เบสสั่งต่อ) — แท็บ ภาพรวม|เชิงลึก กลับมาโดยคงของใหม่ (ภาพรวม = hero สด+KPI+chips+holdings · เชิงลึก = money band scrub+breakdown+movers+allocation) · switcher dropdown เพิ่ม "+ สร้างพอร์ตใหม่" (ชนลิมิต = Lock+PRO badge → upgrade dialog) + ตัวนับ "N/max พอร์ต" · selector ชนลิมิต = upsell block ชัดเจน · i18n ×4 key ใหม่ · verify ครบ + Chrome ทดสอบ upsell flow จริง (FREE 1/1)
- [x] ~~Wow pass — hero showcase~~ (2026-07-02 ค่ำ) — การ์ดพัด+glow+stagger · **เบสปัดตก "ไม่ดีเลย" → รื้อทิ้งหมดในรอบถัดไป**
- [x] **Minimal Editorial rebuild** (2026-07-02 ค่ำ · เบส: "impeccable + minimal เข้ากับหน้าแรก/card detail") — ติดตั้ง Impeccable (`.cursor/skills/impeccable` + PRODUCT.md + eslint ignore) · ลบ hero-showcase · underline tabs (pattern home) · hero บรรทัดเดียว + stat strip แบน (pattern card-detail) · movers inline text · game tabs กลับ toolbar · ตาราง +7d sparkline (CMC) · action icons ghost · insights flat (ถอด Surface movers/allocation) · skeleton+preview ตาม · verify: detect [] + tsc0/lint0/test56/build✓ + Chrome ครบ viewport
- [x] **Panel Layout restore** (2026-07-03 · เบสส่ง screenshot เว็บ live เดิม: "เอาแบบนี้ดีกว่าแบบเดิม แต่ทำให้ดีกว่าเดิม") — Minimal Editorial ถูกปัด กลับไปกู้โครง sidebar+panel จาก commit `09ae7e5` (ก่อนหน้านั้นถูกรื้อไปหลายรอบ) แล้วเสียบฟีเจอร์ใหม่ทั้งหมดเข้าที่เดิม:
  - **checkpoint commit** `6a15bbc` เก็บ Minimal Editorial ไว้เป็นประวัติก่อนรื้อ (กันงานหาย)
  - **โครงกลับมา**: header เต็ม (breadcrumb+h1+desc) · sidebar ซ้าย sticky 280px (panel "ทุกพอร์ต" + panel `PortfolioSidebar`) บน `lg:` · มือถือใช้ `PortfolioSwitcher` pill · แท็บ `SegmentedControl` ภาพรวม/เชิงลึก (กู้จาก `Surface`+`SegmentedControl` เดิม ไม่ใช่ underline)
  - **`portfolio-hero-panel.tsx` กู้คืน** (ไฟล์เคยลบไปตอน Minimal Editorial) — panel เดียว value+delta+4-stat (P/L·ต้นทุน·ดีที่สุด·แย่ที่สุด) · glow มุมยึดหลัก honest money เดิมอยู่แล้ว (ตามทิศ P/L จริง ไม่ใช่สีเกม) — คอมเมนต์เพิ่มอธิบายกฎให้ชัดกันมือถัดไปพลาด
  - **ภาพรวม tab**: hero panel → `PortfolioGameChips` (ย้ายออกจาก toolbar) → `PortfolioAssetsTable` (คงของใหม่ทั้งหมด: sparkline 7d, search/sort/bulk edit, mobile list 2 บรรทัด)
  - **เชิงลึก tab**: money band panel (hero scrub+chart) → แยกตามเกม → มูฟเวอร์ → สัดส่วน (คงเหมือนเดิม ครอบด้วย `Surface` panel)
  - `loading.tsx` + `portfolio-mock-preview.tsx` เขียนใหม่ mirror sidebar+panel (กัน layout jump ทั้ง route-level suspense และ logged-out preview)
  - ไม่แตะ API/hook/Prisma · ไม่มี bottom sheet ใหม่
  - verify: impeccable detect [] · tsc0 · lint 0 err (34 warning เดิม) · test 56/56 · build ✓ · Chrome จริง desktop 1512 (dark+light) + มือถือ 390px (ภาพรวม+เชิงลึก) เทียบ screenshot เว็บ live ตรงกัน
- [x] **Hub + Detail split** (2026-07-03 · เบส: "หน้าแรกเป็นหน้าเลือกพอร์ต+dashboard กดเข้าไปดูเต็ม") — panel-layout รอบก่อนถูกแทนด้วยโครง 2 ชั้นจริง:
  - `use-portfolio-api.ts`: param `activePortfolioId` (sync แบบ render-time adjust กัน lint set-state-in-effect) แทน auto-select-พอร์ตแรก · `toAssetRow`/`buildGameBreakdown` แยกเป็นฟังก์ชันกลาง → ต่อยอด `allAssets`/`allGameBreakdown` (cross-portfolio) · `portfolioMetas` +`previewItems` (thumbnail top 4)
  - `/portfolio` = hub ใหม่ทั้งหมด: dashboard hero (รวมทุกพอร์ต, glow ตาม P/L จริง) → grid การ์ดพอร์ต (`PortfolioHubCard` stretched-link pattern) → แยกตามเกม/มูฟเวอร์ข้ามพอร์ต (read-only — `PortfolioGameBreakdown.onSelect` เป็น optional แล้ว)
  - `/portfolio/[id]` ใหม่ (page + client): breadcrumb+switcher (`router.push` แทน setState) + แท็บเดิมครบ (hero panel/game chips/ตาราง/scrub chart/allocation) · ลบพอร์ตที่ดูอยู่ → เด้ง `/portfolio` · id ผิด → soft not-found + ปุ่มกลับ
  - loading.tsx ×2 + mock-preview ใหม่ตามโครง hub · i18n +4 key ×3
  - **การตัดสินใจเบี่ยงแผน**: ตัดปุ่ม "+เพิ่มการ์ด" ออกจาก hub hero ยกเว้นตอน 0 พอร์ต (กำกวมว่าจะเพิ่มเข้าพอร์ตไหนถ้ามีหลายพอร์ต) — เพิ่มการ์ดทำในหน้า detail แทน
  - verify: tsc0 · lint0 (เจอ+แก้ 1 error `set-state-in-effect`) · test56 · build✓ (route `/portfolio/[id]` ขึ้นจริง) · impeccable detect [] · curl smoke 4 route 200 · **⚠️ ยังไม่ได้เปิด Chrome จริงดู** (browser tool ไม่พร้อม session นี้ — เบสต้องเช็คเอง ดู PROGRESS.md)

### MINE multi-game UX (พอร์ต/แจ้งเตือน/รายการโปรด รองรับหลายเกม · workflow 7-agent + เว็บระดับโลก 2026-07-01 · เบสเคาะ "เริ่มเลย")

> หลักการเดียว: "ของฉัน" = กองเดียวรวมทุกเกมเป็น default · เกม = ป้าย+ตัวกรองในหน้า ไม่ใช่โหมด (Robinhood/Coinbase/Collectr) · header pill = แคตตาล็อกเท่านั้น ห้ามกรอง MINE เงียบๆ (NN/g "devastating")

- [x] **เฟส 1 — trust fixes โครงสร้าง (verify: tsc0/lint0err/test56/build✓)**: chip filter **แยกต่อหน้า** (local `useState` แทน shared `mineGameFilter` ใน ui-store — ลบทิ้ง + comment โกหกที่ว่า "header switcher ก็ขับ") · `useGameFilterReset` hook reset→"ทุกเกม" เมื่อเกม active หลุด data (กัน stale filter หลัง chip ซ่อน / cross-page dead-end) · **coming-soon teaser** ในราง chip (เกม comingSoon → ป้าย "เร็วๆ นี้" กดไป `/coming-soon` · เบสสั่ง)
- [x] **เฟส 1.5 — safe correctness subset (verify: tsc0/lint0/test56/build✓)**: **add-card/alert ค้นข้ามทุกเกม** (`<CardSearch game="all">` ใน watchlist-add-dialog + alert-create-dialog — เลิกล็อก currentGame เงียบๆ · เกมมาจากการ์ดที่เลือก) · **null-game fold** ใน `gameBreakdown` (การ์ดไม่มีเกม → fold เข้า DEFAULT_GAME เหมือน `scopedItems` → ยอด chip ตรงกับ hero)
- [x] **เฟส 2 — historical mock Pokémon + multi-game UI (superseded by HGL/FGR 2026-07-25):**
  - **runtime mock disabled:** fixtures ใน `src/lib/mock/multigame-demo.ts` เหลือไว้สำหรับ isolated component tests เท่านั้น; `?demo=multigame` inject Pokémon เข้า Portfolio/Watchlist/Alerts ไม่ได้แล้ว
  - **badge เกมทุกแถว** (`GameBadge` กลาง · โชว์เมื่อ ≥2 เกม): portfolio list (desktop-row + mobile-card) · watchlist list · alert-row (grid = ใช้ chip rail แทน)
  - **ป้าย scope บน hero eyebrow** ("· Pokémon") + **ซ่อนกราฟตอนกรองเกม** + note `chartAllGamesOnly` (กราฟ = whole-portfolio history · scope per-game ยังไม่ได้ถ้าไม่แตะ DB — ซ่อนแทนโชว์ผิด) · derive `activeScrub` กัน stale
  - **teaser exclusion** — Pokémon เป็น chip จริงตอน demo → ไม่โชว์ teaser ซ้ำ
- [ ] **⛔ GATED — แตะ schema DB (เบสอนุมัติก่อน)**: (1) กราฟพอร์ต **per-game history จริง** — `PortfolioSnapshot` ไม่มี per-game (ตอนนี้ซ่อนกราฟตอนกรองแทน) · (2) หลาย named watchlist (watchlist ตอนนี้ list เดียว/user)
- [ ] **⏭️ เฟสถัดไป (ไม่เร่ง)**: จัดกลุ่ม alert เกม→set พับได้ · สร้าง alert จากกระดิ่งบนการ์ด (alert สร้างได้อยู่แล้ว) · ยอด sticky scroll (Coinbase) · ตัวเลขกำกับ chip · badge บน grid views · **ลบ mock demo เมื่อ Pokémon data จริงมา**

### Marketplace + escrow (effort สูงสุด · หลังเปิด backend flag)

- [ ] order book ต่อ SKU + 2 CTA (buy now/place bid) · `CustodyTimeline` + held hero · buyer protection · seller behavior badge · dispute flow [schema: MarketSku/Bid/escrow/SellerStats]

### Chat / Profile / Reputation

- [ ] sticky context card · offer/order → `EventCard` · accept = confirm sheet · inbox split (ซื้อ/ขาย/อัปเดต) · tier badge + stats sheet + auto-feedback cron

### PLAY — deck / meta / tier

- [ ] deck editor จอเดียว (ฆ่า modal-per-add) + stepper ≥44px + cost curve · deck cost → own/need → "ซื้อที่ขาด" → marketplace
- [ ] tier visual default (S/A/B/C leader art) + meta momentum · archetype "build this deck" funnel · `GameConfig`-parameterized

### Ads polish

- [ ] **Advertising P1 — REVIEW GATE:** AHR4/P0 เสร็จแล้ว; ขยาย route อื่นตาม `doc/advertising-placement-plan-2026-07-24.md` หลัง owner รีวิวของจริง · ห้ามคืน `AdSlot`/registry เดิม · promoted-listing governance (floor+cap+dedup) ยังเป็นงานแยก

### Multi-game (Pokémon)

- [ ] `GameConfig` (1 ไฟล์) + `/[game]/` middleware + switcher (สลับแล้วอยู่ feature เดิม) + per-game tint + all-games portfolio aggregate [schema: Game +fields · gameId NOT NULL]

## 🔴 M0 — บั๊ก/ของหลุดที่เจอจากการ audit (เร็ว ควรเก็บก่อน)

- [ ] **cron `leaderboard-rewards` ไม่ถูก schedule ใน `vercel.json`** — route มีจริง (`/api/cron/leaderboard-rewards`) แต่ไม่เคยรันอัตโนมัติ → Top-10 monthly payout อาจไม่เคยจ่าย · เพิ่ม schedule (เสนอ: วันที่ 1 ของเดือน หลัง draw-raffle) + ตรวจย้อนหลังว่าต้อง backfill รางวัลไหม
- [ ] งานใน working tree ค้าง commit (15 ไฟล์ raffle/header/i18n) — เก็บงานให้จบแล้ว commit

## 🎨 R — Refactor ทั้งระบบก่อน redesign (เบสสั่ง 2026-06-13 · "Refactor ก่อน เดี๋ยวค่อยปรับ Design")

> ผล audit 2026-06-13: conventions ส่วนใหญ่ดีแล้ว (apiHandler ครบ ยกเว้น webhook/cron ที่มี guard ของตัวเอง · Zod 57/64 mutation routes · ไม่มี desktop-first override · typography token ใช้แล้ว 823 จุด) — น้ำหนัก refactor จริงอยู่ที่โครง client code + convention ตกค้าง + i18n · ส่วนการเปลี่ยน IA/หน้าตา รอเฟส redesign

### R0 — Convention fixes (refactor-safe ไม่เปลี่ยน design)

- [x] เพิ่ม `/forgot-password` `/reset-password` เข้า `CHROMELESS_ROUTES` ใน `main-chrome.tsx` (ตอนนี้ได้ chrome เต็ม ขัดกับ login/register)
- [x] ตาราง drop-rate dialog `sets/[setCode]/set-page-client.tsx` — เพิ่ม list fallback ใต้ sm + hoist rows ใช้ร่วม table/list
- [x] ไล่เช็ค `overflow-x-auto` ~30 จุด non-admin แล้ว: ที่เหลือเป็น tab-scroll/carousel/prose ที่ตั้งใจ + ตารางมี `hidden sm:block` fallback อยู่แล้ว (trending-tabs, home-market-overview) — ไม่ต้องแก้เพิ่ม

### R1 — UI consistency (mechanical — กวาดทีเดียวจบ)

- [x] **Typography full sweep (workflow audit 2026-06-29 · 15 โซน · 91 findings · เบสสั่ง "ทำหมด")** ✅ 205 edits / 92 ไฟล์ · verify lint 0 err + test 56/56 + build ✓ · **แก้ครบ 91/91** (รวม 4 judgement-call ที่เบสเคาะ "แก้หมดให้จบ": badge→`.text-micro` · faq/related h2→h3 · reviews heading h5→h4 · settings title h2→h1) · **ยังไม่ commit** (กัน portfolio WIP อีกทีม) — ดึง role ที่ใช้ซ้ำกลับเข้า semantic token ทั้งเว็บ (ไม่รื้อดีไซน์):
  - 🔴 3 จุดแดง (อ่านออก/ลำดับชั้น): marketplace `listing-card:108` ชื่อจางกว่าคนขาย → `.text-h5` · blog `[slug]:174` `prose-sm`→`prose` · profile `reviews-preview` prose 13→15px + วันที่ 10→13px
  - 🟠 systemic: form label→`.text-label` (auth/seller/marketplace/admin/alert) · item title→`.text-h5` (honey/admin) · badge→`.text-micro` · section heading→`.text-h3` · price→`.font-price` · column header→`.text-eyebrow`
  - 🔵 primitives: Card/Dialog/Sheet title→`.text-h4` (weight unify) · button `text-[0.8rem]`→`text-sm` (arbitrary+inversion) · input→`text-base md:text-sm` (iOS-zoom guard)
  - ⚠️ ข้าม judgement-call (audit เอง flag "confirm intent/อาจตั้งใจ") + ห้ามแตะ `src/{components,app}/portfolio/`
  - verify: lint 0 + test pass + build ✓ ก่อนเคลมเสร็จ
- [x] typography residuals → token แล้ว: badge/pill `text-[10px]` → `.text-micro` (9 จุด) · overlay 9px → `.text-overlay` · auth hero `<h2>` → `.text-h1` (2) · ตัด weight ซ้ำ token (1) — ที่เหลือเป็นตัวเลข KPI ที่กติกาอนุญาต plain size (display token = 36-42px ใหญ่กว่าที่ design ใช้ ปล่อยไว้รอเฟส redesign เคาะ) · `portfolio-share-card` จงใจ style เองเพราะ export เป็นรูป — ไม่แตะ
- [x] **lint errors ทั้ง repo: 29 → 0** (พังมาก่อน refactor — rule react-hooks v6) · วิธีที่ใช้: mounted-flag → `useHydrated()` ใหม่ (`src/hooks/use-hydrated.ts`, useSyncExternalStore) · countdown/URL-sync/localStorage read → setState ใน timeout-0/rAF callback · latest-value ref → อัปเดตใน effect · `PrivacyFeedback` hoist เป็น module component · conditional hooks ใน `set-detail-content` hoist เหนือ early return · `Date.now()` ใน render → `daysSince`/`daysUntil` ใน `lib/utils/time.ts` · `window.location.href=` → `.assign()` · prefer-const ×2
- [ ] lint **warnings** เหลือ 81 (exhaustive-deps / unused-vars ส่วนใหญ่ในไฟล์เก่า) — ไล่เก็บเป็น batch แยก ก่อนตั้ง CI gate `--max-warnings 0`
- [ ] รวม empty-state: `shared/empty-state` + `kuma/kuma-empty-state` → ระบบเดียวมี variant (admin แยกไว้ได้)

### R2 — โครง client code (ลด friction ก่อน redesign)

- [x] สร้าง client fetch helper กลาง `src/lib/api/client.ts` (`apiFetch`/`apiGet`/`apiPost`/`apiPatch`/`apiDelete` + `ApiError(status)` + `apiTry`) คู่กับ `adminJsonFetch` เดิม · เพิ่ม `src/lib/api/shared-resource.ts` แทน module-cache ที่ copy-paste 4 สำเนา
- [x] migrate hooks ครบ 9 ตัวที่มี fetch: portfolio-api, header-data, settings, public-config, marketplace-fees, rank-tiers (→ useSyncExternalStore), honey-data (19 จุด), compare-data, market-cards — คงพฤติกรรม 401→signOut / 403→limitReached / AbortError เดิม
- [ ] migrate fetch ใน components ทีละ feature (~70 จุด): honey components → portfolio dialogs → marketplace → ที่เหลือ · **เริ่มแล้ว**: `profile/section-addresses.tsx` (reference pattern: JSON CRUD → apiGet/apiPost/apiPatch/apiDelete + apiTry) · ⚠️ FormData upload (cover/avatar) คง raw fetch ไว้ · auth-critical (profile-data-context 401→signOut) migrate ระวังเป็นพิเศษ
- [ ] รวม empty-state — **ทบทวนแล้ว: ไม่ทำในเฟส refactor** · `shared/EmptyState` (functional) กับ `kuma/KumaEmptyState` (branded emoji+motion+preset) ตั้งใจแยกบทบาทตาม doc comment · การยุบ = งาน design รอเฟส redesign
- [ ] แตก client components ยักษ์ แยก data hook ออกจาก presentation: `portfolio-client` 661 · `today-card` 645 · `compare-client` 629 · `price-hub` 567 · `honey-sidebar` 500 บรรทัด
- [ ] ลบ `src/lib/notifications.ts` (71 บรรทัด, 0 importer — superseded by `notify/dispatch`) ⚠️ เบสยืนยันก่อนลบ
- [ ] ยุบ re-export shims `tier.ts`/`tier-features.ts`/`plan-features.ts` (รวม 14 บรรทัด) ให้เหลือทางเข้าเดียว

### R3 — i18n hardening (ใหญ่ — ทำเป็น batch ราย feature)

- [ ] กวาด hardcoded ไทย + ternary `language === "TH" ? ...` ใน **152 ไฟล์** → `t()` keys (key parity 3 ภาษาเป๊ะ 1406 — อย่าให้พัง) · ลำดับ: layout → messages → marketplace → ที่เหลือ
- [ ] บังคับใช้ `utils/currency` formatting ทุกที่ (JPY/THB/USD — ห้าม format มือ)

### R4 — client→server pages (performance มือถือ — ท้ายสุด)

- [ ] หน้า client ล้วนที่ควรเป็น server-first: `settings/*` 9 หน้า · `saved` · `orders` · `seller/*` (เน้นหน้า first paint ช้าบน 4G)

## ✅ Redesign — เฟสแรก (เสร็จ + merge แล้ว · เก็บเป็น record)

> ป้าย P0–P4 = **ของเก่า ไม่ใช้ต่อ** · redesign รอบใหม่ = in-place (ดู §🎨 Redesign ด้านบน + [VISION.md](VISION.md)) · รายละเอียดเต็มใน git history + [doc/archive/REDESIGN.md](doc/archive/REDESIGN.md) · เก็บ checklist ข้างล่างไว้ดูว่าอะไรทำไปแล้ว

### P0 — Foundation (chrome / nav / tokens / primitives) · บล็อกทุก phase

**P0a — Nav IA foundation** ✅ verified, PR #7 เปิดแล้ว (branch `redesign/p0-nav-foundation`)

- [x] ui-store: เพิ่ม `currentGame` (+ partialize) — game-context พื้นฐาน (UI switcher จริงไว้ P4)
- [x] i18n: +6 keys ×3 ภาษา parity (browse/decksAndTools/deckBuilder/myDecks/metaCards/tierList · more/decks/market มีอยู่แล้ว)
- [x] bottom-nav: **freeze 5 tab** (Market·Browse·Decks·Portfolio·More) เลิก ternary marketplaceEnabled · ย้าย Search ออก (อยู่ header แล้ว) · badge → Portfolio
- [x] `/decks` hub page — tool grid (deck/drop calc, compare) + meta/tier/builder disabled "coming soon" + My Decks placeholder
- [x] header desktop: NAV_LINKS → Market/Browse/Decks · ตัด Tools dropdown (ย้ายเข้า hub) · marketplace append เมื่อ flag เปิด
- [x] mobile-menu-sheet: Tools section → ลิงก์เดียว "Decks & Tools" → /decks

**P0b — AdSlot + Consent** ✅ historical record (branch `redesign/p0b-ads-consent`) · **superseded โดย AHR hard reset 2026-07-24 — component/consent เดิมถูกถอนแล้ว**

- [x] `<AdSlot placement>` — FREE-only + route-excluded (`src/components/ads/placements.ts`) + house-ad (Upgrade-to-Pro) · returns null เมื่อซ่อน (ไม่เหลือช่องว่าง) · AdSense path dormant จนตั้ง `NEXT_PUBLIC_ADSENSE_CLIENT`
- [x] `ConsentBanner` + `adConsent` ใน ui-store (persist) — dormant จน env ตั้ง (กัน nag ก่อน ads live) · ใช้ `useHydrated()`
- [x] billing/features: key `adFree` (PRO) + `featAdFree` i18n · migrate HomeAdCard → AdSlot · + mobile home AdSlot (แก้ ad lg:-only)

**P0c — polish** ✅ verified (branch `redesign/p0c-polish`)

- [x] command palette: เพิ่ม "Pages" nav shortcuts (Market/Browse/Decks/Portfolio/Watchlist/Trending/Compare/Honey/Settings) — ค้นหน้าได้ ไม่ใช่แค่การ์ด · keyboard nav รองรับ
- [x] footer มือถือเข้าถึงได้ (เลิก `hidden md:block` + pb clear bottom-nav)
- [x] design-token pass: `.text-price`/`.text-price-lg` (numeric mono) + `--game-accent` hook (default → primary, GameSwitcher set ตอน P4) — **adopt บน PriceTag ตอน P1**

→ **P0 จบครบ** (P0a nav + P0b ads + P0c polish)

### P1 — Core pages (doc/archive/REDESIGN.md §7) · เริ่มจากหน้าแย่สุด (card-detail)

**P1.1 — card-detail mobile** ✅ verified (branch `redesign/p1-card-detail`)

- [x] ย่อรูปการ์ดบนมือถือ (`max-w-[240px] sm:[320px] lg:none`) — ไม่กินทั้งจอแรก
- [x] reorder: image → header/actions/price/info → siblings (full-width) → related (เลิกดัน actions ใต้ siblings)
- [x] AdSlot `card-detail-mid` (หลัง price-hub, FREE only)
- [x] tap target primary CTA `h-11` บนมือถือ
      **P1.2 — card-detail sticky bar** ✅ verified (branch `redesign/p1-card-detail-2`)
- [x] sticky action bar มือถือ (`CardDetailStickyBar`) — ราคา + Add-to-Portfolio ลอยเหนือ bottom-nav เสมอ · desktop ใช้ inline actions
- [~] **defer มีเหตุผล**: chart-collapse (quick-view ราคาอยู่บนสุดแล้ว + Recharts ใน collapsed เสี่ยง 0-width) · adopt `.text-price` (PriceDisplay มี size system อยู่แล้ว, force-swap = regress) → ทำตอนสร้าง price surface ใหม่
  **P1.3 — ListRow primitive** ✅ verified (branch `redesign/p1-listrow`)
- [x] `src/components/ui/list-row.tsx` — interactive row primitive (`min-h-14` tap target, focus-visible ring, leading/title/subtitle/trailing/chevron slots, Link/button/div)
- [x] adopt ใน `CardListRow` (CardTable mobile fallback) → ได้ทั่ว cards/sets/trending ทันที
- note: `MobileAssetCard` (PnL+notes+edit) / `OrderCard` (status header + actions footer) เป็น multi-section card จริง — คงเป็น bespoke (ไม่ force เข้า row primitive)
  **P1.4 — cards browse (HomeMarketOverview)** ✅ verified (branch `redesign/p1-cards-browse`)
- หมายเหตุ: `/cards` redirect → `/` · การ browse จริงคือ `HomeMarketOverview` บนหน้าแรก
- [x] filter → **bottom sheet** (เลิก inline horizontal-scroll bar ที่กินความกว้างมือถือ — AGENTS anti-pattern) · chips wrap · ปุ่ม "ดูผลลัพธ์"
- [x] AdSlot `browse-in-feed` ใน mobile list (กลาง list, FREE only)
- [x] i18n +1 (applyFilters) parity 1493
- [ ] (option) set-picker บนมือถือ (ตอนนี้ `hidden sm:block`) → ใส่ใน filter sheet · grid view AdSlot

**P1.5 — sets page** ✅ verified (branch `redesign/p1-sets`)

- หมายเหตุ: sets page ออกแบบดีอยู่แล้ว (type pills tab-scroll, grid mobile-first, SetCard) — ปรับเฉพาะจุด
- [x] adopt `ListRow` ใน most-valuable list (reuse primitive: tap target + focus ring + leading rank/thumb)
- [x] AdSlot `browse-in-feed` คั่นระหว่าง most-valuable กับ grouped sets
- note: type pills (horizontal scroll) เป็น tab-scroll ที่ตั้งใจ (ไม่ใช่ anti-pattern) — คงไว้

→ **P1 ครอบคลุมหน้าหลักแล้ว** (card-detail, cards-browse, sets) · เหลือ polish ปลีกย่อย

### P2 — Portfolio & tools (doc/archive/REDESIGN.md §7)

**P2.1 — portfolio** ✅ verified (branch `redesign/p2-portfolio`)

- หมายเหตุ: portfolio ผ่าน single-screen redesign แล้ว (2026-07-02 · เลิกแท็บ → หน้าจอเดียว money band → KPI → context → holdings → insights · ดู §Portfolio ด้านบน)
- [x] PortfolioHero stat row (PnL/cost/best/worst) **ยุบ default บนมือถือ** + ปุ่ม "ดูรายละเอียด" · value+PnL pill โชว์เสมอ · desktop กางเต็ม (holdings เร็วขึ้นตาม audit)
      **P2.2 — tools tap targets** ✅ verified (branch `redesign/p2-tools`)
- หมายเหตุ: drop-calc มี mobile tabs (cards/results) + lg grid อยู่แล้ว, deck-calc ใช้ list — mobile-structured พอควร (audit "form-heavy table" ไม่ตรงโค้ดจริง)
- [x] drop-calc purchase-config quantity stepper `size-7→size-9` + input `h-7→h-9` (fat-finger fix ตาม audit)
- [x] want-list remove button `p-0.5→p-1.5` + aria-label
- [ ] (option) watchlist / saved / compare review · card-picker rarity chips py-1→py-1.5

→ **P2 ครอบคลุมแล้ว** (portfolio + tools) · core mobile UI redesign (P0+P1+P2) เสร็จเป็นกอบเป็นกำ

### P4 — Multi-game / Pokémon (doc/archive/REDESIGN.md §5.1) · เบสเคาะ: per-game · ขยาย enum · อนุมัติ schema

**P4.1 — GameSwitcher + Pokémon stub** ✅ verified (branch `redesign/p4-game-switcher`) — โค้ดล้วน ไม่แตะ DB

- [x] `pokemon.ts` stub (comingSoon) + register ใน GAME_CONFIGS · `getActiveGameConfigs()` · GameConfig +flags (shortName/comingSoon/supports*/deckRules)
- [x] `GameSwitcher` pill ใน header (มือถือ+desktop) — OPCG active, Pokémon disabled "เร็วๆ นี้" · ใช้ `currentGame` (persist) · i18n chooseGame

**P4.2 — schema migration (additive, prod-safe)** ✅ code verified · 🔵 deploy (เบสเลือก C: ผม run migrate deploy)

- [x] `gameId Int?` (nullable) + FK SetNull + index บน **Card / Portfolio / Deck / Listing / YuyuteiMapping / SnkrdunkMapping** · Game back-relations
- [x] migration `20260614000000_add_game_scoping` (ADD COLUMN + INDEX + FK ล้วน, transaction-safe) · `prisma generate` + build ✓
- [~] **defer ไป P4.3** (ลด prod risk): `CardType` enum ขยาย (ALTER TYPE รันใน tx ไม่ได้) · backfill gameId · NOT NULL + `@@unique([gameId,cardCode])` — ทำหลัง Pokémon data
- [x] **deployed เข้า Supabase prod แล้ว** (2026-06-14) — apply ผ่าน `prisma db execute` + `migrate resolve --applied` (option 1: ไม่แตะ drift) · verify gameId มีครบ 6 ตาราง

**P4.3 — `/[game]/` URL namespace (เบสสั่ง 2026-06-30 "URL แยกเกมทั้งแอป · ทำ UI ก่อน")**

- [x] **routing core (Phase 1)** ✅ — กลยุทธ์ middleware-rewrite + cookie/header resolver (mirror `getServerLanguage` · ไม่ย้าย 102 route จริง · ไม่แก้ 180 ลิงก์): `src/lib/game/{constants,server}.ts` (GAME_COOKIE/HEADER · GAME_SCOPED_SEGMENTS allowlist · `getServerGame()`) · middleware: `/opcg/x` rewrite→flat `/x` + inject `x-game` + cookie · legacy `/x` redirect→`/{currentGame}/x` (ลิงก์เก่าใช้ได้หมด · namespace ทั้งแอปทันที) · `updateSession` refactor backward-compat รองรับ rewrite (auth ไม่พัง) · GameSwitcher นำทาง swap segment
- [x] **verify (Phase 1)** ✅ — build ✓ · live curl matrix 2 รอบ (bypass on/off): `/portfolio`→307→`/opcg/portfolio` · `/opcg/portfolio`→200 · `/all/portfolio`→200 · `/sets`→307→`/opcg/sets` · `/messages`→302→login (auth ไม่พัง) · `/settings`/`/honey`/`/api`/`/` flat ไม่แตะ · ไม่มี loop · `kuma-game` cookie set ถูก
- [~] **Phase 2 (per-page scoping)** — **portfolio ✅**: `useGameScope()` อ่าน game จาก URL · `usePortfolioApi(scope)` filter assets/stats/allocation ตามเกม (gameBreakdown คง cross-game) · `/all/portfolio`=รวมทุกเกม+breakdown · `/opcg`=scope เกมเดียว · `/pokemon`=empty state · verify lint0/tsc/test56/build + curl 4 route 200 · **เหลือ:** sets/cards/search/trending/compare/watchlist/decks อ่าน `getServerGame()` (server) · sitemap/canonical → prefixed · 307→308 ตอน stable · ~~rename `middleware.ts`→`proxy.ts` (Next16)~~ ✅ 2026-08-07
- [ ] **DEFER (data)** — backfill `Card.gameId` (จาก set.game) + NOT NULL + `@@unique([gameId,cardCode])` · ขยาย CardType enum · Pokémon sets/rarities/pull-rate + scraper (ต้องหาแหล่งข้อมูล Pokémon ก่อน)

## 🧹 Declutter audit (screenshot ทุกหน้า mobile+desktop ผ่าน 2 workflows) — เบสเลือก B (live pages ก่อน, marketplace=P3 ทีหลัง)

> ผล: 10 high + 48 med · card-detail/drop-calc สะอาด (5/5) · home รกสุด (2/5) · JSON: /tmp/{mobile,desktop}-findings.json

- [x] **Batch 1 — Home declutter** (branch `redesign/declutter-home`): market-overview toolbar wrap 2-row มือถือ · featured-card stack · mini-table tap (min-h-11) · hero-search submit px-4 sm:px-6 · verify ✓
- [x] **Batch 2 — Toolbar pattern: ตรวจแล้ว set-detail/trending/watchlist wrap (flex-col/flex-wrap) ดีอยู่แล้ว** — agent over-flag จากภาพแน่น แต่โค้ดถูก · ไม่แก้ (home ตัวเดียวที่ต้องแก้ = batch 1 แล้ว)
- [x] **Batch 3+4 — tap target + token sweep** (branch `redesign/declutter-sweep`): compare X 32→36px · related-pages/faq h2 → `.text-h2` · blog badge → `.text-micro` · login labels → `.text-label` · ข้าม 15px=15px swap ที่ไม่เปลี่ยนภาพ · verify ✓
- [ ] **Batch 5 — Honey declutter (มือถือ)**: status cards ยุบ 1 บรรทัด
- [ ] **Batch 6 — Desktop balance**: card-detail price-hub · drop-calc sidebar · login left-panel · guide featured
- [ ] (เก็บตก) decks + deck-calc 2 หน้า mobile review schema พลาด — รีวิวซ้ำ

## 🔧 M5 — Prisma migration drift (เก็บกวาด, ไม่เร่ง แต่ควรเคลียร์)

> เจอตอน P4.2 deploy · drift มีมาก่อน ไม่ใช่จาก redesign

- [ ] DB มี `20260422000000_add_saved_profile` แต่ไม่มีในโฟลเดอร์ repo · repo มี `20260429000000_drop_watchlist_note_target` ที่ DB ยังไม่ mark applied
- [ ] สืบ + `migrate resolve` ให้ตรงความจริง DB (น่าจะ resolve --applied drop_watchlist ถ้า column ถูก drop จริงแล้ว · เพิ่ม/หา add_saved_profile migration) → ให้ `migrate status` สะอาด
- [ ] ⚠️ แตะ DB จริง — ทำตอนมีเวลา + backup

### ค้างจาก audit (ทำตอน redesign แต่ละหน้า)

- Honey nav มือถือ: 7 แท็บไอคอนล้วนไม่มี label (`honey-tab-nav.tsx:159`) + scroll แนวนอน (→ P5)
- card-detail หนาแน่น/ปุ่มใต้ fold (→ P1) · portfolio scroll ลึก (→ P2)

## M1 — Honey: เก็บงานค้างจาก rebalance v2 (`doc/honey-economy-rebalance.md` §9)

- [ ] Achievement unlock toast — ยังไม่มี component แจ้งตอนปลดล็อก
- [ ] Physical prize fulfillment — flow เก็บที่อยู่จัดส่งผู้ชนะ raffle (ผูก `ShippingAddress` ที่มีอยู่แล้วได้)
- [ ] Featured-slot curation UI ใน `/admin/honey` — API พร้อมแล้ว (`featuredUntil`) แต่ไม่มีหน้า admin
- [ ] (future) Anti-abuse score model

## M2 — HoneyActionType migration (`doc/honey-action-type-migration.md` — ค้าง phase 4 ทั้งก้อน ทำเป็นชุดเดียว)

> ตอนนี้ freeze ด้วย runtime guard เท่านั้น enum เก่ายังอยู่ใน schema

- [ ] Step 1: เพิ่มคอลัมน์ `legacyType String?` บน `HoneyTransaction`
- [ ] Step 2: backfill SQL ย้ายค่าเก่า → `legacyType`
- [ ] Step 3: drop enum members เก่า (raw SQL ALTER TYPE)
- [ ] Step 4: ปรับ read site ใน `/admin/honey` ให้ fallback ไป `legacyType`
- [ ] ⚠️ ทั้งชุดแตะ DB จริง — เบสอนุมัติก่อนรัน migration

## M3 — Marketplace launch prep (โค้ดเสร็จแล้ว ปิด flag อยู่ · ค้างจาก `doc/MARKETPLACE_OVERHAUL.md`)

- [ ] ตัดสินใจ: เปิด `marketplaceEnabled` เมื่อไหร่ + เกณฑ์พร้อม (งานธุรกิจ — เบสเคาะ)
- [ ] auto-complete order: DELIVERED → COMPLETED หลัง X วัน (ตรวจว่ามี cron หรือยัง — น่าจะยังไม่มี)
- [ ] `OrderEvent` model — audit log การเปลี่ยน status ของ order
- [ ] DISPUTED status + mediation flow
- [ ] Escrow release จริง (เงินเข้าผู้ขายเมื่อ COMPLETED — ต้อง Stripe Connect)
- [ ] (optional) `/checkout/[orderId]` แยกหน้า + Cart ซื้อหลายใบร้านเดียว

## M4 — สุขภาพ docs (กัน AI/คนอ่านแล้วหลงทาง)

- [ ] อัปเดต `doc/data-pipeline.md`: รูปขึ้น **Cloudflare R2** แล้ว (ไม่ใช่ Supabase Storage) + เพิ่มส่วน SNKRDUNK pipeline + ชี้ cron จริงใน vercel.json
- [ ] ตัดสินใจชะตา `data/cards-official/` (5.1MB ไม่มีโค้ดอ้าง — snapshot เก่า?) — เบสเคาะ: ลบ หรือเก็บเป็น archive

## ถัดไป (north star — ยังไม่เริ่ม อย่าหยิบเองโดยเบสไม่สั่ง)

- [ ] แหล่งราคาเพิ่ม (Mercari/eBay JP) · Multi-TCG (seed-games.ts พร้อมแล้ว) · PWA · Lifetime deal
