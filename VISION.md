# 🌏 VISION — Meecard ระดับ World-Class (design north-star + build spec)

> **ไฟล์เดียวคุมทิศดีไซน์ทั้งหมด** · อ่านก่อนแตะ UI ทุกหน้า · redesign = แก้ของเดิม **in-place** (ไม่มีเวอร์ชัน v1/v2)
> ⚠️ **กติกาการแก้ไฟล์นี้ (2026-07-21):** กฎ/คำห้ามในไฟล์นี้ = วินัยที่ตั้งใจจาก research (มีเหตุผล+แหล่งกำกับ) — ไม่ใช่ฟีดแบ็กสะสม · **ฟีดแบ็กรายรอบของเบส ("ไม่เอา X") ห้ามจดเพิ่มเป็นข้อห้ามถาวรที่นี่** — จดเป็น "ตอนนี้ใช้ A แทน B (วันที่) · ทบทวนได้" ใน PLAN/PROGRESS · ทุกกฎทบทวนได้เมื่อเบสเปิดทิศใหม่ · งาน UI ทิศใหม่ = ทำหน้าเทียบ 2-3 ทิศให้เบสเห็นภาพจริงก่อน implement
> โจทย์: ฟีเจอร์มหาศาล (pricing หลายเกรด/แหล่ง · marketplace+escrow · chat · profile · deck/meta/tier · ads · multi-game · portfolio) แต่ต้อง **ไม่รก · เป็นสัดส่วน · ดูโปรระดับ platform โลก** · mobile-first และ desktop จริง
> สังเคราะห์จากงานวิจัย platform ระดับโลก: StockX · PSA · Card Ladder · TCGplayer · 130point · SNKRDUNK · Cardmarket · eBay Vault · Mercari · Whatnot · Robinhood · Collectr · Moxfield · Archidekt · Limitless · EDHREC · untapped.gg · Grailed · Stripe · Linear · Vercel/Geist (ดู §8)

---

## 0. หลักคิดเดียวที่ต้องจำ

> **world-class ≠ "เยอะกว่า" — แต่คือ "วินัยที่ pixel + แยกแกนให้ถูก + atom เดียวใช้ซ้ำทั้งแอป"**
> ฟีเจอร์ 10+ อยู่ในเปลือก 5 แท็บที่นิ่งได้ ถ้า (1) ตัดสิน primitive ครั้งเดียวแล้วไม่ drift (2) ไม่เอา เกม/ฟีเจอร์/action มาปนใน nav เดียว (3) ทุกหน้าประกอบจาก atom kit ชุดเดียว
> **นี่คือเฟส prototype — ออกแบบเผื่อ feature set เต็ม** (ให้เห็นภาพรวมทั้งระบบ) แล้วค่อยทยอย build จริง

---

## 1. Identity — Warm Premium (ค่าคงที่ ห้ามเปลี่ยน) 🐻

น้ำตาล/ทอง-honey + หมี + Honey currency = **ตัวตน Meecard** — เป็นสินทรัพย์ ไม่ใช่ปัญหา (คู่แข่ง generic เพราะ shadcn-blue; เรามีหมี+น้ำผึ้ง)

| | |
|---|---|
| **Canvas** | near-black **อุ่น** (espresso `#100C09`) — ไม่ใช่ near-black เย็นแบบ Linear · depth ด้วย **luminance** (warm-white overlay) ไม่ใช่เงาดำ |
| **Accent** | **honey-gold `#E9B970` = accent interactive เดียว** (active tab · selected · focus ring · primary CTA) — คงที่ทุกเกม |
| **Accent scarcity** | honey **< 5% ของจอ** เสมอ · เกินนั้น = ยังไม่ premium · borders/secondary/icons = neutral |
| **การ์ด = พระเอก** | chrome จืด espresso-neutral → foil/full-art เป็นสิ่งเดียวที่อิ่มสี |
| **gain/loss** | เขียว/แดง (`--price-up`/`--price-down`) **สงวนไว้แค่กำไร/ขาดทุน** · ห้ามใช้บน chrome · ห้ามใช้แทน honey |
| **per-game** | ชั้น tint บางๆ **ทับ** honey (crest · glow · กรอบการ์ด) · **ไม่กลบ** honey · Pokémon = เพิ่ม skin เหลือง/น้ำเงินบาง ไม่ใช่ repaint |
| **หมี + Honey** | สงวนไว้ที่ empty/onboarding · milestone · escrow ("หมีถือโหลน้ำผึ้ง = เงินถูกเก็บปลอดภัย") · reward toast — ไม่รกใน data view |

