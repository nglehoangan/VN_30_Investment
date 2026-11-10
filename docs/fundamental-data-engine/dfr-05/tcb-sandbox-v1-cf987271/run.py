"""Offline reproducible runner; writes only the dedicated sandbox outputs."""
import json,sys
from pathlib import Path
import model
from prepare import ROOT,OUT,read,write,sha,digest,pointer

def execute(configPath=None):
 path=Path(configPath) if configPath else OUT/'scenario-inputs.json';config=read(path);anchors=read(OUT/'anchors.json')
 for p,h in read(OUT/'input-pins.json').items():
  if sha(ROOT/p)!=h:raise ValueError('APPROVED_INPUT_DRIFT:'+p)
 for value in anchors.values():
  if isinstance(value,dict) and 'provenance' in value:
   b=value['provenance']
   if sha(ROOT/b['path'])!=b['sha256'] or digest(pointer(read(ROOT/b['path']),b['jsonPointer']))!=b['objectHash']:raise ValueError('ANCHOR_PROVENANCE_DRIFT')
   original=pointer(read(ROOT/b['path']),b['jsonPointer'])
   if value['value']!=original['value'] or value['unit']!=original['unit']:raise ValueError('ANCHOR_VALUE_OR_UNIT_DRIFT')
 result=model.run(config,anchors)
 result['lineage']=dict(anchorFileSha256=sha(OUT/'anchors.json'),configurationSha256=sha(path),modelSha256=sha(OUT/'model.py'),inputPinSetHash=digest(read(OUT/'input-pins.json')))
 for s in result['scenarios']:s['lineage']=dict(result['lineage'],scenarioConfigHash=digest(s['hypotheticalAssumptions']))
 write('scenario-outputs.json',result);write('sensitivity-results.json',result['sensitivities'])
 print(json.dumps(dict(status='HYPOTHETICAL_CALCULATIONS_COMPLETE',scenarios=[dict(name=s['scenario'],PB=s['hypotheticalPB'],perShare=s['hypotheticalPerShareModelValue'],capital=s['capitalFeasibility']['status']) for s in result['scenarios']],canonicalOutputHash=digest(result))))
 return result
if __name__=='__main__':execute(sys.argv[1] if len(sys.argv)>1 else None)
