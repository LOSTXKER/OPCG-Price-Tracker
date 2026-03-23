# TCG Price Tracker - UX/UI Design Plan

> แผน UX/UI สำหรับเว็บ TCG Price Tracker (Thailand)
> แนวทาง: Dual-Mode UI (Casual default + Trader mode toggle)
> Priority: Mobile-first, Dark mode default

---

## 1. Design Principles

### 1.1 หลักการออกแบบ

1. **Card is the Hero** -- รูปการ์ดต้องเป็นจุดดึงสายตาเสมอ ไม่ว่าจะอยู่ในหน้าไหน
2. **Price at a Glance** -- ราคาต้องเห็นได้ภายใน 1 วินาที ไม่ต้องกดเข้าไปดูข้างใน
3. **Progressive Disclosure** -- เริ่มจากข้อมูลน้อย (ราคา + รูป) แล้วค่อย drill down ไปรายละเอียด
4. **Familiar Patterns** -- ใช้ UI pattern ที่คนไทยคุ้นเคย (Shopee, LINE, Bitkub)
5. **Mobile-first** -- ออกแบบจอมือถือก่อนเสมอ Traffic 70%+ จะมาจาก Mobile

### 1.2 Dual-Mode Philosophy

ทำไมต้อง 2 โหมด:

| | Casual Mode (Default) | Trader Mode (Pro/Pro+) |
|-|----------------------|----------------------|
| **กลุ่มเป้าหมาย** | Casual Collector, ผู้เล่นทั่วไป | Investor, Trader, ร้านค้า |
| **เป้าหมายของ User** | "การ์ดนี้ราคาเท่าไหร่?" | "ตอนนี้ควรซื้อหรือขาย?" |
| **ข้อมูลที่แสดง** | ราคา + รูป + กราฟเส้นง่ายๆ | กราฟละเอียด + Volume + MA + P&L |
| **ฟีล** | Shopee / Instagram | TradingView / Bitkub |
| **Layout** | Card grid, Product page | Dashboard, Multi-panel |

สลับโหมดได้ตลอดเวลาผ่าน Toggle button มุมขวาบน
Trader Mode ใช้ได้เฉพาะ Pro/Pro+ (เป็น Upsell trigger)

---

## 2. Color System & Theme

### 2.1 Dark Mode (Default)

| Element | Color | Hex | ใช้ที่ไหน |
|---------|-------|-----|----------|
| Background | Deep Navy | #0F1419 | พื้นหลังหลัก |
| Surface | Dark Slate | #1A2332 | Card, Panel, Modal |
| Surface Elevated | Slate | #243044 | Hover state, Dropdown |
| Border | Subtle Gray | #2F3B4D | Divider, Card border |
| Text Primary | White | #F5F5F5 | Heading, ราคา, ข้อมูลหลัก |
| Text Secondary | Silver | #8899AA | Label, คำอธิบาย |
| Text Muted | Dark Gray | #556677 | Placeholder, Disabled |
| Price Up | Emerald Green | #00D68F | ราคาขึ้น, Positive P&L |
| Price Down | Coral Red | #FF5C5C | ราคาลง, Negative P&L |
| Accent Primary | Electric Blue | #3B82F6 | ปุ่มหลัก, Links, Active tab |
| Accent Secondary | Purple | #8B5CF6 | Pro badge, Premium feature |
| Gold | Amber | #F59E0B | Pro+ badge, Featured items |
| Warning | Orange | #F97316 | Out of stock, Alert |

### 2.2 Light Mode (Toggle)

| Element | Color | Hex |
|---------|-------|-----|
| Background | Off-white | #F8FAFC |
| Surface | White | #FFFFFF |
| Surface Elevated | Light Gray | #F1F5F9 |
| Border | Gray | #E2E8F0 |
| Text Primary | Dark | #1E293B |
| Text Secondary | Gray | #64748B |

### 2.3 Typography

| Element | Font | Size (Mobile) | Size (Desktop) | Weight |
|---------|------|--------------|----------------|--------|
| Page Title | Inter / Noto Sans Thai | 24px | 32px | Bold (700) |
| Section Title | Inter / Noto Sans Thai | 18px | 24px | SemiBold (600) |
| Card Name | Inter | 14px | 16px | Medium (500) |
| Price (Large) | JetBrains Mono | 20px | 28px | Bold (700) |
| Price (Small) | JetBrains Mono | 14px | 16px | SemiBold (600) |
| Body Text | Inter / Noto Sans Thai | 14px | 16px | Regular (400) |
| Caption | Inter / Noto Sans Thai | 12px | 14px | Regular (400) |
| Badge | Inter | 10px | 12px | SemiBold (600) |

> ใช้ Monospace font (JetBrains Mono) สำหรับตัวเลขราคาทั้งหมด เพื่อให้ Align สวยและอ่านง่าย

---

## 3. Navigation Structure

### 3.1 Mobile Navigation (Bottom Tab Bar)

```
┌──────────────────────────────────────────┐
│                                          │
│            [เนื้อหาหน้าจอ]                │
│                                          │
├──────────────────────────────────────────┤
│  🏠 Home   🔍 Search   🏪 Market   📊 Port   👤 Me  │
└──────────────────────────────────────────┘
```

| Tab | ชื่อ | หน้าที่ |
|-----|------|--------|
| Home | หน้าแรก | Trending, Top Gainers/Losers, New releases |
| Search | ค้นหา | Search bar + Filter + Card catalog |
| Market | ตลาด | Marketplace listings (ซื้อ-ขาย) |
| Portfolio | พอร์ต | Portfolio value, Watchlist, Alerts |
| Profile | โปรไฟล์ | Settings, My listings, Account |

### 3.2 Desktop Navigation (Top Bar + Sidebar)

```
┌─────────────────────────────────────────────────────┐
│ [Logo] TCG Tracker    Search [___________]  [🔔] [👤] [Casual ⇄ Trader] │
├────────┬────────────────────────────────────────────┤
│ Home   │                                            │
│ Cards  │          [เนื้อหาหลัก]                       │
│ Market │                                            │
│ Decks  │                                            │
│ ────── │                                            │
│ Port.  │                                            │
│ Watch  │                                            │
│ Alerts │                                            │
└────────┴────────────────────────────────────────────┘
```

