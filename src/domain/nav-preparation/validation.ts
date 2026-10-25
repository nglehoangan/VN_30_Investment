import {instant,dateOnly} from '@/shared/time';
import {decimal} from '@/domain/portfolio/values';
import {canonicalJson} from '@/domain/fundamentals/snapshot';
import {deepFreeze} from '@/domain/portfolio/transaction';
import type {Digest,EvidenceRef} from './contracts';
export class NavContractError extends Error { constructor(readonly reason:string){super('NAV_PREPARATION:'+reason);} }
export function requireNav(ok:unknown,reason:string):asserts ok {if(!ok)throw new NavContractError(reason);}
export function fields(value:unknown,keys:string):asserts value is Record<string,unknown> {
 requireNav(value!==null&&typeof value==='object'&&!Array.isArray(value)&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null),'OBJECT_REQUIRED');
 requireNav(Object.keys(value).sort().join(' ')===[...keys.split(' ')].sort().join(' '),'STRICT_FIELDS');
}
export function text(value:unknown):asserts value is string {requireNav(typeof value==='string'&&value.length>0&&value.length<=512&&value.trim()===value,'EXACT_TEXT_REQUIRED');}
export function hash(value:unknown):asserts value is string {requireNav(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value),'INVALID_HASH');}
export function time(value:unknown):asserts value is string {requireNav(typeof value==='string','INVALID_INSTANT');try{instant(value);}catch{throw new NavContractError('INVALID_INSTANT');}}
export function day(value:unknown):asserts value is string {requireNav(typeof value==='string','INVALID_DATE');try{dateOnly(value);}catch{throw new NavContractError('INVALID_DATE');}}
export function uuid(value:unknown):asserts value is string {requireNav(typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value),'MARKET_UUID_REQUIRED');}
export function list(value:unknown,allowEmpty=false):asserts value is unknown[] {requireNav(Array.isArray(value)&&value.length<=1000&&(allowEmpty||value.length>0),'BOUNDED_ARRAY_REQUIRED');}
export function evidence(value:unknown):asserts value is EvidenceRef {fields(value,'reference sha256 pointer knownAt');text(value.reference);hash(value.sha256);text(value.pointer);requireNav(value.pointer.startsWith('/'),'EVIDENCE_POINTER_REQUIRED');time(value.knownAt);}
export function dimension(venue:unknown,securityClass:unknown){requireNav(['HOSE','HNX','UPCOM'].includes(venue as string),'INVALID_VENUE');requireNav(['COMMON_SHARE','PREFERRED_SHARE','FUND_UNIT'].includes(securityClass as string),'INVALID_SECURITY_CLASS');}
export function exactQuantity(value:unknown){try{const n=decimal(value as string);requireNav(n.positive&&n.integer,'POSITIVE_WHOLE_QUANTITY_REQUIRED');}catch(e){if(e instanceof NavContractError)throw e;throw new NavContractError('INVALID_QUANTITY_DECIMAL');}}
export function exactPrice(value:unknown){try{requireNav(decimal(value as string).positive,'POSITIVE_PRICE_REQUIRED');}catch(e){if(e instanceof NavContractError)throw e;throw new NavContractError('INVALID_PRICE_DECIMAL');}}
export function known(e:EvidenceRef,cutoff:string){requireNav(e.knownAt<=cutoff,'FUTURE_EVIDENCE');}
export function contentHash(value:unknown,digest:Digest){const result=digest(canonicalJson(value));hash(result);return result;}
export function immutable<T>(value:T):T{return deepFreeze(JSON.parse(canonicalJson(value))) as T;}
export {canonicalJson};