**2 บุคลิก:** MONEY surfaces (portfolio/market/price/escrow) = นิ่ง น่าเชื่อถือ, motion 150–300ms ไม่เด้ง · PLAY surfaces (deck/meta/tier/missions/honey) = มีพลัง, spring delight

---

## 2. สถาปัตยกรรม IA — แยก 3 แกน (หัวใจของ "ไม่รก")

| แกน | คือ | กลไก | เพิ่มฟีเจอร์/เกม |
|-----|-----|------|----------------|
| **GAME = "ที่ไหน"** | namespace | `/[game]/` prefix ทุก route + game-switcher pill (ซ้ายบน) + shell tint ตามเกม | เพิ่ม Pokémon = **0 nav ใหม่** |
| **FEATURE = "อะไร"** | bottom-nav **5 ช่องคงที่ตลอดกาล** | `Home · Prices · Marketplace · Portfolio · More` | ฟีเจอร์ใหม่ = **tile ใน More hub** ไม่ใช่ tab |
| **ACTION = "ยังไง"** | per-page | header-right (share/filter) + sticky-bottom CTA — ตำแหน่งเดิมทุกหน้า | grammar เดียวทุกหน้า |

**กฎเหล็ก:** ถ้า game-switch + section-link + page-action โผล่ใน menu เดียวกัน = แพ้

- **Universal search = teleport** (Cmd+K / bar บนสุด Home) — ค้นการ์ด/เซ็ต/เด็ค/ฟีเจอร์/action · default scope = เกมปัจจุบัน + toggle "ทุกเกม" → ดูดซับการโตของฟีเจอร์แบบล่องหน (Linear model)
- **More = Hub จัดกลุ่ม** (ไม่ใช่ list ล้น): `PLAY` (Deck/Meta/Tier/Missions/Honey) · `TRACK` (Watchlist/Wishlist/Drop Calc/Alerts) · `TRADE` (Sell/My Listings/Orders/Escrow/Inbox) · `ACCOUNT` (Profile/Pro/Settings)
- **Hub มี sub-tab 2–4 อัน** (เกาะ hub ไม่เกาะ nav กลาง): Marketplace `Buy·Sell·Orders` · Portfolio `Holdings·Performance·Watchlist` · Card detail `Comps·Listings·Population·Meta`
- **Responsive:** mobile = bottom-nav + single column · desktop (`lg:`) = side-rail nav + multi-zone layout จริง (ไม่ใช่คอลัมน์มือถือยืด) · atom เดียว — เปลี่ยนแค่ composition · ตาราง → list `<sm` เสมอ

---

## 3. Atom Kit — สร้างครั้งเดียว 10 ฟีเจอร์ inherit (สิ่งที่ทำให้รู้สึกเป็น "แอปเดียว")

> ทุกหน้าประกอบจาก atom ชุดนี้ · atom เดียวกัน byte-identical ข้าม breakpoint (เปลี่ยนแค่ grid)

