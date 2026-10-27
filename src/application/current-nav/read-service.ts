import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { portfolioId } from "@/domain/portfolio/values";
import { instant } from "@/shared/time";
import { calculateCurrentNav, unavailableCurrentNav } from "@/domain/current-nav/calculate";
import { requestReasons } from "@/domain/current-nav/qualification";
import type { CurrentNavRequestV1, CurrentNavResultV1, NavDigest, NavOrigin, NavQualificationAuthorityV1 } from "@/domain/current-nav/contracts";
import type { PortfolioLedger } from "@/ports/portfolio";
import type { CurrentNavInputProvider } from "@/ports/current-nav";
import type { Clock } from "@/ports/runtime";
/** Intentionally unconnected to production composition. Has no commit/post/persistence port. */
export class CurrentNavReadService {
  constructor(private readonly ledger: Pick<PortfolioLedger,"read">,private readonly inputs:CurrentNavInputProvider,private readonly clock:Clock,private readonly hash:NavDigest,private readonly authority?:NavQualificationAuthorityV1,private readonly origin:NavOrigin="RETAINED_RESEARCH"){}
  async read(request:CurrentNavRequestV1):Promise<CurrentNavResultV1>{
    const r=deepFreeze(JSON.parse(JSON.stringify(request)) as CurrentNavRequestV1),start=this.clock.now();
    const context={calculatedAt:start,origin:this.origin,hash:this.hash,authority:this.authority};
    try{
      const invalid=requestReasons(r,context);if(invalid.length)return unavailableCurrentNav(r,context,invalid[0]);
      const read=await this.ledger.read(portfolioId(r.portfolioId));
      if(read.watermark!==r.ledgerRevision)return unavailableCurrentNav(r,context,"LEDGER_REVISION_MISMATCH");
      if(read.transactions.some(t=>t.createdAt>r.knowledgeCutoff||t.facts.eventAt>r.knowledgeCutoff))return unavailableCurrentNav(r,context,"FUTURE_LEDGER_KNOWLEDGE");
      const loaded=await this.inputs.load(r,{revision:read.watermark,inceptionAt:read.inceptionAt,factsHash:this.hash(read.transactions)},start);
      if(!loaded)return unavailableCurrentNav(r,context,"INPUT_PLAN_UNAVAILABLE");
      const plan=deepFreeze(JSON.parse(JSON.stringify(loaded)) as typeof loaded);
      const state=reconstructPortfolio(portfolioId(r.portfolioId),read.transactions,instant(plan.valuationAt),read.watermark,read.inceptionAt);
      const latest=await this.ledger.read(portfolioId(r.portfolioId)),current=await this.inputs.isCurrent(plan.evidenceHead),end=this.clock.now();
      const reasons:string[]=[];if(latest.watermark!==read.watermark)reasons.push("LEDGER_REVISION_CHANGED");if(!current)reasons.push("EVIDENCE_HEAD_CHANGED");if(end<start)reasons.push("CLOCK_ROLLBACK");
      return calculateCurrentNav(r,state,plan,{...context,calculatedAt:end,ledgerFactsHash:this.hash(read.transactions)},reasons);
    }catch{return unavailableCurrentNav(r,context,"NAV_INPUT_OR_LEDGER_INTEGRITY_UNAVAILABLE");}
  }
}
