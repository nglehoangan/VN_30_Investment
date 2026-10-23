"""Prepare PEC-1 review packet. Read-only with respect to all production inputs."""
import datetime
import json
import sqlite3
import subprocess
from pathlib import Path
from lib.pe4_evidence import replay_package, verify_seal, sha
from lib.pec1_authority import digest, evaluate

ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'docs/fundamental-data-engine/evidence'
OUT=E/'2026-10-22-production-evidence-closure-pec1'
P3=E/'2026-10-22-primary-publication-evidence-pe3'
P4=E/'2026-10-22-primary-publication-evidence-pe4'
def read(p): return json.loads(p.read_text())
def write(n,x): (OUT/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def ref(p,pointer=''): return {'path':str(p.relative_to(ROOT)), 'sha256':sha(p), 'pointer':pointer}
def snapshot():
    paths=list((ROOT/'data').rglob('*'))+list((ROOT/'src').rglob('*'))+list(E.rglob('*'))
    pins={str(p.relative_to(ROOT)):sha(p) for p in paths if p.is_file() and OUT not in p.parents and '__pycache__' not in p.parts}
    for p in [ROOT/'AGENTS.md',ROOT/'docs/fundamental-data-engine/issuer-sources.json',ROOT/'docs/fundamental-data-engine/issuer-document-routes.json']:
        pins[str(p.relative_to(ROOT))]=sha(p)
    return pins

def main():
    if (OUT/'OWNER_DECISION_REGISTER.json').exists():
        raise SystemExit('Existing register: refuse overwrite. Review and version explicitly.')
    OUT.mkdir(parents=True,exist_ok=True)
    now=datetime.datetime.now(datetime.timezone.utc).isoformat()
    before=snapshot()
    write('BASELINE_PINS.json',before)
    replay=replay_package(ROOT)
    write('PE4_CURRENT_REPLAY.json',replay)
    seals=[verify_seal(ROOT,p) for p in [E/'2026-10-21-primary-publication-evidence-pe1',E/'2026-10-22-primary-publication-evidence-pe2',P3,P4]]
    write('PRIOR_EVIDENCE_VERIFICATION.json',seals)
    db=sqlite3.connect('file:'+str(ROOT/'data/vn30.sqlite')+'?mode=ro',uri=True)
    db.row_factory=sqlite3.Row
    tables=[r[0] for r in db.execute("select name from sqlite_master where type='table' order by name")]
    production={'database':ref(ROOT/'data/vn30.sqlite'),'methodologyRecords':[dict(r) for r in db.execute('select * from methodology_record')],
                'tableCounts':{t:db.execute('select count(*) from "'+t+'"').fetchone()[0] for t in tables},
                'logicalDumpSha256':digest(list(db.iterdump())),
                'interpretation':'Existing static scoring/methodology authority is not approval of the eight proposed source bundles.'}
    db.close()
    write('EXISTING_PRODUCTION_AUTHORITY.json',production)
    baseline=read(P4/'FINAL_STATUS.json')
    write('PE4_RECONCILIATION.json',{'PE4':baseline,'currentReplay':replay,
        'PE3ToPE4':{'technicalDigitPending':{'PE3':7,'PE4':0},'technicalMappings':{'PE3Verified':32,'PE3Limited':6,'PE3Pending':7,'PE4Technical':45},
            'approvedAuthority':{'PE3':0,'PE4':0},'completeKnowledgeChains':{'PE3':0,'PE4':0},'fullyResolvedLimitedMappings':0},
        'inconsistencies':[{'path':str((P4/'FINAL_BLOCKER_DISPOSITION.json').relative_to(ROOT)),
            'finding':'Economic perimeter missingEvidence still says GVR105 digit-pending despite PE4 closing all seven digit checks. The independent-acceptance nextAction still refers to reviewing PE3 before PE4. Stale narrative only; retain seal and use PE4 cell receipts/replay for technical status.'}],
        'verifiedAuthorityChains':{'technical':8,'approvedComplete':0,'pending':8},
        'incompleteKnowledgeEvidence':8,'unresolvedFinancialMappings':{'pendingDigits':0,'limitedMappingsNotFullyResolved':6,'outsideReviewedScope':171,'missingCanonicalCandidate':1,'GVRReportedDebtPerimeterAlsoRestricted':True},
        'independentAcceptance':'Technical replay PASS; independent human acceptance 0; formal acceptance 0',
        'approvalStatesNotUpgraded':True})
    ownership={'schemaVersion':'pec1-owner-governance-v1','roles':{
        'Investment System Owner':'Final approval authority. Authenticated exact candidate and bundle hash decision required.',
        'Data Evidence Reviewer':'Publication identity and provenance verification.',
        'Data Quality Owner':'Dataset completeness and financial mapping verification.',
        'Independent Validator':'Independent acceptance verification; technical replay is not human acceptance.',
        'Codex':'Evidence preparation and implementation only; never final authority.',
        'AI Portfolio Manager':'Risk assessment and recommendations only.'},
        'allGatesMandatory':True,'trustedOwnerReceiptPins':{},
        'authentication':'No authenticated owner receipt supplied. A self-declared identity, boolean, copied approval or local hash is not authentication. A subsequent authorized human reviewer must authenticate identity and approval evidence outside the evaluator, and independently pin the exact receipt digest. This packet provides no approval intake endpoint.',
        'effectivity':'Prospective only in this evaluator; no backdating. Any historical claim needs a separately authorized and evidenced review.',
        'activation':'Offline review only. Even authenticated approval never grants runtime access, admission, D2 activation, scoring, ranking or Top 10.',
        'validity':'No invented expiry/validity interval. Null validity blocks approval until the owner supplies evidenced bounds.',
        'decisionRecording':'Append a new versioned authenticated decision receipt; preserve this register and prior seals. Do not edit owner fields or infer approval from the mission request.'}
    write('OWNERSHIP_AND_APPROVAL_POLICY.json',ownership)
    candidates=read(P3/'AUTHORITY_APPROVAL_CANDIDATES.json')['candidates']
    cells=read(P4/'SOURCE_CELL_INDEPENDENT_REVIEW.json')['reviews']
    mappings=read(P3/'SOURCE_CELL_MAPPING_REVIEW.json')['mappings']
    knowledge=read(P4/'KNOWLEDGE_CLOSURE.json')['records']
    records=[]
    for i,c in enumerate(candidates):
        b=c['body']; d=b['disclosureId']
        indices={m['obligationIndex'] for m in mappings if m['disclosureId']==d}
        ci=[j for j,r in enumerate(cells) if r['body']['obligationIndex'] in indices]
        ki=next(j for j,k in enumerate(knowledge) if k['disclosureId']==d)
        refs={'candidate':ref(P3/'AUTHORITY_APPROVAL_CANDIDATES.json',f'/candidates/{i}'),
              'publication':ref(P4/'SOURCE_AUTHORITY_DECISIONS.json',f'/records/{i}/qualification/publicationMethod'),
              'provenance':[ref(ROOT/b['source']['sourcePath']),ref(ROOT/b['source']['documentPath'])],
              'financialMapping':[ref(P4/'SOURCE_CELL_INDEPENDENT_REVIEW.json',f'/reviews/{j}') for j in ci],
              'perimeter':ref(P4/'ECONOMIC_PERIMETER_REVIEW.json'),
              'knowledge':ref(P4/'KNOWLEDGE_CLOSURE.json',f'/records/{ki}'),
              'independentValidation':ref(P4/'INDEPENDENT_REPLAY.json'),
              'acceptance':ref(P4/'OBLIGATION_ACCEPTANCE_ASSESSMENT.json'),
              'coverage':ref(P4/'MINIMUM_DATASET_COVERAGE.json')}
        gates={}
        for g,state,reason in [('G1','PASS','Exact archived source identity technically replayed.'),('G2','PASS','Exact item-local publication identity; DATE_ONLY remains next local day boundary, not a timestamp.'),
            ('G3','PENDING','Publisher legal identity technically verified; exact authority contract, effectivity and approval absent.'),
            ('G4','PASS','Archived HTML and PDF bytes, exact link and provenance rehashed. No live issuer acquisition authorized.'),
            ('G5','PENDING','Exact source cells technically replayed; financial owner acceptance absent; perimeter restrictions remain as applicable.'),
            ('G6','PENDING','Formal knowledge events and actual systemKnownAt/decisionAsOf absent.'),
            ('G7','PENDING','PE4 independent technical replay passes; authenticated independent human acceptance absent.'),
            ('G8','PENDING','No authenticated Investment System Owner approval supplied.')]:
            gates[g]={'state':state,'reason':reason,'evidence':{'G1':'candidate','G2':'publication','G3':'candidate','G4':'provenance','G5':'financialMapping','G6':'knowledge','G7':'independentValidation','G8':'candidate'}[g]}
        restrictions=['Exact archived bytes, issuer, period, report type and consolidated scope only.','Live PDF discovery/acquisition remains Vietstock-only.','No production admission, D2 activation, scoring, ranking or Top 10.','No broader financial perimeter or regulatory population inference.']
        r={'candidateId':c['candidateId'],'candidateVersion':b['schemaVersion'],'candidateSha256':c['sha256'],
           'disclosureId':d,'ticker':b['ticker'],'period':b['sourceContract']['economicPeriod'],
           'authorityKey':b['ticker']+':'+b['sourceContract']['economicPeriod']['end']+':'+b['sourceContract']['reportingScope'],
           'sourceName':b['source']['sourceURL'],'sourceType':'ARCHIVED_ISSUER_LINKED_FINANCIAL_DISCLOSURE',
           'publisherIdentity':b['issuer'],'evidencePins':refs,'evidenceBundleHash':digest(refs),
           'independentValidationResult':'PASS_TECHNICAL_ONLY; HUMAN_ACCEPTANCE_PENDING',
           'proposedDecision':'DEFERRED','recommendedState':'DEFERRED',
           'ownerDecision':None,'ownerIdentity':None,'decisionTimestamp':None,'ownerReceipt':None,
           'preparedAt':now,'evidenceValidThrough':None,'gates':gates,'restrictions':restrictions,
           'remainingBlockers':[g+': '+v['reason'] for g,v in gates.items() if v['state']!='PASS'],
           'revalidationTriggers':['Any source/PDF or evidence bundle hash change','Changed publisher/period/scope/document revision','Changed financial mapping, perimeter, units or semantic contract','Changed D2 policy/implementation or source admission policy','New knowledge/cutoff evidence','Expiry of owner-approved evidence validity or authority interval','Conflicting or duplicate authority','New independent validation outcome'],
           'productionAdmissionRequested':False,'mappedObligationIndices':sorted(indices)}
        if not indices:
            r['gates']['G5']['reason']='No financial mappings for this disclosure in the PE4 45-obligation scope; mapping and data quality acceptance evidence required.'
            r['remainingBlockers']=[g+': '+v['reason'] for g,v in gates.items() if v['state']!='PASS']
        records.append(r)
    for r in records:r['evaluation']=evaluate(r,records,now)
    write('OWNER_DECISION_REGISTER.json',{'schemaVersion':'pec1-source-authority-owner-register-v1','preparedAt':now,'records':records})
    after=snapshot()
    write('PRODUCTION_MUTATION_AUDIT.json',{'status':'PASS_UNCHANGED' if before==after else 'FAIL','filesCompared':len(before),'changed':[p for p in before if before[p]!=after.get(p)],'added':sorted(set(after)-set(before)),
        'noProductionWrites':True,'D2Activated':False,'scoringExecuted':False,'rankingOrTop10Generated':False,'priorSealsPreserved':True})
    write('FINAL_STATUS.json',{'status':'PARTIALLY_READY','reason':'All eight deferred recommendations are reviewable; mandatory owner, knowledge, mapping acceptance and independent human evidence remain absent. No effective authority approval.',
        'candidateCount':len(records),'recommendedDeferred':len(records),'effectiveApproved':0,'PE4EvidencePresentAndReplayed':True,
        'PRIMARY_PUBLICATION_EVIDENCE':'BLOCKED','productionAccess':False,'stop':'PEC-1 ONLY. PEC-2 requires explicit owner authorization.'})

if __name__=='__main__':main()
