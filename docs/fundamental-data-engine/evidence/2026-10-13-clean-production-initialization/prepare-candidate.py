"""Seal fresh pre-admission evidence; never grant approval or build a fake snapshot.

Run once after the fresh manual extraction and reference capture. Historical
evidence is read only for its file hashes, never for financial/admission status.
"""
import datetime
import hashlib
import json
import pathlib
import re
import sqlite3
import subprocess
import uuid

OUT = pathlib.Path(__file__).resolve().parent
ROOT = OUT.parents[3]
EXTRACT = ROOT / 'data/manual-extracted/2026-10-13-clean-production'
DB = ROOT / 'data/initializations/2026-10-13-clean-production.sqlite'


def digest(body):
    return hashlib.sha256(body).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def write(name, value):
    target = OUT / name
    if target.exists():
        if json.loads(target.read_text()) != value:
            raise ValueError('PARTIAL_RUN_CONTENT_CHANGED: ' + name)
        return
    with target.open('x') as stream:
        stream.write(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def identity(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': digest(path.read_bytes())}


def main():
    # Refuse regeneration rather than replacing an immutable run.
    if (OUT / 'ARTIFACT_HASHES.json').exists():
        raise SystemExit('SEALED_RUN_ALREADY_EXISTS')
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    run_id = str(uuid.uuid4())
    if (OUT / 'INITIALIZATION_IDENTITY.json').exists():
        existing = json.loads((OUT / 'INITIALIZATION_IDENTITY.json').read_text())
        now, run_id = existing['builtAt'], existing['runId']
    context = {'mode': 'AS_KNOWN', 'decisionAsOf': now, 'systemKnownAt': now,
               'fundamentalCutoff': now, 'marketCutoff': now, 'builtAt': now}
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    historical = [identity(p) for p in sorted((OUT.parent).rglob('*'))
                  if p.is_file() and OUT not in p.parents]
    write('HISTORICAL_EVIDENCE_PRESERVATION.json', {'files': historical, 'overwriteAllowed': False})
    write('HISTORICAL_CANDIDATE_STATUS.json', {
        'commit': '9dc31c4c66399aeb72579c60bb898ad770812f63',
        'status': 'HISTORICAL_INITIALIZATION_NOT_PRODUCTION_ADMISSIBLE',
        'authority': 'PROJECT_OWNER_CLEAN_INITIALIZATION_INSTRUCTION',
        'recordedAt': now, 'historicalEvidenceRewritten': False})
    write('INITIALIZATION_IDENTITY.json', {'runId': run_id, 'HEAD': head, **context,
          'status': 'STOPPED_AT_PRE_ADMISSION_GOVERNANCE_BOUNDARY',
          'snapshotRunId': None, 'historicalSnapshotReused': False})

    ref = OUT / 'reference'
    receipt = json.loads((ref / 'verified-tls-receipts.json').read_text())
    pages = json.loads((ref / 'hsx-july-constituents.text.json').read_text())['pages']
    rows = []
    main_table = pages[0].split('Danh mục cổ phiếu dự phòng')[0]
    for line in main_table.splitlines():
        match = re.match(r'^\s*(\d+)\s+([A-Z]{3})\s+(.+?)\s+([\d,]+)\s+\d+%', line)
        if match:
            rows.append({'ticker': match[2], 'issuer': match[3].strip(), 'exchange': 'HOSE',
                         'effectiveFrom': '2026-08-03', 'sourcePage': 1,
                         'sourceRow': int(match[1]), 'activeMembership': 'UNRESOLVED_AT_DECISION_AS_OF'})
    assert len(rows) == 30 and len({r['ticker'] for r in rows}) == 30
    api = json.loads((ref / 'hsx-vn30-current.json').read_text())['data']['list']
    notice = json.loads((ref / 'hsx-july-notice.json').read_text())['data']
    dated, undated = {r['ticker'] for r in rows}, {r['code'] for r in api}
    conflict = {'datedNoticeOnly': sorted(dated - undated), 'undatedAPIOnly': sorted(undated - dated),
                'resolution': 'UNRESOLVED_OFFICIAL_MEMBERSHIP_EVIDENCE',
                'neededEvidence': 'Dated official correction/change history or official confirmation of the applicable list at decisionAsOf; no latest-wins or ETF proxy.'}
    write('PRODUCTION_UNIVERSE.json', {'status': 'BLOCKED', 'productionMembers': [],
          'datedOfficialCandidateMembers': rows, 'datedCandidateCount': 30,
          'undatedOfficialAPIMembers': sorted(undated), 'conflict': conflict,
          'documentIdentity': 'HOSE-INDEX-JULY-2026-NOTICE-2479382',
          'effectiveDate': '2026-08-03', 'publicationEvidence': {
              'source': 'reference/hsx-july-notice.json', 'postedDateRaw': notice['postedDate'],
              'publishFromRaw': notice['publishFrom'], 'effectiveDateEvidence': notice['summary'],
              'rawTimestampSemantics': 'OFFICIAL_API_FIELDS; NOT A FINANCIAL_PIT_POLICY_BINDING'},
          'sources': receipt, 'ETFProxyUsed': False})
    by_ticker = {r['code']: r for r in api}
    identities = []
    for row in rows:
        ticker = row['ticker']
        # Prospective namespace is explicit. No private/live security master is read.
        security_id = str(uuid.uuid5(uuid.NAMESPACE_URL, 'https://www.hsx.vn/security/HOSE/' + ticker))
        found = by_ticker.get(ticker)
        identities.append({**row, 'securityIdCandidate': security_id,
                           'identityAlgorithm': 'UUIDv5 URL namespace + exact HOSE ticker URL; prospective only',
                           'isin': found.get('isin') if found else None,
                           'officialProviderSecurityId': found.get('id') if found else None,
                           'evidence': 'reference/hsx-july-constituents.pdf#page=1',
                           'reconciliation': 'NEW_ISOLATED_DATABASE_NO_EXISTING_SECURITIES; NOT_ADMITTED',
                           'status': 'BLOCKED_MEMBERSHIP_AND_IDENTITY_QUALIFICATION'})
    assert len({r['securityIdCandidate'] for r in identities}) == 30
    write('PRODUCTION_SECURITY_IDENTITIES.json', {'status': 'BLOCKED', 'admitted': [],
          'candidates': identities, 'duplicateCandidateIDs': 0, 'privatePortfolioRegistryRead': False})
    write('PRODUCTION_SECTOR_MAPPING.json', {'status': 'BLOCKED', 'admitted': [],
          'taxonomyEvidence': [identity(ROOT / 'docs/03 SCORING/SECTOR_NORMALIZATION.md'),
                               identity(ROOT / 'docs/02 DATABASE/SECTOR_MASTER.md')],
          'M3Changed': False, 'mappingVersion': None,
          'reason': 'Exact effective-dated project-sector assignment authority not established; broad official GICS labels are not automatically M3 assignments.',
          'candidates': [{'ticker': r['ticker'], 'sector': None, 'classificationSource': None,
                          'effectiveDate': None, 'evidence': None, 'mappingVersion': None} for r in rows]})

    inventory = json.loads((EXTRACT / 'manual-inventory.json').read_text())
    documents, qualifications, bank_rows = [], [], []
    banks = {r['ticker'] for r in rows if 'Ngân hàng' in r['issuer']}
    for entry in inventory['files']:
        path = ROOT / entry['path']
        body_hash = digest(path.read_bytes())
        assert body_hash == entry['sha256']
        text_path = EXTRACT / (body_hash + '.text.json')
        text = json.loads(text_path.read_text())
        assert text['bodyHash'] == body_hash and len(text['pages']) == entry['pageCount']
        # Complete fresh reading inventory is not a content qualification.
        doc = {**entry, 'sourceBodyRetained': True, 'sourceBodyVerifiedAt': now,
               'freshTextEvidence': identity(text_path), 'source': 'OWNER_RETAINED_MANUAL_CORPUS',
               'issuer': None, 'ticker': None, 'documentType': None, 'period': None,
               'scope': None, 'publicationEvidence': None, 'PIT': 'UNKNOWN',
               'qualification': 'UNQUALIFIED', 'canonicalAdmission': False}
        documents.append(doc)
        qualifications.append({'bodyHash': body_hash, 'path': entry['path'], 'status': 'UNQUALIFIED',
                               'method': 'NOT_REVIEWED', 'pageEvidence': [],
                               'reason': 'Fresh full-page native extraction completed. Formal issuer/security binding and source interpretation await upstream admission authority; no historical qualification inherited.'})
        if entry['folderTickerHint'] not in banks:
            continue
        # Exact raw text only: these are search leads, not verified definitions or values.
        leads = []
        for page, content in enumerate(text['pages'], 1):
            lines = [line.strip() for line in content.splitlines()
                     if re.search(r'CASA|NPL|non.performing|nợ xấu|current accounts|savings accounts|nh.m [345]|nh6m [345]', line, re.I)]
            if lines:
                leads.append({'sourcePage': page, 'rawCaptionSearchLeads': lines,
                              'verifiedCaption': False})
        for metric in ['CASA', 'NPL']:
            bank_rows.append({'bank': entry['folderTickerHint'], 'bankIdentityStatus': 'FOLDER_HINT_NOT_AUTHORITY',
                              'metric': metric, 'period': None, 'scope': None,
                              'sourceDocument': entry['path'], 'sourceSHA256': body_hash,
                              'sourcePage': None, 'exactCaptions': [], 'rawPageSearchLeads': leads,
                              'definition': None, 'productClassPopulation': None,
                              'numerator': None, 'denominator': None, 'unit': None,
                              'regulatoryBasis': None, 'publicationEvidence': None,
                              'PITAvailability': 'UNKNOWN', 'effectiveMappingVersion': None,
                              'decisionClass': 'EVIDENCE_MAPPING_ONLY', 'status': 'INSUFFICIENT_EVIDENCE',
                              'ownerApproval': None, 'executionAllowed': False,
                              'missingProof': ['Fresh document qualification and identity/period/scope binding',
                                               'Exact visually reviewed definition, operands and populations',
                                               'Governed publication/PIT proof']})
    write('PRODUCTION_SOURCE_MANIFEST.json', {'status': 'INVENTORIED_NOT_ADMITTED',
          'financialDocumentsAcquired': 0, 'referenceDocumentsReacquired': len(receipt),
          'bulkDownloadPerformed': False, 'qualified': 0, 'unqualified': len(documents),
          'documents': documents, 'mandatoryMissingSourceBodyProved': 0,
          'equivalentSourceSearch': 'Historical selected facts discarded; retained bodies inventoried from zero. No mandatory new report acquisition is justified before requirements/source requalification.'})
    write('PRODUCTION_DOCUMENT_QUALIFICATIONS.json', {'qualified': 0,
          'unqualified': len(qualifications), 'inheritedQualification': False, 'rows': qualifications})
    contract_path = ROOT / 'src/infrastructure/fundamentals/casa-npl-source-contract-v1.json'
    contract = json.loads(contract_path.read_text())
    assert contract['status'] == 'APPROVED' and not contract['bankSpecificMappings']
    write('BANK_SPECIFIC_MAPPING_APPROVAL_CANDIDATE.json', {
        'status': 'NOT_READY_FOR_BANK_MAPPING_APPROVAL', 'genericContract': identity(contract_path),
        'genericApprovalRequestedAgain': False, 'bankSpecificSelfApproval': False,
        'genericAuthority': contract['approvalAuthority'], 'applicableBankCandidates': sorted(banks),
        'evidenceComplete': 0, 'ownerApprovalRequiredEvidenceComplete': 0,
        'insufficientEvidence': len(bank_rows), 'EVIDENCE_MAPPING_ONLY': bank_rows,
        'POLICY_DECISION_REQUIRED': [],
        'nextBoundary': 'Upstream production registry release approval; bank tables must first become evidence-complete. Null fields are missing proof, never approved population choices.',
        'bankTableApprovalRequirement': [c['proposedContract']['bankSpecificApplicability'] for c in contract['contracts']]})

    registry_path = ROOT / 'src/infrastructure/fundamentals/canonical-items-v1.json'
    crosswalk_path = ROOT / 'src/infrastructure/fundamentals/derivation-crosswalk-v1.json'
    registry, crosswalk = json.loads(registry_path.read_text()), json.loads(crosswalk_path.read_text())
    write('PRODUCTION_AUTHORITY_APPROVAL_CANDIDATE.json', {
        'status': 'AWAITING_PROJECT_OWNER_RELEASE_DECISION', 'approvalGranted': False,
        'decisionClass': 'POLICY_DECISION_REQUIRED',
        'reason': 'Approved/tested implementation does not supply the separately required external approval of the exact data interpretation release.',
        'registry': {**identity(registry_path), 'canonicalContentHash': digest(canonical(registry)),
                     'governanceStatus': registry['governanceStatus'], 'approvalReference': registry['approvalReference'],
                     'methodologyIdentity': registry['methodologyIdentity'], 'crosswalkVersion': registry['crosswalkVersion'],
                     'authorityReferences': registry['authorityReferences']},
        'derivationCrosswalk': {**identity(crosswalk_path), 'canonicalContentHash': digest(canonical(crosswalk)),
                               'governanceStatus': crosswalk['governanceStatus'],
                               'approvalReference': crosswalk['approvalReference'], 'version': crosswalk['version']},
        'exactBoundary': 'src/infrastructure/fundamentals/canonical-registry.ts:verifyRegistryApproval',
        'requiredDecision': 'Approve or reject the exact canonical registry and derivation crosswalk release content. Approval must then be bound through the existing methodology mechanism to an APPROVED/PRODUCTION record and the approved registry hash; this file grants no authority.',
        'additionalAuthorityNotImplied': ['Provider-specific source mappings', 'Slice05 availability policy hash/timezone/external binding',
                                        'Effective-dated sector assignment release', 'Bank-specific populations and bridges'],
        'freshness': {'thresholdInvented': False, 'perPathBlockersGenerated': 0,
                      'policyAuthorityNeeded': 'Approved requirements release and reporting-cycle/public-inventory evidence under existing fundamental freshness rules; no downstream freshness veto.'}})

    with sqlite3.connect(f'file:{DB}?mode=ro', uri=True) as connection:
        quick = connection.execute('PRAGMA quick_check').fetchall()
        foreign = connection.execute('PRAGMA foreign_key_check').fetchall()
        migrations = connection.execute('SELECT migration_name, checksum, finished_at FROM _prisma_migrations ORDER BY migration_name').fetchall()
        schema = connection.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY type,name").fetchall()
        tables = [r[0] for r in connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        counts = {table: connection.execute('SELECT COUNT(*) FROM "' + table.replace('"', '""') + '"').fetchone()[0] for table in tables}
        seeded_methodology = connection.execute('SELECT * FROM methodology_record ORDER BY methodology_id').fetchall()
    assert quick == [('ok',)] and not foreign and len(migrations) == 15
    assert counts['methodology_record'] == 2
    assert all(count == 0 for name, count in counts.items() if name not in ['_prisma_migrations', 'methodology_record'])
    write('PRODUCTION_DATABASE_IDENTITY.json', {'database': identity(DB),
          'schemaContentHash': digest(canonical(schema)), 'prismaSchema': identity(ROOT / 'prisma/schema.prisma'),
          'migrations': migrations, 'migrationFiles': [identity(p) for p in sorted((ROOT / 'prisma/migrations').rglob('migration.sql'))],
          'quick_check': quick, 'foreign_key_check': foreign, 'tableRowCounts': counts,
          'committedMigrationSeedMethodologyRecords': seeded_methodology,
          'portfolioTransactions': 0, 'brokerLedgerChanges': 0, 'livePortfolioDatabaseOverwritten': False})
    reason = 'STOPPED_AT_UPSTREAM_PRODUCTION_REGISTRY_AUTHORITY; official membership conflict also remains external evidence dependency.'
    for name, contents in [
        ('PRODUCTION_CANONICAL_FACTS.json', {'facts': [], 'sourceOccurrencesAdmitted': 0}),
        ('PRODUCTION_PIT_ASSESSMENTS.json', {'assessments': [], 'verified': 0, 'unknownMandatory': None, 'unsafeSelected': 0}),
        ('PRODUCTION_CONFLICT_REPORT.json', {'financialComparisonExecuted': False, 'resolved': 0, 'remainingMandatory': None, 'referenceConflict': conflict}),
        ('PRODUCTION_DERIVATIONS.json', {'calculated': [], 'mandatoryCount': None, 'HUMAN_NORMALIZEDFabricated': False}),
        ('PRODUCTION_SNAPSHOT_MANIFEST.json', {'snapshotRunId': None, 'contentHash': None, 'manifestDigest': None, 'unsafeSelected': 0, 'mode': 'AS_KNOWN'}),
        ('PRODUCTION_REPLAY.json', {'snapshotReverseReplay': 'NOT_EXECUTED', 'contentIdentity': None})]:
        write(name, {'status': 'NOT_EXECUTED_GOVERNANCE_BOUNDARY', 'reason': reason, 'runId': run_id, **contents})
    write('PRODUCTION_READINESS_MATRIX.json', {'status': 'NOT_READY', 'ready': 0,
          'denominator': 30, 'denominatorAuthority': 'DATED_OFFICIAL_CANDIDATE_ONLY; CURRENT_UNIVERSE_UNRESOLVED',
          'fundamentalMissingPaths': None, 'fundamentalFreshnessBlockers': None,
          'mechanicalDerivationsReady': 0, 'mechanicalDerivationsRequired': None,
          'globalBlockers': ['PRODUCTION_REGISTRY_RELEASE_EXTERNAL_APPROVAL_REQUIRED', 'OFFICIAL_MEMBERSHIP_CONFLICT_UNRESOLVED'],
          'downstreamBlockerExpansionPerformed': False,
          'rows': [{'ticker': r['ticker'], 'status': 'NOT_EVALUATED_UPSTREAM_BOUNDARY', 'dataReady': False} for r in rows]})
    gates = [{'id': f'DI{i}', 'status': 'BLOCKED', 'reason': reason} for i in range(1, 14)]
    gates[0]['reason'] = conflict['resolution']
    gates[1]['reason'] = 'Candidate deterministic identities unique; exact active membership and authoritative identity release unresolved.'
    gates[2]['reason'] = 'Effective-dated M3 sector assignment release authority not established.'
    gates[3]['reason'] = 'Market initialization not rebuilt; no fabricated historical market evidence.'
    gates += [{'id': 'DI14', 'status': 'BLOCKED_PREREQUISITES', 'nextStatus': 'AWAITING_INDEPENDENT_REVIEW'},
              {'id': 'DI15', 'status': 'BLOCKED_PREREQUISITES', 'nextStatus': 'AWAITING_PROJECT_OWNER_APPROVAL'}]
    write('PRODUCTION_DI_MATRIX.json', {'inheritedPASS': False, 'prerequisitesSatisfied': False,
          'DI14PASSAsserted': False, 'DI15ApprovalAsserted': False, 'gates': gates})
    print(json.dumps({'runId': run_id, 'documents': len(documents), 'bankRows': len(bank_rows),
                      'status': 'STOPPED_AT_PRE_ADMISSION_GOVERNANCE_BOUNDARY'}))


if __name__ == '__main__':
    main()
