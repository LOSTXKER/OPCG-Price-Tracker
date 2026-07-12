/**
 * Hash a stable seed (typically a user id) into a solid Tailwind colour
 * so fallback avatars look distinctive but remain
 * deterministic (same user = same colours every render / page).
 *
 * GitHub-style identicon idea: cheap, no extra image asset, and removes the
 * generic "?" placeholder for users who haven't uploaded an avatar yet.
 */
const COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-lime-600",
] as const;

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return COLORS[Math.abs(h) % COLORS.length];
}
