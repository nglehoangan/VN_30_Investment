import { it, expect } from "vitest";
import { parsePortfolioCommands } from "@/infrastructure/repositories/portfolio-command-schema";
import { deposit } from "../fixtures/portfolio/history";
it("Zod command boundary rejects unknown fields, numeric coercion, invalid dates and arbitrary status", () => {
  expect(parsePortfolioCommands([deposit()])[0].id).toBe("deposit");
  for (const changes of [{ amount: 100 }, { status: "POSTED" }, { effectiveAt: "2026-02-30T00:00:00.000Z" }, { currency: "USD" }, { legs: [] }]) expect(() => parsePortfolioCommands([{ ...deposit(), ...changes }])).toThrow();
});