---

## 4. Page-by-Page Design

### 4.1 Home Page (หน้าแรก)

ความสำคัญ: สูงมาก -- หน้านี้ต้องทำให้คนรู้สึก "เว็บนี้มีค่า" ภายใน 3 วินาที

#### Casual Mode -- Mobile

```
┌──────────────────────────────┐
│  TCG Price Tracker           │
│  [___ ค้นหาการ์ด... ___] 🔍  │
├──────────────────────────────┤
│  📈 Top Gainers (24h)        │
│  ┌─────────┐ ┌─────────┐    │
│  │ [Card]  │ │ [Card]  │    │
│  │ Luffy   │ │ Zoro    │ ←→ │ (Horizontal scroll)
│  │ ¥980    │ │ ¥1200   │    │
│  │ 290 ฿   │ │ 355 ฿   │    │
│  │ ▲+12%   │ │ ▲+8%    │    │
│  │[~spark~]│ │[~spark~]│    │
│  └─────────┘ └─────────┘    │
├──────────────────────────────┤
│  📉 Top Losers (24h)         │
│  [แบบเดียวกัน แต่สีแดง]       │
├──────────────────────────────┤
│  🔥 คนดูเยอะสุด              │
│  1. [img] Luffy OP01-001  ¥980 ▲12% │
│  2. [img] Nami OP01-016   ¥450 ▲5%  │
│  3. [img] Ace OP02-013    ¥3800 ▲3% │
│  [ดูทั้งหมด →]               │
├──────────────────────────────┤
│  🆕 ชุดล่าสุด: OP09          │
│  [Card grid 2x2]             │
│  [ดูทั้งชุด →]                │
├──────────────────────────────┤
│  🏪 ขายล่าสุดใน Marketplace  │
│  [img] Luffy OP01 | NM | ¥950 │
│  by @seller1 | 5 นาทีที่แล้ว    │
│  [img] Zoro OP03 | LP | ¥1100 │
│  by @shop_abc | 12 นาทีที่แล้ว  │
│  [ดูตลาดทั้งหมด →]            │
├──────────────────────────────┤
│ 🏠Home 🔍Search 🏪Market 📊Port 👤Me │
└──────────────────────────────┘
```

#### Casual Mode -- Desktop

Desktop ใช้พื้นที่จอกว้างจัดเป็น 2-column layout แสดงข้อมูลได้มากกว่า Mobile

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo] TCG Price Tracker   [🔍 ค้นหาการ์ด...              ]    [🔔] [Login] │
├──────────────────────────────────────────────────────────────────────────────┤
│ [Home]  [Cards]  [Marketplace]  [Decks]            อัปเดตล่าสุด: วันนี้ 03:00│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  OPCG Market Overview              อัตราแลกเปลี่ยน: ¥1 = 0.296 ฿            │
│  ┌───────────────────┬──────────────────┬────────────────────┐               │
│  │ Total: 2,847 cards │ Avg Price: ¥485  │ Updated: 1,203 ▲▼ │               │
│  └───────────────────┴──────────────────┴────────────────────┘               │
│                                                                              │
│  📈 ราคาขึ้นมากสุดวันนี้                 📉 ราคาลงมากสุดวันนี้                │
│  ┌────────────────────────────┐        ┌────────────────────────────┐       │
│  │ [img] Luffy OP01-001   SR │        │ [img] Kid OP05-043     SR │       │
│  │       ¥980 (290฿) ▲+12.3% │        │       ¥580 (172฿) ▼-15.2% │       │
│  │       [~~~~~sparkline~~]  │        │       [~~sparkline~~~~~]  │       │
│  ├────────────────────────────┤        ├────────────────────────────┤       │
│  │ [img] Zoro OP03-122    SR │        │ [img] Law OP04-019    SEC │       │
│  │       ¥1200 (355฿) ▲+8.1% │        │       ¥2400 (710฿) ▼-9.4% │       │
│  ├────────────────────────────┤        ├────────────────────────────┤       │
│  │ [img] Nami OP01-016    SR │        │ [img] Kaido OP04-031   SR │       │
│  │       ¥450 (133฿)  ▲+5.0% │        │       ¥890 (263฿)  ▼-6.8% │       │
│  ├────────────────────────────┤        ├────────────────────────────┤       │
│  │ [img] Shanks OP01-003   L │        │ [img] Doffy OP06-058   SR │       │
│  │       ¥1800 (533฿) ▲+4.5% │        │       ¥340 (101฿)  ▼-5.1% │       │
│  ├────────────────────────────┤        ├────────────────────────────┤       │
│  │ [img] Yamato OP02-005  SR │        │ [img] Big Mom OP03-001  L │       │
│  │       ¥680 (201฿)  ▲+3.8% │        │       ¥520 (154฿)  ▼-4.3% │       │
│  └────────────────────────────┘        └────────────────────────────┘       │
│                                                                              │
│  🔥 คนดูเยอะสุด                         🆕 ชุดล่าสุด: OP09 - Rulers        │
│  ┌─────────────────────────────┐       ┌──────┐┌──────┐┌──────┐┌──────┐    │
│  │ #  │ Card          │ Price  │       │[Card]││[Card]││[Card]││[Card]│    │
│  │────┼───────────────┼────────│       │ OP09 ││ OP09 ││ OP09 ││ OP09 │    │
│  │ 1  │ Luffy OP01    │¥980 ▲12│       │ ¥--- ││ ¥--- ││ ¥--- ││ ¥--- │    │
│  │ 2  │ Ace OP02      │¥3800 ▲3│       └──────┘└──────┘└──────┘└──────┘    │
│  │ 3  │ Nami OP01     │¥450  ▲5│       ┌──────┐┌──────┐┌──────┐┌──────┐    │
│  │ 4  │ Shanks OP01   │¥1800 ▲4│       │[Card]││[Card]││[Card]││[Card]│    │
│  │ 5  │ Yamato OP02   │¥680  ▲3│       │ OP09 ││ OP09 ││ OP09 ││ OP09 │    │
│  │ 6  │ Zoro OP03     │¥1200 ▲8│       │ ¥--- ││ ¥--- ││ ¥--- ││ ¥--- │    │
│  │ 7  │ Uta OP02      │¥2200 ▲2│       └──────┘└──────┘└──────┘└──────┘    │
│  │ 8  │ Sabo OP04     │¥950  ▲2│       [ดูทั้งชุด →]                        │
│  │ 9  │ Robin OP01    │¥380  ▲1│                                           │
│  │10  │ Croc OP04     │¥710  ▲1│                                           │
│  └─────────────────────────────┘                                            │
│                                                                              │
│  🏪 Marketplace - ลงขายล่าสุด                                               │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐              │
│  │ [img] Luffy  │ [img] Zoro   │ [img] Ace    │ [img] Uta    │              │
│  │ OP01-001 SR  │ OP03-122 SR  │ OP02-013 SEC │ OP02-120 SEC │              │
│  │ NM | ¥950    │ LP | ¥1,100  │ NM | ¥3,600  │ NM | ¥2,100  │              │
│  │ vs ¥980 🏷-3%│ vs ¥1200 🏷-8%│ vs ¥3800 🏷-5%│ vs ¥2200 🏷-4%│             │
│  │ @seller1 ⭐4.8│ @shop_abc⭐4.9│ @pro_tcg ⭐5.0│ @user22 ⭐4.6 │              │
│  └──────────────┴──────────────┴──────────────┴──────────────┘              │
│  [ดูตลาดทั้งหมด →]                                                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ About │ Contact │ ข้อมูลราคาอ้างอิงจาก Yuyu-tei │ Privacy │ Disclaimer      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Desktop vs Mobile ต่างกันอย่างไร:**

