import {createHash} from 'node:crypto';
/** Only public document-routing parameters on observed issuer endpoints; never strip a query. */
export function publicDocumentQuery(u:URL):boolean {
 if(!u.search)return true;
 const pairs=[...u.searchParams.entries()];if(!pairs.length||new Set(pairs.map(p=>p[0])).size!==pairs.length)return false;
 if(u.hostname==='finance.vietstock.vn'&&/^\/(mch|msn|vcb|vhm|vib)\/tai-tai-lieu\.htm$/i.test(u.pathname))return pairs.length===1&&pairs[0][0]==='doctype'&&pairs[0][1]==='1';
 if(u.hostname==='static2.vietstock.vn'&&/^\/data\/HOSE\/(2025|2026)\/BCTC\/VN\/.+\.(pdf|zip)$/i.test(u.pathname))return pairs.length===1&&pairs[0][0]==='ver'&&/^[a-f0-9]{8}$/.test(pairs[0][1]);
 if(u.hostname==='bidv.com.vn'&&u.pathname.startsWith('/wps/wcm/connect/'))return pairs.every(([k,v])=>k==='MOD'&&v==='AJPERES'||k==='CACHEID'&&/^[A-Za-z0-9_.:-]{1,200}$/.test(v));
 if(['bsr.com.vn','www.bsr.com.vn'].includes(u.hostname)&&u.pathname==='/c/document_library/get_file')return u.searchParams.has('uuid')&&u.searchParams.has('groupId')&&pairs.every(([k,v])=>k==='uuid'&&/^[a-f0-9-]{36}$/.test(v)||k==='groupId'&&/^\d{1,12}$/.test(v)||k==='download'&&['true','false'].includes(v));
 if(u.hostname==='vrg.vn'&&u.pathname.startsWith('/wp-content/uploads/'))return pairs.every(([k,v])=>/^x\d{1,10}$/.test(k)&&v==='');
 if(u.hostname==='www.pvgas.com.vn'&&u.pathname==='/DesktopModules/EasyDNNNews/DocumentDownload.ashx')return pairs.length===4&&['portalid','moduleid','articleid','documentid'].every(k=>/^\d{1,12}$/.test(u.searchParams.get(k)??''));
 if(u.hostname==='investor.vietinbank.vn'&&u.pathname.startsWith('/documents/'))return pairs.length===1&&pairs[0][0]==='download'&&pairs[0][1]==='true';
 return false;
}
export function rawResourceReference(url:string):string{return new URL(url).search?'public-document-sha256:'+createHash('sha256').update(url).digest('hex'):url;}
