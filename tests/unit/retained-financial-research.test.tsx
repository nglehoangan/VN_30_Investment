// @vitest-environment node
import {afterEach,describe,expect,it} from 'vitest';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {readRetainedResearch,researchPeriodEnd,jsonPointer} from '@/infrastructure/fundamentals/retained-research';
import {RetainedResearchView} from '@/ui/retained-research';
import {renderToStaticMarkup} from 'react-dom/server';
const roots:string[]=[];
const digest=(v:string)=>createHash('sha256').update(v).digest('hex');
const NOW='2026-10-24T00:00:00.000Z';
async function fixture(change?:(v:any)=>void,quarantine=false){
 const root=await mkdtemp(join(tmpdir(),'vn30-research-'));roots.push(root);
 const pdfPath='data/manual-download/VNM/source.pdf',pdf='%PDF-1.7\nfixture-only',sourceHash=digest(pdf),extraction='data/manual-extracted-pdf/VNM.json';
 const s={provider:'MANUAL_PDF',payloadHash:sourceHash,rawPayloadHash:sourceHash,pdfPath,rawPayloadLocation:pdfPath};
 const make=(scope:string)=>({id:scope,year:2025,periodType:'ANNUAL',reportingScope:scope,source:{...s},groups:[{id:'g',label:'Assets',rows:[{id:'row',code:'100',label:'Cash',value:'9007199254740993.125',source:'PDF_REPORTED',productionAdmissible:false,pdfEvidence:{path:extraction,jsonPointer:'/reports/balance/periods/2025/variants/0/groups/0/rows/0',pdfPath,page:1}}]}]});
 const data:any={schemaVersion:'vn30-combine-v1',ticker:'VNM',policyVersion:'report-display-source-priority-v2',status:'UNREVIEWED_PRESENTATION',productionAdmissible:false,reports:{balance:{label:'Balance sheet',periods:{'2025':{variants:[make('CONSOLIDATED'),make('PARENT')]}}}}};
 data.reports.balance.periods['2025'].variants[1].groups[0].rows[0].pdfEvidence.jsonPointer='/reports/balance/periods/2025/variants/1/groups/0/rows/0';
 const extracted=JSON.stringify(data);change?.(data);const combined=JSON.stringify(data);
 async function put(path:string,value:unknown){await mkdir(dirname(join(root,path)),{recursive:true});await writeFile(join(root,path),typeof value==='string'?value:JSON.stringify(value));}
 await put(pdfPath,pdf);await put(extraction,extracted);
 await put('data/combine/VNM.json',combined);
 await put('data/combine/manifest.json',{schemaVersion:'vn30-combine-v1',productionAdmissible:false,files:[{ticker:'VNM',path:'data/combine/VNM.json',sha256:digest(combined),selections:{PDF_REPORTED:2}}]});
 await put('data/manual-extracted-pdf/display-manifest.json',{schemaVersion:'manual-display-v1',productionAdmissible:false,files:[{ticker:'VNM',file:'VNM.json',sha256:digest(extracted)}]});
 await put('data/manual-extracted-pdf/manifest.json',{schemaVersion:'manual-display-raw-v1',documents:[{sourceHash,pdfPath}]});
 await put('data/manual-download/manifest.json',{schemaVersion:'vn30-vietstock-download-v1',requests:[{ticker:'VNM',path:pdfPath,sha256:sourceHash,status:'DOWNLOADED',retrievedAt:'2026-10-19T00:00:00.000Z'}]});
 await put('data/manual-extracted-api/requests.json',[]);
 await put('data/manual-extracted-api/manifest.json',{schemaVersion:'cafef-display-v1',files:[],failures:quarantine?[{ticker:'VNM',endpoint:'bad',mode:'NAM',rawPayloadLocation:pdfPath,error:'Schema quarantined'}]:[]});
 return {root,put,pdfPath};
}
const selected=(v:any)=>v.reports.balance.periods['2025'].variants[0];
afterEach(async()=>{await Promise.all(roots.splice(0).map(r=>rm(r,{recursive:true,force:true})));});
describe('current-layout read-only research contract',()=>{
 it('discovers exact current layout, retains precision, lineage and independent scopes',async()=>{
  const {root}=await fixture();const a=await readRetainedResearch(root,'VNM','0',undefined,NOW),b=await readRetainedResearch(root,'VNM','1',undefined,NOW);
  expect(a.rows[0].value).toBe('9007199254740993.125');expect(a.rows[0].reportingScope).toBe('CONSOLIDATED');expect(b.rows[0].reportingScope).toBe('PARENT');
  expect(a.selected?.publicationAt).toBeNull();expect(a.selected?.periodEnd).toBe('2025-12-31');expect(a.selected?.retrievedAt).toBe('2026-10-19T00:00:00.000Z');
  expect(a.rows[0].evidencePointer).toContain('/variants/0/');expect(a.rows[0].pdfPath).toContain('manual-download');
  expect(a.productionAdmissible).toBe(false);expect(a.scoringAuthorized).toBe(false);expect(a.historicalAsKnownSupported).toBe(false);expect(a).not.toHaveProperty('canonicalFacts');
  expect(await readRetainedResearch(root,'VNM','0',undefined,NOW)).toEqual(a);
 });
 it('provides catalog without reading a selected ticker',async()=>{const {root}=await fixture();const r=await readRetainedResearch(root);expect(r.catalog).toHaveLength(1);expect(r.rows).toEqual([]);});
 it.each(['schemaVersion','policyVersion','status'])('rejects unsupported %s',async key=>{const {root}=await fixture(v=>v[key]='unexpected');await expect(readRetainedResearch(root,'VNM')).rejects.toThrow();});
 it('rejects changed combined bytes',async()=>{const {root,put}=await fixture();await put('data/combine/VNM.json','{}');await expect(readRetainedResearch(root,'VNM')).rejects.toThrow('COMBINED_HASH_MISMATCH');});
 it.each(['../VNM','UNKNOWN'])('rejects unsupported ticker %s',async ticker=>{const {root}=await fixture();await expect(readRetainedResearch(root,ticker)).rejects.toThrow();});
 it.each(['-1','1.5','9999','NaN'])('rejects invalid variant %s',async v=>{const {root}=await fixture();await expect(readRetainedResearch(root,'VNM',v)).rejects.toThrow();});
 it('retains missing values without zero filling',async()=>{const {root}=await fixture(v=>{const r=selected(v).groups[0].rows[0];r.value=null;r.source='MISSING';});expect((await readRetainedResearch(root,'VNM','0')).rows[0].value).toBeNull();});
 it.each(['1e9','NaN','01'])('withholds malformed numeric text %s',async value=>{const {root}=await fixture(v=>selected(v).groups[0].rows[0].value=value);expect((await readRetainedResearch(root,'VNM','0')).rows[0]).toMatchObject({value:null,status:'WITHHELD'});});
 it('rejects binary floating-point financial values',async()=>{const {root}=await fixture(v=>selected(v).groups[0].rows[0].value=123);await expect(readRetainedResearch(root,'VNM')).rejects.toThrow();});
 it('propagates quarantine and withholds its values',async()=>{const {root}=await fixture(undefined,true);const r=await readRetainedResearch(root,'VNM','0');expect(r.quarantines).toHaveLength(1);expect(r.rows[0].reasons).toContain('QUARANTINED_API_CAPTURE');expect(r.rows[0].value).toBeNull();});
 it('withholds future reporting periods',async()=>{const {root}=await fixture(v=>selected(v).year=2027);expect((await readRetainedResearch(root,'VNM','0',undefined,NOW)).rows[0].reasons).toContain('FUTURE_REPORT_PERIOD');});
 it('withholds future captures instead of backdating knowledge',async()=>{const {root}=await fixture();const r=await readRetainedResearch(root,'VNM','0',undefined,'2026-10-18T00:00:00.000Z');expect(r.rows[0].value).toBeNull();expect(r.rows[0].reasons).toContain('FUTURE_CAPTURE');});
 it('does not infer scope from a file name or merge parent statements',async()=>{const {root}=await fixture(v=>selected(v).reportingScope=null);expect((await readRetainedResearch(root,'VNM','0')).selected?.reportingScope).toBe('UNKNOWN');});
 it('withholds caption misbinding even when amounts are equal',async()=>{const {root}=await fixture(v=>selected(v).groups[0].rows[0].label='Different financial concept');expect((await readRetainedResearch(root,'VNM','0')).rows[0]).toMatchObject({value:null,status:'WITHHELD'});});
 it('withholds missing source, changed PDF and pointer/value mismatches',async()=>{const f=await fixture(v=>selected(v).groups[0].rows[0].value='1');expect((await readRetainedResearch(f.root,'VNM','0')).rows[0].reasons).toContain('ROW_LINEAGE_INVALID');await f.put(f.pdfPath,'%PDF-changed');expect((await readRetainedResearch(f.root,'VNM','0')).rows[0].reasons).toContain('SOURCE_LINEAGE_INVALID');});
 it('renders explicit boundaries, missing warnings, provenance and variant selector',async()=>{const {root}=await fixture();const r=await readRetainedResearch(root,'VNM','0');const html=renderToStaticMarkup(<RetainedResearchView research={r}/>);for(const s of ['RETAINED_RESEARCH_DATA','BLOCKED','Publication time','source.pdf','CONSOLIDATED','PARENT','9007199254740993.125','Unknown'])expect(html).toContain(s);});
 it('keeps unknown periods unknown and rejects unsafe pointers',()=>{expect(researchPeriodEnd({periodType:'UNKNOWN',year:2025})).toBeNull();expect(()=>jsonPointer({},'/__proto__/polluted')).toThrow();});
});
