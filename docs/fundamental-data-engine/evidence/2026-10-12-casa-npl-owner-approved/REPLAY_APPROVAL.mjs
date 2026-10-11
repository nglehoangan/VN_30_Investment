import {readFileSync,writeFileSync} from 'node:fs';
import {mappingBoundary,sourceContractApprovalRecordedAt} from '../../../../scripts/lib/08b-governance-boundary.mjs';
const prior=JSON.parse(readFileSync(new URL('../2026-10-12-governance-closure-selected-path-corrected/TRUE_GOVERNANCE_DEFECTS.json',import.meta.url)));
const routes=prior.rows.flatMap(defect=>defect.affectedRoutes.map(route=>({defectId:defect.id,ticker:route.ticker,metric:route.metric,periodEnd:route.periodEnd,historical:mappingBoundary(route,{cutoff:'2026-10-12T04:01:37.810Z'}),prospective:mappingBoundary(route,{cutoff:sourceContractApprovalRecordedAt})})));
if(routes.some(r=>!r.historical.defectKey||r.prospective.defectKey!==null||r.prospective.executionAllowed!==false))throw Error('APPROVAL_REPLAY_MISMATCH');
writeFileSync(process.argv[2]??'/private/tmp/vn30-owner-approval-replay.json',JSON.stringify({approvalRecordedAt:sourceContractApprovalRecordedAt,historicalSnapshotGovernanceDefects:2,prospectiveGenericContractDefects:0,bankSpecificMappingsApproved:0,allAffectedRoutesStillBlocked:true,routes},null,2)+'\n');
