"""One private durable pre-activation recovery image + restore drill.
Uses the project's SQLite VACUUM INTO snapshot primitive; no live-file copying or source mutation.
The legacy full-schema backup CLI cannot inspect a pre-migration DB; its validators are not weakened.
"""
import importlib.util,json,os,pathlib,sqlite3,tempfile,shutil
R=pathlib.Path.cwd();P=R/'docs/fundamental-data-engine/evidence/2026-10-20-production-authority-final-activation'
spec=importlib.util.spec_from_file_location('state',P/'inspect-state.py');state=importlib.util.module_from_spec(spec);spec.loader.exec_module(state)
base=json.loads((P/'BASELINE_IDENTITY.json').read_text());gate=json.loads((P/'PRE_ACTIVATION_GATES.json').read_text());assert gate['status']=='PASS' and gate['expectedPreviousHead'] is None
source=R/'data/vn30.sqlite';before=state.inspect(source);assert before['sha256']==base['databaseSHA256'],'CONCURRENT_PRODUCTION_DB_CHANGE'
os.umask(0o077);parent=R/'backups';parent.mkdir(mode=0o700,exist_ok=True);assert not parent.is_symlink() and parent.stat().st_mode&0o077==0
output=parent/'production-authority-final-activation-20261020.sqlite';manifest=pathlib.Path(str(output)+'.manifest.json');assert not output.exists() and not manifest.exists(),'Recovery target already exists: refuse overwrite'
stage=pathlib.Path(tempfile.mkdtemp(prefix='.authority-recovery-',dir=parent))
def snapshot(src,dst):
 c=sqlite3.connect('file:'+str(src)+'?mode=ro',uri=True)
 try:c.execute('pragma trusted_schema=OFF');c.execute('VACUUM INTO ?',(str(dst),))
 finally:c.close()
 dst.chmod(0o600)
def same_logical(a,b):return a['schemaObjects']==b['schemaObjects'] and a['tables']==b['tables'] and a['migrations']==b['migrations']
def sync(p):
 fd=os.open(p,os.O_RDONLY)
 try:os.fsync(fd)
 finally:os.close(fd)
try:
 image=stage/'recovery.sqlite';snapshot(source,image);copy=state.inspect(image);assert same_logical(before,copy)
 restore=stage/'restore-drill.sqlite';snapshot(image,restore);assert same_logical(before,state.inspect(restore));restore.unlink()
 metadata={'format':'vn30-authority-activation-recovery-v1','mechanism':'SQLite VACUUM INTO; same supported consistent snapshot primitive as scripts/backup.mjs; independent exact schema/row/migration digest validation and restore drill for current schema','legacyBackupImplementationSHA256':state.sha((R/'scripts/backup.mjs').read_bytes()),'legacyCLIApplicability':'Requires all current migrations; pre-activation production is17/19. No legacy backup validator or global restore contract changed.','sourceSHA256':before['sha256'],'databaseSHA256':copy['sha256'],'schemaSHA256':before['schemaSHA256'],'tables':{k:{'rows':v['rows'],'sha256':v['sha256']} for k,v in before['tables'].items()},'migrations':before['migrations'],'restoreDrill':'PASS_EXACT_LOGICAL_ROWS_AND_SCHEMA','sourceHEAD':base['startingHEAD']}
 tempManifest=stage/'manifest.json';tempManifest.write_text(json.dumps(metadata,indent=2)+'\n');tempManifest.chmod(0o600);sync(image);sync(tempManifest);os.link(image,output);os.link(tempManifest,manifest);image.unlink();tempManifest.unlink();sync(parent)
 assert output.stat().st_nlink==1 and output.stat().st_mode&0o077==0 and manifest.stat().st_mode&0o077==0
 assert state.sha(source.read_bytes())==before['sha256']
 receipt={'status':'PASS','backupPath':str(output),'manifestPath':str(manifest),'backupSHA256':copy['sha256'],'sourceSHA256':before['sha256'],'mode':'0600 files /0700 directory','consistentSnapshot':'SQLite VACUUM INTO; source read-only','rowAndSchemaIdentity':'PASS','restoreDrill':'PASS','fsync':'PASS','copiesRetained':1,'retention':'One necessary pre-activation recovery image retained until independent review; no financial PDF/API/extraction copies created.','legacyGlobalBackupContractChanged':False}
 (P/'RECOVERY_REVIEW.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
finally:shutil.rmtree(stage)
