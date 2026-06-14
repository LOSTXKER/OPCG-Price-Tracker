# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history) · hook โหลดไฟล์นี้ทุก session
> session ใหม่: อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-14 — **เขียนแผนดีไซน์ใหม่เสร็จ (world-class, de-versioned) ลง [VISION.md](VISION.md) + build order ใน [PLAN.md](PLAN.md)** · จาก research 8 lane (platform ระดับโลก) · จัดบ้านเอกสารเรียบแล้วก่อนหน้า

## ▶ สถานะตอนนี้
- **[VISION.md](VISION.md) = แผนดีไซน์ฉบับสมบูรณ์** (เขียนใหม่จาก research workflow 8 lane): identity warm-premium · 3-axis IA · **atom kit** · visual-system discipline · **per-surface spec เต็ม** (card detail+grades+SNKR comps · marketplace+escrow · portfolio honesty · deck/meta/tier · chat/profile/reputation · ads+AdSense · multi-game/Pokémon) · data-model evolution · reference platforms
- **[PLAN.md](PLAN.md) §🎨 Redesign = build order** (de-versioned, ไม่มี v1/v2): Foundation → Card detail → Portfolio → Marketplace → Chat → PLAY → Ads → Multi-game
- **เอกสารจัดเรียบแล้ว** (รอบก่อน): CLAUDE (entry+map) → @AGENTS · SPEC · PLAN · PROGRESS · VISION · doc/archive (REDESIGN เก่า) · ลบ .claude/CLAUDE.md ซ้ำ · dev.md ตามวงจรเดียวกัน
- **โค้ดที่แตะแล้ว (ยังไม่ commit, working tree):** warm primitive kit ใน `globals.css` + card-detail refine pass-1 (glow/sticky/honey-toggle/frost) · ผ่าน verify + adversarial review

## 📌 กฎ design-system (ใช้ทุก surface — จาก VISION §1/§4)
- honey-gold = accent interactive เดียว **< 5% ของจอ** (active/selected/focus/CTA) · gain/loss เขียวแดงแยก · per-game tint ทับไม่กลบ honey
- **การ์ดเนื้อหาใหญ่ = `.panel`** · `surface-*`/`hairline` = chip/control/nested · `.hairline` unlayered → อย่าผสม ring/shadow บน element เดียว
- one hero number/screen · tabular-nums + ▲/▼ ทุก delta · ศูนย์ spinner (skeleton รูปร่างตาม content) · atom kit ใช้ซ้ำทุกหน้า

## ▶ สถานะ build (ยังไม่ commit · อยู่ working tree)
- **Card detail = proto visionary port (สะอาด, mock-filled)** — เบสชอบ proto กว่า (โมเดิร์น/ไม่รก) + สั่ง "ถอด est, ใช้ mock เติมให้เต็ม เพื่อดูโครงสร้าง UI": grid `340px/1fr` (ซ้าย sticky image+identity+EditionToggle+CTA · ขวา hero ใหญ่ (scrub-rebind) + 3-stat box + grade chips outline + **clean area chart** (`mini-chart` แทน Recharts) + range 1M/3M/1Y/All + High/Avg/Low + tabs Comps/Listings/Population/Specs)
- **ถอด "est" ออกหมด** (เบสว่ารก) · ใช้ `mock.ts` (deterministic, ไม่มี RNG) เติม series/comps/sales · ของจริง (Raw A=Yuyutei, PSA 10=SNKR) ยังจริง · ⚠️ **prototype phase = mock เพื่อดู UI** — ตอน launch จริงต้องกลับมาทำ honesty labeling (VISION §5.1)
- **logo แหล่งจริง** (favicon ดึงจริง เก็บ `public/sources/`: SNKRDUNK/Yuyutei/eBay/TCGplayer/Cardmarket/Mercari) + `SourceLogo` atom → โชว์ใน Comps แทนจุดสี
- **font:** คง **Kanit** (= font ที่ proto ใช้ · proto ไม่ได้ตั้ง font เอง) · **เปลี่ยนตัวเลขใน card-detail จาก JetBrains Mono → Kanit tabular (`.tnum`)** = ตรงกับ proto (เลขดูเนียน ไม่ใช่ monospace แข็ง)
- verify ครบ (tsc/lint 0err/build/test 36/36) · ยังไม่ commit
- **Foundation slice 1 ✅** motion/elevation token (`--dur-*`/`--ease-*`/`--elev-*`) + button/`.ease-chrome`/`.rise` → token · atom kit หลักมีอยู่แล้ว (`PriceDisplay`/`Surface`/`Skeleton`/`ListRow`)
- **Card detail เต็มภาพ ✅** (data-safe) — GradeRail (Raw A/B/C·PSA 10/9/8·BGS) + EditionToggle + stat row + Recent prices feed + population + chart · atoms ใหม่ 5 ไฟล์ (`grades.ts`/`grade-value`/`grade-rail`/`edition-toggle`/`recent-sales`/`population-strip`)
- **ผ่าน 2 รอบ adversarial review:** รอบแรกเจอ 22 (รวม 1 blocker honesty) → fix หมด · รอบ recheck ยืนยัน **ปิดครบ ไม่มี residual**
- **verify:** tsc ✓ · lint 0 err ✓ · build ✓ · test 36/36 ✓
- **honesty model:** เกรดมีข้อมูลจริง (Raw A=Yuyutei · PSA 10=SNKR) = ของจริง · เกรดอื่น = "est." (ติดป้าย+tooltip+aria) · last-sale = ข้อมูลขายจริงเท่านั้น · recent-prices ทุกแถวติดป้าย Sold/Listed จาก type จริง

