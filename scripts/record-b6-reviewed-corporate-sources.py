"""Explicit source-image transcriptions; keep restated opening comparatives separate."""
from decimal import Decimal
import datetime
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1'
ITEMS = ['TOTAL_ASSETS', 'TOTAL_EQUITY', 'CURRENT_ASSETS', 'CURRENT_LIABILITIES', 'CASH_AND_EQUIVALENTS', 'RECEIVABLES',
         'SHORT_TERM_FINANCIAL_BORROWINGS', 'LONG_TERM_FINANCIAL_BORROWINGS', 'REVENUE', 'NET_INCOME',
         'NET_INCOME_ATTRIBUTABLE_PARENT', 'OPERATING_PROFIT', 'CFO', 'CASH_CAPEX_REPORTED', 'BASIC_EPS', 'INVENTORY', 'GROSS_PROFIT']
# Tuple: physical page, declared native amount. Cash outflows use positive spending normalization with the signed cell retained separately.
VALUES = {
 'FPT': [(9,'73563105859500'),(11,'40995680808257'),(8,'45603129033273'),(10,'29194331060043'),(8,'8843161132730'),(8,'13337195685489'),(10,'16368916886521'),(10,'2080610610531'),(12,'26268500667974'),(12,'5047128933102'),(12,'5054958601533'),(12,'5633473092126'),(13,'-1145666005788'),(13,'1336483237731'),(12,'2967'),(8,'1255307762494'),(12,'8524634170902')],
 'BSR': [(9,'105590618323729'),(10,'74563861230663'),(9,'91615292994920'),(10,'30177798066215'),(9,'6659656664364'),(9,'19714010954955'),(10,'12766300000000'),None,(11,'104635924964339'),(11,'15932712804269'),(11,'15930797947229'),(11,'17877121055136'),(12,'6793615051885'),(12,'300779272710'),(11,'3181'),(9,'14625509701059'),(11,'18304218164119')],
 'VHM': [(15,'1113193186'),(17,'284772810'),(14,'717473066'),(16,'569763257'),(14,'53180480'),(14,'288329218'),(16,'62820116'),(16,'152688244'),(18,'117221878'),(18,'52037887'),(19,'48235002'),(18,'63613212'),(20,'88576257'),(21,'8855555'),(19,'5737'),(14,'227684129'),(18,'67135501')],
 'VJC': [(9,'149092842836295'),(10,'26397543807666'),(8,'54485175967747'),(10,'49232447678663'),(8,'4037786709117'),(8,'40445109455058'),(10,'27470483400445'),(10,'44822769103971'),(11,'51535657614852'),(11,'1372411849652'),(11,'1347220341775'),(11,'1560348458477'),(12,'960439147018'),(12,'12606911504292'),(11,'1752'),(8,'3085052181633'),(11,'4532225657599')],
 'SAB': [(9,'31722037063563'),(11,'21454838013216'),(8,'23511204659025'),(10,'9568649310628'),(8,'3643082971964'),(8,'734706048094'),(10,'200074406705'),(10,'167071638959'),(12,'13345212131027'),(12,'2488767303614'),(13,'2351620298864'),(12,'3082796229152'),(14,'1684113362752'),(15,'173442565830'),(13,'1769'),(8,'1900425860420'),(12,'5068340938945')],
}


