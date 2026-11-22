import Link from "next/link";
import type { ReactNode } from "react";
import { navigation } from "./navigation";

export function ScoringDetailsShell({ route, title, children }: { route: string; title: string; children: ReactNode }) {
  return <div className="app-shell"><aside>
    <Link className="brand" href="/">VN30<span>Value Investing OS</span></Link>
    <nav aria-label="Primary navigation">{navigation.map(group => <div className="nav-group" key={group.group}>
      <p>{group.group}</p>{group.items.map(([id, label]) =>
        <Link key={id} href={`/${id}`} aria-current={id === route ? "page" : undefined}>{label}</Link>)}
    </div>)}</nav>
  </aside><main id="main" tabIndex={-1}>
    <h1>{title}</h1>
    {children}
  </main></div>;
}