## ▶ Proto-port ทั้งแอป (เบสสั่ง · restyle proto + เสียบระบบจริง · chrome ก่อน)
- **Phase 1 Chrome ✅ (restyle-only, verified live):** header/header-mobile = `frost` + hairline · nav active = honey-soft pill · bottom-nav `frost` · game-switcher + search = proto pill (surface-2/ring) · wiring เดิมครบ (useHeaderData/flag/search/game) · proto = **top-nav** (ไม่ใช่ sidebar — เบสเคาะ restyle top-nav)
- เหลือ chrome ปลีกย่อย (optional): mobile-menu-sheet (More drawer) · quick-pill icons (amber/blue) ยัง hardcode สี
- **ลำดับถัดไป:** Home → Browse → Portfolio (L, Robinhood hero) → More → Marketplace (flag-off) · port plan เต็มอยู่ใน workflow output (transcript)
- ⚠️ **dev watcher ไม่จับ tool-writes** → ต้อง restart dev + curl-verify ทุก batch (dev รันอยู่ background)

## ▶ NEXT
1. **เบสเปิดดูจริง** `localhost:3000/cards/<code>` (hard-refresh) — เคาะว่าโทน/layout โอเค
2. **commit checkpoint** (docs + foundation + card-detail) ถ้าเบสโอเค — เป็นก้อนใหญ่, เบสอนุมัติก่อน
3. **ไป surface ถัดไปตาม spine:** Portfolio (§4.3 — fix honesty inflow/outflow + Robinhood hero) → Marketplace → Chat → PLAY → Ads → Multi-game
4. ⚠️ **เปลี่ยน est → จริง** ต้อง schema (Grade enum · edition JP/EN · Comp/population tables) = **เบสอนุมัติ migrate** · โครง UI พร้อม swap แล้ว
5. (เก็บตก) orphan i18n keys เก่า (`marketPriceHelp`/`lastSoldHelp`/`noSoldHistory` — pre-existing, ไม่ใช้แล้วหลัง rewrite) ลบตอนกวาด · ทยอย migrate ~20 ไฟล์ hardcode `duration-*` → token

## ⚠️ permission / workflow
- commit/push → **เบสอนุมัติก่อน** (ไม่มี override เฟสแล้ว) · ถือ [AGENTS.md](AGENTS.md): typography token · breakpoints · table→list `<sm` · apiHandler/Zod · วงจรการทำงาน
- verify gate: `npx tsc --noEmit` · `npm run lint` (baseline 0 err) · `npm run test` (36/36) · `npm run build`
- research เต็ม (8 lane, reference platforms + concrete spec) อยู่ใน git/transcript — VISION §8 = ดัชนี reference
