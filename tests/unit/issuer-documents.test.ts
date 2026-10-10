import {it,expect,vi} from 'vitest';
import {IssuerDocumentCollector,issuerSource,issuerResource,discoverIssuerLinks,publicAddress,type IssuerCollectionDependencies} from '@/infrastructure/fundamentals/issuer-documents';
import {RepositoryRawDocuments,completeRawPdfGroups} from '@/infrastructure/fundamentals/raw-document';
const entry={ticker:'TEST',issuer:'SYNTHETIC TEST ONLY',discoveryUrl:'https://issuer.example/financial',sampleUrl:null},now=()=> '2026-10-10T01:00:00.000Z',source=issuerSource(entry,'2026-10-09T00:00:00.000Z');
const deps=(request:IssuerCollectionDependencies['request']):IssuerCollectionDependencies=>({request,now,sleep:async()=>{},ensurePublicHost:async()=>{}});
it('discovers nested financial report labels and preserves exact resources without admitting Q3/Q4 2026',()=>{
 const r=discoverIssuerLinks('<a href="/random.pdf"><span>Báo cáo tài chính hợp nhất 2025</span></a><a href="/BCTC_Q3_2026.pdf">2026</a><a href="/financial-reports">Financial reports</a><a href="/2025.pdf?token=private">BCTC 2025</a>',entry.discoveryUrl);expect(r.pdfs).toEqual(['https://issuer.example/random.pdf']);expect(r.pages).toEqual(['https://issuer.example/financial-reports']);
});
it('captures and losslessly reconstructs linked multi-chunk PDF bytes; collection never establishes qualification',async()=>{
 const body='%PDF-'+ 'x'.repeat(1_100_000),collector=new IssuerDocumentCollector(entry,source,deps(async url=>new Response(url.endsWith('.pdf')?body:'<a href="/BCTC_2025.pdf">BCTC 2025</a>',{headers:{'content-type':url.endsWith('.pdf')?'application/pdf':'text/html'}}))),r=await collector.collect('generic-test');
 expect(r.batch.completion).toBe('PARTIAL');expect(r.batch.errors).toContain('HISTORY_PUBLICATION_ISSUER_AND_PERIOD_QUALIFICATION_REQUIRED');const reader=new RepositoryRawDocuments({findCapture:async (id:string)=>r.captures.find(c=>c.id===id)??null,findImport:async()=>r.batch,findSource:async()=>r.source} as never),d=await reader.reconstruct(r.captures.slice(1).map(c=>c.id));expect(Buffer.from(d.bodyBase64,'base64').toString()).toBe(body);expect(r).not.toHaveProperty('observations');
});
it('redirects preserve each HTTP event and unsafe query destinations are not rewritten or requested',async()=>{
 const requested:string[]=[],collector=new IssuerDocumentCollector(entry,source,deps(async url=>{requested.push(url);return new Response('',{status:302,headers:{location:'https://issuer.example/financial?token=secret'}});})),r=await collector.collect('generic-redirect');expect(requested).toEqual([entry.discoveryUrl]);const e=JSON.parse(r.captures[0].payload);expect(e.httpStatus).toBe(302);expect(e.error).toBe('REDIRECT_REQUIRES_VALIDATION');expect(r.captures[0].responseStatus).toBe(599);expect(r.batch.errors).toContain('NO_COMPLETE_PDF_DISCOVERED');
});
it('rejects credentials/local resources/private addresses and records unsafe DNS without HTTP access',async()=>{
 for(const u of ['http://issuer.example/a','https://user:secret@issuer.example/a','https://127.0.0.1/a','https://[::1]/a','https://host.local/a','https://issuer.example/a#private'])expect(()=>issuerResource(u)).toThrow();for(const ip of ['127.0.0.1','10.1.1.1','192.168.1.1','169.254.169.254','172.16.0.1','100.64.1.1','::1','fd00::1','fe80::1'])expect(publicAddress(ip)).toBe(false);expect(publicAddress('8.8.8.8')).toBe(true);expect(publicAddress('2001:4860:4860::8888')).toBe(true);
 const request=vi.fn(),r=await new IssuerDocumentCollector(entry,source,{...deps(request),ensurePublicHost:async()=>{throw new Error('UNSAFE_DNS');}}).collect('generic-dns');expect(request).not.toHaveBeenCalled();expect(JSON.parse(r.captures[0].payload)).toMatchObject({httpStatus:null,error:'UNSAFE_DNS',bodyComplete:false});
});
it('HTML/captcha and document limits remain explicit partial states',async()=>{
 const r=await new IssuerDocumentCollector(entry,source,deps(async url=>new Response(url.endsWith('.pdf')?'captcha':'<a href="/BCTC_2025.pdf">2025</a><a href="/BCTC_2026.pdf">2026</a>',{headers:{'content-type':'text/html'}})),[],1).collect('generic-limits');expect(r.batch.errors).toContain('DOCUMENT_LIMIT_PARTIAL');expect(r.batch.errors.some(e=>e.includes('MEDIA_TYPE_MISMATCH'))).toBe(true);expect(r.batch.errors).toContain('NO_COMPLETE_PDF_DISCOVERED');
});
it('bounds transports that ignore AbortSignal and reports TIMEOUT without pretending a provider response',async()=>{
 vi.useFakeTimers();try{const pending=new IssuerDocumentCollector(entry,source,deps(async()=>new Promise<Response>(()=>{}))).collect('generic-timeout');await vi.advanceTimersByTimeAsync(45001);const r=await pending;expect(JSON.parse(r.captures[0].payload)).toMatchObject({httpStatus:null,error:'TIMEOUT'});}finally{vi.useRealTimers();}
});
it('v2 preserves approved public routing queries losslessly and rejects credential-bearing or unknown parameters',async()=>{
 const url='https://bidv.com.vn/wps/wcm/connect/abc/BCTC_2025.pdf?MOD=AJPERES&CACHEID=ROOTWORKSPACE-abc',e={...entry,discoveryUrl:'https://bidv.com.vn/financial'},s=issuerSource(e,'2026-10-09T00:00:00.000Z');
 expect(issuerResource(url)).toBe(url);for(const bad of [url+'&token=secret',url+'&MOD=AJPERES','https://other.example/report.pdf?download=true'])expect(()=>issuerResource(bad)).toThrow();
 const r=await new IssuerDocumentCollector(e,s,deps(async u=>new Response(u===url?'%PDF-public-query':'<a href="'+url.replace(/&/g,'&amp;')+'">BCTC 2025</a>',{headers:{'content-type':u===url?'application/pdf':'text/html'}}))).collect('public-query-test');
 const c=r.captures.at(-1)!;expect(c.resourceReference).toMatch(/^public-document-sha256:[a-f0-9]{64}$/);expect(JSON.parse(c.payload).url).toBe(url);const reader=new RepositoryRawDocuments({findCapture:async (id:string)=>r.captures.find(c=>c.id===id)??null,findImport:async()=>r.batch,findSource:async()=>r.source} as never),d=await reader.reconstruct([c.id]);expect(d.resourceReference).toBe(c.resourceReference);expect(Buffer.from(d.bodyBase64,'base64').toString()).toBe('%PDF-public-query');
});
it('discovers short-year bank names and dated table download endpoints without rewriting URLs',()=>{
 const links=discoverIssuerLinks('<a href="https://techcombank.com/content/dam/techcombank/public-site/documents/bctc-hop-nhat-2q26.pdf">Tải file</a><a href="https://techcombank.com/content/dam/techcombank/public-site/documents/bctc-hop-nhat-3q26.pdf">Tải file</a>',entry.discoveryUrl);expect(links.pdfs).toHaveLength(1);
 const url='https://bsr.com.vn/c/document_library/get_file?groupId=37629&uuid=55678d92-e626-0129-ef20-d3c41f57a474',r=discoverIssuerLinks('<tr><td>Báo cáo tài chính hợp nhất 2025</td><td><a href="'+url.replace(/&/g,'&amp;')+'">Tải</a></td></tr>','https://bsr.com.vn/bao-cao');expect(r.pdfs).toEqual([url]);
 const gas='https://www.pvgas.com.vn/DesktopModules/EasyDNNNews/DocumentDownload.ashx?portalid=0&moduleid=576&articleid=14585&documentid=3358';expect(issuerResource(gas)).toBe(gas);expect(()=>issuerResource(gas+'&token=private')).toThrow();
});
it('v2 retains octet-stream HTTP type and admits a reconstructed document only with PDF byte integrity',async()=>{
 for(const body of ['%PDF-binary-document','<html>captcha</html>']){const r=await new IssuerDocumentCollector(entry,source,deps(async url=>new Response(url.endsWith('.pdf')?body:'<a href="/BCTC_2025.pdf">BCTC 2025</a>',{headers:{'content-type':url.endsWith('.pdf')?'application/octet-stream':'text/html'}}))).collect('binary-test'),c=r.captures[1],e=JSON.parse(c.payload);expect(e.mediaType).toBe('application/octet-stream');if(body.startsWith('%PDF-')){const reader=new RepositoryRawDocuments({findCapture:async (id:string)=>r.captures.find(c=>c.id===id)??null,findImport:async()=>r.batch,findSource:async()=>r.source} as never);expect((await reader.reconstruct([c.id])).bodyHash).toBe(e.bodySha256);}else expect(e.error).toBe('PDF_SIGNATURE_MISMATCH');}
});

