import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { personalAccountSchema } from "./config/personal-account";
import { personalAccountView } from "@/domain/portfolio/personal-account";
import type { PortfolioState } from "@/domain/portfolio/reconstruct";
import type { PersonalMarketPrice } from "@/domain/portfolio/personal-account";
import type { BrokerSnapshot } from "@/domain/portfolio/broker-snapshot";
import { decimal } from "@/domain/portfolio/values";
import { vietnamBusinessDate } from "@/shared/time";
/** Only load the explicit local owner observation for its matching portfolio and ledger revision. */
export async function readPersonalAccount(root: string, state: PortfolioState, snapshot?: BrokerSnapshot, marketPrices: readonly PersonalMarketPrice[] = []) {
  const file = path.resolve(await realpath(root), "data/account-current/personal-account.json");
  let bytes: string;
  try {
    if (await realpath(file) !== file) throw Error("PERSONAL_ACCOUNT_SYMLINK");
    bytes = await readFile(file, "utf8");
  } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
  if (Buffer.byteLength(bytes) > 100_000) throw Error("PERSONAL_ACCOUNT_TOO_LARGE");
  const observation = personalAccountSchema.parse(JSON.parse(bytes));
  if (observation.portfolioId !== state.portfolioId) return undefined;
  if (observation.asOfDate > vietnamBusinessDate(state.asOf) || observation.ledgerWatermark !== state.ledgerWatermark) throw Error("PERSONAL_ACCOUNT_REVISION_OR_DATE_MISMATCH");
  if (snapshot && snapshot.holdingsAsOf > state.asOf) throw Error("PERSONAL_ACCOUNT_FUTURE_PRICE_SOURCE");
  const held = state.positions.filter(p => decimal(p.quantity).positive);
  if (held.length !== observation.positions.length || observation.positions.some(p => {
    const original = held.find(s => s.securityId === p.ticker);
    return !original || !decimal(original.quantity).eq(decimal(p.quantity)) || !decimal(original.openCost).eq(decimal(p.importedCost));
  })) throw Error("PERSONAL_ACCOUNT_LEDGER_POSITION_MISMATCH");
  return personalAccountView(observation, snapshot, marketPrices);
}
