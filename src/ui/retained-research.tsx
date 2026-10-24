import Link from 'next/link';
import type {RetainedResearch} from '@/domain/fundamentals/retained-research';
import {Panel,Table} from './primitives';
export function RetainedResearchView({research:r}:{research:RetainedResearch}) {
 const v=r.selected;
 return <div style={{overflowWrap:"anywhere",minWidth:0}}><Panel title="Retained financial research">
 <p className="notice">RETAINED_RESEARCH_DATA · Unreviewed presentation only. Production admission: BLOCKED. Scoring authorization: BLOCKED.</p>
 {r.warnings.map((w,i)=><p key={i}>{w}</p>)}
 <p>Viewed at: {r.viewedAt} · Schema: {r.contract} · {r.catalog.length} retained tickers; this catalog does not certify current VN30 membership.</p>
 <div role="navigation" aria-label="Financial research tickers">{r.catalog.map(c=><span key={c.ticker}><Link href={`/vn30/${c.ticker}`}>{c.ticker}</Link>{' · '}</span>)}</div>
 <p>Source catalog: {r.manifestPath} · SHA-256: {r.manifestHash}</p>
 <p>Quarantined API captures: {r.quarantines.length}. Quarantined captures cannot supply displayed values.</p>
 <details><summary>API schema quarantine details</summary><Table headers={['Ticker','Endpoint','Mode','Retained capture','Schema error']} rows={r.quarantines.map(q=>[q.ticker,q.endpoint,q.mode,q.path,q.reason])}/></details>
 {v&&<><h3>{r.ticker} · report variants</h3><form action={`/vn30/${r.ticker}`} method="get"><label>Report / period / statement variant <select style={{width:"100%",maxWidth:"100%"}} name="variant" defaultValue={v.index}>{r.variants.map(x=><option key={x.index} value={x.index}>{x.index} · {x.report} · {x.periodKey} · {x.reportingScope} · {x.provider} · {x.id}</option>)}</select></label> <button type="submit">View research variant</button></form>
 <p>Reporting period: {v.periodKey} ({v.periodType}) · Reporting boundary: {v.periodEnd??'Unknown'} · Statement scope: {v.reportingScope} ({v.scopeStatus})</p>
 <p>Captured at: {v.retrievedAt??'Unknown'} · Publication time: Unknown / unqualified. Capture time is not publication time.</p>
 <p>Source: {v.sourcePath} · SHA-256: {v.sourceHash} · Combined file SHA-256: {r.fileHash}</p>
 <p>Values remain exact decimal strings in declared native units. Missing, withheld, dash and unresolved values are unavailable; they are never zero-filled. Statement variants and parent/consolidated scopes are not merged.</p>
 <Table headers={['Caption / code','Value','Unit / currency / scale','Scope','Selection / status','Source provenance / review']} rows={r.rows.map(row=>[<span key={row.pointer}>{row.label}<br/>{row.code??'No code'} · {row.group}</span>,<span key={`${row.pointer}-value`} style={{whiteSpace:'nowrap'}}>{row.value??'Unavailable'}</span>,`${row.unit??'Unknown'} / ${row.currency??'Unknown'} / ${row.scale??'Unknown'}`,row.reportingScope,`${row.source} / ${row.status}`,<details key={row.pointer}><summary>Evidence and warnings</summary><p>{row.reasons.join(' · ')||'Unreviewed retained candidate'}</p><p>Combined JSON Pointer: {row.pointer}</p><p>Extracted: {row.evidencePath??'Unavailable'}#{row.evidencePointer??'Unknown'}</p><p>PDF: {row.pdfPath??'Not applicable'} · Physical page: {row.page??'Unknown'} · Raw API locator: {row.rawLocator??'Not applicable'}</p><p>Source hash: {row.sourceHash}</p></details>])}/>
 <p>Rows {r.totalRows===0?0:r.page*r.pageSize+1}–{Math.min((r.page+1)*r.pageSize,r.totalRows)} of {r.totalRows}. No derived metrics or latest-wins selection.</p>
 {r.page>0&&<Link href={`/vn30/${r.ticker}?variant=${v.index}&page=${r.page-1}`}>Previous rows</Link>}{' '}{(r.page+1)*r.pageSize<r.totalRows&&<Link href={`/vn30/${r.ticker}?variant=${v.index}&page=${r.page+1}`}>Next rows</Link>}
 </>}
 </Panel></div>;
}
