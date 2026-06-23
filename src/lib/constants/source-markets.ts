/**
 * Search-URL builders for the external card markets we link out to. Shared by
 * the card-detail price-hub and the source-markets table (the builders were
 * previously copy-pasted inline in both).
 */
export const yuyuteiSearch = (code: string) =>
  `https://yuyu-tei.jp/sell/opc/?word=${encodeURIComponent(code)}`

export const snkrdunkSearch = (code: string) =>
  `https://snkrdunk.com/search?keyword=${encodeURIComponent(code)}`
