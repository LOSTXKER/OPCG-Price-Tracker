# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-25 — **ปิดงานทั้งชุดขึ้น `master` แล้ว** (Card Picker ไม่มีเลขขั้น + ไอคอนเกม/ชุดตรงกัน + ตัวเลือกเกมออกจากแถบแท็บพอร์ต + ซ่อมเส้นขั้น + แถวรายการพอร์ตบนมือถือ + ปุ่มเพิ่มการ์ด + ซ่อนไฮไลต์หน้าแรก)

## 🚀 สถานะ ship

- `master` = `d7030d3` (push แล้ว) · `feat/portfolio-watchlist-teardown` ชี้คอมมิตเดียวกัน · PR #117 ขึ้นสถานะ MERGED เอง
- 2 คอมมิต: `c5390c9` ฟีดแบ็ก UI รอบมือถือ (17 ไฟล์) · `d7030d3` งานค้างสะสมหลาย session (304 ไฟล์)
- เบสสั่งดัน master ตรงๆ เอง (ผิดกฎ ⛔ ใน AGENTS.md แต่เจ้าของยืนยันหลังได้รับแจ้งแล้ว)
- **ค้างต่อ: รัน prisma migrate บน DB production** — คอมมิตนี้พา migration ใหม่ 2 ตัวไปด้วย (`add_portfolio_lots`, `fix_portfolio_transaction_type`)
- `scripts/.portfolio-*.mjs` 8 ไฟล์ (สคริปต์ตรวจ migration ใช้ครั้งเดียว) ยังไม่ track โดยเจตนา

## 🔒 การตัดสินใจที่ต้องรักษา

- Card picker ไม่ใช่ wizard และห้ามมีเลขขั้น; ใช้ลำดับ DOM `เกม → ชุด → ค้นหา/กรอง → เลือกการ์ด` ทุก surface
- Selector รับเฉพาะ launch-ready games จาก `getActiveGameConfigs()`; Pokémon roadmap ห้ามโผล่ก่อนผ่าน product/data/route gate
- ตอนมีเกม live เพียง 1 เกม แสดง One Piece เป็น context ที่เลือกแล้วและไม่สร้างปุ่มหลอก; เมื่อมี 2+ เกมจึงเปลี่ยนเป็น canonical Base UI Select อัตโนมัติ
- แถวรายการที่มี "ปลายทางหลัก + ลิงก์ย่อย": พื้นที่ว่างต้องตกเป็นของแถว (ปลายทางหลัก) เสมอ — ลิงก์ย่อย (รูป/ชื่อ) ต้องกอดเนื้อหาตัวเอง ห้าม `flex-1`/stretch เพราะจะดูดคลิกที่ผู้ใช้เล็งแถว
- ลิสต์บนมือถือทุกหน้าใช้ไวยากรณ์เดียวกัน: ซ้าย = identity (รูป + ชื่อ + meta 1 บรรทัด), ขวา = money stack (ตัวเลขหลัก + % ), ห้ามทำ "ตารางย่อย" (`dl` หลายคอลัมน์ + เส้นคั่น + ป้ายซ้ำทุกแถว) ในแถว; ข้อมูลรองย้ายเข้า dialog/desktop table และป้ายที่ซ่อนต้องเหลือเป็น `sr-only`
- แถบแท็บ = แท็บ + ปุ่มของหน้า เท่านั้น; ตัวกรอง/scope ของข้อมูลห้ามแทรกในแถบแท็บ (อ่านเป็นแท็บที่สาม) ให้ลงมาอยู่ใต้เส้นคู่กับข้อมูลที่มันกรอง
- ขีดแท็บ active ต้องทับเส้น hairline เป็นเส้นเดียว (`after:-bottom-px`) ห้ามซ้อนเป็นสองชั้น และแท็บสูง 44px ทุกความกว้างเพื่อให้ก้นแท็บชิดเส้น
- แถวเกมกับแถวชุดใน picker เป็น "คู่" ต้องใช้ token ไอคอนนำชุดเดียวกัน (24×24 · `rounded-sm` · `bg-muted` · ไอคอน 14px `text-muted-foreground/60`) และความสูง/padding/ขนาดตัวอักษรเท่ากัน; ต่างได้แค่พื้น (อ่อน = อ่านได้เท่านั้น) กับ chevron
- Set ยังเป็น control เด่นนอก `FilterModal`; modal มีเฉพาะ rarity/color/type/version และต้องซ้อนเหนือ picker ได้โดยคืน focus ถูก
- Multi-select ต้องกดได้ทั้งแถว, เปิดเผย `aria-pressed`, มีแถบ preview และคง selection เมื่อไป review แล้วย้อนกลับ
- Header `GameSwitcher` กับ game scope ใน Card Picker/MINE ยังเป็นคนละ state; ห้ามผูกกันโดยไม่ออกแบบ data contract ใหม่
- Worktree มีงานหลายชุดค้างพร้อมกัน; ห้าม revert/cleanup งานอื่น รอบนี้ไม่ได้ commit/push

