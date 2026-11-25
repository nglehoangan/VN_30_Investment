import { readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const vitest = createRequire(realpathSync('node_modules/vitest/package.json'));
const vite = createRequire(vitest.resolve('vite/package.json'));
const { createJiti } = await import(pathToFileURL(vite.resolve('jiti')).href);
const jiti = createJiti(import.meta.url, { alias: { '@': resolve(root, 'src') }, fsCache: false });
const load = path => jiti.import(resolve(root, path));
const { default: assert } = await import('node:assert/strict');
const { writeFileSync } = await import('node:fs');
const { sha } = await load('src/infrastructure/source-admission/registry.ts');
const { snapshotHash: hash } = await load('src/infrastructure/fundamentals/snapshot-hash.ts');
const { createCurrentDatasetConsumer } = await load('tools/scoring/fpt-technology-adapter.ts');
const { aiInputSemantic, financialRulesHash } = await load('src/domain/current-scoring/provenance.ts');
const { calculateScorecard } = await load('src/domain/current-scoring/scorecard.ts');
const { RUBRICS } = await load('src/domain/scoring/methodology.ts');
const { FPT_UNRATED_RUBRICS } = await load('src/domain/current-scoring/limited-coverage.ts');
const { PrismaClient } = await load('src/infrastructure/db/generated/client');
const { PrismaBetterSqlite3 } = createRequire(resolve(root, 'package.json'))('@prisma/adapter-better-sqlite3');
const local = name => relative(root, resolve(import.meta.dirname, name));
const read = name => JSON.parse(readFileSync(local(name)));
const pin = (name, reference) => {
  const path = local(name);
  return { path, sha256: sha(readFileSync(path)), reference };
};
const write = (name, value) => writeFileSync(local(name), JSON.stringify(value, null, 2) + '\n');
const candidate = read('FPT_PREPARE_V8_CANDIDATE.json');
const reference = read('FPT_PREPARE_DATA_REFERENCE_V8.json');
const method = read('FPT_METHODOLOGY_APPROVED.json');
const draft = read('FPT_ASSESSMENT_V8_DRAFT.json');
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: realpathSync('data/vn30.sqlite'), readonly: true }) });
try {
  const consumer = await createCurrentDatasetConsumer(db, root, candidate.subject);
  const dataset = await consumer.resolve(reference, reference.context);
  assert.equal(dataset.dataAcceptanceId, draft.dataAcceptanceId);
  const {dataAcceptanceId, ...receipt} = dataset;
  assert.equal(hash(receipt), draft.datasetHash);
  const now = new Date().toISOString();
  const {securityId, cutoff, universeVersion, universeHash} = candidate.subject;
  const asOf = cutoff + 'T23:59:59.999Z';
  const m1Id = 'FPT_M1_LIQUIDITY_PENDING_2026_11_13';
  const evidence = [...dataset.evidence];
  const add = (id, value, source) => {
    evidence.push({ id, version: 'fpt-v8-limited-assessment-v1', securityId, observation: id,
      value, unit: 'TEXT', classification: 'ESTIMATE', source, periodStart: cutoff, periodEnd: cutoff, asOf,
      publishedAt: now, receivedAt: now, validThrough: asOf, critical: false, quality: 'VALID', family: id });
    return id;
  };
  add(m1Id, 'M1 liquidity review pending. Limited review authorized by the owner for this FPT scope.', local('FPT_M1_V8_DRAFT.json'));
  const scopePath = local('FPT_LIMITED_EXACT_SCOPE.md');
  const assessments = [['BQ-MOAT',3,'Differentiation and persistence supported by multiyear customer evidence.'],
    ['IC-IND',2,'Industry demand and delivery scale coexist with talent, pricing and AI pressures.']].map(([id, points, rationale]) => {
    const rubric = RUBRICS.find(row => row.id === id);
    const band = rubric.bands.find(row => row.min <= points && points <= row.max);
    const topics = rubric.topics.map(topic => {
      const row = draft.topics.find(row => row.rubricId === id && row.topic === topic);
      assert.ok(row && row.sources.length && row.status !== 'MATERIAL_GAP');
      const evidenceId = add('FPT-' + id + '-' + topic, row.finding, row.sources.map(pin => pin.path).join(' | '));
      return { topic, refs: [evidenceId], rationale: row.finding };
    });
    return { subcategory: id, assessment: band.label, selectedPoints: points, analyst: 'CHATGPT', source: 'AI',
      assessedAt: now, methodologyVersion: '1.0.0', rationale, strongerEvidence: false, maximumPrerequisitesMet: false,
      exceptionalJustification: null, disconfirmingEvidence: [
        add('FPT-' + id + '-counter', id === 'BQ-MOAT' ? 'Customer retention and pricing power are not quantified across the business.' :
          'AI disruption and talent competition limit the industry assessment.', scopePath),
      ], evidence: topics, sector: 'TECHNOLOGY', sectorRationale: 'TECHNOLOGY sector convention under M3 §7.',
      economicChannel: id === 'BQ-MOAT' ? 'Customer relationship economics' : 'Industry-wide competitive structure' };
  });
  const gate = (owner, status) => ({ owner, methodologyId: 'fpt-m1-liquidity-pending-v1', asOf, evaluatedAt: now, status, evidenceRefs: [m1Id] });
  const input = {
    contract: 'personal-ai-score-input-v1', currentPurpose: { contract: 'current-scoring-time-v1', purpose: 'CURRENT_FORMAL_VALUATION', economicCutoff: cutoff, evaluatedAt: now },
    artifactScope: 'FORMAL', id: 'fpt-limited-v8-2026-11-13', securityId, companyName: 'FPT Corporation', asOf, knownAt: now, calculatedAt: now,
    priorScorecardId: null, revisionReason: null, methodology: method,
    reference: { receivedAt: pocketTime(reference), taxonomy: 'M3_REGISTERED_SECTOR_ROUTE', data: { version: universeVersion,
      intervals: [['IDENTIFIER','FPT'],['MEMBERSHIP','VN30'],['SECTOR','TECHNOLOGY']].map(([kind,value]) => ({
        id: 'FPT-V8-' + kind, kind, securityId, from: '2026-08-03', to: '2026-11-16', value,
        taxonomy: kind === 'SECTOR' ? 'M3_REGISTERED_SECTOR_ROUTE' : null, sourceReference: universeHash,
      })) } },
    normalization: { sector: 'TECHNOLOGY', cycle: 'MILDLY_CYCLICAL', peakCycleRisk: false,
      method: 'M3 technology limited evidence', peerIds: [], peerBasis: 'ABSOLUTE_HISTORY',
      rationale: 'Use retained customer and industry evidence within the limited scope.', actionComparable: false, actionEvidenceRefs: [] },
    evidence, assessments, metrics: [], expectedReturn: null, criticalMissing: [],
    stage0: gate('M1_STAGE_0','UNKNOWN'), hardVeto: gate('M1_RISK_POLICY','PENDING'), residualRisk: gate('M1_RISK_POLICY','NOT_RATED'),
    confidence: { level: 'LOW', analyst: 'CHATGPT', rationale: 'Narrow coverage and unresolved liquidity.', dimensions: ['Adequate','Weak','Adequate','Weak','Weak'] },
    thesis: { core: 'Technology services and delivery scale.', compounding: 'Retention and multiyear contracts.', valuation: 'Outside approved rubric scope.',
      downside: 'Unresolved liquidity and technology disruption.', invalidation: 'Deterioration in customer persistence and competitive structure.' },
    doubleCountReview: { analyst: 'CHATGPT', rationale: 'Firm-specific customer evidence and industry-level competition use separate economic channels.', passed: true },
  };
  function pocketTime(ref) { return ref.context.knownAt; }
  const hashes = {inputHash:hash(aiInputSemantic(input)), evidenceHash:hash(input.evidence), methodologyHash:hash(method), financialRulesHash:financialRulesHash(hash)};
  const toolArtifact = pin('FPT_ASSESSMENT_V8_DRAFT.json','FPT_V8_EVIDENCE_WORKPACK');
  const scopeArtifact = pin('FPT_PREPARE_V8_CANDIDATE.json','FPT_V8_SCOPE');
  const sources = [toolArtifact.reference,scopeArtifact.reference];
  const passes = ['PREPARATION','CHALLENGE'].map(kind => {
    const artifactReference = 'FPT_V8_' + kind;
    const artifactName = artifactReference + '.json';
    const common = { at: now, actor: 'CHATGPT', model: 'GPT-6', sessionReference: 'FPT-2026-11-13-V8', toolReferences: sources };
    const checks = kind === 'PREPARATION'
      ? [{ id: 'DATASET_HASH', expectedHash: draft.datasetHash, actualHash: hash(receipt), evidenceReferences: sources }]
      : [{ id: 'LIMITED_SCOPE', expectedHash: hash(FPT_UNRATED_RUBRICS),
        actualHash: hash(RUBRICS.filter(r => !assessments.some(a => a.subcategory === r.id)).map(r => r.id)), evidenceReferences: sources }];
    assert.ok(checks.every(c => c.expectedHash === c.actualHash));
    write(artifactName, { contract: 'personal-ai-pass-artifact-v1', pass: kind, ...common, ...hashes, checks });
    const artifact = pin(artifactName, artifactReference);
    return { artifact, pass: { kind, ...common, artifactReference, artifactHash: artifact.sha256 } };
  });
  input.review = { contract: 'personal-ai-review-provenance-v1', mode: 'OWNER_AUTHORIZED_AI_SELF_REVIEW', independentHumanReviewClaimed: false,
    ownerAuthorizationReference: local('FPT_LIMITED_POLICY_OWNER_REQUEST.txt'), ...hashes,
    assessmentHashes: assessments.map(a => ({rubricId:a.subcategory,sha256:hash(a)})), passes: passes.map(p => p.pass) };
  const card = calculateScorecard(input, hash);
  assert.deepEqual(card.missingEvidence, FPT_UNRATED_RUBRICS);
  assert.equal(card.totalScore, null);
  assert.equal(card.blockingEvidence.length, 0);
  const metricDecisions = draft.metricDecisions.map(m => ({ metric: m.metric,
    status: m.status === 'NOT_APPLICABLE' ? 'NOT_APPLICABLE' : 'N_R',
    ruleReference: 'Excluded from the FPT limited assessment, retained reasoning: ' + m.reason, evidenceRefs: [m1Id] }));
  write('FPT_V8_FORMAL_ASSESSMENT.json', {contract:'current-assessment-adoption-v1',input,datasetHash:hash(dataset),metricDecisions});
  write('FPT_PREPARE_V8_COMPLETE_CANDIDATE.json', {
    subject:candidate.subject,database:candidate.database,adapter:candidate.adapter,reference:candidate.reference,executable:candidate.executable,
    assessment:pin('FPT_V8_FORMAL_ASSESSMENT.json','FPT_V8_FORMAL_ASSESSMENT'),
    reviewBindings:[{ reviewHash:hash(input.review), ownerAuthorizationReference:input.review.ownerAuthorizationReference,
      passArtifacts:passes.map(p=>p.artifact),toolArtifacts:[toolArtifact,scopeArtifact] }],
  });
} finally {
  await db.$disconnect();
}
