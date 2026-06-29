# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-29 — **Typography full sweep ทั้งเว็บ** (workflow audit 15 โซน → แก้ครบ 91/91 findings · 205 จุด/92 ไฟล์) → branch `ui/sets-redesign` · **verify ครบ: lint 0 err · test 56/56 · build ✓ ~140 routes** · **ยังไม่ commit** (รอเบสเคาะ + กัน portfolio WIP อีกทีม) · ก่อนหน้า: frameless+sets/set-detail รื้อใหญ่ live บน `master` แล้ว (`7956f7f`)

## ✅ เสร็จ session นี้ — Typography sweep (ยังไม่ commit)
ตรวจขนาดฟอนต์ทั้งเว็บด้วย workflow (15 auditor → 91 findings: high 3 · med 43 · low 45) → เบสสั่ง "ทำหมด" → workflow แก้ 15 area พร้อมกัน (agent `dev`, ต่อ area แตะเฉพาะไฟล์ตัวเอง ไม่ race):
- **3 จุดแดง (อ่านออก/ลำดับชั้น):** marketplace `listing-card:108` ชื่อการ์ดจางกว่าคนขาย → `.text-h5` · blog `[slug]:174` `prose-sm`→`prose` (บทความ 14→16px) · profile `reviews-preview` prose 13→15px + วันที่ `.text-overlay`10→`.text-meta`13px
- **systemic (role ซ้ำ → token เดียว):** form label → `.text-label` (auth/seller/marketplace/admin/alert ~20 จุด) · item title → `.text-h5` (honey mission/achievement แถวแบน + admin) · badge/pill → `.text-micro` (11px) · section heading → `.text-h3` · guide section `text-xl`→`.text-h2` (6 หน้า ~30 จุด) · price → `.text-price` · column header → `.text-eyebrow` · honey balance `text-2xl`→`.text-h1`
- **primitives (ลามทั้งเว็บ):** Card/Dialog/Sheet title → `.text-h4` (unify weight 600) · button `text-[0.8rem]`→`text-sm` (arbitrary ตัวเดียวในเว็บ + แก้ inversion) · input → `text-base md:text-sm` (กัน iOS focus-zoom)
- **4 judgement-call เบสเคาะ "แก้หมดให้จบ" → แก้แล้ว:** `badge.tsx` ป้ายทั้งเว็บ→`.text-micro` (11px) · faq/related หัวข้อ section h2→`.text-h3` (เท่า SectionHead กลาง) · profile reviews heading h5→`.text-h4` (เท่าแท็บเต็ม) · settings ชื่อหน้า h2→`.text-h1` (เท่าหน้าอื่น) — **แก้ครบ 91/91**

**0 arbitrary `text-[Xpx]` เหลือในเว็บแล้ว** (button ตัวสุดท้ายแก้แล้ว) · token system adopt เพิ่มอีก ~200 จุด

## 🎯 โปรเจคใหญ่ (ข้ามหลาย session) — memory `warmkit-redesign-rollout`
redesign ทุกหน้าภาษาเดียวกับ card-detail (warm + white+shadow frameless + card hover lift) · ทำทีละหน้า · เบสนำ layout · งานฉัน = component กลาง
- **redesign เสร็จ (บน master):** home · card-detail · sets index · set-detail · chrome · card hover · **+ typography sweep ทั้งเว็บ (รอ commit)**

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. set-detail: rarity = jump-nav (ไม่ใช่ filter) · sidebar minimal dot+code · hero แนวนอนทุกจอ
2. navbar โปร่งบนสุด→ทึบตอน scroll · glow เดียวกลางบน
3. frameless: light=ขาว+เงา · เก็บเส้นไว้แค่ overlay/input/divider/table/dark-hairline
4. **typography: ป้าย badge ทั้งเว็บ = 11px** (`.text-micro`) · หัวข้อ section ใน-content = 19px (`.text-h3`) ระดับเดียว · ชื่อหน้า = `.text-h1` ทุกหน้า

## ⚠️ gotchas
- **portfolio off-limits:** `src/{components,app}/portfolio/` ห้ามแตะ/commit (งานอีกทีม uncommitted) · ไฟล์ชื่อ portfolio นอก 2 dir นี้ (เช่น `cards/card-add-to-portfolio`) = ของเรา แก้ได้ · **stage ทุกครั้งเช็ก `git status --short | grep -E "(src/(components|app)/portfolio/)"` แล้วอย่า add path พวกนั้น**
- **commit typography sweep:** ต้อง stage เฉพาะ 88 ไฟล์ที่แก้ (ห้ามรวม portfolio M ของอีกทีม) — `git add` ทีละ path หรือ pathspec exclude portfolio
- **dev `.next` cache ค้างบ่อย:** layout แปลก → kill dev → `mv .next /tmp/...` → build → restart ก่อนสงสัยโค้ด
- **token spec:** `.text-price`=15px/600/mono/tabular (canonical price) · `.font-price`=แค่ tabular utility · heading h1-h5/display ไม่ ship color (เก็บ text-primary/destructive util ไว้) · `.text-meta`/`.text-eyebrow` ship muted เอง
- workflow output ของ audit+fix: `/tmp/font-fix/*.json` (findings ราย area) · task output ใน `/private/tmp/.../tasks/{wt19gfxbg,wlmov6d0s}.output`

## ⏭️ NEXT (session หน้า)
1. **เบสเคาะ commit:** จะ commit typography sweep (88 ไฟล์) เข้า branch นี้ / push master เลยมั้ย — ฉัน stage แบบกัน portfolio ออกให้
2. **เบสเปิด prod เช็ก visual** จุดที่ขนาดเปลี่ยนจริง: honey balance (ใหญ่ขึ้น 24→30px) · marketplace listing-card · guide headings · blog article (ใหญ่ขึ้น) · form labels (เล็กลง 15→13px) · ป้าย badge (เล็กลง 13→11px) · settings ชื่อหน้า (ใหญ่ขึ้น) — ถ้าจุดไหนไม่ชอบ ปรับ token เดียวจบ
3. เลือกหน้าถัดไป redesign (ค้าง: /trending /compare /honey /seller /settings /marketplace /drop-calculator)
