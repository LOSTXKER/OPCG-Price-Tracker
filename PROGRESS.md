# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-03 — **iOS Design Language Showcase** (เบส: "UXUI ทั้งเว็บให้ทันสมัย รองรับมือถือแบบ Apple iOS สวยๆ ทุกหน้า ลองทำตัวอย่างมาให้ดู")

## แหล่งอ้างอิง
- **spec เต็ม:** `doc/mine-multigame-spec.md` · **VISION:** identity §1 (ห้ามเปลี่ยน) + IA §2

## ✅ เสร็จ session นี้ — Showcase ที่ `/proto/ios/*` (6 หน้า)
เบสขอยกระดับ UX/UI ทั้งเว็บแบบ iOS แต่ scope ใหญ่เกินจะกวาดทั้งเว็บในรอบเดียว — ใช้ workflow proto-first (เหมือนที่เคยได้ผลกับ portfolio): สร้างภาษาดีไซน์ใหม่ + โชว์ 6 หน้าตัวอย่างที่ `/proto/ios/*` (เปิดดูได้เลยไม่ต้อง login) ให้เบสเคาะก่อน แล้วค่อยวางแผน rollout จริงเป็น batch แยกต่างหาก — **ยังไม่แตะหน้าจริงของเว็บเลยรอบนี้** (ยกเว้น `globals.css` เพิ่ม token แบบ additive + `next.config.ts` เพิ่ม image domain 1 บรรทัด)

**ทิศดีไซน์ = "iOS grammar × Meecard skin"**: เอาไวยากรณ์ของ iOS (Large Title ยุบเข้า nav ตอน scroll, frosted translucent chrome, grouped-inset list, tap ≥44px, safe-area) มาทับตัวตน espresso+honey เดิม (VISION §1 ห้ามเปลี่ยน) — ไม่ใช่ก๊อป Apple ตรงๆ

### 1. Token ใหม่ใน `globals.css` (additive)
- `.hairline-b` (bottom hairline, คู่กับ `.hairline-t` เดิม) · safe-area utilities (`.pt-safe`/`.pb-safe`/`.pl-safe`/`.pr-safe`) · `.text-large-title` (34px, iOS large-title สำหรับ collapsing-nav state)
- `.frost` (translucent blur chrome) **มีอยู่แล้วเดิม** — ใช้ต่อยอดแทนที่จะสร้างซ้ำ
- ⚠️ **ติด Impeccable design hook** ระหว่างแก้ (สแกนทั้งไฟล์ทุกครั้ง) เจอ 2 finding เดิมที่ไม่เกี่ยวกับงานนี้ (`--ease-spring` bounce-easing ที่ VISION.md บันทึกไว้ตั้งใจ + `.section-heading` side-tab border เดิมที่ใช้อยู่แล้วในแอป) — ถามเบสแล้วยืนยัน suppress ทั้งคู่ผ่าน `hook-admin.mjs ignore-value`/`ignore-file` (มี reason บันทึกไว้ใน `.impeccable/config.json`)

### 2. Shell กลาง `src/app/proto/ios/`
- `layout.tsx` + `_components/ios-shell.tsx` — frosted collapsing nav bar (โปร่งใสตอนอยู่บนสุด → frost+hairline+compact title ตอน scroll ผ่าน 8px) + back button อัตโนมัติสำหรับ route ลูก (`portfolio/[id]`, `cards/[code]`) + bottom tab bar 4 ช่อง (มือถือ) / side rail (desktop, ตรง VISION §2 "desktop = side-rail ไม่ใช่คอลัมน์มือถือยืด")
- `_components/large-title.tsx` (`<LargeTitle>`) + `_components/grouped-list.tsx` (`<GroupedSection>`/`<GroupedRow>` — iOS grouped-inset table view atom)
- `_data.ts` — mock กลาง 1 ไฟล์ (การ์ดจริงจาก R2/pokemontcg.io, deterministic) ให้ทั้ง 6 หน้าใช้ตัวเลขตรงกัน

