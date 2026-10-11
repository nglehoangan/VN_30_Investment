import subprocess,os,pathlib,json,time,resource
root=pathlib.Path.cwd();b=root/'docs/fundamental-data-engine/evidence/2026-10-12-di14-blocker-closure';node='/private/tmp/vn30-di14-runtime/node-v22.23.2-darwin-arm64/bin/node';env={**os.environ,'PATH':str(pathlib.Path(node).parent)+':'+os.environ['PATH'],'XDG_CACHE_HOME':'/private/tmp/vn30-di14-prisma-cache'}
files=['tests/integration/decision.test.ts','tests/integration/m68-backup.test.ts','tests/integration/marginal.test.ts','tests/integration/m68.test.ts'];rows=[]
for n in [2,4]:
 output=b/f'batch-{n}-results.json';command=[node,'node_modules/vitest/vitest.mjs','run',*files[:n],'--pool=forks','--maxWorkers=1','--no-file-parallelism','--reporter=json','--outputFile='+str(output)]
 start=time.monotonic()
 with (b/'validation-logs'/f'batch-{n}.log').open('w') as log:
  try:r=subprocess.run(command,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=240);code=r.returncode
  except subprocess.TimeoutExpired:code=None
 report=json.loads(output.read_text()) if output.exists() else {}
 row={'batchFileCount':n,'files':files[:n],'maxWorkers':1,'pool':'forks','exitCode':code,'signal':-code if code is not None and code<0 else None,'tests':report.get('numTotalTests'),'passed':report.get('numPassedTests'),'failed':report.get('numFailedTests'),'durationSeconds':round(time.monotonic()-start,3),'maxChildRSSBytesObserved':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss,'testAndHookTimeoutsUnchanged':True};rows.append(row);print(json.dumps(row),flush=True)
(b/'CONTROLLED_BATCHES.json').write_text(json.dumps(rows,indent=2)+'\n')
