import { createHash } from 'node:crypto';
import { canonicalJson } from '@/domain/fundamentals/snapshot';
export function snapshotHash(value:unknown){return createHash('sha256').update(canonicalJson(value),'utf8').digest('hex');}
export function manifestDigest(bytes:string){return createHash('sha256').update(bytes,'utf8').digest('hex');}
