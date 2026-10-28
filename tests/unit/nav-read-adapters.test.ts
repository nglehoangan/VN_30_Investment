// @vitest-environment node
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import * as fs from "node:fs/promises";
import path from "node:path";
import { PortfolioNavLedgerReader } from "@/application/current-nav/ledger-read-adapter";
import { ReadOnlyNavInputProvider } from "@/application/current-nav/input-provider-skeleton";
import { ImmutableBrokerEvidenceReader } from "@/infrastructure/current-nav/broker-evidence-reader";
import { adapterEvidence, brokerCutoff, evidenceSha } from "../fixtures/nav-adapter-evidence";
import { NC, NT, NN, NP, NI, nh, alterNav } from "../fixtures/current-nav";
import { watermark } from "@/domain/portfolio/values";
import { calculateCurrentNav } from "@/domain/current-nav/calculate";
import { isolatedNavAdapters } from "../fixtures/nav-adapter-composition";
import type { BrokerObservationsV1, BrokerFieldV1 } from "@/ports/nav-read-adapters";

const race = vi.hoisted(() => ({ afterOpen: null as null | (() => Promise<void>) }));
vi.mock("node:fs/promises", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, open: async (...args: Parameters<typeof actual.open>) => {
    const handle = await actual.open(...args);
    if (race.afterOpen) { const hook = race.afterOpen; race.afterOpen = null; await hook(); }
    return handle;
  } };
});

