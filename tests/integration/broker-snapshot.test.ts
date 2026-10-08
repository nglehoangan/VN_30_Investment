// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { loadBrokerSnapshot } from "@/infrastructure/broker-snapshot";
import { brokerSnapshotFixture } from "../fixtures/broker-snapshot";

describe("private broker source loading", () => {
  it("requires matching original source bytes and fails closed on tampering", async () => {
    const folder = await mkdtemp(path.join(tmpdir(), "vvios-broker-test-"));
    try {
      const s = brokerSnapshotFixture();
      for (const source of s.sources) {
        const bytes = Buffer.from(`synthetic source ${source.kind}`);
        source.sha256 = createHash("sha256").update(bytes).digest("hex");
        await writeFile(path.join(folder, source.file), bytes, { mode: 0o600 });
      }
      const file = path.join(folder, "snapshot.json");
      await writeFile(file, JSON.stringify(s), { mode: 0o600 });
      expect(await loadBrokerSnapshot(file)).toEqual(s);
      await writeFile(path.join(folder, "cash.png"), "altered evidence");
      await expect(loadBrokerSnapshot(file)).rejects.toThrow("BROKER_SOURCE_HASH_MISMATCH");
    } finally { await rm(folder, { recursive: true, force: true }); }
  });
  it("keeps unconfigured snapshots absent and rejects relative paths", async () => {
    expect(await loadBrokerSnapshot(undefined)).toBeNull();
    await expect(loadBrokerSnapshot("snapshot.json")).rejects.toThrow("ABSOLUTE_BROKER_PATH_REQUIRED");
  });
});
