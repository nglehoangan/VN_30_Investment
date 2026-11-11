from pathlib import Path
import json,hashlib,unicodedata,collections
R=Path.cwd();O=R/'docs/fundamental-data-engine/scoring-usability-remediation/v1-1-bdae658a';V=R/'docs/fundamental-data-engine/scoring-usability-audit/v1-ad81bdce';m=json.loads((V/'VN30_ISSUER_RUBRIC_MATRIX.json').read_text());target=[r for r in m['rows']if r['primaryClassification']=='NOT_INSPECTED'];ledger=json.loads((V/'FINANCIAL_EVIDENCE_LEDGER.json').read_text());pins={};rows=[];inventory=[]
def read(p):pins[p]=hashlib.sha256((R/p).read_bytes()).hexdigest();return json.loads((R/p).read_text())
def bind(p,ptr=''):return dict(path=p,sha256=pins[p],jsonPointer=ptr)
def fold(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower().replace('đ','d'))if not unicodedata.combining(c))
T={
'FH-STRESS':{'scenario':['phân tích độ nhạy','kịch bản','độ nhạy','thay đổi hợp lý'],'funding_response':['rủi ro thanh khoản','kỳ hạn còn lại','thời hạn còn lại','hạn mức tín dụng'],'capital_response':['an toàn vốn','vốn chủ sở hữu','vốn tự có']},
'IC-IND':{'barriers':['giấy phép','điều kiện kinh doanh','rào cản'],'competition':['cạnh tranh','đối thủ','thị phần'],'demand':['doanh thu bán','nhu cầu','hoạt động chính','hoạt động chủ yếu','đơn đặt hàng'],'disruption':['chuyển đổi số','thay đổi công nghệ','rủi ro thị trường']},
'IC-POS':{'share':['thị phần','market share'],'cost_position':['giá vốn','chi phí hoạt động','biên lợi nhuận'],'distribution':['chi nhánh','cửa hàng','đại lý','mạng lưới','phân phối sản phẩm']},
'IC-CYCLE':{'cycle':['tính chu kỳ','giá dầu','giá thép','biến động giá','rủi ro thị trường'],'forward_asymmetry':['phân tích độ nhạy','độ nhạy','thay đổi hợp lý','kịch bản'],'survivability':['hoạt động liên tục','thanh khoản','nợ quá hạn','gia hạn']},
'RG-GOV':{'disclosure':['theo ý kiến','trung thực và hợp lý','ngoại trừ','không đưa ra ý kiến'],'related_parties':['bên liên quan'],'minority':['cổ đông không kiểm soát','cổ đông thiểu số','lợi ích không kiểm soát'],'auditor':['theo ý kiến','kiểm toán viên']},
'RG-UNC':{'forecast_range':['ước tính','dự báo','kế hoạch','kịch bản'],'sensitivity':['độ nhạy','thay đổi giả định','tỷ lệ chiết khấu'],'dependencies':['giả định','ước tính','dự phòng','giá trị hợp lý']},
'CA-REINV':{'capex':['mua sắm','xây dựng cơ bản','tài sản cố định','chi phí đầu tư'],'acquisitions':['hợp nhất kinh doanh','mua công ty','mua lại','lợi thế thương mại'],'divestments':['thanh lý','nhượng bán','thoái vốn','bán công ty']},
'CA-DIL':{'issue_terms':['phát hành thêm','phát hành cổ phiếu','cổ tức bằng cổ phiếu','thưởng cổ phiếu','tăng vốn điều lệ'],'proceeds':['thặng dư vốn','tiền thu từ phát hành','sử dụng vốn'],'per_share':['lãi cơ bản trên cổ phiếu','lãi suy giảm','số lượng cổ phiếu','thu nhập trên mỗi']},
'CA-PSV':{'per_share':['lãi cơ bản trên cổ phiếu','lãi suy giảm','số lượng cổ phiếu','thu nhập trên mỗi'],'actions':['cổ phiếu quỹ','cổ tức','phát hành','vốn cổ phần'],'cycle_adjustment':['chu kỳ','độ nhạy','thay đổi ước tính']},
'BQ-RES':{'concentration':['tập trung','khách hàng lớn','bộ phận','bất động sản'],'pricing_power':['giá bán','giá vốn','giá thị trường'],'cyclicality':['chu kỳ','biến động giá','rủi ro thị trường'],'stress':['độ nhạy','thanh khoản','hoạt động liên tục']}}
F={'scenario':['NPL_BANK_CORE_RATIO','BANK_CUSTOMER_LOAN_NPL_RATIO'],'funding_response':['CASH_AND_EQUIVALENTS','REPORTED_BORROWINGS','BANK_CUSTOMER_DEPOSITS','FINANCIAL_DEBT'],'capital_response':['TOTAL_EQUITY','BANK_REPORTED_CAR','BANK_REPORTED_CET1'],'cost_position':['GROSS_PROFIT','REVENUE','OPERATING_REVENUE'],'cycle':['NET_INCOME','NET_INCOME_YOY','REVENUE_YOY'],'survivability':['TOTAL_EQUITY','CASH_AND_EQUIVALENTS','REPORTED_BORROWINGS'],'capex':['CASH_CAPEX_REPORTED','CFO','POST_ACQUISITION_CASH'],'acquisitions':['POST_ACQUISITION_CASH','TOTAL_ASSETS'],'per_share':['BASIC_EPS','REPORTED_BASIC_EPS','CLOSING_SHARES','WEIGHTED_BASIC_SHARES','NET_INCOME_ATTRIBUTABLE_PARENT','COMMON_EPS_NUMERATOR'],'actions':['CLOSING_SHARES','SHARE_MOVEMENT','ISSUED_SHARES'],'issue_terms':['SHARE_MOVEMENT','ISSUED_SHARES','CLOSING_SHARES'],'proceeds':['PARENT_SHARE_PREMIUM_MOVEMENT','TOTAL_EQUITY'],'concentration':['TOTAL_ASSETS'],'forecast_range':['NET_INCOME_ATTRIBUTABLE_PARENT'],'dependencies':['NET_INCOME_ATTRIBUTABLE_PARENT','TOTAL_EQUITY']}
for ticker in sorted(set(r['ticker']for r in target)):
 print('Semantic search',ticker,flush=True);p=f'data/manual-extracted-pdf/notes/{ticker}.json';d=read(p);pages=[]
 for di,doc in enumerate(d['documents']):
  name=str(doc.get('pdfPath')or doc.get('pdfPaths',[''])[0]);priority=(0 if ('2025' in name and 'Kiemtoan' in name and 'Hopnhat' in name)else 1 if '2025'in name else 2)
  for pi,page in enumerate(doc['pages']):pages.append((priority,di,pi,doc,page,fold(page.get('text',''))))
 sourcepaths=[f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-comparability-r2/native-inputs/{ticker}.json',f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/investment-research-v2/issuers/{ticker}.json',f'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-04/earnings-normalization-v4/issuers/{ticker}.json']
 research={sp:read(sp)for sp in sourcepaths};ir=research[sourcepaths[1]]
 inventory.append({'ticker':ticker,'notes':bind(p),'documents':len(d['documents']),'pages':len(pages),'researchSources':[bind(sp)for sp in sourcepaths],'method':'All retained note-page text searched with accent-folded topic-specific terms; candidate passages gathered for semantic review. Search hit is not qualification; negative search is not absence proof.'})
 for r in [x for x in target if x['ticker']==ticker]:
  topics=[]
  for topic in r['requiredTopics']:
   terms=T[r['rubric']][topic];hits=[]
   for priority,di,pi,doc,page,txt in pages:
    found=[term for term in terms if (term.lower()in page['text'].lower() if term=='thị phần' else fold(term)in txt)]
    if found:
     term=found[0];pos=txt.find(fold(term));excerpt=page['text'][max(0,pos-180):pos+800]
     hits.append({'priority':priority,'semanticRank':(3 if ('theo y kien' in txt or 'trung thuc va hop ly' in txt)and topic in ['disclosure','auditor'] else 10 if topic=='related_parties'and any(w in txt for w in ['giao dich voi cac ben lien quan','nghiep vu va so du voi cac ben lien quan','thuyet minh ve cac ben lien quan','nghiep vu voi cac ben lien quan','giao dich chu yeu voi cac ben lien quan'])else 3 if topic=='related_parties' and any(w in txt for w in ['giao dich voi','so du voi','nghiep vu'])and sum(c.isdigit()for c in txt)>30 else 2 if topic=='per_share'and 'lai co ban' in txt and sum(c.isdigit()for c in txt)>30 else 0),'binding':bind(p,f'/documents/{di}/pages/{pi}'),'pdfPath':doc.get('pdfPath')or doc.get('pdfPaths',[''])[0],'pdfHash':doc.get('sourceHash'),'physicalPage':page['page'],'sourceStatus':page.get('status'),'matchedTerms':found,'excerpt':excerpt,'qualification':'RETAINED_TEXT_CANDIDATE_NOT_FULL_TOPIC_PROOF'})
   hits.sort(key=lambda x:(x['priority'],-x['semanticRank'],-len(x['matchedTerms']),x['physicalPage']))
   # Keep best pages, preferring different documents only when no target-year annual match exists.
   best=hits[:2]
   contexts=[ident for ident,x in ledger.items()if x['ticker']==ticker and x['concept']in F.get(topic,[])]
   topics.append({'topic':topic,'searchTerms':terms,'totalMatchedPages':len(hits),'selectedPassages':best,'existingFinancialContextIds':contexts,'fullTopicQualified':False})
  rows.append({'id':r['id'],'ticker':ticker,'rubric':r['rubric'],'sector':r['sector'],'requiredTopics':r['requiredTopics'],'topics':topics,'retainedResearch':{'financialNarrative':research[sourcepaths[0]].get('financialNarrative'),'remainingInputs':research[sourcepaths[0]].get('remainingInputs'),'shareAnchor':ir.get('shareAnchor'),'shareAnchorBinding':bind(sourcepaths[1],'/shareAnchor')if 'shareAnchor'in ir else None,'actionBridgeComplete':ir.get('actionBridgeComplete'),'normalizationAcceptance':research[sourcepaths[2]].get('acceptanceDecision'),'acceptedNormalizedCommonEarningsVnd':research[sourcepaths[2]].get('acceptedNormalizedCommonEarningsVnd')},'formalPoints':None})
(O/'semantic-search-pack.json').write_text(json.dumps({'rows':rows,'inventory':inventory},ensure_ascii=False,indent=2)+'\n');(O/'semantic-source-pins.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n');print('Packed',len(rows),flush=True)
