"use client";

import { useState } from "react";
import { Plus, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Achievement
        </Button>
      </div>

      {showForm && (
        <div className="panel space-y-3 p-4">
          <h2 className="font-semibold">Create Achievement</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Code (e.g. portfolio_100)" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Name (JP)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Name (EN)" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Name (TH)" value={form.nameTh} onChange={(e) => setForm((f) => ({ ...f, nameTh: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm sm:col-span-2" />
            <select value={form.criteriaType} onChange={(e) => setForm((f) => ({ ...f, criteriaType: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm">
              <option value="portfolio_count">Portfolio Count</option>
              <option value="checkin_streak">Check-in Streak</option>
              <option value="first_sell">First Sell</option>
              <option value="first_review">First Review</option>
              <option value="correct_predictions">Correct Predictions</option>
            </select>
            <input type="number" placeholder="Target" value={form.criteriaTarget} onChange={(e) => setForm((f) => ({ ...f, criteriaTarget: Number(e.target.value) }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
            <input type="number" placeholder="Honey Reward" value={form.honeyReward} onChange={(e) => setForm((f) => ({ ...f, honeyReward: Number(e.target.value) }))} className="rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate}>Create</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {achievements.map((ach) => (
          <div key={ach.id} className="panel flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-100 dark:bg-amber-500/10 p-2">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{ach.nameEn ?? ach.name}</p>
              <p className="text-xs text-muted-foreground">{ach.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Code: <code className="text-foreground">{ach.code}</code> | Criteria: {JSON.stringify(ach.criteria)} | Reward: <span className="text-amber-600 dark:text-amber-400 font-bold">{ach.honeyReward} pts</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {ach._count.users}
            </div>
          </div>
        ))}
        {achievements.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No achievements yet</p>
        )}
      </div>
    </div>
  );
}