it('preserves repeated PDF responses separately when a child page and selected document share a URL and clock',async()=>{
 const e={...entry,sampleUrl:'https://issuer.example/financial-document'},r=await new IssuerDocumentCollector(e,issuerSource(e,'2026-10-09T00:00:00.000Z'),deps(async url=>new Response(url===e.discoveryUrl?'<a href="/financial-document">Financial reports</a>':'%PDF-repeated',{headers:{'content-type':url===e.discoveryUrl?'text/html':'application/pdf'}}))).collect('repeated-document');
 const groups=completeRawPdfGroups(r.captures);expect(groups).toHaveLength(2);expect(groups[0]).not.toEqual(groups[1]);const reader=new RepositoryRawDocuments({findCapture:async (id:string)=>r.captures.find(c=>c.id===id)??null,findImport:async()=>r.batch,findSource:async()=>r.source} as never),a=await reader.reconstruct(groups[0]),b=await reader.reconstruct(groups[1]);expect(a.bodyHash).toBe(b.bodyHash);expect(a.documentId).not.toBe(b.documentId);
});

it('preserves selected Vietstock public routing and identifies the mirror rather than the issuer as provider',()=>{
 const landing='https://finance.vietstock.vn/mch/tai-tai-lieu.htm?doctype=1',pdf='https://static2.vietstock.vn/data/HOSE/2026/BCTC/VN/QUY%202/MCH_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf?ver=5b0af47b';
 expect(issuerResource(landing)).toBe(landing);expect(issuerResource(pdf)).toBe(pdf);
 for(const bad of [landing+'&token=secret',landing.replace('doctype=1','doctype=2'),pdf+'&ver=12345678',pdf.replace('ver=5b0af47b','token=secret'),pdf.replace('/BCTC/','/private/')])expect(()=>issuerResource(bad)).toThrow();
 expect(issuerSource({...entry,discoveryUrl:landing},now()).provider).toBe('Vietstock public document mirror for SYNTHETIC TEST ONLY');
 expect(discoverIssuerLinks('<a href="'+pdf+'">Báo cáo tài chính Hợp nhất 2026</a>',landing).pdfs).toEqual([pdf]);
});