| Atom | รับผิดชอบ | ใช้ที่ |
|------|----------|--------|
| `PriceTag` | `.text-price` tabular + ลูกศร ▲/▼ + สี (สีคือ reinforcement ไม่ใช่ความหมายเดียว — a11y) | ทุกที่ที่มีราคา/delta |
| `HeroNumber` | `.text-display` + count-up `.rise` + bind กับ scrub | portfolio total · card hero price · deck cost |
| `GradeChip` / `GradeRail` | label + preview price ในชิป + selected(honey) state | card detail · comps · listings |
| `EditionToggle` | JP \| EN segmented (re-price ทั้งหน้า) | card detail · search filter |
| `SourceBadge` | mark ต่อแหล่ง (Yuyutei/SNKRDUNK/eBay/TCGplayer) + region JP/EN + คลิกไปต้นทาง | comps · breakdown · chart legend |
| `SellerChip` | avatar + behavior badge (response/on-time) + tier | marketplace · chat · listings |
| `PriceLadder` | Lowest Ask / Highest Bid / Last Sale (3-slot) | marketplace order book |
| `CustodyTimeline` | escrow stepper + held amount + countdown | orders · mirror ใน chat · push |
| `EventCard` | offer/order milestone = การ์ด full-width (ไม่ใช่ bubble) | chat |
| `ListRow` *(มีแล้ว)* | tap ≥56px · leading/title/subtitle/trailing/chevron | ทุก table→list fallback |
| `Surface` / `.panel` *(มีแล้ว)* | การ์ดเนื้อหาใหญ่ (hairline + warm) | ทุก card |
| `AdSlot` *(มีแล้ว)* | fixed height + skeleton + inherit token | browse zone ที่ allowlist เท่านั้น |
| `Skeleton` *(มีแล้ว)* + `EmptyState` | loading รูปร่างตาม content · empty มี CTA | ทุก async surface |

---

## 4. Visual system — วินัยที่ทำให้ feature เยอะแต่ไม่รก (Geist/Linear/Robinhood)

### Token 3 ชั้น (primitive → semantic → component) ใน `globals.css`
- **Primitive:** สี · `--p-s1/2/3` · `--p-hair` *(มีแล้ว)* · **เพิ่ม** `--dur-fast 120 / --dur-base 200 / --dur-slow 300` · `--ease-chrome cubic-bezier(.32,.72,0,1)` *(มีแล้ว)* · `--ease-spring`
- **Semantic:** `--price-up/down` · `--game-accent` *(มีแล้ว)* · **เพิ่ม** `--motion-money`(base+chrome) · `--motion-play`(spring) · elevation `--elev-flat`(hairline) / `--elev-raised`(nav,sheet) / `--elev-overlay`(dialog)
- **Component:** Button/Badge/Surface อ่าน semantic เท่านั้น — **เลิก hardcode `duration-200 ease-out`** (ตอนนี้มี 2 vocabulary motion = drift) ย้ายไป `--motion-money`

### กฎตายตัว
1. **One hero number / screen** — `.text-display` ตัวเดียวต่อหน้า (portfolio total **หรือ** card hero) · ที่เหลือไล่ลง type ramp · เกิน 1 = clutter bug
2. **Tabular mono numerals** ทุกตัวเลขเงิน/%/qty/แกนกราฟ — ราคาไม่ขยับความกว้างตอน tick = feel "financial instrument"
3. **▲/▼ บนทุก delta** — สีคือ reinforcement, ลูกศรคือความหมาย (colorblind/grayscale ยังอ่านได้)
4. **Elevation:** inline card = flat + hairline เท่านั้น (ไม่ clip มุมโค้ง) · layered shadow สงวนไว้ **3 surface เท่านั้น**: bottom-nav · bottom-sheet · dialog · dark-mode hairline = warm-white overlay (สว่างกว่า canvas → ขอบอ่านด้วย luminance ไม่ใช่เส้นดำ)
5. **Spacing scale 4px:** gap-2 ในแถวแน่น · gap-3 padding การ์ด · gap-4 ระหว่างการ์ด · gap-6 ระหว่าง section · desktop เพิ่ม density (ลด padding/เพิ่มคอลัมน์) **ไม่เพิ่มของใหม่**
6. **ศูนย์ spinner:** skeleton รูปร่างตรงกับ layout จริง (โผล่ <300ms, animated, aria-hidden) · empty state มี illustration + 1 บรรทัด + CTA เดียว · mutation = optimistic + `.rise`
7. **`prefers-reduced-motion`** ปิด `.rise`/`.ease-chrome`/ticker *(มีแล้ว)* — ทุก animation ใหม่ต้อง honor

