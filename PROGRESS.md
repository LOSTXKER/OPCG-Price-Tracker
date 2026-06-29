# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-29 — **frameless redesign ทั้งเว็บ + sets/set-detail + การ์ดขาว+เงานุ่ม** → **pushed `master`** (เบส override กฎ ⛔ direct-push เอง · ไม่ผ่าน PR) → Vercel auto-deploy · build ✓ ~140 routes · test 56/56 · lint 0 err · console สะอาด · 2 รอบ regression audit (workflow) แก้ครบ · **ไม่แตะ `src/{components,app}/portfolio` (งานอีกทีม · 25 ไฟล์ค้าง uncommitted)**

## ✅ เสร็จ session นี้ (frameless + sets redesign) — commit `c8d597c`
- **Sets index + set-detail redesign:** identity-led hero (OP/ST code เป็นพระเอก · เอามูลค่า/กราฟออก) · compact rarity-**filter** grid · section heading กลางจอ · shared `RarityBadge` + `SegmentedControl` · data layer กลาง `src/lib/data/set-detail.ts` · component ใหม่ `set-hero.tsx` `set-card-tile.tsx`
- **Navbar:** เต็มจอ · โปร่งตอนบน → ทึบตอน scroll (Apple/Vercel pattern) · **glow เดียวกลางบนจอ** ย้ายมาอยู่ที่ layout (`main-chrome` PageContent) ใช้ทุกหน้า
- **Frameless ทั้งเว็บ (เบส "ไม่อยากให้มีกรอบ"):** light-mode การ์ด = **ขาว `--card:#FFF` + เงานุ่ม** (`--panel-shadow` soft drop shadow) → เด่นด้วยเงา ไม่ใช่กรอบ/เบจ · `.panel`/`Card`/`Surface outline` ใช้ `shadow-[var(--panel-shadow)]` (light เงา · dark = inset hairline จาก token เดียวกัน) · `Select`/`SegmentedControl pill`/ปุ่ม `outline` = filled ไม่มีเส้น · card-art tiles เอากรอบออก
  - **ประวัติการลอง:** flat+border → tint ครีม `#F7F1E8` (เบสว่าเบจขุ่น) → **ขาว+เงา (เบสเลือก)** = สะอาด/พรีเมียม
  - **กฎสำคัญ:** light `--card == --background == #FFF` → ต้องมี **เงา** (หรือ fill อื่น) แยกการ์ด · `bg-card` เดี่ยวๆ (ไม่ใช่ .panel/Card/Surface) = ขาวบนขาวจมหาย → ใส่ `shadow-[var(--panel-shadow)]` หรือเปลี่ยนเป็น `bg-muted` · container ที่อุ้มการ์ด (เช่น TabSection) = flat `shadow-none` กัน double-shadow
- **Regression audit (workflow 23 agents · adversarial verify) → เจอ 14 แก้หมด:**
  - **บั๊ก sweep ตัวเอง:** heuristic จับ `hover:bg-muted` เป็นพื้นถาวร → ถอดเส้น 11 element ที่โปร่งตอนพัก → **คืนเส้นให้ 11 จุด** (ตัวมีพื้นจริง 37 จุดคง frameless)
  - search toolbar `bg-muted/20`→`bg-popover` (ปุ่ม filled เด้งชัด) · profile card nesting → container `bg-card/40` (โปร่ง · การ์ดเด่นกว่า) · marketplace product image `.panel`→`bg-popover` (รูปต้องพื้นขาว)
- **Hardcode-UI audit:** เว็บสะอาด · hex เหลือเฉพาะที่จำเป็น (OG/Satori · error-fallback · FB-blue · color-guide) · แก้ rarity-bar fallback `bg-neutral-400`→`bg-muted-foreground/40` · เก็บที่ตั้งใจ (card-color swatch · medal slate=เงิน · QR bg-white · admin-login ดำตลอด)

## 🎯 โปรเจคใหญ่ (ข้ามหลาย session) — memory `warmkit-redesign-rollout`
ไล่ redesign **ทุกหน้า**ให้ใช้ภาษาดีไซน์เดียวกับ **card-detail** ("warm primitive kit") · ref: `src/components/cards/card-detail.tsx` · tokens: `src/app/globals.css`
- **ข้อตกลง:** ทำ **ทีละหน้า** · เบสนำว่าหน้าไหน + layout · งานฉัน = สร้าง **component กลาง** ที่ทุกหน้าใช้ร่วม (โค้ดสะอาด ต่อยอดง่าย) · prefer layout/composition ที่ตาเห็นจริง ไม่ใช่สลับ token เฉยๆ
- **บทเรียน:** dark mode → ความต่าง hover/border/เงา **แทบมองไม่เห็น** → ตัวจริงคือ composition (ความแน่น)
- **card-detail (north-star) ใช้ active tab แบบ neutral** (`text-foreground` + underline foreground) **ไม่ใช่ honey** → honey สงวนแค่ glow/focus/sort-icon/image-ring → ห้ามยัด honey เข้า active-state
- **redesign เสร็จแล้ว:** home · card-detail · sets index · set-detail · (chrome: navbar + glow)

## ⛔ ตัดสินแล้ว (อย่าเสนอซ้ำ)
1. ภาพ "SAMPLE" การ์ด → ปล่อยไว้
2. SetChipRail (chip เลือกชุด) → ไม่เอา (ชุดเยอะ) ใช้ SetPicker dropdown
3. navbar = **โปร่งเต็มตอนบน** (ไม่มี backdrop) → ทึบตอน scroll — เบสเคาะแล้ว
4. **frameless: เก็บเส้นไว้** ที่ — overlay (แยกด้วยเงา) · กล่อง `bg-background`/no-fill (เส้นเป็นตัวแยกเดียว) · input · divider · ตาราง · dark mode hairline

## ⚠️ gotchas
- **dev `.next` cache:** รัน `npm run build` แล้ว `npm run dev` ปน format กัน → hydration "1 Issue" ลวง · แก้: kill dev → **`mv .next /tmp/...`** (rm ถูก block) → `npm run dev` ใหม่ · CSS/className edit ไม่ทำ hydration พังจริง = ของลวง HMR ค้าง
- **screenshot:** Chrome headless ผ่าน CDP — script ที่ `/tmp/shot-*.mjs` (full-page/viewport/dark/click/dialog) · `console-check.mjs` เช็ก error
- **portfolio off-limits:** `src/components/portfolio/` + `src/app/portfolio/` = WIP อีกทีม · ห้ามแตะ/commit · (ไฟล์ชื่อ portfolio ที่อยู่นอก 2 dir นี้ เช่น `cards/card-add-to-portfolio.tsx` = ของเรา แก้ได้)
- **push master:** ปกติ ⛔ ห้าม direct (ใช้ PR) — รอบนี้เบส override เอง

## ⏭️ NEXT (session หน้า)
1. **เบสเปิดดู prod หลัง Vercel deploy** (opcg-price-tracker.vercel.app) — frameless + sets ทั้งเว็บ · ถ้าโทนครีม `#F7F1E8` อยากเข้ม/อ่อนกว่านี้ปรับค่าเดียวใน globals.css
2. เบสเลือกหน้าถัดไป redesign (ค้าง: /decks /honey /seller /settings /marketplace /trending /compare /drop-calculator) + แนว layout
3. ถ้าเบสเอา: identity OPTCG ใน empty-state/microcopy · ยุบ top chrome (งาน header ทั้งแอป)
4. อนาคต: PSA9/8/BGS data จริง → เปิด tier ใน `MARKET_GRADE_TIERS` (real:true)
