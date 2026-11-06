"""Run actual bounded SSI checks and retain process receipts."""
import subprocess,json,platform,sys,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/fundamental-data-engine/dfr-05/p2-4-b1-ssi-fc688e49'
NODE='/private/tmp/node-v22.23.2-darwin-arm64/bin/node'
commands=[[sys.executable,'scripts/build-dfr05-ssi.py'],[sys.executable,'scripts/test-dfr05-ssi.py'],[NODE,'scripts/verify-dfr05-ssi-boundaries.mjs'],[NODE,'scripts/verify-approved-scoring-authority.mjs']]
receipts=[]
for command in commands:
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();r=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
 receipts.append(dict(command=command,startedAt=start,finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),exitCode=r.returncode,stdout=r.stdout,stderr=r.stderr));print(json.dumps(dict(command=command[-1],exitCode=r.returncode,stdout=r.stdout[-1000:],stderr=r.stderr[-1400:])),flush=True)
 (OUT/'validation-receipts.json').write_text(json.dumps(dict(python=platform.python_version(),node=subprocess.check_output([NODE,'--version'],text=True).strip(),records=receipts),indent=2)+'\n')
 if r.returncode:raise SystemExit(r.returncode)
