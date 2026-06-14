# 🎨 REDESIGN — แผน Redesign (Mobile-First, รองรับอนาคต)

> **เอกสารนี้คือ single source of truth ของ Design phase** — scope, หลักการ, IA ใหม่, design system, สถาปัตยกรรมรองรับฟีเจอร์อนาคต, และ roadmap แบ่ง phase
> Thai-first เหมือน SPEC/PLAN/PROGRESS · อ้างอิง [AGENTS.md](AGENTS.md) สำหรับ convention (typography tokens / breakpoints / API) — ไม่ทวนซ้ำ
> สร้าง 2026-06-13 · เจ้าของ: เบส · อัปเดตเมื่อ scope/decision เปลี่ยน

---

## 1. ทำไมต้อง redesign (the problem)

- **ผู้ใช้บอกว่า UX/UI ใช้ยาก** และ **ส่วนใหญ่ใช้มือถือ** → mobile-first คือโจทย์หลัก ไม่ใช่ของแถม
- **ต้องรองรับระบบใหม่ในอนาคตตั้งแต่ตอนนี้** ไม่ใช่มาแก้ทีหลัง:
  1. **Multi-cardgame** — ตอนนี้ OPCG อย่างเดียว, ตัวถัดไปคือ **Pokémon**
  2. **Meta cards** — การ์ดที่อยู่ในเมต้า
  3. **Tier list** — จัดอันดับการ์ด
  4. **Deck building** — จัด/จัดการเด็ค
  5. **Marketplace** — ซื้อขาย (backend มีเยอะแล้ว, ปิดด้วย flag)
  6. **โฆษณา** — Google AdSense/Ads + house ads

**ข่าวดีจาก audit:** ฐาน design แข็งแรงอยู่แล้ว — semantic typography tokens ใช้ 788 จุด, **0 จุดที่ใช้ `text-[Xpx]`**, dark mode ครบ, breakpoints pinned. นี่คือ **refine + extend ไม่ใช่รื้อสร้างใหม่** → ปัญหา "ใช้ยาก" อยู่ที่ **IA / navigation / ความหนาแน่นบนมือถือ** ไม่ใช่ที่ตัว visual

---

## 2. หลักการออกแบบ (เลนส์ที่ทุกหน้าต้องผ่าน)

| # | หลักการ | แก้ปัญหาอะไร | กฎรูปธรรม |
|---|---------|-------------|-----------|
| **P1** | **1 หน้า = 1 primary action** | card detail มีปุ่ม Add-Portfolio/Watchlist/Alert/Share กระจาย, ต้อง scroll ผ่านรูป ~462px ก่อนเจอปุ่ม | แต่ละหน้ามี primary action เดียว ปักไว้ (sticky bottom bar บนมือถือ) ที่เหลือเป็น secondary/อยู่ใน sheet |
| **P2** | **Progressive disclosure** | card detail ซ้อน 5 section, price-hub ยัด chart+toggle+ตาราง 131 แถวในกล่องเดียว, honey 27 component/7 tab พร้อมกัน | โชว์คำตอบก่อน (ราคาตอนนี้, มูลค่า, เปลี่ยนแปลงวันนี้) → รายละเอียดซ่อนหลัง accordion/tab, มือถือ default ยุบ |
| **P3** | **นิ้วโป้งเอื้อมถึง + สม่ำเสมอ** | tools ลึก 2+ tap บนมือถือ (desktop เห็นทันที), bottom-nav สลับ tab ตาม flag (พังกล้ามเนื้อความจำ), แถวกดยาก | action หลักอยู่ 1/3 ล่างจอ, **tab ไม่เคยสลับตัวตน**, ทุกแถวกดได้ `min-h-14` (56px) |
| **P4** | **card pattern เดียว ใช้ทุกที่** | card grid / listing / asset row / order / set card แตกกันหมด, meta/tier/deck ยังไม่มี pattern | ชุด primitive มาตรฐาน (GameCard, ListRow, StatTile) reuse ทุกที่ — ฟีเจอร์ใหม่ "ประกอบ" ไม่ "ประดิษฐ์ใหม่" |
| **P5** | **chrome คาดเดาได้ + รู้ว่าอยู่เกมไหน** | ไม่มี game switcher, OPCG ฝังใน nav/copy, ฟีเจอร์อนาคตไม่มีบ้าน | chrome (header+bottom-nav) นิ่งและ game-scoped, GameSwitcher ตัวเดียวคุม context, slot สำรองไว้ให้ฟีเจอร์ใหม่ |

**heuristic เสริม:** เขียน mobile ก่อนเสมอ (ห้าม `max-*` desktop-down) · skeleton แทน spinner · empty state ต้องมี next action · **ห้าม scroll ตารางแนวนอนบนมือถือ**

