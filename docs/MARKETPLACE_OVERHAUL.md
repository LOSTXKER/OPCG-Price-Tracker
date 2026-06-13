# Marketplace & Seller Center -- System Overhaul Plan

## สถานะปัจจุบัน (As-Is)

### ปัญหาหลัก

1. **ไม่มี Seller Center** -- ผู้ขายไม่มีหน้าจัดการร้านค้ากลาง ต้องไปที่ `/marketplace/create` เพื่อลงขาย แต่ไม่สามารถแก้ไข/จัดการ listing ที่ลงไปแล้วจาก UI ได้ (API PATCH/DELETE มีแต่ไม่มีหน้า)
2. **ไม่มี Order Management** -- ผู้ขายเห็น order เฉพาะใน chat เท่านั้น ไม่มีหน้ารวม order
3. **ฟอร์มซ้ำซ้อน** -- มีทั้ง `listing-form.tsx` (react-hook-form standalone) และ `create-wizard/` (4-step wizard) ทำสิ่งเดียวกัน แต่ `listing-form.tsx` ไม่ได้ถูกใช้
4. **Chat ทำหน้าที่มากเกินไป** -- Chat เป็นที่เดียวที่ผู้ซื้อ/ขายจัดการ offers, orders, tracking ทั้งหมด
5. **ไม่มี Buyer Order History** -- ผู้ซื้อไม่มีหน้าดูประวัติการสั่งซื้อ/สถานะ order
6. **ไม่มี Cart / Checkout** -- ซื้อได้ทีละรายการเท่านั้น (ปัจจุบัน Buy Now สร้าง order ทันที)

### ไฟล์ที่เกี่ยวข้องปัจจุบัน

```
src/app/marketplace/
├── page.tsx                     # Browse listings
├── loading.tsx                  # Skeleton
├── create/
│   ├── page.tsx                 # Create listing (server shell)
│   └── create-client.tsx        # Wizard orchestrator
└── [listingId]/
    ├── page.tsx                 # Listing detail
    ├── image-gallery.tsx        # Photo gallery
    ├── listing-actions.tsx      # Buy/Offer buttons
    ├── save-button.tsx          # Bookmark toggle
    └── view-tracker.tsx         # View count

src/app/messages/
├── page.tsx                     # Chat inbox
└── [listingId]/page.tsx         # Chat for one listing

src/components/marketplace/
├── marketplace-browse.tsx       # Browse UI (filters, search, grid)
├── listing-card.tsx             # Listing tile
├── listing-form.tsx             # ❌ Unused standalone form
├── review-section.tsx           # Reviews display
├── seller-profile-card.tsx      # Seller summary card
└── create-wizard/               # 4-step wizard
    ├── index.ts
    ├── wizard-layout.tsx
    ├── step-card-select.tsx
    ├── step-pricing.tsx
    ├── step-shipping.tsx
    └── step-preview.tsx

src/app/api/
├── listings/
│   ├── route.ts                 # GET (browse) + POST (create)
│   └── [id]/
│       ├── route.ts             # PATCH + DELETE (no GET)
│       ├── save/route.ts        # POST toggle bookmark
│       └── view/route.ts        # POST increment view
├── offers/
│   ├── route.ts                 # POST create offer
│   └── [id]/route.ts            # PATCH (accept/reject/cancel/counter)
├── orders/
│   ├── route.ts                 # POST buy-now
│   └── [id]/route.ts            # GET + PATCH (status transitions)
├── messages/
│   ├── route.ts                 # GET + POST messages
│   ├── conversations/route.ts   # GET conversation list
│   └── unread-count/route.ts    # GET unread count
└── reviews/route.ts             # POST submit review
```

---

## สิ่งที่จะสร้าง (To-Be)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BUYER SIDE                            │
│                                                              │
│  /marketplace          Browse & search listings              │
│  /marketplace/[id]     Product detail, buy/offer             │
│  /checkout/[orderId]   Checkout & payment (future)           │
│  /orders               My purchases list                    │
│  /orders/[id]          Order detail & tracking               │
│  /messages             Chat with sellers                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                       SELLER SIDE                            │
│                                                              │
│  /seller               Dashboard (stats, quick actions)      │
│  /seller/listings      Manage all listings                   │
│  /seller/listings/new  Create listing (wizard)               │
│  /seller/listings/[id] Edit listing                          │
│  /seller/orders        Manage incoming orders                │
│  /seller/reviews       View reviews received                 │
│  /seller/settings      Shop settings & shipping defaults     │
│  /messages             Chat with buyers (shared)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Seller Center

