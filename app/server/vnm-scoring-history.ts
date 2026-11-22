import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { assertPrivateLocation, loadDatabaseConfig } from "@/infrastructure/config/database";
import { snapshotHash } from "@/infrastructure/fundamentals/snapshot-hash";

const id = "VNM-current-remediation-unadopted";
const publicationHash = "ce74558f300b61e33dc0ecf849ec5085dc2320ce7f1b875c1630c4afefc6a463";

type Rubric = {
  id: string; points: number | null; max: number; missingTopics: string[];
  assessment: { assessment: string; assessedAt: string; rationale: string; evidence: { topic: string; rationale: string }[] } | null;
};

type Card = {
  id: string; ticker: string; totalScore: string; confidence: string; validity: string;
  asOf: string; calculatedAt: string; operationalAuthorizationGranted: boolean; subcategories: Rubric[];
};

function verifiedBody(row: Record<string, unknown> | undefined) {
  if (typeof row?.body !== "string" || createHash("sha256").update(row.body).digest("hex") !== row.body_hash) {
    throw new Error("VNM archived record failed integrity verification");
  }
  return row.body;
}

/** A historical PUB-04 snapshot. The live governed publication reader remains the current authority. */
export function readVnmScoringHistory(): Card {
  const config = loadDatabaseConfig(process.env, process.cwd());
  const file = realpathSync(config.filePath);
  assertPrivateLocation(file, config.projectDirectory);
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    db.exec("BEGIN");
    const publicationRow = db.prepare("SELECT body,body_hash FROM analytical_artifact WHERE id=? AND kind='SCORECARD'").get(id);
    const publication = JSON.parse(verifiedBody(publicationRow));
    const { card, authorization } = JSON.parse(verifiedBody(db.prepare("SELECT body,body_hash FROM current_score_artifact WHERE id=?").get(id)));
    if (publicationRow?.body_hash !== publicationHash || publication.scorecardId !== id ||
        card.id !== id || card.ticker !== "VNM" || snapshotHash(card) !== publication.scorecardHash ||
        card.operationalAuthorizationGranted !== false) {
      throw new Error("VNM archived publication mismatch");
    }
    const revoked = db.prepare("SELECT 1 FROM source_admission_event WHERE target_id=? AND kind IN ('QUARANTINE','REVOCATION')");
    for (const target of [id, publication.authorityReference, publication.authorityHash, authorization.reference.bindingId, authorization.dataAcceptanceId]) {
      if (typeof target !== "string" || revoked.get(target)) throw new Error("VNM archived publication unavailable");
    }
    return card as Card;
  } finally {
    db.close();
  }
}
