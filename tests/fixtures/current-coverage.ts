import {readFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {currentFinancialRouteFixture} from './current-financial-route';
import {CurrentFinancialCoverage,COVERAGE_CODE} from '@/infrastructure/source-admission/current-coverage';
export async function currentCoverageFixture(){
 const f=await currentFinancialRouteFixture(),out='docs/fundamental-data-engine/vnm-f2-coverage-closure/2026-11-16';
 const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
 const authorization=read(out+'/IMPLEMENTATION_AUTHORIZATION.json'),catalog=read(out+'/RESEARCH_ADOPTION_CATALOG.json'),review=read(out+'/DEBT_SOURCE_REVIEW.json');
 const files=new Set<string>([...COVERAGE_CODE,out+'/IMPLEMENTATION_AUTHORIZATION.json',authorization.source.path,out+'/DEBT_SOURCE_REVIEW.json',out+'/RETAINED_ADMITTED_HISTORY.json',out+'/RESEARCH_ADOPTION_CATALOG.json',review.raw.path,review.reviewedPages.path]);
 for(const pin of Object.values(catalog.files) as {path:string}[])files.add(pin.path);
 for(const p of files){mkdirSync(dirname(join(f.root,p)),{recursive:true});copyFileSync(p,join(f.root,p));}
 for(const sql of readFileSync('prisma/proposals/current-financial-enrichment-v1.sql','utf8').match(/CREATE TRIGGER[\s\S]*?END;|CREATE TABLE[\s\S]*?;/g)??[])await f.db.$executeRawUnsafe(sql);
 const entry=f.registryBody.authorities[0];entry.code=[...entry.code,...COVERAGE_CODE.filter(p=>!entry.code.some((q:{path:string})=>q.path===p)).map(f.pin)];
 const debtReview=f.pin(out+'/DEBT_SOURCE_REVIEW.json'),history=f.pin(out+'/RETAINED_ADMITTED_HISTORY.json'),research=f.pin(out+'/RESEARCH_ADOPTION_CATALOG.json');
 entry.currentEnrichment={adapterVersion:'current-research-and-reported-debt-v1',catalogs:[debtReview,history,research],implementationAuthorization:f.pin(out+'/IMPLEMENTATION_AUTHORIZATION.json')};f.setRegistry(f.registryBody);
 const composition={registry:()=>f.pin('synthetic-registry.json'),debtReview,history,research,clock:{now:()=>f.q.knownAt}};
 return {...f,composition,coverage:new CurrentFinancialCoverage(f.db,f.root,f.service,f.datasets,composition)};
}
