// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/fundamentals/manual-current", () => ({ readManualCurrentSnapshot: vi.fn() }));
import { readManualCurrentSnapshot } from "@/infrastructure/fundamentals/manual-current";
import { loadDashboard } from "../../app/server/dashboard";
import { testDatabase } from "../fixtures/database";
import { setupFreshnessSnapshot } from "../fixtures/data-freshness";

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

it("withholds unverifiable optional research while preserving independently sealed data", async () => {
  const db = await testDatabase();
  try {
    await setupFreshnessSnapshot(db);
    vi.stubEnv("DATABASE_URL", db.config.url);
    vi.mocked(readManualCurrentSnapshot).mockRejectedValue(new Error("missing historical PDF"));
    const model = await loadDashboard("data", "run-ui-data");
    expect(model.manualFundamentals).toBeUndefined();
    expect(model.manualFundamentalsIssue).toContain("could not be verified");
    expect(model.dataFreshness?.status).toBe("VERIFIED");
    expect(model.dataFreshness?.snapshot?.runId).toBe("run-ui-data");
    expect(model.dataFreshness?.counts.universe).toBe(1);
    expect(model.dataFreshness?.review.status).not.toBe("VERIFIED");
  } finally { await db.close(); }
});
