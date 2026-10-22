import {expect,it,vi} from 'vitest';
import {vietstockCollectionResource} from '@/infrastructure/fundamentals/vietstock-collection-policy';
import {IssuerDocumentCollector,issuerSource} from '@/infrastructure/fundamentals/issuer-documents';
const entry={ticker:'TEST',issuer:'SYNTHETIC ONLY',discoveryUrl:'https://finance.vietstock.vn/test/tai-tai-lieu.htm?doctype=1',sampleUrl:null};
const now=()=> '2026-10-22T00:00:00.000Z';
it('rejects issuer, exchange, deceptive suffix, alternate port and credential URLs',()=>{
 for(const url of ['https://vinhomes.vn/report.pdf','https://staticfile.hsx.vn/report.pdf','https://finance.vietstock.vn.evil.example/report.pdf','https://static2.vietstock.vn:8443/report.pdf','https://user@static2.vietstock.vn/report.pdf','http://static2.vietstock.vn/report.pdf'])expect(()=>vietstockCollectionResource(url)).toThrow('VIETSTOCK_ONLY_SOURCE_POLICY');
 expect(vietstockCollectionResource('https://static2.vietstock.vn/data/report.pdf')).toBe('https://static2.vietstock.vn/data/report.pdf');
});
it('rejects external configuration, samples and seeds before transport',()=>{
 expect(()=>issuerSource({...entry,discoveryUrl:'https://vinhomes.vn/reports'},now())).toThrow('VIETSTOCK_ONLY_SOURCE_POLICY');
 expect(()=>issuerSource({...entry,sampleUrl:'https://vinhomes.vn/report.pdf'},now())).toThrow('VIETSTOCK_ONLY_SOURCE_POLICY');
 const source=issuerSource(entry,now());
 expect(()=>new IssuerDocumentCollector(entry,source,undefined,['https://vinhomes.vn/report.pdf'])).toThrow('VIETSTOCK_ONLY_SOURCE_POLICY');
 expect(()=>new IssuerDocumentCollector({...entry,sampleUrl:'https://vinhomes.vn/report.pdf'},source)).toThrow('VIETSTOCK_ONLY_SOURCE_POLICY');
});
it('never requests external links or external PDF redirect destinations',async()=>{
 const pdf='https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/NAM/TEST_BCTC_2026.pdf';
 const request=vi.fn(async(url:string)=>url===entry.discoveryUrl?new Response('<a href="https://vinhomes.vn/BCTC_2026.pdf">2026</a><a href="'+pdf+'">2026</a>',{headers:{'content-type':'text/html'}}):new Response('',{status:302,headers:{location:'https://vinhomes.vn/BCTC_2026.pdf'}}));
 const result=await new IssuerDocumentCollector(entry,issuerSource(entry,now()),{request,now,sleep:async()=>{},ensurePublicHost:async()=>{}}).collect('vietstock-only-test');
 expect(request.mock.calls.map(c=>c[0])).toEqual([entry.discoveryUrl,pdf]);
 expect(result.batch.errors).toContain('VIETSTOCK_ONLY_SOURCE_POLICY:EXTERNAL_LINK_IGNORED');
 expect(result.batch.errors).toContain('NO_COMPLETE_PDF_DISCOVERED');
});
