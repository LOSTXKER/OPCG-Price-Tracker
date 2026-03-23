# TCG Price Tracker - Technical Architecture Plan

> Tech Stack: Next.js 14+ (App Router) / Supabase (PostgreSQL) / Prisma / Tailwind CSS + shadcn/ui
> Scraper: Node.js + Cheerio (Yuyu-tei server-rendered HTML)
> Hosting: Vercel / Cron: Vercel Cron Jobs

---

## 1. Project Structure

```
opcg-price-tracker/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (theme, fonts, nav)
│   ├── page.tsx                  # Home page (Trending, Top Gainers/Losers)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── callback/route.ts    # Supabase OAuth callback
│   ├── cards/
│   │   ├── page.tsx              # Search & Browse (SSR, SEO)
│   │   └── [code]/
│   │       └── page.tsx          # Card Detail (SSR, SEO)
│   ├── sets/
│   │   ├── page.tsx              # All sets list
│   │   └── [setCode]/page.tsx    # Set detail with all cards
│   ├── marketplace/
│   │   ├── page.tsx              # Marketplace listings
│   │   ├── [listingId]/page.tsx  # Listing detail
│   │   └── create/page.tsx       # Create listing (auth required)
│   ├── portfolio/
│   │   └── page.tsx              # Portfolio dashboard (auth required)
│   ├── watchlist/
│   │   └── page.tsx              # Watchlist (auth required)
│   ├── profile/
│   │   ├── page.tsx              # My profile
│   │   └── [userId]/page.tsx     # Public seller profile
│   └── api/
│       ├── cards/
│       │   ├── route.ts          # GET cards with filters
│       │   └── [code]/
│       │       ├── route.ts      # GET single card + latest price
│       │       └── prices/
│       │           └── route.ts  # GET price history
│       ├── sets/
│       │   └── route.ts          # GET all sets
│       ├── trending/
│       │   └── route.ts          # GET top gainers/losers
│       ├── portfolio/
│       │   └── route.ts          # CRUD portfolio
│       ├── watchlist/
│       │   └── route.ts          # CRUD watchlist
│       ├── alerts/
│       │   └── route.ts          # CRUD price alerts
│       ├── listings/
│       │   └── route.ts          # Marketplace CRUD
│       ├── exchange-rate/
│       │   └── route.ts          # GET current JPY/THB rate
│       ├── community-price/
│       │   └── route.ts          # POST report price / GET reports
│       └── cron/
│           ├── scrape-prices/
│           │   └── route.ts      # Daily price scraper (secured)
│           └── scrape-exchange/
│               └── route.ts      # Daily exchange rate update (secured)
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── cards/
│   │   ├── card-grid.tsx         # Card grid (2-col mobile, 4-col desktop)
│   │   ├── card-item.tsx         # Single card in grid (image, price, sparkline)
│   │   ├── card-detail.tsx       # Full card detail view
│   │   └── price-chart.tsx       # Price history chart (Lightweight Charts)
│   ├── marketplace/
│   │   ├── listing-card.tsx      # Listing in marketplace
│   │   └── listing-form.tsx      # Create/edit listing form
│   ├── portfolio/
│   │   ├── portfolio-summary.tsx # Total value, P&L
│   │   └── portfolio-item.tsx    # Single card in portfolio
│   ├── layout/
│   │   ├── header.tsx            # Top nav (desktop)
│   │   ├── bottom-nav.tsx        # Bottom tab bar (mobile)
│   │   ├── sidebar.tsx           # Filter sidebar
│   │   └── mode-toggle.tsx       # Casual/Trader mode switch
│   ├── trending/
│   │   ├── top-movers.tsx        # Top gainers/losers section
│   │   └── most-viewed.tsx       # Most viewed cards
│   └── shared/
│       ├── price-display.tsx     # Price with JPY/THB + change %
│       ├── sparkline.tsx         # Mini price chart
│       ├── search-bar.tsx        # Search with autocomplete
│       ├── filter-chips.tsx      # Filter chip list
│       ├── rarity-badge.tsx      # Rarity color badge (C/UC/R/SR/SEC/L)
│       └── theme-toggle.tsx      # Dark/Light mode
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── supabase/
│   │   ├── client.ts             # Supabase browser client
│   │   ├── server.ts             # Supabase server client
│   │   └── middleware.ts         # Auth middleware
│   ├── scraper/
│   │   ├── yuyu-tei.ts           # Yuyu-tei scraper (Cheerio)
│   │   ├── master-data.ts        # One-time master data scraper
│   │   ├── daily-prices.ts       # Daily price scraper
│   │   └── exchange-rate.ts      # Exchange rate fetcher
│   ├── utils/
│   │   ├── currency.ts           # JPY <-> THB conversion
│   │   ├── price-change.ts       # Calculate % change
│   │   └── card-code.ts          # Parse/validate card codes (OP15-109)
│   └── constants/
│       ├── sets.ts               # Set codes + names
│       └── rarities.ts           # Rarity codes + display names
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed initial set data
├── public/
│   └── cards/                    # Downloaded card images (or Supabase Storage)
├── .env.local                    # Environment variables
├── middleware.ts                  # Next.js middleware (auth check)
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── vercel.json                   # Cron job configuration
```

