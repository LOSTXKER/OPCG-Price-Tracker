# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-29 — **frameless ทั้งเว็บ (การ์ดขาว+เงา) + sets/set-detail รื้อใหญ่ + card hover ใหม่** → ทุกอย่าง **pushed ตรง `master`** (เบส override กฎ ⛔ direct-push เอง · ไม่ผ่าน PR) → Vercel auto-deploy · master tip `7956f7f` · build ✓ ~140 routes · test 56/56 · lint 0 err · **ไม่แตะ `src/{components,app}/portfolio` (งานอีกทีม · ค้าง uncommitted)**

## ✅ เสร็จ session นี้ (ทั้งหมด live บน master)
**Frameless + elevation ทั้งเว็บ:** light-mode การ์ด = **ขาว `--card:#FFF` + เงานุ่ม** (`--panel-shadow` soft drop shadow) · `.panel`/`Card`/`Surface outline` ใช้ `shadow-[var(--panel-shadow)]` (light เงา · dark = inset hairline token เดียวกัน) · `Select`/`SegmentedControl pill`/ปุ่ม `outline` = filled ไม่มีเส้น · ลองมาแล้ว: flat+border → ครีม `#F7F1E8` (เบจขุ่น) → **ขาว+เงา (เบสเลือก)**
- **กฎ:** `bg-card` เดี่ยวๆ (ไม่ใช่ kit) = ขาวบนขาวจมหาย → ใส่ `shadow-[var(--panel-shadow)]` หรือ `bg-muted` · container ที่อุ้มการ์ด = `shadow-none` กัน double-shadow · 3 รอบ audit (workflow): frameless + white-shadow + full-site QA 60 หน้า incl hover → แก้ครบ

**Card hover ใหม่ (เลิก ring/border) — utility กลางใน globals.css:**
- `.group-lift` — **รูปการ์ดในกริดยกลอย+ซูม 1.04x+เงา** ตอน hover wrapper (`.group`/`.group/card`)
- `.hover-lift` — การ์ดเต็มใบยกลอย+เงา ตอน hover ตัวเอง · เงา light=อุ่น dark=ดำ · respect reduced-motion
- ใช้แล้ว: set tiles, sets index, card-detail grids, card-item, grid-card, profile listing

**Navbar:** เต็มจอ · โปร่งตอนบน→ทึบตอน scroll · **glow เดียวกลางบนจอ** (อยู่ที่ `main-chrome` PageContent ทุกหน้า)

**Set-detail (`/sets/[code]`) รื้อใหญ่ (เบส iterate เยอะมาก):**
- **2 คอลัมน์ (desktop lg+):** ซ้าย = **sidebar sticky** (`top-32`) รวม control ทุกตัว มี label หัวข้อแต่ละอัน: ประเภท / สี (dropdown โชว์แค่ค่า, hideLabel) · ช่วงเปลี่ยนแปลง (24h/7d/30d) · **ความหายาก = jump-nav** · ขวา = การ์ดล้วน
- **rarity = JUMP-NAV ไม่ใช่ filter** (เบสเปลี่ยนใจ): กด → smooth-scroll ไป section นั้น + **scrollspy** ไฮไลต์ section ที่กำลังดู · type/สี = filter จริง · `scrollToRarity` offset `-132` (พ้น navbar ~101px)
- **sidebar minimal:** rarity rail = **จุดสีเล็ก + โค้ดตัวอักษร** (ไม่ใช่ RarityBadge pill เต็มสี) — เบาตา
- **มือถือ:** sidebar ซ่อน · filter toolbar (flex-wrap แพ็คซ้าย) + rarity jump-chips อยู่บน · การ์ดเต็มกว้าง
- **section heading กลางจอ** (ชื่อ+RarityBadge+count ขนาบเส้น) · **เส้น toolbar เอาออก** (กันเส้นซ้อน)
- **Hero = แนวนอนทุกจอ** (รูปซ้าย/ข้อมูลขวา) · มือถือการ์ด **self-stretch** (fixed width + object-cover) สูงคลุมถึง drop-rate · sm+ = poster aspect-3/4 จัดกลาง · **เอา "ราคาเฉลี่ย" ออก** (เหลือ การ์ด + มูลค่าสูงสุด)
- **"ชุดอื่นๆ" rail ล่างสุด** (`OtherSets` + `getOtherSets`, fallback รูปการ์ดถ้าไม่มี box art)