| จุด | Mobile | Desktop |
|-----|--------|---------|
| Top Gainers/Losers | แยก Section เลื่อนลง | อยู่ข้างๆ กัน 2 คอลัมน์ |
| จำนวนการ์ดที่เห็น | 2 ใบ/แถว (scroll ขวา) | 5 ใบ/Section ไม่ต้อง scroll |
| Most Viewed + New Set | แยกคนละ Section | อยู่คู่กัน ซ้าย-ขวา |
| Marketplace | List 1 คอลัมน์ | Grid 4 คอลัมน์ |
| Market Overview bar | ไม่มี (เปลืองที่) | มี -- Total cards, Avg price, Exchange rate |
| Navigation | Bottom tab bar | Top nav bar |

#### Trader Mode (Home = Dashboard)

```
┌────────────┬──────────────────────────────┐
│ WATCHLIST   │  MARKET OVERVIEW              │
│ ─────────  │  OPCG Index: ¥12,450 ▲2.3%   │
│ Luffy ¥980 │  ┌────────────────────────┐   │
│   ▲+12% ⭐ │  │   [Index Chart 30d]    │   │
│ Zoro ¥1200 │  │   ~~~~~~~~~~~~/~~~     │   │
│   ▲+8%  ⭐ │  └────────────────────────┘   │
│ Nami ¥450  │                               │
│   ▲+5%  ⭐ │  TOP MOVERS                   │
│ ...        │  ┌──────┬──────┬──────┐       │
│            │  │Luffy │Zoro  │Nami  │       │
│ ─────────  │  │▲+12% │▲+8%  │▲+5%  │       │
│ PORTFOLIO  │  └──────┴──────┴──────┘       │
│ Value:     │                               │
│ ¥45,200    │  RECENT TRADES (Marketplace)  │
│ ▲+5.2%     │  Luffy OP01 sold ¥950  2m ago │
│ P&L:+2,200 │  Zoro OP03 sold ¥1180  5m ago │
└────────────┴──────────────────────────────┘
```

---

### 4.2 Card Detail Page

ความสำคัญ: สูงมาก -- หน้าที่ User ใช้เวลามากสุด และเป็นหน้า SEO หลัก

#### Casual Mode -- Mobile

```
┌──────────────────────────────┐
│  ← Back          ⭐ 📤 Share │
├──────────────────────────────┤
│        ┌──────────────┐      │
│        │              │      │
│        │  [Card Image] │      │
│        │   (Zoomable)  │      │
│        │              │      │
│        └──────────────┘      │
│                              │
│  Monkey D. Luffy             │
│  OP01-001 | SR | Leader      │
│  Power: 5000 | Color: Red    │
├──────────────────────────────┤
│  ┌──────────────────────┐    │
│  │  ¥980  (~290 บาท)    │    │
│  │  ▲ +12% (7d)         │    │
│  │  [~~~ sparkline ~~~] │    │
│  └──────────────────────┘    │
│                              │
│  Yuyu-tei: ¥980              │
│  Community: 310 บาท (12 reports) │
├──────────────────────────────┤
│  Price History               │
│  [7d] [30d] [90d🔒] [1y🔒]  │
│  ┌──────────────────────┐    │
│  │  [Line Chart]        │    │
│  │  ~~~~~/~~\~~~~/~~~   │    │
│  └──────────────────────┘    │
│  High: ¥1,200 | Low: ¥780   │
├──────────────────────────────┤
│  [➕ เพิ่มเข้า Portfolio]      │
│  [🛒 ซื้อการ์ดนี้ (5 listings)] │
├──────────────────────────────┤
│  📦 Marketplace Listings     │
│  ┌──────────────────────┐    │
│  │ @seller1 | NM | ¥950 │    │
│  │ ⭐4.8 (23) | [Chat]   │    │
│  ├──────────────────────┤    │
│  │ @seller2 | LP | ¥880 │    │
│  │ ⭐4.5 (8)  | [Chat]   │    │
│  └──────────────────────┘    │
├──────────────────────────────┤
│  📋 Card Details             │
│  Effect: [ข้อความเอฟเฟกต์]   │
│  Set: OP01 Romance Dawn      │
│  Released: 2022-07-22        │
├──────────────────────────────┤
│  💬 Community Price           │
│  [รายงานราคาไทย: _____ บาท]  │
│  [Report]                    │
└──────────────────────────────┘
```

