/**
 * The destructive error box shared by every auth form. Presentation-only — the
 * caller owns the error state and all message derivation. Renders nothing when
 * there is no message.
 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  )
}
