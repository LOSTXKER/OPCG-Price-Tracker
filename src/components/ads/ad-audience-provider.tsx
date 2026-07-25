"use client"

import {
  useCallback,
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import { useAuthState } from "@/hooks/use-auth-state"
import { useTierLimits } from "@/hooks/use-tier-limits"

import { hasAdInventoryForPath } from "./inventory"

export type AdAudienceState = "PENDING" | "VISIBLE" | "HIDDEN"

type AudienceDecision = {
  routeHasInventory: boolean
  authed: boolean | null
  authError: string | null
  tierLoaded?: boolean
  adFree?: boolean
}

export function resolveAdAudience({
  routeHasInventory,
  authed,
  authError,
  tierLoaded = false,
  adFree = false,
}: AudienceDecision): AdAudienceState {
  if (!routeHasInventory) return "HIDDEN"
  if (authError || authed === null) return "PENDING"
  if (authed === false) return "VISIBLE"
  if (!tierLoaded) return "PENDING"
  return adFree ? "HIDDEN" : "VISIBLE"
}

const AdAudienceContext = createContext<AdAudienceState>("PENDING")

type AdPageContentContextValue = {
  readyPath: string | null
  registerReadyPath: (pathname: string) => () => void
}

const AdPageContentContext = createContext<AdPageContentContextValue>({
  readyPath: null,
  registerReadyPath: () => () => undefined,
})

export function isAdPageContentReady(
  readyPath: string | null,
  pathname: string,
): boolean {
  return readyPath === pathname
}

/**
 * Pages render this marker only once their real content is ready. The global
 * bottom anchor then fails closed during loading, empty, error and not-found
 * states without coupling the root layout to page-specific data fetching.
 */
export function AdPageContentReady() {
  const pathname = usePathname()
  const { registerReadyPath } = useContext(AdPageContentContext)

  useEffect(
    () => registerReadyPath(pathname),
    [pathname, registerReadyPath],
  )

  return null
}

export function useAdPageContentAvailable(): boolean {
  const pathname = usePathname()
  const { readyPath } = useContext(AdPageContentContext)
  return isAdPageContentReady(readyPath, pathname)
}

function AuthenticatedAdAudience({ children }: { children: ReactNode }) {
  const { limits, loaded } = useTierLimits()
  const state = resolveAdAudience({
    routeHasInventory: true,
    authed: true,
    authError: null,
    tierLoaded: loaded,
    adFree: limits.adFree,
  })

  return (
    <AdAudienceContext.Provider value={state}>
      {children}
    </AdAudienceContext.Provider>
  )
}

function AdAudienceResolver({ children }: { children: ReactNode }) {
  const { authed, error } = useAuthState()

  if (authed === true && !error) {
    return <AuthenticatedAdAudience>{children}</AuthenticatedAdAudience>
  }

  const state = resolveAdAudience({
    routeHasInventory: true,
    authed,
    authError: error,
  })

  return (
    <AdAudienceContext.Provider value={state}>
      {children}
    </AdAudienceContext.Provider>
  )
}

export function AdAudienceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [readyPath, setReadyPath] = useState<string | null>(null)
  const registerReadyPath = useCallback((contentPathname: string) => {
    setReadyPath(contentPathname)
    return () => {
      setReadyPath((currentPathname) =>
        currentPathname === contentPathname ? null : currentPathname,
      )
    }
  }, [])
  const contentContext = useMemo(
    () => ({ readyPath, registerReadyPath }),
    [readyPath, registerReadyPath],
  )

  if (!hasAdInventoryForPath(pathname)) {
    return (
      <AdPageContentContext.Provider value={contentContext}>
        <AdAudienceContext.Provider value="HIDDEN">
          {children}
        </AdAudienceContext.Provider>
      </AdPageContentContext.Provider>
    )
  }

  return (
    <AdPageContentContext.Provider value={contentContext}>
      <AdAudienceResolver>{children}</AdAudienceResolver>
    </AdPageContentContext.Provider>
  )
}

export function useAdAudience(): AdAudienceState {
  return useContext(AdAudienceContext)
}
