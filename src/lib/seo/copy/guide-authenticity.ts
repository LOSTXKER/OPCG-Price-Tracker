import type { Language } from "@/lib/i18n";

/**
 * Copy for /guide/authenticity — "วิธีดูการ์ดวันพีซแท้หรือปลอม".
 *
 * FACTUAL DISCIPLINE (matters more here than anywhere else on the site):
 * Bandai publishes NO consumer-facing anti-counterfeit specification for the
 * One Piece Card Game — only general warnings telling buyers to use authorised
 * retailers. Everything below is what collectors and secondary-market operators
 * report, so every check is framed as raising or lowering suspicion, never as
 * proof. Claims that could not be corroborated across independent sources
 * (infrared tests, an "embossed stamp from OP-05 onward", a fixed direction for
 * card thickness) are deliberately absent.
 */

type Copy<T> = Record<Language, T>;

function pick<T>(lang: Language, copy: Copy<T>): T {
  return copy[lang] ?? copy.EN;
}

export const GUIDE_AUTHENTICITY_META = {
  title: "วิธีดูการ์ดวันพีซแท้หรือปลอม — เช็คก่อนโอนเงิน",
  description:
    "รวมจุดสังเกตการ์ดวันพีชปลอม ทั้งหลังการ์ด ฟอยล์ ความคมของงานพิมพ์ และการส่องไฟดูแกนดำ พร้อมแยกให้ชัดว่าปลอม proxy กับของแท้หายากต่างกันยังไง",
} as const;

export function guideAuthH1(lang: Language): string {
  return pick(lang, {
    TH: "วิธีดูการ์ดวันพีซแท้หรือปลอม",
    EN: "How to spot a fake One Piece card",
    JP: "ワンピースカードの真贋の見分け方",
  });
}

export function guideAuthLead(lang: Language): string {
  return pick(lang, {
    TH: "จุดสังเกตที่นักสะสมใช้จริง พร้อมบอกตรงๆ ว่าอันไหนเชื่อได้แค่ไหน",
    EN: "The checks collectors actually use — and how much each one is worth.",
    JP: "コレクターが実際に使う確認方法と、その信頼度。",
  });
}

export function guideAuthIntro(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "As One Piece Card Game prices have climbed, counterfeits of the expensive cards have become good enough that a quick glance is no longer enough.",
      "One thing to be clear about first: Bandai does not publish a public list of anti-counterfeit features for these cards. Its own advice is simply to buy from authorised sellers and verify products on the official site. So everything below is what collectors and secondary-market shops report — each check makes a card more or less suspicious, and none of them proves a card is genuine.",
      "If a deal is large enough that being wrong would hurt, treat these checks as a filter and pay for grading or buy from a seller who accepts returns.",
    ];
  }
  if (lang === "JP") {
    return [
      "ワンピースカードゲームの価格上昇にともない、高額カードの偽造品は一目では見抜けない水準になっています。",
      "前提として、バンダイはカードの偽造防止仕様を一般公開していません。公式の案内は「正規販売店で購入し、公式サイトで確認する」ことです。以下はコレクターや二次流通の事業者が報告している観察点であり、真贋を証明するものではありません。",
      "金額が大きい取引では、これらは絞り込みの手段と考え、鑑定に出すか返品可能な販売者から購入してください。",
    ];
  }
  return [
    "ยิ่งราคาการ์ดวันพีซขึ้น ของปลอมของใบแพงๆ ก็ยิ่งทำได้เนียนขึ้น จนดูผ่านๆ ไม่พออีกต่อไป",
    "ต้องพูดให้ชัดก่อนข้อหนึ่ง: Bandai ไม่ได้ประกาศรายการ \"ฟีเจอร์กันปลอม\" ของการ์ดต่อสาธารณะ คำแนะนำทางการของเขามีแค่ให้ซื้อจากร้านตัวแทนจำหน่ายและตรวจสอบสินค้าจากเว็บทางการ ดังนั้นทุกข้อด้านล่างคือสิ่งที่นักสะสมและร้านรับซื้อ-ขายรายงานตรงกัน แต่ละข้อทำได้แค่ \"เพิ่มหรือลดความน่าสงสัย\" ไม่มีข้อไหนพิสูจน์ได้ว่าการ์ดแท้ 100%",
    "ถ้ามูลค่าสูงจนพลาดแล้วเจ็บ ให้ใช้ข้อพวกนี้เป็นตัวกรองเบื้องต้น แล้วจ่ายค่าเกรดหรือซื้อจากคนขายที่รับคืนของได้",
  ];
}

