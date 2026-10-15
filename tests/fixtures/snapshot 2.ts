import { fundamentalFixture, release } from './fundamentals';
import { loadCanonicalRegistry } from '@/infrastructure/fundamentals/canonical-registry';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { assessAvailability } from '@/domain/fundamentals/availability';
import type { AvailabilityPolicy } from '@/domain/fundamentals/availability';
import type { SnapshotRequest } from '@/domain/fundamentals/snapshot';
export const snapshotRegistry=loadCanonicalRegistry({...release.manifest,recordedAt:'2026-01-01T00:00:00.000Z',effectiveDate:'2026-01-01'});
export function snapshotFixture(suffix='snapshot'){
 const f=fundamentalFixture(suffix),observation={...f.observation,registryHash:snapshotRegistry.registryHash};
 const policy:AvailabilityPolicy={version:'synthetic-operational-v1',algorithm:'operational-max-v1',governanceStatus:'PROPOSED',approvalReference:null,recordedAt:'2026-01-01T00:00:00.000Z',dateOnlyZones:['UTC','Asia/Ho_Chi_Minh']};
 const assessedAt='2026-07-27T00:00:00.000Z',assessment=assessAvailability({id:'assessment-'+suffix,observation,registry:snapshotRegistry,policy,assessedAt,hash:snapshotHash});
 const request:SnapshotRequest={runId:'run-'+suffix,scope:'SYNTHETIC_TEST',mode:'AS_KNOWN',decisionAsOf:'2026-07-27T00:00:00.000Z',systemKnownAt:'2026-07-27T00:00:00.000Z',marketCutoff:'2026-07-27T00:00:00.000Z',fundamentalCutoff:'2026-07-27T00:00:00.000Z',revisionCutoff:null,policy,requirementsVersion:'synthetic-requirements-v1',requirements:[{securityId:observation.securityId,itemId:observation.itemId,reportingScope:observation.reportingScope,periodStart:observation.periodStart,periodEnd:observation.periodEnd,maxAgeDays:180}],references:[{kind:'UNIVERSE',version:'synthetic-universe-v1',knownAt:policy.recordedAt,content:[observation.securityId]},{kind:'SECTOR',version:'synthetic-sector-v1',knownAt:policy.recordedAt,content:[observation.securityId+':'+observation.sector]},{kind:'MARKET',version:'synthetic-market-v1',knownAt:policy.recordedAt,content:['synthetic-market-no-real-prices']}],assessmentPins:[{observationId:observation.id,assessmentId:assessment.id}],derivedIds:[],builtAt:'2026-07-28T00:00:00.000Z',softwareBuild:'synthetic-build',operatorReference:'synthetic-operator',validationRunReference:'synthetic-validation',reviewContext:'synthetic-review'};
 return {...f,observation,assessment,policy,request,inputs:{registry:snapshotRegistry,observations:[observation],assessments:[assessment],derived:[]},registry:snapshotRegistry};
}

export function snapshotDerivationFixture(){
 const f=snapshotFixture(),observations=['CFO','CAPEX'].map((itemId,index)=>{
  const item=f.registry.manifest.items.find(i=>i.itemId===itemId)!;
  return {...f.observation,id:'snapshot-'+itemId,rawCaptureId:'capture-snapshot-'+itemId,itemId,statementType:item.statementType,measurementSemantic:item.measurementSemantic,normalized:{...f.observation.normalized,value:index===0?'100':'30'},raw:{...f.observation.raw,fieldId:itemId,lexicalValue:index===0?'100':'30',unit:'CURRENCY',multiplier:'1'}};
 });
 return {...f,observations,request:{...f.request,requirements:observations.map(o=>({...f.request.requirements[0],itemId:o.itemId})),assessmentPins:observations.map(o=>({observationId:o.id,assessmentId:'assessment-'+o.id})),derivedIds:['snapshot-derived-fcf']}};
}
