import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  AdminApiApprover,
  ApplyError,
  SnkrMcpClient,
  UsageError,
  createJournal,
  parseCliArgs,
  parseToolResult,
  runSupervisedApply,
  validateManifest,
} from "./meecard-snkrdunk-supervised-apply.mjs";

function manifestRow(overrides = {}) {
  return {
    snkrdunkId: 881549,
    matchedCardId: 4126,
    code: "OP17-002",
    sourceImageUrl: "https://cdn.snkrdunk.com/example/source.webp",
    targetImageUrl: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP17-002.png",
    visual: { decision: "exact_artwork_and_japanese_locale", pass: true },
    ...overrides,
  };
}

function mapping(overrides = {}) {
  return {
    id: 20,
    snkrdunkId: 7000,
    productNumber: "OP01-001",
    status: "MATCHED",
    matchedCardId: 100,
    ...overrides,
  };
}

function fakeJournal() {
  const events = [];
  return { path: "/tmp/test-journal.jsonl", events, append(event) { events.push(structuredClone(event)); } };
}

class FakeClient {
  constructor({ mappings = [mapping()], createBehavior = "success", approveBehavior = "success" } = {}) {
    this.mappings = mappings.map((row) => structuredClone(row));
    this.createBehavior = createBehavior;
    this.approveBehavior = approveBehavior;
    this.failReadback = false;
    this.calls = { initialize: 0, listMappings: 0, create: 0, approve: 0 };
  }

  async initialize() { this.calls.initialize++; }
  async listCatalog() { return [{ id: 4126, cardCode: "OP17-002" }]; }
  async listAllMappings() {
    this.calls.listMappings++;
    if (this.failReadback) throw new ApplyError("Production unavailable", { code: "network_error" });
    return structuredClone(this.mappings);
  }

  async createMapping(snkrdunkId) {
    this.calls.create++;
    if (this.createBehavior === "success-readback-fails") {
      this.mappings.push(mapping({
        id: 91,
        snkrdunkId,
        productNumber: "OP17-002",
        status: "PENDING",
        matchedCardId: null,
      }));
      this.failReadback = true;
      return { created: true, mapping: this.mappings.at(-1) };
    }
    if (this.createBehavior === "ambiguous-after-create") {
      this.mappings.push(mapping({
        id: 91,
        snkrdunkId,
        productNumber: "OP17-002",
        status: "PENDING",
        matchedCardId: null,
      }));
      throw new ApplyError("timeout", { code: "network_error", ambiguous: true });
    }
    if (this.createBehavior === "wrong-target-response") {
      this.mappings.push(mapping({
        id: 91,
        snkrdunkId,
        productNumber: "OP17-002",
        status: "MATCHED",
        matchedCardId: 9999,
      }));
      return { created: true, mapping: this.mappings.at(-1) };
    }
    if (this.createBehavior === "unrelated-change") {
      this.mappings[0].status = "PENDING";
      this.mappings[0].matchedCardId = null;
      this.mappings.push(mapping({
        id: 91,
        snkrdunkId,
        productNumber: "OP17-002",
        status: "PENDING",
        matchedCardId: null,
      }));
      return { created: true, mapping: this.mappings.at(-1) };
    }
    this.mappings.push(mapping({
      id: 91,
      snkrdunkId,
      productNumber: "OP17-002",
      status: "PENDING",
      matchedCardId: null,
    }));
    return { created: true, mapping: this.mappings.at(-1) };
  }

  async approveMapping(mappingId, matchedCardId) {
    this.calls.approve++;
    const row = this.mappings.find((item) => item.id === mappingId);
    if (!row) throw new Error("missing mapping");
    if (this.approveBehavior === "ambiguous-before-change") {
      throw new ApplyError("timeout", { code: "network_error", ambiguous: true });
    }
    row.status = "MATCHED";
    row.matchedCardId = matchedCardId;
    return { mappingId, matchedCardId, status: "MATCHED" };
  }
}

