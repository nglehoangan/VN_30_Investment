/** Route exact frozen historical operands confirmed in the current issuer report.
 * Historical values require their own required window and a verified current
 * attachment; mere age, reuse of an old report, or a matching value cannot pass.
 */
export function fundamentalFreshnessWindow(observation,bodyHash,cycle,version,qualified,matchedCells,requiredWindows){
 if(!cycle||cycle.status!=='VERIFIED_REQUIRED_CURRENT_PUBLIC_PERIOD'||!version?.requiredVersionBodyHashes.includes(bodyHash))return null;
 if(cycle.requiredPeriod===observation.periodEnd)return {kind:'CURRENT_REPORTING_WINDOW',requiredPeriodOrVersion:cycle.requiredPeriod};
 const requirement=requiredWindows.find(w=>w.securityId===observation.securityId&&w.itemId===observation.itemId&&w.reportingScope===observation.reportingScope&&w.periodStart===observation.periodStart&&w.periodEnd===observation.periodEnd);
 if(!requirement||observation.periodEnd>=cycle.requiredPeriod)return null;
 const document=qualified.find(q=>q.bodyHash===bodyHash&&q.ticker===observation.ticker&&q.status==='TECHNICALLY_QUALIFIED_REVIEW_CANDIDATE'&&q.period?.end===cycle.requiredPeriod&&q.scope===observation.reportingScope);
 if(!document)return null;
 const proofs=matchedCells.filter(c=>c.bodyHash===bodyHash&&c.documentId===document.documentId&&c.securityId===observation.securityId&&c.itemId===observation.itemId&&c.comparativeColumn===true&&c.status==='VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE'&&c.scope===observation.reportingScope&&c.periodType===observation.periodType&&c.period.end===observation.periodEnd&&(c.periodType==='INSTANT'?c.period.end:c.period.start)===observation.periodStart&&c.normalizedCanonicalValue===observation.normalized.value&&c.sourcePageEvidenceHashes?.length>=2);
 if(!proofs.length)return null;
 return {kind:'REQUIRED_HISTORICAL_OPERAND_CONFIRMED_IN_CURRENT_PUBLIC_REPORT',requiredPeriodOrVersion:observation.periodEnd,requiredWindow:{securityId:requirement.securityId,itemId:requirement.itemId,periodStart:requirement.periodStart,periodEnd:requirement.periodEnd,servesMetrics:requirement.servesMetrics,authorityReferences:requirement.authorityReferences},currentReportingPeriod:cycle.requiredPeriod,documentId:document.documentId,bodyHash,proofs};
}
