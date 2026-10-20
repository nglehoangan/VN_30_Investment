import type { Evidence, Observation, RawSource } from './contracts';
import { requireBoundary } from './validation';
import { decimal } from '@/domain/portfolio/values';
import { dateOnly, instant } from '@/shared/time';
export const TCBS_EOD_VERSION='tcbs-latest-eod-close-v1';
export interface TcbsIdentity {
 readonly securityId:string;readonly ticker:string;readonly exchange:'HOSE';readonly codeId:string;readonly isin:string;
 readonly from:string;readonly knownAt:string;readonly status:string;readonly halt:string;
}
export interface TcbsEodProfile {
 readonly contractVersion:typeof TCBS_EOD_VERSION;readonly currency:'VND';readonly unit:'VND_PER_SHARE';readonly multiplier:'1';
 readonly tradingDate:string;readonly session:'HOSE_DAILY_COMPLETED';readonly barEnd:string;
 readonly adjustment:'RAW_LATEST_CLOSE_MATCHED_TO_BOARD';readonly corporateActions:Evidence;
 readonly identities:readonly TcbsIdentity[];readonly board:readonly {readonly ticker:string;readonly value:string}[];
}
export function object(v:unknown):Record<string,unknown>{requireBoundary(v!==null&&typeof v==='object'&&!Array.isArray(v),'SOURCE_OBJECT');return v as Record<string,unknown>;}
export function array(v:unknown):unknown[]{requireBoundary(Array.isArray(v),'SOURCE_ARRAY');return v;}
export function numeric(v:unknown):string {requireBoundary(typeof v==='string','LOSSLESS_DECIMAL_LEXEME');const n=decimal(v);requireBoundary(n.positive,'POSITIVE_SOURCE_VALUE');return n.toString();}
export function parseTcbsIdentity(raw:unknown,expected:{securityId:string;ticker:string},knownAt:string):TcbsIdentity {
 const body=object(raw),rows=array(body.content);requireBoundary(rows.length===1&&body.totalElements==='1','UNIQUE_SECURITY_REQUIRED');const x=object(rows[0]);
 requireBoundary(x.symbol===expected.ticker&&x.tradePlace==='001'&&x.secType==='001'&&x.status==='Y'&&x.halt==='N','TCBS_SECURITY_IDENTITY_OR_STATUS');
 requireBoundary(typeof x.codeId==='string'&&/^\d+$/.test(x.codeId)&&typeof x.isinCode==='string'&&/^VN[A-Z0-9]{10}$/.test(x.isinCode),'TCBS_CODE_ISIN');
 // txDate/listingDate are not quote timestamps. No company-name guess from blank issuerName.
 return {securityId:expected.securityId,ticker:expected.ticker,exchange:'HOSE',codeId:x.codeId,isin:x.isinCode,from:knownAt.slice(0,10),knownAt,status:'Y',halt:'N'};
}
/** Only the captured board-date daily bar is admitted. Historical adjustment/return series are outside this contract. */
export function normalizeTcbsEod(raw:unknown,source:RawSource,profile:TcbsEodProfile):readonly Observation[] {
 requireBoundary(profile.contractVersion===TCBS_EOD_VERSION&&profile.currency==='VND'&&profile.unit==='VND_PER_SHARE'&&profile.multiplier==='1','TCBS_EXPLICIT_UNIT_CONTRACT');
 requireBoundary(profile.adjustment==='RAW_LATEST_CLOSE_MATCHED_TO_BOARD'&&profile.session==='HOSE_DAILY_COMPLETED','TCBS_SCOPE_ADJUSTMENT');
 dateOnly(profile.tradingDate);instant(profile.barEnd);requireBoundary(profile.barEnd>=profile.tradingDate+'T00:00:00.000Z'&&profile.barEnd<=source.retrievedAt,'UNFINISHED_DAILY_BAR');
 const d=object(raw);requireBoundary(typeof d.ticker==='string','TCBS_TICKER');
 const identities=profile.identities.filter(i=>i.ticker===d.ticker&&i.knownAt<=source.retrievedAt);requireBoundary(identities.length===1,'UNKNOWN_OR_AMBIGUOUS_SECURITY');const id=identities[0];
 requireBoundary(id.exchange==='HOSE'&&id.status==='Y'&&id.halt==='N','UNSUPPORTED_OR_HALTED_SECURITY');
 const bars=array(d.data),matches=bars.map((bar,index)=>({bar:object(bar),index})).filter(x=>x.bar.tradingDate===profile.tradingDate+'T00:00:00.000Z');
 requireBoundary(matches.length===1,'MISSING_OR_DUPLICATE_DAILY_BAR');const {bar,index}=matches[0];
 const close=numeric(bar.close),high=decimal(numeric(bar.high)),low=decimal(numeric(bar.low));
 requireBoundary(low.units<=decimal(close).units&&decimal(close).units<=high.units,'OHLC_IMPOSSIBLE');
 const board=profile.board.filter(b=>b.ticker===id.ticker);requireBoundary(board.length===1&&numeric(board[0].value)===close,'EOD_BOARD_PRICE_CONFLICT');
 return [{securityId:id.securityId,ticker:id.ticker,exchange:id.exchange,value:close,currency:'VND',unit:'VND_PER_SHARE',field:'CLOSE',adjustment:'RAW',corporateActions:profile.corporateActions,
  tradingDate:profile.tradingDate,session:profile.session,observedAt:profile.barEnd,availableAt:source.retrievedAt,source:{id:source.id,hash:source.hash},pointer:'/data/'+index+'/close',conflict:'MATCH'}];
}
