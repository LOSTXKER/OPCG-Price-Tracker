# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-23 — **homepage warm-kit pass: ทำให้ "เข้ากับ card-detail + minimal"** (de-box + ลด gold เหลือจุดเดียว + calm ตาราง) · tsc 0 · lint 0 err · test 56 ✓ · render จริงผ่าน (home+search · desktop+mobile) · build ยังไม่รัน (กันทับ `.next` ของ dev server) · **ทั้งหมดยัง working tree ยังไม่ commit · รอเบส review สายตา**

## 🎯 โปรเจคใหญ่ที่กำลังทำ (ข้ามหลาย session) — อ่าน memory `warmkit-redesign-rollout`
ไล่ redesign **ทุกหน้า**ให้ใช้ภาษาดีไซน์เดียวกับ **card-detail** ("warm primitive kit": `.surface-1`+`.hairline` flat · `SectionHead` · honey accent จุดเดียว · `.tnum` · `.ease-chrome` · spacing โปร่ง) · ref: `src/components/cards/card-detail.tsx` · tokens: `src/app/globals.css`
**ข้อตกลงกับเบส:** ทำ **ทีละหน้า** · เบสนำว่าหน้าไหน + layout ยังไง · งานฉัน = **สร้าง component กลางที่ทุกหน้าใช้ร่วมกัน** (ไม่ inline ทิ้งๆ) โค้ดสะอาด ต่อยอดง่าย · layout ค่อยๆ ทำ
**บทเรียนสำคัญ:** dark mode → ความต่าง kit เก่า/ใหม่ (hover/border/เงา/ease-chrome) **แทบมองไม่เห็น** (เบส: "ไม่เห็นความต่างเลย") → ของจริงที่ตาเห็นคือ **composition (ความแน่น)** card-detail แน่น หน้าอื่นโล่ง → **แก้ layout/composition ที่เห็นจริง ไม่ใช่สลับ token**

