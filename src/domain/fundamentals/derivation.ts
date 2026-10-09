import type { FundamentalObservation, RegistryRelease, FinancialUnit } from './contracts';
import { requireFundamental, fundamentalId, fundamentalHash, validateFundamentalObservation } from './validation';
import { calculateMetrics, METRICS } from '@/domain/scoring/metrics';
import type { MetricId, MetricOperand } from '@/domain/scoring/metrics';
import type { Sector } from '@/domain/scoring/methodology';
import { SECTORS } from '@/domain/scoring/methodology';
import { decimal } from '@/domain/portfolio/values';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { snapshot } from '@/domain/scoring/validation';
import { instant,dateOnly } from '@/shared/time';

export interface DerivationCrosswalk {
  readonly version:string; readonly recordedAt:string; readonly effectiveDate:string; readonly governanceStatus:'PROPOSED'|'APPROVED'; readonly approvalReference:string|null;
  readonly registryHash:string; readonly formulaVersion:'existing-metrics-v1';
  readonly precisionPolicy:'decimal-12-half-even-v1'; readonly authorityReferences:readonly string[];
  readonly routes:readonly {readonly sector:Sector;readonly metric:MetricId;
    readonly operands:readonly {readonly role:string;readonly itemId:string|null;readonly operation:OperandOperation}[]}[];
}
export type OperandOperation='REPORTED'|'AVERAGE_ENDPOINTS'|'TTM_QUARTERS'|'QUARTER_FROM_YTD'|'HUMAN_NORMALIZED'|'ACTION_ADJUSTED';
/** Audit classification only; the reviewed signed amount controls arithmetic. */
export const HUMAN_ADJUSTMENT_KINDS = ['NON_RECURRING_GAIN','NON_RECURRING_LOSS','ACCOUNTING_RECLASSIFICATION','OTHER_REVIEWED'] as const;
export type HumanAdjustmentKind = typeof HUMAN_ADJUSTMENT_KINDS[number];
export interface ReviewedAdjustment {
  readonly id:string;readonly reviewerReference:string;readonly reviewedAt:string;readonly evidenceReference:string;
  readonly rationale:string;readonly amount:string;readonly confidence:'HIGH'|'MEDIUM'|'LOW';
  readonly unit:FinancialUnit;readonly currency:string|null;
  readonly adjustmentKind:HumanAdjustmentKind|'CORPORATE_ACTION_FACTOR';
}
export interface DerivationRequest {
  readonly id:string;readonly scope:FundamentalObservation['scope'];readonly securityId:string;readonly sector:Sector;
  readonly metric:MetricId;readonly periodStart:string;readonly periodEnd:string;readonly cyclical:boolean;
  readonly operands:readonly {readonly id:string;readonly operation:OperandOperation;readonly observationIds:readonly string[];
    readonly adjustment:ReviewedAdjustment|null}[];
}
export interface DerivationAssessment {
  readonly id:string;readonly recordedAt:string;readonly request:DerivationRequest;
  readonly registry:RegistryRelease;readonly crosswalk:DerivationCrosswalk;readonly crosswalkHash:string;
  readonly observations:readonly FundamentalObservation[];readonly inputHashes:readonly {readonly id:string;readonly hash:string}[];
  readonly operands:readonly {readonly id:string;readonly role:string;readonly operation:OperandOperation;
    readonly value:string|null;readonly reason:string|null;readonly observationIds:readonly string[];
    readonly unit:FundamentalObservation['normalized']['unit']|null;readonly currency:string|null;
    readonly confidence:'HIGH'|'MEDIUM'|'LOW'}[];
  readonly value:string|null;readonly unit:'CURRENCY'|'RATIO'|null;readonly currency:string|null;
  readonly reason:string|null;readonly confidence:'HIGH'|'MEDIUM'|'LOW';readonly status:'CALCULATED'|'N_R';
  readonly availability:{readonly availableAt:null;readonly status:'UNKNOWN'};
}
const operations=['REPORTED','AVERAGE_ENDPOINTS','TTM_QUARTERS','QUARTER_FROM_YTD','HUMAN_NORMALIZED','ACTION_ADJUSTED'];
const metrics=['ROE','FCF','CASA','NPL'];
function exact(x:object,names:string){requireFundamental(x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(' ')===names.split(' ').sort().join(' '),'DERIVATION_EXACT_FIELDS');}
function reference(x:string){requireFundamental(typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=4000&&!/[\x00-\x1f<>]/.test(x),'DERIVATION_REFERENCE');}
export function validateCrosswalk(raw:DerivationCrosswalk,registry:RegistryRelease):DerivationCrosswalk {
  const x=snapshot(raw);exact(x,'version recordedAt effectiveDate governanceStatus approvalReference registryHash formulaVersion precisionPolicy authorityReferences routes');
  fundamentalId(x.version);instant(x.recordedAt);dateOnly(x.effectiveDate);fundamentalHash(x.registryHash);
  requireFundamental(x.registryHash===registry.registryHash&&x.formulaVersion==='existing-metrics-v1'&&x.precisionPolicy==='decimal-12-half-even-v1','DERIVATION_RELEASE_BINDING');
  requireFundamental(['PROPOSED','APPROVED'].includes(x.governanceStatus)&&(x.governanceStatus==='APPROVED')===(x.approvalReference!==null),'CROSSWALK_APPROVAL');
  if(x.approvalReference!==null) reference(x.approvalReference);
  requireFundamental(Array.isArray(x.authorityReferences)&&x.authorityReferences.length>0,'CROSSWALK_AUTHORITY');x.authorityReferences.forEach(reference);
  requireFundamental(Array.isArray(x.routes)&&x.routes.length<=100&&new Set(x.routes.map(r=>`${r.sector}:${r.metric}`)).size===x.routes.length,'CROSSWALK_ROUTES');
  for(const r of x.routes as DerivationCrosswalk['routes']){
    exact(r,'sector metric operands');requireFundamental(SECTORS.includes(r.sector)&&metrics.includes(r.metric),'SUPPORTED_DERIVATION_ROUTE');
    requireFundamental(!(r.sector==='BANK'&&r.metric==='FCF')&&(!(r.metric==='CASA'||r.metric==='NPL')||r.sector==='BANK'),'SECTOR_METRIC_NOT_EQUIVALENT');
    requireFundamental(r.operands.length===2,'ORDERED_CROSSWALK_OPERANDS');
    r.operands.forEach((o,i)=>{exact(o,'role itemId operation');requireFundamental(o.role===METRICS[r.metric][i]&&operations.includes(o.operation),'OPERAND_ROLE_OPERATION');
      if(o.itemId!==null){const item=registry.manifest.items.find(a=>a.itemId===o.itemId&&a.status==='ACTIVE');requireFundamental(item&&item.sectorApplicability.includes(r.sector),'CROSSWALK_CANONICAL_ITEM');}
    });
  }
  return deepFreeze(x);
}
export function validateDerivationRequest(raw:DerivationRequest):DerivationRequest {
  const x=snapshot(raw);exact(x,'id scope securityId sector metric periodStart periodEnd cyclical operands');
  fundamentalId(x.id);fundamentalId(x.securityId);dateOnly(x.periodStart);dateOnly(x.periodEnd);
  requireFundamental(x.periodStart<=x.periodEnd&&['FORMAL','SYNTHETIC_TEST'].includes(x.scope)&&SECTORS.includes(x.sector)&&metrics.includes(x.metric)&&typeof x.cyclical==='boolean','DERIVATION_REQUEST_METADATA');
  requireFundamental(Array.isArray(x.operands)&&x.operands.length===2&&new Set(x.operands.map(o=>o.id)).size===2,'DERIVATION_TWO_ORDERED_OPERANDS');
  for(const o of x.operands){exact(o,'id operation observationIds adjustment');fundamentalId(o.id);requireFundamental(operations.includes(o.operation)&&Array.isArray(o.observationIds)&&o.observationIds.length>0&&o.observationIds.length<=4&&new Set(o.observationIds).size===o.observationIds.length,'DERIVATION_INPUTS');o.observationIds.forEach(fundamentalId);
    requireFundamental((o.operation==='HUMAN_NORMALIZED'||o.operation==='ACTION_ADJUSTED')===(o.adjustment!==null),'REVIEWED_ADJUSTMENT_REQUIRED');
    if(o.adjustment){
      const a=o.adjustment;
      exact(a,'id reviewerReference reviewedAt evidenceReference rationale amount confidence unit currency adjustmentKind');
      fundamentalId(a.id);[a.reviewerReference,a.evidenceReference,a.rationale].forEach(reference);instant(a.reviewedAt);
      requireFundamental(decimal(a.amount).toString()===a.amount&&['HIGH','MEDIUM','LOW'].includes(a.confidence),'REVIEWED_ADJUSTMENT_METADATA');
      requireFundamental(['CURRENCY','CURRENCY_PER_SHARE','SHARES','RATIO'].includes(a.unit),'ADJUSTMENT_CANONICAL_UNIT_REQUIRED');
      const monetary=a.unit==='CURRENCY'||a.unit==='CURRENCY_PER_SHARE';
      requireFundamental(monetary ? typeof a.currency==='string'&&/^[A-Z]{3}$/.test(a.currency) : a.currency===null,'ADJUSTMENT_CURRENCY_REQUIRED');
      if(o.operation==='HUMAN_NORMALIZED') requireFundamental(HUMAN_ADJUSTMENT_KINDS.includes(a.adjustmentKind as HumanAdjustmentKind),'HUMAN_ADJUSTMENT_CLASSIFICATION_REQUIRED');
      else requireFundamental(a.adjustmentKind==='CORPORATE_ACTION_FACTOR'&&a.unit==='RATIO'&&a.currency===null&&decimal(a.amount).positive,'DIMENSIONLESS_POSITIVE_ACTION_FACTOR_REQUIRED');
    }
  }
  return deepFreeze(x);
}
function nextDay(day:string){return new Date(Date.parse(`${day}T00:00:00Z`)+86400000).toISOString().slice(0,10);}
function quarterEndAfter(start:string){const d=new Date(`${start}T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()+3);return d.toISOString().slice(0,10);}
function context(o:FundamentalObservation){return JSON.stringify([o.scope,o.securityId,o.itemId,o.reportingScope,o.segment,o.accountingBasis,o.fiscalCalendarReference,o.normalized.unit,o.normalized.currency,o.registryHash,o.itemDefinitionVersion,o.sourceVersionId,o.mappingVersion]);}
function minimum(values:readonly ('HIGH'|'MEDIUM'|'LOW')[]):'HIGH'|'MEDIUM'|'LOW'{return values.includes('LOW')?'LOW':values.includes('MEDIUM')?'MEDIUM':'HIGH';}
/** Arithmetic over explicitly pinned facts only. No availability evaluation, selection or scoring. */
export function deriveFundamentals(input:{request:DerivationRequest;recordedAt:string;registry:RegistryRelease;crosswalk:DerivationCrosswalk;crosswalkHash:string;observations:readonly FundamentalObservation[];hash:(v:unknown)=>string}):DerivationAssessment {
  const r=validateDerivationRequest(input.request),c=validateCrosswalk(input.crosswalk,input.registry);instant(input.recordedAt);fundamentalHash(input.crosswalkHash);
  requireFundamental(input.hash(c)===input.crosswalkHash,'CROSSWALK_HASH');
  requireFundamental(c.recordedAt<=input.recordedAt&&c.effectiveDate<=input.recordedAt.slice(0,10),'CROSSWALK_NOT_KNOWN_AT_EXECUTION');
  requireFundamental(r.scope!=='FORMAL'||c.governanceStatus==='APPROVED'&&input.registry.manifest.governanceStatus==='APPROVED','FORMAL_DERIVATION_APPROVAL_REQUIRED');
  const ids=[...new Set(r.operands.flatMap(o=>o.observationIds))];
  const observations=input.observations.map(o=>validateFundamentalObservation(o,input.registry));
  requireFundamental(observations.length===ids.length&&new Set(observations.map(o=>o.id)).size===ids.length&&observations.every(o=>ids.includes(o.id)&&o.securityId===r.securityId&&o.scope===r.scope&&o.sector===r.sector&&o.ingestedAt<=input.recordedAt),'DERIVATION_PINNED_INPUT_MANIFEST');
  for(const spec of r.operands) if(spec.adjustment) requireFundamental(spec.adjustment.reviewedAt<=input.recordedAt&&spec.observationIds.every(id=>observations.find(o=>o.id===id)!.ingestedAt<=spec.adjustment!.reviewedAt),'ADJUSTMENT_NOT_REVIEWED_AT_EXECUTION');
  const route=c.routes.find(a=>a.sector===r.sector&&a.metric===r.metric);
  const operands=r.operands.map((spec,index)=>{
    const policy=route?.operands[index],rows=spec.observationIds.map(id=>observations.find(o=>o.id===id)!);
    let value:string|null=null,reason:string|null=null;
    const first=rows[0];
    if(!policy||policy.itemId===null) reason='UNRESOLVED_SECTOR_ROUTE';
    else if(policy.operation!==spec.operation||rows.some(o=>o.itemId!==policy.itemId)) reason='OPERAND_CROSSWALK_MISMATCH';
    else if(rows.some(o=>context(o)!==context(first))) reason='INCOMPARABLE_OPERAND_INPUTS';
    else if(rows.some(o=>o.quality!=='VALID'||o.applicability!=='APPLICABLE'||o.normalized.value===null)) reason='MISSING_OR_INVALID_INPUT';
    else if(rows.some(o=>o.periodEnd>r.periodEnd)) reason='INPUT_AFTER_ECONOMIC_PERIOD';
    else {
      const amounts=rows.map(o=>decimal(o.normalized.value!));
      const flow=rows.every(o=>o.measurementSemantic==='FLOW');
      const sameWindow=rows.length===1&&first.periodStart===r.periodStart&&first.periodEnd===r.periodEnd;
      if(spec.operation==='REPORTED') {
        if(!sameWindow)reason='REPORTED_PERIOD_MISMATCH';else value=amounts[0].toString();
      } else if(spec.operation==='AVERAGE_ENDPOINTS') {
        if(rows.length!==2||rows.some(o=>o.measurementSemantic!=='STOCK'||o.periodType!=='INSTANT')||nextDay(rows[0].periodEnd)!==r.periodStart||rows[1].periodEnd!==r.periodEnd)reason='AVERAGE_ENDPOINTS_MISMATCH';
        else value=amounts[0].add(amounts[1]).div(decimal('2')).toString();
      } else if(spec.operation==='TTM_QUARTERS') {
        if(!flow||rows.length!==4||rows.some(o=>o.periodType!=='QUARTER'||o.periodStart.slice(8)!=='01'||quarterEndAfter(o.periodStart)!==nextDay(o.periodEnd))||first.periodStart!==r.periodStart||rows[3].periodEnd!==r.periodEnd||rows.slice(1).some((o,i)=>nextDay(rows[i].periodEnd)!==o.periodStart||o.fiscalQuarter!==rows[i].fiscalQuarter!%4+1||o.fiscalYear!==rows[i].fiscalYear+(rows[i].fiscalQuarter===4?1:0))||nextDay(r.periodEnd)!==`${Number(r.periodStart.slice(0,4))+1}${r.periodStart.slice(4)}`)reason='TTM_NATIVE_QUARTERS_REQUIRED';
        else value=amounts.reduce((a,b)=>a.add(b),decimal('0')).toString();
      } else if(spec.operation==='QUARTER_FROM_YTD') {
        if(!flow||rows.length!==2||rows.some(o=>o.periodType!=='YTD')||rows[0].periodStart!==rows[1].periodStart||rows[0].fiscalYear!==rows[1].fiscalYear||rows[1].fiscalQuarter!==rows[0].fiscalQuarter!+1||nextDay(rows[0].periodEnd)!==r.periodStart||rows[1].periodEnd!==r.periodEnd||rows[0].revisionKind!==rows[1].revisionKind||rows[0].revisionKind!=='ORIGINAL'&&(rows[0].revisionEvidenceReference!==rows[1].revisionEvidenceReference||rows[0].correctionKnownAt!==rows[1].correctionKnownAt))reason='YTD_VINTAGE_PERIOD_MISMATCH';
        else value=amounts[1].sub(amounts[0]).toString();
      } else {
        const a=spec.adjustment!;
        if(!sameWindow)reason='ADJUSTMENT_PERIOD_MISMATCH';
        else if(spec.operation==='HUMAN_NORMALIZED'&&(first.normalized.unit!=='CURRENCY'||a.unit!==first.normalized.unit||a.currency!==first.normalized.currency))reason='MONETARY_ADJUSTMENT_DIMENSION_MISMATCH';
        else if(spec.operation==='ACTION_ADJUSTED'&&first.normalized.unit!=='CURRENCY_PER_SHARE')reason='ACTION_REQUIRES_PER_SHARE_INPUT';
        else value=(spec.operation==='ACTION_ADJUSTED'?amounts[0].mul(decimal(a.amount)):amounts[0].add(decimal(a.amount))).toString();
      }
      if(value!==null)decimal(value);
    }
    return {id:spec.id,role:METRICS[r.metric][index],operation:spec.operation,value,reason,observationIds:spec.observationIds,
      unit:first.normalized.unit,currency:first.normalized.currency,confidence:reason?'LOW' as const:minimum(['HIGH',...(spec.adjustment?[spec.adjustment.confidence]:[])])};
  });
  let reason=operands.find(o=>o.reason)?.reason??null,value:string|null=null;
  if(!reason&&observations.some(o=>o.reportingScope!==observations[0].reportingScope||o.segment!==observations[0].segment||o.accountingBasis!==observations[0].accountingBasis||o.fiscalCalendarReference!==observations[0].fiscalCalendarReference)||!reason&&operands[0].unit!==operands[1].unit||!reason&&operands[0].currency!==operands[1].currency)reason='METRIC_INPUT_CONTEXT_MISMATCH';
  if(!reason&&operands.some(o=>o.unit!=='CURRENCY'))reason='CURRENCY_METRIC_OPERANDS_REQUIRED';
  if(!reason&&operands[0].currency!=='VND')reason='VND_FORMULA_BRIDGE_REQUIRED';
  if(!reason){
    // Minimal arithmetic operands: no invented publication/receipt/availableAt is supplied or retained.
    const projected:MetricOperand[]=operands.map(o=>({id:o.id,value:o.value!,unit:'VND',periodStart:r.periodStart,periodEnd:r.periodEnd,quality:'VALID',validThrough:input.recordedAt}));
    const normalized=r.operands.some(o=>o.operation==='HUMAN_NORMALIZED'||o.operation==='ACTION_ADJUSTED');
    const result=calculateMetrics([{id:r.id,metric:r.metric,evidenceRefs:operands.map(o=>o.id),years:null,comparable:true,normalization:{kind:normalized?'NORMALIZED':'AS_REPORTED',rationale:'Pinned reviewed derivation operands; not PIT-eligible evidence',evidenceRefs:[]}}],projected,r.sector,input.recordedAt,[],r.cyclical)[0];
    value=result.value;reason=result.reason;
  }
  return deepFreeze({id:r.id,recordedAt:input.recordedAt,request:r,registry:input.registry,crosswalk:c,crosswalkHash:input.crosswalkHash,observations,
    inputHashes:observations.map(o=>({id:o.id,hash:input.hash(o)})),operands,value,unit:r.metric==='FCF'?'CURRENCY':'RATIO',currency:r.metric==='FCF'?operands[0].currency:null,
    reason,confidence:reason?'LOW':minimum(operands.map(o=>o.confidence)),status:value===null?'N_R':'CALCULATED',availability:{availableAt:null,status:'UNKNOWN'}});
}
