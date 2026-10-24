# Accounting compatibility decision

The current user request authorizes the smallest lossless compatibility correction. This implementation decision does not constitute source approval or final owner acceptance.

Extend existing `opening` with an optional exact decimal-string `receivable`. When present, validate using the existing decimal contract; reject negative, malformed or out-of-range values. A positive amount generates one RECEIVABLE immediately after CASH and before optional security/basis legs. Zero generates no obligation because the existing obligation invariant requires positive creation. Absent values retain the old leg shape. Original input text remains immutable in facts; derived legs use existing canonical decimal formatting.

CASH, quantity, basis and all other transaction builders retain their existing behavior. Obligations remain independently tracked and excluded from spendable cash. No contribution, dividend income, realized gain, artificial balancing cash or settlement is generated. Existing opening assets remain imported inception assets. This is a typed balance-leg model, not a new double-entry equity account model; NAV algebra remains cash + security value + receivables − payables, but current NAV requires accepted market inputs.

Keep the existing arithmetic/accounting identity: its precision, ordering, cost policy and historical effects are unchanged. Bind compatibility to explicit evidenced opening facts, never transaction-ID exceptions, guessed broker values or trust in projections. Update the strict command schema to match the optional typed field; it still rejects unknown fields. Keep full canonical reader equality and economic replay. Existing reversal semantics link the opposite receivable leg to its original obligation. No new opening-receivable settlement lifecycle is authorized here.

No database writes, migration, financial replacement transactions, policy edits, authorization grants or scoring changes are required.