---

## 3. IA & Navigation ใหม่ (หัวใจของงานนี้)

### 3.1 กฎเหล็ก
1. **Tab ไม่เคยเปลี่ยนตัวตน** — flag ซ่อน/disable *เนื้อหาข้างใน* ปลายทางได้ แต่ห้ามสลับ chrome (ตอนนี้ `bottom-nav.tsx:74-98` ผิดกฎ มี 2 ternary)
2. **5 tab เพดานตายตัว** — ตัวที่ 5 คือ **More** (sheet) เสมอ ฟีเจอร์อนาคตลงใน 4 ปลายทางจริงหรือ More ไม่มี tab ที่ 6, ไม่มี scroll แนวนอนใน nav
3. **Parity** — อะไรที่ desktop กด 1 ครั้ง มือถือต้อง ≤2 tap (calculators ตอนนี้ลึก 4 tap → ใหม่เหลือ 2)
4. **เกมคือ context ไม่ใช่ปลายทาง** — สลับ OPCG↔Pokémon = re-scope หน้าเดิม ไม่ใช่พาไปหน้าใหม่

### 3.2 Bottom-nav ใหม่ (4 ปลายทาง + More)

```
├───────────┬───────────┬───────────┬───────────┬─────────────┤
│   ◎       │   ⌗       │    ⬡       │   ◈       │     ☰        │
│  Market   │  Browse   │   Decks   │ Portfolio │    More      │
│           │           │           │    •      │              │  ← • = badge
└───────────┴───────────┴───────────┴───────────┴─────────────┘
   /          /sets        /decks      /portfolio   (sheet)
```

| Slot | ปลายทาง | Route | Icon | เหตุผล |
|------|---------|-------|------|--------|
| 1 | **Market** | `/` | `LineChart` | สิ่งที่คนเปิดแอปมาดู: "การ์ดราคาเท่าไหร่ / วันนี้อะไรขยับ" แทน label "Home/Overview" ที่กำกวม |
| 2 | **Browse** | `/sets` (hub) | `LayoutGrid` | บ้านเดียวของ *การค้นหาทั้งหมด*: Sets, Cards, Trending, Compare, Market-overview, **+ Marketplace (เมื่อเปิด)** — slot ที่เคยสลับ |
| 3 | **Decks** | `/decks` (hub) | `Swords` | ดึง calculators ที่ฝังลึก + Meta/Tier-list อนาคต ขึ้นมาเป็น tab หลัก |
| 4 | **Portfolio** | `/portfolio` (login) · `/honey`+CTA (ยังไม่ login) | `Wallet` | "ของฉัน" — holdings, P&L, watchlist, alerts, saved, orders, Honey · badge = alerts/unread |
| 5 | **More** | sheet | `Menu` | Account, settings, ขายของ, content (blog/guide), preferences, game switcher, sign-out |

**แก้ปัญหา marketplaceEnabled สลับ tab:** slot นิ่งหมด → Marketplace เป็น **card ใน Browse hub** + **row ใน More sheet** ไม่ใช่ tab
- flag **เปิด** → Browse โชว์ card "Marketplace" บนสุด, More โชว์ "Sell / Seller Center / Orders / Messages"
- flag **ปิด** → render เป็น card **"Marketplace — เร็วๆ นี้"** หรี่แสง (ไม่หายเงียบ), badge unread ย้ายไป tab Portfolio (มันคือ inbox "ของฉัน")

**Search ออกจาก bottom-nav** → เป็นปุ่มถาวรบน header (§3.5) ที่ยกระดับเป็น **command palette** (ค้นการ์ด + "ไป Portfolio / เปิด Watchlist / Deck Calculator / สลับเป็น Pokémon")

### 3.3 Game Switcher (OPCG / Pokémon)
- **ที่อยู่:** pill เล็กบน header ซ้ายข้างโลโก้ ทุกหน้าใน chrome · กด → bottom sheet (มือถือ) / dropdown (`md:`) · mirror ไว้บนสุดของ More sheet ด้วย
- pill โชว์ชื่อย่อเกม + chevron (ไม่โชว์ logo รูปขนาดนี้ — กัน layout shift / 404 รูป Pokémon)
- option มาจาก `getAllGameConfigs()` (มีแล้ว) · เกมที่ยังไม่ลง render เป็น **"เร็วๆ นี้" (disabled)**

