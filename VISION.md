# 🌏 VISION — Meecard ระดับ World-Class (Future-Proof Design)

> อัปเดตล่าสุด: 2026-06-14 · design north-star ใหม่ (ต่อยอดจาก [REDESIGN.md](REDESIGN.md) v1 ที่ทำ P0–P2 เสร็จแล้ว)
> **โจทย์:** ฟีเจอร์มหาศาล (meta/tier/deck/marketplace+escrow/chat/profile/ads/multi-game/multi-source pricing) แต่ต้อง **ไม่รก · เป็นสัดส่วน · ดูโปรระดับ platform โลก** · mobile-first
> ฐานข้อมูล: workflow research 8 surface จาก StockX · PSA · TCGplayer · SNKRDUNK · Robinhood · Card Ladder · Moxfield · Limitless · Linear · Mercari (110 web sources)

---

## 0. หลักคิดเดียวที่ต้องจำ

> **world-class ไม่ใช่ "เยอะกว่า" — แต่คือ "วินัยที่ pixel + แยกแกนให้ถูก"**
> ฟีเจอร์ 10+ อันอยู่ในเปลือก 5 แท็บที่นิ่งได้ ถ้าตัดสินใจ primitive ครั้งเดียวแล้วไม่ drift และไม่เอา "เกม / ฟีเจอร์ / action" มาปนใน nav เดียวกัน

---

## 1. สถาปัตยกรรม IA — แยก 3 แกน (หัวใจของ "ไม่รก")

ปัญหารกเกิดเมื่อเอา 3 สิ่งที่คนละประเภทมายัด nav เดียว แยกมันออก แล้วปัญหาหายเกือบหมด:

| แกน | คือ | กลไก | ผลเวลาเพิ่มฟีเจอร์ |
|-----|-----|------|-------------------|
| **GAME = "ที่ไหน"** | namespace ไม่ใช่ปลายทาง | `/[game]/` prefix ทุกหน้า + game-switcher pill (มุมซ้ายบน) + shell ทินต์สีตามเกม | **เพิ่ม Pokémon = 0 nav ใหม่** — แค่ค่าใหม่ของแกนเดิม |
| **FEATURE = "อะไร"** | bottom-nav **5 ช่องคงที่ตลอดกาล** | `Home · Prices · Marketplace · Portfolio · More` | ฟีเจอร์ใหม่ = **tile ใน Hub** ไม่ใช่ tab ใหม่ |
| **ACTION = "ยังไง"** | per-page | header-right (share/filter) + sticky-bottom CTA — ตำแหน่งเดิมทุกหน้า | ทุกหน้าใช้ grammar เดียว |

**กฎเหล็ก:** ถ้า game-switch + section-link + page-action ไปโผล่ใน menu เดียวกันเมื่อไหร่ = แพ้แล้ว

### Bottom-nav ใหม่ (เทียบของเดิม)
```
ของเดิม:  Market · Browse · Decks · Portfolio · More
ใหม่:      Home · Prices · Marketplace · Portfolio · More
```
- `Decks` ย้ายเข้า **More → Play hub** (ไม่ใช่ traffic หลักพอจะกิน nav slot)
- `Marketplace` เลื่อนขึ้น nav (P3 = track ใหญ่ถัดไป, ต้องเข้าถึงเร็ว)
- `Home` = discovery feed + universal search (เดิม Market overview)

### "More" = Hub จัดกลุ่ม (ไม่ใช่ list ล้นแบบ iOS)
วาล์วระบายแรงดัน — ฟีเจอร์ทั้งหมดมาลงที่นี่เป็น tile จัดกลุ่ม:
```
PLAY     → Deck Builder · Meta / Tier List · Missions · Honey
TRACK    → Watchlist · Wishlist · Drop Calc · Price Alerts
TRADE    → Sell / List · My Listings · Orders · Escrow · Inbox/Chat
ACCOUNT  → Profile / Reputation · Meecard Pro · Settings
```

### Universal Search = teleport (สำคัญสุดต่อการ scale)
search bar เด่นบนสุดของ Home — ค้นได้ทั้ง **การ์ด · เซ็ต · เด็ค · ฟีเจอร์ · action** ("เปิด portfolio", "ราคา OP13-118")
→ จงใจ under-build nav ที่มองเห็น เพราะ search พาผู้ใช้ไปไหนก็ได้ทันที = ตัวดูดซับการโตของฟีเจอร์แบบล่องหน

