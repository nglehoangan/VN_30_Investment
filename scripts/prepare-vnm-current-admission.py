#!/usr/bin/env python3
"""Prepare version-bound retained catalogs; no approval or source changes."""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/vnm-current-admission-route/2026-11-16'
sha=lambda p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
pin=lambda p:{'path':p,'sha256':sha(p)}
p='docs/fundamental-data-engine/vnm-s1-wacc-q3/2026-11-13/WACC_Q3_INPUTS.json'
d=json.loads((ROOT/p).read_text());s=d['q3Source'];r=s['retrievalEvidence']['binding']
ref=lambda p,pointer:{**pin(p),'pointer':pointer}
metadata={'contract':'retained-current-document-bindings-v1','documents':[{'raw':pin(s['path']),'ticker':'VNM','scope':'CONSOLIDATED','reportEnd':'2026-09-30','receipt':ref(r['path'],r['jsonPointer']),'review':ref(p,'/q3Source/reviewedAt'),'title':ref(r['path'],r['jsonPointer']+'/title')}]}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'DOCUMENT_BINDINGS.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
rows=json.loads((ROOT/'docs/fundamental-data-engine/vnm-f2-mapping/2026-11-16/MAPPED_FINANCIAL_FACTS.json').read_text())['rows']
selected=[x for x in rows if x['scope']=='CONSOLIDATED' and x['vintage']=='Q3_2026_PRESENTATION']
requirements={'contract':'current-financial-dataset-requirements-v1','version':'vnm-q3-native-financial-inputs-v1','fullM3CoverageCertified':False,'financial':[{'itemId':{'NET_PROFIT_GROUP':'NET_INCOME'}.get(x['concept'],x['concept']),'scope':x['scope'],'start':x['start'],'end':x['end'],'vintage':x['vintage']} for x in selected if x['end']=='2026-09-30'],'requirePrice':True,'requireShares':True,'policyReferences':[pin('docs/03 SCORING/METRIC_DEFINITIONS.md')] if (ROOT/'docs/03 SCORING/METRIC_DEFINITIONS.md').exists() else [pin('src/domain/scoring/methodology.ts')]}
# Deduplicate equivalent observations without adding values or mixing definitions.
unique={json.dumps(x,sort_keys=True):x for x in requirements['financial']};requirements['financial']=list(unique.values())
(OUT/'DATASET_REQUIREMENTS.json').write_text(json.dumps(requirements,ensure_ascii=False,indent=2)+'\n')
(OUT/'SELECTED_MAPPING_IDS.json').write_text(json.dumps({'ticker':'VNM','securityId':'a243cd90-95b8-44f0-96a5-b6be0defeb87','economicCutoff':'2026-10-30','mappingIds':[x['id'] for x in selected],'fullM3CoverageCertified':False},indent=2)+'\n')
print(json.dumps({'selected':len(selected),'currentRequirements':len(requirements['financial'])}))
