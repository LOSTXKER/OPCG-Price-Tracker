"use client";

import { useCallback, useState } from "react";
import { useConfirm } from "@/components/admin/confirm-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Target,
  Calendar,
  Gift,
  Eye,
  ToggleLeft,
  ToggleRight,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ── Types ── */

type ScheduleRule = {
  id: number;
  templateId: number;
  slotType: string;
  dayOfWeek: number | null;
  specificDates: string[] | null;
  poolGroup: string | null;
  poolPickCount: number | null;
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  template?: { id: number; code: string; name: string; nameEn: string | null; icon: string; category: string };
};

type Template = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionTh: string | null;
  icon: string;
  category: string;
  trackType: string;
  conditions: Record<string, unknown>;
  rewards: Record<string, unknown>;
  target: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  scheduleRules: ScheduleRule[];
};

type BonusRule = {
  id: number;
  name: string;
  nameEn: string | null;
  nameTh: string | null;
  category: string;
  requirement: string;
  requirementValue: number;
  rewards: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

type PreviewMission = {
  templateId: number;
  code: string;
  name: string;
  icon: string;
  rewards: { honey: number; tickets?: number };
  target: number;
};

type ActiveTab = "templates" | "schedule" | "bonus" | "preview";

/* ── Constants ── */

const TRACK_TYPES = ["AUTO_PATH", "MANUAL", "ACTION_COUNT"] as const;
const CATEGORIES = ["DAILY", "MONTHLY", "SPECIAL"] as const;
const SLOT_TYPES = ["CORE", "DAY_OF_WEEK", "RANDOM_POOL", "FIXED_DATE", "SEQUENTIAL"] as const;
const BONUS_REQUIREMENTS = ["ALL_COMPLETE", "COUNT_COMPLETE", "STREAK_DAYS"] as const;
const CONDITION_TYPES = ["visit_path", "action_count", "visit_unique", "manual_confirm"] as const;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const TRACK_TYPE_LABELS: Record<string, string> = { AUTO_PATH: "Auto Path", MANUAL: "Manual", ACTION_COUNT: "Action Count" };
const SLOT_TYPE_LABELS: Record<string, string> = { CORE: "Core (ทุกวัน)", DAY_OF_WEEK: "Day of Week", RANDOM_POOL: "Random Pool", FIXED_DATE: "Fixed Date", SEQUENTIAL: "Sequential" };
const BONUS_REQ_LABELS: Record<string, string> = { ALL_COMPLETE: "ทำครบทั้งหมด", COUNT_COMPLETE: "ทำครบ N ภารกิจ", STREAK_DAYS: "ติดต่อกัน N วัน" };
const CATEGORY_LABELS: Record<string, string> = { DAILY: "Daily", MONTHLY: "Monthly", SPECIAL: "Special" };

const selectClass = "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30";

/* ── Template Form ── */

type TemplateFormData = {
  code: string;
  name: string;
  nameEn: string;
  nameTh: string;
  description: string;
  icon: string;
  category: string;
  trackType: string;
  conditionType: string;
  conditionPaths: string;
  conditionAction: string;
  conditionPathPattern: string;
  rewardHoney: string;
  rewardTickets: string;
  target: string;
  isActive: boolean;
  sortOrder: string;
};

const emptyTemplateForm: TemplateFormData = {
  code: "", name: "", nameEn: "", nameTh: "", description: "", icon: "Circle",
  category: "DAILY", trackType: "AUTO_PATH", conditionType: "visit_path",
  conditionPaths: "", conditionAction: "share", conditionPathPattern: "",
  rewardHoney: "10", rewardTickets: "0", target: "1", isActive: true, sortOrder: "0",
};

function buildConditions(form: TemplateFormData) {
  switch (form.conditionType) {
    case "visit_path":
      return { type: "visit_path", paths: form.conditionPaths.split(",").map((s) => s.trim()).filter(Boolean) };
    case "action_count":
      return { type: "action_count", action: form.conditionAction };
    case "visit_unique":
      return { type: "visit_unique", pathPattern: form.conditionPathPattern };
    default:
      return { type: "manual_confirm" };
  }
}

function parseConditionsToForm(cond: Record<string, unknown>): Partial<TemplateFormData> {
  const type = cond.type as string;
  if (type === "visit_path") return { conditionType: "visit_path", conditionPaths: (cond.paths as string[])?.join(", ") ?? "" };
  if (type === "action_count") return { conditionType: "action_count", conditionAction: (cond.action as string) ?? "share" };
  if (type === "visit_unique") return { conditionType: "visit_unique", conditionPathPattern: (cond.pathPattern as string) ?? "" };
  return { conditionType: "manual_confirm" };
}

/* ── Schedule Form ── */

type ScheduleFormData = {
  templateId: string;
  slotType: string;
  dayOfWeek: string;
  specificDates: string;
  poolGroup: string;
  poolPickCount: string;
  startDate: string;
  endDate: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyScheduleForm: ScheduleFormData = {
  templateId: "", slotType: "CORE", dayOfWeek: "0", specificDates: "",
  poolGroup: "", poolPickCount: "1", startDate: "", endDate: "",
  sortOrder: "0", isActive: true,
};

/* ── Bonus Form ── */

type BonusFormData = {
  name: string;
  nameEn: string;
  nameTh: string;
  category: string;
  requirement: string;
  requirementValue: string;
  rewardHoney: string;
  rewardTickets: string;
  isActive: boolean;
  sortOrder: string;
};

const emptyBonusForm: BonusFormData = {
  name: "", nameEn: "", nameTh: "", category: "DAILY", requirement: "ALL_COMPLETE",
  requirementValue: "1", rewardHoney: "20", rewardTickets: "0", isActive: true, sortOrder: "0",
};

/* ── Main Component ── */

export function MissionsManager({
  initialTemplates,
  initialScheduleRules,
  initialBonusRules,
}: {
  initialTemplates: Template[];
  initialScheduleRules: ScheduleRule[];
  initialBonusRules: BonusRule[];
}) {
  const confirmDialog = useConfirm();
  const [tab, setTab] = useState<ActiveTab>("templates");
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>(initialScheduleRules);
  const [bonusRules, setBonusRules] = useState<BonusRule[]>(initialBonusRules);

  // Template state
  const [editingTpl, setEditingTpl] = useState<number | "new" | null>(null);
  const [tplForm, setTplForm] = useState<TemplateFormData>(emptyTemplateForm);

  // Schedule state
  const [editingSched, setEditingSched] = useState<number | "new" | null>(null);
  const [schedForm, setSchedForm] = useState<ScheduleFormData>(emptyScheduleForm);

  // Bonus state
  const [editingBonus, setEditingBonus] = useState<number | "new" | null>(null);
  const [bonusForm, setBonusForm] = useState<BonusFormData>(emptyBonusForm);

  // Preview
  const [previewDate, setPreviewDate] = useState(new Date().toISOString().slice(0, 10));
  const [previewMissions, setPreviewMissions] = useState<PreviewMission[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Reload ── */

  const reloadTemplates = useCallback(async () => {
    const res = await fetch("/api/admin/honey/missions/templates");
    if (res.ok) setTemplates((await res.json()).templates);
  }, []);

  const reloadSchedule = useCallback(async () => {
    const res = await fetch("/api/admin/honey/missions/schedule");
    if (res.ok) setScheduleRules((await res.json()).rules);
  }, []);

  const reloadBonus = useCallback(async () => {
    const res = await fetch("/api/admin/honey/missions/bonus");
    if (res.ok) setBonusRules((await res.json()).rules);
  }, []);

  /* ── Template CRUD ── */

  const startCreateTpl = () => { setEditingTpl("new"); setTplForm(emptyTemplateForm); setError(null); };

  const startEditTpl = (t: Template) => {
    setEditingTpl(t.id);
    const condParts = parseConditionsToForm(t.conditions);
    setTplForm({
      code: t.code, name: t.name, nameEn: t.nameEn ?? "", nameTh: t.nameTh ?? "",
      description: t.description ?? "", icon: t.icon, category: t.category, trackType: t.trackType,
      conditionType: condParts.conditionType ?? "manual_confirm",
      conditionPaths: condParts.conditionPaths ?? "",
      conditionAction: condParts.conditionAction ?? "share",
      conditionPathPattern: condParts.conditionPathPattern ?? "",
      rewardHoney: String((t.rewards as Record<string, number>).honey ?? 0),
      rewardTickets: String((t.rewards as Record<string, number>).tickets ?? 0),
      target: String(t.target), isActive: t.isActive, sortOrder: String(t.sortOrder),
    });
    setError(null);
  };

  const duplicateTpl = (t: Template) => {
    startEditTpl(t);
    setEditingTpl("new");
    setTplForm((f) => ({ ...f, code: t.code + "_copy" }));
  };

  const saveTpl = async () => {
    setSaving(true); setError(null);
    const payload = {
      code: tplForm.code, name: tplForm.name,
      nameEn: tplForm.nameEn || null, nameTh: tplForm.nameTh || null,
      description: tplForm.description || null,
      icon: tplForm.icon, category: tplForm.category, trackType: tplForm.trackType,
      conditions: buildConditions(tplForm),
      rewards: { honey: Number(tplForm.rewardHoney), tickets: Number(tplForm.rewardTickets) },
      target: Number(tplForm.target), isActive: tplForm.isActive, sortOrder: Number(tplForm.sortOrder),
    };
    try {
      const url = editingTpl === "new" ? "/api/admin/honey/missions/templates" : `/api/admin/honey/missions/templates/${editingTpl}`;
      const method = editingTpl === "new" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); toast.error(d.error || "Failed"); }
      else { setEditingTpl(null); toast.success(editingTpl === "new" ? "Template created" : "Template updated"); await reloadTemplates(); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const deleteTpl = async (id: number) => {
    const ok = await confirmDialog({ title: "ลบ Template", description: "ลบ template นี้และ schedule rules ที่เกี่ยวข้องทั้งหมด?", confirmLabel: "ลบ", variant: "destructive" });
    if (!ok) return;
    await fetch(`/api/admin/honey/missions/templates/${id}`, { method: "DELETE" });
    toast.success("Template deleted");
    await reloadTemplates();
    await reloadSchedule();
  };

  const toggleTplActive = async (t: Template) => {
    await fetch(`/api/admin/honey/missions/templates/${t.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    toast.success(t.isActive ? "Deactivated" : "Activated");
    await reloadTemplates();
  };

  /* ── Schedule CRUD ── */

  const startCreateSched = () => { setEditingSched("new"); setSchedForm(emptyScheduleForm); setError(null); };

  const startEditSched = (r: ScheduleRule) => {
    setEditingSched(r.id);
    setSchedForm({
      templateId: String(r.templateId), slotType: r.slotType,
      dayOfWeek: String(r.dayOfWeek ?? 0),
      specificDates: (r.specificDates ?? []).join(", "),
      poolGroup: r.poolGroup ?? "", poolPickCount: String(r.poolPickCount ?? 1),
      startDate: r.startDate?.slice(0, 10) ?? "", endDate: r.endDate?.slice(0, 10) ?? "",
      sortOrder: String(r.sortOrder), isActive: r.isActive,
    });
    setError(null);
  };

  const saveSched = async () => {
    setSaving(true); setError(null);
    const payload = {
      templateId: Number(schedForm.templateId), slotType: schedForm.slotType,
      dayOfWeek: schedForm.slotType === "DAY_OF_WEEK" ? Number(schedForm.dayOfWeek) : null,
      specificDates: schedForm.slotType === "FIXED_DATE" ? schedForm.specificDates.split(",").map((s) => s.trim()).filter(Boolean) : null,
      poolGroup: ["RANDOM_POOL", "SEQUENTIAL"].includes(schedForm.slotType) ? (schedForm.poolGroup || null) : null,
      poolPickCount: schedForm.slotType === "RANDOM_POOL" ? Number(schedForm.poolPickCount) : null,
      startDate: schedForm.startDate || null, endDate: schedForm.endDate || null,
      sortOrder: Number(schedForm.sortOrder), isActive: schedForm.isActive,
    };
    try {
      const url = editingSched === "new" ? "/api/admin/honey/missions/schedule" : `/api/admin/honey/missions/schedule/${editingSched}`;
      const method = editingSched === "new" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); toast.error(d.error || "Failed"); }
      else { setEditingSched(null); toast.success(editingSched === "new" ? "Rule created" : "Rule updated"); await reloadSchedule(); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const deleteSched = async (id: number) => {
    const ok = await confirmDialog({ title: "ลบ Schedule Rule", description: "ลบ rule นี้?", confirmLabel: "ลบ", variant: "destructive" });
    if (!ok) return;
    await fetch(`/api/admin/honey/missions/schedule/${id}`, { method: "DELETE" });
    toast.success("Rule deleted");
    await reloadSchedule();
  };

  /* ── Bonus CRUD ── */

  const startCreateBonus = () => { setEditingBonus("new"); setBonusForm(emptyBonusForm); setError(null); };

  const startEditBonus = (r: BonusRule) => {
    setEditingBonus(r.id);
    setBonusForm({
      name: r.name, nameEn: r.nameEn ?? "", nameTh: r.nameTh ?? "",
      category: r.category, requirement: r.requirement,
      requirementValue: String(r.requirementValue),
      rewardHoney: String((r.rewards as Record<string, number>).honey ?? 0),
      rewardTickets: String((r.rewards as Record<string, number>).tickets ?? 0),
      isActive: r.isActive, sortOrder: String(r.sortOrder),
    });
    setError(null);
  };

  const saveBonus = async () => {
    setSaving(true); setError(null);
    const payload = {
      name: bonusForm.name, nameEn: bonusForm.nameEn || null, nameTh: bonusForm.nameTh || null,
      category: bonusForm.category, requirement: bonusForm.requirement,
      requirementValue: Number(bonusForm.requirementValue),
      rewards: { honey: Number(bonusForm.rewardHoney), tickets: Number(bonusForm.rewardTickets) },
      isActive: bonusForm.isActive, sortOrder: Number(bonusForm.sortOrder),
    };
    try {
      const url = editingBonus === "new" ? "/api/admin/honey/missions/bonus" : `/api/admin/honey/missions/bonus/${editingBonus}`;
      const method = editingBonus === "new" ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); toast.error(d.error || "Failed"); }
      else { setEditingBonus(null); toast.success(editingBonus === "new" ? "Bonus rule created" : "Bonus rule updated"); await reloadBonus(); }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const deleteBonus = async (id: number) => {
    const ok = await confirmDialog({ title: "ลบ Bonus Rule", description: "ลบ bonus rule นี้?", confirmLabel: "ลบ", variant: "destructive" });
    if (!ok) return;
    await fetch(`/api/admin/honey/missions/bonus/${id}`, { method: "DELETE" });
    toast.success("Bonus rule deleted");
    await reloadBonus();
  };

  /* ── Preview ── */

  const loadPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/honey/missions/preview?date=${previewDate}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewMissions(data.missions);
      }
    } catch { toast.error("Failed to load preview"); }
    finally { setPreviewLoading(false); }
  };

  /* ── Tab buttons ── */

  const tabBtn = (id: ActiveTab, label: string, icon: React.ReactNode) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Mission Management"
        icon={Target}
        description="จัดการ preset ภารกิจ, ตารางเวลา, และกฎโบนัส"
        badge={<Badge variant="secondary">{templates.length} templates</Badge>}
      />

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/50 bg-muted/20 p-1.5">
        {tabBtn("templates", "Templates", <Target className="size-4" />)}
        {tabBtn("schedule", "Schedule", <Calendar className="size-4" />)}
        {tabBtn("bonus", "Bonus Rules", <Gift className="size-4" />)}
        {tabBtn("preview", "Preview", <Eye className="size-4" />)}
      </div>

      {/* ═══════ TEMPLATES TAB ═══════ */}
      {tab === "templates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={startCreateTpl} size="sm"><Plus className="h-4 w-4" /> New Template</Button>
          </div>

          {editingTpl !== null && (
            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold">{editingTpl === "new" ? "Create Template" : "Edit Template"}</h2>
                {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Code (unique)">
                    <Input value={tplForm.code} onChange={(e) => setTplForm({ ...tplForm, code: e.target.value })} placeholder="check_price" />
                  </Field>
                  <Field label="Name (default)">
                    <Input value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} />
                  </Field>
                  <Field label="Name (EN)">
                    <Input value={tplForm.nameEn} onChange={(e) => setTplForm({ ...tplForm, nameEn: e.target.value })} />
                  </Field>
                  <Field label="Name (TH)">
                    <Input value={tplForm.nameTh} onChange={(e) => setTplForm({ ...tplForm, nameTh: e.target.value })} />
                  </Field>
                  <Field label="Description">
                    <Input value={tplForm.description} onChange={(e) => setTplForm({ ...tplForm, description: e.target.value })} />
                  </Field>
                  <Field label="Icon (Lucide name)">
                    <Input value={tplForm.icon} onChange={(e) => setTplForm({ ...tplForm, icon: e.target.value })} placeholder="Search" />
                  </Field>
                  <Field label="Category">
                    <select className={selectClass} value={tplForm.category} onChange={(e) => setTplForm({ ...tplForm, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </Field>
                  <Field label="Track Type">
                    <select className={selectClass} value={tplForm.trackType} onChange={(e) => setTplForm({ ...tplForm, trackType: e.target.value })}>
                      {TRACK_TYPES.map((t) => <option key={t} value={t}>{TRACK_TYPE_LABELS[t]}</option>)}
                    </select>
                  </Field>
                  <Field label="Target (count)">
                    <Input type="number" value={tplForm.target} onChange={(e) => setTplForm({ ...tplForm, target: e.target.value })} />
                  </Field>
                </div>

                {/* Condition builder */}
                <div className="mt-4 rounded-lg border border-border/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Condition</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Condition Type">
                      <select className={selectClass} value={tplForm.conditionType} onChange={(e) => setTplForm({ ...tplForm, conditionType: e.target.value })}>
                        {CONDITION_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    {tplForm.conditionType === "visit_path" && (
                      <Field label="Paths (comma separated)">
                        <Input value={tplForm.conditionPaths} onChange={(e) => setTplForm({ ...tplForm, conditionPaths: e.target.value })} placeholder="/cards/*, /trending" />
                      </Field>
                    )}
                    {tplForm.conditionType === "action_count" && (
                      <Field label="Action">
                        <select className={selectClass} value={tplForm.conditionAction} onChange={(e) => setTplForm({ ...tplForm, conditionAction: e.target.value })}>
                          {["share", "list_item", "add_portfolio", "review", "predict", "checkin", "trade"].map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </Field>
                    )}
                    {tplForm.conditionType === "visit_unique" && (
                      <Field label="Path Pattern">
                        <Input value={tplForm.conditionPathPattern} onChange={(e) => setTplForm({ ...tplForm, conditionPathPattern: e.target.value })} placeholder="/sets/{id}" />
                      </Field>
                    )}
                  </div>
                </div>

                {/* Rewards */}
                <div className="mt-4 rounded-lg border border-border/50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Rewards</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Honey">
                      <Input type="number" value={tplForm.rewardHoney} onChange={(e) => setTplForm({ ...tplForm, rewardHoney: e.target.value })} />
                    </Field>
                    <Field label="Raffle Tickets">
                      <Input type="number" value={tplForm.rewardTickets} onChange={(e) => setTplForm({ ...tplForm, rewardTickets: e.target.value })} />
                    </Field>
                    <div className="flex items-end gap-3">
                      <Field label="Sort Order">
                        <Input type="number" value={tplForm.sortOrder} onChange={(e) => setTplForm({ ...tplForm, sortOrder: e.target.value })} />
                      </Field>
                      <label className="flex items-center gap-2 pb-1 text-sm">
                        <input type="checkbox" checked={tplForm.isActive} onChange={(e) => setTplForm({ ...tplForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-border" />
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button onClick={saveTpl} disabled={saving} size="sm"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}</Button>
                  <Button onClick={() => { setEditingTpl(null); setError(null); }} variant="outline" size="sm"><X className="h-4 w-4" /> Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {templates.length === 0 ? (
            <AdminEmptyState icon={Target} title="No mission templates" description="Create your first mission template" action={<Button onClick={startCreateTpl} size="sm"><Plus className="h-4 w-4" /> New Template</Button>} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Reward</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Rules</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{t.code}</td>
                      <td className="px-4 py-3">{t.nameEn ?? t.name}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{t.category}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{TRACK_TYPE_LABELS[t.trackType]}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">{(t.rewards as Record<string, number>).honey ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{t.scheduleRules.length}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleTplActive(t)} title={t.isActive ? "Active" : "Inactive"}>
                          {t.isActive ? <ToggleRight className="mx-auto h-5 w-5 text-green-500" /> : <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => duplicateTpl(t)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => startEditTpl(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => deleteTpl(t.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════ SCHEDULE TAB ═══════ */}
      {tab === "schedule" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={startCreateSched} size="sm"><Plus className="h-4 w-4" /> New Rule</Button>
          </div>

          {editingSched !== null && (
            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold">{editingSched === "new" ? "Create Schedule Rule" : "Edit Schedule Rule"}</h2>
                {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Template">
                    <select className={selectClass} value={schedForm.templateId} onChange={(e) => setSchedForm({ ...schedForm, templateId: e.target.value })}>
                      <option value="">-- Select --</option>
                      {templates.filter((t) => t.isActive).map((t) => <option key={t.id} value={t.id}>{t.code} - {t.nameEn ?? t.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Slot Type">
                    <select className={selectClass} value={schedForm.slotType} onChange={(e) => setSchedForm({ ...schedForm, slotType: e.target.value })}>
                      {SLOT_TYPES.map((s) => <option key={s} value={s}>{SLOT_TYPE_LABELS[s]}</option>)}
                    </select>
                  </Field>
                  {schedForm.slotType === "DAY_OF_WEEK" && (
                    <Field label="Day of Week">
                      <select className={selectClass} value={schedForm.dayOfWeek} onChange={(e) => setSchedForm({ ...schedForm, dayOfWeek: e.target.value })}>
                        {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </Field>
                  )}
                  {schedForm.slotType === "FIXED_DATE" && (
                    <Field label="Dates (comma separated)">
                      <Input value={schedForm.specificDates} onChange={(e) => setSchedForm({ ...schedForm, specificDates: e.target.value })} placeholder="2026-04-26, 2026-05-01" />
                    </Field>
                  )}
                  {["RANDOM_POOL", "SEQUENTIAL"].includes(schedForm.slotType) && (
                    <Field label="Pool Group">
                      <Input value={schedForm.poolGroup} onChange={(e) => setSchedForm({ ...schedForm, poolGroup: e.target.value })} placeholder="bonus_pool" />
                    </Field>
                  )}
                  {schedForm.slotType === "RANDOM_POOL" && (
                    <Field label="Pick Count">
                      <Input type="number" value={schedForm.poolPickCount} onChange={(e) => setSchedForm({ ...schedForm, poolPickCount: e.target.value })} />
                    </Field>
                  )}
                  <Field label="Start Date">
                    <Input type="date" value={schedForm.startDate} onChange={(e) => setSchedForm({ ...schedForm, startDate: e.target.value })} />
                  </Field>
                  <Field label="End Date">
                    <Input type="date" value={schedForm.endDate} onChange={(e) => setSchedForm({ ...schedForm, endDate: e.target.value })} />
                  </Field>
                  <Field label="Sort Order">
                    <Input type="number" value={schedForm.sortOrder} onChange={(e) => setSchedForm({ ...schedForm, sortOrder: e.target.value })} />
                  </Field>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={schedForm.isActive} onChange={(e) => setSchedForm({ ...schedForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-border" />
                      Active
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={saveSched} disabled={saving} size="sm"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}</Button>
                  <Button onClick={() => { setEditingSched(null); setError(null); }} variant="outline" size="sm"><X className="h-4 w-4" /> Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {scheduleRules.length === 0 ? (
            <AdminEmptyState icon={Calendar} title="No schedule rules" description="Create schedule rules to assign templates to specific days" action={<Button onClick={startCreateSched} size="sm"><Plus className="h-4 w-4" /> New Rule</Button>} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Template</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Slot Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Config</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Period</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleRules.map((r) => (
                    <tr key={r.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{r.template?.code ?? r.templateId}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{SLOT_TYPE_LABELS[r.slotType] ?? r.slotType}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.slotType === "DAY_OF_WEEK" && r.dayOfWeek != null && DAY_NAMES[r.dayOfWeek]}
                        {r.slotType === "FIXED_DATE" && r.specificDates && (r.specificDates as string[]).join(", ")}
                        {r.slotType === "RANDOM_POOL" && `pool: ${r.poolGroup ?? "default"} (pick ${r.poolPickCount ?? 1})`}
                        {r.slotType === "SEQUENTIAL" && `pool: ${r.poolGroup ?? "default"}`}
                        {r.slotType === "CORE" && "Always"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.startDate || r.endDate ? `${r.startDate?.slice(0, 10) ?? "∞"} → ${r.endDate?.slice(0, 10) ?? "∞"}` : "Always"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.isActive ? <ToggleRight className="mx-auto h-5 w-5 text-green-500" /> : <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => startEditSched(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => deleteSched(r.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════ BONUS RULES TAB ═══════ */}
      {tab === "bonus" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={startCreateBonus} size="sm"><Plus className="h-4 w-4" /> New Bonus Rule</Button>
          </div>

          {editingBonus !== null && (
            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold">{editingBonus === "new" ? "Create Bonus Rule" : "Edit Bonus Rule"}</h2>
                {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Name">
                    <Input value={bonusForm.name} onChange={(e) => setBonusForm({ ...bonusForm, name: e.target.value })} />
                  </Field>
                  <Field label="Name (EN)">
                    <Input value={bonusForm.nameEn} onChange={(e) => setBonusForm({ ...bonusForm, nameEn: e.target.value })} />
                  </Field>
                  <Field label="Name (TH)">
                    <Input value={bonusForm.nameTh} onChange={(e) => setBonusForm({ ...bonusForm, nameTh: e.target.value })} />
                  </Field>
                  <Field label="Category">
                    <select className={selectClass} value={bonusForm.category} onChange={(e) => setBonusForm({ ...bonusForm, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </Field>
                  <Field label="Requirement">
                    <select className={selectClass} value={bonusForm.requirement} onChange={(e) => setBonusForm({ ...bonusForm, requirement: e.target.value })}>
                      {BONUS_REQUIREMENTS.map((r) => <option key={r} value={r}>{BONUS_REQ_LABELS[r]}</option>)}
                    </select>
                  </Field>
                  <Field label="Requirement Value">
                    <Input type="number" value={bonusForm.requirementValue} onChange={(e) => setBonusForm({ ...bonusForm, requirementValue: e.target.value })} />
                  </Field>
                  <Field label="Reward Honey">
                    <Input type="number" value={bonusForm.rewardHoney} onChange={(e) => setBonusForm({ ...bonusForm, rewardHoney: e.target.value })} />
                  </Field>
                  <Field label="Reward Tickets">
                    <Input type="number" value={bonusForm.rewardTickets} onChange={(e) => setBonusForm({ ...bonusForm, rewardTickets: e.target.value })} />
                  </Field>
                  <div className="flex items-end gap-3">
                    <Field label="Sort Order">
                      <Input type="number" value={bonusForm.sortOrder} onChange={(e) => setBonusForm({ ...bonusForm, sortOrder: e.target.value })} />
                    </Field>
                    <label className="flex items-center gap-2 pb-1 text-sm">
                      <input type="checkbox" checked={bonusForm.isActive} onChange={(e) => setBonusForm({ ...bonusForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-border" />
                      Active
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={saveBonus} disabled={saving} size="sm"><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}</Button>
                  <Button onClick={() => { setEditingBonus(null); setError(null); }} variant="outline" size="sm"><X className="h-4 w-4" /> Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {bonusRules.length === 0 ? (
            <AdminEmptyState icon={Gift} title="No bonus rules" description="Create bonus rules for mission completion rewards" action={<Button onClick={startCreateBonus} size="sm"><Plus className="h-4 w-4" /> New Bonus Rule</Button>} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Requirement</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Reward</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bonusRules.map((r) => (
                    <tr key={r.id} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{r.nameEn ?? r.name}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{r.category}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{BONUS_REQ_LABELS[r.requirement] ?? r.requirement} ({r.requirementValue})</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">{(r.rewards as Record<string, number>).honey ?? 0} honey</span>
                        {((r.rewards as Record<string, number>).tickets ?? 0) > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">+ {(r.rewards as Record<string, number>).tickets} tickets</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.isActive ? <ToggleRight className="mx-auto h-5 w-5 text-green-500" /> : <ToggleLeft className="mx-auto h-5 w-5 text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={() => startEditBonus(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => deleteBonus(r.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══════ PREVIEW TAB ═══════ */}
      {tab === "preview" && (
        <div className="space-y-4">
          <Card>
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold">Mission Preview</h2>
              <p className="mb-4 text-sm text-muted-foreground">ดูตัวอย่างว่าวันที่เลือกจะมีภารกิจอะไรบ้าง (ตาม schedule rules ที่ตั้งไว้)</p>
              <div className="flex items-end gap-3">
                <Field label="Date">
                  <Input type="date" value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} />
                </Field>
                <Button onClick={loadPreview} disabled={previewLoading} size="sm">
                  <Eye className="h-4 w-4" /> {previewLoading ? "Loading..." : "Preview"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {previewMissions.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Code</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Honey</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {previewMissions.map((m, i) => (
                    <tr key={m.code} className="border-b border-border/20 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">{m.code}</td>
                      <td className="px-4 py-3">{m.name}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-amber-600 dark:text-amber-400">{m.rewards?.honey ?? 0}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{m.rewards?.tickets ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {previewMissions.length === 0 && !previewLoading && (
            <Card>
              <CardContent>
                <p className="py-8 text-center text-muted-foreground">
                  กด Preview เพื่อดูภารกิจสำหรับวันที่เลือก
                  {templates.length === 0 && " (ยังไม่มี template — สร้างและเพิ่ม schedule rule ก่อน)"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helper component ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