export type AuthCheck = {
  id: string;
  title: string;
  body: string;
};

export function guideAuthBestMethodHeading(lang: Language): string {
  return pick(lang, {
    TH: "วิธีที่ได้ผลที่สุด: เทียบกับใบที่รู้ว่าแท้",
    EN: "The most reliable method: compare with a card you know is genuine",
    JP: "もっとも確実な方法：本物と並べて比べる",
  });
}

export function guideAuthBestMethodBody(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "Every source agrees on this one. Put the card next to a common card from the same set — ideally the same rarity — under the same light, and look at the backs together.",
      "This works because counterfeiters get close, but rarely identical. Differences in back colour, gloss and print sharpness that are invisible on their own become obvious side by side.",
    ];
  }
  if (lang === "JP") {
    return [
      "すべての情報源が一致している方法です。同じ弾（できれば同じレアリティ）のカードと並べ、同じ照明の下で裏面を見比べます。",
      "単体では気づけない裏面の色味・光沢・印刷の精細さの差が、並べると一気に見えるようになります。",
    ];
  }
  return [
    "ทุกแหล่งข้อมูลตรงกันว่านี่คือวิธีที่ดีที่สุด — เอาการ์ดที่สงสัยไปวางข้างการ์ดธรรมดาจากชุดเดียวกัน (ถ้าได้ความหายากเดียวกันยิ่งดี) ใต้แสงเดียวกัน แล้วดูด้านหลังพร้อมกัน",
    "ที่ได้ผลเพราะคนทำปลอมทำได้ \"ใกล้เคียง\" แต่แทบไม่เคยเหมือนเป๊ะ ความต่างของโทนสีหลังการ์ด ความเงา และความคมของงานพิมพ์ที่มองใบเดียวไม่ออก จะเห็นชัดทันทีเมื่อวางเทียบกัน",
    "ถ้าไม่มีใบที่มั่นใจว่าแท้อยู่ในมือ ให้ยืมจากเพื่อนหรือขอดูที่ร้านก่อน — ดีกว่าเดาจากรูปในประกาศขาย",
  ];
}

export function guideAuthChecksHeading(lang: Language): string {
  return pick(lang, {
    TH: "จุดสังเกตบนตัวการ์ด",
    EN: "What to look at on the card itself",
    JP: "カード本体で見るポイント",
  });
}