## ✅ งานที่ทำรอบนี้

- ถอดวงเลข 1–2–3 และ label แบบขั้นตอนทั้งหมด เพราะ flow นี้กรองแล้วเลือกได้ทันที ไม่ได้ gate ทีละขั้น
- จัด game context + set เป็นชั้นบนแถวเดียวบน desktop และ stack บน mobile
- จัด canonical `ToolbarSearch` + ปุ่ม Filter เป็นชั้น action ด้านล่าง โดยไม่ใส่ label “ค้นหา” ซ้ำกับ icon/placeholder
- เอาเครื่องหมายถูกออกจาก One Piece ตอนมีเกมเดียว และลดเป็น read-only context พื้นอ่อน; 2+ เกมยังใช้ Base UI Select เดิม
- เปลี่ยนผลลัพธ์เป็น canonical `ListRow`: รูป/ชื่อ/รหัส/rarity อ่านเป็นชั้น, มี divider, กดได้ทั้งแถว และ selected state ชัด
- เพิ่ม description ใต้หัว dialog ทั้ง TH/EN/JP และใช้ semantic typography (`text-h4`, `text-code`, `text-meta`)
- เพิ่ม `ariaPressed` ให้ `ListRow` และ localized `clearLabel` ให้ `ToolbarSearch`
- ขยาย inline picker ใน Marketplace จาก `min(28rem, 60dvh)` เป็น `min(34rem, calc(100dvh - 8rem))` เพื่อให้จอสั้นเหลือพื้นที่รายการราว 3–4 แถว
- เติม `sizes="96px"` ให้ภาพ preview Marketplace เพื่อตัด Next Image runtime warning
- แก้ dev bundle เก่าที่ทำให้ SSR/client คนละ revision ด้วย clean restart; ไม่ suppress hydration warning ใน component
- **(เพิ่มตามฟีดแบ็กเบส) หน้าแรกบนมือถือซ่อน 3 บล็อกไฮไลต์** — `มูลค่าสูงสุด` (`HomeFeaturedCard`) · `ราคาขึ้นมากสุด` · `ราคาลงมากสุด` (`HomeMiniTable` ×2) อยู่ใน section เดียวกันใน `src/app/page.tsx` → ใส่ `hidden ... sm:grid` (เดิม `grid`) ให้หายใต้ `sm` แล้วโชว์เหมือนเดิมตั้งแต่ 640px ขึ้นไป (บน desktop เรียง 3 คอลัมน์ ไม่กินที่) · ยังอยู่ใน DOM (display:none) ไม่เสีย SEO · ผล: มือถือเลื่อนจาก hero เข้าตารางตลาดทันที
- **(เพิ่มตามฟีดแบ็กเบส) ปุ่ม "เพิ่มการ์ด" บนมือถือโชว์ข้อความเต็ม** — เดิมย่อเป็นสี่เหลี่ยม 44px ไอคอน + `sr-only sm:not-sr-only`; ถอด override `w-11 px-0` ทิ้ง (`size="sm"` ให้ min-h 44px บนมือถือ + padding เองอยู่แล้ว) → ปุ่มกว้าง 110px มีคำว่า "เพิ่มการ์ด" ทุกความกว้าง · sync ทั้ง mock preview และ skeleton (placeholder เลิกเป็นสี่เหลี่ยม)
  - **ผลข้างเคียงที่ต้องแก้ตาม:** แถวบนมือถือแชร์บรรทัดกับ `PortfolioSwitcher` → เหลือที่ให้ switcher 148px (จอ 390px) ทำให้ trigger ที่เป็น shrink-to-fit พองไปเท่า min-content แล้ว **หนีบ chevron ของตัวเองหาย**; แก้ 3 จุดใน `portfolio-switcher.tsx`: (1) `w-full` ให้กล่องมีความกว้างแน่นอน (2) `min-w-0` + `truncate` + `shrink-0` ในบรรทัด privacy กันดันกล่อง (3) บรรทัดที่สอง (`สาธารณะ · 1/1`) โชว์ตั้งแต่ `sm` ขึ้นไป — บนมือถือ trigger เหลือบรรทัดเดียว (ชื่อ + chevron) ส่วน privacy/จำนวนอยู่ใน sheet และใน accessible name อยู่แล้ว (ดีกว่าตัดคำเป็น "ส..")
