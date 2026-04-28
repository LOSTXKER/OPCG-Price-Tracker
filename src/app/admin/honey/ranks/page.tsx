import { getRankTiers } from "@/lib/honey/rank-tiers-server";

import { RankTiersEditor } from "./rank-tiers-editor";

export const dynamic = "force-dynamic";

export default async function AdminRanksPage() {
  const tiers = await getRankTiers();
  return <RankTiersEditor initialTiers={tiers} />;
}
