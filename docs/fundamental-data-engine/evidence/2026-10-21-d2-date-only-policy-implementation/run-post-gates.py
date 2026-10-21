from pathlib import Path
import subprocess,json,os,time
P=Path(__file__).resolve().parent;assert not (P/'ARTIFACT_HASHES.json').exists();env=dict(os.environ);env['PATH']='/private/tmp/node-v22.23.2-darwin-arm64/bin:'+env['PATH']
commands=[('d2-lint',['pnpm','exec','eslint','src/domain/fundamentals/d2-availability.ts','src/infrastructure/fundamentals/d2-source-evidence.ts','tests/fixtures/d2-availability.ts','tests/unit/d2-availability.test.ts','tests/integration/d2-source-evidence.test.ts','--max-warnings=0']),('boundaries',['node','scripts/check-boundaries.mjs']),('typecheck-final',['pnpm','typecheck']),('build-final',['pnpm','build'])]
results=[]
for name,cmd in commands:
 start=time.monotonic();log=P/'validation'/('post-'+name+'.log')
 with log.open('w') as f:code=subprocess.run(cmd,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=1800).returncode
 results.append({'name':name,'command':cmd,'exitCode':code,'seconds':round(time.monotonic()-start,2),'log':str(log.relative_to(Path.cwd()))});(P/'POST_GATE_RESULTS.json').write_text(json.dumps({'status':'COMPLETE' if len(results)==len(commands) else 'RUNNING','results':results},indent=2)+'\n');print(json.dumps(results[-1]),flush=True)
