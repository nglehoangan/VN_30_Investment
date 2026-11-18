"""Read-only publication review. No live materialization/registration/activation."""
import json,hashlib,sqlite3,subprocess,os
from pathlib import Path
R=Path.cwd();O=Path(__file__).resolve().parent;B=R/'docs/fundamental-data-engine';S=B/'vnm-step4-assessment-conversion/2026-11-18'
def read(p):return json.loads(p.read_text())
def pin(p):return {'path':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def put(n,x):(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
assert subprocess.run(['git','merge-base','--is-ancestor','b9b2ee6e22ffc0015f9f1e29324ac105b02a7ab4','HEAD'],check=False).returncode==0
verified=[]
for name,digest in read(S/'OUTPUT_HASHES.json').items():
 p=S/name;assert hashlib.sha256(p.read_bytes()).hexdigest()==digest,name;verified.append(pin(p))
card=S/'final-reviewed-run/ISOLATED_SCORECARD.json';c=read(card)
assert c['totalScore']=='43' and c['confidence']=='LOW' and c['validity']=='VALID — NON-ACTIONABLE'
assert len(c['subcategories'])==23 and sum(len(r['assessment']['evidence']) for r in c['subcategories'])==83
assert sum(int(r['points']) for r in c['categories'])==43
for p in [card,S/'final-reviewed-run/EXACT_ADOPTION_PACKET.json',S/'final-reviewed-run/AI_ADOPTION_AND_SCORING.json']:
 original=subprocess.check_output(['git','show','b9b2ee6e22ffc0015f9f1e29324ac105b02a7ab4:'+str(p.relative_to(R))]);assert original==p.read_bytes()
put('SCORECARD_INTEGRITY_VALIDATION.json',{'status':'PASS','baselineCommit':'b9b2ee6e22ffc0015f9f1e29324ac105b02a7ab4','priorOutputPinsVerified':len(verified),'priorOutputPins':verified,'scorecard':pin(card),'inputPacket':pin(S/'final-reviewed-run/EXACT_ADOPTION_PACKET.json'),'economicCutoff':c['asOf'],'knownAt':c['input']['knownAt'],'calculatedAt':c['calculatedAt'],'totalScore':'43','confidence':'LOW','validity':c['validity'],'rubrics':23,'topics':83,'categorySumMatches':True,'exactSelectedGitBytesMatch':True,'scoreRecalculated':False,'priorClosureReopened':False,'semanticHashes':'Verified with actual repository hash/review verifiers in runtime review.'})
# Read the actual default live file only; do not infer it from a copied rehearsal.
assert os.environ.get('DATABASE_URL') is None,'Review requires explicit handling of a changed database configuration; no silent default.'
db=R/'data/vn30.sqlite';conn=sqlite3.connect('file:'+str(db)+'?mode=ro',uri=True)
names={r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
expected=['current_financial_admission','current_financial_fact','current_financial_raw','current_financial_dataset','current_financial_enrichment','current_scoring_data_acceptance','current_score_artifact','analytical_artifact','production_dependency_publication','market_boundary_dependency_head','dependency_release']
counts={n:{'exists':n in names,'count':conn.execute('SELECT count(*) FROM "'+n+'"').fetchone()[0] if n in names else None} for n in expected}
m=read(B/'vnm-step4-final-review/2026-11-17/APPROVED_METHODOLOGY.json')
row=conn.execute('SELECT * FROM methodology_record WHERE methodology_id=?',(m['methodologyId'],)).fetchone()
heads=[dict(zip([r[1] for r in conn.execute('PRAGMA table_info(market_boundary_dependency_head)')],r)) for r in conn.execute('SELECT * FROM market_boundary_dependency_head')]
conn.close()
put('PRODUCTION_DEPENDENCY_CHECK.json',{'access':'SQLITE_MODE_RO','database':pin(db),'configuredDatabaseSource':'loadDatabaseConfig: DATABASE_URL unset, project data/vn30.sqlite','tables':counts,'approvedCurrentMethodologyId':m['methodologyId'],'approvedCurrentMethodologyPresent':row is not None,'activeDependencyProjection':heads,'sourceAvailabilityMeaning':'Missing current-purpose governed tables is a production materialization/consumer prerequisite, not missing retained financial reports or a request for new source authority.','liveWrites':0})
files=['src/infrastructure/source-admission/current-scoring.ts','src/infrastructure/source-admission/current-scoring-authority.ts','src/infrastructure/source-admission/current-review.ts','src/application/scoring/purpose-aware-engine.ts','src/application/scoring/engine.ts','src/infrastructure/repositories/analytical-artifacts.ts','src/infrastructure/personal-ai/artifact-store.ts','src/infrastructure/personal-ai/scoring-datasets.ts','app/server/dashboard.ts','src/ui/dashboard.tsx','src/application/dependencies/service.ts','src/infrastructure/repositories/dependencies.ts','src/infrastructure/dependencies/catalog.ts','app/server/production-dependencies.ts','src/infrastructure/dependencies/active-authorities.json','prisma/proposals/current-scoring-artifact-v1.sql','src/domain/ranking/rank.ts','src/domain/decision/engine.ts','docs/05_PORTFOLIO_WORKFLOW/MONTHLY_DCA_REVIEW_v1.0.md']
for f in files:
 assert subprocess.check_output(['git','show','b9b2ee6e22ffc0015f9f1e29324ac105b02a7ab4:'+f])==(R/f).read_bytes(),f
put('PUBLICATION_CONTRACT_MAP.json',{'sourcePins':[pin(R/f) for f in files],'actualReadOnlyEntryPoint':{'path':'app/server/dashboard.ts','function':'loadDashboard → readDashboard','route':'/scoring and /scoring/[reference]','store':'analytical_artifact via PrismaAnalyticalArtifacts.find','ordering':'asOf DESC, id ASC; not current-purpose latest revision resolution'},'currentPurposeStorage':{'path':'src/infrastructure/source-admission/current-scoring.ts','functions':['CurrentPurposeScoring.score','CurrentPurposeScoring.find'],'store':'current_score_artifact','readReauthorization':True,'productionDashboardConnected':False,'migrationStatus':'prisma/proposals/current-scoring-artifact-v1.sql is explicitly isolated-only'},'existingPublicationContract':{'path':'src/application/dependencies/service.ts','functions':['ProductionDependencies.resolveProductionAnalysisDependencies','ProductionDependencies.sealAnalysis'],'contract':'production-dependency-publication-v1','snapshotKinds':['ANALYSIS','DECISION'],'requires':['Active accepted release and matching heads','Catalog assertion/currentness','Lifecycle validation and analysis bindings','Atomic release compare at publish'],'isScorecardEndpoint':False,'currentScorecardToSealedAnalysisBridgeFound':False},'otherStorage':{'path':'src/infrastructure/personal-ai/artifact-store.ts','contract':'personal-ai-score-artifact-v1','namespace':'Legacy AI file artifacts; not personal-ai-current-scorecard-v1; no dashboard connection'},'safeCurrentScorePublicationEntryPointFound':False,'noNewPublicationSystemDesigned':True})
print('Read-only review: retained43/100 integrity passes; production current tables/method and consumer linkage require actual completion.')
