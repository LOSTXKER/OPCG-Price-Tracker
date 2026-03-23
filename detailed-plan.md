# TCG Price Tracker (Thailand) - Detailed Business & Feature Plan

> เอกสารนี้เป็นแผนธุรกิจและฟีเจอร์ฉบับละเอียด สำหรับทีมพัฒนา 2-3 คน
> เน้นเจาะตลาด One Piece Card Game (JP) ในไทยเป็นจุดเริ่มต้น
> โมเดลหาเงินหลัก: Freemium, Display Ads, Affiliate, Marketplace, B2B Shop Dashboard

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
| 6-9 เดือน | เปิด Marketplace ซื้อขายการ์ด + เริ่มมีรายได้จาก Ads, Affiliate, B2B |
| 9-12 เดือน | ขยายไปรองรับ Pokemon TCG มี Active users 10,000+ ต่อเดือน |
| 12-18 เดือน | กลายเป็น go-to platform ของ TCG ไทย รายได้ 150,000-250,000 บาท/เดือน |

### Positioning

เริ่มจากเป็น **เครื่องมืออ้างอิงราคา (Neutral Price Tool)** แล้วขยายเป็น **Marketplace ซื้อขายการ์ด** ที่ทุกฝ่ายใช้ร่วมกันได้ -- ทั้งผู้ซื้อ ผู้ขาย และร้านค้า ข้อมูลราคาที่แม่นยำคือ Unfair advantage ที่ทำให้ Marketplace ของเราน่าเชื่อถือกว่าการซื้อขายในกลุ่ม Facebook

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
- **ฟีเจอร์ที่ต้องมี:** Bulk price lookup, Affiliate/Sponsor listing
- **แนวโน้มการจ่ายเงิน:** ปานกลาง-สูง -- จ่ายเพื่อโฆษณาร้าน

---

## 3. Competitive Landscape

### คู่แข่งหลักในตลาดไทย

| Platform | จุดแข็ง | จุดอ่อน |
|----------|---------|---------|
| **TCG Thailand** | ฐานผู้ใช้ใหญ่ ครอบคลุมหลายเกม | ไม่มีระบบ Price Tracking จริงจัง ข้อมูลอัปเดตช้า |
| **กลุ่ม Facebook** | ชุมชนใหญ่ ซื้อขายกันตรง | ไม่มีราคากลาง ปั่นราคาง่าย ค้นหายาก |
| **Yuyu-tei** | ข้อมูลราคาละเอียด อัปเดตเร็ว | ภาษาญี่ปุ่น ราคา JPY ไม่สะท้อนตลาดไทย |
| **TCGplayer** (ต่างประเทศ) | ระบบ Market Price ดีมาก | ไม่รองรับ OPCG JP, ไม่เน้นตลาดเอเชีย |

### จุดแข็งของเรา (Competitive Advantages)

1. **โฟกัสเฉพาะ OPCG** -- ลึกกว่าคู่แข่งที่กระจายหลายเกม
2. **ราคาเป็นเงินบาท** -- ไม่มีใครทำตรงนี้อย่างจริงจัง
3. **Portfolio System** -- ฟีเจอร์ที่ยังไม่มีในตลาดไทย
4. **Community Price** -- ราคาจริงในไทยที่ User ช่วยกันรายงาน
5. **Marketplace + Price Data** -- ตลาดซื้อขายที่มี Data-backed pricing ต่างจาก Facebook ที่ราคาลอยไม่มีเกณฑ์
6. **ความเร็ว** -- ทีมเล็ก ปรับตัวเร็ว ซัพพอร์ตคอมมูนิตี้ได้ใกล้ชิด

### Positioning Map

```
                  ข้อมูลละเอียด (Data Depth)
                         ^
                         |
          Yuyu-tei       |    [เรา - เป้าหมาย]
              *          |         *
                         |
   ------ไม่เน้นไทย------+-------เน้นตลาดไทย------>
                         |
              TCGplayer  |    TCG Thailand
                  *      |         *
                         |
                  ข้อมูลตื้น (Data Shallow)
```

---

## 4. Feature Breakdown

### Phase 1 - MVP (เดือนที่ 1-3)

เป้าหมาย: **ปล่อยให้ใช้ได้จริง** มีข้อมูลราคาการ์ด OPCG ครบทุกชุด อัปเดตรายวัน

#### 4.1.1 Card Database & Master Data

- ดึง Master Data (ชื่อการ์ด, รหัส, ความหายาก, รูปภาพ HD) จาก Official Bandai Cardlist หรือ Open Source JSON บน GitHub
- จัดเก็บรูปภาพใน Storage ของตัวเอง (ห้าม Hotlink)
- รองรับการ์ดทุกชุดที่วางขายแล้ว (OP01 - ปัจจุบัน)
- แยกประเภท: Leader, Character, Event, Stage, DON!!

#### 4.1.2 Daily Price Scraping

- Scraper bot รันอัตโนมัติวันละ 1 ครั้ง (ช่วง 02:00-03:00 JST)
- ดึงเฉพาะราคาจาก Yuyu-tei แล้ว Join กับ Master Data ด้วย Card ID
- ใส่ Delay 1-2 วินาทีระหว่างแต่ละ Request
- ระบบ Alert เมื่อบอทหาข้อมูลไม่เจอ (UI เปลี่ยน)
- เมื่อการ์ดหมด (Sold Out) ใช้ราคาล่าสุดที่บันทึกไว้ + ติดป้าย [Out of Stock]

