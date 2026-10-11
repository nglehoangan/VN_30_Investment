"""Finite exact source-version revision proposals; never chooses the latest root generically."""
import datetime, hashlib, json, pathlib, re

B = pathlib.Path('data/initialization-08b-remediation-work')
def read(name): return json.loads((B / name).read_text())
def proof(name):
    p = B / name
    return {'file': str(p), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}

bid = '3c3f6c39c9ca9f737c3d8d52893d7320be29dbb1a4bcecfdf062fad2b45106d2'
page = read('ocr/' + bid + '-p2.json')
for reader in ['passA', 'passB']:
    text = ' '.join(w['text'] for w in page[reader])
    assert '18/08/2026' in text and 'Thông tin này đã được công bố' in text
vic = read('vic-publication-web-receipt.json')
assert vic['method'] == 'WEB_TOOL_NORMALIZED_PUBLIC_PRIMARY_PAGE' and vic['rawHttpResponseRetained'] is False
assert '29/8/2026' in vic['inventoryResult'] and '25/3/2026' in vic['inventoryResult']
assert '2026_Bao+cao+tai+chinh+hop+nhat+giua+nien+do+soat+xet_F.pdf' in vic['viewerResult']
assert '2025_Bao+cao+tai+chinh+hop+nhat+kiem+toan.pdf' in vic['viewerResult']

rules = [
    {'ticker':'BID', 'itemId':'TOTAL_ASSETS', 'periodEnd':'2026-06-30',
     'oldBodyHash':'d754ea79667f01a7d65959327b72094734ec3631997787750e040f3994438eca',
     'newBodyHash':bid, 'oldValue':'3440843537000000', 'newValue':'3440840854000000',
     'publicationDate':'2026-08-18', 'newAuditStatus':'REVIEWED',
     'reason':'Issuer-published reviewed interim finalization of the same consolidated balance-sheet date; exact total-assets caption and scale retained. Candidate lineage requires independent review; no general latest-source rule.',
     'proofs':[proof('ocr/' + bid + '-p2.json'),proof('targeted-indexes/BID-current-reports.body')]},
    {'ticker':'VIC', 'itemId':'TOTAL_ASSETS', 'periodEnd':'2026-06-30',
     'oldBodyHash':'9a044beccdd8ec36eba001ecbcf5217b6d0695ba51d3a30d2de96fbe3c1f2d85',
     'newBodyHash':'a82cc3eaf79ced481ad28ea4ce311053725d8f2f0e1c5bc15bbce3938a8babd8',
     'oldValue':'1308937567000000', 'newValue':'1309346482000000',
     'publicationDate':'2026-08-29', 'newAuditStatus':'REVIEWED',
     'reason':'Issuer inventory pairs the original and reviewed consolidated interim editions for the same June 2026 balance date. Reviewed finalization lineage is proposed for this exact total-assets cell only.',
     'proofs':[proof('vic-publication-web-receipt.json')]},
    {'ticker':'VIC', 'itemId':'TOTAL_ASSETS', 'periodEnd':'2025-12-31',
     'oldBodyHash':'dff5cb854c61611fa83947bc4695891998abc262da573bca2b1e28370406b95c',
     'newBodyHash':'e4eed8cd0695b5856e973144ea0c990b5bb083165942522ef67711314a53cc2c',
     'oldValue':'1121457028000000', 'newValue':'1118622625000000',
     'publicationDate':'2026-03-25', 'newAuditStatus':'AUDITED',
     'reason':'Issuer inventory pairs the original year-end and audited consolidated FY2025 editions. Audited finalization lineage is proposed for the exact same December balance-sheet cell only.',
     'proofs':[proof('vic-publication-web-receipt.json')]},
]
vib = read('vib-issuer-q2-recovery.json')['documents'][0]
assert vib['bodyHash'] == '0d7f9ab03feb69bd5cb64310308782731ec6b45569a502c5ab0ba0a4922d693a'
index = (B / 'targeted-indexes/VIB-current-quarter-two.body').read_text()
assert '20260727+-+VIB+-+BCTC+hop+nhat+Quy+2+2026.pdf' in index
assert 'date-created="2026/07/27 14:22"' in index
vibnote = read('ocr/' + vib['bodyHash'] + '-p48.json')
for reader in ['passA','passB']:
    text = ' '.join(w['text'] for w in vibnote[reader]).lower()
    assert 'trình bày lại' in text and 'điều chỉnh lại số cổ phiếu' in text
    assert 'cổ phiếu thưởng' in text and 'năm 2025' in text
