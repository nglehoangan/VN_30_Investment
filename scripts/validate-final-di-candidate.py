"""Run release checks without rewriting prior evidence or granting acceptance."""
import os,json,pathlib,subprocess,sys,hashlib
O=pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-17-data-initialization-final-acceptance');env=os.environ.copy();env['PATH']='/private/tmp/node-v22.23.2-darwin-arm64/bin:'+env['PATH'];mode=sys.argv[1]
selection='static' if mode=='static-retest' else mode
commands={
 'static': [('focused','pnpm exec vitest run tests/unit/di15-policy-b.test.ts tests/unit/policy-b-ports.test.ts tests/unit/policy-b-reporting.test.tsx tests/integration/di15-policy-b.test.ts tests/unit/scoring-readiness.test.ts tests/integration/scoring-readiness.test.ts tests/unit/di-governance-closure.test.ts tests/unit/vn30-final-closure-review.test.ts'),('fundamental','pnpm exec vitest run tests/unit/*ticker-closure.test.ts tests/unit/hpg-debt-final-closure.test.ts tests/unit/structured-certification.test.ts tests/unit/fundamentals*.test.ts tests/integration/fundamentals*.test.ts'),('boundaries','pnpm test:boundaries'),('lint','pnpm lint'),('typecheck','pnpm typecheck'),('database','pnpm db:validate'),('structured','node scripts/verify-structured-certification.mjs')],
 'browser':[('production-build','pnpm db:generate && pnpm exec next build --webpack'),('browser','node scripts/smoke-app.mjs --e2e')],
 'full':[('full-suite','pnpm test --testTimeout=60000')],
 'protected': [(f'replay-{i}',r['command']) for i,r in enumerate(json.loads(pathlib.Path('docs/fundamental-data-engine/evidence/2026-10-17-di15-partial-universe-amendment/REPLAY_COMMANDS.json').read_text()))]+[('aggregate','node scripts/verify-di-governance-aggregate.mjs')]
}[selection]
if mode=='static-retest':commands=[r for r in commands if r[0]!='focused']
rows=[]
for name,cmd in commands:
 p=O/'validation-logs'/(name+'.log')
 with p.open('w') as f:r=subprocess.run(cmd,shell=True,env=env,stdout=f,stderr=subprocess.STDOUT)
 rows.append({'name':name,'command':cmd,'exitCode':r.returncode,'log':str(p),'logSHA256':hashlib.sha256(p.read_bytes()).hexdigest()})
 (O/(mode+'-commands.json')).write_text(json.dumps(rows,indent=2)+'\n')
 print(name,r.returncode,flush=True)
 if r.returncode:sys.exit(r.returncode)
if mode=='browser':
 rows=[]
 for p in pathlib.Path('docs/06_DASHBOARD/6.7.1 Current Read Model/visual-evidence').glob('*.png'):
  original=subprocess.check_output(['git','show','68aa87f9ae4478714ec6ca676e5a3b2addf0d77f:'+str(p)])
  rows.append({'path':str(p),'browserGeneratedSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'restoredSHA256':hashlib.sha256(original).hexdigest()});p.write_bytes(original)
 (O/'E2E_SCREENSHOT_PRESERVATION.json').write_text(json.dumps(rows,indent=2)+'\n')
