// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/fundamentals/retained-research", () => ({ readRetainedResearch: vi.fn() }));
import { readRetainedResearch } from "@/infrastructure/fundamentals/retained-research";
import { loadDashboard } from "../../app/server/dashboard";
import { testDatabase } from "../fixtures/database";
import { setupFreshnessSnapshot } from "../fixtures/data-freshness";

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

it("withholds unverifiable optional research while preserving independently sealed data", async () => {
  const db = await testDatabase();
  try {
    await setupFreshnessSnapshot(db);
    vi.stubEnv("DATABASE_URL", db.config.url);
    vi.mocked(readRetainedResearch).mockRejectedValue(new Error("invalid retained research manifest"));
    const model = await loadDashboard("data", "run-ui-data");
    expect(model.retainedResearch).toBeUndefined();
    expect(vi.mocked(readRetainedResearch)).toHaveBeenCalledOnce();
    expect(model.manualFundamentalsIssue).toContain("could not be verified");
    expect(model.dataFreshness?.status).toBe("VERIFIED");
    expect(model.dataFreshness?.snapshot?.runId).toBe("run-ui-data");
    expect(model.dataFreshness?.counts.universe).toBe(1);
    expect(model.dataFreshness?.review.status).not.toBe("VERIFIED");
  } finally { await db.close(); }
});
