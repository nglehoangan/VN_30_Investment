"""Bind retained research and the verified isolated dataset to the FPT scoring handoff."""
import hashlib
import json
from pathlib import Path
import sqlite3
import sys
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = next(parent for parent in HERE.parents if (parent / 'tools/scoring/vn30_score.py').is_file())


def read(path):
    return json.loads(path.read_bytes())


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def pin(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': digest(path.read_bytes())}


def checked(row):
    body, sha256 = row
    if digest(body.encode()) != sha256:
        raise ValueError('STORED_BODY_HASH_MISMATCH')
    return json.loads(body)


def main(path):
    path = Path(path).resolve(strict=True)
    if not path.is_relative_to(Path(tempfile.gettempdir()).resolve()) and not path.is_relative_to(Path('/tmp').resolve()):
        raise ValueError('USE_ISOLATED_SQLITE')
    result_path = HERE / 'FPT_CUTOFF_RESULT.json'
    result = read(result_path)
    with sqlite3.connect(path.as_uri() + '?mode=ro', uri=True) as db:
        dataset = checked(db.execute('SELECT body, body_hash FROM current_financial_dataset WHERE id=?', (result['datasetId'],)).fetchone())
        manifest = dataset['manifest']
        assert manifest['facts'] == result['findings']
        assert manifest['price'] == result['price'] and manifest['shares'] == result['shares']
        context = result['context']
        assert all(manifest[key] == context[key] for key in ('ticker', 'securityId', 'economicCutoff', 'knownAt', 'purpose'))
        facts = {}
        for entry in manifest['facts']:
            row = db.execute('SELECT body, body_hash FROM current_financial_fact WHERE id=? AND admission_id=?',
                             (entry['id'], manifest['admissionId'])).fetchone()
            fact = checked(row)
            assert fact['ticker'] == 'FPT' and fact['id'] == entry['id']
            assert digest(row[0].encode()) == entry['hash']
            facts[fact['itemId']] = {'id': entry['id'], 'sha256': entry['hash'], 'period': fact['period']}

    handoff = HERE.parent / 'FPT_FORMAL_SCORING_HANDOFF.json'
    scorecard = HERE.parent / 'FPT_23_RUBRIC_FY2025_RESEARCH_SCORECARD.md'
    evidence = {
        'BQ-EQ': 'BQ_FH_FY2025_BASELINE_REASSESSMENT',
        'BQ-MOAT': 'BQ_FH_FY2025_BASELINE_REASSESSMENT',
        'BQ-CASH': 'BQ_FH_ONE_PASS_DISPOSITION',
        'BQ-RES': 'BQ_RES_FY2025_PUBLIC_EVIDENCE',
        'FH-BS': 'BQ_FH_ONE_PASS_DISPOSITION',
        'FH-LIQ': 'FH_LIQ_FY2025_CONSERVATIVE_ASSESSMENT',
        'FH-STRESS': 'FY2025_13_UNRATED_REASSESSMENT',
        'GQ-INC': 'FY2025_13_UNRATED_REASSESSMENT',
        'IC-CYCLE': 'FY2025_FINAL_TEN_RUBRIC_REVIEW',
        'VAL-PRIMARY': 'FY2025_HISTORICAL_PE_CASHFLOW_CROSSCHECK',
        'VAL-RET': 'FY2025_VALUATION_RUBRIC_REASSESSMENT',
        'VAL-MOS': 'FY2025_HISTORICAL_PE_CASHFLOW_CROSSCHECK',
        'RG-RISK': 'FY2025_FINAL_TEN_RUBRIC_REVIEW',
        'RG-UNC': 'FY2025_HISTORICAL_ANCHORS_RG_CA',
        'CA-REINV': 'FY2025_HISTORICAL_ANCHORS_RG_CA',
        'CA-DIST': 'FY2025_13_UNRATED_REASSESSMENT',
        'CA-DIL': 'FY2025_HISTORICAL_ANCHORS_RG_CA',
    }
    cash = ('CFO', 'ASSET_PURCHASE_CASH_OUTFLOW')
    borrowing = ('SHORT_TERM_FINANCIAL_BORROWINGS', 'LONG_TERM_FINANCIAL_BORROWINGS')
    liquidity = ('CASH_AND_EQUIVALENTS', *borrowing)
    fact_context = {
        'BQ-CASH': cash + ('RECEIVABLES',),
        'FH-BS': liquidity + ('RECEIVABLES',),
        'FH-LIQ': liquidity + ('CURRENT_ASSETS',),
        'FH-STRESS': liquidity + ('CFO',),
        'GQ-HIST': ('REVENUE', 'NET_INCOME_ATTRIBUTABLE_PARENT'),
        'GQ-FWD': ('CFO',),
        'VAL-PRIMARY': ('NET_INCOME_ATTRIBUTABLE_PARENT',),
        'VAL-MOS': liquidity,
        'CA-REINV': cash,
    }
    market_context = {'VAL-PRIMARY': ['price', 'shares'], 'VAL-RET': ['price', 'shares'],
                      'VAL-MOS': ['price'], 'CA-DIL': ['shares'], 'CA-PSV': ['shares']}
    rows = []
    for row in read(handoff)['rubrics']:
        rubric = row['rubricId']
        sources = [{**pin(scorecard), 'locator': '| ' + rubric + ' |'}]
        if rubric in evidence:
            sources.append(pin(HERE.parent / ('FPT_' + evidence[rubric] + '.md')))
        rows.append({
            'rubricId': rubric, 'maxPoints': row['maxPoints'], 'requiredFormalTopics': row['requiredFormalTopics'],
            'researchFY2025': row['researchFY2025'], 'researchUpdate9M2026': row['researchUpdate9M2026'],
            'researchRationale': row['researchRationale'], 'researchEvidence': sources,
            'nativeDatasetContext': [facts[item] for item in fact_context.get(rubric, ())],
            'marketDatasetContext': {key: manifest[key] for key in market_context.get(rubric, ())},
            'formalTopicBindings': None, 'formalLimitedNrApproved': False,
        })
    assert len({row['rubricId'] for row in rows}) == 23 and sum(row['maxPoints'] for row in rows) == 100
    print(json.dumps({
        'contract': 'fpt-isolated-rubric-evidence-handoff-v1', 'context': context,
        'datasetId': dataset['id'], 'datasetReceipt': pin(result_path), 'rubrics': rows,
        'researchNrFY2025': [row['rubricId'] for row in rows if row['researchFY2025']['points'] is None],
        'researchNr9M2026': [row['rubricId'] for row in rows if row['researchUpdate9M2026']['points'] is None],
        'formalLimitedNrApproved': [],
        'formalBlockers': ['FPT_TECHNOLOGY_COVERAGE_ADAPTER_REQUIRED', 'FORMAL_RUBRIC_ASSESSMENT_AND_REVIEWS_REQUIRED'],
        'scoringAuthorized': False,
    }, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main(sys.argv[1])
