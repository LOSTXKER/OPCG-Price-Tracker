# MeeCard Advertising Placement Plan — 2026-07-24

> สถานะ: **Owner อนุมัติแล้ว · P0 Card chart-rail correction 2026-07-25**
>
> P0 เปิด Home, Search, Set Detail และ Card Detail แล้ว; โฆษณาหลัง hero/header ถูกถอดทั้งหมด แต่ Card Detail คง rectangle ข้างกราฟตามคำยืนยันล่าสุด พร้อม contextual slot อื่นและ bottom anchor กลาง ส่วน route อื่นใน matrix ยังเป็น P1 และต้องรอ review ของจริงก่อนขยาย

## 1. เป้าหมาย

MeeCard จะมีโฆษณา 2 แบบที่แยกกันชัดเจน:

1. **Google Ads Mockup (`GOOGLE_MOCK`)**
   - ใช้ภาพ creative สินค้า TCG สมมติที่เก็บในโปรเจกต์ + copy local เพื่อดูหน้าตาและจังหวะใกล้โฆษณาจริง
   - ไม่โหลด Google script, iframe, pixel, cookie, consent flow หรือยิง network request
   - ต้องติดป้าย `Google Ads · Mockup` ชัด และกดไม่ได้
2. **Direct Sponsor (`DIRECT`)**
   - creative ของร้านการ์ด แบรนด์ งานอีเวนต์ หรือพาร์ตเนอร์ที่ซื้อจาก MeeCard โดยตรง
   - campaign `ACTIVE` มีชื่อผู้สนับสนุน, copy สั้น, CTA และช่วงเวลาแคมเปญที่ตรวจแล้ว
   - campaign `ACTIVE` ติดป้าย `ผู้สนับสนุน` / `Sponsored` ชัดทุกครั้ง และ external link ต้องตรวจสอบแล้ว
   - แทนที่ Google mock ใน placement ที่ strategy เป็น `DIRECT_THEN_GOOGLE` ด้วย geometry เดิมแบบ 1:1
   - ถ้าไม่มี campaign `ACTIVE` ให้แสดง Google mock ตามปกติ ห้ามแสดงข้อความเปิดขายพื้นที่หรือ CTA `/contact` ใน slot

หนึ่ง placement แสดงโฆษณาได้เพียงแบบเดียว: Google เป็นค่าเริ่มต้น และ Direct ที่มีผู้ซื้อจริงจึง override ช่องนั้น ห้ามสร้าง placement แยกสำหรับ Direct หรือแสดงทั้งสองแบบติดกัน

## 2. แนวทางความเด่น

Owner ต้องการพื้นที่ที่มองเห็นจริงโดยไม่ทำลาย hierarchy ช่วงบนของหน้า:

- ทุกหน้า **ห้ามมีโฆษณาหลัง hero/header หรือเหนือหัวตาราง**
- P0 ใช้ **bottom anchor 320×64 / 728×90** ลอยเหนือขอบล่าง พร้อมปุ่มปิดและจำการปิดตลอด browser session
- หน้าที่มีตารางใช้ **leaderboard เป็นแถวเต็มตาราง** หลังผู้ใช้เห็นข้อมูล 8 รายการ
- หน้ารายการแบบแบ่งหัวข้อใช้ **leaderboard ก่อนหัวข้อถัดไป** ไม่คั่นกลาง grid
- หน้ายาวใช้ **mid-content rectangle** 2 จุดได้
- หน้า desktop ที่มี rail ใช้ **336×280** อยู่ใน layout ไม่ overlay
- มือถือใช้ **300×250 หรือ 320×100 แบบ in-flow**

bottom anchor เป็น fixed surface เพียงชนิดเดียวที่อนุญาต ต้องเว้นเหนือ BottomNav/safe area, เพิ่ม document-end clearance และดัน floating controls อื่นขึ้นอัตโนมัติ ห้ามทับปุ่มนำทางหรือ action หลัก ส่วน slot อื่นทั้งหมดต้องอยู่ใน flow ของหน้า

## 3. Slot vocabulary และขนาด

| Format | Mobile | Desktop | ใช้เมื่อ |
| --- | --- | --- | --- |
| `ANCHOR` | 320×64 | 728×90 | fixed bottom anchor กลาง P0 พร้อมปุ่มปิด |
| `LEADERBOARD` | 320×100 | 970×90 | แถวข้อมูลและรอยต่อ section แนวนอน |
| `RECTANGLE` | 300×250 | 336×280 | เนื้อหายาวและ rail ข้าง content |

