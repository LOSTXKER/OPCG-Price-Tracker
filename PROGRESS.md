# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** · hook โหลดไฟล์นี้ทุก session · อ่านอันนี้ก่อน แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-07-04 — **Phase 0 + ปุ่มย้อน + Sheet ทางลัด + ไอคอนทั้งเว็บ + รวม watchlist↔alerts 2 แท็บ · branch `fix/uxui-phase-0` (ยังไม่ merge)**

## ✅ เสร็จล่าสุด (session นี้) — รวม "รายการโปรด" + "แจ้งเตือนราคา" เป็นหน้าเดียว 2 แท็บ (เบสสั่ง · Phase 5 surface)
เบส: 2 หน้านี้คล้ายกัน แยกแล้วงง → ให้ความเห็น + เสนอ 3 ทาง เบสเลือก **A. หน้าเดียว 2 แท็บ** (ไม่ยัดเป็นลิสต์เดียว เพราะ alert = card+ราคาเป้า+ทิศทาง, หลายเตือน/การ์ด + ประวัติ + LINE/tier ≠ 1 การ์ด/แถว)
- **`watchlist-tabs.tsx` (ใหม่)** — host `/watchlist` แสดง 2 แท็บ underline: ♥ การ์ดที่ติดตาม (`WatchlistClient`) / 🔔 แจ้งเตือนราคา (`AlertsManagerClient` reuse ตรงๆ) · tab state ผ่าน `?tab=alerts` (mirror honey Suspense+useSearchParams) · unauthed → เด้ง WatchlistClient เดิม (skeleton/preview) ไม่มี tab chrome
- **`/settings/alerts` → redirect** ไป `/watchlist?tab=alerts` (กัน bookmark เก่า 404) · **ถอด entry alerts ออกจาก settings sidebar** (settings-shell + ลบ BellRing import) — ย้ายออกจาก settings แล้ว
- **repoint 6 ลิงก์** → `/watchlist?tab=alerts`: more-sheet · /more menu · header-user-menu · notification-bell · section-notifications · watchlist row-bell (การ์ดที่มี alert เด้งไปแท็บ) · **game-switcher** ตัด special-case `/settings/alerts` (อยู่ใต้ /watchlist agnostic แล้ว)
- i18n +2 key (`watchlistTabCards`/`watchlistTabAlerts`) ×3 ภาษา
- **verify:** tsc0/lint0/build✓ · **browser จริง (:3100 มือถือ)**: /watchlist เห็น 2 แท็บ · กดแท็บ→URL+เนื้อหาสลับถูก (alerts manager เต็ม: สร้างเตือน/game chips/alert Luffy) · deep-link `?tab=alerts` ลงแท็บถูก · `/settings/alerts` redirect ลงถูก · console ไม่มี error
- ⚠️ **decisions ที่ฉันเคาะเอง (เบส veto ได้):** (1) ถอด alerts ออกจาก settings sidebar เลย (ไม่เก็บซ้ำ) (2) /settings/alerts เป็น redirect (ไม่ลบ route) — มี skeleton แว่บสั้นๆ ตอนเข้าลิงก์เก่าตรงๆ (settings layout สตรีมก่อน redirect) · live nav ทุกทางชี้ตรง /watchlist?tab=alerts ไม่แว่บ · ถ้าอยากไร้แว่บ 100% ต้องเพิ่ม rule ใน middleware (แตะ config = ขออนุมัติ)
- ⚠️ ยังไม่ commit

