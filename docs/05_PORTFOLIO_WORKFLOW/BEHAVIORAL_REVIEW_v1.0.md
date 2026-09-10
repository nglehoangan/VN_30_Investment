# VN30 Value Investing OS — Behavioral Review

**Document:** `05_PORTFOLIO_WORKFLOW/BEHAVIORAL_REVIEW.md`  
**Milestone:** 5 — Portfolio Management Workflow  
**Status:** Approved Baseline  
**Version:** 1.0  
**Date:** 2026-09-08  

**Parent:** `05_PORTFOLIO_WORKFLOW/OPERATING_MODEL.md` v1.0 — Approved Baseline

---

# 1. Purpose

Behavioral Review detects recurring decision errors caused by human or AI bias and determines whether process controls should be improved.

It must answer:

> Was the decision process distorted by bias, and how should recurrence be reduced?

Behavioral Review is a learning/control layer, not a replacement for fundamental analysis, valuation, risk review, or M4 decision logic.

---

# 2. Core Principles

1. A bad outcome does not prove a bad decision.
2. A good outcome does not validate a biased decision.
3. Inaction can be biased as well as action.
4. Bias findings require evidence, not hindsight.
5. Repeated patterns matter more than isolated incidents.
6. Behavioral findings must not silently rewrite policy or decision rules.

---

# 3. Required Bias Taxonomy

Minimum supported biases:

- FOMO
- Anchoring
- Loss Aversion
- Disposition Effect
- Confirmation Bias
- Recency Bias
- Overconfidence
- Action Bias

Additional supported biases:

- Endowment Effect
- Sunk-Cost Bias
- Availability Bias
- Self-Attribution Bias
- Benchmark Envy
- Herding / Consensus Bias
- Narrative Bias

These are behavioral tags, not investment Decision States.

---

# 4. Cadence

Behavioral Review occurs:

- inside material Journal entries;
- during 3/6/12-month Decision Audit;
- during Annual Review;
- after a material decision error;
- when repeated behavioral patterns emerge.

A consolidated Behavioral Review should be produced at least annually.

---

# 5. Required Inputs

- Decision IDs
- Journal Entry IDs
- original thesis
- original valuation
- original risk assessment
- original opportunity-cost comparison
- original invalidation conditions
- original evidence
- execution record
- later outcome
- applicable policy/method versions

Contemporaneous evidence takes precedence over hindsight.

---

# 6. Workflow

```text
1. Select decision/pattern
2. Reconstruct contemporaneous context
3. Separate known facts from later outcomes
4. Identify possible bias
5. Find evidence for/against bias
6. Check rule/process deviation
7. Grade decision quality
8. Grade outcome quality
9. Define control
10. Determine isolated vs recurring pattern
11. Record Behavioral Finding
12. Escalate recurring pattern to Lessons/process improvement
```

---

# 7. FOMO

Indicators:

- compressed research due to rising price;
- relaxed valuation hurdle;
- urgency driven by popularity/news;
- oversizing due to fear of missing out.

Control:

> Would the decision still be valid if recent price movement had not occurred?

Normal valuation, risk, and sizing gates still apply.

---

# 8. Anchoring

Common anchors:

- purchase price;
- prior target price;
- recent high/low;
- old valuation multiple;
- old ranking.

Control:

Recalculate from current fundamentals and intrinsic value.

---

# 9. Loss Aversion

Indicators:

- delaying SELL after thesis break;
- waiting for break-even;
- refusing to classify WEAKENING/BROKEN;
- adding mainly to lower cost basis.

Control:

> If unowned today, would we buy this security now?

Cost basis must not determine thesis quality.

---

# 10. Disposition Effect

Indicators:

- selling because gain reached ~20%;
- early profit-taking without valuation/risk reason;
- retaining losers without thesis support.

Control:

Use current intrinsic value, forward return, thesis, sizing, and opportunity cost.

---

# 11. Confirmation Bias

Indicators:

- repeatedly dismissing negative evidence as temporary without proof;
- accepting management explanations uncritically;
- ignoring contradictory data.

Control:

Mandatory field:

> Strongest disconfirming evidence.

---

# 12. Recency Bias

Indicators:

- one quarter dominates a 5–10 year thesis;
- recent crash is treated as permanent impairment;
- recent rally is extrapolated;
- small rank movement drives allocation.

Control:

Compare new evidence with normalized history, cycle context, and original thesis.

---

# 13. Overconfidence

Indicators:

- narrow valuation range;
- oversizing;
- ignoring confidence status;
- no downside case;
- estimates treated as facts.

Control:

Require range valuation, downside case, confidence, explicit assumptions, and uncertainty-aware sizing.

---

# 14. Action Bias

Indicators:

- trading because review day arrived;
- treating monthly DCA as forced spending;
- switching on marginal rank differences;
- trading merely to change dashboard status.

Control:

`NO ACTION`, `HOLD POSITION`, and `HOLD CASH` remain valid outcomes.

---

# 15. Additional Bias Controls

## Endowment Effect
Evaluate owned stock as if allocating capital today.

## Sunk-Cost Bias
Prior capital/time/research must not determine current allocation.

## Availability Bias
Media prominence does not equal economic materiality.

## Self-Attribution Bias
Ask whether outcome happened for the originally expected reason.

## Benchmark Envy
VN30 is comparator, not portfolio instruction.

## Herding
Consensus cannot substitute for independent thesis.

## Narrative Bias
Narratives must tie to measurable economics.

---

# 16. Severity

Use:

- `OBSERVATION`
- `WATCH`
- `WARNING`
- `BREACH`

Meaning:

- OBSERVATION: possible indicator, no material process impact.
- WATCH: bias affected reasoning but control worked.
- WARNING: bias materially weakened decision process.
- BREACH: bias contributed to policy/rule violation or repeated serious failure.

These statuses do not map to M4 Decision States.

---

# 17. Evidence Standard

Do not diagnose bias solely from outcome.

Evidence may include:

- original wording;
- omitted evidence;
- inconsistent hurdle;
- urgency;
- process bypass;
- repeated behavior.

If uncertain:

> `POSSIBLE BIAS — INSUFFICIENT EVIDENCE`

---

# 18. Decision Quality / Outcome Matrix

| Decision Quality | Outcome Quality | Interpretation |
|---|---|---|
| Good | Good | Good process, good result |
| Good | Bad | Good process, adverse result |
| Bad | Good | Lucky outcome; learning required |
| Bad | Bad | Process failure and poor outcome |

Behavioral Review focuses primarily on decision quality.

---

# 19. Repeated Pattern Detection

Examples:

- repeatedly selling near 20% gain;
- repeatedly averaging down for break-even;
- repeatedly holding excessive cash after market declines;
- repeatedly chasing Top-10 changes.

Recurring patterns should trigger:

> `PROCESS IMPROVEMENT REQUIRED`

No rigid occurrence count is invented unless validated later.

---

# 20. Control Design

Controls should be:

- simple;
- observable;
- auditable;
- difficult to bypass emotionally;
- consistent with M1–M4.

Examples:

- FOMO → mandatory valuation refresh.
- Loss aversion → “If unowned, would we buy?” test.
- Confirmation → disconfirming-evidence section.
- Action bias → explicit NO ACTION option.
- Overconfidence → range + downside + confidence.

---

# 21. AI Behavioral Risk

AI-specific risks include:

- fluent overconfidence;
- false precision;
- excessive consistency with prior answer;
- failing to expose uncertainty;
- filling missing data narratively;
- overreacting to recent data;
- producing action because user asks for one.

Controls:

- explicit data-quality status;
- fact/estimate/assumption tagging;
- confidence;
- evidence lineage;
- HOLD CASH / NO ACTION;
- rule precedence.

---

# 22. User-AI Interaction Bias

Potential prompt pressure:

- “I want to buy something this month.”
- “It fell a lot.”
- “It is already up 20%.”
- “It is #1 ranked.”
- “Everyone says it is good.”

The AI must not mirror the desired conclusion.

It must return to approved gates.

---

# 23. Behavioral Review Template

## Header
- Behavioral Review ID
- Date
- Decision ID(s)
- Journal Entry ID(s)
- Review Period

## Context
- original decision
- contemporaneous evidence
- original thesis
- original valuation
- original risk
- later outcome

## Bias Assessment
For each bias:
- detected: Yes / No / Possible
- severity
- evidence
- control applied
- residual concern

## Decision Quality
- Good / Bad
- rationale

## Outcome Quality
- Good / Bad
- rationale

## Lesson
- what happened
- why it matters
- generalizable? Yes/No
- recommended control