## ✅ เสร็จ session นี้ (2026-06-23) — homepage "เข้ากับ card-detail + minimal"
> โจทย์เบส: "หน้าแรกทำให้เข้ากับ /cards/… ให้มัน minimal" · ยึดบทเรียน = แก้ composition ที่ตาเห็น ไม่ใช่สลับ token เฉยๆ
- **promote `SectionHead` → `src/components/shared/section-head.tsx`** (ชิ้น shared-kit ตัวที่ 2 ต่อจาก SetTile) · ไฟล์เดิม `card-detail/section-head.tsx` = re-export shim (card-detail ไม่ต้องแตะ) · ใช้จริงใน home-seo-content
- **`page.tsx` recompose:** ยก highlights (featured/gainers/losers) **ออกจากกล่อง panel** → เป็น **band แบนลอยบนพื้น** (warm hairline บน-ล่าง + เส้นคั่นคอลัมน์) แบบ section ของ card-detail · จัดจังหวะแนวตั้งโปร่ง (`mt-7/9/12`) · ในฟีด ad คั่น band↔ตาราง
- **calm market toolbar** (`home-market-overview.tsx`): tab underline ทอง→`border-foreground` · ปุ่ม filter ทอง+เงา→กลาง `bg-foreground/[0.06]` · border ทุกจุด→`var(--p-hair)` · search input→`surface-1`+hairline · `ease-chrome`
- **calm ตาราง:** `market-row` ตัด **zebra** (`even:bg-muted/20`) + hover ทอง→`hover:bg-foreground/[0.04]` + "P"/set-link ทอง→กลาง · `mobile-card-item`/`grid-card`/`pagination` hover/border→warm (⚠️ `mobile-card-item`+`grid-card` ใช้ที่ **/search** ด้วย → verify แล้วไม่พัง)
- **flatten SEO** (`home-seo-content.tsx`): feature card เอาเงา+วงกลมทองออก→`surface-1`+hairline flat · heading เส้นทอง `.section-heading`→`SectionHead`/`text-h3` · price box→flat
- **gold เหลือจุดเดียวจริง:** เหลือ honey-glow หลัง search hero (hero moment) + ลิงก์ใน SEO prose (ลิงก์ใช้งาน) — decorative gold (ปุ่ม/tab/ไอคอนวงกลม/เส้น heading) ออกหมด
- **glow หลัง search (เบสทัก 2 รอบ):** เดิม `bg-primary/10 blur-3xl` จางจนหาย → ทำ class กลาง **`.hero-search-glow`** mode-tuned · **รอบ 2 เบสว่า "แสงแปลก ๆ"** = gradient `58%×130%` สูงผอม เลยเป็นเสา/ลำแสง + ขอบแข็ง → แก้เป็น **bloom กว้าง-นุ่ม** `75%×85% at 50% 42%` → **รอบ 3-4 "ส่องจากบน + ทั้งจอ"** → full-bleed `w-screen left-1/2 -translate-x-1/2 -top-12 h-[24rem] blur-2xl` · **รอบ 5 "ไม่เห็นสาดลงมาเลย"** = `blur-3xl` กระจายจนจาง + radial เป็นก้อน → **linear-to-bottom (directional) + radial top** เข้มขึ้น (dark linear 30%/radial 34% · light 18/16%) ดันชิด header = แสงสาดลงมาจากบนเต็มจอ เห็นชัด (overflow-x:clip กัน h-scroll) · **รอบ 6 เบสให้ฉันตัดสินเอง** → settle = **radial focal core (กลางบน) + linear wash ลงล่าง** `-top-16 h-[30rem] w-screen blur-2xl` (dark radial 24%/linear 12% · light 13/8%) = premium เนียน มีโฟกัสที่ search ไม่ใช่หมอกแบน · **เบสเลือก v1** ✓ · **รอบ 7 light mode:** glow ใช้ `var(--primary)` ซึ่ง light = น้ำตาล `#73533E` หม่น → มองไม่เห็น/ขุ่นบนพื้นขาว → light mode เปลี่ยนเป็น **amber สะอาด `#F4A63C`** (radial 24%/linear 14%) = แสงอุ่นสาดจากบนเห็นชัดบนขาว · dark คง gold `var(--primary)` v1 · (render light mode ผ่าน Chrome CDP set localStorage theme — `/tmp/render-theme.mjs`)
- **search dropdown แบบ Fastwork (เบสขอ + ภาพอ้างอิง):** (1) **เอา chips "ยอดนิยม" ใต้กล่องออก** จาก `home-search-hero` (ลบ chips + import Link/getCardName ที่ไม่ใช้) (2) ย้ายยอดนิยม**เข้าไปใน dropdown** ตอน focus: section "ยอดนิยม" = **chip pills** (มีไอคอน trending) จาก `trending` + recent header เพิ่ม **"ล้างทั้งหมด"** (`clearRecent`) · `HeroSearchBar` รับ prop `trending` · pills เป็น Tab-focusable (ไม่อยู่ใน arrow-nav) · render จริงผ่าน CDP focus (`/tmp/render-focus.mjs`) ทั้ง light/dark
- **เบสทักสีตัวอักษร "ดำไปมั้ย":** light `--foreground` เดิม `#1D1D1F` = เกือบดำแต่**โทนเย็น** ตัดกับแบรนด์อุ่น เลยดูแข็ง → เปลี่ยน foreground/card-foreground/popover-foreground เป็น **warm soft-black `#292118`** (เอสเพรสโซ) = นุ่ม อุ่น พรีเมียม ยังผ่าน AA (~13:1) · **site-wide (light mode ทุกหน้า)** · ไม่แตะ `--warning-foreground` · dark fg `#F6EFE6` (warm off-white) ดีอยู่แล้ว · **ค้าง:** จะ warm `--background` เป็น off-white ด้วยไหม (เพิ่ม premium อีกขั้น)
- **hero แบบ Fastwork (เบสขอ — มีอ้างอิงภาพ):** headline พิมพ์คำเปลี่ยนไปเรื่อย ๆ + cursor กระพริบ + gradient ทันสมัย
  - สร้าง **`shared/typewriter-text.tsx`** (shared-kit ชิ้นที่ 3): type→hold→delete→คำถัดไป loop · **เคารพ reduced-motion** (โชว์คำเดียวนิ่ง) · SSR-safe (paint แรก = คำแรกเต็ม) · a11y = caller ใส่ `sr-only` heading คงที่ + animated span `aria-hidden`
  - `home-search-hero`: eyebrow `heroTeaser` + h1 ใหญ่ `text-3xl sm:text-5xl font-extrabold` หมุนคำ · **`.tw-caret`** กระพริบ (reduced-motion = นิ่ง)
  - **เบส feedback รอบ 2:** (1) headline ใหญ่ **เลิก gradient** → `text-foreground` ทึบ contrast สูง ไม่ถูกกลืน (gradient ทองโดน glow ทองกลืน) → ลบ `.text-gradient-honey` ทิ้ง (2) คำหมุน **เปลี่ยนเป็นฟีเจอร์แพลตฟอร์ม** ไม่ใช่ชื่อการ์ด
  - **เบส feedback รอบ 3:** (1) **ลบ subtitle** `heroSearchSubtitle` (เอา key ออกทั้ง 3 ภาษา ใช้ที่เดียว) (2) eyebrow `heroTeaser` → tagline startup กลาง ๆ ใช้นำหน้าได้ทุกฟีเจอร์ (3) คำหมุน **ครบทุกฟีเจอร์ live 10 ตัว**: ราคากลาง·ราคาย้อนหลัง·การ์ดมาแรง·ราคา PSA 10·พอร์ตการ์ด·จับตาราคา·แจ้งเตือนราคา·เทียบราคา·ราคาเด็ค·คำนวณดรอป (TH·EN·JP) · search bar `mt-5`→`mt-6` หลังลบ subtitle
  - **เบส feedback รอบ 4:** แพลตฟอร์ม **multi-game** (มี `model Game` · header มี game switcher) → ห้ามล็อกวันพีซ · `heroTeaser` + `heroSearchTitle` (sr-only) → game-agnostic: **"ทุกอย่างของการ์ดเกม ในที่เดียว"** + "เช็คราคาการ์ดเกม ทุกใบ ทุกเกรด" (EN "trading card" · JP "トレカ") · **ค้าง:** search placeholder `searchLong` ยังมีตัวอย่าง One Piece (Luffy/OP13-118/SEC) — รอเบสตัดสินว่าจะ generic/game-dynamic ไหม
  - **⚠️ hydration error (เบสเจอ):** dev server ISR-cache (`revalidate=300`) เสิร์ฟ HTML เก่าชน client สด → **ไม่ใช่บั๊กโค้ด · prod ปกติ** · fix = **restart dev server** (ฉัน kill ไม่ได้ — permission)

