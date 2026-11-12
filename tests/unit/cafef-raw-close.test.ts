import { describe, expect, it } from 'vitest';
import { normalizeCafefRawClose, qualifyCafefHistoricalUse, CAFE_F_RAW_CLOSE_POLICY,
  type CafefRawCloseProfile, type CafefHistoricalUse } from '@/domain/market-boundary/cafef-raw-close';
import type { RawSource, Evidence, MarketPurpose } from '@/domain/market-boundary/contracts';
import { calculateMetrics, type MetricOperand, type MetricRequest } from '@/domain/scoring/metrics';
import { decimal } from '@/domain/portfolio/values';
import { seal, reference } from '@/domain/market-boundary/validation';
import { fixture } from '../fixtures/market-boundary';
import { snapshotHash as hash } from '@/infrastructure/fundamentals/snapshot-hash';

const proof: Evidence = {id:'synthetic-proof',hash:'a'.repeat(64),knownAt:'2026-01-01T00:00:00.000Z',effectiveAt:'2026-01-01T00:00:00.000Z'};
const source: RawSource = {id:'cafef-test-response',hash:'b'.repeat(64),sourceId:'CAFEF_PRICE_HISTORY',request:proof,
  rawPath:'synthetic-response.json',retrievedAt:'2026-11-11T14:00:00.000Z',providerAt:null,schemaVersion:'cafef-history',origin:'SYNTHETIC_TEST'};
const profile: CafefRawCloseProfile = {securityId:'VNM',ticker:'VNM',exchange:'HOSE',tradingDate:'2026-10-30',
  observedAt:'2026-10-30T08:00:00.000Z',session:'HOSE_DAILY_COMPLETED',sourceUnit:'THOUSAND_VND_PER_SHARE',
  unitEvidence:proof,corporateActionPolicy:proof,rowPointer:'/Data/Data/0'};