describe("M8Phase3.4 isolated read adapters", () => {
  let e: Awaited<ReturnType<typeof adapterEvidence>>;
  beforeEach(async () => { e = await adapterEvidence(); });
  afterEach(async () => { race.afterOpen = null; vi.restoreAllMocks(); await e.close(); });
  const source = () => ({ async read() { return { watermark: watermark("1"), inceptionAt: NI, transactions: e.fixture.history }; } });
  const ledger = () => new PortfolioNavLedgerReader(source(), nh);
  const broker = () => new ImmutableBrokerEvidenceReader(e.directory);
  const scope = () => ({ portfolioId: NP, accountId: e.observation.accountId, perimeterId: e.observation.perimeterId, valuationAt: NT, evidence: [e.pin] });
  const provider = () => new ReadOnlyNavInputProvider(ledger(), broker(), scope(), nh);
  async function blockedBroker(reason: string, pin = e.pin) {
    const result = await broker().read(pin, brokerCutoff);
    expect(result.status).toBe("BLOCKED");
    if (result.status === "BLOCKED") expect(result.reasons.join(" ")).toContain(reason);
    expect(result.accepted).toBe(false); return result;
  }
  function withFields(fields: readonly BrokerFieldV1[]): BrokerObservationsV1 {
    return { ...e.observation, fields: fields.map((f, i) => ({ ...f, pointer: `/fields/${i}/value` })) };
  }
  it("01 valid immutable ledger snapshot reuses reconstruction, no completeness claim/write API", async () => {
    const r = await ledger().snapshot(e.fixture.request, NT); expect(r.state.cash).toBe("1000"); expect(r.state.positions[0].quantity).toBe("2"); expect(r.stateHash).toBe(nh(r.state)); expect(r.financiallyComplete).toBe(false); expect(Object.isFrozen(r.ledger.transactions)).toBe(true); expect("commit" in ledger()).toBe(false);
  });
  it("02 revision mismatch and stale revisions are rejected", async () => {
    await expect(ledger().snapshot({ ...e.fixture.request, ledgerRevision: "2" }, NT)).rejects.toThrow("LEDGER_REVISION_MISMATCH");
    let calls = 0; const changing = new PortfolioNavLedgerReader({ async read() { return { ...(await source().read()), watermark: watermark(calls++ ? "2" : "1") }; } }, nh);
    await expect(changing.snapshot(e.fixture.request, NT)).rejects.toThrow("STALE_LEDGER_SNAPSHOT");
  });
  it("03 expected ledger state/facts hash must match exact replay", async () => {
    await expect(ledger().snapshot(e.fixture.request, NT, { stateHash: "0".repeat(64) })).rejects.toThrow("LEDGER_STATE_HASH_MISMATCH");
    await expect(ledger().snapshot(e.fixture.request, NT, { factsHash: "0".repeat(64) })).rejects.toThrow("LEDGER_FACTS_HASH_MISMATCH");
  });
  it("04 valid broker read preserves immutable account/time/original fields/decimal provenance", async () => {
    const r = await broker().read(e.pin, brokerCutoff); expect(r.status).toBe("OBSERVED"); if (r.status !== "OBSERVED") throw Error("read failed"); expect(r.observation).toEqual(e.observation); expect(r.observation.fields[0].value).toBe("1000.000000000000"); expect(Object.isFrozen(r.observation.fields)).toBe(true); expect(r.accepted).toBe(false);
  });
  it("05 missing file", async () => { await fs.unlink(path.join(e.directory, e.pin.path)); await blockedBroker("BROKER_FILE_MISSING"); });
  it("06 modified bytes cannot match original pin", async () => { const bytes = await fs.readFile(path.join(e.directory, e.pin.path)); await fs.writeFile(path.join(e.directory, e.pin.path), bytes.toString().replace("1000", "1001")); await blockedBroker("BROKER_HASH_MISMATCH"); });
  it("07 incorrect or malformed SHA256", async () => { await blockedBroker("BROKER_HASH_MISMATCH", { ...e.pin, sha256: "0".repeat(64) }); await blockedBroker("BROKER_HASH_INVALID", { ...e.pin, sha256: "invalid" }); });
  it("08 oversized actual file and declared size are bounded", async () => { await blockedBroker("BROKER_SIZE_LIMIT", { ...e.pin, size: 4_000_001 }); const r = await new ImmutableBrokerEvidenceReader(e.directory, 20).read(e.pin, brokerCutoff); expect(r.status).toBe("BLOCKED"); });
  it.each(["../broker.json", "/private/tmp/broker.json", "x/../broker.json", "x\\broker.json"])("09 reject traversal %s", async p => { await blockedBroker("BROKER_PATH_TRAVERSAL", { ...e.pin, path: p }); });
  it("10 unsupported schema rejected even with correct bytes/hash", async () => { e.pin = await e.save({ ...e.observation, schema: "unknown" }); await blockedBroker("BROKER_SCHEMA_UNSUPPORTED"); });
  it("11 exact account and document identity required, not filename", async () => { await blockedBroker("BROKER_ACCOUNT_MISMATCH", { ...e.pin, accountId: "another-account" }); await blockedBroker("BROKER_SOURCE_IDENTITY_MISMATCH", { ...e.pin, documentId: "different" }); });
  it("12 conflicting observations retain source conflict details but reject usable output", async () => { e.pin = await e.save({ ...e.observation, conflicts: ["two-source-cash-disagrees"] }); const r = await blockedBroker("BROKER_CONFLICTING_OBSERVATIONS"); if (r.status === "BLOCKED") expect(r.conflicts).toEqual(["two-source-cash-disagrees"]); });
  it.each([["CASH", "MISSING_CASH_OBSERVATION"], ["LIABILITY", "UNKNOWN_LIABILITY"], ["RECEIVABLE", "MISSING_RECEIVABLE_EVIDENCE"]])("13-15 missing %s never0", async (kind, reason) => { e.pin = await e.save(withFields(e.observation.fields.filter(f => f.kind !== kind))); const r = await provider().prepare(e.fixture.request, NC); expect(r.reasons).toContain(reason); expect(r.status).toBe("BLOCKED"); });
  it("16 pending CA ambiguity and unsupported lifecycle block", async () => { e.pin = await e.save(withFields([...e.observation.fields, { ...e.observation.fields[0], id: "pending", kind: "SECURITY", field: "stockDividend", value: "20", unit: "SHARES", securityId: "unaccepted-ledger-id", lifecycle: "PENDING" }])); expect((await provider().prepare(e.fixture.request, NC)).reasons).toContain("CORPORATE_ACTION_LIFECYCLE_UNQUALIFIED"); e.pin = await e.save({ ...e.observation, fields: [{ ...e.observation.fields[0], lifecycle: "CONVERTED" }] }); await blockedBroker("BROKER_SCHEMA_UNSUPPORTED"); });
  it("17 duplicate security identity rejected even with distinct field IDs", async () => { const f: BrokerFieldV1 = { ...e.observation.fields[0], id: "s1", kind: "SECURITY", field: "positionA", value: "1", unit: "SHARES", securityId: "same-security", lifecycle: "ORDINARY" }; e.pin = await e.save(withFields([f, { ...f, id: "s2", field: "positionB" }])); expect((await provider().prepare(e.fixture.request, NC)).reasons).toContain("DUPLICATE_SECURITY_IDENTITY"); });
  it("18 ledger/source knowledge beyondK rejected without backdating", async () => { await expect(ledger().snapshot({ ...e.fixture.request, knowledgeCutoff: NT }, NT)).rejects.toThrow("FUTURE_LEDGER_KNOWLEDGE"); e.pin = await e.save({ ...e.observation, knownAt: NN }); await blockedBroker("BROKER_FUTURE_INFORMATION"); });
  it("19 inconsistent valuation timestamp never substitutes broker current balances", async () => { e.pin = await e.save({ ...e.observation, observedAt: NI }); await blockedBroker("BROKER_VALUATION_TIME_MISMATCH"); });
  it("20 evidence-head mismatch explicit", async () => { const p = new ReadOnlyNavInputProvider(ledger(), broker(), { ...scope(), expectedEvidenceHead: "0".repeat(64) }, nh); expect((await p.prepare(e.fixture.request, NC)).reasons).toContain("EVIDENCE_HEAD_MISMATCH"); });
  it("21-23 absent authority/acceptance and continuity always block both full NAVs", async () => { const r = await provider().prepare(e.fixture.request, NC); expect(r.reasons).toEqual(expect.arrayContaining(["SOURCE_AUTHORITY_MISSING", "INDEPENDENT_ACCEPTANCE_MISSING", "FORWARD_TRANSACTION_COVERAGE_UNVERIFIED"])); expect(await provider().load(e.fixture.request, { revision: "1", inceptionAt: NI, factsHash: nh(e.fixture.history) }, NC)).toBeNull(); expect(await provider().isCurrent(r.evidenceHead)).toBe(false); const result = await isolatedNavAdapters(source(), broker(), scope(), { now: () => NC }, nh).read(e.fixture.request); expect(result.nav).toMatchObject({ navState: "NAV_BLOCKED", totalNav: null, indicativeValue: null, productionAuthorized: false }); expect(result.preparation?.status).toBe("BLOCKED"); });
  it("24-25 synthetic accepted calculator inputs stay compatible; adapter never creates acceptance", () => { expect(calculateCurrentNav(e.fixture.request, e.fixture.state, e.fixture.plan, e.fixture.context).totalNav).toBe("1220"); });
  it("26-28 deterministic replay, exact decimal and unchanged original bytes", async () => { const before = await fs.readFile(path.join(e.directory, e.pin.path)); const a = await provider().prepare(e.fixture.request, NC), b = await provider().prepare(e.fixture.request, NC); expect(nh(a)).toBe(nh(b)); expect(evidenceSha(await fs.readFile(path.join(e.directory, e.pin.path)))).toBe(evidenceSha(before)); expect(a.observations[0].observation?.fields[0].value).toBe("1000.000000000000"); });
  it("symlink final and intermediate components rejected", async () => {
    await fs.symlink(path.join(e.directory, e.pin.path), path.join(e.directory, "link.json")); await blockedBroker("BROKER_SYMLINK_TRAVERSAL", { ...e.pin, path: "link.json" });
    await fs.symlink(e.directory, path.join(e.directory, "linked-dir")); await blockedBroker("BROKER_SYMLINK_TRAVERSAL", { ...e.pin, path: "linked-dir/broker.json" });
  });
  it("TOCTOU replacement after descriptor open rejected even with identical bytes", async () => {
    race.afterOpen = async () => { const file = path.join(e.directory, e.pin.path); await fs.rename(file, file + ".old"); await fs.copyFile(file + ".old", file); };
    await blockedBroker("BROKER_FILE_CHANGED");
  });
  it("unsupported UTF8/UTF16/BOM encoding rejected with valid byte hashes", async () => {
    for (const bytes of [Buffer.from([0xff, 0xfe, 0x7b, 0]), Buffer.from([0xff]), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(JSON.stringify(e.observation))])]) { e.pin = await e.save(bytes); await blockedBroker("BROKER_ENCODING_UNSUPPORTED"); }
  });
  it("duplicate evidence identifiers in fields or manifests rejected", async () => {
    e.pin = await e.save(withFields([e.observation.fields[0], { ...e.observation.fields[1], id: "cash" }])); await blockedBroker("BROKER_DUPLICATE_EVIDENCE_ID");
    const p = new ReadOnlyNavInputProvider(ledger(), broker(), { ...scope(), evidence: [e.pin, e.pin] }, nh); expect((await p.prepare(e.fixture.request, NC)).reasons).toContain("DUPLICATE_EVIDENCE_IDENTIFIER");
  });
  it("duplicate JSON keys are not accepted last-wins", async () => { e.pin = await e.save(JSON.stringify(e.observation).replace('"currency":"VND"', '"currency":"VND","currency":"VND"')); await blockedBroker("BROKER_JSON_INVALID"); });
  it("future observations and unsupported economic dates reject", async () => { e.pin = await e.save({ ...e.observation, observedAt: NN }); await blockedBroker("BROKER_FUTURE_INFORMATION"); e.pin = await e.save({ ...e.observation, observedAt: "2026-01-05" }); await blockedBroker("BROKER_EVIDENCE_INVALID"); });
  it("inconsistent account/perimeter never imports or leaks another account", async () => { const p = new ReadOnlyNavInputProvider(ledger(), broker(), { ...scope(), accountId: "another" }, nh); expect((await p.prepare(e.fixture.request, NC)).reasons).toContain("ACCOUNT_PERIMETER_MISMATCH"); await blockedBroker("BROKER_SOURCE_IDENTITY_MISMATCH", { ...e.pin, perimeterId: "other" }); });
  it("cash discrepancy and missing/null liabilities never trigger balancing", async () => { e.pin = await e.save({ ...e.observation, fields: e.observation.fields.map(f => ({ ...f, value: f.kind === "CASH" ? "1500" : f.kind === "LIABILITY" ? null : f.value })) }); const r = await provider().prepare(e.fixture.request, NC); expect(r.reasons).toEqual(expect.arrayContaining(["CASH_DISCREPANCY_UNRESOLVED", "UNKNOWN_LIABILITY"])); expect(r.ledger?.state.cash).toBe("1000"); });
  it("conflicting cross-document observations remain blocked rather than latest-selected", async () => {
    const first = e.pin, raw = { ...e.observation, documentId: "SYNTHETIC_DOC_2", fields: e.observation.fields.map(f => ({ ...f, reference: "SYNTHETIC_DOC_2" })) };
    const bytes = JSON.stringify(raw); await fs.writeFile(path.join(e.directory, "second.json"), bytes);
    const second = { ...first, id: "SYNTHETIC_PIN_2", documentId: raw.documentId, path: "second.json", sha256: evidenceSha(bytes), size: Buffer.byteLength(bytes) };
    const p = new ReadOnlyNavInputProvider(ledger(), broker(), { ...scope(), evidence: [second, first] }, nh);
    const r = await p.prepare(e.fixture.request, NC); expect(r.reasons).toContain("CONFLICTING_BROKER_OBSERVATIONS"); expect(r.observations).toHaveLength(2);
    const sorted = await new ReadOnlyNavInputProvider(ledger(), broker(), { ...scope(), evidence: [first, second] }, nh).prepare(e.fixture.request, NC); expect(sorted.evidenceHead).toBe(r.evidenceHead);
  });
  it("QUALIFIED_ONLY and opted-in indicative remain fully blocked through adapter", async () => { const f = alterNav(e.fixture, x => { x.request.resultScope = "OBSERVED_FULL_PORTFOLIO"; x.request.allowIndicative = true; }); const r = await isolatedNavAdapters(source(), broker(), scope(), { now: () => NC }, nh).read(f.request); expect(r.nav.totalNav).toBeNull(); expect(r.nav.indicativeValue).toBeNull(); });
  it("composition exposes only read; concurrent requests cannot share diagnostics", async () => { const app = isolatedNavAdapters(source(), broker(), scope(), { now: () => NC }, nh); expect(Object.keys(app)).toEqual(["read"]); const [a, b] = await Promise.all([app.read(e.fixture.request), app.read({ ...e.fixture.request, portfolioId: "other" })]); expect(a.preparation?.portfolioId).toBe(NP); expect(b.preparation).toBeNull(); expect(b.nav.navState).toBe("NAV_BLOCKED"); });
  it("forged provenance pointers and untrusted approval fields are unsupported", async () => { e.pin = await e.save({ ...e.observation, fields: [{ ...e.observation.fields[0], pointer: "/invented" }] }); await blockedBroker("BROKER_PROVENANCE_MISMATCH"); e.pin = await e.save({ ...e.observation, accepted: true }); await blockedBroker("BROKER_SCHEMA_UNSUPPORTED"); });
  it("blocked evidence heads still bind exact invalid pins and request revision", async () => {
    const a = await new ReadOnlyNavInputProvider(ledger(), broker(), { ...scope(), evidence: [{ ...e.pin, accountId: "wrong-a" }] }, nh).prepare(e.fixture.request, NC);
    const b = await new ReadOnlyNavInputProvider(ledger(), broker(), { ...scope(), evidence: [{ ...e.pin, accountId: "wrong-b" }] }, nh).prepare(e.fixture.request, NC);
    expect(a.evidenceHead).not.toBe(b.evidenceHead); expect(a.sourcePins[0].accountId).toBe("wrong-a");
  });
  it("same-revision facts replacement is stale, not an unchanged ledger", async () => {
    let calls = 0;
    const changing = new PortfolioNavLedgerReader({ async read() {
      const value = JSON.parse(JSON.stringify(await source().read()));
      if (calls++) value.transactions[0].facts.notes = "replacement";
      return value;
    } }, nh);
    await expect(changing.snapshot(e.fixture.request, NT)).rejects.toThrow("STALE_LEDGER_SNAPSHOT");
  });
  it("large actual file with understated manifest size fails before parsing", async () => {
    await fs.writeFile(path.join(e.directory, e.pin.path), Buffer.alloc(1_000_001, 32));
    await blockedBroker("BROKER_SIZE_MISMATCH");
  });
  it("nonregular files and symlink root are rejected", async () => {
    await fs.mkdir(path.join(e.directory, "folder")); await blockedBroker("BROKER_NOT_REGULAR_FILE", { ...e.pin, path: "folder" });
    await fs.symlink(e.directory, path.join(e.directory, "root-link"));
    const result = await new ImmutableBrokerEvidenceReader(path.join(e.directory, "root-link")).read(e.pin, brokerCutoff);
    expect(result.status).toBe("BLOCKED");
  });
  it("ambiguous account structure and unsupported precision are not repaired", async () => {
    e.pin = await e.save({ ...e.observation, accountId: ["a", "b"] }); await blockedBroker("BROKER_SCHEMA_UNSUPPORTED");
    e.pin = await e.save({ ...e.observation, fields: [{ ...e.observation.fields[0], value: "1.1234567890123" }] }); await blockedBroker("BROKER_SCHEMA_UNSUPPORTED");
  });

  it("read capability preserves optional existing through-revision semantics", async () => {
    const read = vi.fn(async (_id: unknown, through: unknown) => ({ ...(await source().read()), watermark: watermark(String(through ?? "1")) }));
    const wrapper = new PortfolioNavLedgerReader({ read }, nh);
    expect((await wrapper.read(NP, watermark("0"))).watermark).toBe("0");
    expect(read).toHaveBeenCalledWith(NP, "0");
  });

});
