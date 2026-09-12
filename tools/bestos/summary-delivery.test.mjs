import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { qualityCases as cases, qualityFixture as fixture } from "./quality-test-fixture.mjs";

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
    const again = f.run("fixture-2"); assert.equal(again.status, 0, again.stderr); assert.ok(again.stdout.startsWith('♻️ สรุปเดิมจากรอบ fixture-1')); assert.ok(again.stdout.includes(first.stdout.trim()));
    assert.equal(f.calls(), "run\n"); assert.equal(f.read().pending.runId, "fixture-2");
  });
  test(`${c.job}: legacy pre-delivery keys and direct CLI output do not count as delivery`, t => {
    const f = fixture(t, c); fs.writeFileSync(f.state, JSON.stringify({ key: c.key, at: "old" }));
    const result = f.run("fixture-1", false); assert.equal(result.status, 0, result.stderr); assert.ok(result.stdout);
    assert.deepEqual(f.read(), { key: c.key, at: "old" });
  });
}
