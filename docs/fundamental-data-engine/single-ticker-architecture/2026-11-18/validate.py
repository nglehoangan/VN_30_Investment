"""Bounded planning/Skill validation, with no live financial worker or database writes."""
from contextlib import redirect_stdout
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest
import ast

OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
sys.path.insert(0,str(ROOT/'tests/unit'))
tests=unittest.defaultTestLoader.discover(str(ROOT/'tests/unit'),pattern='test_single_ticker_rollout.py')
stream=io.StringIO();result=unittest.TextTestRunner(stream=stream,verbosity=2).run(tests)
(OUT/'TEST_RESULTS.json').write_text(json.dumps({'status':'PASS' if result.wasSuccessful() else 'FAIL','testsRun':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'log':stream.getvalue(),'workers':'SYNTHETIC_TEST_ONLY','store':'TemporaryDirectory only'},indent=2)+'\n')
assert result.wasSuccessful(),stream.getvalue()
for path in [ROOT/'skills/vn30-rollout-orchestrator/scripts/control.py',ROOT/'skills/vn30-rollout-orchestrator/scripts/runtime.py']:
 ast.parse(path.read_text())
skills=['equity-s1-s5-assessment','vn30-market-price-corporate-actions','fetch-cafef-price-history','fetch-vietstock-dividend-pdfs','read-pdf-json-first','vn30-rollout-orchestrator']
validator=Path('/Users/nglehoangan/.codex/skills/.system/skill-creator/scripts/quick_validate.py')
# PyYAML is isolated, not installed into project/global Python environments.
sys.path.insert(0,'/private/tmp/vn30-skill-yaml-validation')
spec=importlib.util.spec_from_file_location('skill_validator',validator);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
validations=[];links=[]
for skill in skills:
 folder=ROOT/'skills'/skill;valid,message=module.validate_skill(folder)
 validations.append({'skill':skill,'valid':valid,'message':message});assert valid,(skill,message)
 for ref in re.findall(r'\[[^\]]*\]\(([^)]+)\)',(folder/'SKILL.md').read_text()):
  if not ref.startswith(('http:','https:','#')):
   target=(folder/ref.split('#')[0]).resolve();assert target.exists(),str(target);links.append(str(target.relative_to(ROOT)))
import yaml
yaml.safe_load((ROOT/'skills/vn30-rollout-orchestrator/agents/openai.yaml').read_text())
(OUT/'SKILL_VALIDATION.json').write_text(json.dumps({'status':'PASS','validator':str(validator),'PyYAML':yaml.__version__,'dependencyLocation':'Isolated /private/tmp/vn30-skill-yaml-validation','skills':validations,'localReferencesChecked':links,'yamlMetadataValid':True},indent=2)+'\n')
protected=json.loads((OUT/'PROTECTED_STATE.json').read_text())
assert sha(ROOT/'data/vn30.sqlite')==protected['productionDatabaseSha256']
checks=[('docs/fundamental-data-engine/vnm-pub04/2026-11-18/PUB04_SERVER_REGISTRATION.json','pub04ServerRegistrationSha256'),('docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17/APPROVED_METHODOLOGY.json','currentMethodologySha256'),('docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17/APPROVED_CURRENT_AUTHORITY.json','currentExecutableAuthoritySha256')]
for path,key in checks:assert sha(ROOT/path)==protected[key]
for pin in protected['compatibilityProcessors']:assert sha(ROOT/pin['path'])==pin['sha256']
authority=json.loads((ROOT/'docs/fundamental-data-engine/vnm-step4-final-review/2026-11-17/APPROVED_CURRENT_AUTHORITY.json').read_text())
for pin in authority['code']:assert sha(ROOT/pin['path'])==pin['sha256'],pin['path']
base=json.loads((ROOT/'docs/fundamental-data-engine/vnm-step3-executable-reconciliation/2026-11-17/PROPOSED_EXECUTABLE_REVIEW_MANIFEST.json').read_text())
for pin in base['artifacts']:assert sha(ROOT/pin['path'])==pin['sha256'],pin['path']
sys.path.insert(0,str(ROOT/'skills/vn30-rollout-orchestrator/scripts'))
from control import Universe
report=Universe('vn30-20260803-reviewed-20261115').inventory('2026-10-30')
(OUT/'READ_ONLY_UNIVERSE_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(OUT/'VALIDATION.json').write_text(json.dumps({'status':'PASS','scope':'PLANNING_AND_REUSABLE_SKILL_FOUNDATION_ONLY','unitTests':result.testsRun,'skillSpecificationsValidated':len(validations),'protectedDatabaseSha256':protected['productionDatabaseSha256'],'databaseUnchanged':True,'methodologyAuthorityAndPub04RegistrationUnchanged':True,'approvedCurrentRuntimePinsUnchanged':len(authority['code']),'approvedBaselineExecutablePinsUnchanged':len(base['artifacts']),'staticHashesOnlyNoScorerExecuted':True,'legacyCompatibilityProcessorsUnchanged':True,'liveWorkersInvoked':0,'realTickerScoringDeploymentPublicationExecuted':False,'liveHostAdapterIntegration':'NOT_INSTALLED_NOT_RUN','fullRepositorySuiteClaimed':False,'dependencyNote':'Initial quick_validate invocation could not import PyYAML. Official validator then ran unchanged with isolated PyYAML6.0.3; no global/project dependency changed.'},indent=2)+'\n')
print(json.dumps({'status':'PASS','tests':result.testsRun,'skillsValidated':len(validations),'databaseUnchanged':True,'liveWorkersInvoked':0}))
