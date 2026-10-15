import { exact, requireWorkflow } from "@/domain/workflow/validation";
import { REVIEW_TYPES } from "@/domain/workflow/contracts";
import { dateOnly } from "@/shared/time";
import type { ReviewIntent } from "@/ports/current";
import type { WorkflowArtifacts, WorkflowPortfolioRead } from "@/ports/workflow";
import type { DecisionArtifacts } from "@/ports/decision";
import type { AnalyticalArtifacts } from "@/ports/scoring";
import type { MethodologyRegistry } from "@/ports/methodology-registry";
import type { MarginalArtifacts } from "@/ports/marginal";
import type { Clock } from "@/ports/runtime";
import type { PortfolioLedger } from "@/ports/portfolio";
import type { ReviewCommand, ReviewArtifact } from "@/domain/workflow/contracts";
import { WorkflowEngine } from "@/application/workflow/engine";
import { WEEKLY_AREAS, QUARTERLY_AREAS, ANNUAL_AREAS } from "@/domain/workflow/reviews";
import { validateReview } from "@/domain/workflow/validation";
import { CurrentReadService } from "./read-model";
import { instant, vietnamBusinessDate } from "@/shared/time";
import { portfolioId } from "@/domain/portfolio/values";
export interface ReviewCatalog {
  candidates(asOf: string): Promise<{ decisionIds: readonly string[]; rankingId: string | null }>;
  priorMonthlyReviews?(portfolioId: string, snapshotId: string, excludeId: string, through: string): Promise<readonly string[]>;
  marginalCandidates?(snapshotId: string, cutoff: string): Promise<readonly string[]>;
}
export interface ReviewReadiness { status: "READY" | "BLOCKED" | "INPUT REQUIRED" | "UNAVAILABLE"; reasons: readonly string[]; portfolio: string; marketData: string; analystEvidence: string; type: string | null; reviewId?: string }
export type ReviewResponse = ReviewReadiness & { artifactId?: string };
/** Intent is the only request input. Captured sources and artifacts compose every formal field. */
export class ReviewInitiationService {
  constructor(private readonly current: CurrentReadService, private readonly ledger: Pick<PortfolioLedger, "read">,
    private readonly artifacts: WorkflowArtifacts, private readonly decisions: DecisionArtifacts,
    private readonly analytical: AnalyticalArtifacts, private readonly registry: MethodologyRegistry,
    private readonly clock: Clock, private readonly catalog: ReviewCatalog, private readonly identity: (scope: string) => string,
    private readonly marginal?: MarginalArtifacts) {}
  private async prepare(id: string, raw: unknown) {
    exact(raw as object,"type requestedDate contributionReference eventReference");
    const intent=raw as ReviewIntent;
    requireWorkflow(REVIEW_TYPES.includes(intent.type),"INVALID_REVIEW_TYPE");dateOnly(intent.requestedDate);
    requireWorkflow([intent.contributionReference,intent.eventReference].every(r=>r===null || typeof r==="string"&&r.trim().length>0&&r.length<=500),"INVALID_REFERENCE");
    const captured=await this.current.context(id), s=captured.source, context=captured.context, reviewTime=this.clock.now();
    const readiness: ReviewReadiness={ status:"BLOCKED",reasons:captured.model.reasons,portfolio:captured.model.actionability,marketData:captured.model.priceFreshness,analystEvidence:"INPUT REQUIRED",type:intent.type };
    if(!s||!context) return { readiness:{...readiness,status:!s?"UNAVAILABLE" as const:"BLOCKED" as const},command:null,portfolio:null };
    if(s.scope!=="FORMAL") return {readiness:{...readiness,reasons:["FORMAL_SOURCE_REQUIRED"]},command:null,portfolio:null};
    if(intent.requestedDate!==vietnamBusinessDate(instant(s.asOf))) return {readiness:{...readiness,reasons:["REQUESTED_DATE_SOURCE_MISMATCH"]},command:null,portfolio:null};
    const a=s.analyst;
    if(!a || a.asOf!==s.asOf || a.receivedAt>s.receivedAt || a.validThrough<reviewTime || a.evidence.some(e=>e.validThrough<reviewTime)) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["CURRENT_ANALYST_EVIDENCE_REQUIRED"]},command:null,portfolio:null};
    const areas=intent.type==="WEEKLY"?WEEKLY_AREAS:intent.type==="ANNUAL"?ANNUAL_AREAS:intent.type==="QUARTERLY"?QUARTERLY_AREAS:[];
    const subjects=intent.type==="QUARTERLY"?context.positions.map(p=>p.securityId):[null];
    const missing=subjects.some(securityId=>areas.some(area=>!a.sections.some(x=>x.area===area&&x.securityId===securityId&&x.finding!=="MISSING")));
    if(missing || (intent.type==="ANNUAL"&&!a.governance) || (intent.type==="QUARTERLY"&&subjects.some(id=>!a.theses.some(t=>t.securityId===id)))) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["REQUIRED_REVIEW_EVIDENCE_MISSING"]},command:null,portfolio:null};
    const triggers=intent.type==="EVENT_DRIVEN"?a.triggers.filter(t=>t.id===intent.eventReference&&t.verified):a.triggers;
    if(intent.type==="EVENT_DRIVEN"&&triggers.length!==1) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["VERIFIED_EVENT_REFERENCE_REQUIRED"]},command:null,portfolio:null};
    if(intent.type!=="EVENT_DRIVEN"&&intent.eventReference || intent.type!=="MONTHLY_DCA"&&intent.contributionReference) return {readiness:{...readiness,reasons:["INTENT_REFERENCE_TYPE_MISMATCH"]},command:null,portfolio:null};
    let contribution=null;
    if(intent.contributionReference){const history=await this.ledger.read(portfolioId(id));const t=history.transactions.find(t=>t.facts.id===intent.contributionReference);
      if(!t||t.facts.type!=="CASH_DEPOSIT"||t.facts.effectiveAt>s.asOf||t.createdAt>s.receivedAt||history.transactions.some(r=>r.facts.reversesId===t.facts.id)) return {readiness:{...readiness,reasons:["POSTED_CONTRIBUTION_REQUIRED"]},command:null,portfolio:null};
      contribution={transactionId:t.facts.id,amount:t.facts.amount!,recordedAt:t.createdAt};}
    const candidates=intent.type==="MONTHLY_DCA"?await this.catalog.candidates(s.asOf):{decisionIds:[],rankingId:null};
    if(intent.type==="MONTHLY_DCA"){
      const rank=candidates.rankingId?await this.analytical.find(candidates.rankingId):null;
      if(!rank||!("entries" in rank)||rank.status!=="VALID"||rank.asOf!==s.asOf||rank.input.cards.some(c=>c.input.artifactScope!=="FORMAL")||rank.portfolio?.ledgerWatermark!==context.integrity.ledgerWatermark||rank.portfolio?.priceVersion!==s.version||rank.portfolio?.referenceVersion!==s.references.version) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["CURRENT_FORMAL_RANKING_REQUIRED"]},command:null,portfolio:null};
      for (const card of rank.input.cards) {
        if (JSON.stringify(card.input.reference.data)!==JSON.stringify(s.references) || card.input.reference.taxonomy!==s.taxonomy || card.input.reference.receivedAt>s.receivedAt) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["REFERENCE_DATASET_LINEAGE_MISMATCH"]},command:null,portfolio:null};
        const method=await this.registry.findById(card.methodology.methodologyId);
        if (!method || method.governanceStatus!=="APPROVED" || method.intendedUse!=="PRODUCTION" || !Object.entries(method).every(([key,value])=>card.methodology[key as keyof typeof method]===value) || card.input.evidence.some(e=>e.critical&&(e.validThrough<reviewTime||e.quality!=="VALID"))) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["APPROVED_CURRENT_SCORE_EVIDENCE_REQUIRED"]},command:null,portfolio:null};
      }
      const resolved=await Promise.all(candidates.decisionIds.map(id=>this.decisions.find(id)));
      if(resolved.some(d=>!d||d.scope!=="FORMAL"||d.lineage.snapshotId!==context.integrity.snapshotId||JSON.stringify(d.input.portfolio)!==JSON.stringify(context)||d.input.evidence.some(e=>e.validThrough<reviewTime))||rank.entries.some(e=>!resolved.some(d=>d?.lineage.scorecardId===e.scorecardId)))return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["CURRENT_FORMAL_DECISIONS_REQUIRED"]},command:null,portfolio:null};
    }
    let marginalAllocationId: string | undefined;
    let evidenceCutoff: string = reviewTime;
    if (intent.type === "MONTHLY_DCA" && this.catalog.marginalCandidates) {
      const ids = await this.catalog.marginalCandidates(context.integrity.snapshotId, reviewTime);
      if (ids.length > 1) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["AMBIGUOUS_MARGINAL_AUTHORITY"]},command:null,portfolio:null};
      if (ids.length === 1) {
        const m = await this.marginal?.find(ids[0]);
        const matches = m && m.scope === "FORMAL" && m.baseSnapshotId === context.integrity.snapshotId && m.baseLedgerWatermark === context.integrity.ledgerWatermark && m.command.evidenceCutoff <= reviewTime && m.recordedAt <= reviewTime && JSON.stringify([...m.command.baseDecisionIds].sort()) === JSON.stringify([...candidates.decisionIds].sort());
        const fresh = m && m.steps.every(step => step.assessments.every(x => x.decision.input.evidence.every(e => e.validThrough >= reviewTime) && x.decision.input.scorecard.input.evidence.every(e => !e.critical || e.validThrough >= reviewTime)));
        if (!matches || !fresh) return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["CURRENT_MARGINAL_AUTHORITY_REQUIRED"]},command:null,portfolio:null};
        marginalAllocationId = m.id;
        evidenceCutoff = m.command.evidenceCutoff;
      }
    }
    const scope=JSON.stringify({intent,version:s.version,watermark:s.ledgerWatermark,analyst:a.version,snapshot:context.integrity.snapshotId,source:s,decisionIds:[...candidates.decisionIds].sort(),rankingId:candidates.rankingId,...(marginalAllocationId?{marginalAllocationId}:{})});
    const reviewId=this.identity(scope), existing=await this.artifacts.find(reviewId);
    let priorReviewId: string | null = existing?.command.priorReviewId ?? null;
    let supersedesReviewId: string | null = existing?.command.supersedesReviewId ?? null;
    if (!existing && intent.type === "MONTHLY_DCA" && this.catalog.priorMonthlyReviews) {
      const ids=await this.catalog.priorMonthlyReviews(id,context.integrity.snapshotId,reviewId,reviewTime);
      if(ids.length>1)return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["AMBIGUOUS_PRIOR_MONTHLY_REVIEW"]},command:null,portfolio:null};
      if(ids.length===1){
        const prior=await this.artifacts.find(ids[0]);
        if(!prior || prior.command.scope!=="FORMAL" || prior.command.portfolioId!==id || prior.command.type!=="MONTHLY_DCA" || prior.command.snapshotId!==context.integrity.snapshotId || prior.command.asOf!==s.asOf || prior.recordedAt>evidenceCutoff)return {readiness:{...readiness,status:"INPUT REQUIRED" as const,reasons:["CURRENT_PRIOR_MONTHLY_REVIEW_REQUIRED"]},command:null,portfolio:null};
        priorReviewId=prior.id;supersedesReviewId=prior.id;
      }
    }
    const command:ReviewCommand={...(marginalAllocationId?{marginalAllocationId}:{}),id:reviewId,type:intent.type,portfolioId:id,period:intent.requestedDate,reviewDate:existing?.command.reviewDate ?? reviewTime,asOf:s.asOf,evidenceCutoff:existing?.command.evidenceCutoff ?? evidenceCutoff,snapshotId:context.integrity.snapshotId,scope:"FORMAL",reviewer:a.reviewer,priorReviewId,supersedesReviewId,decisionIds:candidates.decisionIds,rankingId:candidates.rankingId,contributionId:intent.contributionReference,plannedContribution:null,evidence:a.evidence,triggers,sections:a.sections,theses:a.theses,behavioral:[],nextReview:a.nextReview,governance:intent.type==="ANNUAL"?a.governance:null};
    validateReview(command);
    return {readiness:{...readiness,status:"READY" as const,reasons:[],analystEvidence:"READY",reviewId:command.id},source:s,command,portfolio:{decisionContext:context,ledgerCash:captured.snapshot!.state.cash,reservedCash:captured.snapshot!.state.payables,contribution}};
  }
  async preview(id:string,raw:unknown):Promise<ReviewReadiness>{return (await this.prepare(id,raw)).readiness;}
  async create(id:string,raw:unknown):Promise<ReviewResponse>{
    const prepared=await this.prepare(id,raw);
    if(!prepared.command||!prepared.portfolio)return prepared.readiness;
    const command=prepared.command,portfolio=prepared.portfolio;
    const current=async()=>{const latest=await this.current.context(id);return latest.model.actionability==="PASS"&&JSON.stringify(latest.context)===JSON.stringify(portfolio.decisionContext)&&JSON.stringify(latest.source)===JSON.stringify(prepared.source);};
    const read:WorkflowPortfolioRead={read:async(snapshotId,asOf)=>{if(snapshotId!==command.snapshotId||asOf!==command.asOf)throw new Error("PINNED_SNAPSHOT_REQUIRED");return portfolio;},isCurrent:current,transaction:async()=>null};
    const engine=new WorkflowEngine(this.artifacts,read,this.decisions,this.analytical,this.registry,this.clock,"FORMAL",this.marginal);
    const result:ReviewArtifact=await engine.create(command);
    return {...prepared.readiness,artifactId:result.id};
  }
}
export type { ReviewIntent };
