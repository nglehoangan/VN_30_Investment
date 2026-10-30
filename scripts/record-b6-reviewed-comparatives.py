"""Keep explicit dated comparatives distinct from opening/restatement variants."""
import json,hashlib,datetime
from pathlib import Path
R=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1')
sources=json.loads(Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-29/b6-integration-r1/native-review-sources.json').read_text())
facts=[]
for item,page,value,path in [
 ('CURRENT_LIABILITIES',10,'41524928721230','data/manual-download/FPT/FPT_Baocaotaichinh_2025_Kiemtoan_Hopnhat.pdf'),
 ('RECEIVABLES',8,'14008456702890','data/manual-download/FPT/FPT_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf')]:
 obs=[o for o in sources['observations'] if o['ticker']=='FPT' and o['itemId']==item and o['periodEnd']=='2025-12-31'];assert obs and all(o['normalized']['value']==value for o in obs)
 facts.append(dict(id='checked-comparative-FPT-'+item,ticker='FPT',itemId=item,value=value,rawValue=value,rawUnit='CURRENCY',multiplier='1',unit='CURRENCY',currency='VND',period=dict(start='2025-12-31',end='2025-12-31'),reportingScope='CONSOLIDATED',sourcePdfPath=path,sourceHash=hashlib.sha256(Path(path).read_bytes()).hexdigest(),page=page,captionAndColumn='Explicit 31/12/2025 dated column; receipts use H126 reclassified presentation, not annual original14402017450105. Cross-vintage growth not qualified.' if item=='RECEIVABLES' else 'Audited FY2025 consolidated current liabilities, closing31/12/2025',method='CHATGPT_FULL_SOURCE_IMAGE_REVIEW',reviewedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),priorObservationIds=[o['id'] for o in obs],comparison='MATCH',productionAdmissible=False))
(R/'checked-comparative-sources.json').write_text(json.dumps(dict(facts=facts,classificationBridgeRequired=['FPT_RECEIVABLES_2025_ORIGINAL_VS_2026_RECLASSIFIED','BSR_2026_OPENING_RECLASSIFICATION','VHM_2026_OPENING_RESTATEMENT'],openingBalancesRelabelledClosing=False),indent=2)+'\n')
