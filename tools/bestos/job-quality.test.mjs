import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { qualityCases, qualityFixture } from './quality-test-fixture.mjs';

for (const c of qualityCases) {
  test(`${c.job}: current report and quiet no-change both have verified run evidence`, t => {
    const f = qualityFixture(t, c), first = f.run();
    assert.equal(first.status, 0, first.stderr);
    const checked = f.verify(first.stdout);
    assert.equal(checked.pass, true, checked.reason);
    assert.equal(checked.evidence.currentRead, true);
    f.receipt(first.stdout);
    const quiet = f.run('fixture-2');
    assert.equal(quiet.status, 0, quiet.stderr);
    assert.equal(quiet.stdout, '');
    const next = f.verify('', 'fixture-2');
    assert.equal(next.pass, true, next.reason);
    assert.equal(next.evidence.currentRead, true);
    assert.equal(next.evidence.outputMode, 'quiet');
    assert.equal(f.calls(), 'run\nrun\n');
  });
  for (const behavior of ['missing', 'stale', 'badCounts', 'badSource', 'mutation', 'mismatch', 'failure']) test(`${c.job}: ${behavior} cannot pass with only producer ok=true`, t => {
    const f = qualityFixture(t, c); f.behavior({ [behavior]: true });
    const result = f.run();
    assert.equal(result.status, 1, result.stdout);
    assert.equal(f.verify(result.stdout).pass, false);
    assert.equal(f.calls(), 'run\n');
    assert.equal(fs.existsSync(f.state), false, 'invalid results cannot become pending summaries');
  });
  test(`${c.job}: verifier rejects missing, altered or another-run proof and mismatched stdout`, t => {
    const f = qualityFixture(t, c), result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.verify(result.stdout + ' changed').pass, false);
    assert.equal(f.verify(result.stdout, 'another-run').pass, false);
    const file = f.proof(), raw = fs.readFileSync(file, 'utf8'), proof = JSON.parse(raw);
    fs.writeFileSync(file, JSON.stringify({ ...proof, runId: 'another-run' }));
    assert.equal(f.verify(result.stdout).pass, false);
    fs.writeFileSync(file, raw);
    fs.appendFileSync(proof.observation.report.path, ' ');
    assert.equal(f.verify(result.stdout).pass, false, 'report bytes are pinned independently of parsed content');
    fs.unlinkSync(file);
    assert.equal(f.verify(result.stdout).pass, false);
  });
  test(`${c.job}: explicit replay verifies old source evidence without calling the producer again`, t => {
    const f = qualityFixture(t, c), first = f.run();
    assert.equal(first.status, 0, first.stderr);
    const original = JSON.parse(fs.readFileSync(f.proof(), 'utf8'));
    f.receipt(first.stdout, { state: 'failed', delivered: false, delivery_status: 'pending', message_id: null });
    const replay = f.run('fixture-2');
    assert.equal(replay.status, 0, replay.stderr);
    assert.match(replay.stdout, /^♻️ ส่งสรุปที่ตรวจไว้แล้วอีกครั้ง/);
    assert.ok(replay.stdout.includes(first.stdout.trim()));
    const checked = f.verify(replay.stdout, 'fixture-2');
    assert.equal(checked.pass, true, checked.reason);
    assert.equal(checked.evidence.currentRead, false);
    assert.equal(checked.evidence.readStartedAt, JSON.parse(fs.readFileSync(original.observation.report.path, 'utf8')).startedAt);
    assert.deepEqual(checked.evidence.replay, { job: c.job, runId: 'fixture-1' });
    assert.equal(f.calls(), 'run\n');
    fs.appendFileSync(original.observation.report.path, ' ');
    assert.equal(f.verify(replay.stdout, 'fixture-2').pass, false);
  });
  test(`${c.job}: pending summary without source proof cannot masquerade as a fresh read`, t => {
    const f = qualityFixture(t, c), first = f.run();
    assert.equal(first.status, 0, first.stderr);
    f.receipt(first.stdout, { state: 'failed', delivered: false, delivery_status: 'pending', message_id: null });
    fs.unlinkSync(f.proof());
    assert.equal(f.run('fixture-2').status, 1);
    assert.equal(f.calls(), 'run\n');
    assert.equal(f.verify('', 'fixture-2').pass, false);
  });
  test(`${c.job}: confirmed legacy key can stay quiet only after a current validated report`, t => {
    const f = qualityFixture(t, c);
    fs.writeFileSync(f.state, JSON.stringify({ key: c.key, delivery_confirmed: true, runId: 'old-run', job: c.job, message_id: 'old-message' }));
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    const checked = f.verify('');
    assert.equal(checked.pass, true, checked.reason);
    assert.equal(checked.evidence.currentRead, true);
    assert.equal(f.calls(), 'run\n');
  });
}

