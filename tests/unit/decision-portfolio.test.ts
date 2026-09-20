import { it, expect } from "vitest";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { DerivedDecisionPortfolioRead } from "@/application/decision/portfolio-context";
import { P, A, B, NOW, W0, at, history, goldenInputs } from "../fixtures/portfolio/history";
import { dateOnly } from "@/shared/time";
import type { ReconciliationEvidence } from "@/domain/portfolio/reconciliation";
it.each([false, true])("decision consumes real M6.3 snapshot without writes; cost-only gap %s", async costOnly => {
  let writes = 0;
  const transactions = history(goldenInputs());
  const engine = new PortfolioEngine({ read: async () => ({ inceptionAt: at(1), watermark: W0, transactions }), commit: async () => { writes++; throw new Error("No decision ledger mutation"); } }, { now: () => NOW });
  const evidence: ReconciliationEvidence = { id: "statement", portfolioId: P, asOf: at(12), receivedAt: at(12), sourceReference: "Synthetic statement", cash: "8270", receivables: "0", payables: "0", unresolvedDiscrepancy: false, positions: [{ securityId: A, quantity: "90", openCost: costOnly ? null : "966" }, { securityId: B, quantity: "20", openCost: costOnly ? null : "1000" }] };
  const snapshot = await engine.snapshot(P, at(12), { version: "p", methodologyId: "test-valuation", observations: [A, B].map((securityId, index) => ({ id: `price-${index}`, securityId, price: index ? "60" : "15", currency: "VND", observedAt: at(12), receivedAt: at(12), validThrough: at(12), sourceReference: "Synthetic" })) }, evidence, { version: "reference-v1", intervals: [A, B].flatMap((securityId, index) => [{ id: `m-${index}`, kind: "MEMBERSHIP", securityId, from: dateOnly("2026-01-01"), to: null, value: "MEMBER", taxonomy: null, sourceReference: "Synthetic" }, { id: `s-${index}`, kind: "SECTOR", securityId, from: dateOnly("2026-01-01"), to: null, value: "INDUSTRIAL", taxonomy: "test", sourceReference: "Synthetic" }]) }, "test");
  const reader = new DerivedDecisionPortfolioRead(async () => ({ snapshot, evidence, current: true }), async () => true);
  const result = await reader.read(snapshot.asOf);
  expect(result.integrity.status).toBe("PASS"); expect(result.integrity.costStatus).toBe(costOnly ? "BLOCKED" : "PASS");
  expect(result.executableCash).toBe("8270"); expect(result.nav).toBe(snapshot.valuation.nav); expect(result.integrity.ledgerWatermark).toBe(snapshot.ledgerWatermark);
  expect(result.positions[0].shares).toBe(snapshot.valuation.positions[0].quantity); expect(result.positions[0]).not.toHaveProperty("openCost");
  expect(writes).toBe(0); expect(Object.isFrozen(result)).toBe(true);
});