it('retains mirror ZIP responses without presenting archive bytes as a verified PDF',async()=>{
 const url='https://static2.vietstock.vn/data/HOSE/2025/BCTC/VN/QUY%201/MCH_Baocaotaichinh_Q1_2025_Hopnhat.zip?ver=1234abcd',e={...entry,discoveryUrl:'https://finance.vietstock.vn/mch/tai-tai-lieu.htm?doctype=1'};
 const r=await new IssuerDocumentCollector(e,issuerSource(e,now()),deps(async u=>new Response(u!==e.discoveryUrl?new Uint8Array([0x50,0x4b,3,4,1,2,3]):'<html></html>',{headers:{'content-type':u!==e.discoveryUrl?'application/octet-stream':'text/html'}})),[url,url.replace('Q1_2025','Q2_2025')]).collect('zip-test');
 expect(JSON.parse(r.captures[1].payload)).toMatchObject({error:null,bodyComplete:true,mediaType:'application/octet-stream',url});expect(completeRawPdfGroups(r.captures)).toEqual([]);expect(r.batch.errors).toContain('ARCHIVE_CAPTURED_PDF_MEMBERS_REQUIRE_INSPECTION');expect(r.batch.errors).toContain('NO_COMPLETE_PDF_DISCOVERED');expect(r.captures).toHaveLength(3);
});
