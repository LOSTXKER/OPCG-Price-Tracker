"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Chrome's non-standard install event. Firing it is the ONLY way to open the
 * real install sheet — a button that calls anything else cannot install a PWA.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * How this visitor's browser can add the site to the home screen:
 * - `prompt` — Android Chrome / Edge / Samsung: we hold the event, one tap installs.
 * - `ios`    — iOS Safari: there is no API at all, so the most we can do is
 *              point at the Share sheet and let them do it.
 * - `none`   — already installed, still unknown (server / first render), or a
 *              browser that simply cannot install (desktop Firefox, Chrome on
 *              iOS, in-app webviews). Show nothing.
 */
export type InstallMethod = "prompt" | "ios" | "none";

/** Remembers a dismissal so the invitation doesn't nag on every page load. */
const DISMISS_KEY = "meecard-install-dismissed";
/** A dismissal is a "not now", not a "never" — ask again after this long. */
const DISMISS_DAYS = 30;

type InstallState = {
  method: InstallMethod;
  installed: boolean;
  dismissed: boolean;
};

/**
 * Platform state lives in a MODULE-level store, not in component state, for two
 * reasons that both bite in production:
 *
 * 1. `beforeinstallprompt` fires once, on Chrome's schedule, and can easily
 *    beat React's hydration. A listener installed inside a component effect
 *    misses it and the install button never appears. This module attaches its
 *    listener the moment it is imported, and also picks up the event that the
 *    tiny head script in `layout.tsx` may have caught even earlier.
 * 2. The values are global to the tab — every surface that offers "เพิ่มไปหน้าจอ
 *    โฮม" (header, `/more`, a banner) must agree, and dismissing in one has to
 *    silence the others immediately.
 */
const SERVER_STATE: InstallState = { method: "none", installed: false, dismissed: false };

let state: InstallState = SERVER_STATE;
let deferred: BeforeInstallPromptEvent | null = null;
let initialised = false;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setState(patch: Partial<InstallState>) {
  const next = { ...state, ...patch };
  if (
    next.method === state.method &&
    next.installed === state.installed &&
    next.dismissed === state.dismissed
  ) {
    return;
  }
  state = next;
  emit();
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari never reports the standard display-mode — it has its own flag.
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

/**
 * Pure so it can be tested against real user-agent strings — this is the check
 * that decides whether someone is shown Share-sheet instructions they can
 * actually follow, and getting it wrong is invisible on a desktop machine.
 *
 * `touchPoints` covers the iPad that reports itself as "Macintosh" in desktop
 * mode; a real Mac reports 0.
 */
export function detectIosSafari(ua: string, touchPoints: number): boolean {
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && touchPoints > 1);
  if (!iOS) return false;
  // Chrome/Firefox/Edge/Opera on iOS are Safari underneath but CANNOT install —
  // only real Safari carries "Add to Home Screen" in its Share sheet.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

/** `true` while a dismissal recorded at `at` should still keep us quiet. */
export function isDismissalActive(at: number, now: number): boolean {
  if (!Number.isFinite(at)) return false;
  const age = now - at;
  // A clock that moved backwards (timezone edit, restored backup) would make
  // `age` negative and silence us forever — treat that as expired.
  if (age < 0) return false;
  return age < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function isIosSafari(): boolean {
  return detectIosSafari(window.navigator.userAgent, window.navigator.maxTouchPoints);
}

function readDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return isDismissalActive(Number(raw), Date.now());
  } catch {
    // Private mode / blocked storage: treat as "never dismissed" rather than
    // hiding the feature outright.
    return false;
  }
}

function captureEvent(event: Event) {
  // Suppress Chrome's own mini-infobar so ours is the only invitation.
  event.preventDefault();
  deferred = event as BeforeInstallPromptEvent;
  setState({ method: "prompt" });
}

function onInstalled() {
  deferred = null;
  setState({ method: "none", installed: true });
}

/**
 * Runs once, on first subscribe — never during render, so the first client
 * render still matches the server's and hydration stays clean.
 */
function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  window.addEventListener("beforeinstallprompt", captureEvent);
  window.addEventListener("appinstalled", onInstalled);

  // The head script may have caught the event before this module was even
  // parsed — adopt whatever it is holding.
  const early = (window as Window & { __mcInstallEvent?: BeforeInstallPromptEvent })
    .__mcInstallEvent;

  if (isStandalone()) {
    setState({ installed: true, method: "none" });
    return;
  }

  setState({
    dismissed: readDismissed(),
    method: early ? "prompt" : isIosSafari() ? "ios" : "none",
  });
  if (early) deferred = early;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  init();
  // `init()` may have changed the snapshot before this subscriber was counted —
  // nudge it once so a late mount doesn't sit on the server's empty state.
  queueMicrotask(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => SERVER_STATE;

/**
 * Everything a surface needs to offer "เพิ่มไปหน้าจอโฮม", in one place, so the
 * header, `/more` and any banner all agree on when it can be offered.
 *
 * On the server and on the first client render `method` is `"none"` — the
 * checks it rests on (display mode, user agent, a Chrome event that arrives
 * after load) only exist in the browser. Callers therefore render nothing at
 * first and the control appears on mount; that is intentional and hydration-safe.
 */
export function useInstallPrompt() {
  const { method, installed, dismissed } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const dismiss = useCallback(() => {
    setState({ dismissed: true });
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Storage blocked — the dismissal still holds for this page view.
    }
  }, []);

  /**
   * Opens the browser's install sheet. Resolves `true` only if the visitor
   * actually accepted. The deferred event is single-use — Chrome refuses a
   * second `prompt()` on the same one — so it is dropped either way.
   */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferred) return false;
    const event = deferred;
    deferred = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") {
      // `appinstalled` follows and flips `installed`; clearing the method here
      // hides the button in the same frame as the accept.
      setState({ method: "none" });
      return true;
    }
    // Declining the browser's own sheet is itself a "not now" — respect it, or
    // the button re-arms the instant the sheet closes. `method` drops to "none"
    // as well because the spent event cannot be re-prompted: leaving it at
    // "prompt" would leave a button in `/more` that silently does nothing.
    // Chrome re-fires `beforeinstallprompt` on the next full page load, which
    // re-arms `/more` while the 30-day dismissal keeps the header quiet.
    dismiss();
    setState({ method: "none" });
    return false;
  }, [dismiss]);

  return {
    /** How this browser can install, once known on the client. */
    method,
    /** Already launched from the home screen — never offer to install again. */
    installed,
    /** Turned down within the last 30 days. */
    dismissed,
    /** May we show a *proactive* invitation right now? */
    canInvite: !installed && !dismissed && method !== "none",
    /** May we show an *asked-for* entry point (e.g. a row in "ดูเพิ่มเติม")? */
    canInstall: !installed && method !== "none",
    promptInstall,
    dismiss,
  };
}
