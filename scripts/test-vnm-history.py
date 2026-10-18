"""Verify annual transcription identities, raw pointer lineage and selection rules."""
import json
import pathlib
import unittest
from decimal import Decimal

ROOT=pathlib.Path(__file__).resolve().parents[1]
REPORTS=['can-doi-ke-toan','ket-qua-kinh-doanh','luu-chuyen-tien-te']

def read(path):return json.loads((ROOT/path).read_text())
def flat(doc,year):return [(report,row) for report,r in doc['reports'].items() for g in r['periods'][str(year)]['groups'].values() for row in g['items'].values()]

class HistoryTests(unittest.TestCase):
    def test_all_three_statements_and_checked_page_coverage(self):
        for year,count in [(2022,136),(2023,134),(2024,134)]:
            rows=flat(read(f'data/comparisons/VNM/FY{year}/manual.json'),year)
            self.assertEqual(len(rows),count)
            self.assertEqual({r['sourcePage'] for _,r in rows},set(range(7,15)))
            self.assertEqual({report for report,r in rows},set(REPORTS))
            self.assertFalse(any(r['sourcePage']==11 and r['sourceCode']=='60' for _,r in rows))

    def test_accounting_identities_every_year(self):
        for year in [2022,2023,2024]:
            rows=flat(read(f'data/comparisons/VNM/FY{year}/manual.json'),year)
            v={(report,r['sourceOccurrenceKey']):None if r['value'] is None else Decimal(r['value']) for report,r in rows}
            def n(report,code):return v[(report,code)]
            b,i,c=REPORTS
            with self.subTest(year=year):
                self.assertEqual(n(b,'100'),sum(n(b,x) for x in ['110','120','130','140','150']))
                self.assertEqual(n(b,'200'),sum(n(b,x) for x in ['210','220','230','240','250','260']))
                self.assertEqual(n(b,'270'),n(b,'100')+n(b,'200'))
                self.assertEqual(n(b,'270'),n(b,'440'))
                self.assertEqual(n(b,'440'),n(b,'300')+n(b,'400'))
                self.assertEqual(n(b,'410'),sum(n(b,x) for x in ['411','412','414','417','418','421','429']))
                self.assertEqual(n(b,'421'),n(b,'421a')+n(b,'421b'))
                self.assertEqual(n(i,'10'),n(i,'01')-n(i,'02'))
                self.assertEqual(n(i,'20'),n(i,'10')-n(i,'11'))
                self.assertEqual(n(i,'30'),n(i,'20')+n(i,'21')-n(i,'22')+n(i,'24')-n(i,'25')-n(i,'26'))
                self.assertEqual(n(i,'50'),n(i,'30')+n(i,'40'))
                self.assertEqual(n(i,'60'),n(i,'50')-n(i,'51')-n(i,'52'))
                self.assertEqual(n(i,'60'),n(i,'61')+n(i,'62'))
                self.assertEqual(n(c,'08'),sum(n(c,x) for x in ['01','02a','02b','03','04','05c','05a','05b','06']))
                self.assertEqual(n(c,'20'),sum(n(c,x) for x in ['08','09','10','11','12','14','15','17']))
                # Sum only numeric reported lines; do not fill dash cells in the data.
                def available_sum(codes):return sum((v[(c,x)] for x in codes if (c,x) in v and v[(c,x)] is not None),Decimal(0))
                self.assertEqual(n(c,'30'),available_sum(['21','22','23','24','24b','25','26','27']))
                self.assertEqual(n(c,'40'),available_sum(['31a','31b','31','32','33','34','36','36b']))
                self.assertEqual(n(c,'50'),n(c,'20')+n(c,'30')+n(c,'40'))
                self.assertEqual(n(c,'70'),sum(n(c,x) for x in ['50','60','61','62']))
                self.assertEqual(n(c,'70'),n(b,'110'))
                self.assertEqual(n(c,'01'),n(i,'50'))

    def test_all_588_provider_cells_match_raw_pointers(self):
        cache={};count=0
        for year in [2022,2023,2024]:
            p=read(f'data/comparisons/VNM/FY{year}/provenance.json')
            for _,r in flat(read(f'data/comparisons/VNM/FY{year}/cafef.json'),year):
                e=p['cafefRows'][r['originRef']];path=e['rawPayloadPath']
                if path not in cache:cache[path]=json.loads((ROOT/path).read_text(),parse_int=str,parse_float=str)
                value=cache[path]
                for part in e['rawLocator'].lstrip('/').split('/'):value=value[int(part)] if isinstance(value,list) else value[part.replace('~1','/').replace('~0','~')]
                self.assertEqual(value,r['value']);count+=1
        self.assertEqual(count,588)

    def test_combined_periods_and_provenance_are_current(self):
        import hashlib
        combined=read('data/comparisons/VNM/annual-pdf-first.json')
        for report,r in combined['reports'].items():
            self.assertEqual(set(r['periods']),{'2022','2023','2024','2025'})
            for year,period in r['periods'].items():
                rows={key:row for g in period['groups'].values() for key,row in g['items'].items()}
                source=read(f'data/comparisons/VNM/FY{year}/selected-pdf-first.json')
                self.assertEqual(rows,source['reports'][report][year])
        ledger=read('data/comparisons/VNM/annual-provenance.json')
        for path,expected in ledger['files'].items():
            self.assertEqual(hashlib.sha256((ROOT/path).read_bytes()).hexdigest(),expected)

    def test_pdf_priority_exclusions_and_aggregate_operands(self):
        for year in [2022,2023,2024]:
            doc=read(f'data/comparisons/VNM/FY{year}/selected-pdf-first.json')
            review=read(f'data/comparisons/VNM/FY{year}/review-pdf-first.json')
            rows=[r for report in doc['reports'].values() for r in report[str(year)].values()]
            self.assertTrue(all(r['value']==r['pdfValue'] for r in rows if r['source'].startswith('PDF_')))
            self.assertEqual(len({r['reviewId'] for r in review['items']}),len(review['items']))
            self.assertTrue(all(r['reviewId'].startswith(f'VNM-{year}-') for r in review['items']))
            active={(r['report'],r['key']) for r in rows}
            for r in review['excluded']:
                if r['reason']=='USER_EXCLUDED_POSSIBLE_ROW_SHIFT_DUPLICATE':
                    self.assertNotIn((r['report'],r['key']),active)
                    self.assertNotEqual(Decimal(r['cafefValue']),0)
                    self.assertTrue(r['matchingPdfRows'])
            comp=read(f'data/comparisons/VNM/FY{year}/comparison.json')
            for report,periods in comp['items'].items():
                for row in periods[str(year)].values():
                    if row['pdf'].get('kind')=='EXPLICIT_DISPLAY_AGGREGATE':
                        self.assertEqual(Decimal(row['pdf']['value']),sum(Decimal(r['value']) for r in row['pdf']['operands']))

if __name__=='__main__':unittest.main()