#### 4.1.3 JPY-THB Currency Conversion

- ดึงอัตราแลกเปลี่ยนจริงจาก Exchange Rate API (อัปเดตวันละ 1 ครั้ง)
- แสดงราคาทั้งสองสกุลเงิน (JPY / THB) ในทุกหน้า
- ให้ User เลือกสกุลเงินหลักที่ต้องการแสดงได้

#### 4.1.4 Search & Filter

- ค้นหาด้วยชื่อการ์ด (ภาษาญี่ปุ่น / อังกฤษ) หรือรหัสการ์ด
- Filter ตาม: ชุด (Booster), ความหายาก (C/UC/R/SR/SEC/L), ประเภท, ช่วงราคา
- Sort ตาม: ราคาสูง-ต่ำ, ราคาต่ำ-สูง, ราคาเปลี่ยนแปลงมากสุด, ใหม่ล่าสุด

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

- รูปการ์ดขนาดใหญ่ (คลิกซูมได้)
- ข้อมูลครบ: ชื่อ, รหัส, ความหายาก, เอฟเฟกต์, สี, ค่า Power/Counter
- ราคาปัจจุบัน (JPY + THB)
- กราฟราคาย้อนหลัง
- ปุ่ม "เพิ่มเข้า Portfolio" / "เพิ่มเข้า Watchlist" (สำหรับ User ที่ล็อกอิน)

#### 4.1.8 SEO & Performance

- Server-Side Rendering (SSR) สำหรับหน้ารายการการ์ดและหน้ารายละเอียด
- Meta tags, Open Graph, Structured Data สำหรับทุกหน้า
- Sitemap อัตโนมัติ เพื่อให้ Google index หน้าการ์ดทั้งหมด
- Target: "ราคาการ์ดวันพีช", "OPCG price", "การ์ด OP01 ราคา" ฯลฯ

---

### Phase 2 - Growth (เดือนที่ 3-6)

เป้าหมาย: **ดึง User ให้ลงทะเบียนและกลับมาใช้ซ้ำ** ด้วยระบบ Portfolio และ Alerts

#### 4.2.1 User Authentication

- สมัคร/ล็อกอินด้วย Email + Password
- Social Login: Google, Facebook (ครอบคลุมฐาน User ไทย)
- Profile page: avatar, display name, สถิติการใช้งาน

#### 4.2.2 Portfolio System

- กดเพิ่มการ์ดเข้าคอลเลกชันพร้อมระบุจำนวนและราคาที่ซื้อ
- แสดง **มูลค่ารวมพอร์ต (Total Portfolio Value)** อัปเดตตามราคาปัจจุบัน
- คำนวณ **กำไร/ขาดทุน (Unrealized P&L)** อัตโนมัติ
- กราฟแสดงมูลค่าพอร์ตย้อนหลัง
- แยก Collection เป็นหมวด (เช่น "Deck แดง", "Investment", "ของเก็บ")
- รองรับหลาย Condition: NM (Near Mint), LP, MP, HP, Damaged

#### 4.2.3 Watchlist & Price Alerts

- กดดาวเพื่อเพิ่มการ์ดเข้า Watchlist
- ตั้ง Alert ได้: "แจ้งเตือนเมื่อราคาต่ำกว่า X บาท" หรือ "เมื่อราคาเปลี่ยนมากกว่า Y%"
- ช่องทางแจ้งเตือน: Email (Phase 2), LINE Notify (Phase 3)
- Free tier: Watchlist สูงสุด 10 ใบ, Alert 3 ตัว
- Pro tier: ไม่จำกัด

#### 4.2.4 Community Price (Thai Market Price)

- User สามารถรายงานราคาที่ซื้อขายจริงในไทย
- แสดงเป็น "Community Price" คู่กับราคา Yuyu-tei
- ระบบโหวต: User กดยืนยันว่าราคาที่รายงานถูกต้อง
- แสดงจำนวน Report และวันที่ล่าสุด
- ป้องกัน Spam: ต้องล็อกอิน + จำกัดการรายงานต่อวัน

#### 4.2.5 Deck Price Calculator

- ให้ User เลือกการ์ดมาสร้าง Deck (50 ใบ + Leader)
- คำนวณราคารวมของ Deck ทั้งหมดอัตโนมัติ
- บันทึก/แชร์ Deck List ได้
- แสดงราคาเฉลี่ยเทียบกับ Deck ยอดนิยมอื่น

---

### Phase 2.5 - Marketplace (เดือนที่ 5-8)

เป้าหมาย: **เปิดตลาดซื้อขายการ์ดบนแพลตฟอร์ม** เป็นช่องทางรายได้หลักที่ Scalable ที่สุด

#### 4.2.6 Card Listing System

- User ลงประกาศขายการ์ดพร้อมระบุ: ราคา, สภาพ (NM/LP/MP/HP), จำนวน, รูปถ่ายจริง
- ระบบแนะนำราคาอัตโนมัติจากราคากลาง (Yuyu-tei + Community Price)
- Quick List: สแกนรหัสการ์ดเพื่อลงขายเร็วขึ้น (ดึงข้อมูลจาก Master Data)
- สถานะ Listing: Active, Sold, Reserved, Expired

