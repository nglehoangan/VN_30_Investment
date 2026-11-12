import { describe, it, expect } from 'vitest';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { assessOwnerDecision, type OwnerAuthorization, type ProposedOwnerDecision, type DecisionScope, type AuthorizationRef } from '../../skills/vn30-market-price-corporate-actions/scripts/owner-decision';
import { review, type ReviewInput } from '../../skills/vn30-market-price-corporate-actions/scripts/review';
import { assessShares, canonical, run, cli } from '../../skills/vn30-market-price-corporate-actions/scripts/runtime.mjs';
import { ValidationError } from '@/shared/errors';
import { validateEvidence, type Evidence } from '@/domain/scoring/evidence';
const referencePath='docs/fundamental-data-engine/vnm-s4-reusable-skill/2026-11-12/VNM_INPUT.json';
const vnm=()=>JSON.parse(readFileSync(referencePath,'utf8')) as ReviewInput;
const apply=(input:ReviewInput)=>review(input,{assessShares});
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
function synthetic(ticker='SYN'):ReviewInput {
 const path=`tests/fixtures/vn30-s4/${ticker}.json`,bytes=readFileSync(path,'utf8'),d=JSON.parse(bytes);
 const ref=(pointer:string,expected:unknown)=>({path,sha256:sha(bytes),pointer,expected});
 const proof={id:'synthetic-unit-proof',hash:sha(bytes),knownAt:'2026-11-11T00:00:00.000Z',effectiveAt:'2026-11-11T00:00:00.000Z'};
 return {schemaVersion:'vn30-s4-review-input-v1',sourceMode:'SYNTHETIC_TEST',ticker,exchange:'HOSE',cutoff:'2026-10-30',reviewedAt:'2026-11-12T00:00:00.000Z',rawPrice:d.prices[0].raw,
 price:{ticker,exchange:'HOSE',date:'2026-10-30',rawEvidence:ref('/prices/0/raw',d.prices[0].raw),receiptEvidence:ref('/prices/0',d.prices[0]),receivedAt:d.prices[0].receivedAt,sourceUrl:d.prices[0].sourceUrl,sourceBodySha256:d.prices[0].responseSha256,sourceUnit:'THOUSAND_VND_PER_SHARE',unitEvidence:proof,unitSource:ref('/unit',d.unit)},
 actions:[{id:'synthetic-cash',ticker,kind:'CASH_DIVIDEND',period:'2026-INTERIM',exDate:'2026-10-01',recordDate:'2026-10-02',effectiveDate:'2026-10-15',providerValue:d.providerCash,providerEvidence:ref('/providerCash',d.providerCash),official:{id:'synthetic-cash',ticker,kind:'CASH_DIVIDEND',period:'2026-INTERIM',exDate:'2026-10-01',recordDate:'2026-10-02',effectiveDate:'2026-10-15',value:d.officialCash,unit:'VND_PER_SHARE',reviewed:true,evidence:ref('/officialCash',d.officialCash),definitionSource:ref('/definition',d.definition),definitionLayout:'NORMALIZED_EVENT_V1'},publication:{kind:'MISSING',date:null,timestamp:null,timezone:null,evidence:null},retrievedAt:d.prices[0].receivedAt,reviewedAt:'2026-11-12T00:00:00.000Z'}],
 shares:{anchor:d.anchor,review:d.review,anchorSource:ref('/anchor',d.anchor),reviewSource:ref('/review',d.review)},historicalCoverage:{complete:false,limitations:['Synthetic source coverage']},sourceLocations:[]};
}
describe('reusable S4 offline review',()=>{
 it('normal VNM raw close,15 cash components and carry-forward reuse retained economic reconciliation',()=>{
  const r=apply(vnm());expect(r.price.value).toBe('56900');expect(r.actions).toHaveLength(15);
  expect(r.actions.reduce((s,a)=>s+Number(a.selectedValue),0)).toBe(18750);
  expect(r.shares.status).toBe('CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS');
  expect(r.acceptance.research).toBe('READY_FOR_OWNER_ADMISSION');
 });
 it.each([null,undefined,'',0,-1])('missing/invalid raw %s has no adjusted fallback',value=>{
  const i=synthetic();i.rawPrice.GiaDongCua=value;i.rawPrice.GiaDieuChinh=100;
  expect(apply(i).price).toMatchObject({status:'NOT_QUALIFIED',value:null});
 });
 it('adjusted value cannot change selected research price',()=>{
  const i=synthetic(),before=apply(i).price.value;i.rawPrice.GiaDieuChinh=999999;
  expect(apply(i).price.value).toBe(before);expect(before).toBe('12345');
 });
 it('decimal thousand-VND conversion remains exact and undeclared units are rejected',()=>{
  const i=synthetic();i.rawPrice.GiaDongCua='12.3456';expect(apply(i).price.value).toBe('12345.6');
  Object.assign(i.price,{sourceUnit:'UNKNOWN'});expect(apply(i).price.status).toBe('NOT_QUALIFIED');
 });
 it('missing unit evidence leaves price unqualified rather than inventing a multiplier',()=>{
  const i=synthetic();i.price.unitEvidence=null;i.price.unitSource=null;i.price.sourceUnit='UNKNOWN';
  expect(apply(i).price).toMatchObject({status:'NOT_QUALIFIED',value:null,sourceUnit:'UNKNOWN'});
 });
 it('cash conflict resolves only against reviewed same-event official terms',()=>{
  const i=synthetic(),r=apply(i);expect(r.actions[0]).toMatchObject({selectedValue:'125',providerValue:'100',conflictingObservation:true,status:'RESEARCH_RECONCILED'});
  i.actions[0].official!.reviewed=false;expect(apply(i).actions[0].selectedValue).toBeNull();
 });
 it('same amount on different event/period does not create a mapping',()=>{
  const i=synthetic();i.actions[0].official!.period='2025';expect(apply(i).actions[0].status).toBe('NOT_QUALIFIED');
 });
 it('missing official evidence preserves the provider conflict without inventing selected values',()=>{
  const i=synthetic();i.actions[0].official=null;expect(apply(i).actions[0]).toMatchObject({selectedValue:null,providerValue:'100',status:'NOT_QUALIFIED'});
 });
 it('confirmed share change blocks automatic carry-forward',()=>{
  const i=synthetic();i.shares.review.events=[{id:'issuance',ticker:'SYN',sourceReference:'synthetic-event',affectsOutstanding:true,effectiveDate:'2026-10-15',status:'CONFIRMED'}];
  expect(apply(i).shares).toMatchObject({status:'NOT_QUALIFIED',reason:'CONFIRMED_EFFECTIVE_SHARE_COUNT_CHANGE'});
 });
 it('a confirmed issuance found in action review cannot be hidden by an empty share review',()=>{
  const i=synthetic();i.actions[0].kind='ISSUANCE';Object.assign(i.actions[0].official!,{kind:'ISSUANCE',unit:'SHARES',value:'1000'});
  expect(apply(i).shares).toMatchObject({status:'NOT_QUALIFIED',reason:'CONFIRMED_EFFECTIVE_SHARE_COUNT_CHANGE'});
 });
 it('unknown capital terms and unknown effective dates cannot establish an unchanged denominator',()=>{
  const i=synthetic();i.actions[0].kind='UNKNOWN';i.actions[0].official=null;i.actions[0].effectiveDate=null;
  const r=apply(i);expect(r.actions[0].selectedValue).toBeNull();expect(r.shares.status).toBe('NOT_QUALIFIED');
 });
 it('incomplete external coverage stays bounded; an identified unread relevant document blocks',()=>{
  const i=synthetic(),r=apply(i);expect(r.shares.completeNegativeSearch).toBe(false);expect(r.acceptance.R3).toBe('RESTRICTED_TO_HISTORICAL_COMPLETENESS');
  i.shares.review.unreviewedRelevantDocuments=['treasury.pdf'];expect(apply(i).shares.status).toBe('NOT_QUALIFIED');
 });
 it('publication DATE_ONLY candidates retain timezone and still require qualification',()=>{
  const i=synthetic();i.actions[0].publication={kind:'DATE_ONLY_CANDIDATE',date:'2026-10-01',timestamp:null,timezone:'Asia/Ho_Chi_Minh',evidence:i.actions[0].official!.evidence};
  expect(apply(i).actions[0].publication.status).toBe('CANDIDATE_REQUIRES_GOVERNED_QUALIFICATION');
  i.actions[0].publication.timezone=null;expect(()=>apply(i)).toThrow('DATE_ONLY_TIMEZONE');
 });
 it('missing publication does not deny economic research or manufacture formal/PIT eligibility',()=>{
  const r=apply(synthetic());expect(r.acceptance.research).toBe('SYNTHETIC_TEST_ONLY');
  expect(r.actions[0].publication.status).toBe('MISSING_PUBLICATION_EVIDENCE');
  expect(r.acceptance.formalAdmissionGranted).toBe(false);expect(r.acceptance.PIT).toBe('NOT_QUALIFIED_BY_THIS_REVIEW');
 });
 it('VNM retains eight VSDC update clues without treating them as original publication qualification',()=>{
  const r=apply(vnm());expect(r.actions.filter(a=>a.publication.candidate.kind==='UPDATE_CLUE')).toHaveLength(8);
  expect(r.actions.filter(a=>a.publication.candidate.kind==='MISSING')).toHaveLength(7);
 });
 it('future cash dates stay separate from the share count and do not become received cash',()=>{
  const i=synthetic();i.actions[0].effectiveDate='2026-11-26';i.actions[0].official!.effectiveDate='2026-11-26';
  const r=apply(i);expect(r.actions[0].effectiveByCutoff).toBe(false);expect(r.shares.shares).toBe('1000000');
  expect(r).not.toHaveProperty('portfolioCash');
 });
 it('replay is byte deterministic, action ordering is stable and input remains unchanged',()=>{
  const i=vnm(),before=canonical(i),first=canonical(apply(i));expect(canonical(apply(i))).toBe(first);expect(canonical(i)).toBe(before);
  i.actions.reverse();expect(canonical(apply(i))).toBe(first);
 });
 it.each(['price','actions','shares'] as const)('cross-ticker %s is rejected',part=>{
  const i=synthetic();if(part==='price')i.rawPrice.Symbol='XYZ';if(part==='actions')i.actions[0].official!.ticker='XYZ';if(part==='shares')i.shares.anchor.ticker='XYZ';
  expect(()=>apply(i)).toThrow('CROSS_TICKER');
 });
 it('two synthetic tickers replay independently with no VNM lookup',async()=>{
  const a=await run(synthetic()),b=await run(synthetic('XYZ'));
  expect([a.ticker,a.price.value,b.ticker,b.price.value]).toEqual(['SYN','12345','XYZ','80100']);
 });
 it('tampered source pins and selected amounts are rejected before replay',async()=>{
  const i=synthetic();i.actions[0].official!.value='999';await expect(run(i)).rejects.toThrow('EXACT_VALUE_BINDING');
  const k=synthetic();k.price.rawEvidence.sha256='0'.repeat(64);await expect(run(k)).rejects.toThrow('SOURCE_HASH_MISMATCH');
 });
 it('ticker-scoped output is idempotent and refuses conflicting overwrite',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'vn30-s4-'));
  try {
   const inp=join(dir,'input.json');writeFileSync(inp,canonical(synthetic()));
   const target=await cli(['--input',inp,'--out',dir]);expect(target.endsWith('/SYN/2026-10-30')).toBe(true);
   const first=readFileSync(join(target,'EVIDENCE.json'),'utf8');await cli(['--input',inp,'--out',dir]);expect(readFileSync(join(target,'EVIDENCE.json'),'utf8')).toBe(first);
   const i=synthetic();i.reviewedAt='2026-11-13T00:00:00.000Z';writeFileSync(inp,canonical(i));
   await expect(cli(['--input',inp,'--out',dir])).rejects.toThrow('OUTPUT_CONFLICT');
  } finally {rmSync(dir,{recursive:true,force:true});}
 });
 it('production data output is rejected even through a symlink alias',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'vn30-s4-scope-'));
  try {
   const inp=join(dir,'input.json');writeFileSync(inp,canonical(synthetic()));
   symlinkSync(process.cwd()+'/data',join(dir,'data-alias'),'dir');
   await expect(cli(['--input',inp,'--out',join(dir,'data-alias')])).rejects.toThrow('PRODUCTION_DATA_OUTPUT_FORBIDDEN');
  } finally {rmSync(dir,{recursive:true,force:true});}
 });
 it('caller-supplied formal approval booleans have no authority',()=>{
  const i=Object.assign(synthetic(),{formalApproved:true,productionActivated:true});const r=apply(i);
  expect(r.acceptance.formalAdmissionGranted).toBe(false);expect(r.acceptance.productionActivated).toBe(false);
 });
});
function canonicalDateOnlyEvidence(): Evidence {
 const at='2026-11-12T00:00:00.000Z',h='a'.repeat(64);
 return {id:'synthetic-evidence',version:'v1',securityId:'SYN',observation:'cash-term',value:'125',unit:'VND_PER_SHARE',classification:'FACT',source:'SYNTHETIC_TEST',periodStart:'2026-10-01',periodEnd:'2026-10-01',asOf:at,publishedAt:null,receivedAt:at,validThrough:at,critical:true,quality:'VALID',family:'dividend',time:{contract:'canonical-evidence-time-v2',snapshotRunId:'synthetic-run',fundamentalCutoff:at,availableAt:at,reviewKnownAt:[at],constituents:[{observationId:'synthetic-obs',publicationPrecision:'DATE_ONLY',publicationStatus:'VERIFIED',publishedAt:null,publicationDate:'2026-10-01',timezone:'Asia/Ho_Chi_Minh',evidenceReference:'synthetic-reference',assessmentId:'synthetic-assessment',observationHash:h,policyHash:h,availableAt:at,availabilityProvenance:'SYNTHETIC qualified-date-only assessment; no live authority'}]}};
}
describe('reuse the actual existing executable time contract',()=>{
 it('qualified synthetic DATE_ONLY evidence passes without an invented timestamp',()=>{
  const e=canonicalDateOnlyEvidence();expect(validateEvidence([e],'SYN',e.asOf,e.receivedAt)).toEqual([]);
 });
 it('missing publication date is rejected by the actual contract',()=>{
  const e=canonicalDateOnlyEvidence();Object.assign(e.time!.constituents[0],{publicationDate:null});
  try {validateEvidence([e],'SYN',e.asOf,e.receivedAt);throw Error('Expected contract rejection');} catch(error) {expect(error).toBeInstanceOf(ValidationError);expect((error as ValidationError).issues[0].reason).toBe('INVALID_DATE_ONLY_PUBLICATION');}
 });
 it('later availability fails an October historical cutoff rather than being backdated',()=>{
  const e=canonicalDateOnlyEvidence();Object.assign(e.time!,{fundamentalCutoff:'2026-10-30T08:00:00.000Z'});
  try {validateEvidence([e],'SYN',e.asOf,e.receivedAt);throw Error('Expected contract rejection');} catch(error) {expect(error).toBeInstanceOf(ValidationError);expect((error as ValidationError).issues[0].reason).toBe('INVALID_OPERATIONAL_KNOWLEDGE');}
 });
});