### 1.1 Seller Dashboard (`/seller`)

**Layout:** Sidebar navigation + main content area (like Shopee Seller Centre)

**Sidebar menu:**

- ภาพรวม (Dashboard)
- สินค้าของฉัน (My Listings)
- คำสั่งซื้อ (Orders)
- รีวิว (Reviews)
- ตั้งค่าร้าน (Shop Settings)

**Dashboard content:**

- Summary cards: รายได้เดือนนี้, สินค้าที่ลงขาย, คำสั่งซื้อที่ต้องดำเนินการ, คะแนนรีวิว
- กราฟยอดขายรายเดือน (optional, Phase 2+)
- รายการที่ต้องดำเนินการ: orders ใหม่, offers ที่รอตอบ
- Quick actions: ลงขายสินค้าใหม่, ดู orders

**Files:**

```
src/app/seller/
├── layout.tsx               # Sidebar layout for all /seller pages
├── page.tsx                 # Dashboard
└── components/
    └── seller-sidebar.tsx   # Sidebar navigation component
```

**API (new):**

```
GET /api/seller/stats       # Dashboard stats (revenue, listing count, pending orders, rating)
```

### 1.2 Listings Management (`/seller/listings`)

**Features:**

- ตารางแสดง listings ทั้งหมดของตัวเอง
- Filter by status: Active, Sold, Reserved, Expired, Cancelled
- Search by card name/code
- Bulk actions: deactivate, delete
- แต่ละแถว: รูป, ชื่อการ์ด, ราคา, สถาพ, สถานะ, views, วันที่สร้าง, actions (edit/delete/deactivate)

**Create listing (`/seller/listings/new`):**

- ย้ายจาก `/marketplace/create` มาที่นี่
- ใช้ wizard เดิม (refactored) -- ไม่ต้องสร้างใหม่
- Redirect `/marketplace/create` -> `/seller/listings/new`

**Edit listing (`/seller/listings/[id]`):**

- ใช้ wizard/form เดิม แต่ prefill ข้อมูลจาก listing ที่มีอยู่
- PATCH `/api/listings/[id]` เหมือนเดิม

**Files:**

```
src/app/seller/listings/
├── page.tsx                 # Listings table
├── new/page.tsx             # Create (reuse wizard)
└── [id]/page.tsx            # Edit listing
```

**API (reuse existing):**

```
GET  /api/listings?userId=me&status=...    # Add userId filter to existing GET
PATCH /api/listings/[id]                   # Already exists
DELETE /api/listings/[id]                  # Already exists
```

### 1.3 Order Management (`/seller/orders`)

**Features (Shopee-style tabs):**

- Tabs: ทั้งหมด | รอชำระ | ชำระแล้ว | จัดส่งแล้ว | สำเร็จ | ยกเลิก
- แต่ละ order card: ข้อมูลผู้ซื้อ, สินค้า, ราคา, สถานะ, ปุ่ม action
- Actions per status:
  - `AWAITING_PAYMENT` → ยกเลิก
  - `PAID` → จัดส่ง (กรอก tracking number)
  - `SHIPPED` → รอผู้ซื้อยืนยัน
  - `DELIVERED` → auto-complete after X days
- ปุ่ม Chat กับผู้ซื้อจากในหน้า order

**Files:**

```
src/app/seller/orders/
├── page.tsx                 # Orders list with tabs
└── [id]/page.tsx            # Order detail (optional, can be modal)
```

**API (new):**

```
GET /api/seller/orders?status=...&page=...    # Seller's orders
```

### 1.4 Reviews (`/seller/reviews`)

**Features:**

- แสดงรีวิวทั้งหมดที่ได้รับ
- คะแนนเฉลี่ย + จำนวนรีวิว
- Filter by rating (5,4,3,2,1 ดาว)

**Files:**

```
src/app/seller/reviews/page.tsx
```

**API (new):**

```
GET /api/seller/reviews?page=...&rating=...
```

### 1.5 Shop Settings (`/seller/settings`)

