const CARD_CODE_REGEX = /^(OP|ST|EB|PRB)\d{2}-\d{3}$/i;

export function isValidCardCode(code: string): boolean {
  return CARD_CODE_REGEX.test(code);
}

export function parseCardCode(code: string): {
  setPrefix: string;
  setNumber: string;
  cardNumber: string;
} | null {
  const match = code.match(/^(OP|ST|EB|PRB)(\d{2})-(\d{3})$/i);
  if (!match) return null;
  return {
    setPrefix: match[1].toUpperCase(),
    setNumber: match[2],
    cardNumber: match[3],
  };
}

export function getSetCodeFromCardCode(cardCode: string): string | null {
  const parsed = parseCardCode(cardCode);
  if (!parsed) return null;
  return `${parsed.setPrefix.toLowerCase()}${parsed.setNumber}`;
}

export function normalizeCardCode(code: string): string {
  return code.toUpperCase().trim();
}
