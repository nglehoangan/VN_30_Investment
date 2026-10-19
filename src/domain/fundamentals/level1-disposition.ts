import {validatePolicyBAdmission,assertPolicyBAction,type PolicyBAdmission,type PolicyBAction} from './partial-universe';
import {requireFundamental} from './validation';
import {deepFreeze} from '@/domain/portfolio/transaction';
export interface Level1DispositionRelease {
 readonly version:'level1-disposition-release-v1';readonly id:string;readonly previousRelease:string;readonly approvedAt:string;readonly approvalHash:string;
 readonly partition:PolicyBAdmission;
 readonly dispositions:readonly {readonly ticker:string;readonly state:'LEVEL1_CLOSED'|'LEVEL1_CLOSED_WITH_EXCEPTION'|'DEFERRED';readonly qualificationReference:string;readonly canonicalRunId:string}[];
 readonly exceptions:readonly {readonly ticker:'TCX';readonly status:'ACTIVE';readonly periodEnd:'2022-12-31';readonly sourceClassification:'MANAGED_INVESTOR_PAYABLE';readonly contractualPrincipalGuarantee:'NOT_INDEPENDENTLY_PROVEN';readonly fixedInterestObligation:'NOT_INDEPENDENTLY_PROVEN';readonly fundsEconomicallyBelongToTCX:'NOT_PROVEN';readonly debtVnd:'13864719712130';readonly ketVangVnd:'5284485167173';readonly ketVangOccurrences:1;readonly sourceProvenFinancialDebt:false;readonly ownerDecisionReference:string}[];
 readonly accountingContext:{readonly VNM:{readonly debtBasis:'REPORTED_BORROWINGS';readonly comprehensiveDebtFullyProven:false;readonly otherLiabilityUncertaintyRetained:true};readonly VIB:{readonly CAR:'0.118';readonly asOf:'2026-06-30';readonly scope:'CONSOLIDATED';readonly framework:'Circular 14/2025/TT-NHNN';readonly sourceHash:string;readonly issuerNplFormula:'NOT_PROVEN';readonly nplCategory:'SUPPORTING'};readonly VIC:{readonly asOf:'2026-06-30';readonly scope:'CONSOLIDATED';readonly status:'REVIEWED';readonly reviewFirm:'Ernst & Young Vietnam';readonly conclusion:'UNMODIFIED';readonly sourceHash:string;readonly temporaryOcrRequired:false}};
 readonly readyForScoring:false;readonly decisionReady:false;
}
/** Level1 closure is not DI acceptance or scoring authorization. No accounting values are generated here. */
export function validateLevel1Disposition(raw:Level1DispositionRelease,hash:(v:unknown)=>string){
 const r=structuredClone(raw);validatePolicyBAdmission(r.partition,hash);
 requireFundamental(r.version==='level1-disposition-release-v1'&&r.readyForScoring===false&&r.decisionReady===false,'LEVEL1_NOT_SCORING_APPROVAL');
 requireFundamental(r.dispositions.length===30&&new Set(r.dispositions.map(d=>d.ticker)).size===30,'LEVEL1_EXACT_DISPOSITIONS');
 for(const m of r.partition.members){const d=r.dispositions.find(d=>d.ticker===m.ticker);requireFundamental(d&&d.canonicalRunId&&d.qualificationReference&&(m.state==='DEFERRED'?d.state==='DEFERRED':['LEVEL1_CLOSED','LEVEL1_CLOSED_WITH_EXCEPTION'].includes(d.state)),'LEVEL1_DISPOSITION_BINDING');}
 const tcx=r.dispositions.find(d=>d.ticker==='TCX'),e=r.exceptions.find(e=>e.ticker==='TCX');
 requireFundamental(r.exceptions.length===1&&tcx?.state==='LEVEL1_CLOSED_WITH_EXCEPTION'&&e?.status==='ACTIVE'&&e.periodEnd==='2022-12-31'&&e.sourceClassification==='MANAGED_INVESTOR_PAYABLE'&&e.contractualPrincipalGuarantee==='NOT_INDEPENDENTLY_PROVEN'&&e.fixedInterestObligation==='NOT_INDEPENDENTLY_PROVEN'&&e.fundsEconomicallyBelongToTCX==='NOT_PROVEN'&&e.sourceProvenFinancialDebt===false&&e.ownerDecisionReference.length>0,'TCX_ACTIVE_EXCEPTION_REQUIRED');
 requireFundamental(e.debtVnd==='13864719712130'&&e.ketVangVnd==='5284485167173'&&e.ketVangOccurrences===1&&6871600000000n+1708634544957n+BigInt(e.ketVangVnd)===BigInt(e.debtVnd),'TCX_POPULATION_ONCE');
 const {VNM:v,VIB:b,VIC:c}=r.accountingContext;
 requireFundamental(v.debtBasis==='REPORTED_BORROWINGS'&&!v.comprehensiveDebtFullyProven&&v.otherLiabilityUncertaintyRetained,'VNM_REPORTED_SCOPE_ONLY');
 requireFundamental(b.CAR==='0.118'&&b.asOf==='2026-06-30'&&b.scope==='CONSOLIDATED'&&b.framework==='Circular 14/2025/TT-NHNN'&&b.sourceHash==='a7001fa07e8c13fc3f701bb3475a8ff095faabe33d22c7c8c9ff37e46389ffd8'&&b.issuerNplFormula==='NOT_PROVEN'&&b.nplCategory==='SUPPORTING','VIB_CAPITAL_AND_SUPPORTING_DEFINITION');
 requireFundamental(c.asOf==='2026-06-30'&&c.scope==='CONSOLIDATED'&&c.status==='REVIEWED'&&c.reviewFirm==='Ernst & Young Vietnam'&&c.conclusion==='UNMODIFIED'&&!c.temporaryOcrRequired&&c.sourceHash==='0114befc096229ec6df4e3735d62001dd2a078e0510411ff97e24473f85609bf','VIC_REVIEWED_SOURCE');
 const mbb=r.partition.members.find(m=>m.ticker==='MBB');requireFundamental(mbb?.state==='DEFERRED'&&!mbb.levelOnePass&&mbb.score===null&&mbb.quarantine!==null,'MBB_QUARANTINE_REQUIRED');
 return deepFreeze(r);
}
export function level1AnalyticalContext(r:Level1DispositionRelease,ticker:string,hash:(v:unknown)=>string){const v=validateLevel1Disposition(r,hash);return deepFreeze({disposition:v.dispositions.find(d=>d.ticker===ticker)??null,exceptions:v.exceptions.filter(e=>e.ticker===ticker),accountingContext:v.accountingContext,readyForScoring:false,decisionReady:false});}
export function assertLevel1Action(r:Level1DispositionRelease,securityId:string,action:PolicyBAction,hash:(v:unknown)=>string){const v=validateLevel1Disposition(r,hash);return assertPolicyBAction(v.partition,securityId,action,hash);}
