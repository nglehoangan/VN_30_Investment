import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const out='docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16',read=p=>JSON.parse(readFileSync(p,'utf8')),pin=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const previous=out+'/VERSIONED_SOURCE_REGISTRY_V52.json',target=out+'/VERSIONED_SOURCE_REGISTRY_V53.json';
if(existsSync(target)){const r=read(target);for(const p of r.authorities.find(a=>a.domain==='F2').code)if(pin(p.path).sha256!==p.sha256)throw Error('IMMUTABLE_IMPLEMENTATION_CHANGED');console.log(JSON.stringify({registry:pin(target),duplicate:true}));process.exit(0);}
const r=read(previous);r.version='owner-standing-authority-v5.3-current-native-core';r.recordedAt=new Date().toISOString();r.predecessor=pin(previous);
const a=r.authorities.find(a=>a.domain==='F2');a.version='5.3';a.code=a.code.map(p=>pin(p.path));a.implementationRevisionReason='Final trusted operational-clock binding; requested knowledge retained separately, never used to backdate ingestion. Same explicit owner implementation/version instruction, source principles and financial definitions.';
writeFileSync(target,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({registry:pin(target),sourceApprovalsChanged:false}));
