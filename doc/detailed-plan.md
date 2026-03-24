# TCG Price Tracker (Thailand) - Detailed Business & Feature Plan

> เอกสารนี้เป็นแผนธุรกิจและฟีเจอร์ฉบับละเอียด สำหรับทีมพัฒนา 2-3 คน
> เน้นเจาะตลาด One Piece Card Game (JP) ในไทยเป็นจุดเริ่มต้น
> โมเดลหาเงินหลัก: Freemium, Marketplace Commission

---

## 1. Vision & Mission

### Vision

เป็น **แพลตฟอร์มอ้างอิงราคาการ์ดเกมอันดับ 1 ของไทย** ที่ผู้เล่น นักสะสม และร้านค้า เปิดดูทุกวันก่อนซื้อ-ขาย

### Mission

สร้าง "ราคากลาง" ที่โปร่งใสและเชื่อถือได้ เพื่อลดปัญหาการปั่นราคาในคอมมูนิตี้ TCG ไทย พร้อมเครื่องมือจัดการคอลเลกชันที่ใช้ง่ายที่สุดในตลาด

### เป้าหมายตามระยะเวลา

| ระยะ | เป้าหมาย |
|------|----------|
| 0-3 เดือน | ปล่อย MVP ที่ครอบคลุมการ์ด OPCG JP ทั้งหมด มีราคากลางอัปเดตรายวัน |
| 3-6 เดือน | มี User ลงทะเบียน 3,000+ คน เปิดระบบ Portfolio, Pro/Pro+ membership |
| 6-9 เดือน | เปิด Marketplace ซื้อขายการ์ด + เริ่มมีรายได้จาก Marketplace Commission + Pro subscriptions |
| 9-12 เดือน | ขยายไปรองรับ Pokemon TCG มี Active users 10,000+ ต่อเดือน + เพิ่ม Mercari JP data |
| 12-18 เดือน | กลายเป็น go-to platform ของ TCG ไทย รายได้ 120,000-200,000 บาท/เดือน + เพิ่มราคาสากล (Cardmarket/TCGPlayer) |

### Positioning

เริ่มจากเป็น **เครื่องมืออ้างอิงราคา (Neutral Price Tool)** แล้วขยายเป็น **Marketplace ซื้อขายการ์ด** ที่ทุกฝ่ายใช้ร่วมกันได้ -- ทั้งผู้ซื้อ ผู้ขาย และร้านค้า ข้อมูลราคาที่แม่นยำคือ Unfair advantage ที่ทำให้ Marketplace ของเราน่าเชื่อถือกว่าการซื้อขายในกลุ่ม Facebook

### Brand Mascot: Kuma (くま)

**ชื่อ:** Kuma (くま = หมี ในภาษาญี่ปุ่น)
**คอนเซปต์:** หมีน้อยนักสะสมการ์ด -- ถือการ์ดในมือ สวม hoodie มี backpack ใส่การ์ด
**สไตล์:** Cute / Chibi สไตล์ญี่ปุ่น เส้นหนา สีอุ่น ใช้ได้ทั้ง Light/Dark mode

**ทำไมหมี:**
- "Bear market" ในภาษาการเงิน = ราคาลง -- เข้ากับ Price Tracker ที่ติดตามราคาขึ้น-ลง
- "くま" เป็นภาษาญี่ปุ่น เข้ากับ OPCG ที่เป็นการ์ดญี่ปุ่น
- หมีเป็นสัตว์ที่ดูน่าเชื่อถือ อบอุ่น เป็นมิตร -- ตรงกับ brand personality ที่ต้องการ

#### อารมณ์ตามสภาพตลาด (แสดงที่หน้าแรก)

| สภาพตลาด | อารมณ์ Kuma |
|----------|-----------|
| ราคาขึ้นเยอะ (Bull) | ยิ้มกว้าง ตาเป็นประกาย ถือการ์ดโชว์ |
| ราคาทรงตัว | นั่งจิบชา สบาย ๆ |
| ราคาลงหนัก (Bear) | กอดการ์ดแน่น ตาเป็นวงกลม |
| ชุดใหม่เพิ่งออก | ฉีกซอง booster ตื่นเต้น |

#### การใช้งาน Kuma ทั่วแพลตฟอร์ม

**Loading & Empty States:**
- Loading: Kuma กำลังค้นหาการ์ดในกอง
- ไม่มีผลลัพธ์: Kuma ยักไหล่ "ไม่เจอการ์ดที่ค้นหา"
- Portfolio ว่าง: Kuma มือเปล่า "เพิ่มการ์ดใบแรกให้ Kuma ถือหน่อย!"
- Error 404: Kuma หลงทาง ถือแผนที่กลับหัว

**Honey System (Points):**
- แทนที่จะเรียก "Points" เรียกว่า **"Honey" (น้ำผึ้ง)** ให้เข้ากับ theme หมี
- Daily Check-in: "Kuma เก็บน้ำผึ้งให้คุณแล้ว! +10 Honey"
- เพิ่มการ์ด Portfolio: "Kuma จดราคาให้แล้ว! +10 Honey"
- แลกรางวัล: ร้าน **"Honey Shop"**

**Price Alerts:**
- ราคาถึงเป้า: "Kuma แจ้งข่าวดี! [การ์ด] ลงมาถึง [ราคา] แล้ว!"
- Weekly digest: "สรุปจาก Kuma ประจำสัปดาห์"

**Achievements / Badges:**

| Badge | เงื่อนไข | ภาพ Kuma |
|-------|---------|---------|
| Kuma Collector | สะสมการ์ดครบ 10 ใบ | หมีถือถุงใบเล็ก |
| Kuma Hoarder | สะสมครบ 100 ใบ | หมีกอดกองการ์ดมหึมา |
| Kuma Scout | เพิ่มการ์ดพร้อมราคาซื้อเข้า Portfolio 50 ครั้ง | หมีใส่แว่นขยาย |
| Kuma Bestie | Login 30 วันติด | หมีกอดหัวใจ |
| Kuma Trader | ขายของบน Marketplace 10 ครั้ง | หมีใส่แว่นตานักธุรกิจ |

**Seasonal Themes (เปลี่ยนตามเทศกาล):**
- ปีใหม่: Kuma ใส่ชุดกิโมโน
- สงกรานต์: Kuma ถือปืนฉีดน้ำ
- Halloween: Kuma แต่งผี
- ชุดการ์ดใหม่ออก: Kuma แต่งตาม Leader ของชุดนั้น

---

## 2. Target Audience & User Personas

### Persona A: Casual Collector (นักสะสมทั่วไป)

- **ใครคือพวกเขา:** แฟนวันพีชที่ซื้อการ์ดเป็นงานอดิเรก ไม่ได้เล่นแข่งจริงจัง
- **Pain Points:**
  - ไม่รู้ราคาการ์ดที่ถืออยู่ว่าตอนนี้มูลค่าเท่าไหร่
  - กลัวโดนปั่นราคาเวลาซื้อจากกลุ่ม Facebook
  - อยากรู้ว่าการ์ดตัวไหนกำลัง "ขึ้น" เพื่อตัดสินใจซื้อ/ขาย
- **ฟีเจอร์ที่ต้องมี:** ดูราคา, กราฟราคาย้อนหลัง, แปลงเงินบาท
- **แนวโน้มการจ่ายเงิน:** ต่ำ -- ใช้ Free tier เป็นหลัก แต่เป็น volume สูง

### Persona B: Competitive Player (นักเล่นแข่งขัน)

- **ใครคือพวกเขา:** เล่นทัวร์นาเมนต์ ติดตามเมต้าอย่างใกล้ชิด
- **Pain Points:**
  - ต้องการรู้ราคาการ์ดที่ใช้สร้าง Deck เพื่อคำนวณงบ
  - ต้องการติดตามว่าการ์ดตัวไหนราคาพุ่งเพราะเมต้าเปลี่ยน
  - ต้องการเปรียบเทียบราคา JP vs ราคาในไทย
- **ฟีเจอร์ที่ต้องมี:** Deck Builder (คำนวณราคา Deck), Watchlist, Price Alerts
- **แนวโน้มการจ่ายเงิน:** ปานกลาง -- ยอมจ่าย Pro ถ้า Alert ช่วยซื้อการ์ดได้ถูกลง

### Persona C: Investor / Trader (นักลงทุนการ์ด)

- **ใครคือพวกเขา:** ซื้อการ์ดเป็นล็อตเพื่อเก็งกำไร หรือรับ Pre-order แล้วขายต่อ
- **Pain Points:**
  - ต้องการข้อมูลราคาย้อนหลังลึก เพื่อวิเคราะห์ว่าการ์ดตัวไหนมีแนวโน้มขึ้น
  - ต้องการ Portfolio ที่คำนวณกำไร/ขาดทุนให้อัตโนมัติ
  - ต้องการ Alert แบบเรียลไทม์เมื่อการ์ดถึงราคาเป้าหมาย
- **ฟีเจอร์ที่ต้องมี:** Portfolio ขั้นสูง, Price History ไม่จำกัด, Export ข้อมูล
- **แนวโน้มการจ่ายเงิน:** สูง -- กลุ่มเป้าหมายหลักของ Pro membership

### Persona D: Shop Owner (ร้านการ์ด)

- **ใครคือพวกเขา:** เจ้าของร้านการ์ดในไทย ทั้งออนไลน์และหน้าร้าน
- **Pain Points:**
  - ต้องตั้งราคาขายให้แข่งขันได้ แต่ไม่มีเครื่องมืออ้างอิง
  - เสียเวลาเช็คราคาจาก Yuyu-tei ด้วยตัวเองทุกวัน
  - อยากมีช่องทางโปรโมทร้านให้เข้าถึงผู้ซื้อกลุ่มเป้าหมาย
- **ฟีเจอร์ที่ต้องมี:** Bulk price lookup, Marketplace listing, Auto pricing, Shop Profile
- **แนวโน้มการจ่ายเงิน:** ปานกลาง -- สมัคร Pro+ เพื่อได้เครื่องมือร้านค้าและ Fee ลด

---

## 3. Competitive Landscape

### 3.1 คู่แข่งหลัก -- วิเคราะห์ละเอียด

#### TCG Thailand (tcgthailand.com) -- คู่แข่งตรง Marketplace

| หัวข้อ | รายละเอียด |
|-------|-----------|
| **โมเดล** | ตลาดซื้อ-ขาย-ประมูลการ์ดเกม (Marketplace) |
| **เกมที่รองรับ** | Pokemon, Yu-Gi-Oh, Magic, Vanguard, Dragon Ball, Lorcana, **OPCG (มี listing น้อยมาก)** |
| **ค่าธรรมเนียม** | **5%** (รวมค่า payment gateway) |
| **Escrow** | มี -- แอดมินถือเงิน จนผู้ซื้อกดยืนยันรับของ |
| **ถอนเงิน** | Manual -- แอดมินโอนให้ภายใน 24 ชม. |
| **ประมูล** | มีระบบประมูล |
| **Dispute** | ผู้ซื้อกด "สินค้ามีปัญหา" → แอดมินไกล่เกลี่ย |

**จุดอ่อนหลักของ TCG Thailand:**

| จุดอ่อน | ผลกระทบ | โอกาสของเรา |
|---------|---------|------------|
| ไม่มีราคากลางอ้างอิง | ผู้ซื้อไม่รู้ว่าราคาแพงเกินไหม | **Thai Market Price** แนะนำราคาอัตโนมัติ |
| ไม่มีกราฟราคาย้อนหลัง | ดู trend ไม่ได้ | กราฟ 7d/30d/90d/1y/All-time |
| ไม่แยก Variant (SR/SEC/Parallel) | การ์ดเวอร์ชันต่างปนกัน ราคาต่างกัน 50 เท่า | Variant system แยกชัดทุกเวอร์ชัน |
| ไม่มี Portfolio / Price Alert | ไม่มีเครื่องมือติดตาม | Portfolio + Watchlist + Alert ครบ |
| ค่าส่งแยก ไม่แสดงราคารวม | ของ ฿20 ค่าส่ง ฿40 = ดูถูกแต่จ่ายแพง | แสดง "ราคารวมค่าส่ง" เรียงตาม total price |
| รูปการ์ดมี watermark "SAMPLE" | ดูไม่สวย ไม่น่าเชื่อถือ | รูป HD จาก Bandai ไม่มี watermark |
| ถอนเงิน manual 24 ชม. | ร้านค้าต้องรอ ไม่สะดวก | ระบบถอนเงินเร็วกว่า |
| ค้นหาด้วย Card ID ไม่ได้ | หาการ์ดเฉพาะใบยาก | ค้นหา OP01-121, ชื่อ, filter ครบ |
| ไม่มี "Best Deal" indicator | ไม่รู้ว่า listing ไหนคุ้มที่สุด | Badge "Best Deal" เมื่อต่ำกว่าราคากลาง 10%+ |
| ไม่มี Auto Pricing สำหรับ Seller | ร้านค้าต้องเช็คราคาเอง | แนะนำราคาจาก Thai Market Price |
| Design เหมือน e-commerce ทั่วไป | ไม่มี identity ไม่น่าจดจำ | Kuma branding + UI เฉพาะ card collector |

#### กลุ่ม Facebook OPCG ไทย -- Volume สูงสุด

