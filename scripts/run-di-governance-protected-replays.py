import subprocess,os,json
out='docs/fundamental-data-engine/evidence/2026-10-16-di-governance-closure/'
env=os.environ.copy();env['PATH']='/private/tmp/node-v22.23.2-darwin-arm64/bin:'+env['PATH']
commands=['node scripts/verify-di-governance-hpg.mjs','node scripts/verify-debt-contract-activation-hpg.mjs','node scripts/verify-vcb-ticker-closure.mjs','node scripts/verify-ssi-ticker-closure.mjs','node scripts/verify-fpt-ticker-closure.mjs','node scripts/verify-bank-group-regressions.mjs','node scripts/verify-tcx-ticker.mjs','node scripts/verify-vjc-ticker.mjs --ticker=VJC','node scripts/verify-gvr-ticker.mjs --ticker=GVR','node scripts/verify-vic-ticker.mjs --ticker=VIC']
for script,tickers in [('real-estate','VHM VRE VPL'),('consumer-retail','MSN MWG SAB MCH VNM'),('energy','GAS BSR'),('bank','ACB BID CTG HDB LPB MBB SHB SSB STB TCB VIB VPB')]:
 commands += ['node scripts/verify-'+script+'-ticker.mjs --ticker='+t for t in tickers.split()]
results=[]
for i,cmd in enumerate(commands):
 log='validation-logs/replay-'+str(i)+'.log'
 with open(out+log,'w') as f:p=subprocess.run(cmd,shell=True,stdout=f,stderr=subprocess.STDOUT,env=env)
 results.append(dict(command=cmd,exitCode=p.returncode,log=log))
 json.dump(results,open(out+'REPLAY_COMMANDS.json','w'),indent=2)
