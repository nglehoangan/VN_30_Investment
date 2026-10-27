import type { PrismaClient, Prisma } from "@/infrastructure/db/generated/client";
import { PrismaPortfolioLedger, readPortfolioLedger } from "./portfolio-ledger";
import { intakeHash, intakeStorageExists } from "./forward-intake-storage";
import type { DividendSettlementAuthority } from "./dividend-settlement-guard";
import { classifyForwardRecord, economicKey, financialHash, requireIntakeBatch, type ForwardRecord, type IntakeGrant, type IntakeOutcome, type EconomicIdentity } from "@/domain/portfolio/forward-intake";
import { deepFreeze, type Transaction } from "@/domain/portfolio/transaction";
import { prepareCandidate } from "@/domain/portfolio/candidate";
import { watermark, requireRule, type PortfolioId, type LedgerWatermark } from "@/domain/portfolio/values";
import type { Clock } from "@/ports/runtime";
import type { Instant } from "@/shared/time";
import { AppError, ConflictError, ValidationError } from "@/shared/errors";
/** No real adapter is provided or wired. Implementations resolve authenticated, nonrevoked,
 * independently accepted records within this transaction; hashes alone are never authority.
 */
export interface ForwardIntakeAuthority {
  qualify(tx: Prisma.TransactionClient, record: ForwardRecord, now: Instant): Promise<IntakeGrant | null>;
  legacyIdentity(tx: Prisma.TransactionClient, event: Transaction): Promise<EconomicIdentity | null>;
}
interface Registered { identity: EconomicIdentity; transactionId: string; financialHash: string; ledgerWatermark: string }
class IntakeBlocked extends AppError { constructor(readonly outcomes: readonly IntakeOutcome[]) { super("VALIDATION_ERROR"); } }
/** Offline/isolated command facade; reuses the ONLY accounting builder/replay/commit path. No HTTP route. */
export class PrismaForwardEventIntake {
  constructor(private readonly client: PrismaClient, private readonly clock: Clock, private readonly authority?: ForwardIntakeAuthority, private readonly dividends?: DividendSettlementAuthority) {}
  private async classify(tx: Prisma.TransactionClient, portfolio: PortfolioId, opening: Instant, history: readonly Transaction[], records: readonly ForwardRecord[], now: Instant) {
    const registered: Registered[] = [];
    if (await intakeStorageExists(tx)) {
      const rows = await tx.$queryRaw<{body:string}[]>`SELECT body FROM forward_intake_event WHERE portfolio_id=${portfolio}`;
      for (const row of rows) { const b=JSON.parse(row.body); registered.push({ identity:b.grant.identity, transactionId:b.transactionId, financialHash:b.financialHash, ledgerWatermark:b.ledgerWatermark }); }
    }
    const outcomes: IntakeOutcome[]=[];
    for (const record of records) {
      let outcome=classifyForwardRecord(record,opening,portfolio,now,intakeHash,null);
      if (outcome.reason !== "AUTHENTICATED_SOURCE_ADAPTER_UNAVAILABLE") { outcomes.push(outcome); continue; }
      let grant: IntakeGrant | null=null;
      try { grant=await this.authority?.qualify(tx,record,now) ?? null; }
      catch { outcomes.push({...outcome,status:"BLOCKED_SOURCE",reason:"SOURCE_ACCEPTANCE_UNAVAILABLE_OR_REVOKED"});continue; }
      outcome=classifyForwardRecord(record,opening,portfolio,now,intakeHash,grant);
      if (outcome.status !== "SUPPORTED_EVENT" || !grant || !record.command) { outcomes.push(outcome);continue; }
      if (!await intakeStorageExists(tx)) { outcomes.push({...outcome,status:"BLOCKED_SOURCE",reason:"ISOLATED_INTAKE_SCHEMA_REQUIRED"});continue; }
      const f=record.command,key=economicKey(grant.identity),content=financialHash(f,intakeHash);
      const known=[...registered]; let unresolved=false;
      for (const old of history.filter(t=>t.facts.type!=="OPENING_BALANCE"&&!registered.some(r=>r.transactionId===t.facts.id))) {
        let identity:EconomicIdentity|null=null;
        try {identity=await this.authority?.legacyIdentity(tx,old)??null;} catch { /* unresolved provenance fails closed */ }
        if(!identity){unresolved=true;break;}
        known.push({identity,transactionId:old.facts.id,financialHash:financialHash(old.facts,intakeHash),ledgerWatermark:"0"});
      }
      if(unresolved){outcomes.push({...outcome,status:"NEEDS_REVIEW",reason:"EXISTING_LEDGER_ECONOMIC_IDENTITY_UNRESOLVED"});continue;}
      const same=known.filter(k=>economicKey(k.identity)===key);
      const exact=same.find(k=>k.identity.revision===grant.identity.revision);
      if(exact){outcomes.push({...outcome,status:exact.financialHash===content?"DUPLICATE":"NEEDS_REVIEW",reason:exact.financialHash===content?"EXISTING_ECONOMIC_EVENT":"ECONOMIC_EVENT_CONTENT_CONFLICT",transactionId:exact.transactionId});continue;}
      if(f.type==="REVERSAL"){
        const old=history.find(t=>t.facts.id===f.reversesId);
        if(!old||old.facts.type==="OPENING_BALANCE"||grant.correctsTransactionId!==old.facts.id){outcomes.push({...outcome,status:"NEEDS_REVIEW",reason:"EXPLICIT_NONOPENING_REVERSAL_LINEAGE_REQUIRED"});continue;}
      }else if(same.length||grant.correctsTransactionId){
        const head=same.reduce<Registered|null>((a,b)=>!a||BigInt(b.ledgerWatermark)>=BigInt(a.ledgerWatermark)?b:a,null);
        const paired=records.some(r=>r.command?.type==="REVERSAL"&&r.command.reversesId===head?.transactionId&&r.command.correctionGroupId&&r.command.correctionGroupId===f.correctionGroupId&&r.command.effectiveAt===f.effectiveAt);
        if(!head||grant.correctsTransactionId!==head.transactionId||!paired){outcomes.push({...outcome,status:"NEEDS_REVIEW",reason:"EXPLICIT_SOURCE_REVISION_CORRECTION_REQUIRED"});continue;}
      }
      const collision=history.find(t=>t.facts.id===f.id||t.facts.idempotencyKey===f.idempotencyKey||(t.facts.source.source===f.source.source&&t.facts.source.reference===f.source.reference));
      if(collision){outcomes.push({...outcome,status:"NEEDS_REVIEW",reason:"LEDGER_ID_OR_SOURCE_COLLISION"});continue;}
      outcomes.push({...outcome,transactionId:f.id});
      registered.push({identity:grant.identity,transactionId:f.id,financialHash:content,ledgerWatermark:"0"});
    }
    return deepFreeze(outcomes);
  }
  async review(portfolio:PortfolioId,records:readonly ForwardRecord[]) {
    requireIntakeBatch(records);const copy=JSON.parse(JSON.stringify(records)) as ForwardRecord[];
    return this.client.$transaction(async tx=>{
      const ledger=await readPortfolioLedger(tx,portfolio);
      const outcomes=await this.classify(tx,portfolio,ledger.inceptionAt,ledger.transactions,copy,this.clock.now());
      return {ledgerWatermark:ledger.watermark,outcomes};
    });
  }
  async post(portfolio:PortfolioId,records:readonly ForwardRecord[],expected:LedgerWatermark) {
    requireIntakeBatch(records);const copy=deepFreeze(JSON.parse(JSON.stringify(records)) as ForwardRecord[]),now=this.clock.now();
    const preliminary=await this.review(portfolio,copy);
    const acceptable=(outcomes:readonly IntakeOutcome[])=>outcomes.every(o=>["SUPPORTED_EVENT","DUPLICATE"].includes(o.status));
    if(!acceptable(preliminary.outcomes))return {status:"BLOCKED" as const,postedCount:0,duplicateCount:preliminary.outcomes.filter(o=>o.status==="DUPLICATE").length,...preliminary};
    if(preliminary.outcomes.every(o=>o.status==="DUPLICATE"))return {status:"DUPLICATE" as const,postedCount:0,duplicateCount:copy.length,...preliminary};
    let final=preliminary.outcomes;
    const ledger=new PrismaPortfolioLedger(this.client,this.dividends,async(tx,history,additions,revision)=>{
      const portfolioRow=await tx.portfolio.findUniqueOrThrow({where:{id:portfolio}});
      const qualified=await this.classify(tx,portfolio,portfolioRow.inceptionAt as Instant,history,copy,now);
      if(!acceptable(qualified)||intakeHash(qualified)!==intakeHash(preliminary.outcomes))throw new IntakeBlocked(qualified);
      const ready=qualified.filter(o=>o.status==="SUPPORTED_EVENT");
      requireRule(ready.length===additions.length,"ATOMIC_INTAKE_ADDITIONS_MISMATCH");
      for(const [i,o]of ready.entries()){
        const t=additions[i],g=o.grant!;requireRule(intakeHash(t.facts)===intakeHash(o.record.command),"INTAKE_FACTS_BINDING");
        const body={version:"forward-intake-audit-v1",transactionId:t.facts.id,ledgerWatermark:revision,factsHash:intakeHash(t.facts),financialHash:financialHash(t.facts,intakeHash),record:o.record,grant:g,recordedAt:now,result:"POSTED"};
        await tx.$executeRaw`INSERT INTO forward_intake_event (portfolio_id,event_namespace,event_id,component,source_revision,transaction_id,body,body_hash) VALUES (${portfolio},${g.identity.namespace},${g.identity.eventId},${g.identity.component},${g.identity.revision},${t.facts.id},${JSON.stringify(body)},${intakeHash(body)})`;
      }
      final=qualified;
    });
    try{
      const committed=await ledger.commit(portfolio,expected,history=>prepareCandidate(portfolio,history,preliminary.outcomes.filter(o=>o.status==="SUPPORTED_EVENT").map(o=>o.record.command!),now,watermark((BigInt(expected)+1n).toString())));
      return {status:"POSTED" as const,postedCount:final.filter(o=>o.status==="SUPPORTED_EVENT").length,duplicateCount:final.filter(o=>o.status==="DUPLICATE").length,outcomes:final,projectionStatus:"NOT_REBUILT" as const,actionabilityBlocked:true,ledgerWatermark:committed.watermark};
    }catch(error){
      if(error instanceof IntakeBlocked)return {status:"BLOCKED" as const,postedCount:0,duplicateCount:0,outcomes:error.outcomes,ledgerWatermark:expected};
      if(error instanceof ValidationError)return {status:"BLOCKED" as const,postedCount:0,duplicateCount:0,outcomes:preliminary.outcomes.map(o=>({...o,status:"NEEDS_REVIEW" as const,reason:error.issues[0]?.reason??"ACCOUNTING_VALIDATION_FAILED"})),ledgerWatermark:expected};
      if(error instanceof ConflictError){const retried=await this.review(portfolio,copy);if(retried.outcomes.every(o=>o.status==="DUPLICATE"))return {status:"DUPLICATE" as const,postedCount:0,duplicateCount:copy.length,...retried};}
      throw error;
    }
  }
}
