import {sourceBytes,type SourcePin} from './registry';
import {RETAINED_MAPPING_ADAPTER_VERSION} from './retained-mapping';
import type {VersionRegistry} from './versioned-authority';
import {instant} from '@/shared/time';
/** Composition supplies the registry pin; submitted observations cannot authorize an adapter.
 * Source approval and executable version scope are distinct. Never rehash/approve v4 here.
 */
export function verifyRetainedAdapterAuthority(root:string,registryPin:SourcePin,knownAt:string){
 instant(knownAt);
 const registry=JSON.parse(sourceBytes(root,registryPin).toString()) as VersionRegistry;
 if(registry.contract!=='standing-source-authority-per-version-v1')throw Error('UNKNOWN_AUTHORITY_REGISTRY');
 if(registry.recordedAt>knownAt)throw Error('AUTHORITY_NOT_YET_KNOWN');
 const authorities=registry.authorities.filter(a=>a.domain==='F2');
 if(authorities.length!==1)throw Error('UNKNOWN_OR_AMBIGUOUS_AUTHORITY');
 const a=authorities[0];
 if(a.status!=='APPROVED')throw Error('STANDING_AUTHORITY_REVOKED');
 // Verify current trusted record before explaining incompatible adapter scope.
 sourceBytes(root,registry.ownerDecision);
 sourceBytes(root,registry.legacyAuthorizations.F2);
 for(const pin of a.code)sourceBytes(root,pin);
 if(a.adapterVersion!==RETAINED_MAPPING_ADAPTER_VERSION||a.schemaVersion!=='retained-current-financial-admission-plan-v1')
  throw Error('RETAINED_ADAPTER_VERSION_NOT_REGISTERED:'+a.id+'@'+a.version+':'+a.adapterVersion);
 if(!a.code.some(p=>p.path==='src/infrastructure/source-admission/retained-mapping.ts')||!a.code.some(p=>p.path==='src/infrastructure/source-admission/retained-authority-gate.ts'))
  throw Error('RETAINED_ADAPTER_CODE_NOT_BOUND');
 if(a.normalizerVersion!=='financial-normalize-lexical-v1'||a.policyVersion!=='standing-financial-current-v1')throw Error('RETAINED_ADAPTER_POLICY_MISMATCH');
 return {id:a.id,version:a.version,registry:{...registryPin}};
}
