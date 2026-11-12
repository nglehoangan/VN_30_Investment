"""Scoped VNM S4 behavioral checks; no application/production suite claim."""
import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).parent


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module


P = load('price_skill', 'skills/fetch-cafef-price-history/scripts/fetch.py')
A = load('action_skill', 'skills/fetch-vietstock-dividend-pdfs/scripts/fetch.py')


def row(day, value=50):
    return {'Symbol':'VNM','Ngay':day.strftime('%d/%m/%Y'),'GiaDongCua':value,
            'GiaDieuChinh':value-2,'GiaMoCua':value,'GiaThapNhat':value-1,'GiaCaoNhat':value+1,
            'KhoiLuongKhopLenh':100}


def receipt(url, body):
    return {'url':url,'receivedAt':'2026-11-11T00:00:00Z','httpStatus':200,
            'sha256':hashlib.sha256(body.encode()).hexdigest(),'rawResponse':body}


class PriceTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.path=Path(self.temp.name)/'VNM.json'

    def run_rows(self, rows, start=dt.date(2026,1,1), end=dt.date(2026,2,28), fail_page=None):
        def fetch(params):
            if params['PageIndex']==fail_page:raise RuntimeError('partial API failure')
            lower=dt.datetime.strptime(params['StartDate'],'%m/%d/%Y').date()
            upper=dt.datetime.strptime(params['EndDate'],'%m/%d/%Y').date()
            filtered=[r for r in rows if lower<=dt.datetime.strptime(r['Ngay'],'%d/%m/%Y').date()<=upper]
            i=(params['PageIndex']-1)*30;page=filtered[i:i+30]
            url=json.dumps(params,sort_keys=True);body=json.dumps({'Data':{'Data':page,'TotalCount':len(filtered)}})
            return page,len(filtered),receipt(url,body)
        with patch.object(P,'fetch',fetch):
            return P.update('VNM','HOSE',1,end,self.path,start,True)

    def test_one_page_and_us_request_vietnamese_response_dates(self):
        self.assertEqual(self.run_rows([row(dt.date(2026,1,30))])['added'],1)

    def test_multi_page(self):
        rows=[row(dt.date(2026,2,28)-dt.timedelta(days=i)) for i in range(40)]
        stats=self.run_rows(rows);self.assertEqual((stats['requests'],stats['added']),(2,40))

    def test_empty_range_has_receipt(self):
        stats=self.run_rows([]);doc=json.loads(self.path.read_text())
        self.assertEqual(stats['totalStored'],0);self.assertEqual(len(doc['requests']),1)

    def test_boundaries_and_year_overlap(self):
        rows=[row(dt.date(2026,1,1)),row(dt.date(2025,1,1)),row(dt.date(2024,1,1))]
        stats=self.run_rows(rows,dt.date(2024,1,1),dt.date(2026,1,1))
        self.assertEqual((stats['added'],stats['duplicates']),(3,1))
        self.assertEqual(P.years_before(dt.date(2024,2,29),1),dt.date(2023,2,28))

    def test_duplicate_rerun_is_byte_identical(self):
        rows=[row(dt.date(2026,1,30))];self.run_rows(rows);before=self.path.read_bytes()
        self.assertEqual(self.run_rows(rows)['added'],0);self.assertEqual(before,self.path.read_bytes())

    def test_conflict_keeps_old_and_repeated_conflict_is_noop(self):
        self.run_rows([row(dt.date(2026,1,30))]);self.run_rows([row(dt.date(2026,1,30),55)])
        doc=json.loads(self.path.read_text());self.assertEqual(doc['prices'][0]['raw']['GiaDongCua'],50)
        self.assertEqual(len(doc['conflicts']),1);before=self.path.read_bytes()
        self.run_rows([row(dt.date(2026,1,30),55)]);self.assertEqual(before,self.path.read_bytes())

    def test_partial_failure_does_not_change_file(self):
        self.run_rows([row(dt.date(2026,1,1))]);before=self.path.read_bytes()
        rows=[row(dt.date(2026,2,28)-dt.timedelta(days=i)) for i in range(40)]
        with self.assertRaises(RuntimeError):self.run_rows(rows,fail_page=2)
        self.assertEqual(before,self.path.read_bytes())

    def test_duplicate_inside_provider_page_fails(self):
        with self.assertRaises(ValueError):self.run_rows([row(dt.date(2026,1,1))]*2)

    def test_provider_ticker_mismatch_fails(self):
        bad=row(dt.date(2026,1,30));bad['Symbol']='OTHER'
        with self.assertRaises(ValueError):self.run_rows([bad])

    def test_ascending_provider_rows_fail(self):
        with self.assertRaises(ValueError):self.run_rows([row(dt.date(2026,1,29)),row(dt.date(2026,1,30))])

    def test_api_ignores_date_filter_is_rejected(self):
        outside=row(dt.date(2026,11,11))
        with patch.object(P,'fetch',return_value=([outside],1,receipt('bad-filter',json.dumps(outside)))):
            with self.assertRaises(ValueError):
                P.update('VNM','HOSE',1,dt.date(2026,10,30),self.path,dt.date(2022,1,1))
        self.assertFalse(self.path.exists())

    def test_invalid_price_and_ohlc_fail(self):
        for field,value in [('GiaDongCua',float('nan')),('KhoiLuongKhopLenh',-1),('GiaCaoNhat',1)]:
            bad=row(dt.date(2026,1,30));bad[field]=value
            with self.assertRaises(ValueError):self.run_rows([bad])

    def test_missing_adjustment_metadata_stays_unknown(self):
        self.run_rows([row(dt.date(2026,1,30))]);doc=json.loads(self.path.read_text())
        self.assertIsNone(doc['units']);self.assertNotIn('adjustmentMethod',doc)
        self.assertNotEqual(doc['prices'][0]['raw']['GiaDieuChinh'],doc['prices'][0]['raw']['GiaDongCua'])


