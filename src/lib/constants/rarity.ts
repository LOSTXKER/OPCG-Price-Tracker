/**
 * Canonical rarity color definitions. Import from here instead of
 * duplicating color maps across components.
 */

export const RARITY_BADGE_ACCENT: Record<string, { text: string; bg: string }> = {
  TR: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/8" },
  SEC: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/8" },
  "P-SEC": { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/8" },
  SP: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/8" },
  "P-SP": { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/8" },
  SR: { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/8" },
  "P-SR": { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/8" },
  R: { text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/8" },
  "P-R": { text: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/8" },
  L: { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/8" },
  "P-L": { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/8" },
  DON: { text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/8" },
};

export const RARITY_BAR_COLOR: Record<string, string> = {
  SP: "bg-pink-500",
  "P-SP": "bg-pink-500",
  "P-SEC": "bg-amber-500",
  SEC: "bg-amber-500",
  "P-SR": "bg-purple-500",
  SR: "bg-purple-500",
  "P-R": "bg-blue-500",
  R: "bg-blue-500",
  L: "bg-orange-500",
  "P-L": "bg-orange-500",
  "P-UC": "bg-emerald-500",
  UC: "bg-emerald-500",
  "P-C": "bg-neutral-400",
  C: "bg-neutral-400",
  DON: "bg-red-500",
  TR: "bg-red-500",
};

export const RARITY_HEX: Record<string, string> = {
  SEC: "#F59E0B",
  SR: "#8B5CF6",
  R: "#3B82F6",
  UC: "#22C55E",
  C: "#6B7280",
  L: "#EF4444",
  SP: "#EC4899",
  "P-SEC": "#F59E0B",
  "P-SR": "#8B5CF6",
  "P-R": "#3B82F6",
  "P-UC": "#22C55E",
  "P-C": "#6B7280",
  "P-L": "#EF4444",
  "P-SP": "#EC4899",
  DON: "#EF4444",
  TR: "#EF4444",
};