**Features:**

- Default shipping methods
- Default location
- Shop description/bio
- Notification preferences (marketplace-related)

**Files:**

```
src/app/seller/settings/page.tsx
```

---

## Phase 2: Buyer Side Improvements

### 2.1 My Orders (`/orders`)

**Features (Shopee-style tabs):**

- Tabs: ทั้งหมด | รอชำระ | รอจัดส่ง | กำลังจัดส่ง | สำเร็จ | ยกเลิก
- แต่ละ order: รูปสินค้า, ชื่อ, ราคา, สถานะ, ปุ่ม action
- Actions per status:
  - `AWAITING_PAYMENT` → ชำระเงิน (future) / ยกเลิก
  - `SHIPPED` → ยืนยันรับสินค้า
  - `DELIVERED` / `COMPLETED` → รีวิวผู้ขาย

**Files:**

```
src/app/orders/
├── page.tsx                 # My purchases list
└── [id]/page.tsx            # Order detail & tracking
```

**API (new):**

```
GET /api/orders?role=buyer&status=...&page=...    # Buyer's orders
```

### 2.2 Listing Detail Improvements (`/marketplace/[listingId]`)

**Shopee-style elements to add:**

- จำนวนสินค้าที่ขายได้ ("ขายแล้ว X ชิ้น")
- ปุ่ม "เพิ่มในรายการที่สนใจ" (SavedListing -- มีแล้ว)
- Review summary ที่เด่นกว่าเดิม
- ปุ่ม Chat ผู้ขาย (มีแล้ว)
- Related listings ดีขึ้น

### 2.3 Saved Listings (`/saved`)

**Features:**

- แสดงรายการที่บันทึกไว้
- กดเข้าไปดู listing detail
- ลบออกจากรายการ

**Files:**

```
src/app/saved/page.tsx
```

---

## Phase 3: Chat Flow Improvements

### 3.1 ปรับ Chat ให้เป็น Support Channel

**ปัจจุบัน:** Chat ทำหน้าที่ทั้ง messaging, offer negotiation, order tracking
**เป้าหมาย:** Chat ยังคงเป็นช่องทางสื่อสาร แต่ offer/order management ย้ายไป Seller Center และ My Orders

**Changes:**

- Chat ยังแสดง offer cards และ order updates (เป็น timeline)
- แต่ **actions หลัก** (accept offer, ship order, confirm delivery) ย้ายไปหน้า orders
- Chat เน้นการสนทนาและส่งรูปเพิ่มเติม
- Quick actions ใน chat: "ดูคำสั่งซื้อ" → link ไป `/orders/[id]` หรือ `/seller/orders/[id]`

### 3.2 Order Status Flow (Shopee Reference)

```
  Buyer                                      Seller
    │                                          │
    ├─ Browse & Buy Now ─────────────────────► │
    │  or Accept Offer                         │
    │                                          │
    │  ┌─────────────────────┐                 │
    │  │  AWAITING_PAYMENT   │ ◄── Order created
    │  └────────┬────────────┘                 │
    │           │ (ชำระเงิน)                    │
    │  ┌────────▼────────────┐                 │
    │  │       PAID          │ ──► แจ้งเตือนผู้ขาย
    │  └────────┬────────────┘                 │
    │           │                    จัดส่ง + tracking
    │  ┌────────▼────────────┐                 │
    │  │      SHIPPED        │ ◄── ผู้ขายกรอก tracking
    │  └────────┬────────────┘                 │
    │           │ (ยืนยันรับ / auto 7 วัน)      │
    │  ┌────────▼────────────┐                 │
    │  │     DELIVERED       │                 │
    │  └────────┬────────────┘                 │
    │           │ (auto 3 วัน)                  │
    │  ┌────────▼────────────┐                 │
    │  │     COMPLETED       │ ──► เงินเข้าผู้ขาย
    │  └─────────────────────┘     (future: escrow release)
    │                                          │
    │  ┌─────────────────────┐                 │
    │  │     CANCELLED       │ ◄── ยกเลิกได้ก่อน SHIPPED
    │  └─────────────────────┘                 │
    │                                          │
    │  ┌─────────────────────┐                 │
    │  │     DISPUTED        │ ◄── ผู้ซื้อร้องเรียน
    │  └─────────────────────┘     (future: mediation)
```

