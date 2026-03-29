import type { Language } from "@/stores/ui-store";

const LOCALE_MAP: Record<Language, string> = {
  TH: "th-TH",
  EN: "en-US",
  JP: "ja-JP",
};

export function getLocale(lang: Language): string {
  return LOCALE_MAP[lang];
}

const translations = {
  TH: {
    // Navigation
    market: "ตลาด",
    sets: "ชุดการ์ด",
    cards: "การ์ดเดี่ยว",
    marketplace: "ซื้อขาย",
    guide: "คู่มือ",
    home: "หน้าแรก",
    overview: "ภาพรวม",
    pullCalculator: "คำนวณดรอปเรท",
    portfolioNav: "พอร์ตโฟลิโอ",
    watchlistNav: "รายการโปรด",
    languageLabel: "ภาษา",
    currencyLabel: "สกุลเงิน",
    profileLabel: "โปรไฟล์",
    logout: "ออกจากระบบ",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",

    // Search
    search: "ค้นหา",
    searchPlaceholder: "ค้นหา...",
    searchLong: "ค้นหาการ์ด เช่น Luffy, OP13-118, SEC...",
    searchButton: "ค้นหา",
    resultsFor: "ผลลัพธ์สำหรับ",
    tryOtherSearch: "ลองค้นหาด้วยคำอื่น เช่น รหัสการ์ด, ชื่อตัวละคร, หรือชื่อชุด",
    noResultsDesc: "ลองเปลี่ยนคำค้นหาหรือปรับ filter ดูนะ",
    noResults: "ไม่เจอการ์ดที่ค้นหา",
    typeToSearch: "พิมพ์เพื่อค้นหาการ์ด",

    // Sort options
    sortPriceDesc: "ราคาสูง → ต่ำ",
    sortPriceAsc: "ราคาต่ำ → สูง",
    sortGain24h: "ขึ้นมากสุด 24h",
    sortLoss24h: "ลงมากสุด 24h",
    sortGain7d: "ขึ้นมากสุด 7d",
    sortLoss7d: "ลงมากสุด 7d",
    sortNewest: "ล่าสุด",
    sortNameAz: "ชื่อ A-Z",

    // Shared table headers / labels
    card: "การ์ด",
    set: "ชุด",
    price: "ราคา",
    change: "เปลี่ยนแปลง",
    value: "มูลค่า",
    costBasis: "ต้นทุน",
    pnl: "กำไร/ขาดทุน",
    sparkline7d: "กราฟ 7 วัน",
    visits: "เข้าชม",
    allTab: "ทั้งหมด",
    outOfStock: "หมด",
    noData: "ไม่มีข้อมูล",
    itemsCount: "รายการ",
    pageOf: "หน้า",
    showingOf: "แสดง",
    from: "จาก",
    items: "รายการ",

    // Filter UI
    filter: "ตัวกรอง",
    rarityFilter: "ความหายาก",
    pricePeriod: "ช่วงเปลี่ยนแปลง",
    priceLabel: "ราคา",
    min: "ต่ำสุด",
    max: "สูงสุด",
    clearAll: "ล้างทั้งหมด",
    clearFilter: "ล้างตัวกรอง",
    setFilter: "ชุดการ์ด",
    allSets: "ทุกชุด",
    allItems: "ทั้งหมด",
    rarity: "ความหายาก",
    variant: "เวอร์ชัน",
    regular: "ปกติ",
    parallel: "Parallel",
    table: "ตาราง",
    grid: "กริด",

    // Stats / market
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
    noData24h: "ยังไม่มีข้อมูล 24 ชม.",

    // Card detail
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
    priceCompare: "อ้างอิงราคา",
    listing: "ตั้งขาย",
    lastSold: "ขายล่าสุด",
    community: "ชุมชน",
    retailPrice: "ราคากลางร้านค้า",
    realMarketPrice: "ราคาเทรดล่าสุด",
    gradedPrice: "ราคาสภาพเกรด",
    sourceRef: "แหล่ง",
    sourceMarkets: "ราคาจากตลาดอื่น",
    updated: "อัพเดท",
    otherCardsFrom: "การ์ดอื่นๆ จาก",
    viewAllCardsIn: "ดูการ์ดทั้งหมดใน",

    // Home
    contact: "ติดต่อ",
    account: "บัญชี",
    login: "เข้าสู่ระบบ",

    // Portfolio
    portfolio: "พอร์ต",
    overviewTab: "ภาพรวม",
    transactionsTab: "ธุรกรรม",
    assets: "สินทรัพย์",
    addCard: "เพิ่มการ์ด",
    addToPortfolio: "เพิ่มการ์ดเข้าพอร์ต",
    addToPortfolioDesc: "กรอกรายละเอียดของการ์ดที่ต้องการเพิ่ม",
    portfolioName: "ชื่อพอร์ต...",
    createPortfolio: "สร้างพอร์ตใหม่",
    quantity: "จำนวน",
    purchasePrice: "ราคาที่ซื้อ",
    useMarketPrice: "เว้นว่างจะใช้ราคาตลาดปัจจุบัน",
    adding: "กำลังเพิ่ม...",
    addToPort: "เพิ่มเข้าพอร์ต",
    buy: "ซื้อ",
    sell: "ขาย",
    remove: "ลบ",
    noTransactions: "ยังไม่มีรายการ",
    history: "ประวัติย้อนหลัง",
    allocation: "สัดส่วนการถือ",
    portfolioValue: "มูลค่าพอร์ต",
    bestPerformer: "ผลงานดีที่สุด",
    worstPerformer: "ผลงานแย่ที่สุด",
    loadFailed: "โหลดข้อมูลไม่สำเร็จ",
    other: "อื่นๆ",
    emptyPortfolio: "ยังไม่มีการ์ดในพอร์ต",
    emptyPortfolioDesc: "เพิ่มการ์ดใบแรกเพื่อเริ่มติดตามมูลค่า",
    emptyWatchlist: "ยังไม่มีการ์ดในรายการจับตา",
    emptyWatchlistDesc: "กดดาวที่การ์ดที่สนใจเพื่อติดตามราคา",
    noPortfolioData: "ยังไม่มีข้อมูลเพียงพอ",
    noPortfolioDataDesc: "ข้อมูลจะเริ่มบันทึกหลังจากเพิ่มการ์ด",
    unrealizedPnl: "กำไร / ขาดทุน",
    addCardToPortfolio: "เลือกการ์ด",
    addCardToPortfolioDesc: "ค้นหาหรือใช้ตัวกรองเพื่อเลือกการ์ด",
    clearAllFilters: "ล้างตัวกรองทั้งหมด",
    noCardsFound: "ไม่พบการ์ดที่ค้นหา",
    noCardsFoundDesc: "ลองเปลี่ยนคำค้นหาหรือตัวกรอง",

    // Sets
    setsTitle: "ชุดการ์ด",
    setsDesc: "ดูชุดการ์ดทั้งหมด ตรวจสอบจำนวนและมูลค่าโดยประมาณ",
    setCount: "ชุด",
    totalValueLabel: "มูลค่ารวม",
    noSetsYet: "ยังไม่มีชุดการ์ดในระบบ",
    highestValueSet: "ชุดที่มีมูลค่ามากที่สุด",
    cardsCount: "ใบ",
    noCardsInSet: "ยังไม่มีการ์ดในชุดนี้",
    popularTab: "ยอดนิยม",
    latestSetTab: "ชุดล่าสุด",

    // Pull rates / sets detail
    dropRate: "อัตราดรอป",
    communityEstimate: "ประมาณการจากชุมชน",
    perUnit: "ต่อ",
    chancePerCard: "โอกาส/ใบ",
    level: "ระดับ",

    // Profile
    profileSettings: "ตั้งค่า",
    displayNamePlaceholder: "ชื่อที่แสดงใน Marketplace",
    save: "บันทึก",
    saving: "กำลังบันทึก…",
    myListings: "รายการขายของฉัน",
    noListings: "ยังไม่มีรายการที่ลงขาย",
    sellerListings: "รายการขาย",
    noOpenListings: "ยังไม่มีรายการที่เปิดขาย",
    reviews: "รีวิวที่ได้รับ",
    noReviews: "ยังไม่มีรีวิว",
    noRating: "ยังไม่มีคะแนน",

    // Trending
    trendingTitle: "การ์ดมาแรง",
    trendingDesc: "การ์ดที่ราคาเปลี่ยนแปลงมากที่สุดในช่วง 24 ชั่วโมง, 7 วัน และ 30 วัน",

    // Pull calculator
    calculate: "คำนวณ",
    selectWantedCards: "เลือกการ์ดที่อยากได้",
    allRarity: "ทุก Rarity",
    searchByNameOrCode: "ค้นหาชื่อหรือรหัส...",
    noCardsResult: "ไม่พบการ์ด",
    chanceToGetAll: "โอกาสได้ครบทุกใบ",
    totalSelectedValue: "มูลค่ารวมการ์ดที่เลือก",
    purchaseCost: "ต้นทุนซื้อ",
    selectSet: "เลือกชุดการ์ด",
    searchSet: "ค้นหาชุดการ์ด...",
    noSetsFound: "ไม่พบชุดการ์ด",

    // Marketplace
    condition: "สภาพ",
    priceRangeJpy: "ช่วงราคา (¥)",
    below: "ต่ำกว่า",
    listCard: "ลงขายการ์ด",
    noListingsYet: "ยังไม่มีรายการในตลาด หรือลองเปลี่ยนตัวกรอง",
    marketplaceDesc: "ซื้อขายการ์ดกับชุมชน",

    // Watchlist
    addToWatchlist: "เพิ่มในรายการโปรด",
    removeFromWatchlist: "ลบออกจากรายการโปรด",

    // Card add to portfolio
    added: "เพิ่มแล้ว!",
    createPortfolioFailed: "สร้างพอร์ตไม่สำเร็จ",
    addFailed: "เพิ่มไม่สำเร็จ",
    unspecified: "ไม่ระบุ",
    purchasePriceJpy: "ราคาซื้อ (¥)",

    // Empty states
    emptyError: "มีบางอย่างผิดพลาด",
    emptyErrorDesc: "ลองรีเฟรชหน้านี้อีกครั้ง",
    emptyNotFound: "หลงทางแล้ว...",
    emptyNotFoundDesc: "ไม่เจอหน้าที่ค้นหา ลองกลับหน้าแรกดู",

    // Footer / nav
    dropCalc: "คำนวณดรอป",
    quickLinks: "ลิงก์ด่วน",
    gettingStarted: "คู่มือเริ่มต้น",
    cardTypesGuide: "ประเภทการ์ด",
    raritiesGuide: "ความหายาก",
    colorsGuide: "สีในเกม",

    // Command search
    searchCardsDots: "ค้นหาการ์ด...",
    searchCardsCodesDots: "ค้นหาการ์ด, ชุด, รหัส...",
    recentSearches: "ค้นหาล่าสุด",
    searching: "กำลังค้นหา...",
    viewAllResults: "ดูผลลัพธ์ทั้งหมดสำหรับ",
    noResultsFor: "ไม่พบผลลัพธ์สำหรับ",

    // Pull calculator – purchase config
    packUnit: "ซอง",
    boxUnit: "กล่อง",
    cartonUnit: "คาตั้น",
    estimatedYield: "จะได้ประมาณ",

    // Want list
    wantList: "รายการที่อยากได้",
    selectFromLeft: "กดเลือกการ์ดจากฝั่งซ้าย",

    // Marketplace listing detail
    listingPrice: "ราคาขาย",
    approxMarketPrice: "ราคาตลาดโดยประมาณ",
    descriptionLabel: "รายละเอียด",
    seller: "ผู้ขาย",
    locationLabel: "ที่อยู่",
    shippingLabel: "จัดส่ง",
    contactSeller: "ติดต่อผู้ขาย",
    chatComingSoon: "แชท (เร็วๆ นี้)",
    similarListings: "รายการใกล้เคียง",
    noImage: "ไม่มีรูป",
    backButton: "← กลับ",
    cardPage: "หน้าการ์ด",
  },
  EN: {
    // Navigation
    market: "Market",
    sets: "Sets",
    cards: "Cards",
    marketplace: "Marketplace",
    guide: "Guide",
    home: "Home",
    overview: "Overview",
    pullCalculator: "Pull Rate Calculator",
    portfolioNav: "Portfolio",
    watchlistNav: "Watchlist",
    languageLabel: "Language",
    currencyLabel: "Currency",
    profileLabel: "Profile",
    logout: "Sign out",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",

    // Search
    search: "Search",
    searchPlaceholder: "Search cards...",
    searchLong: "Search cards, e.g. Luffy, OP13-118, SEC...",
    searchButton: "Search",
    resultsFor: "Results for",
    tryOtherSearch: "Try searching with different terms, e.g. card code, character name, or set name",
    noResultsDesc: "Try different search terms or filters",
    noResults: "No cards found",
    typeToSearch: "Type to search cards",

    // Sort options
    sortPriceDesc: "Price High → Low",
    sortPriceAsc: "Price Low → High",
    sortGain24h: "Top gainers 24h",
    sortLoss24h: "Top losers 24h",
    sortGain7d: "Top gainers 7d",
    sortLoss7d: "Top losers 7d",
    sortNewest: "Newest",
    sortNameAz: "Name A-Z",

    // Shared table headers / labels
    card: "Card",
    set: "Set",
    price: "Price",
    change: "Change",
    value: "Value",
    costBasis: "Cost",
    pnl: "P&L",
    sparkline7d: "7D Chart",
    visits: "Views",
    allTab: "All",
    outOfStock: "Out of stock",
    noData: "No data",
    itemsCount: "items",
    pageOf: "Page",
    showingOf: "Showing",
    from: "of",
    items: "items",

    // Filter UI
    filter: "Filters",
    rarityFilter: "Rarity",
    pricePeriod: "Change Period",
    priceLabel: "Price",
    min: "Min",
    max: "Max",
    clearAll: "Clear all",
    clearFilter: "Clear filters",
    setFilter: "Set",
    allSets: "All sets",
    allItems: "All",
    rarity: "Rarity",
    variant: "Variant",
    regular: "Regular",
    parallel: "Parallel",
    table: "Table",
    grid: "Grid",

    // Stats / market
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
    noData24h: "No data for last 24h",

    // Card detail
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
    priceCompare: "Price Reference",
    listing: "Listing",
    lastSold: "Last Sold",
    community: "Community",
    retailPrice: "Retail Price",
    realMarketPrice: "Last Traded Price",
    gradedPrice: "Graded Price",
    sourceRef: "Source",
    sourceMarkets: "Markets",
    updated: "Updated",
    otherCardsFrom: "Other cards from",
    viewAllCardsIn: "View all cards in",

    // Home
    contact: "Contact",
    account: "Account",
    login: "Sign in",

    // Portfolio
    portfolio: "Portfolio",
    overviewTab: "Overview",
    transactionsTab: "Transactions",
    assets: "Assets",
    addCard: "Add card",
    addToPortfolio: "Add card to portfolio",
    addToPortfolioDesc: "Enter details for the card you want to add",
    portfolioName: "Portfolio name...",
    createPortfolio: "Create portfolio",
    quantity: "Quantity",
    purchasePrice: "Purchase price",
    useMarketPrice: "Leave blank to use current market price",
    adding: "Adding...",
    addToPort: "Add to portfolio",
    buy: "Buy",
    sell: "Sell",
    remove: "Remove",
    noTransactions: "No transactions yet",
    history: "History",
    allocation: "Allocation",
    portfolioValue: "Portfolio value",
    bestPerformer: "Best performer",
    worstPerformer: "Worst performer",
    loadFailed: "Failed to load data",
    other: "Others",
    emptyPortfolio: "No cards in portfolio",
    emptyPortfolioDesc: "Add your first card to start tracking value",
    emptyWatchlist: "No cards in watchlist",
    emptyWatchlistDesc: "Star cards you're interested in to track prices",
    noPortfolioData: "Not enough data yet",
    noPortfolioDataDesc: "Data will be recorded after you add cards",
    unrealizedPnl: "Unrealized P&L",
    addCardToPortfolio: "Select card",
    addCardToPortfolioDesc: "Search or use filters to select a card",
    clearAllFilters: "Clear all filters",
    noCardsFound: "No cards found",
    noCardsFoundDesc: "Try changing your search or filters",

    // Sets
    setsTitle: "Card Sets",
    setsDesc: "Browse all card sets and check estimated values",
    setCount: "sets",
    totalValueLabel: "Total value",
    noSetsYet: "No card sets in the system yet",
    highestValueSet: "Highest value set",
    cardsCount: "cards",
    noCardsInSet: "No cards in this set yet",
    popularTab: "Popular",
    latestSetTab: "Latest set",

    // Pull rates / sets detail
    dropRate: "Drop Rates",
    communityEstimate: "Community estimates",
    perUnit: "per",
    chancePerCard: "Chance/card",
    level: "Level",

    // Profile
    profileSettings: "Settings",
    displayNamePlaceholder: "Display name in Marketplace",
    save: "Save",
    saving: "Saving…",
    myListings: "My Listings",
    noListings: "No listings yet",
    sellerListings: "Listings",
    noOpenListings: "No open listings",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    noRating: "No rating yet",

    // Trending
    trendingTitle: "Trending Cards",
    trendingDesc: "Cards with the most price movement over 24h, 7d, and 30d",

    // Pull calculator
    calculate: "Calculate",
    selectWantedCards: "Select wanted cards",
    allRarity: "All Rarities",
    searchByNameOrCode: "Search by name or code...",
    noCardsResult: "No cards found",
    chanceToGetAll: "Chance to get all",
    totalSelectedValue: "Total value of selected cards",
    purchaseCost: "Purchase cost",
    selectSet: "Select set",
    searchSet: "Search sets...",
    noSetsFound: "No sets found",

    // Marketplace
    condition: "Condition",
    priceRangeJpy: "Price range (¥)",
    below: "Below",
    listCard: "List a card",
    noListingsYet: "No listings yet — try changing the filters",
    marketplaceDesc: "Buy and sell cards with the community",

    // Watchlist
    addToWatchlist: "Add to watchlist",
    removeFromWatchlist: "Remove from watchlist",

    // Card add to portfolio
    added: "Added!",
    createPortfolioFailed: "Failed to create portfolio",
    addFailed: "Failed to add",
    unspecified: "Unspecified",
    purchasePriceJpy: "Purchase price (¥)",

    // Empty states
    emptyError: "Something went wrong",
    emptyErrorDesc: "Try refreshing the page",
    emptyNotFound: "Lost...",
    emptyNotFoundDesc: "Page not found. Try going back home.",

    // Footer / nav
    dropCalc: "Drop Calculator",
    quickLinks: "Quick Links",
    gettingStarted: "Getting Started",
    cardTypesGuide: "Card Types",
    raritiesGuide: "Rarities",
    colorsGuide: "Colors",

    // Command search
    searchCardsDots: "Search cards...",
    searchCardsCodesDots: "Search cards, sets, codes...",
    recentSearches: "Recent searches",
    searching: "Searching...",
    viewAllResults: "View all results for",
    noResultsFor: "No results for",

    // Pull calculator – purchase config
    packUnit: "pack",
    boxUnit: "box",
    cartonUnit: "carton",
    estimatedYield: "estimated yield",

    // Want list
    wantList: "Want List",
    selectFromLeft: "Select a card from the left",

    // Marketplace listing detail
    listingPrice: "Asking price",
    approxMarketPrice: "Approx. market price",
    descriptionLabel: "Description",
    seller: "Seller",
    locationLabel: "Location",
    shippingLabel: "Shipping",
    contactSeller: "Contact seller",
    chatComingSoon: "Chat (coming soon)",
    similarListings: "Similar listings",
    noImage: "No image",
    backButton: "← Back",
    cardPage: "Card page",
  },
  JP: {
    // Navigation
    market: "マーケット",
    sets: "セット",
    cards: "カード",
    marketplace: "売買",
    guide: "ガイド",
    home: "ホーム",
    overview: "概要",
    pullCalculator: "ドロップ率計算",
    portfolioNav: "ポートフォリオ",
    watchlistNav: "ウォッチリスト",
    languageLabel: "言語",
    currencyLabel: "通貨",
    profileLabel: "プロフィール",
    logout: "ログアウト",
    lightMode: "ライトモード",
    darkMode: "ダークモード",

    // Search
    search: "検索",
    searchPlaceholder: "カードを検索...",
    searchLong: "カードを検索、例: Luffy, OP13-118, SEC...",
    searchButton: "検索",
    resultsFor: "検索結果:",
    tryOtherSearch: "別のキーワードで検索してみてください（カードコード、キャラクター名、セット名など）",
    noResultsDesc: "検索条件を変えてみてください",
    noResults: "カードが見つかりません",
    typeToSearch: "カードを検索するには入力してください",

    // Sort options
    sortPriceDesc: "価格 高→低",
    sortPriceAsc: "価格 低→高",
    sortGain24h: "値上がり上位 24h",
    sortLoss24h: "値下がり上位 24h",
    sortGain7d: "値上がり上位 7d",
    sortLoss7d: "値下がり上位 7d",
    sortNewest: "新着順",
    sortNameAz: "名前 A-Z",

    // Shared table headers / labels
    card: "カード",
    set: "セット",
    price: "価格",
    change: "変動",
    value: "価値",
    costBasis: "取得コスト",
    pnl: "損益",
    sparkline7d: "7日グラフ",
    visits: "閲覧数",
    allTab: "すべて",
    outOfStock: "在庫なし",
    noData: "データなし",
    itemsCount: "件",
    pageOf: "ページ",
    showingOf: "表示中",
    from: "/",
    items: "件",

    // Filter UI
    filter: "フィルター",
    rarityFilter: "レアリティ",
    pricePeriod: "変動期間",
    priceLabel: "価格",
    min: "最小",
    max: "最大",
    clearAll: "すべてクリア",
    clearFilter: "フィルター解除",
    setFilter: "セット",
    allSets: "全セット",
    allItems: "すべて",
    rarity: "レアリティ",
    variant: "バージョン",
    regular: "通常",
    parallel: "パラレル",
    table: "テーブル",
    grid: "グリッド",

    // Stats / market
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
    noData24h: "24時間データなし",

    // Card detail
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
    priceCompare: "価格参考",
    listing: "出品価格",
    lastSold: "最終取引",
    community: "コミュニティ",
    retailPrice: "店頭価格",
    realMarketPrice: "最終取引価格",
    gradedPrice: "グレード価格",
    sourceRef: "ソース",
    sourceMarkets: "マーケット",
    updated: "更新",
    otherCardsFrom: "同セットの他のカード",
    viewAllCardsIn: "全カードを見る",

    // Home
    contact: "お問い合わせ",
    account: "アカウント",
    login: "ログイン",

    // Portfolio
    portfolio: "ポートフォリオ",
    overviewTab: "概要",
    transactionsTab: "取引履歴",
    assets: "保有資産",
    addCard: "カード追加",
    addToPortfolio: "ポートフォリオにカードを追加",
    addToPortfolioDesc: "追加するカードの詳細を入力してください",
    portfolioName: "ポートフォリオ名...",
    createPortfolio: "新しいポートフォリオを作成",
    quantity: "数量",
    purchasePrice: "購入価格",
    useMarketPrice: "空白の場合は現在の市場価格を使用",
    adding: "追加中...",
    addToPort: "ポートフォリオに追加",
    buy: "購入",
    sell: "売却",
    remove: "削除",
    noTransactions: "取引履歴なし",
    history: "履歴",
    allocation: "配分",
    portfolioValue: "ポートフォリオ価値",
    bestPerformer: "最高パフォーマー",
    worstPerformer: "最低パフォーマー",
    loadFailed: "データの読み込みに失敗しました",
    other: "その他",
    emptyPortfolio: "ポートフォリオにカードがありません",
    emptyPortfolioDesc: "最初のカードを追加して価値を追跡しましょう",
    emptyWatchlist: "ウォッチリストにカードがありません",
    emptyWatchlistDesc: "気になるカードにスターを付けて価格を追跡",
    noPortfolioData: "データが不足しています",
    noPortfolioDataDesc: "カードを追加するとデータが記録されます",
    unrealizedPnl: "未実現損益",
    addCardToPortfolio: "カードを選択",
    addCardToPortfolioDesc: "検索またはフィルターを使用してカードを選択",
    clearAllFilters: "全フィルターをクリア",
    noCardsFound: "カードが見つかりません",
    noCardsFoundDesc: "検索条件またはフィルターを変更してみてください",

    // Sets
    setsTitle: "カードセット",
    setsDesc: "全カードセットを閲覧し、推定価値を確認",
    setCount: "セット",
    totalValueLabel: "総額",
    noSetsYet: "システムにカードセットがありません",
    highestValueSet: "最高価値セット",
    cardsCount: "枚",
    noCardsInSet: "このセットにカードがありません",
    popularTab: "人気",
    latestSetTab: "最新セット",

    // Pull rates / sets detail
    dropRate: "ドロップ率",
    communityEstimate: "コミュニティ推定",
    perUnit: "毎",
    chancePerCard: "確率/枚",
    level: "レベル",

    // Profile
    profileSettings: "設定",
    displayNamePlaceholder: "マーケットプレイスの表示名",
    save: "保存",
    saving: "保存中…",
    myListings: "自分のリスト",
    noListings: "リストがありません",
    sellerListings: "出品リスト",
    noOpenListings: "出品中のリストなし",
    reviews: "レビュー",
    noReviews: "レビューなし",
    noRating: "評価なし",

    // Trending
    trendingTitle: "トレンドカード",
    trendingDesc: "24時間・7日・30日で最も価格変動したカード",

    // Pull calculator
    calculate: "計算",
    selectWantedCards: "欲しいカードを選択",
    allRarity: "全レアリティ",
    searchByNameOrCode: "名前またはコードで検索...",
    noCardsResult: "カードが見つかりません",
    chanceToGetAll: "全て揃う確率",
    totalSelectedValue: "選択カードの合計価値",
    purchaseCost: "購入コスト",
    selectSet: "セットを選択",
    searchSet: "セットを検索...",
    noSetsFound: "セットが見つかりません",

    // Marketplace
    condition: "状態",
    priceRangeJpy: "価格帯 (¥)",
    below: "以下",
    listCard: "カードを出品",
    noListingsYet: "出品がありません — フィルターを変更してみてください",
    marketplaceDesc: "コミュニティとカードを売買",

    // Watchlist
    addToWatchlist: "ウォッチリストに追加",
    removeFromWatchlist: "ウォッチリストから削除",

    // Card add to portfolio
    added: "追加しました！",
    createPortfolioFailed: "ポートフォリオの作成に失敗しました",
    addFailed: "追加に失敗しました",
    unspecified: "未指定",
    purchasePriceJpy: "購入価格 (¥)",

    // Empty states
    emptyError: "エラーが発生しました",
    emptyErrorDesc: "ページをリフレッシュしてみてください",
    emptyNotFound: "迷子になりました...",
    emptyNotFoundDesc: "お探しのページが見つかりません。ホームに戻ってください。",

    // Footer / nav
    dropCalc: "ドロップ計算",
    quickLinks: "クイックリンク",
    gettingStarted: "はじめに",
    cardTypesGuide: "カードタイプ",
    raritiesGuide: "レアリティ",
    colorsGuide: "色",

    // Command search
    searchCardsDots: "カードを検索...",
    searchCardsCodesDots: "カード、セット、コードを検索...",
    recentSearches: "最近の検索",
    searching: "検索中...",
    viewAllResults: "全結果を表示:",
    noResultsFor: "検索結果なし:",

    // Pull calculator – purchase config
    packUnit: "パック",
    boxUnit: "ボックス",
    cartonUnit: "カートン",
    estimatedYield: "の期待枚数",

    // Want list
    wantList: "欲しいリスト",
    selectFromLeft: "左側からカードを選択",

    // Marketplace listing detail
    listingPrice: "販売価格",
    approxMarketPrice: "市場価格の目安",
    descriptionLabel: "説明",
    seller: "出品者",
    locationLabel: "場所",
    shippingLabel: "配送",
    contactSeller: "出品者に連絡",
    chatComingSoon: "チャット (近日公開)",
    similarListings: "類似リスト",
    noImage: "画像なし",
    backButton: "← 戻る",
    cardPage: "カードページ",
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
  if (lang === "TH" && card.nameTh) return card.nameTh;
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
  if (lang === "TH" && set.nameTh) return set.nameTh;
  if (lang === "JP" && set.name) return set.name;
  return set.nameEn ?? set.name ?? "Unknown";
}
