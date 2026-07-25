import type { GameConfig } from "./types";

export interface GameDataReadinessSnapshot {
  rowExists: boolean;
  databaseActive: boolean;
  linkedSetCount: number;
  linkedCardCount: number;
  pricedCardCount: number;
}

/**
 * Pure half of the release preflight. The CLI supplies live database counts;
 * this function keeps the acceptance rules deterministic and unit-testable.
 */
export function getGameDataReadinessIssues(
  config: GameConfig,
  snapshot: GameDataReadinessSnapshot,
): string[] {
  const issues: string[] = [];
  const expectedDataReady = config.release.data === "READY";

  if (!snapshot.rowExists) {
    return [`${config.slug}: missing Game row`];
  }

  if (snapshot.databaseActive !== expectedDataReady) {
    issues.push(
      `${config.slug}: Game.isActive must be ${expectedDataReady} to mirror release.data`,
    );
  }

  if (!expectedDataReady) return issues;

  if (snapshot.linkedSetCount === 0) {
    issues.push(`${config.slug}: no sets are linked to the Game row`);
  }
  if (snapshot.linkedCardCount === 0) {
    issues.push(`${config.slug}: no cards are linked through a game-owned set`);
  }
  if (snapshot.pricedCardCount === 0) {
    issues.push(`${config.slug}: no game-owned cards have a positive market price`);
  }

  return issues;
}