ทุก format มี outer frame กลางชุดเดียว ทั้ง Google และ Direct จึงสลับ provider แล้วความสูง/จังหวะหน้าไม่กระโดด

## 4. Density contract

แผนนี้ให้ความสำคัญกับ viewability มากกว่าจำนวน:

| ประเภทหน้า | จำนวนสูงสุด | จังหวะ | Direct override |
| --- | ---: | --- | --- |
| หน้าสั้น | 1–2 | bottom anchor หรืออยู่ข้าง content หลัก | bottom anchor ได้ |
| Detail / data-rich | 2–3 | bottom anchor + contextual rail ที่แยกจากข้อมูลชัดเจน | ช่องที่ registry อนุญาต |
| Catalog / search / feed | 1–2 | bottom anchor + in-feed หลัง 8–12 รายการ | bottom anchor ได้ |
| Long-form guide / blog | 2–3 | bottom anchor + mid-content ตาม section boundary | bottom anchor ได้ |
| Tool | 1–2 | แสดงหลังมีผลลัพธ์และระหว่าง section เท่านั้น | ช่องแรกได้ |
| หน้า member/private | 2 | หลัง summary + หลังรายการชุดแรก; แสดงเฉพาะ Free | ช่องแรกได้ |
| Transaction/form | 0 | ไม่คั่นระหว่างผู้ใช้กำลังกรอกหรือยืนยันรายการ | — |

กติกากลาง:

- Free/anonymous เห็นตาม route; Pro/Pro+/Lifetime ที่มี `adFree` ต้องไม่เห็นทั้งสองแบบและไม่เหลือช่องว่าง
- หน้า empty/loading/error ไม่แสดงโฆษณา
- ทุก slot เริ่มจาก Google mock; Direct campaign ที่ `ACTIVE` จึงแทนได้เฉพาะ zone ที่ registry อนุญาต
- ไม่มี/หยุด Direct campaign ให้ fallback เป็น Google ทันที ห้ามมี `AVAILABLE` state ใน UI
- Google mock ต้องคงขนาดเพื่อ review layout แต่ไม่มี interaction/network
- bottom anchor แสดงครั้งเดียวต่อ route, ปิดได้ด้วย touch target ≥44px และเมื่อปิดต้องหายทั้ง anchor/clearance ตลอด session
- ใน catalog ห้ามวางเป็นการ์ดใบแรก และห้ามวางติดกันสอง slot
- ห้ามวาง slot หลังเนื้อหาหลักหรือ pagination เป็น tail; ถ้าต้องการ inventory เพิ่มให้ย้ายเข้า contextual row/section boundary
- ทุก slot มี `data-ad-kind`, `data-ad-zone` และ label ที่ screen reader อ่านได้

## 5. Placement matrix รายหน้า

เส้นทาง game-scoped ด้านล่างหมายถึงทั้ง route ที่เห็นเป็น `/opcg/...` และ normalized route ภายในแอป

### 5.1 Discovery / market

