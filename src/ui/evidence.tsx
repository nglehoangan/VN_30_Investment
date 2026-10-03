"use client";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
const routes: Record<string, string> = { scorecardId: "scoring", rankingId: "ranking", decisionId: "decisions", baseDecisionId: "decisions", priorDecisionId: "decisions", preferredDecisionId: "decisions", selectedDecisionId: "decisions", marginalAssessmentReference: "audit", reviewId: "reviews", transactionId: "transactions", proposalId: "dca", portfolioSnapshotReference: "audit", snapshotId: "audit" };
/** Mount nested evidence only when expanded: immutable artifacts can contain full pinned input trees. */
function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <details onToggle={event => setOpen(event.currentTarget.open)}><summary>{label}</summary>{open && children}</details>;
}
export function Evidence({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return <span>Unavailable</span>;
  if (typeof value !== "object") return <span>{String(value)}</span>;
  if (depth > 12) return <span>Nested evidence exceeds display depth.</span>;
  if (Array.isArray(value)) return value.length ? <ol className="evidence-list">{value.map((v, i) => <li key={i}>{typeof v === "object" && v !== null ? <Disclosure label={`Inspect record ${i + 1}`}><Evidence value={v} depth={depth + 1} /></Disclosure> : <Evidence value={v} depth={depth + 1} />}</li>)}</ol> : <span>None recorded</span>;
  return <dl className="evidence">{Object.entries(value).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{routes[k] && typeof v === "string" ? <Link href={`/${routes[k]}/${encodeURIComponent(v)}`}>{v}</Link> : typeof v === "object" && v !== null ? <Disclosure label={`Inspect ${k}`}><Evidence value={v} depth={depth + 1} /></Disclosure> : <Evidence value={v} depth={depth + 1} />}</dd></div>)}</dl>;
}
