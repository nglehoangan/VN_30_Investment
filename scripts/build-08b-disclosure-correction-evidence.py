"""Scope a real issuer correction without rewriting unaffected financial facts."""
import base64, datetime, hashlib, json, pathlib, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
R = runpy.run_path('scripts/reconcile-08b-extraction.py')
sha = lambda f: hashlib.sha256(f.read_bytes()).hexdigest()
recovery_file = B / 'vic-exact-correction-exchange-recovery.json'
recovery = json.loads(recovery_file.read_text())
d = next(d for d in recovery['documents'] if d['ticker'] == 'VIC')
body = B / (d['bodyHash'] + '.pdf')
assert sha(body) == d['bodyHash']
envelopes = [json.loads(c['payload']) for c in recovery['captures'] if c['id'] in d['captureIds']]
assert all(e['bodyComplete'] and e['httpStatus'] == 200 and e['error'] is None for e in envelopes)
assert hashlib.sha256(b''.join(base64.b64decode(e['bytes']) for e in sorted(envelopes,key=lambda e:e['chunkIndex']))).hexdigest() == d['bodyHash']
proofs = []
pages = []
for page in [1, 2]:
    f = B / 'ocr' / f'{d["bodyHash"]}-p{page}.json'
    p = json.loads(f.read_text())
    assert p['bodyHash'] == d['bodyHash'] and p['page'] == page
    assert p['engineA'] != p['engineB']
    image = f.with_suffix('.png')
    assert sha(image) == p['renderSha256']
    proofs.extend([{'file':str(f),'sha256':sha(f)}, {'file':str(image),'sha256':sha(image)}])
    pages.append(p)
for key in ['passA', 'passB']:
    first = R['fold'](R['full_text'](pages[0], key))
    second = R['fold'](R['full_text'](pages[1], key))
    for marker in ['vingroup', 'ticker: vic', 'september 04, 2026', 'august 29, 2026',
                   'reviewed interim consolidated financial', 'presentation error',
                   'details of demand deposit', 'saigon jsc bank', 'saigon treasure',
                   'corrected information']:
        assert marker in first, (key, marker)
    assert 'legal representative of vingroup' in second
    # Only one correction table, with a bank-name change, occurs on page 1.
    # Page 2 contains disclosure certification/signature; no additional table.
    assert first.count('corrected information') == 1
    assert 'corrected information' not in second
proofs.append({'file':str(recovery_file),'sha256':sha(recovery_file)})
packet = {'version':'issuer-correction-scope-v1', 'ticker':'VIC',
          'status':'TWO_READER_CORRECTION_SCOPE_REVIEW_CANDIDATE',
          'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'independentHumanApproval':None, 'source':d,
          'baseReportBodyHash':'a82cc3eaf79ced481ad28ea4ce311053725d8f2f0e1c5bc15bbce3938a8babd8',
          'sourceDisplayedCorrectionDate':'2026-09-04',
          'basePublicationDateNamedInCorrection':'2026-08-29',
          'correctionKind':'NOTE_COUNTERPARTY_NAME',
          'noteSubject':'Banks representing more than 10% of demand deposit balances',
          'previousName':'Saigon JSC Bank',
          'correctedName':'Saigon Treasure Commercial Joint Stock Bank',
          'canonicalNumericCellChanges':[],
          'governanceRiskContextMustUseCorrectedCounterparty':True,
          'rationale':'The full two-page correction changes the bank name in one note table. It does not replace balance, income, or cash-flow numeric cells. Base-report body and correction body remain separate linked evidence.',
          'sourceProofs':proofs,
          'limitations':['No historical knowledge boundary inferred from signature or displayed date.',
                         'This review cannot establish absence of later corrections.']}
(B / 'vic-correction-scope-evidence.json').write_text(json.dumps(packet,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'ticker':'VIC','correctionKind':packet['correctionKind'],'canonicalNumericCellChanges':0}))

# The VHM filing includes a complete replacement financial report. The
# correction notice scopes the counterparty-name change; it does not prove
# numeric identity of every page in the two distinct report bodies.
recovery_file = B / 'vhm-exact-reviewed-corrected-exchange-recovery.json'
recovery = json.loads(recovery_file.read_text())
h = 'c429193700bca2e016b0b795ea9fa08a77839a4b09ad5aaee1f458616521533a'
d = next(d for d in recovery['documents'] if d['bodyHash']==h)
assert sha(B / (h+'.pdf')) == h
proofs = [{'file':str(recovery_file),'sha256':sha(recovery_file)}]
pages=[]
for n in [1,2]:
    f=B/'ocr'/f'{h}-p{n}.json';p=json.loads(f.read_text())
    assert p['bodyHash']==h and p['page']==n and p['engineA']!=p['engineB']
    assert sha(f.with_suffix('.png'))==p['renderSha256']
    proofs.extend([{'file':str(f),'sha256':sha(f)},{'file':str(f.with_suffix('.png')),'sha256':sha(f.with_suffix('.png'))}]);pages.append(p)
for reader in ['passA','passB']:
    first=R['fold'](R['full_text'](pages[0],reader))
    second=R['fold'](R['full_text'](pages[1],reader))
    assert all(s in first for s in ['ticker: vhm','august 29, 2026','reviewed interim separated/consolidated','change in credit institution'])
    assert second.count('saigon thuong tin commercial')==2 and second.count('saigon treasure')==2
    assert second.count('corrected information')==2 and 'legal representative of vinhomes' in second
packet={'version':'issuer-correction-scope-v1','ticker':'VHM',
        'status':'TWO_READER_CORRECTION_SCOPE_REVIEW_CANDIDATE',
        'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'independentHumanApproval':None,'source':d,
        'priorReportBodyHash':'b8c8f6b1e85ec135e562087ba03fb08f56a95989a956a86d97b85cc57b86db73',
        'correctedReportBodyHash':h,'sourceDisplayedCorrectionDate':'2026-09-04',
        'priorPublicationDateNamedInCorrection':'2026-08-29',
        'correctionKind':'NOTE_COUNTERPARTY_NAME_WITH_REPLACEMENT_REPORT',
        'affectedScopes':['SEPARATE','CONSOLIDATED'],
        'previousName':'Saigon Thuong Tin Commercial Joint Stock Bank (Sacombank)',
        'correctedName':'Saigon Treasure Commercial Joint Stock Bank',
        'governanceRiskContextMustUseCorrectedCounterparty':True,
        'sourceProofs':proofs,
        'rationale':'The two notice tables correct the bank name for demand-deposit concentration in the separate and consolidated notes. The corrected 120-page report is the exact current filing body; each selected financial cell requires its own retained proof.',
        'limitations':['No whole-document or numeric-page identity asserted.','No historical availability timestamp inferred from signature date.','No absence of later corrections asserted.']}
(B/'vhm-correction-scope-evidence.json').write_text(json.dumps(packet,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'ticker':'VHM','correctionKind':packet['correctionKind']}))
