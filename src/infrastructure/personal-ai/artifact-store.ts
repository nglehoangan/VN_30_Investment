import { mkdir, mkdtemp, open, link, rm, lstat, readFile, realpath } from "node:fs/promises";
import { resolve, join } from "node:path";
import type { AiScoreArtifact, AiScoreArtifactStore } from "@/ports/personal-ai-scoring";
import { canonicalJson } from "@/domain/fundamentals/snapshot";
import { snapshotHash } from "@/infrastructure/fundamentals/snapshot-hash";
import { check, id, snapshot } from "@/domain/scoring/validation";
import { deepFreeze } from "@/domain/portfolio/transaction";
import { assertPrivateLocation } from "@/infrastructure/config/database";
/** Derived AI artifacts only, isolated from legacy HUMAN artifacts and the financial DB. */
export class FileAiScoreArtifactStore implements AiScoreArtifactStore {
  private readonly directory: string;
  constructor(directory: string, private readonly projectRoot: string) {
    this.directory = resolve(directory); assertPrivateLocation(this.directory, projectRoot);
  }
  private async root(create: boolean) {
    if (create) await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const stat = await lstat(this.directory);
    check(stat.isDirectory() && !stat.isSymbolicLink(), "AI_ARTIFACT_PRIVATE_DIRECTORY_REQUIRED");
    const canonical = await realpath(this.directory);
    assertPrivateLocation(canonical, await realpath(this.projectRoot));
    return canonical;
  }
  async append(record: AiScoreArtifact) {
    id(record.card.id); check(Object.isFrozen(record) && record.contract === "personal-ai-score-artifact-v1", "IMMUTABLE_AI_ARTIFACT_REQUIRED");
    const body = snapshot(record), root = await this.root(true), temporary = await mkdtemp(join(root, ".pending-"));
    try {
      const path = join(temporary, "artifact.json"), handle = await open(path, "wx", 0o600);
      try { await handle.writeFile(canonicalJson({ body, sha256: snapshotHash(body) })); await handle.sync(); } finally { await handle.close(); }
      await link(path, join(root, `${body.card.id}.json`)); // Atomic no-overwrite publication; EEXIST rejects duplicates.
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
  async find(key: string): Promise<AiScoreArtifact | null> {
    id(key);
    try {
      const root = await this.root(false), path = join(root, `${key}.json`), stat = await lstat(path);
      check(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 32000000, "AI_ARTIFACT_FILE_REQUIRED");
      const bytes = await readFile(path, "utf8"), value = snapshot(JSON.parse(bytes)) as { body: AiScoreArtifact; sha256: string };
      check(Object.keys(value).sort().join(" ") === "body sha256" && value.sha256 === snapshotHash(value.body) && bytes === canonicalJson(value) && value.body.contract === "personal-ai-score-artifact-v1" && value.body.card.id === key, "AI_ARTIFACT_INTEGRITY_MISMATCH");
      return deepFreeze(value.body);
    } catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null; throw error; }
  }
}
