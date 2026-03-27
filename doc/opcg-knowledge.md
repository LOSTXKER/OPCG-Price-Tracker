# One Piece Card Game (OPCG) — ความรู้พื้นฐานสำหรับ Dev

เอกสารนี้สรุปความรู้ที่จำเป็นสำหรับ dev ที่ทำระบบ MeeCard
โดยไม่จำเป็นต้องเคยเล่น One Piece TCG มาก่อน

---

## 1. ภาพรวมของเกม

One Piece Card Game (OPCG) เป็น Trading Card Game ของ Bandai
ออกขายครั้งแรกปี 2022 ในญี่ปุ่น มีเวอร์ชัน Asia (EN/TH/CN/KR) ตามมา

ผู้เล่น 2 คนสู้กันโดยใช้ **เด็ค 50 ใบ** + **Leader 1 ใบ** + **DON!! 10 ใบ**
เป้าหมายคือทำให้ฝ่ายตรงข้าม Life = 0 แล้วโจมตีให้จบ

---

## 2. ประเภทการ์ด (Card Types)

| ประเภท | อธิบาย | ใน DB |
|---|---|---|
| **Leader** | การ์ดผู้นำ ใช้ได้ 1 ใบต่อเด็ค กำหนดสีและกลยุทธ์ของเด็ค | `LEADER` |
| **Character** | ตัวละครที่ลงสนามเพื่อโจมตี/ป้องกัน (ประเภทหลัก มีมากที่สุด) | `CHARACTER` |
| **Event** | ใช้แล้วทิ้ง (spell) เช่น เพิ่มพลัง, ดึงการ์ด, ทำลายตัวละครฝ่ายตรงข้าม | `EVENT` |
| **Stage** | สนาม วางไว้แล้วให้เอฟเฟ็กต์ต่อเนื่อง | `STAGE` |
| **DON!!** | การ์ดพลังงาน ใช้จ่ายเพื่อลงการ์ดหรือเสริมพลัง ไม่ใส่ในเด็ค (แยกกอง 10 ใบ) | `DON` |

---

## 3. ค่าสถานะ (Stats) บนการ์ด

```
┌─────────────────────────┐
│  3        4000      ⚔   │  ← Cost=3, Power=4000, Attribute=Slash
│                         │
│       [ภาพการ์ด]        │
│                         │
│  CHARACTER              │
│  ゾロ十郎               │  ← ชื่อ (JP)
│  麦わらの一味            │  ← Trait (สังกัด)
│                    R  2 │  ← Rarity=R, Block Icon=2
└─────────────────────────┘
```

| ค่า | อธิบาย | ใน DB |
|---|---|---|
| **Cost** | ค่าลงสนาม จ่ายด้วย DON!! | `cost` |
| **Power** | พลังโจมตี/ป้องกัน เช่น 4000, 10000 | `power` |
| **Counter** | ค่าช่วยป้องกันเมื่ออยู่ในมือ เช่น +1000, +2000 (บางใบไม่มี) | `counter` |
| **Life** | เฉพาะ Leader — จำนวน Life เริ่มต้น (4-5) | `life` |
| **Attribute** | ประเภทโจมตี: Slash, Strike, Ranged, Special, Wisdom | `attribute` |
| **Color** | สี: Red, Green, Blue, Purple, Black, Yellow (หรือ Multicolor) | `color` |
| **Trait** | สังกัด เช่น "Straw Hat Crew", "Navy", "The Four Emperors" | `trait` |
| **Effect** | ความสามารถพิเศษ | `effectEn`, `effectJp`, `effectTh` |
| **Trigger** | เอฟเฟ็กต์ที่เกิดเมื่อการ์ดนี้ถูก reveal จาก Life | `triggerEn`, `triggerJp` |

---

## 4. สี (Color) — สำคัญมากสำหรับ Deck Building

