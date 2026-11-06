# Four-bank dependency validation - PASS

Original P1 edge direction, DAG validation and status-only conflict propagation are reused. Qualified source/calculation edges propagate; unreviewed display/candidate/provider references never grant eligibility. Exact source bindings and shared PDF hash dependencies remain explicit.

CTG: 1922 nodes, 1430 edges;23 rubric nodes, all topic nodes fullTopicQualified=false.
MBB: 3189 nodes, 2117 edges;23 rubric nodes, all topic nodes fullTopicQualified=false.
TCB: 2764 nodes, 1905 edges;23 rubric nodes, all topic nodes fullTopicQualified=false.
VCB: 2231 nodes, 1515 edges;23 rubric nodes, all topic nodes fullTopicQualified=false.

Actual controlled metric and source-pointer conflict injected for every issuer at FY2025 customer-loan reserves. Reserve/gross-loan and dependent asset-quality/risk topics become conflicted; loan/deposit, total assets, BQ-MOAT and every other bank remain unaffected. The merged graph probe verifies no cross-issuer contamination. Original metric/rubric objects are not mutated.

conflict-injection-results.json retains exact changed IDs, complete affected status overlays, all unaffected node IDs within each graph and zero other-bank dependents. The tests also reject dangling edges, cycles, foreign issuer additions, unsupported scores/topics and changed source bytes.

A changed shared PDF or shared source file can correctly invalidate all actual bindings to that authority; this is distinct from a cell-local/metric-local overlay. No blanket issuer veto is used for a single topic conflict. See dependency-graphs/, conflicts/, test-results.json and validation-results.json.
