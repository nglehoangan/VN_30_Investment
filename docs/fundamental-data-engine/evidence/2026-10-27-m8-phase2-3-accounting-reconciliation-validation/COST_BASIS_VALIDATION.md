# MWAC correctness and opening basis provenance

Date: 2026-10-27 (Asia/Ho_Chi_Minh). Phase 2.3 validation/reporting only. No production implementation, posting, migration or Phase 3 authorization.

Approved implementation remains decimal12 half-even, `m63-mwac-decimal12-half-even-v1`. Fresh legacy suite includes partial/full sales, exact released cost, fees/taxes, corporate-action basis conservation and reversals/corrections. New integrated case independently predicts302pre-sale basis;5of20shares releases75.5, leaving226.5; net proceeds148 produce72.5realized.2:1split doubles remaining15shares to30 with basis226.5, MWAC7.55. Trade settlement never changes basis or realizesP&L again.

Imported opening basis replays exactly but provenance is separate. Acquisition comparison uses verified BUYgross+fees+tax before unproven actions. Difference column = acquisition−imported, not an authorized adjustment.

|Security|Opening quantity|Verified acquisition cost|Imported basis|Acquisition−imported|
|---|---|---|---|---|
|FPT|220|16264878|16065060|199818|
|GAS|200|19035709|18535800|499909|
|HPG|110|2635790|2585770|50020|
|MBB|100|2010603|2010600|3|
|MWG|100|8532559|8332600|199959|
|SSI|240|5941782|5742000|199782|
|TCB|100|3591077|3521100|69977|
|VCB|100|5851755|5761800|89955|
|VHM|200|9382814|8782800|600014|
|VPL|100|8232469|8232500|-31|
|VRE|100|2510753|2410800|99953|

Exact source rows/hashes and per-security category flags are pinned in prior Phase2.2 COST_BASIS_VARIANCES.json and copied references, unchanged. VPL imported−acquisition+31 and MBB−3 trace rounded display-unit multiplication, not accepted broker rounding policy or MWAC correction. FPTordinary/pending aggregate comparison explains quantity/cost presentation only. Cash-dividend-like differences cannot prove a basis-reduction methodology; do not change MWAC or substitute broker display cost.

Technical calculation correctness: PASSwithintested scope. Opening-basis provenance: PARTIAL. Lifetime accounting completeness: NOT_ESTABLISHED. Imported08/10book cannot be expanded by reimporting pre-opening purchases. Need exact broker adjustment/precision/action/start-state evidence; no source reclassification, basis plug or historical rewrite.