#### 4.2.7 Search & Discovery (Marketplace)

- ค้นหาการ์ดที่ลงขายแยกจากหน้า Price check
- Filter: สภาพ, ช่วงราคา, ผู้ขาย (Rating), สถานที่ส่ง
- "Best Deal" badge สำหรับการ์ดที่ราคาต่ำกว่าราคากลาง 10%+
- หน้า Shop ส่วนตัวของแต่ละผู้ขาย

#### 4.2.8 Transaction Flow

- ระบบ Chat ระหว่างผู้ซื้อ-ผู้ขาย (In-app messaging)
- ตัวเลือกการจัดส่ง: นัดรับ, ส่ง EMS/Kerry, ส่ง Registered mail
- การชำระเงิน: โอนตรง (Phase แรก), Escrow ผ่านระบบ (Phase ถัดไป)
- เก็บค่าธรรมเนียม 5-8% จากผู้ขายเมื่อขายสำเร็จ

#### 4.2.9 Trust & Safety

- ระบบ Rating & Review (1-5 ดาว + ความเห็น) สำหรับทั้งผู้ซื้อและผู้ขาย
- Seller verification: ยืนยันตัวตนผ่านบัตรประชาชน/พาสปอร์ต
- ระบบรายงาน (Report) สำหรับ Listing ที่ไม่เหมาะสม / หลอกลวง
- Dispute resolution: ทีมงานไกล่เกลี่ยกรณีมีปัญหา
- ป้องกัน Shill bidding / Wash trading ด้วย pattern detection

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

#### 4.3.4 API for Partners

- RESTful API สำหรับร้านค้าพาร์ทเนอร์
- ดึงข้อมูลราคาปัจจุบัน / ย้อนหลัง
- Rate limit ตาม tier (Free: 100 req/day, Partner: 10,000 req/day)
- ใช้เป็นแหล่งรายได้เพิ่ม

#### 4.3.5 Mobile Optimization / PWA

- Progressive Web App (PWA) เพื่อให้ใช้งานบนมือถือได้ลื่น
- Add to Home Screen
- Offline cache สำหรับข้อมูลที่เคยดู
- พิจารณา Native app ถ้า User base ถึง 10,000+

---

## 5. Business Model (ละเอียด)

### 5.1 Freemium Model (รายได้หลักระยะกลาง-ยาว)

#### Free Tier

| ฟีเจอร์ | ขอบเขต |
|---------|--------|
| ดูราคาปัจจุบัน | ไม่จำกัด |
| กราฟราคาย้อนหลัง | 7 วัน / 30 วัน |
| ค้นหา / Filter | ครบทุกฟีเจอร์ |
| Portfolio | สูงสุด 20 ใบ |
| Watchlist | สูงสุด 10 ใบ |
| Price Alerts | 3 ตัว |
| Community Price | ดูได้ รายงานได้ 3 ครั้ง/วัน |
| Deck Calculator | 1 Deck |

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
| ไม่มีโฆษณา | Ad-free |
| Badge "Pro" บนโปรไฟล์ | ได้ |
| Marketplace Fee ลด | 4% (ปกติ 5%) |

#### Pro+ Tier (249 บาท/เดือน)

| ฟีเจอร์ | ขอบเขต |
|---------|--------|
| ทุกอย่างใน Pro | รวมอยู่ |
| กราฟราคาย้อนหลัง | All-time + เปรียบเทียบได้ไม่จำกัด |
| Portfolio | ไม่จำกัด + กราฟพอร์ตย้อนหลัง + หลาย Collection |
| Watchlist & Alerts | ไม่จำกัด + LINE Notify |
| Advanced Analytics | Moving average, Set-level analytics, Price correlation |
| API Access | 500 req/day (Personal use) |
| Monthly Deep Dive Report | รวมในแพ็กเกจ (ปกติ 199 บาท/ฉบับ) |
| Marketplace Fee ลด | 3% (ปกติ 5%) |
| Priority Support | ตอบภายใน 24 ชม. |
| Badge "Pro+" บนโปรไฟล์ | ได้ |

#### Pricing Strategy

| แพ็กเกจ | Pro | Pro+ |
|---------|-----|------|
| รายเดือน | 129 บาท/เดือน | 249 บาท/เดือน |
| รายปี | 990 บาท/ปี (~82 บาท/เดือน, ประหยัด 36%) | 1,990 บาท/ปี (~166 บาท/เดือน, ประหยัด 33%) |
| Lifetime | 1,999 บาท (ครั้งเดียว, 100 คนแรก) | 3,999 บาท (ครั้งเดียว, 50 คนแรก) |

**เหตุผลเรื่องราคา:**
- Pro 129 บาท/เดือน ยังถูกกว่า Netflix (169 บาท) -- ตัดสินใจง่าย
- Pro+ 249 บาท/เดือน สำหรับ Trader/ร้านค้าที่ได้ประโยชน์เป็นหมื่นจากข้อมูล -- ROI ชัดเจน
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

### 5.2 Display Ads (รายได้หลักระยะสั้น-กลาง)

#### กลยุทธ์โฆษณา