#### Casual Mode -- Desktop (Card Detail)

Desktop จัดเป็น 2-panel: รูปการ์ด+ข้อมูลทางซ้าย, กราฟ+Marketplace ทางขวา

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo] TCG Price Tracker   [🔍 ค้นหาการ์ด...              ]    [🔔] [Login] │
├──────────────────────────────────────────────────────────────────────────────┤
│ Home > Cards > OP01 Romance Dawn > OP01-001                    [⭐] [📤 Share]│
├────────────────────────────┬─────────────────────────────────────────────────┤
│                            │                                                 │
│   ┌──────────────────┐     │  ¥980  (~290 บาท)                              │
│   │                  │     │  ▲ +12.3% (7d)  |  ▲ +18.5% (30d)             │
│   │                  │     │                                                 │
│   │   [Card Image]   │     │  Yuyu-tei: ¥980  |  Community: 310 บาท (12)    │
│   │    (Click zoom)  │     │                                                 │
│   │                  │     │  Price History                                  │
│   │                  │     │  [7d] [30d] [90d🔒] [1y🔒] [All🔒]             │
│   └──────────────────┘     │  ┌─────────────────────────────────────────┐   │
│                            │  │                                         │   │
│  Monkey D. Luffy           │  │          [Line Chart - Large]           │   │
│  OP01-001 | SR | Leader    │  │          ~~~~~~~/~~\~~~~~/~~~~          │   │
│                            │  │                                         │   │
│  ┌──────────────────────┐  │  └─────────────────────────────────────────┘   │
│  │ Color: Red            │  │  High: ¥1,200 (30d) | Low: ¥780 (30d)        │
│  │ Power: 5000           │  │                                                │
│  │ Counter: 1000         │  │  [➕ เพิ่มเข้า Portfolio]  [🛒 ซื้อการ์ดนี้ (5)] │
│  │ Type: Leader          │  ├─────────────────────────────────────────────────┤
│  │ Set: OP01             │  │                                                │
│  │ Released: 2022-07-22  │  │  📦 Marketplace Listings                       │
│  └──────────────────────┘  │  ┌────────────┬────────────┬────────────┐      │
│                            │  │ @seller1   │ @seller2   │ @shop_abc  │      │
│  📋 Effect                 │  │ NM | ¥950  │ LP | ¥880  │ NM | ¥1,000│      │
│  ┌──────────────────────┐  │  │ ⭐4.8 (23)  │ ⭐4.5 (8)  │ ⭐4.9 (45) │      │
│  │ [DON!! x1] [Your     │  │  │ BKK | EMS │ BKK | รับ  │ CM | Kerry │      │
│  │  Turn] This Leader   │  │  │ [Chat]     │ [Chat]     │ [Chat]     │      │
│  │  gives +1000 Power   │  │  └────────────┴────────────┴────────────┘      │
│  │  to all Characters.  │  │  [ดู Listings ทั้งหมด →]                        │
│  └──────────────────────┘  │  │                                              │
│                            │  │  💬 Community Price                          │
│  💬 รายงานราคาไทย          │  │  ราคาล่าสุดที่รายงาน: 310 บาท (12 reports)   │
│  [_____ บาท] [Report]      │  │  ช่วงราคา: 280-350 บาท                      │
│                            │  │  [ดูประวัติราคา Community →]                  │
├────────────────────────────┴─────────────────────────────────────────────────┤
│ About │ Contact │ ข้อมูลราคาอ้างอิงจาก Yuyu-tei │ Disclaimer                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Desktop Card Detail vs Mobile ต่างกันอย่างไร:**

| จุด | Mobile | Desktop |
|-----|--------|---------|
| Layout | 1 คอลัมน์ เลื่อนลง | 2 คอลัมน์ ซ้าย-ขวา |
| รูปการ์ด | อยู่บนสุด ตรงกลาง | อยู่ซ้ายบน ติดถาวร |
| กราฟ | อยู่กลางหน้า เลื่อนลงไป | อยู่ขวาบน เห็นทันที |
| Marketplace | List เลื่อนลงอีก | Grid 3 คอลัมน์ เห็นคู่กับกราฟ |
| Breadcrumb | ไม่มี (ใช้ ← Back) | มี (Home > Cards > OP01 > ...) สำหรับ SEO |
| Action buttons | เต็มจอ | อยู่ข้างกราฟ |

#### Trader Mode (Card Detail)

```
┌────────────┬──────────────────────────────┐
│ [Card Img] │  Monkey D. Luffy OP01-001    │
│            │  ¥980 (~290 THB)  ▲+12%      │
│            │  Vol: 23/week | Spread: ±3%  │
│ ─────────  ├──────────────────────────────┤
│ Quick Info │  [1d] [7d] [30d] [90d] [1y] [All] │
│ Rarity: SR │  ┌────────────────────────┐  │
│ Color: Red │  │                        │  │
│ Power:5000 │  │   [Full Chart]         │  │
│            │  │   Candlestick/Line     │  │
│ ─────────  │  │   + Volume bars        │  │
│ Key Stats  │  │   + MA(7) MA(30)       │  │
│ Avg(7d):   │  │                        │  │
│   ¥965     │  └────────────────────────┘  │
│ Avg(30d):  │  MA(7): ¥960 ▲ | MA(30): ¥920 ▲ │
│   ¥920     │  Std Dev: ±¥85 | Range: ¥780-¥1200 │
│ ATH: ¥1500 ├──────────────────────────────┤
│ ATL: ¥500  │  ORDER BOOK / LISTINGS       │
│            │  Sell: ¥950 (NM) @user1      │
│ ─────────  │  Sell: ¥880 (LP) @user2      │
│ [Set Alert]│  Sell: ¥1050 (NM) @shop1     │
│ [Add Port] │  ──────────────────────────  │
│ [Sell]     │  Community Price: 310 THB    │
└────────────┴──────────────────────────────┘
```

---

### 4.3 Search & Browse Page

#### Search -- Mobile

