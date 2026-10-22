from pathlib import Path
import json
from lib.pe3_evidence import replay
r=Path(__file__).resolve().parents[1]
print(json.dumps(replay(r,r/'docs/fundamental-data-engine/evidence/2026-10-22-primary-publication-evidence-pe3'),ensure_ascii=False,sort_keys=True,indent=2))
