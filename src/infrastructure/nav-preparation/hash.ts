/** Pure in-memory SHA-256 facade; no files, network, database, approval provider or runtime wiring. */
import {createHash} from 'node:crypto';
import {canonicalJson,requireNav} from '@/domain/nav-preparation/validation';
import {prepareBridge,readBridge,resolveBridge} from '@/domain/nav-preparation/identity';
import {prepareNavEnvelope,readNavEnvelope,assessNavPreparation} from '@/domain/nav-preparation/purpose';
import type {IdentityRequest} from '@/domain/nav-preparation/contracts';
export const sha256Text=(text:string)=>createHash('sha256').update(text,'utf8').digest('hex');
export const canonicalPreparationJson=canonicalJson;
export const createOfflineBridge=(raw:unknown)=>prepareBridge(raw,sha256Text);
export const readOfflineBridge=(raw:unknown)=>readBridge(raw,sha256Text);
export const resolveOfflineBridge=(raw:unknown,request:IdentityRequest)=>resolveBridge(raw,request,sha256Text);
export const createOfflineNavEnvelope=(raw:unknown)=>prepareNavEnvelope(raw,sha256Text);
export const readOfflineNavEnvelope=(raw:unknown)=>readNavEnvelope(raw,sha256Text);
export const assessOfflineNav=(bridge:unknown,envelope:unknown,request:unknown)=>assessNavPreparation(bridge,envelope,request,sha256Text);
/** Verify caller-supplied isolated retained/synthetic bytes in memory. Never fetch source references. */
export function verifyOfflineSourceBytes(bytes:Uint8Array,expectedHash:string){requireNav(/^[a-f0-9]{64}$/.test(expectedHash),'INVALID_HASH');requireNav(createHash('sha256').update(bytes).digest('hex')===expectedHash,'SOURCE_BYTES_HASH_MISMATCH');return Object.freeze({hashVerified:true as const,sourceAuthorityVerified:false as const});}