| สี | ลักษณะเด่น | ตัวละครหลัก |
|---|---|---|
| **Red** | โจมตีรุนแรง เพิ่ม Power | Luffy, Shanks, Ace |
| **Green** | DON!! management, ตั้งรับแล้วบุก | Zoro, Yamato, Bonney |
| **Blue** | ดึงการ์ด, คืนการ์ดมือ, ควบคุม | Doflamingo, Crocodile, Buggy |
| **Purple** | DON!! manipulation, ลด cost | Luffy (Gear5), Katakuri |
| **Black** | ทำลาย/เนรเทศการ์ดฝ่ายตรงข้าม | Lucci, Smoker, Teach |
| **Yellow** | Life manipulation, Trigger เยอะ | Big Mom, Katakuri, Nami |

**Multicolor** = การ์ดที่มี 2 สี เช่น Red/Green

Leader กำหนดสีที่ใช้ได้ในเด็ค ดังนั้นสีของการ์ดเป็นข้อมูลสำคัญสำหรับ filter/search

---

## 5. ระบบชุด (Sets)

### 5.1 Booster Pack (กล่อง/ซอง)

| ประเภท | รูปแบบ code | ตัวอย่าง | จำนวนใบ/เซ็ต |
|---|---|---|---|
| Booster Pack | OP-01 ถึง OP-15 | OP09 = "Emperors in the New World" | ~119 base + parallels |
| Extra Booster | EB-01 ถึง EB-04 | EB01 = "Memorial Collection" | แตกต่างกัน |
| Starter Deck | ST-01 ถึง ST-29 | ST01 = "Straw Hat Crew" | ~17 ใบ (fixed, ไม่สุ่ม) |
| Premium Booster | PRB-01, PRB-02 | "ONE PIECE CARD THE BEST" | reprint compilation |

**Booster Pack JP:**
- 1 ซอง = 6 ใบ
- 1 กล่อง (Box) = 24 ซอง
- 1 หีบ (Carton) = 12 กล่อง

### 5.2 Card Code Format

```
OP09-001          ← เซ็ต OP09, ใบที่ 001
OP09-001_p1       ← Parallel (ภาพพิเศษ) ลำดับที่ 1
OP05-067_p4       ← SP reprint จาก OP05 (parallel ลำดับที่ 4)
ST01-001          ← Starter Deck 01, ใบที่ 001
```

**baseCode** = code ไม่มี `_p` suffix เช่น `OP09-001` (ใช้สำหรับ matching)

---

## 6. Rarity (ระดับความหายาก)

### 6.1 Base Rarities (ไม่รวม parallel)

เรียงจาก **หายากน้อย → หายากมาก:**

| Rarity | ชื่อเต็ม | จำนวนต่อเซ็ต (โดยประมาณ) | ราคาตลาดโดยประมาณ |
|---|---|---|---|
| **C** | Common | ~45 ใบ | ¥30 |
| **UC** | Uncommon | ~30 ใบ | ¥80 |
| **R** | Rare | ~26 ใบ | ¥80-120 |
| **SR** | Super Rare | ~10 ใบ | ¥80-500 |
| **SEC** | Secret Rare | ~2 ใบ | ¥500-5,000 |
| **L** | Leader | ~6 ใบ | ¥50 |
| **SP** | Special (Manga Art) | ~10 ใบ (reprint จากเซ็ตเก่า) | ¥3,000-600,000+ |
| **TR** | Treasure Rare | 0-1 ใบ (หายากที่สุด) | ¥100,000+ |

### 6.2 Parallel (ภาพพิเศษ)

การ์ดทุก rarity มี **Parallel Art** = ภาพวาดใหม่ที่สวยกว่า แต่ stat/effect เหมือนเดิม

| Parallel Rarity | ใน DB |
|---|---|
| Parallel Common | `P-C` |
| Parallel Uncommon | `P-UC` |
| Parallel Rare | `P-R` |
| Parallel Super Rare | `P-SR` |
| Parallel Secret Rare | `P-SEC` |
| Parallel Leader | `P-L` |

Parallel **แพงกว่า** ปกติมาก เพราะหายาก เช่น:
- OP09-119 SEC (ปกติ) = ¥500
- OP09-119 P-SEC (parallel) = ¥1,480
- OP09-119 P-SEC (super parallel / manga art) = ¥198,000

