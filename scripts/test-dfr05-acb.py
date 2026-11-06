"""Actual ACB export checks plus adversarial authorization/contract fixtures."""
import json
import tempfile
import unittest
from pathlib import Path
from dataclasses import replace
from copy import deepcopy
from decimal import Decimal
from lib.dfr05_acb_v2 import *


class ACBReplay(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out=ROOT/REL
        cls.d=json.loads((cls.out/'ACB.json').read_text())
        cls.ms=cls.d['metrics'];cls.by={(m['concept'],m['year']):m for m in cls.ms}
        payload=json.loads((cls.out/'dependency-graph.json').read_text())
        cls.graph=DependencyGraph(ACB)
        cls.graph.nodes={n['id']:n for n in payload['nodes']}
        cls.graph.edges={(e['source'],e['target'],e['role'],e['propagates']) for e in payload['edges']}

    def test_approved_hash_identity_and_route(self):
        row=verify_identity(p1.Store(),ACB)
        self.assertEqual(row['securityId'],self.d['securityId']);self.assertEqual(row['ticker'],'ACB')
        self.assertEqual(self.d['sectorRouting']['approvedM3Sector'],'BANK')

    def test_deny_all_23_nonpilot_identities_before_source_read(self):
        u=json.loads((ROOT/UNIVERSE).read_text());denied=[]
        class NoIO:
            def read(self,*args): raise AssertionError('Authorization must precede source IO')
        for r in u['constituents']:
            if r['pilotClassification']=='NON_PILOT' and r['ticker']!='ACB':
                i=Identity(r['securityId'],r['ticker'],r['existingSector'],'BANK','CONSOLIDATED')
                for fn in (lambda: replay(NoIO(),i),lambda: RetainedAdapter(NoIO(),'PDF',i),lambda: FinancialGraph(i),lambda: DependencyGraph(i)):
                    self.assertRaisesRegex(ValueError,'NOT_AUTHORIZED',fn)
                denied.append(r['ticker'])
        self.assertEqual(len(denied),23)

    def test_wrong_id_sector_subtype_scope_and_ticker_rejected(self):
        for field,value in [('securityId','wrong'),('m3Sector','INDUSTRIAL'),('researchSubtype','SECURITIES'),('reportingScope','STANDALONE'),('ticker','BID')]:
            self.assertRaises(ValueError,authorize,replace(ACB,**{field:value}))
        self.assertRaises(ValueError,authorize,'ACB')

    def test_sealed_kernels_keep_denying_acb(self):
        self.assertRaises(ValueError,p1.Adapter,p1.Store(),'PDF','ACB')
        self.assertRaises(ValueError,d2.Graph,'ACB')
        self.assertEqual(tuple(p1.PILOT),('FPT','VNM','BID','TCX','VIC','VHM'))
        self.assertIs(RetainedAdapter.records,p1.Adapter.records)
        self.assertIs(FinancialGraph.fact,d2.Graph.fact)
        self.assertIs(DependencyGraph.affected,p1.DependencyGraph.affected)

    def test_all_p1_source_code_output_seals(self):
        pins=json.loads((ROOT/P1/'input-pins.json').read_text());p1.Store(expected=pins).validate()
        m=json.loads((ROOT/P1/'manifest.json').read_text())
        for path,h in m['files'].items():self.assertEqual(p1.sha(ROOT/P1/path),h)
        for path,h in m['implementation'].items():self.assertEqual(p1.sha(ROOT/path),h)

    def test_exact_789_25_113_full_p1_objects_and_crosschecks(self):
        counts=[0,0,0]
        for t in p1.PILOT:
            d=json.loads((ROOT/P1/f'issuers/{t}.json').read_text())
            prior=json.loads((ROOT/p1.D2/f'issuers/{t}.json').read_text())
            old=json.loads((ROOT/p1.D4/f'issuers/{t}.json').read_text())
            self.assertEqual(d['metrics'],prior['metrics']);self.assertEqual(d['providerCrosschecks'],prior['providerCrosschecks']);self.assertEqual(d['rubrics'],old['rubrics'])
            counts[0]+=len(d['metrics']);counts[1]+=sum(r['status']=='COMPLETED_RESEARCH' for r in d['rubrics']);counts[2]+=sum(r['status']!='COMPLETED_RESEARCH' for r in d['rubrics'])
        self.assertEqual(counts,[789,25,113])

    def test_all_acb_original_year_facts_native_units_and_pointers(self):
        for y,values in BOOK_READINGS.items():
            for c,v in zip(BOOK_CONCEPTS,values):
                m=self.by[c,y]
                self.assertEqual(m['status'],'SUPPORTED');self.assertEqual(m['nativeSourceValue'],v)
                self.assertEqual(d2.number(m['value']),d2.number(v)*Decimal(1000000))
                self.assertEqual(m['scope'],'CONSOLIDATED');self.assertEqual(m['revisionBasis'],'ORIGINAL_REVIEWED_VINTAGE')
                self.assertEqual(m['pdfEvidence']['sha256'],BOOK_HASHES[y]);self.assertIsNone(m['publicationAt'])
                self.assertTrue(m['observationBinding']['jsonPointer']);self.assertTrue(m['reviewPayloadBinding']['payloadJsonPointer'])

    def test_native_observation_and_decoded_payload_values(self):
        store=p1.Store(expected=json.loads((self.out/'input-pins.json').read_text()))
        for m in self.ms:
            if not m.get('observationBinding'):continue
            b=m['observationBinding'];o=d2.pointer(store.read(b['path']),b['jsonPointer'])
            b=m['reviewPayloadBinding'];payload=json.loads(d2.pointer(store.read(b['path']),b['jsonPointer']))
            original=d2.pointer(payload,b['payloadJsonPointer'])
            self.assertEqual(m['value'],o['normalized']['value']);self.assertEqual(d2.number(m['value']),d2.number(str(original['value'])))
            self.assertEqual(o['securityId'],ACB.securityId);self.assertEqual(payload['sourcePdfSha256'],m['pdfEvidence']['sha256'])

    def test_compatible_period_scope_unit_and_revision(self):
        a=deepcopy(self.by['TOTAL_ASSETS',2025]);b=deepcopy(self.by['TOTAL_EQUITY',2025])
        self.assertTrue(d2.compatible([a,b]))
        for key,value in [('scope','STANDALONE'),('periodType','YTD'),('periodEnd','2025-06-30'),('unit','MILLION_CURRENCY'),('scale','1000000'),('revisionBasis','UNKNOWN')]:
            bad={**b,key:value};self.assertFalse(d2.compatible([a,bad]))
        self.assertFalse(any(m['periodType']=='YTD' or m['year'] not in range(2022,2026) or m['scope']=='STANDALONE' for m in self.ms))
        graph=FinancialGraph(ACB)
        self.assertRaisesRegex(ValueError,'REGULATORY_SCOPE_OR_FRAMEWORK',graph.derive,'BAD_CAR_TREND',2025,[self.by['BANK_REPORTED_CAR',2025],self.by['BANK_REPORTED_CAR',2024]],'growth','Must not compare TT14 to TT41','REGULATORY_CONSOLIDATED',True)

    def test_decimal_null_missing_zero_not_float(self):
        self.assertEqual(d2.number('9007199254740993.000001')-d2.number('9007199254740993'),Decimal('.000001'))
        self.assertEqual([p1.value_state(r) for r in [{},{'value':None},{'value':'0'}]],['MISSING','EXPLICIT_NULL','ZERO'])
        for m in self.ms:
            if m['value'] is not None:self.assertIsInstance(m['value'],str);d2.number(m['value'])
        self.assertRaises(ValueError,d2.number,1.0)

    def test_known_derived_values_exact_fractions(self):
        m=self.by['LOAN_DEPOSIT',2025]
        self.assertEqual(m['value'],d2.ratio('686777352','585180175'))
        self.assertEqual(m['exactFraction'],dict(numerator='686777352000000',denominator='585180175000000'))
        m=self.by['GROUP_ROE_AVG',2025]
        self.assertEqual(m['value'],d2.ratio('15624699000000','88990698500000'))
        self.assertEqual(self.by['NET_INCOME_YOY',2025]['value'],d2.ratio('-1165069000000','16789768000000'))

    def test_reserves_are_reconciled_components_not_full_contra_or_npl(self):
        for y in range(2022,2026):
            m=self.by['BANK_LOAN_LOSS_RESERVES',y];r=m['componentReconciliation']
            self.assertEqual(d2.number(m['nativeSourceValue']),d2.number(r['specific'])+d2.number(r['general']))
            self.assertEqual(d2.number(r['totalContra'])-d2.number(m['nativeSourceValue']),d2.number(r['excludedMarginLending']))
            self.assertNotEqual(m['nativeSourceValue'],r['totalContra'])
            self.assertIn('NOT NPL coverage',self.by['RESERVES_GROSS_LOANS',y]['definition'])
        self.assertEqual(self.by['BANK_LOAN_LOSS_RESERVES',2025]['nativeSourceValue'],'7507253')

    def test_capital_regulatory_scope_framework_and_cet1_gap(self):
        for y in range(2022,2026):
            m=self.by['BANK_REPORTED_CAR',y];self.assertEqual(m['scope'],'REGULATORY_CONSOLIDATED')
            self.assertEqual(m['regulatoryFramework'],'TT14_2025_STANDARDIZED' if y==2025 else 'TT41_2016_BASEL_II')
            self.assertEqual(d2.number(m['nativeSourceValue'])*Decimal('.01'),d2.number(m['value']))
        self.assertEqual(self.by['BANK_REPORTED_CET1',2025]['value'],'0.1207')
        for y in range(2022,2025):self.assertEqual(self.by['BANK_REPORTED_CET1',y]['status'],'MISSING');self.assertIsNone(self.by['BANK_REPORTED_CET1',y]['value'])
        self.assertFalse(d2.compatible([self.by['BANK_REPORTED_CAR',2025],self.by['GROUP_EQUITY_ASSETS',2025]]))

    def test_no_industrial_or_false_bank_metric_substitution(self):
        concepts={m['concept'] for m in self.ms}
        self.assertFalse(concepts & {'CFO_REPORTED_NPAT','POST_ACQUISITION_CASH','DISCLOSED_BORROWINGS_EQUITY','NIM','NPL_COVERAGE','REGULATORY_LDR'})
        self.assertIn('NOT NIM',self.by['NII_ASSETS_CLOSING',2025]['definition'])
        self.assertIn('NOT regulatory LDR',self.by['LOAN_DEPOSIT',2025]['definition'])

    def test_parent_npat_not_assumed_from_group(self):
        for y in range(2022,2026):
            m=self.by['NET_INCOME_ATTRIBUTABLE_PARENT',y]
            self.assertEqual(m['status'],'MISSING');self.assertIsNone(m['value'])
            self.assertGreater(d2.number(self.by['NET_INCOME',y]['value']),0)

    def test_all_23_m3_topics_unchanged_and_unscored(self):
        specs=p1.module('acb_test_m3','scripts/build-dfr02.py').rubrics()
        self.assertEqual(len(self.d['rubrics']),23)
        for r,s in zip(self.d['rubrics'],specs):
            self.assertEqual(r['rubric'],s['id']);self.assertEqual(r['requiredTopics'],s['topics'])
            for k in ('points','band','assessment'):self.assertIsNone(r[k])
            self.assertTrue(r['deferred']['exactDependency']);self.assertTrue(r['deferred']['resolutionPath'])
        self.assertTrue(validate_dossier(self.d))

    def test_scores_zero_or_bands_or_authority_rejected(self):
        for key,value in [('totalScore',0),('categoryScores',{}),('productionAdmissible',True),('scoringAuthorized',True),('valuationPerShare','1')]:
            d=deepcopy(self.d);d[key]=value;self.assertRaises(ValueError,validate_dossier,d)
        for key,value in [('points',0),('band','Average'),('assessment',{})]:
            d=deepcopy(self.d);d['rubrics'][0][key]=value;self.assertRaises(ValueError,validate_dossier,d)
        d=deepcopy(self.d);d['rubrics'][0]['requiredTopics'].pop();self.assertRaises(ValueError,validate_dossier,d)

    def test_graph_no_cycles_dangling_or_cross_issuer(self):
        self.graph.validate()
        self.assertTrue(all(n['ticker']=='ACB' and n['securityId']==ACB.securityId for n in self.graph.nodes.values()))
        g=DependencyGraph(ACB);g.add('a','METRIC','ACB');g.add('b','TOPIC','ACB')
        self.assertRaises(ValueError,g.add,'x','METRIC','BID');self.assertRaises(ValueError,g.edge,'a','missing')
        g.edge('a','b');g.edge('b','a');self.assertRaises(ValueError,g.validate)

    def test_conflict_locality_metric_to_topic_and_rubric(self):
        affected=self.graph.affected({'METRIC:ACB:CONSOLIDATED:BANK_LOAN_LOSS_RESERVES:2025'})
        self.assertIn('METRIC:ACB:CONSOLIDATED:RESERVES_GROSS_LOANS:2025',affected)
        self.assertIn('RUBRIC:ACB:FH-BS',affected);self.assertNotIn('RUBRIC:ACB:BQ-MOAT',affected)
        self.assertNotIn('METRIC:ACB:CONSOLIDATED:LOAN_DEPOSIT:2025',affected)
        self.assertNotIn('METRIC:ACB:CONSOLIDATED:TOTAL_ASSETS:2025',affected)
        self.assertTrue(all(r['points'] is None for r in affected.values()))

    def test_source_pointer_propagates_but_candidates_do_not_qualify(self):
        m=self.by['BANK_LOAN_LOSS_RESERVES',2025];b=m['observationBinding'];sid='SOURCE:ACB:'+b['path']+'#'+b['jsonPointer']
        affected=self.graph.affected({sid});self.assertIn('RUBRIC:ACB:FH-BS',affected)
        for a,b,role,prop in self.graph.edges:
            if role=='UNREVIEWED_PRESENTATION_REFERENCE':self.assertFalse(prop)

    def test_sources_full_inventory_and_unknown_units_stay_reference(self):
        inventory=json.loads((self.out/'source-inventory.json').read_text())
        self.assertEqual({i['kind'] for i in inventory},set(p1.PRIMARY))
        cells=json.loads((self.out/'source-projection.json').read_text())
        self.assertGreater(sum(i['rowsOrPages'] for i in inventory),len(cells))
        cafef=[c for c in cells if c['id'].startswith('CELL:ACB:CAFEF:')]
        self.assertTrue(cafef)
        for c in cafef:self.assertEqual(c['status'],'REFERENCE_ONLY')
        for c in self.d['providerCrosschecks']:
            if c['unit'] is None:self.assertEqual(c['status'],'REFERENCE_ONLY')

    def test_hash_drift_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'x.json';path.write_text('{"value":"1"}')
            self.assertRaises(ValueError,p1.Store(tmp,{'x.json':'0'*64}).read,'x.json')
            s=p1.Store(tmp);s.read('x.json');path.write_text('{"value":"2"}');self.assertRaises(ValueError,s.validate)
            self.assertRaises(ValueError,s.read,'../x.json')

    def test_all_current_sources_and_protected_bytes_unchanged(self):
        pins=json.loads((self.out/'protected-before.json').read_text())
        self.assertIn('data/vn30.sqlite',pins)
        self.assertIn('src/domain/scoring/methodology.ts',pins)
        for path,h in pins.items():self.assertEqual(p1.sha(ROOT/path),h,path)
        p1.Store(expected=json.loads((self.out/'input-pins.json').read_text())).validate()


if __name__=='__main__':unittest.main(verbosity=2)
