import { createHash } from "node:crypto";
import type { PrismaClient } from "../db/generated/client";
import { directMarketPriceSchema } from "../config/direct-market-price";
import type { PersonalMarketPrice } from "@/domain/portfolio/personal-account";
import { vietnamBusinessDate, instant } from "@/shared/time";
import {verifyDisplaySelection,closeInstant} from '../../shared/market-display-session.mjs';
const digest = (text: string) => createHash("sha256").update(text).digest("hex");
interface Evidence {value:string;tradingDate:string;receivedAt:string;sourceObservationId:string;sourcePointer:string;rawSourceSha256:string}
/** Directly persisted API prices, display-only; never a production NAV authority. */
export async function latestDirectMarketPrices(client: PrismaClient, symbols: readonly string[], now: string): Promise<PersonalMarketPrice[]> {
  const result: PersonalMarketPrice[] = [];
  async function verifySource(p:Evidence,ticker:string,expectedField:'close'|'matchPrice'|'open'){
    const source=await client.brokerObservation.findUnique({where:{id:p.sourceObservationId}});
    if(!source||digest(source.body)!==source.bodyHash)throw Error('DIRECT_MARKET_RAW_MISSING_OR_INVALID');
    const raw=JSON.parse(source.body) as {raw:string;httpStatus:number;receivedAt:string;apiId:string};
    if(typeof raw.raw!=='string'||digest(raw.raw)!==p.rawSourceSha256||raw.httpStatus!==200||raw.receivedAt!==p.receivedAt||p.receivedAt>now)throw Error('DIRECT_MARKET_RAW_LINEAGE_INVALID');
    const payload=JSON.parse(raw.raw) as {ticker?:string;tradingDate?:string;data:Record<string,unknown>[]};
    const parts=p.sourcePointer.split('/'),cell=payload.data?.[Number(parts[3])],value=cell?.[parts[4]];
    if(!cell||parts[4]!==expectedField||!Number.isSafeInteger(value)||String(value)!==p.value||(expectedField==='close'?raw.apiId!=='5.13'||payload.ticker!==ticker:raw.apiId!=='5.1'||cell.symbol!==ticker))throw Error('DIRECT_MARKET_VALUE_LINEAGE_INVALID');
    const date=expectedField==='close'?cell.tradingDate:payload.tradingDate;
    const normalized=typeof date==='string'&&/^\d{2}\/\d{2}\/\d{4}$/.test(date)?date.slice(6)+'-'+date.slice(3,5)+'-'+date.slice(0,2):typeof date==='string'?date.slice(0,10):null;
    if(normalized!==p.tradingDate)throw Error('DIRECT_MARKET_DATE_OR_FIELD_INVALID');
  }
  for (const ticker of symbols) {
    const [row] = await client.$queryRaw<{ id: string; body: string; bodyHash: string; receivedAt: string }[]>`SELECT id,body,body_hash AS bodyHash,received_at AS receivedAt FROM broker_observation WHERE kind='TCBS_MARKET_PRICE' AND api_id=${ticker} ORDER BY CASE WHEN json_extract(body,'$.schemaVersion')='tcbs-display-price-v2' THEN 1 ELSE 0 END DESC,COALESCE(json_extract(body,'$.selectedAt'),received_at) DESC,id ASC LIMIT 1`;
    if (!row) continue;
    if (digest(row.body) !== row.bodyHash) throw Error("DIRECT_MARKET_PRICE_HASH_MISMATCH");
    const p=directMarketPriceSchema.parse(JSON.parse(row.body));
    if(p.ticker!==ticker||p.receivedAt!==row.receivedAt||p.receivedAt>now||p.tradingDate>vietnamBusinessDate(instant(p.receivedAt)))throw Error('DIRECT_MARKET_PRICE_SCOPE_MISMATCH');
    await verifySource(p,ticker,p.field==='MATCH_PRICE'?'matchPrice':'close');
    if(p.schemaVersion==='tcbs-display-price-v2'){
      if(p.selectedAt>now)throw Error('FUTURE_SELECTION_TIME');verifyDisplaySelection(p);
      if(p.field==='DAILY_BAR_CLOSE_REFERENCE'&&Date.parse(closeInstant(p.tradingDate))>Date.parse(p.receivedAt))throw Error('DIRECT_MARKET_DATE_OR_FIELD_INVALID');
      if(p.openingReference)await verifySource(p.openingReference,ticker,'close');
      if(p.exchangeOpen)await verifySource(p.exchangeOpen,ticker,'open');
    }else if(p.field==='DAILY_BAR_CLOSE_REFERENCE'&&Date.parse(p.tradingDate+'T08:00:00.000Z')>Date.parse(p.receivedAt))throw Error('DIRECT_MARKET_DATE_OR_FIELD_INVALID');
    result.push({ ticker, price:p.value, asOfDate:p.tradingDate, receivedAt:p.receivedAt, sourceReference:p.sourceObservationId+'#'+p.sourcePointer });
  }
  return result;
}
