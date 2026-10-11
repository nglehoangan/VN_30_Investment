"""Reject altered definition, period, scope, source, column and source tokens."""
import copy, json, pathlib, runpy, unittest

B=pathlib.Path('data/initialization-08b-remediation-work')
M=runpy.run_path('scripts/reconcile-08b-acb-investor-disclosure.py')
R=runpy.run_path('scripts/reconcile-08b-extraction.py')

class AdmissionTests(unittest.TestCase):
    def test_exact_source_and_adversarial_semantic_changes(self):
        for original in json.loads((B/'acb-investor-disclosure-cells.json').read_text()):
            page=json.loads((B/'ocr'/f'{original["bodyHash"]}-p2.json').read_text())
            self.assertTrue(M['validate'](original,page,R))
            mutations=[('scope','SEPARATE_STANDALONE'),('unit','RATIO'),('itemId','BANK_REPORTED_NIM'),('bodyHash','0'*64),('columnX',.1),('rowY',.1),('verifiedCanonicalInteger','0'),('reportedMetricBasis','Quarter-on-quarter growth'),('sourceCaption','Customer deposits')]
            for field,value in mutations:
                c=copy.deepcopy(original);c[field]=value
                with self.subTest(item=original['itemId'],field=field):self.assertFalse(M['validate'](c,page,R))
            c=copy.deepcopy(original);c['period']['end']='2025-06-30'
            self.assertFalse(M['validate'](c,page,R))
            c=copy.deepcopy(original);c['sourceLexicalTokens']['passB']='81,4%'
            if original['itemId']=='BANK_REPORTED_LDR':self.assertFalse(M['validate'](c,page,R))
            p=copy.deepcopy(page)
            p['passB']=[w for w in p['passB'] if w['text'].rstrip(',')!=original['lexicalValue']]
            self.assertFalse(M['validate'](original,p,R))

if __name__=='__main__':unittest.main()
