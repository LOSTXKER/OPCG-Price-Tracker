import type { Language } from "@/lib/i18n";

/**
 * Copy for /guide/versions — "การ์ดวันพีช ฉบับญี่ปุ่น อังกฤษ ไทย ต่างกันยังไง".
 *
 * Chosen over a Thai shop directory (the original plan) for two reasons: the
 * buying channels are already covered in depth by /guide/buying, and no Thai
 * shop list could be verified — Bandai's own Thai "official shop" page says the
 * shop is relocating and the community list still circulating dates to 2022.
 * Publishing addresses we cannot confirm would be worse than not publishing.
 *
 * This page answers a question with a hard, citable source instead: Bandai's
 * language/tournament-legality rules. The 2025-11-28 change (English-version
 * cards became legal for tournament play in Thailand, and JP+EN may be mixed in
 * one deck) is documented by Bandai and covered by no Thai site.
 * Everything price-related here is framed as an observed pattern, not data —
 * Meecard's own prices are Japanese-market prices and that is stated plainly.
 *
 * 2026-08-07 update: the "no Thai shop list" gap above still holds for a
 * per-shop directory, but one fact IS now verifiable — KIDZ & KITZ is
 * Bandai's official card-game importer/distributor in Thailand and runs the
 * region's tournament series (Kidz and Kitz Card Game Fest, Bandai Card Fest
 * Bangkok). That's added as its own section below to catch the "การ์ดวันพีช
 * ภาษาไทย" query, which currently has no real SERP answer (only stale
 * blogspot posts).
 */

type Copy<T> = Record<Language, T>;

function pick<T>(lang: Language, copy: Copy<T>): T {
  return copy[lang] ?? copy.EN;
}

export const GUIDE_VERSIONS_META = {
  title: "การ์ดวันพีช ฉบับญี่ปุ่นกับอังกฤษ ต่างกันยังไง",
  description:
    "การ์ดวันพีซ (OPCG) ไม่มีฉบับภาษาไทย — ฉบับญี่ปุ่นกับอังกฤษต่างกันตรงไหน ใช้แข่งในไทยได้ทั้งคู่ไหม ผสมในเด็คเดียวกันได้ไหม และทำไมราคาบนเว็บอ้างอิงตลาดญี่ปุ่น",
} as const;

/**
 * Content revision dates (SEO round 3, 2026-08-07) — feed the "อัปเดตล่าสุด"
 * label under the PageHeader and the Article JSON-LD (datePublished/
 * dateModified). Published date is when this page's copy first shipped
 * (commit 40e0e0c, 2026-08-04); updated date bumps whenever the copy changes.
 * The dateModified matters here specifically because the page cites a rule
 * that changed 2025-11-28 — a stale-looking page undermines that claim.
 */
export const GUIDE_VERSIONS_PUBLISHED_AT = "2026-08-04";
export const GUIDE_VERSIONS_UPDATED_AT = "2026-08-07";

