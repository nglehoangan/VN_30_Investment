/** Separate process, read-only persisted candidate replay; no approval or score execution. */
import './lib/ts-runtime.mjs';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {canonicalJson,buildFundamentalSnapshot}=await import('../src/domain/fundamentals/snapshot.ts');
const {snapshotHash:hash}=await import('../src/infrastructure/fundamentals/snapshot-hash.ts');
const {RepositoryRawDocuments}=await import('../src/infrastructure/fundamentals/raw-document.ts');
const {requireQualifiedDocument}=await import('../src/domain/fundamentals/document-qualification.ts');
const {normalizeStatement}=await import('../src/domain/fundamentals/normalization.ts');
const P='data/initialization-08b-final-review-candidate/',sha=b=>createHash('sha256').update(b).digest('hex');
const seal=JSON.parse(readFileSync(P+'seal.json','utf8')),candidate=JSON.parse(readFileSync(P+'review-candidate.json','utf8'));
const {packageHash,...content}=seal;if(hash(content)!==packageHash)throw Error('PACKAGE_HASH');
for(const f of seal.files)if(sha(readFileSync(P+f.file))!==f.sha256)throw Error('ARTIFACT_HASH:'+f.file);
if(sha(readFileSync(candidate.stagedDatabase.path))!==seal.stagedDatabaseHash)throw Error('STAGING_DB_CHANGED');
const stage=new DatabaseSync(candidate.stagedDatabase.path,{readOnly:true});stage.exec('PRAGMA query_only=ON');
const artifacts=stage.prepare('SELECT kind,id,body,hash FROM artifact ORDER BY kind,id').all();
for(const row of artifacts)if(hash(JSON.parse(row.body))!==row.hash||canonicalJson(JSON.parse(row.body))!==row.body)throw Error('STAGED_RECORD_HASH');
const list=kind=>artifacts.filter(r=>r.kind===kind).map(r=>JSON.parse(r.body)),one=kind=>list(kind)[0];
const snap=one('snapshot'),inputs={registry:{manifest:one('registry').manifest,registryHash:one('registry').registryHash},observations:list('observation'),assessments:list('availability'),derived:list('derived')};
const replay=buildFundamentalSnapshot(snap.request,inputs,hash);if(replay.manifest!==snap.manifest||replay.contentHash!==seal.snapshotContentHash||sha(replay.manifest)!==seal.manifestDigest)throw Error('PERSISTED_SNAPSHOT_REPLAY');
const origin=new DatabaseSync(candidate.originDatabase.path,{readOnly:true});origin.exec('PRAGMA query_only=ON');
const get=(table,id)=>{const r=origin.prepare(`SELECT body,body_hash FROM ${table} WHERE id=?`).get(id);if(!r||sha(r.body)!==r.body_hash)throw Error('ORIGIN_HASH');return JSON.parse(r.body);};
const sources=list('source'),imports=list('import'),captures=list('capture');
const rawReader=new RepositoryRawDocuments({findSource:async id=>sources.find(s=>s.id===id)??get('fundamental_source_version',id),findImport:async id=>imports.find(i=>i.id===id)??get('fundamental_import_batch',id),findCapture:async id=>captures.find(c=>c.id===id)??get('fundamental_raw_capture',id)});
let normalizationReplays=0;
for(const n of list('normalization')){
 const raw=await rawReader.reconstruct(n.captureIds),candidate=requireQualifiedDocument(raw,[n.qualification],n.qualification.intendedIssuer),prior=n.compared.map(p=>{const o=inputs.observations.find(o=>o.id===p.id);if(!o||hash(o)!==p.hash)throw Error('PRIOR_HASH');return o;});
 const actual=normalizeStatement({id:n.id,scope:n.scope,recordedAt:n.recordedAt,candidate,extract:n.extract,extractHash:n.extractHash,mapping:n.mapping,registry:n.registry,prior,hash});if(canonicalJson(actual)!==canonicalJson(n))throw Error('PERSISTED_NORMALIZATION_REPLAY');normalizationReplays++;
}
const quickCheck=stage.prepare('PRAGMA quick_check').all(),foreignKeyCheck=stage.prepare('PRAGMA foreign_key_check').all();
if(quickCheck.some(r=>Object.values(r)[0]!=='ok')||foreignKeyCheck.length)throw Error('SQLITE_INTEGRITY');
stage.close();origin.close();
console.log(JSON.stringify({status:'PASS',packageHash,snapshotRunId:snap.request.runId,contentHash:replay.contentHash,manifestDigest:sha(replay.manifest),artifactsVerified:artifacts.length,normalizationReplays,rawDocumentLineageReplayed:true,quickCheck,foreignKeyCheck,noScoringExecuted:true}));
