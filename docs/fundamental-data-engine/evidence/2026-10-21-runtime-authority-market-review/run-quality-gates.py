"""Run shared Prisma generation gates sequentially; keep exact commands and exit codes."""
from pathlib import Path
import os,subprocess,time,json
P=Path(__file__).resolve().parent;env=dict(os.environ);env['PATH']='/private/tmp/node-v22.23.2-darwin-arm64/bin:'+env['PATH']
focused=['tests/unit/source-publication.test.ts','tests/unit/runtime-readiness.test.ts','tests/unit/runtime-human-review.test.ts','tests/unit/runtime-dataset-acceptance.test.ts','tests/integration/runtime-evidence.test.ts','tests/unit/scoring-readiness.test.ts','tests/integration/scoring-readiness.test.ts','tests/integration/production-authority.test.ts','tests/integration/dependency-head.test.ts']
commands=[('lint',['pnpm','lint']),('typecheck',['pnpm','typecheck']),('build',['pnpm','build']),('scoring',['pnpm','test:scoring']),('focused',['pnpm','exec','vitest','run',*focused]),('full',['pnpm','test','--reporter=json','--outputFile='+str(P/'validation/full-results.json')]),('api',['node','--test','api/capture-market.test.mjs','api/token-session.test.mjs','api/sub-account.test.mjs','api/tcbs-unified.test.mjs'])]
results=[]
for name,cmd in commands:
 print(json.dumps({'running':name}),flush=True);start=time.monotonic();log=P/'validation'/('final-'+name+'.log')
 with log.open('w') as f:
  try:code=subprocess.run(cmd,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=1800).returncode
  except subprocess.TimeoutExpired:code=124
 results.append({'name':name,'command':cmd,'exitCode':code,'seconds':round(time.monotonic()-start,2),'log':str(log.relative_to(Path.cwd()))});(P/'QUALITY_GATE_RESULTS.json').write_text(json.dumps({'status':'RUNNING' if len(results)<len(commands) else 'COMPLETE','results':results},indent=2)+'\n');print(json.dumps(results[-1]),flush=True)
