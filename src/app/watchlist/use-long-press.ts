"use client";

import { useCallback, useRef } from "react";
import type { MouseEvent, TouchEvent } from "react";

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Long-press gesture for a row that's ALSO a tap-to-navigate `<Link>` (the
 * mobile watchlist row's action sheet). Cancels on scroll/drag past a small
 * tolerance so flicking through the list doesn't fire it, and suppresses the
 * click that follows a fired long-press so the row doesn't also navigate.
 * Right-click / context-menu fires it too (desktop trackpads, testing).
 */
export function useLongPress(onLongPress: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    originRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      const touch = event.touches[0];
      originRef.current = { x: touch.clientX, y: touch.clientY };
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    [onLongPress],
  );

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      const origin = originRef.current;
      if (!origin) return;
      const touch = event.touches[0];
      const dx = Math.abs(touch.clientX - origin.x);
      const dy = Math.abs(touch.clientY - origin.y);
      if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clearTimer();
    },
    [clearTimer],
  );

  const onTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      firedRef.current = true;
      onLongPress();
    },
    [onLongPress],
  );

  // A fired long-press is still followed by a synthetic `click` on release —
  // swallow that one so the row's <Link> doesn't also navigate.
  const onClickCapture = useCallback((event: MouseEvent) => {
    if (!firedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    firedRef.current = false;
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd, onContextMenu, onClickCapture };
}
