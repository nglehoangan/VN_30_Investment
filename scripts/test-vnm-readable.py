import importlib.util
import pathlib
import json
import re
import unittest
from decimal import Decimal

spec = importlib.util.spec_from_file_location('pilot', pathlib.Path(__file__).parent/'compare-vnm-readable.py')
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)


class VnmReadableTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manual, cls.cafef, cls.comparison, cls.provenance, cls.structure = pilot.build()
        cls.values = {(report,row['sourceOccurrenceKey']):None if row['value'] is None else Decimal(row['value'])
                      for (report,group,key),row in pilot.flat(cls.manual).items()}

    def n(self, report, code):
        return self.values[(report,code)]

    def item(self, report, key):
        return self.comparison['items'][report]['2025'][key]

    def test_inline_values_no_hashes_in_readable_payloads(self):
        self.assertEqual(len(pilot.flat(self.manual)), 132)
        self.assertEqual(len(pilot.flat(self.cafef)), 196)
        for document in [self.manual,self.cafef]:
            def visit(value):
                if isinstance(value,dict):
                    for k,v in value.items():
                        self.assertFalse(re.fullmatch('[0-9a-f]{64}',k))
                        visit(v)
                elif isinstance(value,list):
                    for v in value:visit(v)
                elif isinstance(value,str):
                    self.assertFalse(re.fullmatch('[0-9a-f]{64}',value))
            visit(document)

    def test_balance_sheet_identities(self):
        r='can-doi-ke-toan'
        self.assertEqual(self.n(r,'100'),sum(self.n(r,c) for c in ['110','120','130','140','150']))
        self.assertEqual(self.n(r,'200'),sum(self.n(r,c) for c in ['210','220','230','240','250','260']))
        self.assertEqual(self.n(r,'270'),self.n(r,'100')+self.n(r,'200'))
        self.assertEqual(self.n(r,'440'),self.n(r,'300')+self.n(r,'400'))
        self.assertEqual(self.n(r,'270'),self.n(r,'440'))
        self.assertEqual(self.n(r,'410'),sum(self.n(r,c) for c in ['411','412','414','417','418','421','429']))
        self.assertEqual(self.n(r,'421'),self.n(r,'421a')+self.n(r,'421b'))

    def test_earnings_and_tax_identities(self):
        r='ket-qua-kinh-doanh'
        self.assertEqual(self.n(r,'10'),self.n(r,'01')-self.n(r,'02'))
        self.assertEqual(self.n(r,'20'),self.n(r,'10')-self.n(r,'11'))
        self.assertEqual(self.n(r,'30'),self.n(r,'20')+self.n(r,'21')-self.n(r,'22')+self.n(r,'24')-self.n(r,'25')-self.n(r,'26'))
        self.assertEqual(self.n(r,'50'),self.n(r,'30')+self.n(r,'40'))
        self.assertEqual(self.n(r,'60'),self.n(r,'50')-self.n(r,'51')-self.n(r,'52'))
        self.assertEqual(self.n(r,'60'),self.n(r,'61')+self.n(r,'62'))

    def test_cashflow_totals_and_closing_cash(self):
        r='luu-chuyen-tien-te'
        self.assertEqual(self.n(r,'08'),sum(self.n(r,c) for c in ['01','02a','02b','03','04','05a','05b','06']))
        self.assertEqual(self.n(r,'20'),sum(self.n(r,c) for c in ['08','09','10','11','12','14','15','17']))
        # The unreported/dash line 23 remains null in the output; the identity
        # checks the sum of available reported flows, without filling the data.
        self.assertIsNone(self.n(r,'23'))
        self.assertEqual(self.n(r,'30'),sum(self.n(r,c) for c in ['21','22','24','25','26','27']))
        self.assertEqual(self.n(r,'40'),sum(self.n(r,c) for c in ['31','33','34','36']))
        self.assertEqual(self.n(r,'50'),self.n(r,'20')+self.n(r,'30')+self.n(r,'40'))
        self.assertEqual(self.n(r,'70'),sum(self.n(r,c) for c in ['50','60','61','62']))

    def test_caption_crosswalk_does_not_select_equal_amount_with_wrong_caption(self):
        row=self.item('ket-qua-kinh-doanh','doanh-thu-hoat-dong-tai-chinh')
        self.assertEqual(row['pdf']['sourceCode'],'21')
        self.assertEqual(row['cafef']['sourceCode'],'22')
        self.assertEqual(row['status'],'DIFFERENT_VALUE_OBSERVED')
        row=self.item('luu-chuyen-tien-te','tien-nhan-gop-von-co-dong-khong-kiem-soat-vao-cong-ty-con')
        self.assertEqual(row['cafef']['sourceCode'],'HDTC_37')
        self.assertEqual(row['cafef']['value'],'0')

    def test_aggregates_explicit_and_dimensions_unverified(self):
        for key in ['cac-dieu-chinh-khac','anh-huong-ty-gia-va-quy-doi-tien-te']:
            row=self.item('luu-chuyen-tien-te',key)
            self.assertEqual(row['status'],'AGGREGATED_MATCH_OBSERVED')
            self.assertEqual(len(row['pdf']['operands']),2)
            self.assertFalse(row['strictDimensionsVerified'])
        self.assertEqual(self.item('can-doi-ke-toan','tong-tai-san')['rawDeltaPdfMinusCafeF'],'30000000')

    def test_every_provider_value_matches_exact_raw_json_pointer(self):
        cache={}
        for row in pilot.flat(self.cafef).values():
            evidence=self.provenance['cafefRows'][row['originRef']]
            path=evidence['rawPayloadPath']
            if path not in cache:
                cache[path]=json.loads((pilot.ROOT/path).read_text(),parse_int=str,parse_float=str)
            value=cache[path]
            for part in evidence['rawLocator'].lstrip('/').split('/'):
                value=value[int(part)] if isinstance(value,list) else value[part]
            self.assertEqual(value,row['value'])


if __name__=='__main__':
    unittest.main()
