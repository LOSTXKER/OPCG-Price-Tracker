# Marketplace & Seller Center — สเปกระบบซื้อขาย

> อัปเดตล่าสุด: 2026-06-14 · cross-checked vs code

ref ทางการ: **PLAN.md → M3** (Marketplace launch prep) · code ที่ `src/app/{marketplace,seller,orders,saved,messages}/**` + `src/app/api/{listings,offers,orders,seller,reviews,messages}/**`

จุดประสงค์: เก็บ **สเปก + เหตุผลออกแบบ** ของระบบ marketplace/seller-center และระบุชัดว่าอะไร **สร้างแล้ว** อะไร **ยังค้าง** เพื่อใช้เป็น working reference ตอนเปิด track นี้ (M3)

> สถานะภาพรวม: โค้ดเกือบทั้งหมดของ Phase 1–4 (ในเอกสารนี้) **สร้างเสร็จแล้ว** แต่ marketplace ทั้งหมด **ปิดด้วย feature flag** `marketplaceEnabled` (default `false` — ดู `src/lib/admin/config.ts:56`). ทุกหน้า/route ของ seller ผ่าน `assertMarketplaceEnabled()` ก่อน (`src/app/seller/layout.tsx`). งานที่เหลือคือ "launch prep" ไม่ใช่ "build from scratch" — ดูตาราง M3 ท้ายเอกสาร

---

## สถานะ: BUILT vs PENDING

### ✅ สร้างแล้ว (live ในโค้ด แต่ flag ปิดอยู่)

| ส่วน | ที่อยู่ |
| ---- | ------- |
| Seller Center (sidebar shell + guard) | `src/app/seller/layout.tsx` → `seller-shell.tsx` |
| Seller Dashboard + stats | `src/app/seller/page.tsx` · `GET /api/seller/stats` |
| Listings management (table, edit, สร้าง) | `src/app/seller/listings/{page,new/page,[id]/page}.tsx` · `GET /api/seller/listings` |
| Seller Orders (tabs ตามสถานะ) | `src/app/seller/orders/{page,[id]/page}.tsx` |
| Seller Reviews | `src/app/seller/reviews/page.tsx` · `GET /api/seller/reviews` |
| Buyer Orders + detail/tracking | `src/app/orders/{page,[id]/page}.tsx` · `GET /api/orders?role=buyer` |
| Saved Listings | `src/app/saved/page.tsx` |
| Browse + listing detail + buy/offer | `src/app/marketplace/{page,[listingId]/page}.tsx` |
| Create wizard (4 step) | `src/components/marketplace/create-wizard/` |
| Order status flow (transition guard) | `src/app/api/orders/[id]/route.ts` (`VALID_TRANSITIONS`) |
| Chat (messaging + offer/order timeline) | `src/app/messages/**` · `src/components/messages/order-status-tracker.tsx` |
| Cleanup ที่เอกสารเดิมวางแผนไว้ | `listing-form.tsx` / `seller-profile-card.tsx` **ลบแล้ว** · `/marketplace/create` **redirect แล้ว** |

### 🚧 ยังค้าง (= M3 ใน PLAN.md)

| งาน | สถานะจริง |
| --- | --------- |
| `marketplaceEnabled` → เปิดเมื่อไหร่ + เกณฑ์พร้อม | งานธุรกิจ (เบสเคาะ) |
| auto-complete `DELIVERED → COMPLETED` หลัง X วัน | **ยังไม่มี cron** — ยืนยัน: ไม่อยู่ใน `vercel.json` crons · ปัจจุบัน DELIVERED→COMPLETED เป็น **manual** (buyer/seller กดยืนยัน) |
| `OrderEvent` model (audit log status changes) | **ยังไม่มีใน schema** — ปัจจุบันบันทึกเป็น `Message` type `ORDER_UPDATE` แทน |
| `DISPUTED` + mediation flow | enum `DISPUTED` **มีแล้ว** + transition เข้าได้ แต่ **ไม่มี mediation UI/flow** ต่อ |
| Escrow release จริง (Stripe Connect) | **ยังไม่มี** — ไม่มี Stripe Connect/escrow/payout ในโค้ดเลย; "เงินเข้าผู้ขาย" เป็น manual/นอกระบบ |
| `ShopSettings` (default shipping, bio, policies) | **ยังไม่มี model** — `/seller/settings` เป็นหน้า "coming soon" stub |
| `/checkout/[orderId]` + Cart (ซื้อหลายใบ) | **ยังไม่มี** — `/checkout` ว่าง; Buy Now สร้าง order ทันที (ทีละใบ) |