ใช้โฆษณาเป็นรายได้หลักในช่วงแรกที่ยังไม่มี Pro subscribers มากพอ

#### ตำแหน่งวางโฆษณา

| ตำแหน่ง | รูปแบบ | หมายเหตุ |
|---------|--------|----------|
| Header Banner | Leaderboard (728x90) | แสดงทุกหน้า สำหรับ Free users |
| Sidebar | Medium Rectangle (300x250) | หน้า Card Detail, หน้า Search |
| In-feed | Native Ad (ระหว่างรายการการ์ด) | ทุก 10-15 การ์ดในรายการ |
| Footer | Banner (468x60) | ทุกหน้า |

#### แนวทางปฏิบัติ

- **Google AdSense** เป็นตัวเริ่มต้น (ง่าย ไม่ต้องหาลูกค้าเอง)
- เมื่อ Traffic ถึง 50,000 pageviews/เดือน พิจารณาเปลี่ยนเป็น **Ezoic** หรือ **Mediavine** (RPM สูงกว่า)
- **Pro users ไม่เห็นโฆษณา** -- เป็นแรงจูงใจอีกทางในการอัปเกรด
- หลีกเลี่ยงโฆษณาที่รบกวน (ไม่ใช้ Pop-up, ไม่ใช้ Interstitial) เพราะ User base เป็น niche community

#### Revenue Projection (Ads)

| เดือนที่ | Pageviews/เดือน | RPM (บาท) | รายได้/เดือน |
|----------|----------------|-----------|-------------|
| 3 | 50,000 | 35 | 1,750 บาท |
| 6 | 150,000 | 40 | 6,000 บาท |
| 9 | 300,000 | 45 | 13,500 บาท |
| 12 | 500,000 | 50 | 25,000 บาท |

> Marketplace pages (Listings, Search, Seller profiles) เพิ่ม Pageviews อย่างมาก
> RPM สูงขึ้นเมื่อย้ายจาก AdSense ไป Ezoic/Mediavine ที่ 50k+ pageviews

---

### 5.3 Affiliate & Sponsorship (รายได้เสริม)

#### Affiliate Model

| รูปแบบ | รายละเอียด | Commission |
|--------|-----------|------------|
| **ลิงก์ซื้อการ์ด** | ในหน้า Card Detail แสดงปุ่ม "ซื้อการ์ดนี้" ลิงก์ไปร้านพาร์ทเนอร์ | 3-5% ของยอดขาย |
| **Sponsored Listings** | ร้านจ่ายเพื่อให้โลโก้ร้านปรากฏในหน้า Card Detail | 500-2,000 บาท/เดือน ขึ้นกับตำแหน่ง |
| **Featured Shop** | ร้านจ่ายเพื่อถูก Highlight ในหน้า "ร้านแนะนำ" | 1,000-3,000 บาท/เดือน |
| **Banner Sponsor** | ร้านซื้อพื้นที่ Banner เฉพาะ (แทน AdSense) | 3,000-5,000 บาท/เดือน |

#### ร้านเป้าหมายสำหรับ Affiliate

- ร้านการ์ดออนไลน์ในไทย (Shopee, Lazada shops)
- ร้าน LGS (Local Game Store) ที่มีหน้าร้าน
- ร้าน Proxy จากญี่ปุ่น
- ร้านอุปกรณ์ (Sleeve, Playmat, Deck box)

#### Referral Tracking

- ใช้ UTM parameters + Custom short links สำหรับแต่ละร้าน
- Dashboard สำหรับร้านค้าดู Performance (clicks, conversions)
- จ่ายคอมมิชชันรายเดือน เมื่อยอดถึง 300 บาทขึ้นไป

#### Revenue Projection (Affiliate)

| เดือนที่ | ร้านพาร์ทเนอร์ | รายได้เฉลี่ย/ร้าน | รายได้/เดือน |
|----------|---------------|-------------------|-------------|
| 6 | 5 | 1,500 บาท | 7,500 บาท |
| 9 | 8 | 2,500 บาท | 20,000 บาท |
| 12 | 12 | 3,000 บาท | 36,000 บาท |

---

### 5.4 Marketplace Commission (ช่องทางรายได้หลัก -- Revenue Engine)

Marketplace คือช่องทางที่มี Revenue potential สูงสุด เพราะ scale ตามจำนวน Transaction โดยไม่ต้องเพิ่มทรัพยากร

#### โมเดลค่าธรรมเนียม

| รายการ | ค่าธรรมเนียม | ผู้จ่าย | หมายเหตุ |
|--------|-------------|---------|----------|
| Transaction Fee | 5% ของราคาขาย | ผู้ขาย | เก็บเมื่อขายสำเร็จเท่านั้น |
| Listing Boost | 29-99 บาท/ครั้ง | ผู้ขาย | ดัน Listing ขึ้นหน้าแรก 24-72 ชม. |
| Featured Listing | 149 บาท/สัปดาห์ | ผู้ขาย | Highlight + Badge "Featured" |
| Escrow Fee | 3% เพิ่มเติม | ผู้ซื้อ (Optional) | ใช้ระบบ Escrow เพื่อความปลอดภัย (Phase ถัดไป) |

#### ทำไม 5% ถึงเหมาะสม

