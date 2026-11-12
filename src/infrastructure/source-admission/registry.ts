import {readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {snapshotHash} from '@/infrastructure/fundamentals/snapshot-hash';
import {instant} from '@/shared/time';
import {UNIFIED_SOURCE_POLICY} from '@/domain/fundamentals/standing-source-policy';
export interface SourcePin {path:string;sha256:string}
export const sha=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
export function sourceBytes(root:string,p:SourcePin){const base=realpathSync(root),path=realpathSync(resolve(base,p.path));if(!path.startsWith(base+sep))throw Error('SOURCE_PATH_ESCAPE');const bytes=readFileSync(path);if(bytes.length>64_000_000||sha(bytes)!==p.sha256)throw Error('SOURCE_HASH_MISMATCH:'+p.path);return bytes;}
export interface SourceMaterial {version:string;identities:SourcePin;policy:SourcePin;authorization:SourcePin;code:readonly SourcePin[];sourceBindings:readonly SourcePin[]}
/** Host-configured references. Input data cannot register itself as authorized/verified. */
export interface SourceAdmissionTrust {activeAuthorization():SourcePin|null;independentAcceptance(hash:string):SourcePin|null}
export function assertSourceMaterial(root:string,m:SourceMaterial,trust:SourceAdmissionTrust,knownAt:string){
 instant(knownAt);const current=trust.activeAuthorization();if(!current||snapshotHash(current)!==snapshotHash(m.authorization))throw Error('SOURCE_AUTHORIZATION_MISSING_OR_SUPERSEDED');
 for(const p of [m.identities,m.policy,m.authorization,...m.code,...m.sourceBindings])sourceBytes(root,p);
 const policy=JSON.parse(sourceBytes(root,m.policy).toString());if(snapshotHash(policy)!==snapshotHash(UNIFIED_SOURCE_POLICY)||m.version!==UNIFIED_SOURCE_POLICY.version)throw Error('UNKNOWN_SOURCE_POLICY');
 const a=JSON.parse(sourceBytes(root,m.authorization).toString());instant(a.recordedAt);
 const request=sourceBytes(root,a.source as SourcePin).toString();
 if(a.standingPolicyVersion!==UNIFIED_SOURCE_POLICY.version||!a.currentFinancialPrincipleAuthorized||!a.marketPrincipleAuthorized||a.productionActivationGranted!==false||a.recordedAt>knownAt||!request.includes('Standing Financial Source Approval and Automated Financial Evidence Admission for Current Valuation.'))throw Error('EXPLICIT_POLICY_AUTHORIZATION_REQUIRED');
 const hash=snapshotHash(m),pin=trust.independentAcceptance(hash);if(!pin)throw Error('INDEPENDENT_SOURCE_MATERIAL_ACCEPTANCE_REQUIRED');
 const r=JSON.parse(sourceBytes(root,pin).toString());instant(r.knownAt);
 if(r.materialHash!==hash||r.decision!=='ACCEPTED'||r.superseded!==false||typeof r.reviewer!=='string'||!r.reviewer.trim()||r.knownAt>knownAt)throw Error('INVALID_INDEPENDENT_ACCEPTANCE');
 return {materialHash:hash,acceptance:pin};
}
