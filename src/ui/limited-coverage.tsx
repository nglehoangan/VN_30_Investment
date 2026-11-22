import type { OfficialLimitedCoverage } from "@/domain/current-scoring/limited-coverage";
import { Metrics, Table } from "./primitives";

export function LimitedCoverageView({ coverage }: { coverage: OfficialLimitedCoverage }) {
  return <>
    <p className="notice">OFFICIAL_LIMITED · Excluded from investable ranking and allocation</p>
    <Metrics values={{
      "Rated rubrics": `${coverage.ratedRubricCount}/${coverage.totalRubricCount}`,
      "Original points covered": `${coverage.ratedMaxPoints}/${coverage.totalMaxPoints}`,
      "Points earned on rated rubrics": `${coverage.confirmedScore}/${coverage.ratedMaxPoints}`,
      "Score bounds": `${coverage.scoreLowerBound}–${coverage.scoreUpperBound}`,
    }} />
    <Table headers={["Unrated rubric", "Points", "Original maximum", "Reason"]}
      rows={coverage.dispositions.map(rubric => [rubric.rubricId, "N/R", rubric.maxPoints, rubric.reason])} />
  </>;
}