test("apply gate ต้องมีทั้ง flag และ environment", () => {
  assert.throws(
    () => parseCliArgs(["--manifest", "manifest.json", "--apply"], {}),
    (error) => error instanceof UsageError && /MEECARD_SNKR_APPLY=1/.test(error.message),
  );
  const dry = parseCliArgs(["--manifest", "manifest.json"], {});
  assert.equal(dry.mode, "dry-run");
  const apply = parseCliArgs(["--manifest", "manifest.json", "--apply", "--max", "5"], { MEECARD_SNKR_APPLY: "1" });
  assert.equal(apply.mode, "apply");
  assert.equal(apply.max, 5);
  assert.throws(
    () => parseCliArgs(
      ["--manifest", "manifest.json", "--apply", "--admin-api-approve"],
      { MEECARD_SNKR_APPLY: "1", MEECARD_SNKR_ADMIN_API_APPROVE: "1" },
    ),
    /MEECARD_ADMIN_EMAIL.*MEECARD_ADMIN_PASSWORD/,
  );
  const admin = parseCliArgs(
    ["--manifest", "manifest.json", "--apply", "--admin-api-approve"],
    {
      MEECARD_SNKR_APPLY: "1",
      MEECARD_SNKR_ADMIN_API_APPROVE: "1",
      MEECARD_ADMIN_EMAIL: "admin@example.com",
      MEECARD_ADMIN_PASSWORD: "not-logged",
    },
  );
  assert.equal(admin.adminApiApprove, true);
  assert.equal(Object.hasOwn(admin, "email"), false);
  assert.equal(Object.hasOwn(admin, "password"), false);
  assert.throws(
    () => parseCliArgs(
      ["--manifest", "manifest.json", "--apply", "--admin-api-approve"],
      {
        MEECARD_SNKR_APPLY: "1",
        MEECARD_SNKR_ADMIN_API_APPROVE: "1",
        MEECARD_ADMIN_EMAIL: "admin@example.com",
        MEECARD_ADMIN_PASSWORD: "not-logged",
        MEECARD_ADMIN_API_URL: "https://attacker.example/api",
      },
    ),
    /meecardtcg\.com.*localhost/,
  );
  assert.throws(
    () => new AdminApiApprover("https://attacker.example/api", {
      email: "admin@example.com",
      password: "not-logged",
    }),
    /meecardtcg\.com.*localhost/,
  );
});

test("MCP application status 201 ถือว่าสำเร็จ", () => {
  const payload = parseToolResult({
    result: { structuredContent: { status: 201, data: { created: true } } },
  });
  assert.deepEqual(payload, { created: true });
});

test("catalog อ่านเฉพาะชุดที่อยู่ใน manifest และไม่โหลดทั้งฐาน", async () => {
  const client = new SnkrMcpClient("https://example.com/mcp");
  const calls = [];
  client.fetchAll = async (tool, args) => {
    calls.push({ tool, args });
    return [{ id: calls.length, cardCode: `${args.set}-001` }];
  };

  const rows = await client.listCatalog([
    manifestRow(),
    manifestRow({ snkrdunkId: 881550, matchedCardId: 4127, code: "OP17-003" }),
    manifestRow({ snkrdunkId: 855343, matchedCardId: 4040, code: "ST31-003" }),
  ]);

  assert.equal(rows.length, 2);
  assert.deepEqual(calls, [
    { tool: "card_list", args: { set: "OP17", sort: "id", order: "asc" } },
    { tool: "card_list", args: { set: "ST31", sort: "id", order: "asc" } },
  ]);
});

test("manifest ต้องมี numeric safe IDs, official images และ visual pass", () => {
  assert.equal(validateManifest([manifestRow()])[0].snkrdunkId, 881549);
  assert.throws(() => validateManifest([manifestRow({ snkrdunkId: "881549" })]), /จำนวนเต็มบวก/);
  assert.throws(() => validateManifest([manifestRow({ visual: { decision: "exact", pass: false } })]), /ผลตรวจภาพ/);
  assert.throws(() => validateManifest([manifestRow({ targetImageUrl: "https://example.com/card.png" })]), /เว็บทางการ/);
  assert.throws(() => validateManifest([
    manifestRow(),
    manifestRow({ snkrdunkId: 881550 }),
  ]), /target ซ้ำ/);
});

test("SNKR mutation HTTP 5xx เรียกครั้งเดียวและรายงาน ambiguous", async () => {
  let calls = 0;
  const client = new SnkrMcpClient("https://meecardtcg.com/mcp", {
    allowMutation: true,
    fetchImpl: async () => {
      calls++;
      return new Response("upstream failed", { status: 503 });
    },
  });
  client.sessionId = "test-session";
  await assert.rejects(
    () => client.createMapping(881549),
    (error) => error instanceof ApplyError && error.ambiguous === true,
  );
  assert.equal(calls, 1, "mutation must never retry");
});

test("Admin API signin ครั้งเดียว verify cookie แล้ว approve โดยไม่เผย credential", async () => {
  const requests = [];
  const approver = new AdminApiApprover("http://localhost:3000/api", {
    email: "admin@example.com",
    password: "super-secret",
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), options });
      if (String(url).endsWith("/admin/auth/signin")) {
        return new Response("{}", {
          status: 200,
          headers: { "set-cookie": "meecard_admin_session=session-secret; Path=/; HttpOnly" },
        });
      }
      if (String(url).endsWith("/admin/auth/verify")) {
        return Response.json({ authenticated: true });
      }
      return Response.json({ mappingId: 91, matchedCardId: 4126, status: "MATCHED" });
    },
  });
  await approver.initialize();
  await approver.initialize();
  const result = await approver.approveMapping(91, 4126);
  assert.equal(requests.filter((row) => row.url.endsWith("/admin/auth/signin")).length, 1);
  assert.equal(requests.filter((row) => row.url.endsWith("/admin/auth/verify")).length, 1);
  const approve = requests.find((row) => row.url.endsWith("/admin/snkrdunk-mappings/91/approve"));
  assert.equal(approve.options.method, "PATCH");
  assert.equal(approve.options.headers.cookie, "meecard_admin_session=session-secret");
  assert.deepEqual(JSON.parse(approve.options.body), { matchedCardId: 4126 });
  assert.equal(JSON.stringify({ approver, result }).includes("super-secret"), false);
  assert.equal(JSON.stringify({ approver, result }).includes("session-secret"), false);
});

