#!/usr/bin/env python3
"""Repository-wide file/reference audit. Inventory only; never executes task scripts."""
import argparse
import collections
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import zlib

ROOT=Path(__file__).resolve().parents[2]
EXCLUDE={'.git','node_modules','.next','.pnpm-store','__pycache__','.pytest_cache'}
TEXT={'.py','.mjs','.cjs','.js','.ts','.tsx','.mts','.md','.json','.yaml','.yml','.txt','.sql','.csv','.log','.m'}
PATH=re.compile(r'(?:scripts|src|app|api|tests|skills|docs|data|outputs|backups)/[^\s"\x27`<>|)\\;,]+')
LITERAL=re.compile(r'["\x27`]([^"\x27`\n]{1,400})["\x27`]')
BASE=re.compile(r'(?<![\w/.-])([\w.-]+\.(?:py|mjs|cjs|ts|tsx|md|json|pdf|PDF))(?!\w)')

def files(root):
    for folder,dirs,names in os.walk(root):
        dirs[:]=[d for d in dirs if d not in EXCLUDE]
        for name in names:
            path=Path(folder)/name
            if path.is_symlink() or name.startswith('.env'):continue
            yield path

def scan(source_only=True):
    paths={str(p.relative_to(ROOT)):p for p in files(ROOT)}
    basenames=collections.defaultdict(list)
    for name in paths:basenames[Path(name).name].append(name)
    tracked={line.split('\t',1)[1]:line.split('\t',1)[0].split()[1] for line in subprocess.check_output(['git','ls-files','--stage'],cwd=ROOT,text=True).splitlines() if '\t' in line}
    batch=subprocess.Popen(['git','-c','pack.readReverseIndex=false','cat-file','--batch-command','--buffer'],cwd=ROOT,stdin=subprocess.PIPE,stdout=subprocess.PIPE)
    def git_bytes(name):
        loose=ROOT/'.git/objects'/tracked[name][:2]/tracked[name][2:]
        if loose.is_file():
            expanded=zlib.decompress(loose.read_bytes())
            if hashlib.sha1(expanded).hexdigest()!=tracked[name]:raise ValueError('GIT_OBJECT_IDENTITY_MISMATCH')
            header,raw=expanded.split(b'\0',1)
            if header!=b'blob '+str(len(raw)).encode():raise ValueError('GIT_BLOB_HEADER_MISMATCH')
            return raw
        batch.stdin.write(('contents '+tracked[name]+'\nflush\n').encode())
        batch.stdin.flush()
        header=batch.stdout.readline().split()
        if len(header)!=3 or header[1]!=b'blob':raise OSError('GIT_BLOB_UNAVAILABLE')
        size=int(header[2]);raw=batch.stdout.read(size);batch.stdout.read(1)
        if hashlib.sha1(b'blob '+str(size).encode()+b'\0'+raw).hexdigest()!=tracked[name]:raise OSError('GIT_BLOB_IDENTITY_MISMATCH')
        return raw
    references={};incoming=collections.defaultdict(set);pins=set();metadata={};errors=[];fallback=[]
    # Independent local reads may hydrate placeholders; ticker execution remains sequential.
    def readable(name,path):
        if path.suffix.lower() not in TEXT:return False
        if name.startswith(('data/','backups/')) and not name.startswith('data/manual-download/'):return False
        if source_only and path.suffix.lower() in {'.log','.csv'}:return False
        if source_only and name.startswith('docs/fundamental-data-engine/evidence/') and path.suffix.lower() not in {'.py','.mjs','.js','.ts','.tsx','.mts','.md','.sql','.m'}:return False
        if source_only and name.startswith('docs/') and path.suffix.lower()=='.json':
            if not re.search(r'(AUTHORITY|APPROV|AUTHORIZ|MANIFEST|REGISTRY|POLICY|CONTRACT|SCHEMA|SOURCE_PIN)',path.name,re.I):return False
            if path.stat().st_size>8_000_000:return False
        return True
    pool=ThreadPoolExecutor(max_workers=32)
    reads={name:pool.submit(path.read_text,errors='replace') for name,path in paths.items() if readable(name,path)}

    def resolve(value,origin):
        if not isinstance(value,str) or len(value)>1000:return None
        if value in paths:return value
        if not value.startswith(('scripts/','src/','app/','api/','tests/','skills/','docs/','data/','outputs/','backups/','./','../',str(ROOT)+'/')) and not value.endswith(tuple(TEXT|{'.pdf','.PDF','.zip','.rar','.png'})):
            return None
        value=value.split('#')[0].strip().rstrip('.:')
        if value.startswith(str(ROOT)+'/'):value=value[len(str(ROOT))+1:]
        candidates=[value,str(Path(origin).parent/value)]
        for item in candidates:
            normalized=os.path.normpath(item)
            for suffix in ('','.py','.ts','.tsx','.mjs','.js','.json','/index.ts'):
                if normalized+suffix in paths:return normalized+suffix
        return None
    def visit(value,edges,origin):
        if isinstance(value,dict):
            if isinstance(value.get('path'),str) and isinstance(value.get('sha256'),str):
                target=resolve(value['path'],origin)
                if target:pins.add(target)
            for child in value.values():visit(child,edges,origin)
        elif isinstance(value,list):
            for child in value:visit(child,edges,origin)
        elif isinstance(value,str):
            target=resolve(value,origin)
            if target:edges.add(target)
    ordered=sorted(paths.items(),key=lambda item:(0 if item[0].startswith(('app/','src/','api/','scripts/','tests/','skills/','tools/')) else 2 if item[0].startswith(('data/','backups/')) else 1,item[0]))
    for index,(name,path) in enumerate(ordered):
        if index%250==0:print(json.dumps({'audited':index,'total':len(paths),'current':name}),flush=True)
        try:stat=path.stat()
        except FileNotFoundError:
            errors.append({'path':name,'error':'REMOVED_DURING_INVENTORY_RETAIN_NO_INFERENCE'});continue
        metadata[name]={'bytes':stat.st_size,'suffix':path.suffix.lower()}
        if name not in reads:continue
        try:
            text=reads[name].result()
        except OSError as error:
            if name in tracked:
                try:text=git_bytes(name).decode(errors='replace');fallback.append(name)
                except OSError:errors.append({'path':name,'error':type(error).__name__});continue
            else:errors.append({'path':name,'error':type(error).__name__});continue
        edges=set()
        for value in set(PATH.findall(text)):
            target=resolve(value,name)
            if target:edges.add(target)
        if path.suffix=='.json' and stat.st_size<=8_000_000:
            try:visit(json.loads(text),edges,name)
            except (ValueError,RecursionError):pass
        if path.suffix in ('.py','.mjs','.js','.ts','.tsx','.mts','.cjs'):
            for literal in set(LITERAL.findall(text)):
                target=resolve(literal,name)
                if target:edges.add(target)
            for module in re.findall(r'^from ([\w.]+) import',text,re.M):
                candidate='scripts/'+module.replace('.','/')+'.py'
                if candidate in paths:edges.add(candidate)
        # Bare citations are conservative reference evidence, not an automatic deletion proof.
        for basename in set(BASE.findall(text)):
            if len(basenames.get(basename,[]))==1:edges.add(basenames[basename][0])
        edges.discard(name);references[name]=sorted(edges)
        for target in edges:incoming[target].add(name)
        if index%500==0:print(json.dumps({'audited':index,'total':len(paths)}),flush=True)
    roots={n for n in paths if n.startswith(('app/','src/','api/','tests/','skills/','prisma/','tools/')) or n in ('package.json','README.md','AGENTS.md','CLAUDE.md','instrumentation.ts','next.config.ts')}
    # Immutable source/policy/approval records remain audit evidence; don't retire these.
    roots.update(n for n in paths if n.startswith('docs/') and (re.search(r'(APPROV|AUTHORIZ|OWNER_REQUEST|AUTHORITY|GOVERNANCE|SOURCE_POLICY)',Path(n).name,re.I) or n.startswith(('docs/01 ','docs/02 ','docs/03 ','docs/04_','docs/05_','docs/07_'))))
    reached=set(roots);pending=list(roots)
    while pending:
        for target in references.get(pending.pop(),[]):
            if target not in reached:reached.add(target);pending.append(target)
    # Referenced or hash-pinned helpers aren't judged obsolete by age/name.
    orphan_scripts=[n for n in paths if n.startswith('scripts/') and '/lib/' not in n and Path(n).suffix in ('.py','.mjs','.m') and n not in reached and n not in pins]
    unreferenced_docs_runners=[n for n in paths if n.startswith('docs/') and Path(n).name in ('typecheck.mjs','lint.mjs','run-tests.mjs') and n not in pins]
    pool.shutdown(wait=True)
    batch.stdin.close();batch.wait()
    result={'contract':'repository-maintenance-audit-v1','historicalEvidencePayloadsProtectedNotReinterpreted':source_only,'counts':{'files':len(paths),'bytes':sum(v['bytes'] for v in metadata.values()),'textFilesAudited':len(references),'roots':len(roots),'reachable':len(reached),'hashReferencedPaths':len(pins),'gitBlobFallbacks':len(fallback)},'metadata':metadata,'references':references,'incoming':{k:sorted(v) for k,v in incoming.items()},'hashReferencedPaths':sorted(pins),'reachable':sorted(reached),'unreachableUnpinnedTaskScripts':sorted(orphan_scripts),'validationRunnerCandidates':sorted(unreferenced_docs_runners),'readErrors':errors,'gitBlobFallbacks':fallback}
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',required=True);modes=p.add_mutually_exclusive_group();modes.add_argument('--source-only',dest='source_only',action='store_true',help='Default: inventory every file and protect historical result payloads');modes.add_argument('--include-historical-payloads',dest='source_only',action='store_false',help='Also inspect historical result payloads for references, never qualify financial facts');p.set_defaults(source_only=True);a=p.parse_args();result=scan(a.source_only);Path(a.out).write_text(json.dumps(result,ensure_ascii=False));print(json.dumps({'counts':result['counts'],'unreachableTaskScripts':len(result['unreachableUnpinnedTaskScripts']),'validationRunnerCandidates':len(result['validationRunnerCandidates']),'readErrors':len(result['readErrors'])}))
