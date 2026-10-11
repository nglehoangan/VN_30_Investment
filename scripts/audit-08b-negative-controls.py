"""Execution checks on retained real evidence; never mutate source files or facts."""
import copy, datetime, json, pathlib, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
audit = runpy.run_path('scripts/audit-08b-cell-proofs.py')
assert json.loads((B / 'source-cell-proof-audit.json').read_text())['status'] == 'PASS'
cells = json.loads((B / 'verified-cells.json').read_text())
cell = next(c for c in cells if c['ticker'] == 'ACB' and c['itemId'] == 'CFO')
page = json.loads((B / 'ocr' / f'{cell["bodyHash"]}-p{cell["page"]}.json').read_text())
assert audit['validate_transcription'](cell, page)
checks = []
for field, value in [
    ('bodyHash', '0' * 64), ('page', cell['page'] + 1),
    ('unit', 'CURRENCY'), ('lexicalValue', '999.999.999.999.999'),
    ('verifiedCanonicalInteger', '999999999999999'),
    ('renderSha256', '0' * 64), ('verificationMethod', cell['extractionMethod']),
]:
    modified = {**cell, field: value}
    assert not audit['validate_transcription'](modified, page), field
    checks.append({'reader': 'STANDARD_TWO_READER', 'tamper': field, 'status': 'REJECTED'})
low = copy.deepcopy(page)
for key in ['passA', 'passB']:
    for word in low[key]:
        word['confidence'] = 0.79
assert not audit['validate_transcription'](cell, low)
checks.append({'reader': 'STANDARD_TWO_READER', 'tamper': 'confidence', 'status': 'REJECTED'})

image = json.loads((B / 'source-image-verified-cells.json').read_text())[0]
page = json.loads(pathlib.Path(image['sourceOcrProofFile']).read_text())
proof = json.loads(pathlib.Path(image['sourceImageProofFile']).read_text())
args = [page, proof, image['sourcePageEvidenceHashes'], image['renderSha256'], image['bodyHash']]
assert audit['validate_source_image'](image, *args)
for field, value in [
    ('unit', 'MILLION_CURRENCY'), ('scope', 'SEPARATE_STANDALONE'),
    ('sourceRowCode', '999'), ('captionAlternative', 'unsupported caption'),
    ('lexicalValue', '1'), ('verifiedCanonicalInteger', '1'),
    ('independentHumanApproval', 'FAKE_APPROVAL'),
    ('verificationMethod', 'TESSERACT_FAKE_IMAGE_READING'),
]:
    assert not audit['validate_source_image']({**image, field: value}, *args), field
    checks.append({'reader': 'SOURCE_IMAGE_EXCEPTION', 'tamper': field, 'status': 'REJECTED'})
percent = next((c for c in json.loads((B / 'source-image-verified-cells.json').read_text()) if c['unit']=='PERCENT'), None)
if percent:
    page = json.loads(pathlib.Path(percent['sourceOcrProofFile']).read_text())
    proof = json.loads(pathlib.Path(percent['sourceImageProofFile']).read_text())
    args = [page, proof, percent['sourcePageEvidenceHashes'], percent['renderSha256'], percent['bodyHash']]
    assert audit['validate_source_image'](percent, *args)
    for field, value in [('columnX', .66), ('rowY', .56), ('verifiedCanonicalInteger', '1171'), ('scope', 'SEPARATE_STANDALONE')]:
        assert not audit['validate_source_image']({**percent, field:value}, *args), field
        checks.append({'reader':'REGULATORY_PERCENT_SOURCE_IMAGE', 'tamper':field, 'status':'REJECTED'})