---

## 5. Per-Surface Spec (ออกแบบเต็ม feature set)

### 5.1 Card Detail & Pricing — trust core (หน้าสำคัญสุด)
ราคา 1 ใบมี 3 แกน (edition JP/EN · grade · source) — **ห้ามโชว์พร้อมกันหมด** (= สเปรดชีต) ใช้ "re-pricing axis" — เลือก grade chip 1 ครั้ง → ทั้งหน้า re-price (StockX size-selector model)

**Zones (บน→ล่าง):**
1. **Identity** — รูปการ์ด (พระเอก, mobile full-bleed → lightbox · `lg:` sticky ซ้าย) + ชื่อ + code + rarity/set eyebrow + share
2. **Edition + Grade** — `EditionToggle` JP\|EN (เหนือ rail) + **`GradeRail`** chip เลื่อน `Raw · PSA 10 · PSA 9 · PSA 8 · BGS` · **แต่ละ chip โชว์ราคาตัวเอง** (rail = price comparison ก่อนแตะ) · selected = honey · no-data = ghost ไม่ซ่อน · = single source of truth (Zustand) ขับ zone 3–6
3. **Stat row (trust anchor)** — `HeroNumber` = Last Sale ของเกรดที่เลือก (ถ้าไม่มี comp จริง → modeled "est." + tooltip, Cardmarket honesty) · 2 stat รอง: `Lowest Ask` · `Δ30d` (ลูกศร ไม่ใช่สีแดง/เขียวจัด) · `SourceBadge` + freshness "as of 3h ago"
4. **Population strip** (เฉพาะ chip graded) — บรรทัดเดียวเลื่อนได้ `PSA Pop 10→124 · 9→980 · 8→1,510` เกรด active หนา · Raw ซ่อน · tap → sheet เต็ม
5. **Chart** — เส้นเดียว bound เกรดที่เลือก + จุด sold comp ทาบบนเส้น (tap จุด → ไฮไลต์แถว comp) · `7D·1M·3M·1Y·All` · <2 จุด = "ข้อมูลไม่พอวาดกราฟ"
6. **Recent Sales (sold comps)** — newest-first, filter ตามเกรด · แถว: date + price + grade echo + `SourceBadge` + ↗ · **SOLD เด่น, ask หรี่ + ป้าย "asking"** (ห้ามปนกัน) · `<sm` list / `sm+` table 4-col · cap 8 → "ดูทั้งหมด" sheet
7. **Reference markets** — ask ต่ำสุดต่อแหล่ง (PriceHubSources เดิม, ลงล่าง) — "ซื้อที่ไหนตอนนี้" vs zone 6 "ขายจริงเท่าไหร่"
8. **Meta + related** — attributes พับได้ + "พิมพ์อื่น/parallel" + "เด็คที่ใช้การ์ดนี้"
9. **Sticky CTA** *(global bar)* — `Add to Portfolio`(honey) · `Watchlist` · `Set Alert` (pre-fill เกรด+ราคาที่เลือก)

**ห้าม:** matrix เกรด×แหล่ง×ask+sold พร้อมกัน · ad ในโซนราคา/sold เด็ดขาด · ปน asking กับ sold · ตารางเลื่อนแนวนอนบนมือถือ

### 5.2 Marketplace — "live market + escrow" ไม่ใช่กระดานประกาศ
หน่วยตลาด = **SKU triple {card, edition, grade}** ไม่ใช่ per-listing (StockX) · 1 nav slot, sub-mode `ซื้อ · ขาย · ออเดอร์`