export function guideAuthChecks(lang: Language): AuthCheck[] {
  if (lang === "EN") {
    return [
      {
        id: "back",
        title: "The back of the card",
        body: "Genuine Japanese prints have a consistent, vibrant blue-toned back. The most frequently reported tell on fakes is a purple or muddy cast — this was exactly what gave away a known batch of counterfeit Luffy alternate-art Manga Rares. Colour is hard to judge alone, which is why the side-by-side test matters.",
      },
      {
        id: "print",
        title: "Text and border sharpness",
        body: "On a genuine card, small text has crisp edges and the borders sit evenly. Fuzzy or slightly soft lettering, a border that is noticeably thicker on one side, or colours that look flat or oversaturated are all common on fakes.",
      },
      {
        id: "foil",
        title: "The foil layer",
        body: "Foil on a genuine rare behaves like a layer inside the card: the shine shifts gradually and evenly as you tilt it. Fakes often look like a shiny sticker on top — too glossy, with shimmer that changes unevenly across the artwork.",
      },
      {
        id: "cut",
        title: "Cut, corners and centring",
        body: "Look at all four edges and corners. Genuine cards are cut cleanly with consistent corner rounding. Frayed edges, visible layer separation at a corner, or wildly off-centre artwork are warning signs (though genuine cards do have centring variance — that alone is a condition issue, not a fake).",
      },
      {
        id: "stock",
        title: "Thickness and feel — compare, don't assume",
        body: "Sources contradict each other on whether fakes run thinner or thicker, so ignore any rule that gives you a direction. What is useful is difference: if the card feels or measures noticeably unlike a known-genuine card from the same set, that is worth investigating.",
      },
    ];
  }
  if (lang === "JP") {
    return [
      {
        id: "back",
        title: "カード裏面",
        body: "正規の日本版は、彩度の高い青系で色味が安定しています。偽造品でもっとも多く報告されるのは紫がかった、または濁った色味です。単体では判断しづらいため、並べて比較するのが有効です。",
      },
      {
        id: "print",
        title: "文字と枠の精細さ",
        body: "正規品は小さな文字の輪郭がはっきりし、枠の太さが均一です。文字がにじむ、片側だけ枠が太い、色が平板または過度に濃い場合は注意が必要です。",
      },
      {
        id: "foil",
        title: "ホイル（箔）",
        body: "正規品の箔はカード内部の層としてふるまい、傾けると光沢がなめらかに変化します。偽造品は表面に貼ったシールのように過度に光り、輝きがイラスト内で不均一になりがちです。",
      },
      {
        id: "cut",
        title: "断裁・角・センタリング",
        body: "四辺と角を確認します。正規品は断裁が均一で角の丸みも揃っています。ささくれ、角の層の剥離、極端なセンターずれは注意信号です（軽度のずれは状態の問題であり偽造の証拠ではありません）。",
      },
      {
        id: "stock",
        title: "厚み・手触りは「比較」で見る",
        body: "偽造品が厚いか薄いかは情報源によって主張が食い違います。方向を決めつけず、同じ弾の本物と明らかに違うかどうかだけを見てください。",
      },
    ];
  }
  return [
    {
      id: "back",
      title: "หลังการ์ด",
      body: "ฉบับญี่ปุ่นแท้ หลังการ์ดจะเป็นโทนน้ำเงินสดและสีสม่ำเสมอทั้งใบ จุดที่มีคนรายงานว่าเจอบ่อยที่สุดในของปลอมคือหลังการ์ดออกโทน \"ม่วง\" หรือทึบขุ่น — เคสที่เป็นข่าวจริงคือชุดการ์ดปลอมของ Luffy ลายพิเศษ (Manga Rare) ที่จับได้จากจุดนี้ แต่สีเป็นสิ่งที่ตัดสินใบเดียวยาก จึงต้องวางเทียบเสมอ",
    },
    {
      id: "print",
      title: "ความคมของตัวหนังสือและเส้นขอบ",
      body: "การ์ดแท้ ตัวหนังสือเล็กๆ จะมีขอบคม และกรอบรอบใบหนาเท่ากันทุกด้าน ถ้าตัวอักษรเบลอหรือฟุ้ง กรอบด้านหนึ่งหนากว่าอีกด้านอย่างเห็นได้ชัด หรือสีดูแบนผิดปกติ/จัดจ้านเกินจริง เป็นสัญญาณที่พบบ่อยในของปลอม",
    },
    {
      id: "foil",
      title: "ชั้นฟอยล์",
      body: "ฟอยล์ของการ์ดแรร์แท้ทำตัวเหมือนเป็นชั้นที่อยู่ \"ใน\" การ์ด เวลาเอียงไฟ ประกายจะไล่เปลี่ยนอย่างนุ่มนวลและสม่ำเสมอ ส่วนของปลอมมักดูเหมือนสติกเกอร์วาวๆ แปะทับด้านบน คือเงาเกินจริงและประกายกระโดดไม่เท่ากันในภาพเดียวกัน",
    },
    {
      id: "cut",
      title: "การตัด ขอบ และการวางกลางภาพ",
      body: "ดูขอบทั้งสี่ด้านและมุมทั้งสี่ การ์ดแท้ตัดเรียบ มุมมนเท่ากัน ถ้าขอบเป็นขุย มุมมีชั้นกระดาษแยกออกจากกัน หรือภาพเบี้ยวออกจากกลางมาก ให้ระวังไว้ก่อน (แต่การวางภาพเบี้ยวเล็กน้อยเกิดกับการ์ดแท้ได้ นั่นเป็นเรื่องสภาพ ไม่ใช่หลักฐานว่าปลอม)",
    },
    {
      id: "stock",
      title: "ความหนาและสัมผัส — ให้เทียบ อย่าท่องสูตร",
      body: "แหล่งข้อมูลขัดกันเองว่าของปลอมหนากว่าหรือบางกว่า จึงอย่าเชื่อกฎที่ฟันธงทิศทาง สิ่งที่ใช้ได้จริงคือ \"ความต่าง\" — ถ้าจับแล้วรู้สึกหรือวัดแล้วไม่เหมือนใบที่รู้ว่าแท้จากชุดเดียวกันอย่างชัดเจน นั่นคือจุดที่ควรตรวจต่อ",
    },
  ];
}

