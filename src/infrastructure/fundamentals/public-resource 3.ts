import {createHash} from 'node:crypto';
/** Only public document-routing parameters on observed issuer endpoints; never strip a query. */
export function publicDocumentQuery(u:URL):boolean {
 if(!u.search)return true;
 const pairs=[...u.searchParams.entries()];if(!pairs.length||new Set(pairs.map(p=>p[0])).size!==pairs.length)return false;
 if(u.hostname==='finance.vietstock.vn'&&/^\/[a-z0-9]{3,10}\/tai-tai-lieu\.htm$/i.test(u.pathname))return pairs.length===1&&pairs[0][0]==='doctype'&&pairs[0][1]==='1';
 if(u.hostname==='static2.vietstock.vn'&&/^\/data\/(HOSE|HNX|UPCOM)\/(19|20)\d{2}\/BCTC\/(VN|EN)\/.+\.(pdf|zip)$/i.test(u.pathname))return pairs.length===1&&pairs[0][0]==='ver'&&/^[a-f0-9]{8}$/.test(pairs[0][1]);
 if(u.hostname==='bidv.com.vn'&&u.pathname.startsWith('/wps/wcm/connect/'))return pairs.every(([k,v])=>k==='MOD'&&v==='AJPERES'||k==='CACHEID'&&/^[A-Za-z0-9_.:-]{1,200}$/.test(v));
 // Exact VIB Q2 issuer attachment observed in its anonymous public component.
 if(u.hostname==='www.vib.com.vn'&&u.pathname==='/wps/wcm/connect/e7f51a9d-045b-4fac-9dba-14aa5b53a479/20260727+-+VIB+-+BCTC+hop+nhat+Quy+2+2026.pdf')return pairs.length===3&&u.searchParams.get('MOD')==='AJPERES'&&u.searchParams.get('CONVERT_TO')==='url'&&u.searchParams.get('CACHEID')==='ROOTWORKSPACE-e7f51a9d-045b-4fac-9dba-14aa5b53a479-p-yt1KJ';
 // Exact reviewed interim attachment from the retained issuer report list.
 if(u.hostname==='www.vib.com.vn'&&u.pathname==='/wps/wcm/connect/a404414a-c634-43ca-9fd6-9d4475d4c289/20260806+-+VIB+-+BCTC+hop+nhat+soat+xet+ban+nien+2026.pdf')return pairs.length===3&&u.searchParams.get('MOD')==='AJPERES'&&u.searchParams.get('CONVERT_TO')==='url'&&u.searchParams.get('CACHEID')==='ROOTWORKSPACE-a404414a-c634-43ca-9fd6-9d4475d4c289-p.lJrlM';
 if(['bsr.com.vn','www.bsr.com.vn'].includes(u.hostname)&&u.pathname==='/c/document_library/get_file')return u.searchParams.has('uuid')&&u.searchParams.has('groupId')&&pairs.every(([k,v])=>k==='uuid'&&/^[a-f0-9-]{36}$/.test(v)||k==='groupId'&&/^\d{1,12}$/.test(v)||k==='download'&&['true','false'].includes(v));
 if(u.hostname==='vrg.vn'&&u.pathname.startsWith('/wp-content/uploads/'))return pairs.every(([k,v])=>/^x\d{1,10}$/.test(k)&&v==='');
 if(u.hostname==='www.pvgas.com.vn'&&u.pathname==='/DesktopModules/EasyDNNNews/DocumentDownload.ashx')return pairs.length===4&&['portalid','moduleid','articleid','documentid'].every(k=>/^\d{1,12}$/.test(u.searchParams.get(k)??''));
 if(u.hostname==='investor.vietinbank.vn'&&u.pathname.startsWith('/documents/'))return pairs.length===1&&pairs[0][0]==='download'&&pairs[0][1]==='true';
 // Observed anonymous filing attachment: retain its public cache-version query
 // in the fingerprint; never drop it or accept arbitrary CDN query parameters.
 if(u.hostname==='cafefnew.mediacdn.vn'&&/^\/download\/\d{6}\/lpb123016-bao-cao-tai-chinh-ban-nien-nam-2026-2-631169\.pdf$/.test(u.pathname))return pairs.length===1&&pairs[0][0]==='v'&&/^\d{13}$/.test(pairs[0][1]);
 return false;
}
export function rawResourceReference(url:string):string{return new URL(url).search?'public-document-sha256:'+createHash('sha256').update(url).digest('hex'):url;}
