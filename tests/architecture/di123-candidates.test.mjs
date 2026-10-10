// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {candidateHash,validateMembership,validateIdentities,activeMembership,identityForAlias,validateSector,sealCandidate,reconcileUniverse,referenceCandidateGates} from '../../scripts/lib/reference-candidates.mjs';
import {SECTORS} from '../../src/domain/scoring/methodology/sectors';
const row=(n=1)=>({ticker:`T${String(n).padStart(2,'0')}`,securityId:`synthetic-security-${n}`,index:'VN30',exchange:'HOSE',effectiveFrom:'2026-08-03',effectiveTo:null,sourceReference:'SYNTHETIC_TEST_ONLY',evidenceHash:'a'.repeat(64)});
const rows=Array.from({length:30},(_,i)=>row(i+1));
const identities=rows.map(r=>({securityId:r.securityId,ticker:r.ticker,exchange:'HOSE',isin:`VN${String(rows.indexOf(r)).padStart(9,'0')}0`}));
const sector={securityId:row().securityId,sector:null,method:'EXPLICIT_REFERENCE_EVIDENCE',effectiveFrom:'2026-08-03',effectiveTo:null,approvalStatus:'REVIEW_REQUIRED'};
const gates=(patch={})=>referenceCandidateGates({sourceKind:'OFFICIAL',rows,identities,sectors:[],asOf:'2026-10-10',...patch});
describe('DI1–DI3 candidate boundary',()=>{
 it('research basket cannot authorize membership',()=>expect(gates({sourceKind:'RESEARCH_BASKET'})[0]).toMatchObject({status:'BLOCKED',technicalEvidence:'NON_OFFICIAL_REVIEW_REQUIRED'}));
 it('secondary evidence cannot silently authorize official membership',()=>expect(gates({sourceKind:'SECONDARY'})[0]).toMatchObject({status:'BLOCKED',technicalEvidence:'NON_OFFICIAL_REVIEW_REQUIRED'}));
 it('duplicate tickers fail',()=>expect(()=>validateMembership([...rows,row()])).toThrow('DUPLICATE_TICKER'));
 it('duplicate security identities fail',()=>expect(()=>validateMembership([row(),{...row(2),securityId:row().securityId}])).toThrow('DUPLICATE_SECURITY_IDENTITY'));
 it('aliases resolve to one stable identity',()=>{
  const ids=[{securityId:'synthetic-continuous-id',identifiers:[{type:'TICKER',value:'OLD',from:'2025-01-01',to:'2026-08-03'},{type:'TICKER',value:'NEW',from:'2026-08-03',to:null}]}];
  expect(identityForAlias(ids,'OLD','2026-08-02')).toBe(identityForAlias(ids,'NEW','2026-08-03'));
 });
 it('duplicate ISIN aliases cannot form separate identities',()=>expect(()=>validateIdentities([identities[0],{...identities[0],securityId:'synthetic-other-id'}])).toThrow('DUPLICATE_ISIN_IDENTITY'));
 it('membership intervals are half open',()=>{const r={...row(),effectiveTo:'2026-09-01'};expect(activeMembership([r],'2026-08-03')).toHaveLength(1);expect(activeMembership([r],'2026-09-01')).toHaveLength(0);});
 it('removed members are inactive after end',()=>expect(activeMembership([{...row(),effectiveTo:'2026-09-01'}],'2026-10-10')).toEqual([]));
 it('new members are inactive before start',()=>expect(activeMembership([row()],'2026-08-02')).toEqual([]));
 it('missing sector blocks DI3',()=>expect(gates()[2]).toMatchObject({status:'BLOCKED',measurement:{approvedSectorCount:0}}));
 it('name inference is prohibited even for a name containing Bank',()=>expect(()=>validateSector({...sector,issuerName:'Test Bank',sector:'BANK',method:'ISSUER_NAME'},SECTORS)).toThrow('NAME_OR_STATEMENT_INFERENCE_PROHIBITED'));
 it('financial statement inference is prohibited',()=>expect(()=>validateSector({...sector,method:'STATEMENT_LAYOUT'},SECTORS)).toThrow());
 it('new taxonomy is rejected',()=>expect(()=>validateSector({...sector,sector:'FINANCIALS'},SECTORS)).toThrow('UNSUPPORTED_TAXONOMY'));
 it('missing official member leaves denominator 29 and DI2 blocked',()=>expect(gates({rows:rows.slice(1)})[1]).toMatchObject({status:'BLOCKED',measurement:{activeCount:29,expectedCount:30}}));
 it('supplemental historical ticker stays outside official active set',()=>{expect(reconcileUniverse(rows.map(r=>r.ticker),[...rows.map(r=>r.ticker),'OLD']).researchNotOfficial).toEqual(['OLD']);expect(activeMembership(rows,'2026-10-10').map(r=>r.ticker)).not.toContain('OLD');});
 it('membership evidence changes package hash',()=>expect(sealCandidate('MEMBERSHIP',{rows}).packageHash).not.toBe(sealCandidate('MEMBERSHIP',{rows:[{...row(),evidenceHash:'b'.repeat(64)},...rows.slice(1)]}).packageHash));
 it('sector evidence changes package hash',()=>expect(candidateHash({...sector,evidenceHash:'a'.repeat(64)})).not.toBe(candidateHash({...sector,evidenceHash:'b'.repeat(64)})));
 it('package cannot self approve',()=>expect(()=>sealCandidate('MEMBERSHIP',{approvalStatus:'APPROVED'})).toThrow('NO_SELF_APPROVAL'));
 it('package cannot fabricate approval reference',()=>expect(()=>sealCandidate('MEMBERSHIP',{approvalReference:'fake-owner-approval'})).toThrow('NO_SELF_APPROVAL'));
 it('all DI gates remain blocked despite declared complete approved sectors',()=>{
  const sectors=rows.map(r=>({...sector,securityId:r.securityId,sector:'BANK',approvalStatus:'APPROVED'}));
  expect(gates({sectors}).map(g=>g.status)).toEqual(['BLOCKED','BLOCKED','BLOCKED']);
 });
 it('outdated or future sector declaration never counts at as-of',()=>{const sectors=rows.map(r=>({...sector,securityId:r.securityId,sector:'BANK',approvalStatus:'APPROVED',effectiveFrom:'2026-11-01'}));expect(gates({sectors})[2].measurement.approvedSectorCount).toBe(0);});
 it('does not evaluate or promote DI4+',()=>expect(gates().map(g=>g.id)).toEqual(['DI1','DI2','DI3']));
 it('preparation CLI has no downstream or database execution capability',()=>{
  const source=readFileSync(new URL('../../scripts/prepare-di123-candidates.mjs',import.meta.url),'utf8');
  const imports=source.match(/(?:from|import\()\s*['"][^'"]+['"]/g).join('\n');
  expect(imports).not.toMatch(/prisma|repositories|scoring\/engine|decision|dca|child_process|http|fetch/i);
  expect(source).toContain('productionWrites:0,downstreamExecuted:false');expect(source).toContain("di4Through15:'RETAIN_EXISTING_BLOCKED_NOT_EXECUTED_NO_EVALUATION'");
 });
 it('package sealing keeps reserved controls immutable',()=>{const p=sealCandidate('MEMBERSHIP',{kind:'OTHER',productionAdmissionPermitted:true});expect(p.kind).toBe('MEMBERSHIP');expect(p.productionAdmissionPermitted).toBe(false);const {packageHash,...payload}=p;expect(candidateHash(payload)).toBe(packageHash);});
});

describe('frozen DI123 review artifacts',()=>{
 const packets=Object.fromEntries(['membership','identities','sectors'].map(k=>[k,JSON.parse(readFileSync(new URL(`../../docs/fundamental-data-engine/evidence/2026-10-10-di123-${k}.json`,import.meta.url),'utf8'))]));
 it('all exact package hashes verify without approval',()=>{for(const p of Object.values(packets)){const {packageHash,...payload}=p;expect(candidateHash(payload)).toBe(packageHash);expect(p.approvalStatus).toBe('REVIEW_REQUIRED');expect(p.productionAdmissionPermitted).toBe(false);expect(p.approvalReference).toBeNull();}});
 it('original main table has 30 and reserves remain excluded',()=>{const p=packets.membership;expect(p.members).toHaveLength(30);for(const r of p.reserves)expect(p.members.map(m=>m.ticker)).not.toContain(r.ticker);expect(p.reconciliation.DIFFERENCE).toEqual({officialAbsentFromResearch:[],researchNotOfficial:[],duplicates:[]});});
 it('identity and raw source sector coverage match exact UUIDs',()=>{const ids=packets.identities.identities;validateIdentities(ids);expect(ids).toHaveLength(30);for(const r of packets.membership.members){expect(ids.filter(i=>i.securityId===r.securityId&&i.ticker===r.ticker)).toHaveLength(1);expect(packets.sectors.assignments.filter(s=>s.securityId===r.securityId&&s.sector===null)).toHaveLength(1);}});
 it('official undated API discrepancy remains explicit',()=>expect(packets.membership.reconciliation.undatedOfficialApiDifference).toEqual({officialAbsentFromResearch:['DGC','PLX','TPB'],researchNotOfficial:['BSR','MCH','TCX'],duplicates:[]}));
});