export function guideAuthLightTestHeading(lang: Language): string {
  return pick(lang, {
    TH: "ส่องไฟดูแกนดำ — ทดสอบได้เองโดยการ์ดไม่เสีย",
    EN: "The light test — non-destructive",
    JP: "光にかざす（カードを傷めない方法）",
  });
}

export function guideAuthLightTestBody(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "Hold the card up against a strong light. Trading cards are built with a dark inner layer between the two printed faces, and that layer blocks most of the light. A genuine card lets very little through.",
      "If the card is noticeably translucent — you can make out the shape of the light or the artwork from the other side — that is a strong reason to keep checking. It is not a verdict on its own: card thickness varies and phone torches vary too, so compare against a card you trust under the same light.",
    ];
  }
  if (lang === "JP") {
    return [
      "強い光にかざします。カードは印刷面の間に暗い芯（黒芯）があり、光の大半を遮ります。正規品はほとんど透けません。",
      "はっきり透ける場合は要注意ですが、これ単体では断定できません。同じ光源で信頼できるカードと比較してください。",
    ];
  }
  return [
    "ยกการ์ดส่องกับไฟแรงๆ การ์ดสะสมทำจากกระดาษที่มีชั้นสีเข้ม (แกนดำ) คั่นอยู่ระหว่างหน้าพิมพ์สองด้าน ชั้นนี้จะกันแสงไว้เกือบหมด การ์ดแท้จึงแทบไม่โปร่งแสง",
    "ถ้าส่องแล้วเห็นทะลุชัด — มองเห็นรูปทรงของไฟหรือเห็นลายอีกด้านลอดมา — ให้ถือเป็นเหตุผลที่ควรตรวจต่อ แต่ยังตัดสินเองไม่ได้ เพราะความหนาการ์ดและความแรงไฟฉายมือถือแต่ละรุ่นไม่เท่ากัน ต้องเทียบกับใบที่เชื่อถือได้ใต้ไฟดวงเดียวกันเสมอ",
  ];
}

export function guideAuthRipHeading(lang: Language): string {
  return pick(lang, {
    TH: "การฉีกดูแกน — ทางเลือกสุดท้ายที่ทำให้การ์ดเสียถาวร",
    EN: "The rip test — a destructive last resort",
    JP: "破って断面を見る（最終手段・カードは失われます）",
  });
}

