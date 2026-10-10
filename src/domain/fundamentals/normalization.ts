import type { FundamentalObservation, RegistryRelease, ReportingScope, FinancialUnit } from './contracts';
import type { QualifiedNormalizationCandidate } from './document-qualification';
import { requireQualifiedDocument } from './document-qualification';
import { requireFundamental, fundamentalId, fundamentalHash, validateFundamentalObservation } from './validation';
import { decimal } from '@/domain/portfolio/values';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { snapshot } from '@/domain/scoring/validation';
import type { Sector } from '@/domain/scoring/methodology';
import { SECTORS } from '@/domain/scoring/methodology';
import { instant, dateOnly } from '@/shared/time';

export type LexicalFormat = 'CANONICAL' | 'VI' | 'EN';
export interface StatementMapping {
  readonly version: string; readonly sourceVersionId: string;
  readonly governanceStatus: 'PROPOSED' | 'APPROVED'; readonly approvalReference: string | null;
  readonly fields: readonly { readonly fieldId: string; readonly label: string; readonly itemId: string;
    readonly unit: string; readonly currency: string | null; readonly format: LexicalFormat;
    readonly sign: 'IDENTITY' | 'NEGATE_NONPOSITIVE'; readonly missingTokens: readonly string[];
    readonly definitionReference: string }[];
}
export interface MappingRelease { readonly manifest: StatementMapping; readonly hash: string }
/** Evidence reviewed independently of ingestion order. Unknown semantics omit this object and block admission. */
export interface StatementRevision {
  readonly kind: FundamentalObservation['revisionKind']; readonly recordVersion: string;
  readonly predecessorId: string | null; readonly evidenceReference: string;
  readonly reason: string | null; readonly knownAt: string | null;
  readonly publication: FundamentalObservation['publication'] | null;
  readonly predecessorMappingHash: string | null;
}
export interface StatementExtract {
  readonly id: string; readonly documentId: string; readonly bodyHash: string; readonly qualificationId: string;
  readonly reviewerReference: string; readonly reviewedAt: string; readonly method: 'REVIEWED_TRANSCRIPTION';
  readonly sector: Sector; readonly sectorReference: string; readonly accountingBasis: string;
  readonly auditStatus: FundamentalObservation['auditStatus'];
  readonly rows: readonly { readonly id: string; readonly fieldId: string; readonly label: string;
    readonly sourceLabel: string; readonly locator: string; readonly definitionLocator: string;
    readonly unitLocator: string; readonly periodLocator: string;
    readonly lexicalValue: string | null; readonly unit: string; readonly currency: string | null;
    readonly reportingScope: ReportingScope; readonly periodStart: string; readonly periodEnd: string;
    readonly periodType: FundamentalObservation['periodType']; readonly revision?: StatementRevision }[];
}
export interface NormalizationFinding {
  readonly rowId: string; readonly code: string; readonly severity: 'BLOCKING' | 'MISSING';
  readonly relatedObservationIds: readonly string[];
}
export interface NormalizationAssessment {
  /** Execution/recording clock only; never issuer publication, signing or canonical availability. */
  readonly id: string; readonly scope: FundamentalObservation['scope']; readonly recordedAt: string;
  readonly revisionPolicyVersion?: 'explicit-lineage-v1';
  readonly sourceVersionId: string; readonly importExecutionId: string; readonly rawCaptureId: string;
  readonly documentId: string; readonly bodyHash: string; readonly qualificationId: string;
  readonly qualification: QualifiedNormalizationCandidate['qualification']; readonly captureIds: readonly string[];
  readonly extract: StatementExtract; readonly extractHash: string;
  readonly mapping: MappingRelease; readonly registry: RegistryRelease;
  readonly status: 'VALIDATED' | 'PARTIAL' | 'BLOCKED';
  readonly findings: readonly NormalizationFinding[]; readonly observations: readonly FundamentalObservation[];
  readonly compared: readonly { readonly id: string; readonly hash: string }[];
}
export const DECLARED_UNITS: Readonly<Record<string,readonly [FinancialUnit,string]>> = deepFreeze({
  CURRENCY:['CURRENCY','1'],THOUSAND_CURRENCY:['CURRENCY','1000'],MILLION_CURRENCY:['CURRENCY','1000000'],
  BILLION_CURRENCY:['CURRENCY','1000000000'],CURRENCY_PER_SHARE:['CURRENCY_PER_SHARE','1'],
  SHARES:['SHARES','1'],THOUSAND_SHARES:['SHARES','1000'],RATIO:['RATIO','1'],PERCENT:['RATIO','0.01'],
});
function exact(value: object, names: string) {
  requireFundamental(value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(' ') === names.split(' ').sort().join(' '),'NORMALIZATION_EXACT_FIELDS');
}
function text(value: string) {
  requireFundamental(typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 4000 &&
    !/[\x00-\x1f<>]/.test(value),'NORMALIZATION_TEXT');
}
function reference(value: string) {
  text(value); requireFundamental(!/[?@#]/.test(value) && !/bearer\s|token\s*=|api[_-]?key\s*=/i.test(value),'NORMALIZATION_SAFE_REFERENCE');
}
function locator(value: string) {
  requireFundamental(typeof value === 'string' && /^page:[1-9][0-9]{0,4}(?:\/[A-Za-z0-9_:-]+)+$/.test(value), 'EXTRACT_CONTENT_LOCATOR');
}
export function validateStatementMapping(raw: StatementMapping, registry: RegistryRelease) {
  const m = snapshot(raw);
  exact(m,'version sourceVersionId governanceStatus approvalReference fields');
  fundamentalId(m.version); fundamentalId(m.sourceVersionId);
  requireFundamental(['PROPOSED','APPROVED'].includes(m.governanceStatus) &&
    (m.governanceStatus === 'APPROVED') === (m.approvalReference !== null),'MAPPING_APPROVAL_METADATA');
  if (m.approvalReference !== null) reference(m.approvalReference);
  requireFundamental(Array.isArray(m.fields) && m.fields.length > 0 && m.fields.length <= 1000 &&
    new Set(m.fields.map(f => f.fieldId)).size === m.fields.length,'MAPPING_FIELDS');
  for (const f of m.fields) {
    exact(f,'fieldId label itemId unit currency format sign missingTokens definitionReference');
    fundamentalId(f.fieldId); text(f.label); reference(f.definitionReference);
    const item = registry.manifest.items.find(i => i.itemId === f.itemId && i.status === 'ACTIVE');
    const declared = DECLARED_UNITS[f.unit];
    requireFundamental(item && declared && item.allowedUnits.includes(declared[0]),'MAPPING_ITEM_UNIT');
    requireFundamental(['CANONICAL','VI','EN'].includes(f.format) && ['IDENTITY','NEGATE_NONPOSITIVE'].includes(f.sign),'MAPPING_LEXICAL_POLICY');
    requireFundamental(item.currencyApplicability === 'REQUIRED' ? typeof f.currency === 'string' && /^[A-Z]{3}$/.test(f.currency) : f.currency === null,'MAPPING_CURRENCY');
    requireFundamental(Array.isArray(f.missingTokens) && f.missingTokens.length <= 20 && new Set(f.missingTokens).size === f.missingTokens.length,'MAPPING_MISSING_TOKENS');
    f.missingTokens.forEach(text);
    requireFundamental(f.missingTokens.every((t:string) => t !== '0' && !/[0-9]/.test(t)),'ZERO_CANNOT_BE_MISSING');
    requireFundamental(f.sign !== 'NEGATE_NONPOSITIVE' || item.signConvention === 'NONNEGATIVE','MAPPING_SIGN_OWNERSHIP');
  }
  return deepFreeze(m);
}
export function validateStatementExtract(raw: StatementExtract) {
  const x = snapshot(raw);
  exact(x,'id documentId bodyHash qualificationId reviewerReference reviewedAt method sector sectorReference accountingBasis auditStatus rows');
  fundamentalId(x.id); fundamentalHash(x.documentId); fundamentalHash(x.bodyHash); fundamentalId(x.qualificationId);
  reference(x.reviewerReference); reference(x.sectorReference); text(x.accountingBasis); instant(x.reviewedAt);
  requireFundamental(x.method === 'REVIEWED_TRANSCRIPTION' && SECTORS.includes(x.sector) &&
    ['AUDITED','REVIEWED','UNAUDITED','UNKNOWN'].includes(x.auditStatus),'EXTRACT_METADATA');
  requireFundamental(Array.isArray(x.rows) && x.rows.length > 0 && x.rows.length <= 500 && new Set(x.rows.map(r => r.id)).size === x.rows.length,'EXTRACT_ROWS');
  for (const r of x.rows) {
    exact(r,'id fieldId label sourceLabel locator definitionLocator unitLocator periodLocator lexicalValue unit currency reportingScope periodStart periodEnd periodType' + (r.revision === undefined ? '' : ' revision'));
    if (r.revision !== undefined) {
      const v = r.revision;
      exact(v,'kind recordVersion predecessorId evidenceReference reason knownAt publication predecessorMappingHash');
      requireFundamental(['ORIGINAL','ISSUER_RESTATEMENT','PROVIDER_CORRECTION','MAPPING_CORRECTION'].includes(v.kind),'REVISION_KIND');
      fundamentalId(v.recordVersion); reference(v.evidenceReference);
      if (v.kind === 'ORIGINAL') requireFundamental(v.predecessorId === null && v.reason === null && v.knownAt === null && v.publication === null && v.predecessorMappingHash === null,'ORIGINAL_HAS_NO_PREDECESSOR');
      else {fundamentalId(v.predecessorId); reference(v.reason!); instant(v.knownAt!);}
      if (v.predecessorMappingHash !== null) fundamentalHash(v.predecessorMappingHash);
      requireFundamental(v.kind === 'ISSUER_RESTATEMENT' || v.publication === null,'CORRECTION_CANNOT_DECLARE_ISSUER_PUBLICATION');
    }
    fundamentalId(r.id); fundamentalId(r.fieldId); text(r.label); text(r.sourceLabel); text(r.unit);
    [r.locator,r.definitionLocator,r.unitLocator,r.periodLocator].forEach(locator);
    requireFundamental(r.lexicalValue === null || typeof r.lexicalValue === 'string' && r.lexicalValue.length <= 4000,'RAW_LEXICAL_STRING_REQUIRED');
    requireFundamental(r.currency === null || typeof r.currency === 'string' && /^[A-Z]{3}$/.test(r.currency),'EXTRACT_CURRENCY');
    requireFundamental(['CONSOLIDATED','SEPARATE_STANDALONE'].includes(r.reportingScope) &&
      ['QUARTER','YTD','ANNUAL','INSTANT'].includes(r.periodType),'EXTRACT_SCOPE_PERIOD');
    dateOnly(r.periodStart); dateOnly(r.periodEnd);
    requireFundamental(r.periodStart <= r.periodEnd && (r.periodType !== 'INSTANT' || r.periodStart === r.periodEnd),'EXTRACT_PERIOD_DATES');
  }
  return deepFreeze(x);
}

/** Lossless lexical conversion only: no imputation, locale detection, sign guessing or rounding. */
export function normalizeLexical(value: string | null, policy: {
  format: LexicalFormat; unit: string; sign: 'IDENTITY' | 'NEGATE_NONPOSITIVE'; missingTokens: readonly string[];
}): {value:string|null; state:'AVAILABLE'|'MISSING'|'INVALID'; code:string|null} {
  if (!['CANONICAL','VI','EN'].includes(policy.format) || !['IDENTITY','NEGATE_NONPOSITIVE'].includes(policy.sign) ||
    !Array.isArray(policy.missingTokens) || policy.missingTokens.some(t => typeof t !== 'string' || /[0-9]/.test(t))) {
    return {value:null,state:'INVALID',code:'INVALID_LEXICAL_POLICY'};
  }
  if (!DECLARED_UNITS[policy.unit]) return {value:null,state:'INVALID',code:'UNKNOWN_UNIT'};
  if (value === null || policy.missingTokens.includes(value)) return {value:null,state:'MISSING',code:'MISSING_VALUE'};
  if (typeof value !== 'string' || value.length > 4000) return {value:null,state:'INVALID',code:'INVALID_LEXICAL_VALUE'};
  const declared = DECLARED_UNITS[policy.unit];
  if (!declared) return {value:null,state:'INVALID',code:'UNKNOWN_UNIT'};
  let lexical = value.trim(), negative = false;
  if (lexical.endsWith('%')) {
    if (policy.unit !== 'PERCENT') return {value:null,state:'INVALID',code:'UNDECLARED_PERCENT'};
    lexical = lexical.slice(0,-1).trim();
  }
  if (/^\(.*\)$/.test(lexical)) {negative = true; lexical = lexical.slice(1,-1);}
  else if (lexical.startsWith('-')) {negative = true;lexical = lexical.slice(1);}
  const patterns = {CANONICAL:/^(0|[1-9]\d*)(?:\.\d+)?$/,EN:/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+)(?:\.\d+)?$/,
    VI:/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d+)?$/};
  if (!patterns[policy.format]?.test(lexical)) return {value:null,state:'INVALID',code:'LEXICAL_FORMAT_MISMATCH'};
  if (policy.format === 'EN') lexical = lexical.replaceAll(',','');
  if (policy.format === 'VI') lexical = lexical.replaceAll('.','').replace(',','.');
  try {
    let amount = decimal((negative ? '-' : '') + lexical);
    if (policy.sign === 'NEGATE_NONPOSITIVE') {
      if (amount.positive) return {value:null,state:'INVALID',code:'SOURCE_SIGN_MISMATCH'};
      amount = amount.neg();
    }
    const normalized = amount.mul(decimal(declared[1])).toString();
    decimal(normalized); // enforce the existing exact 30-digit / 12-decimal domain ceiling
    return {value:normalized,state:'AVAILABLE',code:null};
  } catch { return {value:null,state:'INVALID',code:'EXACT_DECIMAL_LIMIT'}; }
}
export function comparableKey(o: FundamentalObservation): string {
  return JSON.stringify([o.scope,o.securityId,o.itemId,o.reportingScope,o.segment,o.accountingBasis,o.periodStart,o.periodEnd,
    o.periodType,o.fiscalYear,o.fiscalQuarter,o.fiscalCalendarReference,o.normalized.unit,o.normalized.currency]);
}

