import {MONOTONIC_DECISION_METHODOLOGY as engine} from '@/domain/decision/approved-methodology';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {replayTcbsPipeline,hashBytes,type TcbsPipelineCandidate} from '@/infrastructure/market-boundary/tcbs-pipeline';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {Head} from '@/domain/dependencies/contracts';
import {reference,requireBoundary as check} from '@/domain/market-boundary/validation';
/** Bind the exact Owner-accepted review artifact, never a later technical candidate pointer. */
export function acceptedBootstrapBinding(root:string){
 const folder='docs/fundamental-data-engine/evidence/2026-10-20-di14-di15-final-acceptance/';
 const path=folder+'MARKET_SOURCE_REPLAY.json',bytes=readFileSync(resolve(root,path));
 const ledger=JSON.parse(readFileSync(resolve(root,folder+'ARTIFACT_HASHES.json'),'utf8')) as {overlayFiles:Record<string,string>};
 check(hashBytes(bytes)===ledger.overlayFiles[path],'ACCEPTED_BOOTSTRAP_REVIEW_HASH');
 return (JSON.parse(bytes.toString('utf8')) as {candidateBinding:{path:string;sha256:string}}).candidateBinding;
}
/** Fixed local accepted artifacts. No latest-version selection, HTTP input or mutable caller bindings. */
export function retainedDependencyBootstrap(root:string){
 const read=(p:string)=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
 const binding=acceptedBootstrapBinding(root),c=read(binding.path) as TcbsPipelineCandidate;check(hash(c)===binding.sha256,'BOOTSTRAP_HASH');replayTcbsPipeline(root,c);
 const level=read('docs/fundamental-data-engine/evidence/2026-10-19-level1-promotion-partition-closure/RELEASE.json'),active=read('src/infrastructure/fundamentals/active-level1-release.json'),i=c.initialization.body,at=c.input.builtAt;
 const authority='OWNER_ACCEPTED_DATA_INITIALIZATION_VNEXT; Production Analysis Dependency Head Closure request';
 const h=(type:Head['type'],id:string,digest:string,contract:string,content:unknown,scheme:Head['scheme']='JSON'):Head=>({type,pin:{id,hash:digest},contract,effectiveFrom:at,recordedAt:at,status:'ACCEPTED',sourceReference:binding.path,authorityReference:authority,scheme,content,requires:[]});
 const refs={security:c.profile.identities,sectors:c.sectors};
 const heads:Head[]=[h('UNIVERSE',i.universe.id,i.universe.hash,'certified-universe-reference',level.partition.universe),h('REFERENCE_DATA',i.securityMaster.id+'+'+i.sectorMaster.id,hash(refs),'reference-dependency-binding-v1',refs),h('INITIALIZATION',c.initialization.id,c.initialization.contentHash,c.initialization.contractVersion,c.initialization,'BOUNDARY'),h('FUNDAMENTALS',i.fundamentals.id,i.fundamentals.hash,'canonical-admission-set-v1',c.canonical),h('LEVEL1_RELEASE',active.id,active.bodyHash,level.version,level),h('MARKET_CAPABILITY',c.capability.id,c.capability.contentHash,c.capability.contractVersion,c.capability,'BOUNDARY'),h('SESSION_POLICY',c.policy.id,c.policy.hash,'hose-calendar-2026-v1',c.policy,'SESSION')];
 check(hash(level)===active.bodyHash,'BOOTSTRAP_LEVEL1_HASH');
 const db=new DatabaseSync(resolve(root,'data/vn30.sqlite'),{readOnly:true});let methodologies;
 try{const row=db.prepare('SELECT * FROM methodology_record WHERE methodology_id=?').get(engine.methodologyId) as Record<string,unknown>|undefined;
 const columns:Record<string,string>={methodologyId:'methodology_id',family:'family',semanticVersion:'semantic_version',approvalReference:'approval_reference',governanceStatus:'governance_status',intendedUse:'intended_use',effectiveDate:'effective_date',configurationReference:'configuration_reference',implementationIdentity:'implementation_identity',governingDocumentReference:'governing_document_reference',recordedAt:'recorded_at'};
 check(row&&Object.entries(engine).every(([key,value])=>row[columns[key]]===value),'APPROVED_DECISION_HEAD_METADATA_MISMATCH');
 heads.push({...h('DECISION_ENGINE',engine.methodologyId,hash(engine),engine.implementationIdentity,engine),sourceReference:'src/domain/decision/approved-methodology.ts; methodology_record',authorityReference:engine.approvalReference,effectiveFrom:engine.effectiveDate+'T00:00:00.000Z',recordedAt:engine.recordedAt});
 methodologies=db.prepare("SELECT methodology_id,family,semantic_version,approval_reference,configuration_reference,implementation_identity,governance_status,intended_use FROM methodology_record WHERE governance_status='APPROVED' AND intended_use='PRODUCTION' ORDER BY methodology_id").all();}finally{db.close();}
 return {heads,acceptedInitialization:reference(c.initialization),marketCapability:reference(c.capability),methodologyInventory:methodologies,missingAuthority:['POLICY','SCORING_MODEL','RISK_POLICY'],missingCompatibility:['DECISION_ENGINE ↔ accepted POLICY pin'],status:'BLOCKED_REQUIRES_AUTHORITY_RESOLUTION' as const,market:'REFRESH_REQUIRED_NOT_BOOTSTRAPPED_AS_PERMANENT_HEAD',readyForScoring:false,decisionReady:false};
}