```
 mobile header                              tap pill → bottom sheet
┌──────────────────────────────┐          ┌──────────────────────────────┐
│ 🐻  [ OPCG ▾ ]        🔔  🔍 │          │  เลือกเกม                      │
└──────────────────────────────┘          │  ● OPCG          (active)     │
                                           │  ○ Pokémon       เร็วๆ นี้     │
                                           └──────────────────────────────┘
```

> **URL strategy: มี 2 ทางเลือก ต้องเคาะ** (ดู §6 "ข้อตัดสินใจ") — flat routes + state vs `/[game]/` prefix

### 3.4 Decks / Tools hub (`/decks`)
landing page รวม "ทุกอย่างที่เกี่ยวกับการเล่น/วิเคราะห์" — Meta-cards & Tier-list ลงตรงนี้โดยไม่ต้องเพิ่ม tab

```
 /decks  (Tab 3 — mobile)
┌──────────────────────────────────────┐
│  Decks & Tools          [ OPCG ]      │  ← scoped ตามเกม
├──────────────────────────────────────┤
│  [🛠 Build a Deck]  [🧮 Deck Calc]    │
│  [🎲 Drop Calc]     [⚖ Compare]       │
│  [🔥 Meta Cards]    [🏆 Tier List]    │  ← อนาคต badge "New" / disabled "เร็วๆ นี้"
├──────────────────────────────────────┤
│  My Decks (login)   ▸ Aggro Red ...   │  ← table→list <sm
└──────────────────────────────────────┘
```
- grid 2 คอลัมน์บนมือถือ, scale `sm:`/`lg:`
- game-aware: Drop/Deck calc อ่าน `GameConfig.pullRate` + กติกาเด็คต่อเกม (OPCG 1-leader/50 vs Pokémon 60)
- `/compare` dual-home: เข้าได้ทั้งจาก Browse (discovery) และ Decks (analysis) — route เดียว 2 ทางเข้า

### 3.5 Mobile chrome
**Header (lean, sticky, h-14):** ซ้าย = โลโก้ (→ `/`) + game pill · ขวา = NotificationBell (เฉพาะ login) + ปุ่ม Search (เปิด command palette) · **ไม่มี nav link บน header มือถือ** (nav หลักอยู่ bottom-nav)

**More sheet:** จัดกลุ่ม **ตาม journey** ไม่ใช่ตาม feature — Account block · Game switcher · Sell & Commerce (หรี่เมื่อ flag ปิด) · Resources (guide/blog/about) · Account (settings/upgrade) · Preferences (lang/currency/theme) · Sign out · ปิดได้ด้วย backdrop + `Escape`

### 3.6 ตำแหน่งโฆษณา (named placements)
component เดียว **`<AdSlot placement="..." />`** — gate ด้วย tier (FREE เท่านั้น) + consent, มี house-ad fallback, **exclude บน CHROMELESS_ROUTES** (auth/admin/seller/messages/checkout)

| placement | ที่ render | format (มือถือ → desktop) |
|-----------|-----------|---------------------------|
| `chrome-banner` | ใต้ header | 320×50 → ซ่อนที่ `lg:` |
| `home-in-feed` | Market home คั่นระหว่าง section | native → 300×250 sidebar |
| `browse-in-feed` | Browse/cards/marketplace ทุก 9 การ์ด | native card ใน grid |
| `card-detail-mid` | card detail ระหว่าง price-hub กับ listings | 320×100 → 300×250 rail · **หลัง CTA หลักเสมอ** |
| `decks-footer` | `/decks` ใต้ tool grid | native |
| `content-in-feed` | blog/guide ทุก 3 รายการ | native → sidebar `md:` |
| `profile-below-hero` | public profile ใต้ hero | native |

bottom-nav **ไม่มีโฆษณา** — chrome ที่ใช้บ่อยสุดต้องสะอาด

---

## 4. Design System direction

**สรุป:** เก็บ palette + typography system เดิม (asset ที่ดีสุดของโปรเจกต์, adoption 100%) — **เพิ่มแค่ token เดียว + hook เดียว**

### 4.1 Typography — เก็บ + ขยายนิดเดียว
- เก็บ 11 token เดิมทั้งหมด (`.text-display/h1-h5/body/body-sm/label/meta/eyebrow/micro/overlay/code`) — bump ไว้แล้วเพื่อ Kanit/ไทย
- **เพิ่ม `.text-price` (15px tabular mono) + `.text-price-lg` (~22px)** — แก้ปัญหาราคาในตารางโชว์ 2 ขนาด (`.font-price` 17px vs `.text-code` 14px) · standardize `PriceTag` บน 2 ตัวนี้
- standardize `line-clamp-1/2` ใน GameCard/ListRow (กฎ ไม่ใช่ token ใหม่)
- **ห้าม** เพิ่ม arbitrary size · **ห้าม** stack `text-* font-* tracking-* text-muted-foreground` (ตอนนี้ 0 จุด เก็บไว้แบบนี้)

