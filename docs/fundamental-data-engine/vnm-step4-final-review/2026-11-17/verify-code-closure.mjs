import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {createRequire} from 'node:module';
const req=createRequire('/private/tmp/vn30-step2-dependencies/package.json'),ts=req('typescript'),root=process.cwd(),out=import.meta.dirname;
const base=JSON.parse(readFileSync('docs/fundamental-data-engine/vnm-step3-executable-reconciliation/2026-11-17/PROPOSED_EXECUTABLE_REVIEW_MANIFEST.json','utf8'));
const text=readFileSync('src/infrastructure/source-admission/current-scoring-authority.ts','utf8'),list=text.split('export const CURRENT_SCORING_RUNTIME=[')[1].split('] as const')[0],declared=[...list.matchAll(/'([^']+)'/g)].map(m=>m[1]);
const bound=new Set([...base.artifacts.map(p=>p.path),...declared]),visited=new Set(),edges=[],unbound=[];
function follow(path){if(visited.has(path))return;visited.add(path);if(!bound.has(path))unbound.push(path);if(!/\.[cm]?tsx?$/.test(path))return;
 const file=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true);
 for(const n of file.statements){if(!ts.isImportDeclaration(n)&&!ts.isExportDeclaration(n))continue;if(!n.moduleSpecifier||!ts.isStringLiteral(n.moduleSpecifier))continue;
  if(n.isTypeOnly||n.importClause?.isTypeOnly)continue;
  const clause=n.importClause;if(clause?.namedBindings&&ts.isNamedImports(clause.namedBindings)&&!clause.name&&clause.namedBindings.elements.every(e=>e.isTypeOnly))continue;
  const s=n.moduleSpecifier.text;if(!s.startsWith('@/')&&!s.startsWith('.'))continue;
  const target=s.startsWith('@/')?resolve(root,'src',s.slice(2)):resolve(root,dirname(path),s);
  const found=[target,target+'.ts',target+'.tsx',target+'.json',target+'/index.ts'].find(p=>existsSync(p)&&extname(p));if(!found)throw Error('UNRESOLVED_CODE_IMPORT:'+s);
  const relative=found.slice(root.length+1);edges.push({from:path,to:relative});follow(relative);
 }
}
for(const p of declared)follow(p);
const report={status:unbound.length?'FAIL':'PASS',baselineArtifacts:base.artifacts.length,declaredVersionFiles:declared.length,runtimeFilesVisited:visited.size,unbound,edges};writeFileSync(resolve(out,'CODE_CLOSURE.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,runtimeFilesVisited:visited.size,unbound}));process.exitCode=unbound.length?1:0;