- **(เพิ่มตามฟีดแบ็กเบส) แถวรายการพอร์ตบนมือถืออ่านง่ายขึ้น** — เดิมแต่ละแถวเป็น "ตารางย่อย": บล็อกบน (รูป/ชื่อ/รหัส·วันที่/เพิ่มโน้ต/จำนวน/ปุ่มวงกลม) + `dl` 3 คอลัมน์มีเส้นคั่นในตัว ที่พิมพ์ป้าย `ราคาตลาด/ใบ · ต้นทุนต่อใบ · P/L` ซ้ำทุกแถว → สูง ~155px ต่อรายการ เห็นได้ 2 แถวต่อจอ. เปลี่ยนเป็นไวยากรณ์แถวเดียวกับลิสต์อื่นทั้งเว็บ (หน้าแรก/ตลาด/รายการโปรด): ซ้าย = รูป + ชื่อ + `รหัส · วันที่` , ขวา = ราคาตลาด/ใบ (ตัวหนา) + กำไร/ขาดทุน % (มีสี) , ท้ายแถว = ลูกศรเปล่า (เลิกใช้วงกลมพื้นเทา แต่ยังเป็นปุ่มจริงและ hit 44px ผ่าน `tap-safe`) → **สูง 77px เท่ากันทุกแถว เห็น 6 แถวต่อจอ**
  - ป้ายกำกับไม่หายไปจาก a11y: ย้ายเป็น `dt` แบบ `sr-only` (screen reader ยังได้ยิน "ราคาตลาด/ใบ" / "กำไร/ขาดทุน")
  - **ย้ายเข้า dialog รายละเอียด (กดแถวเดิม):** ต้นทุน/ใบ · กำไร/ขาดทุนเป็นเงิน · เนื้อโน้ต — desktop table ยังแสดงครบทั้ง 5 คอลัมน์เหมือนเดิม
  - เลิกพิมพ์ CTA "เพิ่มโน้ต" ทุกแถว (สีเข้มดึงสายตาโดยไม่มีข้อมูล) → แถวที่ "มีโน้ตแล้ว" ติดไอคอนโน้ตเล็กๆ พร้อม title/sr-only
  - เลิกพิมพ์ "1 ใบ" ทุกแถว (1 ใบ = ค่าปกติ) → badge จำนวนขึ้นเฉพาะล็อตที่ >1 ใบ ทำให้ล็อตหลายใบเด่นขึ้นด้วย
  - **กฎการกด (เบสสั่ง): กดตรงไหนก็เข้าหน้าแก้ไข ยกเว้นรูปกับชื่อการ์ด → หน้าการ์ด** — ลิงก์ชื่อเดิมเป็น `flex-1` จึงกินพื้นที่ว่างทั้งบรรทัด (ชื่อสั้นอย่าง "Enel" กว้าง 30px แต่พื้นที่กดลิงก์ยาว ~131px) ทำให้กดข้างชื่อแล้วหลุดไปหน้าการ์ด; เปลี่ยนเป็น `min-w-0 max-w-full` ให้ลิงก์กอดตัวอักษร (desktop row ทำถูกอยู่แล้วด้วย `inline-flex max-w-full`) · ยืนยันด้วย `elementFromPoint` 6 จุด: ชื่อ/รูป = ลิงก์การ์ด, ข้างชื่อ/meta/ราคา = แถว (เปิด dialog แก้ไข), ลูกศร = ปุ่มรายละเอียด และคลิกที่ราคาจริงเปิด "แก้ไขรายการซื้อ" โดย URL ไม่เปลี่ยน
  - วันที่บนมือถือใช้รูปแบบสั้น (`formatPurchaseRowDate(..., "compact")`): ปีนี้ตัดปีทิ้ง ("24 ก.ค."), ปีก่อนเหลือ 2 หลัก — เดิมโดนตัดกลางคำเป็น "24 ก.ค. …" เพราะที่ไม่พอ; desktop ยังใช้แบบเต็ม
