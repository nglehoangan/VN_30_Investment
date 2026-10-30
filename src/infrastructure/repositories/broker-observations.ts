import { latestDirectMarketPrices } from "./direct-market-prices";
import { createHash } from "node:crypto";
import type { PrismaClient } from "../db/generated/client";
import { parseBrokerApiData } from "../config/broker-api-data";
import { parseBrokerSnapshot } from "../config/broker-snapshot";

export async function latestBrokerSnapshot(client: PrismaClient) {
  const row = await client.brokerObservation.findFirst({ where: { kind: "BROKER_SNAPSHOT" }, orderBy: [{ receivedAt: "desc" }, { id: "asc" }] });
  if (!row) return undefined;
  if (createHash("sha256").update(row.body).digest("hex") !== row.bodyHash) throw new Error("BROKER_EVIDENCE_HASH_MISMATCH");
  const snapshot = parseBrokerSnapshot(JSON.parse(row.body));
  if (snapshot.timeBasis === "RETRIEVED_AT") {
    for (const source of snapshot.sources) {
      const evidence = await client.brokerObservation.findFirst({ where: { kind: "TCBS_API_RESPONSE", bodyHash: source.sha256 } });
      if (!evidence || createHash("sha256").update(evidence.body).digest("hex") !== source.sha256) throw new Error("BROKER_SOURCE_MISSING");
    }
  }
  return snapshot;
}

export async function latestBrokerApiData(client: PrismaClient) {
  const rows = await client.brokerObservation.findMany({ where: { kind: "TCBS_API_RESPONSE" }, orderBy: [{ receivedAt: "desc" }, { id: "asc" }], take: 100 });
  const latest = rows.filter((r, i) => rows.findIndex(x => x.apiId === r.apiId) === i);
  for (const row of latest) {
    if (createHash("sha256").update(row.body).digest("hex") !== row.bodyHash) throw new Error("BROKER_EVIDENCE_HASH_MISMATCH");
  }
  const result = parseBrokerApiData(latest.map(row => JSON.parse(row.body)));
  const symbols = await client.brokerObservation.findMany({ where: { kind: "TCBS_MARKET_PRICE" }, distinct: ["apiId"], select: { apiId: true } });
  const prices = await latestDirectMarketPrices(client, symbols.flatMap(s => s.apiId ? [s.apiId] : []), new Date().toISOString());
  if (prices.length) {
    const dates = [...new Set(prices.map(p => p.asOfDate))];
    result.tradingDate = dates.length === 1 ? dates[0] : undefined;
    result.quoteReceivedAt = prices.map(p => p.receivedAt).sort().at(-1);
    result.quoteBasis = "DIRECT_API_OBSERVATIONS";
    result.quotes = prices.map(p => ({ symbol: p.ticker, price: Number(p.price), reference: null, changePercent: null, volume: null, asOfDate: p.asOfDate })).sort((a,b) => a.symbol.localeCompare(b.symbol));
  }
  return result;
}