rules.append({'ticker':'VIB','itemId':'BASIC_EPS','periodEnd':'2025-06-30',
    'periodType':'YTD', 'oldBodyHash':'a49ef62a83a8a046f3634cc746d9b6e239c20605d624170c8a1e9b3b2843fbfe',
    'newBodyHash':vib['bodyHash'],'oldValue':'1347','newValue':'1135',
    'publicationDate':'2026-07-27','newAuditStatus':'UNKNOWN',
    'reason':'Issuer note 33 explicitly restates comparative first-half 2025 EPS for ordinary bonus shares issued during 2025. No inferred adjustment factor, profit substitution or historical knowledge backdating.',
    'proofs':[proof('targeted-indexes/VIB-current-quarter-two.body'),proof('vib-issuer-q2-recovery.json'),proof('ocr/' + vib['bodyHash'] + '-p48.json')]})
vhm = read('vhm-publication-web-receipt.json')
assert vhm['method'] == 'WEB_TOOL_NORMALIZED_PUBLIC_PRIMARY_PAGE' and vhm['rawHttpResponseRetained'] is False
inventory = json.dumps(vhm['inventoryResult'], ensure_ascii=False)
assert 'Báo cáo Hợp nhất đã kiểm toán năm 2025' in inventory and '23/03/2026' in inventory
assert 'Báo cáo hợp nhất Quý IV.2025' in inventory and '30/01/2026' in inventory
rules.append({'ticker':'VHM','itemId':'CFO','periodEnd':'2025-12-31',
    'periodType':'ANNUAL',
    'oldBodyHash':'767b0c6ded8f9c08b9168dcb92a23518859ebaf515eb5490bb7055683c6138ec',
    'newBodyHash':'f2068861297d3aa4efb4be9542855b5ba58bf82e9c78a0176e4c52f71639cc62',
    'oldValue':'40674281000000','newValue':'41189141000000',
    'publicationDate':'2026-03-23','newAuditStatus':'AUDITED',
    'reason':'Issuer inventory explicitly identifies the January original Q4 and March audited consolidated FY2025 editions. Both independently transcribed CFO cells retain identical annual window, scope, caption and scale. Exact audited finalization lineage is proposed; no general audited-source winner and no issuer explanation of this individual adjustment asserted.',
    'proofs':[proof('vhm-publication-web-receipt.json'),
              proof('ocr/767b0c6ded8f9c08b9168dcb92a23518859ebaf515eb5490bb7055683c6138ec-p18.json'),
              proof('ocr/f2068861297d3aa4efb4be9542855b5ba58bf82e9c78a0176e4c52f71639cc62-p20.json')]})
