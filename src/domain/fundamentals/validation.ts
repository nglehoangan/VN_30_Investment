import { ValidationError } from '@/shared/errors';
import { dateOnly, instant } from '@/shared/time';
import { decimal, securityId } from '@/domain/portfolio/values';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { snapshot } from '@/domain/scoring/validation';
import { METRICS } from '@/domain/scoring/metrics';
import { RUBRICS, SECTORS } from '@/domain/scoring/methodology';
import type { CanonicalItem, CanonicalRegistry, FundamentalSourceVersion, FundamentalRawCapture, FundamentalImportBatch, FundamentalObservation, RegistryRelease } from './contracts';

export function requireFundamental(value: unknown, reason: string): asserts value {
  if (!value) throw new ValidationError([{field:'fundamentals', reason, expected:'Slice 1 governed fundamental contract'}]);
}
function fields(value: object, names: string) {
  requireFundamental(value !== null && typeof value === 'object' && !Array.isArray(value), 'OBJECT_REQUIRED');
  const expected = names.split(' ').sort(), actual = Object.keys(value).sort();
  requireFundamental(JSON.stringify(actual) === JSON.stringify(expected), 'EXACT_FIELDS_REQUIRED');
}
function text(value: unknown): asserts value is string {
  requireFundamental(typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= 4000 && !/[\x00-\x1f<>]/.test(value), 'PLAIN_TEXT_REQUIRED');
}
export function fundamentalId(value: unknown): asserts value is string { requireFundamental(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value), 'IDENTIFIER_REQUIRED'); }
export function fundamentalHash(value: unknown): asserts value is string { requireFundamental(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), 'SHA256_REQUIRED'); }
function one(value: unknown, values: readonly unknown[]) { requireFundamental(values.includes(value), 'UNKNOWN_ENUM'); }
function refs(values: readonly string[], allowEmpty = true) {
  requireFundamental(Array.isArray(values) && values.length <= 1000 && (allowEmpty || values.length > 0), 'BOUNDED_REFERENCES_REQUIRED');
  values.forEach(text); requireFundamental(new Set(values).size === values.length, 'DUPLICATE_REFERENCE');
}
function nullableText(value: unknown) { if (value !== null) text(value); }
function safeReference(value: unknown) {
  text(value); requireFundamental(!/[?@#]/.test(value) && !/bearer\s|api[_-]?key\s*=|token\s*=/i.test(value), 'CREDENTIAL_FREE_REFERENCE_REQUIRED');
}
function timestamp(value: string) { try { instant(value); } catch { requireFundamental(false, 'INVALID_INSTANT'); } }
function day(value: string) { try { dateOnly(value); } catch { requireFundamental(false, 'INVALID_DATE'); } }

export function validateCanonicalRegistry(raw: unknown): CanonicalRegistry {
  const r = snapshot(raw) as CanonicalRegistry;
  fields(r, 'registryVersion methodologyIdentity crosswalkVersion governanceStatus approvalReference recordedAt effectiveDate authorityReferences items');
  [r.registryVersion,r.methodologyIdentity,r.crosswalkVersion].forEach(fundamentalId);
  one(r.governanceStatus,['PROPOSED','APPROVED']); nullableText(r.approvalReference);
  requireFundamental((r.governanceStatus === 'APPROVED') === (r.approvalReference !== null), 'REGISTRY_APPROVAL_METADATA');
  timestamp(r.recordedAt); day(r.effectiveDate); refs(r.authorityReferences,false);
  requireFundamental(Array.isArray(r.items) && r.items.length > 0 && r.items.length <= 1000, 'REGISTRY_ITEMS_REQUIRED');
  requireFundamental(new Set(r.items.map(i=>i.itemId)).size === r.items.length,'DUPLICATE_ITEM');
  for (const i of r.items as readonly CanonicalItem[]) {
    fields(i,'itemId name meaning statementType measurementSemantic allowedUnits currencyApplicability signConvention allowedReportingScopes sectorApplicability evidenceTopicMappings operandMappings itemDefinitionVersion methodologyIdentity authorityReferences status deprecatedFrom supersededBy');
    requireFundamental(/^[A-Z][A-Z0-9_]{0,63}$/.test(i.itemId),'CANONICAL_ITEM_ID_REQUIRED');
    [i.name,i.meaning].forEach(text); fundamentalId(i.itemDefinitionVersion);
    requireFundamental(i.methodologyIdentity === r.methodologyIdentity,'ITEM_METHOD_MISMATCH');
    one(i.statementType,['INCOME','BALANCE','CASH_FLOW','SUPPLEMENTARY']); one(i.measurementSemantic,['FLOW','STOCK','PER_SHARE','RATIO']);
    refs(i.allowedUnits,false); i.allowedUnits.forEach(u=>one(u,['CURRENCY','CURRENCY_PER_SHARE','SHARES','RATIO']));
    one(i.currencyApplicability,['REQUIRED','NONE']); one(i.signConvention,['SIGNED','NONNEGATIVE']);
    requireFundamental(i.allowedUnits.every(u=>(u==='CURRENCY'||u==='CURRENCY_PER_SHARE') === (i.currencyApplicability==='REQUIRED')),'UNIT_CURRENCY_MISMATCH');
    requireFundamental(i.measurementSemantic!=='RATIO'||i.allowedUnits.every(u=>u==='RATIO'),'RATIO_UNIT_REQUIRED');
    requireFundamental(i.measurementSemantic!=='PER_SHARE'||i.allowedUnits.every(u=>u==='CURRENCY_PER_SHARE'),'PER_SHARE_UNIT_REQUIRED');
    refs(i.allowedReportingScopes,false); i.allowedReportingScopes.forEach(s=>one(s,['CONSOLIDATED','SEPARATE_STANDALONE']));
    refs(i.sectorApplicability,false); i.sectorApplicability.forEach(s=>one(s,SECTORS)); refs(i.authorityReferences,false);
    requireFundamental(Array.isArray(i.evidenceTopicMappings)&&i.evidenceTopicMappings.length<=100,'TOPIC_MAPPINGS_REQUIRED');
    for (const m of i.evidenceTopicMappings as CanonicalItem['evidenceTopicMappings']) {
      fields(m,'documentMetricId rubricId topic requirement'); Object.values(m).forEach(text);
      requireFundamental(RUBRICS.some(r=>r.id===m.rubricId && r.topics.includes(m.topic)),'UNKNOWN_RUBRIC_TOPIC');
    }
    requireFundamental(Array.isArray(i.operandMappings)&&i.operandMappings.length<=100,'OPERAND_MAPPINGS_REQUIRED');
    for (const m of i.operandMappings as CanonicalItem['operandMappings']) {
      fields(m,'metricId position operand requirement'); text(m.requirement); one(m.position,[0,1]);
      requireFundamental(Object.hasOwn(METRICS,m.metricId) && METRICS[m.metricId][m.position]===m.operand,'UNKNOWN_OR_WRONG_OPERAND');
    }
    one(i.status,['ACTIVE','DEPRECATED']); nullableText(i.deprecatedFrom); nullableText(i.supersededBy);
    requireFundamental((i.status==='DEPRECATED') === (i.deprecatedFrom!==null),'DEPRECATION_METADATA');
    if(i.deprecatedFrom!==null)day(i.deprecatedFrom);
    if(i.supersededBy!==null) requireFundamental(i.supersededBy!==i.itemId && r.items.some(other=>other.itemId===i.supersededBy),'INVALID_SUPERSESSION');
  }
  return deepFreeze(r);
}
export function validateFundamentalSource(raw: FundamentalSourceVersion) {
  const s = snapshot(raw); fields(s,'id provider documentationReference termsReference adapterVersion schemaVersion coverageLimitations temporalLimitations recordedAt');
  fundamentalId(s.id); [s.provider,s.adapterVersion,s.schemaVersion].forEach(text);
  [s.documentationReference,s.termsReference].forEach(safeReference); refs(s.coverageLimitations); refs(s.temporalLimitations); timestamp(s.recordedAt);
  return deepFreeze(s);
}
export function validateFundamentalCapture(raw: FundamentalRawCapture) {
  const c=snapshot(raw); fields(c,'id sourceVersionId importExecutionId requestFingerprint resourceReference sourceRecordId sourceRecordVersion retrievedAt mediaType responseStatus payload payloadHash');
  [c.id,c.sourceVersionId,c.importExecutionId].forEach(fundamentalId); fundamentalHash(c.requestFingerprint); safeReference(c.resourceReference);
  nullableText(c.sourceRecordId);nullableText(c.sourceRecordVersion);timestamp(c.retrievedAt);text(c.mediaType);
  requireFundamental(Number.isInteger(c.responseStatus)&&c.responseStatus>=100&&c.responseStatus<=599,'HTTP_STATUS_REQUIRED');
  requireFundamental(typeof c.payload==='string'&&c.payload.length<=4_000_000,'BOUNDED_RAW_PAYLOAD');fundamentalHash(c.payloadHash);
  return deepFreeze(c);
}
export function validateFundamentalBatch(raw: FundamentalImportBatch) {
  const b=snapshot(raw);fields(b,'id sourceVersionId requestFingerprint startedAt completedAt ingestedAt completion captureIds errors');
  [b.id,b.sourceVersionId].forEach(fundamentalId);fundamentalHash(b.requestFingerprint);
  [b.startedAt,b.completedAt,b.ingestedAt].forEach(timestamp);
  requireFundamental(b.startedAt<=b.completedAt&&b.completedAt<=b.ingestedAt,'INVALID_BATCH_CHRONOLOGY');
  one(b.completion,['COMPLETE','PARTIAL','FAILED']);refs(b.captureIds);b.captureIds.forEach(fundamentalId);refs(b.errors);
  requireFundamental(b.completion!=='COMPLETE'||(b.captureIds.length>0 && b.errors.length===0),'INCOMPLETE_IMPORT_CANNOT_CLAIM_COMPLETE');
  return deepFreeze(b);
}
export function validateFundamentalObservation(raw: FundamentalObservation, release: RegistryRelease) {
  const o=snapshot(raw);
  fields(o,'id scope securityId ticker identifierReference sourceVersionId rawCaptureId itemId registryVersion registryHash itemDefinitionVersion statementType measurementSemantic sector reportingScope segment accountingBasis auditStatus periodStart periodEnd periodType fiscalYear fiscalQuarter fiscalCalendarReference reportDate reportDateReference publication providerReceivedAt providerReceiptReference retrievedAt ingestedAt availability raw normalized mappingVersion transformationReferences dataPresence quality applicability applicabilityReference scopeFallback fxLineageReference revisionKind recordVersion supersedesObservationId revisionReason revisionEvidenceReference correctionKnownAt ancestorReferences');
  [o.id,o.sourceVersionId,o.rawCaptureId,o.mappingVersion,o.recordVersion].forEach(fundamentalId);securityId(o.securityId);
  requireFundamental(typeof o.ticker==='string'&&/^[A-Z0-9]{1,20}$/.test(o.ticker),'INVALID_TICKER');safeReference(o.identifierReference);
  one(o.scope,['FORMAL','SYNTHETIC_TEST','REVIEW_CANDIDATE']);
  requireFundamental(o.scope!=='FORMAL'||release.manifest.governanceStatus==='APPROVED','PROPOSED_REGISTRY_NOT_FOR_PRODUCTION');
  requireFundamental(o.registryHash===release.registryHash&&o.registryVersion===release.manifest.registryVersion,'REGISTRY_IDENTITY_MISMATCH');
  const item=release.manifest.items.find(i=>i.itemId===o.itemId);requireFundamental(item&&item.status==='ACTIVE','UNAPPROVED_CANONICAL_ITEM');
  requireFundamental(o.itemDefinitionVersion===item.itemDefinitionVersion&&o.statementType===item.statementType&&o.measurementSemantic===item.measurementSemantic,'ITEM_SEMANTIC_MISMATCH');
  requireFundamental(item.sectorApplicability.includes(o.sector)&&item.allowedReportingScopes.includes(o.reportingScope),'ITEM_SECTOR_OR_SCOPE_MISMATCH');
  nullableText(o.segment);text(o.accountingBasis);one(o.auditStatus,['AUDITED','REVIEWED','UNAUDITED','UNKNOWN']);
  [o.periodStart,o.periodEnd].forEach(day);requireFundamental(o.periodStart<=o.periodEnd,'INVALID_PERIOD_ORDER');
  one(o.periodType,['QUARTER','YTD','ANNUAL','INSTANT']);
  requireFundamental((item.measurementSemantic==='STOCK')===(o.periodType==='INSTANT'),'FLOW_STOCK_PERIOD_MISMATCH');
  if(o.periodType==='INSTANT')requireFundamental(o.periodStart===o.periodEnd,'STOCK_REQUIRES_SINGLE_DATE');
  requireFundamental(Number.isInteger(o.fiscalYear)&&o.fiscalYear>=1900&&o.fiscalYear<=9999,'INVALID_FISCAL_YEAR');
  one(o.fiscalQuarter,[null,1,2,3,4]);requireFundamental(!['QUARTER','YTD'].includes(o.periodType)||o.fiscalQuarter!==null,'QUARTER_REQUIRED');
  requireFundamental(o.periodType!=='ANNUAL'||o.fiscalQuarter===null,'ANNUAL_HAS_NO_QUARTER');text(o.fiscalCalendarReference);
  nullableText(o.reportDateReference); if(o.reportDate!==null){day(o.reportDate);requireFundamental(o.reportDateReference!==null&&o.reportDate>=o.periodEnd,'REPORT_DATE_PROVENANCE_REQUIRED');}
  else requireFundamental(o.reportDateReference===null,'REPORT_DATE_REFERENCE_WITHOUT_DATE');
  fields(o.publication,'publishedAt publicationDate publicationPrecision publicationStatus timezone evidenceReference');
  const p=o.publication;one(p.publicationPrecision,['TIMESTAMP','DATE_ONLY','UNKNOWN']);one(p.publicationStatus,['VERIFIED','UNKNOWN']);nullableText(p.timezone);nullableText(p.evidenceReference);
  requireFundamental((p.publicationStatus==='UNKNOWN')===(p.publicationPrecision==='UNKNOWN'),'PUBLICATION_STATUS_PRECISION_MISMATCH');
  if(p.publicationPrecision==='UNKNOWN')requireFundamental(p.publishedAt===null&&p.publicationDate===null&&p.timezone===null&&p.evidenceReference===null,'UNKNOWN_PUBLICATION_HAS_NO_CANONICAL_DATE');
  else {
    requireFundamental(p.evidenceReference!==null&&p.timezone!==null,'PUBLICATION_PROOF_REQUIRED');
    if(p.publicationPrecision==='TIMESTAMP'){requireFundamental(p.publishedAt!==null&&p.publicationDate===null&&p.timezone==='UTC','TIMESTAMP_PUBLICATION_REQUIRED');timestamp(p.publishedAt);requireFundamental(p.publishedAt.slice(0,10)>=o.periodEnd,'PUBLICATION_BEFORE_PERIOD_END');}
    else {requireFundamental(p.publicationDate!==null&&p.publishedAt===null,'DATE_ONLY_NOT_INSTANT');day(p.publicationDate);requireFundamental(p.publicationDate>=o.periodEnd,'PUBLICATION_BEFORE_PERIOD_END');}
  }
  [o.retrievedAt,o.ingestedAt].forEach(timestamp);requireFundamental(o.retrievedAt<=o.ingestedAt,'RECEIPT_AFTER_INGESTION');
  if(p.publishedAt!==null)requireFundamental(p.publishedAt<=o.retrievedAt,'PUBLICATION_AFTER_RECEIPT');
  nullableText(o.providerReceiptReference);
  if(o.providerReceivedAt!==null){timestamp(o.providerReceivedAt);requireFundamental(o.providerReceiptReference!==null&&o.providerReceivedAt<=o.retrievedAt&&(!p.publishedAt||p.publishedAt<=o.providerReceivedAt),'INVALID_PROVIDER_RECEIPT');}
  else requireFundamental(o.providerReceiptReference===null,'PROVIDER_RECEIPT_WITHOUT_TIME');
  fields(o.availability,'availableAt status policyReference mode provenanceReferences');
  requireFundamental(o.availability.availableAt===null&&o.availability.status==='UNKNOWN','SLICE1_CANNOT_ASSERT_AVAILABILITY');
  nullableText(o.availability.policyReference);one(o.availability.mode,[null,'AS_KNOWN','AS_REVISED']);refs(o.availability.provenanceReferences);
  fields(o.raw,'fieldId label fieldLocator lexicalValue unit multiplier currency');
  [o.raw.fieldId,o.raw.label,o.raw.fieldLocator,o.raw.unit].forEach(text);
  requireFundamental(o.raw.lexicalValue===null||typeof o.raw.lexicalValue==='string'&&o.raw.lexicalValue.length<=4000,'RAW_LEXICAL_VALUE_REQUIRED');
  if(o.raw.multiplier!==null)requireFundamental(decimal(o.raw.multiplier).positive,'POSITIVE_DECLARED_MULTIPLIER');
  fields(o.normalized,'value unit currency');requireFundamental(item.allowedUnits.includes(o.normalized.unit),'UNIT_NOT_ALLOWED');
  for(const c of [o.raw.currency,o.normalized.currency])requireFundamental(item.currencyApplicability==='REQUIRED'?typeof c==='string'&&/^[A-Z]{3}$/.test(c):c===null,'CURRENCY_REQUIRED_OR_NOT_APPLICABLE');
  requireFundamental(o.raw.currency===o.normalized.currency&&o.fxLineageReference===null,'NO_FX_IN_SLICE1');
  one(o.dataPresence,['AVAILABLE','MISSING','SOURCE_UNAVAILABLE']);one(o.quality,['VALID','WARNING','INVALID','CONFLICTING','UNKNOWN']);one(o.applicability,['APPLICABLE','NOT_APPLICABLE','UNRESOLVED']);nullableText(o.applicabilityReference);
  requireFundamental(o.applicability==='APPLICABLE'||o.applicabilityReference!==null,'APPLICABILITY_REASON_REQUIRED');
  if(o.normalized.value!==null){
    const units:Readonly<Record<string,readonly [string,string]>>={CURRENCY:['CURRENCY','1'],THOUSAND_CURRENCY:['CURRENCY','1000'],MILLION_CURRENCY:['CURRENCY','1000000'],BILLION_CURRENCY:['CURRENCY','1000000000'],CURRENCY_PER_SHARE:['CURRENCY_PER_SHARE','1'],SHARES:['SHARES','1'],THOUSAND_SHARES:['SHARES','1000'],RATIO:['RATIO','1'],PERCENT:['RATIO','0.01']};
    const declared=units[o.raw.unit];
    requireFundamental(declared&&declared[0]===o.normalized.unit&&declared[1]===o.raw.multiplier,'UNKNOWN_OR_INCOMPATIBLE_RAW_UNIT_SCALE');
  }
  if(o.normalized.value!==null){const value=decimal(o.normalized.value);requireFundamental(value.toString()===o.normalized.value,'CANONICAL_DECIMAL_REQUIRED');requireFundamental(item.signConvention!=='NONNEGATIVE'||!value.negative,'ITEM_SIGN_CONVENTION');requireFundamental(o.dataPresence==='AVAILABLE'&&o.raw.lexicalValue!==null&&o.raw.multiplier!==null,'VALUE_WITHOUT_SOURCE');}
  requireFundamental(o.dataPresence==='AVAILABLE'||o.normalized.value===null,'MISSING_IS_NOT_ZERO');
  requireFundamental(o.quality!=='VALID'||(o.dataPresence==='AVAILABLE'&&o.normalized.value!==null&&o.applicability==='APPLICABLE'),'VALID_REQUIRES_VALUE');
  refs(o.transformationReferences);refs(o.ancestorReferences);
  if(o.scopeFallback!==null){requireFundamental(o.scope==='SYNTHETIC_TEST','FORMAL_FALLBACK_ROUTE_NOT_IMPLEMENTED');fields(o.scopeFallback,'requestedScope approvalReference rationale');one(o.scopeFallback.requestedScope,['CONSOLIDATED','SEPARATE_STANDALONE']);text(o.scopeFallback.approvalReference);text(o.scopeFallback.rationale);requireFundamental(o.scopeFallback.requestedScope!==o.reportingScope&&o.quality!=='VALID','FALLBACK_MUST_RETAIN_QUALITY_LIMITATION');}
  one(o.revisionKind,['ORIGINAL','ISSUER_RESTATEMENT','PROVIDER_CORRECTION','MAPPING_CORRECTION']);
  [o.revisionReason,o.revisionEvidenceReference].forEach(nullableText);
  if(o.revisionKind==='ORIGINAL') requireFundamental(o.supersedesObservationId===null&&o.revisionReason===null&&o.revisionEvidenceReference===null&&o.correctionKnownAt===null,'ORIGINAL_HAS_NO_CORRECTION');
  else {fundamentalId(o.supersedesObservationId);requireFundamental(o.supersedesObservationId!==o.id&&o.revisionReason!==null&&o.revisionEvidenceReference!==null&&o.correctionKnownAt!==null,'REVISION_LINEAGE_REQUIRED');timestamp(o.correctionKnownAt);requireFundamental(o.correctionKnownAt<=o.ingestedAt,'FUTURE_CORRECTION_KNOWLEDGE');}
  return deepFreeze(o);
}