## ✅ เสร็จล่าสุด (session นี้) — ปุ่ม "ดูเพิ่มเติม" มือถือ = Sheet ทางลัด (เบสสั่ง)
เบส feedback: หน้าสำคัญบางหน้าถูกฝังลึกใต้แท็บ "ดูเพิ่มเติม" (เดิมกด→เด้งไปหน้า `/more` เต็มจอ). เบสเลือกทาง **A. Sheet ทางลัด** (จาก 4 ตัวเลือกที่เสนอ: A sheet / B ดันขึ้นแท็บ / C จัดบนสุด /more / คงเดิม).
- **`more-sheet.tsx` (ใหม่)** — กด "ดูเพิ่มเติม" → Sheet เลื่อนขึ้นจากล่างจอ **ทับหน้าเดิม** (context อยู่ข้างหลัง): มือจับ + หัวข้อ "ลิงก์ด่วน" + กริด 6 ทางลัดที่คัดมา + แถว "ดูเมนูทั้งหมด" → `/more` (หน้าเต็มยังอยู่ครบ)
- ทางลัด: ล็อกอิน = Honey(จุดแดง)/เด็ค/แจ้งเตือน/มาแรง/คู่มือ/ตั้งค่า · guest = เด็ค/มาแรง/เทียบ/คู่มือ/แพ็กเกจ (แก้ list ง่ายใน `MoreSheetBody`)
- **`bottom-nav.tsx`** — แท็บ More: `<Link>`→`<TabButton>` เปิด sheet (state `moreOpen`), `moreActive = moreOpen || fallback` · i18n +`viewAllMenu` ×3 · reuse `quickLinks`/`claimReward` เดิม (ไม่ทำ key ซ้ำ)
- **verify:** tsc0/lint0/build✓(×2) + **production :3100 ผ่าน browser จริง (มือถือ 390px)**: home/trending/portfolio กด More→sheet เด้ง · กดทางลัด→ไป+ปิด sheet+แท็บ active ถูก · "ดูเมนูทั้งหมด"→/more · console ไม่มี error
- **adversarial review (7 agents)**: 3 finding = LOW ทั้งหมด **แก้ครบแล้ว** — (1) กัน guest-tile flash ตอน auth ยังไม่ resolve = skeleton จน `authLoaded` (2) ลบ SheetDescription ซ้ำ Title (3) +sr-only `claimReward` ที่จุดแดง honey · perf assumption ยืนยันถูก (useHeaderData วิ่งเฉพาะตอนเปิด sheet, base-ui unmount ตอนปิด) · 1 finding (double-active tab) = refuted (masked/benign)
- ⚠️ ยังไม่ commit — รอเบส review. skeleton เห็นเฉพาะ prod จริง (dev-bypass `authLoaded` เริ่ม true เลยข้าม)

### เพิ่มเติมรอบ 2 (เบส feedback หลังรีวิว sheet): เปลี่ยนคำ + ไอคอนทั้งเว็บให้ตรงกัน
เบส: (1) ไม่ชอบคำ "ลิงก์ด่วน" (2) ไอคอน watchlist/portfolio ทั้งเว็บไปคนละทาง → **audit ด้วย Explore agent เจอ 14 จุดจริง** (แยก UNRELATED ออกชัด: Heart=Life stat, Wallet=สกุลเงิน/บิล, Bookmark=saved listing, Star=รีวิวร้าน — ไม่แตะ)
- **หัวข้อ Sheet:** "ลิงก์ด่วน" → **"ทางลัด"** (แก้ค่า key `quickLinks` ที่ใช้ที่เดียว ×3 ภาษา)
- **รายการโปรด (watchlist) → `Heart` ทุกจุด** (เดิม `Bookmark`): bottom-nav · header (rose) · command-search · /more
- **พอร์ต (portfolio) → `Briefcase` ทุกจุด** (เดิมปน `Wallet`/`Star`/`Briefcase`): bottom-nav · header (amber active, ตัด fill) · command-search · /more · home-seo tile · portfolio-switcher ×2 · portfolio-selector · (home portfolio-preview + card-add-to-portfolio เป็น Briefcase อยู่แล้ว)
- **verify:** tsc0/lint0(warn เดิม 1 ที่ command-search:249 ไม่เกี่ยว)/build✓ · **browser มือถือยืนยัน ♥+💼+"ทางลัด"** · desktop header/command-palette ยืนยันด้วย compile (viewport ext ล็อกมือถือ เช็คตาไม่ได้ แต่ icon swap ตรงไปตรงมา)
- **heads-up:** `savedListings` (ตลาด, flag ปิด) ใช้ `Heart` ที่ header-user-menu + /more อยู่ → ถ้าเปิด marketplace วันหน้าจะชนกับ watchlist=Heart · ตอนนี้ไม่เห็นเพราะ flag ปิด · proto/ ข้าม (playground) — ทั้งคู่ค่อยจัดถ้าเบสอยาก

