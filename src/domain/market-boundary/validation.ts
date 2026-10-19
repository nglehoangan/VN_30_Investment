import { canonicalJson } from '@/domain/fundamentals/snapshot';
import { deepFreeze } from '@/domain/portfolio/transaction';
import { instant, dateOnly } from '@/shared/time';
import { AMENDMENT, VERSIONS, type Digest, type Evidence, type Kind, type Pin, type Sealed, type Bodies, type Initialization } from './contracts';
export function requireBoundary(ok: unknown, reason: string): asserts ok { if (!ok) throw new Error('MARKET_BOUNDARY:' + reason); }
export const nonempty = (s: unknown): s is string => typeof s === 'string' && s.trim().length > 0;
export function pin(p: Pin) { requireBoundary(p && nonempty(p.id) && /^[a-f0-9]{64}$/.test(p.hash), 'INVALID_PIN'); }
export function evidence(p: Evidence, knownAt: string) { pin(p); instant(p.knownAt); instant(p.effectiveAt); requireBoundary(p.knownAt <= knownAt && p.effectiveAt <= knownAt, 'PIT_EVIDENCE_UNAVAILABLE'); }
export const same = (a: unknown, b: unknown) => canonicalJson(a) === canonicalJson(b);
export const reference = (s: Sealed): Pin => ({ id: s.id, hash: s.contentHash });
export function partition(b: Initialization) {
  requireBoundary(b.members.length === 30 && new Set(b.members.map(m => m.securityId)).size === 30 && new Set(b.members.map(m => m.ticker)).size === 30, 'FULL30_IDENTITY');
  for (const m of b.members) requireBoundary(nonempty(m.securityId) && nonempty(m.ticker) && nonempty(m.exchange) && ['SCORABLE', 'DEFERRED'].includes(m.state), 'IDENTITY_AMBIGUOUS');
  requireBoundary(b.members.filter(m => m.state === 'SCORABLE').length === 29 && b.members.filter(m => m.state === 'DEFERRED').length === 1 && b.members.find(m => m.ticker === 'MBB')?.state === 'DEFERRED', 'POLICY_B_29_1');
  const tcx = b.members.find(m => m.ticker === 'TCX');
  requireBoundary(tcx && b.exceptions.some(e => e.securityId === tcx.securityId && e.status === 'ACTIVE' && e.classification === 'OWNER_ANALYTICAL_EXCEPTION' && e.amountVnd === '5284485167173'), 'TCX_EXCEPTION_REQUIRED');
  requireBoundary(new Set(b.exceptions.map(e => e.id)).size === b.exceptions.length, 'DUPLICATE_EXCEPTION');
}
/** Version dispatch and content hash are checked on every new reader. Legacy readers remain separate. */
export function readSealed<K extends Kind>(raw: unknown, kind: K, hash: Digest): Sealed<K> {
  requireBoundary(raw && typeof raw === 'object', 'INVALID_ENVELOPE');
  const r = raw as Sealed<K>;
  requireBoundary(r.kind === kind && r.contractVersion === VERSIONS[kind] && r.amendment === AMENDMENT, 'UNSUPPORTED_VERSION');
  requireBoundary(nonempty(r.id), 'ID_REQUIRED'); instant(r.createdAt); instant(r.knownAt);
  requireBoundary(r.knownAt <= r.createdAt, 'FUTURE_KNOWLEDGE');
  const { contentHash, ...payload } = r;
  requireBoundary(Object.keys(r).sort().join(',') === 'amendment,body,contentHash,contractVersion,createdAt,id,kind,knownAt', 'ENVELOPE_FIELDS');
  requireBoundary(hash(payload) === contentHash, 'CONTENT_HASH_MISMATCH');
  validateBody(r as Sealed);
  return deepFreeze(JSON.parse(canonicalJson(r))) as Sealed<K>;
}
export function seal<K extends Kind>(kind: K, id: string, createdAt: string, knownAt: string, body: Bodies[K], hash: Digest): Sealed<K> {
  const payload = { id, kind, contractVersion: VERSIONS[kind], amendment: AMENDMENT, createdAt, knownAt, body };
  return readSealed({ ...payload, contentHash: hash(payload) }, kind, hash);
}
function validateBody(r: Sealed) {
  const fields:Record<Kind,string>={
    INITIALIZATION:'universe members securityMaster sectorMaster fundamentals qualifications dispositions partition exceptions provenanceContract capability dataClassPolicy softwareVersion schemaVersion',
    CAPABILITY:'sourceContract sourceId sourceSchema normalizerVersion identityVersion semanticsVersion corporateActionPolicy freshnessPolicy calendar rawSamples normalizedSampleHash negativeValidation missingBehavior duplicateBehavior',
    MARKET:'capability universe requestedAsOf purpose acceptedTradingDate session observations sources normalizationVersion freshnessPolicy calendar',
    ANALYSIS:'initialization fundamentals universe market marketRequirement purpose analysisTimestamp members exceptions sourceHashes inputArtifacts freshness policy scoringModel engineVersion prerequisiteProof',
    PORTFOLIO:'portfolioSnapshotId portfolioAsOf ledgerWatermark cash positionsHash costBasisHash pendingTransactionsHash navInputs accountingVersion',
    DECISION:'decisionId decisionTimestamp securityId universe initialization fundamentals market analysis portfolio policy scoringModel engineVersion sourceHashes freshness disposition exceptions decisionState eligibilityProof executionEligibility dependenciesHash',
  };
  requireBoundary(r.body&&Object.keys(r.body).sort().join(' ')===fields[r.kind].split(' ').sort().join(' '),'BODY_FIELDS');
  switch (r.kind) {
    case 'INITIALIZATION': {
      const b = r.body; partition(b);
      [b.universe,b.securityMaster,b.sectorMaster,b.fundamentals,b.qualifications,b.dispositions,b.partition,b.provenanceContract,b.dataClassPolicy,...b.exceptions].forEach(p => evidence(p,r.knownAt));
      pin(b.capability); requireBoundary(nonempty(b.softwareVersion) && nonempty(b.schemaVersion), 'SOFTWARE_SCHEMA_REQUIRED'); break;
    }
    case 'CAPABILITY': {
      const b = r.body;
      [b.sourceContract,b.corporateActionPolicy,b.freshnessPolicy,b.calendar,b.negativeValidation].forEach(p => evidence(p,r.knownAt));
      requireBoundary([b.sourceId,b.sourceSchema,b.normalizerVersion,b.identityVersion,b.semanticsVersion].every(nonempty), 'CAPABILITY_SEMANTICS_REQUIRED');
      requireBoundary(b.rawSamples.length > 0 && b.rawSamples.every(s => s.origin === 'REAL_SOURCE'), 'REAL_SOURCE_REQUIRED');
      requireBoundary(b.missingBehavior === 'BLOCK' && b.duplicateBehavior === 'BLOCK_CONFLICT' && /^[a-f0-9]{64}$/.test(b.normalizedSampleHash), 'NEGATIVE_CASE_CONTRACT');
      for (const s of b.rawSamples) { pin(s); evidence(s.request,r.knownAt); instant(s.retrievedAt); requireBoundary(s.sourceId === b.sourceId && s.schemaVersion === b.sourceSchema && nonempty(s.rawPath) && s.retrievedAt <= r.knownAt, 'RAW_SOURCE_LINEAGE'); if(s.providerAt) { instant(s.providerAt); requireBoundary(s.providerAt <= s.retrievedAt,'FUTURE_PROVIDER'); } }
      break;
    }
    case 'MARKET': {
      const b = r.body; pin(b.capability); [b.universe,b.freshnessPolicy,b.calendar].forEach(p=>evidence(p,r.knownAt)); instant(b.requestedAsOf); dateOnly(b.acceptedTradingDate);
      requireBoundary(b.requestedAsOf <= r.createdAt && nonempty(b.session) && nonempty(b.normalizationVersion) && b.observations.length > 0 && b.sources.length > 0, 'MARKET_METADATA');
      requireBoundary(new Set(b.sources.map(s=>s.id)).size===b.sources.length,'DUPLICATE_SOURCE');
      for(const s of b.sources) { pin(s); evidence(s.request,r.knownAt); instant(s.retrievedAt); requireBoundary(s.origin==='REAL_SOURCE' && s.retrievedAt<=r.knownAt && nonempty(s.schemaVersion) && nonempty(s.rawPath),'RAW_SOURCE_REQUIRED');if(s.providerAt){instant(s.providerAt);requireBoundary(s.providerAt<=s.retrievedAt,'FUTURE_PROVIDER');} }
      const identities = new Set<string>();
      for(const o of b.observations) {
        pin(o.source); evidence(o.corporateActions,r.knownAt); instant(o.observedAt); instant(o.availableAt); dateOnly(o.tradingDate);
        requireBoundary(nonempty(o.securityId)&&nonempty(o.ticker)&&nonempty(o.exchange),'IDENTITY_AMBIGUOUS');
        requireBoundary(/^\d+(\.\d+)?$/.test(o.value)&&/[1-9]/.test(o.value)&&o.currency==='VND'&&o.unit==='VND_PER_SHARE','PRICE_UNIT_CURRENCY');
        requireBoundary(['CLOSE','LAST','REFERENCE'].includes(o.field)&&['RAW','ADJUSTED'].includes(o.adjustment),'PRICE_SEMANTICS');
        requireBoundary(o.conflict==='MATCH','UNRESOLVED_SOURCE_CONFLICT');
        requireBoundary(o.tradingDate===b.acceptedTradingDate&&o.session===b.session&&o.observedAt<=b.requestedAsOf&&o.availableAt<=r.knownAt&&o.observedAt<=o.availableAt,'OBSERVATION_TIME');
        requireBoundary(b.sources.some(s=>same(referenceSource(s),o.source))&&o.pointer.startsWith('/'),'OBSERVATION_LINEAGE');
        const source=b.sources.find(s=>same(referenceSource(s),o.source))!;requireBoundary(o.availableAt<=source.retrievedAt,'SOURCE_TIME_LINEAGE');
        const key=[o.securityId,o.field,o.adjustment].join('|'); requireBoundary(!identities.has(key),'DUPLICATE_CONFLICT'); identities.add(key);
      } break;
    }
    case 'ANALYSIS': {
      const b = r.body; pin(b.initialization); [b.fundamentals,b.universe,b.policy,b.scoringModel,b.prerequisiteProof,...b.exceptions].forEach(p=>evidence(p,r.knownAt));
      instant(b.analysisTimestamp); requireBoundary(b.analysisTimestamp<=r.createdAt&&nonempty(b.engineVersion),'ANALYSIS_METADATA');
      requireBoundary(b.marketRequirement==='REQUIRED' ? b.market!==null && b.purpose!=='FUNDAMENTAL_DESCRIPTION' && b.freshness.status==='PASS' : b.marketRequirement==='MARKET_DATA_NOT_REQUIRED' && b.purpose==='FUNDAMENTAL_DESCRIPTION' && b.market===null,'PURPOSE_SPECIFIC_MARKET_REQUIREMENT');
      if(b.market)pin(b.market); b.sourceHashes.forEach(pin);b.inputArtifacts.forEach(pin); break;
    }
    case 'PORTFOLIO': {
      const b=r.body; instant(b.portfolioAsOf); requireBoundary(b.portfolioAsOf<=r.knownAt&&[b.portfolioSnapshotId,b.ledgerWatermark,b.accountingVersion].every(nonempty),'PORTFOLIO_IDENTITY');
      requireBoundary(/^-?\d+(\.\d+)?$/.test(b.cash)&&[b.positionsHash,b.costBasisHash,b.pendingTransactionsHash].every(h=>/^[a-f0-9]{64}$/.test(h)),'PORTFOLIO_CONTENT'); b.navInputs.forEach(pin); break;
    }
    case 'DECISION': {
      const b=r.body; [b.initialization,b.market,b.analysis,b.portfolio,...b.sourceHashes].forEach(pin);
      [b.universe,b.fundamentals,b.policy,b.scoringModel,b.disposition,b.eligibilityProof,...b.exceptions].forEach(p=>evidence(p,r.knownAt));
      instant(b.decisionTimestamp); requireBoundary(b.decisionTimestamp===r.createdAt&&[b.decisionId,b.securityId,b.engineVersion,b.decisionState].every(nonempty),'DECISION_METADATA');
      requireBoundary(b.freshness.status==='PASS'&&same(b.freshness.market,b.market)&&b.freshness.at===b.decisionTimestamp&&/^[a-f0-9]{64}$/.test(b.dependenciesHash),'DECISION_GATE_REQUIRED');
      requireBoundary(['PASS','BLOCKED'].includes(b.executionEligibility),'EXECUTION_ELIGIBILITY'); break;
    }
  }
}
const referenceSource = (s: Pin) => ({id:s.id,hash:s.hash});