for (const c of qualityCases) test(`${c.job}: Thai summaries keep counts while old proofs and unsent recovery stay valid`, t => {
  const f = qualityFixture(t, c), first = f.run();
  assert.equal(first.status, 0, first.stderr);
  assert.doesNotMatch(first.stdout, /dry-run|tail-refresh|total:|known:|unmapped:|\.json|\/tmp\/|\/var\//);
  assert.match(first.stdout, /ยังไม่ได้/);
  const proof = JSON.parse(fs.readFileSync(f.proof(), 'utf8')), j = proof.observation.producerSummary;
  assert.equal(proof.presentationVersion, 2);
  const legacy = c.job === 'meecard-auto-match'
    ? `🃏 MeeCard จับคู่การ์ด (ตรวจอย่างเดียว · dry-run)\nYuyutei: รอตรวจ 2 · พร้อมอนุมัติ 1\nSNKRDUNK: รอตรวจ 3 · พร้อมอนุมัติ 0 · เจอใหม่ยังไม่มีในระบบ 1 (พร้อมอนุมัติ 0)\nรายงานเต็ม: ${j.reportPath}`
    : `🃏 MeeCard ไล่รายการ SNKRDUNK หน้า 1–1 (partial)\n• total: 1\n• known: 0\n• unmapped: 1\nรายงานเต็ม: ${j.reportPath}`;
  delete proof.presentationVersion;
  proof.output.text = legacy; proof.output.sha256 = crypto.createHash('sha256').update(legacy).digest('hex');
  fs.writeFileSync(f.proof(), JSON.stringify(proof));
  assert.equal(f.verify(legacy).pass, true, 'old immutable output remains verifiable');
  const queued = f.read(); queued.pending.text = legacy;
  queued.pending.outputHash = crypto.createHash('sha256').update(legacy + '\n').digest('hex');
  fs.writeFileSync(f.state, JSON.stringify(queued));
  const saved = fs.readFileSync(f.state), savedProof = fs.readFileSync(f.proof());
  assert.equal(f.run('still-uncertain').status, 1, 'unconfirmed delivery cannot be rewritten');
  assert.deepEqual(fs.readFileSync(f.state), saved);
  f.receipt(legacy, { state: 'failed', delivered: false, delivery_status: 'pending', message_id: null });
  const replay = f.run('fixture-2');
  assert.equal(replay.status, 0, replay.stderr); assert.equal(f.verify(replay.stdout, 'fixture-2').pass, true);
  assert.match(replay.stdout, /ข้อมูล ณ .+เวลาไทย/);
  assert.doesNotMatch(replay.stdout, /fixture-1|dry-run|partial|\.json/);
  assert.ok(replay.stdout.includes(first.stdout.trim()));
  assert.deepEqual(fs.readFileSync(f.proof()), savedProof, 'original proof stays byte-for-byte');
  assert.equal(f.calls(), 'run\n', 'recovery does not repeat the business read');
});

for (const badCheckpoint of ['complete', 'no-advance', 'another-run']) test(`backfill rejects checkpoint contradiction: ${badCheckpoint}`, t => {
  const f = qualityFixture(t, qualityCases[1]); f.behavior({ badCheckpoint });
  const result = f.run();
  assert.equal(result.status, 1, result.stdout);
  assert.equal(f.verify(result.stdout).pass, false);
  assert.equal(fs.existsSync(f.state), false);
});

for (const status of ['complete', 'blocked', 'tail-refresh']) test(`backfill accepts a truthful ${status} report`, t => {
  const f = qualityFixture(t, qualityCases[1]); f.behavior({ status });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  const checked = f.verify(result.stdout);
  assert.equal(checked.pass, true, checked.reason);
  assert.equal(checked.evidence.snapshot.status, status);
});

test('empty backfill stdout still requires a current complete read report', t => {
  const f = qualityFixture(t, qualityCases[1]); f.behavior({ empty: true });
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  const checked = f.verify('');
  assert.equal(checked.pass, true, checked.reason);
  assert.equal(checked.evidence.snapshot.counts.total, 0);
  fs.unlinkSync(f.proof());
  assert.equal(f.verify('').pass, false);
});
