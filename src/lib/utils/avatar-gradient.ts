/**
 * Hash a stable seed (typically a user id) into a Tailwind gradient
 * `from-X to-Y` pair so that fallback avatars look distinctive but are
 * deterministic (same user = same colours every render / page).
 *
 * GitHub-style identicon idea: cheap, no extra image asset, and removes the
 * generic "?" placeholder for users who haven't uploaded an avatar yet.
 */
const PALETTES = [
  "from-rose-500 to-orange-400",
  "from-amber-500 to-yellow-300",
  "from-emerald-500 to-teal-400",
  "from-sky-500 to-indigo-400",
  "from-violet-500 to-fuchsia-400",
  "from-pink-500 to-rose-400",
  "from-cyan-500 to-blue-400",
  "from-lime-500 to-emerald-400",
] as const;

export function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return PALETTES[Math.abs(h) % PALETTES.length];
}
