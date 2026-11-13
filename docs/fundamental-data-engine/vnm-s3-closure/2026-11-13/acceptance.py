"""Research closure boundary. No scoring authority or point assignment."""
MANDATORY={'share','cost_position','distribution'}
KINDS={'FACT','ESTIMATE','ASSUMPTION','ANALYST_JUDGMENT'}
def decide(matrix,assessment,*,sources_verified,validation_passed,unresolved_material_contradiction=False):
 if not sources_verified or not validation_passed or unresolved_material_contradiction:return 'BLOCKING'
 rows=matrix.get('evidence',[]);ids=[x.get('id') for x in rows]
 if len(ids)!=len(set(ids)) or not rows:return 'BLOCKING'
 by_id={x['id']:x for x in rows}
 if any(x.get('classification') not in KINDS or not x.get('sourceRefs') or not x.get('limitation') for x in rows):return 'BLOCKING'
 topics=assessment.get('mandatoryTopicAssessments',[])
 if len(topics)!=3 or {x['topic'] for x in topics}!=MANDATORY:return 'BLOCKING'
 for x in topics:
  if not all(x.get(k) for k in ['positiveEvidence','counterEvidence','assessment','confidence','invalidation']):return 'BLOCKING'
  if any(i not in by_id for i in x['positiveEvidence']+x['counterEvidence']):return 'BLOCKING'
  s=x.get('substitution',{})
  if not s.get('rule') or s.get('actualMarketSharePercent') is not None or s.get('relativeCompetitorUnitCost') is not None or s.get('peerPercentile') is not None or s.get('shareGainCalculated'):return 'BLOCKING'
 # These selected inputs have incompatible populations and no original common denominator.
 for x in rows:
  if x.get('definition') and x['definition'].get('marketShareEligible') is not False:return 'BLOCKING'
 if not assessment.get('researchConclusion') or not assessment.get('materialDefinitionConflicts') or not assessment.get('thesisInvalidationConditions'):return 'BLOCKING'
 if assessment.get('formalPoints') is not None or assessment.get('researchScoringBand') is not None or assessment.get('authorityPromoted') or assessment.get('VNM17Promoted'):return 'BLOCKING'
 return 'CLOSED'