export function guideAuthRipBody(lang: Language): string {
  return pick(lang, {
    TH: "การฉีกการ์ดครึ่งใบเพื่อดูหน้าตัดว่ามีแกนสีเข้มจริงไหม เป็นวิธีที่ให้คำตอบชัดที่สุด และทำลายการ์ดใบนั้นถาวร ใช้ได้เฉพาะกับใบที่ยอมเสียได้จริง เช่นการ์ดธรรมดาจากล็อตที่สงสัยทั้งกอง เพื่อตรวจว่าล็อตนั้นมีปัญหาหรือไม่ อย่าใช้กับการ์ดที่ตั้งใจจะเก็บหรือขายต่อเด็ดขาด และผลจากใบหนึ่งไม่ได้ยืนยันทั้งกอง",
    EN: "Tearing a card in half to inspect the cross-section for the dark inner layer gives the clearest answer and permanently destroys that card. Only ever do it to a card you accept losing — for example one common from a batch you suspect, to test whether the batch has a problem. Never do it to a card you plan to keep or resell, and remember one card's result does not certify the rest.",
    JP: "カードを半分に破って断面の黒芯を確認する方法は、もっとも明確ですが、そのカードは失われます。疑わしいロットのコモンなど、失ってよいカードにのみ行ってください。保管・転売予定のカードには決して行わないでください。",
  });
}

export function guideAuthGradingHeading(lang: Language): string {
  return pick(lang, {
    TH: "ของแพงยิ่งดูยาก — เมื่อไหร่ควรพึ่งการเกรด",
    EN: "The expensive ones are the hardest — when to rely on grading",
    JP: "高額カードほど難しい — 鑑定に頼るべき場面",
  });
}

export function guideAuthGradingBody(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "The counterfeits that matter are aimed at the cards worth faking: alternate arts, secret rares, high-value promos. Those are exactly the ones where eyeballing gets least reliable, because the people making them can afford better printing.",
      "Grading companies use tooling ordinary buyers do not have, which is why a graded slab carries a premium. But a slab is not a free pass either: PSA itself warns that checking a certificate number is not enough, because real numbers have been put on fake slabs. If a graded card is expensive, compare the slab in hand against the photos published for that certificate.",
    ];
  }
  if (lang === "JP") {
    return [
      "偽造の対象になるのは、そもそも偽造する価値がある高額カードです。そしてそれらこそ、目視での判別がもっとも当てにならないカードでもあります。",
      "鑑定機関は一般の購入者が持たない設備を使います。ただしスラブも万能ではなく、PSA自身が「証明書番号の照合だけでは不十分」と注意喚起しています。高額な鑑定品では、手元のスラブと証明書の公開画像を照合してください。",
    ];
  }
  return [
    "ของปลอมที่น่ากลัวจริงคือของที่เล็งใบซึ่ง \"คุ้มที่จะปลอม\" — ลายพิเศษ (alternate art) การ์ด SEC และโปรโมราคาสูง ซึ่งบังเอิญเป็นกลุ่มเดียวกับที่ดูด้วยตาแล้วเชื่อถือได้น้อยที่สุด เพราะคนทำมีงบพอจะใช้งานพิมพ์ที่ดีขึ้น",
    "บริษัทรับเกรดใช้เครื่องมือที่ผู้ซื้อทั่วไปไม่มี การ์ดที่อยู่ในตลับเกรดจึงมีราคาสูงกว่า แต่ตลับก็ไม่ใช่ใบผ่านฟรี — PSA เองเตือนว่าการเช็คเลขใบรับรองอย่างเดียวไม่พอ เพราะมีคนเอาเลขจริงไปใส่ตลับปลอม ถ้าซื้อการ์ดเกรดราคาสูง ให้เทียบตลับที่อยู่ในมือกับรูปที่ทางบริษัทเผยแพร่ไว้ตามเลขใบรับรองนั้นด้วย",
  ];
}

export function guideAuthTermsHeading(lang: Language): string {
  return pick(lang, {
    TH: "ปลอม · proxy · ของแท้ที่หายาก — คนละเรื่องกัน",
    EN: "Counterfeit vs proxy vs a genuine rare — three different things",
    JP: "偽造品・プロキシ・正規のレアカードの違い",
  });
}

