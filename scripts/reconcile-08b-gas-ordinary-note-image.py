"""Actually inspected GAS note 36: common profit before fund allocation and EPS."""
import datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work')
H='a90c4b06b6fa67215ee83247c8f2ea7b5cf8bdba8cc968b226e52c55ce568886'
ROWS={
 'NET_INCOME_ATTRIBUTABLE_COMMON':('8.804.699.596.333','7.504.136.315.841','Lợi nhuận trong kỳ phân bổ cho các cổ đông sở hữu cổ phiếu phổ thông (VND)','CURRENCY',.47),
 'BASIC_EPS':('3.609','3.024','Lãi cơ bản trên cổ phiếu (VND/cổ phiếu)','CURRENCY_PER_SHARE',.564)
}
def validate(c,p,R):
 d=c.get('sourceImageColumnDefinition') or {};r=ROWS.get(c.get('itemId'))
 if not r:return False
 lexical,prior,caption,unit,y=r
 text=R['compact'](R['full_text'](p,'passA'))
 return (c['bodyHash']==H and c['page']==65 and c['scope']=='CONSOLIDATED' and c['sourceRowCode']=='NOTE_36'
  and c['periodType']=='YTD' and c['period']['start']=='2026-01-01' and c['period']['end']=='2026-06-30'
  and c['lexicalValue']==d.get('currentLexical')==lexical and d.get('comparativeLexical')==prior and d.get('currentColumnOrdinal')==0
  and c['unit']==unit and c['currency']=='VND' and c['sourceCaption']==caption
  and d.get('fundAllocationTreatment')==('REPORTED_COMMON_PROFIT_BEFORE_DEDUCTION' if c['itemId']=='NET_INCOME_ATTRIBUTABLE_COMMON' else 'REPORTED_EPS_AFTER_95965250000_VND_FUND_ALLOCATION')
  and .59<c['columnX']<.75 and abs(c['rowY']-y)<.016
  and all(R['compact'](a) in text for a in ['thuyết minh báo cáo tài chính hợp nhất','36. LÃI CƠ BẢN TRÊN CỔ PHIẾU','Kỳ này','Kỳ trước','Trình bày lại','kỳ hoạt động 6 tháng kết thúc','ngày 30 tháng 6 năm 2026','6 tháng kết thúc ngày 30 tháng 6 năm 2025','95.965.250.000','8.708.734.346.333','VND/cổ phiếu'])
  and any(w['text']==lexical and w['confidence']>=.8 and abs(w['x']-c['columnX'])<.001 and abs(w['y']+w['height']/2-c['rowY'])<.001 for w in p['passA'])
  and any(w['text']==prior and w['x']>.76 and abs(w['y']+w['height']/2-c['rowY'])<.015 for w in p['passA']))
def main():
 R=runpy.run_path('scripts/reconcile-08b-extraction.py');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
 q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==H); assert q['scope']=='CONSOLIDATED' and q['period']['end']=='2026-06-30'
 f=B/'ocr'/f'{H}-p65.json';p=json.loads(f.read_text());assert p['renderSha256']==sha(f.with_suffix('.png'));cells=[];rows=[]
 for item,(lexical,prior,caption,unit,_) in ROWS.items():
  w=next(w for w in p['passA'] if w['text']==lexical)
  d={'layout':'GAS_NOTE_36_REPORTED_ORDINARY_PROFIT_AND_EPS','currentColumnOrdinal':0,'currentLexical':lexical,'comparativeLexical':prior,'fundAllocationTreatment':'REPORTED_COMMON_PROFIT_BEFORE_DEDUCTION' if item=='NET_INCOME_ATTRIBUTABLE_COMMON' else 'REPORTED_EPS_AFTER_95965250000_VND_FUND_ALLOCATION','priorDisclosure':'PRESENTED_AGAIN; no global revision identity inferred'}
  c={'ticker':'GAS','securityId':q['securityId'],'documentId':q['documentId'],'bodyHash':H,'page':65,'itemId':item,'sourceCaption':caption,'captionAlternative':R['fold'](caption),'sourceRowCode':'NOTE_36','lexicalValue':lexical,'verificationLexicalValue':lexical,'verifiedCanonicalInteger':R['numeric_value'](lexical),'unit':unit,'currency':'VND','scope':q['scope'],'period':{**q['period'],'start':'2026-01-01','end':'2026-06-30','type':'YTD'},'periodType':'YTD','columnX':w['x'],'rowY':w['y']+w['height']/2,'extractionMethod':p['engineA'],'verificationMethod':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d,'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,'independentHumanApproval':None,'sourceOcrProofFile':str(f)};assert validate(c,p,R);cells.append(c)
  rows.append({'bodyHash':H,'page':65,'itemId':item,'caption':caption,'rowCode':'NOTE_36','currentLexical':lexical,'unit':unit,'currency':'VND','scope':q['scope'],'periodType':'YTD','periodStart':'2026-01-01','periodEnd':'2026-06-30','renderSha256':p['renderSha256'],'sourceImageColumnDefinition':d})
 proof=B/'gas-ordinary-note-source-image-reader-proof.json';proof.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':rows,'sourceRisk':'Explicit common-shareholder profit 8,804,699,596,333 VND is distinct from the EPS numerator 8,708,734,346,333 after reported fund allocation. Neither is declared normalized earnings. Prior EPS presented again following bonus-share and fund remeasurement disclosures; historical revision not silently inferred.'},ensure_ascii=False,indent=2)+'\n')
 for c in cells:c.update(sourceImageProofFile=str(proof),sourcePageEvidenceHashes=[sha(f),sha(proof)])
 out=B/'source-image-verified-cells.json';existing=json.loads(out.read_text());existing=[c for c in existing if not(c['bodyHash']==H and c['itemId'] in ROWS)]+cells;out.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'sourceImageCells':len(existing),'newGasOrdinaryNoteCells':len(cells)}))
if __name__=='__main__':main()
