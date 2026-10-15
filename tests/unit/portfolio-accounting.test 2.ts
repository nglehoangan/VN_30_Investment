import { describe, it, expect } from "vitest";
import { decimal, money, price, shareQuantity, watermark, ACCOUNTING_METHOD } from "@/domain/portfolio/values";
import { buildTransaction } from "@/domain/portfolio/transaction";
import { reconstructPortfolio } from "@/domain/portfolio/reconstruct";
import { input, deposit, buy, sell, settlement, reversal, history, goldenInputs, P, A, at, NOW, W0 } from "../fixtures/portfolio/history";
const replay = (h: ReturnType<typeof history>, cutoff = NOW) => reconstructPortfolio(P, h, cutoff, W0);
describe("M6.3 numeric precision", () => {
  it.each(["0", "9007199254740993", "999999999999999999999999999999", "0.123456789012", "-123.25"])("exact decimal TEXT/JSON %s", v => expect(JSON.parse(JSON.stringify(decimal(v)))).toBe(v));
  it.each(["1e3", "01", "1.0000000000001", "NaN", " 1"])("rejects invalid decimal %s", v => expect(() => decimal(v)).toThrow());
  it("rejects binary float, wrong currency, fractional ordinary shares, nonpositive prices", () => {
    expect(() => decimal(0.1 as unknown as string)).toThrow(); expect(() => money("1", "USD")).toThrow();
    expect(() => shareQuantity("1.5")).toThrow(); expect(() => price("0")).toThrow();
  });
  it("pins half-even at cost release/display division only", () => {
    expect(decimal("1").div(decimal("3")).toString()).toBe("0.333333333333");
    expect(decimal("0.000000000001").div(decimal("2")).toString()).toBe("0");
    expect(decimal("0.000000000003").div(decimal("2")).toString()).toBe("0.000000000002");
    expect(decimal("-0.000000000003").div(decimal("2")).toString()).toBe("-0.000000000002");
  });
});
describe("M6.3 Cash and ledger", () => {
  it("empty portfolio", () => expect(replay([])).toMatchObject({ cash: "0", positions: [], netContributions: "0" }));
  it("VC-L01 deposit is capital, not P&L", () => expect(replay(history([deposit()]))).toMatchObject({ cash: "10000", netContributions: "10000", realizedPnl: "0" }));
  it("withdrawal and standalone FEE/TAX have separate classifications", () => expect(replay(history([deposit(), input("withdraw", "CASH_WITHDRAWAL", 2, { amount: "100" }), input("fee", "FEE", 3, { amount: "5" }), input("tax", "TAX", 4, { amount: "3" })]))).toMatchObject({ cash: "9892", netContributions: "9900", expenses: "8" }));
  it("rejects insufficient withdrawal and unfunded BUY", () => {
    expect(() => replay(history([deposit(), input("withdraw", "CASH_WITHDRAWAL", 2, { amount: "10001" })]))).toThrow();
    expect(() => replay(history([buy()]))).toThrow();
  });
  it("posted aggregate is deeply frozen; constructing a draft has no ledger effect", () => { const draft = deposit(); expect(replay([]).cash).toBe("0"); const t = buildTransaction(draft, NOW, []); expect(Object.isFrozen(t.facts.source)).toBe(true); expect(Object.isFrozen(t.legs)).toBe(true); });
  it.each(["-1", "0"])("rejects nonpositive deposit %s", amount => expect(() => history([deposit("x", amount)])).toThrow());
  it("rejects future speculative postings and unsupported adjustments", () => {
    expect(() => buildTransaction(deposit(), at(1 - 0).replace("09:00", "08:00") as typeof NOW, [])).toThrow();
    expect(() => history([input("adjust", "CASH_ADJUSTMENT", 2, { amount: "1" })])).toThrow();
  });
});
describe("M6.3 BUY / SELL / settlement", () => {
  it("VC-L02 BUY creates quantity, capitalized fees/tax and payable; cash changes only at settlement", () => {
    const h = history([deposit(), buy("buy", "100", "1000", 2, { fee: "10", tax: "2" }), settlement("settle", "buy", "1012", 3)]);
    expect(replay(h, at(2))).toMatchObject({ cash: "10000", payables: "1012", positions: [{ quantity: "100", openCost: "1012", averageCost: "10.12" }] });
    expect(replay(h)).toMatchObject({ cash: "8988", payables: "0", positions: [{ openCost: "1012" }] });
  });
  it("multiple BUYs / MWAC / VC-L04 partial SELL / hand-audited multi-security golden", () => {
    expect(replay(history(goldenInputs()))).toMatchObject({ cash: "8270", payables: "0", receivables: "0", realizedPnl: "246", netDividends: "95", grossDividends: "100", dividendTax: "5", expenses: "5", netContributions: "9900",
      positions: [{ securityId: A, quantity: "90", openCost: "966", averageCost: "10.733333333333", realizedPnl: "246" }, { quantity: "20", openCost: "1000", averageCost: "50" }] });
  });
  it("VC-L03 oversell rejection", () => expect(() => replay(history([deposit(), buy(), sell("sell", "101", "1515")]))).toThrow());
  it("full SELL releases all basis then re-entry starts new MWAC without losing realized history", () => {
    const h = history([deposit(), buy(), sell("sell", "100", "1500"), buy("rebuy", "10", "200", 9, { price: "20" })]);
    expect(replay(h, at(8)).positions[0]).toMatchObject({ quantity: "0", openCost: "0", averageCost: null, realizedPnl: "500" });
    expect(replay(h).positions[0]).toMatchObject({ quantity: "10", openCost: "200", averageCost: "20", realizedPnl: "500" });
  });
  it("BUY after partial SELL preserves remaining basis", () => expect(replay(history([deposit(), buy(), sell(), buy("rebuy", "10", "200", 9, { price: "20" })])).positions[0]).toMatchObject({ quantity: "50", openCost: "600", averageCost: "12", realizedPnl: "300" }));
  it("partial settlements retain the originating obligation", () => expect(replay(history([deposit(), buy(), settlement("s1", "buy", "400", 3)]))).toMatchObject({ cash: "9600", payables: "600" }));
  it("rejects excessive, early and wrong-origin settlement", () => {
    expect(() => replay(history([deposit(), buy(), settlement("s", "buy", "1001", 3)]))).toThrow();
    expect(() => replay(history([deposit(), buy(), settlement("s", "buy", "1000", 1)]))).toThrow();
    expect(() => history([settlement("s", "missing", "1", 3)])).toThrow();
  });
  it("split settlement charges exactly once", () => {
    const inputs = [deposit(), buy("buy", "100", "1000", 2, { fee: "10", tax: "1", representation: "SPLIT_SETTLEMENT" }), settlement("s", "buy", "1011", 3)];
    expect(replay(history(inputs))).toMatchObject({ cash: "8989", payables: "0", positions: [{ openCost: "1011" }] });
  });
  it("decimal prices, fees and large VND remain exact", () => expect(replay(history([deposit("d", "9007199254740993"), buy("b", "3", "30.375", 2, { price: "10.125", fee: "0.005", tax: "0.001" }), sell("s", "1", "15", 3)])).positions[0]).toMatchObject({ quantity: "2", openCost: "20.254", realizedPnl: "4.873" }));
});
describe("M6.3 Dividend", () => {
  it.each(["NET_SETTLEMENT", "SPLIT_SETTLEMENT"] as const)("%s keeps receipt and withholding separate without quantity effects", representation => expect(replay(history([input("d", "DIVIDEND_CASH", 2, { securityId: A, representation, dividend: { gross: "100", withholding: "5", net: "95" } })]))).toMatchObject({ cash: "95", netDividends: "95", grossDividends: "100", dividendTax: "5", positions: [], netContributions: "0" }));
  it("net-only source does not invent gross/tax", () => expect(replay(history([input("d", "DIVIDEND_CASH", 2, { securityId: A, dividend: { gross: null, withholding: null, net: "95" } })]))).toMatchObject({ grossDividends: null, dividendTax: null, netDividends: "95" }));
});
describe("M6.3 Reversal / reconstruction / corporate actions", () => {
  it("VC-L06 deposit reversal preserves original history and negates owner flow", () => {
    const h = history([deposit(), reversal("reverse", "deposit", 2)]);
    expect(h[0].status).toBe("POSTED"); expect(h[1].facts.reversesId).toBe("deposit");
    expect(replay(h, at(1)).cash).toBe("10000"); expect(replay(h)).toMatchObject({ cash: "0", netContributions: "0" });
  });
  it("BUY reversal inverts original acquisition and SELL reversal restores exact released basis/P&L", () => {
    expect(replay(history([deposit(), buy(), reversal("r", "buy", 3)]))).toMatchObject({ payables: "0", positions: [{ quantity: "0", openCost: "0" }] });
    expect(replay(history([deposit(), buy(), sell(), reversal("r", "sell", 9)]))).toMatchObject({ receivables: "0", realizedPnl: "0", positions: [{ quantity: "100", openCost: "1000" }] });
  });
  it("settled trade requires all settlement reversals in one correction group", () => {
    const base = [deposit(), buy(), settlement("s", "buy", "1000", 3)];
    expect(() => replay(history([...base, reversal("r", "buy", 4)]))).toThrow();
    const correction = { correctionGroupId: "fix" };
    expect(replay(history([...base, reversal("01-r-settle", "s", 4, correction), reversal("02-r-buy", "buy", 4, correction), buy("03-corrected", "50", "500", 4, correction)]))).toMatchObject({ cash: "10000", payables: "500", positions: [{ quantity: "50", openCost: "500" }] });
  });
  it("double reversal fails", () => expect(() => history([deposit(), reversal("r1", "deposit", 2), reversal("r2", "deposit", 3)])).toThrow());
  it("deterministic shuffled replay and historical cutoff", () => {
    const h = history(goldenInputs()); expect(replay([...h].reverse())).toEqual(replay(h)); expect(replay(h)).toEqual(replay(h));
    expect(replay(h, at(2)).positions[0].quantity).toBe("100"); expect(replay(h, at(8)).receivables).toBe("890");
  });
  it("backdated removal invalidating a later sale is rejected", () => expect(() => replay(history([deposit(), buy(), sell(), reversal("r", "buy", 3)]))).toThrow());
  it("opening state is evidenced and never owner contribution", () => expect(replay(history([input("open", "OPENING_BALANCE", 1, { amount: "100", securityId: A, quantity: "5", opening: { cost: "40", migrationVersion: "fixture-v1", evidence: "statement" } })]))).toMatchObject({ cash: "100", netContributions: "0", supportedInception: "IMPORTED", positions: [{ quantity: "5", openCost: "40" }] }));
  it.each([["SPLIT", "100", "2", "1", "200", "5"], ["REVERSE_SPLIT", "-50", "1", "2", "50", "20"]])("%s conserves basis", (subtype, delta, numerator, denominator, quantity, averageCost) => {
    expect(replay(history([deposit(), buy(), input("action", "CORPORATE_ACTION", 3, { securityId: A, quantity: delta, corporateAction: { id: "issuer-action", subtype, numerator, denominator, evidence: "official terms", stage: "EFFECTIVE" } })])).positions[0]).toMatchObject({ quantity, averageCost, openCost: "1000", realizedPnl: "0" });
  });
  it("underspecified bonus shares are safely unsupported", () => expect(() => history([input("action", "CORPORATE_ACTION", 3, { securityId: A, quantity: "10", corporateAction: { id: "bonus", subtype: "BONUS", numerator: "1", denominator: "10", evidence: "announcement", stage: "EFFECTIVE" } })])).toThrow());
  it("lightweight invariant: each partial/full exit has nonnegative quantity and conserved released basis", () => {
    for (let sold = 1; sold <= 100; sold++) {
      const s = replay(history([deposit(), buy(), sell("sell", String(sold), String(sold * 15))]));
      expect(s.positions[0].quantity).toBe(String(100 - sold)); expect(s.positions[0].openCost).toBe(String((100 - sold) * 10)); expect(s.realizedPnl).toBe(String(sold * 5));
    }
  });
  it("unknown accounting version blocks instead of silently recomputing", () => { const h = history([deposit()]); expect(() => replay([{ ...h[0], accountingMethod: "unknown" as typeof ACCOUNTING_METHOD }])).toThrow(); });
  it("watermark is metadata independent from economic ordering", () => expect(reconstructPortfolio(P, history([deposit()]), NOW, watermark("12")).ledgerWatermark).toBe("12"));
});

