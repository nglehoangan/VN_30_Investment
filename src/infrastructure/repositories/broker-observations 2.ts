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
  return parseBrokerApiData(latest.map(row => JSON.parse(row.body)));
}