mwg_inventory = (B / 'targeted-indexes/MWG-public-financial-category-2026.body').read_text()
assert 'Báo Cáo Tài Chính Hợp Nhất Quý 2 Năm 2026' in mwg_inventory
assert 'Báo Cáo Tài Chính Hợp Nhất Soát Xét Bán Niên Năm 2026' in mwg_inventory
assert '807429f16450b14b3668ded2d2e39a6e.pdf' in mwg_inventory
assert '1ddce6514da9af2bad1b21317825b88d.pdf' in mwg_inventory
rules.append({'ticker':'MWG','itemId':'CFO','periodEnd':'2026-06-30',
    'periodType':'YTD',
    'oldBodyHash':'a2a768e269d3a40f4af397be785dc65a60fb9f620bfcc8ab18f618125e4708f7',
    'newBodyHash':'41350653181ec9248619dcc8ec090f97a988ed9413aa313cb08c1f0a161b4450',
    'oldValue':'18179911416892','newValue':'3574848776785',
    'publicationDate':'2026-08-28','newAuditStatus':'REVIEWED',
    'reason':'The issuer inventory explicitly pairs the original Q2 and reviewed interim consolidated editions. Exact two-reader CFO cells share the January–June 2026 window, caption, scope and VND scale. Source images corroborate the material difference: receivables cash-flow adjustments differ between editions. This proposes reviewed-finalization lineage for this CFO cell only; no issuer explanation of the individual adjustment, blanket latest-source preference or historical knowledge backdating is asserted.',
    'proofs':[proof('targeted-indexes/MWG-public-financial-category-2026.body'),
              proof('targeted-indexes/MWG-public-financial-category-2026.json'),
              proof('ocr/a2a768e269d3a40f4af397be785dc65a60fb9f620bfcc8ab18f618125e4708f7-p9.json'),
              proof('ocr/41350653181ec9248619dcc8ec090f97a988ed9413aa313cb08c1f0a161b4450-p12.json')]})
fpt_reviewed = '92fe37939993cac356d68d12a45ab484dff873700dee6c97821e88bbc28da776'
fpt_notice = read('ocr/' + fpt_reviewed + '-p1.json')
for reader in ['passA','passB']:
    text = ' '.join(w['text'] for w in fpt_notice[reader])
    assert 'This information was published on the company' in text
    assert '20/08/2025' in text and 'Reviewed Consolidated Interim Financial Statements' in text
    assert '30/06/2025' in text
rules.append({'ticker':'FPT','itemId':'CFO','periodEnd':'2025-06-30',
    'periodType':'YTD',
    'oldBodyHash':'0c0101d03c634e1b000b48a46e241f10014a62d9fc37b090ea325ca6fa9e29d2',
    'newBodyHash':fpt_reviewed,
    'oldValue':'1650653590894','newValue':'1683573278329',
    'publicationDate':'2025-08-20','newAuditStatus':'REVIEWED',
    'reason':'The reviewed report contains the issuer disclosure notice explicitly confirming website publication on 20 August 2025 for consolidated first-half 2025 statements. Exact original and reviewed CFO cells share the January–June window, scope and VND scale; both preparation notes expressly state VAS. This proposes lineage for this single reviewed-finalization cell. Its value is also corroborated by the later explicitly labelled first-half 2025 comparative; this does not establish compatibility of FTEL income restatements or permit TTM scope mixing.',
    'proofs':[proof('ocr/' + fpt_reviewed + '-p1.json'),
              proof('ocr/' + fpt_reviewed + '-p15.json'),
              proof('ocr/0c0101d03c634e1b000b48a46e241f10014a62d9fc37b090ea325ca6fa9e29d2-p10.json'),
              proof('ocr/0c0101d03c634e1b000b48a46e241f10014a62d9fc37b090ea325ca6fa9e29d2-p13.json'),
              proof('ocr/a5aa01df2225a062db3410ce29f0462eaac3d73ee266267c823904a22ae993eb-p13.json')]})
fpt_current_reviewed = '45636554f28c7e6c2f38458b9a22410ed1f67e80627d672b827019a67f299df8'
fpt_current_notice = read('ocr/' + fpt_current_reviewed + '-p1.json')
for reader in ['passA','passB']:
    text = ' '.join(w['text'] for w in fpt_current_notice[reader])
    assert 'This information was published on the company' in text
    assert '21/08/2026' in text and 'Reviewed Consolidated Interim Financial Statements' in text
    assert '30/06/2026' in text
