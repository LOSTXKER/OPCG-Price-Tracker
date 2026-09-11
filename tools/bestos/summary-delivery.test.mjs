import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const cases = [
  { wrapper: "run-auto-match.mjs", producer: "meecard-auto-match-supervisor.mjs", job: "meecard-auto-match", data: { ok: true, mode: "dry-run", yuyutei: { pending: 1, ready: 2 }, snkrdunk: { pending: 3, readyExisting: 4, discoveredUnmapped: 5, readyNew: 6 }, blocked: 0, reportPath: "/fixture/report" }, key: JSON.stringify([1, 2, 3, 4, 5, 6, 0]) },
  { wrapper: "run-backfill.mjs", producer: "meecard-snkrdunk-backfill.mjs", job: "meecard-snkrdunk-backfill", data: { ok: true, counts: { new: 1 }, pageStart: 1, pageEnd: 5, status: "done", reportPath: "/fixture/report" }, key: JSON.stringify({ counts: { new: 1 }, pageEnd: 5, status: "done" }) },
];
function fixture(t, c) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "meecard-summary-")); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const state = path.join(root, "state.json"), calls = path.join(root, "calls");
  const source = fs.readFileSync(path.join(import.meta.dirname, c.wrapper), "utf8").replace(/^const STATE = .+;$/m, `const STATE = ${JSON.stringify(state)};`);
  fs.writeFileSync(path.join(root, c.wrapper), source);
  const helper = path.join(import.meta.dirname, "summary-delivery.mjs"); if (fs.existsSync(helper)) fs.copyFileSync(helper, path.join(root, "summary-delivery.mjs"));
  fs.writeFileSync(path.join(root, c.producer), `import fs from 'node:fs';fs.appendFileSync(${JSON.stringify(calls)},'run\\n');console.log(${JSON.stringify(JSON.stringify(c.data))});`);
  const run = (runId = "fixture-1", managed = true) => spawnSync(process.execPath, [path.join(root, c.wrapper)], { encoding: "utf8", env: { ...process.env, BESTOS_BRAIN: root, BESTOS_JOB: managed ? c.job : "", BESTOS_RUN_ID: managed ? runId : "" } });
  const receipt = (text, overrides = {}) => {
    const dir = path.join(root, "records/_receipts", c.job); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "2026-09-12-fixture-1.json"), JSON.stringify({ job: c.job, run_id: "fixture-1", state: "completed", delivered: true, delivery_status: "delivered", message_id: "456", output: { sha256: crypto.createHash("sha256").update(text.trim() + "\n").digest("hex") }, ...overrides }));
  };
  return { root, state, run, receipt, calls: () => fs.readFileSync(calls, "utf8"), read: () => JSON.parse(fs.readFileSync(state, "utf8")) };
}

for (const c of cases) {
  test(`${c.job}: pending output is not acknowledged or reproduced until matching delivery`, t => {
    const f = fixture(t, c), first = f.run(); assert.equal(first.status, 0, first.stderr); assert.ok(first.stdout);
    assert.equal(f.read().key, undefined); assert.equal(f.read().pending.runId, "fixture-1");
    const again = f.run("fixture-2"); assert.equal(again.status, 1); assert.equal(f.calls(), "run\n");
    f.receipt(first.stdout);
    const later = f.run("fixture-3"); assert.equal(later.status, 0, later.stderr); assert.equal(later.stdout, "");
    assert.equal(f.read().key, c.key); assert.equal(f.read().delivery_confirmed, true); assert.equal(f.read().pending, undefined);
  });
  test(`${c.job}: mismatched delivery cannot silence a summary`, t => {
    const f = fixture(t, c); assert.equal(f.run().status, 0);
    f.receipt("another output"); assert.equal(f.run("fixture-2").status, 1);
    assert.equal(f.calls(), "run\n"); assert.equal(f.read().key, undefined);
  });
  test(`${c.job}: definite failure before sending replays the saved summary without redoing the producer`, t => {
    const f = fixture(t, c), first = f.run(); assert.equal(first.status, 0);
    f.receipt(first.stdout, { state: "failed", delivered: false, delivery_status: "pending", message_id: null });
    const again = f.run("fixture-2"); assert.equal(again.status, 0, again.stderr); assert.equal(again.stdout, first.stdout);
    assert.equal(f.calls(), "run\n"); assert.equal(f.read().pending.runId, "fixture-2");
  });
  test(`${c.job}: legacy pre-delivery keys and direct CLI output do not count as delivery`, t => {
    const f = fixture(t, c); fs.writeFileSync(f.state, JSON.stringify({ key: c.key, at: "old" }));
    const result = f.run("fixture-1", false); assert.equal(result.status, 0, result.stderr); assert.ok(result.stdout);
    assert.deepEqual(f.read(), { key: c.key, at: "old" });
  });
}
