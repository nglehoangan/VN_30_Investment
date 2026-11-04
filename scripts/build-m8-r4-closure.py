"""R4 evidence/rubric completion. Artifacts only; SQLite is always opened read-only.
Phases inspect -> prepare -> challenge -> build retain separate real execution times.
No existing sealed artifact, financial rule, HUMAN contract or authority is edited.
"""
import argparse
from collections import Counter,defaultdict
from copy import deepcopy
from datetime import datetime,timezone
from decimal import Decimal,getcontext
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
from lib.r4_rubric_completion import canonical_hash,decimal_string,validate_partial_assessment,challenge_decision

getcontext().prec=60
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'docs/fundamental-data-engine/scoring-dataset-acceptance'
OUT=BASE/'2026-11-04/m8-r4-evidence-rubric-completion-v1'
R4=BASE/'2026-10-30/b6-underwriting-r4'
RESEARCH=BASE/'2026-11-04/investment-research-v2'
V4=BASE/'2026-11-04/earnings-normalization-v4'
REMED=BASE/'2026-11-02/acceptance-remediation-v1'
LINEAGE=BASE/'2026-11-02/vn30-lineage-v1'
ELIGIBLE=('BSR','VIC','VJC','VPL')
TABLES=['fundamental_admission_run','fundamental_observation','fundamental_derivation','fundamental_availability_assessment','fundamental_snapshot_run','fundamental_snapshot_content','data_initialization_acceptance','scoring_dataset_binding','analytical_artifact','decision_artifact']


def now():return datetime.now(timezone.utc).isoformat()
def load(p):return json.loads(p.read_text())
def rel(p):return str(p.relative_to(ROOT))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,x):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def pin(p,pointer=''):return dict(path=rel(p),sha256=sha(p),jsonPointer=pointer)
def check_pin(p,h):
    if sha(p)!=h:raise ValueError('PIN_CHANGED:'+str(p))
def rubrics():return json.loads((ROOT/'src/domain/scoring/methodology.ts').read_text().split('deepFreeze(',1)[1].rsplit(');',1)[0])
def execute_identity(phase):
    return dict(actor='CHATGPT',reviewMode='OWNER_AUTHORIZED_AI_SELF_REVIEW',independentHumanReviewClaimed=False,
        preciseRuntimeModelId=None,authenticatedSessionId=None,toolCallAuthenticationAvailable=False,
        actualTool='functions.exec / exec_command',command=f'python3 scripts/build-m8-r4-closure.py {phase}',
        toolReference=f'local-execution:{phase}',metadataLimitations=['PRECISE_MODEL_AND_SESSION_IDENTIFIERS_NOT_EXPOSED','LOCAL_HASHES_ARE_NOT_TRUSTED_SERVER_EXECUTION_ATTESTATION'])


def inspect():
    before=sha(ROOT/'data/vn30.sqlite');git_status=subprocess.check_output(['git','status','--short'],cwd=ROOT,text=True)
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    c=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True)
    counts={t:c.execute('SELECT COUNT(*) FROM '+t).fetchone()[0] for t in TABLES}
    records=[json.loads(x[0]) for x in c.execute('SELECT body FROM fundamental_admission_run')]
    candidates=Counter(x['status'] for d in records for x in d['candidateAssessments'])
    metrics=Counter(x['status'] for d in records for x in d['derivedMetrics'])
    metric_reasons=Counter(x.get('reason') for d in records for x in d['derivedMetrics'] if x['status']=='N_R')
    migrations=c.execute('SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL').fetchone()[0]
    method_count=c.execute("SELECT COUNT(*) FROM methodology_record WHERE configuration_reference LIKE 'personal-ai-di-acceptance-sha256:%'").fetchone()[0]
    readiness_count=c.execute("SELECT COUNT(*) FROM methodology_record WHERE configuration_reference LIKE 'readiness-requirements-sha256:%'").fetchone()[0]
    c.close()
    if sha(ROOT/'data/vn30.sqlite')!=before:raise ValueError('DATABASE_CHANGED')
    w=load(REMED/'topic-review-worklist.json');r4=[load(p) for p in sorted((R4/'issuers').glob('*.json'))]
    points=[(p['ticker'],a['subcategory'],a['points']) for p in r4 for a in p['scoreInput']['assessments']]
    if len(points)!=690 or len({(t,r) for t,r,v in points})!=690:raise ValueError('RUBRIC_SCOPE')
    verified={};upstream_manifests={}
    for folder in (V4,RESEARCH,BASE/'2026-11-04/fy2025-item-acceptance-v1'):
        m=load(folder/'manifest.json');upstream_manifests[rel(folder/'manifest.json')]=sha(folder/'manifest.json');n=0
        for group in ['inputPins','outputs']:
            for path,h in m[group].items():
                p=ROOT/path if path.startswith(('docs/','data/','src/','scripts/','tests/')) else folder/path
                check_pin(p,h);n+=1
        verified[rel(folder)]=n
    state=dict(contract='m8-r4-current-state-v1',capturedAt=now(),reviewedHead=head,workingTreeAtInspection=git_status,
        protectedDatabaseSha256=before,sqliteMode='ro',tableCounts=counts,completedMigrations=migrations,
        admissionModeCounts=dict(Counter(d['mode'] for d in records)),embeddedCanonicalFacts=sum(len(d['canonicalFacts']) for d in records),
        embeddedDerivedEntries=sum(len(d['derivedMetrics']) for d in records),embeddedDerivedStatuses=dict(metrics),embeddedNrReasons=dict(metric_reasons),
        candidateStatuses=dict(candidates),aiAcceptanceRegistryCount=method_count,readinessRegistryCount=readiness_count,
        rubricInstances=len(points),historicalUnrated=sum(v is None for t,r,v in points),historicalAssessed=[dict(ticker=t,rubric=r,points=v) for t,r,v in points if v is not None],
        currentReadyRubrics=sum(bool(r['currentReadyForScoring']) for r in w['rubrics']),topicCount=len(w['topics']),
        expiredBindings=load(REMED/'binding-dispositions.json')['count'],sourcePinVerificationCounts=verified,verifiedUpstreamManifestPins=upstream_manifests,missionStartWorkingTree='CLEAN_VERIFIED_AT_INITIAL_INSPECTION',
        approvedMethodology=pin(ROOT/'src/domain/scoring/methodology.ts'),humanContract=pin(ROOT/'src/domain/scoring/scorecard.ts'),
        currentOwnerRules=pin(BASE/'current-owner-rules.json'),protectedAuthority=pin(ROOT/'src/infrastructure/dependencies/active-authorities.json'),readOnlyFactsNotAcceptance=True)
    dump(OUT/'current-state.json',state);print(json.dumps(state,ensure_ascii=False))