**A. card-detail mobile/chart (ต่อจาก session ก่อน):**
- mobile touch target: `SEGMENT_BTN` (range/filter) 24px→40px `h-10 md:h-6` · tabs 44px · edition/utility/secondary/sticky-CTA ≥40-44px · low/high `.text-overlay`→`.text-meta` · sticky grade label → `.text-eyebrow` · a11y: aria-label กราฟ + i18n `chartKeyboardHint`
- **chart แกน x bug → fix:** `xAxisTicks` (card-chart.tsx) เขียนใหม่ — thin แบบ even stride (เลิก `Math.round` ที่ตัดเบี้ยว 8·15·29·5) + ปัก "วันนี้" ขอบขวาแบบกันชน label (เลิก 1-Apr/5-Apr ทับ) · ลบ `thinTicks` · **+11 regression test** (chart-scale.test.ts) reproduce เคสพังจริง
- ad โซนราคา: chart-side + info-below ซ่อนบนมือถือ (`hidden lg:block`) · **เบสสั่ง:** ลบ `card-detail-mid` (แบนเนอร์ล่างสุด) · มือถือเหลือ ad 1 จุด (info-below ใต้ Meecard asks · ความสูง 280→`min-h-[120px] lg:min-h-[320px]`)

**B. homepage:**
- เพิ่ม **smart search hero** (`home-search-hero.tsx` + ยกเครื่อง `hero-search-bar.tsx`): บาร์ hero ใหญ่ + ผลแบ่งหมวด การ์ด/เซ็ต/ทางลัด + ⌘K + photo + recent + chips ยอดนิยม · ผูกใน `page.tsx` ดันข้อมูลลงล่าง
- **ลบ KPI strip** (`HomePreviewRow` — พอร์ต/honey/มูลค่าตลาด/ad) ออกจาก page.tsx (component ยังอยู่ ไม่ลบไฟล์)