rules.append({'ticker':'FPT','itemId':'TOTAL_EQUITY','periodEnd':'2026-06-30',
    'periodType':'INSTANT',
    'oldBodyHash':'a5aa01df2225a062db3410ce29f0462eaac3d73ee266267c823904a22ae993eb',
    'newBodyHash':fpt_current_reviewed,
    'oldValue':'40995747830250','newValue':'40995680808257',
    'publicationDate':'2026-08-21','newAuditStatus':'REVIEWED',
    'reason':'The issuer notice attached to the reviewed report explicitly confirms website publication on 21 August 2026. Exact original Q2 and reviewed consolidated total-equity cells share the June balance date, VAS and VND scale. Candidate reviewed-finalization lineage covers only this total-equity cell; it establishes neither common equity nor a general latest-source winner.',
    'proofs':[proof('ocr/' + fpt_current_reviewed + '-p1.json'),
              proof('ocr/' + fpt_current_reviewed + '-p11.json'),
              proof('ocr/a5aa01df2225a062db3410ce29f0462eaac3d73ee266267c823904a22ae993eb-p6.json')]})
# Exact newly verified FPT cells: original Q2 versus issuer-notified reviewed H1.
for item,old,new,oldpage,newpage,kind in [
 ('CURRENT_ASSETS','45701998651416','45603129033273',3,8,'INSTANT'),
 ('INVENTORY','1183102091533','1255307762494',3,8,'INSTANT'),
 ('GROSS_PROFIT','8523519070902','8524634170902',7,12,'YTD'),
 ('NET_INCOME','5047195955096','5047128933102',7,12,'YTD'),
]:
 oldbody='a5aa01df2225a062db3410ce29f0462eaac3d73ee266267c823904a22ae993eb'
 oldcells=read('verified-cells.json');newcells=read('source-image-verified-cells.json')
 for cells,body,value in [(oldcells,oldbody,old),(newcells,fpt_current_reviewed,new)]:
  matches=[c for c in cells if c['bodyHash']==body and c['itemId']==item and c['period']['end']=='2026-06-30']
  assert len(matches)==1 and str(matches[0]['verifiedCanonicalInteger'])==value
 rules.append({'ticker':'FPT','itemId':item,'periodEnd':'2026-06-30','periodType':kind,
  'oldBodyHash':oldbody,'newBodyHash':fpt_current_reviewed,'oldValue':old,'newValue':new,
  'publicationDate':'2026-08-21','newAuditStatus':'REVIEWED',
  'reason':'The issuer notice attached to the reviewed consolidated H1 report explicitly confirms website publication on 21 August 2026. Exact separately verified original Q2 and reviewed H1 cells share period, VAS, consolidated scope and VND scale. This proposes finalization lineage for this individual reported cell only. Both roots remain retained; no cause of adjustment, blanket latest-source preference or historical knowledge backdating is asserted.',
  'proofs':[proof('ocr/'+fpt_current_reviewed+'-p1.json'),proof('ocr/'+oldbody+'-p'+str(oldpage)+'.json'),proof('ocr/'+fpt_current_reviewed+'-p'+str(newpage)+'.json'),proof('fpt-current-additional-source-image-reader-proof.json')]})

# Newly extracted independent cells retain exact finalization lineage per cell.
# These are specific reported changes, never a blanket preference for audit status.
for item,old,new,oldpage,newpage in [
 ('CURRENT_ASSETS','825661216000000','842400726000000',6,9),
 ('INVENTORY','261745101000000','284664807000000',6,9),
]:
 rules.append({'ticker':'VIC','itemId':item,'periodEnd':'2026-06-30','oldBodyHash':'9a044beccdd8ec36eba001ecbcf5217b6d0695ba51d3a30d2de96fbe3c1f2d85','newBodyHash':'a82cc3eaf79ced481ad28ea4ce311053725d8f2f0e1c5bc15bbce3938a8babd8','oldValue':old,'newValue':new,'publicationDate':'2026-08-29','newAuditStatus':'REVIEWED','reason':'The retained issuer inventory pairs the original Q2 and reviewed consolidated June 2026 editions. Exact independent statement readings establish this balance-sheet change. This specific reviewed-finalization proposal retains both cells and does not assert an issuer explanation of the adjustment.','proofs':[proof('vic-publication-web-receipt.json'),proof('ocr/9a044beccdd8ec36eba001ecbcf5217b6d0695ba51d3a30d2de96fbe3c1f2d85-p'+str(oldpage)+'.json'),proof('ocr/a82cc3eaf79ced481ad28ea4ce311053725d8f2f0e1c5bc15bbce3938a8babd8-p'+str(newpage)+'.json')]})
