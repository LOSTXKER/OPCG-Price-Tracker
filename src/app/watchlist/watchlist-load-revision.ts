export interface WatchlistLoadRevision {
  activate: () => void;
  dispose: () => void;
  begin: () => number;
  invalidate: () => void;
  beginMutation: () => boolean;
  finishMutation: () => boolean;
  isActive: () => boolean;
  isCurrent: (revision: number) => boolean;
  canApply: (revision: number) => boolean;
}

interface SettleForegroundInput {
  active: boolean;
  background: boolean;
  completedRevision: number;
  foregroundRevision: number | null;
  canApply: boolean;
}

export function shouldSettleWatchlistForeground({
  active,
  background,
  completedRevision,
  foregroundRevision,
  canApply,
}: SettleForegroundInput): boolean {
  if (!active || foregroundRevision === null) return false;
  return (
    foregroundRevision === completedRevision ||
    (background && canApply)
  );
}

/**
 * Tiny request-generation guard for page-owned watchlist refreshes. A mutation
 * invalidates every older GET so a late response cannot resurrect removed rows
 * or overwrite the shared heart-state snapshot.
 */
export function createWatchlistLoadRevision(): WatchlistLoadRevision {
  let current = 0;
  let activeMutations = 0;
  let active = true;
  return {
    activate: () => {
      active = true;
    },
    dispose: () => {
      active = false;
      current += 1;
    },
    begin: () => ++current,
    invalidate: () => {
      current += 1;
    },
    beginMutation: () => {
      if (!active) return false;
      activeMutations += 1;
      current += 1;
      return true;
    },
    finishMutation: () => {
      activeMutations = Math.max(0, activeMutations - 1);
      return active && activeMutations === 0;
    },
    isActive: () => active,
    isCurrent: (revision) => revision === current,
    canApply: (revision) =>
      active && revision === current && activeMutations === 0,
  };
}
