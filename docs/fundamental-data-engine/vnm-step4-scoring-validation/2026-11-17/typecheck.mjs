/** Reproducible strict check using exact locked dependencies outside macOS dataless storage.
 * Usage: node typecheck.mjs <dependencies-dir> [scoped|full]
 * Never suppresses diagnostics or substitutes missing project source files.
 */
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=process.cwd(),dependencies=resolve(process.argv[2]??'node_modules/..'),mode=process.argv[3]??'scoped';
if(!['scoped','full'].includes(mode))throw Error('EXPECTED_SCOPED_OR_FULL');
const require=createRequire(join(dependencies,'package.json')),ts=require('typescript');
if(ts.version!=='6.0.3')throw Error('EXACT_LOCKED_TYPESCRIPT_VERSION_REQUIRED');
const modules=join(dependencies,'node_modules'),prefix=join(root,'node_modules');
const reroute=p=>p===prefix||p.startsWith(prefix+'/')?modules+p.slice(prefix.length):p;
for(const name of ['readFile','fileExists','directoryExists','getDirectories','readDirectory','realpath']){
 const fn=ts.sys[name];if(fn)ts.sys[name]=(p,...args)=>fn(reroute(p),...args);
}
const out=resolve(import.meta.dirname),configPath=join(out,mode==='full'?'full-typecheck.config.json':'typecheck.config.json');
const config=ts.getParsedCommandLineOfConfigFile(configPath,{typeRoots:[join(modules,'@types')],types:['node','react','react-dom']},{...ts.sys,onUnRecoverableConfigFileDiagnostic:d=>{throw Error(ts.flattenDiagnosticMessageText(d.messageText,'\n'));}});
const program=ts.createProgram(config.fileNames,config.options),diagnostics=[...config.errors,...ts.getPreEmitDiagnostics(program)];
const sourceFiles=program.getSourceFiles().filter(f=>f.fileName.startsWith(root)&&!f.fileName.includes('/node_modules/')).map(f=>({path:f.fileName.slice(root.length+1),sha256:createHash('sha256').update(f.text).digest('hex')})).sort((a,b)=>a.path.localeCompare(b.path));
const report={status:diagnostics.length?'FAIL':'PASS',mode,compilerVersion:ts.version,dependenciesRestoredFromExistingFrozenLockfile:true,projectSourceSubstitution:false,strict:config.options.strict,noEmit:true,sourceFilesChecked:sourceFiles.length,sourceSetHash:createHash('sha256').update(JSON.stringify(sourceFiles)).digest('hex'),diagnostics:diagnostics.map(d=>({code:d.code,file:d.file?.fileName??null,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')}))};
writeFileSync(join(out,mode==='full'?'FULL_TYPECHECK.json':'SCOPED_TYPECHECK.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,mode,sourceFilesChecked:sourceFiles.length,diagnostics:diagnostics.length}));
process.exitCode=diagnostics.length?1:0;
