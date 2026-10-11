import {describe,it,expect} from 'vitest';
import {publicDocumentQuery,rawResourceReference} from '../../src/infrastructure/fundamentals/public-resource';

describe('observed public secondary filing routing',()=>{
 it('pins the reviewed VIB edition without widening the query contract',()=>{
  const url='https://www.vib.com.vn/wps/wcm/connect/a404414a-c634-43ca-9fd6-9d4475d4c289/20260806+-+VIB+-+BCTC+hop+nhat+soat+xet+ban+nien+2026.pdf?MOD=AJPERES&CONVERT_TO=url&CACHEID=ROOTWORKSPACE-a404414a-c634-43ca-9fd6-9d4475d4c289-p.lJrlM';
  expect(publicDocumentQuery(new URL(url))).toBe(true);
  for(const invalid of [url+'&token=secret',url.replace('20260806','20260807'),url.replace('-p.lJrlM','-unknown'),url.replace('CONVERT_TO=url','CONVERT_TO=private')])expect(publicDocumentQuery(new URL(invalid))).toBe(false);
  expect(rawResourceReference(url)).not.toBe(rawResourceReference(url.replace('20260806','20260807')));
 });
 it('accepts only the observed anonymous VIB issuer attachment contract',()=>{
  const url='https://www.vib.com.vn/wps/wcm/connect/e7f51a9d-045b-4fac-9dba-14aa5b53a479/20260727+-+VIB+-+BCTC+hop+nhat+Quy+2+2026.pdf?MOD=AJPERES&CONVERT_TO=url&CACHEID=ROOTWORKSPACE-e7f51a9d-045b-4fac-9dba-14aa5b53a479-p-yt1KJ';
  expect(publicDocumentQuery(new URL(url))).toBe(true);
  for(const invalid of [url+'&token=secret',url.replace('CONVERT_TO=url','CONVERT_TO=private'),url.replace('20260727','20260728'),url.replace('-p-yt1KJ','-unknown')])expect(publicDocumentQuery(new URL(invalid))).toBe(false);
 });
 it('retains the exact version and rejects unrelated parameters and routes',()=>{
  const url='https://cafefnew.mediacdn.vn/download/170826/lpb123016-bao-cao-tai-chinh-ban-nien-nam-2026-2-631169.pdf?v=1786960437043';
  expect(publicDocumentQuery(new URL(url))).toBe(true);
  expect(rawResourceReference(url)).not.toBe(rawResourceReference(url.replace('1786960437043','1786960437044')));
  for(const invalid of [url+'&token=abc',url.replace('?v=','?account='),url.replace('631169.pdf','other.pdf'),url.replace('1786960437043','private')])expect(publicDocumentQuery(new URL(invalid))).toBe(false);
 });
});
