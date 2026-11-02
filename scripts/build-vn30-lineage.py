#!/usr/bin/env python3
"""Source-rooted review DAG for all retained VN30 issuers; no admission side effects."""
import argparse
import hashlib
import json
import re
from decimal import Decimal, getcontext
from pathlib import Path

getcontext().prec=60
ROOT=Path(__file__).resolve().parents[1]
BASE=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30')
HELD=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/held-normalization-v1')
OUT=Path('docs/fundamental-data-engine/scoring-dataset-acceptance/2026-11-02/vn30-lineage-v1')
D=Decimal


def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def semantic_hash(x):return hashlib.sha256(canonical(x).encode()).hexdigest()
def decimal_text(x):
    q=D(x).quantize(D('.000000000001'))
    return '0' if not q else format(q,'f').rstrip('0').rstrip('.')
def pointer_value(obj,pointer):
    for part in pointer.split('/')[1:]:
        key=part.replace('~1','/').replace('~0','~')
        obj=obj[int(key)] if isinstance(obj,list) else obj[key]
    return obj


def build():
    pins={};cache={}
    def pin(path,expected=None):
        path=str(path)
        if path not in pins:pins[path]=hashlib.sha256((ROOT/path).read_bytes()).hexdigest()
        if expected is not None and pins[path]!=expected:raise ValueError('SOURCE_HASH_MISMATCH:'+path)
        return pins[path]
    def read(path):
        path=str(path);pin(path)
        if path not in cache:cache[path]=json.loads((ROOT/path).read_text())
        return cache[path]
    cfg=read(OUT/'inputs.json');known=cfg['reviewedAt'];rubrics=cfg['methodology']['RUBRICS']
    if len(rubrics)!=23 or sum(r['max'] for r in rubrics)!=100:raise ValueError('UNCHANGED_23_RUBRIC_100_POINT_POLICY_REQUIRED')
    prior=read(Path('docs/fundamental-data-engine/scoring-dataset-acceptance/current-review.json'))
    pin(prior['manifestPath'],prior['manifestSha256'])
    for ref in [dict(path=prior['manifestPath'],sha256=prior['manifestSha256']),prior['priorReviewManifest']]:
        pin(ref['path'],ref['sha256'])
        sealed=read(ref['path'])
        for old_pin in sealed.get('artifactPins',[])+sealed.get('builderPins',[]):pin(old_pin['path'],old_pin['sha256'])
    market_review=read(BASE/'b6-economics-r3/market-review.json')
    allfacts=read(BASE/'b6-economics-r3/checked-common-earnings.json')['facts']
    contexts={c['observationId']:c for c in read(BASE/'b6-comparability-r2/native-review-sources.json')['contexts']}
    if len(allfacts)!=30 or len({f['ticker'] for f in allfacts})!=30:raise ValueError('EXACT_RETAINED_THIRTY_REQUIRED')
    tickers=sorted(f['ticker'] for f in allfacts)
    outputs={};members=[];counts={'source':0,'normalized':0,'derived':0,'evidence':0,'rubric':0,'retainedAssessedRubrics':0,'stalePriorFactBindings':0,'invalidLegacyPageLocators':0,'repairedLegacyPageLocators':0}
    for f in sorted(allfacts,key=lambda f:f['ticker']):
        ticker=f['ticker'];native_path=BASE/f'b6-comparability-r2/native-inputs/{ticker}.json';native=read(native_path)
        old_path=BASE/f'b6-underwriting-r4/issuers/{ticker}.json';old=read(old_path)
        if native['ticker']!=ticker or old['ticker']!=ticker:raise ValueError('ISSUER_BINDING_MISMATCH')
        nodes=[];ids=set();norm_ids={};obs_by_id={o['id']:o for o in native['observations']}
        def add(identifier,kind,inputs=(),value=None,unit=None,start=None,end=None,scope=None,classification='CONTEXT',operation='REFERENCE',multiplier=None,source=None,details=None):
            if identifier in ids:raise ValueError('DUPLICATE_NODE:'+identifier)
            if any(i not in ids for i in inputs):raise ValueError('DANGLING_OR_FORWARD_INPUT:'+identifier)
            node=dict(id=identifier,kind=kind,ticker=ticker,inputs=list(inputs),value=value,unit=unit,periodStart=start,periodEnd=end,reportingScope=scope,classification=classification,operation=operation,multiplier=multiplier,source=source,details=details or {})
            node['hash']=semantic_hash(node);nodes.append(node);ids.add(identifier);counts[kind.lower()]+=1;return identifier
        def source(identifier,path,pointer,unit=None,start=None,end=None,scope=None,pdf=None,pdf_hash=None,page=None,classification='REPORTED',details=None):
            obj=read(path);payload=pointer_value(obj,pointer)
            if pdf:pin(pdf,pdf_hash)
            value=payload if isinstance(payload,str) and re.fullmatch(r'-?(0|[1-9]\d*)(\.\d{1,12})?',payload) else None
            return add(identifier,'SOURCE',value=value,unit=unit,start=start,end=end,scope=scope,classification=classification,operation='SOURCE',source=dict(path=str(path),sha256=pin(path),pointer=pointer,payloadHash=semantic_hash(payload),pdfPath=pdf,pdfSha256=pdf_hash,physicalPage=page),details=details)
        for index,o in enumerate(native['observations']):
            c=contexts.get(o['id'])
            if not c or not c.get('sourcePath') or not c.get('sourceHash'):raise ValueError('OBSERVATION_SOURCE_BINDING_MISSING:'+o['id'])
            pin(c['sourcePath'],c['sourceHash'])
            page_match=re.search(r'#page=(\d+)',o['raw']['fieldLocator']);page=int(page_match.group(1)) if page_match else None
            # Only use a physical page when the locator names this exact source, not an unrelated transcription.
            invalid_page=page==0
            repair=next((r for r in cfg.get('locatorRepairs',[]) if r['observationId']==o['id']),None)
            if invalid_page:
                counts['invalidLegacyPageLocators']+=1;page=None
                if repair:
                    if repair['pdfPath']!=c['sourcePath'] or repair['pdfSha256']!=c['sourceHash'] or repair['periodEnd']!=o['periodEnd'] or repair['valueVnd']!=o['normalized']['value'] or not repair['fullPageImageInspected']:raise ValueError('LOCATOR_REPAIR_BINDING_MISMATCH')
                    page=repair['physicalPage'];counts['repairedLegacyPageLocators']+=1
            if page and not repair and not o['raw']['fieldLocator'].startswith(c['sourcePath']+'#'):page=None
            dims=dict(start=o['periodStart'],end=o['periodEnd'],scope=o['reportingScope'])
            sid=source('source:'+o['id'],native_path,f'/observations/{index}/raw/lexicalValue',unit=o['raw']['unit'],pdf=c['sourcePath'],pdf_hash=c['sourceHash'],page=page,details=dict(sourceLevel='RETAINED_TRANSCRIPTION_NOT_NEW_PDF_CELL_REVIEW',observationHash=semantic_hash(o),invalidLegacyPageLocator=invalid_page,locatorRepair=repair,originalFieldLocator=o['raw']['fieldLocator'],retrievedAt=o['retrievedAt'],ingestedAt=o['ingestedAt'],publication=o['publication'],canonicalId=c.get('canonicalId'),sourceContext=c),**dims)
            raw=D(o['raw']['lexicalValue'])*D(o['raw']['multiplier']);expected=D(o['normalized']['value'])
            magnitude=raw<0 and o['itemId']=='CASH_CAPEX_REPORTED' and -raw==expected
            if (abs(raw) if magnitude else raw)!=expected:raise ValueError('UNSUPPORTED_NORMALIZATION:'+o['id'])
            norm_ids[o['id']]=add('normalized:'+o['id'],'NORMALIZED',[sid],value=decimal_text(expected),unit=o['normalized']['unit'],operation='ABS_NORMALIZE' if magnitude else 'NORMALIZE',multiplier=o['raw']['multiplier'],classification='REPORTED',details=dict(itemId=o['itemId'],observationId=o['id'],sourcePdfHash=c['sourceHash'],sourceVintage=c.get('periodBridgeId'),economicNormalization=False,accountingBasis=o['accountingBasis'],sourceRevision=o['revisionKind']),**dims)
        market_path=BASE/f'b6-economics-r3/issuers/{ticker}.json';market=read(market_path)['valuation']['market']
        verified_market=next(x for x in market_review['rows'] if x['ticker']==ticker)
        if market['observationId']!=verified_market['observationId'] or market['sourceObservationId']!=verified_market['sourceObservationId'] or market['tradingDate']!=verified_market['tradingDate']:raise ValueError('DATED_MARKET_REFERENCE_BINDING_MISMATCH')
        market_dims=dict(start=market['tradingDate'],end=market['tradingDate'],scope='MARKET')
        market_source=source('source:dated-market-price',market_path,'/valuation/market/value',unit='CURRENCY_PER_SHARE',classification='CONTEXT',details=dict(market=market,knownAt=market['receivedAt'],currentExecutableQuote=False),**market_dims)
        dated_price=add('normalized:dated-market-price','NORMALIZED',[market_source],value=market['value'],unit='CURRENCY_PER_SHARE',classification='CONTEXT',operation='NORMALIZE',multiplier='1',details=dict(tradingDate=market['tradingDate'],adjustment=market['adjustment'],currentQuote=False,productionScoringAuthorized=False),**market_dims)
        profile=old['currentSharesReference']
        profile_hash=pin(profile['source'])
        for kind in ['listed','outstanding']:
            if profile.get(kind) and profile[kind].get('value'):
                ps=source(f'source:shares-{kind}',old_path,f'/currentSharesReference/{kind}/value',unit='SHARES',classification='CONTEXT',start=profile['date'][:10],end=profile['date'][:10],scope='MARKET',details=dict(profilePath=profile['source'],profileHash=profile_hash,observedAt=profile['date'],provisionalRightsWarning=profile[kind].get('notes',[])))
                add(f'normalized:shares-{kind}','NORMALIZED',[ps],value=profile[kind]['value'],unit='SHARES',classification='CONTEXT',operation='NORMALIZE',multiplier='1',start=profile['date'][:10],end=profile['date'][:10],scope='MARKET',details=dict(kind=kind,currentOutstandingAccepted=False,actionBridgeVerified=False))
        if 'normalized:shares-outstanding' in ids and profile['date'][:10]==market['tradingDate']:
            add('derived:reference-market-cap','DERIVED',[dated_price,'normalized:shares-outstanding'],value=decimal_text(D(market['value'])*D(profile['outstanding']['value'])),unit='CURRENCY',classification='CONTEXT',operation='MULTIPLY',details=dict(metric='UNQUALIFIED_REFERENCE_MARKET_CAP',denominatorAccepted=False,currentExecutableQuote=False),**market_dims)
        # Common-owner numerator is a separate population from total consolidated profit.
        fi=next(i for i,x in enumerate(allfacts) if x['ticker']==ticker)
        fact_path=BASE/'b6-economics-r3/checked-common-earnings.json';scope=f['sourceScope'];dims=dict(start='2025-01-01',end='2025-12-31',scope=scope)
        common_src=source('source:common-note',fact_path,f'/facts/{fi}/reportedCommonProfit',unit=f['declaredCurrencyUnit'],pdf=f['source']['pdfPath'],pdf_hash=f['source']['sha256'],page=f['source']['page'],details=dict(knownAt=f['review']['reviewedAt'],fundStatus=f['fundStatus']),**dims)
        common=add('normalized:reported-common','NORMALIZED',[common_src],value=f['reportedCommonProfitVnd'],unit='CURRENCY',classification='CONFLICT' if ticker=='BSR' else 'REPORTED',operation='NORMALIZE',multiplier=f['currencyMultiplier'],details=dict(fundStatus=f['fundStatus'],economicNormalization=False),**dims)
        shares_src=source('source:weighted-shares',fact_path,f'/facts/{fi}/weightedAverageShares',unit='SHARES',pdf=f['source']['pdfPath'],pdf_hash=f['source']['sha256'],page=f['source']['page'],**dims)
        shares=add('normalized:weighted-shares','NORMALIZED',[shares_src],value=f['weightedAverageShares'],unit='SHARES',classification='REPORTED',operation='NORMALIZE',multiplier='1',details=dict(currentOutstanding=False),**dims)
        reported_eps=add('derived:reported-weighted-eps','DERIVED',[common,shares],value=decimal_text(D(f['reportedCommonProfitVnd'])/D(f['weightedAverageShares'])),unit='CURRENCY_PER_SHARE',classification='CONFLICT' if ticker=='BSR' else 'CONTEXT',operation='RATIO',details=dict(historicalWeightedOnly=True,printedEps=f['reportedBasicEps'],notCurrentPerShareValuation=True),**dims)
        conflicts=[];conflict_inputs=[];conflict_context=[]
        if ticker in ['BSR','GVR']:
            conflict_path=OUT/'conflict-readings.json';cr=read(conflict_path)[ticker]
            for idx,r in enumerate(cr['readings']):
                rs=source('source:conflict:'+r['id'],conflict_path,f'/{ticker}/readings/{idx}/valueVnd',unit='CURRENCY',start=r['periodStart'],end=r['periodEnd'],scope=r['scope'],pdf=r['pdfPath'],pdf_hash=r['pdfSha256'],page=r['page'],details=dict(caption=r['caption'],reviewedAt=known,publicationVerified=False))
                conflict_inputs.append(add('normalized:conflict:'+r['id'],'NORMALIZED',[rs],value=r['valueVnd'],unit='CURRENCY',start=r['periodStart'],end=r['periodEnd'],scope=r['scope'],classification='REPORTED',operation='NORMALIZE',multiplier='1'))
            if ticker=='BSR':
                arithmetic=add('derived:bsr-arithmetic-alternative','DERIVED',conflict_inputs[:2],value=decimal_text(D(cr['readings'][0]['valueVnd'])-D(cr['readings'][1]['valueVnd'])),unit='CURRENCY',classification='CONFLICT',operation='SUBTRACT',details=dict(issuerConfirmedCorrection=False,notFinalNormalizedProfit=True),**dims)
                add('derived:bsr-printed-minus-arithmetic','DERIVED',[common,arithmetic],value='21135191895',unit='CURRENCY',classification='CONFLICT',operation='SUBTRACT',details=dict(unexplainedSourceSubtotal=True),**dims)
                add('derived:bsr-alternative-weighted-eps','DERIVED',[arithmetic,shares],value=decimal_text(D('5209551050863')/D(f['weightedAverageShares'])),unit='CURRENCY_PER_SHARE',classification='CONFLICT',operation='RATIO',details=dict(wholeVndRoundingCompatible=True,notIssuerCorrection=True),**dims)
                add('derived:bsr-later-parent-fund-partial','DERIVED',[arithmetic,conflict_inputs[2]],value='4837780950863',unit='CURRENCY',classification='CONFLICT',operation='SUBTRACT',details=dict(finalSubsidiaryFundAttributionUnknown=True,fullYearRestatedCommonProfit=False,knownLaterThanOriginalAnnualReport=True),**dims)
            conflict_context=[n['id'] for n in nodes if n['id'].startswith('normalized:conflict:') or n['id'].startswith('derived:bsr-')]
            if ticker=='BSR':
                ownership=cr['ownershipReference']
                ownership_source=source('source:bsr-subsidiary-ownership',conflict_path,'/BSR/ownershipReference/valuePercent',unit='PERCENT',pdf=ownership['pdfPath'],pdf_hash=ownership['pdfSha256'],page=ownership['page'],details=dict(precision=ownership['precision']),**dims)
                conflict_context.append(add('normalized:bsr-subsidiary-ownership','NORMALIZED',[ownership_source],value='0.8326',unit='RATIO',classification='REPORTED',operation='NORMALIZE',multiplier='0.01',details=dict(exactShareFraction=False,finalFundAttribution=False),**dims))
            conflicts=cr['disposition']
        derived=[]
        for index,m in enumerate(native['metricCandidates']):
            operands=m['operandObservationIds'];op='GROWTH' if m['metric']=='ISSUER_SAME_METHOD_YOY_GROWTH' else 'RATIO'
            if len(operands)!=2 or any(x not in norm_ids for x in operands):raise ValueError('METRIC_OPERANDS_MISSING')
            a,b=(obs_by_id[x] for x in operands)
            matched=a['reportingScope']==b['reportingScope']==m['scope'] and a['normalized']['unit']==b['normalized']['unit']
            if op=='RATIO':matched=matched and a['periodStart']==b['periodStart'] and a['periodEnd']==b['periodEnd']
            else:matched=matched and a['periodEnd']==m['periodEnd'] and b['periodEnd']==m['basePeriodEnd'] and m.get('scopeBasis')=='FTEL_EQUITY_METHOD_BOTH_PERIODS'
            av,bv=D(a['normalized']['value']),D(b['normalized']['value'])
            calc=av/bv-(1 if op=='GROWTH' else 0) if bv else None
            if calc is not None and abs(calc-D(m['value']))>D('.000000000001'):raise ValueError('RETAINED_METRIC_REPLAY_MISMATCH:'+ticker+':'+m['metric'])
            did=add(f'derived:metric:{index}','DERIVED',[norm_ids[x] for x in operands],value=decimal_text(calc) if matched and calc is not None else None,unit='RATIO',start=m['periodStart'],end=m['periodEnd'],scope=m['scope'],classification='CONTEXT' if matched and calc is not None else 'MISSING',operation=op,details=dict(metric=m['metric'],retainedReferenceValue=m['value'],samePopulation=matched,itemId=m.get('itemId'),limitations=m['limitations'],scoringQualified=False))
            derived.append((did,m['metric']))
        for index,m in enumerate(native['nativeDerivations']):
            operands=m['operandObservationIds']
            if len(operands)!=2 or any(x not in norm_ids for x in operands):raise ValueError('CASH_BRIDGE_OPERANDS_MISSING')
            a,b=(obs_by_id[x] for x in operands)
            matched=a['reportingScope']==b['reportingScope'] and a['periodStart']==b['periodStart'] and a['periodEnd']==b['periodEnd']
            calc=D(a['normalized']['value'])-D(b['normalized']['value'])
            if calc!=D(m['value']):raise ValueError('CASH_BRIDGE_REPLAY_MISMATCH')
            did=add(f'derived:cash-bridge:{index}','DERIVED',[norm_ids[x] for x in operands],value=decimal_text(calc) if matched else None,unit='CURRENCY',start=m['periodStart'],end=m['periodEnd'],scope=a['reportingScope'],classification='CONTEXT' if matched else 'MISSING',operation='SUBTRACT',details=dict(metric='REPORTED_POST_ACQUISITION_CASH',definition=m['definition'],ownerFcfe=False,scoringQualified=False));derived.append((did,'REPORTED_POST_ACQUISITION_CASH'))
        economic=[];model_context=[];hp=ROOT/HELD/f'issuers/{ticker}.json'
        if hp.exists():
            held=read(HELD/f'issuers/{ticker}.json')
            model_notes=[]
            for ni,note in enumerate(held['checkedNoteReadings']):
                note_dims=dict(start=f"{note['fiscalYear']}-01-01",end=f"{note['fiscalYear']}-12-31",scope='CONSOLIDATED')
                ns=source(f'source:model-note:{ni}',HELD/f'issuers/{ticker}.json',f'/checkedNoteReadings/{ni}/valueVnd',unit='CURRENCY',pdf=note['sourcePdf'],pdf_hash=note['sourceHash'],page=note['physicalPage'],details=dict(caption=note['caption'],readingId=note['id']),**note_dims)
                model_notes.append(add(f'normalized:model-note:{ni}','NORMALIZED',[ns],value=note['valueVnd'],unit='CURRENCY',classification='REPORTED',operation='NORMALIZE',multiplier='1',**note_dims))
            for index,s in enumerate(held['scenarios']):
                model_context.append(source(f'source:full-model-scenario:{index}',HELD/f'issuers/{ticker}.json',f'/scenarios/{index}',classification='ASSUMPTION',details=dict(economicAcceptance=False,scenario=s['name'])))
                src=source(f'source:scenario:{index}',HELD/f'issuers/{ticker}.json',f'/scenarios/{index}/normalization/scenarioCommonProfit',unit='CURRENCY',classification='ASSUMPTION',**dims)
                model_value=add(f'normalized:economic:{index}','NORMALIZED',[src],value=s['normalization']['scenarioCommonProfit'],unit='CURRENCY',classification='ASSUMPTION',operation='NORMALIZE',multiplier='1',details=dict(scenario=s['name'],normalizationQualified=False,scenarioArtifactHash=pin(HELD/f'issuers/{ticker}.json')),**dims)
                economic.append(add(f'derived:economic-trace:{index}','DERIVED',[model_value,common,*model_notes],value=s['normalization']['scenarioCommonProfit'],unit='CURRENCY',classification='ASSUMPTION',operation='MODEL_REFERENCE',details=dict(assumptionDependent=True,modelFormulaReplayed=False,formulaReplayCommand='python3 scripts/test-held-normalization.py',scenario=s['name']),**dims))
        elif ticker in ['ACB','VNM']:
            model_context.append(source('source:full-retained-model',old_path,'/conditionalValuation',classification='ASSUMPTION',details=dict(economicAcceptance=False)))
            pointer='/conditionalValuation/earningsAdjustment/modelCommonEarnings' if ticker=='ACB' else '/conditionalValuation/scenarios/1/normalizedCommonEarningsAfterScenarioHaircut'
            model_dims=dict(dims,scope=old['conditionalValuation']['sourceScope'])
            src=source('source:prior-economic-model',old_path,pointer,unit='CURRENCY',classification='ASSUMPTION',**model_dims)
            economic.append(add('normalized:economic:retained','NORMALIZED',[src],value=pointer_value(old,pointer),unit='CURRENCY',classification='ASSUMPTION',operation='NORMALIZE',multiplier='1',details=dict(scopeWarning=old['conditionalValuation']['sourceScope'],notReaccepted=True),**model_dims))
        else:
            economic.append(add('normalized:economic:unresolved','NORMALIZED',[common],value=None,unit='CURRENCY',classification='MISSING',operation='UNRESOLVED',details=dict(reason='Issuer-specific recurring profit, funds, common claims and reinvestment not qualified; no numeric default'),**dims))
        for index,eid in enumerate(list(economic)):
            enode=next(n for n in nodes if n['id']==eid)
            if enode['value'] is not None and enode['reportingScope']==scope:
                derived.append((add(f'derived:economic-to-reported:{index}','DERIVED',[eid,common],value=decimal_text(D(enode['value'])/D(f['reportedCommonProfitVnd'])),unit='RATIO',classification='ASSUMPTION',operation='RATIO',details=dict(metric='ECONOMIC_CANDIDATE_TO_REPORTED_COMMON',scoringQualified=False),**dims),'ECONOMIC_CANDIDATE_TO_REPORTED_COMMON'))
        # Every approved topic is mapped. Related context never becomes topic sufficiency.
        native_rubrics={r['subcategory']:r for r in native['rubricInputs']};assessments={r['subcategory']:r for r in old['scoreInput']['assessments']}
        metric_topics={
            'returns':['MARGIN'], 'margins':['MARGIN'], 'realization':['CFO','CASH'], 'working_capital':['CURRENT_RATIO'],
            'asset_quality':['RESERVES'], 'funding':['DEPOSITS','CASH'], 'leverage_context':['DEPOSITS'], 'liquidity':['CURRENT_RATIO','DEPOSITS'],
            'trend':['GROWTH'], 'reinvestment':['CASH'], 'capex':['CASH'], 'cycle_adjustment':['GROWTH'],
            'normalized_denominator':['ECONOMIC_CANDIDATE'], 'cross_check':['ECONOMIC_CANDIDATE'],
        }
        retained_evidence={}
        for ei,e in enumerate(old['scoreInput']['evidence']):
            retained_evidence[e['id']]=source(f'source:retained-assessment-evidence:{ei}',old_path,f'/scoreInput/evidence/{ei}',classification='CONTEXT',details=dict(originalQualification=e['qualification'],sourceEvidenceId=e['id'],knownAt=e['knownAt'],newScoringAdmission=False))

        for rubric in rubrics:
            rid=rubric['id'];nr=native_rubrics[rid];assessment=assessments[rid];topic_nodes=[]
            for topic in rubric['topics']:
                retained=next((x for x in nr['evidenceTopics'] if x['topic']==topic),None)
                refs=[] if retained is None else retained.get('observationIds',[])
                unresolved=[x for x in refs if x not in norm_ids]
                inputs=list(dict.fromkeys(norm_ids[x] for x in refs if x in norm_ids))
                for mid,metric in derived:
                    if any(fragment in metric for fragment in metric_topics.get(topic,[])):inputs.append(mid)
                if rid in ['BQ-EQ','BQ-CASH','VAL-PRIMARY','VAL-RET','VAL-MOS','CA-PSV']:inputs+=economic
                if rid in ['FH-STRESS','GQ-FWD','GQ-INC','IC-CYCLE','VAL-PRIMARY','VAL-RET','VAL-MOS','RG-UNC','CA-REINV','CA-DIST','CA-PSV']:inputs+=model_context
                for evidence_id in assessment['counterEvidenceRefs']:
                    if evidence_id in retained_evidence:inputs.append(retained_evidence[evidence_id])
                for topic_assessment in assessment['topics']:
                    if topic_assessment['topic']==topic:
                        inputs += [retained_evidence[eid] for eid in topic_assessment['refs'] if eid in retained_evidence]
                if topic in ['per_share','normalized_denominator','dilution','actions']:
                    inputs += [nid for nid in ['normalized:shares-listed','normalized:shares-outstanding','normalized:weighted-shares'] if nid in ids]
                if topic=='price':inputs.append(dated_price)
                if rid=='BQ-EQ':inputs.append(reported_eps)
                if rid in ['BQ-EQ','BQ-CASH','VAL-PRIMARY','VAL-RET','VAL-MOS','RG-GOV','RG-UNC','CA-DIST']:inputs+=conflict_context
                source_candidates=next((x for x in nr['sourceCandidates'] if x['topic']==topic),None)
                # Preserve targeted PDF candidates without claiming page contents have been reviewed.
                if source_candidates:
                    for candidate_index,ref in enumerate(source_candidates.get('references',[])):
                        if ref.get('pdfPath') and ref.get('sourceHash'):pin(ref['pdfPath'],ref['sourceHash'])
                    sid=source(f'source:topic-candidates:{rid}:{topic}',native_path,f"/rubricInputs/{next(i for i,x in enumerate(native['rubricInputs']) if x['subcategory']==rid)}/sourceCandidates/{next(i for i,x in enumerate(nr['sourceCandidates']) if x['topic']==topic)}",classification='CONTEXT',details=dict(checkedForRubricSufficiency=False))
                    inputs.append(sid)
                topic_nodes.append(add(f'evidence:{rid}:{topic}','EVIDENCE',list(dict.fromkeys(inputs)),classification='CONTEXT',operation='TOPIC_CONTEXT',details=dict(rubricId=rid,topic=topic,sufficientForScoring=False,unresolvedObservationReferences=unresolved,retainedSupport=None if retained is None else retained.get('topicSupport'),missing='Topic-specific underwriting and canonical evidence admission remain required; numerical relatedness alone is insufficient')))
            counts['retainedAssessedRubrics']+=assessment['points'] is not None
            add(f'rubric:{rid}','RUBRIC',topic_nodes,value=None if assessment['points'] is None else str(assessment['points']),unit='POINTS',classification='CONTEXT',operation='RUBRIC_MAPPING',details=dict(rubricId=rid,maxPoints=rubric['max'],category=rubric['category'],topics=rubric['topics'],retainedAssessment=assessment,retainedAssessmentPath=str(old_path),retainedAssessmentHash=semantic_hash(assessment),retainedAssessmentIsNewAcceptance=False,nativeCounterEvidence=nr['counterEvidence'],nativeRationale=nr['rationale'],maximumPrerequisite=rubric['maximumPrerequisite']))
        stale=[b['observationId'] for b in native['bridgePlan']['facts'] if b['validThrough']<known];counts['stalePriorFactBindings']+=len(stale)
        graph=dict(contract='personal-ai-review-lineage-v1',scope='REVIEW_CANDIDATE',ticker=ticker,securityId=native['securityId'],sector=native['sector'],knownAt=known,financialRulesHash=cfg['financialRulesHash'],nodes=nodes,sourceConflicts=conflicts,stalePriorFactBindings=stale,acceptance=dict(mapping='PENDING_VALIDATOR',financial='BLOCKED',normalizationQualified=False,productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False),compatibility=dict(target='personal-ai-di-acceptance-v1',directAdmission=False,missing=['Trusted preparation/challenge provenance and approval bindings','All 15 governed DI gates','Qualified normalized economics, valuation, market/share bridge and all rubric evidence']))
        graph['contentHash']=semantic_hash(graph);name=f'issuers/{ticker}.json';outputs[name]=json.dumps(graph,ensure_ascii=False,indent=2)+'\n'
        members.append(dict(ticker=ticker,securityId=native['securityId'],path=str(OUT/name),sha256=hashlib.sha256(outputs[name].encode()).hexdigest(),contentHash=graph['contentHash'],sourceConflicts=conflicts,nodeCount=len(nodes)))
    if len({m['securityId'] for m in members})!=30:raise ValueError('UNIQUE_SECURITY_IDENTITIES_REQUIRED')
    for path in ['src/domain/scoring/methodology.ts','src/domain/scoring/methodology/identity.ts','src/domain/scoring/methodology/sectors.ts','src/infrastructure/dependencies/active-authorities.json','scripts/build-vn30-lineage.py','src/domain/personal-ai/review-lineage.ts','src/infrastructure/personal-ai/review-lineage.ts','scripts/verify-vn30-lineage.mjs','tests/unit/review-lineage.test.ts','tests/integration/review-lineage.test.ts']:
        pin(path)
    snapshot=dict(contract='personal-ai-lineage-acceptance-snapshot-v1',scope='REVIEW_CANDIDATE',reviewMode='OWNER_AUTHORIZED_AI_SELF_REVIEW',independentHumanReviewClaimed=False,knownAt=known,ownerAuthorizationReference=cfg['ownerAuthorizationReference'],financialRulesHash=cfg['financialRulesHash'],universeScope=cfg['universeScope'],universeHash=semantic_hash([dict(ticker=m['ticker'],securityId=m['securityId']) for m in members]),members=members,counts=counts,sourcePins=pins,technicalAcceptance='REQUIRES_TRUSTED_REPLAY',financialAcceptance='BLOCKED',productionScoringAuthorized=False,navAuthorized=False,tradingAuthorized=False)
    snapshot['contentHash']=semantic_hash(snapshot);outputs['acceptance-snapshot.json']=json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n'
    lines=['# VN30 — mapping nguồn đến snapshot nghiệm thu', '', f"Snapshot review: {known}. Phạm vi: 30 mã VN30 lưu giữ trong dự án; không xác nhận lại thành phần chỉ số trực tiếp.", '', '**Chuỗi mapping hoàn tất cho 30 mã và 690 rubric. Nghiệm thu kỹ thuật phải qua validator; nghiệm thu tài chính vẫn BLOCKED.**', '', 'Nguồn → chuẩn hóa đơn vị/dấu → chỉ tiêu tái tính → bằng chứng theo từng topic rubric → snapshot hash. Chuẩn hóa đơn vị khác với chuẩn hóa kinh tế. Giữ nguyên 23 rubric, tổng trọng số 100 điểm và hai nhận định 0 điểm RG-UNC cũ; không biến N/R thành 0.', '', '| Mã | Nodes có lineage | Xử lý nguồn |', '|---|---:|---|']
    for m in members:lines.append(f"| [{m['ticker']}](issuers/{m['ticker']}.json) | {m['nodeCount']} | {'; '.join(m['sourceConflicts']) or 'Không có xung đột EPS BSR/GVR; vẫn theo giới hạn nguồn riêng'} |")
    lines+=['', '## BSR', '', 'Giữ nguyên số in 5.230.686.242.758 VND. Hai toán hạng kiểm tra ở trang 11/41 cho 5.213.612.063.223 − 4.061.012.360 = 5.209.551.050.863 VND, lệch 21.135.191.895 VND. Nhánh số học có EPS tương thích số nguyên 1.040, nhưng không phải bản đính chính của doanh nghiệp.', '', 'Nguồn bán niên 2026 trang 38 xác nhận trích 371.770.100.000 VND ở công ty mẹ từ lợi nhuận 2025; trang 39 có phân phối của BSPPT. Nhánh phân tích sau riêng quỹ công ty mẹ còn 4.837.780.950.863 VND, vẫn chưa là tử số cuối cùng: tỷ lệ sở hữu BSPPT được in là 83,26% ở trang 15, chưa phải phân số cổ phần chính xác; không suy tỷ lệ từ các số tiền, không cộng phần trích của công ty con 100% vào phần thuộc cổ đông mẹ, không trừ hai lần khoản đã tạm trích. Bảng vốn chủ bán niên không được coi là bảng EPS cả năm được công bố lại.', '', 'Xử lý: cách ly tổng in sai khỏi đầu vào chuẩn hóa kinh tế và mọi điểm VAL phụ thuộc; giữ nhánh số học và nhánh quỹ ghi nhận sau đó để review. Chưa đóng xác nhận sửa nguồn hoặc phân bổ quỹ cuối cùng.', '', '## GVR', '', 'Bảng EPS trang 90 khớp 5.318.551.565.051 − 317.726.455.843 = 5.000.825.109.208 VND. Trang 79 ghi cùng khoản 317.726.455.843 ở lợi nhuận chưa phân phối thuộc cổ đông mẹ trong mục tạm phân phối lợi nhuận năm nay; phần NCI và tổng tập đoàn là các cột khác.', '', 'Xử lý: xác nhận khoản tạm trích đã ghi nhận, không đổi thành 0 và không trừ lại. Chú thích chưa dự tính phân phối cuối cùng vẫn được giữ nguyên như bất định về tính đầy đủ. Tử số kế toán báo cáo được dùng làm ngữ cảnh có giới hạn, chưa phải lợi nhuận kinh tế sau quỹ cuối cùng hoặc scoring đã nghiệm thu.', '', '## Ranh giới và nghiệm thu', '', f"- Phát hiện {counts['invalidLegacyPageLocators']} locator trang 0 cũ ở HPG: đã đọc kiểm tra 6 trang PDF gốc và bổ sung cả 9 liên kết trang đúng. Giữ nguyên locator lịch sử; bản sửa được ghim riêng trong inputs.json, không suy trang theo số tiền trùng.", '- Mỗi node nguồn có hash file, JSON Pointer, hash payload và PDF gốc/trang nếu đã có định danh đúng. Transcription lưu giữ không được nâng thành đọc kiểm tra mọi ô PDF.', '- Tái tính chỉ tiêu từ đúng operands; giữ kỳ, phạm vi và phiên bản nguồn. Không tạo TTM, tăng trưởng organic, FCFE hoặc nợ ròng đủ điều kiện bằng phép đổi tên chỉ tiêu báo cáo.', '- Nguồn/mẫu số thiếu, khác đơn vị/kỳ/phạm vi, hash sai, ID trùng hoặc cạnh mất phải bị chặn. Cash capex âm chỉ được đổi sang spending magnitude bằng phép ABS_NORMALIZE có ghi rõ.', '- Các mô hình 11 mã vừa xây và mô hình ACB/VNM trước đó có liên kết riêng, giữ nhãn ASSUMPTION. Các mã chưa chuẩn hóa kinh tế giữ null và lý do; không điền mặc định.', '- Mỗi topic có evidence node riêng. Dữ liệu liên quan, PDF được gợi ý hoặc mô hình giả định không tự chứng minh topic. Giữ nguyên nhận định cũ, không tự chấm lại điểm.', '- Giá tham chiếu đóng cửa 30-10 được nối từ artifact R3 đã ghim hash; không quay về giá cũ trong native inputs. Market cap tham chiếu dùng mẫu số nhà cung cấp có quyền tạm tính, không phải vốn hóa được nghiệm thu hay báo giá hiện tại.', '- Các validThrough cũ đã hết hạn được liệt kê; ngày dựng mapping không gia hạn bằng chứng, không dựng thời gian công bố/thu nhận gốc.', '- Snapshot này có contract khác bản personal-ai-di-acceptance-v1 đã chấp thuận. Nó không thể bỏ qua provenance, trusted pins, DI gates, current shares hoặc nghiệm thu kinh tế hiện hành.', '- Không đổi current-review.json, source authority, ledger, database, dashboard, NAV hoặc giao dịch.', '', '## Tái lập', '', '`python3 scripts/build-vn30-lineage.py --check`', '', '`PATH=/private/tmp/node-v22.23.2-darwin-arm64/bin:$PATH node scripts/verify-vn30-lineage.mjs`', '', 'Dữ liệu: [snapshot](acceptance-snapshot.json), [ghi nhận BSR/GVR](conflict-readings.json). Hash snapshot giúp ghim đúng byte/đồ thị được review; nó không chứng minh tính đúng kinh tế hoặc quyền chấp thuận.', '']
    outputs['REPORT.md']='\n'.join(lines)
    return outputs


def main():
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args();outputs=build()
    for name,content in outputs.items():
        path=ROOT/OUT/name
        if args.check:
            if not path.exists() or path.read_text()!=content:raise ValueError('NONREPRODUCIBLE:'+name)
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content)
    print(f"{'CHECKED' if args.check else 'BUILT'} {len(outputs)} artifacts, 30 issuers, 690 rubric mappings; no financial admission")

if __name__=='__main__':main()
