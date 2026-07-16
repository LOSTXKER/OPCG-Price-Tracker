import { describe, expect, it } from "vitest";

import {
  createWatchlistLoadRevision,
  shouldSettleWatchlistForeground,
} from "./watchlist-load-revision";

describe("watchlist page refresh revision", () => {
  it("rejects an older GET after an optimistic mutation invalidates it", () => {
    const revisions = createWatchlistLoadRevision();
    const delayedGet = revisions.begin();

    revisions.invalidate();

    expect(revisions.isCurrent(delayedGet)).toBe(false);
    const nextGet = revisions.begin();
    expect(revisions.isCurrent(nextGet)).toBe(true);
  });

  it("lets only the newest overlapping refresh apply", () => {
    const revisions = createWatchlistLoadRevision();
    const first = revisions.begin();
    const second = revisions.begin();

    expect(revisions.isCurrent(first)).toBe(false);
    expect(revisions.isCurrent(second)).toBe(true);
  });

  it("blocks refreshes started inside a mutation window and reopens afterward", () => {
    const revisions = createWatchlistLoadRevision();
    revisions.beginMutation();
    const duringMutation = revisions.begin();

    expect(revisions.canApply(duringMutation)).toBe(false);
    expect(revisions.finishMutation()).toBe(true);

    const afterCommit = revisions.begin();
    expect(revisions.canApply(duringMutation)).toBe(false);
    expect(revisions.canApply(afterCommit)).toBe(true);
  });

  it("settles a blocked foreground load without letting it overwrite data", () => {
    const revisions = createWatchlistLoadRevision();
    const foreground = revisions.begin();
    revisions.beginMutation();

    expect(revisions.canApply(foreground)).toBe(false);
    expect(
      shouldSettleWatchlistForeground({
        active: revisions.isActive(),
        background: false,
        completedRevision: foreground,
        foregroundRevision: foreground,
        canApply: revisions.canApply(foreground),
      }),
    ).toBe(true);

    expect(revisions.finishMutation()).toBe(true);
    const finalRefresh = revisions.begin();
    expect(
      shouldSettleWatchlistForeground({
        active: revisions.isActive(),
        background: true,
        completedRevision: finalRefresh,
        foregroundRevision: foreground,
        canApply: revisions.canApply(finalRefresh),
      }),
    ).toBe(true);
  });

  it("does not apply or refresh after the page is disposed", () => {
    const revisions = createWatchlistLoadRevision();
    revisions.beginMutation();
    revisions.dispose();

    expect(revisions.finishMutation()).toBe(false);
    expect(revisions.beginMutation()).toBe(false);
    const afterUnmount = revisions.begin();
    expect(revisions.canApply(afterUnmount)).toBe(false);
    expect(
      shouldSettleWatchlistForeground({
        active: revisions.isActive(),
        background: true,
        completedRevision: afterUnmount,
        foregroundRevision: afterUnmount,
        canApply: revisions.canApply(afterUnmount),
      }),
    ).toBe(false);
  });
});
