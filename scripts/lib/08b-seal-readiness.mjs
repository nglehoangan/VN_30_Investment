/** Final-package boundary; execution previews cannot masquerade as admission candidates. */
export function assertRemediationSealReady(packet){
 const gates=packet.di??[],expected=Array.from({length:13},(_,i)=>'DI'+(i+1));
 if(gates.length!==13||new Set(gates.map(g=>g.id)).size!==13||expected.some(id=>!gates.some(g=>g.id===id&&g.status==='PASS')))throw Error('FINAL_REMEDIATION_DI1_DI13_NOT_CLOSED');
 const rows=packet.readiness??[];
 if(rows.length!==30||new Set(rows.map(r=>r.ticker)).size!==30||new Set(rows.map(r=>r.securityId)).size!==30||rows.some(r=>r.dataReady!==true||r.missingMetrics.length||r.blockers.length))throw Error('FINAL_REMEDIATION_REQUIRED_TICKER_READINESS_NOT_COMPLETE');
 if(!packet.snapshot?.members?.length||!packet.derivedMetrics?.some(d=>d.status==='CALCULATED')||packet.unresolvedConflicts?.length!==0)throw Error('FINAL_REMEDIATION_SELECTED_DATA_OR_DERIVATIONS_NOT_COMPLETE');
 if(packet.di14!=='AWAITING_INDEPENDENT_REVIEW'||packet.di15!=='AWAITING_FINAL_ISSUE_CLOSURE'||packet.governanceApproval!==null)throw Error('FINAL_REMEDIATION_CANNOT_SELF_APPROVE');
}
