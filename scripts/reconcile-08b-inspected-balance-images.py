"""Reconcile explicitly inspected balance-sheet exceptions; never invent image readings."""
import hashlib, json, pathlib, runpy

B = pathlib.Path('data/initialization-08b-remediation-work')
R = runpy.run_path('scripts/reconcile-08b-extraction.py')
sha = lambda f: hashlib.sha256(f.read_bytes()).hexdigest()
f = B / 'source-image-verified-cells.json'
existing = json.loads(f.read_text())
for name in ['vic-annual-original-source-image-reader-proof.json', 'vnm-current-balance-source-image-reader-proof.json', 'vnm-current-flow-source-image-reader-proof.json']:
    proof_file = B / name
    proof = json.loads(proof_file.read_text())
    source = proof['source']
    assert proof['method'] == 'CODEX_ASSISTANT_SOURCE_IMAGE_READING'
    assert proof['independentHumanApproval'] is None and proof['governanceStatus'] == 'REVIEW_CANDIDATE'
    assert sha(B / (source['bodyHash'] + '.pdf')) == source['bodyHash']
    for row in proof['rows']:
        page_file = B / 'ocr' / f'{source["bodyHash"]}-p{row["page"]}.json'
        page = json.loads(page_file.read_text())
        assert page['engineA'] == 'APPLE_VISION_ACCURATE_IMAGE_OCR'
        assert page['renderSha256'] == row['renderSha256'] == sha(page_file.with_suffix('.png'))
        flow = row['periodType'] == 'YTD'
        income=row['itemId'] in ['REVENUE','GROSS_PROFIT','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT']
        assert row['itemId'] in (['CFO','CFI_SUPPORTING','CFF_SUPPORTING','NET_CASH_CHANGE_SUPPORTING','REVENUE','GROSS_PROFIT','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT'] if flow else ['TOTAL_ASSETS', 'TOTAL_LIABILITIES_SUPPORTING', 'CURRENT_LIABILITIES', 'TOTAL_EQUITY'])
        assert flow or row['periodType'] == 'INSTANT' and row['periodStart'] == row['periodEnd']
        assert row['scope'] == source['scope'] == 'CONSOLIDATED'
        word = next(w for w in page['passA'] if w['text'] == row.get('sourceWordText',row['currentLexical']) and abs(w['y']-row['numericTop'])<.001 and abs(w['x']-row['columnX'])<.001)
        assert word['confidence'] >= .8
        caption_evidence=row['originalOcrCaption'] if flow and not income else row['caption']
        caption_text=' '.join(w['text'] for w in page['passA'] if not flow or w['x']<.44 and abs(w['y']-word['y'])<.025)
        assert R['compact'](caption_text).startswith(R['compact'](caption_evidence)) if income else R['compact'](caption_evidence) in R['compact'](caption_text)
        unit = R['declared_unit'](R['lines'](page['passA']), word['y'])
        assert unit and unit[1] == row['unit']
        if flow:
            columns=row['sourceImageColumnDefinition']
            assert row['periodStart']=='2026-01-01' and row['periodEnd']=='2026-06-30'
            assert columns['currentHeader']=='30/6/2026' and columns['comparativeHeader']=='30/6/2025'
            if income:
                assert columns['layout']=='QUARTER_CURRENT_PRIOR_THEN_YTD_CURRENT_PRIOR' and columns['currentColumnOrdinal']==2
                assert columns['sourceRowValuesLeftToRight'][2]==row['currentLexical'] and len(columns['sourceRowValuesLeftToRight'])==4
                assert .69<word['x']<.82 and row['page'] in [11,12]
                assert columns['originalOcrRowValuesLeftToRight'][2]==row['currentLexical']
                for value in columns['originalOcrRowValuesLeftToRight']:
                    assert any(value in w['text'] and abs(w['y']-word['y'])<.025 for w in page['passA'])
            else:
                assert columns['currentColumnOrdinal']==row['sourceWordTokenIndex']==0
                assert word['text'].split()[0]==row['currentLexical']
                if len(word['text'].split())>1:assert word['text'].split()==[row['currentLexical'],columns['comparativeLexical']]
            assert any(w['text']==row['rowCode'] and abs(w['y']-word['y'])<.025 for w in page['passA'])
            text=R['full_text'](page,'passA')
            assert all(x in text for x in ['30/6/2026','30/6/2025','sáu tháng'])
        else:
            header = R['stock_date_columns'](R['lines'](page['passA']),word['y'],row['periodEnd'])
            assert header and min(abs(word['x']+word['width']/2-x) for x in header['positions']) < .075
        period = {'start':row['periodStart'],'end':row['periodEnd'],'type':row['periodType'],
                  'fiscalYear':int(row['periodEnd'][:4]),'fiscalQuarter':None,
                  'calendarReference':'SOURCE_EXPLICIT_BALANCE_SHEET_DATE'}
        cell = {'ticker':source['ticker'],'securityId':source['securityId'],
                'documentId':source['documentId'],'bodyHash':source['bodyHash'],
                'page':row['page'],'itemId':row['itemId'],'sourceCaption':row['caption'],
                'captionAlternative':R['fold'](row['caption']),'sourceRowCode':row['rowCode'],
                'lexicalValue':row['currentLexical'],'verificationLexicalValue':row['currentLexical'],
                'verifiedCanonicalInteger':R['numeric_value'](row['currentLexical']),
                'unit':row['unit'],'currency':row['currency'],'scope':row['scope'],
                'period':period,'periodType':row['periodType'],'columnX':word['x'],
                'rowY':word['y']+word['height']/2,'extractionMethod':page['engineA'],
                'verificationMethod':proof['method'],'renderSha256':page['renderSha256'],
                'sourceImageProofFile':str(proof_file),'sourceOcrProofFile':str(page_file),
                'status':'VERIFIED_TRANSCRIPTION_REVIEW_CANDIDATE','comparativeColumn':False,
                'independentHumanApproval':None,'sourcePageEvidenceHashes':[sha(page_file),sha(proof_file)]}
        if flow:
            cell['sourceImageColumnDefinition']=row['sourceImageColumnDefinition']
        if flow and not income:
            cell['sourceWordText']=row['sourceWordText']
            cell['sourceWordTokenIndex']=row['sourceWordTokenIndex']
            cell['sourceImageColumnDefinition']=row['sourceImageColumnDefinition']
        assert cell['verifiedCanonicalInteger'] is not None
        existing = [c for c in existing if not(c['bodyHash']==cell['bodyHash'] and c['page']==cell['page'] and c['itemId']==cell['itemId'])]
        existing.append(cell)
f.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'verifiedSourceImageCells':len(existing),'humanApprovalAsserted':False}))
