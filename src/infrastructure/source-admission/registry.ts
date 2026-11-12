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

export interface TrustedMaterialRegistration {
 readonly domain:'F1'|'F2';readonly materialHash:string;readonly reference:SourcePin;
 /** Identity established by trusted deployment composition, never read from a submitted witness. */
 readonly reviewer:string;readonly policyVersion:string;
}
export interface TrustedCaptureRegistration {readonly rawHash:string;readonly requestHash:string;readonly collectorHash:string;readonly reference:SourcePin}
export interface StandingRegistryBindings {
 readonly authorizations:{readonly F1:SourcePin|null;readonly F2:SourcePin|null};
 readonly materials:readonly TrustedMaterialRegistration[];
 readonly captures:readonly TrustedCaptureRegistration[];
}
/** Small trusted-host binding. An on-disk ACCEPTED/PASS JSON is insufficient unless its exact
 * receipt hash, reviewer, domain and policy were independently registered by the host. */
export class PinnedStandingRegistry implements SourceAdmissionTrust {
 private readonly bindings:StandingRegistryBindings;
 constructor(private readonly root:string,bindings:StandingRegistryBindings){this.bindings=structuredClone(bindings);}
 activeAuthorization(){const p=this.bindings.authorizations.F2;return p?{...p}:null;}
 private accepted(domain:'F1'|'F2',materialHash:string){
  const registrations=this.bindings.materials.filter(r=>r.domain===domain&&r.materialHash===materialHash);
  if(registrations.length!==1)return null;
  const registration=registrations[0],authorization=this.bindings.authorizations[domain];if(!authorization)return null;
  const expectedPolicy=domain==='F1'?UNIFIED_SOURCE_POLICY.market.policyVersion:UNIFIED_SOURCE_POLICY.financial.version;if(registration.policyVersion!==expectedPolicy)return null;
  try{
   const r=JSON.parse(sourceBytes(this.root,registration.reference).toString());instant(r.knownAt);
   sourceBytes(this.root,authorization);
   if(!registration.reviewer.trim()||r.contract!=='registered-independent-material-acceptance-v1'||r.domain!==domain||r.decision!=='ACCEPTED'||r.superseded!==false||r.materialHash!==materialHash||r.reviewer!==registration.reviewer||r.policyVersion!==registration.policyVersion||snapshotHash(r.authorization)!==snapshotHash(authorization))return null;
   return {knownAt:r.knownAt,reference:{...registration.reference}};
  }catch{return null;}
 }
 independentAcceptance(materialHash:string){return this.accepted('F2',materialHash)?.reference??null;}
 marketTrust(){return {
  currentAuthorization:()=>{const p=this.bindings.authorizations.F1;return p?{...p}:null;},
  independentMaterialAcceptance:(materialHash:string)=>{const r=this.accepted('F1',materialHash);return r?{materialHash,...r}:null;},
  capturedSource:(raw:SourcePin,requestHash:string)=>{
   const rows=this.bindings.captures.filter(r=>r.rawHash===raw.sha256&&r.requestHash===requestHash);if(rows.length!==1)return null;
   try{const c=rows[0],r=JSON.parse(sourceBytes(this.root,c.reference).toString());sourceBytes(this.root,raw);
    if(r.contract!=='registered-retained-capture-handoff-v1'||r.decision!=='ACCEPTED'||r.rawHash!==c.rawHash||r.requestHash!==c.requestHash||r.collectorHash!==c.collectorHash)return null;
    return {rawHash:c.rawHash,requestHash:c.requestHash,collectorHash:c.collectorHash,origin:'TRUSTED_CAPTURE_HANDOFF' as const};
   }catch{return null;}
  },
 };}
}
