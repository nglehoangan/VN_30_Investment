"""Build the scoped S4 review from retained evidence; no network or database writes."""
import collections
import datetime as dt
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import sys

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).parent


def read(path):
    return json.loads((ROOT/path).read_text())


def save(name,data):
    (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')


def sha(path):
    digest=hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda:handle.read(1024*1024),b''):digest.update(block)
    return digest.hexdigest()


def main():
    if '--historical-pre-owner-policy-review' not in sys.argv:
        raise SystemExit('Archived pre-owner-policy review only. Current policy: docs/fundamental-data-engine/CAFEF_RAW_CLOSE_ONLY_POLICY.md; S4-R4 is CLOSED_BY_SCOPE_EXCLUSION. Use --historical-pre-owner-policy-review only to replay historical audit output, never current acceptance.')
    price_path='data/market-history/cafef/VNM.json'
    prices=read(price_path)
    after=read(str(OUT.relative_to(ROOT)/'ACTIONS_AFTER.json'))
    again=read(str(OUT.relative_to(ROOT)/'ACTIONS_FINAL_RERUN.json'))
    actions=read(after['manifest']);rerun=read(again['manifest'])
    assert sorted(actions['events'],key=lambda x:x['EventID'])==sorted(rerun['events'],key=lambda x:x['EventID'])
    pmap={p['date']:p for p in prices['prices']}
    daily=pmap['2026-10-30'];raw=daily['raw']
    assert len(pmap)==len(prices['prices'])==1197
    lineage_errors=[]
    sources={r['sha256']:r for r in prices['requests']}
    for r in prices['requests']:
        if hashlib.sha256(r['rawResponse'].encode()).hexdigest()!=r['sha256']:lineage_errors.append(r['url'])
    for p in prices['prices']:
        if p['raw'] not in json.loads(sources[p['responseSha256']]['rawResponse'])['Data']['Data']:lineage_errors.append(p['date'])
    for a in actions['requests']:
        assert hashlib.sha256(a['rawResponse'].encode()).hexdigest()==a['sha256']
    assert not lineage_errors
    dates=set(pmap);gap_days=[];day=dt.date(2022,1,1)
    while day<=dt.date(2026,10,30):
        if day.weekday()<5 and day.isoformat() not in dates:gap_days.append(day.isoformat())
        day+=dt.timedelta(days=1)
    calendar=read('src/shared/hose-display-calendar-2026.json')
    unexplained_2026=[d for d in gap_days if d.startswith('2026') and d not in calendar['holidays']]
    old_year_gaps=[d for d in gap_days if not d.startswith('2026')]
    # Document dates read from rendered PDFs, not guessed announcement dates.
    document_dates={147849:'2021-12-24',157497:'2022-06-24',157500:'2022-06-24',163678:'2022-12-12',
                    173284:'2023-07-25',173285:'2023-07-25',178865:'2023-12-14',181931:'2024-03-07',
                    190659:'2024-08-30',190660:'2024-08-30',194066:'2024-12-11',201036:'2025-05-07',
                    209559:'2025-10-06',209560:'2025-10-06',222269:'2026-06-18'}
    official_by_id={222269:'https://vsdc.vn/vi/ad1/197038',209559:'https://vsdc.vn/vi/ad1/187729',
                    209560:'https://vsdc.vn/vi/ad1/187729',201036:'https://vsdc.vn/vi/ad1/182377',
                    194066:'https://vsdc.vn/vi/ad1/177392',190659:'https://vsdc.vn/vi/ad1/174349',
                    190660:'https://vsdc.vn/vi/ad1/174349',181931:'https://vsdc.vn/vi/ad1/168521'}
    reviewed=[]
    for e,n in zip(actions['events'],actions['normalizedEvents']):
        f=next(f for f in actions['files'] if e['EventID'] in f['eventIds'])
        assert sha(ROOT/f['path'])==f['sha256']
        value='1850' if e['EventID']==222269 else n['cashDividendVndPerShare']
        period=re.search(r'/(\d{4})',e['Note'])
        reviewed.append({**n,'providerCashVndPerShare':n['cashDividendVndPerShare'],
                         'reviewedCashVndPerShare':value,'fiscalYear':int(period[1]) if period else None,
                         'documentDate':document_dates[e['EventID']], 'announcementDate':None,
                         'cashSource':'VISUALLY_CHECKED_PDF', 'reviewMethod':'ALL_RELEVANT_PDF_PAGES_VISUALLY_CHECKED',
                         'pdfEvidence':{'pdfPath':f['path'],'page':2 if e['EventID']==181931 else 1,
                                        'href':f['path']+'#page='+str(2 if e['EventID']==181931 else 1),'sha256':f['sha256']},
                         'officialCrosscheck':official_by_id.get(e['EventID']),
                         'providerConflict':e['EventID']==222269,'status':'RESEARCH_RECONCILED_NOT_FORMALLY_ADMITTED'})
    fiscal=collections.Counter();ex_year=collections.Counter();payment_year=collections.Counter()
    for e in reviewed:
        amount=int(e['reviewedCashVndPerShare']);fiscal[e['fiscalYear']]+=amount
        ex_year[e['exRightsDate'][:4]]+=amount;payment_year[e['paymentOrEffectiveDate'][:4]]+=amount
    official=read(str(OUT.relative_to(ROOT)/'OFFICIAL_SOURCE_RECEIPTS.json'))
    future_source=next(s for s in official if '2508698' in s['url'])
    future={'eventKey':'VNM-CASH-2026-INTERIM1','eventType':'CASH_DIVIDEND','announcementDate':'2026-10-28',
            'announcementDateBasis':'ISSUER_DISCLOSURE_EXPLICITLY_STATES_PUBLICATION_DATE',
            'cashDividendVndPerShare':'2500','recordDate':'2026-11-12','paymentDate':'2026-11-26',
            'exRightsDate':None,'exRightsDateLimitation':'Issuer 28Oct PDF and VSDC page do not explicitly state ex-date; later calendar 11Nov is post-cutoff evidence only.',
            'knownBeforeCutoff':True,'effectiveByCutoff':False,'issuerDisclosure':future_source,
            'vsdcNotice':'https://vsdc.vn/vi/ad1/201961','vsdcCorrection':'https://vsdc.vn/vi/ad1/202037',
            'cutoffCorrection':'30Oct16:19:55 local purpose wording only; after close, within date-level EOD cutoff',
            'notAnAdditionalReceivedDividend':True}
    save('CORPORATE_ACTION_REVIEW.json',{'manifest':after['manifest'],'rerunManifest':again['manifest'],
         'events':reviewed,'announcementKnownFutureEvent':future,'correctionsAreNotNewDistributions':[
             {'url':'https://vsdc.vn/vi/ad1/182559','scope':'ID-document wording only; dates and amount unchanged'},
             {'url':'https://vsdc.vn/vi/ad1/202037','scope':'interim dividend purpose wording only; dates and amount unchanged'}],
         'fiscalEntitlementTotalsWithinRetrievedScope':dict(fiscal),'exRightsYearTotalsWithinScope':dict(ex_year),
         'paymentYearTotalsWithinScope':dict(payment_year),'selectedGrossTotalVndPerShare':sum(ex_year.values()),
         'rawApiGrossTotalVndPerShare':sum(int(e['providerCashVndPerShare']) for e in reviewed),
         'fullFiscalYearCoverage':{'2021':False,'2022':None,'2023':None,'2024':None,'2025':None,'2026':False},
         'fiscalCoverageNote':'Fiscal labels retained and checked against PDF captions; sums are scoped observations, not exhaustive issuer certification.'})
    # Recheck existing immutable DB observation without copying API raw bytes.
    c=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro&immutable=1',uri=True)
    key='TCBS_API_RESPONSE:fff0b29bda17b3336f131f0e408fb1d155eb7cf7e95f138bd29520a386c59283'
    row=c.execute('select body,body_hash from broker_observation where id=?',(key,)).fetchone();c.close()
    tcbs=json.loads(row[0]);assert hashlib.sha256(row[0].encode()).hexdigest()==row[1]
    assert hashlib.sha256(tcbs['raw'].encode()).hexdigest()==tcbs['rawSha256']
    comparisons=[]
    for i,bar in enumerate(tcbs['data']['data']):
        date=bar['tradingDate'][:10];r=pmap[date]['raw']
        comparisons.append({'date':date,'tcbsLocator':'sqlite:broker_observation/'+key,
                            'tcbsJsonPointer':f'/data/data/{i}','tcbsRawSha256':tcbs['rawSha256'],
                            'ohlcEqualAfterUiUnitConversion':all(Decimal(str(r[a]))*1000==Decimal(str(bar[b])) for a,b in
                                [('GiaMoCua','open'),('GiaCaoNhat','high'),('GiaThapNhat','low'),('GiaDongCua','close')]),
                            'cafefMatchedVolume':r['KhoiLuongKhopLenh'],'tcbsVolume':bar['volume'],
                            'volumeDifference':r['KhoiLuongKhopLenh']-bar['volume'],
                            'volumeDefinitionReconciled':False})
    contracts=[
        {'contract':'Historical price coverage','result':'PARTIAL','reason':'1197 available provider rows retrieved; 29–30Jan2026 absent against retained HOSE display calendar, plus 2025-08-14 suspected; full 2022–25 official session calendar not bound.'},
        {'contract':'Price units and dates','result':'PASS','reason':'CafeF own HTML declares thousand VND and maps raw close/adjusted close separately; exact 30Oct row=56.9×1000=56900 VND; API itself still has no unit field.'},
        {'contract':'Price adjustment methodology','result':'UNKNOWN','reason':'No endpoint-specific adjustment formula, action factors, rounding, anchor/as-known policy or price raw-method declaration supplied.'},
        {'contract':'Corporate action coverage','result':'PARTIAL','reason':'15 tab1 cash components + one known-by-cutoff future cash event; splits/reverse splits/treasury/rights/capital register completeness not certified.'},
        {'contract':'Corporate action source verification','result':'PARTIAL','reason':'All 15 components visually matched to 11 mirrored HOSE PDFs; 8 components also checked on official VSDC pages, one PDF byte-identical to official HOSE; broader source chronology/announcement timestamps incomplete.'},
        {'contract':'Share-count reconciliation','result':'PARTIAL','reason':'2089955445 matches retained FY22–25, 2026 anchors/profile and no share-changing event in retrieved subset; not a complete through-cutoff issued/treasury/outstanding bridge.'},
        {'contract':'Historical cutoff compatibility','result':'PARTIAL','reason':'Raw dated candidate and pre-cutoff announcement separated from future payment; API retrieved11Nov cannot prove historical adjustment vintage/as-known eligibility.'},
        {'contract':'Formal evidence/source authority','result':'PENDING','reason':'No source promotion/admission, seal or CIO adoption performed; vendor agreement is not independence.'}]
    protected=[]
    baseline=read(str(OUT.relative_to(ROOT)/'BASELINE.json'))
    for f in baseline['files']:
        if not f['path'].startswith('skills/'):
            actual=sha(ROOT/f['path']);protected.append({'path':f['path'],'beforeSha256':f['sha256'],'afterSha256':actual,'unchanged':actual==f['sha256']})
    save('PROTECTED_AFTER.json',protected)
    summary={'schemaVersion':1,'ticker':'VNM','exchange':'HOSE','baseline':baseline['gitHead'],
             'requestedStart':'2022-01-01','requestedEnd':'2026-10-30',
             'skills':[{'path':'skills/fetch-cafef-price-history/SKILL.md','modified':True},
                       {'path':'skills/fetch-vietstock-dividend-pdfs/SKILL.md','modified':True}],
             'price':{'path':price_path,'sha256':sha(ROOT/price_path),'count':len(pmap),'earliest':min(dates),'latest':max(dates),
                      'annualCounts':dict(sorted(collections.Counter(d[:4] for d in dates).items())),
                      'exactRangeRequests':43,'uniqueRetainedRequestsIncludingProbes':len(prices['requests']),
                      'windowBoundaryDuplicatesFirstRun':3,'storedDuplicates':0,'storedConflicts':len(prices['conflicts']),
                      'cutoffObservation':daily,'cutoffCloseVnd':str(Decimal(str(raw['GiaDongCua']))*1000),
                      'cutoffAdjustedVnd':str(Decimal(str(raw['GiaDieuChinh']))*1000),
                      'unitSource':'CAFEF_UNIT_SOURCE.json','methodology':None,'adjustmentAnchor':None,
                      'weekdayGaps':gap_days,'gapCount':len(gap_days),'missingAgainst2026DisplayCalendar':unexplained_2026,
                      'olderWeekdayGapsUnclassified':old_year_gaps,'suspected2025Gap':'2025-08-14',
                      'weekendObservations':[d for d in dates if dt.date.fromisoformat(d).weekday()>=5],
                      'lineageErrors':lineage_errors,'tcbsComparison':comparisons},
             'corporateActions':{'events':15,'uniqueExDates':len({e['exRightsDate'] for e in reviewed}),
                                 'earliestExDate':min(e['exRightsDate'] for e in reviewed),'latestExDate':max(e['exRightsDate'] for e in reviewed),
                                 'cashEvents':15,'stockOrOtherEventsObserved':0,'zeroDoesNotCertifyNoOtherActions':True,
                                 'pdfsReused':11,'pdfsDownloadedBySkill':0,'pagesFirstRun':1,'pagesRerun':2,
                                 'sameEventsOnRerun':True,'additionalFutureKnownEventCount':1,
                                 'conflicts':[{'eventId':222269,'rawApiVnd':'1800','pdfAndVsdcVnd':'1850','resolution':'PRESERVE_RAW_USE_PDF_AS_RESEARCH_CANDIDATE'}]},
             'emptyRange':{'price':'VALID_EMPTY_RECEIPT','events':'HTTP200_EMPTY_BODY_REJECTED_AND_RETAINED_NOT_NO_EVENTS_CERTIFICATE'},
             'tests':read(str(OUT.relative_to(ROOT)/'TEST_RESULTS.json')),
             'skillValidators':{'price':'PASS','corporateActions':'PASS','runtime':'PYTHONPATH=/tmp/vnm-s4-deps; PyYAML installed in temporary target'},
             'contracts':contracts,'status':'BLOCKED',
             'closureChecklist':{'denominator':8,'definition':'Eight acceptance contracts explicitly requested by task; each counts only if fully PASS; no partial credit or weighting.',
                                 'fullyPassed':1,'percentage':12.5,'interpretation':'Scoped contract completion, not valuation confidence, production readiness or an approved M3 rubric.'},
             'productionAdmissible':False,'valuationRubricsUnlocked':False,
             'valuationUse':'56900 VND dated raw-close research candidate only; no accepted expected-return/adjusted total-return series.',
             'smallestNextAction':'Obtain provider endpoint-specific raw/adjusted-price specification including adjustment factors, anchor date and as-known revision policy for the selected 30Oct2026 observation.',
             'protectedUnchanged':all(x['unchanged'] for x in protected),'stop':'CIO_REVIEW_NO_NEXT_MILESTONE'}
    save('VNM_S4_VALIDATION_RESULTS.json',summary)
    table='\n'.join(f"| {c['contract']} | {c['result']} | {c['reason']} |" for c in contracts)
    (OUT/'VNM_S4_ACCEPTANCE.md').write_text(f'''# VNM S4 acceptance — BLOCKED

Scope: VNM/HOSE, 2022-01-01 through 2026-10-30. Reviewed baseline `{baseline['gitHead']}`. This closes the bounded skill execution/reconciliation task for CIO review; it does not close S4 or reopen other milestones.

| Contract | Result | Evidence / exact residual |
| --- | --- | --- |
{table}

**Checklist completion: 1/8 = 12.5%.** Denominator is the eight contracts requested in this task, fully PASS only, no partial credit or weighting. This is a measurable review checklist count; it is not a production-readiness percentage, a valuation probability, or a change to M3 definitions. Mandatory method/register/authority requirements remain insufficient, hence BLOCKED rather than CLOSED. Data acquisition success alone cannot satisfy them.

The 56,900 VND/share raw-close candidate can support a labelled historical research sensitivity. S4 does not yet unlock VAL-PRIMARY, VAL-RET or VAL-MOS. No valuation recalculation, new /100 score, BUY/SELL decision, owner-policy change or production admission is made. Other existing valuation blockers are outside this review.

Single smallest next action: {summary['smallestNextAction']} This does not by itself remove the separately listed action-register, session-gap and authority requirements.

STOP for CIO review. No S1/S2/S3/S5/B7/B8 or new readiness cycle started.
''')
    (OUT/'VNM_S4_PRICE_HISTORY_VALIDATION.md').write_text(f'''# VNM price history validation

Data: `{price_path}` (one JSON/ticker, no extra raw price copies). **1,197 unique daily rows**, {min(dates)}–{max(dates)} within requested 2022-01-01–2026-10-30. Counts by year: {json.dumps(summary['price']['annualCounts'])}. All 43 exact-range pages/windows retrieved, 1,200 returned rows including 3 overlapping boundary dates, 0 stored duplicate dates/conflicts. Source URL, parameters, UTC receipt, HTTP status, exact raw text/hash are in `requests`; every selected raw row matches its referenced response. Checks do not treat every calendar date as a session.

Original execution failed TLS certificate verification with system Python; no history file was written. A second diagnostic using the original DD/MM request format returned 11Nov outside cutoff and was rejected. Exact-range CLI, platform curl TLS with bounded retries, MM/DD request dates, DD/MM response parsing and range/order/numeric/OHLC guards were added. Source HTML confirms both US-format request construction and field rendering. Full-range rerun returned 0 new, 1,200 duplicate rows and 0 conflicts; it kept all 1,197 selected rows unchanged. Optional request evidence preserves no-change/empty pages in the same JSON.

30Oct raw OHLC = 57.7 / 57.7 / 56.7 / 56.9; adjusted close=54.44. CafeF's own history header declares thousand VND, so raw close=56,900 and adjusted close=54,440 VND/share. The exact API has no unit/method field, so its original `units:null` is preserved; explicit research conversion uses `CAFEF_UNIT_SOURCE.json` and `cafef-history-page.html`, not amount equality. Both raw and adjusted fields are separate in provider UI code. No provider formula, factor series, revision vintage, rounding rule or adjustment anchor is documented in the retrieved endpoint/page. A later retrieval of an earlier date is not automatically an as-known adjusted series. No cash dividend is added to adjusted returns or deducted again.

Missing-session review: {len(gap_days)} weekdays absent across the period, not automatically errors/holidays. Retained 2026 display calendar lists 13 holidays; **2026-01-29 and 2026-01-30 remain missing** from 2026's expected 204 dates (observed202). Exact short-range requery returned only28Jan and2Feb. **2025-08-14** also remains absent in a13–15Aug probe; official2022–25 calendars are not bound, so earlier gaps remain explicitly unclassified rather than assigned invented holidays. All dates are listed in `VNM_S4_VALIDATION_RESULTS.json`. Zero weekend observations. Calendar authority remains display/research scoped.

Read-only TCBS comparison rechecks stored body and raw hashes in SQLite without copying raw data. OHLC on29/30Oct matches after explicit CafeF unit conversion. Volumes differ:29Oct CafeF1,335,300 vs TCBS1,339,281 (-3,981);30Oct CafeF2,982,300 vs TCBS2,981,500 (+800). Volume definitions remain unresolved; do not declare entire bars equal. Existing Vietstock profile also reports56,900 at30Oct, not independent-source certification.

Actual weekend query24–25Oct2026 returned a valid empty price list with total0, retained as receipt; the existing history remains. Synthetic partial-page failures/invalid fields/wrong ticker/out-of-range/ordering are rejected, with atomic old-file preservation. See `TEST_RESULTS.json` and scoped test source. No full repository suite was run.
''')
    rows='\n'.join(f"| {e['eventId']} | {e['exRightsDate']} | {e['recordDate']} | {e['paymentOrEffectiveDate']} | {e['fiscalYear']} | {e['providerCashVndPerShare']} | {e['reviewedCashVndPerShare']} |" for e in sorted(reviewed,key=lambda e:(e['exRightsDate'],e['eventId'])))
    (OUT/'VNM_S4_CORPORATE_ACTION_RECONCILIATION.md').write_text(f'''# VNM corporate action reconciliation

Exact-date skill run: **15 cash-dividend components, 11 ex-right dates, 11 retained PDFs reused**, no new PDF download by the skill. First run20/page returned1page; reruns10/page returned2pages with identical event objects. Existing broad-range manifest differs only in positional `Row` after filtering; stable EventID and financial fields agree. Normalized raw candidate dates/types/fields and all page raw bodies are in `{after['manifest']}`. No stock/bonus/rights/split/treasury action was returned; this is not a no-actions certificate.

All13 physical pages of the11 event PDFs were rendered and visually inspected. Sources/page/hash, document dates, period labels and reconciled amounts are in `CORPORATE_ACTION_REVIEW.json`. Announcement dates stay null where only document/signing dates are known. The 2021-announced event ex10Jan2022 remains included; publication date and effective-date filters are different dimensions.

| EventID | Ex-rights | Record | Payment | Fiscal label | API VND/share | PDF review VND/share |
| --- | --- | --- | --- | --- | ---: | ---: |
{rows}

**Material conflict:** Event222269 API/Note says1,800; its own HOSE1382 PDF page1 explicitly says18.5%=1,850, ex26Jun2026/record29Jun/payment17Jul. [Official VSDC notice](https://vsdc.vn/vi/ad1/197038) independently confirms the same terms. Raw API/normalized candidates remain untouched; research selection uses1,850 with the conflict retained. This is a verified field conflict, not an amount-based concept mapping.

**Known by cutoff but excluded by event-date query:** issuer disclosure dated/published28Oct2026 approves2,500 VND/share interim2026 dividend, record12Nov/payment26Nov. [VSDC29Oct notice](https://vsdc.vn/vi/ad1/201961) and [30Oct correction](https://vsdc.vn/vi/ad1/202037) corroborate it. Thus15 historical components plus1 announced future component are observed. Do not count the future cash as received or apply its ex-adjustment at30Oct. Ex-date is null in the cutoff-bound issuer/VSDC evidence; later calendar11Nov is post-cutoff context, not retroactive proof of original published ex-date.

Correction handling: VSDC8May2025 changes identification-document wording;30Oct2026 changes the description to interim advance. Neither creates a new cash distribution or changes amount/date. The latter notice is16:19:55 local, after exchange close but within a date-level EOD cutoff; no intraday as-known certification is made.

Year attribution (gross VND/share within retrieved scope): ex-rights year {json.dumps(dict(ex_year),sort_keys=True)}; payment year {json.dumps(dict(payment_year),sort_keys=True)}; fiscal labels {json.dumps(dict(fiscal),sort_keys=True)}. Raw API scoped total18,700; PDF-reviewed total18,750. FY2021 scope is partial and FY2026 announced2,500 is outside these effective/payment totals. These sums are not net account credits or exhaustive fiscal-year declarations. Distinguishing fiscal entitlement/payment timing explains why a payment-year number cannot substitute for declared fiscal DPS. Do not deduct dividends from price basis or add them to an already adjusted total-return chain.

Share-count candidate2,089,955,445 is compatible with these cash-only observations. Retained annual/share/EPS anchors FY22–25 and2026 snapshots match; par10,000×shares=20,899,554,450,000 VND capital. Full issued/treasury/outstanding movement through30Oct, all rights/ESOP/cancellation/buyback/split events and conversion effective dates remain unproven by tab1. Unspecified ratios/subscription price/split factor/shares issued/cancelled/repurchased stay null. No reconstruction of unrelated reports or S1/S2/S3/S5 is attempted.
''')
    (OUT/'VNM_S4_SOURCE_AUTHORITY.md').write_text('''# VNM S4 source authority

Acquisition/validation success and formal source acceptance are separate. All new data are VNM only. No source policy, authority document, admission decision, seal, accounting fact, scoring rubric or database row was changed.

| Source | Retained identity | Supports | Does not establish |
| --- | --- | --- | --- |
| CafeF API + own history HTML | `data/market-history/cafef/VNM.json`; `CAFEF_UNIT_SOURCE.json` | Actual dates, OHLC/raw-vs-adjusted field labels, UI thousand-VND unit | Adjustment method/anchor, as-known vintage, official exchange authority |
| Vietstock tab1 API | Exact/rerun manifests referenced in `CORPORATE_ACTION_REVIEW.json`; each page body/hash/UTC/status | 15 provider candidate rows with raw dates/FileUrl | Exhaustive capital register or correct cash values without PDF checking |
| Retained HOSE-authored PDFs mirrored at Vietstock | 11 existing PDF paths/hash/page bindings; all relevant pages visually checked | Dates, amounts and fiscal captions for15 components | Verified original publication timestamp/authenticity of every historical mirror |
| Official VSDC pages | `OFFICIAL_SOURCE_RECEIPTS.json`, retained HTML and `OFFICIAL_HTML_TEXT.json` |8 historical components, known-by-cutoff future dividend and2 wording corrections | Exhaustive multi-year rights/treasury/capital register |
| Official HOSE PDF Oct2025 | Official receipt reuses byte-identical retained Vietstock PDF, no duplicate PDF | Source-byte equality and terms350+2500 on16Oct2025 | Independence of vendor feeds |
| Issuer disclosure on HOSE Oct2026 | New official PDF path in `OFFICIAL_SOURCE_RECEIPTS.json` | Explicit publication28Oct; future2,500 dividend, record/payment dates | Proof of actual investor receipt or complete action universe |
| TCBS existing SQLite observation | `sqlite:broker_observation/TCBS_API_RESPONSE:fff0b29bda17b3336f131f0e408fb1d155eb7cf7e95f138bd29520a386c59283` | Hash-verified30Oct close56,900 and prior day's bars; no new raw copy | Declared adjustment method or matching volume definitions |
| Retained Vietstock30Oct profile | `data/manual-extracted-api/vietstock-profile-v1/20261030T121210Z/VNM.html` and prior bound research |56,900 close /2,089,955,445 listed/outstanding snapshot | Unbroken share movement register or independent upstream source |

The current owner request explicitly asks official issuer/HOSE/VSDC cross-checks. Only this bounded verification uses the exception to earlier Vietstock-only acquisition instructions; the reusable corporate-action downloader still blocks non-Vietstock hosts by default. No general permission/source promotion is inferred. No unrelated issuer/financial-report acquisition occurred.

HTTP status, receivedAt and SHA-256 are recorded for normal retrievals. Earlier reused-PDF receipts retain their historical limitations rather than inventing a new HTTP200/time. Raw landing HTML containing session token is not retained; a receipt hash is. API page bodies do not contain that token. Diagnostic date-format probes have exact raw bodies/hashes in the same ticker history JSON; `DATE_FORMAT_PROBES.json` holds pointers, not another raw price capture. Probe status/time were not captured and remain null; these probes are not used instead of fully receipted exact-range retrieval pages and their out-of-range rows are not selected into history.

Historical dates are not automatically as-known availability. PDF document/signing date is not silently treated as announcement date. All retrievals occurred11Nov after30Oct research cutoff. VSDC disclosed dates and issuer explicit publication can bind those specific events, but provider-adjustment vintage and full announcement chronology are still missing. Agreeing vendor closes do not prove independence or original exchange authority. Formal admission/CIO adoption remains PENDING.
''')
    (OUT/'FINAL_REVIEW.md').write_text(f'''# VNM S4 final review — BLOCKED, stop for CIO

1. **Both skills executed after minimal improvements.** Original price execution failed local Python TLS trust; original corporate skill was agent instructions with no reusable CLI. Price CLI now works for exact dates with corrected US-format API requests. Corporate helper executes the documented existing workflow. No user-level skill was modified or replaced.
2. **Actual retrieved data:**1,197 unique VNM daily rows04Jan2022–30Oct2026,43 pages across ≤1-year windows;15 tab1 cash components10Jan2022–26Jun2026 using11 retained PDFs. Official targeted checks add one2,500 dividend announced28Oct, record/payment inNovember, and preserve2 wording corrections without counting new distributions. Sources and every bound raw response/hash are retained; prices remain in one JSON/ticker.
3. **Changes necessary:** exact --start/--end; TLS-safe curl with bounded retry; correct MM/DD request versus DD/MM result; order/range/numeric/OHLC validation; optional empty/no-change receipts; corporate CLI with pagination, PDF reuse, nullable normalized fields, partial-failure receipts. See capability review and tests. Both skill validators pass using temporary PyYAML; scoped behavioral tests {summary['tests']['testsRun']}/{summary['tests']['testsRun']} pass. No full app test/lint/build/release campaign claimed.
4. **S4 BLOCKED.** Checklist1/8 fully PASS=12.5%, denominator exactly the8 task contracts, no partial credit. Useful retrieved evidence does not satisfy mandatory adjustment/register/authority requirements.
5. **Exact residual evidence:** provider adjustment formula/factor/rounding/anchor/revision/as-known declarations; complete issuer rights/ESOP/split/reverse-split/treasury/issuance/cancellation/outstanding bridge through30Oct; source/time admission and CIO adoption;29–30Jan2026 missing sessions against retained calendar,14Aug2025 suspected plus official2022–25 session-calendar binding; volume-definition differences (800 shares30Oct). Announcement dates not supplied stay null. The1,800-vs1,850 conflict is resolved for a labelled research selection usingPDF/VSDC, raw remains unchanged.
6. **Valuation rubric support:**56,900 VND raw-close historical research candidate is corroborated. Adjusted close54,440 is a separate as-retrieved provider series, not an accepted historical expected-return chain. S4 alone does not unlock VAL-PRIMARY/VAL-RET/VAL-MOS. No double dividend adjustment, score or BUY/SELL decision.
7. **Single next action:** obtain the endpoint-specific provider adjustment/anchor/as-known declaration for selected30Oct observation; other enumerated residuals remain after that action.

Protected existing SQLite and pinned research files unchanged: **{summary['protectedUnchanged']}**, hashes in `PROTECTED_AFTER.json`. `AGENTS.md` already had owner-requested skill routing before this task; no change to it in this review. Skill files were existing untracked project skills at task start, hashed in `BASELINE.json`; they were not assumed to be in the reviewed Git commit. No application code or unrelated skill changed. No production authority/seal, portfolio or transaction mutation, S1/S2/S3/S5/B7/B8, or next milestone was started.

Deliverables: `VNM_S4_SKILL_CAPABILITY_REVIEW.md`, `VNM_S4_PRICE_HISTORY_VALIDATION.md`, `VNM_S4_CORPORATE_ACTION_RECONCILIATION.md`, `VNM_S4_SOURCE_AUTHORITY.md`, `VNM_S4_ACCEPTANCE.md`, `VNM_S4_VALIDATION_RESULTS.json`, this `FINAL_REVIEW.md`. Reproduce offline analysis with `python3 {str(OUT.relative_to(ROOT)/'build_analysis.py')}` after running the scoped tests. STOP for CIO review.
''')
    print(json.dumps({'status':summary['status'],'prices':len(pmap),'events':15,'protectedUnchanged':summary['protectedUnchanged']}))


if __name__=='__main__':main()