function documentHash(o:FundamentalObservation) {return o.transformationReferences.find(r=>r.startsWith('document-sha256:'))?.slice('document-sha256:'.length);}

export function normalizeStatement(input: {id:string;scope:FundamentalObservation['scope'];recordedAt:string;
  candidate:QualifiedNormalizationCandidate;extract:StatementExtract;extractHash:string;mapping:MappingRelease;
  registry:RegistryRelease;prior:readonly FundamentalObservation[];hash:(value:unknown)=>string; legacyReplay?:boolean; deferLineage?:boolean}): NormalizationAssessment {
  const {candidate,registry} = input, q = candidate.qualification, raw = candidate.rawDocument;
  requireQualifiedDocument(raw,[{...q,supersedesQualificationId:null,correctionReason:null}],q.intendedIssuer);
  fundamentalId(input.id); instant(input.recordedAt); fundamentalHash(input.extractHash); fundamentalHash(input.mapping.hash);
  requireFundamental(['FORMAL','SYNTHETIC_TEST','REVIEW_CANDIDATE'].includes(input.scope),'NORMALIZATION_SCOPE');
  const x = validateStatementExtract(input.extract), m = validateStatementMapping(input.mapping.manifest,registry);
  requireFundamental(input.hash(x) === input.extractHash && input.hash(m) === input.mapping.hash,'NORMALIZATION_MANIFEST_HASH');
  requireFundamental(x.documentId === raw.documentId && x.bodyHash === raw.bodyHash && x.qualificationId === q.id &&
    m.sourceVersionId === raw.sourceVersionId && x.reviewedAt >= q.reviewedAt && input.recordedAt >= x.reviewedAt,'EXTRACT_QUALIFICATION_BINDING');
  requireFundamental(input.scope !== 'FORMAL' || (m.governanceStatus === 'APPROVED' && registry.manifest.governanceStatus === 'APPROVED'),'FORMAL_MAPPING_REGISTRY_APPROVAL_REQUIRED');
  const prior = input.prior.map(o => validateFundamentalObservation(o,registry));
  requireFundamental(new Set(prior.map(o=>o.id)).size === prior.length && prior.every(o => o.ingestedAt <= input.recordedAt),'NORMALIZATION_CONTEXT_AFTER_RUN');
  const observations: FundamentalObservation[] = [], findings: NormalizationFinding[] = [];
  const add = (rowId:string,code:string,severity:NormalizationFinding['severity']='BLOCKING',relatedObservationIds:readonly string[]=[]) => findings.push({rowId,code,severity,relatedObservationIds});
  for (const row of x.rows) {
    const f = m.fields.find(field => field.fieldId === row.fieldId);
    if (!row.revision && !input.legacyReplay) {add(row.id,'REVISION_SEMANTICS_UNRESOLVED');continue;}
    if (!f) {add(row.id,'UNKNOWN_FIELD_MAPPING');continue;}
    const item = registry.manifest.items.find(i => i.itemId === f.itemId)!;
    if (row.label !== f.label) {add(row.id,'MAPPING_LABEL_MISMATCH');continue;}
    if (row.reportingScope !== q.reportingScope) {add(row.id,'REPORTING_SCOPE_MISMATCH');continue;}
    const stock = item.measurementSemantic === 'STOCK';
    const period = q.period!;
    // A reviewed YTD document can contain a separately evidenced current-quarter column.
    // Preserve that column's declared dates/type; never subtract YTD values or infer dates.
    const nativeFlow = row.periodStart === period.start && row.periodType === period.type;
    const coveredQuarter = period.type === 'YTD' && row.periodType === 'QUARTER' && period.fiscalQuarter !== null &&
      row.periodStart >= period.start && row.periodStart <= period.end;
    if (row.periodEnd > raw.retrievedAt.slice(0,10) || row.periodEnd !== period.end || (stock ? row.periodType !== 'INSTANT' || row.periodStart !== period.end
      : !nativeFlow && !coveredQuarter)) {add(row.id,'REPORTING_PERIOD_MISMATCH');continue;}
    if (!item.sectorApplicability.includes(x.sector) || !item.allowedReportingScopes.includes(row.reportingScope)) {add(row.id,'ITEM_NOT_APPLICABLE');continue;}
    if (row.currency !== f.currency) {add(row.id,'SOURCE_CURRENCY_MISMATCH');continue;}
    let parsed = row.unit === f.unit ? normalizeLexical(row.lexicalValue,{...f}) : {value:null,state:'INVALID' as const,code:'SOURCE_UNIT_MISMATCH'};
    if (parsed.value !== null && item.signConvention === 'NONNEGATIVE' && decimal(parsed.value).negative) {
      parsed = {value:null,state:'INVALID',code:'ITEM_SIGN_CONVENTION'};
    }
    if (parsed.code) add(row.id,parsed.code,parsed.state === 'MISSING' ? 'MISSING' : 'BLOCKING');
    const declared = DECLARED_UNITS[f.unit];
    const o = {
      id:`${input.id}-${row.id}`,scope:input.scope,securityId:q.intendedIssuer.securityId,ticker:q.intendedIssuer.ticker,
      identifierReference:q.intendedIssuer.issuerReference,sourceVersionId:raw.sourceVersionId,rawCaptureId:raw.captureIds[0],
      itemId:item.itemId,registryVersion:registry.manifest.registryVersion,registryHash:registry.registryHash,itemDefinitionVersion:item.itemDefinitionVersion,
      statementType:item.statementType,measurementSemantic:item.measurementSemantic,sector:x.sector,reportingScope:row.reportingScope,segment:null,
      accountingBasis:x.accountingBasis,auditStatus:x.auditStatus,periodStart:row.periodStart,periodEnd:row.periodEnd,periodType:row.periodType,
      fiscalYear:period.fiscalYear,fiscalQuarter:period.fiscalQuarter,fiscalCalendarReference:period.calendarReference,
      reportDate:null,reportDateReference:null,publication:row.revision?.publication ?? {publishedAt:null,publicationDate:null,publicationPrecision:'UNKNOWN',publicationStatus:'UNKNOWN',timezone:null,evidenceReference:null},
      providerReceivedAt:null,providerReceiptReference:null,retrievedAt:raw.retrievedAt,ingestedAt:input.recordedAt,
      availability:{availableAt:null,status:'UNKNOWN',policyReference:null,mode:null,provenanceReferences:[]},
      raw:{fieldId:row.fieldId,label:row.sourceLabel,fieldLocator:row.locator,lexicalValue:row.lexicalValue,unit:row.unit,
        multiplier:row.unit === f.unit ? declared[1] : null,currency:row.currency},
      normalized:{value:parsed.value,unit:declared[0],currency:row.currency},mappingVersion:m.version,
      transformationReferences:[`document-sha256:${raw.bodyHash}`,`qualification:${q.id}`,`extract-sha256:${input.extractHash}`,
        `mapping-sha256:${input.mapping.hash}`,`normalization-run:${input.id}`,`declared-sign:${f.sign}`,row.unitLocator,row.periodLocator,row.definitionLocator,f.definitionReference],
      dataPresence:parsed.state === 'MISSING' ? 'MISSING' : 'AVAILABLE',quality:parsed.state === 'AVAILABLE' ? 'VALID' : parsed.state === 'MISSING' ? 'UNKNOWN' : 'INVALID',
      applicability:'APPLICABLE',applicabilityReference:null,scopeFallback:null,fxLineageReference:null,
      revisionKind:row.revision?.kind ?? 'ORIGINAL',recordVersion:row.revision?.recordVersion ?? '1',supersedesObservationId:row.revision?.predecessorId ?? null,revisionReason:row.revision?.reason ?? null,revisionEvidenceReference:row.revision?.kind === 'ORIGINAL' ? null : row.revision?.evidenceReference ?? null,correctionKnownAt:row.revision?.knownAt ?? null,ancestorReferences:[] as string[],
    } as FundamentalObservation & {publication:FundamentalObservation['publication'];transformationReferences:string[];ancestorReferences:string[]};
    if (row.revision) {
      const v=row.revision, old=prior.find(p=>p.id===v.predecessorId);
      o.transformationReferences = [...o.transformationReferences,`revision-evidence:${v.evidenceReference}`];
      if (v.kind !== 'ORIGINAL' && !input.deferLineage) {
        requireFundamental(old && comparableKey(old) === comparableKey(o) && old.id !== o.id && old.quality !== 'CONFLICTING' &&
          old.ingestedAt <= v.knownAt! && v.knownAt! <= x.reviewedAt && v.knownAt! <= input.recordedAt,'REVISION_PREDECESSOR_MISMATCH');
        if (v.kind === 'ISSUER_RESTATEMENT') requireFundamental(documentHash(old) !== undefined && raw.documentId !== documentHash(old) && v.publication !== null &&
          v.publication.evidenceReference !== null && v.publication.evidenceReference !== old.publication.evidenceReference &&
          v.publication.publicationStatus === 'VERIFIED' &&
          (v.publication.publishedAt !== null ? v.publication.publishedAt <= v.knownAt! : v.publication.publicationDate !== null && v.publication.publicationDate <= v.knownAt!.slice(0,10)),'RESTATEMENT_REQUIRES_OWN_DISCLOSURE');
        else o.publication = old.publication;
        if (v.kind === 'MAPPING_CORRECTION') {
          requireFundamental(old.mappingVersion !== m.version && v.predecessorMappingHash !== null &&
            old.transformationReferences.includes(`mapping-sha256:${v.predecessorMappingHash}`) && v.predecessorMappingHash !== input.mapping.hash,'MAPPING_CORRECTION_HASH_LINEAGE');
        } else requireFundamental(v.predecessorMappingHash === null,'NON_MAPPING_CORRECTION_HASH');
        const chain:string[]=[]; let current:FundamentalObservation|undefined=old;
        while(current) {
          requireFundamental(!chain.includes(current.id) && current.id !== o.id,'REVISION_CYCLE');
          requireFundamental(comparableKey(current) === comparableKey(o),'REVISION_CHAIN_IDENTITY'); chain.push(current.id);
          if (current.supersedesObservationId === null) break;
          current=prior.find(p=>p.id===current!.supersedesObservationId);
          requireFundamental(current !== undefined,'REVISION_CHAIN_INCOMPLETE');
        }
        o.ancestorReferences=chain;
      }
    }
    observations.push(validateFundamentalObservation(o,registry));
  }
  for (let i = 0; i < observations.length; i++) {
    const o = observations[i];
    const same = [...prior,...observations.filter((_,index) => index !== i)].filter(other => comparableKey(other) === comparableKey(o));
    const unrelated = same.filter(other => !o.ancestorReferences.includes(other.id));
    const conflicts = unrelated.filter(other => o.normalized.value !== null && other.normalized.value !== null && other.normalized.value !== o.normalized.value);
    const remapped = unrelated.filter(other => other.rawCaptureId === o.rawCaptureId && other.mappingVersion !== o.mappingVersion);
    if (remapped.length) add(x.rows.find(r => `${input.id}-${r.id}` === o.id)!.id,'MAPPING_CORRECTION_REQUIRES_EXPLICIT_REVISION','BLOCKING',remapped.map(c => c.id));
    if (conflicts.length) {
      add(x.rows.find(r => `${input.id}-${r.id}` === o.id)!.id,'VALUE_CONFLICT','BLOCKING',conflicts.map(c => c.id));
      observations[i] = validateFundamentalObservation({...o,quality:'CONFLICTING'},registry);
    }
  }
  return deepFreeze({...(input.legacyReplay ? {} : {revisionPolicyVersion:'explicit-lineage-v1' as const}),id:input.id,scope:input.scope,recordedAt:input.recordedAt,sourceVersionId:raw.sourceVersionId,importExecutionId:raw.importExecutionId,
    rawCaptureId:raw.captureIds[0],documentId:raw.documentId,bodyHash:raw.bodyHash,qualificationId:q.id,qualification:q,captureIds:raw.captureIds,
    extract:x,extractHash:input.extractHash,mapping:{manifest:m,hash:input.mapping.hash},registry,
    status:findings.some(f => f.severity === 'BLOCKING') ? 'BLOCKED' : findings.length ? 'PARTIAL' : 'VALIDATED',findings,observations,
    compared:prior.map(o => ({id:o.id,hash:input.hash(o)}))});
}
