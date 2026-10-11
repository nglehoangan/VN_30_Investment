import importlib.util, tempfile, unittest, os, subprocess, json
from pathlib import Path
spec=importlib.util.spec_from_file_location('physical',Path(__file__).with_name('reconcile-physical-manual-corpus.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PhysicalCorpusTests(unittest.TestCase):
    def test_hidden_mixed_case_nested_duplicate_invalid_and_non_pdf(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'.hidden'/'AAA').mkdir(parents=True)
            files={'a.PdF':b'%PDF-good','.hidden/AAA/copy.pdf':b'%PDF-good','bad.PDF':b'broken','.DS_Store':b'metadata','manifest.json':b'{}'}
            for name,body in files.items(): (root/name).write_bytes(body)
            r=m.inventory(root,{'a.PdF'},lambda body:(body==b'%PDF-good',None))
            self.assertEqual(r['counts']['physicalFiles'],5)
            self.assertEqual(r['counts']['pdfFiles'],3)
            self.assertEqual(r['counts']['validPdfFiles'],2)
            self.assertEqual(r['counts']['uniquePdfHashes'],1)
            self.assertEqual(r['counts']['duplicatePdfFiles'],1)
            self.assertEqual(r['counts']['newOrPreviouslyMissedFiles'],4)
            self.assertEqual(sum(r['reconciliationEquation'].values()),5)
            self.assertEqual(len(r['directories']),2)
    @unittest.skipUnless(os.environ.get('MANUAL_TEST_NODE'), 'Set MANUAL_TEST_NODE to the project-supported Node binary')
    def test_reprocessor_rejects_incomplete_physical_inventory(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d,'PHYSICAL_MANUAL_CORPUS_INVENTORY.json').write_text(json.dumps({'unexplainedFiles':0,'files':[]}))
            p=subprocess.run([os.environ['MANUAL_TEST_NODE'],'scripts/reprocess-manual-first.mjs','--evidence-dir='+d],capture_output=True,text=True,cwd=Path(__file__).resolve().parents[1])
            self.assertNotEqual(p.returncode,0)
            self.assertIn('Physical inventory stale',p.stderr)
            self.assertFalse(Path(d,'CURRENT_ANALYSIS_SNAPSHOT.json').exists())
    def test_symlink_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'outside.pdf').symlink_to('/nonexistent')
            with self.assertRaises(ValueError): m.inventory(root,set(),lambda b:(True,None))
    def test_pdf_magic_without_pdf_extension(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);(root/'retained.bin').write_bytes(b'%PDF-good')
            self.assertEqual(m.inventory(root,set(),lambda b:(True,None))['counts']['eligibleFinancialDocuments'],1)
if __name__=='__main__':unittest.main()