| จุดแข็ง | จุดอ่อน |
|--------|--------|
| ฐานสมาชิกใหญ่ ซื้อขายกันตรง | ไม่มีราคากลาง ปั่นราคาง่าย |
| ไม่มีค่าธรรมเนียม | ไม่มี escrow / ระบบป้องกัน -- โดนโกงง่าย |
| โพสต์ง่าย รูป+ราคา | ค้นหาย้อนหลังไม่ได้ หาการ์ดเฉพาะใบยาก |
| คุยต่อรองได้เลย | ไม่มี tracking / ไม่มี dispute resolution |

#### Shopee / Lazada -- e-commerce ทั่วไป

| จุดแข็ง | จุดอ่อน |
|--------|--------|
| คนไทยคุ้นเคย ระบบครบ | ค่า fee สูง (6-15%) |
| Escrow + ระบบคืนเงิน | ไม่เข้าใจ TCG ไม่แยก variant |
| ฐานผู้ใช้มหาศาล | ไม่มี price reference / ไม่มี portfolio |

#### Benchmark ต่างประเทศ

| Platform | ประเทศ | Commission | จุดเด่น | ข้อจำกัดสำหรับไทย |
|----------|--------|-----------|---------|-----------------|
| **Magi** | ญี่ปุ่น | 8% | Escrow, Authentication, Anonymous shipping, Mystery packs | ภาษา JP เป็นหลัก ไม่รองรับไทย |
| **TCGPlayer** | US | 10-15% | Market Price อัตโนมัติ, Buyer/Seller Protection 100%, Payment จัดการให้ทั้งหมด | ไม่รองรับ OPCG JP ไม่เน้นเอเชีย |
| **Cardmarket** | EU | 5%+ | Private/Pro/Powerseller tiers, Trustee Service (escrow) | ภาษา EN ราคา EUR ไม่สะท้อนตลาดไทย |

### 3.2 จุดแข็งของเรา (Competitive Advantages)

1. **โฟกัสเฉพาะ OPCG** -- ลึกกว่าคู่แข่งที่กระจายหลายเกม
2. **Thai Market Price** -- คำนวณราคากลางไทยอัตโนมัติจากหลายแหล่ง (8-9 แหล่ง) ไม่มีใครทำตรงนี้
3. **Data-Backed Marketplace** -- ตลาดซื้อขายที่มี "Best Deal" badge, Auto Pricing, Sold Price history -- ต่างจากทุกคู่แข่งในไทย
4. **Portfolio → Marketplace Pipeline** -- ขายจาก Portfolio ได้ 1 คลิก (variant + condition + ราคาแนะนำ พร้อมใส่ให้)
5. **Price Watch → Buy** -- ตั้ง Alert ราคา → เมื่อมี Listing ถูกกว่าเป้า ส่ง notification + ลิงก์ซื้อทันที
6. **Sold Price Feedback Loop** -- ทุก transaction สำเร็จ → อัปเดต Thai Market Price → ยิ่งใช้ยิ่งแม่นยำ
7. **ค่าธรรมเนียม 5%** -- เท่ากับ TCG Thailand แต่ได้ฟีเจอร์เยอะกว่ามาก ถูกกว่า Magi (8%), TCGPlayer (10-15%)
8. **Kuma Branding** -- มาสคอตจำง่าย สร้าง community engagement ผ่าน Honey system
9. **ความเร็ว** -- ทีมเล็ก ปรับตัวเร็ว ซัพพอร์ตคอมมูนิตี้ได้ใกล้ชิด

### 3.3 Positioning Map

```
                  ข้อมูลละเอียด (Data Depth)
                         ^
                         |
          Yuyu-tei       |    [เรา - เป้าหมาย]
              *          |         ★
                         |
   ------ไม่เน้นไทย------+-------เน้นตลาดไทย------>
                         |
       TCGplayer/Magi    |    TCG Thailand
              *          |         *
                         |    Facebook Groups
                         |         *
                  ข้อมูลตื้น (Data Shallow)
```

---

## 4. Feature Breakdown

### Phase 1 - MVP (เดือนที่ 1-3)

เป้าหมาย: **ปล่อยให้ใช้ได้จริง** มีข้อมูลราคาการ์ด OPCG ครบทุกชุด อัปเดตรายวัน

#### 4.1.1 Card Database & Master Data

**แหล่งข้อมูลการ์ด (เรียงตามลำดับ priority):**

| แหล่ง | ข้อมูลที่ได้ | วิธีใช้ |
|-------|------------|--------|
| **punk-records** (GitHub JSON) | ชื่อ/stats/เอฟเฟกต์ หลายภาษา (EN/JP/TH) | Base data -- import ครั้งแรก |
| **vegapull** (CLI tool, Rust) | ข้อมูลครบ + รูป HD จาก Bandai Official | ดึง set ใหม่ + อัปเดตรูป |
| **OPTCG API** (optcgapi.com) | ข้อมูลการ์ด + ราคา + รูป, OP01-OP14+ | Backup / cross-check |

**รูปภาพ:**
- ดาวน์โหลดรูป HD จาก Bandai Official ผ่าน vegapull → เก็บใน Storage ตัวเอง (Supabase Storage / Cloudflare R2) → serve ผ่าน CDN
- ห้าม Hotlink จากเว็บ Bandai หรือแหล่งอื่นโดยเด็ดขาด
- ใส่ credit: "Card images © BANDAI" ในทุกหน้า
- พร้อม takedown ทันทีถ้าได้รับแจ้ง (DMCA-ready)

**Card Variant System (สำคัญ):**

การ์ด 1 ใบมีได้หลายเวอร์ชัน เช่น OP01-121 Roronoa Zoro มีทั้ง SR, SR Parallel, SEC, SEC Parallel, SEC Manga art -- แต่ละเวอร์ชันรูปต่างกัน ราคาต่างกันหลายเท่า ต้องแยกให้ชัดตั้งแต่ Database design

```
Database Schema:

cards (1 record ต่อ 1 การ์ด)
├── id: "OP01-121"
├── name_en: "Roronoa Zoro"
├── name_jp: "ロロノア・ゾロ"
├── set_id: "OP01"
├── card_type: "Character"
├── color: "Green"
├── power, counter, effect, ...
│
├── card_variants (1 card → หลาย variants)
│   ├── variant_id: "OP01-121_SR"
│   │   ├── rarity: "SR"
│   │   ├── variant_type: "regular"
│   │   ├── is_parallel: false
│   │   └── image_url: "/images/OP01-121_SR.webp"
│   │
│   ├── variant_id: "OP01-121_SR_P1"
│   │   ├── rarity: "SR"
│   │   ├── variant_type: "parallel"
│   │   ├── is_parallel: true
│   │   └── image_url: "/images/OP01-121_SR_P1.webp"
│   │
│   ├── variant_id: "OP01-121_SEC"
│   │   ├── rarity: "SEC"
│   │   ├── variant_type: "regular"
│   │   └── image_url: "/images/OP01-121_SEC.webp"
│   │
│   └── variant_id: "OP01-121_SEC_MANGA"
│       ├── rarity: "SEC"
│       ├── variant_type: "manga"
│       └── image_url: "/images/OP01-121_SEC_MANGA.webp"
│
└── prices (1 variant → หลายราคาจากหลายแหล่ง)
    ├── variant_id: "OP01-121_SEC" + source: "yuyutei" + price: ¥4,980
    ├── variant_id: "OP01-121_SEC" + source: "ebay_jp" + price: ¥4,500
    └── variant_id: "OP01-121_SEC" + source: "cardmarket" + price: €35
```

**Variant ID format:** `{SET}-{NUMBER}_{RARITY}_{VARIANT}`
- `OP01-121_SR` → SR ปกติ
- `OP01-121_SR_P1` → SR Parallel
- `OP01-121_SEC` → SEC ปกติ
- `OP01-121_SEC_P1` → SEC Parallel
- `OP01-121_SEC_MANGA` → SEC Manga art

**Auto-matching กับแหล่งราคา:**

แต่ละเว็บเรียกเวอร์ชันไม่เหมือนกัน ใช้ source_mappings table + auto-matching pipeline:

1. Parse card_id จากแหล่งข้อมูล (เช่น Yuyu-tei "OP01-121 SEC パラレル")
2. แยก rarity + ตรวจจับ keyword parallel ("パラレル", "Parallel", "Alt art")
3. Lookup จาก source_mappings table → ได้ variant_id
4. ถ้าแมทไม่ได้ → flag ให้ admin review (~5-10% ของทั้งหมด)

```
source_mappings table:
variant_id          | source    | source_identifier
OP01-121_SR_P1      | yuyutei   | "OP01-121 SR パラレル"
OP01-121_SEC        | ebay_jp   | "OP01-121 Secret Rare"
OP01-121_SEC        | cardmarket| "OP01-121 V.3"
```

**รองรับ:**
- การ์ดทุกชุดที่วางขายแล้ว (OP01 - ปัจจุบัน) + Starter Decks + Promo
- แยกประเภท: Leader, Character, Event, Stage, DON!!
- ทุก Variant: Regular, Parallel, SEC, Manga art, Special art
- เมื่อ set ใหม่ออก → รัน vegapull ดึง data + รูป → auto-generate variants → admin review

#### 4.1.2 Data Sources & Price Scraping

ใช้ข้อมูลหลายแหล่งเพื่อคำนวณ **"Thai Market Price"** อัตโนมัติ ไม่มี Manual Report จาก user

**MVP (เดือน 1-3) -- 2 แหล่ง:**

| แหล่ง | ประเภทราคา | วิธีได้มา | สกุลเงิน |
|-------|-----------|----------|----------|
| **Yuyu-tei** | ราคาร้าน JP (Retail Price) | Scraper วันละ 1 ครั้ง (02:00-03:00 JST) | JPY |
| **eBay JP** | ราคาซื้อขายจริง JP (Sold Price) | Official eBay Browse API | JPY |

**Phase 2-3 (เดือน 3-9) -- เพิ่มอีก 3 แหล่ง (รวม 5):**

| แหล่ง | ประเภทราคา | วิธีได้มา | สกุลเงิน |
|-------|-----------|----------|----------|
| **Portfolio Data** | ราคาที่คนไทยซื้อจริง | อัตโนมัติจาก user ใส่ราคาตอนเพิ่มการ์ดเข้า Portfolio | THB |
| **Marketplace Listing** | ราคาที่คนไทยตั้งขาย | อัตโนมัติจาก listing บนแพลตฟอร์ม | THB |
| **Marketplace Sold** | ราคาที่ขายสำเร็จในไทย | อัตโนมัติจาก transaction สำเร็จ | THB |

**Phase 3+ (เดือน 9-12) -- เพิ่มอีก 1-2 แหล่ง (รวม 6-7):**

| แหล่ง | ประเภทราคา | วิธีได้มา | สกุลเงิน |
|-------|-----------|----------|----------|
| **Mercari JP** | ราคาซื้อขายมือสอง JP | Scrape internal API | JPY |
| **Shopee** (ถ้าคุ้ม) | ราคาร้านไทยออนไลน์ | Scrape / Affiliate API | THB |

**Phase 4+ (เดือน 12+) -- ราคาอ้างอิงสากล เพิ่มอีก 2 แหล่ง (รวม 8-9):**

| แหล่ง | ประเภทราคา | วิธีได้มา | สกุลเงิน |
|-------|-----------|----------|----------|
| **Cardmarket** (EU) | ราคาตลาด EU | Third-party API (one-piece-api.com / cardmarket-api.com) | EUR |
| **TCGPlayer** (US) | ราคาตลาด US | Third-party API (one-piece-api.com / tcgpricelookup.com) | USD |

> Cardmarket/TCGPlayer Official API ไม่รับ developer key ใหม่แล้ว ใช้ Third-party API แทน
> one-piece-api.com มี Free tier (100 req/วัน) และ aggregate ทั้ง Cardmarket + TCGPlayer ในที่เดียว

**หลักปฏิบัติ Scraping:**
- Delay 1-2 วินาทีระหว่างแต่ละ Request
- ระบบ Alert เมื่อบอทหาข้อมูลไม่เจอ (UI เปลี่ยน)
- เมื่อการ์ดหมด (Sold Out) ใช้ราคาล่าสุดที่บันทึกไว้ + ติดป้าย [Out of Stock]
- เช็ค robots.txt + ใส่ Rate limit ตั้งแต่ต้น

#### 4.1.3 JPY-THB Currency Conversion

- ดึงอัตราแลกเปลี่ยนจริงจาก Exchange Rate API (อัปเดตวันละ 1 ครั้ง)
- แสดงราคาทั้งสองสกุลเงิน (JPY / THB) ในทุกหน้า
- ให้ User เลือกสกุลเงินหลักที่ต้องการแสดงได้

#### 4.1.4 Search & Filter

- ค้นหาด้วยชื่อการ์ด (ภาษาญี่ปุ่น / อังกฤษ / ไทย) หรือรหัสการ์ด (เช่น "OP01-121")
- Filter ตาม: ชุด (Booster), ความหายาก (C/UC/R/SR/SEC/L), ประเภท, สี, ช่วงราคา, Variant type (Regular/Parallel)
- Sort ตาม: ราคาสูง-ต่ำ, ราคาต่ำ-สูง, ราคาเปลี่ยนแปลงมากสุด, ใหม่ล่าสุด
- ผลการค้นหาแสดงรูป thumbnail ของ variant ที่ราคาสูงสุด (ดึงดูดสายสะสม) หรือ variant ปกติ

#### 4.1.5 Price History Graph