## Final Behavioral Status
- `NO MATERIAL BIAS`
- `BIAS CONTROLLED`
- `PROCESS IMPROVEMENT REQUIRED`
- `GOVERNANCE REVIEW REQUIRED`

---

# 24. Lessons Governance

Repeated behavioral findings should feed a future append-oriented `LESSONS.md`.

A lesson is not automatically a new policy rule.

Any proposed M1–M4 rule change requires separate governance and approval.

---

# 25. Audit Linkage

```text
Decision ID
→ Journal Entry ID
→ Behavioral Review ID
→ Decision Audit
→ Lessons
→ Process/Policy Proposal if any
```

Original journal records must remain unchanged.

---

# 26. File Update Rules

Behavioral Review may update:

- behavioral review records;
- bias tags;
- Decision Audit links;
- Lessons;
- process-improvement proposals.

It must not directly modify:

- Investment Policy;
- Scoring methodology;
- M4 Decision Engine;
- accounting data.

---

# 27. Stop Conditions

Do not make strong bias claims when:

- original decision record is missing;
- contemporaneous evidence is unavailable;
- evidence is purely outcome-based;
- context is ambiguous.

Use:

> `INSUFFICIENT EVIDENCE FOR BIAS CLASSIFICATION`

---

# 28. Acceptance Criteria

`BEHAVIORAL_REVIEW.md` is acceptable only if:

1. action and inaction are both reviewed;
2. outcome does not validate process;
3. all minimum biases are covered;
4. evidence is required;
5. hindsight-only labeling is prohibited;
6. severity is separate from Decision State;
7. decision/outcome matrix is explicit;
8. recurring patterns feed Lessons;
9. controls are practical/auditable;
10. AI-specific behavioral risk is covered;
11. user-AI interaction bias is covered;
12. no silent policy/rule changes occur;
13. insufficient evidence can block classification.

---

# 29. Multi-Role Review

## CIO
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- behavioral review becoming subjective self-criticism;
- outcome bias;
- lessons turning directly into policy changes.

**Assessment:** PASS.

## Portfolio Manager
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- inaction bias omission;
- benchmark envy/action bias;
- lack of recurring-pattern escalation.

**Assessment:** PASS.

## Equity Research Analyst
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- weak controls against confirmation/narrative bias;
- hindsight contamination;
- management story overwhelming facts.

**Assessment:** PASS.

## Risk Manager
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- overconfidence not tied to sizing/uncertainty;
- weak-evidence psychological labeling;
- bias-driven rule breaches not escalated.

**Assessment:** PASS.

## Investment Operations Manager
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Resolved:
- missing ID lineage;
- behavioral findings rewriting original journal;
- no categorical behavioral status.

**Assessment:** PASS.

## Behavioral Finance Reviewer
**Critical:** 0 unresolved.  
**Major:** 0 unresolved.

Covers:
- FOMO;
- anchoring;
- loss aversion;
- disposition effect;
- confirmation bias;
- recency bias;
- overconfidence;
- action bias;
- endowment;
- sunk cost;
- availability;
- self-attribution;
- benchmark envy;
- herding;
- narrative bias;
- AI-specific behavioral risk.

**Assessment:** PASS.

---

# 30. Consolidated Issue Register

## Critical
**0 unresolved**

## Major
**0 unresolved**

## Minor / Deferred

### B-1 — Numeric recurrence threshold
No rigid incident count is defined.

**Recommendation:** calibrate in later validation.

### B-2 — LESSONS.md not yet created
Behavioral workflow references a future append-oriented learning artifact.

**Recommendation:** introduce only when roadmap/governance permits.

### B-3 — Numeric bias score
Could create false precision.

**Recommendation:** retain categorical evidence-based assessment.

---

# 31. Final Review

**CIO:** PASS  
**Portfolio Manager:** PASS  
**Equity Research Analyst:** PASS  
**Risk Manager:** PASS  
**Investment Operations Manager:** PASS  
**Behavioral Finance Reviewer:** PASS  

**Critical unresolved:** 0  
**Major unresolved:** 0  
**Minor / deferred:** 3  

**Overall design quality:** approximately **9.9/10**.

**Approval Status:** APPROVED BASELINE v1.0.

The next planned file is `05_PORTFOLIO_WORKFLOW/REVIEW_TEMPLATES.md`.