```
┌──────────────────────────────┐
│ [___ ค้นหาชื่อ/รหัส... ___]  │
├──────────────────────────────┤
│ Filter: [ชุด▼] [หายาก▼] [สี▼] [ราคา▼] [ประเภท▼] │
│ Sort: [ราคาขึ้น/ลง ▼]       │
├──────────────────────────────┤
│ พบ 1,234 การ์ด              │
│ ┌──────────┐ ┌──────────┐   │
│ │ [Card]   │ │ [Card]   │   │
│ │ Luffy    │ │ Zoro     │   │
│ │ OP01-001 │ │ OP01-025 │   │
│ │ ¥980 ▲12%│ │ ¥1200 ▲8%│   │
│ ├──────────┤ ├──────────┤   │
│ │ [Card]   │ │ [Card]   │   │
│ │ Nami     │ │ Sanji    │   │
│ │ OP01-016 │ │ OP01-013 │   │
│ │ ¥450 ▲5% │ │ ¥380 ▼2% │   │
│ └──────────┘ └──────────┘   │
│         [Load more...]       │
└──────────────────────────────┘
```

#### Search -- Desktop

Desktop มี Filter sidebar ทางซ้าย ผลลัพธ์ grid 4 คอลัมน์ทางขวา

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo] TCG Price Tracker   [🔍 ค้นหาการ์ด...              ]    [🔔] [Login] │
├──────────────────────────────────────────────────────────────────────────────┤
│ Home > Cards > ค้นหา: "Luffy"                                               │
├─────────────────┬────────────────────────────────────────────────────────────┤
│ FILTER          │  พบ 1,234 การ์ด          Sort: [ราคาเปลี่ยนมากสุด ▼] [Grid│List] │
│                 │                                                            │
│ ชุด (Set)       │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ [✓] OP01        │  │ [Card]   │ │ [Card]   │ │ [Card]   │ │ [Card]   │     │
│ [✓] OP02        │  │ Luffy    │ │ Zoro     │ │ Nami     │ │ Sanji    │     │
│ [ ] OP03        │  │ OP01-001 │ │ OP01-025 │ │ OP01-016 │ │ OP01-013 │     │
│ [ ] OP04        │  │ SR       │ │ SR       │ │ SR       │ │ R        │     │
│ ...             │  │ ¥980     │ │ ¥1,200   │ │ ¥450     │ │ ¥380     │     │
│                 │  │ 290 ฿    │ │ 355 ฿    │ │ 133 ฿    │ │ 112 ฿    │     │
│ ความหายาก       │  │ ▲+12%    │ │ ▲+8%     │ │ ▲+5%     │ │ ▼-2%     │     │
│ [✓] SR          │  │ [~spark~]│ │ [~spark~]│ │ [~spark~]│ │ [~spark~]│     │
│ [✓] SEC         │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│ [ ] R           │                                                            │
│ [ ] UC          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ [ ] C           │  │ [Card]   │ │ [Card]   │ │ [Card]   │ │ [Card]   │     │
│                 │  │ Shanks   │ │ Yamato   │ │ Robin    │ │ Uta      │     │
│ สี (Color)      │  │ OP01-003 │ │ OP02-005 │ │ OP01-017 │ │ OP02-120 │     │
│ [✓] Red         │  │ ¥1,800   │ │ ¥680     │ │ ¥380     │ │ ¥2,200   │     │
│ [ ] Blue        │  │ ▲+4%     │ │ ▲+3%     │ │ ▲+1%     │ │ ▲+2%     │     │
│ [ ] Green       │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│ [ ] Purple      │                                                            │
│                 │  [1] [2] [3] ... [52]  (Pagination)                       │
│ ช่วงราคา        │                                                            │
│ ¥[0] - ¥[9999]  │                                                            │
│                 │                                                            │
│ [เคลียร์ Filter]│                                                            │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

**Search UX Details:**
- Autocomplete ขณะพิมพ์ (แสดงรูปการ์ดเล็กๆ ใน suggestion)
- Recent searches จำไว้
- Popular searches แนะนำ
- Filter สามารถรวมหลายตัว (Multi-select)
- URL เปลี่ยนตาม Filter เพื่อ SEO + Shareable
- Desktop: Toggle ระหว่าง Grid view / List view (List view แสดงข้อมูลเยอะกว่า)
- Mobile: Filter เปิดเป็น Bottom sheet, Desktop: Filter เป็น Sidebar ถาวร

---

### 4.4 Marketplace Page

#### Marketplace -- Mobile

```
┌──────────────────────────────┐
│ 🏪 Marketplace               │
│ [___ ค้นหาการ์ดขาย... ___]   │
├──────────────────────────────┤
│ [ขายล่าสุด] [ราคาดี] [ใกล้ฉัน] │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ [img] Luffy OP01-001  SR │ │
│ │       NM (Near Mint)     │ │
│ │       ¥950 (280 บาท)     │ │
│ │       vs ราคากลาง ¥980   │ │
│ │       🏷️ BEST DEAL -3%   │ │
│ │       @seller1 ⭐4.8 (23) │ │
│ │       [Chat] [ดูร้าน]    │ │
│ ├──────────────────────────┤ │
│ │ [img] Zoro OP03-122   SR │ │
│ │       LP (Light Play)    │ │
│ │       ¥1,100 (325 บาท)   │ │
│ │       vs ราคากลาง ¥1,200  │ │
│ │       🏷️ BEST DEAL -8%   │ │
│ │       @shop_abc ⭐4.9 (45)│ │
│ │       [Chat] [ดูร้าน]    │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ [➕ ลงขายการ์ด]               │
└──────────────────────────────┘
```

#### Marketplace -- Desktop