- **(เพิ่มตามฟีดแบ็กเบส) ย้ายตัวเลือกเกมออกจากแถบแท็บพอร์ต + ซ่อมเส้นขั้น** — เดิม pill "เกม: ทุกเกม" ถูกยัดระหว่างแท็บกับปุ่มขวาบน desktop จึงอ่านเป็นแท็บที่สาม; ย้ายลงมาเป็นแถวของตัวเองใต้เส้น (สลอตเดียวกันทุก breakpoint, instance เดียวใช้ได้ทั้ง 2 แท็บ) เหลือแถบบน = แท็บ + ปุ่มหน้า. **เส้นขั้น**: เดิมขีดแท็บ active 2px จบที่ 304px แล้ว hairline อีก 1px ต่อท้ายเป็นชั้นซ้อน (ยิ่งจอ scale ไม่ลงตัวยิ่งเห็นเป็นเส้นคู่) + ปุ่ม 36px เหลือระยะถึงเส้นแค่ 2px → เปลี่ยน indicator เป็น `-bottom-px` ให้ทับ hairline เป็นเส้นเดียว และคงแท็บสูง 44px ทุกความกว้าง (ตัด `md:h-10`) ให้ก้นแท็บชิดเส้นพอดี ปุ่มได้ระยะ 4px · ทำให้ตรงกันทั้ง live page, mock preview (หน้า logged-out ของหน้าเดียวกัน), skeleton และแถบแท็บ watchlist
- **(เพิ่มตามฟีดแบ็กเบส) ไอคอนเกมกับไอคอนชุดตรงกันแล้ว** — กล่องไอคอนเกมเดิม 28px มุม `rounded-md` พื้นขาว ring + ไอคอนสี honey ไม่เข้ากับกล่องชุด 24px `rounded-sm` พื้น muted; ยุบให้ใช้ token ชุดเดียวกันทั้งคู่ (24×24 · `rounded-sm` · `bg-muted` · ไอคอน 14px `text-muted-foreground/60`) และปรับ padding/ขนาดตัวอักษรของแถวเกมให้เท่าแถวชุด (`px-2.5`, `text-sm` แทน `text-label` 13px/500) พร้อมเติม hairline border ให้แถวเกม — เหลือต่างกันแค่พื้นอ่อนกับการไม่มี chevron ซึ่งเป็นสัญญาณว่า "อ่านได้ กดไม่ได้" · path 2+ เกม (Select) กับไอคอนใน dropdown ใช้ชุดเดียวกันแล้ว