export function guideAuthTerms(lang: Language): AuthCheck[] {
  if (lang === "EN") {
    return [
      {
        id: "counterfeit",
        title: "Counterfeit",
        body: "Made to deceive — printed by someone other than Bandai and sold as if it were official. Bandai states it provides no replacement or support for counterfeits, even when a buyer obtained one unknowingly.",
      },
      {
        id: "proxy",
        title: "Proxy (playtest card)",
        body: "An openly unofficial stand-in used to test a deck before buying the real card. It is fine for casual play when everyone knows what it is, it cannot be used in sanctioned tournaments, and it must never be sold or presented as an official card.",
      },
      {
        id: "genuine-rare",
        title: "A genuine rare or promo",
        body: "A real Bandai card — a later reprint, or a prize card from an official event. These are often what a fake is imitating: Bandai issued a public alert in November 2024 about counterfeit copies of the English winner card from the Championship 2023 World Final.",
      },
    ];
  }
  if (lang === "JP") {
    return [
      {
        id: "counterfeit",
        title: "偽造品",
        body: "バンダイ以外が製造し、公式品として販売される、欺くことを目的としたカードです。バンダイは、意図せず入手した場合でも交換・サポートを行わないとしています。",
      },
      {
        id: "proxy",
        title: "プロキシ（調整用カード）",
        body: "非公式であることを明示して使う代用カードです。カジュアルな調整用途に限られ、公認大会では使用できません。公式品として販売・提示してはいけません。",
      },
      {
        id: "genuine-rare",
        title: "正規のレア・プロモ",
        body: "バンダイ発行の本物です。2024年11月には、チャンピオンシップ2023 ワールドファイナルの英語版ウィナーカードの偽造品について公式に注意喚起が出されています。",
      },
    ];
  }
  return [
    {
      id: "counterfeit",
      title: "ของปลอม (counterfeit)",
      body: "ทำมาเพื่อหลอก — ไม่ได้ผลิตโดย Bandai แต่เอามาขายเหมือนเป็นของทางการ Bandai ระบุว่าไม่รับเปลี่ยนและไม่ดูแลการ์ดปลอม แม้ผู้ซื้อจะได้มาโดยไม่รู้ตัวก็ตาม",
    },
    {
      id: "proxy",
      title: "proxy (การ์ดซ้อมเล่น)",
      body: "การ์ดแทนที่บอกกันตรงๆ ว่าไม่ใช่ของแท้ ใช้ลองจัดเด็คก่อนตัดสินใจซื้อใบจริง เล่นกันเองได้ถ้าทุกคนรู้ว่ามันคืออะไร แต่ใช้ในทัวร์นาเมนต์ทางการไม่ได้ และห้ามเอาไปขายหรือแสดงว่าเป็นของแท้เด็ดขาด",
    },
    {
      id: "genuine-rare",
      title: "ของแท้ที่หายาก / การ์ดโปรโม",
      body: "การ์ดจริงจาก Bandai เช่นการ์ดที่พิมพ์ซ้ำในชุดหลัง หรือการ์ดรางวัลจากงานทางการ กลุ่มนี้แหละที่มักถูกก๊อป — เดือนพฤศจิกายน 2024 Bandai เคยออกประกาศเตือนเรื่องการ์ดปลอมของ Winner card ฉบับภาษาอังกฤษจากงาน Championship 2023 World Final มาแล้ว",
    },
  ];
}

export function guideAuthRedFlagsHeading(lang: Language): string {
  return pick(lang, {
    TH: "สัญญาณอันตรายในประกาศขาย",
    EN: "Red flags in a listing",
    JP: "出品情報の危険信号",
  });
}

