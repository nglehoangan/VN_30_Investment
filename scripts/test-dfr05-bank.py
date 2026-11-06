"""P2.3 actual four-issuer exports and controlled adversarial contracts."""
import json
import unittest
import tempfile
from pathlib import Path
from dataclasses import replace
from copy import deepcopy
from decimal import Decimal
from lib.dfr05_bank_v3 import *

OUT=ROOT/REL


def read(p):return json.loads(Path(p).read_text())


class FourBanks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ds={t:read(OUT/f'issuers/{t}.json') for t in TICKERS}
        cls.by={t:{(m['concept'],m['year']):m for m in d['metrics']} for t,d in cls.ds.items()}
        cls.graphs={}
        for i in IDENTITIES:
            payload=read(OUT/f'dependency-graphs/{i.ticker}.json');g=DependencyGraph(i)
            g.nodes={n['id']:n for n in payload['nodes']};g.edges={(e['source'],e['target'],e['role'],e['propagates']) for e in payload['edges']};cls.graphs[i.ticker]=g

    def test_exact_four_stable_ids_sector_and_universe(self):
        self.assertEqual(set(self.ds),{'CTG','MBB','TCB','VCB'})
        for identity in IDENTITIES:
            row=verify_identity(p1.Store(),identity);self.assertEqual(row['securityId'],self.ds[identity.ticker]['securityId'])

    def test_every_unauthorized_identity_denied_before_io(self):
        class NoIO:
            def read(self,*args):raise AssertionError('Must authorize before source access')
        denied=[]
        for r in read(ROOT/acb.UNIVERSE)['constituents']:
            if r['ticker'] in TICKERS:continue
            i=acb.Identity(r['securityId'],r['ticker'],r['existingSector'],'BANK','CONSOLIDATED')
            for fn in (lambda:replay(NoIO(),i),lambda:RetainedAdapter(NoIO(),'PDF',i),lambda:FinancialGraph(i),lambda:DependencyGraph(i)):
                self.assertRaisesRegex(ValueError,'NOT_AUTHORIZED',fn)
            denied.append(r['ticker'])
        self.assertEqual(len(denied),26);self.assertIn('SSI',denied);self.assertIn('ACB',denied)

    def test_wrong_ticker_stableid_sector_subtype_scope_rejected(self):
        for i in IDENTITIES:
            for k,v in [('securityId','wrong'),('ticker','ACB'),('m3Sector','INDUSTRIAL'),('researchSubtype','SECURITIES'),('reportingScope','STANDALONE')]:self.assertRaises(ValueError,authorize,replace(i,**{k:v}))
        self.assertRaises(ValueError,authorize,'CTG')

    def test_immutable_acb_and_p1_kernels_still_deny_four(self):
        for i in IDENTITIES:
            self.assertRaises(ValueError,acb.authorize,i)
            self.assertRaises(ValueError,p1.Adapter,p1.Store(),'PDF',i.ticker)
            self.assertRaises(ValueError,d2.Graph,i.ticker)
        self.assertIs(RetainedAdapter.records,acb.RetainedAdapter.records)
        self.assertIs(DependencyGraph.affected,p1.DependencyGraph.affected)
        self.assertIs(FinancialGraph.fact,d2.Graph.fact)

    def test_original_observation_payload_value_hash_identity_and_revision(self):
        store=p1.Store()
        for t,d in self.ds.items():
            for m in d['metrics']:
                if not m.get('observationBinding'):continue
                b=m['observationBinding'];o=d2.pointer(store.read(b['path']),b['jsonPointer'])
                b=m['reviewPayloadBinding'];payload=json.loads(d2.pointer(store.read(b['path']),b['jsonPointer']));f=d2.pointer(payload,b['payloadJsonPointer'])
                self.assertEqual(m['value'],o['normalized']['value']);self.assertEqual(d2.number(m['value']),d2.number(str(f['value'])))
                self.assertEqual(o['securityId'],d['securityId']);self.assertEqual(payload['sourcePdfSha256'],m['pdfEvidence']['sha256'])
                self.assertEqual(p1.sha(ROOT/m['pdfEvidence']['path']),m['pdfEvidence']['sha256'])
                if f.get('revisionStatus')=='RESTATED':self.assertEqual(m['revisionBasis'],'RESTATED_REVIEWED_VINTAGE');self.assertEqual(o['revisionKind'],'ORIGINAL')
                self.assertIsNone(m['publicationAt'])

    def test_native_units_preserved_without_invented_printed_lexical(self):
        for d in self.ds.values():
            for m in d['metrics']:
                if m['value'] is None:continue
                self.assertIsInstance(m['value'],str);d2.number(m['value'])
                if m.get('nativeSourceValue') is not None:
                    self.assertEqual(d2.number(m['nativeSourceValue'])*d2.number(m['nativeSourceMultiplier']),d2.number(m['value']))
                    self.assertIn(m['nativeSourceUnit'],('MILLION_CURRENCY','PERCENT'))

    def test_decimal_zero_null_missing_and_raw_precision(self):
        self.assertEqual(d2.number('9007199254740993.000001')-d2.number('9007199254740993'),Decimal('.000001'))
        self.assertEqual([p1.value_state(x) for x in ({},{'value':None},{'value':'0'})],['MISSING','EXPLICIT_NULL','ZERO'])
        self.assertRaises(ValueError,d2.number,0)
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'raw.json';p.write_text('{"n":9007199254740993.000001,"z":0,"x":null}');h=p1.sha(p);s=p1.Store(tmp)
            self.assertEqual(s.raw_binding('raw.json','/n',h,'9007199254740993.000001','NUMERIC')['rawDecimal'],'9007199254740993.000001')
            self.assertRaises(ValueError,s.raw_binding,'raw.json','/n',h,'9007199254740993','NUMERIC')

    def test_period_scope_unit_revision_mismatch_rejected(self):
        for t in TICKERS:
            a=deepcopy(self.by[t]['TOTAL_ASSETS',2025]);b=deepcopy(self.by[t]['TOTAL_EQUITY',2025])
            self.assertTrue(d2.compatible([a,b]))
            for key,v in [('scope','STANDALONE'),('periodType','YTD'),('periodEnd','2025-06-30'),('unit','MILLION_CURRENCY'),('scale','1000000'),('revisionBasis','UNKNOWN')]:self.assertFalse(d2.compatible([a,{**b,key:v}]))
            self.assertFalse(any(m['year'] not in range(2022,2026) or m['scope']=='STANDALONE' or m['periodType']=='YTD' for m in self.ds[t]['metrics']))

    def test_actual_derived_fractions_and_12dp_half_even(self):
        for t in TICKERS:
            by=self.by[t]
            self.assertEqual(by['LOAN_DEPOSIT',2025]['value'],d2.ratio(by['BANK_GROSS_CUSTOMER_LOANS',2025]['value'],by['BANK_CUSTOMER_DEPOSITS',2025]['value']))
            for m in self.ds[t]['metrics']:
                if m.get('exactFraction') and m['status']=='SUPPORTED':
                    f=m['exactFraction'];self.assertEqual(m['value'],d2.ratio(f['numerator'],f['denominator']))

    def test_explicit_parent_npat_not_group_substitution(self):
        expected={'CTG':'34604481000000','MBB':'26778939000000','TCB':'25290230000000','VCB':'35177663000000'}
        for t,v in expected.items():
            self.assertEqual(self.by[t]['NET_INCOME_ATTRIBUTABLE_PARENT',2025]['value'],v)
            self.assertNotEqual(self.by[t]['NET_INCOME',2025]['value'],v)
            self.assertNotEqual(self.by[t]['NET_INCOME_ATTRIBUTABLE_PARENT',2025]['value'],self.by[t]['NET_INCOME',2025]['value'])
        self.assertEqual(self.by['MBB']['NET_INCOME_ATTRIBUTABLE_PARENT',2022]['status'],'MISSING')
        self.assertEqual(self.by['CTG']['NET_INCOME_ATTRIBUTABLE_PARENT',2022]['value'],'16923725000000')
        self.assertEqual(self.by['VCB']['NET_INCOME_ATTRIBUTABLE_PARENT',2023]['value'],'33101027000000')
        self.assertEqual(self.by['VCB']['BANK_NET_INTEREST_INCOME',2023]['value'],'53614431000000')

    def test_reported_car_never_cet1_book_equity_or_other_framework(self):
        for t in TICKERS:
            for y in range(2022,2026):
                car=self.by[t]['BANK_REPORTED_CAR',y];cet=self.by[t]['BANK_REPORTED_CET1',y]
                self.assertEqual(car['scope'],'REGULATORY_CONSOLIDATED');self.assertEqual(car['regulatoryFramework'],'TT41_2016_BASEL_II')
                self.assertEqual(car['status'],'SUPPORTED');self.assertEqual(cet['status'],'MISSING');self.assertIsNone(cet['value'])
            g=FinancialGraph(next(i for i in IDENTITIES if i.ticker==t));a=self.by[t]['BANK_REPORTED_CAR',2025];bad={**a,'regulatoryFramework':'OTHER'}
            self.assertRaisesRegex(ValueError,'REGULATORY_SCOPE_OR_FRAMEWORK',g.derive,'bad',2025,[a,bad],'ratio','bad','REGULATORY_CONSOLIDATED')

    def test_specific_general_total_contra_and_tcb_exclusions(self):
        for t in TICKERS:
            by=self.by[t]
            self.assertEqual(d2.number(by['BANK_GENERAL_LOAN_RESERVE',2025]['value'])+d2.number(by['BANK_SPECIFIC_LOAN_RESERVE',2025]['value']),d2.number(by['BANK_LOAN_LOSS_RESERVES',2025]['value']))
            if t!='VCB':
                r=by['BANK_LOAN_LOSS_RESERVES',2025]['componentReconciliation']
                self.assertEqual(d2.number(r['qualifiedAllowance'])+d2.number(r['separatelyExcluded']),d2.number(r['balanceSheetAllowance']))
        self.assertEqual(self.by['TCB']['BANK_LOAN_LOSS_RESERVES',2025]['componentReconciliation']['separatelyExcluded'],'12758000000')
        self.assertEqual(self.by['TCB']['BANK_TOTAL_LOAN_CONTRA_REPORTED',2025]['value'],'-10498378000000')

    def test_npl_uses_qualified_customer_groups_not_reserve_proxy(self):
        for t in TICKERS:
            by=self.by[t];npl=sum((d2.number(by['BANK_CUSTOMER_LOAN_GROUP_'+k,2025]['value']) for k in ('3','4','5')),Decimal(0))
            self.assertEqual(d2.number(by['BANK_CUSTOMER_LOAN_NPL',2025]['value']),npl)
            self.assertEqual(by['BANK_CUSTOMER_LOAN_NPL',2025]['periodType'],'INSTANT')
            self.assertEqual(by['BANK_CUSTOMER_LOAN_NPL_COVERAGE',2025]['value'],d2.ratio(by['BANK_LOAN_LOSS_RESERVES',2025]['value'],d2.text(npl)))
            self.assertIn('NOT NPL coverage',by['RESERVES_GROSS_LOANS',2025]['definition'])

    def test_interest_expense_sign_and_banking_funding_context(self):
        for t in TICKERS:
            by=self.by[t]
            self.assertLess(d2.number(by['BANK_INTEREST_EXPENSE',2025]['value']),0)
            self.assertEqual(by['BANK_NII_COMPONENT_RECONCILIATION',2025]['value'],by['BANK_NET_INTEREST_INCOME',2025]['value'])
            self.assertTrue(by['BANK_INTERBANK_ASSETS_REPORTED',2025]['sourceCaption'])
            self.assertGreater(d2.number(by['BANK_ISSUED_FUNDING_INSTRUMENTS',2025]['value']),0)

    def test_same_document_restatement_cohort_is_explicit_not_relabelled(self):
        by=self.by['CTG'];m=by['GROUP_EQUITY_ASSETS',2022]
        self.assertEqual(m['status'],'SUPPORTED');self.assertEqual(m['revisionBasis'],'COHERENT_REVIEWED_DOCUMENT_VINTAGE')
        self.assertTrue(m['compatibilityEvidence']['originalSourceMetadataUnchanged'])
        self.assertEqual(by['TOTAL_ASSETS',2022]['revisionBasis'],'RESTATED_REVIEWED_VINTAGE')
        self.assertEqual(by['TOTAL_ASSETS_FY22_25_CHANGE',2025]['status'],'CONFLICT')
        self.assertIsNone(by['TOTAL_ASSETS_FY22_25_CHANGE',2025]['value'])

    def test_no_bank_industrial_or_false_diagnostic_substitutions(self):
        for d in self.ds.values():
            names={m['concept'] for m in d['metrics']}
            self.assertFalse(names&{'CFO_REPORTED_NPAT','POST_ACQUISITION_CASH','DISCLOSED_BORROWINGS_EQUITY','NIM','STATUTORY_LDR','CET1_FROM_EQUITY'})
        for t in TICKERS:self.assertIn('NOT NIM',self.by[t]['NII_ASSETS_CLOSING',2025]['definition'])

    def test_exact_92_rubrics_approved_topics_unscored(self):
        specs=p1.module('bank_test_m3','scripts/build-dfr02.py').rubrics()
        self.assertEqual(sum(len(d['rubrics']) for d in self.ds.values()),92)
        for d in self.ds.values():
            self.assertTrue(validate_dossier(d))
            for r,s in zip(d['rubrics'],specs):
                self.assertEqual(r['requiredTopics'],s['topics']);self.assertEqual(r['rubric'],s['id'])
                for k in ('points','band','assessment'):self.assertIsNone(r[k])
                self.assertTrue(r['deferred']['exactDependency']);self.assertTrue(r['deferred']['issuerSpecificContext'])

    def test_missing_as_zero_band_total_or_authority_rejected(self):
        for t in TICKERS:
            for key,v in [('totalScore',0),('categoryScores',{}),('valuationPerShare','1'),('productionAdmissible',True),('scoringAuthorized',True)]:
                d=deepcopy(self.ds[t]);d[key]=v;self.assertRaises(ValueError,validate_dossier,d)
            for key,v in [('points',0),('band','good'),('assessment',{})]:
                d=deepcopy(self.ds[t]);d['rubrics'][0][key]=v;self.assertRaises(ValueError,validate_dossier,d)

    def test_graph_consistency_no_cross_issuer_contamination(self):
        for t,g in self.graphs.items():
            g.validate();self.assertTrue(all(n['ticker']==t and n['securityId']==self.ds[t]['securityId'] for n in g.nodes.values()))
            self.assertEqual(sum(n['kind']=='RUBRIC' for n in g.nodes.values()),23)
        g=DependencyGraph(IDENTITIES[0]);g.add('a','METRIC','CTG');self.assertRaises(ValueError,g.add,'b','METRIC','MBB');self.assertRaises(ValueError,g.edge,'a','missing')
        g.add('c','TOPIC','CTG');g.edge('a','c');g.edge('c','a');self.assertRaises(ValueError,g.validate)

    def test_controlled_source_and_metric_conflict_per_issuer_exact_receipts(self):
        receipts={}
        for t,g in self.graphs.items():
            m=self.by[t]['BANK_LOAN_LOSS_RESERVES',2025];target='METRIC:'+m['id'];affected=g.affected({target})
            self.assertIn(f'METRIC:{t}:CONSOLIDATED:RESERVES_GROSS_LOANS:2025',affected);self.assertIn(f'RUBRIC:{t}:FH-BS',affected)
            for unchanged in [f'METRIC:{t}:CONSOLIDATED:LOAN_DEPOSIT:2025',f'METRIC:{t}:CONSOLIDATED:TOTAL_ASSETS:2025',f'RUBRIC:{t}:BQ-MOAT']:self.assertNotIn(unchanged,affected)
            b=m['observationBinding'];sid=f'SOURCE:{t}:'+b['path']+'#'+b['jsonPointer'];source_affected=g.affected({sid});self.assertIn(target,source_affected)
            self.assertTrue(all(v['points'] is None for v in affected.values()))
            # Explicit merge proves a metric-local conflict has no other-bank edge.
            merged=DependencyGraph(next(i for i in IDENTITIES if i.ticker==t));merged.nodes={k:v for other in self.graphs.values() for k,v in other.nodes.items()};merged.edges=set().union(*(other.edges for other in self.graphs.values()));all_affected=merged.affected({target})
            self.assertTrue(all(merged.nodes[k]['ticker']==t for k in all_affected))
            receipts[t]=dict(mode='STATUS_ONLY_CONTROLLED_OVERLAY; original facts/assessments unchanged',changedMetric=target,changedSource=sid,metricAffected=affected,sourceAffected=source_affected,unaffectedNodeIds=sorted(set(g.nodes)-set(source_affected)),otherBanksAffected=0)
        (OUT/'conflict-injection-results.json').write_text(json.dumps(receipts,ensure_ascii=False,indent=2)+'\n')

    def test_candidate_evidence_never_qualifies_or_scores(self):
        for t,g in self.graphs.items():
            for a,b,role,p in g.edges:
                if role=='UNREVIEWED_PRESENTATION_REFERENCE':self.assertFalse(p)
            for n in g.nodes.values():
                if n['kind']=='TOPIC':self.assertFalse(n['fullTopicQualified'])
            for c in read(OUT/f'source-projection/{t}.json'):
                if c['id'].startswith(f'CELL:{t}:CAFEF:'):self.assertEqual(c['status'],'REFERENCE_ONLY')

    def test_four_structures_period_scope_and_units_inventory(self):
        for t in TICKERS:
            inventory=read(OUT/f'source-inventory/{t}.json');self.assertEqual({r['kind'] for r in inventory},set(p1.PRIMARY))
            self.assertGreater(sum(r['rowsOrPages'] for r in inventory),sum(r['materializedRowsOrPages'] for r in inventory))
            self.assertTrue(all(not r['qualifiedByPresence'] for r in inventory))

    def test_hash_drift_and_source_escape_rejection(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'a.json';p.write_text('{"value":"1"}')
            self.assertRaises(ValueError,p1.Store(tmp,{'a.json':'0'*64}).read,'a.json')
            s=p1.Store(tmp);s.read('a.json');p.write_text('{"value":"2"}');self.assertRaises(ValueError,s.validate);self.assertRaises(ValueError,s.read,'../a.json')

    def test_exact_p1_and_acb_parity(self):
        builder=p1.module('bank_test_builder','scripts/build-dfr05-bank.py');r=builder.predecessor_parity()
        self.assertEqual((r['p1']['metrics'],r['p1']['completed'],r['p1']['deferred']),(789,25,113));self.assertEqual(r['acb']['canonicalCoreHash'],builder.ACB_CORE)

    def test_protected_methodology_database_master_and_all_data(self):
        pins=read(OUT/'protected-before.json');prior=p1.module('bank_test_prior','scripts/build-dfr05-acb.py')
        prior.check(pins,exact_data_inventory=True)
        self.assertIn('data/vn30.sqlite',pins);self.assertIn('src/domain/scoring/methodology.ts',pins)
        for t in TICKERS:p1.Store(expected=read(OUT/f'input-pins/{t}.json')).validate()


if __name__=='__main__':unittest.main(verbosity=2)
