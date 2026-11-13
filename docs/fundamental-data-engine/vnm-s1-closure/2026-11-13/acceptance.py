"""S1 issue acceptance only; never a formal ingestion or scoring authorization."""
REQUIRED=frozenset(['NORMALIZATION','CAPITAL_SCOPE','RETURNS_PERSISTENCE_MARGINS','CAPITAL_COST','CURRENT_UPDATE','INCREMENTAL_COMPARABILITY','CONFIDENCE_CONTRADICTIONS','REPRODUCIBILITY','DOUBLE_COUNT_BOUNDARY'])
def decide(rows, *, validation_passed, material_contradiction=False):
 ids=[r['id'] for r in rows]
 if len(set(ids))!=len(ids) or set(ids)!=REQUIRED: return 'BLOCKING'
 if not validation_passed or material_contradiction: return 'BLOCKING'
 for r in rows:
  if not r.get('rule') or not r.get('evidence') or not r.get('finding'):return 'BLOCKING'
  permitted={'PASS','PASS_WITH_LIMITS'}
  if r['id']=='INCREMENTAL_COMPARABILITY':permitted.add('N_R_PERMITTED')
  if r['result'] not in permitted:return 'BLOCKING'
 return 'CLOSED'