---

## Phase 4: Refactoring

### 4.1 ลบไฟล์ซ้ำซ้อน


| ไฟล์                                                 | Action                                | เหตุผล                                             |
| ---------------------------------------------------- | ------------------------------------- | -------------------------------------------------- |
| `src/components/marketplace/listing-form.tsx`        | **ลบ**                                | ไม่ถูกใช้ ซ้ำกับ wizard                            |
| `src/components/marketplace/seller-profile-card.tsx` | **ลบ**                                | ไม่ถูกใช้ใน page.tsx แล้ว (inline seller info แทน) |
| `src/app/marketplace/create/`                        | **Redirect** → `/seller/listings/new` | ย้ายไป Seller Center                               |
| `src/app/profile/(me)/marketplace/`                  | **ลบ**                                | Redirect to /settings, ไม่มีประโยชน์               |


### 4.2 ย้าย/Consolidate Components

```
src/components/marketplace/        → คงไว้สำหรับ buyer-facing components
src/components/seller/             → NEW: seller center components
src/components/orders/             → NEW: shared order components (buyer & seller)
```

**Shared components ที่ควรสร้าง:**

- `OrderStatusBadge` -- แสดงสถานะ order เป็น badge สี
- `OrderCard` -- แสดงข้อมูล order ในรูปแบบ card (ใช้ทั้ง buyer และ seller)
- `OrderTimeline` -- timeline ของ order events (reuse จาก `order-status-tracker.tsx`)
- `ListingTable` -- ตาราง listings สำหรับ seller center
- `StatsCard` -- card แสดงตัวเลขสถิติ

### 4.3 API Consolidation

**ปัจจุบัน:** API routes กระจายอยู่ต่างที่ ไม่มี role-based filtering

**เป้าหมาย:**

```
# Listings -- เพิ่ม filter
GET /api/listings?userId=me             # Seller's own listings

# Orders -- เพิ่ม role filter  
GET /api/orders?role=buyer&status=...   # NEW: Buyer's orders list
GET /api/orders?role=seller&status=...  # NEW: Seller's orders list

# Seller stats -- NEW
GET /api/seller/stats                   # Dashboard aggregates

# Reviews -- เพิ่ม GET
GET /api/reviews?userId=...             # Reviews for a seller
```

### 4.4 Database Changes

**ไม่ต้องเปลี่ยน schema** -- models ปัจจุบัน (Listing, Order, Offer, Message, Review, SavedListing) ครบถ้วนแล้ว

**อาจเพิ่มในอนาคต:**

- `ShopSettings` model -- default shipping, bio, policies
- `OrderEvent` model -- audit log ของ order status changes
- `Cart` / `CartItem` model -- ถ้าต้องการระบบตะกร้า

---

## Routing Summary

### Navigation (Top Bar)

```
┌────────────────────────────────────────────────────────┐
│  Meecard   ภาพรวม  ชุดการ์ด  ซื้อขาย ▼  เครื่องมือ ▼  │
│                                │                        │
│                                ├─ ตลาด (Browse)         │
│                                ├─ คำสั่งซื้อของฉัน       │
│                                ├─ รายการที่บันทึก        │
│                                └─ ศูนย์ผู้ขาย           │
└────────────────────────────────────────────────────────┘
```

### Full Route Map

```
/marketplace                    # Browse listings (buyer)
/marketplace/[id]               # Listing detail (buyer)

/orders                         # My purchases (buyer)
/orders/[id]                    # Purchase detail (buyer)

/saved                          # Saved listings (buyer)

/seller                         # Seller dashboard
/seller/listings                # Manage listings
/seller/listings/new            # Create listing
/seller/listings/[id]           # Edit listing
/seller/orders                  # Manage orders (seller)
/seller/orders/[id]             # Order detail (seller)
/seller/reviews                 # Reviews received
/seller/settings                # Shop settings

/messages                       # Chat (shared, buyer & seller)
/messages/[listingId]           # Chat thread
```

---

## Implementation Priority

### Sprint 1: Foundation (1-2 weeks)

1. Seller Center layout (`/seller/layout.tsx` + sidebar)
2. Seller Dashboard (`/seller/page.tsx` + stats API)
3. Listings Management (`/seller/listings` -- table, edit, delete)
4. Move create listing to `/seller/listings/new`