### Hub pages มี sub-tab 2–4 อัน (sub-feature เกาะ hub ไม่เกาะ nav กลาง)
- Marketplace → `Buy · Sell · Orders · Escrow`
- Portfolio → `Holdings · Performance · Watchlist`
- Card detail → `Comps · Listings · Population · Meta`

### Responsive — มือถือ **และ** desktop (ไม่ใช่มือถือยืด)
mobile-first แต่ desktop ต้องเป็น layout จริงที่ใช้พื้นที่กว้าง ไม่ใช่คอลัมน์มือถือลอยกลางจอ · ตาม AGENTS (`md:` chrome boundary · `lg:` columns):

| Surface | Mobile (`<lg`) | Desktop (`lg+`) |
|---------|----------------|------------------|
| **chrome** | bottom-nav 5 ช่อง + header | sidebar/rail nav ซ้าย + header กว้าง (bottom-nav → side) |
| **card-detail** | single column (image→price→rail→chart→tabs) | **2 คอลัมน์**: รูป+identity+CTA ซ้าย (sticky) · price+chart+tabs ขวา |
| **portfolio** | linear (hero→chart→KPI→movers→holdings) | **dashboard**: main (hero+chart+holdings) + **sidebar** (KPI+movers sticky) |
| **marketplace/browse** | list/card 1–2 คอลัมน์ | grid หลายคอลัมน์ + filter rail ซ้าย |
| **deck builder** | bottom-sheet add | 3-pane (pool · deck · stats) |

กฎ: เนื้อหา/atom เดียวกัน — แค่ **จัด composition ต่อ breakpoint** · ตาราง→list `<sm` เสมอ · desktop เพิ่ม density ไม่เพิ่มของใหม่

---

## 2. Visual Identity — vibe "ผสม" (นิ่งบนเงิน · มีพลังบน play)

> ของจริงตอนนี้ **ไม่ได้ generic เพราะสี** — มี brand honey brown/gold (`#73533E` light / `#E0B865` dark) อยู่แล้ว
> ฟีล generic มาจาก **execution**: canvas ไม่ near-black จริง, border solid, ไม่มี depth/motion/per-game accent, tabular-nums ไม่ global
> **แก้ที่ execution discipline ไม่ใช่รื้อสี**

### 🐻 Brand = หมี + honey (ค่าคงที่ ห้ามเปลี่ยน)
น้ำตาล/ทอง-honey = ตัวตน Meecard (มาสคอตหมี + Honey currency) — **เป็นสินทรัพย์ ไม่ใช่ปัญหา** แอปทั่วไป generic เพราะใช้ shadcn blue; ของเรามีหมี+น้ำผึ้ง = มีตัวตนชัดกว่าคู่แข่ง

