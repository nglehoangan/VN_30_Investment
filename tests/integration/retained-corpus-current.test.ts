// @vitest-environment node
import {it,expect} from 'vitest';
import {readFileSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {readRetainedResearch} from '@/infrastructure/fundamentals/retained-research';
interface Pin {ticker:string;path?:string;file?:string;sha256:string}
const root=realpathSync(process.cwd());
const read=(path:string)=>JSON.parse(readFileSync(path,'utf8'));
function hash(path:string){const actual=realpathSync(resolve(path));expect(actual.startsWith(root+sep)).toBe(true);return createHash('sha256').update(readFileSync(actual)).digest('hex');}
const layouts=[['data/combine/manifest.json','vn30-combine-v1',''],['data/manual-extracted-pdf/display-manifest.json','manual-display-v1','data/manual-extracted-pdf/'],['data/manual-extracted-api/manifest.json','cafef-display-v1','']] as const;
it.each(layouts)('current retained manifest %s preserves every ticker JSON hash',(path,version,prefix)=>{
 const m=read(path);expect(m.schemaVersion).toBe(version);expect(m.files).toHaveLength(30);expect(new Set(m.files.map((p:Pin)=>p.ticker)).size).toBe(30);
 for(const p of m.files as Pin[])expect(hash(p.path??prefix+p.file),p.ticker).toBe(p.sha256);
});
it('current original PDF and API raw inventories retain their exact bytes, failed captures remain explicit',()=>{
 const pdf=read('data/manual-download/manifest.json');expect(pdf.schemaVersion).toBe('vn30-vietstock-download-v1');expect(pdf.complete).toBe(true);
 for(const r of pdf.requests as {status:string;path?:string;sha256?:string}[]){expect(typeof r.status).toBe('string');if(r.status==='DOWNLOADED'){expect(r.path).toBeTruthy();expect(hash(r.path!)).toBe(r.sha256);}}
 const requests=read('data/manual-extracted-api/requests.json') as {httpStatus:number;rawPayloadLocation:string|null;payloadHash:string|null}[];expect(requests.length).toBeGreaterThan(0);
 for(const r of requests)if(r.rawPayloadLocation){expect(hash(r.rawPayloadLocation)).toBe(r.payloadHash);}else expect(r.httpStatus===200&&r.payloadHash!==null).toBe(false);
},30000);
const combined=read('data/combine/manifest.json') as {files:Pin[]};
it.each(combined.files.map(f=>f.ticker))('current reader validates retained lineage for %s without archival paths',async ticker=>{
 const r=await readRetainedResearch(root,ticker,'0',undefined,new Date().toISOString());
 expect(r.productionAdmissible).toBe(false);expect(r.scoringAuthorized).toBe(false);expect(r.historicalAsKnownSupported).toBe(false);
 expect(r.selected).toBeDefined();expect(r.rows.length).toBeGreaterThan(0);
});
