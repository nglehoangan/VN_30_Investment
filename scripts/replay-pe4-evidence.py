from pathlib import Path
import json
from lib.pe4_evidence import replay_package
print(json.dumps(replay_package(Path(__file__).resolve().parents[1]),sort_keys=True,indent=2))
