import { createHash } from "node:crypto";
import { mkdtemp, realpath, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { navFixture, NP, NT, NC } from "./current-nav";
import type { BrokerObservationsV1, BrokerEvidencePinV1 } from "@/ports/nav-read-adapters";
export const evidenceSha = (b: Uint8Array | string) => createHash("sha256").update(b).digest("hex");
export function brokerObservation(): BrokerObservationsV1 {
  return { schema: "nav-broker-observations-v1", documentId: "SYNTHETIC_DOC", provider: "SYNTHETIC_BROKER", accountId: "SYNTHETIC_ACCOUNT", portfolioId: NP, perimeterId: "SYNTHETIC_PERIMETER", observedAt: NT, retrievedAt: NC, knownAt: NC, publicationAt: null, currency: "VND", conflicts: [], fields: [
    { id: "cash", field: "originalCashBalance", kind: "CASH", value: "1000.000000000000", unit: "VND", securityId: null, lifecycle: null, reference: "SYNTHETIC_DOC", pointer: "/fields/0/value" },
    { id: "claim", field: "originalPendingClaim", kind: "RECEIVABLE", value: "30", unit: "VND", securityId: null, lifecycle: null, reference: "SYNTHETIC_DOC", pointer: "/fields/1/value" },
    { id: "debt", field: "originalTradePayable", kind: "LIABILITY", value: "10", unit: "VND", securityId: null, lifecycle: null, reference: "SYNTHETIC_DOC", pointer: "/fields/2/value" },
  ] };
}
export async function adapterEvidence() {
  const directory = await realpath(await mkdtemp(path.join(tmpdir(), "vn30-nav-readonly-")));
  const observation = brokerObservation();
  const pin: BrokerEvidencePinV1 = { id: "SYNTHETIC_PIN", path: "broker.json", sha256: "", size: 1, schema: observation.schema, documentId: observation.documentId, provider: observation.provider, accountId: observation.accountId, portfolioId: observation.portfolioId, perimeterId: observation.perimeterId };
  async function save(raw: unknown = observation) {
    const bytes = typeof raw === "string" || raw instanceof Uint8Array ? raw : JSON.stringify(raw);
    await writeFile(path.join(directory, pin.path), bytes);
    return { ...pin, sha256: evidenceSha(bytes), size: Buffer.byteLength(bytes) };
  }
  const initial = await save();
  return { directory, observation, pin: initial, save, fixture: navFixture(), async close() { await rm(directory, { recursive: true, force: true }); } };
}
export const brokerCutoff = { valuationAt: NT, knowledgeCutoff: NC, calculatedAt: NC };