const row = () => ({Symbol:'VNM',Ngay:'30/10/2026',GiaDongCua:56.9,GiaDieuChinh:54.44});
const close = () => normalizeCafefRawClose(row(),source,profile);
function historical(): CafefHistoricalUse {
  return {purpose:'HISTORICAL_TOTAL_RETURN',ticker:'VNM',from:'2026-10-30',through:'2026-10-30',
    prices:[close()],sourceId:source.sourceId,expectedSessions:['2026-10-30'],calendarEvidence:proof,
    corporateActions:{ticker:'VNM',from:'2026-10-30',through:'2026-10-30',status:'VERIFIED_COMPLETE',evidence:proof,events:[]},
    pointInTimeEvidence:null};
}
describe('owner CafeF raw-close calculation boundary',()=>{
  it('selects raw close and converts thousand VND exactly, preserving both provider fields',()=>{
    const raw=Object.freeze(row()),before=JSON.stringify(raw),o=normalizeCafefRawClose(raw,source,profile);
    expect(o).toMatchObject({value:'56900',field:'CLOSE',adjustment:'RAW',unit:'VND_PER_SHARE',pointer:'/Data/Data/0/GiaDongCua'});
    expect(JSON.stringify(raw)).toBe(before);expect(raw.GiaDieuChinh).toBe(54.44);
  });
  it.each([54.44,0,null,999999,'invalid'])('adjusted value %s has no influence on the selected price',adjusted=>{
    expect(normalizeCafefRawClose({...row(),GiaDieuChinh:adjusted},source,profile).value).toBe('56900');
  });
  it.each([undefined,null,'',0,-1,NaN,Infinity,'unknown'])('missing/invalid raw %s never falls back to adjusted',raw=>{
    expect(()=>normalizeCafefRawClose({...row(),GiaDongCua:raw,GiaDieuChinh:99999},source,profile)).toThrow();
  });
  it('converts decimal strings without binary rounding and rejects unspecified units',()=>{
    expect(normalizeCafefRawClose({...row(),GiaDongCua:'56.9001'},source,profile).value).toBe('56900.1');
    expect(()=>normalizeCafefRawClose(row(),source,{...profile,sourceUnit:'VND_PER_SHARE'} as unknown as CafefRawCloseProfile)).toThrow('EXPLICIT_UNIT');
    expect(()=>normalizeCafefRawClose(row(),source,{...profile,unitEvidence:null} as unknown as CafefRawCloseProfile)).toThrow('EXPLICIT_UNIT');
  });
  it('rejects wrong ticker/date and preserves raw source receipt and provider data on failures',()=>{
    const before=JSON.stringify({source,row:row()});
    expect(()=>normalizeCafefRawClose({...row(),Symbol:'OTHER'},source,profile)).toThrow('TICKER');
    expect(()=>normalizeCafefRawClose({...row(),Ngay:'31/10/2026'},source,profile)).toThrow('DATE');
    expect(JSON.stringify({source,row:row()})).toBe(before);
  });
  it('existing valuation/scoring metric arithmetic receives raw 56900, independent of adjusted prices',()=>{
    const request:MetricRequest={id:'yield',metric:'EARNINGS_YIELD',evidenceRefs:['eps','price'],years:null,comparable:true,
      normalization:{kind:'AS_REPORTED',rationale:'raw closing price under owner policy',evidenceRefs:[]}};
    const common={unit:'VND_PER_SHARE' as const,periodStart:'2026-10-30',periodEnd:'2026-10-30',quality:'VALID' as const,validThrough:'2027-01-01T00:00:00.000Z'};
    for(const adjusted of [1,54.44,999999]){
      const o=normalizeCafefRawClose({...row(),GiaDieuChinh:adjusted},source,profile);
      const inputs:MetricOperand[]=[{...common,id:'eps',value:'5000'},{...common,id:'price',value:o.value}];
      const result=calculateMetrics([request],inputs,'INDUSTRIAL','2026-10-30T08:00:00.000Z',[],false);
      expect(result[0].value).toBe(decimal('5000').div(decimal('56900')).toString());
    }
  });
});
describe('all market purposes enforce the CafeF field at the sealed-input boundary',()=>{
  const purposes:MarketPurpose[]=['VALUATION','SCORING','RANKING','TOP10','TECHNICAL','MONEY_FLOW','NEW_CAPITAL','DCA','EXECUTION','PORTFOLIO_NAV'];
  it.each(purposes)('%s rejects adjusted close and a forged RAW label on an adjusted pointer',purpose=>{
    const f=fixture(),s={...f.market.body.sources[0],sourceId:'cafef-price-history'};
    for(const adjustment of ['RAW','ADJUSTED'] as const){
      const observations=f.market.body.observations.map(o=>({...o,adjustment,pointer:'/Data/Data/0/GiaDieuChinh'}));
      expect(()=>seal('MARKET','cafef',f.market.createdAt,f.market.knownAt,{...f.market.body,purpose,sources:[s],observations},hash)).toThrow('ADJUSTED_OR_FALLBACK');
    }
    const observations=f.market.body.observations.map(o=>({...o,pointer:'/Data/Data/0/GiaDongCua'}));
    expect(seal('MARKET','cafef',f.market.createdAt,f.market.knownAt,{...f.market.body,purpose,sources:[s],observations},hash).body.observations[0].adjustment).toBe('RAW');
  });
  it('CafeF capability must bind raw-close-only semantics; other providers retain existing contracts',()=>{
    const f=fixture();
    expect(()=>seal('CAPABILITY','cafef-cap',f.cap.createdAt,f.cap.knownAt,{...f.cap.body,sourceId:'CAFEF_PRICE_HISTORY'},hash)).toThrow('CAFEF_RAW_CLOSE_SEMANTICS_REQUIRED');
    const rawSamples=f.cap.body.rawSamples.map(s=>({...s,sourceId:'CAFEF_PRICE_HISTORY'}));
    expect(seal('CAPABILITY','cafef-cap',f.cap.createdAt,f.cap.knownAt,{...f.cap.body,sourceId:'CAFEF_PRICE_HISTORY',
      semanticsVersion:CAFE_F_RAW_CLOSE_POLICY.version,rawSamples},hash).body.semanticsVersion).toBe('cafef-raw-close-only-v1');
    const nonCafef=f.market.body.observations.map(o=>({...o,adjustment:'ADJUSTED' as const}));
    expect(seal('MARKET','other',f.market.createdAt,f.market.knownAt,{...f.market.body,observations:nonCafef},hash).body.observations[0].adjustment).toBe('ADJUSTED');
    expect(reference(f.cap).hash).toBe(f.cap.contentHash);
  });
});
describe('raw prices and independently verified corporate actions are separate historical inputs',()=>{
  it.each(['UNKNOWN','INCOMPLETE'] as const)('%s actions return NOT_QUALIFIED and no numeric return',status=>{
    const i=historical();const r=qualifyCafefHistoricalUse({...i,corporateActions:{...i.corporateActions,status}});
    expect(r).toMatchObject({status:'NOT_QUALIFIED',reason:'CORPORATE_ACTION_EVIDENCE_INCOMPLETE',returnValue:null});
  });
  it('an empty unverified action list is not a no-actions certificate',()=>{
    const i=historical();expect(qualifyCafefHistoricalUse({...i,corporateActions:{...i.corporateActions,evidence:null}}).status).toBe('NOT_QUALIFIED');
  });
  it('keeps action evidence separate and does not infer/add a dividend from the adjusted-price difference',()=>{
    const i=historical(),actions={...i.corporateActions,events:[{id:'cash-event',date:'2026-10-30',verified:true,evidence:proof}]};
    const r=qualifyCafefHistoricalUse({...i,corporateActions:actions});
    expect(r.status).toBe('QUALIFIED_INPUTS_ONLY');
    if(r.status==='QUALIFIED_INPUTS_ONLY'){expect(r.prices[0].value).toBe('56900');expect(r.corporateActions).toBe(actions);}
    expect(r.returnValue).toBeNull();expect(i.prices[0]).not.toHaveProperty('dividend');
  });
  it('missing sessions, duplicates or adjusted observations cannot produce historical returns',()=>{
    const i=historical();
    for(const prices of [[],[...i.prices,...i.prices],[{...i.prices[0],adjustment:'ADJUSTED' as const}]]){
      expect(qualifyCafefHistoricalUse({...i,prices})).toMatchObject({status:'NOT_QUALIFIED',returnValue:null});
    }
  });
  it('backtesting additionally requires separate PIT proof; a known future action is outside the interval',()=>{
    const i=historical();expect(qualifyCafefHistoricalUse({...i,purpose:'BACKTEST'})).toMatchObject({status:'NOT_QUALIFIED',reason:'POINT_IN_TIME_NOT_QUALIFIED'});
    expect(qualifyCafefHistoricalUse({...i,purpose:'BACKTEST',pointInTimeEvidence:proof}).status).toBe('QUALIFIED_INPUTS_ONLY');
    expect(qualifyCafefHistoricalUse({...i,corporateActions:{...i.corporateActions,events:[{id:'future',date:'2026-11-11',verified:true,evidence:proof}]}}).status).toBe('NOT_QUALIFIED');
  });
});