Desktop แสดง Listing เป็น Grid 3 คอลัมน์ พร้อม Filter sidebar

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo] TCG Price Tracker   [🔍 ค้นหาการ์ด...              ]    [🔔] [Login] │
├──────────────────────────────────────────────────────────────────────────────┤
│ Home > Marketplace                                          [➕ ลงขายการ์ด] │
├─────────────────┬────────────────────────────────────────────────────────────┤
│ FILTER          │ [ขายล่าสุด] [ราคาดีสุด] [ใกล้ฉัน]    พบ 892 listings     │
│                 │                                                            │
│ การ์ด           │ ┌─────────────────┐┌─────────────────┐┌─────────────────┐ │
│ [___ค้นหา___]   │ │ [img]           ││ [img]           ││ [img]           │ │
│                 │ │ Luffy OP01-001  ││ Zoro OP03-122   ││ Ace OP02-013    │ │
│ สภาพ            │ │ SR | NM         ││ SR | LP         ││ SEC | NM        │ │
│ [✓] NM          │ │                 ││                 ││                 │ │
│ [✓] LP          │ │ ¥950 (280฿)     ││ ¥1,100 (325฿)   ││ ¥3,600 (1,065฿) │ │
│ [ ] MP          │ │ vs ¥980 🏷️-3%   ││ vs ¥1200 🏷️-8%  ││ vs ¥3800 🏷️-5%  │ │
│ [ ] HP          │ │                 ││                 ││                 │ │
│                 │ │ @seller1 ⭐4.8   ││ @shop_abc ⭐4.9  ││ @pro_tcg ⭐5.0   │ │
│ ช่วงราคา        │ │ BKK | EMS       ││ BKK | นัดรับ     ││ CM | Kerry      │ │
│ ¥[0] - ¥[9999]  │ │ [Chat] [ดูร้าน] ││ [Chat] [ดูร้าน] ││ [Chat] [ดูร้าน] │ │
│                 │ └─────────────────┘└─────────────────┘└─────────────────┘ │
│ ชุด (Set)       │                                                            │
│ [▼ เลือกชุด]    │ ┌─────────────────┐┌─────────────────┐┌─────────────────┐ │
│                 │ │ [img]           ││ [img]           ││ [img]           │ │
│ ผู้ขาย          │ │ Uta OP02-120    ││ Nami OP01-016   ││ Sabo OP04-083   │ │
│ [✓] ร้านค้า     │ │ SEC | NM        ││ SR | NM         ││ SR | LP         │ │
│ [✓] บุคคลทั่วไป │ │ ¥2,100 (621฿)   ││ ¥420 (124฿)     ││ ¥880 (260฿)     │ │
│                 │ │ vs ¥2200 🏷️-4%  ││ vs ¥450 🏷️-6%   ││ vs ¥950 🏷️-7%   │ │
│ การจัดส่ง       │ │ @user22 ⭐4.6    ││ @card_th ⭐4.7   ││ @seller5 ⭐4.3   │ │
│ [✓] EMS/Kerry   │ │ [Chat] [ดูร้าน] ││ [Chat] [ดูร้าน] ││ [Chat] [ดูร้าน] │ │
│ [✓] นัดรับ       │ └─────────────────┘└─────────────────┘└─────────────────┘ │
│ [ ] Registered  │                                                            │
│                 │ [1] [2] [3] ... [30]  (Pagination)                        │
│ [เคลียร์ Filter]│                                                            │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

**Marketplace UX Details:**
- **"Best Deal" badge** เมื่อราคาต่ำกว่าราคากลาง 5%+ ดึงสายตาให้กดซื้อ
- **ราคากลาง reference** แสดงข้างราคาขายเสมอ ให้ผู้ซื้อตัดสินใจง่าย
- **Seller rating** แสดงชัดเจน สร้าง Trust
- **Quick Chat** ไม่ต้องออกจากหน้า (Bottom sheet บน Mobile / Side panel บน Desktop)
- **Listing Card** ขายผ่าน Card Detail page ได้เลย (ไม่ต้องเข้า Marketplace แยก)
- **Desktop Filter sidebar** แสดงถาวร ไม่ต้องกดเปิด ต่างจาก Mobile ที่เป็น Bottom sheet
- **Desktop Grid 3 คอลัมน์** เห็น listing ได้มากกว่า Mobile

---

### 4.5 Portfolio Page

#### Casual Mode

```
┌──────────────────────────────┐
│ 📊 My Portfolio               │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ Total Value             │  │
│  │ ¥45,200 (13,380 บาท)   │  │
│  │ ▲ +¥2,200 (+5.2%)      │  │
│  │ [~~~ area chart ~~~]   │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│ Collection: [ทั้งหมด ▼]      │
│ Sort: [มูลค่าสูงสุด ▼]       │
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ [img] Luffy OP01-001     │ │
│ │ x2 | ซื้อ ¥800 | ตอนนี้ ¥980│ │
│ │ P&L: +¥360 (+22.5%) 🟢  │ │
│ ├──────────────────────────┤ │
│ │ [img] Zoro OP03-122      │ │
│ │ x1 | ซื้อ ¥1,300 | ตอนนี้ ¥1,200│ │
│ │ P&L: -¥100 (-7.7%) 🔴   │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ [➕ เพิ่มการ์ด]               │
└──────────────────────────────┘
```

#### Trader Mode (Portfolio = Full Dashboard)

```
┌──────────────────────────────────────────────────┐
│ PORTFOLIO DASHBOARD                    [Export CSV]│
├────────────┬────────────┬────────────┬───────────┤
│ Total Value │ Unrealized │ Best Perf. │ Worst     │
│ ¥45,200    │ +¥2,200    │ Luffy+22%  │ Zoro-7.7% │
│ 13,380 THB │ (+5.2%)    │            │           │
├────────────┴────────────┴────────────┴───────────┤
│ ┌──────────────────────────────────────────────┐ │
│ │ Portfolio Value Over Time                     │ │
│ │ [Area chart with P&L breakdown]              │ │
│ │ ~~~~~~~~/~~~~~/~~~~~~~\~~~~~/~~~~~           │ │
│ │ [7d] [30d] [90d] [1y] [All]                  │ │
│ └──────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────┤
│ Allocation Breakdown                             │
│ ┌─────────────┐  Leaders: 35%                    │
│ │ [Pie Chart] │  Characters: 45%                 │
│ │             │  Events: 10%                     │
│ └─────────────┘  Stages: 10%                     │
├──────────────────────────────────────────────────┤
│ HOLDINGS                    Sort: [P&L% ▼]      │
│ Card         │ Qty │ Cost  │ Current │ P&L      │
│ Luffy OP01   │ 2   │ ¥1600 │ ¥1960   │ +¥360 🟢│
│ Zoro OP03    │ 1   │ ¥1300 │ ¥1200   │ -¥100 🔴│
│ Nami OP01    │ 3   │ ¥1200 │ ¥1350   │ +¥150 🟢│
└──────────────────────────────────────────────────┘
```

