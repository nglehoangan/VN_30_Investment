"""Run requested existing gates, preserving every exit code and complete logs."""
import subprocess,os,pathlib,json,time,datetime
P=pathlib.Path(__file__).resolve().parent;R=pathlib.Path.cwd()
env=dict(os.environ);env['PATH']='/private/tmp/node-v22.23.2-darwin-arm64/bin:'+env['PATH']
checks=[('lint',['pnpm','lint']),('typecheck',['pnpm','typecheck']),('build',['pnpm','build']),('scoring',['pnpm','test:scoring']),('focused',['pnpm','exec','vitest','run','tests/unit/scoring-readiness.test.ts','tests/unit/scoring-bridge-derived.test.ts','tests/unit/scoring-evidence-time.test.ts','tests/integration/scoring-readiness.test.ts','tests/integration/scoring-readiness-migration.test.ts','tests/integration/production-authority.test.ts','tests/integration/dependency-head.test.ts','tests/unit/market-boundary.test.ts','tests/integration/market-boundary.test.ts','tests/unit/tcbs-pipeline.test.ts','tests/integration/tcbs-pipeline.test.ts']),('full',['pnpm','test','--reporter=json','--outputFile='+str(P/'validation/full-results.json')]),('api',['node','--test','api/capture-market.test.mjs','api/token-session.test.mjs','api/sub-account.test.mjs','api/tcbs-unified.test.mjs'])]
results=[]
for name,cmd in checks:
 print(json.dumps({'running':name,'command':cmd}),flush=True);start=time.monotonic()
 with (P/'validation'/f'{name}.log').open('w') as f:
  try:code=subprocess.run(cmd,cwd=R,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=1800).returncode
  except subprocess.TimeoutExpired:code=124
 row={'name':name,'command':cmd,'exitCode':code,'seconds':round(time.monotonic()-start,2),'log':str((P/'validation'/f'{name}.log').relative_to(R))}
 results.append(row);(P/'TEST_RESULTS.json').write_text(json.dumps({'status':'RUNNING' if len(results)<len(checks) else 'COMPLETE','results':results},indent=2)+'\n')
 print(json.dumps(row),flush=True)
