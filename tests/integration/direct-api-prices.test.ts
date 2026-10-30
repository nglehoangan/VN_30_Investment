// @vitest-environment node
import { expect, it } from "vitest";
import { testDatabase } from "../fixtures/database";
import { openDirectData } from "../../api/direct-data.mjs";
import { latestDirectMarketPrices } from "@/infrastructure/repositories/direct-market-prices";
import { personalAccountView, type PersonalAccountObservation } from "@/domain/portfolio/personal-account";
it("API writes become display P/L immediately through the real SQLite reader with exact lineage", async () => {
 const db = await testDatabase(); const writer = openDirectData(db.config.filePath);
 try {
  const before = await db.client.ledgerTransaction.count();
  const row = { apiId: "5.13", ticker: "FPT", retrievedAt: "2026-10-29T01:49:00.000Z", httpStatus: 200, parameters: { ticker: "FPT" }, method: "GET", url: "https://openapi.tcbs.com.vn/bars" };
  const saved = writer.response(row, Buffer.from(JSON.stringify({ ticker: "FPT", data: [{ tradingDate: "2026-10-28T00:00:00.000Z", close: 54000, low: 53000, high: 55000 }] })));
  writer.publishPrices([{ ...row, ...saved }], [{ ticker: "FPT", securityId: "test-fpt" }]);
  const prices = await latestDirectMarketPrices(db.client, ["FPT"], "2026-10-29T02:00:00.000Z");
  expect(prices).toHaveLength(1); expect(prices[0]).toMatchObject({ price: "54000", asOfDate: "2026-10-28" });
  const o: PersonalAccountObservation = { schemaVersion: "personal-account-v1", portfolioId: "test", ledgerWatermark: "1", asOfDate: "2026-10-28", cash: "327420", custodyFee: "420", pendingDividends: "475000", withdrawable: "327000", linkedBankAvailable: "12152752", buyingPower: "12479752", brokerReportedNav: "91742252", positions: [{ ticker: "FPT", isin: "VN000000FPT1", quantity: "220", tradableQuantity: "200", pendingQuantity: "20", importedCost: "16065060" }] };
  const view = personalAccountView(o, undefined, prices);
  expect(view.positions[0]).toMatchObject({ marketValue: "11880000", unrealizedPnl: "-4185060", priceAsOf: "2026-10-28" });
  expect(view.cash).toBe("327420"); expect(view.pendingDividends).toBe("475000");
  expect(await db.client.ledgerTransaction.count()).toBe(before);
  await expect(latestDirectMarketPrices(db.client, ["FPT"], "2026-10-28T00:00:00.000Z")).rejects.toThrow();
 } finally { writer.close(); await db.close(); }
});
it('v2 reader independently checks previous-close and actual-open provenance, including cross-session selection',async()=>{
 const db=await testDatabase(),writer=openDirectData(db.config.filePath);
 try{
  const day={apiId:'5.13',ticker:'FPT',httpStatus:200,retrievedAt:'2026-10-29T03:00:00.000Z',method:'GET',url:'https://openapi.tcbs.com.vn/bars',parameters:{ticker:'FPT'}};
  const daily={...day,...writer.response(day,Buffer.from(JSON.stringify({ticker:'FPT',data:[{tradingDate:'2026-10-28',close:54000,low:53000,high:55000}]})))};
  const q={...day,apiId:'5.1',retrievedAt:'2026-10-29T03:01:00.000Z'};
  const quote={...q,...writer.response(q,Buffer.from(JSON.stringify({tradingDate:'29/10/2026',data:[{symbol:'FPT',matchPrice:54500,open:54200,refPrice:55000}]})))};
  const members=[{ticker:'FPT',securityId:'test'}];writer.publishPrices([daily,quote],members);
  expect((await latestDirectMarketPrices(db.client,['FPT'],'2026-10-29T03:02:00.000Z'))[0].price).toBe('54500');
  writer.publishPrices([daily,quote],members,'2026-10-29T04:45:00.000Z');
  expect((await latestDirectMarketPrices(db.client,['FPT'],'2026-10-29T04:46:00.000Z'))[0]).toMatchObject({price:'54000',asOfDate:'2026-10-28'});
  const stored=(await db.client.brokerObservation.findMany({where:{kind:'TCBS_MARKET_PRICE'}})).find(r=>JSON.parse(r.body).sessionState==='LUNCH_BREAK')!;
  const body=JSON.parse(stored.body);body.openingReference.value='1';body.selectedAt='2026-10-29T04:46:00.000Z';
  const {createHash}=await import('node:crypto');const text=JSON.stringify(body);
  await db.client.brokerObservation.create({data:{id:'synthetic-forged-v2',kind:'TCBS_MARKET_PRICE',apiId:'FPT',receivedAt:body.receivedAt,body:text,bodyHash:createHash('sha256').update(text).digest('hex')}});
  await expect(latestDirectMarketPrices(db.client,['FPT'],'2026-10-29T04:47:00.000Z')).rejects.toThrow('DIRECT_MARKET_VALUE_LINEAGE_INVALID');
 }finally{writer.close();await db.close();}
});