### 4.2 Color & theme — ล็อก palette, จูนเพื่อมือถือ
- เก็บ gold-brown primary (`#73533E`/dark `#E0B865`), cream, status family, price tokens — **ไม่ rebrand**
- **price ต้องคู่กับลูกศร ▲/▼ เสมอ** ไม่ใช้สีเดี่ยว (color-blind + แสงจ้าบนมือถือ)
- ใช้ `.status-*` (success/warning/danger/info) ให้กว้างขึ้น (ตอนนี้ใช้น้อย) ผ่าน `StatusBadge` · ลบ alias ซ้ำ `.status-warn`
- **แก้ contrast มือถือ:** chevron `text-muted-foreground/40` เสี่ยงตก WCAG AA → ยก ≥60% · เพิ่ม `focus-visible:ring` บน row/link (ตอนนี้มีแค่ปุ่ม/input)
- **เพิ่ม hook `--game-accent`** ตัวเดียว ให้ GameSwitcher set สีต่อเกม (ใช้แค่ที่ game pill/badge ไม่ re-skin ทั้งแอป)

### 4.3 Component primitives — สถานะ
`Exists` = ใช้ได้เลย · `Extend` = มีแต่ต้องเพิ่ม variant · `Build` = ยังไม่มี

| Component | สถานะ | บทบาท |
|-----------|-------|-------|
| **GameCard** | Extend | thumbnail มาตรฐาน + game-aware columns + slot badge (quantity/meta/tier) ให้ deck/meta/tier reuse |
| **PriceTag** | Extend | ราคา+delta ใช้ `.text-price/-lg` + ลูกศร+สีเสมอ — ตัวเดียวจบ inline/row/hero |
| **ListRow** | Extend | รวม 3 ตัวซ้ำ (card-table/asset mobile-card/order-card) → primitive เดียว `min-h-14` + chevron กดได้ + focus ring — **แถวที่ reuse มากสุด แก้ตัวนี้แก้ปัญหา "กดยาก"** |
| **StatTile** | Extend | KPI tile reuse ทั้ง portfolio hero / seller dashboard / honey hero |
| **EmptyState** | Exists | unified แล้ว · ทุก empty state ต้องมี CTA |
| **AdSlot** | Build | tier+consent gated, placement prop, skeleton, house-ad fallback |
| **TierRow** | Build | S/A/B/C row · **มือถือ: stacked + carousel ต่อ tier ห้าม scroll ตารางแนวนอน** |
| **DeckGrid** | Build | การ์ดเล็ก + quantity badge, group ตาม type/color, game-aware validity |
| **FilterSheet** | Generalize | marketplace มี bottom-sheet filter แล้ว → ยกเป็น shared ใช้ /cards /sets /trending /tier-list |
| **BottomSheet** | Exists (primitive) | มาตรฐาน `side="bottom"` สำหรับ filter/quick-view/actions · แก้ dialog 320px เหลือขอบ 4px |
| **StickyActionBar** | Build | bar ปัก primary action (Add Portfolio / Buy Now / Save Deck) · เคารพ safe-area |
| **GameSwitcher** | Build | header pill + set active game (Zustand+localStorage) |
| **StatusBadge** | Build (บาง) | badge+icon+label บน `.status-*` |
| **QuickViewSheet** | Build | กด card code ในตาราง → sheet รูป+ราคา+effect 1 บรรทัด ไม่ต้องเปลี่ยนหน้า |
| **Skeletons** | Exists | มีแล้ว · บังคับใช้แทน spinner ทุก fetch + lazy chart/ad |

### 4.4 Mobile interaction contract (กฎตายตัว)
1. **Filter → bottom sheet** ไม่ใช่ toolbar inline · active filter โชว์เป็น chip เหนือผลลัพธ์
2. **Table → list ที่ `sm:`** — `<table>` hidden `<sm`, render ListRow · **ห้าม `overflow-x-auto` บนมือถือ**
3. **Sticky primary action เดียว** ใน 1/3 ล่าง · secondary ไปอยู่ "More"/ghost
4. **Progressive disclosure default บน `<sm`** — card detail: quick-view → chart → sources → related (ยุบทีละชั้น) · honey: "Today" + accordion · portfolio: holdings ก่อน analytics ยุบ
5. **Skeleton ตรง layout จริง** กัน CLS (โดยเฉพาะ chart + AdSlot — จอง height ไว้)
6. **tap target การันตี** row `min-h-14` py-4, chevron กดได้กลาง ≥60% opacity, ปุ่ม ≥44px, เคารพ `env(safe-area-inset-bottom)`
7. **chrome นิ่ง + game-scoped** — tab ไม่สลับตาม flag
8. **mobile-first authoring** — no-prefix ก่อน แล้ว `sm:` → `md:` → `lg:` → `xl:`

