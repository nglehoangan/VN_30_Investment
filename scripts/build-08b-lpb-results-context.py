"""Retain exact issuer risk-context claims; do not turn them into accounting facts."""
import datetime, hashlib, json, pathlib
from html.parser import HTMLParser

B=pathlib.Path('data/initialization-08b-remediation-work')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
receipt_file=B/'input-sources/LPB-issuer-6m26-results-receipt.json'
receipt=json.loads(receipt_file.read_text());body=pathlib.Path(receipt['bodyFile'])
assert receipt['httpStatus']==200 and receipt['curlExitCode']==0 and sha(body)==receipt['bodySha256']
assert receipt['effectiveUrl']==receipt['url'] and receipt['url'].startswith('https://lpbank.com.vn/')
class VisibleText(HTMLParser):
    def __init__(self):super().__init__();self.skip=0;self.parts=[]
    def handle_starttag(self,t,a):
        if t in ['script','style']:self.skip+=1
    def handle_endtag(self,t):
        if t in ['script','style']:self.skip=max(0,self.skip-1)
    def handle_data(self,s):
        if not self.skip:self.parts.append(s)
parser=VisibleText();parser.feed(body.read_text());text=' '.join(' '.join(parser.parts).split())
anchors=['Đến ngày 30/6/2026','Tính đến cuối tháng 6/2026','tỷ lệ nợ xấu được kiểm soát ở mức 1,85%','tỷ lệ an toàn vốn (CAR) đạt 11,23%']
assert all(a in text for a in anchors)
view_file=B/'input-sources/LPB-issuer-6m26-results-visible-text.json'
view_file.write_text(json.dumps({'method':'PYTHON_HTMLPARSER_VISIBLE_TEXT_EXCLUDING_SCRIPTS_AND_STYLES','bodySha256':sha(body),'text':text},ensure_ascii=False,indent=2)+'\n')
preview=json.loads((B/'execution-preview.json').read_text());identity=next(r for r in preview['readiness'] if r['ticker']=='LPB');out=[]
for metric,claim,missing,rationale in [
    ('FH-BS-BANK-01',{'sourceCaption':'tỷ lệ an toàn vốn (CAR)','lexicalValue':'11,23%','valueKind':'ISSUER_CONTEXT_CLAIM_NOT_ADMITTED_ACCOUNTING_FACT'},['REGULATORY_BASIS_AND_SCOPE','APPLICABLE_MINIMUM_AND_MANAGEMENT_BUFFER','RISK_WEIGHT_DENSITY','GROWTH_CAPITAL_REQUIREMENTS','ASSET_QUALITY_SENSITIVITY'], 'The issuer reports a June capital ratio in its public results article. The article alone does not establish consolidated/regulatory scope, capital regime, minimum or underwriting buffer; the marketing description of a strong buffer is not a reviewed adequacy conclusion.'),
    ('FH-BS-BANK-02',{'sourceCaption':'tỷ lệ nợ xấu','lexicalValue':'1,85%','valueKind':'ISSUER_CONTEXT_CLAIM_NOT_ADMITTED_ACCOUNTING_FACT'},['EXACT_NPL_DEFINITION_AND_SCOPE','NPL_AMOUNT_AND_GROSS_CUSTOMER_LOAN_OPERANDS','RECOGNITION_RESTRUCTURING_WRITEOFF_CONTEXT','PROVISION_SUFFICIENCY_AND_TREND'], 'The issuer reports a June NPL percentage. It is retained as source context without reconstructing a rounded loan numerator or accepting the issuer quality assertion as a score. Exact loan classifications, denominator, provisions and recognition risks remain necessary under the frozen rubric.'),
]:
    authority=next(m['authority'] for m in preview['requirementsMatrix']['metrics'] if m['metricId']==metric)
    proof={'kind':'PUBLIC_ISSUER_HTML_CONTEXT','sourceReceiptFile':str(receipt_file),'sourceReceiptSha256':sha(receipt_file),'bodyFile':str(body),'bodySha256':sha(body),'visibleTextFile':str(view_file),'visibleTextSha256':sha(view_file),'url':receipt['url'],'actualRetrievedAt':receipt['actualRetrievedAt'],'exactVisibleTextAnchors':anchors,'historicalPublicationAsserted':False}
    out.append({'id':'slice08b-LPB-'+metric+'-issuer6m26-context','ticker':'LPB','securityId':identity['securityId'],'metricId':metric,'evidenceKind':'QUANTITATIVE_CONTEXT_EVIDENCE','sourceAsOf':'2026-06-30','reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'CODEX_DATA_PRODUCER_MACHINE_REVIEW','rubricAuthority':authority,'evidence':[proof],'sourceClaims':[claim],'reportedAccountingFact':False,'reviewerRationale':rationale,'confidence':'MEDIUM','confidenceMeaning':'SOURCE_AND_RUBRIC_RELEVANCE_ONLY; NOT_INVESTMENT_CONFIDENCE','coverageStatus':'PARTIAL_RUBRIC_EVIDENCE','remainingRequiredContext':missing,'canonicalOperandIds':[],'derivedAssessmentId':None,'score':None,'governanceStatus':'REVIEW_CANDIDATE','approvalReference':None})
(B/'lpb-results-metric-context-evidence.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'contextPackages':len(out),'admittedAccountingFacts':0,'scores':0}))
