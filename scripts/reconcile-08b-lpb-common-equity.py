"""Exact LPB-only common-equity classification from a closed ordinary capital table.

No general total-equity alias, subtraction, or regulatory Tier-1 substitution.
"""
import copy,datetime,hashlib,json,pathlib,runpy
B=pathlib.Path('data/initialization-08b-remediation-work');R=runpy.run_path('scripts/reconcile-08b-extraction.py')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
h='2d4527bc19aba72b712521d0f2b9b680bff93a5143513da04a83cb97f76b12bf'
q=next(q for q in json.loads((B/'qualifications.json').read_text()) if q['bodyHash']==h)
assert q['scope']=='SEPARATE_STANDALONE' and q['period']['end']=='2026-06-30'
sources=[]
for n,anchors in [(8,['TỔNG VỐN CHỦ SỞ HỮU','Vốn điều lệ','Thặng dư vốn cổ phần','Vốn và các quỹ','Lợi nhuận chưa phân phối','43.030.481','29.872.821']),(30,['Cổ phiếu phổ thông được phân loại','vốn chủ sở hữu','thặng dư vốn cổ phần']),(49,['Chi tiết vốn đầu tư của Ngân hàng','Vốn cổ phần','phổ thông','Tổng số','Số cuối kỳ','Số đầu kỳ','Triệu VND','100,00%','2.987.282.100'])]:
 f=B/'ocr'/f'{h}-p{n}.json';p=json.loads(f.read_text())
 assert all(all(R['compact'](a) in R['compact'](R['full_text'](p,k)) for a in anchors) for k in ['passA','passB'])
 sources.append({'page':n,'sourcePageFile':str(f),'sourcePageSha256':sha(f),'renderSha256':p['renderSha256'],'exactAnchorsInBothReaders':anchors})
proof_file=B/'lpb-common-equity-classification-proof.json'
proof={'bodyHash':h,'classification':'STANDALONE_ALL_ISSUED_CAPITAL_ORDINARY','scope':q['scope'],'asOf':'2026-06-30','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'sources':sources,'sourceImageInspectionPages':[8,49],'rationale':'The standalone balance sheet exhaustively presents bank capital (ordinary charter capital and share premium), reserves and retained profits. Note 22.2 explicitly partitions total issued capital and ordinary capital: both equal 29,872,821 million VND at closing and opening, with 100% ownership totals. Note 22.3 confirms all issued and outstanding shares are ordinary with equal residual asset priority. Standalone scope has no non-controlling-interest partition. This document-specific positive capital structure supports classification of the reported 43,030,481 million VND closing equity as attributable to common shareholders; it is not an automatic total-equity mapping or a regulatory-capital measure.','sourceDefinitionReference':'COMMON_EQUITY registry definition: exclude minority/preferred interests as applicable, not automatically total equity.'}
proof_file.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
file=B/'source-image-verified-cells.json';cells=json.loads(file.read_text());c=copy.deepcopy(next(c for c in cells if c['bodyHash']==h and c['itemId']=='TOTAL_EQUITY'))
c.update(itemId='COMMON_EQUITY',commonEquityClassificationProofFile=str(proof_file),commonEquityClassificationProofSha256=sha(proof_file),definitionEvidenceReference=str(proof_file))
source_proof=json.loads(pathlib.Path(c['sourceImageProofFile']).read_text());row=copy.deepcopy(next(r for r in source_proof['rows'] if r['itemId']=='TOTAL_EQUITY'));row['itemId']='COMMON_EQUITY'
f=B/'lpb-common-equity-source-image-reader-proof.json';f.write_text(json.dumps({'method':'CODEX_ASSISTANT_SOURCE_IMAGE_READING','recordedAt':proof['recordedAt'],'governanceStatus':'REVIEW_CANDIDATE','independentHumanApproval':None,'rows':[row],'sourceRisk':proof['rationale'],'classificationProofFile':str(proof_file),'classificationProofSha256':sha(proof_file)},ensure_ascii=False,indent=2)+'\n')
c.update(sourceImageProofFile=str(f),sourcePageEvidenceHashes=[sha(pathlib.Path(c['sourceOcrProofFile'])),sha(f),sha(proof_file)])
cells=[x for x in cells if not(x['bodyHash']==h and x['itemId']=='COMMON_EQUITY')];cells.append(c)
file.write_text(json.dumps(cells,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'documentSpecificCommonEquityCandidate':1,'sourceImageCells':len(cells),'humanApprovalAsserted':False}))