---

## 5. สถาปัตยกรรมรองรับฟีเจอร์อนาคต (seams)

**2 หลักการ:** (1) **เกมคือ root dimension** — thread `gameId` ผ่าน data model + `currentGame` ผ่าน UI store ให้ game-scoping เป็น default · (2) **Slot อย่า hardcode** — 3 registry (game-config, nav/route registry, ad-placement registry) ทำให้เพิ่มเกม/ad zone/meta tab = data ไม่ใช่ refactor

🟢 **SCAFFOLD NOW** = ทำ seam ตอน redesign (ถูกตอนนี้ แพงถ้าย้อนทำ) · 🟡 **BUILD LATER** = ฟีเจอร์เต็ม เลื่อนได้ แต่ seam ต้องมีก่อน

### 5.1 Multi-Game / Pokémon 🟢 seam + 🟡 ข้อมูล/scraper
ฟีเจอร์ฐานราก ทุกอย่างสืบ game-scoping จากตรงนี้
- **Schema (now):** `CardSet.gameId` → **NOT NULL** (migrate orphan → OPCG) · denorm **`Card.gameId`** + `@@unique([gameId, cardCode])` (ให้ OPCG กับ Pokémon มี code ซ้ำได้) · เพิ่ม `gameId` ใน **`Portfolio`/`Deck`/`Listing`** + index `[userId, gameId]` · เพิ่ม `gameId` ใน `YuyuteiMapping`/`SnkrdunkMapping`
- **Config (now):** register **`pokemon` stub** ใน `GAME_CONFIGS` (sets/rarities เป็น array ว่างได้) ให้ `?game=pokemon` resolve เป็น "เร็วๆ นี้" ไม่เงียบ filter กลับ OPCG · เพิ่ม `getActiveGameConfigs()` (filter `Game.isActive`)
- **Later:** `CardType` enum (OPCG-only) → ขยาย enum หรือ migrate เป็น string (ดู §6 decision) · Pokémon sets/rarities/pull-rate · scraper stack ใหม่ (TCGPlayer ฯลฯ) · imagery fallback · SEO fork
- **State (now):** เพิ่ม `currentGame` ใน `ui-store.ts` + `partialize` · UI switcher render เฉพาะเกม active (วันนี้เป็น badge "OPCG" เดี่ยว)

### 5.2 Meta Cards 🟢 tag+stub + 🟡 curation
- **now:** `Card.isMeta Boolean` + `Card.metaRank Int?` index `[gameId, isMeta]` (nullable = zero-risk, จอง badge slot) · `supportsMeta` ใน GameConfig · route stub `/[game]/meta` (gated) · `MetaBadge` slot ใน `CardDetailHeader` · mission id `browse_meta`
- **later:** `MetaStat` table (winRate/usagePct/period) · admin curation · meta hub page

### 5.3 Tier List 🟡 (เฉพาะ slot scaffolded now)
priority ต่ำสุด (engagement ไม่ใช่ monetization)
- **now:** ไม่แตะ schema · `supportsTierList` flag · จอง route `/[game]/tier-list(/[id])` ใน registry (ซ่อน) · tier display อ่านจาก future table ไม่ใช่ `Card` column
- **later:** `TierList` + `TierListEntry` (mirror Deck/DeckCard) · `TierListRow` · **มือถือห้าม scroll แนวนอน** (carousel/stacked ต่อ tier)

### 5.4 Deck Builder (แทน Deck Calculator) 🟢 scope+bridge + 🟡 builder UX
deck builder **เหนือกว่า** calculator → calculator กลายเป็น *view* นึง (cost math) ของ Deck ที่ save ได้ · **ไม่สร้าง deck data path ที่ 2**
- **now:** `Deck.gameId` NOT NULL index `[userId, gameId]` · `Deck.leaderId` คง nullable (Pokémon ปล่อย null) · ย้ายกติกา validate ไป `GameConfig.deckRules` (mainDeckSize/maxCopies/requiresLeader) · **bridge: ปุ่ม "Add to Deck" ใน `CardDetailActions`** → `POST /api/decks/[id]/cards` (seam คุ้มสุด)
- **later:** visual builder, import/export, public deck pages, sharing fields