rules.append({'ticker':'VIC','itemId':'CURRENT_LIABILITIES','periodEnd':'2025-12-31','oldBodyHash':'dff5cb854c61611fa83947bc4695891998abc262da573bca2b1e28370406b95c','newBodyHash':'e4eed8cd0695b5856e973144ea0c990b5bb083165942522ef67711314a53cc2c','oldValue':'592409830000000','newValue':'587454564000000','publicationDate':'2026-03-25','newAuditStatus':'AUDITED','reason':'The issuer inventory identifies original Q4 and audited consolidated FY2025 editions. Exact independently transcribed current-liability cells share date, scope and million-VND scale. This individual finalization proposal retains the earlier value; no generic latest-source rule or explanation of the specific adjustment is asserted.','proofs':[proof('vic-publication-web-receipt.json'),proof('ocr/dff5cb854c61611fa83947bc4695891998abc262da573bca2b1e28370406b95c-p8.json'),proof('ocr/e4eed8cd0695b5856e973144ea0c990b5bb083165942522ef67711314a53cc2c-p11.json')]})
gvr_old='1412939075c4c3ffc74e790a3d3676f7db68382456859bd4b167041a7a5949aa';gvr_new='130a96da49283c15d39ec57a4e30edff844dfe4f4d1c5847910398669414c1ea'
gvr_index=(B/'targeted-indexes/GVR.body').read_text();gvr_receipt=read('targeted-indexes/GVR.json')
assert gvr_receipt['httpStatus']==200 and hashlib.sha256((B/'targeted-indexes/GVR.body').read_bytes()).hexdigest()==gvr_receipt['bodySha256']
assert '20260330-GVR-Bao-cao-tai-chinh-hop-nhat-nam-2025.pdf' in gvr_index and '20260129-GVR-Bao-cao-tai-chinh-hop-nhat-quy-4-nam-2025.pdf' in gvr_index
gvr_cards = [card for card in re.split(r'(?=<div data-elementor-type="loop-item")', gvr_index) if '20260330-GVR-Bao-cao-tai-chinh-hop-nhat-nam-2025.pdf' in card]
assert len(gvr_cards) == 1
assert 'Báo cáo tài chính hợp nhất năm 2025 (kèm Giải trình)' in gvr_cards[0]
assert re.findall(r'elementor-icon-list-text">([^<]+)', gvr_cards[0]) == ['30/03/2026']
for reader in ['passA','passB']:
 text=' '.join(w['text'] for w in read('ocr/'+gvr_new+'-p1.json')[reader])
 assert 'trước kiểm toán' in text and 'sau kiểm toán' in text and 'năm 2025' in text and 'Báo cáo tài chính hợp nhất' in text
rules.append({'ticker':'GVR','itemId':'TOTAL_EQUITY','periodEnd':'2025-12-31','oldBodyHash':gvr_old,'newBodyHash':gvr_new,'oldValue':'62601426282319','newValue':'62201582701022','publicationDate':'2026-03-30','publicationBoundaryKind':'ISSUER_INDEX_DATE_ONLY','historicalIssuerPublicationAsserted':True,'newAuditStatus':'AUDITED','reason':'The primary issuer inventory links original Q4 and audited FY2025 consolidated reports, and the issuer explanation explicitly describes before/after audit changes. Exact total-equity cells share December date, scope and VND scale. This specific finalization proposal retains both roots. The explanation discusses profit adjustments and is not asserted as the cause of the equity adjustment. The exact issuer index card binds this consolidated audited attachment to the displayed publication date 30/03/2026; no time of day is asserted. Review knowledge remains at actual live execution.','proofs':[proof('targeted-indexes/GVR.body'),proof('targeted-indexes/GVR.json'),proof('ocr/'+gvr_new+'-p1.json'),proof('ocr/'+gvr_new+'-p11.json'),proof('ocr/'+gvr_old+'-p9.json')]})
for item,old,new in [('CURRENT_ASSETS','660924812000000','658772464000000'),('INVENTORY','206993940000000','201580276000000')]:
 rules.append({'ticker':'VIC','itemId':item,'periodEnd':'2025-12-31','oldBodyHash':'dff5cb854c61611fa83947bc4695891998abc262da573bca2b1e28370406b95c','newBodyHash':'e4eed8cd0695b5856e973144ea0c990b5bb083165942522ef67711314a53cc2c','oldValue':old,'newValue':new,'publicationDate':'2026-03-25','newAuditStatus':'AUDITED','reason':'Exact original Q4 and audited consolidated FY2025 editions are paired in the retained issuer inventory. Independently read year-end cells have identical caption, scope, date and million-VND scale. This proposes finalization lineage for this individual cell and retains both predecessor values; no cause of adjustment or generic audited-source preference is asserted.','proofs':[proof('vic-publication-web-receipt.json'),proof('ocr/dff5cb854c61611fa83947bc4695891998abc262da573bca2b1e28370406b95c-p6.json'),proof('ocr/e4eed8cd0695b5856e973144ea0c990b5bb083165942522ef67711314a53cc2c-p9.json')]})