RATIONALES={
 'BSR':('High uncertainty is supported by source-based refining-margin cases spanning loss and profit, not by absent files. Maintenance/cycle persistence and final common allocations change the forward value estimate.',
        'FY2025 reported earnings are positive and the Q3 allocation branch is identified. Those facts improve the accounting bridge but do not establish which refining-margin/cash-reinvestment case will persist.'),
 'VIC':('Named sponsor/disposal components and unresolved transaction-specific common attribution generate opposite-sign common-earnings cases. This directly affects precision of future common-owner value; no midpoint is justified.',
        'Reported group/parent profit and exact license settlement arithmetic are available. Those accounting reconciliations do not determine the tax/preference waterfall or recurring common-owner earnings.'),
 'VJC':('Reported common profit is positive but the documented core-airline branch is negative after specific aircraft-margin/support/reversal exclusions. The economics and recurrence of sale/leaseback funding therefore materially change the value thesis.',
        'Aircraft transactions may be recurring fleet-financing operations; the core-only branch is not proved to be the unique expected case. This is why uncertainty is high, rather than a claim that the company has negative reported profit.'),
 'VPL':('The known negative unallocated profit pool exceeds consolidated pretax profit and offsets the two positive segment results. Its financing/corporate/claim allocation materially determines group value and prevents a narrow supported forecast.',
        'The two segment results are positive and their bridge reconciles. That is genuine supporting evidence; it does not establish hotel-only EBITDA, attributable cash or the value of the unallocated pool.')}


def preparation_findings(t):
    p=load(V4/'issuers'/f'{t}.json');research=load(RESEARCH/'issuers'/f'{t}.json')
    result=dict(equityScenarioRange=research['equityScenarioRange'],rangeIsConditionalNotConfidenceInterval=True,
        approvedBandSelectionIsJudgmentNotNumericThreshold=True)
    if t=='BSR':
        cases=[decimal_string(x['valueAtAdverseIncidenceVnd']) for x in p['operatingAlternatives']]
        ids={r['id'] for r in p['sourceReadings']}
        result.update(operatingLowVnd=str(min(cases)),operatingHighVnd=str(max(cases)),
            grossMarginSourceOperandsVerified=all('BSR-FY2025-'+k in ids for k in ['grossProfit2025','grossProfit2024','revenue2025','revenue2024']))
    elif t=='VIC':
        d=load(BASE/'2026-11-03/vic-parent-bridge-v1/decision.json')
        result.update(namedCommonLowVnd=d['unconditionalNamedComponentsEnvelope']['minimumVnd'],namedCommonHighVnd=d['unconditionalNamedComponentsEnvelope']['maximumVnd'],
            waterfallUnproven=d['novatechPreferenceClaim']['transactionProfitWaterfallProven'] is False)
    elif t=='VJC':
        e=decimal_string(p['sourceCommonBridgeVnd'])+sum((decimal_string(x['pretaxVnd']) for x in p['selectedPretaxAdjustments']),Decimal(0))
        result.update(reportedCommonVnd=p['reportedCommonReferenceVnd'],coreCaseVnd=p['prudentialWorkingCaseVnd'],adjustmentArithmeticMatches=e==decimal_string(p['prudentialWorkingCaseVnd']))
    elif t=='VPL':
        s=load(REMED/'VPL-segment-inputs.json');total=sum((decimal_string(x['reportedSegmentProfit']) for x in s['segments']),Decimal(0))+decimal_string(s['unallocated']['reportedSegmentProfit'])
        result.update(unallocatedProfitMillion=s['unallocated']['reportedSegmentProfit'],groupPbtMillion=s['consolidated']['reportedSegmentProfit'],segmentBridgeMatches=total==decimal_string(s['consolidated']['reportedSegmentProfit']))
    return result


def verify_inspected_inputs(state):
    for path,h in state['verifiedUpstreamManifestPins'].items():
        check_pin(ROOT/path,h);folder=(ROOT/path).parent;m=load(ROOT/path)
        for group in ('inputPins','outputs'):
            for file,expected in m[group].items():
                p=ROOT/file if file.startswith(('docs/','data/','src/','scripts/','tests/')) else folder/file
                check_pin(p,expected)
    for key in ('approvedMethodology','humanContract','protectedAuthority','currentOwnerRules'):
        p=state[key];check_pin(ROOT/p['path'],p['sha256'])


def prepare():
    state=load(OUT/'current-state.json');verify_inspected_inputs(state);rg=next(r for r in rubrics() if r['id']=='RG-UNC');at=now();proposals=[]
    for t in ELIGIBLE:
        g=load(LINEAGE/'issuers'/f'{t}.json');support,counter=RATIONALES[t]
        refs=[f'{t}:current-model-range',f'{t}:economic-uncertainty-driver',f'{t}:source-dependencies',f'{t}:counterevidence']
        a=dict(subcategory='RG-UNC',assessment='High uncertainty',selectedPoints=0,analyst='CHATGPT',source='AI',assessedAt=at,
            methodologyVersion='1.0.0',rationale=support,strongerEvidence=False,maximumPrerequisitesMet=False,exceptionalJustification=None,
            disconfirmingEvidence=[refs[3]],evidence=[dict(topic=topic,refs=[refs[i]],rationale=[
                'Current named forecast/value cases are disclosed as conditional; the economic branch, not a cost-grid threshold, drives this assessment.',
                'Economic source operands produce material alternative outcomes; mechanically wide analyst grids alone are insufficient.',
                'Specific financial claim/cycle/financing dependencies determine whether a narrow forward value estimate is defensible.'][i]) for i,topic in enumerate(rg['topics'])],
            sector=g['sector'],sectorRationale='Retained approved sector route; not reclassified by this review.',economicChannel='RG-UNC:future-common-value-estimate-precision:'+t)
        validate_partial_assessment(a,rg)
        proposals.append(dict(ticker=t,assessment=a,economicFindings=preparation_findings(t),counterArgument=counter,
            qualification='SOURCE_BACKED_CURRENT_RESEARCH_JUDGMENT_ONLY',sourcePublicationVerified=False,
            formalEvidenceTimeOrSnapshotQualificationGranted=False,
            evidenceBindings=[pin(V4/'issuers'/f'{t}.json'),pin(RESEARCH/'issuers'/f'{t}.json')]))
    artifact=dict(contract='m8-r4-research-review-pass-v1',passKind='PREPARATION',createdAt=at,reviewedHead=state['reviewedHead'],
        identity=execute_identity('prepare'),proposals=proposals,productionScoringAuthorized=False,
        preciseModelOrSessionReferencesInvented=False,preparedFrom=pin(OUT/'current-state.json'))
    dump(OUT/'reviews/preparation.json',artifact);print(json.dumps(artifact,ensure_ascii=False))