---

## Architecture Overview (สเปกเป้าหมาย — ตรงกับที่สร้างแล้ว เว้น `/checkout`)

```
┌─────────────────────────────────────────────────────────────┐
│                        BUYER SIDE                            │
│  /marketplace          Browse & search listings              │
│  /marketplace/[id]     Product detail, buy/offer             │
│  /checkout/[orderId]   Checkout & payment        (🚧 ยังไม่มี)│
│  /orders               My purchases list                    │
│  /orders/[id]          Order detail & tracking               │
│  /saved                Saved listings                        │
│  /messages             Chat with sellers                     │
├─────────────────────────────────────────────────────────────┤
│                       SELLER SIDE                            │
│  /seller               Dashboard (stats, quick actions)      │
│  /seller/listings      Manage all listings                   │
│  /seller/listings/new  Create listing (wizard)               │
│  /seller/listings/[id] Edit listing                          │
│  /seller/orders        Manage incoming orders                │
│  /seller/reviews       Reviews received                      │
│  /seller/settings      Shop settings           (🚧 stub)     │
│  /messages             Chat with buyers (shared)             │
└─────────────────────────────────────────────────────────────┘
```

**DESIGN RATIONALE — ทำไมต้องมี Seller Center แยก:** ก่อนหน้านี้ chat เป็นที่เดียวที่ผู้ขายจัดการ offers/orders/tracking ทั้งหมด ซึ่งโหลดเกินไปและไม่มีมุมรวม (no listing edit UI, no order overview). แยก Seller Center ออกมา → chat กลับมาเป็น "ช่องทางสื่อสาร" ล้วน ส่วน action หลัก (accept offer, ship, confirm) ย้ายไปหน้า orders ที่ออกแบบสำหรับงานนั้นโดยเฉพาะ (อ้างอิง Shopee Seller Centre)

---

## API surface (ตามจริงในโค้ด)

```
# Listings
GET    /api/listings                  # browse (filters/search)
POST   /api/listings                  # create
PATCH  /api/listings/[id]             # edit   (ไม่มี GET — detail ดึงผ่าน server component)
DELETE /api/listings/[id]
POST   /api/listings/[id]/save        # toggle bookmark
POST   /api/listings/[id]/view        # increment view
POST   /api/listings/upload           # อัปโหลดรูป (→ Cloudflare R2)

# Seller (own)
GET    /api/seller/listings           # listings ของตัวเอง (ไม่ใช่ /api/listings?userId=me)
GET    /api/seller/stats              # dashboard aggregates
GET    /api/seller/reviews            # reviews ที่ได้รับ

# Offers
POST   /api/offers                    # create offer
PATCH  /api/offers/[id]               # accept/reject/cancel/counter

# Orders
GET    /api/orders?role=buyer|seller  # list (role บังคับ — 400 ถ้าไม่ส่ง)
POST   /api/orders                    # buy-now (สร้าง order + listing → RESERVED)
GET    /api/orders/[id]               # detail
PATCH  /api/orders/[id]               # status transition (มี guard)

# Reviews / Messages / Saved sellers
POST   /api/reviews
GET    /api/messages · /conversations · /unread-count · POST /api/messages
DELETE /api/saved-sellers/[sellerId]
```

> หมายเหตุ stale fix: เอกสารเดิมเขียน `GET /api/listings?userId=me` และ `GET /api/reviews?userId=...` — **ของจริงไม่ได้ทำแบบนั้น** ใช้ route แยก `/api/seller/listings` และ `/api/seller/reviews` แทน (role-scoped จาก auth ไม่ใช่ query param)

---

## Order Status Flow (สเปก + ของจริง)