hpg_old='1f5c4b14f867d2683fd3a84fe0f31fed6fc9920fdcd768c0eaaa1a6e9d19ea71';hpg_new='9a2881a88ac8ca4cc5cd948b0fafa031ff30fd0332a372f362477a8a6b0c9968'
assert '29/8/2025' in vic['inventoryResult'] and '30/7/2025' in vic['inventoryResult']
rules.append({'ticker':'VIC','itemId':'CFO','periodEnd':'2025-06-30','periodType':'YTD','oldBodyHash':'25e74cb5018e225395e9e8e21a50610ecaf3b6412eebe3e2e8bb5c2e9c7f36f6','newBodyHash':'875a5d91d7b655f52725d062791c9e20def09e663f04517bae148e0ab038099f','oldValue':'44098175000000','newValue':'70748727000000','publicationDate':'2025-08-29','newAuditStatus':'REVIEWED','reason':'The retained primary issuer FY2025 inventory explicitly pairs original Q2 publication on 30/7/2025 with the reviewed consolidated interim publication on 29/8/2025. Exact independent CFO readings retain identical January-June window, scope, caption and million-VND scale. This proposes finalization lineage for this specific cash-flow amount; both roots remain retained and no explanation of the adjustment is asserted.','proofs':[proof('vic-publication-web-receipt.json'),proof('ocr/25e74cb5018e225395e9e8e21a50610ecaf3b6412eebe3e2e8bb5c2e9c7f36f6-p12.json'),proof('ocr/875a5d91d7b655f52725d062791c9e20def09e663f04517bae148e0ab038099f-p15.json')]})
hpg_file=B/'targeted-indexes/HPG.body';hpg_index=hpg_file.read_text();hpg_receipt=read('targeted-indexes/HPG.json')
assert str(hpg_receipt['httpStatus'])=='200' and hashlib.sha256(hpg_file.read_bytes()).hexdigest()==hpg_receipt['bodySha256']
assert '20260730-hpg-bctc-hop-nhat-quy-2-2026-va-giai-trinh.pdf' in hpg_index
hpg_cards=[c for c in hpg_index.split('<div class="item ') if '20260828-hpg-bctc-hop-nhat-soat-xet-6-thang-2026-va-giai-trinh-1-2.pdf' in c]
assert len(hpg_cards)==1 and 'Báo cáo tài chính hợp nhất soát xét 6 tháng 2026' in hpg_cards[0]
assert re.findall(r'<div class="time">\s*(\d{2}/\d{2}/\d{4})',hpg_cards[0])==['28/08/2026']
for item,old,new,oldpage,newpage in [('CURRENT_ASSETS','119968988620841','119968988853207',2,9),('TOTAL_ASSETS','278929786015406','278929786247772',4,10),('TOTAL_EQUITY','141516026558331','141516026790697',5,11)]:
 rules.append({'ticker':'HPG','itemId':item,'periodEnd':'2026-06-30','oldBodyHash':hpg_old,'newBodyHash':hpg_new,'oldValue':old,'newValue':new,'publicationDate':'2026-08-28','publicationBoundaryKind':'ISSUER_INDEX_DATE_ONLY','newAuditStatus':'REVIEWED','reason':'The exact primary issuer card binds the reviewed consolidated six-month attachment to 28/08/2026 and retains the original Q2 attachment. Both independent readings agree on the same June balance date, caption, scope and VND amount. This cell-specific reviewed-finalization proposal retains original roots and does not assert an explanation of the difference or a general latest-source winner.','proofs':[proof('targeted-indexes/HPG.body'),proof('targeted-indexes/HPG.json'),proof('ocr/'+hpg_old+'-p'+str(oldpage)+'.json'),proof('ocr/'+hpg_new+'-p'+str(newpage)+'.json')]})