describe("M6.3 corporate-action accounting stages", () => {
  it("rights subscription recognizes explicit basis once; later corporate settlement clears only cash/payable", () => {
    const terms = { id: "rights", subtype: "RIGHTS_SUBSCRIPTION", numerator: "1", denominator: "1", evidence: "exercise confirmation", stage: "EFFECTIVE" as const, basis: "200" };
    const h = history([deposit(), input("exercise", "CORPORATE_ACTION", 2, { securityId: A, quantity: "20", amount: "200", corporateAction: terms }), input("paid", "CORPORATE_ACTION", 3, { securityId: A, amount: "200", corporateAction: { ...terms, stage: "SETTLEMENT", originatingTransactionId: input("exercise", "CORPORATE_ACTION", 2).id } })]);
    expect(replay(h, at(2))).toMatchObject({ cash: "10000", payables: "200", positions: [{ quantity: "20", openCost: "200" }] });
    expect(replay(h)).toMatchObject({ cash: "9800", payables: "0", positions: [{ quantity: "20", openCost: "200" }] });
  });
  it("documented full merger transfers all basis and its reversal restores both securities", () => {
    const other = buy("other").securityId!.replace("a", "b") as typeof A;
    const h = history([deposit(), buy(), input("merge", "CORPORATE_ACTION", 3, { securityId: A, quantity: "-100", corporateAction: { id: "merger", subtype: "MERGER", numerator: "1", denominator: "2", evidence: "confirmed exchange", stage: "EFFECTIVE", basis: "1000", destinationSecurityId: other, destinationQuantity: "50" } }), reversal("undo-merge", "merge", 4)]);
    expect(replay(h, at(3)).positions).toMatchObject([{ quantity: "0", openCost: "0" }, { quantity: "50", openCost: "1000" }]);
    expect(replay(h).positions).toMatchObject([{ quantity: "100", openCost: "1000" }, { quantity: "0", openCost: "0" }]);
  });
  it("opening reversal inverts the explicit basis posting exactly once", () => {
    const h = history([input("open", "OPENING_BALANCE", 1, { securityId: A, quantity: "5", opening: { cost: "40", migrationVersion: "fixture-v1", evidence: "statement" } }), reversal("r", "open", 2)]);
    expect(replay(h).positions[0]).toMatchObject({ quantity: "0", openCost: "0" });
  });
});
it("exceptional cash adjustment requires reason/evidence/note and remains separate from contributions", () => {
  const h = history([deposit(), input("adjust", "CASH_ADJUSTMENT", 2, { amount: "-5", adjustment: { reasonCode: "VERIFIED_CASH_CORRECTION", evidence: "statement investigation", note: "resolved standalone source discrepancy" } })]);
  expect(replay(h)).toMatchObject({ cash: "9995", cashAdjustments: "-5", netContributions: "10000", realizedPnl: "0" });
});

