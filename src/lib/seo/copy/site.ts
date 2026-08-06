import type { Language } from "@/lib/i18n";

/**
 * SEO copy for the supporting routes (/pricing, /about, /contact, /honey,
 * /raffle/winners, /blog).
 *
 * Why this lives here instead of the flat `t()` dictionary:
 * - these strings are whole paragraphs and interpolate live data
 *   (plan limits, trial length), which the flat dictionary cannot do;
 * - the dictionary is shared by every surface, and SEO prose only ever
 *   renders on one page each.
 *
 * Thai is the market language and the one that matters — EN is a reasonable
 * translation, JP mirrors EN. Every page carries BOTH Thai spellings of the
 * franchise ("วันพีซ" and "วันพีช") because Thai searchers type both.
 */

/** Single support address for the contact surfaces and Organization schema. */
export const SUPPORT_EMAIL = "support@meecard.app";

export type SeoFaqItem = { question: string; answer: string };
export type SeoPageMeta = { title: string; description: string };

type ByLang<T> = Record<Language, T>;

function pick<T>(lang: Language, values: ByLang<T>): T {
  return values[lang] ?? values.TH;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Metadata — Thai-first. `title` is the visible part only; the root layout
 * appends " | Meecard" through its template, so never append it here.
 * ──────────────────────────────────────────────────────────────────────────── */

// SEO round 2 keyword map: supporting pages own THEIR OWN intent — the head
// keyword "เช็คราคาการ์ดวันพีซ" belongs to the home page alone. These pages
// used to lead their title/description with it, so 5+ URLs competed with the
// page that should win that query (and someone searching "เช็คราคา" could land
// on the pricing page). Brand identity phrasing lives on /about only. Titles
// are the VISIBLE part — the root template appends " | Meecard", so the brand
// name is not repeated inside them.
export const SEO_PAGE_META = {
  pricing: {
    title: "แพ็กเกจสมาชิก — ดูราคาฟรี อัปเกรด Pro เมื่อพร้อม",
    description:
      "สมัคร Pro เมื่ออยากได้พอร์ตใหญ่ขึ้น แจ้งเตือนราคามากขึ้น และ Export CSV — การดูราคาการ์ดวันพีชทุกใบยังฟรีตลอด หรือสะสมแต้ม Honey แลกบัตรผ่าน Pro ได้",
  },
  about: {
    title: "เกี่ยวกับเรา — เว็บเช็คราคาการ์ดวันพีซของคนไทย",
    description:
      "Meecard คือเว็บอิสระที่รวมราคากลางการ์ดวันพีช (OPTCG) จากตลาดญี่ปุ่น อัปเดตทุกวันและแปลงเป็นเงินบาท — อ่านว่าเราเก็บราคาจากแหล่งไหนและคิดราคาบาทอย่างไร",
  },
  contact: {
    title: "ติดต่อทีมงาน — แจ้งราคาผิด เสนอฟีเจอร์ รายงานบั๊ก",
    description:
      "แจ้งราคาที่ไม่ตรง เสนอฟีเจอร์ รายงานบั๊ก หรือคุยเรื่องความร่วมมือเกี่ยวกับการ์ดวันพีช — ทีมงานตอบกลับทางอีเมลทุกฉบับ",
  },
  honey: {
    title: "Honey — สะสมแต้มฟรี แลกบัตรผ่าน Pro และของรางวัล",
    description:
      "เช็คอินและทำภารกิจประจำวันรับแต้ม Honey ฟรี แล้วนำไปแลกบัตรผ่าน Pro หรือตั๋วลุ้นรางวัลการ์ดวันพีชประจำเดือน",
  },
  raffleWinners: {
    title: "ประกาศผู้ชนะรางวัลประจำเดือน",
    description:
      "คลังประกาศผู้ชนะรางวัลประจำเดือน ดูย้อนหลังได้ทุกเดือนว่าใครได้รางวัลอะไร เปิดเผยผลจับรางวัลทั้งหมดเพื่อความโปร่งใส",
  },
  blog: {
    title: "บล็อกการ์ดวันพีซ — วิเคราะห์ตลาด รีวิวชุด และเทคนิค",
    description:
      "บทความเรื่องการ์ดวันพีช (One Piece Card Game) จาก Meecard — วิเคราะห์ตลาดราคา รีวิวชุดการ์ดใหม่ เทคนิคสะสม และข่าวสารที่มีผลกับราคา",
  },
} as const satisfies Record<string, SeoPageMeta>;

/* ────────────────────────────────────────────────────────────────────────────
 * /pricing
 * ──────────────────────────────────────────────────────────────────────────── */

// One keyword sentence under the H1 (sitewide owner ruling 2026-08-06) — the
// old three-paragraph intro folded into it: free forever, what paying adds,
// and the Honey path to Pro without paying.
export function buildPricingHeading(lang: Language): {
  title: string;
  description: string;
} {
  return pick(lang, {
    TH: {
      // H1 owns the "plans" intent — the home page owns "เช็คราคา" (round 2).
      title: "แพ็กเกจสมาชิก Meecard — ดูราคาฟรี อัปเกรดได้เมื่อพร้อม",
      description:
        "ดูราคาการ์ดวันพีชทุกใบได้ฟรีตลอด อัปเกรดเมื่ออยากได้พอร์ตใหญ่ขึ้นและแจ้งเตือนมากขึ้น — หรือสะสมแต้ม Honey แลกบัตรผ่าน Pro ได้โดยไม่ต้องจ่ายเลย",
    },
    EN: {
      title: "Meecard plans — check One Piece card prices free, upgrade when ready",
      description:
        "Every card price stays free. Upgrade for a bigger portfolio and more alerts — or earn Honey points and redeem a Pro pass without paying at all.",
    },
    JP: {
      title: "Meecard プラン — ワンピースカード価格は無料、必要になったらアップグレード",
      description:
        "カード価格の閲覧は常に無料。ポートフォリオ枠やアラートを増やしたいときだけアップグレード — Honey ポイントを貯めて Pro パスと無料交換もできます。",
    },
  });
}


/**
 * Pricing FAQ additions. Every answer is derived from behaviour that exists in
 * the codebase today (TIER_LIMITS, the Stripe checkout/billing-portal routes,
 * and the Honey shop's TRIAL_PRO / TRIAL_PRO_PLUS redemptions) — no invented
 * policy.
 */
export function buildPricingFaq(
  lang: Language,
  data: {
    freePortfolioCards: number;
    freePortfolioCount: number;
    freeWatchlistCards: number;
    freePriceAlerts: number;
    freePriceHistoryDays: number;
  },
): SeoFaqItem[] {
  const {
    freePortfolioCards,
    freePortfolioCount,
    freeWatchlistCards,
    freePriceAlerts,
    freePriceHistoryDays,
  } = data;

  return pick(lang, {
    TH: [
      {
        question: "ใช้ฟรีได้แค่ไหน มีลิมิตอะไรบ้าง?",
        answer: `การดูราคาการ์ดวันพีซทุกใบ ทุกชุด ทุกเกรด และเครื่องมือคำนวณอัตราออก ใช้ได้ฟรีไม่จำกัด ส่วนลิมิตของแพ็กเกจฟรีคือ พอร์ตสะสม ${freePortfolioCount} พอร์ต เก็บได้ ${freePortfolioCards} ใบ · รายการโปรด ${freeWatchlistCards} ใบ · แจ้งเตือนราคา ${freePriceAlerts} รายการ · ดูประวัติราคาย้อนหลัง ${freePriceHistoryDays} วัน`,
      },
      {
        question: "แลก Honey เป็น Pro ได้ไหม?",
        answer:
          "ได้ สะสมแต้ม Honey จากการเช็คอินรายวัน ภารกิจประจำวัน และความสำเร็จต่าง ๆ แล้วนำไปแลกบัตรผ่าน Pro หรือ Pro+ ในร้าน Honey ระบบจะอัปเกรดบัญชีให้อัตโนมัติตามจำนวนวันของบัตรที่แลก และไม่ต้องผูกบัตรเครดิต",
      },
      {
        question: "จ่ายผ่านช่องทางไหน?",
        answer:
          "ชำระด้วยบัตรเครดิตหรือบัตรเดบิตผ่าน Stripe ซึ่งเป็นระบบรับชำระเงินระดับสากล ข้อมูลบัตรอยู่กับ Stripe ทั้งหมด Meecard ไม่เก็บเลขบัตร และใส่โค้ดส่วนลดได้ที่หน้าชำระเงิน",
      },
      {
        question: "ยกเลิกยังไง ต้องทำที่ไหน?",
        answer:
          "เข้าไปที่ ตั้งค่า → จัดการสมาชิก แล้วกดเข้าหน้าจัดการการเรียกเก็บเงินของ Stripe เพื่อยกเลิกได้ด้วยตัวเองทุกเมื่อ ไม่มีค่าธรรมเนียมยกเลิก และยังใช้สิทธิ์ของแพ็กเกจได้จนจบรอบบิลที่จ่ายไปแล้ว",
      },
    ],
    EN: [
      {
        question: "How much can I do on the free plan?",
        answer: `Browsing every card price, every set and every grade — plus the drop-rate calculator — is free and unlimited. The free plan's limits are ${freePortfolioCount} portfolio with ${freePortfolioCards} cards, ${freeWatchlistCards} watchlist cards, ${freePriceAlerts} price alerts and ${freePriceHistoryDays} days of price history.`,
      },
      {
        question: "Can I redeem Honey for Pro?",
        answer:
          "Yes. Earn Honey from daily check-ins, daily missions and achievements, then redeem a Pro or Pro+ pass in the Honey shop. Your account is upgraded automatically for the number of days on the pass — no credit card required.",
      },
      {
        question: "Which payment methods do you accept?",
        answer:
          "Credit and debit cards through Stripe. Card details stay with Stripe — Meecard never stores a card number — and promotion codes can be entered on the checkout page.",
      },
      {
        question: "How do I cancel?",
        answer:
          "Go to Settings → Manage subscription and open the Stripe billing portal to cancel yourself at any time. There is no cancellation fee, and your plan stays active until the end of the billing period you already paid for.",
      },
    ],
    JP: [
      {
        question: "無料プランでどこまで使えますか？",
        answer: `すべてのカード・セット・グレードの価格閲覧と封入率計算ツールは無料で無制限です。無料プランの上限はポートフォリオ ${freePortfolioCount} 個・${freePortfolioCards} 枚、ウォッチリスト ${freeWatchlistCards} 枚、価格アラート ${freePriceAlerts} 件、価格履歴 ${freePriceHistoryDays} 日です。`,
      },
      {
        question: "Honey を Pro に交換できますか？",
        answer:
          "できます。デイリーチェックイン、デイリーミッション、実績で Honey を貯め、Honey ショップで Pro / Pro+ パスと交換してください。パスの日数分だけ自動でアップグレードされ、クレジットカードは不要です。",
      },
      {
        question: "支払い方法は？",
        answer:
          "Stripe 経由のクレジットカード・デビットカードです。カード情報は Stripe が保持し、Meecard はカード番号を保存しません。決済画面でプロモーションコードも利用できます。",
      },
      {
        question: "解約方法は？",
        answer:
          "設定 → サブスクリプション管理から Stripe の請求ポータルを開けば、いつでも自分で解約できます。解約手数料はなく、支払い済みの請求期間が終わるまでプランは有効です。",
      },
    ],
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * /about — methodology block (the site's trust anchor)
 * ──────────────────────────────────────────────────────────────────────────── */

export function buildAboutHeading(lang: Language): { title: string } {
  return pick(lang, {
    TH: { title: "เกี่ยวกับ Meecard — เว็บเช็คราคาการ์ดวันพีซของคนไทย" },
    EN: { title: "About Meecard — a One Piece card price tracker for Thailand" },
    JP: { title: "Meecard について — タイ向けワンピースカード価格サイト" },
  });
}

export function buildAboutMethodology(lang: Language): {
  title: string;
  intro: string[];
  items: { term: string; detail: string }[];
  correctionsPrefix: string;
} {
  return pick(lang, {
    TH: {
      title: "ราคามาจากไหน อัปเดตยังไง",
      intro: [
        "ราคาการ์ดวันพีซบน Meecard ไม่ได้มาจากการที่ผู้ใช้กรอกกันเอง แต่ดึงจากร้านค้าจริงในตลาดญี่ปุ่นซึ่งเป็นตลาดต้นทางของ One Piece Card Game แล้วบันทึกทุกวันเป็นประวัติราคา",
        "ด้านล่างคือวิธีที่เราได้ตัวเลขมาและข้อจำกัดที่ควรรู้ก่อนใช้ราคาการ์ดวันพีชเหล่านี้ตัดสินใจซื้อขาย",
      ],
      items: [
        {
          term: "ราคาการ์ดสภาพปกติ (Raw)",
          detail:
            "ดึงจากร้านการ์ดออนไลน์รายใหญ่ของญี่ปุ่น เป็นราคาที่ร้านตั้งขายจริง ไม่ใช่ราคาที่คนในกลุ่มโพสต์กันเอง",
        },
        {
          term: "ราคาการ์ดเกรด (PSA)",
          detail:
            "ราคา PSA 10 ดึงจากตลาดซื้อขายการ์ดเกรด ส่วนเกรดรองอย่าง PSA 9, PSA 8 และ BGS 9.5 คำนวณจากสัดส่วนอ้างอิงของตลาดเทียบกับราคา PSA 10 ของใบนั้น",
        },
        {
          term: "อัปเดตบ่อยแค่ไหน",
          detail:
            "ระบบเก็บราคาใหม่ทุกวัน และบันทึกทุกครั้งลงฐานข้อมูล กราฟย้อนหลังจึงเป็นข้อมูลจริงที่สะสมเอง ไม่ใช่การประมาณย้อนหลัง",
        },
        {
          term: "แปลงเป็นเงินบาทยังไง",
          detail:
            "ราคาต้นทางเป็นเงินเยน (¥) เว็บแปลงเป็นบาท (฿) ด้วยอัตราแลกเปลี่ยนชุดเดียวกันทั้งเว็บ ตัวเลขบาทจึงเป็นราคาอ้างอิงไว้เทียบกัน ยังไม่รวมค่าส่ง ค่านำเข้า หรือส่วนต่างของร้านในไทย",
        },
        {
          term: "Raw กับ PSA ต่างกันยังไง",
          detail:
            "Raw คือการ์ดที่ยังไม่ผ่านการเกรด ส่วน PSA คือการ์ดที่ส่งให้บริษัทตรวจสภาพแล้วซีลในตลับพร้อมคะแนน 1–10 การ์ดใบเดียวกันที่ได้ PSA 10 จึงมักมีราคาสูงกว่าแบบ Raw หลายเท่า",
        },
        {
          term: "สิ่งที่เราไม่ทำ",
          detail:
            "Meecard ไม่ใช่ร้านค้าและไม่ได้รับส่วนแบ่งจากราคาที่แสดง เราไม่รับจ้างดันราคาการ์ดใบใดใบหนึ่ง ภาพการ์ดทั้งหมดเป็นลิขสิทธิ์ของ BANDAI ใช้เพื่อการอ้างอิงเท่านั้น",
        },
      ],
      correctionsPrefix: "เจอราคาที่ไม่ตรงกับตลาด แจ้งเราได้ที่",
    },
    EN: {
      title: "Where the prices come from",
      intro: [
        "Meecard prices are not user-submitted. They are scraped from real Japanese shops — the source market for the One Piece Card Game — and stored every day as price history.",
        "Here is exactly how each number is produced, and the limits worth knowing before you trade on it.",
      ],
      items: [
        {
          term: "Raw (ungraded) prices",
          detail:
            "Scraped from a major online card shop in Japan. These are real shop asking prices, not community-posted numbers.",
        },
        {
          term: "Graded (PSA) prices",
          detail:
            "PSA 10 prices come from the graded-card market. Lower grades (PSA 9, PSA 8, BGS 9.5) are derived from market reference ratios applied to that card's PSA 10 price.",
        },
        {
          term: "Update frequency",
          detail:
            "Prices are collected daily and every run is written to the database, so the historical chart is real collected data rather than a backfilled estimate.",
        },
        {
          term: "How THB is derived",
          detail:
            "Source prices are in Japanese yen (¥) and converted to baht (฿) with a single site-wide rate. The baht figure is a reference for comparison — it excludes shipping, import duties and Thai retailer margin.",
        },
        {
          term: "Raw vs PSA",
          detail:
            "Raw means ungraded. PSA means the card was submitted for grading and sealed in a slab with a 1–10 score. The same card in PSA 10 usually sells for several times its raw price.",
        },
        {
          term: "What we don't do",
          detail:
            "Meecard is not a shop and takes no cut of the prices shown. We do not accept payment to move a card's price. All card images are © BANDAI and used for reference only.",
        },
      ],
      correctionsPrefix: "Spotted a price that doesn't match the market? Tell us at",
    },
    JP: {
      title: "価格の出どころと更新方法",
      intro: [
        "Meecard の価格はユーザー投稿ではなく、ワンピースカードゲームの本場である日本の実店舗・通販の価格を毎日取得し、価格履歴として保存しています。",
        "以下が各数値の作り方と、取引判断に使う前に知っておきたい制限です。",
      ],
      items: [
        {
          term: "Raw（未鑑定）価格",
          detail:
            "日本の大手オンラインカードショップから取得した実売価格です。コミュニティの投稿価格ではありません。",
        },
        {
          term: "鑑定（PSA）価格",
          detail:
            "PSA 10 は鑑定カード市場から取得。PSA 9 / PSA 8 / BGS 9.5 は、そのカードの PSA 10 価格に市場の参照比率を適用して算出しています。",
        },
        {
          term: "更新頻度",
          detail:
            "毎日価格を取得し、そのつどデータベースに保存します。チャートは後付けの推定ではなく実際に蓄積したデータです。",
        },
        {
          term: "バーツ換算の方法",
          detail:
            "元価格は日本円（¥）で、サイト共通のレートでバーツ（฿）に換算しています。送料・輸入税・タイ国内店舗のマージンは含みません。",
        },
        {
          term: "Raw と PSA の違い",
          detail:
            "Raw は未鑑定、PSA は鑑定に出して 1〜10 のスコア付きでスラブ封入されたカードです。同じカードでも PSA 10 は Raw の数倍で取引されることが多いです。",
        },
        {
          term: "やらないこと",
          detail:
            "Meecard はショップではなく、表示価格から手数料を得ていません。特定カードの価格を操作する依頼も受けません。カード画像の著作権は BANDAI に帰属し、参照目的でのみ使用しています。",
        },
      ],
      correctionsPrefix: "相場と合わない価格を見つけたらこちらまで:",
    },
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * /contact
 * ──────────────────────────────────────────────────────────────────────────── */

export function buildContactHeading(lang: Language): { title: string } {
  return pick(lang, {
    TH: { title: "ติดต่อทีม Meecard — เว็บเช็คราคาการ์ดวันพีซ" },
    EN: { title: "Contact Meecard — the One Piece card price tracker" },
    JP: { title: "Meecard へのお問い合わせ — ワンピースカード価格サイト" },
  });
}

export function buildContactFaq(lang: Language, supportEmail: string): SeoFaqItem[] {
  return pick(lang, {
    TH: [
      {
        // No response-time promise: nothing in the product enforces an SLA, so
        // quoting one would be a service claim the site cannot keep.
        question: "ส่งอีเมลไปแล้วได้รับการตอบกลับไหม?",
        answer: `เราเป็นทีมเล็กและอ่านอีเมลทุกฉบับด้วยตัวเอง ถ้าเป็นเรื่องบัญชีหรือการชำระเงินที่ทำให้ใช้งานไม่ได้ ให้ระบุคำว่า "ด่วน" ในหัวข้ออีเมลที่ส่งมาที่ ${supportEmail} เราจะจัดลำดับให้ก่อน`,
      },
      {
        question: "เจอราคาการ์ดผิด แจ้งได้ที่ไหน?",
        answer: `ส่งอีเมลมาที่ ${supportEmail} พร้อมโค้ดการ์ด (เช่น OP01-003) ราคาที่เห็นบนเว็บ และราคาที่คิดว่าถูกต้องพร้อมลิงก์อ้างอิง เราจะตรวจกับข้อมูลต้นทางและแก้ในรอบเก็บราคาถัดไป การแจ้งแบบมีลิงก์อ้างอิงช่วยให้แก้ได้เร็วที่สุด`,
      },
      {
        question: "อยากให้เพิ่มการ์ดหรือชุดที่ยังไม่มีในเว็บ?",
        answer:
          "แจ้งมาได้เลย ระบุชื่อชุดหรือโค้ดชุดของการ์ดวันพีชที่ต้องการ เราจะเพิ่มเข้าคิวเก็บข้อมูล ชุดใหม่มักขึ้นเว็บหลังวางขายจริงและมีราคาซื้อขายในตลาดญี่ปุ่นแล้ว",
      },
    ],
    EN: [
      {
        question: "Will I get a reply?",
        answer: `We're a small team and read every email ourselves. For account or payment issues that block you, put "urgent" in the subject line to ${supportEmail} and we'll prioritise it.`,
      },
      {
        question: "Where do I report a wrong price?",
        answer: `Email ${supportEmail} with the card code (e.g. OP01-003), the price shown on the site, and the price you believe is correct with a source link. We check it against the source data and fix it on the next collection run.`,
      },
      {
        question: "Can you add a card or set that's missing?",
        answer:
          "Yes — send the set name or set code and we'll queue it for collection. New sets normally appear once they are on sale and actually trading in the Japanese market.",
      },
    ],
    JP: [
      {
        question: "返信はもらえますか？",
        answer: `少人数のチームですべてのメールに目を通しています。アカウントや決済で利用できない場合は、${supportEmail} 宛の件名に「urgent」と入れてください。優先的に対応します。`,
      },
      {
        question: "価格の誤りはどこに報告すればいいですか？",
        answer: `${supportEmail} にカードコード（例：OP01-003）、サイト上の価格、正しいと思われる価格と参照リンクを添えてお送りください。元データと照合し、次回の取得で修正します。`,
      },
      {
        question: "掲載されていないカードやセットを追加できますか？",
        answer:
          "可能です。セット名またはセットコードをお知らせいただければ取得キューに追加します。新セットは発売され日本市場で実際に取引され始めてから掲載されます。",
      },
    ],
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * /honey — logged-out explainer (crawlers are always logged out)
 * ──────────────────────────────────────────────────────────────────────────── */

export function buildHoneyExplainer(lang: Language): {
  title: string;
  intro: string[];
  sections: { heading: string; body: string }[];
  winnersLinkLabel: string;
  pricingLinkLabel: string;
} {
  return pick(lang, {
    TH: {
      title: "Honey คืออะไร และได้มายังไง",
      intro: [
        "Honey คือแต้มสะสมของ Meecard เว็บเช็คราคาการ์ดวันพีซ ได้มาจากการใช้งานเว็บตามปกติ ไม่ต้องเสียเงินซื้อและไม่ต้องผูกบัตรเครดิต",
        "สะสมแล้วนำไปแลกบัตรผ่าน Pro หรือแลกตั๋วลุ้นรางวัลประจำเดือน ทำให้คนที่เข้ามาเช็คราคาการ์ดวันพีชทุกวันได้อะไรกลับไปด้วย",
      ],
      sections: [
        {
          heading: "วิธีได้ Honey",
          body: "เช็คอินรายวัน (ยิ่งต่อเนื่องยิ่งได้โบนัส) · ทำภารกิจประจำวัน เช่น เปิดดูราคาการ์ด ดูการ์ดที่ราคาขยับ หรือเช็คพอร์ตสะสม · ปลดล็อกความสำเร็จระยะยาว · ชวนเพื่อนผ่านลิงก์แนะนำ",
        },
        {
          heading: "แลกอะไรได้บ้าง",
          body: "ร้าน Honey มีบัตรผ่าน Pro และ Pro+ แบบกำหนดจำนวนวัน เมื่อแลกแล้วระบบจะอัปเกรดบัญชีให้อัตโนมัติตามจำนวนวันของบัตร นอกจากนี้ยังมีตั๋วลุ้นรางวัลและสิทธิ์เสริมอื่น ๆ ให้เลือกแลก",
        },
        {
          heading: "ลุ้นรางวัลประจำเดือน",
          body: "ทุกเดือนจะมีเครื่องจับรางวัลเปิดให้ใช้ Honey แลกตั๋วเข้าร่วม และการเช็คอินต่อเนื่องครบตามเงื่อนไขจะได้ตั๋วฟรี เมื่อถึงกำหนดจับรางวัลระบบจะสุ่มผู้ชนะและประกาศผลย้อนหลังให้ตรวจสอบได้",
        },
        {
          heading: "โปร่งใสตรวจสอบได้",
          body: "ผลจับรางวัลทุกเดือนถูกเก็บไว้เป็นคลังสาธารณะ เปิดดูได้ว่าเดือนไหนใครได้รางวัลอะไร โดยไม่ต้องเข้าสู่ระบบ",
        },
      ],
      winnersLinkLabel: "ดูประกาศผู้ชนะย้อนหลัง",
      pricingLinkLabel: "เทียบแพ็กเกจ Pro",
    },
    EN: {
      title: "What Honey is and how to earn it",
      intro: [
        "Honey is Meecard's loyalty point. You earn it by using the site normally — there is nothing to buy and no card to register.",
        "Save it up and redeem a Pro pass or a monthly prize-draw ticket, so checking One Piece card prices every day gives something back.",
      ],
      sections: [
        {
          heading: "How to earn Honey",
          body: "Daily check-in (streaks pay a bonus) · daily missions such as viewing a card price, browsing movers, or checking your portfolio · long-term achievements · inviting friends with your referral link.",
        },
        {
          heading: "What you can redeem",
          body: "The Honey shop stocks Pro and Pro+ passes with a fixed number of days; redeeming one upgrades your account automatically for that period. Prize-draw tickets and other perks are also available.",
        },
        {
          heading: "Monthly prize draw",
          body: "Each month a draw opens where Honey buys entry tickets, and a long enough check-in streak earns a free one. When the draw closes the system picks winners and the result is published for anyone to review.",
        },
        {
          heading: "Publicly verifiable",
          body: "Every month's result is kept in a public archive — see who won what, without logging in.",
        },
      ],
      winnersLinkLabel: "See past winners",
      pricingLinkLabel: "Compare Pro plans",
    },
    JP: {
      title: "Honey とは・貯め方",
      intro: [
        "Honey は Meecard のポイントです。普通にサイトを使うだけで貯まり、購入もカード登録も不要です。",
        "貯めた Honey は Pro パスや毎月の抽選チケットと交換できます。毎日ワンピースカードの価格を見に来ることが、そのまま特典になります。",
      ],
      sections: [
        {
          heading: "Honey の貯め方",
          body: "デイリーチェックイン（連続でボーナス）・カード価格の閲覧、値動きの確認、ポートフォリオ確認などのデイリーミッション・長期の実績解除・紹介リンクでの招待。",
        },
        {
          heading: "交換できるもの",
          body: "Honey ショップには日数指定の Pro / Pro+ パスがあり、交換するとその日数だけ自動でアップグレードされます。抽選チケットなどの特典もあります。",
        },
        {
          heading: "毎月の抽選",
          body: "毎月開催される抽選に Honey でチケットを交換して参加できます。チェックインの連続日数が条件を満たすと無料チケットももらえます。抽選後は結果が公開されます。",
        },
        {
          heading: "結果は誰でも確認可能",
          body: "毎月の当選結果は公開アーカイブに保存され、ログインなしで確認できます。",
        },
      ],
      winnersLinkLabel: "過去の当選者を見る",
      pricingLinkLabel: "Pro プランを比較",
    },
  });
}

export function buildHoneyHeading(lang: Language): { title: string } {
  return pick(lang, {
    TH: { title: "Honey Rewards — สะสมแต้มฟรีจากการเช็คราคาการ์ดวันพีซ" },
    EN: { title: "Honey Rewards — free points for checking One Piece card prices" },
    JP: { title: "Honey Rewards — ワンピースカード価格チェックで貯まる無料ポイント" },
  });
}

/* ────────────────────────────────────────────────────────────────────────────
 * /blog
 * ──────────────────────────────────────────────────────────────────────────── */

export function buildBlogHeading(lang: Language): {
  title: string;
  description: string;
} {
  return pick(lang, {
    TH: {
      title: "บล็อกการ์ดวันพีซ — วิเคราะห์ตลาด รีวิวชุด และเทคนิค",
      description: "บทความเรื่องราคาและการสะสมการ์ดวันพีช จากข้อมูลจริงบน Meecard",
    },
    EN: {
      title: "One Piece card blog — market analysis, set reviews and tips",
      description: "Articles on One Piece card prices and collecting, based on Meecard's own data.",
    },
    JP: {
      title: "ワンピースカードブログ — 相場分析・セットレビュー・コツ",
      description: "Meecard の実データにもとづくワンピースカードの価格・収集記事。",
    },
  });
}

/** Browse links shown on /blog so the page stays useful with zero posts. */
export function buildBlogRelated(
  lang: Language,
): { href: string; title: string; description: string }[] {
  return pick(lang, {
    TH: [
      {
        href: "/opcg/trending",
        title: "การ์ดที่ราคาขยับ",
        description: "ดูว่าวันนี้การ์ดวันพีซใบไหนขึ้น–ลงแรงสุด",
      },
      {
        href: "/opcg/sets",
        title: "ชุดการ์ดทั้งหมด",
        description: "เลือกชุดแล้วดูราคาการ์ดทุกใบในชุดนั้น",
      },
      {
        href: "/guide",
        title: "คู่มือมือใหม่",
        description: "พื้นฐานความหายาก สี ประเภทการ์ด และวิธีเล่น",
      },
    ],
    EN: [
      {
        href: "/opcg/trending",
        title: "Today's movers",
        description: "See which One Piece cards rose and fell the most today.",
      },
      {
        href: "/opcg/sets",
        title: "All sets",
        description: "Pick a set and see the price of every card in it.",
      },
      {
        href: "/guide",
        title: "Beginner's guide",
        description: "Rarities, colors, card types and how the game is played.",
      },
    ],
    JP: [
      {
        href: "/opcg/trending",
        title: "本日の値動き",
        description: "今日もっとも上下したワンピースカードを確認。",
      },
      {
        href: "/opcg/sets",
        title: "セット一覧",
        description: "セットを選ぶと収録カード全ての価格を確認できます。",
      },
      {
        href: "/guide",
        title: "初心者ガイド",
        description: "レアリティ・色・カードタイプと遊び方の基礎。",
      },
    ],
  });
}

export function buildBlogIntro(lang: Language): string[] {
  return pick(lang, {
    TH: [
      "ที่นี่คือบล็อกของ Meecard เว็บเช็คราคาการ์ดวันพีซ (One Piece Card Game) สำหรับตลาดไทย เราเขียนจากข้อมูลราคาจริงที่เก็บทุกวัน ไม่ใช่ความรู้สึกว่าใบไหนน่าจะแพง",
      "เนื้อหาแบ่งเป็น 4 หมวด คือ วิเคราะห์ตลาด รีวิวชุดการ์ด เทคนิคสำหรับนักสะสม และข่าวที่มีผลกับราคาการ์ดวันพีช",
      "ระหว่างรอบทความใหม่ ดูราคาปัจจุบันได้จากหน้าการ์ดที่ราคาขยับ หน้ารวมชุดการ์ด หรืออ่านพื้นฐานจากคู่มือมือใหม่",
    ],
    EN: [
      "This is the Meecard blog — written by the team behind a One Piece Card Game price tracker for the Thai market, using the daily price data we collect rather than guesswork.",
      "Posts fall into four categories: market analysis, set reviews, collector tips, and news that moves card prices.",
      "While you wait for the next post, check today's movers, browse every set, or start with the beginner's guide.",
    ],
    JP: [
      "ここはタイ市場向けワンピースカードゲーム価格サイト Meecard のブログです。毎日収集している実価格データにもとづいて書いています。",
      "記事は相場分析・セットレビュー・収集のコツ・価格に影響するニュースの 4 カテゴリに分かれています。",
      "新しい記事が出るまでは、値動きランキングやセット一覧、初心者ガイドをご覧ください。",
    ],
  });
}