sab_file=B/'targeted-indexes/SAB-required-half-year-2025.body';sab_index=sab_file.read_text();sab_receipt=read('targeted-indexes/SAB-required-half-year-2025.json')
assert sab_receipt['httpStatus']=='200' and hashlib.sha256(sab_file.read_bytes()).hexdigest()==sab_receipt['bodySha256']
assert re.search(r'1H25-CONSO-VN\.pdf">Báo cáo tài chính hợp nhất soát xét giữa niên độ cho giai đoạn 6 tháng kết thúc ngày 30/6/2025</a> \(29/8/2025\)',sab_index)
for item,old,new,oldpage,newpage,kind in [('CFO','2183477929171','2192355157048',9,12,'YTD'),('TOTAL_EQUITY','22874341599508','22874341599509',7,9,'INSTANT')]:
 rules.append({'ticker':'SAB','itemId':item,'periodEnd':'2025-06-30','periodType':kind,'oldBodyHash':'293b47699b4ef6b3ce9d1ea311702c62a4954595e96b00f7abd2362d9498e66b','newBodyHash':'ba39ad052b8a5b7d78bbc5918b94f9ff36523d860a5df2fdbd23baac1991ff38','oldValue':old,'newValue':new,'publicationDate':'2025-08-29','publicationBoundaryKind':'ISSUER_INDEX_DATE_ONLY','newAuditStatus':'REVIEWED','reason':'The exact issuer FY2025 inventory binds the consolidated reviewed six-month report to displayed publication date 29/8/2025. Exact source readings preserve the original Q2 and reviewed H1 same-period VND cells; the reviewed CFO is also reproduced in the current H1/2026 comparative column. This proposes finalization lineage only for this individual cell. Neither a cause of adjustment nor generic rounding tolerance or latest-source preference is asserted.','proofs':[proof('targeted-indexes/SAB-required-half-year-2025.body'),proof('targeted-indexes/SAB-required-half-year-2025.json'),proof('ocr/293b47699b4ef6b3ce9d1ea311702c62a4954595e96b00f7abd2362d9498e66b-p'+str(oldpage)+'.json'),proof('ocr/ba39ad052b8a5b7d78bbc5918b94f9ff36523d860a5df2fdbd23baac1991ff38-p'+str(newpage)+'.json')]})
for rule in rules:
    for key in ['oldBodyHash', 'newBodyHash']:
        assert hashlib.sha256((B / (rule[key] + '.pdf')).read_bytes()).hexdigest() == rule[key]
    rule['reportingScope'] = 'CONSOLIDATED'
    rule.setdefault('periodType', 'INSTANT')
    rule['status'] = 'REVIEW_CANDIDATE'
    rule['approvalReference'] = None
out = {'version':'exact-issuer-financial-finalization-lineage-v1',
       'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
       'governanceStatus':'PROPOSED', 'approvalReference':None,
       'policy':'Only these exact source bodies, comparable cells, values and issuer disclosure evidence; preserve all predecessors. Actual knowledge time is execution time, never publication date.',
       'rules':rules}
(B / 'issuer-revision-evidence.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'exactRevisionCandidates':len(rules)}))
