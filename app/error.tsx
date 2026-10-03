"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main><h1>Workspace unavailable</h1><p role="alert">The view could not be loaded. Capital actions are unavailable until data integrity is verified.</p><button onClick={reset}>Retry read</button></main>; }
