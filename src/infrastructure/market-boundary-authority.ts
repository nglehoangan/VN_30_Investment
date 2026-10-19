import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import type { BoundaryAuthority } from '@/ports/market-boundary';
import type { Consumption, Evidence, Pin, Sealed, SessionPolicy, RawSource, Observation } from '@/domain/market-boundary/contracts';
import { requireBoundary, same } from '@/domain/market-boundary/validation';
import { instant, dateOnly } from '@/shared/time';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
export interface QualifiedMarketAdapter {
  readonly sourceId: string; readonly schemaVersion: string; readonly normalizerVersion: string;
  readonly identityVersion: string; readonly semanticsVersion: string;
  readonly identities: readonly {readonly securityId:string;readonly ticker:string;readonly exchange:string;readonly from:string;readonly to:string|null;readonly knownAt:string}[];
  readonly field: Observation['field']; readonly adjustment: Observation['adjustment'];
  /** Must validate provider schema, identity mapping and declared units/adjustments. No source IO. */
  normalize(raw: Uint8Array, source: RawSource): readonly Observation[];
}
export interface BoundaryBindings {
  readonly approvals: readonly Evidence[]; readonly policies: readonly SessionPolicy[];
  readonly adapters: readonly QualifiedMarketAdapter[];
  readonly marketCurrent: (m: Sealed<'MARKET'>, r: Consumption) => Promise<void>;
  readonly initializationCurrent: (i: Sealed<'INITIALIZATION'>, r: Consumption) => Promise<void>;
  readonly portfolioCurrent: (p: Sealed<'PORTFOLIO'>, at: string) => Promise<void>;
  readonly prerequisite: (proof: Evidence, r: Consumption) => Promise<void>;
  readonly currentDependencies: () => Promise<Pin>;
}
/** Authority pins are configured at trusted composition, never read from a submitted snapshot. */
export class RetainedMarketAuthority implements BoundaryAuthority {
  readonly hash = snapshotHash;
  constructor(private readonly rawRoot: string, private readonly bindings: BoundaryBindings) {}
  async approve(e: Evidence, knownAt: string) {
    requireBoundary(e.knownAt<=knownAt&&e.effectiveAt<=knownAt&&this.bindings.approvals.some(a=>same(a,e)),'INDEPENDENT_APPROVAL_REQUIRED:'+e.id);
  }
  private adapter(sourceId: string, schema: string, version: string) {
    const adapters=this.bindings.adapters.filter(a=>a.sourceId===sourceId&&a.schemaVersion===schema&&a.normalizerVersion===version);
    requireBoundary(adapters.length===1,'NO_QUALIFIED_REAL_SOURCE_ADAPTER');return adapters[0];
  }
  private async raw(source: RawSource) {
    requireBoundary(source.origin==='REAL_SOURCE','MOCK_CANNOT_CERTIFY');
    const root=await realpath(this.rawRoot),path=await realpath(resolve(root,source.rawPath));
    requireBoundary(path.startsWith(root+sep),'RAW_PATH_ESCAPE');
    const bytes=await readFile(path);requireBoundary(bytes.length>0&&bytes.length<=4_000_000,'RAW_SIZE_LIMIT');
    requireBoundary(createHash('sha256').update(bytes).digest('hex')===source.hash,'RAW_HASH_MISMATCH');return bytes;
  }
  async replayCapability(c: Sealed<'CAPABILITY'>) {
    const b=c.body;for(const e of [b.sourceContract,b.corporateActionPolicy,b.freshnessPolicy,b.calendar,b.negativeValidation])await this.approve(e,c.knownAt);
    const adapter=this.adapter(b.sourceId,b.sourceSchema,b.normalizerVersion),rows:Observation[]=[];
    requireBoundary(b.rawSamples.length>0,'REAL_SOURCE_NOT_AVAILABLE');
    for(const source of b.rawSamples){await this.approve(source.request,c.knownAt);rows.push(...adapter.normalize(await this.raw(source),source));}
    requireBoundary(adapter.identityVersion===b.identityVersion&&adapter.semanticsVersion===b.semanticsVersion,'IDENTITY_SEMANTICS_VERSION');
    this.validateRows(rows,adapter,b.rawSamples,c.knownAt,b.corporateActionPolicy);
    requireBoundary(rows.length>0&&snapshotHash(rows)===b.normalizedSampleHash,'NORMALIZATION_REPLAY_MISMATCH');
  }
  async replayMarket(m: Sealed<'MARKET'>) {
    const b=m.body,rows:Observation[]=[];
    for(const source of b.sources){await this.approve(source.request,m.knownAt);const adapter=this.adapter(source.sourceId,source.schemaVersion,b.normalizationVersion),normalized=adapter.normalize(await this.raw(source),source);this.validateRows(normalized,adapter,[source],m.knownAt);rows.push(...normalized);}
    requireBoundary(same(rows,b.observations),'MARKET_RAW_REPLAY_MISMATCH');
  }
  private validateRows(rows:readonly Observation[], adapter:QualifiedMarketAdapter,sources:readonly RawSource[],knownAt:string,actions?:Evidence) {
    const seen=new Set<string>();requireBoundary(rows.length>0,'MISSING_NORMALIZED_OBSERVATIONS');
    for(const o of rows){
      instant(o.observedAt);instant(o.availableAt);dateOnly(o.tradingDate);
      const identity=adapter.identities.filter(i=>i.securityId===o.securityId&&i.ticker===o.ticker&&i.exchange===o.exchange&&i.from<=o.tradingDate&&(i.to===null||o.tradingDate<i.to)&&i.knownAt<=knownAt);
      requireBoundary(identity.length===1,'WRONG_SECURITY_IDENTITY');
      requireBoundary(o.currency==='VND'&&o.unit==='VND_PER_SHARE'&&/^\d+(\.\d+)?$/.test(o.value)&&/[1-9]/.test(o.value),'UNKNOWN_CURRENCY_UNIT_OR_PRICE');
      requireBoundary(['CLOSE','LAST','REFERENCE'].includes(o.field)&&o.field===adapter.field&&o.adjustment===adapter.adjustment&&['RAW','ADJUSTED'].includes(o.adjustment),'UNKNOWN_PRICE_OR_ADJUSTMENT_SEMANTICS');
      requireBoundary(o.corporateActions.knownAt<=knownAt&&(!actions||same(o.corporateActions,actions)),'CORPORATE_ACTION_AMBIGUITY');
      requireBoundary(o.conflict==='MATCH','DUPLICATE_OR_SOURCE_CONFLICT');
      const source=sources.find(s=>s.id===o.source.id&&s.hash===o.source.hash);
      requireBoundary(source&&o.availableAt<=knownAt&&o.observedAt<=o.availableAt&&o.availableAt<=source.retrievedAt&&o.pointer.startsWith('/'),'NORMALIZATION_SOURCE_LINEAGE');
      const key=[o.securityId,o.tradingDate,o.session,o.field,o.adjustment].join('|');requireBoundary(!seen.has(key),'DUPLICATE_NORMALIZED_OBSERVATION');seen.add(key);
    }
  }
  async resolvePolicy(e: Evidence, knownAt: string) {
    await this.approve(e,knownAt);const policies=this.bindings.policies.filter(p=>p.id===e.id&&p.hash===e.hash);
    requireBoundary(policies.length===1,'APPROVED_SESSION_CALENDAR_NOT_AVAILABLE');
    const p=policies[0];const {id:_id,hash,...body}=p;void _id;
    requireBoundary(snapshotHash(body)===hash,'SESSION_POLICY_HASH');await this.approve(p.calendar,knownAt);return p;
  }
  marketCurrent(m: Sealed<'MARKET'>, r: Consumption) { return this.bindings.marketCurrent(m,r); }
  initializationCurrent(i: Sealed<'INITIALIZATION'>, r: Consumption) { return this.bindings.initializationCurrent(i,r); }
  portfolioCurrent(p: Sealed<'PORTFOLIO'>, at: string) { return this.bindings.portfolioCurrent(p,at); }
  prerequisite(p: Evidence, r: Consumption) { return this.bindings.prerequisite(p,r); }
  currentDependencies() { return this.bindings.currentDependencies(); }
}
