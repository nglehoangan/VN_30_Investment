import {describe,it,expect} from 'vitest';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {RetainedFinancialAdmissionAdapter,type MappedObservation} from '@/infrastructure/source-admission/retained-mapping';
import {sha} from '@/infrastructure/source-admission/registry';
const root=process.cwd(),path='docs/fundamental-data-engine/vnm-f2-mapping/2026-11-16/MAPPING_CONTRACT.json';
const pin={path,sha256:sha(readFileSync(path))};
const adapter=()=>new RetainedFinancialAdmissionAdapter(root,pin);
const request=(observations:readonly MappedObservation[])=>({ticker:'VNM',economicCutoff:'2026-10-30',knownAt:'2026-11-16T23:59:59.000Z',purpose:'CURRENT_FORMAL_VALUATION' as const,observations});
describe('retained mapped financial admission',()=>{
 it('validates all retained real VNM mappings without TOTAL_ASSETS restriction',()=>{
  const a=adapter(),r=a.plan(request(a.retainedObservations()));
  expect(r.accepted).toHaveLength(294);expect(r.quarantine).toEqual([]);
  expect(new Set(r.accepted.map(x=>x.itemId)).size).toBeGreaterThan(50);
  expect(r.formalAdmission).toBe(false);expect(r.databaseWritten).toBe(false);
  expect(r.accepted.find(x=>x.sourceConcept==='NET_PROFIT_GROUP')?.itemId).toBe('NET_INCOME');
 });
 it('keeps annual revenue as a flow and includes Q3 consolidated revenue',()=>{
  const a=adapter(),r=a.plan(request(a.retainedObservations()));
  const rows=r.accepted.filter(x=>x.itemId==='REVENUE');
  expect(rows.every(x=>x.period.start<x.period.end)).toBe(true);
  expect(rows.some(x=>x.scope==='CONSOLIDATED'&&x.period.end==='2026-09-30')).toBe(true);
 });
 it('deterministically replays the complete plan and provenance',()=>{
  const a=adapter(),q=request(a.retainedObservations());expect(a.plan(q)).toEqual(a.plan(q));
 });
 it.each(['ticker','concept','scope','start','end','vintage','unit','sourceHash'] as const)('quarantines changed %s',key=>{
  const a=adapter(),o=a.retainedObservations()[0];o[key]='WRONG';
  const r=a.plan(request([o]));expect(r.accepted).toEqual([]);expect(r.quarantine).toHaveLength(1);
 });
 it('rejects altered caption and column witnesses',()=>{
  const a=adapter();for(const key of ['caption','column']){
   const o=a.retainedObservations()[0];o.witnesses[key]='WRONG';
   expect(a.plan(request([o])).quarantine).toHaveLength(1);
  }
 });
 it.each([null,'-','999999'])('quarantines missing or changed native value %s',value=>{
  const a=adapter(),o=a.retainedObservations()[0];o.value=value;
  expect(a.plan(request([o])).accepted).toEqual([]);
 });
 it('rejects duplicate observations without creating a second candidate',()=>{
  const a=adapter(),o=a.retainedObservations()[0],r=a.plan(request([o,o]));
  expect(r.accepted).toHaveLength(1);expect(r.quarantine[0].reason).toBe('DUPLICATE_OBSERVATION');
 });
 it('rejects unknown mapping and historical PIT',()=>{
  const a=adapter(),o=a.retainedObservations()[0];o.mappingId='fake';
  expect(a.plan(request([o])).quarantine[0].reason).toBe('UNKNOWN_MAPPING_ID');
  expect(()=>a.plan({...request([]),purpose:'HISTORICAL_PIT'})).toThrow('HISTORICAL_PIT_NOT_QUALIFIED');
 });
 it('enforces economic and operational knowledge cutoffs separately',()=>{
  const a=adapter(),all=a.retainedObservations();
  const o=all.find(x=>x.end==='2026-09-30')!;
  expect(a.plan({...request([o]),economicCutoff:'2026-06-30'}).quarantine[0].reason).toBe('POST_CUTOFF_OBSERVATION');
  const q3=all.find(x=>x.vintage==='Q3_2026_PRESENTATION'&&x.scope==='CONSOLIDATED')!;
  expect(a.plan({...request([q3]),knownAt:'2026-10-30T23:59:59.000Z'}).accepted).toEqual([]);
 });
 it('retains scope/vintage, evidence locators, original receipts and derived classification',()=>{
  const a=adapter(),r=a.plan(request(a.retainedObservations()));
  expect(new Set(r.accepted.map(x=>x.scope)).size).toBe(2);
  expect(r.accepted.some(x=>x.classification==='DERIVED')).toBe(true);
  const q3=r.accepted.find(x=>x.vintage==='Q3_2026_PRESENTATION'&&x.scope==='CONSOLIDATED')!;
  expect(q3.provenance.clocks.originalReceivedAt).toBe('2026-11-02T06:32:47.739019+00:00');
  expect(q3.provenance.retainedCell.pointer).toBeTruthy();expect(q3.consumption.historicalPitEligible).toBe(false);
 });
 it('rejects changed catalog and stock/flow schema defects',()=>{
  expect(()=>new RetainedFinancialAdmissionAdapter(root,{...pin,sha256:'0'.repeat(64)})).toThrow('SOURCE_HASH_CHANGED');
  const dir=mkdtempSync(resolve(tmpdir(),'retained-admission-'));
  try{
   const body=JSON.parse(readFileSync(path,'utf8'));body.bindings[0].concept='REVENUE';
   const bytes=JSON.stringify(body);writeFileSync(resolve(dir,'mapping.json'),bytes);
   expect(()=>new RetainedFinancialAdmissionAdapter(dir,{path:'mapping.json',sha256:sha(bytes)})).toThrow('STOCK_FLOW_PERIOD_MISMATCH');
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
 it('normalizes native VND with no scaling and preserves zero, sign and conflicts',()=>{
  const dir=mkdtempSync(resolve(tmpdir(),'retained-admission-'));
  try{
   const cells=[{value:'0',caption:'CFO',unit:'CURRENCY'}, {value:'-12',caption:'CFO',unit:'CURRENCY'}];
   writeFileSync(resolve(dir,'cells.json'),JSON.stringify(cells));
   const raw=sha(JSON.stringify(cells));
   const bindings=cells.map((_,i)=>({id:'ABC:'+i,ticker:'ABC',concept:'CFO',scope:'CONSOLIDATED',start:'2025-01-01',end:'2025-12-31',vintage:'ORIGINAL',unit:'VND',category:'CASH_FLOW',path:'cells.json',sha256:raw,pointer:'/'+i,checks:{caption:'CFO'}}));
   const bytes=JSON.stringify({contract:'retained-financial-mapping-v1',version:'test-v1',bindings});writeFileSync(resolve(dir,'mapping.json'),bytes);
   const a=new RetainedFinancialAdmissionAdapter(dir,{path:'mapping.json',sha256:sha(bytes)}),obs=a.retainedObservations();
   const q={...request(obs),ticker:'ABC'};
   expect(a.plan({...q,observations:[obs[0]]}).accepted[0].value).toBe('0');
   expect(a.plan({...q,observations:[obs[1]]}).accepted[0].value).toBe('-12');
   const r=a.plan(q);expect(r.accepted).toEqual([]);expect(r.quarantine).toHaveLength(2);
   writeFileSync(resolve(dir,'cells.json'),'[]');expect(a.plan(q).accepted).toEqual([]);
  }finally{rmSync(dir,{recursive:true,force:true});}
 });
});
