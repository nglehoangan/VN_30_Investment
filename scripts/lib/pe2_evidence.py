"""Read-only PE2 replay of pinned historical captures. No transport or admission API."""
import datetime
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, unquote

REQUIRED_CLOCKS = ('publicationBoundary','sourceRetrievedAt','documentRetrievedAt','sourceVerifiedAt','documentVerifiedAt','ingestedAt','mappingKnownAt','methodologyKnownAt','registryKnownAt','sourceContractKnownAt','identityMethodKnownAt','sourceMethodKnownAt','identityBindingKnownAt','policyKnownAt','otherRequiredContractBoundaries')
def canonical(value):
    return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'),allow_nan=False)
def content_hash(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()
def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def load(path):
    return json.loads(Path(path).read_text())
def boundary(date):
    d=datetime.date.fromisoformat(date)+datetime.timedelta(days=1)
    return datetime.datetime.combine(d,datetime.time(),datetime.timezone(datetime.timedelta(hours=7))).astimezone(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
def instant(value):
    if not isinstance(value,str):raise ValueError('MISSING_KNOWLEDGE_CLOCK')
    d=datetime.datetime.fromisoformat(value.replace('Z','+00:00'))
    if d.tzinfo is None:raise ValueError('UNQUALIFIED_KNOWLEDGE_CLOCK')
    return d
class Tree(HTMLParser):
    def __init__(self,text):
        super().__init__(convert_charrefs=True);self.text=text;self.starts=[0];self.nodes=[];self.stack=[]
        for i,c in enumerate(text):
            if c=='\n':self.starts.append(i+1)
        self.feed(text)
    def handle_starttag(self,tag,attrs):
        start=self.starts[self.getpos()[0]-1]+self.getpos()[1];node={'tag':tag,'attrs':dict(attrs),'start':start,'end':len(self.text),'parent':self.stack[-1] if self.stack else None};self.nodes.append(node)
        if tag not in ['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']:self.stack.append(node)
        else:node['end']=start+len(self.get_starttag_text())
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i]['tag']==tag:
                end=self.starts[self.getpos()[0]-1]+self.getpos()[1]+len(tag)+3
                for node in self.stack[i:]:node['end']=end
                del self.stack[i:];break

def knowledge_assessment(clocks,cutoff,period_end,authority):
    missing=[k for k in REQUIRED_CLOCKS if clocks.get(k) is None]
    if missing:return {'status':'BLOCKED_MISSING_KNOWLEDGE','missing':missing,'effectiveKnownAt':None,'asKnownEligible':False}
    times=[instant(clocks[k]) for k in REQUIRED_CLOCKS if k!='otherRequiredContractBoundaries']
    other=clocks['otherRequiredContractBoundaries']
    if not isinstance(other,list):raise ValueError('INVALID_OTHER_BOUNDARIES')
    times.extend(instant(r['at']) for r in other)
    if set(authority)!={'sourceContract','sourceMethod','identityMethod','registryMapping'} or any(r.get('governanceStatus')!='APPROVED' or not r.get('approvalReference') for r in authority.values()):return {'status':'BLOCKED_AUTHORITY','missing':[],'effectiveKnownAt':None,'asKnownEligible':False}
    system,decision,assessed=[instant(cutoff.get(k)) for k in ['systemKnownAt','decisionAsOf','assessedAt']]
    effective=max(times)
    ok=effective<=system<=decision<=assessed and datetime.date.fromisoformat(period_end)<=decision.date()
    for a in authority.values():
        ok=ok and instant(a['knownAt'])<=system and instant(a['effectiveFrom'])<=decision and (a.get('effectiveThrough') is None or assessed<instant(a['effectiveThrough']))
    return {'status':'AS_KNOWN_ELIGIBLE_CANDIDATE_ONLY' if ok else 'BLOCKED_LOOKAHEAD_OR_EFFECTIVITY','missing':[],'effectiveKnownAt':effective.isoformat(),'asKnownEligible':ok}

def verify_receipt(root,receipt,expected):
    b=receipt['body']
    if content_hash(b)!=receipt['contentHash'] or receipt['receiptId']!='pe2-source-binding-sha256:'+receipt['contentHash']:raise ValueError('RECEIPT_HASH_MISMATCH')
    # Expected identities come from independently pinned baseline/producer-review artifacts, not the receipt itself.
    for field in ['disclosureId','ticker','issuerLegalName','period','scope','documentType','documentURL','documentPath','documentSha256','sourceURL','sourcePath','sourceSha256','publicationDate','policyHash','implementationHash','obligationBindings','identityClass','retainedPDFs','publicationLocator','verificationReviewSha256','relevantContractCodePins']:
        if b[field]!=expected[field]:raise ValueError('BINDING_MISMATCH:'+field)
    for path,h in b['relevantContractCodePins'].items():
        if file_hash(root/path)!=h:raise ValueError('CONTRACT_CODE_REPLACEMENT')
    if b['sourceContractIdentity'] is not None or b['authorityStatus']!='PROPOSED_NOT_APPROVED':raise ValueError('INVALID_AUTHORITY_IDENTITY')
    if b['publishedAt'] is not None or b['publicationPrecision']!='DATE_ONLY' or b['timezone']!='Asia/Ho_Chi_Minh' or b['publicationBoundary']!=boundary(b['publicationDate']):raise ValueError('PUBLICATION_BOUNDARY_CONFLICT')
    if file_hash(root/b['documentPath'])!=b['documentSha256']:raise ValueError('DOCUMENT_REPLACEMENT')
    if file_hash(root/b['sourcePath'])!=b['sourceSha256']:raise ValueError('METADATA_REPLACEMENT')
    text=(root/b['sourcePath']).read_text();loc=b['publicationLocator'];snippet=text[loc['start']:loc['endExclusive']]
    if file_hash(root/b['documentPath'])!=expected['documentSha256']:raise ValueError('DOCUMENT_IDENTITY_MISMATCH')
    token=datetime.date.fromisoformat(b['publicationDate']).strftime('%d/%m/%Y')
    if token not in snippet:raise ValueError('PUBLICATION_DATE_CONFLICT')
    tree=Tree(text);anchors=[n for n in tree.nodes if n['tag']=='a' and n['start']==loc['linkedAnchorOffset']]
    if len(anchors)!=1 or unquote(html.unescape(urljoin(b['sourceURL'],anchors[0]['attrs'].get('href',''))))!=unquote(b['documentURL']):raise ValueError('SOURCE_URL_SUBSTITUTION')
    for p in b['retainedPDFs']:
        if file_hash(root/p['path'])!=b['documentSha256'] or (root/p['path']).read_bytes()!=(root/b['documentPath']).read_bytes():raise ValueError('RETAINED_PDF_MISMATCH')
    if b['identityClass']=='EXACT_BYTE_MATCH' and not b['retainedPDFs']:raise ValueError('MISSING_RETAINED_BYTE_PAIR')
    if b['identityClass']=='VERIFIED_DOCUMENT_IDENTITY' and b['retainedPDFs']:raise ValueError('IDENTITY_CLASS_CONFLICT')
    if b['authorities']!=expected['authorities'] or b['cutoff']!=expected['cutoff']:raise ValueError('UNBOUND_AUTHORITY_OR_CUTOFF')
    for k,v in b['knowledge'].items():
        if v is not None and v!=expected['knowledge'].get(k):raise ValueError('UNBOUND_KNOWLEDGE_CLOCK:'+k)
    knowledge=knowledge_assessment(b['knowledge'],b['cutoff'],b['period']['end'],b['authorities'])
    return {'disclosureId':b['disclosureId'],'publication':'VERIFIED_DATE_ONLY','identity':b['identityClass'],'immutableBindingVerified':True,'knowledge':knowledge,'formallyAdmitted':False,'reviewRecommendation':'PENDING_REQUIRED_EVIDENCE'}
