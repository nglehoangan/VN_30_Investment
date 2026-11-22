import { readFileSync } from "node:fs";
import { notFound } from "next/navigation";
import { manifestDigest } from "@/infrastructure/fundamentals/snapshot-hash";
import { Metrics, Panel, Table } from "@/ui/primitives";
import { ScoringDetailsShell } from "@/ui/scoring-details-shell";
import type ScoreArtifact from "../../docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e/TCB_FINAL_SCORE_ARTIFACT.json";

export const runtime = "nodejs";

const artifactPath = "docs/fundamental-data-engine/tcb-scoring-readiness/2026-11-22/exec-c636021bde64b53de84eb66e/TCB_FINAL_SCORE_ARTIFACT.json";
const artifactHash = "5c4bfe87749c8eee163cb7d86e20452dbb2994652bb4313c904a83a3d521d4cc";

export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();

  const bytes = readFileSync(artifactPath, "utf8");
  if (manifestDigest(bytes) !== artifactHash) throw new Error("TCB_SCORE_ARTIFACT_INTEGRITY");
  const { card, authorization } = JSON.parse(bytes) as typeof ScoreArtifact;
  const coverage = card.limitedCoverage;

  return <ScoringDetailsShell route="tcb-scoring" title="TCB · Kết quả chấm điểm">
    <Panel title="Bản xem trước nội bộ">
      <Metrics values={{
        "Ngày chốt": authorization.economicCutoff,
        "Trạng thái": coverage.status,
        "Điểm xác nhận": `${coverage.confirmedScore}/${coverage.ratedMaxPoints}`,
        "Rubric đã chấm": `${coverage.ratedRubricCount}/${coverage.totalRubricCount}`,
        "Điểm tổng chính thức": coverage.fullOfficialScore ?? "—",
        "Xếp hạng": "Không đủ điều kiện",
        "Phân bổ vốn": "Chưa được phê duyệt",
      }} />
    </Panel>
    <Panel title="Kết quả theo rubric">
      <Table headers={["Rubric", "Điểm", "Tối đa", "Căn cứ"]}
        rows={card.subcategories.map(rubric => [
          rubric.id, rubric.points ?? "N/R", rubric.max,
          rubric.assessment?.rationale ?? "Chưa được chấm trong phạm vi đã duyệt.",
        ])} />
    </Panel>
  </ScoringDetailsShell>;
}
