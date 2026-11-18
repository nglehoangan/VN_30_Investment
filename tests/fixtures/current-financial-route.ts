import {ensureCurrentSchema} from './current-schema';
/** Real retained VNM inputs; only the version registration is synthetic in these tests.
 * This fixture cannot establish real owner approval or production activation. */
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {testDatabase} from './step2-validation-database';
import {sha} from '@/infrastructure/source-admission/registry';
import {CurrentFinancialAdmissions,CURRENT_FINANCIAL_CODE,type CurrentFinancialComposition} from '@/infrastructure/source-admission/current-financial';
import {CurrentFinancialDatasets} from '@/infrastructure/source-admission/current-dataset';
import {RetainedFinancialAdmissionAdapter} from '@/infrastructure/source-admission/retained-mapping';
const BASE='docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16';
const MAPPING=BASE+'/MAPPING_CONTRACT_V3.json';
const REGISTRY='docs/fundamental-data-engine/standing-authority-version/2026-11-12/VERSIONED_SOURCE_REGISTRY.json';
export async function currentFinancialRouteFixture(){
 const dbFixture=await testDatabase();
 // Historical fixtures install the exact proposal; migrated databases verify and reuse its DDL.
 await ensureCurrentSchema(dbFixture.client,'prisma/proposals/current-financial-dataset-v1.sql');
 const root=mkdtempSync(join(tmpdir(),'current-route-synthetic-authority-'));
 const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const identityPin=read('docs/fundamental-data-engine/standing-authority-version/2026-11-12/REAL_FINANCIAL_REQUEST.json').material.identities;
 const versionAuthorizationPath=BASE+'/VERSION_IMPLEMENTATION_AUTHORIZATION.json';
 const actualRegistry=read(REGISTRY),metadata=read(BASE+'/DOCUMENT_BINDINGS_V2.json'),selection=read(BASE+'/SELECTED_MAPPING_IDS_V2.json');
 const files=new Set<string>([...CURRENT_FINANCIAL_CODE,versionAuthorizationPath,read(versionAuthorizationPath).source.path,identityPin.path,MAPPING,BASE+'/DOCUMENT_BINDINGS_V2.json',BASE+'/DATASET_REQUIREMENTS_V2.json',actualRegistry.ownerDecision.path,actualRegistry.legacyAuthorizations.F2.path,
 'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_Q3_INPUTS.json',
 'docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/Q3_SELECTED_PAGES.json']);
 files.add(read(actualRegistry.legacyAuthorizations.F2.path).source.path);
 files.add('data/manual-extracted-pdf/supplements/VNM-Q3-2026-current-core.json');
 for(const d of metadata.documents)for(const p of [d.raw,d.receipt,d.review,d.title])files.add(p.path);
 for(const p of read(BASE+'/DATASET_REQUIREMENTS_V2.json').policyReferences)files.add(p.path);
 for(const p of files){mkdirSync(dirname(join(root,p)),{recursive:true});copyFileSync(p,join(root,p));}
 const put=(path:string,body:unknown)=>{const data=typeof body==='string'?body:JSON.stringify(body);mkdirSync(dirname(join(root,path)),{recursive:true});writeFileSync(join(root,path),data);return {path,sha256:sha(data)};};
 const pin=(path:string)=>({path,sha256:sha(readFileSync(join(root,path)))});
 const registryBody={...actualRegistry,environment:'SYNTHETIC_TEST_ONLY_NOT_REAL_APPROVAL',authorities:[{...actualRegistry.authorities.find((a:{domain:string})=>a.domain==='F2'),id:'SYNTHETIC_TEST_ONLY_F2',version:'SYNTHETIC_TEST_ONLY_5',versionImplementationAuthorization:pin(versionAuthorizationPath),adapterVersion:'retained-reviewed-financial-admission-v1',schemaVersion:'retained-current-financial-admission-plan-v1',code:CURRENT_FINANCIAL_CODE.map(pin),retainedCatalogs:[pin(MAPPING),pin(BASE+'/DOCUMENT_BINDINGS_V2.json'),pin(identityPin.path)]}]};
 let registryPin=put('synthetic-registry.json',registryBody);
 const composition:CurrentFinancialComposition={registry:()=>registryPin,mapping:pin(MAPPING),documents:pin(BASE+'/DOCUMENT_BINDINGS_V2.json'),identities:pin(identityPin.path),clock:{now:()=> '2026-11-16T23:00:00.000Z'}};
 const service=new CurrentFinancialAdmissions(dbFixture.client,root,composition);
 const adapter=new RetainedFinancialAdmissionAdapter(process.cwd(),{path:MAPPING,sha256:sha(readFileSync(MAPPING))});
 const ids=new Set(selection.mappingIds);
 const q={ticker:'VNM',economicCutoff:'2026-10-30',knownAt:'2026-11-16T23:00:00.000Z',purpose:'CURRENT_FORMAL_VALUATION' as const,observations:adapter.retainedObservations().filter(o=>ids.has(o.mappingId))};
 const securityId=selection.securityId;
 const context={ticker:q.ticker,securityId,economicCutoff:q.economicCutoff,knownAt:q.knownAt,purpose:q.purpose};
 // Synthetic port values for dataset mechanics tests. Real F1/share loaders are exercised separately.
 const datasetComposition={requirements:pin(BASE+'/DATASET_REQUIREMENTS_V2.json'),market:async()=>({ticker:'VNM',securityId,date:'2026-10-30',value:'56900',unit:'VND_PER_SHARE' as const,field:'GiaDongCua' as const,lineage:{testOnly:true}}),shares:async()=>({ticker:'VNM',securityId,asOf:'2026-10-30',value:'2089955445',unit:'SHARES' as const,status:'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS' as const,lineage:{testOnly:true,formalAdmission:false}})};
 return {root,db:dbFixture.client,service,q,securityId,context,composition,datasetComposition,datasets:new CurrentFinancialDatasets(dbFixture.client,root,service,datasetComposition),registryBody,pin,put,
 setRegistry(body:unknown){registryPin=put('synthetic-registry.json',body);},
 async close(){await dbFixture.close();rmSync(root,{recursive:true,force:true});}};
}
