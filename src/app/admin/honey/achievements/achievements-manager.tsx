"use client";

import { useState } from "react";
import { Plus, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";

type Achievement = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  criteria: Record<string, unknown>;
  honeyReward: number;
  badgeImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { users: number };
};

const filterSelectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30";

// Keep in sync with `AchievementCriteriaSchema` in `src/lib/honey/schemas.ts`
// and the branches in `batchFetchStats` (`src/lib/honey/achievements.ts`).
const CRITERIA_OPTIONS: { value: string; label: string }[] = [
  { value: "portfolio_count",        label: "Portfolio Count (cards added)" },
  { value: "checkin_streak",         label: "Check-in Streak (consecutive days)" },
  { value: "first_sell",             label: "First Sell (target=1)" },
  { value: "trades_count",           label: "Trades Count (marketplace sells)" },
  { value: "first_review",           label: "First Review (target=1)" },
  { value: "review_count",           label: "Review Count (reviews authored)" },
  { value: "correct_predictions",    label: "Correct Predictions" },
  { value: "prediction_count",       label: "Prediction Count (attempts)" },
  { value: "referral_count",         label: "Referral Count (users referred)" },
  { value: "honey_lifetime",         label: "Honey Lifetime Earned" },
  { value: "watchlist_count",        label: "Watchlist Count" },
  { value: "deck_count",             label: "Deck Count" },
  { value: "deck_share_count",       label: "Deck Share Count (public decks)" },
  { value: "community_price_count",  label: "Community Price Submissions" },
  { value: "order_buy_count",        label: "Order Buy Count (completed)" },
  { value: "perfect_day_count",      label: "Perfect Day Count" },
  { value: "raffle_win_count",       label: "Raffle Win Count" },
];

export function AchievementsManager({ initialAchievements }: { initialAchievements: Achievement[] }) {
  const [achievements, setAchievements] = useState(initialAchievements);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    nameEn: "",
    nameTh: "",
    description: "",
    criteriaType: "portfolio_count",
    criteriaTarget: 100,
    honeyReward: 50,
  });

  const handleCreate = async () => {
    const res = await fetch("/api/admin/honey/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        name: form.name,
        nameEn: form.nameEn || undefined,
        nameTh: form.nameTh || undefined,
        description: form.description || undefined,
        criteria: { type: form.criteriaType, target: form.criteriaTarget },
        honeyReward: form.honeyReward,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAchievements((prev) => [{ ...data.achievement, _count: { users: 0 } }, ...prev]);
      setShowForm(false);
      setForm({ code: "", name: "", nameEn: "", nameTh: "", description: "", criteriaType: "portfolio_count", criteriaTarget: 100, honeyReward: 50 });
      toast.success("Achievement created");
    } else {
      toast.error("Failed to create achievement");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Achievements"
        icon={Trophy}
        badge={<Badge variant="secondary">{achievements.length} total</Badge>}
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> New Achievement
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardContent>
            <h2 className="mb-3 text-h3">Create Achievement</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Code (e.g. portfolio_100)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              <Input placeholder="Name (JP)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input placeholder="Name (EN)" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
              <Input placeholder="Name (TH)" value={form.nameTh} onChange={(e) => setForm((f) => ({ ...f, nameTh: e.target.value }))} />
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="sm:col-span-2" />
              <select value={form.criteriaType} onChange={(e) => setForm((f) => ({ ...f, criteriaType: e.target.value }))} className={filterSelectClass}>
                {CRITERIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Input type="number" placeholder="Target" value={form.criteriaTarget} onChange={(e) => setForm((f) => ({ ...f, criteriaTarget: Number(e.target.value) }))} />
              <Input type="number" placeholder="Honey Reward" value={form.honeyReward} onChange={(e) => setForm((f) => ({ ...f, honeyReward: Number(e.target.value) }))} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleCreate}>Create</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {achievements.map((ach) => (
          <Card key={ach.id} size="sm">
            <CardContent className="flex items-center gap-3">
              <div className="shrink-0 rounded-lg bg-amber-100 p-2 dark:bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{ach.nameEn ?? ach.name}</p>
                <p className="text-meta">{ach.description}</p>
                <p className="mt-1 text-meta">
                  Code: <code className="text-foreground">{ach.code}</code> | Criteria: {JSON.stringify(ach.criteria)} | Reward: <span className="font-bold text-amber-600 dark:text-amber-400">{ach.honeyReward} pts</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {ach._count.users}
              </div>
            </CardContent>
          </Card>
        ))}
        {achievements.length === 0 && (
          <AdminEmptyState icon={Trophy} title="No achievements yet" />
        )}
      </div>
    </div>
  );
}