- **Order book ต่อ SKU:** `PriceLadder` = Lowest Ask / Highest Bid / Last Sale + sparkline · ladder ask/bid 3 อันดับแรก ("ดูทั้งหมด" พับ) · **2 CTA เท่านั้น**: gold "ซื้อเลย ฿X" (take lowest ask) + ghost "เสนอราคา" (bid + expiry chip 3/7/14/30 วัน + "บิดคุณอันดับ #N")
- **Escrow = `CustodyTimeline` ที่มองเห็น:** ชำระ(held) → ส่ง → กำลังส่ง → ถึง → ตรวจ 72ชม. → ปล่อยเงิน · **held amount = hero number** ("฿12,400 เก็บไว้ปลอดภัย" + หมีถือโหลน้ำผึ้ง) · countdown ring บน node ตรวจสอบ · dispute = node แดง เงิน freeze
- **Buyer Protection** enumerate ใต้ปุ่ม Buy (3–4 bullet ไม่ใช่ลิงก์): เงินถูกถือ · authenticate การ์ด graded · แจ้งปัญหาใน 72ชม. · ไม่ส่ง=คืนเต็ม
- **Seller badge ได้จากพฤติกรรม** (Whatnot): ตอบไว · ส่งตรงเวลา% · ขายสำเร็จ N · ไม่มีข้อพิพาท · tier Verified/Top — ไม่ใช่ดาว vanity
- **Fees โปร่งใส 2 ฝั่ง:** buyer เห็น itemized checkout · seller เห็น net-payout สดตอนพิมพ์ราคา ("ได้รับ ฿11,160 หลังหัก 8%") · fee% ผูก subscription tier (Pro ถูกกว่า = upsell)
- **Dispute** = branch มี timer จาก custody timeline (เหตุผล chip + รูป + SLA) ไม่ใช่ email ตัน
- **First-party trust:** comp ที่มาจาก escrow order จริง = badge "ขายจริงบน Meecard" (จุด gold) เด่นกว่า scraped comp
- **ห้าม:** classifieds grid เป็นหน้าหลัก · โชว์ ladder 30 แถว · ดาว vanity เป็น signal หลัก · auctions เป็น nav tab แยก (= state ที่ 3 ของ SKU)

### 5.3 Portfolio — Robinhood-grade + ซื่อสัตย์เรื่อง P/L
**Zones:** header (portfolio switcher + add) → **Hero** (`HeroNumber` มูลค่ารวม + Delta pill, glow PnL-tint ≤18%) → **scrub chart** full-bleed (baseline = ต้น range, finger-scrub อัปเดต hero สด, snap-back `.rise`) → range `1D·1W·1M·3M·1Y·ALL` (active = honey) → **KPI quartet** (Market Value · Cost Basis · P/L · ROI% — 2×2 hairline) → **Movers** ("มูฟเวอร์วันนี้" เรียงตาม **THB swing สัมบูรณ์** ไม่ใช่ %) → **Holdings** list 2 บรรทัด (qty · name/grade/lang · value+delta) → tap = detail sheet (toggle raw/graded history, avg cost vs market, sold-comp anchor)

- **กฎทอง — แยก inflow ออกจาก gain:** ซื้อการ์ดเพิ่ม **ห้าม**ทำให้เส้นมูลค่ากระโดดเป็น "กำไร" · snapshot เก็บ `netInvested` (สะสมเงินที่ใส่จริง) → P/L = marketValue − netInvested (money-weighted, Sharesight) · จุดที่ซื้อเพิ่ม = **inflow notch** (จุด honey บนแกน x, tap = "เพิ่ม Luffy ×1 ฿1,200") · นี่คือ #1 honesty bug ปัจจุบัน (cron รวม item ใหม่เข้า total)
- realized (ขายแล้ว) แยกจาก unrealized · value ต่อใบมาจาก **smoothed sold-comp index** ไม่ใช่ scrape ล่าสุดใบเดียว
- **ห้าม:** เส้นกระโดดตอน add card · ROI เป็น hero · ทาสี P/L เป็น honey · donut+history+treemap พร้อมกัน · 6 KPI (4 พอ)

### 5.4 PLAY — Deck Builder + Meta + Tier (1 family, energetic)
ทั้งหมดเป็น tile ใน More hub (`/decks` reserve disabled tile อยู่แล้ว — เปิดใช้) · game-namespaced · game-parameterized ด้วย `GameConfig` (deckSize, hasLeader, copyLimit, curveStat, sections)

