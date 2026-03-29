"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useId, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { z } from "zod"

import { PriceDisplay } from "@/components/shared/price-display"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Price } from "@/components/shared/price-inline"
import { DEFAULT_CARD_CONDITION, MAX_LISTING_QUANTITY, MIN_LISTING_QUANTITY } from "@/lib/constants/ui"
import { useCardSearch } from "@/hooks/use-card-search"

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const

const SHIPPING_OPTIONS = ["EMS/Kerry", "Pickup", "Registered mail"] as const

const listingFormSchema = z.object({
  cardCode: z.string().min(1, "Select a card or enter a code"),
  priceJpy: z.coerce.number().positive("Price must be greater than zero"),
  condition: z.enum(CONDITIONS),
  quantity: z.coerce.number().int().min(MIN_LISTING_QUANTITY).max(MAX_LISTING_QUANTITY),
  description: z.string(),
  shipping: z.array(z.string()),
  location: z.string().min(1, "Location is required"),
})

export type ListingFormData = z.infer<typeof listingFormSchema>

export interface ListingFormProps {
  card?: {
    cardCode: string
    nameJp: string
    nameEn?: string | null
    latestPriceJpy?: number | null
  } | null
  onSubmit: (data: ListingFormData) => void
  isLoading?: boolean
}

type SearchCard = {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  latestPriceJpy: number | null
}

export function ListingForm({ card, onSubmit, isLoading }: ListingFormProps) {
  const formId = useId()
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<SearchCard | null>(null)

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
  } = useCardSearch({ limit: 12, debounceMs: 300 })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema) as Resolver<ListingFormData>,
    defaultValues: {
      cardCode: card?.cardCode ?? "",
      priceJpy: card?.latestPriceJpy != null ? card.latestPriceJpy : ("" as unknown as number),
      condition: DEFAULT_CARD_CONDITION,
      quantity: 1,
      description: "",
      shipping: [],
      location: "",
    },
  })

  const shipping = watch("shipping")
  const cardCodeValue = watch("cardCode")

  const marketHint =
    card?.latestPriceJpy ??
    (selectedPreview?.cardCode === cardCodeValue ? selectedPreview.latestPriceJpy : null)

  useEffect(() => {
    if (card) {
      setValue("cardCode", card.cardCode)
      if (card.latestPriceJpy != null) {
        setValue("priceJpy", card.latestPriceJpy)
      }
      setSelectedPreview({
        cardCode: card.cardCode,
        nameJp: card.nameJp,
        latestPriceJpy: card.latestPriceJpy ?? null,
      })
    }
  }, [card, setValue])

  const toggleShipping = (option: string, checked: boolean) => {
    const next = checked
      ? [...shipping, option]
      : shipping.filter((s) => s !== option)
    setValue("shipping", next, { shouldValidate: true })
  }

  const suggestedLow =
    marketHint != null && marketHint > 0 ? Math.round(marketHint * 0.85) : null
  const suggestedHigh =
    marketHint != null && marketHint > 0 ? Math.round(marketHint * 1.15) : null

  return (
    <form
      id={formId}
      className="space-y-6"
      onSubmit={handleSubmit((data) => onSubmit(data))}
    >
      {card ? (
        <div className="bg-muted/50 space-y-1 rounded-lg border px-3 py-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Listing card
          </p>
          <p className="font-medium">{card.nameEn ?? card.nameJp}</p>
          <p className="text-muted-foreground font-mono text-sm">{card.cardCode}</p>
          {card.latestPriceJpy != null ? (
            <p className="text-sm">
              Market:{" "}
              <PriceDisplay priceJpy={card.latestPriceJpy} showChange={false} size="sm" />
            </p>
          ) : null}
          <input type="hidden" {...register("cardCode")} />
        </div>
      ) : (
        <div className="relative space-y-2">
          <label className="text-sm font-medium" htmlFor={`${formId}-card-search`}>
            Card
          </label>
          <Input
            id={`${formId}-card-search`}
            placeholder="Search by name or code…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            autoComplete="off"
            aria-invalid={!!errors.cardCode}
          />
          {searchOpen && searchQuery.trim().length >= 2 ? (
            <div
              className="bg-popover absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border py-1 shadow-md"
              role="listbox"
            >
              {searchResults.length === 0 ? (
                <p className="text-muted-foreground px-3 py-2 text-sm">No matches</p>
              ) : (
                searchResults.map((c) => (
                  <button
                    key={c.cardCode}
                    type="button"
                    role="option"
                    className="hover:bg-muted block w-full px-3 py-2 text-left text-sm"
                    onClick={() => {
                      setValue("cardCode", c.cardCode, { shouldValidate: true })
                      setSelectedPreview(c)
                      if (c.latestPriceJpy != null) {
                        setValue("priceJpy", c.latestPriceJpy)
                      }
                      setSearchQuery(`${c.nameEn ?? c.nameJp} (${c.cardCode})`)
                      setSearchOpen(false)
                    }}
                  >
                    <span className="line-clamp-1 font-medium">{c.nameEn ?? c.nameJp}</span>
                    <span className="text-muted-foreground font-mono text-xs">{c.cardCode}</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
          <input type="hidden" {...register("cardCode")} />
          {errors.cardCode ? (
            <p className="text-destructive text-sm">{errors.cardCode.message}</p>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${formId}-price`}>
          Price (JPY)
        </label>
        <Input
          id={`${formId}-price`}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          {...register("priceJpy")}
          aria-invalid={!!errors.priceJpy}
        />
        {errors.priceJpy ? (
          <p className="text-destructive text-sm">{errors.priceJpy.message}</p>
        ) : null}
        {suggestedLow != null && suggestedHigh != null && marketHint != null ? (
          <p className="text-muted-foreground text-xs">
            Suggested range around market <Price jpy={marketHint} />: <Price jpy={suggestedLow} /> –{" "}
            <Price jpy={suggestedHigh} />
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Condition</legend>
        <div className="flex flex-wrap gap-3">
          {CONDITIONS.map((c) => (
            <label
              key={c}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              )}
            >
              <input type="radio" value={c} className="accent-primary" {...register("condition")} />
              {c}
            </label>
          ))}
        </div>
        {errors.condition ? (
          <p className="text-destructive text-sm">{errors.condition.message}</p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${formId}-qty`}>
          Quantity
        </label>
        <Input
          id={`${formId}-qty`}
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          step={1}
          {...register("quantity")}
          aria-invalid={!!errors.quantity}
        />
        {errors.quantity ? (
          <p className="text-destructive text-sm">{errors.quantity.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${formId}-desc`}>
          Description
        </label>
        <Textarea
          id={`${formId}-desc`}
          rows={4}
          {...register("description")}
          aria-invalid={!!errors.description}
        />
        {errors.description ? (
          <p className="text-destructive text-sm">{errors.description.message}</p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Shipping</legend>
        <div className="flex flex-col gap-2">
          {SHIPPING_OPTIONS.map((opt) => (
            <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary size-4 rounded border"
                checked={shipping.includes(opt)}
                onChange={(e) => toggleShipping(opt, e.target.checked)}
              />
              {opt}
            </label>
          ))}
        </div>
        {errors.shipping ? (
          <p className="text-destructive text-sm">{errors.shipping.message}</p>
        ) : null}
      </fieldset>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor={`${formId}-loc`}>
          Location
        </label>
        <Input id={`${formId}-loc`} {...register("location")} aria-invalid={!!errors.location} />
        {errors.location ? (
          <p className="text-destructive text-sm">{errors.location.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving…" : "Submit listing"}
      </Button>
    </form>
  )
}
