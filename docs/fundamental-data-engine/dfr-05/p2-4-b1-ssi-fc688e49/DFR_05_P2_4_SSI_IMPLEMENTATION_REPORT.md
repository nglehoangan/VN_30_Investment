# SSI implementation report
Baseline `fc688e49fd4a6ad06d0333967ce24c9f7e8adbc8`. Implementation: **uncommitted**. SSI only; RESEARCH_PROVISIONAL, productionAdmissible=false, scoringAuthorized=false. All 23 rubrics have null points/band/assessment; categoryScores/totalScore/ranking/valuation remain null. No external acquisition or production mutation.

Versioned exact-tuple dispatch validates stable SSI identity, approved dated universe hash, M3 SECURITIES route and independently qualified CONSOLIDATED scope before financial reads. P1 adapter traversal, dependency propagation and DFR02 Decimal calculations are composed without changing predecessor kernels. New bindings are in `scripts/lib/dfr05_ssi_bindings_v4.json`.

174 metric objects: 88 supported (55 reported facts; 33 derived), 86 missing, 0 conflict, 0 reference-only. Historical investigative evidence and provider references remain explicitly reference-only outside this metric count.

Run `python3 scripts/validate-dfr05-ssi.py` to rebuild and validate the new SSI package. Run `python3 scripts/finalize-dfr05-ssi.py` to seal the resulting package. Then run `python3 scripts/build-dfr05-ssi.py --verify` for a read-only recomputation/seal check. The verify guard accepts the approved commit or a descendant through git ancestry plus exact protected-byte/code/output/source pins; it does not require HEAD to equal the pre-implementation commit. No committed-descendant execution is claimed while this implementation is uncommitted.

Only new SSI files are written. The before fingerprint covers 10203 baseline tracked/data files and checks the exact data-file inventory, including database/sidecars.
