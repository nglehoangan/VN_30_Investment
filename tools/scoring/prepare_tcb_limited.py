"""Read-only preparation and challenge checks for the approved TCB assessment."""
import hashlib
import json
from pathlib import Path

from vn30_score import ROOT, prepare_route
from argparse import Namespace


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked(pin):
    path = ROOT / pin["path"]
    if digest(path) != pin["sha256"]:
        raise ValueError(f"Source hash mismatch: {pin['path']}")
    return json.loads(path.read_text())


def review():
    directory = next((ROOT / "docs/fundamental-data-engine/tcb-scoring-readiness").glob(
        "*/*/TCB_EXPANDED_SCORING_ROUTE_CANDIDATE.json"
    ))
    route = json.loads(directory.read_text())
    scope = checked(route["limitedScopeApproval"])
    proposal = checked(route["limitedScopeProposal"])
    assessment = checked(route["assessment"])
    reference = checked(route["reference"])
    accepted = json.loads(directory.with_name("TCB_SCORING_DATA_ACCEPTANCE.json").read_text())
    subject = route["subject"]
    entry = assessment["input"]
    expected = {"FH-BS": 3, "VAL-PRIMARY": 4, "VAL-RET": 4, "VAL-MOS": 0}
    approved = scope["eligibleRubrics"]
    actual = {row["subcategory"]: row["selectedPoints"] for row in entry["assessments"]}
    evidence_ids = {row["id"] for row in entry["evidence"]}
    required_topics = {
        "FH-BS": {"capital", "asset_quality", "funding", "leverage_context"},
        "VAL-PRIMARY": {"primary_model", "normalized_denominator", "price", "cross_check"},
        "VAL-RET": {"starting_value", "growth", "exit_value", "distributions", "dilution", "scenarios"},
        "VAL-MOS": {"conservative_value", "downside", "balance_sheet"},
    }
    preparation = {
        "tickerAndCutoff": (subject["ticker"], subject["cutoff"]) == ("TCB", "2026-10-30")
        and (scope["ticker"], scope["cutoff"]) == ("TCB", "2026-10-30")
        and reference["context"]["ticker"] == "TCB"
        and reference["context"]["economicCutoff"] == subject["cutoff"]
        and reference["context"]["securityId"] == subject["securityId"] == entry["securityId"],
        "scopePin": scope["proposalSha256"] == route["limitedScopeProposal"]["sha256"]
        and approved == proposal["scope"]["eligible"] and scope["ratedWeight"] == 26,
        "dataset": assessment["datasetHash"] == accepted["datasetHash"] == scope["datasetHash"],
        "assessmentTopics": all(
            {item["topic"] for item in row["evidence"]} == required_topics[row["subcategory"]]
            and all(item["refs"] and set(item["refs"]) <= evidence_ids for item in row["evidence"])
            for row in entry["assessments"]
        ),
        "sourcePins": all(digest(ROOT / path) == sha for path, sha in proposal["inputPins"].items()),
    }
    challenge = {
        "pointsMatchApprovedProposal": actual == expected
        and len(entry["assessments"]) == len(expected)
        and set(actual) == set(approved)
        and actual == {
            r["rubric"]: r["candidatePoints"] for r in proposal["rubrics"]
            if r["candidatePoints"] is not None
        },
        "unratedExcluded": len(scope["unratedRubrics"]) == 19
        and not (set(scope["unratedRubrics"]) & set(actual)),
        "counterevidence": all(
            row["disconfirmingEvidence"] and set(row["disconfirmingEvidence"]) <= evidence_ids
            for row in entry["assessments"]
        ),
        "metricReferences": len({r["metric"] for r in assessment["metricDecisions"]})
        == len(assessment["metricDecisions"]) == 19
        and all(r["evidenceRefs"] and set(r["evidenceRefs"]) <= evidence_ids
                for r in assessment["metricDecisions"]),
        "m1Preserved": accepted["gates"]["M1"] == "NOT_GRANTED"
        and (entry["stage0"]["status"], entry["hardVeto"]["status"],
             entry["residualRisk"]["status"]) == ("UNKNOWN", "PENDING", "NOT_RATED"),
    }
    if not all((*preparation.values(), *challenge.values())):
        raise ValueError({"preparation": preparation, "challenge": challenge})
    args = Namespace(ticker="TCB", cutoff="2026-10-30", universe_version=subject["universeVersion"],
                     candidate=directory, previous_proposal=None)
    return {
        "contract": "tcb-limited-readonly-review-v1",
        "scope": approved,
        "assessment": route["assessment"],
        "scopeApproval": route["limitedScopeApproval"],
        "reviewChecks": {"PREPARATION": preparation, "CHALLENGE": challenge},
        "formalReviewTrusted": False,
        "governedPrepare": prepare_route(args),
        "remainingAuthority": [
            "Approved TCB limited-coverage scoring executable and methodology registration",
            "Accepted TCB M1 disposition",
            "Trusted review bindings for the exact final assessment and methodology",
        ],
    }


if __name__ == "__main__":
    print(json.dumps(review(), ensure_ascii=False, indent=2))