class ActionTests(unittest.TestCase):
    def events(self, count):
        return [dict(EventID=i,Code='VNM',Name='Trả cổ tức bằng tiền mặt',Note='Trả cổ tức bằng tiền, 1,400 đồng/CP',
                     GDKHQDate='/Date(1641747600000)/',NDKCCDate=None,Time=None,FileUrl=None) for i in range(count)]

    def run_events(self, events, page_size=20, fail_page=None, malformed=False):
        with tempfile.TemporaryDirectory() as td:
            def request(url,temp,form=None):
                if form is None:return b'<input name="__RequestVerificationToken" value="private-test">',receipt(url,'landing')
                page=form['page']
                if page==fail_page:raise RuntimeError('partial API failure')
                body='' if malformed else json.dumps([events[(page-1)*page_size:page*page_size],[len(events)]])
                return body.encode(),receipt(url,body)
            with patch.object(A,'ROOT',Path(td)),patch.object(A,'request',request):
                return A.collect('VNM',dt.date(2022,1,1),dt.date(2026,10,30),page_size)[0]

    def test_one_and_multi_page_same_events(self):
        events=self.events(15)
        one=self.run_events(events);multi=self.run_events(events,10)
        self.assertEqual(len(one['requests']),1);self.assertEqual(len(multi['requests']),2)
        self.assertEqual(one['normalizedEvents'],multi['normalizedEvents'])

    def test_valid_empty_and_malformed_empty_are_distinct(self):
        self.assertEqual(self.run_events([])['totalCount'],0)
        with self.assertRaises(ValueError):self.run_events([],malformed=True)

    def test_partial_api_failure_is_not_no_actions(self):
        with self.assertRaises(ValueError):self.run_events(self.events(15),10,2)

    def test_multiple_same_date_and_cash_stock_distinction(self):
        a,b=self.events(2);b['Name']='Trả cổ tức bằng cổ phiếu';b['Note']='Tỷ lệ 10:1'
        result=self.run_events([a,b]);self.assertEqual(len(result['events']),2)
        self.assertEqual([n['eventType'] for n in result['normalizedEvents']],['CASH_DIVIDEND','STOCK_DIVIDEND'])
        self.assertIsNone(result['normalizedEvents'][1]['cashDividendVndPerShare'])
        self.assertIsNone(result['normalizedEvents'][1]['stockDividendRatio'])

    def test_unknown_capital_type_is_not_cash(self):
        e=self.events(1)[0];e['Name']='Cổ phiếu quỹ';self.assertEqual(A.normalize(e)['eventType'],'OTHER_UNCLASSIFIED')

    def test_null_dates_and_vietnam_boundary(self):
        n=A.normalize(self.events(1)[0]);self.assertEqual(n['exRightsDate'],'2022-01-10')
        self.assertIsNone(n['announcementDate']);self.assertIsNone(n['recordDate']);self.assertIsNone(n['paymentOrEffectiveDate'])

    def test_source_policy_checks_every_host(self):
        self.assertTrue(A.safe_url('http://static2.vietstock.vn/file name.pdf').endswith('file%20name.pdf'))
        for url in ['https://static2.vietstock.vn.evil.test/a.pdf','https://www.hsx.vn/a.pdf','https://user@static2.vietstock.vn/a.pdf']:
            with self.assertRaises(ValueError):A.safe_url(url)

    def test_duplicate_event_and_provider_mismatch_rejected(self):
        events=self.events(2);events[1]['EventID']=events[0]['EventID']
        with self.assertRaises(ValueError):self.run_events(events)
        events=self.events(1);events[0]['Code']='OTHER'
        with self.assertRaises(ValueError):self.run_events(events)


