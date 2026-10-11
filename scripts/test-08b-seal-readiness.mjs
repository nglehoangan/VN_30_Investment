import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertRemediationSealReady as ready} from './lib/08b-seal-readiness.mjs';
function fixture(){return {di:Array.from({length:13},(_,i)=>({id:'DI'+(i+1),status:'PASS'})),readiness:Array.from({length:30},(_,i)=>({ticker:'ticker-'+i,securityId:'security-'+i,dataReady:true,missingMetrics:[],blockers:[]})),snapshot:{members:[{}]},derivedMetrics:[{status:'CALCULATED'}],unresolvedConflicts:[],di14:'AWAITING_INDEPENDENT_REVIEW',di15:'AWAITING_FINAL_ISSUE_CLOSURE',governanceApproval:null};}
test('a complete candidate remains pending independent review and issue closure',()=>assert.doesNotThrow(()=>ready(fixture())));
test('each failed or absent DI gate prevents final sealing',()=>{
 for(let i=0;i<13;i++){const p=fixture();p.di[i].status='BLOCKED';assert.throws(()=>ready(p),/DI1_DI13_NOT_CLOSED/);}
 const p=fixture();p.di[12]=p.di[11];assert.throws(()=>ready(p),/DI1_DI13_NOT_CLOSED/);
});
test('missing mandatory data, duplicate identities, empty snapshot and unresolved conflicts cannot seal',()=>{
 for(const mutate of [p=>p.readiness[0].dataReady=false,p=>p.readiness[0].missingMetrics=['required'],p=>p.readiness[0].blockers=['required'],p=>p.readiness[1].securityId=p.readiness[0].securityId,p=>p.snapshot.members=[],p=>p.derivedMetrics=[],p=>p.unresolvedConflicts=[{type:'VALUE_CONFLICT'}]]){
  const p=fixture();mutate(p);assert.throws(()=>ready(p),/NOT_COMPLETE/);
 }
});
test('producer cannot self-approve independent review or formal governance',()=>{
 for(const mutate of [p=>p.di14='PASS',p=>p.di15='PASS',p=>p.governanceApproval='producer']){const p=fixture();mutate(p);assert.throws(()=>ready(p),/CANNOT_SELF_APPROVE/);}
});