### 6.3 SP Reprint (การ์ดพิเศษข้ามเซ็ต)

SP cards คือ **การ์ด reprint จากเซ็ตเก่าที่ถูกวาดภาพใหม่** แล้วใส่ไว้ในเซ็ตใหม่
- stat/effect เหมือนต้นฉบับทุกประการ
- **ภาพใหม่ทั้งหมด** (มักเป็น manga art สวยมาก → แพงมาก)
- card code ยังเป็นเซ็ตเดิม เช่น `OP05-067` แต่อยู่ในซอง OP09

ตัวอย่าง SP ใน OP09:
| Card Code | ชื่อ | ต้นฉบับจากเซ็ต | ราคา |
|---|---|---|---|
| OP04-119_p2 | Donquixote Rosinante | OP04 | ¥4,980 |
| OP05-067_p4 | Zoro-Juurou | OP05 | ¥24,800 |
| OP07-051_p3 | Boa Hancock | OP07 | ¥29,800 |
| OP08-106_p4 | Nami | OP08 | ¥24,800 |

**สำหรับ dev:** SP reprints มี `isParallel = true` และ `rarity = "SP"` ใน DB
`baseCode` จะเป็น code จากเซ็ตเดิม แต่ `setId` จะชี้ไปเซ็ตที่เปิดซองได้จริง

---

## 7. Box Pattern (รูปแบบกล่อง)

ทุกกล่อง Booster ญี่ปุ่นจะเป็น 1 ใน 3 รูปแบบนี้:

| Pattern | โอกาส | ได้อะไร |
|---|---|---|
| **SEC Box** | ~33% | SEC 1 ใบ + SR 3 ใบ |
| **Parallel 1 Box** | ~42% | Parallel 1 ใบ + SR 3 ใบ |
| **Parallel 2 Box** | ~25% | Parallel 2 ใบ + SR 3 ใบ |

**สำคัญ:** ทุกกล่อง **การันตี SR 3 ใบ** แต่ SEC กับ Parallel เป็นแบบ "อย่างใดอย่างหนึ่ง"

ต่อ 1 หีบ (Carton = 12 กล่อง) โดยเฉลี่ย:
- SEC: ~4 ใบ
- SR: ~42 ใบ (ได้ทุกตัว)
- Parallel: ~8 ใบ
- Leader Parallel: ~2 ใบ
- SP: ~1 ใบ (หายากมาก)

---

## 8. ราคาตลาด — ปัจจัยที่มีผล

### อะไรทำให้การ์ดแพง?

1. **Rarity** — SEC, P-SEC, SP, TR แพงสุด
2. **ตัวละครยอดนิยม** — Luffy, Shanks, Nami, Hancock มักแพง
3. **Meta (เล่นแข่งได้)** — การ์ดที่ใช้ในเด็คเทียร์ 1 จะแพง
4. **ภาพสวย** — manga art, super parallel art มีคนสะสม
5. **Supply** — SP, TR มีอัตราออกต่ำมาก → supply น้อย → แพง
6. **เซ็ตหมดพิมพ์** — เซ็ตเก่าที่ไม่พิมพ์เพิ่มแล้วราคาจะเพิ่ม

### ช่วงราคา

| ระดับ | ราคา (JPY) | ตัวอย่าง |
|---|---|---|
| Common/UC | ¥30-80 | การ์ดทั่วไป |
| Rare | ¥80-200 | การ์ด R |
| Super Rare | ¥80-500 | SR ที่ไม่เล่นแข่ง |
| Super Rare (Meta) | ¥500-2,000 | SR ที่ใช้ในเด็คแข่ง |
| Secret Rare | ¥500-5,000 | SEC ปกติ |
| Parallel SEC | ¥1,000-200,000 | ขึ้นอยู่กับตัวละคร |
| SP Card | ¥3,000-600,000 | manga art reprint |
| Treasure Rare | ¥100,000-1,000,000+ | หายากที่สุด |

