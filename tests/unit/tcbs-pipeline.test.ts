import {describe,it,expect} from 'vitest';
import {exactJson} from '@/infrastructure/market-boundary/exact-json';
import {normalizeTcbsEod,parseTcbsIdentity,TCBS_EOD_VERSION,type TcbsEodProfile} from '@/domain/market-boundary/tcbs-eod';
import {HOSE_HOLIDAYS_2026,isHoseSession,nextHoseSession,eodPolicy,type HoseCalendar} from '@/domain/market-boundary/hose-calendar';
import {snapshotHash as hash} from '@/infrastructure/fundamentals/snapshot-hash';
import type {RawSource,Evidence} from '@/domain/market-boundary/contracts';
const at='2026-10-20T01:00:00.000Z';
const evidence=(id:string):Evidence=>({id,hash:hash(id),knownAt:at,effectiveAt:at});
const identity={securityId:'id-TCB',ticker:'TCB',exchange:'HOSE' as const,codeId:'003415',isin:'VN000000TCB8',from:'2026-10-19',knownAt:at,status:'Y',halt:'N'};
const source:RawSource={id:'source',hash:hash('raw'),sourceId:'TCBS_OPENAPI_EOD',request:evidence('request'),rawPath:'data/market-source/fixture.json',retrievedAt:at,providerAt:at,schemaVersion:'tcbs-bars-long-term-v1',origin:'SYNTHETIC_TEST'};
const profile:TcbsEodProfile={contractVersion:TCBS_EOD_VERSION,currency:'VND',unit:'VND_PER_SHARE',multiplier:'1',tradingDate:'2026-10-19',session:'HOSE_DAILY_COMPLETED',barEnd:'2026-10-19T08:00:00.000Z',adjustment:'RAW_LATEST_CLOSE_MATCHED_TO_BOARD',corporateActions:evidence('raw-policy'),identities:[identity],board:[{ticker:'TCB',value:'33250'}]};
const raw=()=>exactJson('{"ticker":"TCB","data":[{"open":33300.0,"high":33500.0,"low":32750.0,"close":33250.0,"volume":19665825,"tradingDate":"2026-10-19T00:00:00.000Z"}],"dataT1":null}');
const cal:HoseCalendar={version:'hose-calendar-2026-v1',evidence:evidence('calendar'),holidayDates:HOSE_HOLIDAYS_2026,validFrom:'2026-01-01',validThrough:'2026-12-31'};
describe('TCBS EOD contract: synthetic parser/negative tests, never source certification',()=>{
 it('preserves decimal lexemes above JS safe integer without precision loss',()=>{expect(exactJson('{"n":12345678901234567890.120,"x":"001","z":null,"b":true}')).toEqual({n:'12345678901234567890.120',x:'001',z:null,b:true});});
 for(const text of ['{"x":1,"x":2}','{"x":01}','{"x":NaN}','[1,]','{}more','{"x":1e}'])it('rejects ambiguous/malformed JSON '+text,()=>expect(()=>exactJson(text)).toThrow());
 it('binds VND/share with multiplier1; ignores tradeUnit as a quote multiplier',()=>{const o=normalizeTcbsEod(raw(),source,profile)[0];expect(o).toMatchObject({value:'33250',currency:'VND',unit:'VND_PER_SHARE',field:'CLOSE',adjustment:'RAW',pointer:'/data/0/close',observedAt:'2026-10-19T08:00:00.000Z',availableAt:at});});
 it('explicit security/venue/ISIN, not issuerName or txDate, defines identity',()=>{const i=parseTcbsIdentity(exactJson('{"totalElements":1,"content":[{"symbol":"TCB","codeId":"003415","isinCode":"VN000000TCB8","tradePlace":"001","secType":"001","status":"Y","halt":"N","issuerName":"   ","securitiesInfo":{"tradeUnit":1000,"txDate":"2016-12-13"}}]}'),{securityId:'id-TCB',ticker:'TCB'},at);expect(i).toMatchObject({isin:identity.isin,securityId:'id-TCB',exchange:'HOSE',knownAt:at});});
 for(const patch of [{currency:'USD'},{unit:'THOUSAND_VND'},{multiplier:'1000'},{adjustment:'ADJUSTED'},{session:'INTRADAY'}])it('rejects unsupported unit/adjustment/session '+JSON.stringify(patch),()=>expect(()=>normalizeTcbsEod(raw(),source,{...profile,...patch} as TcbsEodProfile)).toThrow());
 it('blocks wrong ticker, conflicting board, duplicate bars, missing close and incomplete day',()=>{
  expect(()=>normalizeTcbsEod({...raw() as object,ticker:'WRONG'},source,profile)).toThrow('UNKNOWN_OR_AMBIGUOUS_SECURITY');
  expect(()=>normalizeTcbsEod(raw(),source,{...profile,board:[{ticker:'TCB',value:'1'}]})).toThrow('EOD_BOARD_PRICE_CONFLICT');
  const r=raw() as {ticker:string;data:object[]};expect(()=>normalizeTcbsEod({...r,data:[...r.data,...r.data]},source,profile)).toThrow('DUPLICATE_DAILY_BAR');
  expect(()=>normalizeTcbsEod({...r,data:[]},source,profile)).toThrow('MISSING_OR_DUPLICATE_DAILY_BAR');
  expect(()=>normalizeTcbsEod(raw(),{...source,retrievedAt:'2026-10-19T07:00:00.000Z'},profile)).toThrow('UNFINISHED_DAILY_BAR');
 });
 it('rejects wrong venue, duplicate security response and halted stock',()=>{
  const base={symbol:'TCB',codeId:'003415',isinCode:identity.isin,tradePlace:'001',secType:'001',status:'Y',halt:'N'};
  for(const x of [{...base,tradePlace:'002'},{...base,halt:'Y'},{...base,symbol:'VNM'}])expect(()=>parseTcbsIdentity({content:[x],totalElements:'1'},identity,at)).toThrow();
  expect(()=>parseTcbsIdentity({content:[base,base],totalElements:'2'},identity,at)).toThrow('UNIQUE_SECURITY_REQUIRED');
 });
 it('weekend, holiday and compensatory Saturday do not become sessions',()=>{
  expect(isHoseSession('2026-10-24',cal)).toBe(false);expect(isHoseSession('2026-09-02',cal)).toBe(false);expect(isHoseSession('2026-08-22',cal)).toBe(false);
  expect(nextHoseSession('2026-08-28',cal)).toBe('2026-09-03');expect(nextHoseSession('2026-10-23',cal)).toBe('2026-10-26');
 });
 it('unknown calendar year blocks; EOD policy expires at next completed session, not N days',()=>{
  expect(()=>isHoseSession('2027-01-04',cal)).toThrow('CALENDAR_OUTSIDE_QUALIFIED_RANGE');const p=eodPolicy('2026-10-23',cal,evidence('policy'));
  expect(p.windows[0].through).toBe('2026-10-26T07:59:59.999Z');expect(p.purposes).toEqual(['VALUATION']);expect(p.purposes).not.toContain('EXECUTION');
 });
 it('later historical candles are not imported as an adjusted series',()=>{const r=raw() as {ticker:string;data:object[]};expect(normalizeTcbsEod({...r,data:[...r.data,{...r.data[0],tradingDate:'2026-10-16T00:00:00.000Z',close:'999'}]},source,profile)).toHaveLength(1);});
});