export function guideAuthRedFlags(lang: Language): string[] {
  if (lang === "EN") {
    return [
      "A price far below the market reference — the single most reported warning sign. Check the card's page here before you decide a bargain is real.",
      "Only stock or borrowed photos, and a seller who will not send close-ups of the actual card under normal light. Refusing is itself an answer.",
      "Sealed packs sold loose. Packs can be weighed to find the heavy ones, the hits pulled, and the rest resold at full price — buying single loose packs from a stranger carries that risk.",
      "A sealed box with puffy, warped or lopsided seals, or glue residue and melted-looking seams — signs a box was opened and resealed.",
      "Pressure to decide immediately, or a request to move the conversation and the payment off the platform you found the listing on.",
    ];
  }
  if (lang === "JP") {
    return [
      "相場から大きく安い価格 — もっとも多く報告される危険信号です。",
      "商品画像が公式画像や借り物のみで、実物の接写を送ってくれない出品者。",
      "バラ売りの未開封パック。重量を測って当たりを抜き、残りを定価で売る手口があります。",
      "封が膨らむ・歪む、糊の跡や溶けたような接着面がある未開封ボックス（開封後の再シール）。",
      "即決を迫る、または取引をプラットフォーム外へ誘導する。",
    ];
  }
  return [
    "ราคาต่ำกว่าราคากลางมากผิดปกติ — เป็นสัญญาณที่มีคนรายงานบ่อยที่สุด ก่อนจะเชื่อว่าเจอของถูก ให้เปิดหน้าการ์ดใบนั้นดูราคากลางก่อน",
    "ใช้แต่รูปทางการหรือรูปคนอื่น และคนขายไม่ยอมถ่ายรูปใกล้ๆ ของใบจริงใต้แสงปกติมาให้ดู — การปฏิเสธก็เป็นคำตอบอยู่แล้ว",
    "ซองที่ยังไม่แกะแต่ขายแยกเป็นซอง มีวิธีชั่งน้ำหนักหาซองที่มีใบหนัก ดึงใบดีออก แล้วเอาที่เหลือมาขายราคาเต็ม การซื้อซองหลวมจากคนไม่รู้จักจึงมีความเสี่ยงนี้ติดมาด้วย",
    "กล่องที่ยังไม่แกะแต่ซีลปูด บิดเบี้ยว ไม่สมมาตร หรือมีคราบกาว/รอยเชื่อมเหมือนโดนความร้อน — เป็นร่องรอยว่ากล่องเคยถูกเปิดแล้วซีลใหม่",
    "เร่งให้ตัดสินใจทันที หรือชวนให้ย้ายไปคุยและโอนเงินนอกแพลตฟอร์มที่เจอประกาศ",
  ];
}

