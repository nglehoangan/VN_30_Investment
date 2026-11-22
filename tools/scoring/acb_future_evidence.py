"""Record a manually scoped ACB evidence event. Never admits facts or scores."""
import argparse
from contextlib import closing
from datetime import date, datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
from urllib.parse import urlparse

CUTOFF = date(2026, 10, 30)
PREDECESSORS = {
    "AVAILABLE": {None}, "CAPTURED": {None, "AVAILABLE"}, "VALIDATED": {"CAPTURED"},
    "ADMITTED": {"VALIDATED"}, "REJECTED": {"CAPTURED", "VALIDATED"},
    "SUPERSEDED": {"CAPTURED", "VALIDATED", "ADMITTED"},
}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(data):
    return hashlib.sha256(data).hexdigest()


FIELD_RUBRICS = {
    "maturityGap": {"FH-LIQ", "FH-STRESS"}, "eligibleCollateral": {"FH-LIQ", "FH-STRESS"},
    "facilityAvailability": {"FH-LIQ", "FH-STRESS"}, "fundingMix": {"FH-STRESS", "GQ-FWD"},
    "creditGrowth": {"GQ-FWD"}, "creditCost": {"GQ-FWD"}, "pledgedAssets": {"FH-LIQ", "FH-STRESS"},
    "unencumberedAssets": {"FH-LIQ", "FH-STRESS"}, "liquidityStressCosts": {"FH-STRESS"},
    "parentCapital": {"VAL-PRIMARY"}, "parentRwa": {"VAL-PRIMARY", "FH-STRESS"},
    "relatedPartyAmounts": {"RG-RISK"}, "subsidiaryNetIncome": {"CA-REINV"},
    "peerFundingCosts": {"BQ-MOAT", "IC-POS"}, "customerRetention": {"BQ-MOAT", "IC-POS"},
    "segmentReturns": {"BQ-MOAT", "IC-POS", "GQ-FWD"}, "sustainableRoe": {"VAL-PRIMARY", "GQ-FWD"},
    "distributionCapacity": {"VAL-PRIMARY"}, "conflictControlsApplied": {"RG-GOV", "RG-RISK"},
    "transactionTerms": {"RG-GOV", "RG-RISK"}, "transactionAmounts": {"RG-RISK"},
    "independentOversight": {"RG-GOV", "RG-RISK"}, "unencumberedHqla": {"FH-LIQ", "FH-STRESS"},
    "haircuts": {"FH-LIQ", "FH-STRESS"}, "runoffAssumptions": {"FH-STRESS"},
    "stressCapital": {"FH-STRESS", "VAL-PRIMARY"}, "depositMix": {"FH-STRESS", "FH-LIQ"},
    "acbsConsolidatedNetIncome": {"CA-REINV"}, "acbaNetIncome": {"CA-REINV"},
    "capitalPaidDate": {"CA-REINV"}, "capitalInServiceDate": {"CA-REINV"},
}


def verify_admission(connection, event, validated, source_hash):
    cutoff = validated["request"]["reassessmentCutoff"]
    receipt = connection.execute(
        """SELECT body,body_hash,security_id FROM current_financial_admission
           WHERE id=? AND ticker='ACB' AND economic_cutoff=?""",
        (event.get("admissionId"), cutoff),
    ).fetchone()
    if not receipt or digest(receipt[0].encode()) != receipt[1]:
        raise ValueError("Matching governed BANK admission receipt is required")
    body = json.loads(receipt[0])
    context = body.get("context", {})
    if (body.get("contract") != "governed-bank-current-admission-v1"
            or context.get("ticker") != "ACB" or context.get("economicCutoff") != cutoff
            or context.get("securityId") != receipt[2]):
        raise ValueError("Governed admission scope mismatch")
    facts = [fact for fact in body.get("facts", []) if fact.get("rawHash") == source_hash]
    if not facts:
        raise ValueError("No governed fact references these source bytes")
    targets = [event["admissionId"], *[fact["id"] for fact in facts]]
    for target in targets:
        if connection.execute("SELECT 1 FROM source_admission_event WHERE target_id=?", (target,)).fetchone():
            raise ValueError("Admission receipt or source facts are quarantined or revoked")