- TCGplayer เก็บ 10-15% -- เราถูกกว่ามาก
- Magi เก็บ 8% -- เรายังถูกกว่า
- Facebook Marketplace ฟรี -- แต่ไม่มีระบบป้องกัน ไม่มีราคากลาง
- 5% ต่ำพอให้ Seller ย้ายจาก Facebook มา แต่สูงพอให้มีรายได้จริง

#### Revenue Projection (Marketplace)

สมมติ Average order value = 500 บาท, Commission 5% = 25 บาท/transaction

| เดือนที่ | Active Sellers | Transactions/เดือน | GMV | Commission (5%) | Listing Boost | รายได้/เดือน |
|----------|--------------|-------------------|-----|----------------|--------------|-------------|
| 6 | 50 | 200 | 100,000 | 5,000 | 2,000 | 7,000 บาท |
| 9 | 200 | 1,000 | 500,000 | 25,000 | 8,000 | 33,000 บาท |
| 12 | 500 | 3,000 | 1,500,000 | 75,000 | 20,000 | 95,000 บาท |

> Marketplace เป็นตัวเร่งรายได้หลัก -- ทุกๆ 1 ล้านบาท GMV = 50,000 บาทรายได้

---

### 5.5 B2B Shop Dashboard (แพ็กเกจสำหรับร้านการ์ด)

ร้านการ์ดต้องเช็คราคา Yuyu-tei ทุกวันเพื่อตั้งราคาขาย เราทำให้อัตโนมัติ + เพิ่มเครื่องมือจัดการ

#### แพ็กเกจ

| แพ็กเกจ | ราคา/เดือน | ฟีเจอร์ |
|---------|-----------|---------|
| **Shop Basic** | 990 บาท | Bulk price lookup (500 การ์ด/วัน), Price change alerts, โลโก้ร้านบนเว็บ |
| **Shop Pro** | 1,990 บาท | ทุกอย่างใน Basic + Auto pricing tool, Inventory management, ลง Listing บน Marketplace อัตโนมัติ |
| **Shop Enterprise** | 2,990 บาท | ทุกอย่างใน Pro + API access ไม่จำกัด, Dedicated support, Custom branding บน Marketplace |

#### เหตุผลเรื่องราคา

- ร้านการ์ดในไทยมี margin 20-30% ต่อใบ ค่าใช้จ่าย 990-2,990 บาท/เดือนคือแค่ต้นทุนการ์ด 5-15 ใบ
- ถ้าระบบ Auto pricing ช่วยประหยัดเวลา 2 ชม./วัน = คุ้มค่าแน่นอน
- เทียบกับ Shopee/Lazada ที่เก็บค่าคอมฯ ทุก Transaction นี่คือ Fixed cost ที่ Predictable

#### Revenue Projection (B2B)

| เดือนที่ | Shop Basic | Shop Pro | Shop Enterprise | รายได้/เดือน |
|----------|-----------|---------|----------------|-------------|
| 6 | 3 | 1 | 0 | 4,960 บาท |
| 9 | 8 | 3 | 1 | 16,880 บาท |
| 12 | 15 | 8 | 3 | 39,770 บาท |

---

### 5.6 Data & API Services

#### ผลิตภัณฑ์

| ผลิตภัณฑ์ | ราคา | กลุ่มเป้าหมาย |
|----------|------|-------------|
| **Weekly Market Report** | ฟรี (เป็น Content marketing) | ทุกคน -- ดึง Traffic + สร้าง Authority |
| **Monthly Deep Dive Report** | 199 บาท/ฉบับ หรือรวมใน Pro+ | Investor, ร้านค้า |
| **API Basic** | 490 บาท/เดือน (1,000 req/day) | Developer, ร้านค้าเล็ก |
| **API Business** | 1,990 บาท/เดือน (10,000 req/day) | ร้านค้าใหญ่, แอปพลิเคชัน |

#### Revenue Projection (Data & API)

| เดือนที่ | Report ขาย | API สมาชิก | รายได้/เดือน |
|----------|-----------|-----------|-------------|
| 9 | 20 ฉบับ | 3 | 5,450 บาท |
| 12 | 50 ฉบับ | 8 | 17,870 บาท |

---

### 5.7 Merchandise (สินค้าแบรนด์ตัวเอง)

ใช้แบรนด์เว็บไซต์ขายสินค้า TCG Accessories ผ่านหน้าเว็บโดยตรง

#### สินค้า

| สินค้า | ต้นทุน | ราคาขาย | Margin | หมายเหตุ |
|--------|-------|---------|--------|----------|
| Custom Playmat | 150-200 บาท | 450-590 บาท | 60-65% | ผ่าน Anajak T-Shirt, Design เปลี่ยนตาม Meta/Season |
| Branded Sleeve (60 ชิ้น) | 40-60 บาท | 120-150 บาท | 55-60% | โลโก้แบรนด์, Limited edition |
| Deck Box | 50-80 บาท | 150-199 บาท | 50-60% | ตรงกลุ่มเป้าหมาย |
| เสื้อทีม / Community | 120-150 บาท | 350-450 บาท | 65-70% | สำหรับกิลด์และทีมแข่ง |

#### กลยุทธ์ Merchandise

