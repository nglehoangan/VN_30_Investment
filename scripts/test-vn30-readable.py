"""Whole-corpus coverage, exact lineage and boundary checks for VN30 selection."""
import hashlib
import importlib.util
import json
import pathlib
import sys
import unittest
from collections import Counter
from decimal import Decimal

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('vn30',ROOT/'scripts/build-vn30-readable.py');builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)
BASE=builder.OUT

def read(path):return json.loads(path.read_text())
def flatten(doc):return [row for report in doc['reports'].values() for p in report['periods'].values() for g in p['groups'].values() for row in g['items'].values()]
def resolve(doc,path):
    for key in path.lstrip('/').split('/'):
        key=key.replace('~1','/').replace('~0','~');doc=doc[int(key)] if isinstance(doc,list) else doc[key]
    return doc

class VN30Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest=read(BASE/'manifest.json');cls.combined=read(BASE/'annual-pdf-first.json')
        cls.cache={};cls.hashes={}

    def cached(self,path,lossless=False):
        key=(path,lossless)
        if key not in self.cache:self.cache[key]=json.loads((ROOT/path).read_text(),**({'parse_int':str,'parse_float':str} if lossless else {}))
        return self.cache[key]

    def digest(self,path):
        if path not in self.hashes:self.hashes[path]=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
        return self.hashes[path]

    def test_exact_30_tickers_120_annual_datasets_and_index_hashes(self):
        self.assertEqual(len(set(self.manifest['tickers'])),30)
        self.assertEqual(set(self.combined['tickers']),set(builder.TICKERS))
        for entry in self.manifest['files']:
            self.assertEqual(self.digest(str((BASE/entry['file']).relative_to(ROOT))),entry['sha256'])
            selected=read(BASE/entry['file'])
            self.assertEqual(selected,self.combined['tickers'][entry['ticker']])
            for report in selected['reports'].values():self.assertEqual(set(report['periods']),set(builder.YEARS))
        self.assertEqual(self.manifest['totals']['coverageGaps'],0)

    def test_vnm_is_identical_to_checked_existing_data(self):
        self.assertEqual(read(BASE/'VNM/annual-pdf-first.json'),read(ROOT/'data/comparisons/VNM/annual-pdf-first.json'))

    def test_no_primary_pdf_cell_dropped_and_all_nonselected_columns_retained(self):
        for ticker in builder.TICKERS:
            if ticker=='VNM':continue
            original=self.cached(f'data/manual-extracted/display-v1/{ticker}.json')
            count=sum(len(g['rows']) for key,r in original['reports'].items() if key in builder.REPORTS for p in r['periods'].values() for v in p['variants'] for g in v['groups'])
            manual=flatten(read(BASE/ticker/'manual.json'));q=read(BASE/ticker/'additional-period-candidates.json')['columns']
            self.assertEqual(len(manual)+sum(len(c['items']) for c in q),count+(23 if ticker=='VIC' else 0),ticker)
            for c in q:self.assertEqual(len(c['items']),c['rowCount'])

    def test_every_selected_pdf_input_value_and_page_matches_original_display(self):
        for ticker in builder.TICKERS:
            if ticker=='VNM':continue
            p=read(BASE/ticker/'provenance.json')
            for row in flatten(read(BASE/ticker/'manual.json')):
                evidence=p['pdfRows'][row['originRef']]
                if 'displayFile' in evidence:
                    original=resolve(self.cached(evidence['displayFile']),evidence['displayPointer'])
                    self.assertEqual(row['value'],original['value'])
                    self.assertEqual(row['status'],original['status'])
                    self.assertEqual(row['label'],original['label'])
                else:
                    original=resolve(self.cached(evidence['transcriptionFile']),evidence['transcriptionPointer'])
                    self.assertEqual((row['sourcePage'],row['value']),(original[0],original[3]))
                self.assertEqual(self.digest(evidence['pdfFile']),evidence['pdfSha256'])
            for path,entry in p['files'].items():self.assertEqual(self.digest(path),entry['sha256'])

    def test_every_provider_cell_is_lossless_at_exact_raw_pointer(self):
        count=0
        for ticker in builder.TICKERS:
            if ticker=='VNM':continue
            p=read(BASE/ticker/'provenance.json')
            for row in flatten(read(BASE/ticker/'cafef.json')):
                e=p['cafefRows'][row['originRef']]
                value=resolve(self.cached(e['rawPayloadPath'],True),e['rawLocator'])
                self.assertEqual(value,row['value']);count+=1
        self.assertGreater(count,15000)

    def test_source_priority_conflicts_and_unreviewed_status_remain_explicit(self):
        total=Counter()
        for ticker in builder.TICKERS:
            selected=read(BASE/ticker/'annual-pdf-first.json')
            self.assertFalse(selected['productionAdmissible'])
            rows=flatten(selected);total.update(r['source'] for r in rows)
            if ticker=='VNM':continue
            manual={r['originRef']:r for r in flatten(read(BASE/ticker/'manual.json'))}
            review=read(BASE/ticker/'annual-review.json')['items']
            self.assertEqual({r['reviewId'] for r in rows if r['needsReview']},{r['reviewId'] for r in review})
            self.assertEqual(len({r['reviewId'] for r in review}),len(review))
            for r in rows:
                self.assertFalse(r['productionAdmissible']);self.assertTrue(r['needsReview'])
                if r['source']=='PDF_REPORTED':
                    compatible=[manual[x] for x in r['pdfRefs'] if manual[x]['status'] in ['VALUE','ZERO'] and builder.numeric(manual[x]['value'])]
                    self.assertTrue(any(x['value']==r['value'] for x in compatible))
                    self.assertEqual(len({(Decimal(x['value']),x['unit'],x['scope']) for x in compatible}),1)
                elif r['source'].startswith('UNRESOLVED') or r['source']=='MISSING':self.assertIsNone(r['value'])
                elif r['source']=='CAFEF_REFERENCE':self.assertEqual(r['value'],r['cafefValue'])
        self.assertEqual(sum(total.values()),self.manifest['totals']['selected'])

    def test_crosswalk_only_unique_equal_captions_never_equal_amounts(self):
        for ticker in builder.TICKERS:
            if ticker=='VNM':continue
            manual={r['originRef']:r for r in flatten(read(BASE/ticker/'manual.json'))}
            cafef={r['originRef']:r for r in flatten(read(BASE/ticker/'cafef.json'))}
            for r in flatten(read(BASE/ticker/'annual-pdf-first.json')):
                if r['mappingBasis']=='UNIQUE_EXACT_NORMALIZED_CAPTION':
                    labels={manual[x]['normalizedCaption'] for x in r['pdfRefs']}|{cafef[x]['normalizedCaption'] for x in r['cafefRefs']}
                    self.assertEqual(len(labels),1);self.assertNotIn('',labels)

    def test_exclusions_are_nonzero_other_caption_and_do_not_erase_pdf(self):
        count=0
        for ticker in builder.TICKERS:
            if ticker=='VNM':continue
            manual={r['originRef']:r for r in flatten(read(BASE/ticker/'manual.json'))}
            cf={r['originRef']:r for r in flatten(read(BASE/ticker/'cafef.json'))}
            active_refs={x for r in flatten(read(BASE/ticker/'annual-pdf-first.json')) for x in r['cafefRefs']}
            for r in read(BASE/ticker/'excluded-cafef-pdf-duplicates.json')['items']:
                if r['reason']!='USER_EXCLUDED_POSSIBLE_ROW_SHIFT_DUPLICATE':continue
                count+=1;self.assertNotEqual(Decimal(r['cafefValue']),0)
                self.assertNotIn(r['cafefRef'],active_refs)
                for match in r['matchingPdfRows']:
                    pdf=manual[match['pdfRef']]
                    self.assertEqual(Decimal(pdf['value']),Decimal(r['cafefValue']))
                    self.assertNotEqual(pdf['normalizedCaption'],cf[r['cafefRef']]['normalizedCaption'])
                    self.assertEqual(pdf['period'],str(r['year']))
        self.assertEqual(count,self.manifest['totals']['excludedCafeFDuplicates']-22)

    def test_relative_headers_never_select_opening_or_ambiguous_columns(self):
        def infer(label,period='UNRESOLVED-YEAR-C1',report='ket-qua-kinh-doanh'):
            return builder.annual_column(report,period,{'periodType':'ANNUAL'},{'columnHeader':{'label':label}},'2025')
        self.assertIsNotNone(infer('Năm nay'))
        self.assertIsNone(infer('Năm nay Năm trước'))
        self.assertIsNone(infer('Năm trước'))
        self.assertIsNone(infer('Quý II Năm nay'))
        self.assertIsNone(infer('Năm nay Tăng Giảm'))
        self.assertIsNone(infer('Số đầu năm',report='can-doi-ke-toan'))
        self.assertIsNotNone(infer('Số cuối năm',report='can-doi-ke-toan'))
        self.assertIsNone(infer('Năm trước',period='2025'))
        self.assertIsNone(builder.amount_unit({'currency':'VND','scale':'1000000'},'Lãi cơ bản trên cổ phiếu'))

    def test_vic_repaired_income_uses_signed_million_and_eps_units(self):
        doc=self.cached('docs/fundamental-data-engine/VIC_FY2022_INCOME_TRANSCRIPTION.json')
        v={r[1]:Decimal(r[3]) for r in doc['rows']}
        self.assertEqual(v['10'],v['01']+v['02'])
        self.assertEqual(v['20'],v['10']+v['11'])
        self.assertEqual(v['30'],sum(v[x] for x in ['20','21','22','24','25','26']))
        self.assertEqual(v['50'],v['30']+v['40'])
        self.assertEqual(v['60'],v['50']+v['51']+v['52'])
        self.assertEqual(v['60'],v['61']+v['62'])
        rows=flatten(read(BASE/'VIC/manual.json'))
        self.assertEqual(len([r for r in rows if r['originRef'].startswith('checked-vic')]),23)

if __name__=='__main__':unittest.main()