- กราฟเส้นแสดงราคาย้อนหลัง 7 วัน / 30 วัน (Free tier)
- แสดงจุดราคาสูงสุด-ต่ำสุดในช่วงเวลา
- Hover เพื่อดูราคา ณ วันที่ต้องการ

#### 4.1.6 Top Trending Dashboard (หน้าแรก)

- **Top Gainers**: การ์ด 10 ใบที่ราคาขึ้นมากสุดในรอบ 24 ชม.
- **Top Losers**: การ์ด 10 ใบที่ราคาลงมากสุด
- **Most Viewed**: การ์ดที่คนเข้าดูมากสุด
- **New Releases**: การ์ดจากชุดล่าสุด
- แสดง % การเปลี่ยนแปลงราคา พร้อมลูกศรขึ้น/ลง สีเขียว/แดง

#### 4.1.7 Card Detail Page

- รูปการ์ดขนาดใหญ่ (คลิกซูมได้) -- แสดงรูปตาม Variant ที่เลือก
- ข้อมูลครบ: ชื่อ, รหัส, ความหายาก, เอฟเฟกต์, สี, ค่า Power/Counter
- ปุ่ม "เพิ่มเข้า Portfolio" / "เพิ่มเข้า Watchlist" (สำหรับ User ที่ล็อกอิน)

**Variant Selector (เลือกเวอร์ชัน):**

```
OP01-121 Roronoa Zoro

เวอร์ชัน: [SR ▼]  [SR Parallel]  [SEC]  [SEC Parallel]  [SEC Manga]
           ↑ เลือกเวอร์ชัน → รูป + ราคาเปลี่ยนตาม

  SR:           ¥500 (~125 บาท)
  SR Parallel:  ¥1,200 (~300 บาท)
  SEC:          ¥5,000 (~1,250 บาท)     ← กำลังดูอยู่
  SEC Parallel: ¥15,000 (~3,750 บาท)
  SEC Manga:    ¥25,000 (~6,250 บาท)
```

**การแสดงราคาแบบ Multi-source (Tab layout) -- แสดงตาม Variant ที่เลือก:**

```
OP01-121 Roronoa Zoro (SEC)              ← Variant ที่เลือก

[ราคาไทย]  [ราคา JP]  [ราคาสากล]

── Tab ราคาไทย (default) ──────────────────
Thai Market Price: 1,150 บาท     ← ค่าเฉลี่ยถ่วงน้ำหนัก
├── Marketplace Sold:  1,100 บาท
├── Portfolio Avg:     1,080 บาท
└── Confidence: ●●●○ ข้อมูลเพียงพอ

── Tab ราคา JP ────────────────────────────
├── Yuyu-tei:        ¥4,980 (~1,245 บาท)
├── eBay JP Sold:    ¥4,500 (~1,125 บาท)
└── Mercari JP:      ¥4,200 (~1,050 บาท)  [Phase 3+]

── Tab ราคาสากล (Phase 4+) ────────────────
├── Cardmarket (EU): €35 (~1,330 บาท)
└── TCGPlayer (US):  $28 (~980 บาท)
```

- MVP: แสดงเฉพาะ Tab ราคา JP (Yuyu-tei + eBay)
- Phase 2+: เพิ่ม Tab ราคาไทย เมื่อมี Portfolio/Marketplace data
- Phase 4+: เพิ่ม Tab ราคาสากล (Cardmarket + TCGPlayer)
- กราฟราคาย้อนหลังแสดงทุกแหล่งซ้อนกัน (toggle เปิด/ปิดแต่ละเส้น)

#### 4.1.8 SEO & Performance

- Server-Side Rendering (SSR) สำหรับหน้ารายการการ์ดและหน้ารายละเอียด
- Meta tags, Open Graph, Structured Data สำหรับทุกหน้า
- Sitemap อัตโนมัติ เพื่อให้ Google index หน้าการ์ดทั้งหมด
- Target: "ราคาการ์ดวันพีช", "OPCG price", "การ์ด OP01 ราคา" ฯลฯ

#### 4.1.9 Admin Tools (MVP -- ไม่ต้องสร้างเอง)

ช่วง MVP ใช้เครื่องมือที่มีอยู่แล้ว ไม่ต้องสร้าง Admin Panel:

| งาน | ใช้เครื่องมือ | หมายเหตุ |
|-----|-------------|---------|
| ดู/แก้ข้อมูลใน DB | **Supabase Dashboard** หรือ **Prisma Studio** | มี GUI ดู table, แก้ record ได้เลย |
| Monitor scraper | **Cron job + LINE Notify** | แจ้งเตือนทันทีเมื่อ scrape ล้มเหลว / ดึงข้อมูลไม่ครบ |
| ดู analytics | **Supabase Dashboard** + SQL query ที่เซฟไว้ | จำนวน user, pageviews, ข้อมูลที่ดึงได้ |
| จัดการ user | **Supabase Auth Dashboard** | Ban/delete user, ดู user list |
| Import set ใหม่ | **CLI command** (รัน vegapull + import script) | ยังไม่ต้องมี GUI |

> เวลาพัฒนา: 0 วัน (ใช้ของที่มีอยู่), ค่าใช้จ่าย: 0 บาท

---

### Phase 2 - Growth (เดือนที่ 3-6)

เป้าหมาย: **ดึง User ให้ลงทะเบียนและกลับมาใช้ซ้ำ** ด้วยระบบ Portfolio และ Alerts

#### 4.2.1 User Authentication

- สมัคร/ล็อกอินด้วย Email + Password
- Social Login: Google, Facebook (ครอบคลุมฐาน User ไทย)
- Profile page: avatar, display name, สถิติการใช้งาน

#### 4.2.2 Portfolio System

- กดเพิ่มการ์ดเข้าคอลเลกชัน โดยเลือก **Variant** (เช่น SR / SR Parallel / SEC) + ระบุจำนวนและราคาที่ซื้อ
- ราคาปัจจุบันคำนวณตาม Variant ที่เลือก (SR กับ SEC ราคาต่างกัน)
- แสดง **มูลค่ารวมพอร์ต (Total Portfolio Value)** อัปเดตตามราคาปัจจุบันของแต่ละ Variant
- คำนวณ **กำไร/ขาดทุน (Unrealized P&L)** อัตโนมัติ แยกตาม Variant
- กราฟแสดงมูลค่าพอร์ตย้อนหลัง
- แยก Collection เป็นหมวด (เช่น "Deck แดง", "Investment", "ของเก็บ")
- รองรับหลาย Condition: NM (Near Mint), LP, MP, HP, Damaged
- ข้อมูลราคาซื้อที่ user ใส่จะถูกนำไปคำนวณ Thai Market Price อัตโนมัติ (แยกตาม Variant)

#### 4.2.3 Watchlist & Price Alerts

- กดดาวเพื่อเพิ่มการ์ดเข้า Watchlist
- ตั้ง Alert ได้: "แจ้งเตือนเมื่อราคาต่ำกว่า X บาท" หรือ "เมื่อราคาเปลี่ยนมากกว่า Y%"
- ช่องทางแจ้งเตือน: Email (Phase 2), LINE Notify (Phase 3)
- Free tier: Watchlist สูงสุด 10 ใบ, Alert 3 ตัว
- Pro tier: ไม่จำกัด

#### 4.2.4 Thai Market Price (ราคากลางอัตโนมัติ)

**Thai Market Price** คือราคากลางที่คำนวณอัตโนมัติจากหลายแหล่ง ไม่ต้องพึ่ง Manual report

**แหล่งข้อมูลที่ใช้คำนวณ:**
- ราคา JP (Yuyu-tei, eBay JP Sold) แปลงเป็นบาทอัตโนมัติ
- ราคาจาก Portfolio (ราคาที่ user ซื้อจริง)
- ราคาจาก Marketplace Listing + Sold Price

**วิธีคำนวณ:**
- ค่าเฉลี่ยถ่วงน้ำหนัก (Weighted Average) โดยให้น้ำหนัก Marketplace Sold > Portfolio > eBay JP > Yuyu-tei
- ตัด Outlier อัตโนมัติ (ราคาที่สูง/ต่ำผิดปกติ)
- แสดง Confidence level: "ข้อมูลเพียงพอ" vs "ข้อมูลจำกัด (อ้างอิง JP เป็นหลัก)"
- อัปเดตวันละ 1 ครั้ง หรือเมื่อมี transaction ใหม่

**เมื่อมี data เพียงพอ (Phase 2+):**
- แสดง Thai Market Price เป็นราคาหลัก
- แสดง breakdown จากแต่ละแหล่ง (expandable)
- กราฟ Price trend ของ Thai Market Price แยกจาก JP Price

#### 4.2.5 Honey System (Daily Engagement -- แนวทางจาก CoinGecko Candy)

ระบบสะสม **Honey (น้ำผึ้ง)** เพื่อสร้าง Daily engagement และ incentivize การใช้งาน -- ใช้ theme มาสคอต Kuma (หมีเก็บน้ำผึ้ง)

- **Daily Check-in:** ล็อกอินทุกวันได้ 10 Honey (Streak bonus: 7 วันติด = 2x, 30 วันติด = 3x)
- **เพิ่มการ์ดเข้า Portfolio (พร้อมราคาซื้อ):** 10 Honey/ครั้ง (จำกัด 10 ครั้ง/วัน) -- ช่วยเพิ่ม data ให้ Thai Market Price
- **ขายสำเร็จบน Marketplace:** 20 Honey/ครั้ง -- ช่วยเพิ่ม Sold Price data
- **Review ผู้ขาย/ผู้ซื้อ:** 5 Honey/ครั้ง

**แลก Honey ได้ที่ Honey Shop:**

| รางวัล | Honey ที่ใช้ |
|--------|-------------|
| ส่วนลด Pro membership 30% (1 เดือน) | 500 Honey |
| ลด Marketplace Fee เหลือ 3% (1 เดือน) | 300 Honey |
| Kuma Badge พิเศษบนโปรไฟล์ | 200 Honey |
| Listing Boost ฟรี 1 ครั้ง | 150 Honey |

**ทำไม Honey System สำคัญ:**
- เพิ่ม Thai Market Price data -- user ใส่ราคาซื้อใน Portfolio + ขายของบน Marketplace = data อัตโนมัติ
- เพิ่ม Daily Active Users -- คนกลับมา login ทุกวันเพื่อเก็บ Honey ให้ Kuma
- เป็น soft path สู่ Pro -- ได้ลองใช้ Pro ผ่านส่วนลด แล้วติดจนจ่ายเต็ม
- Branding ชัดเจน -- "Honey" + Kuma สร้างภาพจำที่ต่างจากคู่แข่ง

#### 4.2.6 Deck Price Calculator

- ให้ User เลือกการ์ดมาสร้าง Deck (50 ใบ + Leader)
- คำนวณราคารวมของ Deck ทั้งหมดอัตโนมัติ
- บันทึก/แชร์ Deck List ได้
- แสดงราคาเฉลี่ยเทียบกับ Deck ยอดนิยมอื่น

---

### Phase 2.5 - Marketplace (เดือนที่ 5-8)

เป้าหมาย: **เปิดตลาดซื้อขายการ์ดบนแพลตฟอร์ม** เป็นช่องทางรายได้หลักที่ Scalable ที่สุด

#### 4.2.6 Card Listing System

- User ลงประกาศขายการ์ดพร้อมระบุ: **Variant** (SR/SEC/Parallel), ราคา, สภาพ (NM/LP/MP/HP), จำนวน, รูปถ่ายจริง
- **Auto Pricing:** ระบบแนะนำราคาจาก Thai Market Price ของ Variant นั้น ("ราคาตลาด: ฿1,150 แนะนำตั้ง: ฿1,100-1,200")
- **"ขายจาก Portfolio" 1 คลิก:** มีการ์ดใน Portfolio → กดปุ่ม "ขาย" → สร้าง Listing อัตโนมัติ (variant, condition, ราคาแนะนำ ใส่ให้หมด)
- Quick List: สแกนรหัสการ์ดเพื่อลงขายเร็วขึ้น (ดึงข้อมูล + รูป HD จาก Master Data)
- สถานะ Listing: Active, Sold, Reserved, Expired

#### 4.2.7 Search & Discovery (Marketplace)

- ค้นหาการ์ดที่ลงขายด้วยชื่อ, Card ID, หรือ Variant
- Filter: สภาพ, ช่วงราคา, ผู้ขาย (Rating), สถานที่ส่ง, Variant (Regular/Parallel/SEC)
- **"Best Deal" badge** สำหรับการ์ดที่ราคาต่ำกว่า Thai Market Price 10%+
- **"Above Market" warning** สำหรับการ์ดที่ราคาสูงกว่า Thai Market Price 15%+ (ช่วยผู้ซื้อตัดสินใจ)
- **แสดง "ราคารวมค่าส่ง"** เป็นตัวเลขหลัก (แก้ปัญหา ของ ฿20 ค่าส่ง ฿40 ที่เห็นใน TCG Thailand)
- เรียงตาม Total Price (รวมค่าส่ง) เป็น default
- หน้า Shop ส่วนตัวของแต่ละผู้ขาย + Seller stats
- **"Price Watch → Buy":** ตั้ง Alert ราคา → เมื่อมี Listing ถูกกว่าเป้า ส่ง notification + ลิงก์ซื้อทันที

#### 4.2.8 Transaction Flow

