import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding chat/marketplace demo data...\n");

  // 1. Find or create two test users
  const users = await prisma.user.findMany({ take: 5, orderBy: { createdAt: "asc" } });

  if (users.length < 2) {
    console.log("❌ Need at least 2 users in the database. Please register 2 accounts first.");
    return;
  }

  const seller = users[0]!;
  const buyer = users[1]!;
  const buyer2 = users[2] ?? buyer;

  console.log(`  Seller: ${seller.displayName ?? seller.email} (${seller.id})`);
  console.log(`  Buyer1: ${buyer.displayName ?? buyer.email} (${buyer.id})`);
  if (buyer2.id !== buyer.id) {
    console.log(`  Buyer2: ${buyer2.displayName ?? buyer2.email} (${buyer2.id})`);
  }

  // 2. Find cards to use for listings
  const cards = await prisma.card.findMany({
    take: 5,
    where: { latestPriceJpy: { not: null, gt: 0 } },
    orderBy: { latestPriceJpy: "desc" },
    select: {
      id: true,
      cardCode: true,
      nameJp: true,
      nameEn: true,
      rarity: true,
      imageUrl: true,
      latestPriceJpy: true,
      latestPriceThb: true,
    },
  });

  if (cards.length < 2) {
    console.log("❌ Need at least 2 cards with prices. Run the scraper first.");
    return;
  }

  console.log(`\n  Found ${cards.length} cards to use for listings\n`);

  // 3. Create listings
  const listings = [];

  // Listing 1: Active listing, seller has card[0]
  const listing1 = await prisma.listing.upsert({
    where: { id: 90001 },
    update: {},
    create: {
      id: 90001,
      userId: seller.id,
      cardId: cards[0]!.id,
      priceJpy: cards[0]!.latestPriceJpy! - 200,
      priceThb: (cards[0]!.latestPriceThb ?? 0) * 0.9,
      condition: "NM",
      quantity: 1,
      description: "สภาพดีมาก ใส่ซองตั้งแต่แกะ ไม่มีรอยขีดข่วน",
      shipping: ["EMS/Kerry", "Registered mail"],
      location: "กรุงเทพมหานคร",
      status: "ACTIVE",
    },
  });
  listings.push(listing1);
  console.log(`  ✅ Listing #${listing1.id}: ${cards[0]!.cardCode} (ACTIVE)`);

  // Listing 2: Reserved listing with active order
  const listing2 = await prisma.listing.upsert({
    where: { id: 90002 },
    update: {},
    create: {
      id: 90002,
      userId: seller.id,
      cardId: cards[1]!.id,
      priceJpy: cards[1]!.latestPriceJpy!,
      priceThb: cards[1]!.latestPriceThb ?? 0,
      condition: "LP",
      quantity: 2,
      description: "มีรอยเล็กน้อยที่ขอบ ดูจากรูปได้",
      shipping: ["EMS/Kerry", "Pickup (นัดรับ)"],
      location: "เชียงใหม่",
      status: "RESERVED",
    },
  });
  listings.push(listing2);
  console.log(`  ✅ Listing #${listing2.id}: ${cards[1]!.cardCode} (RESERVED)`);

  // Listing 3: Another active listing for buyer2
  let listing3 = listing1;
  if (cards.length >= 3) {
    listing3 = await prisma.listing.upsert({
      where: { id: 90003 },
      update: {},
      create: {
        id: 90003,
        userId: seller.id,
        cardId: cards[2]!.id,
        priceJpy: cards[2]!.latestPriceJpy! + 500,
        priceThb: (cards[2]!.latestPriceThb ?? 0) * 1.15,
        condition: "NM",
        quantity: 1,
        description: "ราคาต่อรองได้",
        shipping: ["EMS/Kerry"],
        location: "กรุงเทพมหานคร",
        status: "ACTIVE",
      },
    });
    listings.push(listing3);
    console.log(`  ✅ Listing #${listing3.id}: ${cards[2]!.cardCode} (ACTIVE)`);
  }

  // 4. Create messages for listing 1 (basic conversation)
  console.log("\n📨 Seeding messages for listing #1 (basic chat)...");

  const msgs1 = [
    { senderId: buyer.id, receiverId: seller.id, content: "สนใจการ์ดใบนี้ครับ ยังขายอยู่มั้ยครับ?", type: "TEXT" as const, offset: -120 },
    { senderId: seller.id, receiverId: buyer.id, content: "ขายอยู่ครับ สภาพดีมากเลยครับ", type: "TEXT" as const, offset: -115 },
    { senderId: buyer.id, receiverId: seller.id, content: "ส่งรูปจริงให้ดูได้มั้ยครับ?", type: "TEXT" as const, offset: -110 },
    { senderId: seller.id, receiverId: buyer.id, content: "ได้ครับ เดี๋ยวถ่ายให้ดูเลย", type: "TEXT" as const, offset: -100 },
    { senderId: seller.id, receiverId: buyer.id, content: "ถ่ายมาแล้วครับ สภาพตามนี้เลย ไม่มีรอยเลยครับ", type: "TEXT" as const, offset: -90 },
    { senderId: buyer.id, receiverId: seller.id, content: "สวยมากเลยครับ 👍 ลดได้มั้ยครับ?", type: "TEXT" as const, offset: -60 },
  ];

  for (const m of msgs1) {
    await prisma.message.create({
      data: {
        listingId: listing1.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        type: m.type,
        isRead: true,
        createdAt: new Date(Date.now() + m.offset * 60000),
      },
    });
  }
  console.log(`  ✅ Created ${msgs1.length} messages`);

  // 5. Create offer on listing 1
  console.log("\n💰 Seeding offer on listing #1...");

  const offer1 = await prisma.offer.create({
    data: {
      listingId: listing1.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      priceThb: Math.round((cards[0]!.latestPriceThb ?? 500) * 0.85),
      status: "PENDING",
      note: "ลดนิดนึงได้มั้ยครับ ซื้อหลายใบ",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      listingId: listing1.id,
      senderId: buyer.id,
      receiverId: seller.id,
      content: `เสนอราคา ฿${offer1.priceThb.toLocaleString()} - ลดนิดนึงได้มั้ยครับ ซื้อหลายใบ`,
      type: "OFFER",
      offerId: offer1.id,
      createdAt: new Date(Date.now() - 30 * 60000),
    },
  });
  console.log(`  ✅ Offer #${offer1.id}: ฿${offer1.priceThb.toLocaleString()} (PENDING)`);

  // 6. Create order on listing 2 (in SHIPPED status)
  console.log("\n📦 Seeding order on listing #2 (SHIPPED)...");

  const acceptedOffer = await prisma.offer.create({
    data: {
      listingId: listing2.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      priceThb: cards[1]!.latestPriceThb ?? 800,
      status: "ACCEPTED",
    },
  });

  const order2 = await prisma.order.create({
    data: {
      listingId: listing2.id,
      offerId: acceptedOffer.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      priceThb: cards[1]!.latestPriceThb ?? 800,
      status: "SHIPPED",
      shippingMethod: "EMS",
      trackingNumber: "TH12345678901",
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Messages for the order flow
  const msgs2 = [
    { senderId: buyer.id, receiverId: seller.id, content: "สนใจซื้อครับ", type: "TEXT" as const, offerId: null, orderId: null, offset: -7200 },
    { senderId: buyer.id, receiverId: seller.id, content: `เสนอราคา ฿${acceptedOffer.priceThb.toLocaleString()}`, type: "OFFER" as const, offerId: acceptedOffer.id, orderId: null, offset: -7100 },
    { senderId: seller.id, receiverId: buyer.id, content: `ยอมรับข้อเสนอ ฿${acceptedOffer.priceThb.toLocaleString()} - รอการชำระเงิน`, type: "ORDER_UPDATE" as const, offerId: acceptedOffer.id, orderId: order2.id, offset: -7000 },
    { senderId: buyer.id, receiverId: seller.id, content: "โอนเงินแล้วครับ เช็คได้เลย", type: "TEXT" as const, offerId: null, orderId: null, offset: -5000 },
    { senderId: buyer.id, receiverId: seller.id, content: "แจ้งชำระเงินแล้ว", type: "ORDER_UPDATE" as const, offerId: null, orderId: order2.id, offset: -4900 },
    { senderId: seller.id, receiverId: buyer.id, content: "ได้รับเงินแล้วครับ เดี๋ยวจัดส่งให้วันนี้", type: "TEXT" as const, offerId: null, orderId: null, offset: -3000 },
    { senderId: seller.id, receiverId: buyer.id, content: "ส่งของแล้ว (EMS: TH12345678901)", type: "ORDER_UPDATE" as const, offerId: null, orderId: order2.id, offset: -1440 },
    { senderId: seller.id, receiverId: buyer.id, content: "ส่งแล้วนะครับ น่าจะได้รับภายใน 1-2 วัน", type: "TEXT" as const, offerId: null, orderId: null, offset: -1430 },
  ];

  for (const m of msgs2) {
    await prisma.message.create({
      data: {
        listingId: listing2.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        type: m.type,
        offerId: m.offerId,
        orderId: m.orderId,
        isRead: true,
        createdAt: new Date(Date.now() + m.offset * 60000),
      },
    });
  }
  console.log(`  ✅ Order #${order2.id}: SHIPPED (tracking: TH12345678901)`);
  console.log(`  ✅ Created ${msgs2.length} messages`);

  // 7. Listing 3 conversation with counter-offer (if exists)
  if (listing3.id !== listing1.id && buyer2.id !== buyer.id) {
    console.log("\n🔄 Seeding counter-offer conversation on listing #3...");

    const originalOffer = await prisma.offer.create({
      data: {
        listingId: listing3.id,
        buyerId: buyer2.id,
        sellerId: seller.id,
        priceThb: Math.round((cards[2]!.latestPriceThb ?? 600) * 0.8),
        status: "COUNTERED",
      },
    });

    const counterOffer = await prisma.offer.create({
      data: {
        listingId: listing3.id,
        buyerId: seller.id,
        sellerId: buyer2.id,
        priceThb: Math.round((cards[2]!.latestPriceThb ?? 600) * 0.95),
        status: "PENDING",
        parentId: originalOffer.id,
        note: "ลดให้หน่อยแล้วครับ",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const msgs3 = [
      { senderId: buyer2.id, receiverId: seller.id, content: "สนใจครับ ราคาเท่านี้ลดได้มั้ย", type: "TEXT" as const, offerId: null, offset: -300 },
      { senderId: buyer2.id, receiverId: seller.id, content: `เสนอราคา ฿${originalOffer.priceThb.toLocaleString()}`, type: "OFFER" as const, offerId: originalOffer.id, offset: -290 },
      { senderId: seller.id, receiverId: buyer2.id, content: `เสนอราคากลับ ฿${counterOffer.priceThb.toLocaleString()} - ลดให้หน่อยแล้วครับ`, type: "OFFER" as const, offerId: counterOffer.id, offset: -200 },
      { senderId: buyer2.id, receiverId: seller.id, content: "คิดดูก่อนนะครับ 🤔", type: "TEXT" as const, offerId: null, offset: -100 },
    ];

    for (const m of msgs3) {
      await prisma.message.create({
        data: {
          listingId: listing3.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          content: m.content,
          type: m.type,
          offerId: m.offerId,
          isRead: m.offset < -150,
          createdAt: new Date(Date.now() + m.offset * 60000),
        },
      });
    }

    console.log(`  ✅ Original offer: ฿${originalOffer.priceThb.toLocaleString()} (COUNTERED)`);
    console.log(`  ✅ Counter offer: ฿${counterOffer.priceThb.toLocaleString()} (PENDING)`);
    console.log(`  ✅ Created ${msgs3.length} messages (1 unread)`);
  }

  console.log("\n✅ Chat seed data complete!\n");
  console.log("Summary:");
  console.log("  - 3 listings (2 ACTIVE, 1 RESERVED)");
  console.log("  - 1 pending offer (listing #1)");
  console.log("  - 1 shipped order with tracking (listing #2)");
  console.log("  - 1 counter-offer conversation (listing #3)");
  console.log(`  - ${msgs1.length + msgs2.length + 4} total messages`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
