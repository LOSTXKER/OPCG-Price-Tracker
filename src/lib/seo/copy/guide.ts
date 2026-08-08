/**
 * SEO copy for the `/guide/**` knowledge pillar.
 *
 * Lives outside the flat `t()` dictionary on purpose: these strings are long
 * prose blocks / FAQ pairs that need data interpolation, and the shared
 * `src/lib/i18n/*.ts` dictionaries are edited by many agents at once.
 *
 * Convention: every builder takes `Language` first and returns per-language
 * copy. TH is the canonical version (the site is Thai-first and crawlers
 * default to TH); EN is a reasonable translation; JP mirrors EN.
 *
 * Factual discipline: nothing here invents prices, pull rates, shop names or
 * release dates. Numbers are either already published elsewhere on the same
 * page, or derived from the database at render time and passed in as `data`.
 */

import type { Language } from "@/lib/i18n";

export interface GuideFaqItem {
  question: string;
  answer: string;
  /** Read-more inside the answer body (FaqSection `link` — not in JSON-LD). */
  link?: { href: string; label: string };
}

type Tri = { TH: string; EN: string; JP: string };

/** Build a TH/EN/JP triple. JP defaults to the EN copy. */
function tri(TH: string, EN: string, JP: string = EN): Tri {
  return { TH, EN, JP };
}

function pick(lang: Language, value: Tri): string {
  return value[lang] ?? value.TH;
}

function pickList(lang: Language, value: { TH: string[]; EN: string[]; JP?: string[] }): string[] {
  if (lang === "EN") return value.EN;
  if (lang === "JP") return value.JP ?? value.EN;
  return value.TH;
}

/* ------------------------------------------------------------------ */
/*  Metadata (Thai only — crawlers default to TH)                       */
/*                                                                      */
/*  Titles keep the visible part short: the root layout appends          */
/*  " | Meecard" through its own title template.                         */
/*  Every description carries the "วันพีซ" spelling so each page covers   */
/*  both Thai spellings (titles/H1 use "วันพีช").                        */
/* ------------------------------------------------------------------ */