- **Deck editor จอเดียว** (Moxfield, **ฆ่า modal-per-add**): desktop 3-col (search rail ค้าง · deck กลาง · stat rail sticky) · mobile = deck list + sticky bottom "เพิ่มการ์ด" (bottom-sheet ค้างไว้ add รัวๆ) · **`QtyStepper` ≥44px** (4-copy aware, tap เลขเปิด pad 1-2-3-4) · live cost-curve (Recharts honey bar, animate) + color-identity pip (off-color = honey warning ไม่บล็อก) + count ring X/50
- **Deck cost ผูก portfolio → marketplace** (wedge เหนือคู่แข่ง): hero = deck cost THB → own/need split bar (owned honey, missing muted) → **"ซื้อที่ขาด N ใบ"** deep-link marketplace กรอง card code นั้น · per-row owned dot จาก holdings
- **Tier list = VISUAL default** (Limitless แต่อุ่นกว่า): แถว S/A/B/C ของ leader art (face-crop) · tile = art + 1 hero stat (meta-share% default, toggle win%) + momentum arrow · toggle → table แบบ Limitless (data crowd) · **tier คำนวณจากกฎ** (share+win+sample threshold ระบุได้) ไม่ใช่ตามใจ · S = honey ตัวเดียวในกริด
- **Meta row** = 1 hero stat + face art + momentum arrow (tap arrow = "+3.1% ตั้งแต่ OP15")
- **Archetype detail → "Build this deck"** (EDHREC funnel): sample list + inclusion% + "cost ฿X · มี ฿Y" → clone เป็นเด็คใหม่ ลง editor พร้อม "ซื้อที่ขาด" → marketplace · chains 3 surface + monetization

