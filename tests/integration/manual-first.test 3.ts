import {describe,it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readManualCurrentSnapshot} from '@/infrastructure/fundamentals/manual-current';
import {buildManualCurrentSnapshot,type ManualStatement,type ManualFact} from '@/domain/fundamentals/manual-first';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {eligibleScoringFact} from '@/domain/fundamentals/scoring-bridge';
import type {FundamentalSnapshot} from '@/domain/fundamentals/snapshot';
import type {ScoringBridgeSources} from '@/domain/fundamentals/scoring-bridge';
const hash=(v:unknown)=>createHash('sha256').update(canonicalJson(v)).digest('hex');
async function setup(){
 const root=await mkdtemp(join(tmpdir(),'vn30-manual-fixture-'));await mkdir(join(root,'data/manual-current'),{recursive:true});await mkdir(join(root,'data/manual-fundamentals'),{recursive:true});
 const pdf='%PDF-synthetic-fixture',digest=createHash('sha256').update(pdf).digest('hex');await writeFile(join(root,'data/manual-fundamentals/test.pdf'),pdf);
 const at='2026-10-13T04:00:00.000Z';const s:ManualStatement={documentId:'test',SHA256:digest,verifiedHash:digest,ticker:'TEST',issuer:'SYNTHETIC',documentType:'FINANCIAL_STATEMENTS',reportingPeriod:{start:'2026-01-01',end:'2026-06-30'},fiscalYear:2026,fiscalQuarter:2,reportingScope:'CONSOLIDATED',currency:'VND',unitBasis:'CURRENCY',retainedPath:'data/manual-fundamentals/test.pdf',importedAt:at,reviewedAt:at,publishedAt:null,historicalAvailability:'UNKNOWN',reviewStatus:'QUALIFIED',reviewReference:'synthetic:review',cadence:'QUARTERLY',fiscalYearEndMonth:12};
 const f:ManualFact={id:'test-fact',ticker:'TEST',itemId:'NET_INCOME',value:'0',unit:'CURRENCY',currency:'VND',period:s.reportingPeriod,scope:s.reportingScope,sourceDocumentId:s.documentId,sourceHash:digest,evidenceLocator:'page:1',extractionMethod:'REVIEWED_TRANSCRIPTION',reviewStatus:'REVIEWED',reviewReference:'synthetic:cell-review',reviewedAt:at,quality:'VALID',revisionStatus:'ORIGINAL',supersedesFactId:null,revisionEvidence:null,classification:'REPORTED'};
 const snapshot=buildManualCurrentSnapshot({snapshotId:'synthetic-current',analysisAt:at,statements:[s],facts:[f],universe:[{ticker:'TEST',sector:'BANK'}],referenceStatus:'UNRESOLVED'},hash);
 const file=join(root,'data/manual-current/current-analysis.json');await writeFile(file,JSON.stringify(snapshot));
 return {root,file,snapshot};
}
describe('durable current manual snapshot integrity',()=>{
 it('reads and deterministically replays an exact retained source',async()=>{const t=await setup();try{expect(await readManualCurrentSnapshot(t.root)).toEqual(t.snapshot);}finally{await rm(t.root,{recursive:true,force:true});}});
 it('changed PDF bytes invalidate admission',async()=>{const t=await setup();try{await writeFile(join(t.root,'data/manual-fundamentals/test.pdf'),'%PDF-changed');await expect(readManualCurrentSnapshot(t.root)).rejects.toThrow();}finally{await rm(t.root,{recursive:true,force:true});}});
 it('tampered canonical value invalidates snapshot replay',async()=>{const t=await setup();try{const s=JSON.parse(await readFile(t.file,'utf8'));s.canonicalFacts[0].value='100';await writeFile(t.file,JSON.stringify(s));await expect(readManualCurrentSnapshot(t.root)).rejects.toThrow();}finally{await rm(t.root,{recursive:true,force:true});}});
 it('tampered readiness cannot self-authorize scoring',async()=>{const t=await setup();try{const s=JSON.parse(await readFile(t.file,'utf8'));s.readiness[0].readyForScoring=true;await writeFile(t.file,JSON.stringify(s));await expect(readManualCurrentSnapshot(t.root)).rejects.toThrow();}finally{await rm(t.root,{recursive:true,force:true});}});
 it('missing dataset is explicitly unavailable',async()=>{const root=await mkdtemp(join(tmpdir(),'vn30-manual-empty-'));try{expect(await readManualCurrentSnapshot(root)).toBeNull();}finally{await rm(root,{recursive:true,force:true});}});
 it('current snapshot cannot pass the historical scoring bridge',async()=>{const t=await setup();try{expect(()=>eligibleScoringFact(t.snapshot as unknown as FundamentalSnapshot,'TEST',{} as ScoringBridgeSources,'test-fact')).toThrow();}finally{await rm(t.root,{recursive:true,force:true});}});
});