### 5.5 Marketplace 🟢 game-scope+mobile seams + 🟡 payments/cart
backend สร้างเยอะแล้ว ปิดด้วย `marketplaceEnabled` · gap = mobile buy/sell + game-scope ไม่ใช่ greenfield
- **now:** `Listing.gameId` NOT NULL index `[gameId, status]` · ย้าย `marketplaceEnabled` เป็น **per-game** ใน GameConfig (เลิก global flag ที่ทำ tab สลับ) · sticky action bar seam · game filter ใน browse toolbar
- **later:** wizard มือถือ (4-step → dense), แก้ messaging chrome (เลิก absolute list↔chat), photo upload, หน้า `/saved` (model `SavedListing` มีแล้ว), checkout/cart (Stripe) — **ทำเป็น marketplace launch milestone ไม่ใช่ redesign**

### 5.6 Ads 🟢 AdSlot+registry+consent + 🟡 AdSense live
ตอนนี้ **0 infrastructure** (`grep adsense|googletag` = 0) · `HomeAdCard` เป็น promo static `lg:`-only
- **now:** `<AdSlot>` 3 gate — **tier** (FREE only, เพิ่ม key `"ad-free"` ใน `billing/features.ts`) + **consent (BLOCKING: ต้องมี `ConsentBanner` ก่อน — GDPR)** + **route** (exclude CHROMELESS) · ad-placement registry (typed map key→size/breakpoint/route) · house-ad fallback (Upgrade/Honey/new-set) → ใช้ได้ก่อน AdSense ลงด้วยซ้ำ
- **later:** AdSense script จริง, analytics, frequency capping, admin placement model

### 5.7 Nav/Route registry 🟢 (cross-cutting)
nav วันนี้เป็น constant hardcode + ternary สลับ tab → ทำ **registry เดียว** feed desktop header + bottom-nav + sheet + command palette
```
NavItem { key, labelToken, href(game), icon, group, requiresAuth?,
          requiresFeature?: 'marketplace'|'meta'|'tierList', gameScoped, visibleWhen }
```
Meta/Tier/Decks/Marketplace = **1 registry entry** ซ่อนหลัง GameConfig capability flag จนเปิดใช้

### 5.8 สรุป Scaffold-now (สิ่งที่ redesign commit จริง)
| Seam | การเปลี่ยน | ทำไมตอนนี้ |
|------|-----------|-----------|
| `CardSet.gameId` NOT NULL + `Card.gameId` + `@@unique([gameId,cardCode])` | Migration ⚠️ | ฐานราก, กัน collision |
| `gameId` บน Portfolio/Deck/Listing + scraper mappings | Migration ⚠️ | กันปนเกม, ย้อนทำแพง |
| `currentGame` ใน ui-store + game switcher (render เฉพาะ active) | Code | Pokémon = data ไม่ใช่ re-route |
| `pokemon` stub config + `getActiveGameConfigs()` + capability flags | Code | registry เดียวคุมทุก per-game feature |
| Nav/route registry (fixed bottom-nav) | Code | แก้ nav ไม่นิ่ง, จองบ้านให้ฟีเจอร์ใหม่ |
| `<AdSlot>` + registry + tier gate + `"ad-free"` key + house fallback | Code | ใช้ได้ทันทีผ่าน house ad |
| **`ConsentBanner` + consent state** | Code | **Blocking** ก่อน ad network ใดๆ |
| `Card.isMeta/metaRank` + `MetaBadge` slot | Migration+UI ⚠️ | จอง zero-risk กัน layout shift |
| "Add to Deck" bridge card→Deck | Code | seam deck-builder คุ้มสุด |
| route stub `/[game]/meta`, `/tier-list`, `/decks` (gated) | Code | จอง URL namespace |

---

## 6. ⚠️ ข้อตัดสินใจที่ต้องเคาะก่อนลงมือ

1. **URL strategy multi-game** (สำคัญสุด — synthesizer 2 ตัวเห็นต่าง):
   - **(A) flat routes + state** — เก็บ `/cards/[code]` scope ด้วย `activeGame` state + self-healing fallback · blast radius ต่ำ, เริ่มเร็ว, ประตูย้ายทีหลังเปิดไว้
   - **(B) `/[game]/` prefix** — `/opcg/cards/[code]`, `/pokemon/cards/...` (หน้าส่วนตัวอย่าง `/portfolio` ไม่ prefix) · collision-safe, SEO สะอาด, "Pokémon = data add ไม่ใช่ routing migration" · blast radius สูงกว่าตอนนี้
   - **คำแนะนำผม: (B)** — เพราะเบสบอกชัดว่า "อยากรองรับอนาคตไปเลย" และ redesign กำลังจะแตะทุกหน้าอยู่แล้ว = จังหวะถูกสุดที่จะ restructure route