it.each(["NET_SETTLEMENT", "SPLIT_SETTLEMENT"] as const)("SELL %s settlement applies supplied fee/tax exactly once", representation => {
  const h = history([deposit(), buy(), settlement("buy-paid", "buy", "1000", 3),
    sell("sale", "60", "900", 4, { fee: "9", tax: "1", representation }), settlement("sale-paid", "sale", "890", 5)]);
  expect(replay(h, at(4))).toMatchObject({ cash: "9000", receivables: "890", realizedPnl: "290", positions: [{ quantity: "40", openCost: "400" }] });
  expect(replay(h)).toMatchObject({ cash: "9890", receivables: "0", realizedPnl: "290", positions: [{ quantity: "40", openCost: "400" }] });
});
it("documented non-realizing spinoff transfers explicit basis without creating profit, reversal restores it", () => {
  const destination = buy("destination").securityId!.replace("a", "b") as typeof A;
  const h = history([deposit(), buy(), input("spin", "CORPORATE_ACTION", 3, { securityId: A, quantity: "0", corporateAction: {
    id: "spinoff", subtype: "SPINOFF", numerator: "1", denominator: "5", evidence: "approved basis allocation", stage: "EFFECTIVE", basis: "200", destinationSecurityId: destination, destinationQuantity: "20",
  } }), reversal("reverse-spin", "spin", 4)]);
  expect(replay(h, at(3))).toMatchObject({ realizedPnl: "0", positions: [{ quantity: "100", openCost: "800" }, { quantity: "20", openCost: "200" }] });
  expect(replay(h)).toMatchObject({ realizedPnl: "0", positions: [{ quantity: "100", openCost: "1000" }, { quantity: "0", openCost: "0" }] });
});
it("a later method cannot reinterpret an original acquisition during reversal", () => {
  const h = history([deposit(), buy(), reversal("reverse", "buy", 3)]);
  expect(() => replay(h.map(t => t.facts.id === "buy" ? { ...t, accountingMethod: "unknown-v2" as typeof ACCOUNTING_METHOD } : t))).toThrow();
});
it("corporate-stage uniqueness is a replay invariant for every input permutation and historical cutoff", () => {
  const corporateAction = { id: "duplicate-stage", subtype: "SPLIT", numerator: "2", denominator: "1", evidence: "issuer", stage: "EFFECTIVE" as const };
  const h = history([deposit(), buy(), input("original", "CORPORATE_ACTION", 3, { securityId: A, quantity: "100", corporateAction }), reversal("reverse", "original", 5),
    input("duplicate", "CORPORATE_ACTION", 4, { securityId: A, quantity: "200", corporateAction })]);
  for (let offset = 0; offset < h.length; offset++) {
    const permuted = [...h.slice(offset), ...h.slice(0, offset)];
    expect(replay(permuted, at(3)).positions[0].quantity).toBe("200");
    for (const cutoff of [at(4), at(5), NOW]) expect(() => replay(permuted, cutoff)).toThrow();
  }
});