export const GUIDE_META = {
  hub: {
    title: "คู่มือ One Piece Card Game (การ์ดวันพีช) มือใหม่",
    description:
      "คู่มือการ์ดวันพีซ (One Piece Card Game) ฉบับมือใหม่ เช็คราคากลางได้ทุกใบ อัปเดตทุกวัน ครบทั้งวิธีเล่น ประเภทการ์ด ความหายาก สี ชุดการ์ด และวิธีซื้อ",
  },
  gettingStarted: {
    title: "วิธีเล่น One Piece Card Game (การ์ดวันพีช) มือใหม่",
    description:
      "วิธีเล่นการ์ดวันพีซ (One Piece Card Game) กฎครบในหน้าเดียว — เด็ค 50 ใบ + Leader 1 ใบ + DON!! 10 ใบ ลำดับเทิร์น การโจมตี การป้องกัน และเงื่อนไขแพ้ชนะ",
  },
  rarities: {
    title: "ความหายากการ์ดวันพีช — C ถึง Treasure Rare",
    description:
      "ความหายากการ์ดวันพีซ ครบทุกระดับ: C, UC, R, SR, SEC, SP, TR พร้อมอธิบาย SEC คืออะไร Parallel คืออะไร ช่วงราคาตลาด และสิ่งที่ได้จากการเปิด 1 กล่อง",
  },
  colors: {
    title: "สีในวันพีชการ์ดเกม — 6 สี และการสร้างเด็ค",
    description:
      "ระบบสีของการ์ดวันพีซ (One Piece Card Game) ทั้ง 6 สี — แดง เขียว น้ำเงิน ม่วง ดำ เหลือง จุดแข็งของแต่ละสี Leader สองสี และกฎเลือกสีตอนสร้างเด็ค",
  },
  cardTypes: {
    title: "ประเภทการ์ดวันพีช — Leader, Character, DON!!",
    description:
      "ประเภทการ์ดวันพีซ ทั้ง 5 แบบ: Leader, Character, Event, Stage และ DON!! พร้อมค่าสถานะบนการ์ด และคีย์เวิร์ดสำคัญ [Blocker] [Rush] [Trigger] [Counter]",
  },
  sets: {
    // Repositioned (SEO round 2): the old title/H1 said "ทั้งหมด" (all sets)
    // and duplicated the query owned by /opcg/sets — the real money page —
    // while this guide only lists the 12 most recent. Now it owns the
    // explainer query ("มีกี่แบบ") and defers the full index to /opcg/sets.
    title: "ชุดการ์ดวันพีชมีกี่แบบ? Booster / Starter / EB",
    description:
      "ชุดการ์ดวันพีชมีกี่แบบ? สรุป Booster Pack, Starter Deck และ Extra Booster ต่างกันยังไง พร้อมรูปแบบรหัสการ์ด (OP09-001) แล้วไปดูราคาทุกใบที่หน้าชุดการ์ด",
  },
  buying: {
    title: "ซื้อการ์ดวันพีชที่ไหนดี? แหล่งซื้อและวิธีเช็คราคา",
    description:
      "ซื้อการ์ดวันพีช/วันพีซที่ไหนดี เทียบช่องทาง Shopee กลุ่ม Facebook ร้านหน้าร้าน และการสั่งตรงจากญี่ปุ่นผ่าน proxy พร้อมวิธีเช็คราคากลางก่อนโอนเงิน",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  /guide — hub                                                        */
/* ------------------------------------------------------------------ */

export function guideHubH1(lang: Language): string {
  return pick(
    lang,
    tri(
      "คู่มือ One Piece Card Game (การ์ดวันพีช) ฉบับมือใหม่",
      "One Piece Card Game Guide for Beginners"
    )
  );
}

export function guideHubLead(lang: Language): string {
  return pick(
    lang,
    tri(
      "คู่มือการ์ดวันพีช (One Piece Card Game) สำหรับมือใหม่ — ครบทั้งกฎการเล่น ประเภทการ์ด ความหายาก สี ชุดการ์ด และวิธีอ่านราคากลางของการ์ดวันพีช",
      "A beginner's guide to the One Piece Card Game — rules, card types, rarities, colors, sets, and how to read reference prices."
    )
  );
}

export function guideHubIntroHeading(lang: Language): string {
  return pick(
    lang,
    tri(
      "การ์ดวันพีช (One Piece Card Game) คืออะไร และทำไมต้องเช็คราคา",
      "What is the One Piece Card Game, and why check prices?"
    )
  );
}

/**
 * SEO round 3: trimmed from 4 paragraphs to 2 (dropped the old closing
 * "read in this order" paragraph — it described the chapter list, which now
 * renders as a real grid directly ABOVE this section, so restating it in
 * prose was pure duplication) and moved below the chapter grid so the guide
 * hub leads with what visitors came for (the chapters) rather than ~1.5
 * screens of prose on mobile before reaching them.
 */
export function guideHubIntroParagraphs(lang: Language): string[] {
  return pickList(lang, {
    TH: [
      "การ์ดวันพีช หรือ One Piece Card Game (OPCG / OPTCG บางคนสะกดว่า “การ์ดวันพีซ”) คือเกมการ์ดสะสมและแข่งขันจาก Bandai ที่สร้างจากมังงะและอนิเมะ One Piece เปิดตัวในญี่ปุ่นปี 2022 เสน่ห์ของเกมนี้อยู่ที่การ์ดใบเดียวกันอาจมีหลายเวอร์ชัน ทั้งภาพปกติ ภาพพิเศษ (Parallel) และระดับความหายากตั้งแต่ Common ไปจนถึง Secret Rare และ Treasure Rare ทำให้ราคาซื้อขายจริงห่างกันได้หลายสิบเท่าแม้เป็นตัวละครเดียวกัน คนที่เพิ่งเริ่มจึงมักจ่ายแพงเกินจำเป็นเพราะไม่รู้ว่าการ์ดใบที่ถืออยู่คือเวอร์ชันไหน",
      "Meecard ทำหน้าที่เป็นราคาอ้างอิง — เราดึงราคาจากตลาดญี่ปุ่นซึ่งเป็นตลาดหลักของเกมนี้ อัปเดตทุกวัน แปลงเป็นเงินบาทให้อัตโนมัติ พร้อมกราฟราคาย้อนหลัง เพื่อให้คุณรู้ว่าราคาที่ผู้ขายเสนอมานั้นสมเหตุสมผลหรือไม่ก่อนจะกดซื้อ",
    ],
    EN: [
      "The One Piece Card Game (OPCG / OPTCG) is Bandai's trading card game based on the One Piece manga and anime, launched in Japan in 2022. What makes it interesting — and expensive — is that a single card can exist in several versions: normal art, alternate (Parallel) art, and rarities from Common up to Secret Rare and Treasure Rare. Real market prices between those versions can differ by tens of times, even for the same character, and new players routinely overpay simply because they cannot tell which version they are holding.",
      "Meecard exists to be that reference price. We pull prices from the Japanese market — the primary market for this game — refresh them daily, convert them to Thai baht automatically, and keep price history charts so you can tell whether an asking price is reasonable before you pay.",
    ],
  });
}

/** No chapter count in the copy — the hub's guide list grows (authenticity and
 *  versions were added after this heading was written) and a hardcoded number
 *  silently goes stale. */
export function guideHubChaptersHeading(lang: Language): string {
  return pick(lang, tri("คู่มือทุกบท", "All chapters"));
}

export function guideHubPricesHeading(lang: Language): string {
  return pick(lang, tri("เช็คราคาการ์ดวันพีชจากชุดที่ต้องการ", "Check One Piece card prices by set"));
}

export function guideHubPricesIntro(lang: Language, data: { setCount: number; cardCount: number }): string {
  return pick(
    lang,
    tri(
      `อ่านคู่มือจบแล้วลองใช้งานจริง — Meecard เก็บราคาการ์ดวันพีชไว้ ${data.cardCount.toLocaleString("th-TH")} ใบ จาก ${data.setCount} ชุด อัปเดตทุกวัน เลือกชุดที่ต้องการเพื่อดูราคาทุกใบในชุดนั้น`,
      `Put the guide to work — Meecard tracks ${data.cardCount.toLocaleString("en-US")} cards across ${data.setCount} sets, refreshed daily. Pick a set to see every card's price.`
    )
  );
}

export function guideHubPricesAllSets(lang: Language): string {
  return pick(lang, tri("ดูชุดการ์ดทั้งหมด", "Browse all sets"));
}

export function guideHubMarketLinkTitle(lang: Language): string {
  return pick(lang, tri("ราคาการ์ดวันพีชวันนี้", "One Piece card prices today"));
}

export function guideHubMarketLinkDesc(lang: Language): string {
  return pick(
    lang,
    tri("ตารางราคากลางทุกใบ พร้อม % เปลี่ยนแปลง 24 ชั่วโมง", "The full market table with 24h change.")
  );
}

export function guideHubTrendingLinkTitle(lang: Language): string {
  return pick(lang, tri("การ์ดที่ราคาขยับแรงวันนี้", "Biggest movers today"));
}

export function guideHubTrendingLinkDesc(lang: Language): string {
  return pick(lang, tri("อันดับการ์ดที่ราคาขึ้น–ลงมากที่สุด", "Cards with the biggest price swings."));
}

/**
 * Hub FAQ. The first six questions stay in the shared dictionary (they are
 * unchanged); these are the three SEO additions from the content plan. The
 * "latest set" answer is data-driven so it never goes stale.
 */
export function guideHubExtraFaq(
  lang: Language,
  data: { latestSetLabel: string | null; setCount: number }
): GuideFaqItem[] {
  const latestTh = data.latestSetLabel
    ? `ชุดใหม่ล่าสุดที่ Meecard เก็บราคาอยู่คือ ${data.latestSetLabel} จากทั้งหมด ${data.setCount} ชุด เราเพิ่มชุดใหม่ให้ทันทีที่ราคาตลาดเริ่มนิ่งพอจะอ้างอิงได้ ดูรายชื่อชุดทั้งหมดพร้อมวันวางขายได้ที่หน้าชุดการ์ด`
    : `ดูรายชื่อชุดการ์ดทั้งหมด ${data.setCount} ชุด พร้อมวันวางขายและราคาทุกใบได้ที่หน้าชุดการ์ดของ Meecard`;
  const latestEn = data.latestSetLabel
    ? `The newest set Meecard tracks is ${data.latestSetLabel}, out of ${data.setCount} sets in total. Browse the full set list with release dates on the sets page.`
    : `Browse all ${data.setCount} sets with release dates and per-card prices on the sets page.`;

  return [
    // SEO round 1: the full how-to-spot-fakes walkthrough is the CORE content
    // of /guide/authenticity — answering it in full here made the hub compete
    // with (and orphan) its own cluster page. Two sentences + the link.
    {
      question: pick(
        lang,
        tri("การ์ดวันพีชแท้ดูยังไง?", "How can I tell if a One Piece card is genuine?")
      ),
      answer: pick(
        lang,
        tri(
          "เช็คเร็วๆ ได้สองอย่าง: เทียบรหัสการ์ดกับฐานข้อมูลของชุดนั้นว่ามีอยู่จริงและรายละเอียดตรง แล้วเทียบราคากับราคากลาง — การ์ดหายากที่ถูกกว่าตลาดผิดปกติมักมีเหตุผลเสมอ",
          "Two quick checks: confirm the card code exists in the set's card list with matching details, then compare the asking price with the market reference — a rare card priced far below market usually has a reason."
        )
      ),
      link: {
        href: "/guide/authenticity",
        label: pick(
          lang,
          tri("วิธีดูการ์ดวันพีชแท้–ปลอมฉบับเต็ม", "The full genuine-or-fake checklist")
        ),
      },
    },
    {
      question: pick(lang, tri("ชุดล่าสุดคือชุดอะไร?", "Which set is the latest?")),
      answer: pick(lang, tri(latestTh, latestEn)),
      link: {
        href: "/opcg/sets",
        label: pick(
          lang,
          tri("ชุดการ์ดวันพีชทั้งหมดพร้อมราคา", "All One Piece card sets with prices")
        ),
      },
    },
    {
      question: pick(
        lang,
        tri("เริ่มเล่นการ์ดวันพีชต้องใช้เงินเท่าไหร่?", "How much does it cost to start playing?")
      ),
      answer: pick(
        lang,
        tri(
          "ถ้าจะเริ่มเล่นจริงจัง ทางที่ถูกที่สุดคือซื้อ Starter Deck หนึ่งกล่อง ซึ่งมี Leader และการ์ดครบพร้อมเล่นทันที ราคาระดับไม่กี่ร้อยบาท ไม่ต้องซื้อการ์ดแยกใบเลย จากนั้นค่อยเปลี่ยนการ์ดทีละใบตามที่อยากได้ ส่วนการเปิดกล่อง Booster เป็นเรื่องของการสะสม/ลุ้นการ์ด ไม่ใช่วิธีประหยัดในการหาการ์ดที่ต้องการ — ถ้าอยากได้การ์ดใบใดใบหนึ่ง การซื้อแยกใบตามราคากลางมักถูกกว่าการเปิดหาเอง ราคาจริงต่างกันตามร้านและตามชุด เช็คราคากลางล่าสุดได้จาก Meecard ก่อนตัดสินใจ",
          "The cheapest way to actually start is one Starter Deck: it ships with a Leader and a ready-to-play deck for a few hundred baht, with no singles required. After that you can swap in individual cards over time. Opening booster boxes is a collecting activity, not a cheap way to obtain a specific card — buying that single at market price is usually cheaper. Real prices vary by shop and set, so check the current reference price on Meecard first."
        )
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  /guide/getting-started                                              */
/* ------------------------------------------------------------------ */

export function guideStartH1(lang: Language): string {
  return pick(
    lang,
    tri(
      "วิธีเล่นการ์ดวันพีช (One Piece Card Game) สำหรับมือใหม่",
      "How to play the One Piece Card Game — beginner rules"
    )
  );
}

export function guideStartStarterHeading(lang: Language): string {
  return pick(lang, tri("ชุดเริ่มต้น (Starter Deck) ที่ซื้อแล้วเล่นได้เลย", "Starter Decks you can play out of the box"));
}

export function guideStartStarterIntro(lang: Language): string {
  return pick(
    lang,
    tri(
      "Starter Deck คือกล่องที่มี Leader และการ์ดครบพร้อมเล่นทันที เหมาะกับคนเริ่มต้นมากที่สุด กดเข้าไปดูรายการการ์ดและราคากลางของแต่ละชุดได้เลย",
      "A Starter Deck ships with a Leader and a complete, ready-to-play deck — the best entry point. Open one to see its card list and reference prices."
    )
  );
}

export function guideStartFaq(lang: Language): GuideFaqItem[] {
  return [
    {
      question: pick(
        lang,
        tri("เด็คการ์ดวันพีชมีกี่ใบ?", "How many cards are in a One Piece Card Game deck?")
      ),
      answer: pick(
        lang,
        tri(
          "หนึ่งชุดที่พร้อมเล่นประกอบด้วย Leader 1 ใบ (วางแยก ไม่นับรวมในเด็ค), การ์ดในเด็ค 50 ใบพอดี และ DON!! อีก 10 ใบซึ่งเป็นกองแยกต่างหาก การ์ดชื่อเดียวกันใส่ซ้ำได้สูงสุด 4 ใบ และการ์ดทุกใบในเด็คต้องมีสีตรงกับสีของ Leader อย่างน้อยหนึ่งสี",
          "A legal setup is 1 Leader (placed separately, not counted in the deck), exactly 50 cards in the deck, and a separate 10-card DON!! deck. You may include up to 4 copies of a card with the same name, and every card in the deck must share at least one color with your Leader."
        )
      ),
    },
    {
      question: pick(lang, tri("DON!! คืออะไร ใช้ยังไง?", "What is DON!! and how is it used?")),
      answer: pick(
        lang,
        tri(
          "DON!! คือกองการ์ดพลังงาน 10 ใบที่แยกจากเด็คหลัก ทุกเทิร์นคุณจะดึง DON!! ออกมาวางในสนามเพิ่มขึ้นเรื่อยๆ แล้วใช้มันได้สองทาง: จ่ายเป็นค่าร่าย (Cost) เพื่อลงการ์ด หรือแนบเข้ากับ Leader/Character เพื่อเพิ่มพลังโจมตีใบละ +1000 Power ในเทิร์นนั้น เมื่อจบเทิร์น DON!! ที่แนบไว้จะกลับสู่สนามพร้อมใช้ใหม่ในเทิร์นถัดไป",
          "DON!! is a separate 10-card resource deck. Each turn you place more DON!! onto the field and spend them in one of two ways: paying a card's Cost, or attaching them to your Leader or a Character for +1000 Power each that turn. Attached DON!! return to the field at end of turn and can be used again."
        )
      ),
    },
    {
      question: pick(lang, tri("แพ้ชนะตัดสินยังไง?", "How do you win a game?")),
      answer: pick(
        lang,
        tri(
          "ชนะได้สองทาง ทางแรกคือโจมตี Leader ฝ่ายตรงข้ามจน Life หมด แล้วโจมตีสำเร็จอีกครั้งในตอนที่ไม่มี Life เหลือ ทางที่สองคือฝ่ายตรงข้ามต้องจั่วการ์ดตอนที่ในเด็คไม่มีการ์ดเหลือแล้ว (deck out) ฝ่ายนั้นจะแพ้ทันที",
          "There are two ways. First, attack the opposing Leader until their Life is gone and then land one more successful attack. Second, if your opponent has to draw from an empty deck (deck out), they lose immediately."
        )
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  /guide/rarities                                                     */
/* ------------------------------------------------------------------ */

export function guideRarityH1(lang: Language): string {
  return pick(
    lang,
    tri(
      "ความหายากการ์ดวันพีช (Rarity) — C ถึง Treasure Rare",
      "One Piece Card Game rarities — from C to Treasure Rare"
    )
  );
}

/** Anchor id for a rarity tier block (e.g. `rarity-sec`). */
export function rarityAnchorId(code: string): string {
  return `rarity-${code.toLowerCase()}`;
}

/** Statement-form replacement for the old question-shaped h2 (now an FAQ entry). */
export function guideRarityBoxHeading(lang: Language): string {
  return pick(lang, tri("สิ่งที่ได้จากการ์ดวันพีช 1 กล่อง", "What one booster box contains"));
}

/** Statement-form replacement for the old question-shaped h2 (now an FAQ entry). */
export function guideRarityFactorsHeading(lang: Language): string {
  return pick(lang, tri("ปัจจัยที่ทำให้ราคาการ์ดวันพีชแพง", "What makes a card expensive"));
}

export function guideRarityFaq(lang: Language): GuideFaqItem[] {
  return [
    {
      question: pick(lang, tri("SEC คืออะไร?", "What does SEC mean?")),
      answer: pick(
        lang,
        tri(
          "SEC ย่อมาจาก Secret Rare เป็นระดับความหายากที่อยู่เหนือ SR (Super Rare) ขึ้นไป ใช้งานศิลป์ระดับพรีเมียมและพิมพ์ออกมาน้อยมาก โอกาสเจอโดยเฉลี่ยประมาณ 1 ใบต่อ 3 กล่อง ทำให้ราคาซื้อขายสูงกว่าการ์ดทั่วไปในชุดเดียวกันหลายเท่า และเป็นระดับที่นักสะสมตามหามากที่สุดรองจาก SP และ TR",
          "SEC stands for Secret Rare, a tier above SR (Super Rare). These use premium artwork and are printed in very small numbers — roughly one per three boxes on average — so they trade for many times the price of ordinary cards from the same set."
        )
      ),
    },
    {
      question: pick(lang, tri("Parallel คืออะไร ต่างจากการ์ดปกติยังไง?", "What is a Parallel card?")),
      answer: pick(
        lang,
        tri(
          "Parallel คือการ์ดใบเดิม ความสามารถเหมือนเดิมทุกอย่าง แต่เปลี่ยนงานศิลป์หรือลายฟอยล์ให้ต่างจากเวอร์ชันปกติ มีได้ทุกระดับความหายากตั้งแต่ P-C ถึง P-SEC และ P-L เนื่องจากพิมพ์น้อยกว่าเวอร์ชันปกติมาก ราคาจึงสูงกว่าเสมอ — การ์ดใบเดียวกันเวอร์ชันปกติกับเวอร์ชัน Parallel ราคาห่างกันได้หลายเท่า ตอนซื้อขายจึงต้องดูให้ชัดว่าเป็นเวอร์ชันไหน",
          "A Parallel is the same card with the same abilities but different artwork or foiling. Parallels exist at every rarity, from P-C up to P-SEC and P-L. Because they are printed far less often than the standard version, they always trade higher — often several times higher — so always confirm which version you are buying."
        )
      ),
    },
    {
      question: pick(lang, tri("ซื้อการ์ดวันพีช 1 กล่อง ได้อะไรบ้าง?", "What do you get in one box?")),
      answer: pick(
        lang,
        tri(
          "ทุกกล่องรับประกันการ์ดระดับ SR, R และ Leader จำนวนหนึ่งเสมอ ส่วนการ์ดระดับสูงกว่านั้นเป็นเรื่องของโอกาส กล่องหนึ่งจะออกมาในรูปแบบใดรูปแบบหนึ่งจากสามแบบ คือได้ SEC, ได้ Parallel ระดับสูง หรือได้ Parallel ระดับรองลงมา ไม่ใช่ทุกกล่องที่จะมี SEC และ SP กับ TR ยิ่งหายากกว่านั้นมาก ถ้าอยากประเมินโอกาสของชุดที่สนใจ ใช้เครื่องคำนวณอัตราออกของ Meecard ได้",
          "Every box guarantees a set number of SR, R and Leader cards. Anything above that is chance: a box resolves into one of three patterns — a SEC, a higher-tier Parallel, or a lower-tier Parallel. Not every box contains a SEC, and SP/TR are rarer still. Use Meecard's drop calculator to estimate the odds for a specific set."
        )
      ),
    },
    {
      question: pick(
        lang,
        tri("อะไรทำให้ราคาการ์ดวันพีชแพง?", "What makes a One Piece card expensive?")
      ),
      answer: pick(
        lang,
        tri(
          "ราคาการ์ดไม่ได้ขึ้นกับความหายากอย่างเดียว ปัจจัยหลักคือ ระดับความหายาก ความนิยมของตัวละคร ความแรงในเมตาการแข่งขัน ความสวยของงานศิลป์ ปริมาณที่พิมพ์ออกมา และการที่ชุดนั้นเลิกพิมพ์ไปแล้วหรือยัง การ์ดที่ครบทุกข้อ เช่น SEC ของตัวละครดังที่ใช้ในเด็คสายแข่ง มักเป็นใบที่แพงที่สุดของชุด",
          "Rarity alone does not set the price. The main drivers are rarity tier, character popularity, competitive relevance, artwork, print run, and whether the set is out of print. Cards that tick every box — a Secret Rare of a popular character that is also competitively played — are typically the most expensive in a set."
        )
      ),
    },
    {
      question: pick(lang, tri("TR (Treasure Rare) คืออะไร?", "What is a Treasure Rare (TR)?")),
      answer: pick(
        lang,
        tri(
          "TR หรือ Treasure Rare คือระดับที่หายากที่สุดในเกม เริ่มมีตั้งแต่ชุด OP05 เป็นต้นมา และไม่ได้มีในทุกชุด เพราะจำนวนน้อยมากและเป็นที่ต้องการสูงสุดของนักสะสม ราคาซื้อขายจึงอยู่คนละระดับกับความหายากอื่นทั้งหมด",
          "Treasure Rare (TR) is the rarest tier in the game. It was introduced with set OP05 and does not appear in every set. Because the print run is tiny and collector demand is extreme, TR prices sit in a completely different bracket from every other rarity."
        )
      ),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  /guide/colors                                                       */
/* ------------------------------------------------------------------ */

export function guideColorH1(lang: Language): string {
  return pick(
    lang,
    tri(
      "สีในวันพีชการ์ดเกม (OPCG Colors) — 6 สี และการสร้างเด็ค",
      "Colors in the One Piece Card Game — all six and how to build around them"
    )
  );
}

/** Anchor id for a color section (e.g. `color-red`). */
export function colorAnchorId(name: string): string {
  return `color-${name.toLowerCase()}`;
}

/* ------------------------------------------------------------------ */
/*  /guide/card-types                                                   */
/* ------------------------------------------------------------------ */

export function guideTypeH1(lang: Language): string {
  return pick(
    lang,
    tri(
      "ประเภทการ์ดวันพีช (Card Types) — Leader, Character, Event, Stage, DON!!",
      "One Piece Card Game card types — Leader, Character, Event, Stage, DON!!"
    )
  );
}

export function guideTypeKeywordsHeading(lang: Language): string {
  return pick(
    lang,
    tri("คลังคีย์เวิร์ดการ์ดวันพีช (Keywords)", "One Piece Card Game keyword glossary")
  );
}

export function guideTypeKeywordsIntro(lang: Language): string {
  return pick(
    lang,
    tri(
      "คีย์เวิร์ดคือคำในวงเล็บเหลี่ยมบนข้อความการ์ด เช่น [Blocker] หรือ [Rush] แต่ละคำมีความหมายตายตัวตามกฎ ถ้าอ่านคีย์เวิร์ดออก จะอ่านการ์ดใหม่ได้เองโดยไม่ต้องเปิดกฎทุกครั้ง ด้านล่างคือคีย์เวิร์ดที่เจอบ่อยที่สุดพร้อมคำอธิบายภาษาไทย กดที่หัวข้อเพื่อคัดลอกลิงก์ตรงไปยังคีย์เวิร์ดนั้นได้",
      "Keywords are the terms in square brackets on a card's text box, like [Blocker] or [Rush]. Each has a fixed rules meaning — learn them once and you can read any new card without opening the rulebook. Below are the ones you will meet most often."
    )
  );
}

export interface KeywordEntry {
  keyword: string;
  anchor: string;
  color: string;
  body: string[];
}

export function guideTypeKeywordGlossary(lang: Language): KeywordEntry[] {
  const entries: Array<{
    keyword: string;
    anchor: string;
    color: string;
    body: { TH: string[]; EN: string[] };
  }> = [
    {
      keyword: "[Blocker]",
      anchor: "kw-blocker",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      body: {
        TH: [
          "เมื่อฝ่ายตรงข้ามประกาศโจมตี คุณสามารถ rest การ์ด Character ที่มี [Blocker] เพื่อดึงการโจมตีนั้นมาที่ตัวมันเองแทน",
          "ใช้ได้เฉพาะการ์ดที่ยังอยู่ในสถานะ active เท่านั้น และดึงได้หนึ่งครั้งต่อการโจมตีหนึ่งครั้ง",
          "เป็นคีย์เวิร์ดป้องกันที่สำคัญที่สุดเมื่อ Life เหลือน้อย เพราะยอมเสีย Character หนึ่งใบแลกกับการรักษา Life ไว้",
        ],
        EN: [
          "When your opponent declares an attack, you may rest a Character with [Blocker] to redirect that attack onto it instead.",
          "Only an active card can do this, and it redirects one attack.",
          "It is the key defensive keyword when your Life is low — you trade a Character to protect your remaining Life.",
        ],
      },
    },
    {
      keyword: "[Rush]",
      anchor: "kw-rush",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      body: {
        TH: [
          "ปกติ Character ที่เพิ่งลงสนามในเทิร์นนั้นจะโจมตีไม่ได้ ต้องรอถึงเทิร์นถัดไป",
          "[Rush] ยกเลิกข้อจำกัดนี้ ทำให้การ์ดใบนั้นโจมตีได้ทันทีในเทิร์นที่ลง",
          "เป็นคีย์เวิร์ดที่ทำให้เกิดเกมจบเร็ว เพราะฝ่ายตรงข้ามคำนวณความเสียหายล่วงหน้าได้ยาก",
        ],
        EN: [
          "Normally a Character cannot attack on the turn it is played.",
          "[Rush] removes that restriction — the card can attack the moment it hits the field.",
          "It enables sudden lethal turns, because the opponent cannot plan around damage that was not on the board.",
        ],
      },
    },
    {
      keyword: "[Double Attack]",
      anchor: "kw-double-attack",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      body: {
        TH: [
          "เมื่อการ์ดที่มี [Double Attack] โจมตี Leader สำเร็จ ฝ่ายตรงข้ามจะเสีย Life 2 ใบแทนที่จะเป็น 1 ใบ",
          "เท่ากับย่นจำนวนเทิร์นที่ต้องใช้ปิดเกมลงครึ่งหนึ่ง จึงมักอยู่บนการ์ดคอสต์สูง",
          "แต่ก็ทำให้ฝ่ายตรงข้ามได้เปิดการ์ด Life เพิ่ม ซึ่งอาจเจอ [Trigger] สวนกลับได้",
        ],
        EN: [
          "When a card with [Double Attack] successfully hits the Leader, the opponent loses 2 Life instead of 1.",
          "That roughly halves the number of turns needed to close a game, so it usually sits on high-cost cards.",
          "The downside: your opponent reveals more Life cards, and any of them could be a [Trigger].",
        ],
      },
    },
    {
      keyword: "[Banish]",
      anchor: "kw-banish",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      body: {
        TH: [
          "เมื่อการ์ดที่มี [Banish] โจมตี Leader สำเร็จ การ์ด Life ที่เสียไปจะถูกส่งเข้ากอง Trash ทันที ไม่เข้ามือผู้เล่น",
          "ผลคือฝ่ายตรงข้ามไม่ได้การ์ดใบนั้นไปใช้ต่อ และไม่มีโอกาสใช้ [Trigger] จากใบนั้นด้วย",
          "เป็นคีย์เวิร์ดที่แรงมากในเกมสายบุกเร็ว เพราะตัดทั้งทรัพยากรและโอกาสสวนกลับพร้อมกัน",
        ],
        EN: [
          "When a card with [Banish] successfully hits the Leader, the Life card lost goes straight to the trash instead of the opponent's hand.",
          "They gain no card from it, and they cannot use that card's [Trigger].",
          "It is extremely strong in aggressive decks: it removes a resource and a comeback option at the same time.",
        ],
      },
    },
    {
      keyword: "[Counter]",
      anchor: "kw-counter",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      body: {
        TH: [
          "ตัวเลข Counter ที่มุมซ้ายของการ์ด (เช่น 1000 หรือ 2000) คือพลังที่เพิ่มให้ตัวที่กำลังถูกโจมตี เมื่อคุณทิ้งการ์ดใบนั้นจากมือในช่วง Counter Step",
          "ส่วนคีย์เวิร์ด [Counter] บนการ์ด Event หมายถึงเล่นการ์ดใบนั้นได้ในช่วง Counter Step ระหว่างที่ถูกโจมตี",
          "การเล่นเก่งส่วนใหญ่คือการรู้ว่าจะเก็บการ์ด Counter ไว้กี่ใบ เพราะการ์ดในมือหนึ่งใบคือทั้งการ์ดที่เล่นได้และเกราะป้องกันในเวลาเดียวกัน",
        ],
        EN: [
          "The Counter number in a card's left margin (1000, 2000…) is the Power you add to the card being attacked when you discard it from hand during the Counter Step.",
          "The [Counter] keyword on an Event card means that card can be played during the Counter Step while you are being attacked.",
          "Most skill in this game is knowing how many Counter cards to hold — a card in hand is both a play and a shield.",
        ],
      },
    },
    {
      keyword: "[Trigger]",
      anchor: "kw-trigger",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      body: {
        TH: [
          "[Trigger] คือข้อความที่ทำงานได้เฉพาะตอนการ์ดใบนั้นถูกเปิดจากกอง Life เพราะโดนโจมตี",
          "ผู้เล่นเลือกได้ว่าจะใช้หรือไม่ใช้ ถ้าไม่ใช้ก็เก็บการ์ดเข้ามือตามปกติ",
          "การ์ดที่มี [Trigger] จึงเป็นตัวพลิกเกมของฝ่ายที่กำลังเสียเปรียบ และเป็นเหตุผลที่ [Banish] ถือว่าแรง",
        ],
        EN: [
          "[Trigger] text only works when the card is revealed from your Life because you were attacked.",
          "Using it is optional — decline and the card simply goes to your hand.",
          "Triggers are the comeback mechanic for the player who is behind, which is exactly why [Banish] is so strong.",
        ],
      },
    },
    {
      keyword: "[On Play]",
      anchor: "kw-on-play",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      body: {
        TH: [
          "ทำงานทันทีเมื่อการ์ดใบนั้นถูกเล่นลงสนาม เป็นเอฟเฟกต์ที่ได้แน่นอนโดยไม่ต้องรอเทิร์นถัดไป",
          "การ์ดหลายใบจึงคุ้มค่าแม้จะโดนกำจัดทันที เพราะได้ผลจาก [On Play] ไปแล้ว",
          "มักใช้กับการ์ดที่จั่วการ์ด ค้นหาการ์ด หรือกำจัดการ์ดฝ่ายตรงข้าม",
        ],
        EN: [
          "Resolves the moment the card is played to the field — a guaranteed effect that does not wait for your next turn.",
          "This is why many such cards are worth playing even if they are removed immediately: you already got the value.",
          "Common on cards that draw, search or remove.",
        ],
      },
    },
    {
      keyword: "[Activate: Main]",
      anchor: "kw-activate-main",
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      body: {
        TH: [
          "เอฟเฟกต์ที่คุณสั่งใช้เองได้ในช่วง Main Phase ของเทิร์นตัวเอง",
          "ต่างจาก [On Play] ตรงที่ไม่ได้ทำงานอัตโนมัติ — คุณเลือกจังหวะใช้เอง และมักมีเงื่อนไขต้นทุนกำกับ",
          "มักเจอบนการ์ด Leader และการ์ด Stage ที่อยู่ในสนามยาว",
        ],
        EN: [
          "An effect you activate yourself during your own Main Phase.",
          "Unlike [On Play] it is not automatic — you choose the timing, usually by paying a cost.",
          "Frequently found on Leaders and on Stage cards that stay on the field.",
        ],
      },
    },
    {
      keyword: "[When Attacking]",
      anchor: "kw-when-attacking",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      body: {
        TH: [
          "ทำงานเมื่อการ์ดใบนั้นประกาศโจมตี ไม่ว่าการโจมตีจะสำเร็จหรือถูกบล็อกก็ตาม",
          "ทำให้การโจมตีมีมูลค่าเพิ่มเสมอ แม้ฝ่ายตรงข้ามจะบล็อกไว้ได้",
          "มักอยู่บน Leader เพราะ Leader โจมตีได้แทบทุกเทิร์น",
        ],
        EN: [
          "Resolves when the card declares an attack, whether or not that attack connects.",
          "It means attacking always yields something, even into a blocker.",
          "Common on Leaders, since a Leader can attack almost every turn.",
        ],
      },
    },
    {
      keyword: "[On K.O.]",
      anchor: "kw-on-ko",
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      body: {
        TH: [
          "ทำงานเมื่อการ์ดใบนั้นถูก K.O. (ถูกทำลายและส่งเข้า Trash)",
          "ทำให้การ์ดใบนั้น “แลกไม่ขาดทุน” เพราะฝ่ายตรงข้ามต้องจ่ายทรัพยากรกำจัดแล้วยังโดนผลตอบกลับ",
          "เป็นคีย์เวิร์ดที่ทำให้ฝ่ายตรงข้ามลังเลว่าจะกำจัดหรือปล่อยไว้",
        ],
        EN: [
          "Resolves when the card is K.O.'d (destroyed and sent to the trash).",
          "It makes the card a fair trade at worst: the opponent spends removal and still eats an effect.",
          "A classic way to make removal decisions awkward for your opponent.",
        ],
      },
    },
    {
      keyword: "[DON!! ×N]",
      anchor: "kw-don-x",
      color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      body: {
        TH: [
          "เงื่อนไขที่บอกว่าเอฟเฟกต์บรรทัดนั้นจะทำงานก็ต่อเมื่อมี DON!! แนบอยู่กับการ์ดใบนั้นครบตามจำนวนที่ระบุ",
          "จึงเป็นการ์ดที่ “แรงขึ้นตามเทิร์น” เพราะยิ่งเล่นนานยิ่งมี DON!! ให้แนบมากขึ้น",
          "ต้องวางแผนว่าจะใช้ DON!! ไปจ่ายคอสต์ลงการ์ดใหม่ หรือเก็บไว้แนบเพื่อปลดเอฟเฟกต์",
        ],
        EN: [
          "A condition meaning the effect only works while the stated number of DON!! is attached to that card.",
          "These cards scale with the game: the longer it runs, the more DON!! you can commit.",
          "It forces a real decision each turn — spend DON!! on new cards, or attach them to unlock effects.",
        ],
      },
    },
    {
      keyword: "[Once Per Turn]",
      anchor: "kw-once-per-turn",
      color: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
      body: {
        TH: [
          "จำกัดให้เอฟเฟกต์บรรทัดนั้นใช้ได้ครั้งเดียวภายในหนึ่งเทิร์น",
          "ถ้ามีการ์ดชื่อเดียวกันหลายใบในสนาม แต่ละใบนับแยกกัน เพราะข้อจำกัดผูกกับตัวการ์ดใบนั้น",
          "มักกำกับอยู่กับเอฟเฟกต์ที่แรงพอจะทำซ้ำได้ไม่จำกัดหากไม่มีข้อจำกัดนี้",
        ],
        EN: [
          "Limits that line of text to one use per turn.",
          "If you control several copies of the same card, each one tracks its own use — the limit is per card.",
          "It appears on effects that would be abusive if they could be repeated freely.",
        ],
      },
    },
  ];

  return entries.map((e) => ({
    keyword: e.keyword,
    anchor: e.anchor,
    color: e.color,
    body: lang === "TH" ? e.body.TH : e.body.EN,
  }));
}

/* ------------------------------------------------------------------ */
/*  /guide/sets                                                         */
/* ------------------------------------------------------------------ */

export function guideSetH1(lang: Language): string {
  return pick(
    lang,
    tri(
      "ชุดการ์ดวันพีชมีกี่แบบ? Booster, Starter, EB ต่างกันยังไง",
      "How many One Piece Card Game set types are there?"
    )
  );
}

export function guideSetLead(lang: Language): string {
  return pick(
    lang,
    tri(
      "ชุดการ์ดวันพีซแบ่งเป็น 3 แบบหลัก คือ Booster Pack, Starter Deck และ Extra Booster แต่ละชุดมีรหัสของตัวเอง (เช่น OP09, ST01, EB01) ใช้ค้นหาราคาการ์ดทุกใบในชุดนั้นได้ทันที",
      "One Piece Card Game sets come in three main types: Booster Packs, Starter Decks and Extra Boosters. Each set carries its own code (OP09, ST01, EB01…) you can use to look up every card's price instantly."
    )
  );
}

export function guideSetLatestHeading(lang: Language): string {
  return pick(lang, tri("ชุดล่าสุด", "Latest sets"));
}

export function guideSetLatestIntro(lang: Language): string {
  return pick(
    lang,
    tri(
      "ชุดที่วางขายล่าสุดตามข้อมูลในระบบของเรา ราคาของชุดใหม่มักผันผวนในช่วงสองถึงสามสัปดาห์แรกก่อนจะเริ่มนิ่ง กดเข้าไปดูราคาการ์ดทุกใบในชุดได้",
      "The most recently released sets in our database. New-set prices usually swing for the first two to three weeks before settling. Open a set to see every card's price."
    )
  );
}

export function guideSetReleaseLabel(lang: Language): string {
  return pick(lang, tri("วางขาย", "Released"));
}

export function guideSetListHeading(lang: Language): string {
  return pick(lang, tri("ชุดการ์ดที่คนดูมากที่สุด", "Most-viewed sets"));
}

export function guideSetListIntro(lang: Language, data: { shown: number; total: number }): string {
  return pick(
    lang,
    tri(
      `ด้านล่างคือชุดล่าสุด ${data.shown} ชุดที่คนเช็คราคาบ่อยที่สุด จากทั้งหมด ${data.total} ชุดที่ Meecard เก็บข้อมูลอยู่ ถ้าหาชุดเก่ากว่านี้ ให้ไปที่หน้ารวมชุดการ์ดซึ่งมีครบทุกชุดพร้อมตัวกรอง`,
      `Below are the ${data.shown} most recent sets, out of ${data.total} tracked on Meecard. For older sets, use the full set index with filters.`
    )
  );
}

export function guideSetSeeAll(lang: Language, data: { total: number }): string {
  return pick(
    lang,
    tri(`ดูชุดการ์ดทั้งหมด ${data.total} ชุด`, `See all ${data.total} sets`)
  );
}

/* ------------------------------------------------------------------ */
/*  /guide/buying                                                       */
/* ------------------------------------------------------------------ */

export function guideBuyH1(lang: Language): string {
  return pick(
    lang,
    tri(
      "ซื้อการ์ดวันพีชที่ไหนดี? แหล่งซื้อ + วิธีเช็คราคาก่อนซื้อ",
      "Where to buy One Piece cards — channels and how to check prices first"
    )
  );
}

export function guideBuyLead(lang: Language): string {
  return pick(
    lang,
    tri(
      "เทียบช่องทางซื้อการ์ดวันพีชในไทยและการสั่งจากญี่ปุ่น พร้อมวิธีเช็คราคากลางก่อนจ่ายเงิน การดูสภาพการ์ด และคำถามคลาสสิกว่าซื้อกล่องหรือซื้อแยกใบคุ้มกว่ากัน",
      "Compare the ways to buy One Piece cards in Thailand and from Japan, how to check the reference price before you pay, how to judge condition, and whether boxes or singles are better value."
    )
  );
}

export function guideBuyIntroParagraphs(lang: Language): string[] {
  return pickList(lang, {
    TH: [
      "คำถามแรกของคนที่เพิ่งเริ่มเล่นการ์ดวันพีชแทบทุกคนคือ “ซื้อที่ไหนดี” คำตอบขึ้นอยู่กับว่าคุณต้องการอะไร — ถ้าต้องการเริ่มเล่นเร็วที่สุด ซื้อ Starter Deck จากร้านในไทยจบในวันเดียว แต่ถ้าต้องการการ์ดเฉพาะใบในราคาที่ดีที่สุด ช่องทางที่ถูกที่สุดมักเป็นตลาดญี่ปุ่นซึ่งต้องแลกกับเวลารอและค่าส่ง",
      "สิ่งที่ทำให้ผู้ซื้อมือใหม่เสียเงินเกินจำเป็นไม่ใช่การเลือกช่องทางผิด แต่คือการไม่รู้ราคากลางก่อนกดซื้อ การ์ดใบเดียวกันในไทยอาจตั้งราคาต่างกันหลายเท่าในสัปดาห์เดียวกัน และเวอร์ชัน Parallel กับเวอร์ชันปกติที่หน้าตาคล้ายกันก็ราคาต่างกันมาก หน้านี้จึงเรียงลำดับจากช่องทางซื้อ ไปจนถึงวิธีตรวจราคาและสภาพการ์ดก่อนจ่ายจริง",
    ],
    EN: [
      "The first question every new player asks is where to buy. It depends on what you want: to start playing today, a Starter Deck from a local shop is the fastest route; to get one specific card at the best price, the Japanese market is usually cheapest — at the cost of shipping time and fees.",
      "What actually costs beginners money is not picking the wrong channel, it is not knowing the reference price first. The same card can be listed at wildly different prices in the same week, and a Parallel version looks similar to the standard one but trades far higher. This page goes from channels, to price checking, to judging condition before you pay.",
    ],
  });
}

export function guideBuyChannelsHeading(lang: Language): string {
  return pick(lang, tri("ช่องทางซื้อการ์ดวันพีชในไทย", "Where to buy in Thailand"));
}

export interface BuyChannel {
  id: string;
  name: string;
  type: string;
  body: string;
  pros: string;
  cons: string;
}

export function guideBuyChannels(lang: Language): BuyChannel[] {
  const raw: Array<{ id: string; name: Tri; type: Tri; body: Tri; pros: Tri; cons: Tri }> = [
    {
      id: "ecommerce-th",
      name: tri("แพลตฟอร์มอีคอมเมิร์ซ (Shopee / Lazada)", "Thai e-commerce (Shopee / Lazada)"),
      type: tri("ออนไลน์ในไทย", "Online, domestic"),
      body: tri(
        "ช่องทางที่คนไทยใช้มากที่สุด เพราะค้นหาด้วยรหัสการ์ด (เช่น OP09-001) ได้ตรงๆ จ่ายเงินผ่านระบบกลาง และมีระบบคืนเงินถ้าของไม่ตรงปก ข้อควรระวังคือราคาตั้งได้อิสระ ผู้ขายคนละรายอาจตั้งราคาต่างกันหลายเท่าสำหรับการ์ดใบเดียวกัน และคำอธิบายมักไม่ระบุว่าเป็นเวอร์ชันปกติหรือ Parallel ให้เทียบรหัสการ์ดกับราคากลางก่อนเสมอ",
        "The most-used channel in Thailand: you can search by card code (OP09-001), pay through the platform, and claim a refund if the item is not as described. The catch is that sellers price freely — the same card can differ several times over — and listings often omit whether it is the standard or Parallel version. Always match the card code against a reference price first."
      ),
      pros: tri("ค้นด้วยรหัสการ์ดได้ มีระบบคืนเงิน ส่งในประเทศเร็ว", "Searchable by card code, buyer protection, fast domestic shipping"),
      cons: tri("ราคาต่างกันมากตามผู้ขาย คำอธิบายเวอร์ชันการ์ดมักไม่ครบ", "Prices vary a lot by seller; version details often missing"),
    },
    {
      id: "facebook",
      name: tri("กลุ่มซื้อขายบน Facebook", "Facebook buy/sell groups"),
      type: tri("ชุมชนผู้เล่น (C2C)", "Player community (C2C)"),
      body: tri(
        "กลุ่มซื้อขายในชุมชนผู้เล่นมักได้ราคาดีกว่าหน้าร้าน เพราะเป็นการขายต่อระหว่างผู้เล่นด้วยกัน และเจรจาได้ ข้อเสียคือไม่มีตัวกลางถือเงิน ความเสี่ยงจึงอยู่ที่ตัวผู้ซื้อเอง ควรดูประวัติการซื้อขายของผู้ขาย ขอรูปการ์ดใบจริงทั้งหน้าและหลัง และหลีกเลี่ยงการโอนก่อนสำหรับการ์ดราคาสูงถ้าไม่มีคนกลาง",
        "Player-to-player groups usually beat retail prices and allow negotiation, but there is no escrow — the risk sits with you. Check the seller's trade history, ask for real front-and-back photos, and avoid paying upfront for expensive cards without a trusted middleman."
      ),
      pros: tri("ราคามักดีกว่าหน้าร้าน ต่อรองได้ เจอการ์ดหายากที่ร้านไม่มี", "Often cheaper than retail, negotiable, rare cards shops do not stock"),
      cons: tri("ไม่มีตัวกลางถือเงิน ต้องตรวจสอบผู้ขายเอง", "No escrow — you must vet the seller yourself"),
    },
    {
      id: "local-shop",
      name: tri("ร้านการ์ดหน้าร้าน / งานตลาดนัดการ์ด", "Local card shops & card fairs"),
      type: tri("หน้าร้านในไทย", "Physical, domestic"),
      body: tri(
        "ข้อได้เปรียบเดียวที่ช่องทางอื่นให้ไม่ได้คือ ได้เห็นและจับการ์ดใบจริงก่อนจ่ายเงิน ตรวจมุม ขอบ และผิวการ์ดได้ทันที เหมาะมากกับการซื้อการ์ดราคาสูงหรือการ์ดที่สภาพมีผลต่อราคา นอกจากนี้ร้านหลายแห่งยังเป็นสถานที่จัดการแข่งขัน ทำให้ได้ทั้งการ์ดและคนเล่นด้วย ราคามักสูงกว่าตลาดญี่ปุ่นเพราะรวมค่านำเข้าและค่าดำเนินการไว้แล้ว",
        "The one advantage no online channel can match: you see and handle the card before paying — corners, edges and surface. That matters most for expensive cards where condition drives price. Many shops also host tournaments, so you get cards and opponents in one place. Prices sit above the Japanese market because import and handling costs are baked in."
      ),
      pros: tri("เห็นสภาพการ์ดจริงก่อนซื้อ ได้ของทันที มีชุมชนผู้เล่น", "Inspect condition in person, take it home today, local play community"),
      cons: tri("ราคามักสูงกว่าตลาดญี่ปุ่น สต็อกจำกัดตามหน้าร้าน", "Higher than the Japanese market, stock limited to what is on the shelf"),
    },
    {
      id: "japan-online",
      name: tri("ร้านการ์ดออนไลน์ญี่ปุ่น", "Japanese online card shops"),
      type: tri("ออนไลน์ (ญี่ปุ่น)", "Online, Japan"),
      body: tri(
        "ญี่ปุ่นเป็นตลาดหลักของเกมนี้ ราคาจึงเป็นกลางที่สุดและสต็อกลึกที่สุด Meecard ใช้ราคาจากตลาดญี่ปุ่นเป็นราคาอ้างอิงหลักด้วยเหตุผลนี้ ข้อจำกัดคือร้านส่วนใหญ่ไม่ส่งตรงมาไทย ต้องใช้บริการตัวแทนสั่งซื้อและฝากส่ง (proxy / forwarder) ซึ่งมีค่าบริการและค่าขนส่งเพิ่ม",
        "Japan is the primary market: prices are the most neutral and stock is the deepest, which is why Meecard uses Japanese market prices as its reference. The limitation is that most shops do not ship directly to Thailand, so you need a proxy or forwarding service, with their fees on top."
      ),
      pros: tri("ราคาเป็นกลาง สต็อกลึก ระบุสภาพการ์ดชัดเจน", "Neutral pricing, deep stock, clearly stated condition"),
      cons: tri("ต้องผ่าน proxy/forwarder มีค่าบริการและรอนาน", "Requires a proxy/forwarder, extra fees and waiting time"),
    },
  ];

  return raw.map((c) => ({
    id: c.id,
    name: pick(lang, c.name),
    type: pick(lang, c.type),
    body: pick(lang, c.body),
    pros: pick(lang, c.pros),
    cons: pick(lang, c.cons),
  }));
}

export function guideBuyJapanHeading(lang: Language): string {
  return pick(lang, tri("สั่งการ์ดจากญี่ปุ่น — proxy ค่าส่ง และภาษี", "Importing from Japan — proxies, shipping and tax"));
}

export function guideBuyJapanParagraphs(lang: Language): string[] {
  return pickList(lang, {
    TH: [
      "ร้านการ์ดญี่ปุ่นส่วนใหญ่ขายให้เฉพาะที่อยู่ในประเทศ วิธีสั่งจึงต้องผ่านตัวกลางสองแบบ แบบแรกคือ proxy หรือตัวแทนสั่งซื้อ ซึ่งจะซื้อของแทนคุณแล้วคิดค่าบริการเป็นเปอร์เซ็นต์หรือค่าธรรมเนียมต่อออเดอร์ แบบที่สองคือ forwarder ซึ่งให้ที่อยู่ในญี่ปุ่นสำหรับรับของ แล้วรวมพัสดุส่งต่อมาไทย เหมาะกับคนที่สั่งจากหลายร้านพร้อมกันเพราะรวมกล่องได้",
      "ต้นทุนจริงของการสั่งจากญี่ปุ่นไม่ได้มีแค่ราคาการ์ด ให้บวกสามก้อนเสมอ: ค่าส่งภายในญี่ปุ่นจากร้านถึงคลังตัวกลาง ค่าบริการของ proxy หรือ forwarder และค่าส่งระหว่างประเทศซึ่งคิดตามน้ำหนักและวิธีส่ง การ์ดมีน้ำหนักน้อยมาก ค่าส่งระหว่างประเทศจึงมักถูกลงต่อใบเมื่อสั่งครั้งละหลายใบ นี่คือเหตุผลที่คนนิยมรวมออเดอร์",
      "เรื่องภาษีนำเข้าเป็นสิ่งที่ต้องเผื่อไว้เสมอ พัสดุที่เข้าประเทศไทยอาจถูกประเมินภาษีนำเข้าและภาษีมูลค่าเพิ่มตามระเบียบศุลกากร ซึ่งอัตราและเกณฑ์ยกเว้นเปลี่ยนแปลงได้ ให้ตรวจสอบอัตราล่าสุดจากประกาศของกรมศุลกากรก่อนสั่งของล็อตใหญ่ อย่าคำนวณความคุ้มค่าจากราคาการ์ดอย่างเดียว",
      "วิธีตัดสินใจที่ง่ายที่สุด: เอาราคากลางที่เห็นบน Meecard เป็นฐาน บวกค่าส่งและค่าบริการทั้งหมดหารตามจำนวนใบ แล้วเทียบกับราคาที่ผู้ขายในไทยเสนอ ถ้าส่วนต่างน้อยกว่าค่าความเสี่ยงและเวลารอ ซื้อในไทยจบกว่า",
    ],
    EN: [
      "Most Japanese card shops only ship domestically, so you go through one of two intermediaries. A proxy buys on your behalf and charges a percentage or per-order fee. A forwarder gives you a Japanese address to receive parcels, then consolidates and reships them — better if you are ordering from several shops at once.",
      "The real cost is not just the card price. Add three layers: domestic shipping from shop to the intermediary's warehouse, the proxy or forwarder's service fee, and international shipping charged by weight and method. Cards weigh almost nothing, so international shipping gets cheaper per card the more you order — hence the habit of consolidating.",
      "Always budget for import tax. Parcels entering Thailand may be assessed import duty and VAT under customs rules, and the rates and de-minimis thresholds change. Check the Thai Customs Department's current announcements before placing a large order rather than assuming.",
      "The simplest way to decide: take the reference price on Meecard, add all shipping and service fees divided across the number of cards, then compare against local asking prices. If the gap is smaller than the risk and the wait, buy locally.",
    ],
  });
}

export function guideBuyCheckHeading(lang: Language): string {
  return pick(lang, tri("วิธีเช็คราคาการ์ดวันพีชก่อนซื้อด้วย Meecard", "How to check a price on Meecard before you buy"));
}

export function guideBuyCheckSteps(lang: Language): Array<{ title: string; body: string }> {
  const raw: Array<{ title: Tri; body: Tri }> = [
    {
      title: tri("1. ค้นด้วยรหัสการ์ด ไม่ใช่ชื่อตัวละคร", "1. Search by card code, not character name"),
      body: tri(
        "ตัวละครยอดนิยมมีการ์ดหลายสิบใบและหลายเวอร์ชัน การค้นด้วยชื่ออย่างเดียวจะเจอผลลัพธ์ที่ไม่ใช่ใบที่ผู้ขายกำลังขาย ให้ขอรหัสการ์ดจากผู้ขาย (เช่น OP09-001) แล้วค้นด้วยรหัสนั้น",
        "Popular characters have dozens of cards across versions, so searching by name alone will not land on the exact card being sold. Ask the seller for the card code (e.g. OP09-001) and search that."
      ),
    },
    {
      title: tri("2. ยืนยันว่าเป็นเวอร์ชันปกติหรือ Parallel", "2. Confirm standard vs Parallel"),
      body: tri(
        "การ์ดเวอร์ชันภาพพิเศษ (Parallel) ราคาสูงกว่าเวอร์ชันปกติเสมอ และสองใบนี้ใช้รหัสฐานเดียวกัน ให้ดูรูปการ์ดจริงเทียบกับรูปในหน้าการ์ด ถ้าผู้ขายบอกไม่ชัด ให้ถือว่าเป็นเวอร์ชันปกติไว้ก่อนแล้วตั้งราคาเทียบตามนั้น",
        "Alternate-art (Parallel) versions always trade higher than the standard print, and they share the same base code. Compare the seller's photo with the card page image. If the listing is vague, price it as the standard version."
      ),
    },
    {
      title: tri("3. ดูกราฟราคาย้อนหลัง ไม่ใช่ราคาวันเดียว", "3. Read the price history, not one day"),
      body: tri(
        "ราคาการ์ดขยับตามผลการแข่งขันและกระแสในชุมชน การดูกราฟย้อนหลังทำให้แยกออกว่าราคาที่เห็นวันนี้คือระดับปกติ หรือเป็นยอดชั่วคราวที่กำลังจะลง โดยเฉพาะการ์ดจากชุดที่เพิ่งวางขาย",
        "Prices move with tournament results and community hype. The history chart tells you whether today's number is the normal level or a temporary spike about to fade — especially for freshly released sets."
      ),
    },
    {
      title: tri("4. แยกราคา Raw กับราคาการ์ดที่ผ่านการเกรด", "4. Separate raw prices from graded prices"),
      body: tri(
        "ราคาการ์ดที่ยังไม่ผ่านการเกรด (Raw) กับการ์ดที่ผ่านการเกรดสภาพสูงสุดเป็นคนละราคากันมาก อย่าใช้ราคาการ์ดที่ผ่านการเกรดมาต่อรองซื้อการ์ดที่ยังอยู่ในซอง และในทางกลับกันด้วย",
        "Raw prices and top-grade slabbed prices are different markets. Do not use a graded price to justify a raw purchase, or the other way round."
      ),
    },
  ];
  return raw.map((s) => ({ title: pick(lang, s.title), body: pick(lang, s.body) }));
}

export function guideBuyConditionHeading(lang: Language): string {
  return pick(lang, tri("สภาพการ์ดและการเก็บรักษา", "Condition and storage"));
}

export function guideBuyConditionParagraphs(lang: Language): string[] {
  return pickList(lang, {
    TH: [
      "สภาพการ์ดมีผลกับราคาโดยตรง โดยเฉพาะการ์ดหายาก จุดที่ตรวจกันจริงมีสี่จุด คือ มุมการ์ดว่าขาวหรือทู่หรือไม่ ขอบการ์ดว่ามีรอยบิ่นหรือสีลอกไหม ผิวหน้าการ์ดว่ามีรอยขีดข่วนหรือรอยนิ้วมือเมื่อส่องกับแสงหรือเปล่า และการ์ดโก่งงอหรือไม่เมื่อวางราบ ควรขอรูปที่ถ่ายในแสงปกติทั้งหน้าและหลังก่อนตัดสินใจ",
      "การ์ดที่เพิ่งเปิดจากซองก็ไม่ได้แปลว่าสภาพสมบูรณ์เสมอไป การ์ดบางใบมีตำหนิจากโรงงานตั้งแต่แรก เช่น การตัดไม่ตรงกลางหรือรอยพิมพ์ ถ้าตั้งใจจะส่งเกรดในอนาคต ให้ตรวจตั้งแต่ตอนเปิดและใส่ซองทันที",
      "การเก็บรักษาที่ใช้กันเป็นมาตรฐานคือใส่ซองใส (sleeve) ทุกใบ การ์ดที่มีมูลค่าใส่ต่อในกรอบแข็ง (toploader) หรือกล่องแข็ง ส่วนการ์ดที่ใช้เล่นเก็บในแฟ้มหรือกล่องเด็ค เลี่ยงแสงแดดตรง ความชื้น และการวางกองซ้อนกดทับเป็นเวลานาน เพราะสามอย่างนี้ทำให้การ์ดสีซีดและโก่งถาวร",
      "ถ้าซื้อมาเพื่อสะสมระยะยาว ให้ถ่ายรูปการ์ดตอนได้รับไว้ด้วย มีประโยชน์ทั้งตอนเคลมกับผู้ขายและตอนขายต่อในอนาคต",
    ],
    EN: [
      "Condition drives price, especially on rare cards. Four things get checked: corners (whitening or blunting), edges (nicks or peeling), surface (scratches or fingerprints under light), and warping when laid flat. Ask for front and back photos in normal light before committing.",
      "Fresh from the pack does not automatically mean mint — factory flaws such as off-centre cuts or print lines exist from day one. If you plan to grade a card later, inspect it as you open it and sleeve it immediately.",
      "The standard storage routine: sleeve everything, then put valuable cards in a toploader or a rigid case, and keep playing cards in a binder or deck box. Avoid direct sunlight, humidity and long-term stacking pressure — all three cause permanent fading and warping.",
      "If you are buying to hold, photograph cards on arrival. It helps both with seller claims and when you resell.",
    ],
  });
}

export function guideBuyBoxHeading(lang: Language): string {
  return pick(lang, tri("ซื้อกล่องหรือซื้อแยกใบ ดีกว่ากัน?", "Boxes or singles — which is better value?"));
}

export function guideBuyBoxParagraphs(lang: Language): string[] {
  return pickList(lang, {
    TH: [
      "คำตอบขึ้นอยู่กับเป้าหมาย ไม่ใช่ราคา ถ้าคุณต้องการการ์ดเฉพาะใบ การซื้อแยกใบตามราคากลางเกือบจะถูกกว่าเสมอ เพราะการเปิดกล่องคือการจ่ายเงินซื้อโอกาส ไม่ใช่ซื้อการ์ดใบนั้น และไม่มีอะไรรับประกันว่าจะเจอใบที่ต้องการแม้เปิดหลายกล่อง",
      "การซื้อกล่องจะสมเหตุสมผลเมื่อเป้าหมายคือความสนุกจากการเปิด การได้การ์ดหลายใบเพื่อสร้างเด็คตั้งแต่ต้น หรือการเก็บกล่องที่ยังไม่แกะเป็นของสะสม ซึ่งเป็นคนละตลาดกับการ์ดแยกใบ",
      "ก่อนตัดสินใจ ลองคำนวณดูตรงๆ: เอาราคากล่องหารด้วยจำนวนการ์ดที่ได้ แล้วเทียบกับราคากลางของการ์ดที่คาดว่าจะได้จริง เครื่องคำนวณอัตราออกของ Meecard ช่วยประเมินโอกาสเจอการ์ดระดับต่างๆ ต่อกล่องได้ เพื่อให้เห็นตัวเลขก่อนจ่ายเงิน",
    ],
    EN: [
      "It depends on your goal, not on price. If you want one specific card, buying the single at market price is almost always cheaper — opening a box buys a chance, not the card, and nothing guarantees you will hit it even across several boxes.",
      "Boxes make sense when the goal is the opening experience, getting a broad card pool to build decks from, or holding sealed product as a collectible — a different market from singles.",
      "Before deciding, do the arithmetic: divide the box price by the number of cards you get, then compare against the reference prices of what you realistically expect to pull. Meecard's drop calculator estimates per-box odds so you can see the numbers first.",
    ],
  });
}

export function guideBuyCautionHeading(lang: Language): string {
  return pick(lang, tri("ข้อควรระวังก่อนโอนเงิน", "Before you pay"));
}

export function guideBuyCautionItems(lang: Language): string[] {
  return pickList(lang, {
    TH: [
      "ราคาที่ถูกกว่าตลาดผิดปกติมักมีเหตุผลเสมอ — อาจเป็นเวอร์ชันคนละใบ สภาพไม่ตรงปก หรือไม่ใช่ของแท้",
      "ขอรูปการ์ดใบจริงทั้งหน้าและหลังในแสงปกติ ไม่ใช่รูปจากอินเทอร์เน็ต",
      "เทียบรหัสการ์ด ชื่อ และความหายากกับข้อมูลของชุดนั้น ถ้าไม่ตรงให้หยุดไว้ก่อน",
      "ซื้อผ่านช่องทางที่มีระบบคืนเงิน หรือจากผู้ขายที่ตรวจสอบประวัติได้ โดยเฉพาะการ์ดราคาสูง",
      "เก็บหลักฐานการสนทนาและการโอนเงินไว้จนกว่าจะได้รับของและตรวจสอบเรียบร้อย",
    ],
    EN: [
      "A price far below market almost always has a reason — wrong version, undisclosed condition, or not genuine.",
      "Ask for real front and back photos in normal light, not stock images.",
      "Match the card code, name and rarity against the set data; stop if anything disagrees.",
      "Buy through channels with buyer protection, or from sellers with a verifiable history — especially for expensive cards.",
      "Keep the chat log and payment record until the card arrives and checks out.",
    ],
  });
}

export function guideBuyFaq(lang: Language): GuideFaqItem[] {
  return [
    {
      question: pick(lang, tri("ซื้อการ์ดวันพีชที่ไหนถูกที่สุด?", "Where is the cheapest place to buy?")),
      answer: pick(
        lang,
        tri(
          "ถ้านับเฉพาะราคาการ์ด ตลาดญี่ปุ่นมักถูกที่สุดเพราะเป็นตลาดหลักและสต็อกลึก แต่ต้องบวกค่าบริการตัวแทนสั่งซื้อ ค่าส่งระหว่างประเทศ และภาษีนำเข้าที่อาจเกิดขึ้น เมื่อรวมทุกอย่างแล้วการสั่งครั้งละใบเดียวมักไม่คุ้ม ส่วนการซื้อในไทยแพงกว่าเล็กน้อยแต่ได้ของเร็วและเคลมง่ายกว่า วิธีตัดสินคือเทียบราคากลางบน Meecard กับราคาที่ผู้ขายในไทยเสนอ แล้วดูว่าส่วนต่างคุ้มกับเวลารอหรือไม่",
          "On card price alone, the Japanese market is usually cheapest — it is the primary market with the deepest stock. But you must add proxy fees, international shipping and any import tax, which rarely pays off for a single card. Buying locally costs a little more but arrives fast and is easier to claim on. Compare the Meecard reference price against the local asking price and decide whether the gap justifies the wait."
        )
      ),
    },
    {
      question: pick(lang, tri("ซื้อกล่องคุ้มกว่าซื้อแยกใบไหม?", "Is a box better value than singles?")),
      answer: pick(
        lang,
        tri(
          "ถ้าเป้าหมายคือการ์ดใบใดใบหนึ่ง ซื้อแยกใบถูกกว่าเกือบเสมอ เพราะการเปิดกล่องคือการจ่ายเพื่อโอกาส ไม่ใช่จ่ายเพื่อการ์ดใบนั้น แต่ถ้าเป้าหมายคือได้การ์ดหลายใบไว้สร้างเด็ค หรือชอบความสนุกจากการเปิด การซื้อกล่องก็สมเหตุสมผล ลองใช้เครื่องคำนวณอัตราออกดูโอกาสต่อกล่องก่อนตัดสินใจ",
          "If you want a specific card, singles are almost always cheaper — a box buys a chance, not the card. If you want a broad pool to build decks from, or you enjoy opening product, a box is reasonable. Run the drop calculator for per-box odds before you decide."
        )
      ),
    },
    {
      question: pick(lang, tri("สั่งการ์ดจากญี่ปุ่นต้องเสียภาษีไหม?", "Do I pay tax importing from Japan?")),
      answer: pick(
        lang,
        tri(
          "พัสดุที่นำเข้ามาไทยอาจถูกประเมินภาษีนำเข้าและภาษีมูลค่าเพิ่มตามระเบียบศุลกากร โดยอัตราและเกณฑ์ยกเว้นเปลี่ยนแปลงได้เป็นระยะ จึงไม่ควรคำนวณความคุ้มค่าจากราคาการ์ดอย่างเดียว ให้ตรวจสอบอัตราล่าสุดจากประกาศของกรมศุลกากรก่อนสั่งของล็อตใหญ่ และเผื่อค่าใช้จ่ายส่วนนี้ไว้ในงบเสมอ",
          "Parcels imported into Thailand may be assessed import duty and VAT under customs rules, and both rates and thresholds change over time. Do not budget on card price alone — check the Thai Customs Department's current announcements before a large order and leave room for it."
        )
      ),
    },
    {
      question: pick(lang, tri("การ์ดวันพีชสภาพแบบไหนถึงเรียกว่าสวย?", "What counts as good condition?")),
      answer: pick(
        lang,
        tri(
          "ดูสี่จุด: มุมการ์ดไม่ขาวไม่ทู่ ขอบไม่บิ่นและสีไม่ลอก ผิวหน้าไม่มีรอยขีดข่วนหรือรอยนิ้วมือเมื่อส่องกับแสง และการ์ดไม่โก่งเมื่อวางราบ การ์ดที่เพิ่งแกะจากซองก็อาจมีตำหนิจากโรงงานได้ เช่น ตัดไม่ตรงกลาง ถ้าจะซื้อการ์ดราคาสูง ขอรูปทั้งหน้าและหลังในแสงปกติก่อนเสมอ",
          "Four checks: corners not whitened or blunted, edges free of nicks and peeling, surface free of scratches or fingerprints under light, and no warping when laid flat. Freshly opened cards can still have factory flaws such as off-centre cuts. For expensive cards, always ask for front and back photos in normal light."
        )
      ),
    },
    {
      question: pick(lang, tri("ราคาบน Meecard เอามาจากไหน?", "Where do Meecard's prices come from?")),
      answer: pick(
        lang,
        tri(
          "ราคากลางอ้างอิงจากตลาดญี่ปุ่น อัปเดตทุกวัน ใช้เป็นราคาต่อรองและเทียบข้อเสนอได้ ไม่ใช่ราคาขายของ Meecard เอง",
          "Reference prices come from the Japanese market, updated daily — for negotiating and comparing offers; Meecard is not the seller."
        )
      ),
      link: {
        href: "/about#methodology",
        label: pick(
          lang,
          tri("วิธีคิดราคากลางของ Meecard", "How Meecard prices work")
        ),
      },
    },
  ];
}

export function guideBuySources(lang: Language): Array<{ label: string; desc: string; url: string; internal?: boolean }> {
  return [
    {
      label: pick(lang, tri("กรมศุลกากร", "Thai Customs Department")),
      desc: pick(
        lang,
        tri("ตรวจอัตราภาษีนำเข้าและเกณฑ์ล่าสุดก่อนสั่งของจากต่างประเทศ", "Check current import duty rates and thresholds before ordering from abroad.")
      ),
      url: "https://www.customs.go.th/",
    },
    {
      label: pick(lang, tri("ราคาการ์ดวันพีชบน Meecard", "One Piece card prices on Meecard")),
      desc: pick(lang, tri("ราคากลางทุกใบ อัปเดตทุกวัน พร้อมกราฟย้อนหลัง", "Daily reference prices for every card, with history charts.")),
      url: "/",
      internal: true,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Shared labels                                                       */
/* ------------------------------------------------------------------ */

export function guideFaqHeading(lang: Language): string {
  return pick(lang, tri("คำถามที่พบบ่อย", "Frequently asked questions"));
}

/* ------------------------------------------------------------------ */
/*  /guide/buying — captions for the real-data figures                  */
/*                                                                      */
/*  The buying guide told readers to "compare versions before you pay"  */
/*  and to weigh "a box vs singles" without ever showing either. These  */
/*  label figures built from live catalogue rows (see                   */
/*  @/lib/guide/card-examples) — the numbers themselves are never       */
/*  written here, so this copy cannot go stale.                         */
/* ------------------------------------------------------------------ */

export function guideBuyVersionFigure(lang: Language): {
  eyebrow: string;
  caption: string;
  standardLabel: string;
  parallelLabel: string;
} {
  return {
    // Both columns share one Bandai card number, so the number is printed once
    // on the frame instead of under each card. That also keeps the raw `_p1`
    // suffix off the page — it is our scraper's key, never something a reader
    // should see (see @/lib/cards/card-code).
    standardLabel: pick(lang, tri("ใบธรรมดา", "Standard print")),
    parallelLabel: pick(lang, tri("ลายพิเศษ (พาราเลล)", "Alternate art (parallel)")),
    eyebrow: pick(lang, tri("การ์ดใบเดียวกัน คนละเวอร์ชัน", "Same card, different version")),
    caption: pick(
      lang,
      tri(
        "ชื่อเดียวกัน รูปคนละแบบ ราคาคนละโลก — ก่อนโอนเงินให้ดูรหัสท้ายใบให้ตรงกับที่คนขายบอก แล้วเทียบราคาของเวอร์ชันนั้นจริงๆ ไม่ใช่ราคาของชื่อการ์ด",
        "Same name, different art, wildly different price. Before you pay, match the code on the card to the one the seller quoted, then check the price of that exact version — not of the card's name.",
      ),
    ),
  };
}

export function guideBuyBoxFigure(lang: Language): {
  eyebrow: string;
  cardsLabel: string;
  packsLabel: string;
  topCardLabel: string;
  caption: string;
} {
  return {
    eyebrow: pick(lang, tri("ชุดบูสเตอร์ล่าสุดในระบบ", "Latest booster set in the catalogue")),
    cardsLabel: pick(lang, tri("การ์ดในชุด", "Cards in the set")),
    packsLabel: pick(lang, tri("ต่อ 1 กล่อง", "Per box")),
    topCardLabel: pick(lang, tri("ใบแพงสุดในชุด", "Priciest card in the set")),
    caption: pick(
      lang,
      tri(
        "ซื้อยกกล่องได้การ์ดจำนวนมากในครั้งเดียว แต่ใบที่อยากได้จริงๆ อาจไม่โผล่เลย ส่วนซื้อแยกใบจ่ายแพงกว่าต่อใบแต่ได้ของที่ต้องการแน่นอน — เอาราคากล่องหารจำนวนใบที่ได้ แล้วเทียบกับราคาแยกใบของใบที่อยากได้ ก่อนตัดสินใจ",
        "A box gets you a lot of cards at once, but the one you actually want may never appear. Singles cost more each and are certain. Divide the box price by the cards you get, compare against the single you want, then decide.",
      ),
    ),
  };
}