## ✅ Verification

- Focused regressions: 5 files / 20 tests ผ่าน
- Full tests: 128 files / 698 tests ผ่าน
- TypeScript: `npx tsc --noEmit` ผ่าน
- Full lint: 0 errors; 28 warnings เดิมนอก scope
- Production build: Next.js 16.2.1 ผ่าน 157 pages
- `git diff --check` ผ่าน
- Browser:
  - Watchlist 1280×720 และ 390×844: ไม่มีเลขขั้น, แถบควบคุมเตี้ยลง และ multi-select/`aria-pressed` ยังทำงาน
  - Portfolio 1280×720: โครงเดียวกันครบและไม่มี label ขั้นตอนหลงเหลือใน dialog
  - Marketplace 390×667: picker ไม่มีเลขภายใน; เลข 1–4 ที่ยังอยู่เป็น wizard ลงขายจริงคนละระบบและตั้งใจคงไว้
- Final dev restart หลัง build: `/watchlist` ตอบ `200 OK` และ fresh server log ไม่มี runtime error
- รอบซ่อนไฮไลต์หน้าแรก (เพิ่มเติม): full tests 128 files / 700 tests ผ่าน · `tsc` ผ่าน · eslint 0 issue · Browser: iframe 388px → section ไฮไลต์ `display: none` และเนื้อหาต่อจาก hero คือแถบตลาด/ตารางทันที; desktop 1512px → `display: grid` ยังโชว์ "มูลค่าสูงสุด · ราคาขึ้นมากสุด · ราคาลงมากสุด" ครบ · **หมายเหตุ: ต้อง restart dev server เพราะหน้าแรกเป็น ISR (`revalidate = 300`) แล้ว dev server ที่รันมา 6 ชม. ยัง serve HTML เก่า (touch ไฟล์/no-cache/query bust ไม่ช่วย) — ตอนนี้ dev รันใหม่อยู่เบื้องหลัง log ที่ `scratchpad/dev.log`**
- รอบปุ่มเพิ่มการ์ด (เพิ่มเติม): full tests 128 files / 700 tests ผ่าน · `tsc` ผ่าน · eslint 0 issue · Browser: ปุ่มกว้าง 110px มีข้อความ ไม่มี `sr-only` ข้างใน · จำลองแถวมือถือในหน้า desktop (บังคับ grid + switcher variant + ซ่อนของ `sm` ขึ้นไป ที่ความกว้าง 358px = จอ 390px): แถบไม่ overflow (scrollWidth = 358), switcher 148px ไม่หนีบ chevron แล้ว (ก่อนแก้ scrollWidth 184 > 148), ไม่มีคำถูกตัด · **หมายเหตุ: resize หน้าต่าง Chrome จาก tool ใช้ไม่ได้ และ iframe probe ค้างที่ skeleton จึงไม่มี screenshot จากจอมือถือจริง — ต้องให้เบสยืนยันบนเครื่องจริง**
- รอบแถวรายการมือถือ (เพิ่มเติม): full tests **128 files / 700 tests ผ่าน** (แก้ assertion ที่ล็อกโครงเก่าใน `assets-usability` / skeleton / mock-preview + เพิ่มเทสต์ใหม่ 2 อัน: note-flag + จำนวน >1, และ compact date ใน `utils.test.ts`) · `npx tsc --noEmit` ผ่าน · eslint `src/components/portfolio` + `src/app/portfolio` 0 issue · Browser วัดที่ความกว้างแถว 311px (= จอ 390px): แถวสูง **77px เท่ากันทุกแถว** (เดิม ~155px), ชื่อไม่ถูกตัดยกเว้นชื่อยาวจริง ("Roronoa Zoro (Parallel)"), วันที่ไม่ถูกตัดแล้ว, desktop table ไม่กระทบ (ลูกศรวงกลม 40px คงเดิม)
- รอบแถบแท็บพอร์ต (เพิ่มเติม): full tests 128 files / 698 tests ผ่าน (อัปเดต assertion ของ skeleton/mock-preview/watchlist-tabs ให้ตรงโครงใหม่ ไม่ได้ลบเทสต์) · `npx tsc --noEmit` ผ่าน · eslint 5 ไฟล์ที่แก้ 0 issue · Browser วัดจาก DOM 1512px: แถบสูง 44px, ขีด active ทับ hairline พอดี (`-bottom-px`, 306.8–308.8 คลุมเส้น 307.8–308.8), ปุ่มห่างเส้น 4px, scope row อยู่ใต้เส้น · เช็คมือถือ 390px ด้วย iframe probe: แถว switcher → แท็บ → scope → การ์ด เรียงถูกและขีดชิดเส้น · watchlist rail ขีดชิดเส้นเหมือนกัน
- รอบแก้ไอคอน (เพิ่มเติม): `add-card-select-step.test.tsx` 5/5 ผ่าน · `npx tsc --noEmit` ผ่าน · eslint ไฟล์ที่แก้ 0 issue · `git diff --check` ผ่าน · Browser `/watchlist` 1280px วัดค่าจริงจาก DOM: กล่องไอคอนเกม/ชุด = 24×24, radius 7.2px, `rgb(245,237,230)`, ไอคอน 14×14 สีเดียวกัน, แถวสูง 40px, padding 10px, ฟอนต์ 15px/400 **เท่ากันทุกค่า**; เช็คทั้ง light + dark

