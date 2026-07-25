import { prisma } from "./_db";
import {
  getAllGameConfigs,
  isGameDataReady,
} from "../src/lib/game-config";
import { DEFAULT_GAME } from "../src/lib/game/constants";

async function main() {
  const gamesBySlug = new Map<string, { id: number; name: string }>();

  for (const config of getAllGameConfigs()) {
    // Game.isActive mirrors the data plane only. Public catalog activation still
    // requires status + data + routes through isGameLaunchReady().
    const dataReady = isGameDataReady(config);
    const game = await prisma.game.upsert({
      where: { slug: config.slug },
      update: {
        name: config.name,
        nameEn: config.nameEn,
        isActive: dataReady,
      },
      create: {
        slug: config.slug,
        name: config.name,
        nameEn: config.nameEn,
        isActive: dataReady,
      },
    });
    gamesBySlug.set(config.slug, game);
    console.log(
      `Game synced: ${game.name} (id: ${game.id}, data: ${dataReady ? "ready" : "stub"})`,
    );
  }

  const defaultGame = gamesBySlug.get(DEFAULT_GAME);
  if (!defaultGame) {
    throw new Error(`Default game "${DEFAULT_GAME}" is missing from the game registry`);
  }

  const result = await prisma.cardSet.updateMany({
    where: { gameId: null },
    data: { gameId: defaultGame.id },
  });
  console.log(`Linked ${result.count} orphaned sets to ${defaultGame.name}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
