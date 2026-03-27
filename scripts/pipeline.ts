/**
 * Pipeline orchestrator — runs the full card data pipeline.
 *
 * Usage:
 *   npx tsx scripts/pipeline.ts                    # full pipeline
 *   npx tsx scripts/pipeline.ts --wipe             # wipe DB first
 *   npx tsx scripts/pipeline.ts --skip=3           # skip step 3 (images)
 *   npx tsx scripts/pipeline.ts --sets=op13,op14   # only process specific sets
 *   npx tsx scripts/pipeline.ts --only=1,2         # only run steps 1+2
 *
 * Steps:
 *   1. Scrape Official Bandai → data/cards/*.json (master data, incl. SP reprints)
 *   2. Seed cards → DB (from JSON files)
 *   3. Upload images → Supabase Storage
 *   4. Yuyutei → match prices to existing cards
 *   5. Seed drop rates
 */
import { execSync } from "child_process";

const args = process.argv.slice(2);

const wipe = args.includes("--wipe");
const skipArg = args.find((a) => a.startsWith("--skip="));
const onlyArg = args.find((a) => a.startsWith("--only="));
const setsArg = args.find((a) => a.startsWith("--sets="));

const skip = new Set(
  skipArg
    ? skipArg
        .replace("--skip=", "")
        .split(",")
        .map((s) => parseInt(s, 10))
    : []
);
const only = onlyArg
  ? new Set(
      onlyArg
        .replace("--only=", "")
        .split(",")
        .map((s) => parseInt(s, 10))
    )
  : null;
const setsFilter = setsArg ? setsArg.replace("--sets=", "") : "";

function shouldRun(step: number): boolean {
  if (only) return only.has(step);
  return !skip.has(step);
}

function run(label: string, cmd: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`  $ ${cmd}`);
  console.log("=".repeat(60));
  execSync(cmd, { stdio: "inherit" });
}

async function main() {
  const startTime = Date.now();

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   MeeCard — Data Pipeline                ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  wipe: ${wipe}, sets: ${setsFilter || "all"}`);

  const setsArgs = setsFilter ? ` ${setsFilter.split(",").join(" ")}` : "";
  const setsFlag = setsFilter ? ` --sets=${setsFilter}` : "";

  if (shouldRun(1)) {
    run("Step 1: Official Bandai → JSON files", `npx tsx scripts/scrape-official.ts${setsArgs}`);
  }

  if (shouldRun(2)) {
    const wipeFlag = wipe ? " --wipe" : "";
    run("Step 2: Seed cards → DB", `npx tsx scripts/seed-cards.ts${wipeFlag}${setsArgs}`);
  }

  if (shouldRun(3)) {
    run("Step 3: Upload images → Supabase Storage", `npx tsx scripts/upload-images.ts${setsFlag}`);
  }

  if (shouldRun(4)) {
    run("Step 4: Yuyutei → Match prices", `npx tsx scripts/pipeline-yuyutei.ts${setsFlag}`);
  }

  if (shouldRun(5)) {
    run("Step 5: Seed drop rates", `npx tsx scripts/seed-drop-rates.ts`);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  Pipeline complete in ${elapsed} minutes`);
  console.log("=".repeat(60));
}

main().catch((e) => {
  console.error("Pipeline failed:", e);
  process.exit(1);
});
