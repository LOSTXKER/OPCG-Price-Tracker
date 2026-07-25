import {
  getAllGameConfigs,
  getGameConfig,
  getGameDataReadinessIssues,
  isGameLaunchReady,
} from "../src/lib/game-config";
import type { GameDataReadinessSnapshot } from "../src/lib/game-config";

import { prisma } from "./_db";

async function getSnapshot(slug: string): Promise<GameDataReadinessSnapshot> {
  const game = await prisma.game.findUnique({
    where: { slug },
    select: { id: true, isActive: true },
  });

  if (!game) {
    return {
      rowExists: false,
      databaseActive: false,
      linkedSetCount: 0,
      linkedCardCount: 0,
      pricedCardCount: 0,
    };
  }

  const [linkedSetCount, linkedCardCount, pricedCardCount] = await Promise.all([
    prisma.cardSet.count({ where: { gameId: game.id } }),
    prisma.card.count({ where: { set: { gameId: game.id } } }),
    prisma.card.count({
      where: {
        set: { gameId: game.id },
        latestPriceJpy: { gt: 0 },
      },
    }),
  ]);

  return {
    rowExists: true,
    databaseActive: game.isActive,
    linkedSetCount,
    linkedCardCount,
    pricedCardCount,
  };
}

async function main() {
  const requestedSlug = process.argv[2];
  const requestedConfig = requestedSlug ? getGameConfig(requestedSlug) : undefined;

  if (requestedSlug && !requestedConfig) {
    throw new Error(`Unknown registered game: ${requestedSlug}`);
  }

  const configs = requestedConfig ? [requestedConfig] : getAllGameConfigs();
  const failures: string[] = [];

  for (const config of configs) {
    const snapshot = await getSnapshot(config.slug);
    const issues = getGameDataReadinessIssues(config, snapshot);
    failures.push(...issues);

    console.log(
      [
        config.slug,
        `launch=${isGameLaunchReady(config) ? "ready" : "blocked"}`,
        `db=${
          snapshot.rowExists
            ? snapshot.databaseActive
              ? "ready"
              : "inactive"
            : "missing"
        }`,
        `sets=${snapshot.linkedSetCount}`,
        `cards=${snapshot.linkedCardCount}`,
        `priced=${snapshot.pricedCardCount}`,
      ].join(" · "),
    );
  }

  if (failures.length > 0) {
    throw new Error(`Game launch preflight failed:\n- ${failures.join("\n- ")}`);
  }

  console.log("Game launch preflight passed");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