def challenge():
    verify_inspected_inputs(load(OUT/'current-state.json'))
    prep=load(OUT/'reviews/preparation.json');rg=next(r for r in rubrics() if r['id']=='RG-UNC');decisions=[]
    readings={r['id']:r for r in load(BASE/'2026-11-02/earnings-normalization-v3/checked-readings.json')['readings']}
    for proposal in prep['proposals']:
        t=proposal['ticker'];fresh={};checks=[]
        if t=='BSR':
            vals={k:decimal_string(readings['BSR-FY2025-'+k]['lexicalValue'])*decimal_string(readings['BSR-FY2025-'+k]['multiplier']) for k in ['grossProfit2025','grossProfit2024','revenue2025','revenue2024']}
            gp25=vals['grossProfit2025']/vals['revenue2025'];gp24=vals['grossProfit2024']/vals['revenue2024']
            e=load(V4/'issuers/BSR.json');base=decimal_string(e['sourceCommonBridgeVnd']);comp=decimal_string(next(a['pretaxVnd'] for a in e['selectedPretaxAdjustments'] if a['id']=='BSR-contract-compensation'))
            lo=base+comp+vals['revenue2025']*gp24-vals['grossProfit2025'];hi=base+comp
            fresh.update(operatingLowVnd=str(lo),operatingHighVnd=str(hi),grossMarginSourceOperandsVerified=True,
                sourceGrossMargin2025=str(gp25),sourceGrossMargin2024=str(gp24))
            checks.append(dict(check='REFINING_OPERATING_BRANCH_SIGN',expected='NEGATIVE_AND_POSITIVE',actual='NEGATIVE_AND_POSITIVE' if lo<0<hi else 'NOT_CONFIRMED'))
        elif t=='VIC':
            d=load(BASE/'2026-11-03/vic-parent-bridge-v1/decision.json');native=d['unconditionalNamedComponentsEnvelope']
            fresh.update(namedCommonLowVnd=native['minimumVnd'],namedCommonHighVnd=native['maximumVnd'],waterfallUnproven=not d['novatechPreferenceClaim']['transactionProfitWaterfallProven'])
            checks.append(dict(check='NO_PROFIT_RATIO_AS_WATERFALL',expected=False,actual=d['novatechPreferenceClaim']['transactionProfitWaterfallProven']))
        elif t=='VJC':
            d=load(V4/'issuers/VJC.json');calculated=decimal_string(d['sourceCommonBridgeVnd'])+sum((decimal_string(a['pretaxVnd']) for a in d['selectedPretaxAdjustments']),Decimal(0))
            fresh.update(reportedCommonVnd=d['reportedCommonReferenceVnd'],coreCaseVnd=str(calculated),adjustmentArithmeticMatches=calculated==decimal_string(d['prudentialWorkingCaseVnd']))
            checks.append(dict(check='CORE_PROFIT_PARITY',expected=d['prudentialWorkingCaseVnd'],actual=str(calculated)))
        else:
            s=load(REMED/'VPL-segment-inputs.json');parts=[decimal_string(x['reportedSegmentProfit']) for x in s['segments']];u=decimal_string(s['unallocated']['reportedSegmentProfit']);g=decimal_string(s['consolidated']['reportedSegmentProfit'])
            fresh.update(unallocatedProfitMillion=str(u),groupPbtMillion=str(g),segmentBridgeMatches=sum(parts,Decimal(0))+u==g)
            checks.append(dict(check='SEGMENT_TO_GROUP_PARITY',expected=str(g),actual=str(sum(parts,Decimal(0))+u)))
        decision=challenge_decision(t,fresh,proposal['assessment'],rg)
        if any(x['expected']!=x['actual'] for x in checks):raise ValueError('CHALLENGE_PARITY_FAILED:'+t)
        decisions.append(dict(ticker=t,assessmentHash=canonical_hash(proposal['assessment']),decision=decision,
            freshEconomicChecks=checks,independentlyRecomputedFindings=fresh,
            counterArgumentReviewed=proposal['counterArgument'],challengeConclusion='Retain 0/2 only for uncertainty of the value thesis; not a company total score, adverse-business rating, missing-data penalty or trading decision.'))
    artifact=dict(contract='m8-r4-research-review-pass-v1',passKind='CHALLENGE',createdAt=now(),identity=execute_identity('challenge'),
        preparation=pin(OUT/'reviews/preparation.json'),decisions=decisions,productionScoringAuthorized=False,
        independenceClaim='SAME_AI_SELF_REVIEW_SEPARATE_PASS_NOT_INDEPENDENT_HUMAN_OR_TRUSTED_SESSION_ATTESTATION')
    dump(OUT/'reviews/challenge.json',artifact);print(json.dumps(artifact,ensure_ascii=False))


def required_action(r):
    groups={
      'BQ-EQ':'Qualify common-capital returns, persistence, margins and cost of capital; separate credit/leverage artifacts.',
      'BQ-MOAT':'Review competitive behavior, pricing/retention evidence and persistence; financial captions alone do not establish a moat.',
      'BQ-CASH':'Bridge reported CFO to recognition, recurring adjustments, working capital and common-owner realization.',
      'BQ-RES':'Assess concentration, pricing power, cyclicality and a source-based survivability stress.',
      'FH-BS':'Reconcile debt/leases/common claims and sector-specific balance-sheet quality.',
      'FH-LIQ':'Review unrestricted funds, actual maturities/refinancing and liquidity buffers; do not equate reported cash with available cash.',
      'FH-STRESS':'Prepare issuer-specific cash/capital stress with covenant/regulatory headroom.',
      'GQ-HIST':'Reconcile comparable multi-year organic growth, scopes and corporate actions.',
      'GQ-FWD':'Defend forward drivers, incremental returns and funding; do not extrapolate one year.',
      'GQ-INC':'Review incremental capital efficiency and reinvestment economics with matched periods.',
      'IC-IND':'Review industry structure, economics and risks using topic-specific evidence.',
      'IC-POS':'Review issuer positioning against a justified peer set; no automatic sector score.',
      'IC-CYCLE':'Assess forward cycle/asymmetry and survivability; spot margins alone are insufficient.',
      'VAL-PRIMARY':'Qualify sector-appropriate primary value, normalized denominator, dated price and economic crosscheck. No value means NOT_RATED, not clearly-overvalued 0.',
      'VAL-RET':'Compute source-bound 5-year returns from qualified value/cash/price assumptions; preserve approved return bands.',
      'VAL-MOS':'Qualify conservative common value and exact share/price basis before applying approved margin-of-safety rules.',
      'RG-GOV':'Review auditor/disclosure/related-party/minority evidence and counterevidence; a source typo alone does not prove poor governance.',
      'RG-RISK':'Complete the distinct residual-risk analysis under the approved M1 external risk gate; do not substitute a file-completeness score.',
      'RG-UNC':'Prepare an issuer-specific forecast-range, economic sensitivity and dependency argument; uncalibrated cost/horizon grids alone cannot justify a band.',
      'CA-REINV':'Review maintenance/growth reinvestment, returns and capital-allocation execution.',
      'CA-DIST':'Review distributions and common-owner capital opportunity costs; declared dividends alone are insufficient.',
      'CA-DIL':'Review ordinary, treasury, preference/convertible and potential claims with action-date continuity.',
      'CA-PSV':'Review real per-share compounding after corporate actions and cycle normalization.'}
    return groups[r]


