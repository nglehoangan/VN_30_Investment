import { createHash } from "node:crypto";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Wp1EvidenceReader } from "@/ports/accounting-preview";
import type { AccountingEvidencePin, Wp1Evidence } from "@/domain/portfolio/accounting-event-preview";
import { decimal, requireRule } from "@/domain/portfolio/values";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { exactJson } from "@/infrastructure/market-boundary/exact-json";
import { instant } from "@/shared/time";

const OWNER_PATH = "docs/fundamental-data-engine/governance/PORTFOLIO_OWNER_CONFIRMATIONS_2026-10-31.json";
const OWNER_HASH = "a2ff8d7457023a809bddffd9c0855784ffa8a1f3a48e1df22be8e051b6ff5542";
const OPENING = "BROKER_SNAPSHOT:cc46785ff2d4f7477911d0cb7dad6ee38b872b5cc6a8566a78683637fdf43852";
const BALANCE = "TCBS_API_RESPONSE:9e37ee7a6e882888e80370237c151efa02184399815df7c879f66405f3836253";
const PROFILE = "TCBS_API_RESPONSE:2aafee3f2905ea8ac3d3db67e77cd936302f710e31cc750167af54a6b3be606c";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
function record(value: unknown): Record<string, unknown> { requireRule(!!value && typeof value === "object" && !Array.isArray(value), "WP1_SOURCE_OBJECT_REQUIRED"); return value as Record<string, unknown>; }
function text(value: unknown): string { requireRule(typeof value === "string" && !!value.trim(), "WP1_SOURCE_TEXT_REQUIRED"); return value; }
function array(value: unknown): unknown[] { requireRule(Array.isArray(value), "WP1_SOURCE_ARRAY_REQUIRED"); return value; }
function pointer(value: unknown, path: string): unknown {
  return path.split("/").slice(1).reduce((v, part) => {
    requireRule(v !== null && typeof v === "object", "WP1_SOURCE_POINTER_MISSING");
    return (v as Record<string, unknown>)[part.replace(/~1/g, "/").replace(/~0/g, "~")];
  }, value);
}

