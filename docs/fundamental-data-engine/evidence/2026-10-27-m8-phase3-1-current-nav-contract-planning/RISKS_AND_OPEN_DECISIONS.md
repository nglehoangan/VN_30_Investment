# Role review, conflicts and owner decisions

2026-10-27 · Phase 3.1 DESIGN PROPOSAL ONLY. No calculator, adapter, schema validator, snapshot store, migration, acceptance artifact or Phase 3.2 implementation is created. Proposed amendments require explicit owner review.

|Role|Critical/Major concern|Design response|
|---|---|---|
|CIO|Falseofficialreturns/releasefrominformationalNAV|Separatepointqualification,officialpublication/metricacceptance andM7release; noobjective/CAGR/drawdownclaim|
|PortfolioManager|StaleEODplusnewcash orunknownavailable shares usedfororders|Oneeconomiccutoff;knownpostTactivity/currentcontinuityunknownblocksaccount-now/execution;FPTstatusnotinferred|
|EquityResearchAnalyst|Adjustedquote/wrongsecurity/omitteddeferredholding|Exactacceptedidentity/RAWbasis/fullheldset;no ticker-onlymatch orscoringeligibilityfilter|
|RiskManager|Unknown105treated0,570kclaimassumed,500kdoublecount,sparsepathNORMAL|BlockfulleconomicNAV;disjointcomponents;metric-specificriskgates and no inventedmaterialitythreshold|
|SystemArchitect|Secondledger,unguardedCurrentModeladapter,orplaceholderspromotedtoapproval|Oneaccountingengine,readonlyplan,newpurpose/resultcontracts,separateverifiedauthorityports;oldcontractsunchanged|

Critical inherited issues: actual source/identity/independent authority missing; unknown obligations/ownership/claim scope prevents accepted totals. Major inherited issues: FPTlifecycle andall11basis provenance, M7release/registryPROPOSED andunappliedmigrations. These are not design fixes or approvals. Newdesignconflicts are explicitamendments, not silently resolved inruntime:
- PortfolioValuation VALID is arithmetic; proposedQneedsmoregates. LegacyCurrentModel/PASS/inception/fullreconciliation remainunchanged.
- OldreconcilePortfolio requiresbasis, newpointprofileproposesnon-usedbasisindependence. D2approval andseparateassessmentrequired; never renameoldBLOCKEDasMATCH.
- MarketPurpose unioncontainsNAV buteodPolicy/activecandidateuseVALUATIONonly; newscopedpolicy/capabilityacceptance needed.
- OfflineNavUnavailablealwaysnull andplaceholderenumhasnoACCEPTED; futureaccepted-evidenceport separate, not schemaflagmutation.
- Provideractualtime maybenull; normalizedsessiontime requiresdeclaredsemanticversion, not fictitiousproviderobservedAt.
- M2logicaldefaultzeros andgenericsnapshots do notprovecompleteobligations orphysicalsnapshotpersistence. Existingliability/pending eventcoveragegaps blockuntilupstreamcontracts/evidenceclosed.

Minor issues: UIlabels/unitrounding, duplicate-samepricecapture versusconflictrevision, timestampresolution/eligibilityboundary display, reasoncodetranslations. They must not change authoritativeamounts/time orgrantauthority. No confirmedunresolved internaldesigncontradiction is concealed; decisionsbelow remainexplicitproposals.

|Decision|Topic|Recommendedreviewchoice|Consequence|
|---|---|---|---|
|D1|LatestcompletedEODonly; separateNAVonlyrequest/result andreadservice|Approve explicitdatedEODlabel,notaccount-now/intraday; preserveexistingCurrentModel/actionability|NoCurrentNAVimplementation untillaterauthorization|
|D2|NAVeconomicreconciliation / costbasis amendment|Approve scopedpointprofile allowingnon-usedbasisPARTIAL onlywhenquantities/rights/claimscomplete; preserveoldfullMATCH/inception/P&Lgates|Untilapproved oldstrictgate remains; B5notresolved by arithmetic independence|
|D3|Pending/availability initialscope|Prefer conservativeblock forunavailablepending/suspended/unknown; no genericpendingpricing. Anylocked-ordinaryequivalence exception needsseparateacceptedpolicy|FPT200/20historicdoesnotqualifycurrent220|
|D4|Pricekind/finality/purpose/calendar|Approve explicitTCBSNAVspecificscope+RAW/session/finality requirements andnormalizedboundaryfield; never copyVALUATION policy|No arbitraryTTL orinventedprovider timestamp/officialclose|
|D5|Indicativefullportfolio versusnamedsubtotals|Approve strictcompleteobservedindicationprofile withopt-in;unknownobligations/conflictsblock fullI; subtotalnotNAV|Indicativeneverofficialperformance/risk/scoring|
|D6|Qualification versusoperationaluse/release|Approveadditivestatusnamespace andseparateNAVpublication/metric/releasechecks; authenticindependentacceptance stillrequired|NoM7realmoneyGO orsourcegrant inferred|
|D7|Scopeoflaterimplementation|Authorize specificisolated3.2contract/calculator/tests only inafuturetask; no providers,DBmigrations,posting,auth,snapshotstoreoractivation bydefault|Phase3.1stopsafterdesign|
|D8|Display/zero/negativepresentation|Keepauthoritativestringexact; proposedwholeVNDdisplayroundingrequiresseparatechoice; preservezero/negativeNAVwithriskflags,ratiosunavailable|No inputrounding orclamp/debtwaiver|

Avoid unnecessarycomplexity: no new accountingengine, authprovider/login, APIclient, FXengine, genericilliquidpricing, dailyNAVbackfill, scheduler or snapshotDBininitialisolatedcalculator. Required evidence/authoritycontrols are retained, not replaced with unsigned local approvals. Owner approval of a design is distinct from source/identity/independent acceptance and deployment. Stop atdesignreview; noapprovalprompt for executing an unimplemented action.

D3 specifically asks owner to distinguish ordinary trade settlement status (existing M2economic recognition plus claims/payables) from corporate-action pending rights; this is not approval of FPTconversion or a blanket unavailable-share valuation exception. Adopt/refuse this exact NAV-only refinement explicitly. Execution availability requirements and existing production gates remain unchanged.
