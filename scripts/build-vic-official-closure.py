"""Build the bounded VIC official-source research successor; read-only accounting."""
import hashlib
import json
from pathlib import Path
from decimal import Decimal
from lib.vic_event_admission import TARGET, validate_event

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-03/vic-official-closure-v1'
SEC='https://www.sec.gov/Archives/edgar/data/1913510/000110465926052266/'

def write(name, value):
    (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')


def build():
    # Derived factual readings, not publisher-original HTML or a native VAS audit.
    rows=[
      dict(id='SEC-TAX',url=SEC+'R27.htm',locator='Note 19.1–19.3; FY2025 VND million columns',
        framework='US_GAAP',scope='VINFAST_AUTO_CONSOLIDATED',period='FY2025',unit='VND_MILLION',
        currentTaxExpense='-850',deferredTaxExpense='358139',totalTaxExpense='357289',cashTaxPaid='55168',
        ownerDonationTaxReconciliationEffect='2300017',licenseGrossDeferredTaxAsset='2228752',
        spunOffTaxLossesBillionVnd='44125.2',
        finding='Owner cash donations are taxable. Reconciliation effect is not event current tax. Gross license DTA is not a realized credit. Spun-off losses cannot offset VinFast indiscriminately.'),
      dict(id='SEC-SPINOFF',url=SEC+'R11.htm',locator='Note 3; Novatech paragraph',
        finding='Common-control disposal difference is equity under US GAAP. It cannot replace the VAS gain or prove VAS parent/NCI P&L attribution. License offset and cash settlement are distinct.'),
      dict(id='SEC-DPS',url=SEC+'R30.htm',locator='Note 22.1–22.2',
        finding='DPS2 is a fair-value financial liability bundle. Other DPS are equity/NCI with differing conditional dividend rights. October 1, 2025 changes affect conversion/exchange terms; closing ownership and coupon rates do not establish event profit rights.'),
      dict(id='SEC-LICENSE',url=SEC+'vfs-20251231xex4d30.htm',locator='Article 5.3(b)–(d)',
        finding='Tax allocation clauses overlap: licensor bears taxes on payments, while licensee also bears stated withholding/VAT and other taxes above the net fee. Contract terms do not identify actual income-tax expense or paid tax. Some terms are redacted.'),
      dict(id='SEC-AMENDMENT',url=SEC+'vfs-20251231xex4d31.htm',locator='Schedule 3, Articles 2.1 and 3.1; signed November 20, 2025',
        signedDate='2025-11-20',statedEffectiveDate='2025-08-22',feeVnd='25198912075650',
        finding='Fixed whole-duration fee; actual performance does not reprice it. Replaces Schedule 2 from original effective date. Forecast basis is not a recurring annual royalty; payment deadline remains redacted.'),
      dict(id='SEC-20F',url=SEC+'vfs-20251231x20f.htm',locator='FY2025 equity statement; auditor opinion; exhibit index',
        finding='US GAAP with native VND million columns; no USD conversion needed for native amounts. Novatech and DPS NCI equity movements are not P&L attribution. November license amendment must accompany August agreement.'),
      dict(id='IR-ACCESS',url='https://vinfastauto.com/vn_vi/thong-bao',locator='Notice March 28, 2026, audited FY2025 reports and access paragraph',
        finding='Annual VAS reports announced; accessible text did not expose a usable report download. Notice specifies bondholder access at TCBS with identity/ownership proof. No private access attempted.'),
      dict(id='IR-CATALOG',url='https://vinfastauto.com/vn_vi/hop-dong-va-chinh-sach/thong-tin-trai-phieu/bao-cao-tai-chinh/2025',locator='Financial report entries',
        finding='Public catalog lists June 2025 standalone/consolidated reports; these precede Novatech and cannot close annual event attribution.'),
      dict(id='IR-CURRENT',url='https://vinfastauto.us/investor-relations',locator='Reports table, Q4/2025',
        finding='Current official IR links SEC quarterly results; they do not supply a native VAS tax/parent-NCI bridge. Legacy ir.vinfastauto.us endpoint unavailable through web reader.')]
    for r in rows:
        r.update(reviewedOn='2026-11-03',captureMode='WEB_TOOL_DERIVED_FACT_READING',originalSourceSha256=None,productionAdmitted=False)
    write('official-findings.json',dict(contract='vic-official-derived-findings-v1',rows=rows,
      integrityLimitation='Public pages read through web tool; CLI original-byte requests returned 403. Derived readings do not attest original bytes. Historical checked VAS PDF evidence remains separate.'))
    prior=json.loads((OUT.parent/'vic-tax-attribution-v1/transaction-requirements.json').read_text())
    events=[]
    for r in prior['requirements']:
        event=dict(TARGET,eventId=r['eventId'],legalEntity=None,economicDate=None,
          pretaxVnd=r['knownPretaxValueVnd'],currentTaxExpenseVnd=None,deferredTaxExpenseVnd=None,
          afterTaxParentVnd=None,afterTaxNciVnd=None,bindings={})
        # Group annual amounts are known; exact entity/event-date bindings are still unavailable.
        events.append(dict(proposal=event,validation=validate_event(event,{})))
    decision=dict(contract='vic-official-research-closure-v1',sourceScopeStatus='OWNER_APPROVED_RESEARCH_ONLY',
      supersedesPendingScopeRequest='vic-tax-attribution-v1/SOURCE_SCOPE_REQUEST.md',events=events,
      selectedAcceptedNormalizedCommonEarningsVnd=None,selectedAcceptedEps=None,
      financialAcceptance='BLOCKED',productionApplication='NOT_AUTHORIZED_NOT_EXECUTED',
      remainingDependencies=[
        'VinFast Trading and Production JSC FY2025 audited VAS financial statements and tax notes, covering both sponsor and Novatech events',
        'Event current/deferred tax allocation and VAS consolidation bridge to VIC; aggregate tax reconciliation cannot substitute',
        'Event-date preference waterfall and VAS after-tax parent/NCI allocation, including intragroup elimination',
        'Existing remaining VIC fund, recurring disposal/cycle and share-denominator acceptance gates remain open'],
      newEvidenceNeeded='Native VinFast JSC FY2025 VAS report/notes or equivalent audited event tax and parent/NCI bridge; not another VIC parent report',
      officialSourcesExhaustivelyUnavailable=False,
      authorityGranted=dict(financial=False,production=False,scoring=False,nav=False,trading=False))
    write('decision.json',decision)
    write('arithmetic-checks.json',dict(
      taxIdentityPass=Decimal('-850')+Decimal('358139')==Decimal('357289'),
      exactLicenseFeeVnd='25198912075650',
      vasDisplayedLicenseMillionVnd='25198912',
      feeMinusRoundedDisplayVnd=str(Decimal('25198912075650')-Decimal('25198912')*1000000),
      differenceIsAdditionalExpense=False,
      allActualProposalsBlocked=all(not e['validation']['eventEvidenceComplete'] for e in events)))
    paths=['owner-source-authorization.json','acquisition-manifest.json','official-findings.json','decision.json','arithmetic-checks.json']
    paths += [p for p in ('REPORT.md', 'validation.json') if (OUT/p).exists()]
    write('manifest.json',dict(contract='vic-official-research-manifest-v1',files=[dict(path=p,sha256=hashlib.sha256((OUT/p).read_bytes()).hexdigest()) for p in paths],
      originalSourceBytesClaimed=False,acceptedFinancialValue=None))

if __name__=='__main__':build()