---

## 2. Prisma Database Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================================
// CARD DATA
// ============================================================

model CardSet {
  id          Int      @id @default(autoincrement())
  code        String   @unique               // "op01", "op15", "eb04", "st29"
  name        String                          // "Romance Dawn", "神の島の冒険"
  nameEn      String?                         // "Romance Dawn" (English)
  type        SetType                         // BOOSTER, EXTRA_BOOSTER, STARTER, PROMO
  releaseDate DateTime?
  cardCount   Int      @default(0)
  cards       Card[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([code])
}

enum SetType {
  BOOSTER
  EXTRA_BOOSTER
  STARTER
  PROMO
  OTHER
}

model Card {
  id              Int      @id @default(autoincrement())
  cardCode        String   @unique             // "OP15-109" (official Bandai code)
  yuyuteiId       String?                      // "10129" (Yuyu-tei internal ID for URL)
  yuyuteiUrl      String?                      // Full URL to Yuyu-tei card page
  setId           Int
  set             CardSet  @relation(fields: [setId], references: [id])
  nameJp          String                       // "ニコ・ロビン"
  nameEn          String?                      // "Nico Robin"
  rarity          String                       // "R", "SR", "SEC", "P-SR", "L", etc.
  cardType        CardType                     // CHARACTER, EVENT, STAGE, LEADER, DON
  color           String                       // "赤", "青", "緑", "紫", "黄", "黒"
  colorEn         String?                      // "Red", "Blue", etc.
  cost            Int?
  power           Int?
  counter         Int?
  life            Int?
  attribute       String?                      // "斬", "打", "射", "知", "特"
  trait           String?                      // 特徴 (e.g., "麦わらの一味")
  effectJp        String?                      // Full effect text (Japanese)
  effectEn        String?                      // Effect text (English)
  triggerJp       String?
  imageUrl        String?                      // Local/Supabase storage URL
  isParallel      Boolean  @default(false)     // パラレル (alternate art)
  prices          CardPrice[]
  portfolioItems  PortfolioItem[]
  watchlistItems  WatchlistItem[]
  priceAlerts     PriceAlert[]
  listings        Listing[]
  communityPrices CommunityPrice[]
  viewCount       Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([setId])
  @@index([rarity])
  @@index([cardType])
  @@index([color])
  @@index([nameJp])
  @@index([viewCount(sort: Desc)])
}

enum CardType {
  CHARACTER
  EVENT
  STAGE
  LEADER
  DON
}

model CardPrice {
  id         Int      @id @default(autoincrement())
  cardId     Int
  card       Card     @relation(fields: [cardId], references: [id])
  priceJpy   Int                               // Price in JPY (integer, no decimals)
  priceThb   Float?                            // Converted THB price at time of scrape
  inStock    Boolean  @default(true)           // Yuyu-tei stock status
  scrapedAt  DateTime @default(now())          // When this price was recorded

  @@index([cardId, scrapedAt(sort: Desc)])
  @@index([scrapedAt])
}

model ExchangeRate {
  id        Int      @id @default(autoincrement())
  fromCur   String   @default("JPY")
  toCur     String   @default("THB")
  rate      Float                               // 1 JPY = X THB
  fetchedAt DateTime @default(now())

  @@index([fetchedAt(sort: Desc)])
}

// ============================================================
// USER & AUTH
// ============================================================

model User {
  id             String    @id @default(cuid())
  supabaseId     String    @unique              // Supabase Auth UUID
  email          String    @unique
  displayName    String?
  avatarUrl      String?
  tier           UserTier  @default(FREE)
  tierExpiresAt  DateTime?
  portfolios     Portfolio[]
  watchlistItems WatchlistItem[]
  priceAlerts    PriceAlert[]
  listings       Listing[]
  sentMessages   Message[]       @relation("SentMessages")
  receivedMessages Message[]     @relation("ReceivedMessages")
  reviewsGiven   Review[]        @relation("ReviewsGiven")
  reviewsReceived Review[]       @relation("ReviewsReceived")
  communityPrices CommunityPrice[]
  sellerRating   Float?
  sellerReviewCount Int @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([supabaseId])
  @@index([tier])
}

enum UserTier {
  FREE
  PRO
  PRO_PLUS
  LIFETIME_PRO
  LIFETIME_PRO_PLUS
}

// ============================================================
// PORTFOLIO
// ============================================================

model Portfolio {
  id        Int             @id @default(autoincrement())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  name      String          @default("Default")
  items     PortfolioItem[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  @@index([userId])
}

model PortfolioItem {
  id            Int       @id @default(autoincrement())
  portfolioId   Int
  portfolio     Portfolio  @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  cardId        Int
  card          Card      @relation(fields: [cardId], references: [id])
  quantity      Int       @default(1)
  purchasePrice Int?                            // Price paid (JPY)
  condition     CardCondition @default(NM)
  notes         String?
  addedAt       DateTime  @default(now())

  @@unique([portfolioId, cardId, condition])
  @@index([portfolioId])
  @@index([cardId])
}

enum CardCondition {
  NM    // Near Mint
  LP    // Light Play
  MP    // Moderate Play
  HP    // Heavy Play
  DMG   // Damaged
}

// ============================================================
// WATCHLIST & ALERTS
// ============================================================

model WatchlistItem {
  id        Int      @id @default(autoincrement())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  cardId    Int
  card      Card     @relation(fields: [cardId], references: [id])
  addedAt   DateTime @default(now())

  @@unique([userId, cardId])
  @@index([userId])
}

model PriceAlert {
  id          Int            @id @default(autoincrement())
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  cardId      Int
  card        Card           @relation(fields: [cardId], references: [id])
  targetPrice Int                               // JPY
  direction   AlertDirection                    // ABOVE or BELOW
  channel     AlertChannel   @default(EMAIL)
  isActive    Boolean        @default(true)
  triggeredAt DateTime?
  createdAt   DateTime       @default(now())

  @@index([userId, isActive])
  @@index([cardId, isActive])
}

enum AlertDirection {
  ABOVE
  BELOW
}

enum AlertChannel {
  EMAIL
  LINE
  PUSH
}

// ============================================================
// MARKETPLACE
// ============================================================

model Listing {
  id          Int            @id @default(autoincrement())
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  cardId      Int
  card        Card           @relation(fields: [cardId], references: [id])
  priceJpy    Int
  priceThb    Float?
  condition   CardCondition  @default(NM)
  quantity    Int            @default(1)
  description String?
  photos      String[]                          // Array of photo URLs
  shipping    String[]                          // ["EMS", "Kerry", "Meetup"]
  location    String?                           // "Bangkok", "Chiang Mai"
  status      ListingStatus  @default(ACTIVE)
  isFeatured  Boolean        @default(false)
  isBoosted   Boolean        @default(false)
  boostedUntil DateTime?
  messages    Message[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@index([cardId, status])
  @@index([userId, status])
  @@index([status, createdAt(sort: Desc)])
  @@index([isFeatured, status])
}

enum ListingStatus {
  ACTIVE
  SOLD
  RESERVED
  EXPIRED
  CANCELLED
}

model Message {
  id         Int      @id @default(autoincrement())
  listingId  Int
  listing    Listing  @relation(fields: [listingId], references: [id])
  senderId   String
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiverId String
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  content    String
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([listingId, createdAt])
  @@index([receiverId, isRead])
}

model Review {
  id         Int      @id @default(autoincrement())
  reviewerId String
  reviewer   User     @relation("ReviewsGiven", fields: [reviewerId], references: [id])
  revieweeId String
  reviewee   User     @relation("ReviewsReceived", fields: [revieweeId], references: [id])
  listingId  Int?
  rating     Int                                // 1-5
  comment    String?
  createdAt  DateTime @default(now())

  @@unique([reviewerId, revieweeId, listingId])
  @@index([revieweeId])
}

// ============================================================
// COMMUNITY PRICE
// ============================================================

model CommunityPrice {
  id        Int      @id @default(autoincrement())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  cardId    Int
  card      Card     @relation(fields: [cardId], references: [id])
  priceThb  Int                                 // Reported Thai price in THB
  upvotes   Int      @default(0)
  createdAt DateTime @default(now())

  @@index([cardId, createdAt(sort: Desc)])
  @@index([userId, createdAt])
}
```

---

## 3. Scraper Architecture

### 3.1 Yuyu-tei URL Patterns (จากการ Research จริง)

```
Base URL: https://yuyu-tei.jp

หน้ารวม OPCG:
  https://yuyu-tei.jp/top/opc

รายการการ์ดแต่ละชุด (ใช้สำหรับ Daily Price Scrape):
  https://yuyu-tei.jp/sell/opc/s/{setCode}
  ตัวอย่าง:
    /sell/opc/s/op15    -> OP15 神の島の冒険
    /sell/opc/s/op14    -> OP14
    /sell/opc/s/eb04    -> Extra Booster 04
    /sell/opc/s/st29    -> Starter Deck 29

หน้ารายละเอียดการ์ด (ใช้สำหรับ Master Data Scrape):
  https://yuyu-tei.jp/sell/opc/card/{setCode}/{internalId}
  ตัวอย่าง:
    /sell/opc/card/op15/10129   -> R ニコ・ロビン OP15-109
    /sell/opc/card/op14/10015   -> モンキー・D・ルフィ
```

### 3.2 Set Codes ที่ต้อง Scrape

```
Booster Packs:    op01, op02, op03, op04, op05, op06, op07, op08,
                  op09, op10, op11, op12, op13, op14, op15
Extra Boosters:   eb01, eb02, eb03, eb04
Starter Decks:    st01 - st29 (เลือกเฉพาะที่มีราคาขาย)
Promo:            prb01, prb02
```

### 3.3 Data Mapping (Yuyu-tei -> Database)

จากหน้า Card Detail ที่ scrape ได้:

| Yuyu-tei Field | ตัวอย่างข้อมูล | Database Column |
|----------------|---------------|----------------|
| Card title | R ニコ・ロビン | rarity + nameJp |
| Card number | OP15-109 | cardCode |
| 種類 (Type) | キャラクター | cardType -> CHARACTER |
| 色 (Color) | 黄 | color |
| コスト (Cost) | 7 | cost |
| パワー (Power) | 7000 | power |
| カウンター (Counter) | 1000 | counter |
| ライフ (Life) | - | life (null) |
| 属性 (Attribute) | 打 | attribute |
| 特徴 (Trait) | 麦わらの一味 | trait |
| テキスト (Effect) | 【登場時】... | effectJp |
| トリガー (Trigger) | - | triggerJp |
| 価格 (Price) | 120 円 | priceJpy -> 120 |
| 在庫 (Stock) | ◯ / ✕ | inStock -> true/false |
| (パラレル) in name | ニコ・ロビン(パラレル) | isParallel -> true |
| URL path | /sell/opc/card/op15/10129 | yuyuteiId -> "10129" |

### 3.4 Type / Color Mapping

```typescript
// lib/scraper/mappings.ts

const TYPE_MAP: Record<string, CardType> = {
  "キャラクター": "CHARACTER",
  "イベント": "EVENT",
  "ステージ": "STAGE",
  "リーダー": "LEADER",
  "ドン!!カード": "DON",
};

const COLOR_MAP: Record<string, string> = {
  "赤": "Red",
  "青": "Blue",
  "緑": "Green",
  "紫": "Purple",
  "黄": "Yellow",
  "黒": "Black",
};

const RARITY_ORDER: Record<string, number> = {
  "SEC": 7,
  "P-SEC": 7,
  "SR": 6,
  "P-SR": 6,
  "R": 5,
  "P-R": 5,
  "UC": 4,
  "P-UC": 4,
  "C": 3,
  "P-C": 3,
  "L": 8,
  "P-L": 8,
  "SP": 9,
  "P": 2,
  "P-P": 2,
};
```

### 3.5 Scraper Flow

```
Master Data Scrape (ครั้งเดียว + เมื่อมีชุดใหม่):
┌─────────────────────────────────────────────────────────┐
│ 1. ดึงหน้า /sell/opc/s/{setCode}                         │
│    -> ได้รายการ Card URLs ทั้งหมดในชุดนั้น                  │
│                                                          │
│ 2. วนลูปเข้าแต่ละ Card URL: /sell/opc/card/{set}/{id}   │
│    -> ดึง: name, cardCode, rarity, type, color, cost,    │
│           power, counter, effect, image URL              │
│    -> Delay 1-2 วินาทีระหว่างแต่ละ request                │
│                                                          │
│ 3. Download card image -> Supabase Storage               │
│                                                          │
│ 4. Upsert ลง Card table (ใช้ cardCode เป็น unique key)   │
└─────────────────────────────────────────────────────────┘

Daily Price Scrape (ทุกคืน 02:00 JST):
┌─────────────────────────────────────────────────────────┐
│ 1. Fetch exchange rate JPY/THB                           │
│    -> บันทึกลง ExchangeRate table                         │
│                                                          │
│ 2. วนลูปทุก Set: /sell/opc/s/{setCode}                   │
│    -> ดึงรายการการ์ดทั้งหมด + ราคา + stock status          │
│    -> Delay 1-2 วินาทีระหว่างแต่ละ Set page               │
│                                                          │
│ 3. สำหรับแต่ละการ์ด:                                       │
│    -> Match กับ Card ใน DB ด้วย yuyuteiId หรือ cardCode   │
│    -> คำนวณ priceThb = priceJpy * exchangeRate           │
│    -> Insert ลง CardPrice table                          │
│                                                          │
│ 4. Check PriceAlerts ที่ triggered                       │
│    -> ส่ง Email/LINE notification                        │
│                                                          │
│ 5. Log ผลลัพธ์ (จำนวนการ์ดที่ scrape ได้, errors)          │
└─────────────────────────────────────────────────────────┘
```

### 3.6 Scraper Pseudocode

```typescript
// lib/scraper/daily-prices.ts

import * as cheerio from "cheerio";

const BASE_URL = "https://yuyu-tei.jp";
const DELAY_MS = 1500;
const SET_CODES = ["op01", "op02", /* ... */ "op15", "eb01", /* ... */ "eb04"];

async function scrapeDailyPrices() {
  const rate = await fetchExchangeRate();
  await saveExchangeRate(rate);

  for (const setCode of SET_CODES) {
    const url = `${BASE_URL}/sell/opc/s/${setCode}`;
    const html = await fetch(url).then((r) => r.text());
    const $ = cheerio.load(html);

    // Each card item on the set listing page
    $(".card-list-item").each((_, el) => {
      const name = $(el).find(".card-name").text().trim();
      const priceText = $(el).find(".price").text().trim();
      const priceJpy = parseInt(priceText.replace(/[^0-9]/g, ""), 10);
      const cardUrl = $(el).find("a").attr("href");
      const yuyuteiId = cardUrl?.split("/").pop();
      const inStock = !$(el).find(".sold-out").length;

      // Upsert price record
      // ...
    });

    await sleep(DELAY_MS);
  }
}
```

> Note: CSS selectors ข้างต้นเป็น placeholder -- ต้องตรวจสอบ HTML จริงของ Yuyu-tei
> อีกครั้งเมื่อเริ่ม implement จริง เพราะ class names อาจเปลี่ยน

### 3.7 Error Handling & Monitoring

| สถานการณ์ | วิธีจัดการ |
|-----------|----------|
| Request timeout | Retry 3 ครั้ง ด้วย exponential backoff |
| HTTP 403/429 (Blocked) | หยุดทันที, log error, ส่ง alert ให้ทีม |
| HTML structure เปลี่ยน | Validation check: ถ้า scrape ได้ 0 cards -> alert |
| ราคาผิดปกติ (เช่น 0 เยน) | Skip record, log warning |
| Card ไม่เจอใน DB | สร้าง Card ใหม่อัตโนมัติ (ถ้ามีข้อมูลพอ) |

---

## 4. API Routes Detail

### 4.1 Public Routes (ไม่ต้อง Auth)

```
GET /api/cards
  Query params:
    ?search=luffy          -- ค้นหาชื่อ (JP/EN)
    ?set=op15              -- Filter by set
    ?rarity=SR,SEC         -- Filter by rarity (comma-separated)
    ?type=CHARACTER        -- Filter by card type
    ?color=Red             -- Filter by color
    ?minPrice=100          -- Min price JPY
    ?maxPrice=5000         -- Max price JPY
    ?sort=price_desc       -- Sort: price_asc, price_desc, change_desc, newest
    ?page=1&limit=20       -- Pagination
  Response: { cards: Card[], total: number, page: number }

GET /api/cards/[code]
  Params: code = "OP15-109"
  Response: { card: Card, latestPrice: CardPrice, priceChange7d: number }

GET /api/cards/[code]/prices
  Query params:
    ?period=7d             -- 7d, 30d, 90d, 1y, all
  Response: { prices: CardPrice[], high: number, low: number, avg: number }

GET /api/sets
  Response: { sets: CardSet[] }

GET /api/trending
  Response: {
    topGainers: Card[],    -- Top 10 ราคาขึ้นมากสุด 24h
    topLosers: Card[],     -- Top 10 ราคาลงมากสุด 24h
    mostViewed: Card[],    -- Top 10 คนดูเยอะสุด
  }

GET /api/exchange-rate
  Response: { rate: number, fetchedAt: string }
```

### 4.2 Protected Routes (ต้อง Auth)

```
GET    /api/portfolio          -- ดึง Portfolio ของ User
POST   /api/portfolio          -- สร้าง Portfolio ใหม่
POST   /api/portfolio/items    -- เพิ่มการ์ดเข้า Portfolio
DELETE /api/portfolio/items/[id] -- ลบการ์ดออก

GET    /api/watchlist           -- ดึง Watchlist
POST   /api/watchlist           -- เพิ่มการ์ดเข้า Watchlist
DELETE /api/watchlist/[cardId]  -- ลบออก

GET    /api/alerts              -- ดึง Alerts ของ User
POST   /api/alerts              -- สร้าง Alert ใหม่
DELETE /api/alerts/[id]         -- ลบ Alert

GET    /api/listings            -- ดึง Listings (public + user's own)
POST   /api/listings            -- สร้าง Listing ใหม่
PATCH  /api/listings/[id]       -- อัปเดต Listing
DELETE /api/listings/[id]       -- ลบ/ยกเลิก Listing

POST   /api/community-price     -- รายงานราคาไทย
```

### 4.3 Cron Routes (ต้อง Cron Secret)

```
POST /api/cron/scrape-prices
  Header: Authorization: Bearer {CRON_SECRET}
  ทำอะไร: รัน Daily Price Scraper
  Schedule: ทุกวัน 02:00 JST (17:00 UTC)

POST /api/cron/scrape-exchange
  Header: Authorization: Bearer {CRON_SECRET}
  ทำอะไร: อัปเดต Exchange rate
  Schedule: ทุกวัน 00:00 JST
```

### 4.4 Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scrape-prices",
      "schedule": "0 17 * * *"
    },
    {
      "path": "/api/cron/scrape-exchange",
      "schedule": "0 15 * * *"
    }
  ]
}
```

---

## 5. Authentication Flow (Supabase Auth)

```
Registration / Login:
┌─────────────────────────────────────┐
│ 1. User กด "Login with Google"      │
│    หรือ กรอก Email + Password       │
│                                     │
│ 2. Supabase Auth จัดการ OAuth flow  │
│    -> redirect ไป /auth/callback    │
│                                     │
│ 3. callback route.ts:               │
│    -> Exchange code for session     │
│    -> Upsert User record ใน DB     │
│       (supabaseId, email, etc.)     │
│    -> Redirect ไปหน้าเดิม           │
│                                     │
│ 4. middleware.ts:                    │
│    -> ทุก request เช็ค session      │
│    -> Protected routes (/portfolio, │
│       /watchlist) redirect ถ้า      │
│       ไม่ได้ login                   │
│    -> Public routes (/cards, /)     │
│       ผ่านเสมอ                       │
└─────────────────────────────────────┘
```

---

## 6. Key Technical Decisions

### 6.1 Image Storage Strategy

- Download images จาก Yuyu-tei ไปเก็บใน **Supabase Storage** (ห้าม Hotlink)
- 3 ขนาด: thumbnail (150px), card (300px), full (600px) -- ใช้ Sharp resize ตอน download
- ใช้ Next.js `<Image>` component กับ Supabase Storage URL
- CDN: Supabase Storage มี CDN built-in

### 6.2 Card Code System

Yuyu-tei ใช้ internal ID (เช่น `10129`) ใน URL แต่หน้า detail แสดง official code (เช่น `OP15-109`)
- เก็บทั้งสอง: `cardCode` (official, unique key) + `yuyuteiId` (internal, for scraping)
- URL ของเว็บเราใช้ `cardCode`: `/cards/OP15-109` (SEO-friendly + user-friendly)

### 6.3 Price History Retention

- เก็บราคาทุกวันตลอดไป ไม่ลบ
- ประมาณการ: 3,000 cards x 365 days = ~1.1M rows/year -> PostgreSQL รับได้สบาย
- Index ที่สำคัญ: `(cardId, scrapedAt DESC)` สำหรับ query ราคาล่าสุด/ย้อนหลัง

### 6.4 Exchange Rate

- ใช้ **ExchangeRate-API** (free tier: 1,500 req/month, เพียงพอสำหรับ 1 req/day)
- Cache ราคาแลกเปลี่ยน 24 ชม.
- Fallback: ถ้า API ล่ม ใช้ rate ล่าสุดที่เก็บไว้

### 6.5 SSR vs SSG vs Client

| หน้า | Rendering | เหตุผล |
|------|-----------|--------|
| Home (Trending) | SSR + Revalidate 5min | ข้อมูลเปลี่ยนบ่อย แต่ไม่ต้อง Real-time |
| Card Detail | SSR + Revalidate 1hr | SEO สำคัญ, ราคาเปลี่ยนวันละ 1 ครั้ง |
| Search/Browse | SSR (dynamic) | Query params เปลี่ยนตาม Filter |
| Set List | SSG | แทบไม่เปลี่ยน |
| Marketplace | SSR + Client fetch | Listings เปลี่ยนบ่อย |
| Portfolio | Client only | ข้อมูลส่วนตัว ไม่ต้อง SEO |
| Watchlist | Client only | ข้อมูลส่วนตัว |

### 6.6 Rate Limiting

| Route | Limit |
|-------|-------|
| Public API (cards, trending) | 100 req/min per IP |
| Auth API (portfolio, watchlist) | 60 req/min per user |
| Listings create | 10 req/hour per user |
| Community price report | 5 req/day per user |

---

## 7. Environment Variables

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Cron Security
CRON_SECRET=your-secret-key-here

# Exchange Rate API
EXCHANGE_RATE_API_KEY=your-key-here

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 8. Performance Considerations

### 8.1 Database Queries ที่หนักที่สุด

**Trending (Top Gainers/Losers):**
```sql
-- ต้องเปรียบเทียบราคาวันนี้ vs เมื่อวาน สำหรับทุกการ์ด
-- ใช้ Materialized View หรือ Pre-compute ตอน Scrape เสร็จ

-- Option A: Computed field ตอน scrape
-- เพิ่ม column priceChange24h, priceChange7d ใน Card table
-- อัปเดตหลัง scrape ทุกวัน -> Query เร็วมาก

-- Option B: Window function (ถ้าไม่อยาก denormalize)
SELECT c.*, 
  latest.price_jpy as current_price,
  prev.price_jpy as prev_price,
  ((latest.price_jpy - prev.price_jpy)::float / prev.price_jpy * 100) as change_pct
FROM cards c
JOIN LATERAL (
  SELECT price_jpy FROM card_prices 
  WHERE card_id = c.id ORDER BY scraped_at DESC LIMIT 1
) latest ON true
JOIN LATERAL (
  SELECT price_jpy FROM card_prices 
  WHERE card_id = c.id AND scraped_at < CURRENT_DATE ORDER BY scraped_at DESC LIMIT 1
) prev ON true
ORDER BY change_pct DESC
LIMIT 10;
```

แนะนำ **Option A** (Computed field) เพราะ Query นี้จะถูกเรียกบ่อยมากที่หน้า Home

**Price History:**
```sql
-- Index (cardId, scrapedAt DESC) ทำให้ query นี้เร็ว O(log n)
SELECT * FROM card_prices 
WHERE card_id = $1 AND scraped_at >= $2
ORDER BY scraped_at ASC;
```

### 8.2 Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| Card list (search results) | ISR (Next.js) | 5 min |
| Card detail | ISR | 1 hour |
| Trending data | In-memory (unstable_cache) | 5 min |
| Exchange rate | In-memory | 24 hours |
| Card images | CDN (Supabase) | 30 days |
| Static pages (sets) | SSG | Build time |

---

## 9. Deployment Pipeline

```
Development:
  localhost:3000  ->  Supabase (dev project)

Staging (Preview):
  Vercel Preview Deploy (per PR)  ->  Supabase (dev project)

Production:
  Vercel Production  ->  Supabase (prod project)
  Custom domain: your-domain.com

CI/CD:
  Git push -> Vercel auto-deploy
  Prisma migrate deploy -> run on Vercel build
```

### 9.1 Vercel Build Configuration

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma migrate deploy && next build",
    "start": "next start",
    "scrape:master": "tsx lib/scraper/master-data.ts",
    "scrape:prices": "tsx lib/scraper/daily-prices.ts",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```