export function guideAuthFaq(lang: Language): { question: string; answer: string }[] {
  if (lang === "EN") {
    return [
      {
        question: "Is there one test that proves a One Piece card is real?",
        answer:
          "No. Bandai does not publish consumer-facing authentication features, and every check collectors use only raises or lowers suspicion. Comparing against a card you know is genuine gets you the furthest; for expensive cards, grading is the practical answer.",
      },
      {
        question: "Are Japanese and English cards faked equally?",
        answer:
          "Counterfeits follow value, not language. High-value alternate arts, secret rares and prize promos are the targets in any language — Bandai's own 2024 counterfeit alert concerned an English-language championship prize card.",
      },
      {
        question: "Is a proxy card illegal?",
        answer:
          "A proxy used openly for casual playtesting is not the same as a counterfeit. It cannot be used in sanctioned tournaments, and selling one — or letting a buyer believe it is official — is where it stops being a proxy and becomes fraud.",
      },
      {
        question: "Does a PSA or CGC slab guarantee the card is real?",
        answer:
          "It is far safer than buying raw, but not absolute. PSA warns that a matching certificate number alone is not enough, since real numbers have appeared on fake slabs. For a large purchase, compare the slab in hand with the photos published for that certificate.",
      },
    ];
  }
  if (lang === "JP") {
    return [
      {
        question: "真贋を確定できる検査はありますか？",
        answer:
          "ありません。バンダイは一般向けの真贋仕様を公開しておらず、各チェックは疑いを強める/弱めるだけです。本物との比較がもっとも有効で、高額カードは鑑定が現実的な答えです。",
      },
      {
        question: "日本語版と英語版で偽造の多さは違いますか？",
        answer:
          "偽造は言語ではなく価値を追います。2024年のバンダイの注意喚起は英語版のプライズカードに関するものでした。",
      },
      {
        question: "プロキシは違法ですか？",
        answer:
          "非公式と明示したカジュアル用途のプロキシは偽造品とは別物です。公認大会では使用できず、販売したり公式品と誤認させた時点で問題になります。",
      },
      {
        question: "PSAやCGCのスラブなら安全ですか？",
        answer:
          "生の状態で買うよりはるかに安全ですが絶対ではありません。証明書番号の一致だけでは不十分だとPSA自身が注意喚起しています。",
      },
    ];
  }
  return [
    {
      question: "มีวิธีเดียวที่พิสูจน์ได้เลยไหมว่าการ์ดวันพีซใบนี้แท้?",
      answer:
        "ไม่มี Bandai ไม่ได้ประกาศฟีเจอร์ตรวจสอบของแท้สำหรับผู้บริโภค และทุกวิธีที่นักสะสมใช้ทำได้แค่เพิ่มหรือลดความน่าสงสัย วิธีที่พาไปได้ไกลที่สุดคือเทียบกับใบที่รู้ว่าแท้ ส่วนการ์ดราคาสูงคำตอบที่ใช้ได้จริงคือส่งเกรด",
    },
    {
      question: "การ์ดฉบับญี่ปุ่นกับอังกฤษ โดนปลอมพอกันไหม?",
      answer:
        "ของปลอมวิ่งตามมูลค่า ไม่ได้วิ่งตามภาษา กลุ่มเป้าหมายคือลายพิเศษราคาสูง การ์ด SEC และการ์ดรางวัล ไม่ว่าจะภาษาไหน — ประกาศเตือนของ Bandai เมื่อปี 2024 ก็เป็นการ์ดรางวัลฉบับภาษาอังกฤษ",
    },
    {
      question: "การ์ด proxy ผิดกฎหมายไหม?",
      answer:
        "proxy ที่ใช้ซ้อมเล่นโดยบอกกันตรงๆ ว่าไม่ใช่ของแท้ เป็นคนละเรื่องกับของปลอม ใช้ในทัวร์นาเมนต์ทางการไม่ได้ และจุดที่มันเลิกเป็น proxy คือตอนเอาไปขายหรือปล่อยให้คนซื้อเข้าใจว่าเป็นของแท้",
    },
    {
      question: "ซื้อการ์ดที่อยู่ในตลับ PSA หรือ CGC แล้วปลอดภัยเลยไหม?",
      answer:
        "ปลอดภัยกว่าซื้อใบเปล่ามาก แต่ไม่ใช่ร้อยเปอร์เซ็นต์ PSA เองเตือนว่าการเช็คแค่เลขใบรับรองยังไม่พอ เพราะเคยมีคนเอาเลขจริงไปใส่ตลับปลอม ถ้าเป็นการ์ดราคาสูง ให้เทียบตลับที่ได้รับกับรูปที่เผยแพร่ไว้ตามเลขใบรับรองนั้นด้วย",
    },
    {
      question: "ถ้าซื้อไปแล้วเพิ่งรู้ว่าปลอม ทำยังไงได้บ้าง?",
      answer:
        "Bandai ไม่รับเปลี่ยนการ์ดปลอม ทางที่เหลือคือใช้ช่องทางของแพลตฟอร์มหรือคนกลางที่ซื้อผ่าน จึงควรเก็บหลักฐานทุกอย่างไว้ตั้งแต่ต้น — โปรไฟล์คนขาย โพสต์ประกาศ แชท เลขบัญชีที่โอน สลิป และคลิปตอนแกะพัสดุ",
    },
  ];
}