## ✅ เสร็จ session นี้ — Phase 0 (แก้ของพัง/เสี่ยงจริง) ตามแผน doc/uxui-refactor-plan.md
เบสสั่ง "เริ่ม Phase 0 ได้" — แก้ 16 ข้อ (branch `fix/uxui-phase-0`, ยังไม่ merge). แผนแม่บท + หลักฐาน 230 findings อยู่ `doc/uxui-refactor-plan.md` + `doc/uxui-audit-findings-2026-07-04.md` (ทำ session ก่อน).

**แก้แล้ว (16):**
1. `IA-NAV-01/07`+`CHROME-06` — แท็บ active ไม่ติดใต้ `/opcg/` → `isNavActive` helper เดียวใน `lib/game/constants.ts` (strip game prefix + owner-aware), header + bottom-nav ใช้ร่วม, More = fallback tab, ลบ `TOOL_LINKS` ตาย
2. `PORTFOLIO-03` — edit dialog ราคาทุนหน่วยเงินเพี้ยน (โชว์ JPY ดิบ) → แปลง display↔JPY + symbol prefix + string-compare กัน round-trip drift (`single-edit-dialog` + `bulk-edit-dialog`)
3. `CHROME-01`/`IDENTITY-02` — CTA "ทักผู้ขาย" ถูก bottom-nav ทับ → ยกขึ้น `bottom:calc(4rem+safe)` + pb เนื้อหาพ้น 2 แถบ
4. `COMMERCE-03` — chat order panel ทับจอมือถือปิดไม่ได้ → default ปิด <lg + backdrop แตะปิด (desktop lg:static คงเดิม)
5. `PLAY-01` — deck-calc qty ล็อก 1 → stepper ต่อแถว (1-4) + addCard bump แทน reset + คง dialog เปิด · `PLAY-02` ลบเด็คมี confirm แล้ว
6. `TRACK-01` — กระดิ่งการ์ดที่มี alert → route ไป `/settings/alerts` แทนสร้างซ้ำ (inline sheet = Phase 5, entry มีแค่ boolean)
7. `HONEY-04` — `/honey` sync `?tab=` กับ URL (Suspense) — deep-link จาก pricing + back ทำงาน
8. `IDENTITY-05` redirect `/profile` (ไม่ใช่ /settings) · `IDENTITY-08` wire "ดูรายการขาย"→tab จริง + Report = "กำลังมา" (honest)
9. `SETTINGS-01` — gate marketplace section ด้วย flag (sidebar + mobile index) · `CHROME-02` settings gutter ซ้อน → `inShell` (20px มือถือ) · `CHROME-03`/`IDENTITY-04` `/u/` + `/@` เข้า FULL_WIDTH_ROUTES
10. `CONTENT-01` — blog `.prose` เขียนเองใน globals.css map token (ไม่เพิ่ม dependency) · `STATES-02` `not-found.tsx` หมีหลงทาง + ปุ่มกลับ
11. `HOME-01`+`DISCOVERY-11` **perf** — home ตัด searchParams + market-overview/trending ตัด force-dynamic → **build ยืนยัน `/` `/market-overview` `/trending` = static prerendered** · `/cards?search=`→/search · trending tab อ่าน client-side

**verify:** tsc 0 · lint 0 error (34 warning เดิม) · test 56/56 · **build ✓** (ยืนยัน index.html + market-overview.html prerendered, trending `○ 5m`) · i18n +5 key ×3 (confirmDeleteDeck/decrease/increase + rename profileReportSent→profileReportSoon) parity ครบ · **ยังไม่ได้เปิด browser จริงดู** (เบสช่วยเช็คได้)