---

### 4.6 Listing Create Page (ลงขายการ์ด)

```
┌──────────────────────────────┐
│ 📦 ลงขายการ์ด                 │
├──────────────────────────────┤
│ การ์ด: [___ ค้นหา/สแกน ___]  │
│                              │
│ ┌──────────────────────────┐ │
│ │ Luffy OP01-001 SR        │ │
│ │ ราคากลาง: ¥980 (290 บาท) │ │
│ └──────────────────────────┘ │
│                              │
│ สภาพ: (●) NM ( ) LP ( ) MP  │
│ ราคาขาย: [¥___] หรือ [___บาท]│
│   💡 แนะนำ: ¥950-¥1,000     │
│ จำนวน: [1▼]                  │
│                              │
│ รูปถ่ายจริง:                  │
│ [📷 +] [📷 +] [📷 +]         │
│                              │
│ หมายเหตุ: [________________] │
│                              │
│ การจัดส่ง:                    │
│ [✓] ส่ง EMS/Kerry            │
│ [✓] นัดรับ (กรุงเทพฯ)        │
│ [ ] Registered mail          │
│                              │
│ [ลงขาย]                      │
└──────────────────────────────┘
```

**Listing UX Details:**
- **Price Suggestion**: แสดงช่วงราคาแนะนำจากราคากลาง (เช่น ¥950-¥1,000 สำหรับ NM)
- **Quick List**: ถ้าเข้ามาจากหน้า Card Detail จะกรอกข้อมูลการ์ดให้อัตโนมัติ
- **Photo upload**: สนับสนุนถ่ายรูปจากกล้องมือถือโดยตรง
- **Draft**: บันทึก Draft ได้ถ้ายังลงขายไม่เสร็จ

---

## 5. Component Library

### 5.1 Card Components

#### Price Card (ใช้ในหน้า Home, Search)

```
┌──────────────┐
│ ┌──────────┐ │
│ │          │ │  Card image (aspect ratio 63:88)
│ │ [Image]  │ │  Lazy load + Blur placeholder
│ │          │ │
│ └──────────┘ │
│ Luffy        │  Card name (1 line, truncate)
│ OP01-001 SR  │  Card ID + Rarity badge
│ ¥980         │  Price (monospace, large)
│ ~290 บาท     │  THB conversion (smaller, secondary)
│ ▲ +12%       │  7d change (green/red)
│ [~~spark~~]  │  7-day sparkline (tiny chart)
└──────────────┘
```

Width: 50% screen (mobile 2-col), 25% (desktop 4-col)

#### Listing Card (ใช้ในหน้า Marketplace)

```
┌──────────────────────────────┐
│ [img] │ Luffy OP01-001 SR    │
│       │ NM (Near Mint)       │
│       │ ¥950 (~280 บาท)      │
│       │ vs ¥980 (🏷️ -3%)     │
│       │ @seller ⭐4.8 | [Chat]│
└──────────────────────────────┘
```

#### Portfolio Card (ใช้ในหน้า Portfolio)

```
┌──────────────────────────────┐
│ [img] │ Luffy OP01-001       │
│       │ x2 NM                │
│       │ Cost: ¥1,600         │
│       │ Now:  ¥1,960         │
│       │ P&L: +¥360 (+22%) 🟢 │
└──────────────────────────────┘
```

### 5.2 Chart Components

| Chart Type | ใช้ที่ไหน | Library แนะนำ |
|-----------|----------|--------------|
| Sparkline (mini) | Price Card, Home | Lightweight Charts (TradingView) |
| Line Chart | Card Detail (Casual) | Recharts หรือ Chart.js |
| Candlestick | Card Detail (Trader) | Lightweight Charts (TradingView) |
| Area Chart | Portfolio value | Recharts |
| Pie/Donut | Portfolio allocation | Recharts |
| Bar Chart | Volume, Top movers | Recharts |

> แนะนำ **Lightweight Charts by TradingView** สำหรับกราฟราคา -- เบา, Interactive ดี, รองรับ Candlestick, Free
> ใช้ **Recharts** สำหรับกราฟอื่นๆ -- integrate กับ React ง่าย

### 5.3 UI Components (Shared)

| Component | ใช้ที่ไหน | Behavior |
|-----------|----------|----------|
| **Search Bar** | Header, Home | Autocomplete, Recent/Popular suggestions |
| **Filter Chips** | Search, Marketplace | Multi-select, Horizontal scroll, Active state |
| **Badge** | Rarity, Condition, Pro | Color-coded pill (C=gray, R=blue, SR=purple, SEC=gold) |
| **Price Display** | ทุกที่ | Monospace, Green/Red arrow, THB toggle |
| **Mode Toggle** | Header | Switch Casual/Trader, ล็อคถ้าไม่ใช่ Pro |
| **Theme Toggle** | Settings | Dark/Light, System default option |
| **Bottom Sheet** | Mobile modals | Filter panel, Quick actions, Chat |
| **Toast/Snackbar** | Feedback | "เพิ่มเข้า Portfolio แล้ว", "Alert ถูกสร้าง" |
| **Empty State** | Portfolio, Watchlist | Illustration + CTA "เพิ่มการ์ดใบแรก" |
| **Skeleton Loader** | ทุกที่ | ขณะโหลดข้อมูล แสดง shimmer effect |

---

## 6. Key User Flows

### 6.1 First Visit -> Registration

```
Facebook post (Link)
    │
    ▼
Landing on Card Detail (SEO/Social)
    │ เห็นราคา + กราฟ ฟรี
    │
    ▼
Browse more cards (Search)
    │ เห็น Value ของเว็บ
    │
    ▼
Click "เพิ่มเข้า Portfolio"
    │
    ▼
Registration Modal (Google / Facebook / Email)
    │ ง่าย 1 คลิก
    │
    ▼
Onboarding: "เพิ่มการ์ดใบแรกเข้า Portfolio"
    │
    ▼
Show Portfolio value
    │ "ดู! ของที่คุณมีมูลค่ารวม ¥XX,XXX"
    │
    ▼
Hooked 🎯
```