```
  Buyer                                      Seller
    ├─ Buy Now / Accept Offer ──────────────► │
    │  ┌─────────────────────┐
    │  │  AWAITING_PAYMENT   │ ◄── order created (listing → RESERVED)
    │  └────────┬────────────┘
    │           │ buyer แจ้งชำระ
    │  ┌────────▼────────────┐
    │  │       PAID          │ ──► แจ้งเตือนผู้ขาย
    │  └────────┬────────────┘
    │           │ seller กรอก tracking + ship
    │  ┌────────▼────────────┐
    │  │      SHIPPED        │
    │  └────────┬────────────┘
    │           │ buyer ยืนยันรับ
    │  ┌────────▼────────────┐
    │  │     DELIVERED       │
    │  └────────┬────────────┘
    │           │ buyer/seller กดยืนยัน (🚧 ยังไม่ auto)
    │  ┌────────▼────────────┐
    │  │     COMPLETED       │ ──► listing → SOLD (🚧 escrow release: ยังไม่มี)
    │  └─────────────────────┘
    │  CANCELLED  ◄── ก่อน SHIPPED (listing กลับเป็น ACTIVE)
    │  DISPUTED   ◄── buyer แจ้งปัญหาจาก PAID/SHIPPED/DELIVERED (🚧 ไม่มี flow ต่อ)
```

**Transition guard จริง** (`src/app/api/orders/[id]/route.ts` → `VALID_TRANSITIONS`):

| จาก | ไปได้ | ใคร |
| --- | ----- | --- |
| `AWAITING_PAYMENT` | `PAID` | buyer |
| `AWAITING_PAYMENT` | `CANCELLED` | buyer / seller |
| `PAID` | `SHIPPED` | seller |
| `PAID` | `CANCELLED` | seller |
| `PAID` | `DISPUTED` | buyer |
| `SHIPPED` | `DELIVERED` | buyer |
| `SHIPPED` | `DISPUTED` | buyer |
| `DELIVERED` | `COMPLETED` | buyer / seller |
| `DELIVERED` | `DISPUTED` | buyer |

ทุก transition เขียน `Message` (`type: ORDER_UPDATE`) + ยิง `notify()` หา counterparty · `COMPLETED` → `triggerAchievementCheck(buyerId)` (honey order_buy_count)

> **DESIGN RATIONALE — ทำไม `DELIVERED → COMPLETED` ควร auto:** ถ้า buyer ลืมกดยืนยัน order จะค้าง DELIVERED ตลอด → เงินไม่เข้าผู้ขาย (เมื่อมี escrow). แผน M3 จะเพิ่ม cron auto-complete หลัง X วันเหมือน Shopee. ตอนนี้ยังไม่มี cron → ต้อง manual

---

## Database (Prisma) — มีอะไรแล้ว / ยังไม่มี

models ที่ **มีแล้ว** (`prisma/schema.prisma`): `Listing` · `SavedListing` · `SavedSeller` · `Offer` · `Order` · `Message` · `Review`

enums: `ListingStatus` (ACTIVE/SOLD/RESERVED/EXPIRED/CANCELLED) · `OfferStatus` · `OrderStatus` (7 ค่า รวม DISPUTED) · `MessageType` (รวม OFFER, ORDER_UPDATE, SYSTEM)

`Order` มี field timestamp ครบ: `paidAt · shippedAt · deliveredAt · completedAt · cancelledAt` + `trackingNumber · shippingMethod · shippingAddressId · cancelReason`

**ยังไม่มี (M3 / future):**

- `OrderEvent` — audit log status changes (ตอนนี้ใช้ `Message[type=ORDER_UPDATE]` แทน; แยก model จะ query ประวัติได้สะอาดกว่า)
- `ShopSettings` — default shipping, location, bio, policies
- `Cart` / `CartItem` — ระบบตะกร้า (ตอนนี้ Buy Now ทีละใบ)

> หมายเหตุ: `marketplaceEnabled` **ไม่ใช่ field ใน schema** — เป็น admin config (key `marketplace_enabled` ใน `AdminConfig`, อ่านผ่าน `src/lib/admin/config.ts` + `src/lib/marketplace/feature-flag.ts`)

---

## Component map (ตามจริง)