**อื่นๆ:** FAQ (shared `faq-section`) hover bg โค้งตามมุม (overflow-hidden) + เพิ่มระยะ Q/A · **AdSlot** = house-ad (upgrade Pro) → **placeholder "พื้นที่โฆษณา"** (key `adSpace`) · `Select` default `modal={false}` (กัน dropdown scroll-lock navbar) · filter dropdown เปิดใต้ปุ่ม content-width (align=start)

## 🎯 โปรเจคใหญ่ (ข้ามหลาย session) — memory `warmkit-redesign-rollout`
ไล่ redesign **ทุกหน้า** ภาษาดีไซน์เดียวกับ card-detail (warm kit + white+shadow frameless + card hover lift) · ref: `card-detail.tsx` · tokens: `globals.css`
- **ข้อตกลง:** ทำ **ทีละหน้า** · เบสนำหน้า+layout · งานฉัน = สร้าง **component กลาง** ใช้ร่วม · prefer layout/composition ที่ตาเห็น
- **card-detail (north-star):** active tab = neutral (`text-foreground`+underline foreground) **ไม่ใช่ honey** · honey สงวนแค่ glow/focus/sort-icon/image-ring
- **redesign เสร็จ:** home · card-detail · sets index · **set-detail (รื้อหนักรอบนี้)** · chrome (navbar+glow) · card hover (ทั้งเว็บ)

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. ภาพ "SAMPLE" การ์ด → ปล่อยไว้ · SetChipRail → ไม่เอา ใช้ dropdown
2. navbar โปร่งเต็มตอนบน (ไม่มี backdrop) → ทึบตอน scroll
3. **set-detail: rarity = jump-nav** (กดเลื่อนไป section) ไม่ใช่ filter · type/สี = filter
4. **hero แนวนอนบนมือถือด้วย** (การ์ดซ้าย) · การ์ด cover ถึง drop-rate
5. **sidebar minimal** = dot+code ไม่ใช่ pill เต็มสี
6. frameless เก็บเส้นไว้ที่: overlay (เงาแยก) · `bg-background`/no-fill · input · divider · ตาราง · dark hairline

## ⚠️ gotchas
- **dev `.next` cache ค้างบ่อยมาก** (รอบนี้เจอหลายครั้ง): HMR เสิร์ฟโค้ดเก่า → ดู render/วัด layout ผิด · แก้: kill dev → **`mv .next /tmp/...`** (rm ถูก block) → build → restart · **ถ้า layout แปลก ให้ restart clean ก่อนสงสัยโค้ด**
- **screenshot:** Chrome headless CDP — `/tmp/shot-*.mjs` (light/full/hover/dialog/scrollto/scrollcap) · `qa-shot.mjs` (port param) · `console-check.mjs` · วัด element = `main header` (navbar ก็เป็น `<header>`)
- **portfolio off-limits:** `src/{components,app}/portfolio/` ห้ามแตะ/commit · (ไฟล์ชื่อ portfolio นอก 2 dir นี้ = ของเรา แก้ได้) · stage ทุกครั้งเช็ก `grep -E "^src/(components|app)/portfolio/"` = 0
- **push:** เบส override ให้ push ตรง master ได้ (รอบนี้) · จบ commit ด้วย `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

## ⏭️ NEXT (session หน้า)
1. เบสเปิด prod (opcg-price-tracker.vercel.app) เช็กรอบสุดท้าย — set-detail / hero มือถือ / sidebar minimal / ชุดอื่นๆ / FAQ / พื้นที่โฆษณา
2. **เบสเลือกหน้าถัดไป redesign** (ค้าง: /decks /trending /compare /honey /seller /settings /marketplace /drop-calculator) — ใช้ภาษาเดียวกัน (warm + white+shadow + frameless + card hover lift)
3. ปรับได้ค่าเดียว: โทน/เงาการ์ด (globals.css `--card` / `--panel-shadow`) · ความซูม hover (`.group-lift`)
4. อนาคต: PSA9/8/BGS data จริง → เปิด tier ใน `MARKET_GRADE_TIERS` (real:true)