**ทิศที่ทำให้ได้เปรียบ = "WARM premium" (ไม่ใช่ cold premium)**
research แนะ near-black เย็น (#0B0C0E) แบบ Linear/Robinhood — แต่ถ้าทำงั้น Meecard = clone เย็นๆ เหมือนใครก็ได้ · หมี+น้ำผึ้ง ควรเป็น **near-black อุ่น (espresso/น้ำตาลเข้มมาก) + accent honey-gold + honey-glow บน hero** → พรีเมียม **และ** เป็นตัวเอง **และ** ไม่ซ้ำใคร

**brand accent vs per-game (เคลียร์ความกำกวม):**
- **honey-gold = brand & primary interactive accent คงที่ทุกเกม** (active tab · selected · focus · CTA) — หมีคุมโครงเสมอ
- **per-game = ชั้น theming บางๆ ทับบน honey** — game crest ใน switcher · เส้น/glow ทินต์บางบนหน้า game-scoped · กรอบการ์ดสีเกม · **ไม่ใช่** เปลี่ยน accent หลักทิ้ง (Pokémon = เพิ่ม skin เหลือง/น้ำเงินบางๆ ไม่ใช่กลบ honey)
- gain/loss เขียว/แดง = universal ทุกเกม

### 2 โหมดบุคลิก (vibe = ผสม)
| | **MONEY surfaces** (calm) | **PLAY surfaces** (energy) |
|---|---|---|
| หน้า | Portfolio · Marketplace · Price · Card-detail · Orders/Escrow | Deck · Meta · Tier · Missions · Honey |
| ฟีล | นิ่ง น่าเชื่อถือ Robinhood/StockX | มีพลัง สนุก การ์ดจัดเต็ม |
| สี | accent เดียว เงียบ, ตัวเลขเป็นพระเอก | per-game accent เด่น, holo/foil, gradient ทินต์ |
| motion | นิ่ง (150–300ms, ไม่เด้ง) | spring delight (add-to-deck, level-up, missions) |

### Token upgrades (before → after, ของจริงใน globals.css)
| Axis | ตอนนี้ | เป้า |
|------|--------|------|
| **Dark canvas** | `#1C1C1E` (Apple gray, เย็น) | **WARM** near-black `~#120E0B` (น้ำตาลเข้มมาก/espresso) + ชั้นความลึกด้วย **luminance** (`--surface-1/2/3` = warm-white overlay 0.02→0.08) — premium แต่ on-brand หมี |
| **Border** | solid 1px | `box-shadow: 0 0 0 1px` hairline (white 0.06–0.08) — ไม่ clip มุมโค้ง, transition ลื่น |
| **Numerals** | tabular-nums 12 จุด | **global** ทุกราคา/%/qty/แกนกราฟ + mono numeral face → feel "financial instrument" |
| **Type weight** | Kanit/Inter สม่ำเสมอ | **contrast**: 700 display (KPI) vs ~510 UI · tracking ลบบนตัวใหญ่ |
| **Price semantic** | Apple green/red `#34C759`/`#FF3B30` | สงวนเขียว/แดงไว้ **แค่ gain/loss** · แดงนวลทาง coral (down day ไม่เหมือน error) |
| **--game-accent** | static = primary เสมอ | honey-gold = accent หลักคงที่ · per-game = **ชั้นทินต์บางๆ ทับ** (crest/เส้น/กรอบการ์ด) ไม่กลบ honey |
| **Elevation** | เงาทั่วไป | inline card = flat+hairline · **frosted blur + เงาซ้อนสงวนไว้ที่ bottom-nav + bottom-sheet เท่านั้น** |
| **Empty/loading** | spinner | designed empty state + CTA · skeleton รูปร่างตาม content — **ศูนย์ spinner** |

### หลักการตายตัว
1. **ตัวเลขใหญ่ตัวเดียวต่อ screen state** — hero เดียว (ราคา/มูลค่า) ที่ display-size, ที่เหลือไล่ลง type ramp
2. **accent scarcity** — สีเกิน 5% ของจอ = ยังไม่ premium
3. **การ์ดคือพระเอก** — chrome จืดลงให้ foil/full-art เป็นสิ่งเดียวที่อิ่มสี
4. **atom เดียวใช้ซ้ำทุกที่** — grade pill · seller chip · status timeline · price ladder · AdSlot · archetype chip → 10 ฟีเจอร์รู้สึกเป็น "แอปเดียว" ไม่ใช่ template ปะกัน

---

## 3. Pricing Data Model — 3 แกนราคา (JP/EN · grade · source)

> รวม eBay/EN ที่เพิ่งเพิ่ม: การ์ดมีทั้ง **JP** (Yuyutei/SNKRDUNK, JPY) และ **EN** (eBay/TCGplayer, USD)

ราคา 1 ใบมี 3 แกน — ห้ามโชว์พร้อมกันหมด (= สเปรดชีต) ใช้หลัก **"re-pricing axis ไม่ใช่ stacked panel"**:

| แกน | ค่า | UI |
|-----|-----|-----|
| **Edition/ภาษา** | JP · EN | segmented control บนสุด (re-price ทั้งหน้า) |
| **Grade** | Raw A/B/C · PSA 10/9/8 · BGS | **chip rail** เลื่อนแนวนอน (re-price hero+chart+comps) แต่ละ chip โชว์ราคา preview |
| **Source** | Yuyutei · SNKRDUNK · eBay · TCGplayer | แสดงใน comps/breakdown เป็น **source badge ต่อแถว** (ไม่ใช่ตัวเลือกหลัก) |

CardPrice schema ปัจจุบัน multi-source อยู่แล้ว (`source`, `priceJpy/Usd/Thb`, `gradeCondition`, `type SELL/SOLD`) → ขยายรับ `edition` (JP/EN) + source ใหม่ (EBAY, TCGPLAYER) · data-pipeline เพิ่ม scraper EN (ดู [doc/data-pipeline.md](doc/data-pipeline.md))

---

## 4. Per-Surface Vision

### 4.1 Card Detail — 5-zone showcase (หน้าที่สำคัญสุด = trust core)
หน้าหนาแน่นสุดแต่ต้องนิ่งเหมือน Bloomberg ของการ์ด:
```
1. IDENTITY   รูปการ์ด (พระเอก) + ชื่อ + เซ็ต/เลข + game badge + edition segmented (JP|EN)
2. HERO       ราคาเดียวใหญ่ + signed delta สี (เช่น "PSA 10 · ฿12,400 ▲4.2% 30d") — ตัวเลขใหญ่ตัวเดียวบนจอ
3. GRADE RAIL chip เลื่อน [Raw A][Raw B][Raw C][PSA 10][PSA 9][PSA 8] — เลือกแล้ว re-price ทั้งหน้า, sticky
4. CHART      เส้นเดียว bound เกรดที่เลือก · 1M/3M/1Y/All · scrubber tooltip · high/low/avg ใต้กราฟ
5. TABS       Comps · Listings · Population · Meta (mount ทีละ panel, sticky segmented)
```
- **Sold comps = trust anchor**: source badge ต่อแถว (SNKRDUNK/eBay) · ราคา**ที่ซื้อขายจริง** (ไม่ใช่ราคาตั้ง) · ใหม่สุดก่อน
- 3-stat row: `Last Sale · Lowest Listing · % Change` (StockX pattern)
- **ห้าม** ad บนโซนราคา/sold-history เด็ดขาด

### 4.2 Marketplace — "live market + escrow" ไม่ใช่กระดานประกาศ
- **order book ต่อ (card, grade)**: Lowest Ask / Highest Bid / Last Sale + 1 ปุ่ม "Buy now" หลัก + 1 "Place bid" รอง (ไม่ใช่กำแพง listing)
- **escrow = custody-chain timeline ที่มองเห็น** + banner ค้าง "เงิน ฿X ถูกถือไว้ปลอดภัย" → signal trust สูงสุด
- **Buyer Protection** enumerate ใต้ปุ่ม Buy (เคสที่คุ้มครอง → refund/replace)
- seller badge **ได้จากพฤติกรรม** (response time, on-time) ไม่ใช่ดาว vanity
- atom เดียว: grade pill · seller chip · status timeline · price ladder — ใช้ซ้ำทุกหน้า commerce

### 4.3 Portfolio — Robinhood-grade (daily-open emotional moment)
```
HERO    มูลค่ารวม .text-display tabular + signed delta สี + กราฟ full-bleed
        → finger-scrub อัปเดต hero number สดๆ + date pill ลอย + haptic tick
RANGE   1D/1W/1M/3M/1Y/ALL (chromeless, tap 44px)
QUARTET Market Value · Cost Basis · All-time P/L · ROI% (flat borderless)
MOVERS  "เปลี่ยนอะไรตั้งแต่เปิดล่าสุด" band ก่อน holdings
LIST    holdings เป็น list (ไม่ใช่ table) · analytics ลึกลง 1 tap
```
- **แยก inflow vs outflow** — ซื้อการ์ดเพิ่มไม่นับเป็นกำไรปลอม (= เครื่องมือ investor จริง ไม่ใช่ของเล่น)

### 4.4 Deck / Meta / Tier — 1 feature family, 3 ระดับ (PLAY = energetic)
- **Tier list = visual จริง** (แถว S/A/B/C สี, art ของ Leader) เป็น default · toggle เป็นตารางได้ 1 tap
- meta row: 1 hero stat (meta-share%/win%) + face art + ลูกศร momentum · stat ลึกหลัง tap
- **deck editor 1 จอ**: search bottom-sheet ค้างไว้ add รัวๆ · stepper ≥44px · count/curve/cost tick ขึ้นทันที (motion polish)
- **deck cost ผูก portfolio**: "ต้นทุน ฿X · มีอยู่แล้ว ฿Y · ขาด ฿Z" → funnel เข้า marketplace
- game-parameterized: One Piece 50+Leader · Pokémon 60+headline (abstraction = "face art + card list + format rule")

### 4.5 Chat / Profile / Reputation
- thread เกาะ listing/offer/order — context card ค้างบนสุด (รูป+เกรด+cert#+ราคา+offer state)
- offer/escrow milestone = **system event card** (ไม่ใช่ bubble) + countdown หมดอายุ
- "Accept ฿X" = confirm sheet + haptic → ตกลงใน chat = commit transaction จริง
- escrow timeline (stepper) โผล่ทั้งใน order screen + mirror ใน chat + push noti
- inbox แยก `Buying / Selling / Updates` (คนคุยคน ≠ event อัตโนมัติ)
- reputation = badge เดียวมีระดับ (Trusted Seller) + stats sheet (response/on-time)

### 4.6 Monetization / Ads — โปร ไม่ทำลายของ
- `AdSlot/SponsoredCard` 1 component: height คงที่ + skeleton (zero layout shift) + inherit token (radius/spacing/hairline) → sponsored ดูเป็นส่วนหนึ่งไม่ใช่แปะ
- `AD_ZONES` allowlist (mirror `CHROMELESS_ROUTES`) — **ad-free = default**, เปิดเฉพาะ browse/discovery
- **โซนห้าม ad เด็ดขาด**: card-detail price/sold · portfolio · checkout/escrow · chat · onboarding
- marketplace: **Featured/promoted listing** (การ์ดจริง seller boost) มี relevance floor + cap สัดส่วน paid:organic
- density: ≤1 ad ต่อ fold · ~1 sponsored ต่อ 8–12 organic · ไม่อยู่อันแรก ไม่ติดกัน 2 อัน

### 4.7 Multi-Game (Pokémon ต่อไป)
- game-switcher pill มุมซ้ายบน → bottom sheet เลือกเกม · shell ทินต์ accent ตามเกม
- `/[game]/` ทุกฟีเจอร์ · สลับเกม = อยู่ฟีเจอร์เดิม (One Piece marketplace → Pokémon marketplace)
- "All games" aggregate สำหรับ portfolio รวม
- schema: `gameId` มีแล้ว (P4.2 deploy prod) → ขยาย config + scraper ต่อเกม

---

## 5. Top 5 Moves (เรียงตามผลต่อความรู้สึก / แรงน้อยสุด)

1. **ล็อก token set ใหม่ (globals.css)** — near-black+luminance · hairline-as-shadow · global tabular-nums · type weight · per-game accent · motion curve → ยกทุกหน้าออกจาก "flat look" ทันที **(แรงน้อย ผลมากสุด)**
2. **card-detail 5-zone** — edition(JP/EN) + grade rail re-price + sold comps source-badged → trust core + skeleton ใช้ได้ทุกเกมตลอดไป
3. **3-axis IA + universal search + More hub** — รับ roadmap ทั้งหมดโดย chrome ไม่โต (ทำตอน surface ยังเล็ก, retrofit ทีหลังเจ็บ)
4. **portfolio Robinhood-grade** — hero + finger-scrub + แยก inflow/outflow
5. **marketplace live-market + escrow** — order book + custody timeline + trust-atom kit

---

## 6. Roadmap (ต่อจาก P0–P2 ที่เสร็จแล้ว)

| Phase | ทำอะไร | ขึ้นกับ |
|-------|--------|---------|
| **V1 — Design foundation** | ล็อก token set ใหม่ (§2) + primitive kit (grade pill/seller chip/timeline/price ladder/StatHero) · ปรับ AdSlot/AD_ZONES | บล็อกทุก phase |
| **V2 — Card-detail + pricing model** | 5-zone + edition/grade axes + sold comps · ขยาย CardPrice (edition, eBay/TCGplayer source) | V1 |
| **V3 — IA + Home + nav** | 3-axis, bottom-nav ใหม่, More hub, universal search, game-switcher live | V1 |
| **V4 — Marketplace + escrow + chat** | order book · custody timeline · trust atoms · inbox · profile/reputation (= P3 + M3 backend) | V1–V3 |
| **V5 — Portfolio + analytics** | Robinhood-grade hero + scrub + inflow/outflow | V1 |
| **V6 — Deck / Meta / Tier (PLAY)** | feature family + visual tier + deck editor + cost→portfolio | V1, V3 |
| **V7 — EN pricing + eBay/TCGplayer** | scraper EN stack + edition axis live | V2 |
| **V8 — Pokémon** | game config + scraper + เปิด switcher | V3, schema P4.2 |

> ลำดับ spine: V1 → V2/V3 (parallel ได้) → ที่เหลือแตกแขนง · effort สูงสุด = V4 (marketplace+escrow+chat)

---

## 7. ▶ NEXT
1. **เบสรีวิว VISION นี้** — เคาะ vibe/accent/nav delta + ลำดับ phase
2. ผมเริ่ม **V1 (design foundation / token set)** — เป็น win เร็วที่ยกทุกหน้า + ปลดล็อกที่เหลือ
3. แตก V1 เป็น task ใน PLAN.md + (ถ้าอยาก) ทำ mockup หน้า card-detail/portfolio ให้เห็นจริงก่อนลงโค้ด

> หมายเหตุ: ฐาน design เดิมแข็ง (typography tokens, breakpoint discipline, `/[game]/`, table→list, gameId schema, AdSlot) — VISION นี้ไม่ได้รื้อ แต่ **เพิ่มวินัย visual + แยก 3 แกน + วาง per-surface** ให้ทุก phase reuse
