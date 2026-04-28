import { cn } from "@/lib/utils"

/**
 * Lightweight syntactic highlighter for One Piece TCG card effect text.
 *
 * Rules (all language-agnostic, but tuned for JP/EN/TH conventions):
 * 1. Trigger labels in [brackets] (full-width or half-width) → secondary badge
 * 2. DON!! / ดอน!! / TRIGGER tokens → amber emphasis
 * 3. Cost numbers in (parentheses) — single digit or `(2)` style → pill
 * 4. Newlines preserved.
 *
 * The component intentionally does NOT try to parse semantics — it just
 * makes the wall of text scannable in 1s instead of 5s.
 */

const TRIGGER_TOKENS = /(DON!!|ดอน!!|ドン!!|TRIGGER|トリガー|ทริกเกอร์)/g

// [Bracket] labels — tolerant of full-width 「」, half-width [], JP 【】
const BRACKET_REGEX = /(\[[^\]]+\]|【[^】]+】|「[^」]+」)/g

// Standalone (1) (2) (10) — short numeric parens ≤ 3 digits.
// Avoids matching long "(see rules)" by length cap.
const COST_REGEX = /\((\d{1,3})\)/g

function renderInlineSegment(segment: string, keyPrefix: string) {
  // Highlight DON!! / TRIGGER tokens within plain text segments
  const parts = segment.split(TRIGGER_TOKENS)
  return parts.map((part, i) => {
    if (TRIGGER_TOKENS.test(part)) {
      // Reset the regex stateful flag (lastIndex) when reusing
      TRIGGER_TOKENS.lastIndex = 0
      return (
        <span
          key={`${keyPrefix}-trig-${i}`}
          className="font-bold text-amber-500"
        >
          {part}
        </span>
      )
    }
    return <span key={`${keyPrefix}-txt-${i}`}>{part}</span>
  })
}

function tokenize(line: string, lineKey: string) {
  // First split out cost-number parens, then bracket labels, then trigger tokens
  // We process bracket and cost in one pass via a combined regex.
  const combined = new RegExp(
    `${BRACKET_REGEX.source}|${COST_REGEX.source}`,
    "g",
  )

  const out: React.ReactNode[] = []
  let lastIdx = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = combined.exec(line)) !== null) {
    const idx = match.index
    if (idx > lastIdx) {
      out.push(
        <span key={`${lineKey}-pre-${i}`}>
          {renderInlineSegment(line.slice(lastIdx, idx), `${lineKey}-pre-${i}`)}
        </span>,
      )
    }

    const fullMatch = match[0]
    if (/^\d/.test(fullMatch.slice(1))) {
      // Cost paren — like (1)
      out.push(
        <span
          key={`${lineKey}-cost-${i}`}
          className="mx-0.5 inline-flex items-center justify-center rounded-md bg-amber-500/10 px-1.5 py-px font-mono text-micro tabular-nums text-amber-600 dark:text-amber-400"
        >
          {fullMatch}
        </span>,
      )
    } else {
      // Bracket label
      out.push(
        <span
          key={`${lineKey}-br-${i}`}
          className="mr-1 inline-flex items-center rounded-md bg-secondary px-1.5 py-px text-micro font-medium text-secondary-foreground"
        >
          {fullMatch}
        </span>,
      )
    }

    lastIdx = idx + fullMatch.length
    i++
  }

  if (lastIdx < line.length) {
    out.push(
      <span key={`${lineKey}-tail`}>
        {renderInlineSegment(line.slice(lastIdx), `${lineKey}-tail`)}
      </span>,
    )
  }

  return out
}

export function CardEffectText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const lines = text.split(/\r?\n/)
  return (
    <div
      className={cn(
        "break-words text-sm leading-relaxed",
        className,
      )}
    >
      {lines.map((line, idx) => {
        if (line.trim() === "") {
          return <div key={`empty-${idx}`} className="h-2" aria-hidden />
        }
        return (
          <p key={`line-${idx}`} className="whitespace-pre-wrap">
            {tokenize(line, `l${idx}`)}
          </p>
        )
      })}
    </div>
  )
}