test("Admin approve 5xx ไม่ retry และส่ง ambiguous ให้ core readback", async () => {
  let approveCalls = 0;
  const approver = new AdminApiApprover("http://localhost:3000/api", {
    email: "admin@example.com",
    password: "super-secret",
    fetchImpl: async (url) => {
      if (String(url).endsWith("/admin/auth/signin")) {
        return new Response("{}", {
          status: 200,
          headers: { "set-cookie": "meecard_admin_session=session-secret; Path=/; HttpOnly" },
        });
      }
      if (String(url).endsWith("/admin/auth/verify")) return Response.json({ authenticated: true });
      approveCalls++;
      return new Response("failed", { status: 503 });
    },
  });
  await approver.initialize();
  await assert.rejects(
    () => approver.approveMapping(91, 4126),
    (error) => error instanceof ApplyError && error.ambiguous === true,
  );
  assert.equal(approveCalls, 1);
});

test("create timeout ใช้ readback แล้ว approve ต่อโดยไม่ create ซ้ำ", async () => {
  const client = new FakeClient({ createBehavior: "ambiguous-after-create" });
  const journal = fakeJournal();
  const report = await runSupervisedApply({
    client,
    rows: [manifestRow()],
    apply: true,
    max: 1,
    journal,
    runId: "run-ambiguous",
  });
  assert.equal(report.stopped, false);
  assert.equal(report.results[0].outcome, "matched");
  assert.equal(report.results[0].ambiguousResolved, true);
  assert.equal(client.calls.create, 1);
  assert.equal(client.calls.approve, 1);
  assert.ok(journal.events.some((event) => event.event === "ambiguous_readback"));
});

test("mutation สำเร็จแต่ readback ล่มต้องบังคับอ่านกลับก่อน retry", async () => {
  const client = new FakeClient({ createBehavior: "success-readback-fails" });
  const report = await runSupervisedApply({
    client,
    rows: [manifestRow()],
    apply: true,
    journal: fakeJournal(),
  });
  assert.equal(report.stopped, true);
  assert.deepEqual(report.stopReason, {
    code: "ambiguous_unresolved",
    message: "create SNKR 881549 อาจสำเร็จแล้ว แต่ readback ล้ม: Production unavailable",
    operation: "create",
    readbackCode: "network_error",
    requiresReadbackBeforeRetry: true,
  });
  assert.equal(client.calls.create, 1);
  assert.equal(client.calls.approve, 0);
});

test("wrong target ใน mutation response หยุดทันที", async () => {
  const client = new FakeClient({ createBehavior: "wrong-target-response" });
  const report = await runSupervisedApply({
    client,
    rows: [manifestRow()],
    apply: true,
    journal: fakeJournal(),
  });
  assert.equal(report.stopped, true);
  assert.equal(report.stopReason.code, "wrong_response_target");
  assert.equal(client.calls.create, 1);
  assert.equal(client.calls.approve, 0);
  assert.equal(client.calls.listMappings, 1, "must stop before any further read/write after explicit wrong response");
});

test("unrelated mapping เปลี่ยนหลัง create แล้วหยุดก่อน approve", async () => {
  const client = new FakeClient({ createBehavior: "unrelated-change" });
  const report = await runSupervisedApply({
    client,
    rows: [manifestRow()],
    apply: true,
    journal: fakeJournal(),
  });
  assert.equal(report.stopped, true);
  assert.equal(report.stopReason.code, "unrelated_mapping_changed");
  assert.equal(client.calls.create, 1);
  assert.equal(client.calls.approve, 0);
});

test("dry-run อ่านอย่างเดียวและบอกแผน", async () => {
  const client = new FakeClient();
  const report = await runSupervisedApply({ client, rows: [manifestRow()], max: 1 });
  assert.equal(report.mode, "dry-run");
  assert.equal(report.results[0].plannedAction, "create");
  assert.equal(client.calls.create, 0);
  assert.equal(client.calls.approve, 0);
});

test("journal เป็น JSONL permission 0600 และเขียนครบก่อนคืนค่า", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "snkr-apply-test-"));
  const journalPath = path.join(directory, "journal", "run.jsonl");
  const journal = createJournal(journalPath);
  journal.append({ event: "test", value: 1 });
  journal.close();
  assert.equal(fs.statSync(journalPath).mode & 0o777, 0o600);
  const rows = fs.readFileSync(journalPath, "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(rows[0].event, "test");
  assert.equal(rows[0].value, 1);
});