### 6.2 Free -> Pro Upgrade Triggers

User จะเจอ Upgrade prompt ตามธรรมชาติเมื่อ:

| Trigger | ข้อความ | ตำแหน่ง |
|---------|--------|---------|
| Portfolio ครบ 20 ใบ | "อัปเกรด Pro เพื่อเพิ่มการ์ดไม่จำกัด" | Portfolio page |
| กดดูกราฟ 90 วัน | "ปลดล็อคกราฟ 90d/1y/All-time ด้วย Pro" | Chart section (blur overlay) |
| Watchlist ครบ 10 ใบ | "Pro ดูได้ไม่จำกัด + LINE Alert" | Watchlist page |
| กด Export | "Export CSV/Excel เฉพาะ Pro" | Portfolio page |
| เห็น Ads | "ไม่อยากเห็นโฆษณา? อัปเกรด Pro" | Ad banner |
| Marketplace ขาย | "Pro ลดค่าธรรมเนียมเหลือ 4%" | Listing create |
| กดเปิด Trader Mode | "Trader Mode เฉพาะ Pro/Pro+" | Mode toggle |

ทุก Prompt ใช้ **Soft approach**: แสดง overlay/blur + ปุ่ม Upgrade ไม่บล็อคการใช้งานอื่น

### 6.3 Marketplace Buy Flow

```
เห็น Listing (จาก Card Detail หรือ Marketplace page)
    │
    ▼
กด "Chat กับผู้ขาย"
    │
    ▼
Chat (In-app): คุยตกลงราคา/สภาพ/การจัดส่ง
    │
    ▼
ผู้ขาย กด "ยืนยันขาย" (ระบุวิธีส่ง + ราคาสุดท้าย)
    │
    ▼
ผู้ซื้อ กด "ยืนยันซื้อ"
    │ (เลือก: โอนตรง หรือ Escrow)
    │
    ▼
[โอนตรง] ผู้ซื้อโอนเงิน -> แจ้งโอน -> ผู้ขายยืนยัน -> ส่งของ
[Escrow] ผู้ซื้อจ่ายผ่านระบบ -> ผู้ขายส่งของ -> ผู้ซื้อรับ -> ปล่อยเงิน
    │
    ▼
ทั้งสองฝ่าย Rate & Review กัน
    │
    ▼
Transaction complete
(ค่าธรรมเนียม 5% หักจากผู้ขาย)
```

---

## 7. Responsive Breakpoints

| Breakpoint | ขนาดจอ | Layout |
|-----------|--------|--------|
| Mobile (Default) | < 640px | 1-2 columns, Bottom tab, Full-width cards |
| Tablet | 640-1024px | 2-3 columns, Side drawer navigation |
| Desktop | 1024-1440px | 3-4 columns, Sidebar + Main content |
| Wide Desktop | > 1440px | 4-5 columns, Trader mode multi-panel |

### Mobile-Specific UX Rules

1. **Bottom Tab Bar** ยึดอยู่ข้างล่างเสมอ (Fixed)
2. **Sticky Header** กับ Search bar -- เลื่อนลงจะหดเหลือแค่ Search
3. **Pull-to-refresh** สำหรับหน้า Home และ Marketplace
4. **Swipe gestures**: Swipe left on card = เพิ่ม Watchlist, Swipe right = เพิ่ม Portfolio
5. **Bottom Sheet** แทน Modal/Dropdown บน Desktop (Filter, Options, Chat)
6. **Haptic feedback** เมื่อเพิ่ม/ลบจาก Portfolio/Watchlist (Vibration API)

---

## 8. Accessibility & Performance

### Performance Targets

| Metric | เป้าหมาย |
|--------|----------|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Time to Interactive (TTI) | < 3.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Lighthouse Score | 90+ (Mobile) |

### Image Optimization

- Card images: WebP format, Lazy loading, Blur placeholder (LQIP)
- Srcset สำหรับ responsive images (thumbnail 150px, card 300px, full 600px)
- CDN caching (Cloudflare/Vercel Edge)

### Accessibility

- Color contrast ratio: 4.5:1 minimum (WCAG AA)
- ราคาขึ้น/ลงใช้ทั้งสี + ลูกศร (ไม่พึ่งสีอย่างเดียว เพื่อ Color-blind users)
- Alt text สำหรับรูปการ์ดทุกรูป
- Keyboard navigation สำหรับ Desktop
- Screen reader labels สำหรับ Interactive elements

---

## 9. Tech Stack สำหรับ UI

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| Framework | Next.js 14+ (App Router) | SSR สำหรับ SEO, RSC, Image optimization |
| Styling | Tailwind CSS | Utility-first, Dark mode built-in, Responsive |
| Component Library | shadcn/ui | Accessible, Customizable, Copy-paste |
| Charts | Lightweight Charts (TradingView) + Recharts | Financial charts + General charts |
| Icons | Lucide React | Consistent, Lightweight |
| Animations | Framer Motion | Page transitions, Card hover, Micro-interactions |
| State Management | Zustand | Simple, ใช้สำหรับ Theme/Mode toggle, Filters |
| Forms | React Hook Form + Zod | Listing creation, Registration, Filters |

---

## 10. Design Milestones

| Phase | สิ่งที่ต้องออกแบบ | Priority |
|-------|-----------------|----------|
| **MVP** | Home, Search, Card Detail, Basic nav, Dark/Light theme | P0 |
| **Growth** | Portfolio, Watchlist, Auth pages, Upgrade prompts, Pro badge | P1 |
| **Marketplace** | Listing pages, Chat UI, Seller profile, Transaction flow | P1.5 |
| **Trader Mode** | Dashboard layout, Advanced charts, Multi-panel, Trader Card Detail | P2 |
| **Polish** | Animations, Empty states, Error pages, Onboarding flow, Loading states | P2 |