- **Limited Edition** -- ออกรุ่นใหม่ทุก 1-2 เดือน สร้าง FOMO
- **Collaboration** -- ร่วมกับ Influencer สาย OPCG ออกแบบ Playmat ร่วม
- **Bundle** -- ซื้อ Pro membership + Playmat ลดพิเศษ
- **Dropshipping** -- ไม่ต้องสต็อกสินค้า สั่งผลิตตาม Order (Print-on-demand)

#### Revenue Projection (Merchandise)

| เดือนที่ | Orders/เดือน | Average order value | Margin 60% | รายได้/เดือน |
|----------|-------------|--------------------|-----------|--------------------|
| 6 | 30 | 500 บาท | 300 บาท | 9,000 บาท |
| 9 | 80 | 550 บาท | 330 บาท | 26,400 บาท |
| 12 | 150 | 600 บาท | 360 บาท | 54,000 บาท |

---

### 5.8 สรุป Revenue Projection รวม (ทุกช่องทาง)

| เดือนที่ | Freemium | Ads | Affiliate | Marketplace | B2B | Data/API | Merch | รวม/เดือน |
|----------|----------|-----|-----------|-------------|-----|---------|-------|-----------|
| 3 | 3,870 | 1,800 | 0 | 0 | 0 | 0 | 0 | **5,670 บาท** |
| 6 | 14,910 | 5,600 | 7,500 | 7,000 | 4,960 | 0 | 9,000 | **48,970 บาท** |
| 9 | 31,350 | 12,000 | 20,000 | 33,000 | 16,880 | 5,450 | 26,400 | **145,080 บาท** |
| 12 | 57,350 | 22,500 | 36,000 | 95,000 | 39,770 | 17,870 | 54,000 | **322,490 บาท** |

> ตัวเลขข้างต้นเป็น Moderate-Aggressive estimate
> Marketplace คิดเป็น ~30% ของรายได้รวมที่เดือน 12 เป็น Revenue engine หลัก
> Lifetime deals (Pro 100 คน x 1,999 บาท = 199,900 บาท one-time) ยังไม่รวมในตาราง

---

## 6. User Journey & Flow

### 6.1 First-time Visitor (ยังไม่สมัคร)

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

### 6.2 Registered User (Free Tier)

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

