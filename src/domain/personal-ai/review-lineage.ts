import { decimal } from '@/domain/portfolio/values';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { RUBRICS } from '@/domain/scoring/methodology';
import { check, snapshot } from '@/domain/scoring/validation';
import { instant, dateOnly } from '@/shared/time';
import { financialRulesHash, type AiHash } from './provenance';

export interface LineageSource {
  readonly path: string; readonly sha256: string; readonly pointer: string; readonly payloadHash: string;
  readonly pdfPath: string | null; readonly pdfSha256: string | null; readonly physicalPage: number | null;
}
export interface ReviewLineageNode {
  readonly id: string; readonly kind: 'SOURCE' | 'NORMALIZED' | 'DERIVED' | 'EVIDENCE' | 'RUBRIC';
  readonly ticker: string; readonly inputs: readonly string[]; readonly value: string | null; readonly unit: string | null;
  readonly periodStart: string | null; readonly periodEnd: string | null; readonly reportingScope: string | null;
  readonly classification: 'REPORTED' | 'ASSUMPTION' | 'CONFLICT' | 'MISSING' | 'CONTEXT';
  readonly operation: string; readonly multiplier: string | null; readonly source: LineageSource | null;
  readonly details: Readonly<Record<string, unknown>>; readonly hash: string;
}
export interface ReviewLineageGraph {
  readonly contract: 'personal-ai-review-lineage-v1'; readonly scope: 'REVIEW_CANDIDATE';
  readonly ticker: string; readonly securityId: string; readonly sector: string; readonly knownAt: string;
  readonly financialRulesHash: string; readonly nodes: readonly ReviewLineageNode[];
  readonly sourceConflicts: readonly string[]; readonly stalePriorFactBindings: readonly string[];
  readonly acceptance: { readonly mapping: 'PENDING_VALIDATOR'; readonly financial: 'BLOCKED'; readonly normalizationQualified: false; readonly productionScoringAuthorized: false; readonly navAuthorized: false; readonly tradingAuthorized: false };
  readonly compatibility: { readonly target: 'personal-ai-di-acceptance-v1'; readonly directAdmission: false; readonly missing: readonly string[] };
  readonly contentHash: string;
}
export function lineageSemantic<T extends { readonly contentHash: string }>(value: T) {
  const { contentHash, ...semantic } = value; void contentHash; return semantic;
}
function exact(value: object, keys: string) {
  check(!!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(' ') === keys.split(' ').sort().join(' '), 'LINEAGE_EXACT_FIELDS');
}
function hash(value: string) { check(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), 'LINEAGE_HASH_REQUIRED'); }
/** This candidate contract validates mapping, not financial admission or AI scoring authority. */
export function validateReviewLineageGraph(raw: ReviewLineageGraph, digest: AiHash) {
  const graph = snapshot(raw);
  exact(graph, 'contract scope ticker securityId sector knownAt financialRulesHash nodes sourceConflicts stalePriorFactBindings acceptance compatibility contentHash');
  check(graph.contract === 'personal-ai-review-lineage-v1' && graph.scope === 'REVIEW_CANDIDATE', 'LINEAGE_REVIEW_CONTRACT_REQUIRED');
  instant(graph.knownAt); hash(graph.contentHash);
  check(graph.contentHash === digest(lineageSemantic(graph)) && graph.financialRulesHash === financialRulesHash(digest), 'LINEAGE_CONTENT_OR_FINANCIAL_RULES_MISMATCH');
  exact(graph.acceptance, 'mapping financial normalizationQualified productionScoringAuthorized navAuthorized tradingAuthorized');
  check(graph.acceptance.mapping === 'PENDING_VALIDATOR' && graph.acceptance.financial === 'BLOCKED' && [graph.acceptance.normalizationQualified,graph.acceptance.productionScoringAuthorized,graph.acceptance.navAuthorized,graph.acceptance.tradingAuthorized].every(x => x === false), 'LINEAGE_CANNOT_GRANT_FINANCIAL_AUTHORITY');
  exact(graph.compatibility, 'target directAdmission missing');
  check(graph.compatibility.target === 'personal-ai-di-acceptance-v1' && graph.compatibility.directAdmission === false && graph.compatibility.missing.length > 0, 'LINEAGE_NOT_DI_ACCEPTANCE');
  check(graph.nodes.length > 0 && graph.nodes.length <= 20000, 'LINEAGE_NODE_LIMIT');
  const nodes = new Map<string, ReviewLineageNode>();
  for (const n of graph.nodes) {
    exact(n, 'id kind ticker inputs value unit periodStart periodEnd reportingScope classification operation multiplier source details hash');
    check(n.ticker === graph.ticker && n.id.length > 0 && !nodes.has(n.id), 'LINEAGE_ISSUER_OR_DUPLICATE_ID');
    const { hash: nodeHash, ...semantic } = n;
    check(nodeHash === digest(semantic), 'LINEAGE_NODE_HASH_MISMATCH');
    check(['SOURCE','NORMALIZED','DERIVED','EVIDENCE','RUBRIC'].includes(n.kind) && ['REPORTED','ASSUMPTION','CONFLICT','MISSING','CONTEXT'].includes(n.classification), 'LINEAGE_NODE_KIND_OR_CLASSIFICATION');
    check(new Set(n.inputs).size === n.inputs.length && n.inputs.every(id => nodes.has(id)), 'LINEAGE_DANGLING_FORWARD_OR_CYCLIC_INPUT');
    const parents = n.inputs.map(id => nodes.get(id)!);
    if (n.value !== null) decimal(n.value);
    if (n.periodStart !== null) dateOnly(n.periodStart);
    if (n.periodEnd !== null) dateOnly(n.periodEnd);
    for (const field of ['knownAt','retrievedAt','ingestedAt','reviewedAt']) {
      const value = n.details[field];
      if (value !== undefined && value !== null) check(typeof value === 'string' && Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.parse(graph.knownAt), 'LINEAGE_FUTURE_OR_UNSUPPORTED_KNOWLEDGE');
    }
    if (n.periodStart !== null || n.periodEnd !== null) check(n.periodStart !== null && n.periodEnd !== null && /^\d{4}-\d{2}-\d{2}$/.test(n.periodStart) && n.periodStart <= n.periodEnd && n.periodEnd <= graph.knownAt.slice(0,10), 'LINEAGE_UNSUPPORTED_PERIOD');
    if (n.kind === 'SOURCE') {
      check(n.inputs.length === 0 && n.source !== null && n.operation === 'SOURCE', 'LINEAGE_ROOT_SOURCE_REQUIRED');
      exact(n.source!, 'path sha256 pointer payloadHash pdfPath pdfSha256 physicalPage');
      hash(n.source!.sha256); hash(n.source!.payloadHash);
      check(n.source!.pointer === '' || n.source!.pointer.startsWith('/'), 'LINEAGE_JSON_POINTER_REQUIRED');
      check(n.source!.pdfPath === null ? n.source!.pdfSha256 === null && n.source!.physicalPage === null : n.source!.pdfSha256 !== null, 'LINEAGE_DOCUMENT_BINDING_REQUIRED');
      if (n.source!.pdfSha256 !== null) hash(n.source!.pdfSha256);
      if (n.source!.physicalPage !== null) check(Number.isInteger(n.source!.physicalPage) && n.source!.physicalPage > 0, 'LINEAGE_PHYSICAL_PAGE_REQUIRED');
    } else {
      check(n.source === null, 'LINEAGE_ONLY_SOURCE_NODES_HAVE_LOCATORS');
      if (n.kind !== 'EVIDENCE') check(parents.length > 0, 'LINEAGE_INPUTS_REQUIRED');
      if (n.kind === 'NORMALIZED') check(parents.every(p => ['SOURCE','NORMALIZED'].includes(p.kind)), 'LINEAGE_NORMALIZATION_INPUT_KIND');
      if (n.kind === 'DERIVED') check(parents.every(p => ['NORMALIZED','DERIVED'].includes(p.kind)), 'LINEAGE_METRIC_INPUT_KIND');
      if (n.kind === 'EVIDENCE') check(parents.every(p => ['SOURCE','NORMALIZED','DERIVED'].includes(p.kind)) && n.details.sufficientForScoring === false, 'LINEAGE_CONTEXT_NOT_RUBRIC_PROOF');
      if (n.kind === 'RUBRIC') check(parents.every(p => p.kind === 'EVIDENCE'), 'LINEAGE_RUBRIC_NEEDS_TOPIC_EVIDENCE');
      if (parents.some(p => p.classification === 'ASSUMPTION')) check(['ASSUMPTION','CONTEXT','MISSING','CONFLICT'].includes(n.classification), 'LINEAGE_ASSUMPTION_LAUNDERING');
      if (parents.some(p => p.classification === 'CONFLICT')) check(['CONFLICT','CONTEXT','MISSING'].includes(n.classification), 'LINEAGE_CONFLICT_LAUNDERING');
      if (n.operation === 'UNRESOLVED') check(n.value === null && n.classification === 'MISSING', 'LINEAGE_UNKNOWN_IS_NOT_ZERO');
      else if (['NORMALIZED','DERIVED'].includes(n.kind)) {
        check(['NORMALIZE','ABS_NORMALIZE','RATIO','SUBTRACT','GROWTH','MODEL_REFERENCE','MULTIPLY'].includes(n.operation), 'LINEAGE_APPROVED_OPERATION_REQUIRED');
        if (n.value === null) check(n.classification === 'MISSING', 'LINEAGE_NULL_NEEDS_MISSING_STATUS');
        else {
          check(parents.every(p => p.value !== null), 'LINEAGE_KNOWN_OPERANDS_REQUIRED');
          let expected;
          if (['NORMALIZE','ABS_NORMALIZE'].includes(n.operation)) {
            check(parents.length === 1 && n.multiplier !== null, 'LINEAGE_DECLARED_MULTIPLIER_REQUIRED');
            const allowed: Record<string, readonly [string,string]> = { CURRENCY:['CURRENCY','1'], MILLION_CURRENCY:['CURRENCY','1000000'], RATIO:['RATIO','1'], PERCENT:['RATIO','0.01'], SHARES:['SHARES','1'], CURRENCY_PER_SHARE:['CURRENCY_PER_SHARE','1'] };
            check(parents[0].periodStart === n.periodStart && parents[0].periodEnd === n.periodEnd && parents[0].reportingScope === n.reportingScope, 'LINEAGE_NORMALIZED_DIMENSIONS_CHANGED');
            const mapping = allowed[parents[0].unit!];
            check(mapping && n.unit === mapping[0] && n.multiplier === mapping[1], 'LINEAGE_UNSUPPORTED_UNIT_MAPPING');
            const p = decimal(parents[0].value!);
            if (n.operation === 'ABS_NORMALIZE') check(n.details.itemId === 'CASH_CAPEX_REPORTED' && p.negative, 'LINEAGE_SPENDING_MAGNITUDE_ONLY');
            expected = (n.operation === 'ABS_NORMALIZE' && p.negative ? p.neg() : p).mul(decimal(n.multiplier!));
          } else if (n.operation === 'MODEL_REFERENCE') {
            check(n.classification === 'ASSUMPTION' && n.details.assumptionDependent === true && n.details.modelFormulaReplayed === false && parents.length >= 2, 'LINEAGE_MODEL_REFERENCE_NOT_FACT_OR_REPLAY');
            expected = decimal(parents[0].value!);
          } else {
            check(parents.length === 2, 'LINEAGE_TWO_OPERANDS_REQUIRED');
            if (n.operation === 'RATIO') check(parents.every(p => p.periodStart === n.periodStart && p.periodEnd === n.periodEnd && p.reportingScope === n.reportingScope), 'LINEAGE_RATIO_PERIOD_SCOPE_MISMATCH');
            if (n.operation === 'SUBTRACT') check(parents.every(p => p.unit === n.unit && p.periodStart === n.periodStart && p.periodEnd === n.periodEnd && p.reportingScope === n.reportingScope), 'LINEAGE_SUBTRACT_POPULATION_MISMATCH');
            if (n.operation === 'GROWTH') check(parents[0].periodEnd === n.periodEnd && parents.every(p => p.reportingScope === n.reportingScope) && n.details.samePopulation === true, 'LINEAGE_GROWTH_COMPARABILITY_REQUIRED');
            const metrics: Record<string, readonly [string,string]> = {
              REPORTED_CFO_TO_TOTAL_NET_INCOME:['CFO','NET_INCOME'], REPORTED_TOTAL_NET_MARGIN:['NET_INCOME','REVENUE'], REPORTED_GROSS_MARGIN:['GROSS_PROFIT','REVENUE'], REPORTED_CURRENT_RATIO:['CURRENT_ASSETS','CURRENT_LIABILITIES'], GROSS_CUSTOMER_LOANS_TO_CUSTOMER_DEPOSITS:['BANK_GROSS_CUSTOMER_LOANS','BANK_CUSTOMER_DEPOSITS'], REPORTED_LOAN_RESERVES_TO_GROSS_LOANS:['BANK_LOAN_LOSS_RESERVES','BANK_GROSS_CUSTOMER_LOANS'], REPORTED_POST_ACQUISITION_CASH:['CFO','CASH_CAPEX_REPORTED'],
            };
            const definition = metrics[String(n.details.metric)];
            if (definition) check(parents.every((p,i) => p.details.itemId === definition[i]), 'LINEAGE_METRIC_DEFINITION_MISMATCH');
            const [a,b] = parents.map(p => decimal(p.value!));
            if (n.operation === 'MULTIPLY') check(parents[0].unit === 'CURRENCY_PER_SHARE' && parents[1].unit === 'SHARES' && n.unit === 'CURRENCY' && parents.every(p=>p.periodEnd===n.periodEnd && p.reportingScope===n.reportingScope) && n.details.denominatorAccepted === false, 'LINEAGE_REFERENCE_CAP_NOT_ACCEPTED_VALUATION');
            expected = n.operation === 'SUBTRACT' ? a.sub(b) : n.operation === 'MULTIPLY' ? a.mul(b) : a.div(b);
            if (n.operation === 'GROWTH') expected = expected.sub(decimal('1'));
          }
          check(expected.eq(decimal(n.value)), 'LINEAGE_NUMERIC_REPLAY_MISMATCH');
        }
      }
    }
    nodes.set(n.id,n);
  }
  const rubricNodes = graph.nodes.filter(n => n.kind === 'RUBRIC');
  check(rubricNodes.length === RUBRICS.length, 'LINEAGE_EXACT_23_RUBRICS');
  for (const r of RUBRICS) {
    const found = rubricNodes.filter(n => n.details.rubricId === r.id);
    check(found.length === 1, 'LINEAGE_UNIQUE_RUBRIC'); const n = found[0];
    check(n.details.maxPoints === r.max && n.details.category === r.category && digest(n.details.topics) === digest(r.topics), 'LINEAGE_RUBRIC_POLICY_CHANGED');
    const topics = n.inputs.map(id => nodes.get(id)!);
    check(topics.length === r.topics.length && r.topics.every(topic => topics.filter(t => t.details.topic === topic && t.details.rubricId === r.id).length === 1), 'LINEAGE_EXACT_TOPIC_MAPPING');
    check(n.details.retainedAssessmentIsNewAcceptance === false && n.details.retainedAssessmentHash === digest(n.details.retainedAssessment), 'LINEAGE_RETAINED_ASSESSMENT_BINDING');
    const retained = n.details.retainedAssessment as { points: number | null; subcategory: string };
    check(retained.subcategory === r.id && (retained.points === null ? n.value === null : n.value === String(retained.points)), 'LINEAGE_NR_ZERO_OR_POINT_CHANGED');
  }
  return deepFreeze({ ticker: graph.ticker, securityId: graph.securityId, contentHash: graph.contentHash, technicalMappingAccepted: true, financialAcceptance: 'BLOCKED' as const, personalAiAcceptanceEligible: false, productionScoringAuthorized: false, navAuthorized: false, tradingAuthorized: false });
}
