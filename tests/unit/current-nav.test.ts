// @vitest-environment node
import { describe,it,expect } from "vitest";
import { calculateCurrentNav,sumNavComponents } from "@/domain/current-nav/calculate";
import { navFixture,alterNav,NT,NC,NN,NP,NI,nh,navHistory,navInput,type NavFixture,type MutableNav } from "../fixtures/current-nav";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { instant,dateOnly } from "@/shared/time";
import { watermark,securityId } from "@/domain/portfolio/values";
const calc=(f=navFixture())=>calculateCurrentNav(f.request,f.state,f.plan,f.context);
const blocked=(f:NavFixture,reason?:string)=>{const r=calc(f);expect(r.navState).toBe("NAV_BLOCKED");expect(r.totalNav).toBeNull();expect(r.indicativeValue).toBeNull();if(reason)expect(r.blockingReasons.join(" ")).toContain(reason);return r;};
describe("M8Phase3.2 pure NAV / approved22scenario matrix",()=>{
 it("01 qualified synthetic1220 uses reconstructed2shares/cash1000/claims30/payable10 and denies all operational uses",()=>{
  const f=navFixture(),before=nh(f.state),r=calc(f);expect(r).toMatchObject({navState:"QUALIFIED_NAV",totalNav:"1220",indicativeValue:null,securitiesMarketValue:"200",productionAuthorized:false,officialUseEligible:false,performanceAuthorized:false,riskAuthorized:false,scoringAuthorized:false,investmentActionabilityAuthorized:false,snapshotPersisted:false,representsCurrentAccountNow:false});expect(r.origin).toBe("SYNTHETIC_TEST");expect(nh(f.state)).toBe(before);expect(Object.isFrozen(r.manifest.input)).toBe(true);
 });
 it("02 missing held price blocks total;03 stale price never falls back",()=>{
  blocked(alterNav(navFixture(),f=>{f.plan.prices=[];}),"MISSING_PRICE");
  blocked(alterNav(navFixture(),f=>{f.plan.prices[0].validUntil=NC;}),"STALE_PRICE");
 });
 it("04 conflicting source revisions cannot be averaged or latest-selected",()=>{
  blocked(alterNav(navFixture(),f=>{f.plan.prices.push({...f.plan.prices[0],id:"another",revision:"2",value:"101"});}),"CONFLICTING_PRICES");
 });
 it("05 exact identity evidence required,06 cash unknown never0,07 liability unknown blocks even indicative",()=>{
  blocked(alterNav(navFixture(),f=>{f.plan.positions[0].units[0].identity=null;}),"IDENTITY_UNRESOLVED");
  blocked(alterNav(navFixture(),f=>{f.plan.components[0].amount=null;}),"MISSING_CASH");
  const f=alterNav(navFixture(),f=>{f.request.resultScope="OBSERVED_FULL_PORTFOLIO";f.request.allowIndicative=true;f.plan.components[2].complete=false;});blocked(f,"UNKNOWN_LIABILITY");
 });
 it("08 unaccepted unresolved receivable blocks rather than treating money as settled",()=>{blocked(alterNav(navFixture(),f=>{f.plan.completeness.receivables.state="PARTIAL";}),"ACCOUNTING_INCOMPLETE:receivables");});
 it("09 pending rights partition is never ordinary value or extra economic shares",()=>{
  const f=alterNav(navFixture(),f=>{const u=f.plan.positions[0].units[0];u.quantity="1";f.plan.positions[0].units.push({...u,unitId:"pending",kind:"CORPORATE_ACTION_PENDING_RIGHT"});});const r=blocked(f,"PENDING_RIGHTS_UNSUPPORTED");expect(r.securitiesSubtotal?.value).toBe("100");expect(r.securitiesSubtotal?.label).toBe("SECURITIES_SUBTOTAL — NOT NAV");
 });
 it("10 adjustment/CA mismatch blocks, including adjusted quotes with ordinary ledger quantity",()=>{
  blocked(alterNav(navFixture(),f=>{f.plan.prices[0].adjustment="ADJUSTED";}),"CORPORATE_ACTION_MISMATCH");blocked(alterNav(navFixture(),f=>{f.plan.prices[0].corporateActionHash="d".repeat(64);}),"CORPORATE_ACTION_MISMATCH");
 });
 it("11 date-only component evidence cannot become an intraday cutoff",()=>{blocked(alterNav(navFixture(),f=>{f.plan.components[0].economicAt="2026-01-05";}),"DATE_ONLY_OBSERVATION");});
 it("12 weekend/holiday can retain the latest accepted completed session, never calendar-day staleness",()=>{
  const f=alterNav(navFixture(),f=>{f.plan.session.nextCompletedAt="2026-01-12T08:00:00.000Z";f.plan.prices[0].validUntil=f.plan.session.nextCompletedAt;f.context.calculatedAt="2026-01-11T09:00:00.000Z";f.request.requestedAt=f.context.calculatedAt;});expect(calc(f).navState).toBe("QUALIFIED_NAV");
  blocked(alterNav(navFixture(),f=>{f.plan.session.calendarThrough="2026-01-05";}),"UNKNOWN_CALENDAR");
 });
 it("13 late-arriving event changes revision and content; prior evidence is immutable",()=>{
  const f=navFixture(),original=calc(f),copy=nh(original);
  const facts=navInput("late","CASH_DEPOSIT",{amount:"5",eventAt:NI,effectiveAt:NI});const history=navHistory([...f.history.map(t=>t.facts),facts]);const state=reconstructPortfolio(NP,history,NT,watermark("2"),NI);
  const next=alterNav(f,x=>{x.request.ledgerRevision="2";x.plan.ledgerRevision="2";x.plan.components[0].amount="1005";});
  const r=calculateCurrentNav(next.request,state,next.plan,{...next.context,ledgerFactsHash:nh(history)});expect(r.totalNav).toBe("1225");expect(r.manifest.inputHash).not.toBe(original.manifest.inputHash);expect(nh(original)).toBe(copy);
 });
 it("14 corrected immutable inputs produce new evidence,15 revision mismatch blocks",()=>{
  const f=navFixture(),r=calc(f);const corrected=alterNav(f,x=>{x.plan.prices[0].value="101";x.plan.prices[0].revision="2";});expect(calc(corrected).totalNav).toBe("1222");expect(calc(corrected).manifest.resultHash).not.toBe(r.manifest.resultHash);
  blocked(alterNav(f,x=>{x.request.ledgerRevision="2";}),"LEDGER_REVISION_MISMATCH");
 });
 it("16 decimal exactness and output scale, with no floating financial rounding",()=>{
  const f=alterNav(navFixture(),x=>{x.plan.prices[0].value="0.123456789012";});expect(calc(f).securitiesMarketValue).toBe("0.246913578024");expect(calc(f).totalNav).toBe("1020.246913578024");expect(sumNavComponents("0","0.370370367036","0","0")).toBe("0.370370367036");
  blocked(alterNav(navFixture(),x=>{x.plan.prices[0].value="0.1234567890123";}),"EXACT_DECIMAL");
 });
 it("17 source authority absent or invalid and18 independent acceptance missing cannot be JSON accepted flags",()=>{
  const f=navFixture();blocked({...f,context:{...f.context,authority:undefined}},"NAV_PROFILE_MISSING");
  const authority={verify: (r:Parameters<NonNullable<typeof f.context.authority>["verify"]>[0])=>r.kind==="INDEPENDENT_NAV_ACCEPTANCE"?null:f.context.authority!.verify(r)};
  blocked({...f,context:{...f.context,authority}},"INDEPENDENT_NAV_ACCEPTANCE_MISSING");
  const poisoned={...f.plan,accepted:true,sourceAccepted:true};blocked({...f,plan:poisoned,context:{...f.context,authority:undefined}},"MISSING");
 });
 it("19 indicative requires opt-in complete observations and never acquires official output permissions",()=>{
  const f=alterNav(navFixture(),x=>{x.request.resultScope="OBSERVED_FULL_PORTFOLIO";x.request.allowIndicative=true;});const r=calc({...f,context:{...f.context,authority:undefined}});expect(r).toMatchObject({navState:"INDICATIVE_NAV",totalNav:null,indicativeValue:"1220",officialUseEligible:false,riskAuthorized:false,performanceAuthorized:false});
  blocked(alterNav(f,x=>{x.request.allowIndicative=false;}),"INDICATIVE_OPT_IN");
 });
 it("20 NAV_BLOCKED propagates null totals even when ordinary component subtotal is available",()=>{
  const r=blocked(alterNav(navFixture(),f=>{f.plan.components[2].amount=null;}),"UNKNOWN_LIABILITY");expect(r.securitiesSubtotal).toMatchObject({label:"SECURITIES_SUBTOTAL — NOT NAV",value:"200"});
 });
 it("21 content reproducible within valid window; separate calculation run hash and ordered inputs",()=>{
  const f=navFixture(),a=calc(f),b=calc({...f,context:{...f.context,calculatedAt:"2026-01-05T10:00:00.000Z"}});expect(a.manifest.inputHash).toBe(b.manifest.inputHash);expect(a.manifest.resultHash).toBe(b.manifest.resultHash);expect(a.runHash).not.toBe(b.runHash);
  const sorted=alterNav(f,x=>{x.plan.components.reverse();});expect(calc(sorted).manifest.inputHash).toBe(a.manifest.inputHash);
 });
 it("22 no future source/approval knowledge, actual provider time remainsnull when normalization policy allows",()=>{
  blocked(alterNav(navFixture(),f=>{f.plan.prices[0].source.knownAt=NN;}),"FUTURE_INFORMATION");
  const f=navFixture(),authority={verify:(r:Parameters<NonNullable<typeof f.context.authority>["verify"]>[0])=>({...f.context.authority!.verify(r)!,knownAt:NN})};blocked({...f,context:{...f.context,authority}},"TIME_MISMATCH");expect(calc().manifest).toBeDefined();expect(navFixture().plan.prices[0].providerAt).toBeNull();
 });
 it("negative arithmetic is preserved, never clamped or used to bypass M2 no-margin",()=>{expect(sumNavComponents("0","10","0","20")).toBe("-10");expect(sumNavComponents("10","0","0","10")).toBe("0");});
 it("zero NAV cash-only qualified fixture requires explicit empty-market proof",()=>{
  const f=navFixture(),history=navHistory([navInput("d","CASH_DEPOSIT",{amount:"1"}),navInput("w","CASH_WITHDRAWAL",{amount:"1"})]),state=reconstructPortfolio(NP,history,NT,watermark("1"),NI);
  const z=alterNav(f,x=>{x.plan.positions=[];x.plan.prices=[];x.plan.components.forEach(c=>{c.amount="0";});x.plan.session.noHeldMarketNotRequired=true;});const r=calculateCurrentNav(z.request,state,z.plan,z.context);expect(r).toMatchObject({totalNav:"0",nonpositiveNav:true});
 });
 it.each([
  ["duplicate security",(f:MutableNav<NavFixture>)=>{f.plan.positions.push(f.plan.positions[0]);},"DUPLICATE_SECURITY"],
  ["duplicate pending quantity",(f:MutableNav<NavFixture>)=>{f.plan.positions[0].units.push({...f.plan.positions[0].units[0],unitId:"pending",kind:"CORPORATE_ACTION_PENDING_RIGHT"});},"PARTITION_QUANTITY"],
  ["revoked raw evidence",(f:MutableNav<NavFixture>)=>{f.plan.prices[0].revokedAt=NC;},"REVOKED_EVIDENCE"],
  ["wrong purpose",(f:MutableNav<NavFixture>)=>{f.plan.session.purposes=["VALUATION"];},"UNKNOWN_SESSION_POLICY"],
  ["unaccepted basis affects shares",(f:MutableNav<NavFixture>)=>{f.plan.basisEconomicImpact="UNCERTAIN";},"BASIS_AFFECTS"],
  ["price zero",(f:MutableNav<NavFixture>)=>{f.plan.prices[0].value="0";},"POSITIVE_PRICE"],
  ["bad source hash",(f:MutableNav<NavFixture>)=>{f.plan.sourcePins[0].sha256="0".repeat(64);},"SOURCE_HASH_MISMATCH"],
  ["wrong calendar",(f:MutableNav<NavFixture>)=>{f.plan.prices[0].calendarHash="0".repeat(64);},"PRICE_SESSION"],
  ["provider time invented",(f:MutableNav<NavFixture>)=>{f.plan.prices[0].providerAt=NT;},"PRICE_TIMESTAMP"],
  ["different cash cutoff",(f:MutableNav<NavFixture>)=>{f.plan.components[0].economicAt=NC;},"INCOMPATIBLE_ASOF"],
  ["off-ledger liability overlay",(f:MutableNav<NavFixture>)=>{f.plan.components[2].amount="105";},"LEDGER_COMPONENT"],
 ])("fails closed on %s",(_n,change,reason)=>{blocked(alterNav(navFixture(),change),reason);});
 it("partial security subtotal lists exclusions; duplicate identical price is harmless but distinct identity cannot be reused",()=>{
  const f=alterNav(navFixture(),x=>{const u=x.plan.positions[0].units[0];u.quantity="1";x.plan.positions[0].units.push({...u,unitId:"missing-unit"});});const r=blocked(f,"MISSING_PRICE");expect(r.securitiesSubtotal?.value).toBe("100");expect(r.securitiesSubtotal?.excludedUnits).toEqual(["missing-unit"]);
  const duplicate=alterNav(navFixture(),x=>{x.plan.prices.push({...x.plan.prices[0]});});expect(calc(duplicate).totalNav).toBe("1220");
 });
 it("legacy reconciliation/P&L gates preserved when basis provenance isPARTIAL but ownership not affected",()=>{
  const f=alterNav(navFixture(),x=>{x.plan.completeness.costBasis.state="PARTIAL";x.plan.legacyReconciliation={status:"MISMATCH",actionabilityBlocked:true};});const r=calc(f);expect(r.totalNav).toBe("1220");expect(r.legacyReconciliation).toEqual(f.plan.legacyReconciliation);expect(r.performanceAuthorized).toBe(false);
 });
 it("QUALIFIED_ONLY never downgrades; revoked or self-approving authority also blocks indicative",()=>{
  const f=navFixture(),source=f.context.authority!;
  const revoked={verify:(r:Parameters<typeof source.verify>[0])=>({...source.verify(r)!,revokedAt:NC})};const i=alterNav(f,x=>{x.request.resultScope="OBSERVED_FULL_PORTFOLIO";x.request.allowIndicative=true;});blocked({...i,context:{...i.context,authority:revoked}},"REVOKED");
  const self={verify:(r:Parameters<typeof source.verify>[0])=>({...source.verify(r)!,validator:"SYNTHETIC_PRODUCER"})};blocked({...f,context:{...f.context,authority:self}},"INDEPENDENCE");
 });
 it("synthetic proofs cannot qualify retained research origin",()=>{const f=navFixture();blocked({...f,context:{...f.context,origin:"RETAINED_RESEARCH"}},"SCOPE_OR_INDEPENDENCE");});
 it("unsupported current-account-now and AS_KNOWN modes failclosed",()=>{
  blocked(alterNav(navFixture(),x=>{x.request.valuationMode="CURRENT_ACCOUNT_NOW";}),"UNSUPPORTED_VALUATION_MODE");blocked(alterNav(navFixture(),x=>{x.request.knowledgeMode="AS_KNOWN";}),"BITEMPORAL_QUERY_UNSUPPORTED");
 });
 it("result hash independently binds all semantic permissions and nonpositive flag",()=>{
  const r=calc();const {manifest,runHash,calculatedAt,...content}=r;
  expect(nh({inputHash:manifest.inputHash,...content})).toBe(manifest.resultHash);
  expect(nh({inputHash:manifest.inputHash,...content,productionAuthorized:true})).not.toBe(manifest.resultHash);
  expect(nh({resultHash:manifest.resultHash,calculatedAt})).toBe(runHash);
 });
 it("unrecognized proof fields reject and verifier-owned objects remain mutable",()=>{
  const f=navFixture(),proofs:unknown[]=[];
  const authority={verify:(r:Parameters<NonNullable<typeof f.context.authority>["verify"]>[0])=>{const p=f.context.authority!.verify(r)!;proofs.push(p);return p;}};
  expect(calc({...f,context:{...f.context,authority}}).totalNav).toBe("1220");expect(proofs.every(p=>!Object.isFrozen(p))).toBe(true);
  const poisoned={verify:(r:Parameters<typeof authority.verify>[0])=>({...authority.verify(r),calculatedAt:NC})};blocked({...f,context:{...f.context,authority:poisoned}},"INVALID");
 });
 it("two held ledger securities require coverage and cannot reuse a market identity",()=>{
  const f=navFixture(),history=navHistory([...f.history.map(t=>t.facts),navInput("second-opening","OPENING_BALANCE",{securityId:securityId("nav-security-b"),quantity:"1",opening:{cost:"1",migrationVersion:"SYNTHETIC",evidence:"SYNTHETIC"}})]);
  const state=reconstructPortfolio(NP,history,NT,watermark("1"),NI);
  const next=alterNav(f,x=>{x.plan.positions.push({...x.plan.positions[0],securityId:securityId("nav-security-b"),units:[{...x.plan.positions[0].units[0],unitId:"ordinary-b",quantity:"1",identity:{...x.plan.positions[0].units[0].identity!,marketSecurityId:"22222222-2222-4222-8222-222222222222",providerInstrumentCode:"000002",isin:"VN000000BBB2"}}]});});
  const missing=calculateCurrentNav(next.request,state,next.plan,next.context);expect(missing.totalNav).toBeNull();expect(missing.blockingReasons.join(" ")).toContain("MISSING_PRICE");expect(missing.securitiesSubtotal?.value).toBe("200");
  const duplicate=alterNav(next,x=>{x.plan.positions[1].units[0].identity=x.plan.positions[0].units[0].identity;});
  expect(calculateCurrentNav(duplicate.request,state,duplicate.plan,duplicate.context).blockingReasons.join(" ")).toContain("DUPLICATE_MARKET_IDENTITY");
 });

 it("corrected transaction reuses reversal and immutable domain replay, no financial rewriting",()=>{
  const f=navFixture(),old=calc(f),facts=f.history.map(t=>t.facts);
  const history=navHistory([...facts,navInput("reverse-buy","REVERSAL",{reversesId:facts[2].id,eventAt:instant("2026-01-03T09:00:00.000Z"),effectiveAt:instant("2026-01-03T09:00:00.000Z")}),{...facts[2],id:"corrected-buy" as typeof facts[2]["id"],idempotencyKey:"corrected-buy",price:"12",amount:"12",tradeDate:dateOnly("2026-01-03"),eventAt:instant("2026-01-03T09:00:00.000Z"),effectiveAt:instant("2026-01-03T09:00:00.000Z")}]);
  const state=reconstructPortfolio(NP,history,NT,watermark("2"),NI),next=alterNav(f,x=>{x.request.ledgerRevision="2";x.plan.ledgerRevision="2";x.plan.components[2].amount="12";});
  const result=calculateCurrentNav(next.request,state,next.plan,{...next.context,ledgerFactsHash:nh(history)});
  expect(result.totalNav).toBe("1218");expect(history[2]).toEqual(f.history[2]);expect(result.manifest.inputHash).not.toBe(old.manifest.inputHash);expect(old.totalNav).toBe("1220");
 });

 it("historical200 ordinary plus20 pending partition stays220 and blocks full NAV",()=>{
  const f=navFixture(),history=navHistory([navInput("historical-shape","OPENING_BALANCE",{securityId:securityId("nav-security-a"),quantity:"220",amount:"1000",opening:{cost:"100",receivable:"30",migrationVersion:"SYNTHETIC",evidence:"SYNTHETIC"}})]),state=reconstructPortfolio(NP,history,NT,watermark("1"),NI);
  const next=alterNav(f,x=>{x.plan.components[2].amount="0";x.plan.positions[0].units[0].quantity="200";x.plan.positions[0].units.push({...x.plan.positions[0].units[0],unitId:"historical-pending",quantity:"20",kind:"CORPORATE_ACTION_PENDING_RIGHT"});});
  const r=calculateCurrentNav(next.request,state,next.plan,next.context);expect(r.navState).toBe("NAV_BLOCKED");expect(r.totalNav).toBeNull();expect(r.securitiesSubtotal?.value).toBe("20000");expect(state.positions[0].quantity).toBe("220");
 });
 it("accepted synthetic aligned split replay conserves basis and values200 RAW shares at50",()=>{
  const f=navFixture(),history=navHistory([navInput("pre-split","OPENING_BALANCE",{securityId:securityId("nav-security-a"),quantity:"100",amount:"1000",opening:{cost:"100",receivable:"30",migrationVersion:"SYNTHETIC",evidence:"SYNTHETIC"}}),navInput("split","CORPORATE_ACTION",{securityId:securityId("nav-security-a"),quantity:"100",corporateAction:{id:"synthetic-split",subtype:"SPLIT",numerator:"2",denominator:"1",evidence:"SYNTHETIC_NOT_PRODUCTION",stage:"EFFECTIVE"}})]),state=reconstructPortfolio(NP,history,NT,watermark("1"),NI);
  const next=alterNav(f,x=>{x.plan.components[2].amount="0";x.plan.positions[0].units[0].quantity="200";x.plan.prices[0].value="50";});
  const r=calculateCurrentNav(next.request,state,next.plan,next.context);expect(r.securitiesMarketValue).toBe("10000");expect(r.totalNav).toBe("11030");expect(state.positions[0].openCost).toBe("100");
 });

 it.each(["expired","wrong-scope","wrong-subject"])("authority %s fails closed including indicative",kind=>{
  const f=alterNav(navFixture(),x=>{x.request.resultScope="OBSERVED_FULL_PORTFOLIO";x.request.allowIndicative=true;});
  const authority={verify:(r:Parameters<NonNullable<typeof f.context.authority>["verify"]>[0])=>{const p=f.context.authority!.verify(r)!;return {...p,...(kind==="expired"?{expiresAt:NC}:kind==="wrong-scope"?{portfolioId:"another-portfolio"}:{subjectHash:"0".repeat(64)})};}};
  blocked({...f,context:{...f.context,authority}},kind==="expired"?"EXPIRED":"SCOPE_OR_INDEPENDENCE");
 });

});
