"""A new reader configuration must never overwrite a retained attempt."""
import hashlib,json,os,pathlib,runpy,tempfile,unittest
import pymupdf
import unittest.mock
class ReaderImmutability(unittest.TestCase):
 def test_configuration_change_stops_before_source_render_or_proof_write(self):
  with tempfile.TemporaryDirectory(prefix='vn30-reader-immutability-') as d:
   root=pathlib.Path(d);ocr=root/'ocr';ocr.mkdir();pdf=pymupdf.open();page=pdf.new_page();page.insert_text((72,72),'Native text selection for independent verification. '*8);pdf.save(root/'fixture.pdf');pdf.close()
   retained=ocr/'fixture-p1.json';render=ocr/'fixture-p1.png';retained.write_text(json.dumps({'renderDpi':300,'engineA':'PYMUPDF_NATIVE_GLYPH_COORDINATES','engineB':'PDFPLUMBER_NATIVE_WORD_COORDINATES','passA':[{'text':'retained'}],'passB':[{'text':'retained'}]}));render.write_bytes(b'retained source render')
   original={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in [retained,render]};old=os.environ.get('VN30_EVIDENCE_WORK');os.environ['VN30_EVIDENCE_WORK']=d
   try:
    module=runpy.run_path('scripts/extract-08b-pages.py')
    with unittest.mock.patch.dict(os.environ,{'VN30_RENDER_DPI':'400'}):
     with self.assertRaisesRegex(RuntimeError,'IMMUTABLE_READER_ATTEMPT_MISMATCH'):module['process'](('fixture.pdf',0))
    with unittest.mock.patch.dict(os.environ,{'VN30_RENDER_DPI':'300','VN30_NATIVE_VERIFY':'1','VN30_FORCE_IMAGE_OCR':'1'}):
     with self.assertRaisesRegex(RuntimeError,'IMMUTABLE_READER_ATTEMPT_MISMATCH'):module['process'](('fixture.pdf',0))
    self.assertEqual(original,{p:hashlib.sha256(p.read_bytes()).hexdigest() for p in original})
   finally:
    if old is None:os.environ.pop('VN30_EVIDENCE_WORK',None)
    else:os.environ['VN30_EVIDENCE_WORK']=old
if __name__=='__main__':unittest.main()