### 6.3 Pro Member

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
ไม่มีโฆษณา + Badge Pro
```

---

## 7. KPIs & Success Metrics

### 7.1 Acquisition Metrics (การเข้าถึง)

| KPI | เป้าหมาย (เดือนที่ 6) | เป้าหมาย (เดือนที่ 12) |
|-----|----------------------|----------------------|
| Monthly Active Users (MAU) | 5,000 | 15,000 |
| Registered Users | 3,000 | 10,000 |
| Marketplace Active Sellers | 50 | 500 |
| Organic Search Traffic | 40% ของ Total | 60% ของ Total |
| Pages Indexed by Google | 10,000+ | 30,000+ (รวมหน้า Listing) |

### 7.2 Engagement Metrics (การใช้งาน)

| KPI | เป้าหมาย |
|-----|----------|
| Average Session Duration | 3+ นาที |
| Pages per Session | 5+ หน้า |
| Return Visit Rate (กลับมาใน 7 วัน) | 40%+ |
| Portfolio Usage Rate (ในกลุ่ม Registered) | 30%+ |
| Watchlist Usage Rate | 50%+ |

### 7.3 Revenue Metrics (รายได้)

| KPI | เป้าหมาย |
|-----|----------|
| Free to Pro Conversion Rate | 5%+ |
| Free to Pro+ Conversion Rate | 2%+ |
| Total Monthly Revenue เดือนที่ 12 | 200,000-300,000+ บาท |
| Marketplace GMV เดือนที่ 12 | 1,500,000+ บาท |
| Ad Revenue per 1,000 Pageviews (RPM) | 40-50 บาท |
| B2B Shop Subscribers | 25+ ร้าน |
| Affiliate Partner Retention Rate | 80%+ ต่อเนื่อง 3 เดือน |
| Churn Rate (Pro/Pro+ ยกเลิก) | ต่ำกว่า 8%/เดือน |

### 7.4 Product Health Metrics (สุขภาพผลิตภัณฑ์)

| KPI | เป้าหมาย |
|-----|----------|
| Scraper Success Rate | 99%+ (ดึงข้อมูลสำเร็จ) |
| Data Freshness | อัปเดตราคาภายใน 24 ชม. |
| Site Uptime | 99.5%+ |
| Page Load Time | ต่ำกว่า 2 วินาที |
| Community Price Reports / วัน | 20+ (เมื่อเปิดฟีเจอร์) |

---

## 8. Risk Analysis & Mitigation

### 8.1 ความเสี่ยงด้านเทคนิค

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **Yuyu-tei บล็อก IP** | ปานกลาง | สูง -- ไม่มีข้อมูลราคา | 1) Delay + Rate limit ตั้งแต่ต้น 2) เตรียม Rotating proxy 3) มี Backup data source (eBay JP, Mercari) |
| **Yuyu-tei เปลี่ยน UI** | สูง | ปานกลาง -- บอทพัง | 1) ใช้ Robust selectors 2) Alert ทันทีเมื่อ Scrape ล้มเหลว 3) ทีมพร้อมแก้ภายใน 24 ชม. |
| **API Key / DB credentials รั่ว** | ต่ำ | สูง | 1) ใช้ .env เสมอ 2) Secret rotation ทุก 90 วัน 3) ไม่เปิดไฟล์สำคัญในไลฟ์ |
| **Database ล่ม / ข้อมูลหาย** | ต่ำ | สูงมาก | 1) Automated daily backup 2) Point-in-time recovery 3) อย่างน้อย 2 copies ต่างตำแหน่ง |

### 8.2 ความเสี่ยงด้านธุรกิจ

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **ถูกฟ้อง Cease & Desist** | ต่ำ | สูง | 1) ใส่ Credit แหล่งที่มาชัดเจน 2) ไม่ Hotlink 3) พร้อมสลับ Data source ทันที (eBay, Crowdsource) |
| **คู่แข่งรายใหญ่ทำฟีเจอร์เดียวกัน** | ปานกลาง | ปานกลาง | 1) โฟกัส OPCG ให้ลึกที่สุด 2) Marketplace + Portfolio ดีกว่า 3) Community engagement สูงกว่า |
| **User ไม่ยอมจ่าย Pro** | ปานกลาง | ต่ำ (มีช่องทางอื่น) | 1) Marketplace Commission เป็น Revenue หลักแทน 2) Ads เป็น backup 3) ปรับราคาลง / เพิ่ม Value |
| **ไม่มีร้านค้าสนใจ Affiliate/B2B** | ปานกลาง | ปานกลาง | 1) เริ่มจาก 1-2 ร้านที่รู้จักก่อน 2) ให้ทดลองฟรี 1-3 เดือน 3) โชว์ Traffic + Transaction data |
| **Marketplace ไม่มีคนลง Listing (Cold start)** | สูง | สูง | 1) ทีมลง Listing ตัวอย่างเองช่วงแรก 2) 0% Fee 30 วันแรก 3) ดึงร้าน LGS มาลง Listing ฟรี 4) Referral program |
| **หลอกลวงบน Marketplace (Scam)** | ปานกลาง | สูง | 1) Seller verification 2) Rating system 3) Escrow option 4) Dispute resolution team 5) ระงับบัญชีทันทีเมื่อพบปัญหา |

### 8.3 ความเสี่ยงด้านข้อมูล

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **ราคา JP ไม่สะท้อนตลาดไทย** | สูง | ปานกลาง | 1) Community Price ให้ User รายงานราคาไทย 2) แสดงคู่กัน พร้อม Disclaimer ชัดเจน |
| **Community Price ถูก Manipulate** | ปานกลาง | ปานกลาง | 1) ต้อง Login 2) จำกัดรายงาน/วัน 3) ระบบโหวตยืนยัน 4) ตัดค่า Outlier อัตโนมัติ |
| **ข้อมูล Master Data ไม่ครบ** | ต่ำ | ต่ำ | 1) ใช้หลายแหล่ง (Bandai official + GitHub) 2) User report missing card |

### 8.4 ความเสี่ยงด้านกฎหมาย

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | แผนรับมือ |
|-----------|-----------|---------|----------|
| **ละเมิดลิขสิทธิ์รูปการ์ด** | ต่ำ-ปานกลาง | สูง | 1) ใช้รูปจาก Official source พร้อม Credit 2) อ้าง Fair Use (ใช้เพื่ออ้างอิง ไม่ใช่เพื่อขาย) 3) พร้อมลบรูปทันทีถ้าได้รับแจ้ง |
| **PDPA (พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล)** | ต่ำ | ปานกลาง | 1) Privacy Policy + Cookie consent 2) เก็บเฉพาะข้อมูลที่จำเป็น 3) ให้ User ลบบัญชีได้ |

---

## 9. Scraping Ethics & Legal Compliance

### หลักปฏิบัติ

1. **No Hotlinking** -- ห้ามดึงรูปจาก URL ของ Yuyu-tei โดยตรง ดาวน์โหลดมาเก็บ Storage ตัวเอง
2. **Give Credit** -- ระบุที่มาของข้อมูลราคาชัดเจนในทุกหน้า: "ข้อมูลราคาอ้างอิงจาก Yuyu-tei"
3. **Rate Limiting** -- รันบอทแค่วันละ 1 ครั้ง ช่วงเวลาที่ Traffic น้อย (ตี 2-3)
4. **Respectful Scraping** -- ใส่ Delay 1-2 วินาทีระหว่าง Request, เช็ค robots.txt
5. **Disclaimer** -- ลงประกาศชัดเจนว่าราคาเป็น "ราคากลางอ้างอิง" ไม่ใช่ราคาซื้อขายจริง
6. **Opt-out Ready** -- ถ้าเจ้าของข้อมูลขอให้หยุด พร้อมหยุดและสลับแหล่งข้อมูลทันที

---

## 10. Go-To-Market Strategy

### ช่วง Pre-launch (ก่อนเปิดตัว)

- สร้าง Landing page "Coming Soon" เก็บ Email list
- ทำ Content SEO ล่วงหน้า: บทความ "ราคาการ์ดวันพีช OP01-ปัจจุบัน"
- Teaser ในกลุ่ม Facebook OPCG ไทย

### ช่วง Launch (MVP)

- **Online:** โพสต์ในกลุ่ม Facebook OPCG ไทย (ใช้ Meelike-th ดันโพสต์ให้ไวรัล)
- **Influencer:** ส่งให้ YouTuber / Streamer สาย OPCG ลองใช้ + รีวิว
- **Offline:** แจก Custom Playmat ให้กิลด์ที่สมัครใช้งาน (ผ่าน Anajak T-Shirt)
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
- B2B Sales: ติดต่อร้านการ์ดโดยตรงเสนอ Shop Dashboard ทดลองใช้ฟรี 1 เดือน
- Merchandise drops ทุก 1-2 เดือน สร้าง Buzz และ Community engagement

---

## 11. Team Structure & Roles (ทีม 2-3 คน)

| Role | ความรับผิดชอบ |
|------|-------------|
| **Full-stack Developer (Lead)** | พัฒนาเว็บ, Scraper bot, Database, DevOps |
| **Frontend / Design** | UI/UX Design, Responsive, Data visualization (กราฟ) |
| **Content / Community Manager** | ดูแลโซเชียล, เขียน Content SEO, ติดต่อร้านค้า Affiliate, ตอบ Feedback |

> ในช่วง MVP ถ้ามี 2 คน: Developer ทำทั้ง Full-stack + DevOps, อีกคนทำ Design + Community
> คนที่ 3 ค่อยเพิ่มเมื่อถึง Phase 2 เพื่อดูแล Content / Business development

---

## 12. Cost Structure (ค่าใช้จ่ายโดยประมาณ)

| รายการ | MVP (เดือน 1-3) | Growth (เดือน 3-6) | Scale (เดือน 6-12) | หมายเหตุ |
|--------|----------------|-------------------|-------------------|----------|
| Vercel Hosting | 0 บาท | 700 บาท | 700-1,400 บาท | Pro plan เมื่อ Traffic สูง |
| Supabase | 0 บาท | 900 บาท | 900-1,750 บาท | Pro plan สำหรับ Marketplace data |
| Domain name | 40 บาท | 40 บาท | 40 บาท | ~500 บาท/ปี |
| Exchange Rate API | 0 บาท | 0 บาท | 0 บาท | Free tier เพียงพอ |
| Image/File Storage | 0 บาท | 350 บาท | 700-1,400 บาท | Marketplace photos เพิ่ม usage |
| Rotating Proxy | 0 บาท | 0-700 บาท | 700-1,750 บาท | เริ่มใช้เมื่อจำเป็น |
| Email Service (Resend/SES) | 0 บาท | 0 บาท | 350-700 บาท | Alerts, Transaction emails |
| Payment Gateway | 0 บาท | 0 บาท | 2-3% of revenue | Stripe/Omise สำหรับ Marketplace |
| **รวมโดยประมาณ** | **~100-500 บาท** | **~2,000-3,000 บาท** | **~4,000-8,000 บาท** | ยังไม่รวม Merch ต้นทุน |

> Margin ที่เดือน 12: รายได้ ~322,000 บาท - ค่าใช้จ่าย ~8,000 บาท = **กำไรขั้นต้น ~314,000 บาท/เดือน (97% margin)**
> ค่าใช้จ่ายหลักที่เพิ่มคือ Merchandise ต้นทุน (~40% of Merch revenue) แต่เป็น Variable cost ที่ scale ตาม Order

---

## Appendix: Feature Priority Matrix

| ฟีเจอร์ | Impact (ผลกระทบ) | Effort (ความยาก) | Revenue Impact | Priority |
|---------|-----------------|-----------------|---------------|----------|
| Card Database + ราคา | สูง | ปานกลาง | ต่ำ (Foundation) | P0 (ต้องมี) |
| Daily Price Scraping | สูง | ปานกลาง | ต่ำ (Foundation) | P0 |
| JPY-THB Conversion | สูง | ต่ำ | ต่ำ | P0 |
| Search & Filter | สูง | ต่ำ | ต่ำ | P0 |
| Price History Graph | สูง | ปานกลาง | ปานกลาง (Pro gate) | P0 |
| Top Trending Dashboard | สูง | ต่ำ | ปานกลาง (Traffic) | P0 |
| SEO Optimization | สูง | ต่ำ | สูง (Ads revenue) | P0 |
| User Auth | ปานกลาง | ต่ำ | สูง (Pro gate) | P1 |
| Portfolio System | สูง | สูง | สูง (Pro gate) | P1 |
| Watchlist & Alerts | ปานกลาง | ปานกลาง | สูง (Pro gate) | P1 |
| Community Price | ปานกลาง | สูง | ปานกลาง | P1 |
| **Marketplace** | **สูงมาก** | **สูง** | **สูงมาก (Revenue engine)** | **P1.5** |
| Deck Calculator | ปานกลาง | ปานกลาง | ต่ำ | P2 |
| **B2B Shop Dashboard** | **สูง** | **ปานกลาง** | **สูง** | **P2** |
| Multi-TCG Support | สูง | สูง | สูง (ขยาย TAM) | P2 |
| LINE Notify | ปานกลาง | ต่ำ | ปานกลาง | P2 |
| **Merchandise Store** | **ปานกลาง** | **ต่ำ** | **ปานกลาง-สูง** | **P2** |
| API for Partners | ปานกลาง | ปานกลาง | ปานกลาง | P3 |
| PWA / Mobile | ปานกลาง | ปานกลาง | ต่ำ | P3 |