def record(connection, event, source_bytes):
    """Insert event and any candidate in the caller's transaction."""
    report_id, status = event["reportId"], event["status"]
    row = connection.execute("SELECT body FROM acb_future_evidence WHERE id=?", (report_id,)).fetchone()
    if not row or status not in PREDECESSORS:
        raise ValueError("Unknown report or status")
    report = json.loads(row[0])
    if event["ticker"] != "ACB" or event["reportingPeriod"] != report["reportingPeriod"]:
        raise ValueError("Report issuer or period mismatch")
    allowed_issuers = {"ACBS", "ACBA", "ACB"} if report_id == "subsidiaries" else {"ACB"}
    if event["issuer"] not in allowed_issuers:
        raise ValueError("Unexpected document issuer")
    published = date.fromisoformat(event["actualPublicationDate"])
    review_date = event.get("nextReviewDate")
    if review_date:
        date.fromisoformat(review_date)
    source_url = urlparse(event["sourceUrl"])
    today = datetime.now(timezone.utc).date()
    if not source_url.hostname or source_url.scheme != "https" or source_url.username:
        raise ValueError("A direct HTTPS source URL is required")
    if not CUTOFF < published <= today or published < date.fromisoformat(report["periodEnd"]):
        raise ValueError("Publication date is outside the follow-up reporting period")
    source_hash = digest(source_bytes)
    if not source_bytes or event["sourceHash"] != source_hash:
        raise ValueError("Source bytes do not match expected SHA-256")
    fields = event.get("fields", {})
    if not isinstance(fields, dict) or set(fields) - set(report["missingFields"]):
        raise ValueError("Unexpected extracted field")
    for field in fields.values():
        if not isinstance(field, dict) or not isinstance(field.get("value"), str) or not field["value"].strip() or not field.get("locator"):
            raise ValueError("Each extracted field requires a value and an exact source locator")
    previous = connection.execute(
        "SELECT status,body FROM acb_future_evidence_event WHERE report_id=? AND source_hash=? ORDER BY seq DESC",
        (report_id, source_hash),
    ).fetchall()
    for old_status, old_body in previous:
        stored = json.loads(old_body)
        if old_status == status:
            if stored["request"] != event:
                raise ValueError("Conflicting duplicate evidence event")
            return stored.get("candidateId")
        if any(stored["request"][key] != event[key] for key in ("issuer", "sourceUrl", "actualPublicationDate")):
            raise ValueError("Source identity changed for the same bytes")
    if (previous[0][0] if previous else None) not in PREDECESSORS[status]:
        raise ValueError("Invalid evidence transition")
    if status in {"REJECTED", "SUPERSEDED"} and not event.get("reason"):
        raise ValueError("A rejection or supersession reason is required")
    candidate_id = None
    if status == "VALIDATED":
        cutoff = date.fromisoformat(event["reassessmentCutoff"])
        if not fields or not event.get("identityBasis") or not published <= cutoff <= today:
            raise ValueError("Validated fields, issuer/period/date evidence and an eligible new cutoff are required")
        candidate_id = digest(canonical([report_id, source_hash, cutoff.isoformat()]).encode())
        closure = json.loads(connection.execute("SELECT body FROM acb_research_closure").fetchone()[0])
        affected = sorted(set(report["rubrics"]) & set().union(*(FIELD_RUBRICS[field] for field in fields)))
        if not affected:
            raise ValueError("Extracted fields do not map to the expected rubrics")
        candidate = {
            "ticker": "ACB", "cutoff": cutoff.isoformat(), "priorCutoff": CUTOFF.isoformat(),
            "sourceHashes": [source_hash], "fields": fields, "rubrics": affected,
            "comparison": {r["rubric"]: {"priorPoints": r["points"], "priorGap": r["missingInformation"]}
                           for r in closure["rubrics"] if r["rubric"] in affected},
            "priorConfirmedScore": closure["confirmedScore"], "priorRatedMaxPoints": closure["ratedMaxPoints"],
            "status": "PENDING_ANALYST_CIO_REVIEW",
            "requirements": ["Governed source admission", "New cutoff dataset and assessment reviews", "Exact CIO route authorization"],
        }
        connection.execute("INSERT INTO acb_reassessment_candidate VALUES (?,?,?)", (candidate_id, report_id, canonical(candidate)))
    if status == "ADMITTED":
        verify_admission(connection, event, json.loads(previous[0][1]), source_hash)
    connection.execute("INSERT INTO acb_future_evidence_source VALUES (?,?) ON CONFLICT(source_hash) DO NOTHING",
                       (source_hash, source_bytes))
    observed = {"request": event, "checkedAt": datetime.now(timezone.utc).isoformat(), "candidateId": candidate_id}
    connection.execute(
        "INSERT INTO acb_future_evidence_event(report_id,status,source_hash,body) VALUES (?,?,?,?)",
        (report_id, status, source_hash, canonical(observed)),
    )
    return candidate_id


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", required=True, type=Path)
    parser.add_argument("--event", required=True, type=Path)
    parser.add_argument("--source", required=True, type=Path)
    args = parser.parse_args()
    try:
        with closing(sqlite3.connect(args.database.resolve().as_uri() + "?mode=rw", uri=True)) as conn, conn:
            conn.execute("PRAGMA foreign_keys=ON")
            conn.execute("BEGIN IMMEDIATE")
            candidate = record(conn, json.loads(args.event.read_text()), args.source.read_bytes())
        print(canonical({"candidateId": candidate}))
    except (OSError, sqlite3.Error, KeyError, ValueError, TypeError) as error:
        parser.exit(2, f"{error}\n")


if __name__ == "__main__":
    main()
