import type { CurrentSourceProvider } from "@/ports/current";
import type { Clock } from "@/ports/runtime";
import type { PortfolioLedger } from "@/ports/portfolio";
import { PortfolioEngine } from "@/application/portfolio/engine";
import { DerivedDecisionPortfolioRead } from "@/application/decision/portfolio-context";
import type { CurrentSource } from "@/ports/current";
import { portfolioId, securityId, decimal, Decimal } from "@/domain/portfolio/values";
import { instant, dateOnly } from "@/shared/time";
import { validateReference } from "@/domain/portfolio/reference";
export type CurrentSnapshot = Awaited<ReturnType<PortfolioEngine["snapshot"]>>;
export interface CurrentModel {
  label: "CURRENT READ MODEL"; status: "VALID" | "BLOCKED" | "STALE" | "UNAVAILABLE";
  actionability: "PASS" | "BLOCKED"; reasons: readonly string[]; scope: string | null; sourceVersion: string | null; referenceVersion: string | null; valuationMethodology: string | null;
  portfolioAsOf: string | null; evidenceCutoff: string | null; referenceAsOf: string | null;
  priceFreshness: string; referenceFreshness: string; reconciliation: string;
  nav: string | null; marketValue: string | null; unrealizedPnl: string | null;
  positions: readonly { securityId: string; currentPrice: string | null; marketValue: string | null; unrealizedPnl: string | null; weight: string | null; sector: string | null; priceAsOf: string | null; provider: string | null; retrievedAt: string | null; sourceReference: string | null; priceStatus: string }[];
  sectors: readonly { sector: string; marketValue: string; weight: string | null }[];
}
export const unavailableCurrent = (reason = "SOURCE_UNAVAILABLE"): CurrentModel => ({ label: "CURRENT READ MODEL", status: "UNAVAILABLE", actionability: "BLOCKED", reasons: [reason], scope: null, sourceVersion: null, referenceVersion: null, valuationMethodology: null, portfolioAsOf: null, evidenceCutoff: null, referenceAsOf: null, priceFreshness: "UNKNOWN", referenceFreshness: "UNKNOWN", reconciliation: "MISSING_EVIDENCE", nav: null, marketValue: null, unrealizedPnl: null, positions: [], sectors: [] });
export class CurrentReadService {
  constructor(private readonly ledger: PortfolioLedger, private readonly source: CurrentSourceProvider, private readonly clock: Clock) {}
  async capture(id: string): Promise<{ model: CurrentModel; source: CurrentSource | null; snapshot: CurrentSnapshot | null }> {
    const raw = await this.source.load(id);
    if (!raw) return { model: unavailableCurrent(), source: null, snapshot: null };
    const s = raw, now = this.clock.now();
    if (s.portfolioId !== id || s.asOf > s.receivedAt || s.receivedAt > now || s.referenceAsOf > s.asOf) throw new Error("INVALID_SOURCE_TIME_OR_IDENTITY");
    const references = { ...s.references, intervals: s.references.intervals.map(r => ({ ...r, securityId: r.securityId ? securityId(r.securityId) : null, from: dateOnly(r.from), to: r.to ? dateOnly(r.to) : null })) };
    validateReference(references);
    if (s.reconciliation && s.reconciliation.receivedAt > s.receivedAt) throw new Error("FUTURE_RECONCILIATION");
    for (const p of s.prices) if (p.receivedAt > s.receivedAt || p.observedAt > p.receivedAt || (p.validThrough && p.validThrough < p.observedAt) || !decimal(p.price).positive) throw new Error("INVALID_PRICE_PROVENANCE");
    const held = await new PortfolioEngine(this.ledger, this.clock).reconstruct(portfolioId(id), instant(s.asOf));
    const selected = held.positions.filter(p => decimal(p.quantity).positive).map(p => s.prices.filter(o => o.securityId === p.securityId && o.observedAt <= s.asOf).sort((a,b) => b.observedAt.localeCompare(a.observedAt))[0]);
    const unknown = selected.some(p => p && (!p.policyReference || !p.validThrough));
    const conflict = selected.some(p => p && s.prices.filter(o => o.securityId === p.securityId && o.observedAt === p.observedAt).length > 1);
    const bad = conflict || selected.some(p => !p || p.quality !== "VALID" || p.adjustment !== "RAW");
    const stale = selected.some(p => p?.validThrough && p.validThrough < now);
    // No silent fallback to older valid rows when the latest observation is invalid/unknown.
    const observations = s.prices.filter(p => p.quality === "VALID" && p.adjustment === "RAW" && p.policyReference && p.validThrough)
      .map(p => ({ id:p.id, securityId:p.securityId, price:p.price, currency:p.currency, observedAt:instant(p.observedAt), receivedAt:instant(p.receivedAt), validThrough:instant(p.validThrough!), sourceReference:p.sourceReference }));
    const snapshot = await new PortfolioEngine(this.ledger, { now: () => instant(s.receivedAt) }).snapshot(portfolioId(id), instant(s.asOf), { version:s.version, methodologyId:s.valuationMethodologyId, observations }, s.reconciliation ? { ...s.reconciliation, asOf:instant(s.reconciliation.asOf), receivedAt:instant(s.reconciliation.receivedAt) } : null, references, s.taxonomy);
    const reasons: string[] = [];
    if (s.scope !== "FORMAL") reasons.push("SYNTHETIC_TEST_SOURCE");
    const latestLedger = await this.ledger.read(portfolioId(id));
    if (latestLedger.transactions.some(t => t.facts.effectiveAt > s.asOf || t.createdAt > s.receivedAt) || held.ledgerWatermark !== s.ledgerWatermark || !(await new PortfolioEngine(this.ledger,this.clock).isCurrent(snapshot))) reasons.push("STALE_PORTFOLIO");
    if (unknown) reasons.push("PRICE_FRESHNESS_UNKNOWN");
    if (bad) reasons.push(conflict ? "CONFLICTING_DATA" : "INVALID_OR_MISSING_PRICE");
    if (stale) reasons.push("STALE_PRICE");
    const referenceFreshness = !s.referencePolicy || !s.referenceValidThrough ? "UNKNOWN" : s.referenceValidThrough < now ? "STALE" : "VALID";
    if (referenceFreshness !== "VALID") reasons.push("REFERENCE_FRESHNESS_"+referenceFreshness);
    if (snapshot.actionabilityBlocked) reasons.push("M63_SNAPSHOT_BLOCKED");
    const valuationValid = !reasons.includes("STALE_PORTFOLIO") && !unknown && !bad && !stale && snapshot.valuation.status === "VALID";
    const positions = snapshot.valuation.positions.map(p => {
      const o=s.prices.filter(o=>o.securityId===p.securityId&&o.observedAt<=s.asOf).sort((a,b)=>b.observedAt.localeCompare(a.observedAt))[0], sector=snapshot.reference.find(r=>r.securityId===p.securityId)?.sector ?? null;
      return { securityId:p.securityId, currentPrice:valuationValid ? o?.price ?? null : null, marketValue:valuationValid?p.marketValue:null, unrealizedPnl:valuationValid?p.unrealizedPnl:null, weight:valuationValid?p.weight:null, sector, priceAsOf:o?.observedAt??null, provider:o?.provider??null, retrievedAt:o?.receivedAt??null, sourceReference:o?.sourceReference??null, priceStatus:!o?"MISSING_REQUIRED_DATA":o.quality!=="VALID"?o.quality:!o.policyReference||!o.validThrough?"UNKNOWN":o.validThrough<now?"STALE":o.adjustment!=="RAW"?"UNSUPPORTED_ADJUSTMENT":p.priceStatus };
    });
    // Informational aggregation only; M6.5 retains risk authorization.
    const sectors: CurrentModel["sectors"][number][]=[];
    if (valuationValid && referenceFreshness === "VALID" && positions.every(p=>p.sector)) for(const sector of new Set(positions.map(p=>p.sector!))) {
      const mv=positions.filter(p=>p.sector===sector).reduce((sum,p)=>sum.add(decimal(p.marketValue!)),Decimal.zero);
      const nav=snapshot.valuation.nav;
      sectors.push({sector,marketValue:mv.toString(),weight:nav&&decimal(nav).positive?mv.div(decimal(nav)).toString():null});
    }
    return { source:s,snapshot, model:{ label:"CURRENT READ MODEL",status:reasons.includes("STALE_PORTFOLIO")?"STALE":reasons.length?"BLOCKED":"VALID",actionability:reasons.length?"BLOCKED":"PASS",reasons,scope:s.scope,sourceVersion:s.version,referenceVersion:s.references.version,valuationMethodology:s.valuationMethodologyId,portfolioAsOf:s.asOf,evidenceCutoff:s.receivedAt,referenceAsOf:s.referenceAsOf,priceFreshness:unknown?"UNKNOWN":stale?"STALE":bad?"MISSING_REQUIRED_DATA":snapshot.valuation.status,referenceFreshness,reconciliation:snapshot.reconciliation.status,nav:valuationValid?snapshot.valuation.nav:null,marketValue:valuationValid?snapshot.valuation.marketValue:null,unrealizedPnl:valuationValid?snapshot.valuation.unrealizedPnl:null,positions,sectors } };
  }
  async context(id: string) {
    const captured=await this.capture(id);
    if(!captured.snapshot || !captured.source || captured.model.actionability!=="PASS") return {...captured,context:null};
    const context=await new DerivedDecisionPortfolioRead(async()=>({snapshot:captured.snapshot!,evidence:captured.source!.reconciliation as Parameters<PortfolioEngine["snapshot"]>[3],current:true}),async()=>true).read(captured.snapshot.asOf);
    return {...captured,context};
  }
}
