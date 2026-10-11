import type {CurrentAnalysisSnapshot} from '@/domain/fundamentals/manual-first';

export function ManualFundamentalsView({snapshot}:{snapshot:CurrentAnalysisSnapshot}){
 const latestRetained=(ticker:string)=>snapshot.statements.filter(s=>s.ticker===ticker).sort((a,b)=>b.reportingPeriod.end.localeCompare(a.reportingPeriod.end)||Number(b.reportingScope==='CONSOLIDATED')-Number(a.reportingScope==='CONSOLIDATED')||a.documentId.localeCompare(b.documentId))[0];
 return <section aria-label="Manual financial evidence"><h2>Manual financial evidence</h2>
  <p>Current analysis as of {snapshot.analysisAt}. Financial readiness is separate from scoring and investment approval.</p>
  <p>Reference status: {snapshot.referenceStatus}. DI14: {snapshot.DI14}. DI15: {snapshot.DI15}.</p>
  <p>Snapshot: {snapshot.snapshotId} · Content hash: <code>{snapshot.contentHash}</code></p>
  <div className="table-scroll"><table><thead><tr>{['Ticker','Latest statement / period','Scope','Document hash / status','Core','Sector-core','Derived','Evidence','Confidence','Freshness','Fundamental Scorable?','Ready for Scoring?'].map(h=><th key={h}>{h}</th>)}</tr></thead>
   <tbody>{snapshot.readiness.map(r=>{const retained=latestRetained(r.ticker);return <tr key={r.ticker}><td><a href={'#manual-'+r.ticker}>{r.ticker}</a></td><td>{retained?.documentType??'Unavailable'} / {retained?.reportingPeriod.end??'UNKNOWN'}<br />Qualified analysis: {r.reportingPeriod??'UNKNOWN'}</td><td>Retained: {retained?.reportingScope??'UNKNOWN'}<br />Analysis: {r.scope??'UNKNOWN'}</td><td><code>{retained?.SHA256??'Unavailable'}</code> / {retained?.reviewStatus??'REVIEW_REQUIRED'}</td><td>{r.coreCoverage.available}/{r.coreCoverage.required}</td><td>{r.sectorCoreCoverage.available}/{r.sectorCoreCoverage.required}</td><td>{r.derivationCoverage.available}/{r.derivationCoverage.total}</td><td>{r.financialEvidenceStatus}</td><td>{r.financialConfidence}</td><td>{r.freshness}</td><td>{String(r.fundamentalScorable)}</td><td>{String(r.readyForScoring)}</td></tr>;})}</tbody></table></div>
  {snapshot.readiness.map(r=><details id={'manual-'+r.ticker} key={r.ticker}><summary>{r.ticker} · {r.financialEvidenceStatus} · evidence limitations</summary>
   <p>Retained source: {r.latestStatement?.retainedPath??'No qualified statement'} · Reporting period: {r.reportingPeriod??'UNKNOWN'}</p>
   <h3>Material missing or conflicting evidence</h3>{r.missingMaterialEvidence.length?<ul>{r.missingMaterialEvidence.map(e=><li key={e.id}>{e.id} · {e.component} · {e.status}</li>)}</ul>:<p>Material financial evidence covered.</p>}
   <p>Supporting coverage: {r.supportingCoverage.available}/{r.supportingCoverage.total}. Unavailable supporting evidence: {r.missingSupportingEvidence.join(', ')||'None'}.</p>
   <p>Optional metrics (N/R): {r.optionalMissingMetrics.join(', ')||'None'}. Optional absence alone does not block financial analysis.</p>
   <p>Market ready: {String(r.marketReady)} · Valuation ready: {String(r.valuationReady)} · Qualitative ready: {String(r.qualitativeReady)} · Decision ready: {String(r.decisionReady)}</p>
  </details>)}
 </section>;
}
