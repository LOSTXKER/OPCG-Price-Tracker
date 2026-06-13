# 📍 PROGRESS — สถานะสด
> **เขียนทับทุกครั้ง ไม่สะสม log** (รายละเอียดอยู่ใน git history แล้ว) · hook โหลดไฟล์นี้เข้าทุก session
> session ใหม่: อ่านอันนี้ก่อนเริ่ม แล้วทำต่อจาก NEXT

อัปเดตล่าสุด: 2026-06-13 — **Refactor phase เสร็จ + merge เข้า master แล้ว → พร้อมเข้า Design phase**

## ✅ master พร้อม (verified)
- branch: `master` @ `0b24fb2` · tsc clean · lint **0 errors / 80 warnings** · test 36/36 · build ✓ (static 145/145)
- ทุกอย่างของ refactor merge เข้า master หมดแล้ว (PR #3 ใหญ่ + #4 mojibake fix + #5 R4) · ไม่มี branch ค้าง

## ทำอะไรไป (เบสสั่ง "Refactor ก่อน เดี๋ยวค่อยปรับ Design")
- **R0/R1**: chromeless auth, table→list fallback (`<sm`), typography tokens (`.text-h1/.text-body/…`)
- **R2 data layer**: ทุก client API call ผ่าน wrapper เดียว — `@/lib/api/client` (apiGet/Post/Patch/Delete/Try/Form) ฝั่ง user · `@/lib/admin/admin-fetch` (adminFetch/adminForm/buildAdminQuery) ฝั่ง admin · **ไม่มี raw `fetch('/api')` ใน client เหลือเลย** · retire `adminJsonFetch` ทิ้ง
- **R3 component split**: แตก 10 ไฟล์ยักษ์ (compare/today-card/price-hub/alerts/search + snkrdunk 973→446/cards-browser/yuyutei/rank-tiers/drop-rates) → sub-components + data hooks · **ไม่มี client component เกิน ~580 บรรทัด**
- **R3 i18n**: 88 inline TH/JP/EN → `t(lang,key)` (74 keys ใน th/en/jp.ts) · admin Thai-only ไม่แตะ (ถูกต้อง)
- **R4 (บางส่วน)**: 4 settings pages (addresses/billing/export/security) → static server components

## ⬜ ตั้งใจยังไม่ทำ — ไม่บล็อก design (ทำตอน redesign แต่ละหน้าได้)
- **R4 data-fetching pages** (orders/saved/seller/admin ~10 หน้า) → server component = migration จริง (server auth + Prisma + client island) เสี่ยง+ใหญ่ · pages ที่ใช้ `useProfileData`/`useUIStore` เป็น client โดยจำเป็น (ถูกแล้ว)
- **i18n interpolation cases** (3 ตัวมี `${var}` + pluralization) — ต้องใช้ `{n}` placeholder + `.replace()`
- **component กลางๆ 400-580 บรรทัด** (raffle-form, users-manager, section-subscription, sets-manager ฯลฯ)
- **M0**: cron `leaderboard-rewards` ไม่อยู่ใน vercel.json

## เครื่องมือ / สภาพแวดล้อม
- **`gh` ติดตั้ง + login แล้ว** (LOSTXKER, keyring) → branch/PR/merge ทำผ่าน CLI ได้ครบ (`gh pr create` / `gh pr merge --merge --delete-branch`) · **ห้าม push master ตรง** ใช้ PR เสมอ
- ตำแหน่งโปรเจกต์: `~/dev/OPCG-Price-Tracker-master` (ออกจาก iCloud แล้ว) · `~/Desktop/dev` = backup เก่า ลบได้เมื่อพร้อม

## ก่อนเริ่ม design — ถือ AGENTS.md ไว้
- typography tokens (ห้าม `text-[Xpx]`) · breakpoints (`sm:` data / `md:` chrome) · table ซ่อน `<sm` ทำ list fallback
- mock previews มีอยู่ (portfolio-mock-preview, honey-mock-preview) ใช้เทียบ before/after

## ▶ NEXT
1. **เริ่ม Design phase** — เบสบอกว่าจะเริ่มจากหน้าไหน / แนวไหน
2. (option, ระหว่างทาง) R4 data-fetching page · i18n interpolation · component กลางๆ