### 3. หกหน้า (home เขียนเอง 5 หน้าที่เหลือ delegate ให้ subagent ขนานกัน โดยส่ง shell+atoms+mock ที่ล็อกแล้วเป็นข้อกำหนด กันดริฟต์)
- **`/proto/ios`** (ตลาด) — search field + game filter chips + มูฟเวอร์ rail + ตารางการ์ด grouped list
- **`/proto/ios/portfolio`** — dashboard hero รวมทุกพอร์ต + grid การ์ดพอร์ต (thumbnail strip) กดเข้า detail
- **`/proto/ios/portfolio/[id]`** — hero + `SegmentedControl` ภาพรวม/เชิงลึก + grouped holdings + sparkline
- **`/proto/ios/cards/[code]`** — จอซับซ้อนสุด: hero price + grade chips (กดสลับราคา) + range bar + chart SVG + sources + specs + related + sticky buy bar (จุดทองคำเดียวทั้งจอ)
- **`/proto/ios/watchlist`** — filter ทั้งหมด/ปักหมุด + grouped list + pin/alert micro icons
- **`/proto/ios/more`** — grouped-inset เต็มรูปแบบ (profile → Pro upsell → 4 sections → sign-out destructive)

### 4. บั๊กที่เจอ+แก้ระหว่าง verify
- **`react-hooks/set-state-in-effect`** ใน `ios-shell.tsx` — เรียก `setScrolled()` ตรงๆ ใน effect body → แก้เป็น lazy initializer ใน `useState(() => ...)` แทน
- **RSC serialization error** ใน `more/page.tsx` — Server Component ส่ง lucide icon component (function reference) เป็น prop เข้า Client Component `GroupedRow` → ไม่ serialize ได้ → แก้เป็น `"use client"` (หน้า static อยู่แล้ว ไม่มีผลด้าน perf)
- **`next/image` domain error** — รูป Pokémon จาก `images.pokemontcg.io` ไม่อยู่ใน allowlist → เพิ่ม 1 entry ใน `next.config.ts` (additive, จะใช้ซ้ำตอนทำ Pokémon integration จริงตาม roadmap อยู่แล้ว)
- **ความไม่สอดคล้องเล็กน้อย**: หน้า portfolio hub ใช้ `blur-sm` ซ่อนยอด ส่วนหน้าอื่นใช้ dot `••••` (ตรงกับ `MASKED` convention ของแอปจริง) → รวมเป็น dot convention เดียวกันทั้งหมด

**verify:** tsc 0 · lint 0 err (34 warning เดิม ไม่เพิ่ม) · test 56/56 · build ✓ (ทั้ง 6 route ขึ้นจริง) · impeccable detect `[]` · curl smoke test ทุก route 200 ไม่มี server/runtime error

## ⚠️ ยังไม่ได้ทำ — เบสต้องเปิดดูเอง
เครื่องมือเปิด browser จริงไม่พร้อมใช้งาน session นี้เหมือนรอบก่อน — verify จำกัดแค่ build/lint/test/curl static-HTML check **ยังไม่เห็นภาพเคลื่อนไหวจริง** (โดยเฉพาะจุดที่สำคัญสำหรับงานนี้: nav bar collapse ตอน scroll, frosted blur, spring motion, tap target บนมือถือจริง)

## ⏭️ NEXT
1. **สำคัญที่สุด**: เบสเปิด `localhost:3000/proto/ios` บนมือถือจริง (หรือ resize browser 390px) ไล่ดูทั้ง 6 หน้า — เช็ค:
   - scroll แล้ว nav bar โผล่ frost + compact title ลื่นไหม
   - แตะ grade chip ในหน้าการ์ด ราคาเปลี่ยนถูกไหม
   - tab bar/side rail active state ชัดไหม
   - โทน espresso+honey ยังรู้สึกเป็น Meecard ไหม หรือรู้สึก "เป็น iOS เกินไปจนไม่เหมือนแบรนด์"
2. เบสเคาะ (ชอบ/ไม่ชอบ/ปรับตรงไหน) → เขียนแผน **rollout จริง** เป็น batch แยก (ตาม plan เดิมเสนอ: chrome ก่อน → หน้า MONEY → PLAY → ที่เหลือ) — งานนี้ยังไม่ได้เริ่ม
3. ลบ `/proto/ios/*` ทิ้งหลัง rollout จริงเสร็จ (หรือเก็บเป็น reference เหมือน `/proto/portfolio`)
4. Hub/Detail portfolio split (จาก session ก่อนหน้า) ยังไม่ได้ commit เป็นทางการ — รวมอยู่ใน checkpoint `dd4e15d`
