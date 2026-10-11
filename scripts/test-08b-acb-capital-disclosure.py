"""Reject separate-column, tier-one, scale and evidence corruption for ACB TT14."""
import copy, json, os, pathlib, runpy, unittest
os.environ['VN30_EVIDENCE_WORK']='data/initialization-08b-remediation-work'
B=pathlib.Path(os.environ['VN30_EVIDENCE_WORK'])
R=runpy.run_path('scripts/reconcile-08b-extraction.py')
V=runpy.run_path('scripts/reconcile-08b-acb-capital-disclosure.py')['validate']

class CapitalEvidence(unittest.TestCase):
    def test_exact_regulatory_cells_and_adversarial_changes(self):
        cells=json.loads((B/'acb-capital-disclosure-cells.json').read_text())
        self.assertEqual({c['itemId'] for c in cells},{'BANK_REPORTED_CAR','BANK_REPORTED_CET1'})
        for cell in cells:
            page=json.loads((B/'ocr'/f'{cell["bodyHash"]}-p4.json').read_text())
            self.assertTrue(V(cell,page,R))
            for key,value in [('scope','SEPARATE_STANDALONE'),('unit','RATIO'),
                              ('currency','VND'),('lexicalValue','10,5'),
                              ('page',5),('sourceCaption','Tỷ lệ vốn cấp 1'),
                              ('verificationMethod',cell['extractionMethod']),
                              ('verifiedCanonicalInteger','0.118'),('independentHumanApproval','fake')]:
                with self.subTest(item=cell['itemId'],key=key):
                    bad=copy.deepcopy(cell);bad[key]=value;self.assertFalse(V(bad,page,R))
            bad=copy.deepcopy(cell);bad['regulatoryUnitDefinitionProof']['bodyHash']='0'*64
            self.assertFalse(V(bad,page,R))
            bad=copy.deepcopy(cell);bad['period']['start']='2026-01-01'
            self.assertFalse(V(bad,page,R))
            for key in ['passA','passB']:
                bad=copy.deepcopy(page)
                for w in bad[key]:
                    if .6<w['x']<.74 and abs(w['y']-cell['rowY'])<.025 and w['text']==cell['lexicalValue']:w['text']='10,5'
                self.assertFalse(V(cell,bad,R))

if __name__=='__main__':unittest.main()
