# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-22 — **card-detail mobile/chart polish → homepage redesign → เริ่ม "ยกเครื่องทุกหน้าให้เข้ากับ card-detail" (page-by-page)** · tsc 0 · lint 0 err · build ✓ · test 56 · **ทั้งหมดยัง working tree ยังไม่ commit**

## 🎯 โปรเจคใหญ่ที่กำลังทำ (ข้ามหลาย session) — อ่าน memory `warmkit-redesign-rollout`
ไล่ redesign **ทุกหน้า**ให้ใช้ภาษาดีไซน์เดียวกับ **card-detail** ("warm primitive kit": `.surface-1`+`.hairline` flat · `SectionHead` · honey accent จุดเดียว · `.tnum` · `.ease-chrome` · spacing โปร่ง) · ref: `src/components/cards/card-detail.tsx` · tokens: `src/app/globals.css`
**ข้อตกลงกับเบส:** ทำ **ทีละหน้า** · เบสนำว่าหน้าไหน + layout ยังไง · งานฉัน = **สร้าง component กลางที่ทุกหน้าใช้ร่วมกัน** (ไม่ inline ทิ้งๆ) โค้ดสะอาด ต่อยอดง่าย · layout ค่อยๆ ทำ
**บทเรียนสำคัญ:** dark mode → ความต่าง kit เก่า/ใหม่ (hover/border/เงา/ease-chrome) **แทบมองไม่เห็น** (เบส: "ไม่เห็นความต่างเลย") → ของจริงที่ตาเห็นคือ **composition (ความแน่น)** card-detail แน่น หน้าอื่นโล่ง → **แก้ layout/composition ที่เห็นจริง ไม่ใช่สลับ token**

## ✅ เสร็จ session นี้
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
1. **เบสเลือกหน้าถัดไป** (ค้าง: /portfolio /decks /honey /seller /settings /marketplace ฯลฯ) + บอกแนว layout
2. ฉัน: ออกแบบ layout หน้านั้น → **ดึง component ซ้ำเป็นของกลาง** (ว่าที่: promote `SectionHead` เป็น shared · media/RankBadge/ImagePlaceholder/page-hero ตามเจอจริง)
3. **9 ไฟล์ low-priority** (audit) ยังไม่ migrate (cosmetic)
4. **commit:** ทั้ง session (homepage + warm-kit 58 + card-detail/chart + /sets) ยังไม่ commit → commit ขึ้น branch ใหม่ + PR เมื่อเบสสั่ง (ห้าม push master ตรง)