2. **Portfolio: per-game หรือ mixed?** — per-game ง่ายกว่า + ตรง mental model · mixed (1 portfolio + game toggle) ยืดหยุ่นกว่า · (scaffold column ไว้ได้ทั้ง 2 แบบ)
3. **CardType enum: ขยาย enum vs migrate เป็น string** — ขยาย enum ง่าย (2 เกม), string + config ยืดหยุ่นระยะยาว
4. **เริ่ม phase ไหนก่อน?** — roadmap แนะนำ **P0** (ดู §7) แต่เบสเคาะได้

---

## 7. Roadmap แบ่ง phase (เรียงตาม "ความเจ็บบนมือถือ" ก่อน)

> P0 ปล่อย tokens + AdSlot + game-context ที่ทุก phase reuse → P1-P5 = composition

### P0 — Foundation (chrome, tokens, primitives) · **บล็อกทุกอย่าง ทำก่อน**
แก้ navigation ให้คาดเดาได้ + ปล่อย primitive ที่ทุก phase พึ่ง
- `bottom-nav.tsx` — **freeze tab** (Market·Browse·Decks·Portfolio·More) เลิก ternary
- `mobile-menu-sheet.tsx` — จัดกลุ่มตาม journey
- `header*` / `header-constants.ts` — align desktop nav + game-switcher slot (inert จนถึง P4)
- `command-search.tsx` — ยกเป็น command palette
- **primitive ใหม่:** `AdSlot` (scaffold+placeholder) · `ConsentBanner` · **game-context store** (`currentGame`) · design-token pass
- `footer.tsx` — link สำคัญเข้าถึงได้บนมือถือ
- **risk:** แตะ chrome = เสี่ยงทุกหน้า → review เข้ม + test เดิม · AdSlot ต้อง zero-layout เมื่อไม่มี consent
- **ลำดับ:** tokens → freeze bottom-nav → reorg sheet → palette → AdSlot/Consent → game-context

### P1 — Core pages (home / cards / **card-detail** / sets) · **traffic สูงสุด หน้าแย่สุด**
- `card-detail.tsx` + `price-hub.tsx` + `header.tsx` — sticky action bar, split price-hub (quick-view เหนือ fold, chart/sources หลัง disclosure), siblings/related ล่างสุด
- `source-markets-table.tsx`, `card-listings-section.tsx` — ยุบความลึก, ยืน table→list `<sm`
- `card-grid/item/table.tsx` — `min-h-14`, focus-visible, line-clamp, game-aware (กิน P0 context)
- `app/page.tsx` — mobile single-column ชัด + AdSlot in-feed ตัวจริงตัวแรก (แก้ ad `lg:`-only)
- `sets/trending/market-overview` — reuse card-table ที่ clean + in-feed AdSlot
- **risk:** card-detail 600+ บรรทัด · disclosure ต้องไม่ซ่อน action จาก keyboard/SR · sticky เคารพ safe-area ไม่ชน bottom-nav
- **ลำดับ:** card-detail (win ใหญ่สุด) → grid/table → home → sets/trending

### P2 — Portfolio & tools (drop/deck calc, compare, watchlist) · **core utility, form หนัก**
- `portfolio-client/hero/insights/assets-table` — ยุบ analytics, asset list ก่อน, tap target
- `drop/deck-calculator` — card picker นิ้วโป้ง, ผลเป็น card list ไม่ใช่ table, input สูงขึ้น `py-3`
- `compare/watchlist/saved` — ยืน table→list, review form density
- **risk:** calculator มี math OPCG เฉพาะ → แตะแค่ presentation, mark seam ให้ P4 parameterize
- **parallel:** อิสระจาก P3 (หลัง P0+P1 รันคู่ได้)

### P3 — Marketplace & messaging · **code เยอะแล้ว แต่ UX กระจาย ปิดด้วย flag**
absorb `MARKETPLACE_OVERHAUL.md`
- wizard `seller/listings/new` มือถือ + photo upload · `listing-actions` sticky Buy/Offer · `chat-layout` เลิก absolute swap + เพิ่ม conversation header · `seller-shell` แก้ tablet chrome · browse/orders table→list + AdSlot + game filter · สร้าง `/saved`, ยืน `/seller/reviews`
- **risk:** surface ใหญ่สุด · คู่กับ PLAN **M3** (escrow/Stripe/dispute = commerce backend ไม่ใช่ design — อย่าปน) · flag ปิดจน 2 ฝั่งพร้อม
- **parallel:** อิสระจาก P2

