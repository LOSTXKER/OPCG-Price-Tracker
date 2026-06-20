import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The app's semantic typography tokens (see globals.css) are custom `text-*` classes.
// Stock tailwind-merge doesn't know them, so it lumps them into the text-COLOR group —
// meaning `cn("text-micro", "text-foreground")` would DROP the size token and the element
// inherits a larger font (this silently oversized every chip built with cn). Registering
// them as font-size lets size + colour coexist, while size↔size conflicts still resolve.
const TYPOGRAPHY_TOKENS = [
  "display", "h1", "h2", "h3", "h4", "h5",
  "body", "body-sm", "label", "meta", "eyebrow",
  "micro", "overlay", "code", "price", "price-lg",
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: TYPOGRAPHY_TOKENS }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