| Route | Google mock placement (default) | Direct override ที่อนุญาต | จำนวน |
| --- | --- | --- | ---: |
| `/opcg` | `ANCHOR` ลอยล่าง; `LEADERBOARD` เป็นแถวเต็ม `MarketTable` หลังผลลัพธ์ลำดับ 8 | `global-bottom-anchor` | 2 |
| `/opcg/search` | `ANCHOR` ลอยล่าง; `LEADERBOARD` เป็นแถวเต็ม `MarketTable` หลังผลลัพธ์ลำดับ 8; ไม่มี slot เหนือหัวตารางหรือหลัง pagination | `global-bottom-anchor` | 2 |
| `/opcg/trending` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` ระหว่างข้อมูลชุดแรกกับชุดถัดไป | bottom anchor | 2 |
| `/opcg/market-overview` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` ระหว่าง gainers กับ losers หรือก่อน Related Pages | bottom anchor | 2 |
| `/opcg/sets` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` เต็มแถวหลัง set ลำดับ 8 | bottom anchor | 2 |
| `/opcg/sets/[setCode]` | `ANCHOR` ลอยล่าง; `LEADERBOARD` ก่อนหัวข้อ rarity ถัดไปเมื่อผ่านอย่างน้อย 12 ใบ; ไม่มี tail ก่อน Other Sets | `global-bottom-anchor` | 2 |
| `/opcg/cards/[code]` | `ANCHOR` ลอยล่าง; `RECTANGLE` ข้างกราฟบน desktop/ต่อใต้กราฟบนมือถือ; `RECTANGLE` คอลัมน์ขวาคู่กับ “ขายอยู่บน Meecard” บน desktop/ต่อใต้ marketplace บนมือถือ; ไม่มี tail ก่อน related cards | `global-bottom-anchor`, `card-detail-chart-rail` | 3 |
| `/cards` | ไม่มี slot เพราะเป็น redirect ไป `/` หรือ `/search` | ไม่มี | 0 |

ข้อกำกับหน้าการ์ด: อนุญาต rectangle ข้างกราฟตามคำยืนยันของ owner แต่ creative ต้องแยกกรอบและติดป้ายโฆษณาชัด เพื่อไม่สื่อว่า sponsor เป็นผู้ยืนยันราคาตลาด; slot นี้ stack ต่อใต้กราฟบนจอเล็กและยุบโดยไม่เหลือช่องว่างเมื่อผู้ใช้มีสิทธิ์ `adFree`

### 5.2 Blog / guide / public content

| Route | Google mock placement (default) | Direct override ที่อนุญาต | จำนวน |
| --- | --- | --- | ---: |
| `/blog` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` หลัง post ลำดับ 6 | bottom anchor | 2 |
| `/blog/[slug]` | P1: `ANCHOR` ลอยล่าง; `RECTANGLE` ราว 35% และ 70% ของ article body | bottom anchor | 3 |
| `/guide` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` ก่อน FAQ | bottom anchor | 2 |
| `/guide/getting-started` | `LEADERBOARD` หลังพื้นฐาน/สิ่งที่ต้องเตรียม; `RECTANGLE` หลัง turn flow; `RECTANGLE` ก่อนแหล่งอ้างอิง | ช่องแรก | 3 |
| `/guide/card-types` | `LEADERBOARD` หลังสรุปประเภทการ์ด; `RECTANGLE` หลัง anatomy; `RECTANGLE` ก่อนแหล่งอ้างอิง | ช่องแรก | 3 |
| `/guide/colors` | `LEADERBOARD` หลัง overview สีหลัก; `RECTANGLE` หลัง multicolor; `RECTANGLE` ก่อนแหล่งอ้างอิง | ช่องแรก | 3 |
| `/guide/rarities` | `LEADERBOARD` หลัง rarity หลัก; `RECTANGLE` หลัง SP/reprint; `RECTANGLE` ก่อนแหล่งอ้างอิง | ช่องแรก | 3 |
| `/guide/sets` | `LEADERBOARD` หลังประเภทชุด; `RECTANGLE` หลัง card-code format; `RECTANGLE` ก่อนแหล่งอ้างอิง | ช่องแรก | 3 |
| `/guide/buying` | `LEADERBOARD` หลัง checklist ก่อนซื้อ; `RECTANGLE` ก่อน Related Pages | ช่องแรก | 2 |
| `/about` | ไม่มี เพื่อรักษาความน่าเชื่อถือของเรื่องราวแบรนด์ | ไม่มี | 0 |
| `/contact` | ไม่มี ad; contact flow รับ lead โฆษณาได้โดยไม่สร้าง slot | ไม่มี | 0 |
| `/coming-soon` | P1: `ANCHOR` ลอยล่าง | bottom anchor เมื่อ sponsor เกี่ยวข้องกับเกม/อีเวนต์ | 1 |

### 5.3 Tools

| Route | Google mock placement (default) | Direct override ที่อนุญาต | จำนวน |
| --- | --- | --- | ---: |
| `/opcg/decks` | `LEADERBOARD` ระหว่าง tool grid กับ saved decks | ช่องนี้ | 1 |
| `/opcg/deck-calculator` | `LEADERBOARD` หลัง deck summary เมื่อมีการ์ดแล้ว; `RECTANGLE` หลัง cost breakdown/result | ช่องแรก; ไม่แสดงทั้งคู่ตอนกำลังสร้างเด็ค | 2 |
| `/opcg/drop-calculator` | P1: `ANCHOR` ลอยล่าง; `RECTANGLE` หลัง want-list breakdown | bottom anchor; ไม่แสดงในขั้นเลือกชุด/เลือกการ์ด | 2 |
| `/opcg/compare` | `LEADERBOARD` หลัง comparison summary เมื่อมีอย่างน้อย 2 ใบ; `LEADERBOARD` หลัง comparison dossier | ช่องแรก | 2 |

### 5.4 Member / collection

ทุก slot ในกลุ่มนี้แสดงเฉพาะ Free; paid tier ต้องหายทั้ง slot

| Route | Google mock placement (default) | Direct override ที่อนุญาต | จำนวน |
| --- | --- | --- | ---: |
| `/watchlist` | P1: `ANCHOR` ลอยล่าง; `RECTANGLE` หลังรายการ/การ์ดลำดับ 8 | bottom anchor | 2 |
| `/portfolio` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` หลัง portfolio grid | bottom anchor | 2 |
| `/portfolio/[id]` | P1: `ANCHOR` ลอยล่าง; `RECTANGLE` หลัง holdings ลำดับ 8 | bottom anchor | 2 |
| `/profile/[userId]`, `/u/[handle]` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` หลัง public collection/reviews | bottom anchor | 2 |
| `/saved` | P1: `ANCHOR` ลอยล่าง; `RECTANGLE` หลังรายการลำดับ 8 | bottom anchor | 2 |
| `/honey` | `LEADERBOARD` เฉพาะแท็บ Shop/Raffle/Rankings หลัง tab header | ช่องนี้ | 1 |
| `/more` | `LEADERBOARD` หลังกลุ่ม navigation หลัก | ช่องนี้ | 1 |
| `/profile` ของเจ้าของบัญชี | ไม่มี เพราะเป็นหน้าจัดการตัวตน/ข้อมูลบัญชี | ไม่มี | 0 |

### 5.5 Marketplace (ใช้เมื่อเปิด feature flag)

| Route | Google mock placement (default) | Direct override ที่อนุญาต | จำนวน |
| --- | --- | --- | ---: |
| `/marketplace` | P1: `ANCHOR` ลอยล่าง; `RECTANGLE` หลัง listing ลำดับ 12 | bottom anchor; เหมาะกับร้านการ์ด/งานอีเวนต์ | 2 |
| `/marketplace/[listingId]` | `RECTANGLE` ใต้ seller trust block โดยไม่อยู่ใกล้ buy/offer CTA | ช่องนี้ | 1 |
| `/raffle/winners` | P1: `ANCHOR` ลอยล่าง; `LEADERBOARD` เป็นแถวหลังผู้ชนะลำดับ 20 เมื่อรายการยาว | bottom anchor; เหมาะกับ sponsor รางวัล | 2 |
| `/marketplace/create` | ไม่มี | ไม่มี | 0 |
| `/orders`, `/orders/[id]` | ไม่มี | ไม่มี | 0 |
| `/messages`, `/messages/[listingId]` | ไม่มี | ไม่มี | 0 |
| `/seller/**` | ไม่มี เพราะเป็น workspace จัดการร้าน | ไม่มี | 0 |

### 5.6 Routes ที่ห้ามมี slot

- `/pricing` — เป็นหน้า conversion และต้องอธิบายสิทธิ์ `ไม่มีโฆษณา` ให้ชัด
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/admin-login`
- `/settings/**` — account, security, billing, subscription, privacy, export, addresses, notifications, marketplace, alerts
- `/admin/**`
- `/marketplace/create`, `/orders/**`, `/messages/**`, `/seller/**`
- `/proto/**`
- modal/dialog/sheet ทุกชนิด
- loading, error, empty และ not-found states

## 6. ลำดับ inventory และการขายตรง

Direct Sponsor ควรขายเป็น package ที่อธิบายง่าย:

1. **P0 Bottom Anchor**
   - Home/Search/Set Detail/Card Detail: override `global-bottom-anchor` เดียว
   - เหมาะกับร้านใหญ่ งานแข่งขัน สินค้าใหม่ หรือบริการนักสะสม
2. **Collector Intent (P1)**
   - Card detail: `card-detail-chart-rail` เปิดใน P0 และขายตรงแทน Google ได้; marketplace rail คงเป็น Google-only จนกว่าจะ review เพิ่ม
   - Watchlist/Portfolio: พิจารณา contextual slot หลังข้อมูลชุดแรก
   - เหมาะกับ grading, sleeve, storage และ card shop
3. **Learn & Play**
   - Guide/Blog: override bottom anchor หรือ contextual slot แรกหลังเนื้อหาเริ่มแล้ว
   - Deck/Drop/Compare: override slot แรกหลังผลลัพธ์
   - เหมาะกับร้านสอนเล่น อีเวนต์ และ community
4. **Event/Raffle Sponsor**
   - Honey Raffle และ Raffle Winners
   - ต้องระบุผู้สนับสนุนรางวัลกับเงื่อนไขชัด

การขาย Direct ทำผ่าน contact flow ด้านล่าง ไม่ประกาศขายใน slot ฝั่งผู้ใช้ เมื่ออนุมัติแคมเปญแล้วจึงเพิ่ม `ACTIVE` campaign เข้า zone ที่ขายได้; เมื่อเอาออก slot เดิมกลับไปแสดง Google mock โดยอัตโนมัติ

## 7. Contact flow สำหรับ Direct Sponsor

เพิ่มตัวเลือก `ลงโฆษณากับ MeeCard` ใน `/contact` และ footer โดยเก็บอย่างน้อย:

- ชื่อแบรนด์/ร้าน
- ผู้ติดต่อและช่องทางตอบกลับ
- URL ปลายทาง
- route/แพ็กเกจที่สนใจ
- วันที่เริ่ม–สิ้นสุด
- งบประมาณโดยประมาณ
- creative ที่มี (desktop/mobile)

รอบแรกใช้ contact lead เท่านั้น ยังไม่ต้องสร้าง checkout หรือให้ระบบรับเงินอัตโนมัติ

## 8. Architecture ที่ใช้ใน P0

สร้างแล้วหลัง owner อนุมัติ:

- `AdInventorySlot` — component กลาง รับ `zone` เท่านั้น
- `FloatingBottomAd` — mount ครั้งเดียวใน global chrome, แสดงเฉพาะ route P0 ที่ registry อนุญาต และไม่สร้าง wrapper ก่อน audience/hydration พร้อม
- `AdPageContentReady` — marker แบบ route-keyed ที่หน้า P0 render เฉพาะเมื่อมี real content; root anchor จึงหายทันทีระหว่าง loading/query pending และไม่เกิดบน initial/empty/error/not-found
- zone ID เป็นชื่อตำแหน่ง ไม่ผูกคำว่า Google/Direct
- registry กลางใช้ strategy `GOOGLE_ONLY` / `DIRECT_THEN_GOOGLE`
- route allowlist + hard denylist
- direct campaign registry ว่างเป็นค่าเริ่มต้นและรับเฉพาะ campaign `ACTIVE` ที่อนุมัติแล้ว
- provider component แยก:
- `GoogleAdMockup`
  - `DirectSponsorCreative`
- render decision เดียว:
  1. route/state ผ่าน
  2. tier ไม่มี `adFree`
  3. page มี real content
  4. strategy อนุญาตและมี Direct `ACTIVE` → Direct
  5. กรณีอื่นทั้งหมด → Google mock
- Google/Direct ใช้ outer geometry กลางเดียว จึงแสดงอย่างใดอย่างหนึ่งโดยหน้าไม่กระโดด
- bottom anchor ใช้ session key แบบ versioned; เมื่อปิดจะหายทั้ง creative/clearance และ floating controls อื่นอ่าน `--floating-ad-clearance` เพื่อไม่ชนกัน
- Google mock ใช้ asset local `public/ads/google-mock-card-accessories-v1.jpg`; ไม่มี Google env/script/consent ในเฟส mockup

## 9. Verification gate ก่อนเปิด UI ใหม่

- source scan ไม่มี `adsbygoogle`, `googlesyndication`, Google ad iframe/pixel/script
- ทุก zone มี route test ทั้ง allow/deny และ game prefix
- paid tier, loading และ empty/error คืน `null` แบบไม่มี wrapper/spacing
- ไม่มี Direct campaign ต้องได้ Google fallback; active Direct ต้องแทน Google เพียงหนึ่ง creative และ geometry เท่าเดิม
- runtime ไม่มีข้อความ `พื้นที่ Direct Sponsor`, CTA ติดต่อโฆษณา หรือ provider suffix ใน zone ID
- Browser 390/768/1280px ตรวจ no-overflow, anchor ไม่ทับ BottomNav/action หลัก และ contextual slot อยู่ใน flow
- ปิด anchor แล้วต้องหายทั้ง creative/clearance ข้าม route และหลัง reload ใน session เดิม โดย contextual slot ยังอยู่
- zone หลัง hero/header `home-after-hero`, `set-detail-after-hero` ต้องไม่อยู่ใน registry/DOM; `card-detail-chart-rail` ต้องอยู่ข้างกราฟบน desktop/ต่อใต้กราฟบนมือถือ
- catalog ตรวจตำแหน่งหลัง index ตามจริงทั้ง grid/list/table fallback
- long-form ตรวจ slot ไม่ตัด heading ออกจาก paragraph แรก
- direct creative มี `Sponsored`, external-link disclosure และ keyboard focus
- full TypeScript, lint, test และ build ผ่านก่อนเคลมเสร็จ

## 10. แหล่งอ้างอิงขนาดและข้อกำกับ

- Google Ad Manager — Supported ad sizes: https://support.google.com/admanager/answer/1100453
- Google AdSense — Best practices for ad placement: https://support.google.com/adsense/answer/1282097
- Google AdSense — Ad formats FAQ / sticky requirements: https://support.google.com/adsense/answer/10734935
- Google AdSense — Responsive ad tag parameters: https://support.google.com/adsense/answer/9183460