```
src/components/marketplace/      # buyer-facing
├── marketplace-browse.tsx · marketplace-browse/{index,browse-grid,browse-list,
│       browse-toolbar,browse-filters-sheet,seller-lock-banner,types}.tsx
├── listing-card.tsx · review-section.tsx
└── create-wizard/{index,wizard-layout,step-card-select,step-pricing,
        step-shipping,step-preview}.tsx

src/components/orders/           # shared (buyer & seller)
├── order-card.tsx
└── order-status-badge.tsx

src/components/messages/
└── order-status-tracker.tsx · order-sidebar.tsx    # order timeline ใน chat
```

> stale fix: เอกสารเดิมเสนอ `src/components/seller/` (NEW) + ชื่อ component `OrderTimeline / ListingTable / StatsCard` — **ของจริงไม่ได้ใช้ชื่อ/โฟลเดอร์พวกนี้**. ไม่มีโฟลเดอร์ `src/components/seller/` (UI เป็น inline ในแต่ละ `src/app/seller/**/page.tsx`); order timeline = `order-status-tracker.tsx` ใน `messages/`

---

## E2E Flow: ซื้อขายตั้งแต่ต้นจนจบ (Shopee reference)

### ผู้ขาย: ลงขาย
1. `/seller` → "ลงขายสินค้า" → `/seller/listings/new`
2. Wizard: เลือกการ์ด → ราคา/สภาพ → จัดส่ง/อัปรูปจริง → Preview → ลงประกาศ
3. Listing โผล่ที่ `/marketplace` สถานะ ACTIVE

### Flow A: Buy Now
1. buyer กด "ซื้อตามราคา" → `POST /api/orders` → Order `AWAITING_PAYMENT` + listing → RESERVED
2. buyer เห็น order ที่ `/orders` → แจ้งชำระ → `PAID` → แจ้งเตือนผู้ขาย
3. seller ที่ `/seller/orders` → กรอก tracking → `SHIPPED`
4. buyer ที่ `/orders/[id]` เห็น tracking → ยืนยันรับ → `DELIVERED` → กดยืนยัน → `COMPLETED` (listing → SOLD)
5. buyer รีวิวผู้ขาย

### Flow B: Offer → Negotiate → Buy
1. buyer "เสนอราคา" → offer โผล่ใน chat + แจ้งเตือนผู้ขาย
2. seller: Accept / Reject / Counter
3. Accept → สร้าง Order (ต่อด้วย Flow A) · Counter → buyer ตอบกลับได้ · Reject → จบ (เสนอใหม่ได้)

---

## Tech notes

**Seller layout pattern** (`src/app/seller/layout.tsx`): guard ด้วย `assertMarketplaceEnabled()` + `getAuthUser()` → redirect `/login` ถ้าไม่ล็อกอิน → render `<SellerShell>` (sidebar desktop + responsive nav ใน `seller-shell.tsx`)

**Stats API shape** (`GET /api/seller/stats`):
```ts
{ totalListings, activeListings, soldListings, totalOrders, pendingOrders,
  totalRevenue,        // sum priceThb ของ order COMPLETED
  totalViews, avgRating, reviewCount, recentOrders }  // recentOrders = ล่าสุด 5
```

**Order list API shape** (`GET /api/orders?role=buyer|seller&status=&page=&limit=`): คืน `{ orders, total, page, limit, ... }` — `role` บังคับ (400 ถ้าไม่ส่ง), `status` filter ได้ (`ALL` = ทั้งหมด)

---

## เมื่อจะเปิด track นี้ (M3 checklist)

ทำตาม PLAN.md M3 ตามลำดับ:

1. (ธุรกิจ) ตัดสินใจเกณฑ์เปิด `marketplaceEnabled`
2. cron auto-complete `DELIVERED → COMPLETED` (เพิ่มใน `vercel.json` + `src/app/api/cron/...`)
3. `OrderEvent` model + เขียน event ทุก transition (แทน/เสริม `Message[ORDER_UPDATE]`)
4. DISPUTED mediation flow (UI + admin resolve)
5. Escrow ผ่าน Stripe Connect (onboard ผู้ขาย → hold → release ตอน COMPLETED)
6. (optional) `/checkout/[orderId]` + Cart
