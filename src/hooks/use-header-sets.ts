"use client"

import { useCallback, useEffect, useState } from "react"

import { apiGet } from "@/lib/api/client"
import type { SetPickerItem } from "@/components/shared/set-picker"

type HeaderSetApiItem = Omit<SetPickerItem, "cardCount"> & {
  _count?: { cards?: number }
}

export function mapHeaderSetResponse(items: HeaderSetApiItem[]): SetPickerItem[] {
  return items.map(({ _count, ...item }) => ({
    ...item,
    cardCount: _count?.cards,
  }))
}

/**
 * One shared fetch for both responsive header render paths. Desktop and mobile
 * stay mounted together and are hidden with CSS, so fetching inside each
 * navigator would duplicate the same request on every page.
 */
export function useHeaderSets(game: string) {
  const [revision, setRevision] = useState(0)
  const requestKey = `${game}:${revision}`
  const [request, setRequest] = useState<{
    key: string
    sets: SetPickerItem[]
    status: "loading" | "ready" | "error"
  }>({ key: requestKey, sets: [], status: "loading" })

  const retry = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    void apiGet<{ sets?: HeaderSetApiItem[] }>(
      `/api/sets?game=${encodeURIComponent(game)}`,
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setRequest({
            key: requestKey,
            sets: mapHeaderSetResponse(data.sets ?? []),
            status: "ready",
          })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setRequest({ key: requestKey, sets: [], status: "error" })
        }
      })

    return () => controller.abort()
  }, [game, requestKey])

  const isCurrentRequest = request.key === requestKey

  return {
    sets: isCurrentRequest ? request.sets : [],
    loading: !isCurrentRequest || request.status === "loading",
    error: isCurrentRequest && request.status === "error",
    retry,
  }
}
