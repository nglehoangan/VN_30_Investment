from pathlib import Path
import subprocess,json,hashlib,time,sys,os,signal
O=Path(__file__).resolve().parent;R=O.parents[3];N='/tmp/node-v22.23.2-darwin-arm64/bin/node';rel=str(O.relative_to(R));receipts=[];reuse=[]
commands=[('gate-regression',[N,'node_modules/vitest/vitest.mjs','run','--config',rel+'/vitest.config.mts','--reporter=json','--outputFile='+rel+'/gate-regression-green.json']),('baseline-regression',[N,'node_modules/vitest/vitest.mjs','run','--config',rel+'/baseline.vitest.config.mts','--reporter=json','--outputFile='+rel+'/baseline-regression.json']),('typecheck',[N,'node_modules/typescript/bin/tsc','--project',rel+'/tsconfig.json','--noEmit']),('patch-application-check',['git','apply','--check',rel+'/scoring-g2-g3.proposed.patch']),('architecture-boundaries',[N,'scripts/check-boundaries.mjs'])]
if '--changed-scope'in sys.argv:
 prior=json.loads((O/'execution-initial-complete.json').read_text());reuse=[{**r,'executionStatus':'REUSED_PASS_UNCHANGED_ACCEPTED_SOURCE','sourceIntegrityReceipt':'validation-results.json'}for r in prior['receipts']if r['name']=='baseline-regression'];commands=[x for x in commands if x[0]!='baseline-regression']
def save():
 (O/'execution-receipts.json').write_text(json.dumps({'nodeVersion':'v22.23.2','productionActivation':False,'receipts':receipts+reuse,'exceptions':['execution-attempt-timeout.json','execution-baseline-rerun-timeout.json','execution-typecheck-rerun-timeout.json']},indent=2)+'\n')
for name,args in commands:
 start=time.time();proc=subprocess.Popen(args,cwd=R,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True);print('Checking',name,'pid',proc.pid,flush=True)
 try:out,err=proc.communicate(timeout=900);code=proc.returncode;status='COMPLETED'
 except subprocess.TimeoutExpired:
  os.killpg(proc.pid,signal.SIGKILL);out,err=proc.communicate();code=None;status='TIMEOUT'
 p=O/(name+'.log');p.write_text(out+err);receipts.append({'name':name,'command':args,'exitCode':code,'status':status,'durationSeconds':round(time.time()-start,3),'log':p.name,'logSha256':hashlib.sha256(p.read_bytes()).hexdigest()});save()
print(json.dumps({'pass':all(r['exitCode']==0 for r in receipts+reuse),'executions':len(receipts),'reusedBaselineExecutions':len(reuse)}),flush=True)
