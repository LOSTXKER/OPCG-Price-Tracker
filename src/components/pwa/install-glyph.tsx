/**
 * A phone with a download arrow inside its screen — the mark for "put Meecard
 * on this device". Hand-drawn because lucide has no phone-with-an-action icon,
 * and the obvious workaround (a device glyph with a `+` badge stuck on the
 * corner) hangs off the round button's edge at 18px.
 *
 * Drawn in lucide's language — 24 box, 2px strokes, round caps — so it sits
 * beside `Heart` and `Bell` in the header without looking like a foreign part.
 * Two departures from lucide's own `Smartphone`, both for legibility at 18px:
 * the body is wider (16 instead of 14) to leave the arrow room, and the home
 * indicator is gone — at this size that line and the arrow merge into a smudge.
 *
 * `mark="plus"` swaps the arrow for a plus: same shape, but a plus reads as
 * "add" rather than "download", which never suggests fetching a file.
 */
export function InstallGlyph({
  mark = "arrow",
  className,
}: {
  mark?: "arrow" | "plus";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="4" y="2" width="16" height="20" rx="3" />
      {mark === "arrow" ? (
        <>
          <path d="M12 7v7" />
          <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
        </>
      ) : (
        <>
          <path d="M12 7.5v7" />
          <path d="M8.5 11h7" />
        </>
      )}
    </svg>
  );
}
