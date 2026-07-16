"use client"

import { useId, useState, type ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import type { PortfolioMutationResult } from "@/lib/types/portfolio"
import { cn } from "@/lib/utils"

export type PortfolioCreateInput = {
  name: string
  isPublic: boolean
}

export type PortfolioCreateCopy = {
  nameLabel: string
  namePlaceholder?: string
  visibilityLabel: string
  publicLabel: string
  publicDescription?: string
  privateLabel: string
  privateDescription?: string
  submitLabel: string
  submittingLabel: string
  cancelLabel: string
  genericError: string
  nameRequiredError: string
  visibilityRequiredError: string
}

type VisibilityValue = "unselected" | "private" | "public"
type PortfolioCreateSuccess<TData> = Extract<
  PortfolioMutationResult<TData>,
  { ok: true }
>

export type PortfolioCreateHandler<TData = unknown> = (
  name: string,
  isPublic: boolean,
) => Promise<PortfolioMutationResult<TData>>

export type PortfolioCreateFormProps<TData> = {
  onCreate: PortfolioCreateHandler<TData>
  onCreated?: (
    result: PortfolioCreateSuccess<TData>,
    input: PortfolioCreateInput,
  ) => void
  onCancel?: () => void
  onPendingChange?: (pending: boolean) => void
  copy: PortfolioCreateCopy
  className?: string
}

/**
 * Shared create form for every portfolio entry point. Visibility intentionally
 * starts unselected: creating a public or private portfolio is always an
 * explicit user choice.
 */
export function PortfolioCreateForm<TData = unknown>({
  onCreate,
  onCreated,
  onCancel,
  onPendingChange,
  copy,
  className,
}: PortfolioCreateFormProps<TData>) {
  const nameId = useId()
  const errorId = useId()
  const [name, setName] = useState("")
  const [visibility, setVisibility] = useState<VisibilityValue>("unselected")
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const trimmedName = name.trim()
  const nameInvalid = attempted && trimmedName.length === 0
  const visibilityInvalid = attempted && visibility === "unselected"
  const validationError = nameInvalid
    ? copy.nameRequiredError
    : visibilityInvalid
      ? copy.visibilityRequiredError
      : null
  const visibleError = requestError ?? validationError
  const canSubmit = trimmedName.length > 0 && visibility !== "unselected"

  const submit = async () => {
    setAttempted(true)
    setRequestError(null)
    if (!canSubmit || pending) return

    const input: PortfolioCreateInput = {
      name: trimmedName,
      isPublic: visibility === "public",
    }

    setPending(true)
    onPendingChange?.(true)
    try {
      const result = await onCreate(input.name, input.isPublic)
      if (!result.ok) {
        setRequestError(result.error || copy.genericError)
        return
      }
      onCreated?.(result, input)
    } catch {
      setRequestError(copy.genericError)
    } finally {
      setPending(false)
      onPendingChange?.(false)
    }
  }

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      aria-describedby={visibleError ? errorId : undefined}
    >
      <div className="space-y-1.5">
        <label htmlFor={nameId} className="text-label">
          {copy.nameLabel}
        </label>
        <Input
          id={nameId}
          name="portfolioName"
          autoFocus
          aria-required="true"
          maxLength={120}
          value={name}
          placeholder={copy.namePlaceholder}
          aria-invalid={nameInvalid || undefined}
          aria-describedby={nameInvalid ? errorId : undefined}
          disabled={pending}
          className="h-11 sm:h-10"
          onChange={(event) => {
            setName(event.target.value)
            setRequestError(null)
          }}
        />
      </div>

      <fieldset className="space-y-1.5" disabled={pending} aria-required="true">
        <legend className="text-label">{copy.visibilityLabel}</legend>
        <SegmentedControl<VisibilityValue>
          value={visibility}
          options={[
            { value: "private", label: copy.privateLabel },
            { value: "public", label: copy.publicLabel },
          ]}
          onChange={(value) => {
            setVisibility(value)
            setRequestError(null)
          }}
          ariaLabel={copy.visibilityLabel}
          fullWidth
          className={cn(
            "w-full",
            visibilityInvalid && "ring-2 ring-destructive/30",
          )}
        />
        {visibility !== "unselected" && (
          <p className="text-meta" aria-live="polite">
            {visibility === "public"
              ? copy.publicDescription
              : copy.privateDescription}
          </p>
        )}
      </fieldset>

      <div id={errorId} role={visibleError ? "alert" : undefined} aria-live="polite" className="min-h-5 text-meta text-destructive">
        {visibleError}
      </div>

      <DialogFooter>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            {copy.cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? copy.submittingLabel : copy.submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

export type PortfolioCreateDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: PortfolioCreateHandler<TData>
  onCreated?: (
    result: PortfolioCreateSuccess<TData>,
    input: PortfolioCreateInput,
  ) => void
  title: string
  description?: string
  copy: PortfolioCreateCopy
  finalFocus?: ComponentProps<typeof DialogContent>["finalFocus"]
}

export function shouldAcceptPortfolioDialogOpenChange(
  nextOpen: boolean,
  pending: boolean,
): boolean {
  return nextOpen || !pending
}

/** Centered canonical dialog wrapper around PortfolioCreateForm. */
export function PortfolioCreateDialog<TData = unknown>({
  open,
  onOpenChange,
  onCreate,
  onCreated,
  title,
  description,
  copy,
  finalFocus,
}: PortfolioCreateDialogProps<TData>) {
  const [pending, setPending] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (shouldAcceptPortfolioDialogOpenChange(nextOpen, pending)) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!pending}
        finalFocus={finalFocus}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <PortfolioCreateForm
          onCreate={onCreate}
          onCreated={(result, input) => {
            onCreated?.(result, input)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
          onPendingChange={setPending}
          copy={copy}
        />
      </DialogContent>
    </Dialog>
  )
}