**C. warm-kit migration (ระวัง — ส่วนนี้ "มองไม่เห็น" ใน dark · ดูบทเรียนบน):**
- foundation: `--panel-shadow`→`--elev-flat` (globals.css) = `.panel` ทั้งแอป flat+hairline
- audit ขนาน 6 กลุ่ม → 71 ไฟล์ old-kit · migrate **58 ไฟล์ className-only** (workflow): `hover:bg-muted`→`foreground/[0.04|0.06]` · `border-border`→`var(--p-hair)` · ตัดเงา card · `ease-chrome` · rounded · ตัด accent class เก่า · **ไม่แตะ logic** · tsc/lint/build ผ่าน

**D. /sets = หน้าแรกที่ยกเครื่อง layout (เบส approve ทิศ):**
- Top-5 list บางๆ → **featured grid รูปกล่อง + rank badge (#1 honey)** · เซ็ตไม่มีรูป → `SetPlaceholder` (gradient+รหัส) แทนกล่องเทา
- **refactor:** รวม card ซ้ำ → **`SetTile` ตัวเดียว** (rank optional) ใช้ทั้ง featured+grid (282→271 บรรทัด) = ชิ้นแรกของ "ชุดเครื่องมือกลาง"

## ⚠️ gotchas (กันเสียเวลา session หน้า)
- **dev server (:3000) cache SSR เก่า** ถ้า build เขียนทับ `.next` / มี `revalidate=300` → server-component change ไม่โผล่ · client component HMR ปกติ · **restart dev = วิธีแก้** (ฉัน kill เองไม่ได้ — permission กั้น · เบส restart ใน terminal) · เคยเปิด **prod :3001** ไว้ verify (อาจค้าง — ปิดได้)
- เรนเดอร์จริง: Chrome headless ผ่าน CDP (`--remote-debugging-port` + WebSocket) ได้ full-page/scroll/click — client component โชว์โค้ดใหม่แม้ SSR stale

## ⏭️ NEXT (session หน้า)
1. **เบส review หน้าแรกด้วยตา** (มี before/after ส่งให้แล้ว) → บอกว่า "minimal พอ/ไป layout ต่อ" หรืออยากดันต่อ (เช่น de-box ตารางทั้งก้อน · ปรับสัดส่วน featured/gainers/losers · ตัดคอลัมน์ตารางให้น้อยลง)
2. **เบสเลือกหน้าถัดไป** (ค้าง: /portfolio /decks /honey /seller /settings /marketplace ฯลฯ) + บอกแนว layout
3. ฉัน: ออกแบบ layout หน้านั้น → **ดึง component ซ้ำเป็นของกลาง** (shared-kit มีแล้ว: `SetTile` · `SectionHead` · ว่าที่ถัดไป: media/RankBadge/ImagePlaceholder/page-hero)
4. **9 ไฟล์ low-priority** (audit) ยังไม่ migrate (cosmetic) · KPI-strip components (portfolio/honey/market-value preview) ยัง old-kit แต่ **ไม่ render บนหน้าแรกแล้ว**
5. **commit:** ทั้ง session (homepage warm-kit + smart-search + warm-kit 58 + card-detail/chart + /sets) ยังไม่ commit → commit ขึ้น branch ใหม่ + PR เมื่อเบสสั่ง (ห้าม push master ตรง) · **build จริงตอน dev server ปิด**