def main():
    at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    gaps = json.loads((OUT / 'source-reconciliation-candidates.json').read_text())['rows']
    facts = []
    for ticker, values in VALUES.items():
        notes = json.loads((ROOT / f'data/manual-extracted-pdf/notes/{ticker}.json').read_text())
        doc = next(d for d in notes['documents'] if '6T_2026_Soatxet_Hopnhat' in d['pdfPaths'][0])
        assert hashlib.sha256((ROOT / doc['pdfPaths'][0]).read_bytes()).hexdigest() == doc['sourceHash']
        for item, cell in zip(ITEMS, values):
            if cell is None:
                continue
            prior = [r for r in gaps if r['ticker'] == ticker and r['itemId'] == item and r['periodEnd'] == '2026-06-30']
            if not prior:
                continue
            page, raw = cell
            per_share = item == 'BASIC_EPS'
            scale = '1000000' if ticker == 'VHM' and not per_share else '1'
            value = format(Decimal(raw) * Decimal(scale), 'f')
            flow = item in ['REVENUE','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','OPERATING_PROFIT','CFO','CASH_CAPEX_REPORTED','BASIC_EPS','GROSS_PROFIT']
            operands = None
            if ticker == 'VJC' and item in ['SHORT_TERM_FINANCIAL_BORROWINGS','LONG_TERM_FINANCIAL_BORROWINGS']:
                operands = [{'caption':'Vay ngắn hạn','value':'27141950525724'}, {'caption':'Phải trả thuê tài chính ngắn hạn','value':'328532874721'}] if item.startswith('SHORT') else [{'caption':'Vay dài hạn','value':'41937098582221'}, {'caption':'Phải trả thuê tài chính dài hạn','value':'2885670521750'}]
                assert sum(int(c['value']) for c in operands) == int(value)
            facts.append({'id':f'checked-corp-{ticker}-{item}-20260630','ticker':ticker,'itemId':item,'value':value,'rawValue':raw,
                'rawUnit':'CURRENCY_PER_SHARE' if per_share else 'MILLION_CURRENCY' if scale=='1000000' else 'CURRENCY','multiplier':scale,
                'sourcePrintedSignedValue':('-'+raw) if item=='CASH_CAPEX_REPORTED' else raw,
                'signNormalization':'POSITIVE_REPORTED_ACQUISITION_CASH_SPEND_NOT_NORMALIZED_MAINTENANCE_CAPEX' if item=='CASH_CAPEX_REPORTED' else 'AS_PRINTED',
                'period':{'start':'2026-01-01' if flow else '2026-06-30','end':'2026-06-30'},'reportingScope':'CONSOLIDATED',
                'unit':'CURRENCY_PER_SHARE' if per_share else 'CURRENCY','currency':'VND',
                'sourcePdfPath':doc['pdfPaths'][0],'sourceHash':doc['sourceHash'],'page':page,
                'captionAndColumn':item+'; checked issuer statement caption and current June30 / Jan1–June30 column; EPS has its own VND/share unit',
                'method':'CHATGPT_SOURCE_IMAGE_COMPONENT_SUM' if operands else 'CHATGPT_FULL_SOURCE_IMAGE_TRANSCRIPTION',
                'operands':operands,'reviewedAt':at,'priorObservationIds':[r['observationId'] for r in prior],
                'comparison':'MATCH' if all(Decimal(r['oldValue'])==Decimal(value) for r in prior) else 'CONFLICT',
                'productionAdmissible':False})
    processing = json.loads((ROOT / 'data/manual-extracted-pdf/supplements/2026-10-30-b6-r1/manifest.json').read_text())
    ssi = next(d for d in processing['documents'] if d['ticker'] == 'SSI' and 'ban_nien' in d['sourcePath'])
    ssi_cells = [('TOTAL_ASSETS',11,'96460587873471','Tổng cộng tài sản'),('TOTAL_EQUITY',12,'40723958711514','D. Vốn chủ sở hữu'),
        ('NET_INCOME',17,'2509479672227','Lợi nhuận kế toán sau thuế TNDN'),('NET_INCOME_ATTRIBUTABLE_PARENT',17,'2509035928639','Lợi nhuận sau thuế phân bổ cho chủ sở hữu'),
        ('CASH_AND_EQUIVALENTS',10,'531521622866','Tiền và các khoản tương đương tiền'),('CASH_CAPEX_REPORTED',20,'94756578553','Tiền chi mua sắm xây dựng tài sản cố định, bất động sản đầu tư và tài sản khác'),
        ('SECURITIES_MARGIN_LOANS',48,'40036581154395','7.4 Cho vay hoạt động ký quỹ — Giá trị ghi sổ; excludes advances 435969870963 and fair value'),
        ('FINANCIAL_DEBT',12,'54038267285887','Vay và nợ thuê tài sản tài chính ngắn hạn; no additional financing caption in long-term statement liabilities')]
    for item,page,value,caption in ssi_cells:
        prior = [r for r in gaps if r['ticker']=='SSI' and r['itemId']==item and r['periodEnd']=='2026-06-30']
        assert prior
        facts.append({'id':f'checked-corp-SSI-{item}-20260630','ticker':'SSI','itemId':item,'value':value,'rawValue':value,'rawUnit':'CURRENCY','multiplier':'1',
          'period':{'start':'2026-01-01' if item in ['NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','CASH_CAPEX_REPORTED'] else '2026-06-30','end':'2026-06-30'},
          'reportingScope':'CONSOLIDATED','unit':'CURRENCY','currency':'VND','sourcePdfPath':ssi['sourcePath'],'sourceHash':ssi['sourceSha256'],
          'page':page,'captionAndColumn':caption+'; current 30/06/2026 or Jan1–June30 column',
          'sourcePrintedSignedValue':'-'+value if item=='CASH_CAPEX_REPORTED' else value,
          'method':'CHATGPT_FULL_SOURCE_IMAGE_TRANSCRIPTION','reviewedAt':at,'priorObservationIds':[r['observationId'] for r in prior],
          'comparison':'MATCH' if all(Decimal(r['oldValue'])==Decimal(value) for r in prior) else 'CONFLICT','productionAdmissible':False})
    result={'contract':'b6-corporate-direct-source-review-v1','facts':facts,'amountEqualityUsedToChooseMapping':False,
      'comparabilityWarnings':[{'ticker':'FPT','pdfPath':'data/manual-download/FPT/FPT_Baocaotaichinh_6T_2026_Soatxet_Hopnhat.pdf','page':12,
        'issue':'From 01/01/2026 FTEL changed from full consolidation to equity method. Prior income comparatives are restated; do not calculate organic growth or TTM from unreconciled old annual/YTD values.'},
        {'ticker':'VHM','issue':'Opening/prior figures explicitly presented again; retain separate restatement vintage. Do not silently replace original FY2025.'},
        {'ticker':'VJC','issue':'Borrowings and recognized finance leases are separate repeated-code rows. Other financing and sector lease/aircraft normalization still require note review.'}],
      'reportedBorrowingPopulationReceiptsInvented':False}
    (OUT/'checked-corporate-sources.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'facts':len(facts),'conflicts':[f['id'] for f in facts if f['comparison']=='CONFLICT']}))


if __name__=='__main__':
    main()
