"""Local readiness artifact consistency only, never trusted scoring/admission validation."""
def validate_candidate(doc,rubrics):
 def require(test,why):
  if not test:raise ValueError(why)
 require(doc['scope']=='READINESS_ONLY_NOT_SCORE_INPUT' and doc['isExecutableScoreInput'] is False,'NOT_EXECUTABLE')
 require(doc['ticker']=='VNM' and doc['cutoff']=='2026-10-30','CONTEXT')
 require(doc['totalScore'] is None and doc['formalApprovedPoints'] is None,'NO_TOTAL_OR_APPROVAL')
 rows=doc['rows'];require(len(rows)==len(rubrics)==23 and len({x['rubricId'] for x in rows})==23,'EXACT_23')
 for r in rubrics:
  a=next((a for a in rows if a['rubricId']==r['id']),None);require(a is not None,'MISSING_RUBRIC')
  ts=a['topicAssessments'];require(sorted(t['topicId'] for t in ts)==sorted(r['topics']),'EXACT_TOPICS')
  require(all(t['judgment'] and t['evidenceRefs'] and all(ref in doc['evidenceRegistry'] for ref in t['evidenceRefs']) for t in ts),'TOPIC_EVIDENCE')
  require(a['decisionCutoff']==doc['cutoff'] and a['provenance']['actor']=='CHATGPT','CANDIDATE_CONTEXT')
  require(all(a[k] is None for k in ['formalSelectedPoints','humanAnalyst','humanApprovalReference','trustedAiProductionReviewBinding']),'NO_IMPERSONATION_OR_TRUST')
  require('AUTHORIZATION_PENDING' in a['readinessStates'],'AUTHORIZATION_SEPARATE')
  require(a['counterevidence'] and a['economicChannel'] and a['uncertainty'],'COUNTER_AND_CHANNEL')
  b=a['candidateBand'];missing=a['missingIndispensableEvidence']
  if missing:
   require(b is None and a['candidatePoints'] is None and 'MATERIAL_EVIDENCE_BLOCKED' in a['readinessStates'],'NO_MISSING_AS_ZERO')
   require(all(missing[k] for k in ['exactRule','dependency','smallestAction','responsibleBoundary']),'BOUNDED_DEPENDENCY')
  else:
   require(b in r['bands'] and b['min']<=a['candidatePoints']<=b['max'],'EXACT_BAND')
   require('RESEARCH_SUPPORTED' in a['readinessStates'] and 'FORMAL_ASSESSMENT_READY' in a['readinessStates'],'SUPPORTED_CONTENT_READY')
   if a['candidatePoints']==r['max']:require(a['maximumPrerequisitesMet'] and a['exceptionalJustification'],'MAXIMUM_SUPPORT')
 require(len({a['economicChannel'] for a in rows})==23,'DISTINCT_CHANNELS')
 return {'rubrics':len(rows),'topics':sum(len(a['topicAssessments']) for a in rows),'supported':sum(a['candidateBand'] is not None for a in rows)}
