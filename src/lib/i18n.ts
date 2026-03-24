import type { Language } from "@/stores/ui-store";

const translations = {
  TH: {
    market: "ตลาด",
    sets: "ชุดการ์ด",
    cards: "การ์ดเดี่ยว",
    marketplace: "ซื้อขาย",
    guide: "คู่มือ",
    home: "หน้าแรก",
    search: "ค้นหา",
    portfolio: "พอร์ต",
    account: "บัญชี",
    login: "เข้าสู่ระบบ",
    searchPlaceholder: "ค้นหาการ์ด...",
    totalCards: "การ์ดทั้งหมด",
    totalValue: "มูลค่ารวม",
    priceUp: "ราคาขึ้น",
    priceDown: "ราคาลง",
    topGainers: "ราคาขึ้นมากสุด",
    topLosers: "ราคาลงมากสุด",
    popular: "ยอดนิยม",
    viewAll: "ดูทั้งหมด",
    mostViewed: "การ์ดที่มีคนดูมากสุด",
    latestSet: "ชุดล่าสุด",
    more: "ดูเพิ่มเติม",
    highestValue: "มูลค่าสูงสุด",
    marketPrice: "ราคาตลาด",
    priceHistory: "ประวัติราคา",
    noPriceHistory: "ยังไม่มีประวัติราคา",
    details: "รายละเอียด",
    type: "ประเภท",
    color: "สี",
    cost: "ค่าใช้จ่าย",
    power: "พลัง",
    counter: "เคาน์เตอร์",
    life: "ชีวิต",
    attribute: "คุณสมบัติ",
    trait: "ลักษณะ",
    effect: "เอฟเฟกต์การ์ด",
    otherVersions: "เวอร์ชันอื่น",
    views: "ครั้งที่ดู",
    noData: "ไม่มีข้อมูล",
    noResults: "ไม่เจอการ์ดที่ค้นหา",
    noResultsDesc: "ลองเปลี่ยนคำค้นหาหรือปรับ filter ดูนะ",
    emptyPortfolio: "ยังไม่มีการ์ดในพอร์ต",
    emptyPortfolioDesc: "เพิ่มการ์ดใบแรกเพื่อเริ่มติดตามมูลค่า",
    emptyWatchlist: "ยังไม่มีการ์ดในรายการจับตา",
    emptyWatchlistDesc: "กดดาวที่การ์ดที่สนใจเพื่อติดตามราคา",
    items: "รายการ",
    filter: "ตัวกรอง",
    rarity: "ความหายาก",
    variant: "เวอร์ชัน",
    regular: "ปกติ",
    parallel: "Parallel",
    clearFilter: "ล้างตัวกรอง",
    table: "ตาราง",
    grid: "กริด",
    addCard: "เพิ่มการ์ด",
    contact: "ติดต่อ",
  },
  EN: {
    market: "Market",
    sets: "Sets",
    cards: "Cards",
    marketplace: "Marketplace",
    guide: "Guide",
    home: "Home",
    search: "Search",
    portfolio: "Portfolio",
    account: "Account",
    login: "Sign in",
    searchPlaceholder: "Search cards...",
    totalCards: "Total Cards",
    totalValue: "Total Value",
    priceUp: "Price Up",
    priceDown: "Price Down",
    topGainers: "Top Gainers",
    topLosers: "Top Losers",
    popular: "Popular",
    viewAll: "View all",
    mostViewed: "Most Viewed",
    latestSet: "Latest Set",
    more: "More",
    highestValue: "Highest Value",
    marketPrice: "Market Price",
    priceHistory: "Price History",
    noPriceHistory: "No price history yet",
    details: "Details",
    type: "Type",
    color: "Color",
    cost: "Cost",
    power: "Power",
    counter: "Counter",
    life: "Life",
    attribute: "Attribute",
    trait: "Trait",
    effect: "Card Effect",
    otherVersions: "Other Versions",
    views: "views",
    noData: "No data",
    noResults: "No cards found",
    noResultsDesc: "Try different search terms or filters",
    emptyPortfolio: "No cards in portfolio",
    emptyPortfolioDesc: "Add your first card to start tracking value",
    emptyWatchlist: "No cards in watchlist",
    emptyWatchlistDesc: "Star cards you're interested in to track prices",
    items: "items",
    filter: "Filters",
    rarity: "Rarity",
    variant: "Variant",
    regular: "Regular",
    parallel: "Parallel",
    clearFilter: "Clear filters",
    table: "Table",
    grid: "Grid",
    addCard: "Add card",
    contact: "Contact",
  },
  JP: {
    market: "マーケット",
    sets: "セット",
    cards: "カード",
    marketplace: "売買",
    guide: "ガイド",
    home: "ホーム",
    search: "検索",
    portfolio: "ポートフォリオ",
    account: "アカウント",
    login: "ログイン",
    searchPlaceholder: "カードを検索...",
    totalCards: "全カード",
    totalValue: "総額",
    priceUp: "値上がり",
    priceDown: "値下がり",
    topGainers: "値上がりランキング",
    topLosers: "値下がりランキング",
    popular: "人気",
    viewAll: "すべて見る",
    mostViewed: "閲覧数ランキング",
    latestSet: "最新セット",
    more: "もっと見る",
    highestValue: "最高額",
    marketPrice: "市場価格",
    priceHistory: "価格推移",
    noPriceHistory: "価格履歴なし",
    details: "詳細",
    type: "タイプ",
    color: "色",
    cost: "コスト",
    power: "パワー",
    counter: "カウンター",
    life: "ライフ",
    attribute: "属性",
    trait: "特徴",
    effect: "カード効果",
    otherVersions: "他のバージョン",
    views: "回閲覧",
    noData: "データなし",
    noResults: "カードが見つかりません",
    noResultsDesc: "検索条件を変えてみてください",
    emptyPortfolio: "ポートフォリオにカードがありません",
    emptyPortfolioDesc: "最初のカードを追加して価値を追跡しましょう",
    emptyWatchlist: "ウォッチリストにカードがありません",
    emptyWatchlistDesc: "気になるカードにスターを付けて価格を追跡",
    items: "件",
    filter: "フィルター",
    rarity: "レアリティ",
    variant: "バージョン",
    regular: "通常",
    parallel: "パラレル",
    clearFilter: "フィルター解除",
    table: "テーブル",
    grid: "グリッド",
    addCard: "カード追加",
    contact: "お問い合わせ",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["TH"];

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.EN[key] ?? key;
}

export function getCardName(
  lang: Language,
  card: { nameEn?: string | null; nameJp?: string | null; nameTh?: string | null }
): string {
  if (lang === "JP" && card.nameJp) return card.nameJp;
  return card.nameEn ?? card.nameJp ?? "Unknown";
}

export function getCardEffect(
  lang: Language,
  card: {
    effectEn?: string | null;
    effectJp?: string | null;
    effectTh?: string | null;
  }
): string | null {
  if (lang === "TH" && card.effectTh) return card.effectTh;
  if (lang === "JP" && card.effectJp) return card.effectJp;
  return card.effectEn ?? card.effectJp ?? null;
}

export function getSetName(
  lang: Language,
  set: {
    name?: string | null;
    nameEn?: string | null;
    nameTh?: string | null;
  }
): string {
  if (lang === "JP" && set.name) return set.name;
  return set.nameEn ?? set.name ?? "Unknown";
}