- ระบบ Chat ระหว่างผู้ซื้อ-ผู้ขาย (In-app messaging)
- ตัวเลือกการจัดส่ง: นัดรับ (Nearby Pickup), ส่ง EMS/Kerry, ส่ง Registered mail
- **Escrow ตั้งแต่ Phase แรก:** ผู้ซื้อจ่ายเงิน → ระบบถือเงิน → ผู้ขายส่งของ → ผู้ซื้อกดยืนยันรับของ → ระบบโอนเงินให้ผู้ขาย (เหมือน TCG Thailand + Shopee)
- ผู้ซื้อมีเวลา 24 ชม. หลังรับของเพื่อตรวจสอบ + กด "สินค้ามีปัญหา" ถ้าไม่ตรง
- เก็บค่าธรรมเนียม **5%** จากผู้ขายเมื่อขายสำเร็จ (เท่ากับ TCG Thailand แต่ได้ฟีเจอร์เยอะกว่า)
- **รวมออเดอร์:** ซื้อหลายใบจากร้านเดียวกัน ค่าส่งครั้งเดียว
- **Sold Price Feedback:** ทุก transaction สำเร็จ → ราคาขายจริงถูกนำไปอัปเดต Thai Market Price อัตโนมัติ

#### 4.2.9 Trust & Safety

- ระบบ Rating & Review (1-5 ดาว + ความเห็น + จำนวน transaction สำเร็จ) สำหรับทั้งผู้ซื้อและผู้ขาย
- **Seller tiers:** ยิ่งขายเยอะ ยิ่งได้สถานะสูง (New → Verified → Trusted → Top Seller)
- Seller verification: ยืนยันตัวตนผ่านบัตรประชาชน/พาสปอร์ต (ได้ badge "Verified")
- ระบบรายงาน (Report) สำหรับ Listing ที่ไม่เหมาะสม / หลอกลวง
- Dispute resolution: ผู้ซื้อกด "สินค้ามีปัญหา" → สร้าง case → ทีมงานไกล่เกลี่ย (แนวเดียวกับ TCG Thailand แต่มี UI ที่ดีกว่า)
- ป้องกัน Shill bidding / Wash trading ด้วย pattern detection
- **แนะนำการแพ็คการ์ด:** คู่มือ + video สำหรับผู้ขายใหม่ (เหมือน TCG Thailand แต่ integrate ในขั้นตอนขาย)

#### 4.2.10 Admin Panel (Phase 2 -- สร้างหน้า /admin)

เมื่อมี Marketplace + user จำนวนมาก จำเป็นต้องมีหน้า admin ภายในเว็บ (เข้าได้เฉพาะ role admin):

```
/admin
├── /admin/scraper-status        สถานะ scraper แต่ละแหล่ง
│   ├── แหล่ง: Yuyu-tei, eBay JP
│   ├── สถานะ: สำเร็จ ✓ / ล้มเหลว ✗
│   ├── เวลาที่รันล่าสุด
│   ├── จำนวนการ์ดที่ดึงได้ / ทั้งหมด
│   └── ปุ่ม "รัน Manual Scrape"
│
├── /admin/unmatched-variants    การ์ดที่ auto-match ไม่ได้
│   ├── แสดงข้อมูลจากแหล่ง (เช่น "OP01-121 SEC パラレル")
│   ├── แนะนำ variant ที่น่าจะตรง
│   └── กดเลือก variant ที่ถูกต้อง / สร้าง variant ใหม่
│
├── /admin/reported-listings     Listing ที่ถูก report
│   ├── เหตุผลที่ report
│   ├── กดซ่อน / ลบ / ปล่อยผ่าน
│   └── แจ้ง user ที่ถูก report อัตโนมัติ
│
├── /admin/reported-users        User ที่ถูก report
│   ├── ประวัติ report ทั้งหมด
│   ├── กดระงับบัญชี / ปลดระงับ
│   └── ดู listing + transaction ของ user
│
└── /admin/new-set               Import set ใหม่
    ├── กดปุ่ม trigger vegapull
    ├── Preview data + รูปก่อน import
    └── กด confirm import เข้า DB
```

> เวลาพัฒนา: ~2-3 วัน (ใช้ component เดียวกับเว็บหลัก, ไม่ต้อง design ใหม่)
> ป้องกันด้วย middleware: ตรวจสอบ role === "admin" ก่อนเข้าหน้า /admin ทุกหน้า

---

### Phase 3 - Scale (เดือนที่ 9-12+)

เป้าหมาย: **ขยาย Revenue** และ **ขยายไปเกมอื่น**

#### 4.3.1 Multi-TCG Support

- เพิ่ม Pokemon TCG (เริ่มจาก JP)
- เพิ่ม Union Arena
- Database schema รองรับหลายเกมตั้งแต่ต้น (Multi-tenant by game)
- แต่ละเกมมีหน้า Landing Page แยก

#### 4.3.2 Advanced Analytics (Pro Feature)

- กราฟราคาย้อนหลัง 90 วัน / 1 ปี / All-time
- เปรียบเทียบราคาหลายการ์ดในกราฟเดียวกัน
- Price prediction trend (ค่าเฉลี่ยเคลื่อนที่ / Moving Average)
- Export ข้อมูลเป็น CSV / Excel
- Set-level analytics: ราคาเฉลี่ยของทั้งชุด, ดัชนีมูลค่าชุด

#### 4.3.3 Notification Channels

- LINE Notify integration (สำคัญมากสำหรับตลาดไทย)
- Push notification (Web)
- Weekly digest email: สรุปความเคลื่อนไหวราคาประจำสัปดาห์

#### 4.3.4 Additional Data Sources (JP C2C + Thai Online)

- **Mercari JP:** Scrape internal API เพื่อดึงราคาซื้อขายมือสอง JP (ราคาจริงที่คน C2C ซื้อขายกัน)
- **Shopee (Optional):** ดึงราคาจากร้านค้าไทยออนไลน์ผ่าน Scrape หรือ Affiliate API (ถ้าคุ้มค่า)
- รวม data เข้าสู่ Thai Market Price calculation

#### 4.3.5 Mobile Optimization / PWA

- Progressive Web App (PWA) เพื่อให้ใช้งานบนมือถือได้ลื่น
- Add to Home Screen
- Offline cache สำหรับข้อมูลที่เคยดู
- พิจารณา Native app ถ้า User base ถึง 10,000+

#### 4.3.6 Admin Panel (Phase 3 -- ขยาย Dashboard)

เพิ่มหน้า admin สำหรับ analytics และ management ขั้นสูง:

```
/admin (เพิ่มเติมจาก Phase 2)
├── /admin/dashboard             KPI Overview
│   ├── MAU / DAU / Registered Users (กราฟ)
│   ├── Revenue breakdown: Freemium MRR + Marketplace Commission
│   ├── Marketplace GMV + จำนวน transaction
│   ├── Pro/Pro+ conversion rate + churn rate
│   ├── Scraper health overview (ทุกแหล่งในหน้าเดียว)
│   └── Thai Market Price coverage (กี่ % ของการ์ดมี data เพียงพอ)
│
├── /admin/users                 User Management
│   ├── ค้นหา user (ชื่อ, email, ID)
│   ├── ดูประวัติ: subscription, transaction, report
│   ├── จัดการ subscription (upgrade/downgrade/cancel)
│   └── Seller verification approval
│
├── /admin/marketplace           Marketplace Management
│   ├── Listing ทั้งหมด (filter: active/sold/reported)
│   ├── Dispute management (ดูทั้ง 2 ฝ่าย + ตัดสิน)
│   ├── Fee adjustment (ปรับ % ค่าธรรมเนียมรายร้าน ถ้าจำเป็น)
│   └── Transaction log
│
├── /admin/pricing               Price Data Management
│   ├── ดูราคาจากทุกแหล่งเทียบกัน (ตรวจสอบ anomaly)
│   ├── Override Thai Market Price ชั่วคราว (กรณี data ผิดปกติ)
│   └── Source mapping stats (matched vs unmatched %)
│
└── /admin/content               Content Management
    ├── จัดการ banner หน้าแรก / ประกาศ
    ├── Kuma seasonal theme (เปลี่ยน mascot ตามเทศกาล)
    └── Honey Shop rewards (เพิ่ม/แก้ไขรางวัล)
```

> เวลาพัฒนา: ~3-5 วัน

---

### Phase 4 - International Data (เดือนที่ 12+)

เป้าหมาย: **เพิ่มราคาอ้างอิงสากล** จาก EU/US เพื่อให้ User เห็นภาพราคาทั่วโลก

#### 4.4.1 Cardmarket Integration (EU)

- ใช้ Third-party API เช่น `one-piece-api.com` หรือ `cardmarket-api.com` (Cardmarket Official API ไม่รับ developer key ใหม่)
- ดึงราคา Trend (Low / Avg / High) ในหน่วย EUR
- แปลง EUR → THB อัตโนมัติ
- แสดงใน Tab "ราคาสากล" บน Card Detail Page
- อัปเดตวันละ 1 ครั้ง (ใช้ quota Free tier ให้คุ้ม)

#### 4.4.2 TCGPlayer Integration (US)

- ใช้ Third-party API เดียวกัน (`one-piece-api.com` aggregate ทั้ง Cardmarket + TCGPlayer)
- ดึง Market Price + Low / Mid / High ในหน่วย USD
- แปลง USD → THB อัตโนมัติ
- แสดงคู่กับ Cardmarket ใน Tab "ราคาสากล"

> **หมายเหตุ:** ราคา EU/US ไม่ได้สะท้อนตลาดไทยโดยตรง (set ออกต่างเวลา, supply ต่าง) แต่เป็นข้อมูลอ้างอิงที่มีประโยชน์สำหรับ Trader ที่ซื้อขายข้ามประเทศ

#### 4.4.3 GetCollectr (พิจารณา)

- เป็นคู่แข่ง (Portfolio tracking) จึงต้องระวัง ToS
- ถ้า API เปิดให้ใช้ได้อาจดึง data เสริม แต่ไม่ใช่ priority
- ใช้ Cardmarket + TCGPlayer ตรงจาก `one-piece-api.com` แทนดีกว่า

---

## 5. UX/UI Design Direction

### 5.1 Brand Colors (จาก Kuma Mascot)

ดึงสีจากตัว Kuma มาเป็น Design System:

```
Primary:     #4A9EE0  ฟ้า hoodie Kuma (ปุ่มหลัก, link, accent)
Secondary:   #8B5E3C  น้ำตาลตัว Kuma (header, sidebar)
Background:  #FFF8F0  ครีมอุ่น (พื้นหลัง Light mode)
Dark BG:     #1A1A2E  กรมท่า (Dark mode)

Success:     #4CAF50  เขียว (ราคาขึ้น ▲)
Danger:      #E53935  แดง (ราคาลง ▼)
Honey:       #F5A623  ส้มน้ำผึ้ง (Honey system, Kuma highlights)
Warning:     #FFB300  เหลืองน้ำผึ้ง (alerts)

Card BG:     #FFFFFF  ขาว (card component)
Text:        #2D2D2D  เทาเข้ม (ข้อความหลัก)
Text Muted:  #8E8E8E  เทาอ่อน (ข้อความรอง)
```

### 5.2 Typography

```
Heading:       "Nunito"           กลม อบอุ่น เข้ากับ Kuma
Body:          "Inter"            อ่านง่าย professional
Price/ตัวเลข:  "JetBrains Mono"   monospace ดูชัด ตัวเลขเรียงตรง
ภาษาไทย:       "Noto Sans Thai"   รองรับ Thai ครบ
```

### 5.3 Tech Stack (Frontend)

```
Framework:     Next.js 16.2       SSR + SEO + App Router + Turbopack
Styling:       Tailwind CSS 4.2   เร็ว, responsive ง่าย, v4 CSS-first config
Components:    shadcn/ui v4       สวย, customizable, ไม่หนัก (Radix UI)
Charts:        Recharts / Lightweight Charts (TradingView)
Animation:     Framer Motion      Kuma animations
Icons:         Lucide Icons
```

### 5.4 Key Pages Layout

#### หน้าแรก (Landing / Dashboard)

