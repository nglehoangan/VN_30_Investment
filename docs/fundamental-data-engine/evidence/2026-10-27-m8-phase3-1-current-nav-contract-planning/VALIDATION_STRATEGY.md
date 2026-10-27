# Deterministic future validation strategy

2026-10-27 · Phase 3.1 DESIGN PROPOSAL ONLY. No calculator, adapter, schema validator, snapshot store, migration, acceptance artifact or Phase 3.2 implementation is created. Proposed amendments require explicit owner review.

All cases below are **planned**, not implemented/executed or productionacceptance. PLANNED_VALIDATION_CASES.json records expectedoutcomes and NOT_EXECUTED flags. Mocked acceptance in futuretests must stay isolated; no productiongrant/bundle created by this design.

|ID|Case / setup|Expected outcome|
|---|---|---|
|01|Fully qualified synthetic point: All mocked accepted gates/perimeter+session+revision; fictional cash1000,2ordinaryunits×100,claims30,liabilities10|QUALIFIED_NAV,totalNav="1220",indicativeValue=null;originSYNTHETIC_TEST and officialUseEligible=false|
|02|Missing one held price: Known completeheldset but onecloseabsent|NAV_BLOCKED;fullMV/total/indicative null;missingIDlisted;namedpartialresearch allowed|
|03|Stale completed price: Next accepted sessioncompleted;newcapturefailed|NAV_BLOCKED/STALE_SESSION;no olderfallback|
|04|Conflicting sources: Two same-scopecloserevisions disagree withoutacceptedresolution|NAV_BLOCKED/SOURCE_CONFLICT;no latestwins oraverage|
|05|Missing security continuity: Ticker/code/marketmatch withoutaccountstableanchor|NAV_BLOCKED/IDENTITY_UNRESOLVED|
|06|Missing cash evidence: Cashbooknumber lacks completeacceptedcutoff/perimeter|NAV_BLOCKED;cashunknown not0|
|07|Unknown liability: Storedpayable0 butunresolved105sourceobligation|NAV_BLOCKED/UNKNOWN_LIABILITY;no I fallback|
|08|Unaccepted receivable: 570kclaim identity/netbasis/receiptallocationnotaccepted|QUALIFIED_ONLY requestNAV_BLOCKED;notautomatically included inI|
|09|Pending shares: RetainedFPTshape200ordinary+20pending inside220;currentstatus/eligibilityunproven|NAV_BLOCKED;no220+20;noinventedconversiondate;ordinarysubtotalonlyiflabelled/proved|
|10|Corporate-action basis: Pre-actionqty100 versuspost-splitRAWclose50;properaccepted2:1replaywouldqty200|MismatchedbasisBLOCKED;acceptedalignedcaseMV="10000" using200×50|
|11|Date-only observations: Broker cash/position dateonlywithoutend-sessionstate/roll-forward proof|NAV_BLOCKED/INCOMPATIBLE_ASOF;do notassignmidnight|
|12|Holiday/weekend: Accepted calendar says no session;priorcompletedS remainslatestwithinwindow|MayQ onlyforS withallgates;actualholidaynotfabricatedsession;unknowncalendarBLOCKED|
|13|Late actual event: Eventeffective≤T learned/postedlaterwithacceptedproof|Newrevision/restatedretrospective result;oldcontentpreserved;notAS_KNOWN_T|
|14|Corrected transaction: Authorizedimmutable reversal/replacement changesinputs|Newresultcontent/lineage;noeditold snapshot orledger|
|15|Revision race: Ledger/evidenceheads changeaftercapturebeforepublish|NAV_BLOCKED/REVISION_CHANGED or explicitretrynonepublishedmixed|
|16|Decimal precision: 3integerunits×0.123456789012;allotherrequireddataavailable|MV="0.370370367036" exact;over12scale/outofrangereject notroundinput|
|17|Sourceauthorityfailure: Hashvalidbutwrongpurpose/expired/revokedauthority|QUALIFIED_ONLY NAV_BLOCKED;hashnotapproval;neverexpandVALUATIONtoNAV|
|18|Independent acceptance missing: Technicallycompleteprice/book butno authenticatedreview|QUALIFIED_ONLY NAV_BLOCKED;PENDING_INDEPENDENT_ACCEPTANCE|
|19|Indicative restrictions: Completeconsistentobservedportfolio,documentedunacceptedformalstate;explicitresearch opt-in|INDICATIVE_NAV,totalNav=null,indicativeValuepresent;officialperformance/risk/decision/scoringdenied|
|20|Blocked propagation: Ordinarysubtotalvalid butpending/claims/debtunknown|NAV_BLOCKED;totalNav/indicativeValue=null;subtotalsnotfullNAV/bounds|
|21|Snapshot reproducibility: Identicalinputmanifest/schema/method/code/knowledgecutoff;laterdifferentcalc clock|Samecontent/numericresult,separaterun;changeanymandatoryinput→newhash/reassessment|
|22|Futureinformation: Priceeconomicdate>T orsource/approvalknownAt>K;AS_KNOWNrequestedwithoutclosure|NAV_BLOCKED appropriatefuture/BITEMPORALreason;lateknownretrospectiveexplicitlabelonly|

Validation order after explicit3.2authorization: schema/decimal/purpose negativecases; immutable inputassembly/coverage; percomponent andfullgate matrices; pure arithmetic independent expectedtables; temporal/calendar/future cases; source/identity/revocation/integration mocks; legacyregression/no-side-effect checks. Laterpersistence/CAS/recovery tests only in separately authorized snapshot slice, ondisposabledatabases. No actualportfolio posting or migrations, real acceptedidentity/source fixtures orliveproviderrequests in isolatedtests.

Additional required planned edges: allcash/noheldsecurities with explicit MARKET_NOT_REQUIRED proof, nonpositiveNAV preservingdebt whileweightsunavailable, unsupportedcurrency, pending/priceshareoverlap, identicalsameprice repeatedcaptures dedupversus genuine conflictingrevision, missingrawpayloadhashverification and sourcecleanup/restoreloss. A non-usedbasis missing may permitpurepointQ only afterexplicit NAVeconomicprofileapproval and provenquantity/rights; oldfullreconciliation/P&Lcontext staysblocked. Compare expectedresults from independent integer/rational arithmetic, not calling productioncalculator to generateexpected values.

Current phase checks only artifact completeness, exactsource/hash bindings, preservation and design consistency. Phase2.3's215passingaccountingtests are retained/hashverified evidence, not newly executedNAVacceptance. No currentNAVnumber computed.

Additional planned D3case: recognized unsettled ordinary BUY/SELL with exact payable/receivable and unchanged qualified close; before/after cash settlement NAV must be identical. Quantity is not re-added at settlement, and execution availability is not granted. Corporate pending-right uncertainty remains a separate blocked case. This is design expectation only, not a new executed test or implemented exception.