def build():
    state=load(OUT/'current-state.json');verify_inspected_inputs(state);prep=load(OUT/'reviews/preparation.json');challenge_=load(OUT/'reviews/challenge.json')
    if challenge_['preparation']['sha256']!=sha(OUT/'reviews/preparation.json'):raise ValueError('REVIEW_PASS_BINDING_DRIFT')
    assessments={p['ticker']:p for p in prep['proposals']};decisions={p['ticker']:p for p in challenge_['decisions']}
    approved=rubrics();rulemap={r['id']:r for r in approved};work=load(REMED/'topic-review-worklist.json')
    research={p['ticker']:p for p in load(RESEARCH/'snapshot.json')['issuers']};normalized={p['ticker']:p for p in load(V4/'snapshot.json')['issuers']}
    rows=[];catalog={};topics=[];pins={};actual=[]
    def remember(path):pins[rel(path)]=sha(path);return pin(path)
    for path in [ROOT/'src/domain/scoring/methodology.ts',ROOT/'src/domain/scoring/methodology/identity.ts',ROOT/'src/domain/scoring/scorecard.ts',ROOT/'src/domain/personal-ai/scorecard.ts',ROOT/'src/domain/personal-ai/provenance.ts',ROOT/'src/domain/personal-ai/scoring-readiness.ts',REMED/'topic-review-worklist.json',REMED/'binding-dispositions.json',BASE/'current-owner-rules.json',OUT/'current-state.json',OUT/'reviews/preparation.json',OUT/'reviews/challenge.json']:
        remember(path)
    topic_map=defaultdict(list)
    for t in work['topics']:topic_map[(t['ticker'],t['rubricId'])].append(t)
    for ticker in sorted(research):
        graph_path=LINEAGE/'issuers'/f'{ticker}.json';g=load(graph_path);remember(graph_path)
        p=normalized[ticker];r=research[ticker];npath=V4/'issuers'/f'{ticker}.json';rpath=RESEARCH/'issuers'/f'{ticker}.json';remember(npath);remember(rpath)
        # Revalidate actual original issuer source; no metadata default becomes publication evidence.
        source=p['reportedNumeratorEvidence']['source'];pdf=ROOT/source['pdfPath'];check_pin(pdf,source['sha256']);remember(pdf)
        common_id=ticker+':reported-financial-context'
        catalog[common_id]=dict(kind='CHECKED_REPORTED_CONTEXT_NOT_TOPIC_SUFFICIENCY',issuer=ticker,source=source,periodEnd='2025-12-31',scope=p['referenceScope'],
            sourcePublicationAt=None,sourceKnownAt=None,currentResearchKnownAt=state['capturedAt'],formalPublicationVerified=False,artifact=pin(npath,'/reportedNumeratorEvidence'))
        nodes={n['id']:n for n in g['nodes']};closures={}
        def ancestors(ident):
            if ident not in closures:
                node=nodes[ident];closures[ident]={ident}.union(*(ancestors(x) for x in node['inputs']))
            return closures[ident]
        for index,node in enumerate(g['nodes']):
            key=ticker+':node:'+node['id'];s=node.get('source');details=node.get('details',{})
            catalog[key]=dict(kind=node['kind'],issuer=ticker,observation=node['id'],value=node['value'],unit=node['unit'],periodStart=node['periodStart'],periodEnd=node['periodEnd'],scope=node['reportingScope'],
                source=s,publication=details.get('publication'),sourceKnownAt=details.get('retrievedAt'),graphKnownAt=g['knownAt'],
                qualification='RETAINED_CANDIDATE_NO_AUTO_TOPIC_OR_TIME_ADMISSION',artifact=pin(graph_path,f'/nodes/{index}'))
        if ticker in ELIGIBLE:
            prop=assessments[ticker];decision=decisions[ticker]
            if decision['assessmentHash']!=canonical_hash(prop['assessment']):raise ValueError('ASSESSMENT_CHALLENGE_HASH')
            validate_partial_assessment(prop['assessment'],rulemap['RG-UNC'])
            if decision['decision']['decision']!='ACCEPT_CURRENT_RESEARCH_JUDGMENT_ONLY':raise ValueError('CHALLENGE_NOT_ACCEPTED')
            for suffix,ptr in [('current-model-range','/equityScenarioRange'),('economic-uncertainty-driver','/economicFindings'),('source-dependencies','/blockingBeforeDatedTradeConclusion'),('counterevidence','/counterArgument')]:
                artifact=pin(rpath,ptr) if suffix in ('current-model-range','source-dependencies') else pin(OUT/'reviews/preparation.json',f"/proposals/{next(i for i,x in enumerate(prep['proposals']) if x['ticker']==ticker)}{ptr}")
                catalog[ticker+':'+suffix]=dict(kind='CURRENT_RESEARCH_FINDING',issuer=ticker,artifact=artifact,periodEnd='2025-12-31',sourcePublicationAt=None,
                    sourceKnownAt=None,currentResearchKnownAt=prep['createdAt'],classification='FACT_ABOUT_DISCLOSED_SOURCE_OR_CONDITIONAL_MODEL_NOT_ACCEPTED_INTRINSIC_VALUE',
                    qualification='QUALIFIED_FOR_RG_UNC_CURRENT_RESEARCH_ONLY',formalPublicationVerified=False)
            actual.append(dict(ticker=ticker,assessment=prop['assessment'],assessmentHash=canonical_hash(prop['assessment']),
                preparationBinding=pin(OUT/'reviews/preparation.json'),challengeBinding=pin(OUT/'reviews/challenge.json'),
                decision='COMPLETED_CURRENT_RESEARCH_ASSESSMENT',formalScoringEvidenceReady=False,productionReady=False))
        for old in (x for x in work['rubrics'] if x['ticker']==ticker):
            rid=old['rubricId'];definition=rulemap[rid];trows=topic_map[(ticker,rid)];candidate=set();expired=set()
            for tr in trows:
                candidate|=set().union(*(ancestors(i) for i in tr['candidateEvidenceNodes'])) if tr['candidateEvidenceNodes'] else set()
                expired|=set(tr['expiredObservationBindings'])
                topics.append(dict(id=tr['id'],ticker=ticker,rubricId=rid,topic=tr['topic'],candidateNodeIds=tr['candidateEvidenceNodes'],
                    topicSpecificCurrentResearchReviewComplete=ticker in ELIGIBLE and rid=='RG-UNC',formalTopicAdmission=False,
                    qualifiedCurrentResearchRefs=[e['refs'] for e in assessments[ticker]['assessment']['evidence'] if e['topic']==tr['topic']] if ticker in ELIGIBLE and rid=='RG-UNC' else [],
                    requiredAction=None if ticker in ELIGIBLE and rid=='RG-UNC' else required_action(rid),
                    retainedExpiredBindings=tr['expiredObservationBindings']))
            completed=ticker in ELIGIBLE and rid=='RG-UNC';a=assessments[ticker]['assessment'] if completed else None
            missing=[] if completed else [dict(topic=x['topic'],prerequisite=f"{ticker}/{rid}/{x['topic']}: topic-specific sufficiency and band-selection review not completed. "+required_action(rid),classification='Valuation evidence gap' if rid.startswith('VAL-') else 'Review/provenance gap',
                availableCandidatesDoNotEstablishSufficiency=True) for x in trows]
            historic=old['retainedHistoricalPoints'];historic=None if historic is None else int(historic)
            row=dict(id=ticker+':'+rid,ticker=ticker,rubricId=rid,maxPoints=definition['max'],topics=definition['topics'],
                financialEvidenceAvailable=dict(reportedContextRef=common_id,candidateSourceRefs=sorted(ticker+':node:'+i for i in candidate if nodes[i]['kind']=='SOURCE'),
                    candidateDerivedRefs=sorted(ticker+':node:'+i for i in candidate if nodes[i]['kind']=='DERIVED'),
                    candidateEvidenceIsTopicQualified=False,qualifiedCurrentResearchRefs=[ref for topic in a['evidence'] for ref in topic['refs']]+a['disconfirmingEvidence'] if a else [],successorNormalization=pin(npath),successorValuation=pin(rpath)),
                publicationIdentity=dict(issuer=ticker,sourcePdf=source['pdfPath'],sha256=source['sha256'],physicalPage=source['page'],publicationAt=None,publicationVerified=False),
                dataPeriod='FY2025_PRIMARY_WITH_SEPARATELY_BOUND_HISTORY_AND_INTERIM_SUPPORT',financialPeriodEnd='2025-12-31',
                capitalAsOf=r['commonBookDate'],shareAnchorAsOf=(r.get('shareAnchor') or {}).get('asOf'),marketAsOf=(r.get('marketReference') or {}).get('tradingDate'),
                researchAsOf='2026-11-04',sourceKnownAt=None,reviewKnownAt=challenge_['createdAt'],
                valuation=dict(modelFamily=r.get('researchModelFamily','PRIOR_11_CONDITIONAL_MODEL'),range=r['equityScenarioRange'],confidence='CONDITIONAL_UNQUALIFIED_FOR_INTRINSIC_VALUE',
                    expectedReturn=None,priceBasisQualified=False,acceptedFairValuePerShare=None),
                historicalAssessment=dict(points=historic,hash=old['retainedHistoricalAssessmentHash'],acceptedForChangedDataset=False),
                currentAssessment=a,currentPoints=a['selectedPoints'] if a else None,
                status='COMPLETED_CURRENT_RESEARCH_ASSESSMENT' if completed else 'NOT_RATED',
                missingOrConflictingEvidence=missing,currentEconomicDependencies=r['blockingBeforeDatedTradeConclusion'],
                sourceConflictDisposition=p.get('accountingConflictDisposition'),expiredPriorBindings=sorted(expired),oldBindingsRenewed=False,
                requiredAction='Obtain formal evidence/time, trusted review and exact DI binding before any production use; no additional research point inferred.' if completed else required_action(rid),
                productionScoringReady=False,financialCriteriaChanged=False)
            rows.append(row)
    if len(rows)!=690 or len({r['id'] for r in rows})!=690 or len(topics)!=2490:raise ValueError('EXACT_COVERAGE_REQUIRED')
    for path in [BASE/'2026-11-03/vic-parent-bridge-v1/decision.json',REMED/'VPL-segment-inputs.json',BASE/'2026-11-02/earnings-normalization-v3/checked-readings.json']:
        remember(path)
    dump(OUT/'evidence-catalog.json',dict(contract='r4-research-evidence-catalog-v1',evidence=catalog,sourceQualificationDoesNotGrantFormalTimeOrTopicAdmission=True))
    dump(OUT/'rubric-coverage.json',dict(contract='r4-rubric-coverage-v1',reviewedHead=state['reviewedHead'],rows=rows,topics=topics,
        currentResearchAssessments=len(actual),currentNotRated=690-len(actual),productionReadyRubrics=0,criteriaUnchanged=True))
    dump(OUT/'assessments/current-research-assessments.json',dict(contract='r4-partial-ai-assessment-artifacts-v1',assessments=actual,
        totalScore=None,productionReady=False,independentHumanReviewClaimed=False,formalAiScoreInput=False))
    issues=blocker_register(rows,state);dump(OUT/'blockers.json',issues)
    counts=dict(currentResearchCompleted=len(actual),newlyAssessedFromHistoricalUnrated=len(actual),historicalScoresRetainedNotRevalidated=2,
        original688StillUnassessed=688-len(actual),currentNotRated=690-len(actual),productionReadyRubrics=0,acceptedFullIssuers=[],deferredFullIssuers=sorted(research),
        partiallyReviewedIssuers=list(ELIGIBLE),critical=sum(i['severity']=='Critical' for i in issues['issues']),major=sum(i['severity']=='Major' for i in issues['issues']),minor=sum(i['severity']=='Minor' for i in issues['issues']))
    dataset=dict(contract='m8-r4-evidence-rubric-review-snapshot-v1',reviewedHead=state['reviewedHead'],purpose='CURRENT_RESEARCH_NOT_FORMAL_SCORING',analysisMode='AS_REVISED',
        currentState=pin(OUT/'current-state.json'),rubrics=pin(OUT/'rubric-coverage.json'),evidence=pin(OUT/'evidence-catalog.json'),
        assessments=pin(OUT/'assessments/current-research-assessments.json'),preparation=pin(OUT/'reviews/preparation.json'),challenge=pin(OUT/'reviews/challenge.json'),
        financialMethodology=pin(ROOT/'src/domain/scoring/methodology.ts'),counts=counts,verdict='BLOCKED',
        productionScoringAuthorized=False,sourcePromotion=False,navAuthorized=False,tradingAuthorized=False)
    dataset['contentHash']=canonical_hash(dataset);dump(OUT/'dataset-snapshot.json',dataset)
    dump(OUT/'di-gate-checks.json',di_checks(state,counts))
    dump(OUT/'provenance-verification.json',dict(contract='r4-research-provenance-check-v1',preparationBytes=pin(OUT/'reviews/preparation.json'),challengeBytes=pin(OUT/'reviews/challenge.json'),
        distinctPassArtifacts=True,hashAndAssessmentBindingsVerified=True,actualCurrentResearchJudgments=len(actual),
        preciseRuntimeModelId=None,authenticatedSessionId=None,trustedServerBindingsAvailable=False,
        formalProvenanceVerdict='BLOCKED',partialResearchEvidenceVerdict='PASS_WITH_CONDITIONS',
        actualToolAndCommandsRetained=True,independentHumanReviewClaimed=False,callerLabelsAreNotAuthentication=True))
    reports(state,dataset,rows,issues)
    for path in [Path(__file__).resolve(),ROOT/'scripts/lib/r4_rubric_completion.py',ROOT/'scripts/test-m8-r4-closure.py',ROOT/'scripts/verify-m8-r4-closure.mjs']:remember(path)
    dump(OUT/'manifest.json',dict(contract='m8-r4-closure-manifest-v1',sourcePins=pins,datasetContentHash=dataset['contentHash'],
        protectedDatabaseSha256=state['protectedDatabaseSha256'],outputs={rel(p):sha(p) for p in sorted(OUT.rglob('*')) if p.is_file() and p.name not in ('manifest.json','validation-results.json','VALIDATION.md') and '/validation/' not in str(p)}))
    print(json.dumps(dict(dataset=dataset['contentHash'],counts=counts,verdict='BLOCKED')))