## ✅ เสร็จต่อ (session นี้) — ปุ่มย้อนมือถือ redesign ทั้งแอป (เบสสั่งระหว่างรีวิว)
เบส feedback: ปุ่มย้อน (1) กลืนพื้นหลัง (2) ลอยเหนือหัวข้อไม่สมมาตร (3) อยากอยู่ข้างหัวข้อแบบแอปอื่น (4) /settings ต้องมีด้วย → เบสเคาะสี honey ทึบ + "ทำ inline ให้ครบทุกหน้า"
- **`BackButton` component ใหม่** (`src/components/shared/back-button.tsx`) — วงกลม honey ทึบ (`bg-primary`) เด่นทุกพื้นหลัง
- **inline ข้างหัวข้อ (มือถือ)**: settings (index→/more, sub→/settings, ซ่อน section h2 มือถือ) · portfolio/[id] · guide ×6 · blog/[slug] (ลบลิงก์ "บทความทั้งหมด" เก่า)
- **Breadcrumb** +prop `hideMobileBack` (หน้าที่มี inline เองปิดปุ่ม block กันซ้ำ) · **PageHeader** +prop `back`
- **hero pages** (set/card detail) คงปุ่มเด่นบนซ้าย (block) — layout การ์ดเป็นพระเอก ไม่เหมาะดัน inline กลางหน้า · **commerce** (orders/seller/marketplace ปิด flag) → Phase 7
- **verify:** tsc0/lint0/build✓ + **ยืนยันด้วย production server (`next start` :3100) ผ่าน browser extension: guide page ปุ่มย้อน 1 อันเดียว inline ข้างหัวข้อ honey เด่น (dark mode ทองสว่างมาก)**
- ⚠️ **dev server (:3000) ของเบส HMR shared component (Breadcrumb) ค้าง** — เห็นปุ่ม 2 อัน (stale) · โค้ดถูก 100% (build ผ่าน + production ยืนยัน) · **เบสต้อง restart dev: `rm -rf .next && npm run dev`** ถึงเห็นถูก (+ ผมรัน build หลายรอบ อาจกวน .next dev ด้วย)

## ⏭️ NEXT
0. **เบส review "ดูเพิ่มเติม" Sheet ทางลัด** — เปิดมือถือจริง (ไม่ใช่ dev-bypass) เช็ค: guest set ตอนไม่ล็อกอิน · skeleton ตอนโหลด · ทางลัด 6 อันถูกใจมั้ย/อยากปรับรายการ → ถ้าโอเคบอกให้ commit
1. `SETTINGS-03` เสร็จแล้ว — เพิ่ม lib `qrcode` (เบสอนุมัติ) สร้าง QR ฝั่ง client, secret ไม่ออกนอกเครื่อง (commit แยก)
2. เบสเปิด browser จริงเช็ค Phase 0 (โดยเฉพาะ: แท็บ active ติดถูกทุกหน้าใต้ /opcg/ · portfolio edit ราคาทุนหน่วยถูก · deck qty stepper · chat มือถือ · profile CTA ไม่ถูกทับ · 2FA QR ยังสแกนได้) → ถ้าโอเคเปิด PR `fix/uxui-phase-0`
3. `SETS-05` + `CONTENT-03` (query trim) ย้ายไป Phase 5 surface work (correctness risk ต้องมี context เต็ม)
4. **Phase 1 (ลบของตาย ~3,000 บรรทัด)** — ⚠️ ต้องเบสอนุมัติรายการลบก่อน (list ใน แผน §Phase 1)
5. งานทั้งหมดบน branch `fix/uxui-phase-0` แยกจาก master · ห้าม push master ตรง

## แหล่งอ้างอิง
- **แผนแม่บท:** `doc/uxui-refactor-plan.md` (8 phases) · **หลักฐาน:** `doc/uxui-audit-findings-2026-07-04.md` (230 findings, อ้างด้วย ID)