---

## 9. แหล่งซื้อขาย

| ร้าน/เว็บ | ประเทศ | ใช้ทำอะไรใน MeeCard |
|---|---|---|
| **Yuyutei** (yuyu-tei.jp) | ญี่ปุ่น | แหล่งราคาหลัก (JPY) |
| TCGPlayer | US/EN | ราคา USD (ยังไม่ integrate) |
| Cardmarket | EU | ราคา EUR (ยังไม่ integrate) |
| ร้านการ์ดไทย | ไทย | ราคา THB (อนาคต) |

**Yuyutei** คือร้านขายการ์ดมือสองที่ใหญ่ที่สุดในญี่ปุ่น ราคา Yuyutei ถือเป็น **benchmark**
ของตลาดญี่ปุ่น คนไทยก็ใช้ราคา Yuyutei เป็นอ้างอิง

---

## 10. คำศัพท์ที่ Dev ต้องรู้

| คำ | ความหมาย |
|---|---|
| **Parallel / パラレル** | การ์ดภาพพิเศษ stat เหมือนเดิม แต่ภาพสวยกว่า |
| **Super Parallel** | Parallel ที่หายากกว่าปกติ (manga art) |
| **SP (Special)** | การ์ด reprint จากเซ็ตเก่า ภาพใหม่ทั้งหมด |
| **SEC (Secret Rare)** | การ์ดลับ หายากที่สุดในระดับ base rarity |
| **TR (Treasure Rare)** | หายากที่สุดเท่าที่เป็นไปได้ มีไม่กี่ใบในโลก |
| **DON!!** | การ์ดพลังงาน ใช้จ่ายเพื่อลงการ์ด |
| **Leader** | การ์ดผู้นำ 1 ใบต่อเด็ค |
| **Meta** | กลยุทธ์ที่แข็งแกร่งที่สุดในสภาพแวดล้อมแข่งขัน |
| **Reprint** | การ์ดที่พิมพ์ซ้ำในเซ็ตใหม่ |
| **Pull rate** | อัตราที่จะเปิดซองได้การ์ดนั้น |
| **Box** | กล่อง 24 ซอง |
| **Carton / Case** | หีบ 12 กล่อง |
| **封入パターン (fuunyuu pattern)** | รูปแบบการบรรจุการ์ดในกล่อง |
| **Block Icon** | เลข 1-4 มุมล่างการ์ด บอกว่ากลุ่มไหน (ใช้ในกฎแบน) |
| **Alt Art** | ภาพทางเลือก = Parallel |
| **Manga Art** | ภาพจากมังงะ One Piece ต้นฉบับ |
| **Foil / Holo** | การ์ดเคลือบเงาแวววาว (Parallel มักเป็น foil) |

---

## 11. สิ่งที่ MeeCard ต้องแสดงให้ผู้ใช้

### หน้า Card Detail

- รูปการ์ด (Supabase Storage)
- ชื่อ 3 ภาษา (EN, JP, TH)
- Stat ทั้งหมด: cost, power, counter, life, color, attribute, trait
- Effect + Trigger (3 ภาษา)
- Rarity badge (สี + ชื่อ)
- ราคาปัจจุบัน (JPY) + % เปลี่ยนแปลง 24h/7d
- กราฟราคาย้อนหลัง

### หน้า Set Browser

- แสดงการ์ดทั้งหมดในเซ็ตนั้น **รวม SP reprints**
- Filter: color, rarity, card type
- Sort: price, card number, rarity

### หน้า Portfolio

- ผู้ใช้เพิ่มการ์ดที่ตัวเองมี
- คำนวณมูลค่ารวม (ใช้ latestPriceJpy)
- แสดง unrealized gain/loss

### Pull Rate Calculator

- ผู้ใช้เลือกการ์ดที่อยากได้
- คำนวณโอกาสเปิดได้ต่อซอง / กล่อง / หีบ
- ใช้ Box Pattern (33/42/25) + pool size ในการคำนวณ