def blocker_register(rows,state):
    # Explicit recurring issue identities and distinct prior milestone evidence, not phrase/turn counts.
    r4=R4/'RESULT.md';u2=BASE/'2026-11-02/vn30-underwriting-v2/REPORT.md';lineage=LINEAGE/'REPORT.md';remed=REMED/'REPORT.md';v4=V4/'REPORT.md';v2=RESEARCH/'REPORT.md';accept=BASE/'2026-11-04/fy2025-item-acceptance-v1/REPORT.md'
    specs=[
      ('R4-SOURCE','Missing source','Major','Qualified current market/session and original publication identity where PIT requires it.',[r4,remed,v2],'Select one decision cutoff; admit the required dated source or keep that decision scope deferred.'),
      ('R4-METRIC','Missing financial metric','Major','Selected exact operands, unrestricted cash and compatible debt remain unqualified; historical N/R counts are not all mandatory paths.',[r4,u2,v2],'Recompute only sector-required selected metrics from exact operands and classify remaining metrics as deferred or inapplicable.'),
      ('R4-BSR','Source conflict','Major','BSR printed EPS and capital subtotals remain inconsistent; derived branches are available, not issuer restatements.',[r4,u2,v2],'Use the pinned derived branch for bounded research and explicitly exclude the inconsistent printed subtotal from formal selection unless corrected/admitted.'),
      ('R4-FUNDS','Missing financial metric','Major','Final common fund distributions and transaction tax/NCI amounts remain partly conditional; GVR interim mapping is superseded, completeness is not.',[r4,u2,v4,v2],'Reconcile each named allocation once; accept a documented bounded assumption only in its approved scope, otherwise defer the issuer.'),
      ('R4-MAPPING','Identity/mapping conflict','Major','New LPB/SHB/VHM/VIC period overlays, TCX row-page schema and VHM NCI reading must reach selected-path lineage; CafeF unit/scope cannot be guessed.',[lineage,remed,v2],'Bind one versioned successor overlay to the selected source hash/period/row and preserve original bytes.'),
      ('R4-VALUE','Valuation evidence gap','Major','Thirty conditional research ranges are not thirty admitted primary values; mixed-group return crosschecks are not RNAV/SOTP.',[r4,u2,v2],'For the next issuer, defend the sector model and recoverable/common-owner cash-capital bridge with a substantive crosscheck; retain other issuers deferred.'),
      ('R4-CAPITAL','Valuation evidence gap','Major','Cash capex/WC/principal/restrictions and asset-quality/distributable-capital bridges remain open.',[r4,u2,remed,v2],'Close HPG/VPL cash allocation or one financial issuer capital-headroom bridge before relying on the corresponding cash/value output.'),
      ('R4-RIGHTS','Identity/mapping conflict','Major','All30 dated share/price bridges are incomplete; special preference/convertible/make-whole claims remain.',[r4,u2,v2],'Resolve one issuer issued-minus-treasury/outstanding/action/dilution chain against the same unadjusted/documented price date.'),
      ('R4-PIT','Point-in-time violation','Major','PIT prerequisites are unsatisfied for formal use; no new posted lookahead violation is asserted. Current research is AS_REVISED.',[lineage,remed,accept],'Retain AS_REVISED research; use the approved exact/date-precision route for any FORMAL AS_KNOWN dataset rather than relabelling retrieval time.'),
      ('R4-ASSESS','Review/provenance gap','Major','686 current rubric records remain NOT_RATED; four narrow RG-UNC judgments are complete only for current research.',[r4,lineage,remed,accept],'Review one next rubric from its required topics/counterevidence; do not use file absence or a hypothetical grid to assign zero.'),
      ('R4-PROVENANCE','Review/provenance gap','Critical','Separate real AI review artifacts now exist, but exact model/session authentication and trusted server bindings remain absent.',[lineage,remed,accept],'Retain partial reviews in research namespace; bind real runtime metadata/tool evidence through a trusted configured adapter before formal acceptance.'),
      ('R4-DI','Review/provenance gap','Critical','No registered exact snapshot/AI DI acceptance/requirements binding; all current full issuers remain deferred.',[r4,lineage,remed,accept],'Choose the compatible approved dataset/DI route and present one exact candidate for owner acceptance; never patch29to30 or fabricate human review.'),
      ('R4-RELEASE','Review/provenance gap','Critical','Static authority and21 migrations are resolved; financial/source/accounting and E3/M7/recovery/activation acceptance are separate.',[remed,accept,v2],'Keep production disabled; submit a separately scoped release/operational acceptance package after financial prerequisites pass.'),
      ('R4-INDEX','Identity/mapping conflict','Minor','current-review.json is a historical R4 pointer; current research has a separate v2 index.',[v2],'Preserve the historical index; add an explicit approved current research versus production-head selection if integration is authorized.')]
    issues=[]
    for ident,category,severity,description,paths,action in specs:
        paths=list(dict.fromkeys(paths));refs=[pin(p) for p in paths]
        issues.append(dict(id=ident,classification=category,severity=severity,status='ESCALATED' if len(refs)>2 else 'OPEN',
            description=description,priorReviewCycles=len(refs),recurrenceBasis='DISTINCT_RETAINED_REVIEW_PACKAGES_NOT_CHAT_TURNS_OR_INDEPENDENT_SIGNOFFS',
            evidence=refs,oneConcreteResolutionOrDecision=action))
    return dict(contract='r4-classified-blocker-register-v1',issues=issues,actualImplementationDefectsConfirmed=0,
        implementationDisposition='Prior extraction/schema defects have successor fixes. No new financial-formula defect demonstrated; do not invent one to justify changing approved code.',
        superseded=[
          dict(old='17 normalized inputs missing /19 models absent',current='All30 research dossiers present;29 working earnings points and705 scenarios; primary acceptance still absent.'),
          dict(old='TCX extracted report absent',current='Document exists; date-key/row-page schema handled in investment-research-v2.'),
          dict(old='LPB/SHB/VHM/VIC closing year unresolved;VHM NCI magnitude',current='Exact-source-page overlays/readings available; no global overwrite or automatic formal admission.'),
          dict(old='Static authority hash mismatch',current='Approved bundle verify PASS must be checked in current validation.'),
          dict(old='19/21 migrations',current=f"Actual read-only DB records{state['completedMigrations']} completed migrations."),
          dict(old='Owner must reconfirm TCB/MWG/custody/FPT facts',current='Resolved owner facts preserved; WP1 source/action/time/posting acceptance remains separate.'),
          dict(old='Sustainable-profit proof or2026tax return required for FY2025 analysis',current='Not a blanket gate for scoped reported analysis; documented assumptions and rubric prerequisites still apply.')])