### Sprint 2: Order Management (1-2 weeks)

1. Seller Orders page (`/seller/orders` + API)
2. Buyer Orders page (`/orders` + API)
3. Order detail pages (buyer & seller views)
4. Shipping/tracking input for seller

### Sprint 3: Polish & Integration (1 week)

1. Seller Reviews page
2. Saved Listings page (`/saved`)
3. Chat simplification (link to order pages)
4. Navigation updates (top bar dropdown)

### Sprint 4: Cleanup (1 week)

1. Delete unused files (`listing-form.tsx`, `seller-profile-card.tsx`)
2. Redirect `/marketplace/create` → `/seller/listings/new`
3. Redirect old profile marketplace pages
4. Test end-to-end flows

---

## E2E Flow: ซื้อขายตั้งแต่ต้นจนจบ (Shopee Reference)

### ผู้ขาย: ลงขายสินค้า

1. เข้า `/seller` → กด "ลงขายสินค้า"
2. Wizard: เลือกการ์ด → ตั้งราคา/สภาพ → จัดส่ง/อัปโหลดรูปจริง → Preview → ลงประกาศ
3. Listing ปรากฏที่ `/marketplace` สถานะ ACTIVE

### ผู้ซื้อ: ซื้อสินค้า

1. Browse `/marketplace` → กดเข้า listing detail
2. เลือก: **Chat** (สอบถาม) / **ซื้อตามราคา** (Buy Now) / **เสนอราคา** (Make Offer)

### Flow A: Buy Now

1. ผู้ซื้อกด "ซื้อตามราคา" → สร้าง Order (AWAITING_PAYMENT)
2. Listing เปลี่ยนเป็น RESERVED
3. ผู้ซื้อเห็น order ที่ `/orders` → ชำระเงิน (future: payment gateway)
4. Order → PAID → แจ้งเตือนผู้ขาย
5. ผู้ขายเห็น order ที่ `/seller/orders` → กรอก tracking → กดจัดส่ง
6. Order → SHIPPED → ผู้ซื้อเห็น tracking ที่ `/orders/[id]`
7. ผู้ซื้อยืนยันรับสินค้า → DELIVERED → COMPLETED
8. ผู้ซื้อรีวิวผู้ขาย

### Flow B: Offer → Negotiate → Buy

1. ผู้ซื้อกด "เสนอราคา" → กรอกราคาที่ต้องการ + หมายเหตุ
2. Offer ปรากฏใน Chat + แจ้งเตือนผู้ขาย
3. ผู้ขายเลือก: Accept / Reject / Counter
4. ถ้า Accept → สร้าง Order (เหมือน Buy Now ต่อจากนี้)
5. ถ้า Counter → ผู้ซื้อเห็น counter offer → Accept/Reject/Counter กลับ
6. ถ้า Reject → จบ (ผู้ซื้อเสนอใหม่ได้)

### ผู้ขาย: จัดการ Orders

1. เข้า `/seller/orders`
2. Tab "ชำระแล้ว" → เห็น orders ที่ต้องจัดส่ง
3. กด order → กรอก tracking number + วิธีจัดส่ง → กด "จัดส่งแล้ว"
4. Tab "จัดส่งแล้ว" → รอผู้ซื้อยืนยัน
5. Tab "สำเร็จ" → ดูรายการที่เสร็จสมบูรณ์

---

## Tech Notes

### Shared Layout Pattern (Seller Center)

```tsx
// src/app/seller/layout.tsx
export default function SellerLayout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <SellerSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

### Stats API Pattern

```tsx
// GET /api/seller/stats
{
  totalListings: number,
  activeListings: number,
  pendingOrders: number,
  completedOrders: number,
  totalRevenue: number,        // sum of completed order priceThb
  averageRating: number | null,
  reviewCount: number,
  pendingOffers: number,
  recentOrders: Order[],       // latest 5
}
```

### Order List API Pattern

```tsx
// GET /api/orders?role=buyer|seller&status=...&page=1&limit=20
{
  orders: [{
    id, listing: { card, photos },
    buyer/seller: { displayName, avatarUrl },
    priceThb, status, trackingNumber,
    createdAt, paidAt, shippedAt, completedAt
  }],
  total, page, limit, totalPages
}
```