region = next(c for c in json.loads((B / 'source-image-verified-cells.json').read_text()) if c.get('sourceWordText') and len(c['sourceWordText'].split())==2)
page = json.loads(pathlib.Path(region['sourceOcrProofFile']).read_text())
proof = json.loads(pathlib.Path(region['sourceImageProofFile']).read_text())
args = [page, proof, region['sourcePageEvidenceHashes'], region['renderSha256'], region['bodyHash']]
assert audit['validate_source_image'](region, *args)
for field,value in [('sourceWordTokenIndex',1),('sourceWordText',region['sourceWordText'].split()[1]),('columnX',.1),('rowY',.1),('periodType','QUARTER'),('lexicalValue',region['sourceWordText'].split()[1])]:
    assert not audit['validate_source_image']({**region,field:value},*args),field
    checks.append({'reader':'ORDERED_CURRENT_COLUMN_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
income = next(c for c in json.loads((B / 'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('currentColumnOrdinal')==2)
page = json.loads(pathlib.Path(income['sourceOcrProofFile']).read_text())
proof = json.loads(pathlib.Path(income['sourceImageProofFile']).read_text())
args = [page,proof,income['sourcePageEvidenceHashes'],income['renderSha256'],income['bodyHash']]
assert audit['validate_source_image'](income,*args)
for field,value in [('sourceImageColumnDefinition',None),('sourceImageColumnDefinition',{**income['sourceImageColumnDefinition'],'currentColumnOrdinal':0}),('columnX',.47),('lexicalValue',income['sourceImageColumnDefinition']['sourceRowValuesLeftToRight'][0]),('periodType','QUARTER')]:
    assert not audit['validate_source_image']({**income,field:value},*args),field
    checks.append({'reader':'FOUR_COLUMN_CURRENT_YTD_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
pair_cell=next(c for c in json.loads((B/'verified-cells.json').read_text()) if c.get('sourceIndependentPairProofFile'))
pair=json.loads(pathlib.Path(pair_cell['sourceIndependentPairProofFile']).read_text())
assert audit['validate_independent_pair'](pair) and audit['validate_transcription'](pair_cell,pair)
for field,value in [('sourceOriginalOcrProofSha256','0'*64),('sourceThirdReaderProofSha256','0'*64),('bodyHash','0'*64),('renderSha256','0'*64),('engineB',pair['engineA']),('independentHumanApproval','FAKE_APPROVAL')]:
    assert not audit['validate_independent_pair']({**pair,field:value}),field
    checks.append({'reader':'SUPPLEMENTARY_INDEPENDENT_OCR_PAIR','tamper':field,'status':'REJECTED'})
changed=copy.deepcopy(pair);changed['passA'][0]['text']='fabricated source'
assert not audit['validate_independent_pair'](changed)
checks.append({'reader':'SUPPLEMENTARY_INDEPENDENT_OCR_PAIR','tamper':'reader_stream','status':'REJECTED'})
lpb=next(c for c in cells if c['ticker']=='LPB' and c['itemId']=='CFF_SUPPORTING' and c['bodyHash']=='2d4527bc19aba72b712521d0f2b9b680bff93a5143513da04a83cb97f76b12bf')
lpb_file=B/'ocr-independent-reader-pairs'/f"{lpb['bodyHash']}-p{lpb['page']}.json"
lpb_page=json.loads(lpb_file.read_text())
lpb={**lpb,'sourceIndependentPairProofFile':str(lpb_file),'extractionMethod':lpb_page['engineA'],'verificationMethod':lpb_page['engineB']}
assert lpb['lexicalValue']=='(4.945.257)' and audit['validate_transcription'](lpb,lpb_page)
dividend={**lpb,'lexicalValue':'(8.961.846)','verificationLexicalValue':'(8.961.846)','verifiedCanonicalInteger':'-8961846','rowY':.4748338081671415}
assert not audit['validate_transcription'](dividend,lpb_page)
checks.append({'reader':'SUPPLEMENTARY_INDEPENDENT_OCR_PAIR','tamper':'adjacent_dividend_as_financing_subtotal','status':'REJECTED'})
note=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if (c.get('sourceImageColumnDefinition') or {}).get('layout')=='BSR_NOTE_33_CURRENT_PRIOR_RESTATED')
page=json.loads(pathlib.Path(note['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(note['sourceImageProofFile']).read_text())
args=[page,proof,note['sourcePageEvidenceHashes'],note['renderSha256'],note['bodyHash']]
assert audit['validate_source_image'](note,*args)
for field,value in [('sourceWordTokenIndex',0),('unit','MILLION_CURRENCY'),('lexicalValue','15.928.199.811.197'),('periodType','QUARTER'),('scope','SEPARATE_STANDALONE'),('columnX',.7)]:
    assert not audit['validate_source_image']({**note,field:value},*args),field
    checks.append({'reader':'ORDINARY_PROFIT_EPS_NOTE_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
vjc=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if (c.get('sourceImageColumnDefinition') or {}).get('layout')=='VJC_NOTE_34_CURRENT_PRIOR_SIX_MONTH')
page=json.loads(pathlib.Path(vjc['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(vjc['sourceImageProofFile']).read_text());args=[page,proof,vjc['sourcePageEvidenceHashes'],vjc['renderSha256'],vjc['bodyHash']]
assert audit['validate_source_image'](vjc,*args)
for field,value in [('lexicalValue','2.271'),('lexicalValue','2.364'),('unit','CURRENCY'),('itemId','DILUTED_EPS'),('periodType','QUARTER')]:
    assert not audit['validate_source_image']({**vjc,field:value},*args),field
    checks.append({'reader':'SIX_MONTH_BASIC_EPS_NOTE_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
bank=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if (c.get('sourceImageColumnDefinition') or {}).get('layout')=='LPB_CURRENT_CLOSING_BALANCE' and c['itemId']=='BANK_GROSS_CUSTOMER_LOANS')
page=json.loads(pathlib.Path(bank['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(bank['sourceImageProofFile']).read_text());args=[page,proof,bank['sourcePageEvidenceHashes'],bank['renderSha256'],bank['bodyHash']]
assert audit['validate_source_image'](bank,*args)
for field,value in [('lexicalValue','424.148.666'),('lexicalValue','391.746.491'),('unit','CURRENCY'),('scope','CONSOLIDATED'),('periodType','YTD')]:
    assert not audit['validate_source_image']({**bank,field:value},*args),field
    checks.append({'reader':'BANK_CLOSING_BALANCE_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
shares=json.loads((B/'lpb-share-count-cells.json').read_text())[0];page=json.loads((B/'ocr'/f"{shares['bodyHash']}-p49.json").read_text())
assert audit['validate_transcription'](shares,page)
for field,value in [('currency','VND'),('scope','CONSOLIDATED'),('lexicalValue','29.872.821'),('periodType','YTD'),('rowY',.43)]:
    assert not audit['validate_transcription']({**shares,field:value},page),field
    checks.append({'reader':'ORDINARY_OUTSTANDING_SHARE_COUNT','tamper':field,'status':'REJECTED'})
fpt=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c['ticker']=='FPT' and c['itemId']=='CFO' and c['bodyHash'].startswith('45636554'))
page=json.loads(pathlib.Path(fpt['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(fpt['sourceImageProofFile']).read_text());args=[page,proof,fpt['sourcePageEvidenceHashes'],fpt['renderSha256'],fpt['bodyHash']]
assert audit['validate_source_image'](fpt,*args)
for field,value in [('lexicalValue','1.145.666.005.788'),('lexicalValue','1.683.573.278.329'),('unit','MILLION_CURRENCY'),('sourceRowCode','21'),('scope','SEPARATE_STANDALONE'),('periodType','QUARTER'),('columnX',.8)]:
    assert not audit['validate_source_image']({**fpt,field:value},*args),field
    checks.append({'reader':'FPT_REVIEWED_CURRENT_PRIMARY_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
common=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c['ticker']=='LPB' and c['itemId']=='COMMON_EQUITY')
assert audit['validate_lpb_common_equity_classification'](common)
for field,value in [('commonEquityClassificationProofSha256','0'*64),('commonEquityClassificationProofFile',common['sourceOcrProofFile']),('itemId','TOTAL_EQUITY'),('scope','CONSOLIDATED'),('lexicalValue','47.192.474'),('bodyHash','0'*64)]:
    assert not audit['validate_lpb_common_equity_classification']({**common,field:value}),field
    checks.append({'reader':'DOCUMENT_SPECIFIC_COMMON_EQUITY_CLASSIFICATION','tamper':field,'status':'REJECTED'})
for filename in ['lpb-capital-disclosure-cells.json','lpb-capital-vn-disclosure-cells.json']:
    capital=json.loads((B/filename).read_text())[0]
    page=json.loads((B/'ocr'/f"{capital['bodyHash']}-p6.json").read_text())
    assert audit['validate_transcription'](capital,page)
    for field,value in [('itemId','BANK_REPORTED_CET1'),('lexicalValue','8.35%'),('lexicalValue','11.23%'),('scope','CONSOLIDATED'),('period', {**capital['period'],'end':'2026-03-31'})]:
        assert not audit['validate_transcription']({**capital,field:value},page),field
        checks.append({'reader':filename,'tamper':field,'status':'REJECTED'})
for ticker in ['VRE','BSR','MCH','MSN','GAS']:
    primary=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c['ticker']==ticker and (c.get('sourceImageColumnDefinition') or {}).get('layout')=='NONBANK_CURRENT_INSPECTED_PRIMARY')
    page=json.loads(pathlib.Path(primary['sourceOcrProofFile']).read_text()); proof=json.loads(pathlib.Path(primary['sourceImageProofFile']).read_text())
    args=[page,proof,primary['sourcePageEvidenceHashes'],primary['renderSha256'],primary['bodyHash']]
    assert audit['validate_source_image'](primary,*args)
    for field,value in [('lexicalValue',primary['sourceImageColumnDefinition']['comparativeLexical']),('unit','CURRENCY' if primary['unit']=='MILLION_CURRENCY' else 'MILLION_CURRENCY'),('scope','SEPARATE_STANDALONE'),('sourceRowCode','999'),('periodType','QUARTER'),('columnX',.9),('bodyHash','0'*64)]:
        assert not audit['validate_source_image']({**primary,field:value},*args),field
        checks.append({'reader':ticker+'_CURRENT_PRIMARY_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
gvr_current=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='GVR_EXACT_CURRENT_PRIMARY')
page=json.loads(pathlib.Path(gvr_current['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(gvr_current['sourceImageProofFile']).read_text());args=[page,proof,gvr_current['sourcePageEvidenceHashes'],gvr_current['renderSha256'],gvr_current['bodyHash']]
assert audit['validate_source_image'](gvr_current,*args)
for field,value in [('lexicalValue',gvr_current['sourceImageColumnDefinition']['comparativeLexical']),('unit','MILLION_CURRENCY'),('sourceRowCode','01'),('scope','SEPARATE_STANDALONE'),('periodType','QUARTER'),('columnX',.9),('bodyHash','0'*64)]:
    assert not audit['validate_source_image']({**gvr_current,field:value},*args),field
    checks.append({'reader':'GVR_EXACT_CURRENT_PRIMARY_SOURCE_IMAGE','tamper':field,'status':'REJECTED'})
modified=copy.deepcopy(gvr_current);modified['sourceImageColumnDefinition']['originalOcrCaptionText']=modified['sourceCaption']
assert not audit['validate_source_image'](modified,*args)
checks.append({'reader':'GVR_EXACT_CURRENT_PRIMARY_SOURCE_IMAGE','tamper':'silently_repaired_original_caption','status':'REJECTED'})
bsr_net=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c['ticker']=='BSR' and c['itemId']=='NET_CASH_CHANGE_SUPPORTING')
page=json.loads(pathlib.Path(bsr_net['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(bsr_net['sourceImageProofFile']).read_text());args=[page,proof,bsr_net['sourcePageEvidenceHashes'],bsr_net['renderSha256'],bsr_net['bodyHash']]
assert audit['validate_source_image'](bsr_net,*args)
for key,value in [('currentColumnOrdinal',1),('originalSourceWordText','(11.998.302.063.354) (935.975.102.645)'),('comparativeLexical','11.998.302.063.354')]:
    modified=copy.deepcopy(bsr_net);modified['sourceImageColumnDefinition'][key]=value
    assert not audit['validate_source_image'](modified,*args),key
    checks.append({'reader':'BSR_EXACT_GROUPED_SOURCE_REGION','tamper':key,'status':'REJECTED'})
gas=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c['ticker']=='GAS' and c['itemId']=='NET_INCOME_ATTRIBUTABLE_COMMON')
page=json.loads(pathlib.Path(gas['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(gas['sourceImageProofFile']).read_text());args=[page,proof,gas['sourcePageEvidenceHashes'],gas['renderSha256'],gas['bodyHash']]
assert audit['validate_source_image'](gas,*args)
for field,value in [('lexicalValue','8.708.734.346.333'),('lexicalValue','7.504.136.315.841'),('itemId','NET_INCOME_ATTRIBUTABLE_PARENT'),('unit','MILLION_CURRENCY'),('periodType','QUARTER'),('scope','SEPARATE_STANDALONE'),('columnX',.8)]:
    assert not audit['validate_source_image']({**gas,field:value},*args),field
    checks.append({'reader':'GAS_EXPLICIT_COMMON_PROFIT_NOTE','tamper':field,'status':'REJECTED'})
mch=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c['ticker']=='MCH' and c['itemId']=='BASIC_EPS')
page=json.loads(pathlib.Path(mch['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(mch['sourceImageProofFile']).read_text());args=[page,proof,mch['sourcePageEvidenceHashes'],mch['renderSha256'],mch['bodyHash']]
assert audit['validate_source_image'](mch,*args)
for field,value in [('lexicalValue','2.636'),('unit','CURRENCY'),('periodType','QUARTER'),('sourceRowCode','(iv)'),('columnX',.86),('scope','SEPARATE_STANDALONE')]:
    assert not audit['validate_source_image']({**mch,field:value},*args),field
    checks.append({'reader':'MCH_EXPLICIT_REPORTED_EPS_NOTE','tamper':field,'status':'REJECTED'})
without_dates={k:v for k,v in page.items() if not k.startswith('_')};without_dates['passB']=[w for w in page['passB'] if w['text'] not in ['30/6/2026','30/6/2025']]
assert not audit['validate_source_image'](mch,without_dates,*args[1:])
checks.append({'reader':'MCH_EXPLICIT_REPORTED_EPS_NOTE','tamper':'independent_literal_date_columns','status':'REJECTED'})
ordinary=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c['ticker']=='FPT' and c['itemId']=='COMMON_EQUITY')
page=json.loads(pathlib.Path(ordinary['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(ordinary['sourceImageProofFile']).read_text());args=[page,proof,ordinary['sourcePageEvidenceHashes'],ordinary['renderSha256'],ordinary['bodyHash']]
assert audit['validate_source_image'](ordinary,*args)
for field,value in [('lexicalValue','40.995.680.808.257'),('lexicalValue','1.144.217.283.327'),('lexicalValue','36.482.943.944.772'),('scope','SEPARATE_STANDALONE'),('ordinaryAttributionProofSha256','0'*64),('ordinaryAttributionProofFile',ordinary['sourceOcrProofFile']),('itemId','TOTAL_EQUITY'),('periodType','YTD'),('columnX',.80)]:
    assert not audit['validate_source_image']({**ordinary,field:value},*args),field
    checks.append({'reader':'FPT_CLOSED_ORDINARY_CAPITAL_REPORTED_PARENT_SECTION','tamper':field,'status':'REJECTED'})
gvr=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='GVR_EXACT_ANNUAL_CF_IMAGE')
page=json.loads(pathlib.Path(gvr['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(gvr['sourceImageProofFile']).read_text());args=[page,proof,gvr['sourcePageEvidenceHashes'],gvr['renderSha256'],gvr['bodyHash']]
assert audit['validate_source_image'](gvr,*args)
for field,value in [('lexicalValue','1.342.697.872.512'),('unit','MILLION_CURRENCY'),('periodType','QUARTER'),('sourceRowCode','30'),('columnX',.82),('scope','SEPARATE_STANDALONE'),('page',11)]:
    assert not audit['validate_source_image']({**gvr,field:value},*args),field
    checks.append({'reader':'GVR_EXACT_ANNUAL_CF_IMAGE','tamper':field,'status':'REJECTED'})
ctg=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='CTG_EXACT_ANNUAL_FINANCING_SUBTOTAL')
page=json.loads(pathlib.Path(ctg['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(ctg['sourceImageProofFile']).read_text());args=[page,proof,ctg['sourcePageEvidenceHashes'],ctg['renderSha256'],ctg['bodyHash']]
assert audit['validate_source_image'](ctg,*args)
for field,value in [('lexicalValue','0'),('unit','CURRENCY'),('periodType','QUARTER'),('sourceRowCode','01'),('columnX',.92),('scope','SEPARATE_STANDALONE'),('rowY',.3968)]:
    assert not audit['validate_source_image']({**ctg,field:value},*args),field
    checks.append({'reader':'CTG_EXACT_ANNUAL_FINANCING_SUBTOTAL','tamper':field,'status':'REJECTED'})
acb=next(c for c in json.loads((B/'acb-ordinary-capital-cells.json').read_text()) if c['itemId']=='COMMON_EQUITY' and c['period']['end']=='2026-06-30')
page=json.loads((B/'ocr'/f"{acb['bodyHash']}-p64.json").read_text());assert audit['validate_transcription'](acb,page)
for field,value in [('lexicalValue','94.519.719'),('unit','CURRENCY'),('scope','SEPARATE_STANDALONE'),('itemId','TOTAL_EQUITY'),('periodType','YTD'),('ordinaryEquityClassificationProofSha256','0'*64),('columnX',.81),('sourceRowCode','NOTE_20'),('period',{**acb['period'],'start':'2025-06-30','end':'2025-06-30'})]:
    assert not audit['validate_transcription']({**acb,field:value},page),field
    checks.append({'reader':'ACB_POSITIVE_CLOSED_ORDINARY_CAPITAL_AND_SUBSIDIARY_PARTITION','tamper':field,'status':'REJECTED'})
vnm=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='VNM_EXACT_ANNUAL_STATEMENT_IMAGE')
page=json.loads(pathlib.Path(vnm['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(vnm['sourceImageProofFile']).read_text());args=[page,proof,vnm['sourcePageEvidenceHashes'],vnm['renderSha256'],vnm['bodyHash']]
assert audit['validate_source_image'](vnm,*args)
for field,value in [('lexicalValue','60.368.915.511.505'),('unit','MILLION_CURRENCY'),('periodType','QUARTER'),('sourceRowCode','01'),('columnX',.8),('scope','SEPARATE_STANDALONE'),('page',13),('rowY',.4)]:
    assert not audit['validate_source_image']({**vnm,field:value},*args),field
    checks.append({'reader':'VNM_EXACT_ANNUAL_STATEMENT_IMAGE','tamper':field,'status':'REJECTED'})
acb_prior=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='ACB_EXACT_PRIOR_ORDINARY_CAPITAL')
page=json.loads(pathlib.Path(acb_prior['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(acb_prior['sourceImageProofFile']).read_text());args=[page,proof,acb_prior['sourcePageEvidenceHashes'],acb_prior['renderSha256'],acb_prior['bodyHash']]
assert audit['validate_source_image'](acb_prior,*args)
for field,value in [('lexicalValue','83.461.678'),('itemId','TOTAL_EQUITY'),('unit','CURRENCY'),('periodType','YTD'),('scope','SEPARATE_STANDALONE'),('columnX',.65),('ordinaryEquityClassificationProofSha256','0'*64),('ordinaryEquityClassificationProofFile',acb_prior['sourceOcrProofFile']),('page',65)]:
    assert not audit['validate_source_image']({**acb_prior,field:value},*args),field
    checks.append({'reader':'ACB_EXACT_PRIOR_ORDINARY_CAPITAL','tamper':field,'status':'REJECTED'})
sab=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='SAB_EXACT_PRIOR_CASHFLOW_IMAGE')
page=json.loads(pathlib.Path(sab['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(sab['sourceImageProofFile']).read_text());args=[page,proof,sab['sourcePageEvidenceHashes'],sab['renderSha256'],sab['bodyHash']]
assert audit['validate_source_image'](sab,*args)
for field,value in [('lexicalValue','2.117.905.353.122'),('unit','MILLION_CURRENCY'),('periodType','QUARTER'),('scope','SEPARATE_STANDALONE'),('sourceRowCode','30'),('columnX',.8),('page',13),('rowY',.4)]:
    assert not audit['validate_source_image']({**sab,field:value},*args),field
    checks.append({'reader':'SAB_EXACT_PRIOR_CASHFLOW_IMAGE','tamper':field,'status':'REJECTED'})
bid=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='BID_EXACT_CURRENT_PRIMARY')
page=json.loads(pathlib.Path(bid['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(bid['sourceImageProofFile']).read_text());args=[page,proof,bid['sourcePageEvidenceHashes'],bid['renderSha256'],bid['bodyHash']]
assert audit['validate_source_image'](bid,*args)
for field,value in [('lexicalValue','2.467.112.319'),('unit','CURRENCY'),('periodType','YTD'),('scope','SEPARATE_STANDALONE'),('sourceRowCode','VI.'),('columnX',.82),('page',9),('rowY',.428)]:
    assert not audit['validate_source_image']({**bid,field:value},*args),field
    checks.append({'reader':'BID_EXACT_CURRENT_PRIMARY','tamper':field,'status':'REJECTED'})
ssi=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='SSI_EXACT_CURRENT_PRIMARY')
page=json.loads(pathlib.Path(ssi['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(ssi['sourceImageProofFile']).read_text());args=[page,proof,ssi['sourcePageEvidenceHashes'],ssi['renderSha256'],ssi['bodyHash']]
assert audit['validate_source_image'](ssi,*args)
for field,value in [('lexicalValue','94.049.979.396.183'),('unit','MILLION_CURRENCY'),('periodType','YTD'),('scope','SEPARATE_STANDALONE'),('sourceRowCode','440'),('columnX',.8),('page',12),('itemId','COMMON_EQUITY')]:
    assert not audit['validate_source_image']({**ssi,field:value},*args),field
    checks.append({'reader':'SSI_EXACT_CURRENT_PRIMARY','tamper':field,'status':'REJECTED'})
tcx_primary=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='TCX_EXACT_STANDALONE_CURRENT_PRIMARY')
page=json.loads(pathlib.Path(tcx_primary['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(tcx_primary['sourceImageProofFile']).read_text());args=[page,proof,tcx_primary['sourcePageEvidenceHashes'],tcx_primary['renderSha256'],tcx_primary['bodyHash']]
assert audit['validate_source_image'](tcx_primary,*args)
for field,value in [('lexicalValue','80.632.256.999.009'),('unit','MILLION_CURRENCY'),('periodType','YTD'),('scope','CONSOLIDATED'),('sourceRowCode','100'),('columnX',.82),('page',15),('itemId','COMMON_EQUITY')]:
    assert not audit['validate_source_image']({**tcx_primary,field:value},*args),field
    checks.append({'reader':'TCX_EXACT_STANDALONE_CURRENT_PRIMARY','tamper':field,'status':'REJECTED'})
hdb=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='HDB_EXACT_AUDITED_ANNUAL_PRIMARY' and c['itemId']=='NET_INCOME_ATTRIBUTABLE_COMMON')
page=json.loads(pathlib.Path(hdb['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(hdb['sourceImageProofFile']).read_text());args=[page,proof,hdb['sourcePageEvidenceHashes'],hdb['renderSha256'],hdb['bodyHash']]
assert audit['validate_source_image'](hdb,*args)
for field,value in [('lexicalValue','13.247.648'),('itemId','NET_INCOME'),('unit','CURRENCY'),('periodType','YTD'),('period',{**hdb['period'],'end':'2025-12-31'}),('scope','SEPARATE_STANDALONE'),('sourceRowCode','XIII'),('columnX',.85),('independentHumanApproval','FAKE_APPROVAL')]:
    assert not audit['validate_source_image']({**hdb,field:value},*args),field
    checks.append({'reader':'HDB_EXACT_AUDITED_ANNUAL_PRIMARY','tamper':field,'status':'REJECTED'})
modified=copy.deepcopy(hdb);modified['sourceImageColumnDefinition']['comparativeOriginalOcrLexical']='10.070.898'
assert not audit['validate_source_image'](modified,*args)
checks.append({'reader':'HDB_EXACT_AUDITED_ANNUAL_PRIMARY','tamper':'REPAIRED_COMPARATIVE_OCR','status':'REJECTED'})
hdb_current=next(c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')=='HDB_EXACT_CURRENT_PRIMARY_AND_COMMON_NOTE' and c['itemId']=='NET_INCOME_ATTRIBUTABLE_COMMON')
page=json.loads(pathlib.Path(hdb_current['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(hdb_current['sourceImageProofFile']).read_text());args=[page,proof,hdb_current['sourcePageEvidenceHashes'],hdb_current['renderSha256'],hdb_current['bodyHash']]
assert audit['validate_source_image'](hdb_current,*args)
for field,value in [('lexicalValue','10.400.636'),('itemId','NET_INCOME'),('unit','CURRENCY'),('periodType','QUARTER'),('scope','SEPARATE_STANDALONE'),('sourceRowCode','XV'),('rowY',.762),('columnX',.83),('independentHumanApproval','FAKE')]:
    assert not audit['validate_source_image']({**hdb_current,field:value},*args),field
    checks.append({'reader':'HDB_EXACT_CURRENT_PRIMARY_AND_COMMON_NOTE','tamper':field,'status':'REJECTED'})
for layout in ['VNM_EXACT_FY23_PRIMARY_IMAGE','VNM_EXACT_FY23_STOCK_IMAGE','VNM_EXACT_FY23_CASHFLOW_IMAGE','VRE_EXACT_CURRENT_CASHFLOW_IMAGE','VNM_EXACT_FY25_PRIMARY_IMAGE','VNM_EXACT_Q1_STOCK_IMAGE','VNM_EXACT_Q1_CASHFLOW_IMAGE','MCH_EXACT_CLOSING_ORDINARY_SHARES_IMAGE','GAS_EXACT_ORDINARY_DISTRIBUTION_IMAGE','GAS_EXACT_CURRENT_PRIMARY_IMAGE','MWG_EXACT_CURRENT_PRIMARY_IMAGE','MWG_EXACT_ORDINARY_DISTRIBUTION_IMAGE','MCH_EXACT_CURRENT_PRIMARY_IMAGE','FPT_EXACT_CURRENT_ADDITIONAL_IMAGE','MCH_EXACT_PRIOR_FINANCING_IMAGE']:
    for c in [c for c in json.loads((B/'source-image-verified-cells.json').read_text()) if c.get('sourceImageColumnDefinition',{}).get('layout')==layout]:
        page=json.loads(pathlib.Path(c['sourceOcrProofFile']).read_text());proof=json.loads(pathlib.Path(c['sourceImageProofFile']).read_text());args=[page,proof,c['sourcePageEvidenceHashes'],c['renderSha256'],c['bodyHash']]
        assert audit['validate_source_image'](c,*args)
        for field,value in [('scope','SEPARATE_STANDALONE'),('sourceRowCode','FAKE'),('columnX',.95),('verifiedCanonicalInteger','0'),('independentHumanApproval','FAKE'),('period',{**c['period'],'end':'2026-07-17'})]:
            assert not audit['validate_source_image']({**c,field:value},*args),(layout,c['itemId'],field)
            checks.append({'reader':layout,'itemId':c['itemId'],'tamper':field,'status':'REJECTED'})
for c in json.loads((B/'hdb-investor-disclosure-cells.json').read_text()):
    page=json.loads((B/'ocr'/f"{c['bodyHash']}-p{c['page']}.json").read_text())
    assert audit['validate_transcription'](c,page)
    for field,value in [('scope','SEPARATE_STANDALONE'),('itemId','BANK_REPORTED_CET1'),('verifiedCanonicalInteger','9.1'),('page',23),('reportedMetricBasis','LTM'),('columnX',.95)]:
        assert not audit['validate_transcription']({**c,field:value},page),(c['itemId'],field)
        checks.append({'reader':'HDB_EXACT_CONSOLIDATED_INVESTOR_DISCLOSURE','itemId':c['itemId'],'tamper':field,'status':'REJECTED'})
if (B/'gas-accounting-basis-source-image-proof.json').exists():
    helper=runpy.run_path('scripts/reconcile-08b-gas-basis-image.py');proof=json.loads((B/'gas-accounting-basis-source-image-proof.json').read_text());assert helper['validate'](proof)
    for field,value in [('value','IFRS'),('page',17),('dimension','REPORTING_SCOPE'),('verificationMethod','TWO_CLEAN_OCR_READERS'),('independentHumanApproval','FAKE'),('originalLexicalLines',proof['originalLexicalLines'][:-1]),('renderSha256','0'*64)]:
        assert not helper['validate']({**proof,field:value}),field
        checks.append({'reader':'GAS_EXACT_SOURCE_IMAGE_ACCOUNTING_BASIS','tamper':field,'status':'REJECTED'})
result = {'status': 'PASS', 'recordedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'checks': checks, 'sourceOrFactMutations': 0, 'independentHumanApprovalAsserted': False}
(B / 'proof-audit-negative-controls.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'status': 'PASS', 'negativeControls': len(checks), 'mutations': 0}))