def di_checks(state,counts):
    names=['Universe source/effective date','Universe completeness/identity','Sector routes','Required market data','Required fundamentals','Period/unit normalization','Missing-data controls','Freshness','Conflict/impossible-value controls','Derived lineage','Point-in-time controls','Reproducible sealed snapshot','Per-issuer readiness','Exact dataset review/provenance','Owner acceptance/release']
    out=[]
    for i,name in enumerate(names,1):
        prerequisite={1:'Retained30 is not a current live-index certification.',2:'30 unique issuer identities accounted for in research.',3:'Retained sector routes preserved; no reclassification.',4:'October30 reference prices are not current qualified market evidence.',5:'Financial contexts exist; canonical formal observation table is empty.',6:'Checked financial parity and scoped overlays are research evidence only.',7:'All690 records retain explicit missing prerequisites; no missing-to-zero conversion.',8:'1780 expired bindings remain excluded with no automatic renewal.',9:'BSR/GVR and source variants retained, not erased.',10:'Research/source hashes exist; formal derivation table is empty.',11:'AS_REVISED research cannot be relabelled FORMAL AS_KNOWN.',12:'New research manifest is not a sealed canonical snapshotRunId/contentHash/manifestDigest.',13:'0 full issuers accepted;30 deferred, four have one partial assessment.',14:'Preparation/challenge artifacts do not supply authenticated model/session/server pins.',15:'Owner approval pending; no production authorization.'}[i]
        out.append(dict(gate='DI'+str(i),requirement=name,formalStatus='BLOCKED' if i in (4,5,8,11,12,14,15) else 'NOT_ACCEPTED_FOR_CURRENT_DATASET',observedPrerequisite=prerequisite,
            historicalPassCarriedForward=False,automaticGatePass=False))
    return dict(contract='r4-current-di-gate-check-v1',gates=out,allRequiredGatesAccepted=False,
        routeConstraint='PersonalAI acceptance requires30accounted members andFORMAL AS_KNOWN; legacyPolicyB29/human route is not silently changed.',
        ownerAuthorizedSelfReviewDoesNotClaimIndependentHuman=True)


