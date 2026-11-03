"""VIC parent/consolidated successor review; no source or production admission."""
import hashlib
import json
from decimal import Decimal, getcontext
from pathlib import Path
from lib.vic_claim_bridge import number, text, claim_bases, scenario_weight, exclusions
getcontext().prec=60
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance'
OUT=BASE/'2026-11-03/vic-parent-bridge-v1'
PRIOR=BASE/'2026-11-03/base-assumptions-v1'
ROUTES=ROOT/'docs/fundamental-data-engine/issuer-document-routes.json'


def load(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(name,x):(OUT/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')


def retained_source_inventory():
    # The inventory proves retained byte identity, not financial source admission.
    inventory={}
    def add(p,h):inventory.setdefault(p,set()).add(h)
    for issuer in load(ROUTES)['issuers']:
        if issuer['ticker']=='VIC':
            for d in issuer['documents']:
                for h in d['observedBodyHashes']:add(d['retainedPath'],h)
    prior=load(BASE/'2026-11-02/earnings-normalization-v3/manifest.json')
    for p,h in prior['sourcePins'].items():
        if p.endswith('.pdf') and '/VIC/' in p:add(p,h)
    agm=load(BASE/'2026-11-03/normalization-acceptance-v1/acquisition-manifest.json')
    for r in agm['rows']:
        if r['ticker']=='VIC':add(r['pdfPath'],r['sha256'])
    receipt=load(OUT/'acquisition-receipt.json');add(receipt['pdfPath'],receipt['sha256'])
    return inventory


def validate_reading(r,inventory):
    s=r['source'];units={'MILLION_VND':'1000000','BILLION_VND':'1000000000','VND':'1','PERCENT':'0.01','NARRATIVE':None}
    if r['multiplier']!=units[r['declaredUnit']]:raise ValueError('EXACT_NATIVE_UNIT_REQUIRED')
    if s['sha256'] not in inventory.get(s['pdfPath'],set()):raise ValueError('RETAINED_SOURCE_IDENTITY_REQUIRED')
    if sha(ROOT/s['pdfPath'])!=s['sha256']:raise ValueError('SOURCE_BYTES_CHANGED')
    receipt=load(OUT/'acquisition-receipt.json')
    if s['pdfPath']==receipt['pdfPath'] and s['retrievedAt']!=receipt['retrievedAt']:
        raise ValueError('EXACT_RECEIPT_TIME_BINDING_REQUIRED')
    if s['originalPublicationAt'] is not None:
        raise ValueError('UNSUPPORTED_ORIGINAL_PUBLICATION_TIME')
    if not r['review']['fullPageImageInspected'] or type(s['physicalPage']) is not int or s['physicalPage']<1:raise ValueError('REVIEWED_PHYSICAL_PAGE_REQUIRED')
    if r['productionAdmissible']:raise ValueError('READING_CANNOT_GRANT_AUTHORITY')
    for v in r['values'].values():number(v)


def quantity(rows,id_,key,*,scope,period,unit):
    r=rows[id_]
    if r['sourceScope']!=scope or r['economicPeriod']!=period or r['declaredUnit']!=unit:
        raise ValueError('EXACT_SCOPE_PERIOD_UNIT_BINDING_REQUIRED')
    return number(r['values'][key])*number(r['multiplier'])


def build():
    inventory=retained_source_inventory()
    readings=load(OUT/'checked-evidence.json')['rows']
    if len({r['id'] for r in readings})!=len(readings):raise ValueError('DUPLICATE_READING')
    rows={r['id']:r for r in readings}
    for r in readings:validate_reading(r,inventory)
    def q(id_,key,scope='CONSOLIDATED',period='FY2025',unit='MILLION_VND'):
        return quantity(rows,id_,key,scope=scope,period=period,unit=unit)
    pbt=q('VIC-G25-PNL','pbt');parent=q('VIC-G25-PNL','commonParentNpat')
    group=q('VIC-G25-PNL','groupNpat');nci=q('VIC-G25-PNL','nciResult')
    tax=q('VIC-G25-PNL','currentTax')+q('VIC-G25-PNL','deferredTaxExpense')
    if pbt-tax!=group or parent+nci!=group:raise ValueError('GROUP_TAX_OR_COMMON_NCI_IDENTITY')
    if tax!=q('VIC-G25-TAX','groupTaxExpense'):raise ValueError('GROUP_TAX_NOTE_MISMATCH')
    ps='STANDALONE_PARENT'
    standalone=q('VIC-P25-PNL','npat',ps)
    if q('VIC-P25-PNL','pbt',ps)-q('VIC-P25-PNL','currentTax',ps)+q('VIC-P25-PNL','deferredTaxIncome',ps)!=standalone:
        raise ValueError('PARENT_TAX_IDENTITY')
    common=q('VIC-G25-CLAIM','commonParentNpat');restricted=q('VIC-G25-CLAIM','restrictedReinvestment');eps=q('VIC-G25-CLAIM','epsNumerator')
    if common!=parent:raise ValueError('GROUP_PARENT_CLAIM_MISMATCH')
    claims=claim_bases(text(common),text(restricted),text(eps))
    sponsor=q('VIC-G25-SPONSOR','sponsorIncome')
    novatech=q('VIC-G25-NOVATECH','pnlGain',unit='BILLION_VND')
    movian=q('VIC-G25-OTHER-SALES','movianGain',unit='BILLION_VND')
    def component(event,amount,source,group=None):
        r=dict(eventId=event,amountVnd=text(amount),scope='CONSOLIDATED',economicPeriod='FY2025',
            role='IDENTIFIED_PNL_INCOME_OR_GAIN',evidenceId=source,sourceHash=rows[source]['source']['sha256'])
        if group:r.update(aggregateGroup=group,aggregationLevel='COMPONENT')
        return r
    grants=component('VIC-SPONSOR-FY2025',sponsor,'VIC-G25-SPONSOR')
    nova=component('VIC-NOVATECH-GAIN-FY2025',novatech,'VIC-G25-NOVATECH','DISPOSAL_GAINS')
    mov=component('VIC-MOVIAN-GAIN-FY2025',movian,'VIC-G25-OTHER-SALES','DISPOSAL_GAINS')
    # Recorded economic interests support scenarios, not per-event profit allocation.
    snapshots=[]
    for id_,period in [('VIC-G24-OWNERSHIP','AT_2024-12-31'),('VIC-G25-OWNERSHIP','AT_2025-12-31')]:
        r=rows[id_]
        percent=r['values']['vinfastJscInterest']
        weight=scenario_weight(entity='VINFAST_JSC',expected_entity='VINFAST_JSC',percent=percent,
            effective_period=period,mode='CONDITIONAL_SCENARIO_NOT_PROVEN_ATTRIBUTION')
        snapshots.append(dict(evidenceId=id_,snapshotPeriod=period,printedEconomicInterestPercent=percent,
            scenarioWeight=weight,exactEventDateWeightProven=False,printedPercentageIsExactUnrounded=False))
    conditional=[]
    for s in snapshots:
        for tax_rate in ['0','.2']:
            before=exclusions(text(eps),[grants],tax=tax_rate,common_weight=s['scenarioWeight'])
            value=exclusions(text(eps),[grants,nova],tax=tax_rate,common_weight=s['scenarioWeight'])
            economic=exclusions(text(common),[grants,nova],tax=tax_rate,common_weight=s['scenarioWeight'])
            conditional.append(dict(referenceSnapshot=s['snapshotPeriod'],commonWeightAssumption=s['scenarioWeight'],taxAssumption=tax_rate,
                grantOnlyDistributableCaseVnd=before,grantAndNovatechDistributableCaseVnd=value,
                economicCommonCaseBeforeReinvestmentRestrictionVnd=economic,
                incrementalNovatechImpactVnd=text(number(value)-number(before)),
                furtherMovianCommonAttributionStressVnd=exclusions(value,[mov],tax='0',common_weight='1'),
                exactVndEstimateClaimed=False,financiallyAccepted=False,
                qualifications=['All sponsor P&L is hypothetically allocated like VinFast JSC despite mainly qualifier',
                    'Novatech profit allocation hypothetically follows this snapshot despite changed preference rights',
                    'Transaction tax is assumed, not read from group ETR or aggregate tax reconciliation',
                    'Novatech is presented in whole-billion units; no rounding error bound is invented']))
    # Before-tax group arithmetic is separate from any parent/NCI attribution.
    partial_pbt=exclusions(text(pbt),[grants,nova])
    further_pbt=exclusions(text(pbt),[grants,nova,mov])
    known_total=sponsor+novatech+movian
    broad=dict(minimumVnd=text(eps-known_total),maximumVnd=text(eps),
        independentCommonIncidencePerComponent=True,scope='NAMED_COMPONENTS_ONLY',
        completeFundOrCycleBound=False,conditionalOwnershipReferencesCannotNarrowThisEnvelope=True)
    owner_plan=q('VIC-AGM-PLAN','ownerReservePlan','PARENT_AND_GROUP_PLAN','ACCUMULATED_TO_2025-12-31','VND')
    transfer=q('VIC-P26-RESERVE','reserveTransfer',ps,'H1_2026')
    if q('VIC-P26-RESERVE','reserveOpening',ps,'H1_2026')+transfer!=q('VIC-P26-RESERVE','reserveClosing',ps,'H1_2026'):
        raise ValueError('RESERVE_ROLL_FORWARD_MISMATCH')
    if q('VIC-P26-RESERVE','retainedOpening',ps,'H1_2026')+q('VIC-P26-RESERVE','periodNpat',ps,'H1_2026')-transfer!=q('VIC-P26-RESERVE','retainedClosing',ps,'H1_2026'):
        raise ValueError('RETAINED_PROFIT_ROLL_FORWARD_MISMATCH')
    reserve=dict(parentPlanReserveVnd=text(owner_plan),observedH1_2026ReserveTransferVnd=text(transfer),
        classification='OWNER_EQUITY_TRANSFER_NOT_NON_OWNER_EXPENSE',commonEarningsDeductionVnd='0',
        planParentNonOwnerAllocationVnd='0',basis='Explicit plan: reserve plus all remaining profit retained; limited to this parent plan',
        fullGroupNonOwnerLeakageVnd=None,planAndMovementAreCompatible=owner_plan==transfer,uniqueEventMatchingProven=False,
        fy2025ReserveTransferVnd=text(q('VIC-P25-RESERVE','reserveTransfer',ps)),
        fy2025And2026MovementsAreSeparate=True)
    originated=q('VIC-G25-LICENSE-SETTLEMENT','contractOriginatedPayable')
    offset=q('VIC-G25-LICENSE-SETTLEMENT','debtOffset');cash=q('VIC-G25-LICENSE-SETTLEMENT','cashSettlement')
    if offset+cash!=originated:raise ValueError('LICENSE_OFFSET_CASH_BRIDGE_MISMATCH')
    licensing=dict(contractOriginatedPayableVnd=text(originated),debtOffsetVnd=text(offset),cashSettlementVnd=text(cash),
        sumMatchesSource=True,wholeBillionHeadlineMinusDetailedTransactionVnd=text(q('VIC-G25-NOVATECH','licenseFee',unit='BILLION_VND')-originated),
        totalFeeIsFullCashOutflow=False,totalFeeIsFullPnlExpense=False,closingOtherPayablesInferredZero=False,
        sourcePrecisionVariantsPreserved=True)
    preference=dict(demergerEffectiveDate=rows['VIC-P25-NOVATECH-PREFERENCE']['demergerEffectiveDate'],
        standaloneTradingInvestmentCostVnd=text(q('VIC-P25-NOVATECH-PREFERENCE','tradingInvestmentCost',ps)),
        classification='BALANCE_SHEET_ASSET_NOT_ADDITIONAL_CURRENT_PNL',
        preferenceExchangeReported=True,transferArrangementsReported=True,transactionProfitWaterfallProven=False,
        acceptedMarketValueVnd=None)
    findings=[
      dict(issueId='VIC-SCOPE-01',status='RESOLVED_READING_AND_CONTROL',evidence=['VIC-P25-PNL','VIC-G25-PNL'],
        conclusion='Standalone parent NPAT 944059m is distinct from consolidated parent-attributable 11349934m; no replacement or addition.'),
      dict(issueId='VIC-RESERVE-02',status='RESOLVED_PARENT_PLAN_CLASSIFICATION_GROUP_COVERAGE_OPEN',evidence=['VIC-AGM-PLAN','VIC-AGM-APPROVAL','VIC-P26-RESERVE'],
        conclusion='5bn reserve is owner equity transfer. No common-earnings deduction; all-group employee-fund completeness not inferred.'),
      dict(issueId='VIC-OWNERSHIP-03',status='REFERENCE_OBSERVATIONS_RESOLVED_EVENT_ALLOCATION_OPEN',evidence=['VIC-G25-OWNERSHIP','VIC-G24-OWNERSHIP','VIC-P25-DIRECT-CAPITAL','VIC-P25-PREFERRED','VIC-H125-SUBSEQUENT','VIC-P25-NOVATECH-PREFERENCE'],
        conclusion='Voting, effective interest and direct capital differ; preference/conversion changes prevent treating 50.60% as exact event attribution.'),
      dict(issueId='VIC-NOVATECH-04',status='PRIOR_MODEL_MATERIAL_OMISSION_REMEDIATED_IN_REVIEW',evidence=['VIC-G25-NOVATECH','VIC-G25-DISPOSALS','VIC-G25-LICENSE-SETTLEMENT','VIC-P25-NOVATECH-PREFERENCE'],
        conclusion='Add separate 34395bn disposal-gain exclusion sensitivity; license fee 25199bn is not an additional full P&L expense; no aggregate/component duplication.'),
      dict(issueId='VIC-GRANT-05',status='DONOR_AND_SCOPE_ROUTED_RECEIPT_ALLOCATION_OPEN',evidence=['VIC-G25-SPONSOR','VIC-G25-RELATED-SPONSOR','VIC-G26-SPONSOR'],
        conclusion='23000bn related-party grant transactions and 23054.157bn P&L sponsor income are not forced into an exact event match; H1 comparative is not annual.'),
      dict(issueId='VIC-TAX-06',status='TRANSACTION_TAX_OPEN',evidence=['VIC-G25-TAX'],
        conclusion='Group loss DTA/disposal reconciliation cannot identify tax of grant or Novatech. Scenario 0/20% remains explicitly assumed.'),
      dict(issueId='VIC-CYCLE-07',status='REMAINING_DISPOSALS_AND_CYCLE_OPEN',evidence=['VIC-G25-OTHER-SALES','VIC-G25-DISPOSALS'],
        conclusion='Movian technology gain separately stressed. Property project rotation and remaining gains need their own recurrence review; not all 39723.679bn deleted as one-off.')]
    result=dict(contract='vic-parent-group-closure-review-v1',ticker='VIC',period='FY2025',analysisMode='AS_REVISED_CURRENT_RESEARCH',
        actor='CHATGPT',reviewMode='OWNER_AUTHORIZED_AI_SELF_REVIEW_NOT_INDEPENDENT_ACCEPTANCE',
        predecessorVICModelStatus='GRANT_ONLY_MODEL_REJECTED_AS_INCOMPLETE_FOR_NORMALIZATION',
        claims=claims,standaloneParentNpatVnd=text(standalone),groupNetIncomeVnd=text(group),groupNciResultVnd=text(nci),
        components=[grants,nova,mov],ownerReferenceSnapshots=snapshots,conditionalCases=conditional,
        partialGroupPbtAfterGrantAndNovatechVnd=partial_pbt,partialGroupPbtAfterAlsoMovianVnd=further_pbt,
        partialPbtIsAcceptedNormalizedCommonEarnings=False,unconditionalNamedComponentsEnvelope=broad,
        unexcludedDisposalGainRemainderNominalVnd=text(q('VIC-G25-DISPOSALS','disposalGains')-novatech-movian),
        remainingFinanceGainsAreQualifiedRecurring=False,
        relatedPartyGrantVsPnlDifferenceVnd=text(sponsor-q('VIC-G25-RELATED-SPONSOR','chairmanSponsorTransactions')),
        differenceIsProvenUnallocatedGrant=False,reserveDisposition=reserve,licenseSettlementBridge=licensing,
        novatechPreferenceClaim=preference,closureMatrix=findings,
        financialAcceptanceDecision='BLOCKED_MATERIAL_TRANSACTION_ATTRIBUTION_TAX_AND_RECURRING_EARNINGS',
        selectedAcceptedNormalizedCommonEarningsVnd=None,selectedAcceptedEps=None,
        newPersonalOwnerEvidenceRequired=False,additionalParentReportRequiredForThisScope=False,
        preciseRemainingEvidence=[
            'VinFast JSC/VinFast Auto FY2025 audited statements or equivalent schedules for grant recipient, tax and parent/NCI allocation; reconcile accounting basis/currency/perimeter before using foreign US-GAAP/USD reports',
            'Preference/conversion terms and ownership/claim waterfall at August demerger and September Novatech disposal; not just year-end percentages',
            'Novatech disposal gain/tax/NCI and license/cash/other-payable reconciliation; preserve exact versus whole-billion presentation',
            'Movian and property-disposal recurrence plus subsidiary employee-fund common-owner scope'],
        sourceAuthorityPromoted=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False,
        ledgerPostingExecuted=False,criteriaOrWeightsChanged=False)
    dump('decision.json',result)
    report(result,rows)
    pin_paths=[OUT/'checked-evidence.json',OUT/'acquisition-receipt.json',OUT/'source-discovery.json',ROUTES,PRIOR/'issuers/VIC.json',PRIOR/'manifest.json',
        Path(__file__).resolve(),ROOT/'scripts/lib/vic_claim_bridge.py',ROOT/'scripts/test-vic-parent-bridge.py']
    pin_paths.extend(ROOT/r['source']['pdfPath'] for r in readings)
    dump('manifest.json',dict(contract='vic-parent-review-integrity-v1',inputPins={str(p.relative_to(ROOT)):sha(p) for p in pin_paths},
        checkedRecordCount=len(readings),outputs={n:sha(OUT/n) for n in ['decision.json','REPORT.md']},historicalEvidenceRewritten=False))
    print(json.dumps(dict(checkedRecords=len(readings),conditionalCases=len(conditional),financialAccepted=False,partialGroupPbtVnd=partial_pbt)))


def report(d,rows):
    def bn(v):return format(number(v)/1000000000,',.3f')
    lines=['# VIC — đối chiếu công ty mẹ/hợp nhất và khắc phục mô hình thiếu — 2026-11-03','',
      '**Chưa nghiệm thu lợi nhuận chuẩn hóa VIC. Đã khép phân biệt phạm vi, quỹ dự trữ mẹ và bổ sung khoản trọng yếu Novatech bị thiếu trong mô hình trước.** Mô hình chỉ loại tài trợ không còn đủ dùng. Bằng chứng cũ giữ nguyên; gói này là bản kế tiếp, không nâng nguồn, không đổi tiêu chí/trọng số, không posting/NAV/scoring/giao dịch.','',
      '## Phát hiện làm thay đổi mô hình','',
      '- Lợi nhuận sau thuế báo cáo riêng công ty mẹ: **944,059 tỷ**; lợi nhuận hợp nhất thuộc cổ đông mẹ: **11.349,934 tỷ**. Không thay thế hoặc cộng hai số. Cổ tức/lãi vay nội bộ trên báo cáo riêng phải qua loại trừ hợp nhất.','',
      '- Ngoài tài trợ **23.054,157 tỷ**, thuyết minh 4.3 ghi lãi Novatech **34.395 tỷ**, nằm trong tổng lãi chuyển nhượng/thanh lý đầu tư **39.723,679 tỷ**. Mô hình VIC cũ chưa tách khoản trọng yếu này. Lãi Novatech là số trình bày theo tỷ đồng, không phải số VND chính xác.','',
      '- Novatech tách từ VinFast trong tháng 8/2025 và chuyển nhượng trong tháng 9. Cùng chuỗi giao dịch có phí bản quyền **25.199 tỷ**, thanh toán bằng cấn trừ và tiền. Báo cáo nêu tài sản tiếp tục ghi theo giá trị sổ và chênh lệch ở phải trả khác: **không tự trừ toàn bộ phí này lần nữa khỏi P&L**.','',
      '- Cuối 2025: VinFast JSC có tỷ lệ biểu quyết **99,90%**, lợi ích **50,60%**; VinFast Auto có lợi ích **50,65%**. Đầu năm, lợi ích VinFast JSC được trình bày **50,62%**. Tỷ lệ vốn trực tiếp trên báo cáo mẹ **73,51%** là khái niệm khác. Không dùng số của pháp nhân/khái niệm khác để phân bổ.','',
      '- Có cổ phiếu ưu đãi nhiều đợt, điều kiện cổ tức và chuyển đổi. Báo cáo 6T2025 bổ sung từ Vietstock nói rõ tỷ lệ hoán đổi một số CPƯĐ sẽ đổi sau giao dịch Novatech. Báo cáo mẹ FY2025 xác nhận ngày tách **22/08/2025**, việc hoán đổi một phần CPƯĐ VinFast sang CPƯĐ Novatech và thỏa thuận chuyển nhượng. Khoản đầu tư trình bày trong chứng khoán kinh doanh có giá gốc **1.583,614 tỷ**, không phải thu nhập thêm hoặc giá thị trường được nghiệm thu. Vì vậy tỷ lệ cuối năm không tự chứng minh tỷ lệ phân bổ lợi nhuận tại ngày giao dịch.','',
      '- Đã ghép số bản quyền chi tiết: **25.198,912 tỷ = 23.400,314 tỷ cấn trừ công nợ + 1.798,598 tỷ thanh toán tiền**. Không coi toàn bộ 25.199 tỷ là tiền mặt chi ra hoặc chi phí P&L của năm. Chênh 0,088 tỷ với số trình bày theo tỷ được giữ riêng; không suy ra mọi khoản phải trả cuối kỳ bằng 0.','',
      '## Cầu nối quỹ và quyền lợi đã xử lý','',
      'Phương án ĐHĐCĐ: trích **5 tỷ vào quỹ dự trữ**, toàn bộ phần còn lại giữ lại kinh doanh. Đây là chuyển khoản trong vốn chủ sở hữu, **không phải quỹ nhân viên để trừ lợi nhuận cổ đông**. Báo cáo mẹ 6T2026 ghi quỹ khác tăng 76 lên 81 tỷ và lợi nhuận giữ lại giảm tương ứng 5 tỷ. Hai nguồn tương thích về phạm vi/niên độ, chưa có mã sự kiện riêng để xác nhận matching duy nhất. Chuyển quỹ 5 tỷ trong FY2025 là kỳ khác; không cộng/trừ lặp.','',
      'Phương án mẹ này không cấp bằng chứng rằng mọi công ty con đều không trích quỹ nhân viên. Thu nhập Vinschool bị hạn chế tái đầu tư **664,743 tỷ** vẫn tách khỏi mất mát ngoài cổ đông, chỉ trừ một lần khi đi từ lợi nhuận kinh tế thuộc mẹ sang tử số có thể phân phối.','',
      '## Định lượng có điều kiện','',
      f"Ở phạm vi **lợi nhuận trước thuế hợp nhất**, chỉ loại tài trợ và lãi Novatech cho phép thử **{bn(d['partialGroupPbtAfterGrantAndNovatechVnd'])} tỷ**. Nếu loại thêm lãi công nghệ Movian AI đã trình bày thì là **{bn(d['partialGroupPbtAfterAlsoMovianVnd'])} tỷ**. Đây là phép thử loại khoản cụ thể, chưa là lợi nhuận bền vững hoặc lợi nhuận thuộc cổ đông mẹ.",'',
      'Giả định toàn bộ tài trợ và Novatech đều phân bổ theo lợi ích VinFast JSC ở mốc tham chiếu; giữ nguyên các khoản khác và khoản hạn chế tái đầu tư đã trừ trong tử số gốc:','',
      '| Mốc tham chiếu | Phần thuộc mẹ giả định | Thuế điều chỉnh giả định | Chỉ loại tài trợ (tỷ) | Loại thêm Novatech (tỷ) |','|---|---:|---:|---:|---:|']
    for r in d['conditionalCases']:
        lines.append(f"| {r['referenceSnapshot']} | {number(r['commonWeightAssumption'])*100}% | {number(r['taxAssumption'])*100}% | {bn(r['grantOnlyDistributableCaseVnd'])} | {bn(r['grantAndNovatechDistributableCaseVnd'])} |")
    lines+=['',
      '**Các nhánh đều âm dưới chính các giả định nêu trên. Không được gọi chúng là mức lợi nhuận được nghiệm thu hoặc cận dưới đầy đủ.** Tỷ lệ in được làm tròn, khoản lãi Novatech theo tỷ đồng; chưa xác định đầy đủ khoản tài trợ theo từng pháp nhân và thuế/NCI sự kiện. Không chọn trung điểm để lấp chỗ trống. Khoảng incidence chưa điều kiện cho ba khoản đã biết vẫn có thể đổi dấu; các mốc 50,60–50,62% không được dùng để thu hẹp giả khoảng đó.','',
      'Khoản tài trợ bên liên quan 23.000 tỷ khác thu nhập tài trợ P&L 23.054,157 tỷ. Chênh **54,157 tỷ** chỉ là đối chiếu hai khái niệm; không chứng minh một phần dư chưa phân bổ. Cột 23.011,492 tỷ trong báo cáo 6T2026 là **6T2025 trình bày lại**, không phải cả năm 2025.','',
      'Không áp thuế suất hiệu dụng hợp nhất cho từng giao dịch. Dòng điều chỉnh thuế chuyển nhượng trên báo cáo hợp nhất và tài sản thuế từ lỗ chưa ghi nhận là số tổng, không chứng minh thuế riêng của Novatech/tài trợ. Khoản còn lại trong tổng lãi chuyển nhượng chưa được tự coi là thường xuyên; Movian công nghệ phải phản biện riêng với chuyển nhượng dự án bất động sản.','',
      '## Ma trận xử lý','', '| Issue | Trạng thái | Kết luận |','|---|---|---|']
    for f in d['closureMatrix']:lines.append(f"| {f['issueId']} | {f['status']} | {f['conclusion']} |")
    lines+=['','## Bằng chứng còn thiếu để đổi quyết định','',
      '1. Báo cáo kiểm toán FY2025 VinFast JSC/VinFast Auto hoặc bảng tương đương xác định tài trợ theo bên nhận, thuế và phân bổ mẹ/NCI. Báo cáo mẹ VIC đã có và đã đọc, không yêu cầu gửi lại. Nếu dùng báo cáo US-GAAP/USD, cần cầu nối chuẩn mực, tiền tệ và phạm vi; không ghép trực tiếp vào báo cáo VIC.','2. Điều khoản CPƯĐ/hoán đổi, cơ cấu quyền lợi tại thời điểm tách tháng 8 và bán tháng 9/2025; cầu nối thay đổi quyền lợi, không chỉ tỷ lệ cuối năm.','3. Lãi Novatech, thuế, NCI, thanh toán bản quyền và phải trả khác; phân biệt số trình bày theo tỷ với số chi tiết để tránh hai lần điều chỉnh.','4. Phân loại tính lặp lại Movian/chuyển nhượng dự án và quỹ công ty con thuộc cổ đông mẹ.','',
      'Đã kiểm tra nguồn hiện có và bổ sung báo cáo 6T2025 qua Vietstock. Tìm kiếm giới hạn trong nguồn được phép chưa cung cấp bảng thuế/phân bổ giao dịch VinFast cần thiết; không kết luận tài liệu không tồn tại và không tự chuyển sang nguồn ngoài chính sách. Không cần xác nhận lại dữ kiện danh mục cá nhân.','',
      '## Trang nguồn đã kiểm tra','']
    for r in rows.values():lines.append(f"- `{r['id']}` — [{r['caption']}]({r['source']['href']}), kỳ `{r['economicPeriod']}`, phạm vi `{r['sourceScope']}`.")
    lines+=['','Số đọc và SHA-256 trong `checked-evidence.json`; công thức/nhánh và điều kiện trong `decision.json`; mã nguồn, nguồn PDF và kết quả được ghim trong `manifest.json`. Publication time chưa chứng minh vẫn null. `VALIDATION.json` chỉ xác nhận kiểm định kỹ thuật, không thay nghiệm thu tài chính.']
    (OUT/'REPORT.md').write_text('\n'.join(lines)+'\n')


if __name__=='__main__':build()
