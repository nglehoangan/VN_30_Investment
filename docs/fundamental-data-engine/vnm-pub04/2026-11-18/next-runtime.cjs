// Resolve a single exact locked Next installation for build workers and HTTP server.
// No project source, validation rules, executable hashes or TypeScript settings change.
const Module=require('node:module');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const original=Module._resolveFilename;
const mirrorParent=new Module('/private/tmp/vn30-step2-dependencies/next-runtime.cjs');
mirrorParent.paths=Module._nodeModulePaths('/private/tmp/vn30-step2-dependencies');
const mirror=path.dirname(original.call(Module,'next/package.json',mirrorParent));
const workspace=fs.realpathSync(path.join(process.cwd(),'node_modules/next'));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const file of ['package.json','dist/server/app-render/work-async-storage.external.js']){
 if(digest(path.join(workspace,file))!==digest(path.join(mirror,file)))throw Error('LOCKED_NEXT_MIRROR_BYTES_MISMATCH');
}
Module._resolveFilename=function(request,parent,...args){
 if(request==='next'||request.startsWith('next/'))return original.call(this,request,mirrorParent,...args);
 if(path.isAbsolute(request)&&request.startsWith(workspace+path.sep))return original.call(this,mirror+request.slice(workspace.length),parent,...args);
 const result=original.call(this,request,parent,...args);
 return typeof result==='string'&&result.startsWith(workspace+path.sep)?mirror+result.slice(workspace.length):result;
};