describe('owner authorization provenance, never assistant recommendation',()=>{
 const proposalPath='tests/fixtures/vn30-s4/owner-proposal.json';
 const authPath='tests/fixtures/vn30-s4/owner-authorization.json';
 const ref=(path:string,pointer?:string)=>({path,sha256:sha(readFileSync(path,'utf8')),pointer});
 const scope=():DecisionScope=>({ticker:'SYN',cutoff:'2026-10-30',proposal:ref(proposalPath)});
 const claimed=():ProposedOwnerDecision=>({...scope(),decision:'EXPLICITLY_APPROVED',authorization:ref(authPath,'/message')});
 const trustedFixtureVerifier=(reference: AuthorizationRef):OwnerAuthorization|null=>{
  // Fixture-only trusted allowlist; no input can change the trusted path/hash.
  const known=ref(authPath,'/message');
  if(canonical(reference)!==canonical(known))return null;
  const document=JSON.parse(readFileSync(known.path,'utf8'));
  return {...document.message,authorization:known};
 };
 it('a proposed decision stays pending even beside a legitimate reference and verifier',()=>{
  const d=claimed();d.decision='PROPOSED';
  expect(assessOwnerDecision(scope(),d,trustedFixtureVerifier).status).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
 });
 it('an explicitly approved claim without an actual authorization reference stays pending',()=>{
  const d=claimed();d.authorization=null;
  expect(assessOwnerDecision(scope(),d,trustedFixtureVerifier)).toMatchObject({status:'PENDING_EXPLICIT_OWNER_APPROVAL',authorization:null});
 });
 it('a source hash/reference alone is not authorization without independent verification',()=>{
  expect(assessOwnerDecision(scope(),claimed()).status).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
 });
 it('an exact explicit synthetic owner decision is recognized only through the trusted verifier',()=>{
  expect(assessOwnerDecision(scope(),claimed(),trustedFixtureVerifier)).toMatchObject({status:'EXPLICIT_OWNER_APPROVAL_VERIFIED',authorization:ref(authPath,'/message')});
 });
 it.each(['ASSISTANT','SUPERSEDED','WRONG_PROPOSAL','WRONG_TICKER','WRONG_PURPOSE'])('%s cannot authorize the proposed facts',variant=>{
  const verify=(r: AuthorizationRef)=>{
   const proof=trustedFixtureVerifier(r)!;
   if(variant==='ASSISTANT')proof.sourceAuthor='ASSISTANT';
   if(variant==='SUPERSEDED')proof.superseded=true;
   if(variant==='WRONG_PROPOSAL')proof.proposalSha256='0'.repeat(64);
   if(variant==='WRONG_TICKER')proof.ticker='VNM';
   if(variant==='WRONG_PURPOSE')Object.assign(proof,{purpose:'PRODUCTION'});
   return proof;
  };
  expect(assessOwnerDecision(scope(),claimed(),verify).status).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
 });
 it('scope mismatch cannot be authorized by a verifier for another proposal',()=>{
  const d=claimed();d.proposal={...d.proposal,sha256:'0'.repeat(64)};
  expect(assessOwnerDecision(scope(),d,trustedFixtureVerifier).status).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
 });
 it('the offline review never promotes submitted approved records or PASS booleans',async()=>{
  const i=Object.assign(synthetic(),{ownerDecision:claimed(),ownerApproved:true});
  const r=await run(i);
  expect(r.acceptance.ownerAdmission).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
  expect(r.acceptance.ownerApproval).toBeNull();expect(r.acceptance.formalAdmissionGranted).toBe(false);
 });
 it('the preserved unsupported VNM conditional receipt cannot authorize admission',async()=>{
  const i=vnm();i.ownerDecision={ticker:'VNM',cutoff:i.cutoff,decision:'EXPLICITLY_APPROVED',
   proposal:ref('docs/fundamental-data-engine/vnm-s4-source-admission/2026-11-12/ADMISSION_DECISIONS.json'),
   authorization:ref('docs/fundamental-data-engine/governance/VNM_S4_CONDITIONAL_RESEARCH_APPROVAL_2026-11-12.json')};
  const r=await run(i);expect(r.acceptance.ownerAdmission).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
  expect(r.acceptance.ownerApproval).toBeNull();
 });
 it('a different proposal JSON pointer cannot inherit approval from the same file hash',()=>{
  const d=claimed();d.proposal={...d.proposal,pointer:'/facts/0'};
  expect(assessOwnerDecision(scope(),d,trustedFixtureVerifier).status).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
 });
 it('VNM retains research readiness but has no explicit owner admission',async()=>{
  const r=await run(vnm());
  expect(r.acceptance.research).toBe('READY_FOR_OWNER_ADMISSION');
  expect(r.acceptance.ownerAdmission).toBe('PENDING_EXPLICIT_OWNER_APPROVAL');
  expect(r.acceptance.ownerApproval).toBeNull();
  expect(r.acceptance.R1).toBe('CLOSED_BY_OWNER_APPROVED_CARRY_FORWARD_POLICY');
  expect(r.acceptance.R4).toBe('CLOSED_BY_SCOPE_EXCLUSION');
 });
});