def reports(state,dataset,rows,issues):
    count=dataset['counts'];base=state['reviewedHead'];dataset_id=dataset['contentHash'];by=defaultdict(list)
    for r in rows:by[r['ticker']].append(r)
    common=f'Reviewed source HEAD: `{base}`. Dataset content identity: `{dataset_id}`. Research mode: AS_REVISED. Verdict: **BLOCKED for R4 financial/production scoring acceptance**. No production activation, accounting posting, authority promotion or methodology change.\n'
    current=['# R4_CURRENT_STATE','',common,'## Actual state revalidated','',
        f"- SQLite mode=ro; DB SHA256 `{state['protectedDatabaseSha256']}`; completed migrations: {state['completedMigrations']}.",
        f"- Exactly690 assessments: baseline688 unrated and two historicalRG-UNC0 (ACB/VNM). This review completes4new current-researchRG-UNC judgments;684 of the original688 remain unassessed. Including two historical scores not revalidated against changed inputs, current NOT_RATED is686. No formal scoring-ready rubric or full issuer is accepted.",
        '- All30 financial research dossiers exist.29 working earnings points; VIC has no selected earnings point. New672 sensitivities plus prior33scenarios are not705 independent valuations.',
        f"- DB embedded research: {state['embeddedCanonicalFacts']} facts / {state['embeddedDerivedEntries']} derived entries. Statuses: `{state['embeddedDerivedStatuses']}`. N/R reasons: `{state['embeddedNrReasons']}`.",
        f"- Historical candidate states: `{state['candidateStatuses']}`. These are not all mandatory current-selected paths; successor evidence must be reconciled before carrying blockers forward.",
        f"- Canonical/acceptance tables: `{state['tableCounts']}`. AI acceptance registry entries:{state['aiAcceptanceRegistryCount']}; readiness registry entries:{state['readinessRegistryCount']}.",
        '- Source metadata remains exact: unknown publication or receipt instants stay null. Current review time is not an issuer publication time.',
        '- All690rubrics and2490topics were traversed. Older worklists/seals and their original scores remain byte-identical.','',
        '## AI route and DI','',
        'AI origin/self-review contracts exist. The legacy HUMAN contract and29-member PolicyB route remain unchanged. The current research dataset is not a personal-ai-di-acceptance-v1 object; formal gates require exact time/snapshot/provenance bindings. Every DI gate and observed prerequisite is in di-gate-checks.json. No all-PASS overlay is fabricated.','',
        'State capture, exact source pins and unchanged HUMAN/methodology hashes: current-state.json and manifest.json. This package records its reviewed baseline commit; the enclosing evidence commit is reported after creation, never invented in advance.']
    (OUT/'R4_CURRENT_STATE.md').write_text('\n'.join(current)+'\n')
    matrix=['# R4_RUBRIC_COVERAGE_MATRIX','',common,
        '690rows follow. Every record in rubric-coverage.json also carries complete source identity, publication/known-at fields, actual topic IDs, candidate graph/source pointers, value confidence, old score/hash, current decision, exact missing prerequisites and next action. Candidate financial context is not proof of a rubric topic. Full evidence identities resolve through evidence-catalog.json.','',
        '| Ticker | Rubric/max | Available financial evidence | Source/publication | Period / capital / price | Known-at | Valuation/confidence | Historical → current | Missing prerequisite / action |',
        '|---|---|---|---|---|---|---|---|---|']
    for r in rows:
        ev=r['financialEvidenceAvailable'];src=r['publicationIdentity'];v=r['valuation'];old=r['historicalAssessment']['points'];cur=r['currentPoints'];point='NOT_RATED' if cur is None else str(cur)+'/2 research'
        matrix.append(f"| {r['ticker']} | {r['rubricId']}/{r['maxPoints']} | {len(ev['candidateSourceRefs'])} candidate source nodes; checked FY25 context; topic qualification separate | {r['ticker']} PDF p{src['physicalPage']}; hash/identity in JSON; publication UNKNOWN | FY25 / {r['capitalAsOf']} / {r['marketAsOf']} | source UNKNOWN; review {r['reviewKnownAt']} | {v['modelFamily']}; CONDITIONAL | {old if old is not None else 'N/R'} → {point} | {r['requiredAction']} |")
    (OUT/'R4_RUBRIC_COVERAGE_MATRIX.md').write_text('\n'.join(matrix)+'\n')
    gaps=['# R4_FINANCIAL_EVIDENCE_GAPS','',common,
        '## Classification and action','', '| ID | Class | Severity | Current evidence / limitation | Required action |','|---|---|---|---|---|']
    for i in issues['issues']:gaps.append(f"| {i['id']} | {i['classification']} | {i['severity']} | {i['description']} | {i['oneConcreteResolutionOrDecision']} |")
    gaps+=['','## Precise per-issuer financial dependencies','']
    for t,rs in sorted(by.items()):
        r=rs[0];gaps += [f"- **{t}:** {'; '.join(r['currentEconomicDependencies'])}. Counter/source conflict disposition remains `{r['sourceConflictDisposition']}`."]
    gaps+=['','No new actual implementation defect was demonstrated. The exact-page/schema corrections from v2 remain valid successors. This package adds a deterministic coverage/partial-assessment validator; it does not redesign runtime scoring or relabel approval boundaries as software bugs.','',
        'Missing source is limited to the specific required role/cutoff/terms, not a blanket claim that company reports are absent. No personal trading history is requested. MBB temporary capital-source deferral/no-automatic-retry owner rule is retained.']
    (OUT/'R4_FINANCIAL_EVIDENCE_GAPS.md').write_text('\n'.join(gaps)+'\n')
    escalated=['# R4_ESCALATED_BLOCKERS','',common,
        'ESCALATED means the same unresolved dependency survives more than two distinct retained review packages. The count is not a count of chat turns, test retries or independent financial signoffs. Every cited file is hash-pinned in blockers.json.','',
        '| ID | Prior packages | Status | One concrete resolution / owner decision |','|---|---:|---|---|']
    for i in issues['issues']:escalated.append(f"| {i['id']} | {i['priorReviewCycles']} | {i['status']} | {i['oneConcreteResolutionOrDecision']} |")
    escalated+=['','## Superseded blockers — do not reopen unchanged','']+[f"- **{s['old']}** → {s['current']}" for s in issues['superseded']]
    (OUT/'R4_ESCALATED_BLOCKERS.md').write_text('\n'.join(escalated)+'\n')
    results=['# R4_REMEDIATION_RESULTS','',common,
        '## Completed actual assessment artifacts','',
        '| Ticker | Approved rubric / band | Points | Economic support | Counterevidence |','|---|---|---:|---|---|']
    for t in ELIGIBLE:results.append(f"| {t} | RG-UNC / High uncertainty | 0/2 | {RATIONALES[t][0]} | {RATIONALES[t][1]} |")
    results+=['','These are judgments of value-thesis uncertainty, not total scores, stock recommendations, penalties for missing files or claims of financial distress. Preparation and challenge are real separate review passes by the same AI; no independent-human or authenticated-session claim is made.','',
        'All other686current records remain NOT_RATED. ACB/VNM historical0scores stay archived, not renewed automatically. High-level evidence mapping or a wide analyst discount grid does not qualify a new band. In particular, VAL-PRIMARY0means Clearly overvalued under the approved rubric; it must never mean No valuation supplied.','',
        '## Provenance limitation','',
        'Actual actor, operation commands, execution times, artifact hashes, evidence pointers, assessment hashes and separate pass records are retained. Precise runtime model ID and authenticated session ID are not exposed and remain null. No model/session/tool attestation is invented. provenance-verification.json distinguishes local byte/content checks from missing trusted execution provenance; formal AI scoring remains BLOCKED.','',
        '## Validation','',
        'Exact executed commands/results are recorded in validation-results.json and VALIDATION.md after testing. Source and financial parity checks are explicit in reviews/challenge.json. Deterministic Python and actual approved TypeScript rubric/DI validators are used. No full release/build claim is inferred from scoped tests.']
    (OUT/'R4_REMEDIATION_RESULTS.md').write_text('\n'.join(results)+'\n')
    final=['# R4_FINAL_ACCEPTANCE_ASSESSMENT','',common,
        f"- Current research assessments completed: **{count['currentResearchCompleted']}/690** (BSR/VIC/VJC/VPL RG-UNC0/2).",
        f"- Remaining current NOT_RATED: **{count['currentNotRated']}/690**. Of the original688unassessed,684remain; two old scored records also await current revalidation.",
        '- Accepted complete scoring issuers: **0**. Deferred complete scoring issuers: **all30**. Four issuers have a narrow completed research judgment, not issuer-level acceptance.',
        f"- Issue severity: **{count['critical']} Critical / {count['major']} Major / {count['minor']} Minor**. Severity is specific to R4 closure; historical source errors are not new production mutations.",
        '- Local evidence/partial-review validation: **PASS WITH CONDITIONS** only if validation-results.json records passing checks. Trusted execution provenance, formal DI/valuation/snapshot/market and production readiness remain **BLOCKED**.',
        '- Financial criteria, approved rubrics/weights, investment rules and HUMAN contracts unchanged. No Buy/Sell publication, accounting modification, source promotion or production authorization.', '',
        '## Exact remediation sequence and acceptance criteria','',
        '1. Choose the exact decision cutoff and compatible approved dataset/DI route; preserve AS_REVISED versus AS_KNOWN and legacy HUMAN/PolicyB boundaries. Acceptance: no contract relabelling or silent29→30change.',
        '2. Apply successor source overlays to selected paths only. Acceptance: exact source hash/period/scope/unit/row lineage, original bytes unchanged; mandatory metric operands complete or issuer explicitly deferred.',
        '3. Close the next issuer economic/common-claim and cash/capital bridge. Acceptance: documented model assumptions and substantive economic crosscheck, no invented fund/tax/NCI or duplicate debt/cash. Do not demand proof of future profits or a2026tax return for FY25research.',
        '4. Qualify the same-date share/action/price basis. Acceptance: supported issued/treasury/outstanding/dilution chain and market/session/unit evidence, without provisional-right double counting.',
        '5. Complete each required rubric topic and distinct counterevidence channel. Acceptance: approved band selection with real supporting facts/estimates, no N/R→0 conversion, no weight redistribution or expired dependencies selected.',
        '6. Bind authenticated actual AI preparation/challenge artifacts and required source/time evidence to an exact sealed dataset; run DI1–DI15 without inherited PASS booleans. Acceptance: trusted model/session/tool bindings and approved exact acceptance/requirements registrations.',
        '7. Submit the resulting R4 acceptance candidate to the owner. Operational release, WP1 postings, NAV/scoring activation and trading remain separately authorized operations.','',
        '**Exact next action:** owner approval of this partial-review disposition and the scoped next issuer/rubric closure sequence. Until then, stop remediation and leave all production gates disabled.']
    (OUT/'R4_FINAL_ACCEPTANCE_ASSESSMENT.md').write_text('\n'.join(final)+'\n')


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('phase',choices=['inspect','prepare','challenge','build']);args=parser.parse_args()
    {'inspect':inspect,'prepare':prepare,'challenge':challenge,'build':build}[args.phase]()
