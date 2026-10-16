import './lib/ts-runtime.mjs';
import {readFileSync,readdirSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const {buildHybridAdmission}=await import('../src/domain/fundamentals/hybrid-admission.ts');
const {financialHash}=await import('../src/infrastructure/fundamentals/hybrid-input.ts');
const {financialTargets,evaluateHybridTarget,selectHybridCurrentPeriods}=await import('../src/domain/fundamentals/hybrid-sufficiency.ts');
const root='docs/fundamental-data-engine/evidence/',out=root+'2026-10-16-vn30-data-initialization-final-closure/';
mkdirSync(out,{recursive:true});
const read=p=>JSON.parse(readFileSync(p,'utf8')),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),write=(n,d)=>writeFileSync(out+n+'.json',JSON.stringify(d,null,2)+'\n');
const membershipPath=root+'2026-10-10-di123-membership.json',membership=read(membershipPath);
const members=membership.members.filter(m=>m.effectiveFrom<='2026-10-16'&&(!m.effectiveTo||m.effectiveTo>'2026-10-16'));
const baseline=read(root+'2026-10-14-structured-certification-closure/RETAINED_ADMISSION_INPUT.json');
const paths=[];
function walk(p){for(const e of readdirSync(p,{withFileTypes:true})){const f=p+'/'+e.name;if(e.isDirectory()){if(!/validation|renders|current-source|conflict/.test(e.name))walk(f);}else if(e.name.endsWith('FINAL_SUFFICIENCY.json'))paths.push(f);}}
walk(root);
const rows=[],retention=[],replays=[];
for(const m of members){
 const t=m.ticker;
 const candidates=paths.filter(p=>{try{const d=read(p);return (d.ticker===t||p.includes('ticker-closure-'+t+'/'))&&!p.includes('final-closure/');}catch{return false;}}).sort((a,b)=>a.slice(root.length,root.length+10).localeCompare(b.slice(root.length,root.length+10))||Number(a.includes('targeted-fix'))-Number(b.includes('targeted-fix')));
 // HPG's activated contract supersedes the earlier failed debt attempt on the same date.
 if(t==='HPG'){const p=root+'2026-10-14-debt-contract-activation-hpg/HPG_FINAL_SUFFICIENCY.json';candidates.splice(candidates.indexOf(p),1);candidates.push(p);}
 const finalPath=candidates.at(-1);
 if(!finalPath){rows.push({ticker:t,state:'UNPROCESSED'});continue;}
 const final=read(finalPath),dir=finalPath.slice(0,finalPath.lastIndexOf('/')+1);
 let inputPath=[dir+t+'_RETAINED_ADMISSION_INPUT.json',dir+'RETAINED_ADMISSION_INPUT.json'].find(existsSync);
 if(!inputPath)inputPath=root+readdirSync(root).filter(n=>n.endsWith('ticker-closure-'+t)).sort().at(-1)+'/'+t+'_RETAINED_ADMISSION_INPUT.json';
 const input=read(inputPath),inputDir=inputPath.slice(0,inputPath.lastIndexOf('/')+1);
 const canonicalPath=[inputDir+t+'_CANONICAL_FACTS.json',inputDir+'CANONICAL_FACTS.json'].find(existsSync);
 const replay=buildHybridAdmission(input,financialHash),sector=input.universe.find(u=>u.ticker===t).sector;
 const periods=financialTargets(input).map(p=>evaluateHybridTarget(p,sector,replay,input));
 const coverage=Object.fromEntries(['CORE','SECTOR_CORE','SUPPORTING'].map(k=>{const required=periods.reduce((s,p)=>s+p[k].required,0),admitted=periods.reduce((s,p)=>s+p[k].available,0);return[k,{required,admitted,missing:required-admitted}];}));
 const current=selectHybridCurrentPeriods(input,replay).find(p=>p.ticker===t);
 const issuesPaths=[dir+'OPEN_ISSUES.json',inputDir+'OPEN_ISSUES.json'].filter(existsSync);
 const issues=issuesPaths.map(p=>({path:p,evidence:read(p)}));
 const materialGaps=final.materialGaps??[];
 const ready=coverage.CORE.missing===0&&coverage.SECTOR_CORE.missing===0&&!current?.CURRENT_TRAJECTORY?.missingCurrentYtd&&!replay.unresolvedIssuerConflicts.length&&!materialGaps.length&&!(final.major>0)&&!(final.critical>0);
 const checks={canonicalReplay:isDeepStrictEqual(replay,read(canonicalPath)),coverage:['CORE','SECTOR_CORE','SUPPORTING'].every(k=>coverage[k].required===final.coverage[k].required&&coverage[k].admitted===final.coverage[k].admitted),readiness:final.levelOneReady===undefined?t==='HPG'&&ready:ready===final.levelOneReady,scoringDisabled:replay.readyForScoring===false&&final.readyForScoring===false,sectorPreserved:baseline.universe.find(u=>u.ticker===t)?.sector===sector||(t==='VPL'&&sector==='REAL_ESTATE'&&read(inputDir+'VPL_BASELINE.json').sectorScopeAuthority?.includes('Explicit Owner'))};
 const bindings=(input.sourceBindings??[]).map(b=>({path:b.path,expected:b.sha256,actual:existsSync(b.path)?sha(b.path):null}));
 checks.sourceHashes=bindings.every(b=>b.expected===b.actual);
 const pdfs=input.statements.filter(d=>d.ticker===t).map(d=>({path:d.retainedPath,manualFolder:d.retainedPath.startsWith('data/manual-fundamentals/'+t+'/'),pdf:existsSync(d.retainedPath)&&readFileSync(d.retainedPath).subarray(0,5).toString()==='%PDF-'}));
 checks.originalPDFs=pdfs.length>0&&pdfs.every(d=>d.pdf&&d.manualFolder);
 const compact={...input,verifications:input.verifications.map(v=>Object.fromEntries(Object.entries(v).filter(([k])=>k!=='retainedReaderProof')))};
 checks.noDisposableDependency=isDeepStrictEqual(buildHybridAdmission(compact,financialHash),replay)&&!(input.sourceBindings??[]).some(b=>/manual-extracted|\.png$|\/private\/tmp\//.test(b.path));
 const sealed=[];for(const d of new Set([dir,inputDir]))if(existsSync(d+'ARTIFACT_HASHES.json')){const manifest=read(d+'ARTIFACT_HASHES.json');const entries=manifest.artifacts?manifest.artifacts.map(a=>[a.path,a.sha256]):manifest.evidenceFiles?manifest.evidenceFiles.map(a=>[a.path,a.sha256]):Object.entries(manifest);for(const [n,h] of entries){const p=n.startsWith('docs/')?n:d+n;sealed.push({path:p,valid:existsSync(p)&&sha(p)===h});}}
 checks.sealedArtifacts=sealed.every(s=>s.valid);
 const state=Object.values(checks).every(Boolean)?ready?'CLOSED':'DEFERRED_BLOCKED':'INCONSISTENT';
 rows.push({ticker:t,state,sector,finalPath,inputPath,canonicalPath,priorEvidence:candidates.slice(0,-1),checks,coverage,current,historicalPIT:final.historicalPIT??final.historicalPit??'NOT_READY',materialGaps,issues,providerAnomalies:replay.providerAnomalies??[],unresolvedIssuerConflicts:replay.unresolvedIssuerConflicts,invalidVerificationIds:replay.invalidVerificationIds,contractRegistryHash:financialHash(input.contractRegistry??{}),periods});
 retention.push({ticker:t,checks,pdfs,sourceBindings:bindings,sealedFailures:sealed.filter(s=>!s.valid)});
 replays.push({ticker:t,state,status:Object.values(checks).every(Boolean)?'PASS':'FAIL',checks,contentHash:replay.contentHash,exactBlockers:{materialGaps,issues,missingRequirements:periods.flatMap(p=>p.missingRequirements)}});
}
const counts=Object.fromEntries(['CLOSED','DEFERRED_BLOCKED','UNPROCESSED','INCONSISTENT'].map(s=>[s,rows.filter(r=>r.state===s).length]));
write('VN30_UNIVERSE_RECONCILIATION',{asOf:'2026-10-16',source:membershipPath,sha256:sha(membershipPath),effectiveMembers:members,uniqueCount:new Set(members.map(m=>m.ticker)).size,duplicates:members.filter((m,i)=>members.findIndex(n=>n.ticker===m.ticker)!==i),missing:members.filter(m=>!rows.some(r=>r.ticker===m.ticker)),nonUniverse:rows.filter(r=>!members.some(m=>m.ticker===r.ticker)),authority:'APPROVED RESEARCH DENOMINATOR ONLY; CURRENT OFFICIAL MEMBERSHIP NOT CERTIFIED',unresolvedConflicts:membership.unresolvedConflicts});
write('CLOSED_TICKER_AUDIT',rows.filter(r=>r.state==='CLOSED'));
write('AGGREGATE_COVERAGE',{counts,tickers:rows,expectedComparison:{expectedClosed:25,expectedBlocked:5,matches:counts.CLOSED===25&&counts.DEFERRED_BLOCKED===5}});
write('PROTECTED_REPLAY_RESULTS',{offline:true,status:replays.every(r=>r.status==='PASS')?'PASS':'FAIL',results:replays});
write('SOURCE_RETENTION_AUDIT',{scope:'Active replay dependency graph and sealed package integrity; historical sealed extraction evidence retained unchanged. No extraction artifact deleted or archived by this audit.',tickers:retention});
write('CROSS_TICKER_CONSISTENCY',{sectorAuthority:'Inherited research sector assignments; not official sector certification',baseline:root+'2026-10-14-structured-certification-closure/RETAINED_ADMISSION_INPUT.json',tickers:rows.map(r=>({ticker:r.ticker,sector:r.sector,checks:r.checks,contractRegistryHash:r.contractRegistryHash,periods:r.periods.map(p=>({target:p.target,scope:p.scope,debtContractVersion:p.debtContractVersion,selectedDebtMetric:p.selectedDebtMetric}))})),conventions:'CURRENT_ANALYSIS; annual FY2022–FY2025 plus current YTD 6M2026; reporting-cycle-v1 60-day quarterly/120-day annual operational grace; no interim annualization; debt v2 excludes banks; bank/real-estate/securities regressions verified separately. Provider registry hashes are ticker-filtered and need not equal.'});
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
writeFileSync(out+'TICKER_DISPOSITION_MATRIX.csv',['ticker,state,sector,core_admitted,core_required,sector_admitted,sector_required,supporting_admitted,supporting_required,historical_PIT,evidence',...rows.map(r=>[r.ticker,r.state,r.sector,r.coverage?.CORE.admitted,r.coverage?.CORE.required,r.coverage?.SECTOR_CORE.admitted,r.coverage?.SECTOR_CORE.required,r.coverage?.SUPPORTING.admitted,r.coverage?.SUPPORTING.required,r.historicalPIT,r.finalPath].map(csv).join(','))].join('\n')+'\n');
console.log(JSON.stringify({counts,failed:rows.filter(r=>r.state==='INCONSISTENT').map(r=>({ticker:r.ticker,checks:r.checks}))},null,2));