### 5.5 Chat · Profile · Reputation
- **Thread เกาะ listing:** `StickyContextCard` บนสุด (รูป+name+code+edition+grade chip+cert#+ราคา+live offer state) ยุบเหลือ 56px ตอน scroll
- **Offer/order = `EventCard`** (full-width, center, timeline dot — **ไม่ใช่ bubble**) · MessageType มี OFFER/ORDER_UPDATE/SYSTEM อยู่แล้ว (gap คือ rendering)
- **"Accept ฿X" = confirm sheet** (line item + fee + shipping + all-in total = hero number + gold CTA) → สร้าง Order จริง · ไม่ใช่ tap เดียว
- **Inbox split:** `ซื้อ · ขาย · อัปเดต` (segmented) · action-needed = ขอบ honey ซ้าย
- **Reputation = 1 tier badge** (New→Established→**Trusted Seller** gold) + stats sheet (response · on-time% · dispute rate · deals · since) · **threshold ประกาศชัด** (Grailed: "อีก 3 ดีล + คง 4.9 → Trusted") · blue isVerified = identity (แยกจาก tier = performance)
- **Cold-start:** auto-feedback 7 วันหลัง DELIVERED ถ้าไม่มี dispute (eBay 2025) → completedDeals โตจากการส่งจริง ไม่ต้องปลอม
- escrow milestone mirror ทั้งใน order screen + chat EventCard + push · countdown live · dispute rate โชว์จริง (= trust signal)

### 5.6 Monetization & Ads — เด่นจริง แต่แยกความหมายชัด
3 surface แยกกันชัด: **(A) Google Ads mockup** (layout-only, ไม่เชื่อม network) · **(B) Direct Sponsor** (ลูกค้าซื้อพื้นที่จาก MeeCard โดยตรง) · **(C) promoted listing** (seller-paid inventory จริง) และ **ad-free = headline Pro perk**

- **สถานะปัจจุบัน = P0 live:** Home, Search, Set Detail และ Card Detail ใช้ `AdInventorySlot`/registry/provider กลางแล้ว; route อื่นยังไม่มี slot จนกว่า owner รีวิว P0
- **Google mockup = ค่าเริ่มต้นทุกช่อง:** ใช้ขนาดมาตรฐานเพื่อทดสอบ layout เท่านั้น · ต้องติดป้าย Mockup · ไม่มี script/iframe/pixel/cookie/network/CTA
- **Direct Sponsor = ตัวแทนช่องเดิมเท่านั้น:** เฉพาะ campaign `ACTIVE` ที่มีผู้ซื้อจริงจึงแทน Google ใน placement ที่อนุญาตด้วย geometry เดียวกัน พร้อมแบรนด์+ข้อความ+CTA+ป้าย Sponsored; ไม่มี campaign ให้ fallback เป็น Google และหน้าเว็บไม่ประกาศขายพื้นที่
- **Placement เด่นได้โดยไม่รกช่วงบน:** ห้ามวางหลัง hero/header; P0 ใช้ bottom anchor ที่ปิดได้ + contextual in-feed/section boundary และ Card Detail คง rectangle ข้างกราฟกับ marketplace rail โดย anchor ต้องเว้น BottomNav/safe area และ floating controls อื่น; long-form P1 มีได้สูงสุด 3 จุดแต่ห้ามวางสองจุดติดกัน
- **Ad-free gate:** Pro/Pro+/Lifetime ซ่อน Google mock และ Direct ทั้งหมดโดยไม่เหลือ wrapper/spacing; loading/empty/error ไม่แสดง
- **Hard deny:** auth/settings/admin/proto และขั้นตอน create/order/chat/seller; route matrix รายหน้าและขนาดอยู่ที่ `doc/advertising-placement-plan-2026-07-24.md`
- **Promoted listing** = `ListingCard` เดิม + 1 badge "Featured" + relevance floor + cap ≤20%/page + dedup (featured *หรือ* organic ไม่ใช่ทั้งคู่) — ไม่ใช่ banner, เป็น inventory จริงที่เพิ่ม liquidity

### 5.7 Multi-Game (Pokémon ต่อไป) — game = namespace ไม่ใช่ tab
- **URL เดียว canonical:** `/[game]/<feature>/...` (TCGplayer path-prefix) · ห้ามปน subdomain/query (Limitless = cautionary) · middleware resolve `[game]` กับ `Game.slug` · legacy 301 → prefixed · aggregate `/all/portfolio` `/all/search` เท่านั้น
- **Switcher = context switcher** (ซ้ายบน, sheet/popover): เลือกแล้ว rewrite แค่ `[game]` segment **อยู่ feature เดิม** (Marketplace→Marketplace) · row โชว์ data ตัวเอง ("128 ใบ · ฿42,300") · pin เกมที่เล่น (Cardmarket Favourites) · coming-soon = ghost + chip "soon" + notify-me
- **`GameConfig` 1 ไฟล์** ขับทุก parameterized surface — **ห้าม `if game===pokemon` กระจาย** · deck rules/rarities/pull-rate/cardFace stat fields/sources/editions อ่านจาก config
- **Per-game tint = ชั้นบางทับ honey** (`--game-tint`): crest · glow บนสุด · กรอบการ์ด เท่านั้น · honey คง active/CTA ทุกเกม
- **"All games" aggregate เฉพาะ Portfolio + Search** (Collectr): hero = ผลรวม THB ข้ามเกม + breakdown ต่อเกม deep-link · deck/meta/drop-calc = single-game (อย่าฝืน)
- **card-face abstraction:** stat rail render จาก `GameConfig.cardFace` (OP: cost/power/counter/life · Pokémon: HP/type/stage/retreat) · edition+grade rail = universal

---

## 6. Data model evolution (⚠️ ทุกข้อแตะ Prisma — **เบสอนุมัติก่อน migrate**)
> schema ปัจจุบัน gameId-ready แล้ว (Game + nullable gameId + index) · นี่คือส่วนต่อยอดเพื่อรับ feature set เต็ม

| ฟีเจอร์ | ต้องเพิ่ม |
|--------|----------|
| **Grade axis** | `CardPrice.gradeCondition` (free-text) → **Grade enum** (RAW_A/B/C · PSA_10/9/8 · BGS) · `edition` (JP/EN) เป็น column (ตอนนี้ implied by source) |
| **Population** | `CardPopulation`(cardId, grader, grade, count, asOf) — strip โชว์ ghost จนข้อมูลมา |
| **Modeled vs real** | API คืน last-sale จริง **และ** modeled value + flag แยกกัน (อย่ารวม server-side) |
| **Marketplace** | `MarketSku`{cardId, edition, grade} · `Listing`→Ask ผูก SKU · `Bid` model (auto-match → Order) · Order +escrow fields (heldAt, inspectionEndsAt, releasedAt, stripeCharge/Transfer — Stripe Connect separate charges+transfers, ไม่ใช่ legal escrow) · `SellerStats` roll-up · `Dispute` model · `Comp` feed (source enum + soldAt) |
| **Portfolio honesty** | `PortfolioSnapshot +netInvestedJpy` (money-weighted P/L) · `TransactionType +SELL` + realized vs unrealized · `Card.indexPriceJpy` (rolling median comp) แทน latestPrice ใบเดียว |
| **PLAY** | `GameConfig` = static `src/lib/games/rules.ts` (ไม่ใช่ DB) · `MetaArchetype` + `ArchetypeCardInclusion` (อัปจาก aggregation cron) · `GET /api/decks/[id]/cost` → {costThb, ownedThb, neededThb, missing[]} |
| **Reputation** | `sellerTier` (derive) · `SellerStats +onTimeShipPct +disputeRate` · auto-feedback cron |
| **Ads** | `PromotedListing`(boostTier, dates, paymentId, relevanceScore) · `AdEvent` (impression/click) · consent persist server-side (PDPA) · **ไม่มี ad targeting จาก portfolio** |
| **Multi-game** | `Game +accentTint +sortOrder +isComingSoon` · backfill `Card.gameId` → NOT NULL + `@@unique([gameId, cardCode])` · `Card.gameMeta Json?` (stat ต่อเกม) |

---

## 7. ลำดับ build (de-versioned — ดู checklist ใน [PLAN.md](PLAN.md))
แก้ in-place ทีละ surface · spine: **Foundation (token+atom kit+states)** → **Card detail** (trust core, คุ้มสุด) → **Portfolio** (honesty fix + Robinhood hero) → **Marketplace+escrow** (effort สูงสุด) → **Chat/Profile** → **PLAY (deck/meta/tier)** → **Ads polish** → **Multi-game (Pokémon)** · pricing data (grade/edition/EN source) แทรกตอนทำ card detail/marketplace

---

## 8. Reference platforms (งานวิจัย — lookup ตอน build แต่ละ surface)
- **Pricing/comps:** StockX (bid/ask/last-sale) · Card Ladder (sales history index) · PSA (pop report) · TCGplayer (condition selector) · 130point (true sold incl. best-offer) · SNKRDUNK (JP graded) · Cardmarket (AVG1/7/30 + honesty)
- **Marketplace/escrow:** StockX (order book) · eBay Vault (custody as product) · Mercari (hold→deliver→72h→release) · Whatnot (behavioral trust) · Goldin/Heritage (auth premium) · Stripe Connect (separate charges+transfers)
- **Portfolio:** Robinhood (hero+scrub) · Card Ladder · Collectr (grade-aware, slab view) · Delta/Rainbow (rows) · Sharesight (realized/unrealized honesty)
- **PLAY:** Moxfield (single-screen editor) · Archidekt (own/need) · Limitless (meta table) · EDHREC (inclusion%) · untapped.gg (derived tiers) · Pokémon TCG Live (mobile editor)
- **Chat/reputation:** StockX/Mercari (offer mechanics) · Grailed/Whatnot (tier badge thresholds) · eBay (feedback%, auto-feedback) · Discord/Linear (system-event rows)
- **Ads:** AdSense/GPT + Better Ads Standards · TCGplayer (clean data table) · eBay/Amazon (promoted = native + label) · Playwire (density numbers)
- **Multi-game:** TCGplayer/Cardmarket (path namespace) · Collectr/Slabfolio (aggregate) · Moxfield (format parameterize)
- **Visual system:** Vercel/Geist (hairline-as-border, dark edge by light) · Linear (calm density, Cmd-K) · Robinhood (one hero number) · Stripe (restraint) · Mercari (image-led grid)