/** Read-only byte/cell/account checks for the retained WP1 facts. This is NOT source admission. */
export class RetainedWp1EvidenceReader implements Wp1EvidenceReader {
  constructor(private readonly root: string, private readonly databaseFile: string) {}
  async read(): Promise<Wp1Evidence> {
    for (const suffix of ["-wal", "-journal"]) {
      const sidecar = `${this.databaseFile}${suffix}`;
      requireRule(!existsSync(sidecar) || statSync(sidecar).size === 0, "WP1_LIVE_DATABASE_SIDECAR");
    }
    const ownerBytes = readFileSync(resolve(this.root, OWNER_PATH), "utf8");
    requireRule(sha(ownerBytes) === OWNER_HASH, "WP1_OWNER_RECORD_HASH_MISMATCH");
    const owner = record(JSON.parse(ownerBytes));
    const filePins = array(owner.filePins).map(record);
    const file = (id: string, path: string): { data: unknown; pin: AccountingEvidencePin } => {
      const pin = filePins.find(p => p.path === id); requireRule(pin, "WP1_UNPINNED_FILE");
      const bytes = readFileSync(resolve(this.root, id), "utf8");
      requireRule(sha(bytes) === pin.sha256, "WP1_SOURCE_FILE_HASH_MISMATCH");
      const data: unknown = exactJson(bytes); pointer(data, path);
      return { data, pin: { id, sha256: text(pin.sha256), pointer: path, retrievedAt: null, knownAt: null } };
    };
    // Verify every retained owner binding, not only cells used below.
    for (const p of filePins) requireRule(sha(readFileSync(resolve(this.root, text(p.path)), "utf8")) === p.sha256, "WP1_SOURCE_FILE_HASH_MISMATCH");
    const sql = new DatabaseSync(this.databaseFile, { readOnly: true });
    try {
      const observation = (id: string, path: string) => {
        const row = sql.prepare("SELECT body,body_hash,received_at FROM broker_observation WHERE id=?").get(id);
        requireRule(row && sha(text(row.body)) === row.body_hash && id.endsWith(text(row.body_hash)), "WP1_OBSERVATION_HASH_MISMATCH");
        const body = record(exactJson(text(row.body))); pointer(body, path);
        const receivedAt = instant(text(row.received_at));
        if (body.receivedAt !== undefined) requireRule(body.receivedAt === receivedAt, "WP1_OBSERVATION_TIME_MISMATCH");
        if (body.raw !== undefined) requireRule(sha(text(body.raw)) === body.rawSha256, "WP1_RAW_HASH_MISMATCH");
        return { body, pin: { id, sha256: text(row.body_hash), pointer: path, retrievedAt: receivedAt, knownAt: receivedAt } };
      };
      const expected = record(owner.sourceEvidence);
      const openingRef = record(expected.opening), latestRef = record(expected.latest);
      const opening = observation(text(openingRef.id), "/data/stock"), latest = observation(text(latestRef.id), "/data/stock");
      for (const [item, pin] of [[opening, openingRef], [latest, latestRef]] as const) {
        requireRule(item.pin.sha256 === pin.bodySha256 && item.pin.retrievedAt === pin.receivedAt, "WP1_PINNED_OBSERVATION_MISMATCH");
        for (const [ticker, values] of Object.entries(record(pin.stock))) {
          const v = record(values), row = record(pointer(item.body, text(v.jsonPointer)));
          requireRule(row.symbol === ticker, "WP1_INSTRUMENT_BINDING_MISMATCH");
          for (const [key, expectedKey] of [["totalQtty", "total"], ["availableTrading", "available"], ["stockDividend", "pendingStockDividend"], ["cashDividend", "pendingCashDividend"]]) {
            requireRule(decimal(text(row[key])).eq(decimal(text(v[expectedKey]))), "WP1_SOURCE_AMOUNT_MISMATCH");
          }
        }
      }
      const latestData = record(latest.body.data), openingData = record(opening.body.data);
      if (latest.body.raw !== undefined) {
        const raw = record(exactJson(text(latest.body.raw)));
        requireRule(JSON.stringify(raw.stock) === JSON.stringify(latestData.stock), "WP1_NORMALIZED_RAW_MISMATCH");
      }
      const balance = observation(BALANCE, "/data/data/0"), profile = observation(PROFILE, "/data/basicInfo/code105C");
      const balanceData = record(pointer(balance.body, "/data/data/0"));
      requireRule(text(latestData.custodyID) === text(openingData.custodyID) && latestData.custodyID === balanceData.custodyID && latestData.custodyID === pointer(profile.body, "/data/basicInfo/code105C") && text(latestData.accountNo) === text(openingData.accountNo) && latestData.accountNo === balanceData.accountNo, "WP1_ACCOUNT_SOURCE_MISMATCH");
      const accountReference = sha(JSON.stringify([latestData.custodyID, latestData.accountNo]));
      const receiptPath = "docs/fundamental-data-engine/evidence/2026-10-28-b2-cash-excel-screen-review/CASH_HISTORY.json";
      const receipt = file(receiptPath, "/reports/1/rows/57"), receiptRow = record(pointer(receipt.data, receipt.pin.pointer));
      requireRule(receiptRow.date === "2026-10-16" && receiptRow.amountVnd === "95000" && receiptRow.endBalanceVnd === "327420" && text(receiptRow.dividendDescription).includes("MWG") && text(receiptRow.dividendDescription).includes("08/10/2026"), "WP1_RECEIPT_IDENTITY_MISMATCH");
      requireRule(JSON.stringify(record(receiptRow.sourceCells)) === JSON.stringify({ date: "A71", type: "B71", amount: "C71", balance: "D71", description: "E71" }), "WP1_RECEIPT_CELL_BINDING_MISMATCH");
      const snapshot = observation(OPENING, "/cash/pendingDividends");
      requireRule(pointer(snapshot.body, "/cash/pendingDividends") === "570000" && pointer(snapshot.body, "/cash/balance") === "232420", "WP1_OPENING_SOURCE_MISMATCH");
      const feeStatus = file("docs/fundamental-data-engine/evidence/2026-10-28-b2-cash-excel-screen-review/STATUS.json", "/asOfDate");
      requireRule(pointer(feeStatus.data, "/asOfDate") === "2026-10-28" && pointer(feeStatus.data, "/paymentPosted") === false && decimal(text(balanceData.depoFee)).eq(decimal("420")), "WP1_CUSTODY_FACT_MISMATCH");
      const ownerEvidence: AccountingEvidencePin = { id: OWNER_PATH, sha256: OWNER_HASH, pointer: "/facts", knownAt: null, retrievedAt: null };
      return deepFreeze({ portfolioId: "tcbs-personal-v1", accountReference,
        openingBalances: { cash: text(pointer(snapshot.body, "/cash/balance")), receivables: text(pointer(snapshot.body, "/cash/pendingDividends")) },
        openingEvidence: snapshot.pin, ownerEvidence, receiptEvidence: receipt.pin,
        feeEvidence: { ...balance.pin, pointer: "/data/data/0/depoFee" }, feePolicyEvidence: feeStatus.pin, openingHoldings: opening.pin, latestHoldings: latest.pin,
        receipt: { id: "MWG_2026-10-16_EXCEL_A71_E71", issuer: "MWG", amount: text(receiptRow.amountVnd), receiptDate: text(receiptRow.date), recordDate: "2026-10-08" },
        fee: { amount: decimal(text(balanceData.depoFee)).toString(), asOfDate: "2026-10-28" },
        ownership: { sourceReference: latest.pin.id, accountReference, receivedAt: latest.pin.retrievedAt!, economicAsOf: null,
          positions: array(latestData.stock).map(record).map(r => ({ securityId: text(r.symbol), total: decimal(text(r.totalQtty)).toString(), available: decimal(text(r.availableTrading)).toString(), pending: decimal(text(r.stockDividend)).toString(), actionReference: null })) } });
    } finally { sql.close(); }
  }
}