export function guideVersionsUpdatedLabel(lang: Language): string {
  const date = new Date(`${GUIDE_VERSIONS_UPDATED_AT}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  };
  return pick(lang, {
    TH: date.toLocaleDateString("th-TH", opts),
    EN: date.toLocaleDateString("en-US", opts),
    JP: date.toLocaleDateString("ja-JP", opts),
  });
}

export function guideVersionsH1(lang: Language): string {
  return pick(lang, {
    TH: "การ์ดวันพีช ฉบับญี่ปุ่นกับอังกฤษ ต่างกันยังไง",
    EN: "Japanese vs English One Piece cards — what actually differs",
    JP: "ワンピースカード 日本語版と英語版の違い",
  });
}

export function guideVersionsLead(lang: Language): string {
  return pick(lang, {
    TH: "ไม่มีฉบับภาษาไทย แล้วคนไทยควรเก็บฉบับไหน — ดูจากกฎการแข่งและตลาดราคา",
    EN: "There is no Thai-language printing — so which one should a Thai player buy?",
    JP: "タイ語版は存在しません。タイのプレイヤーはどちらを買うべきか。",
  });
}

export function guideVersionsIntro(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "The One Piece Card Game is printed in Japanese, English, French, Simplified Chinese and Korean. There is no official Thai-language printing, which is why every Thai player ends up choosing between the Japanese and English versions.",
      "That choice used to be simple, because for a long time only the Japanese version was legal for tournament play in this region. That changed on 28 November 2025.",
    ];
  }
  if (lang === "JP") {
    return [
      "ワンピースカードゲームは日本語・英語・フランス語・簡体字中国語・韓国語で展開されています。タイ語版は存在しないため、タイのプレイヤーは日本語版か英語版かを選ぶことになります。",
      "長らくこの地域では日本語版のみが公認大会で使用可能でしたが、2025年11月28日にその状況が変わりました。",
    ];
  }
  return [
    "การ์ดวันพีช (One Piece Card Game) พิมพ์ออกมา 5 ภาษา คือ ญี่ปุ่น อังกฤษ ฝรั่งเศส จีนตัวย่อ และเกาหลี — ไม่มีฉบับภาษาไทย คนไทยทุกคนจึงต้องเลือกระหว่างฉบับญี่ปุ่นกับฉบับอังกฤษอยู่ดี",
    "เมื่อก่อนการเลือกไม่ยาก เพราะในโซนนี้ใช้แข่งได้เฉพาะฉบับญี่ปุ่นมานาน แต่เรื่องนี้เปลี่ยนไปแล้วตั้งแต่ 28 พฤศจิกายน 2025",
  ];
}

export function guideVersionsRulesHeading(lang: Language): string {
  return pick(lang, {
    TH: "ใช้แข่งในไทยได้ทั้งสองฉบับแล้ว (ตั้งแต่ 28 พ.ย. 2025)",
    EN: "Both versions are now tournament-legal in Thailand (since 28 Nov 2025)",
    JP: "タイでは両版とも大会で使用可能（2025年11月28日〜）",
  });
}

export function guideVersionsRulesBody(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "Bandai's official language rules state that from 28 November 2025 the English version may be used in Thailand (and Taiwan), and that a deck may be built from Japanese and English cards together in those regions.",
      "In practice that means the version is no longer a legality decision — it is a preference and a price decision. Do still check the rules for the specific event you are entering, because organisers can impose their own restrictions.",
    ];
  }
  if (lang === "JP") {
    return [
      "バンダイの公式ルールでは、2025年11月28日より台湾およびタイで英語版が使用可能となり、これらの地域では日本語版と英語版を混在させたデッキ構築も認められています。",
      "つまり、版の選択は使用可否の問題ではなくなりました。ただし個々の大会の規定は主催者により異なるため、参加前に確認してください。",
    ];
  }
  return [
    "กฎเรื่องภาษาของ Bandai ระบุว่า ตั้งแต่ 28 พฤศจิกายน 2025 ฉบับภาษาอังกฤษใช้ในไทย (และไต้หวัน) ได้ และในพื้นที่เหล่านี้ จัดเด็คโดยผสมการ์ดฉบับญี่ปุ่นกับฉบับอังกฤษในเด็คเดียวกันได้ด้วย",
    "แปลว่าตอนนี้การเลือกฉบับไม่ใช่เรื่อง \"ใช้แข่งได้หรือไม่ได้\" อีกแล้ว แต่เป็นเรื่องความชอบกับราคา — อย่างไรก็ตามก่อนไปแข่งจริงควรอ่านกติกาของงานนั้นๆ ด้วย เพราะผู้จัดแต่ละงานตั้งเงื่อนไขเพิ่มเองได้",
  ];
}

export type VersionRow = {
  id: string;
  title: string;
  jp: string;
  en: string;
};

export function guideVersionsCompareHeading(lang: Language): string {
  return pick(lang, {
    TH: "เทียบให้เห็นภาพ",
    EN: "Side by side",
    JP: "比較",
  });
}

export function guideVersionsCompareLabels(lang: Language) {
  return {
    topic: pick(lang, { TH: "หัวข้อ", EN: "Topic", JP: "項目" }),
    jp: pick(lang, { TH: "ฉบับญี่ปุ่น (JP)", EN: "Japanese (JP)", JP: "日本語版" }),
    en: pick(lang, { TH: "ฉบับอังกฤษ (EN)", EN: "English (EN)", JP: "英語版" }),
  };
}

export function guideVersionsCompare(lang: Language): VersionRow[] {
  if (lang === "EN") {
    return [
      {
        id: "release",
        title: "Release timing",
        jp: "Sets appear here first — the Japanese release leads the schedule.",
        en: "Follows later; a set's English release trails its Japanese one.",
      },
      {
        id: "legal",
        title: "Tournament use in Thailand",
        jp: "Legal, and has been for a long time.",
        en: "Legal since 28 November 2025 — and may be mixed with JP in one deck.",
      },
      {
        id: "reading",
        title: "Reading the card",
        jp: "Effects are in Japanese; there is no official Thai translation, so players rely on community translations.",
        en: "Effects are readable for anyone comfortable with English — the practical reason many newer players pick it.",
      },
      {
        id: "market",
        title: "Which market sets the price",
        jp: "The Japanese secondary market is the deepest and most quoted — it is the market Meecard tracks.",
        en: "Priced in its own regional markets; a card's English price and Japanese price are not the same number.",
      },
    ];
  }
  if (lang === "JP") {
    return [
      {
        id: "release",
        title: "発売時期",
        jp: "先行して発売されます。",
        en: "日本語版より後になります。",
      },
      {
        id: "legal",
        title: "タイでの大会使用",
        jp: "以前から使用可能。",
        en: "2025年11月28日より使用可能。日本語版との混在構築も可。",
      },
      {
        id: "reading",
        title: "テキストの読みやすさ",
        jp: "日本語表記。タイ語の公式翻訳はありません。",
        en: "英語が読めれば理解しやすい。",
      },
      {
        id: "market",
        title: "価格の基準市場",
        jp: "日本の二次流通市場が中心。Meecardが追跡しているのもこの市場です。",
        en: "各地域の市場で価格が形成され、日本語版と同一ではありません。",
      },
    ];
  }
  return [
    {
      id: "release",
      title: "ออกก่อน–ออกหลัง",
      jp: "ออกก่อนเสมอ ชุดใหม่มาที่ฉบับญี่ปุ่นเป็นที่แรก",
      en: "ตามมาทีหลัง ชุดเดียวกันฉบับอังกฤษจะออกช้ากว่า",
    },
    {
      id: "legal",
      title: "ใช้แข่งในไทย",
      jp: "ใช้ได้ และใช้ได้มานานแล้ว",
      en: "ใช้ได้ตั้งแต่ 28 พ.ย. 2025 และผสมกับฉบับญี่ปุ่นในเด็คเดียวกันได้",
    },
    {
      id: "reading",
      title: "อ่านข้อความบนการ์ด",
      jp: "ข้อความเป็นภาษาญี่ปุ่น ไม่มีคำแปลไทยทางการ ผู้เล่นไทยจึงพึ่งคำแปลจากคอมมูนิตี้",
      en: "อ่านออกทันทีถ้าพออ่านอังกฤษได้ — เป็นเหตุผลหลักที่มือใหม่หลายคนเลือกฉบับนี้",
    },
    {
      id: "market",
      title: "ตลาดที่กำหนดราคา",
      jp: "ตลาดมือสองญี่ปุ่นเป็นตลาดที่ใหญ่และถูกอ้างอิงมากที่สุด และเป็นตลาดที่ Meecard เก็บราคามา",
      en: "ราคาเกิดในตลาดของภูมิภาคตัวเอง ราคาการ์ดใบเดียวกันฉบับอังกฤษกับฉบับญี่ปุ่นจึงไม่ใช่ตัวเลขเดียวกัน",
    },
  ];
}

export function guideVersionsPriceHeading(lang: Language): string {
  return pick(lang, {
    TH: "ทำไมราคาบน Meecard เป็นราคาฉบับญี่ปุ่น",
    EN: "Why Meecard's prices are Japanese-version prices",
    JP: "Meecardの価格が日本語版基準である理由",
  });
}

export type VersionsPriceParagraph = {
  id: string;
  before: string;
  /** Optional in-content link segment rendered between `before` and `after`. */
  link?: { href: string; label: string };
  after?: string;
};

export function guideVersionsPriceBody(lang: Language): VersionsPriceParagraph[] {
  if (lang === "EN") {
    return [
      {
        id: "source",
        before:
          "Meecard tracks the Japanese secondary market, because that is where One Piece Card Game cards trade in the largest volume and where a reference price actually stabilises.",
        link: { href: "/opcg/sets", label: "Every price on this site" },
        after:
          "is therefore a Japanese-version price, converted to Thai baht so it is easier to compare with what a Thai seller is asking.",
      },
      {
        id: "not-english",
        before:
          "So do not read a price here as a valuation of an English copy of the same card. Use it as the reference point it is: what that card trades for in the market that leads the game.",
      },
      {
        id: "context",
        before:
          "Collectors widely observe that English boxes can sell at a premium before a set's global release, and that first-printing Japanese versions of iconic cards carry collector prestige. Both are community observations rather than measured data, so treat them as context, not as a rule to buy on.",
      },
    ];
  }
  if (lang === "JP") {
    return [
      {
        id: "source",
        before:
          "Meecardは日本の二次流通市場を追跡しています。取引量がもっとも多く、参照価格が安定する市場だからです。したがって",
        link: { href: "/opcg/sets", label: "本サイトの価格" },
        after: "は日本語版の価格であり、比較しやすいようタイバーツに換算しています。",
      },
      { id: "not-english", before: "英語版の同名カードの評価額として読まないでください。" },
      {
        id: "context",
        before:
          "英語版のボックスが世界発売前に高くなる、象徴的なカードの日本語版初刷にコレクター需要がある、といった傾向はコミュニティの観察であり、計測データではありません。",
      },
    ];
  }
  return [
    {
      id: "source",
      before:
        "Meecard เก็บราคาจากตลาดมือสองญี่ปุ่น เพราะเป็นตลาดที่การ์ดวันพีชซื้อขายกันมากที่สุดและราคาถึงจะนิ่งพอจะใช้เป็นราคาอ้างอิงได้จริง",
      link: { href: "/opcg/sets", label: "ราคาทุกใบบนเว็บนี้" },
      after: "จึงเป็นราคาของฉบับญี่ปุ่น แล้วแปลงเป็นเงินบาทให้เทียบกับที่คนขายในไทยตั้งไว้ได้ง่ายขึ้น",
    },
    {
      id: "not-english",
      before:
        "เพราะฉะนั้นอย่าอ่านราคาบนเว็บนี้เป็นราคาของการ์ดใบเดียวกันฉบับอังกฤษ ให้ใช้มันตามที่มันเป็น — คือราคาที่การ์ดใบนั้นซื้อขายกันในตลาดที่นำเกมอยู่",
    },
    {
      id: "context",
      before:
        "ในวงนักสะสมมีข้อสังเกตที่พูดกันบ่อยว่ากล่องฉบับอังกฤษมักแพงขึ้นช่วงก่อนวางขายทั่วโลก และการ์ดสัญลักษณ์ของเกมฉบับญี่ปุ่นพิมพ์แรกมีมูลค่าในเชิงสะสมมากกว่า ทั้งสองข้อเป็นการสังเกตของคอมมูนิตี้ ไม่ใช่ข้อมูลที่วัดมา จึงควรใช้เป็นบริบทประกอบ ไม่ใช่เหตุผลเดียวในการตัดสินใจซื้อ",
    },
  ];
}

export function guideVersionsThaiHeading(lang: Language): string {
  return pick(lang, {
    TH: "การ์ดวันพีชมีภาษาไทยไหม แล้วใครจัดจำหน่ายในไทย",
    EN: "Is there a Thai-language version — and who distributes in Thailand?",
    JP: "タイ語版はある？ タイの正規販売元は？",
  });
}

export function guideVersionsThaiBody(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "As covered above, there is still no Thai-language printing of the One Piece Card Game — Thai players play the Japanese or English version.",
      "The official importer and distributor of Bandai's card games in Thailand is KIDZ & KITZ, which also runs the region's tournament series — Kidz and Kitz Card Game Fest and Bandai Card Fest Bangkok.",
      "Bandai has announced a move to worldwide simultaneous releases starting in 2026, meaning every region gets a new set on the same date. Whether that eventually leads to a Thai-language printing has not been announced, so for now treat it as a release-timing change, not a language change.",
    ];
  }
  if (lang === "JP") {
    return [
      "前述の通り、ワンピースカードゲームのタイ語版印刷は現時点でありません。タイのプレイヤーは日本語版か英語版でプレイしています。",
      "タイにおけるバンダイのカードゲームの正規輸入・販売元はKIDZ & KITZで、地域の大会シリーズ（Kidz and Kitz Card Game Fest、Bandai Card Fest Bangkok）も継続的に開催しています。",
      "バンダイは2026年から全世界同時発売への移行を発表しています。これがタイ語版印刷につながるかは発表されていないため、現時点では発売時期の変更として捉えてください。",
    ];
  }
  return [
    "อย่างที่บอกไปข้างต้น การ์ดวันพีชยังไม่มีฉบับที่พิมพ์เป็นภาษาไทย คนไทยเล่นกันด้วยฉบับญี่ปุ่นหรืออังกฤษ",
    "ผู้นำเข้าและจัดจำหน่าย Bandai card game อย่างเป็นทางการในไทยคือ KIDZ & KITZ (คิดซ์ แอนด์ คิทซ์) ซึ่งจัดงานแข่งขันในไทยต่อเนื่อง ทั้ง Kidz and Kitz Card Game Fest และ Bandai Card Fest Bangkok",
    "Bandai ประกาศแผนเปลี่ยนไปวางขายพร้อมกันทั่วโลก (worldwide simultaneous release) เริ่มปี 2026 คือทุกภูมิภาคจะได้ชุดใหม่วันเดียวกัน ส่วนเรื่องนี้จะทำให้มีฉบับภาษาไทยตามมาไหมยังไม่มีการประกาศ ตอนนี้จึงนับเป็นแค่การเปลี่ยนเรื่องจังหวะวางขาย ไม่ใช่การเปลี่ยนเรื่องภาษา",
  ];
}

export function guideVersionsChooseHeading(lang: Language): string {
  return pick(lang, {
    TH: "แล้วควรเลือกฉบับไหน",
    EN: "So which should you buy?",
    JP: "どちらを選ぶべきか",
  });
}

export function guideVersionsChoose(lang: Language): { title: string; body: string }[] {
  if (lang === "EN") {
    return [
      {
        title: "If you mainly play",
        body: "Pick whichever your local scene plays, and check the event's own rules. Since both are legal in Thailand and can be mixed, the deciding factor is usually what your opponents can read across the table and what your shop stocks.",
      },
      {
        title: "If you mainly collect",
        body: "The Japanese version is what the reference market prices, gets sets first, and is what the numbers on this site describe — which makes it the easier version to value.",
      },
      {
        title: "If you are starting out",
        body: "English is the gentler entry: you can read your own cards without a translation sheet. Starter decks exist in both, and a starter is still the cheapest way to find out whether you enjoy the game.",
      },
    ];
  }
  if (lang === "JP") {
    return [
      { title: "対戦が中心なら", body: "地域のプレイ環境と大会規定に合わせて選んでください。" },
      { title: "収集が中心なら", body: "参照市場が日本であるため、日本語版のほうが価値を把握しやすいです。" },
      { title: "これから始めるなら", body: "英語版はテキストを自分で読めるぶん始めやすい選択肢です。" },
    ];
  }
  return [
    {
      title: "ถ้าเน้นเล่นแข่ง",
      body: "เลือกตามที่กลุ่มแถวบ้านเล่นกัน แล้วเช็กกติกาของงานที่จะไปแข่งอีกที เพราะตอนนี้ใช้ได้ทั้งสองฉบับและผสมกันได้ ตัวตัดสินจริงๆ มักเป็นว่าคู่แข่งฝั่งตรงข้ามอ่านการ์ดของเราออกไหม และร้านแถวนั้นมีของฉบับไหนขาย",
    },
    {
      title: "ถ้าเน้นสะสม",
      body: "ฉบับญี่ปุ่นคือฉบับที่ตลาดอ้างอิงตั้งราคาให้ ได้ชุดใหม่ก่อน และเป็นฉบับที่ตัวเลขบนเว็บนี้พูดถึง จึงประเมินมูลค่าได้ง่ายกว่า",
    },
    {
      title: "ถ้าเพิ่งเริ่มเล่น",
      body: "ฉบับอังกฤษเริ่มง่ายกว่า เพราะอ่านการ์ดของตัวเองได้โดยไม่ต้องเปิดตารางแปล ทั้งสองฉบับมี starter deck ขาย และการซื้อ starter ยังเป็นวิธีที่ถูกที่สุดในการลองว่าเราชอบเกมนี้จริงไหม",
    },
  ];
}

export function guideVersionsFaq(
  lang: Language
): { question: string; answer: string; link?: { href: string; label: string } }[] {
  if (lang === "EN") {
    return [
      {
        question: "Is there an official Thai-language One Piece Card Game?",
        answer:
          "No. Bandai's supported languages are Japanese, English, French, Simplified Chinese and Korean. Thai players use the Japanese or English printing, with community-made translations for Japanese card text.",
      },
      {
        question: "Is there a Thai-language One Piece card?",
        answer:
          "Not yet — there is no Thai-language printing. Thai players use the Japanese or English version, imported by the official Thailand distributor, KIDZ & KITZ.",
      },
      {
        question: "Can I use English cards in a Thai tournament?",
        answer:
          "Yes — Bandai's language rules made the English version usable in Thailand from 28 November 2025, and decks in this region may combine Japanese and English cards. Individual organisers can still add their own conditions, so check the event page.",
      },
      {
        question: "Can I mix Japanese and English cards in one deck?",
        answer:
          "In Thailand, yes, under the same rule change. Note it is about the printing language, not about mixing sets — normal deck-building limits still apply.",
      },
      {
        question: "Are the prices on Meecard for Japanese or English cards?",
        answer:
          "Japanese. Prices come from the Japanese secondary market and are converted to Thai baht for comparison. An English copy of the same card trades in a different market at a different price.",
        link: { href: "/opcg/sets", label: "See every card's price" },
      },
    ];
  }
  if (lang === "JP") {
    return [
      {
        question: "タイ語版はありますか？",
        answer: "ありません。対応言語は日本語・英語・フランス語・簡体字中国語・韓国語です。",
      },
      {
        question: "タイ語版のワンピースカードはありますか？",
        answer:
          "まだありません。タイ語版の印刷はなく、タイのプレイヤーは正規販売元KIDZ & KITZが輸入する日本語版または英語版を使用しています。",
      },
      {
        question: "タイの大会で英語版は使えますか？",
        answer:
          "2025年11月28日より使用可能です。同地域では日本語版との混在構築も認められています。大会ごとの規定は主催者にご確認ください。",
      },
      {
        question: "Meecardの価格はどちらの版ですか？",
        answer: "日本語版です。日本の二次流通価格をタイバーツに換算しています。",
        link: { href: "/opcg/sets", label: "全カードの価格を見る" },
      },
    ];
  }
  return [
    {
      question: "การ์ดวันพีชมีฉบับภาษาไทยไหม?",
      answer:
        "ไม่มี ภาษาที่ Bandai พิมพ์ออกมาคือ ญี่ปุ่น อังกฤษ ฝรั่งเศส จีนตัวย่อ และเกาหลี ผู้เล่นไทยใช้ฉบับญี่ปุ่นหรืออังกฤษ แล้วอาศัยคำแปลที่คอมมูนิตี้ทำกันเองสำหรับข้อความบนการ์ดฉบับญี่ปุ่น",
    },
    {
      question: "การ์ดวันพีชมีภาษาไทยไหม?",
      answer:
        "ยังไม่มี การ์ดวันพีชยังไม่มีฉบับที่พิมพ์เป็นภาษาไทย ผู้เล่นไทยเล่นฉบับญี่ปุ่นหรืออังกฤษที่นำเข้าโดยผู้จัดจำหน่ายทางการในไทยอย่าง KIDZ & KITZ",
    },
    {
      question: "เอาการ์ดฉบับอังกฤษไปแข่งในไทยได้ไหม?",
      answer:
        "ได้ กฎเรื่องภาษาของ Bandai ให้ฉบับภาษาอังกฤษใช้ในไทยได้ตั้งแต่ 28 พฤศจิกายน 2025 และในโซนนี้จัดเด็คผสมฉบับญี่ปุ่นกับอังกฤษได้ด้วย แต่ผู้จัดแต่ละงานยังตั้งเงื่อนไขเพิ่มเองได้ ควรอ่านกติกาของงานนั้นก่อนไป",
    },
    {
      question: "ผสมการ์ดญี่ปุ่นกับอังกฤษในเด็คเดียวกันได้จริงเหรอ?",
      answer:
        "ในไทยได้ ตามการเปลี่ยนกฎเดียวกันนี้ ทั้งนี้เรื่องนี้พูดถึง \"ภาษาที่พิมพ์บนการ์ด\" เท่านั้น ข้อจำกัดการสร้างเด็คอย่างอื่น เช่นจำนวนใบและจำนวนใบซ้ำ ยังใช้ตามปกติ",
    },
    {
      question: "ราคาบน Meecard เป็นราคาฉบับไหน?",
      answer:
        "ฉบับญี่ปุ่น ราคามาจากตลาดมือสองญี่ปุ่นแล้วแปลงเป็นเงินบาทเพื่อให้เทียบง่าย การ์ดใบเดียวกันฉบับอังกฤษซื้อขายกันคนละตลาดและคนละราคา",
      link: { href: "/opcg/sets", label: "ดูราคาการ์ดทุกใบบนเว็บนี้" },
    },
  ];
}