## 📁 ไฟล์หลักรอบนี้

- `src/components/portfolio/add-card-select-step.tsx`
- `src/components/portfolio/add-card-select-step.test.tsx`
- `src/app/page.tsx`
- `src/components/portfolio/portfolio-switcher.tsx`
- `src/components/portfolio/assets-table/mobile-card.tsx` · `action-menu.tsx` · `utils.ts` · `utils.test.ts` · `assets-usability.test.tsx`
- `src/app/portfolio/[id]/portfolio-detail-client.tsx`
- `src/app/portfolio/portfolio-mock-preview.tsx` · `portfolio-mock-preview.test.tsx`
- `src/components/portfolio/portfolio-detail-skeleton.tsx` · `portfolio-detail-skeleton.test.tsx`
- `src/app/watchlist/watchlist-tabs.tsx` · `watchlist-tabs.test.tsx`
- `src/components/marketplace/create-wizard/step-card-select.tsx`
- `src/components/ui/list-row.tsx`
- `src/components/ui/toolbar.tsx`
- `src/lib/i18n/th.ts` · `en.ts` · `jp.ts`
- `PLAN.md` · `PROGRESS.md`

## ⏭ NEXT

1. **รัน prisma migrate บน DB production** ก่อน/พร้อม deploy รอบนี้ (migration ใหม่ 2 ตัวไปกับ `d7030d3` แล้ว) แล้วเช็คหน้าพอร์ตจริงหลัง deploy
2. ค้าง (รอเบสตัดสิน): ทั้งเว็บยังมี "เครื่องหมายเกม" 3 แบบ — จุดสีใน header `GameSwitcher` · `Layers3` ใน game scope ของ MINE toolbar · `Gamepad2` ใน card picker; ถ้าจะยึด "1 concept 1 icon" ต้องเลือกอันเดียวแล้วยุบทั้ง 3 จุด (คนละไฟล์ คนละ surface — งานแยก)
3. ค้าง (รอเบสตัดสิน): ตัวเลือกเกมในพอร์ตยังโชว์ตอนมีเกมเดียว ทั้งที่ "ทุกเกม" กับ "OPCG" ให้ผลเหมือนกัน — จะซ่อนจนมีเกมที่ 2 ก็ได้
4. ก่อนเปิด Pokémon จริง ให้ audit/guard launch-ready card ที่ API read/write boundary แยกงาน
5. แนะนำอัปเกรด Vercel CLI จาก 55.0.0 เป็น 57.0.0 ด้วย `npm i -g vercel@latest`