### P4 — Multi-game enablement (Pokémon) · **net-new เปิดสวิตช์ P0 scaffold**
- เปิด game-switcher UI · `game-config/pokemon.ts` + register · `constants/pokemon/*`
- Schema ⚠️: `CardSet.gameId` NOT NULL, `gameId` ใน mappings, game-scope Deck/Listing/Portfolio
- game-scope queries server-side · game-aware grid/table/validators · scraper stack ใหม่ (cite `data-pipeline.md`)
- **risk:** backend/data risk สูงสุดทั้ง roadmap (migration, scraper, collision, enum) · ปล่อย Pokémon หลัง admin flag/"เร็วๆ นี้" ให้ OPCG ไม่พัง
- **depend:** hard-depend P0 game-context · ถ้า P1-P3 กิน context แล้วจะ "just work" multi-game

### P5 — Meta / Tier / Deck management · **engagement, urgency ต่ำสุด**
- routes/pages ใหม่: tier-list, meta surfaces, deck-detail/edit/share
- component: `MetaCardItem`, `TierListRow`, `DeckGrid` · integrate card-detail (badge "Tier S · 64%", Add to Deck) · honey missions ใหม่ · AdSlot
- Schema ⚠️: `TierList`, meta tagging, deck game-validation
- **risk:** tier-list มือถือห้าม scroll แนวนอน · defer จน P0-P3 นิ่ง · multi-game-aware ตั้งแต่วันแรกถ้าอยู่หลัง P4
- **ลำดับ:** deck mgmt (model มีแล้ว) → meta → tier

### สรุป parallel & effort
- **spine ลำดับ:** P0 → P1
- **parallel หลัง P0+P1:** P2 ‖ P3 (2 workstream)
- **P4** depend P0 context · risk backend สูงสุด · **P5** หางอิสระ priority ต่ำสุด
- **effort (เทียบ):** P3 > P4 > P1 > P0 > P2 > P5

---

## 8. แผนจัดบ้าน docs (ลด 11 ไฟล์รก → 5 active + 3 reference + archive)

> ⚠️ การลบ/ย้ายไฟล์ = ขออนุมัติเบสก่อน (ตาม permission) — ส่วนนี้คือ *แผน* ยังไม่ทำ

**ไฟล์ใหม่เดียว:** **`REDESIGN.md`** (อันนี้) = SSOT ของ design phase · lean, Thai-first · link ออกหา canonical 4 ตัว ไม่ทวนซ้ำ

**คง SSOT (ไม่ยุบเข้า REDESIGN):**
| ไฟล์ | บทบาท | เปลี่ยน |
|------|-------|---------|
| `AGENTS.md` | conventions | เพิ่ม note 3 บรรทัด: PR redesign ต้องอ้าง phase ใน REDESIGN.md |
| `SPEC.md` | what-is-done checklist | ติ๊กเมื่อแต่ละหน้า ship |
| `PLAN.md` | code backlog (M0-M4, R) | block "รอเฟส redesign" → pointer เดียว "→ REDESIGN.md" คง M0-M4 |
| `PROGRESS.md` | session handoff | NEXT ชี้เข้า phase ใน REDESIGN.md |

**archive (ย้าย `doc/archive/` ไม่ลบ):**
- ✅ `docs/MARKETPLACE_OVERHAUL.md` — **ลบแล้ว** (stale dup) + ลบโฟลเดอร์ `docs/` · `doc/` copy = **keep-updated** (M3 = track ถัดไป จึงคงเป็น working ref, rewritten 2026-06-14)
- `doc/honey-action-type-migration.md` = **keep-updated** (rewritten เป็น runbook · track PLAN M2 · archive หลัง M2 ship)
- ✅ `doc/MTOP.pdf` → **archived** `doc/archive/MTOP.pdf` (957KB binary SRS export)
- ✅ `README.md` — เขียนใหม่เป็น project README (Meecard overview + getting started + commands + docs map) แทน create-next-app boilerplate

**คง reference (ไม่แตะ, แค่ cite):**
- ✅ rewritten + cross-checked vs code (2026-06-14): `doc/data-pipeline.md` · `doc/honey-economy-rebalance.md` · `doc/honey-action-type-migration.md` · `doc/MARKETPLACE_OVERHAUL.md`
- archived: `doc/archive/detailed-plan-2026-04-28.md` (134KB north-star snapshot) · `doc/archive/MTOP.pdf`

---

## 9. ▶ NEXT
1. **เบสเคาะ §6** — โดยเฉพาะ URL strategy (A/B) + phase เริ่มต้น
2. ผมเริ่ม **P0** (หรือ phase ที่เบสเลือก) — แตก task ย่อยใน PLAN.md ก่อนลงมือ
3. (เมื่ออนุมัติ) จัดบ้าน docs ตาม §8