class RetainedEvidenceTests(unittest.TestCase):
    def test_real_price_hashes_and_rows_lineage(self):
        j=json.loads((ROOT/'data/market-history/cafef/VNM.json').read_text());sources={r['sha256']:r for r in j['requests']}
        for r in j['requests']:self.assertEqual(hashlib.sha256(r['rawResponse'].encode()).hexdigest(),r['sha256'])
        for p in j['prices']:
            r=sources[p['responseSha256']];self.assertIn(p['raw'],json.loads(r['rawResponse'])['Data']['Data'])
        self.assertEqual(len(j['prices']),1197)

    def test_share_count_and_price_unit_bridge(self):
        j=json.loads((ROOT/'docs/fundamental-data-engine/vnm-shared-evidence-products/2026-11-11/market-reconciliation.json').read_text())
        self.assertEqual(j['observations'][0]['selectedFields']['value'],'56900')
        from decimal import Decimal
        self.assertEqual(Decimal('56.9')*1000,Decimal('56900'))
        anchors=json.loads((HERE/'RETAINED_SHARE_ANCHORS.json').read_text())
        self.assertTrue(any('2.089.955.445' in a['text'] or '2,089,955,445' in a['text'] for a in anchors))
        self.assertEqual(2089955445*10000,20899554450000)

    def test_material_provider_conflict_preserves_raw_and_pdf_selection(self):
        reviewed=json.loads((HERE/'CORPORATE_ACTION_REVIEW.json').read_text())
        e=next(e for e in reviewed['events'] if e['eventId']==222269)
        self.assertEqual((e['providerCashVndPerShare'],e['reviewedCashVndPerShare']),('1800','1850'))
        manifest=json.loads(Path(reviewed['manifest']).read_text())
        original=next(e for e in manifest['events'] if e['EventID']==222269)
        self.assertIn('1,800',original['Note'])
        self.assertTrue(reviewed['announcementKnownFutureEvent']['knownBeforeCutoff'])
        self.assertFalse(reviewed['announcementKnownFutureEvent']['effectiveByCutoff'])


if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    report={'testsRun':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),
            'successful':result.wasSuccessful(),'scope':'SCOPED_SKILL_AND_RETAINED_EVIDENCE_ONLY'}
    (HERE/'TEST_RESULTS.json').write_text(json.dumps(report,indent=2)+'\n')
    sys.exit(0 if result.wasSuccessful() else 1)
