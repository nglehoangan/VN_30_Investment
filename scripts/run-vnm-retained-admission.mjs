import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'..');
const vr=createRequire(realpathSync(resolve(root,'node_modules/vitest/package.json'))),jr=createRequire(vr.resolve('vite/package.json'));
const {createJiti}=await import(pathToFileURL(jr.resolve('jiti')).href);
const jiti=createJiti(import.meta.url,{alias:{'@':resolve(root,'src'),'server-only':resolve(root,'node_modules/next/dist/compiled/server-only/empty.js')},fsCache:false,moduleCache:true});
const {RetainedFinancialAdmissionAdapter}=await jiti.import(resolve(root,'src/infrastructure/source-admission/retained-mapping.ts'));
const dir='docs/fundamental-data-engine/vnm-f2-mapping/2026-11-16';
const path=dir+'/MAPPING_CONTRACT.json';
// Trusted composition selects this exact retained catalog; request payloads cannot supply one.
const sha256='fb523afb1f2a046eb96330ca591f414bf177a370e31f41f24dc3d95c9213d1c6';
const adapter=new RetainedFinancialAdmissionAdapter(root,{path,sha256});
const result=adapter.plan({ticker:'VNM',economicCutoff:'2026-10-30',knownAt:'2026-11-16T23:59:59.000Z',purpose:'CURRENT_FORMAL_VALUATION',observations:adapter.retainedObservations()});
writeFileSync(resolve(root,dir,'ADMISSION_PLAN.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({accepted:result.accepted.length,quarantined:result.quarantine}));
