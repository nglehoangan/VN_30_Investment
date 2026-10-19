import type { ReactNode } from "react";

export function Status({ children }: { children: ReactNode }) { return <span className="status">{children}</span>; }

export function Panel({ title, children }: { title: string; children: ReactNode }) { return <section aria-label={title}><h2>{title}</h2>{children}</section>; }

export function Metrics({ values }: { values: Record<string, unknown> }) { return <dl className="metrics">{Object.entries(values).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value == null ? "Unavailable" : String(value)}</dd></div>)}</dl>; }

export function Fields({ values }: { values: Record<string, ReactNode> }) {
  return <dl className="evidence">{Object.entries(values).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? "UNKNOWN / Unavailable"}</dd></div>)}</dl>;
}

export function Table({ headers, rows, empty = "No records available." }: { headers: readonly string[]; rows: readonly (readonly ReactNode[])[]; empty?: string | null }) {
  return rows.length || empty === null ? <div className="table-scroll" role="region" aria-label={headers.join(", ")} tabIndex={0}><table><thead><tr>{headers.map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell ?? "Unavailable"}</td>)}</tr>)}</tbody></table></div> : <p className="empty">{empty}</p>;
}