```
┌─────────────────────────────────────────────────────────┐
│  🐻 KUMA TRACKER     [ค้นหาการ์ด...]     [Login] [TH▼] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [รูป Kuma ยิ้ม]  "ตลาดวันนี้สดใส!              │    │
│  │                    การ์ดขึ้นเยอะกว่าลง 📈"       │    │
│  │                    OPCG Index: +2.3% วันนี้      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌── Top Gainers ▲ ──┐  ┌── Top Losers ▼ ──┐          │
│  │ 🟢 Zoro SEC +15%  │  │ 🔴 Nami SR  -8%  │          │
│  │ 🟢 Luffy L  +12%  │  │ 🔴 Ace UC   -5%  │          │
│  │ 🟢 Law SR   +8%   │  │ 🔴 Kid R    -3%  │          │
│  └───────────────────┘  └──────────────────┘          │
│                                                         │
│  ┌── Most Viewed 👀 ──────────────────────────────┐    │
│  │ [รูป][รูป][รูป][รูป][รูป][รูป]  ← scroll ได้    │    │
│  │  Zoro  Luffy  Nami   Law   Ace  Shanks          │    │
│  │ 1,250฿ 890฿  450฿  2,100฿ 320฿  780฿           │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌── New Releases: OP-09 ─────────────────────────┐    │
│  │ [รูป][รูป][รูป][รูป] ...                        │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

#### Card Detail Page

```
┌─────────────────────────────────────────────────────────┐
│  🐻 KUMA TRACKER     [ค้นหาการ์ด...]     [👤 Profile]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  OP01-121 Roronoa Zoro                    ← ชื่อการ์ด   │
│                                                         │
│  ┌──────────┐  เวอร์ชัน:                                │
│  │          │  [SR] [SR ∥] [SEC ●] [SEC ∥] [SEC 漫]     │
│  │  [รูป    │           ↑ เลือกอยู่                     │
│  │  การ์ด   │                                           │
│  │  HD      │  Thai Market Price                        │
│  │  ตาม     │  ฿1,150  ▲ +5.2% (7d)                    │
│  │  variant │  ━━━━━━━━━━━━━━ Confidence: ●●●○          │
│  │  ที่เลือก │                                           │
│  │          │  ▼ ดูราคาจากแหล่งอื่น  ← collapsible      │
│  └──────────┘  ┌──────────────────────────┐             │
│                │ Yuyu-tei:  ¥4,980 (1,245฿)│             │
│  Character     │ eBay Sold: ¥4,500 (1,125฿)│             │
│  Color: Green  │ Mkt Sold:  ฿1,100        │             │
│  Power: 6000   └──────────────────────────┘             │
│  Counter: 1000                                          │
│                [+ Portfolio]  [☆ Watchlist]  [🔔 Alert]  │
│                                                         │
│  ┌── Price History ─────────────────────────────────┐   │
│  │  [7d] [30d] [90d●] [1y] [All]                    │   │
│  │  ¥6,000 ┤                                        │   │
│  │         │        ╱╲                               │   │
│  │  ¥5,000 ┤───────╱──╲──────────────               │   │
│  │         │      ╱    ╲     ╱╲                      │   │
│  │  ¥4,000 ┤────╱──────╲───╱──╲────                 │   │
│  │         ├────┬────┬────┬────┬───→                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌── ขายอยู่บน Marketplace ────────────────────────┐   │
│  │ [รูปจริง] NM  ฿1,100  ★4.8 @CardShopBKK  [ดู]  │   │
│  │ [รูปจริง] LP  ฿980    ★4.5 @OPCollector   [ดู]  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Portfolio Page

```
┌─────────────────────────────────────────────────────────┐
│  📊 Portfolio ของฉัน                   [+ เพิ่มการ์ด]   │
│                                                         │
│  ┌───────────┬─────────────┬────────────┐              │
│  │ มูลค่ารวม  │ กำไร/ขาดทุน  │ จำนวนการ์ด │              │
│  │ ฿45,230   │ ▲ ฿8,450    │ 32 ใบ     │              │
│  │           │ (+22.9%)    │ 5 variants │              │
│  └───────────┴─────────────┴────────────┘              │
│  [กราฟมูลค่าพอร์ตย้อนหลัง ~~~~~~~~~~~~~~~~~~~~~~~~~~~~]  │
│                                                         │
│  Collection: [ทั้งหมด ▼] [Investment] [Deck แดง]       │
│                                                         │
│  ┌──────┬────────────┬──────┬────────┬────────┐        │
│  │ รูป  │ ชื่อ        │ ซื้อ  │ ปัจจุบัน │ P&L    │        │
│  ├──────┼────────────┼──────┼────────┼────────┤        │
│  │[IMG] │ Zoro SEC   │ ฿900 │ ฿1,150 │ ▲ +27% │        │
│  │[IMG] │ Luffy L P1 │฿2,500│ ฿3,200 │ ▲ +28% │        │
│  │[IMG] │ Nami SR    │ ฿350 │ ฿320   │ ▼ -8%  │        │
│  └──────┴────────────┴──────┴────────┴────────┘        │
│                                                         │
│  🐻 "พอร์ตวันนี้ขึ้น! Kuma ดีใจด้วย!"                    │
└─────────────────────────────────────────────────────────┘
```

### 5.5 Kuma Integration Points

Kuma ปรากฏในจุดที่ "ว่าง" หรือต้องการความเป็นมิตร ไม่รบกวนการดูข้อมูล:

| จุดที่ใช้ | Kuma ทำอะไร | ทำไม |
|----------|------------|------|
| **Loading** | ค้นหาการ์ดในกอง + "Kuma กำลังหาให้..." | แทน spinner ธรรมดา ลด perceived wait time |
| **ไม่มีผลลัพธ์** | ยักไหล่ + "ไม่เจอการ์ดที่ค้นหา" | ทำให้ empty state ไม่ดูว่างเปล่า |
| **Portfolio ว่าง** | มือเปล่า + "เพิ่มการ์ดใบแรกให้ Kuma ถือหน่อย!" | กระตุ้น action |
| **Error 404** | ถือแผนที่กลับหัว + "หลงทางแล้ว..." | ลดความหงุดหงิด |
| **Daily Check-in** | ถือโหลน้ำผึ้ง + "+10 Honey! 🍯" | ให้รู้สึกได้ reward |
| **Price Alert ถึงเป้า** | ตื่นเต้น + "Zoro SEC ลงมาถึง ฿1,000 แล้ว!" | ดึงดูดความสนใจ |
| **Trial หมดอายุ** | ตาเศร้า + "Pro หมดแล้ว... สมัครต่อไหม?" | Loss aversion |
| **Onboarding** | พาทัวร์ 3 step + "Kuma จะพาดูรอบ!" | ทำให้ onboarding สนุก |
| **Honey Shop** | เป็นแคชเชียร์ ยืนหลังเคาน์เตอร์ | สร้างบรรยากาศร้านค้า |
| **Achievement Badge** | แต่งตัวตาม badge ที่ได้ | ให้ badge มีคุณค่ามากขึ้น |

**หลักสำคัญ:** ข้อมูลราคา + กราฟ เด่นที่สุดเสมอ -- Kuma เป็น supporting character ไม่ใช่พระเอก

### 5.6 Mobile Layout (Mobile First)

```
┌───────────────────────┐
│ 🐻 KUMA    [🔍] [👤]  │
├───────────────────────┤
│                       │
│ [Kuma ยิ้ม] ตลาดวันนี้│
│  OPCG Index ▲ +2.3%  │
│                       │
│ ┌── Gainers ────────┐ │
│ │ Zoro SEC  ▲ +15%  │ │
│ │ Luffy L   ▲ +12%  │ │
│ │ Law SR    ▲ +8%   │ │
│ └───────────────────┘ │
│                       │
│ [รูป][รูป][รูป][รูป]  │
│ ← Most Viewed     →  │
│                       │
├───────────────────────┤
│ [🏠] [🔍] [📊] [🛒] [👤]│
│ Home Search Port Mkt Me│
└───────────────────────┘
```

- Bottom tab navigation (ไม่ใช่ hamburger -- คนไทยคุ้นเคยจาก Shopee/Lazada)
- ปุ่มใหญ่ 44px+ (thumb-friendly)
- การ์ด swipe ได้ (horizontal scroll)
- ราคาตัวใหญ่ชัดเจนแม้หน้าจอเล็ก

### 5.7 Design Principles

| หลักการ | วิธีทำ |
|---------|-------|
| **Data First** | ราคา + กราฟ เด่นที่สุด, Kuma เป็น supporting |
| **Kuma ไม่รบกวน** | ใช้เฉพาะจุดว่าง (empty state, loading, onboarding) |
| **อ่านง่าย** | ตัวเลขราคาใหญ่ชัด, สีเขียว/แดงชัดเจน, whitespace เพียงพอ |
| **Dark mode** | รองรับทั้ง Light/Dark -- Kuma เส้นขอบหนา พื้นหลังโปร่ง |
| **Mobile first** | ออกแบบมือถือก่อน → ขยาย desktop |
| **Thai UX** | ภาษาไทยเป็นหลัก, ปุ่มใหญ่, Social login เด่น, Bottom tab nav |
| **Progressive disclosure** | ข้อมูลหลักเห็นทันที, รายละเอียดซ่อนใน collapsible/tab |
| **Consistent** | ทุกหน้าใช้ component เดียวกัน (shadcn/ui), สี/font เดียวกัน |

---

## 6. Tech Stack & Architecture

### 6.1 Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                     │
│  Next.js 16.2 + Tailwind 4.2 + shadcn/ui v4 + TypeScript   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     Vercel (Hosting)                         │
│  Server Components · API Routes · Server Actions · Cron     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Supabase (BaaS)                            │
│  PostgreSQL · Auth · Storage · Realtime · Edge Functions     │
│                                                              │
│  Prisma ORM 7.5 ←→ PostgreSQL                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               External Services & Data                       │
│  Scrapers · eBay API · Payment Gateway · LINE Notify         │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Version Pinning (ล่าสุด ณ มีนาคม 2026)

| Category | Technology | Version | หมายเหตุ |
|----------|-----------|---------|----------|
| **Framework** | Next.js | **16.2** | App Router, Server Components, Turbopack default |
| **Language** | TypeScript | **5.8+** | Strict mode, path aliases |
| **ORM** | Prisma | **7.5** | TypeScript-native engine (ไม่ใช้ Rust แล้ว), 3x faster, 90% smaller bundle |
| **Database** | Supabase (PostgreSQL 15) | **v1.26** | Managed PostgreSQL, Auth, Storage, Realtime |
| **Styling** | Tailwind CSS | **4.2** | CSS-first config, no tailwind.config.js |
| **UI Components** | shadcn/ui | **v4** | Radix UI primitives, copy-paste components |
| **Runtime** | Node.js | **22 LTS** | Required by Next.js 16 |
| **Package Manager** | pnpm | **9.x** | เร็วกว่า npm, disk efficient |

### 6.3 Frontend

```
next.js 16.2
├── app/                        App Router (Server Components default)
│   ├── (public)/               หน้าสาธารณะ (ไม่ต้อง login)
│   │   ├── page.tsx            Homepage / Dashboard
│   │   ├── cards/              Card Database + Detail
│   │   └── trending/           Top Movers
│   ├── (auth)/                 หน้าที่ต้อง login
│   │   ├── portfolio/          Portfolio System
│   │   ├── marketplace/        Marketplace
│   │   ├── watchlist/          Watchlist & Alerts
│   │   └── settings/           User Settings
│   ├── (admin)/                Admin Panel (role-gated)
│   │   └── admin/              Scraper Status, Reports, etc.
│   ├── api/                    API Routes (REST)
│   └── layout.tsx              Root Layout + Providers
├── components/
│   ├── ui/                     shadcn/ui components
│   ├── kuma/                   Kuma mascot components
│   ├── cards/                  Card-related components
│   ├── charts/                 Price charts
│   └── marketplace/            Marketplace components
├── lib/
│   ├── db.ts                   Prisma client singleton
│   ├── supabase/               Supabase client (server/browser)
│   ├── scrapers/               Scraper modules
│   └── utils/                  Shared utilities
└── prisma/
    ├── schema.prisma           Database schema
    └── migrations/             Prisma migrations
```

**Key Libraries:**

| Library | ใช้ทำอะไร | Version |
|---------|----------|---------|
| `next` | Framework หลัก | 16.2 |
| `react` / `react-dom` | UI rendering | 19.x |
| `@prisma/client` | Database ORM | 7.5 |
| `@supabase/supabase-js` | Supabase SDK | 2.x |
| `@supabase/ssr` | Supabase Auth ใน Next.js | 0.5+ |
| `tailwindcss` | Styling | 4.2 |
| `recharts` | Price charts (simple) | 2.x |
| `lightweight-charts` | Candlestick / TradingView-style | 4.x |
| `framer-motion` | Kuma animations, transitions | 11.x |
| `lucide-react` | Icons | latest |
| `zod` | Schema validation (forms, API) | 3.x |
| `next-intl` หรือ `next-i18n` | i18n (TH/EN) ถ้าต้องการ | latest |

### 6.4 Backend & API

**API Strategy: Next.js Server Actions + API Routes**

- **Server Actions** สำหรับ mutations (create, update, delete) -- ลด boilerplate, type-safe
- **API Routes** สำหรับ external integration (webhooks, cron triggers, LINE Notify callback)
- **Server Components** สำหรับ data fetching -- ลด client-side JavaScript, เร็วกว่า

**Prisma ORM 7.5 (TypeScript-native):**

```
Prisma 7 สำคัญ:
- Engine เปลี่ยนจาก Rust → TypeScript = deploy ง่ายขึ้น, bundle เล็กลง 90%
- Query performance เร็วขึ้น 3x
- รองรับ Savepoints (nested transactions)
- ใช้ prisma dev แทน prisma migrate dev สำหรับ development
- ESM support ดีขึ้น
```

**Database Schema (Prisma) -- Core Models:**

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Card {
  id          String        @id  // e.g., "OP01-121"
  nameJp      String
  nameEn      String
  nameTh      String?
  setCode     String        // e.g., "OP01"
  cardNumber  String        // e.g., "121"
  rarity      String        // C, UC, R, SR, SEC, L, SP
  color       String[]
  category    String        // Leader, Character, Event, Stage
  cost        Int?
  power       Int?
  counter     Int?
  effect      String?
  effectTh    String?
  artist      String?
  variants    CardVariant[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([setCode])
  @@index([rarity])
}

model CardVariant {
  id              String          @id  // e.g., "OP01-121_SR_PARALLEL"
  cardId          String
  card            Card            @relation(fields: [cardId], references: [id])
  rarity          String          // SR, SEC
  variantType     String          // REGULAR, PARALLEL, MANGA, FULL_ART
  imageUrl        String?
  prices          PriceRecord[]
  portfolioItems  PortfolioItem[]
  listings        Listing[]
  createdAt       DateTime        @default(now())

  @@index([cardId])
  @@index([rarity, variantType])
}

model PriceRecord {
  id            String      @id @default(cuid())
  variantId     String
  variant       CardVariant @relation(fields: [variantId], references: [id])
  source        String      // YUYUTEI, EBAY_JP, MERCARI_JP, PORTFOLIO, MARKETPLACE
  priceJpy      Int?
  priceThb      Decimal?
  priceUsd      Decimal?
  priceEur      Decimal?
  type          String      // SELL, BUY, SOLD, LISTING
  scrapedAt     DateTime    @default(now())

  @@index([variantId, source])
  @@index([scrapedAt])
}

model ThaiMarketPrice {
  id              String      @id @default(cuid())
  variantId       String
  priceThb        Decimal
  confidence      String      // HIGH, MEDIUM, LOW
  sourcesUsed     Int
  calculatedAt    DateTime    @default(now())

  @@unique([variantId, calculatedAt])
  @@index([variantId])
}

model User {
  id            String          @id @default(cuid())
  email         String          @unique
  name          String?
  avatarUrl     String?
  role          String          @default("USER")  // USER, PRO, PRO_PLUS, ADMIN
  honeyPoints   Int             @default(0)
  trialEndsAt   DateTime?
  portfolios    Portfolio[]
  listings      Listing[]
  reviews       Review[]
  createdAt     DateTime        @default(now())
}

model Portfolio {
  id        String          @id @default(cuid())
  userId    String
  user      User            @relation(fields: [userId], references: [id])
  name      String          @default("My Collection")
  items     PortfolioItem[]
  createdAt DateTime        @default(now())

  @@index([userId])
}

model PortfolioItem {
  id          String      @id @default(cuid())
  portfolioId String
  portfolio   Portfolio    @relation(fields: [portfolioId], references: [id])
  variantId   String
  variant     CardVariant @relation(fields: [variantId], references: [id])
  quantity    Int         @default(1)
  buyPrice    Decimal?
  condition   String      @default("NM")  // NM, LP, MP, HP, DMG
  note        String?
  addedAt     DateTime    @default(now())

  @@index([portfolioId])
  @@index([variantId])
}

model Listing {
  id          String      @id @default(cuid())
  sellerId    String
  seller      User        @relation(fields: [sellerId], references: [id])
  variantId   String
  variant     CardVariant @relation(fields: [variantId], references: [id])
  price       Decimal
  condition   String
  quantity    Int         @default(1)
  description String?
  images      String[]
  status      String      @default("ACTIVE")  // ACTIVE, SOLD, CANCELLED
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([sellerId])
  @@index([variantId])
  @@index([status])
}

model Review {
  id          String   @id @default(cuid())
  reviewerId  String
  reviewer    User     @relation(fields: [reviewerId], references: [id])
  targetId    String
  rating      Int      // 1-5
  comment     String?
  createdAt   DateTime @default(now())

  @@index([targetId])
}
```

### 6.5 Supabase Services

| Service | ใช้ทำอะไร | Config |
|---------|----------|--------|
| **PostgreSQL** | Database หลัก ผ่าน Prisma ORM | Supabase Free → Pro เมื่อ scale |
| **Auth** | Social login (Google, LINE, Facebook), Magic Link, Email/Password | ใช้ `@supabase/ssr` สำหรับ Next.js |
| **Storage** | เก็บรูปการ์ด (HD from Bandai), รูป Marketplace listing, Avatar | Bucket: `card-images`, `listing-photos`, `avatars` |
| **Realtime** | Marketplace chat, Live price updates, Notification | Subscribe to `listings`, `messages` channels |
| **Edge Functions** | Webhook handlers, Background tasks ที่ไม่เหมาะกับ Vercel | เสริม Vercel API Routes |
| **Row Level Security (RLS)** | ป้องกัน data access ระดับ row | User เห็นแค่ portfolio ตัวเอง, Admin เห็นทั้งหมด |

**Prisma + Supabase Integration:**

```typescript
// lib/db.ts -- Prisma Client Singleton
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

```typescript
// lib/supabase/server.ts -- Supabase Server Client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 6.6 Infrastructure & DevOps

```
┌─ Vercel ─────────────────────────────────────────────┐
│  Hosting:       Next.js 16.2 (auto-deploy from Git)  │
│  Edge Network:  Global CDN, ISR, Static Generation   │
│  Cron Jobs:     vercel.json cron (scraper triggers)   │
│  Analytics:     Vercel Analytics (Web Vitals)         │
│  Preview:       PR Preview Deployments                │
└──────────────────────────────────────────────────────┘

┌─ Supabase ───────────────────────────────────────────┐
│  Database:      PostgreSQL 15 (managed)               │
│  Auth:          Built-in (Google, LINE, Facebook)     │
│  Storage:       S3-compatible object storage          │
│  Realtime:      WebSocket subscriptions               │
│  Dashboard:     Admin GUI for DB + Auth management    │
└──────────────────────────────────────────────────────┘

┌─ GitHub ─────────────────────────────────────────────┐
│  Repo:          Monorepo (Next.js + Prisma + Scripts) │
│  Actions:       CI/CD (lint, test, Prisma migrate)    │
│  Dependabot:    Auto dependency updates               │
└──────────────────────────────────────────────────────┘
```

**CI/CD Pipeline (GitHub Actions):**

```
Push to main
  → Lint (ESLint + Prettier)
  → Type Check (tsc --noEmit)
  → Test (Vitest)
  → Prisma Migrate Deploy (production DB)
  → Vercel Auto-deploy (triggered by Git push)
```

**Cron Jobs (Vercel):**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scrape-yuyutei",
      "schedule": "0 17 * * *"
    },
    {
      "path": "/api/cron/scrape-ebay",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/calculate-thai-price",
      "schedule": "0 19 * * *"
    },
    {
      "path": "/api/cron/exchange-rate",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### 6.7 Payment Gateway (สำหรับ Marketplace Escrow + Pro Subscription)

| Gateway | PromptPay Fee | Credit Card Fee | จุดเด่น | หมายเหตุ |
|---------|-------------|----------------|---------|----------|
| **Stripe Thailand** | 1.65% | 3.65% | ระบบ Escrow ผ่าน Connect, Subscription billing, Developer-friendly | แนะนำ -- API ดี, docs ดี, มี Subscription + Connect |
| **Omise** | 1.65% | 3.65% | บริษัทไทย, Support ภาษาไทย | ทางเลือกถ้า Stripe ไม่ผ่าน KYC |

**Payment Flow (Escrow ผ่าน Stripe Connect):**

```
ผู้ซื้อจ่าย (PromptPay/Credit)
  → Stripe hold เงิน (PaymentIntent)
  → ผู้ขายส่งของ + ใส่ tracking
  → ผู้ซื้อกดยืนยันรับของ (หรือ auto-release 7 วัน)
  → Stripe Transfer เงินให้ผู้ขาย (หัก 5%/4%/3% commission)
```

**Pro Subscription (Stripe Billing):**

```
User สมัคร Pro/Pro+
  → Stripe Checkout (PromptPay / Credit Card)
  → Webhook → อัปเดต User.role ใน DB
  → Stripe จัดการ recurring billing อัตโนมัติ
  → Cancel → Webhook → downgrade role
```

### 6.8 Environment Variables

```env
# .env.local (ตัวอย่าง -- ห้าม commit)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Prisma
DATABASE_URL=postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# eBay
EBAY_APP_ID=...
EBAY_CERT_ID=...

# LINE Notify (Admin alerts)
LINE_NOTIFY_TOKEN=...

# Exchange Rate
EXCHANGE_RATE_API_KEY=...

# Cron Secret (ป้องกัน unauthorized cron calls)
CRON_SECRET=...
```

### 6.9 Performance & SEO Strategy

| เทคนิค | วิธีทำ | ผลลัพธ์ |
|--------|-------|---------|
| **SSR / ISR** | Card pages = ISR (revalidate 1 ชม.), Homepage = SSR | SEO + Fresh data |
| **Server Components** | Default ใน Next.js 16 -- ลด JS bundle | Page load < 2 วินาที |
| **Image Optimization** | next/image + Supabase CDN, WebP/AVIF auto | LCP ต่ำ |
| **Database Indexing** | Prisma @@index ที่ query บ่อย | Query < 50ms |
| **Edge Caching** | Vercel Edge Network + stale-while-revalidate | TTFB ต่ำทั่วโลก |
| **Turbopack** | Default ใน Next.js 16.2 dev | Dev startup 87% เร็วขึ้น |
| **Structured Data** | JSON-LD สำหรับ Product (card price) | Rich snippets ใน Google |
| **Sitemap** | Auto-generate จาก Card database | Google index ทุกหน้าการ์ด |

---

## 7. Business Model (ละเอียด)

### 7.1 Freemium Model (รายได้หลักระยะกลาง-ยาว)

#### Free Tier

| ฟีเจอร์ | ขอบเขต |
|---------|--------|
| ดูราคาปัจจุบัน | ไม่จำกัด |
| กราฟราคาย้อนหลัง | 7 วัน / 30 วัน |
| ค้นหา / Filter | ครบทุกฟีเจอร์ |
| Portfolio | สูงสุด 20 ใบ |
| Watchlist | สูงสุด 10 ใบ |
| Price Alerts | 3 ตัว |
| Thai Market Price | ดูได้ ไม่จำกัด |
| Deck Calculator | 1 Deck |
| **ขายของบน Marketplace** | **ได้ (Fee 5%)** |
| **Shop Profile** | **พื้นฐาน** |

#### Pro Tier (129 บาท/เดือน)

| ฟีเจอร์ | ขอบเขต |
|---------|--------|
| ทุกอย่างใน Free | รวมอยู่ |
| กราฟราคาย้อนหลัง | 90 วัน / 1 ปี |
| Portfolio | สูงสุด 200 ใบ + กำไร/ขาดทุน |
| Watchlist | สูงสุด 50 ใบ |
| Price Alerts | 20 ตัว + Email |
| เปรียบเทียบราคาหลายการ์ด | สูงสุด 5 ใบ |
| Export CSV/Excel | ได้ |
| Deck Calculator | ไม่จำกัด |
| Badge "Pro" บนโปรไฟล์ | ได้ |
| **Marketplace Fee** | **4% (ลดจาก 5%)** |
| **Bulk Price Lookup** | **100 การ์ด/วัน** |
| **Shop Profile** | **ใส่โลโก้ + คำอธิบายร้าน** |

#### Pro+ Tier (249 บาท/เดือน)

| ฟีเจอร์ | ขอบเขต |
|---------|--------|
| ทุกอย่างใน Pro | รวมอยู่ |
| กราฟราคาย้อนหลัง | All-time + เปรียบเทียบได้ไม่จำกัด |
| Portfolio | ไม่จำกัด + กราฟพอร์ตย้อนหลัง + หลาย Collection |
| Watchlist & Alerts | ไม่จำกัด + LINE Notify |
| Advanced Analytics | Moving average, Set-level analytics, Price correlation |
| **Marketplace Fee** | **3% (ลดจาก 5%)** |
| **Bulk Price Lookup** | **500 การ์ด/วัน** |
| **Auto Pricing Suggestion** | **แนะนำราคาจากราคากลาง** |
| **Inventory Management** | **จัดการสต็อกการ์ด** |
| **Listing Boost ฟรี** | **2 ครั้ง/เดือน** |
| **Shop Profile** | **Featured shop + custom branding** |
| Priority Support | ตอบภายใน 24 ชม. |
| Badge "Pro+" บนโปรไฟล์ | ได้ |

#### Pricing Strategy

| แพ็กเกจ | Pro | Pro+ |
|---------|-----|------|
| **Free Trial** | **14 วัน (ไม่ต้องใส่บัตร)** | **14 วัน (ไม่ต้องใส่บัตร)** |
| รายเดือน | 129 บาท/เดือน | 249 บาท/เดือน |
| รายปี | 990 บาท/ปี (~82 บาท/เดือน, ประหยัด 36%) | 1,990 บาท/ปี (~166 บาท/เดือน, ประหยัด 33%) |
| Lifetime | 1,999 บาท (ครั้งเดียว, 100 คนแรก) | 3,999 บาท (ครั้งเดียว, 50 คนแรก) |

#### Free Trial Flow (แนวทางจาก CoinGecko)

| ขั้นตอน | สิ่งที่เกิดขึ้น |
|---------|---------------|
| **วันที่ 1** | User กด "ทดลอง Pro ฟรี 14 วัน" ได้ฟีเจอร์ Pro/Pro+ ทั้งหมดทันที ไม่ต้องใส่บัตร |
| **วันที่ 11** | ส่ง Email/LINE แจ้งว่า "เหลืออีก 3 วันจะหมด Trial" พร้อมสรุปว่าใช้ฟีเจอร์อะไรไปบ้าง |
| **วันที่ 14** | Trial หมด กลับเป็น Free tier -- แสดง Summary ว่า "คุณเคยใช้ Portfolio 85 ใบ ตอนนี้เหลือแค่ 20" สร้าง Loss aversion |

**ทำไมไม่บังคับใส่บัตร:** ตลาดไทยคนกลัว auto-charge มาก ถ้าบังคับใส่บัตรก่อน trial conversion จะต่ำมาก ให้ลองใช้ฟรีก่อนแล้วค่อยตัดสินใจจ่ายเอง

**เหตุผลเรื่องราคา:**
- Pro 129 บาท/เดือน ยังถูกกว่า Netflix (169 บาท) -- ตัดสินใจง่าย
- Pro+ 249 บาท/เดือน สำหรับ Trader/ร้านค้าที่ได้ประโยชน์เป็นหมื่นจากข้อมูล -- ROI ชัดเจน
- Free Trial 14 วัน ลด friction -- ให้ user "ติด" ก่อนแล้วค่อยจ่าย
- Marketplace Fee ลดสำหรับสมาชิก Pro/Pro+ เป็นแรงจูงใจสำคัญ (ขายของเยอะยิ่งคุ้ม)
- Lifetime deal ใช้สร้าง Buzz ช่วง Launch: 100+50 คน = เงินสดก้อนแรก ~400,000 บาท
- เป้าหมาย Conversion rate: 5% Pro + 2% Pro+ ของ Registered users

#### Revenue Projection (Freemium)

| เดือนที่ | Registered Users | Pro (5%) | Pro+ (2%) | MRR Pro | MRR Pro+ | รายได้/เดือน |
|----------|-----------------|---------|----------|---------|---------|-------------|
| 3 | 1,000 | 50 | 0 | 6,450 | 0 | **6,450 บาท** |
| 6 | 3,000 | 150 | 60 | 19,350 | 14,940 | **34,290 บาท** |
| 9 | 6,000 | 300 | 120 | 38,700 | 29,880 | **68,580 บาท** |
| 12 | 10,000 | 500 | 200 | 64,500 | 49,800 | **114,300 บาท** |

> Pro MRR = จำนวน x 129 บาท, Pro+ MRR = จำนวน x 249 บาท
> ยังไม่รวม Lifetime deal one-time revenue (~400,000 บาท)

---

### 7.2 Marketplace Commission (ช่องทางรายได้หลัก -- Revenue Engine)

Marketplace คือช่องทางที่มี Revenue potential สูงสุด เพราะ scale ตามจำนวน Transaction โดยไม่ต้องเพิ่มทรัพยากร

#### โมเดลค่าธรรมเนียม

| รายการ | ค่าธรรมเนียม | ผู้จ่าย | หมายเหตุ |
|--------|-------------|---------|----------|
| Transaction Fee (Free) | 5% ของราคาขาย | ผู้ขาย | เก็บเมื่อขายสำเร็จเท่านั้น (รวม Escrow) |
| Transaction Fee (Pro) | 4% ของราคาขาย | ผู้ขาย | สมาชิก Pro ได้ Fee ลด |
| Transaction Fee (Pro+) | 3% ของราคาขาย | ผู้ขาย | สมาชิก Pro+ ได้ Fee ต่ำสุด |
| Listing Boost | 29-99 บาท/ครั้ง | ผู้ขาย | ดัน Listing ขึ้นหน้าแรก 24-72 ชม. |
| Featured Listing | 149 บาท/สัปดาห์ | ผู้ขาย | Highlight + Badge "Featured" |

> **Escrow รวมใน Fee 5% ไม่เก็บเพิ่ม** -- TCG Thailand เก็บ 5% + มี Escrow เหมือนกัน ถ้าเราเก็บ Escrow เพิ่มจะแพงกว่าคู่แข่ง

#### ทำไม 5% ถึงเหมาะสม

| คู่แข่ง | Fee | Escrow | Price Reference | Portfolio | เราเทียบ |
|--------|-----|--------|-----------------|-----------|---------|
| **TCG Thailand** | **5%** | มี (manual 24 ชม.) | ไม่มี | ไม่มี | Fee เท่ากัน แต่ได้ฟีเจอร์เยอะกว่ามาก |
| **Magi** (JP) | 8% | มี | ไม่มี | ไม่มี | เราถูกกว่า 3% |
| **TCGPlayer** (US) | 10-15% | มี (อัตโนมัติ) | มี Market Price | ไม่มี | เราถูกกว่า 5-10% |
| **Cardmarket** (EU) | 5%+ | มี | มี | ไม่มี | Fee ใกล้เคียง |
| **Shopee** | 6-15% | มี | ไม่มี | ไม่มี | เราถูกกว่า + เข้าใจ TCG |
| **Facebook** | 0% | ไม่มี | ไม่มี | ไม่มี | เราแพงกว่า แต่ปลอดภัยกว่า |

**สรุป:** 5% ต่ำพอให้ Seller ย้ายจาก Facebook มา (เพราะปลอดภัยกว่า) แต่สูงพอให้มีรายได้จริง + ถูกกว่าทุกคู่แข่งยกเว้น Facebook ที่ไม่มีระบบอะไรเลย

#### Revenue Projection (Marketplace)

สมมติ Average order value = 500 บาท, Commission 5% = 25 บาท/transaction

| เดือนที่ | Active Sellers | Transactions/เดือน | GMV | Commission (5%) | Listing Boost | รายได้/เดือน |
|----------|--------------|-------------------|-----|----------------|--------------|-------------|
| 6 | 50 | 200 | 100,000 | 5,000 | 2,000 | 7,000 บาท |
| 9 | 200 | 1,000 | 500,000 | 25,000 | 8,000 | 33,000 บาท |
| 12 | 500 | 3,000 | 1,500,000 | 75,000 | 20,000 | 95,000 บาท |

> Marketplace เป็นตัวเร่งรายได้หลัก -- ทุกๆ 1 ล้านบาท GMV = 50,000 บาทรายได้

---

### 7.3 สรุป Revenue Projection รวม (ทุกช่องทาง)

| เดือนที่ | Freemium | Marketplace | รวม/เดือน |
|----------|----------|-------------|-----------|
| 3 | 3,870 | 0 | **3,870 บาท** |
| 6 | 14,910 | 7,000 | **21,910 บาท** |
| 9 | 31,350 | 33,000 | **64,350 บาท** |
| 12 | 57,350 | 95,000 | **152,350 บาท** |

> หมายเหตุ: ร้านค้าที่สมัคร Pro/Pro+ จะถูกนับรวมใน Freemium MRR
> ร้านค้าที่ขายของบน Marketplace จะสร้างรายได้ผ่าน Commission ใน Marketplace

> ตัวเลขข้างต้นเป็น Moderate-Aggressive estimate
> Marketplace คิดเป็น ~62% ของรายได้รวมที่เดือน 12 เป็น Revenue engine หลัก
> Lifetime deals (Pro 100 คน x 1,999 บาท = 199,900 บาท one-time) ยังไม่รวมในตาราง

---

## 8. User Journey & Flow

### 8.1 First-time Visitor (ยังไม่สมัคร)

```
เข้าเว็บ (จาก Google / Facebook)
  |
  v
หน้าแรก: เห็น Top Trending, การ์ดราคาขึ้น/ลง
  |
  v
คลิกดูการ์ดที่สนใจ --> หน้า Card Detail (ราคา + กราฟ 7 วัน)
  |
  v
ค้นหาการ์ดเพิ่ม --> ใช้ Search / Filter
  |
  v
กดเพิ่ม Portfolio / Watchlist --> เจอ Prompt ให้สมัคร (Soft gate)
  |
  v
สมัครสมาชิก (Free)
```

**จุดสำคัญ:** ไม่บังคับสมัครเพื่อดูราคา -- ให้ดูราคาได้เลยทันทีเพื่อสร้าง Value ก่อน แล้วค่อย Gate ที่ฟีเจอร์ Interactive (Portfolio, Watchlist)

### 8.2 Registered User (Free Tier)

```
ล็อกอิน
  |
  v
หน้าแรก: Top Trending + Watchlist ส่วนตัว (ถ้ามี)
  |
  v
จัดการ Portfolio (เพิ่ม/ลบการ์ด, ดูมูลค่ารวม)
  |
  v
ตั้ง Watchlist + Alert (จำกัด 10 ใบ / 3 Alerts)
  |
  v
ได้รับ Email alert เมื่อราคาถึงเป้า
  |
  v
เมื่อถึง Limit --> เห็น Upgrade prompt (Soft upsell)
  |
  v
พิจารณาอัปเกรด Pro
```

**จุดสำคัญ:** ให้ User ใช้จน "ติด" ก่อน แล้วค่อย Upsell เมื่อเจอ Limit ตามธรรมชาติ ไม่ใช้ Hard paywall

### 8.3 Free Trial Flow (Free -> Pro Trial -> ตัดสินใจ)

```
เจอ Limit (Portfolio 20 ใบ / Alert 3 ตัว) หรือเห็น Upgrade prompt
  |
  v
กด "ทดลอง Pro ฟรี 14 วัน" (ไม่ต้องใส่บัตร)
  |
  v
ได้ใช้ฟีเจอร์ Pro ทั้งหมดทันที
  |
  v
วันที่ 11: ได้ Email/LINE "เหลือ 3 วัน" + สรุปการใช้งาน
  |
  v
วันที่ 14: Trial หมด --> เห็นสรุป "คุณเคยใช้ Portfolio 85 ใบ ตอนนี้เหลือ 20"
  |
  v
ตัดสินใจ: สมัคร Pro (129 บาท) / กลับ Free
```

**จุดสำคัญ:** แสดง "สิ่งที่จะเสีย" (Loss aversion) เมื่อ Trial หมด เช่น จำนวนการ์ดในพอร์ต จำนวน Alert ที่ตั้งไว้ มูลค่า P&L ที่คำนวณให้ -- ทำให้การกลับไป Free รู้สึก "ขาดทุน"

### 8.4 Pro Member

```
ล็อกอิน
  |
  v
หน้าแรก: Personalized dashboard + Watchlist + Portfolio summary
  |
  v
Portfolio ไม่จำกัด + กำไร/ขาดทุนอัตโนมัติ
  |
  v
กราฟราคาย้อนหลัง All-time + เปรียบเทียบหลายการ์ด
  |
  v
Price Alerts ไม่จำกัด + LINE Notify
  |
  v
Export ข้อมูลเป็น CSV
  |
  v
Badge Pro
```

---

## 9. KPIs & Success Metrics

### 9.1 Acquisition Metrics (การเข้าถึง)

| KPI | เป้าหมาย (เดือนที่ 6) | เป้าหมาย (เดือนที่ 12) |
|-----|----------------------|----------------------|
| Monthly Active Users (MAU) | 5,000 | 15,000 |
| Registered Users | 3,000 | 10,000 |
| Marketplace Active Sellers | 50 | 500 |
| Organic Search Traffic | 40% ของ Total | 60% ของ Total |
| Pages Indexed by Google | 10,000+ | 30,000+ (รวมหน้า Listing) |

### 9.2 Engagement Metrics (การใช้งาน)

| KPI | เป้าหมาย |
|-----|----------|
| Average Session Duration | 3+ นาที |
| Pages per Session | 5+ หน้า |
| Return Visit Rate (กลับมาใน 7 วัน) | 40%+ |
| Daily Check-in Rate (ในกลุ่ม Registered) | 20%+ |
| Portfolio Usage Rate (ในกลุ่ม Registered) | 30%+ |
| Watchlist Usage Rate | 50%+ |
| Free Trial to Paid Conversion | 15%+ |

### 9.3 Revenue Metrics (รายได้)

| KPI | เป้าหมาย |
|-----|----------|
| Free to Pro Conversion Rate | 5%+ |
| Free to Pro+ Conversion Rate | 2%+ |
| Total Monthly Revenue เดือนที่ 12 | 120,000-150,000+ บาท |
| Marketplace GMV เดือนที่ 12 | 1,500,000+ บาท |
| Churn Rate (Pro/Pro+ ยกเลิก) | ต่ำกว่า 8%/เดือน |

### 9.4 Product Health Metrics (สุขภาพผลิตภัณฑ์)

| KPI | เป้าหมาย |
|-----|----------|
| Scraper Success Rate | 99%+ (ดึงข้อมูลสำเร็จ) |
| Data Freshness | อัปเดตราคาภายใน 24 ชม. |
| Data Sources Active | MVP: 2 แหล่ง → Phase 4: 8-9 แหล่ง |
| Thai Market Price Coverage | 80%+ ของการ์ดมี data เพียงพอคำนวณ (Phase 2+) |
| Site Uptime | 99.5%+ |
| Page Load Time | ต่ำกว่า 2 วินาที |

---

## 10. Risk Analysis & Mitigation

### 10.1 ความเสี่ยงด้านเทคนิค

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **Yuyu-tei บล็อก IP** | ปานกลาง | สูง -- ไม่มีข้อมูลราคา | 1) Delay + Rate limit ตั้งแต่ต้น 2) เตรียม Rotating proxy 3) มี Backup data source (eBay JP, Mercari) |
| **Yuyu-tei เปลี่ยน UI** | สูง | ปานกลาง -- บอทพัง | 1) ใช้ Robust selectors 2) Alert ทันทีเมื่อ Scrape ล้มเหลว 3) ทีมพร้อมแก้ภายใน 24 ชม. |
| **API Key / DB credentials รั่ว** | ต่ำ | สูง | 1) ใช้ .env เสมอ 2) Secret rotation ทุก 90 วัน 3) ไม่เปิดไฟล์สำคัญในไลฟ์ |
| **Database ล่ม / ข้อมูลหาย** | ต่ำ | สูงมาก | 1) Automated daily backup 2) Point-in-time recovery 3) อย่างน้อย 2 copies ต่างตำแหน่ง |

### 10.2 ความเสี่ยงด้านธุรกิจ

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **ถูกฟ้อง Cease & Desist** | ต่ำ | สูง | 1) ใส่ Credit แหล่งที่มาชัดเจน 2) ไม่ Hotlink 3) พร้อมสลับ Data source ทันที (eBay, Crowdsource) |
| **คู่แข่งรายใหญ่ทำฟีเจอร์เดียวกัน** | ปานกลาง | ปานกลาง | 1) โฟกัส OPCG ให้ลึกที่สุด 2) Marketplace + Portfolio ดีกว่า 3) Community engagement สูงกว่า |
| **User ไม่ยอมจ่าย Pro** | ปานกลาง | ต่ำ (มีช่องทางอื่น) | 1) Marketplace Commission เป็น Revenue หลักแทน 2) ปรับราคาลง / เพิ่ม Value 3) Free Trial ดึง conversion |
| **Marketplace ไม่มีคนลง Listing (Cold start)** | สูง | สูง | 1) ทีมลง Listing ตัวอย่างเองช่วงแรก 2) 0% Fee 30 วันแรก 3) ดึงร้าน LGS มาลง Listing ฟรี 4) Referral program |
| **หลอกลวงบน Marketplace (Scam)** | ปานกลาง | สูง | 1) Seller verification 2) Rating system 3) Escrow option 4) Dispute resolution team 5) ระงับบัญชีทันทีเมื่อพบปัญหา |

### 10.3 ความเสี่ยงด้านข้อมูล

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **ราคา JP ไม่สะท้อนตลาดไทย** | สูง | ปานกลาง | 1) Thai Market Price คำนวณอัตโนมัติจาก Portfolio + Marketplace data 2) แสดงแยก Tab พร้อม Disclaimer ชัดเจน |
| **Thai Market Price ไม่แม่นยำ (data น้อย)** | ปานกลาง | ปานกลาง | 1) แสดง Confidence level ชัดเจน 2) ตัดค่า Outlier อัตโนมัติ 3) ถ้า data ไทยน้อย fallback เป็นราคา JP + อัตราแลกเปลี่ยน |
| **Third-party API (Cardmarket/TCGPlayer) ปิดตัว** | ปานกลาง | ต่ำ | 1) ไม่ใช่ data หลัก (เป็นแค่ "ราคาอ้างอิงสากล") 2) มี API ทางเลือกหลายเจ้า 3) ซ่อน Tab ราคาสากลได้ทันที |
| **ข้อมูล Master Data ไม่ครบ** | ต่ำ | ต่ำ | 1) ใช้หลายแหล่ง (Bandai official + GitHub) 2) User report missing card |

### 10.4 ความเสี่ยงด้านกฎหมาย

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **ละเมิดลิขสิทธิ์รูปการ์ด** | ต่ำ-ปานกลาง | สูง | 1) ใช้รูปจาก Official source พร้อม Credit 2) อ้าง Fair Use (ใช้เพื่ออ้างอิง ไม่ใช่เพื่อขาย) 3) พร้อมลบรูปทันทีถ้าได้รับแจ้ง |
| **PDPA (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล)** | ต่ำ | ปานกลาง | 1) Privacy Policy + Cookie consent 2) เก็บเฉพาะข้อมูลที่จำเป็น 3) ให้ User ลบบัญชีได้ |

---

## 11. Data Sources: Ethics & Legal Compliance

### หลักปฏิบัติสำหรับ Scraping (Yuyu-tei, Mercari JP, Shopee)

1. **No Hotlinking** -- ห้ามดึงรูปจาก URL ของแหล่งข้อมูลโดยตรง ดาวน์โหลดมาเก็บ Storage ตัวเอง
2. **Give Credit** -- ระบุที่มาของข้อมูลราคาชัดเจนในทุกหน้า: "ข้อมูลราคาอ้างอิงจาก Yuyu-tei, eBay, Cardmarket, TCGPlayer"
3. **Rate Limiting** -- รันบอทแค่วันละ 1 ครั้ง ช่วงเวลาที่ Traffic น้อย (ตี 2-3)
4. **Respectful Scraping** -- ใส่ Delay 1-2 วินาทีระหว่าง Request, เช็ค robots.txt
5. **Disclaimer** -- ลงประกาศชัดเจนว่าราคาเป็น "ราคากลางอ้างอิง" ไม่ใช่ราคาซื้อขายจริง
6. **Opt-out Ready** -- ถ้าเจ้าของข้อมูลขอให้หยุด พร้อมหยุดและสลับแหล่งข้อมูลทันที

### หลักปฏิบัติสำหรับ Third-party API (Cardmarket, TCGPlayer via one-piece-api.com)

1. **ปฏิบัติตาม API ToS** -- ใช้งานภายใน Rate limit ที่กำหนด (Free: 100 req/วัน)
2. **ไม่ Cache เกินที่อนุญาต** -- อัปเดตข้อมูลวันละ 1 ครั้ง cache ไม่เกิน 24 ชม.
3. **ให้ Credit** -- แสดงที่มาข้อมูลชัดเจน "Price data from Cardmarket / TCGPlayer"
4. **Graceful Degradation** -- ถ้า API ล่มหรือปิดตัว ซ่อน Tab ราคาสากลได้ทันทีโดยไม่กระทบ core features

---

## 12. Go-To-Market Strategy

### ช่วง Pre-launch (ก่อนเปิดตัว)

- สร้าง Landing page "Coming Soon" เก็บ Email list
- ทำ Content SEO ล่วงหน้า: บทความ "ราคาการ์ดวันพีช OP01-ปัจจุบัน"
- Teaser ในกลุ่ม Facebook OPCG ไทย

### ช่วง Launch (MVP)

- **Online:** โพสต์ในกลุ่ม Facebook OPCG ไทย (ใช้ Meelike-th ดันโพสต์ให้ไวรัล)
- **Influencer:** ส่งให้ YouTuber / Streamer สาย OPCG ลองใช้ + รีวิว
- **Lifetime Deal:** เปิดขาย Pro Lifetime 1,999 บาท (100 คนแรก) + Pro+ Lifetime 3,999 บาท (50 คนแรก) สร้าง Urgency

### ช่วง Marketplace Launch

- แคมเปญ "0% ค่าธรรมเนียม 30 วันแรก" ดึง Seller จาก Facebook มาลง Listing
- ร่วมกับร้าน LGS 5-10 ร้าน ให้ลง Listing บนแพลตฟอร์มฟรี 3 เดือนแรก
- เปิด Referral Program: ชวนเพื่อนมาขาย ได้ค่าธรรมเนียม 0% อีก 30 วัน
- Weekly highlight: "การ์ดราคาดีที่สุดในสัปดาห์นี้" ดึง Traffic เข้า Marketplace

### ช่วง Growth

- SEO เป็นช่องทางหลัก -- ทุกการ์ด + ทุก Listing มีหน้าเฉพาะที่ Google index ได้
- Weekly content: "สรุปราคาการ์ดวันพีชประจำสัปดาห์"
- Partnership กับร้านการ์ด: ร้านใส่ลิงก์เว็บเราในโพสต์ขายของ
- ดึงร้านการ์ดมาขายบน Marketplace: เสนอ Pro+ Trial + 0% Fee เดือนแรก

---

## 13. Team Structure & Roles (ทีม 2-3 คน)

| Role | ความรับผิดชอบ |
|------|-------------|
| **Full-stack Developer (Lead)** | พัฒนาเว็บ, Scraper bot, Database, DevOps |
| **Frontend / Design** | UI/UX Design, Responsive, Data visualization (กราฟ) |
| **Content / Community Manager** | ดูแลโซเชียล, เขียน Content SEO, ดึงร้านค้ามาใช้แพลตฟอร์ม, ตอบ Feedback |

> ในช่วง MVP ถ้ามี 2 คน: Developer ทำทั้ง Full-stack + DevOps, อีกคนทำ Design + Community
> คนที่ 3 ค่อยเพิ่มเมื่อถึง Phase 2 เพื่อดูแล Content / Business development

---

## 14. Cost Structure (ค่าใช้จ่ายโดยประมาณ)

| รายการ | MVP (เดือน 1-3) | Growth (เดือน 3-6) | Scale (เดือน 6-12) | Expand (เดือน 12+) | หมายเหตุ |
|--------|----------------|-------------------|-------------------|-------------------|----------|
| Vercel Hosting | 0 บาท | 700 บาท | 700-1,400 บาท | 700-1,400 บาท | Pro plan เมื่อ Traffic สูง |
| Supabase | 0 บาท | 900 บาท | 900-1,750 บาท | 900-1,750 บาท | Pro plan สำหรับ Marketplace data |
| Domain name | 40 บาท | 40 บาท | 40 บาท | 40 บาท | ~500 บาท/ปี |
| Exchange Rate API | 0 บาท | 0 บาท | 0 บาท | 0 บาท | Free tier เพียงพอ (JPY/EUR/USD → THB) |
| eBay Browse API | 0 บาท | 0 บาท | 0 บาท | 0 บาท | Free tier (5,000 calls/วัน) |
| Image/File Storage | 0 บาท | 350 บาท | 700-1,400 บาท | 700-1,400 บาท | Marketplace photos เพิ่ม usage |
| Rotating Proxy | 0 บาท | 0-700 บาท | 700-1,750 บาท | 700-1,750 บาท | สำหรับ Yuyu-tei + Mercari scraping |
| Email Service (Resend/SES) | 0 บาท | 0 บาท | 350-700 บาท | 350-700 บาท | Alerts, Transaction emails |
| Payment Gateway (Stripe) | 0 บาท | 0 บาท | 1.65% PromptPay / 3.65% Card | 1.65% PromptPay / 3.65% Card | Stripe Thailand -- Escrow via Connect, Subscription via Billing |
| **Third-party Price API** | **0 บาท** | **0 บาท** | **0 บาท** | **0-350 บาท** | **one-piece-api.com Free 100 req/วัน, Pro ~$10/เดือน ถ้าต้องการ** |
| **รวมโดยประมาณ** | **~100-500 บาท** | **~2,000-3,000 บาท** | **~4,000-8,000 บาท** | **~4,500-9,000 บาท** | |

> Margin ที่เดือน 12: รายได้ ~152,000 บาท - ค่าใช้จ่าย ~8,000 บาท = **กำไรขั้นต้น ~144,000 บาท/เดือน (95% margin)**
> Phase 4 เพิ่ม Third-party API cost เล็กน้อย (~350 บาท/เดือน) แต่ Free tier อาจเพียงพอถ้าอัปเดตวันละ 1 ครั้ง

---

## Appendix: Feature Priority Matrix

| ฟีเจอร์ | Impact (ผลกระทบ) | Effort (ความยาก) | Revenue Impact | Priority |
|---------|-----------------|-----------------|---------------|----------|
| Card Database + ราคา | สูง | ปานกลาง | ต่ำ (Foundation) | P0 (ต้องมี) |
| Yuyu-tei Scraper (JP Retail) | สูง | ปานกลาง | ต่ำ (Foundation) | P0 |
| eBay JP API (JP Sold Price) | สูง | ต่ำ | ต่ำ (Foundation) | P0 |
| JPY-THB Conversion | สูง | ต่ำ | ต่ำ | P0 |
| Search & Filter | สูง | ต่ำ | ต่ำ | P0 |
| Price History Graph | สูง | ปานกลาง | ปานกลาง (Pro gate) | P0 |
| Top Trending Dashboard | สูง | ต่ำ | ปานกลาง (Traffic) | P0 |
| SEO Optimization | สูง | ต่ำ | สูง (Organic traffic, Marketplace discovery) | P0 |
| Admin Tools (Supabase + LINE Alert) | สูง | ต่ำ (ไม่ต้องสร้าง) | ต่ำ (Operations) | P0 |
| User Auth | ปานกลาง | ต่ำ | สูง (Pro gate) | P1 |
| Portfolio System | สูง | สูง | สูง (Pro gate + Thai Price data) | P1 |
| Watchlist & Alerts | ปานกลาง | ปานกลาง | สูง (Pro gate) | P1 |
| Thai Market Price (auto-calc) | สูง | ปานกลาง | สูง (Unique value prop) | P1 |
| Honey System (Daily Engagement) | สูง | ปานกลาง | ปานกลาง (Retention) | P1 |
| Free Trial 14 วัน | สูง | ต่ำ | สูง (Pro conversion) | P1 |
| **Marketplace** | **สูงมาก** | **สูง** | **สูงมาก (Revenue engine + Thai Price data)** | **P1.5** |
| Admin Panel (/admin -- 5 หน้า) | สูง | ต่ำ (~2-3 วัน) | ต่ำ (Operations) | P1.5 |
| Mercari JP Scraper | ปานกลาง | สูง | ต่ำ (Data quality) | P2 |
| Deck Calculator | ปานกลาง | ปานกลาง | ต่ำ | P2 |
| Multi-TCG Support | สูง | สูง | สูง (ขยาย TAM) | P2 |
| LINE Notify | ปานกลาง | ต่ำ | ปานกลาง | P2 |
| Admin Dashboard (KPI + Analytics) | ปานกลาง | ปานกลาง (~3-5 วัน) | ต่ำ (Operations) | P2 |
| PWA / Mobile | ปานกลาง | ปานกลาง | ต่ำ | P3 |
| Shopee Scraper (ถ้าคุ้ม) | ต่ำ | สูง | ต่ำ | P3 |
| **Cardmarket + TCGPlayer (ราคาสากล)** | **ปานกลาง** | **ต่ำ (ใช้ Third-party API)** | **ต่ำ (Bonus feature)** | **P4** |
