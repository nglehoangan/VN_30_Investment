import './lib/ts-runtime.mjs';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {RepositoryRawDocuments}=await import('../src/infrastructure/fundamentals/raw-document.ts');
const base='data/initialization-08b-final-work/',db=new DatabaseSync('data/initialization-08b.sqlite',{readOnly:true});db.exec('PRAGMA query_only=ON');
const sha=b=>createHash('sha256').update(b).digest('hex'),inventory=createHash('sha256'),counts={};
const tables=['fundamental_source_version','fundamental_import_batch','fundamental_raw_capture'];
for(const table of tables){counts[table]=0;for(const r of db.prepare(`SELECT id,body,body_hash FROM ${table} ORDER BY id`).iterate()){if(sha(r.body)!==r.body_hash)throw Error('RAW_HASH');inventory.update(JSON.stringify([table,r.id,r.body_hash])+'\n');counts[table]++;}}
const get=(table,id)=>{const r=db.prepare(`SELECT body,body_hash FROM ${table} WHERE id=?`).get(id);if(!r||sha(r.body)!==r.body_hash)throw Error('RAW_RECORD_HASH');return JSON.parse(r.body);};
const reader=new RepositoryRawDocuments({findCapture:async id=>get(tables[2],id),findImport:async id=>get(tables[1],id),findSource:async id=>get(tables[0],id)});
const previous=JSON.parse(readFileSync('data/initialization-08b-review-03/review-package.json','utf8')),documents=[];
process.umask(0o077);
try{for(const d of previous.documents){const raw=await reader.reconstruct(d.captureIds);if(raw.documentId!==d.documentId||raw.bodyHash!==d.bodyHash)throw Error('DOCUMENT_REPLAY');const file=base+raw.bodyHash+'.pdf';if(!existsSync(file))writeFileSync(file,Buffer.from(raw.bodyBase64,'base64'),{flag:'wx',mode:0o600});const metadata={...raw};delete metadata.bodyBase64;const capture=get(tables[2],raw.captureIds[0]);const envelope=JSON.parse(capture.payload);documents.push({...metadata,ticker:d.researchTicker,file:raw.bodyHash+'.pdf',originalPublicUrl:envelope.url});}
writeFileSync(base+'corpus.json',JSON.stringify({rawFingerprint:inventory.digest('hex'),rawCounts:counts,documents},null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({reconstructed:documents.length,distinctBodies:new Set(documents.map(d=>d.bodyHash)).size,rawCounts:counts}));}finally{db.close();}
