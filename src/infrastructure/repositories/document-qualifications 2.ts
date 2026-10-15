import { mkdirSync, lstatSync, readdirSync, readFileSync, writeFileSync, unlinkSync, realpathSync, existsSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { createHash } from 'node:crypto';
import type { DocumentQualificationRepository } from '@/ports/fundamentals';
import type { DocumentQualification } from '@/domain/fundamentals/document-qualification';
import { validateDocumentQualification, qualificationHead } from '@/domain/fundamentals/document-qualification';
import { requireFundamental, fundamentalHash } from '@/domain/fundamentals/validation';
const hash = (body: string) => createHash('sha256').update(body).digest('hex');

/** Explicit private local artifact store. No new DB, raw blob copy or production composition. */
export class FileDocumentQualifications implements DocumentQualificationRepository {
  private readonly directory: string;
  constructor(directory: string) {
    requireFundamental(isAbsolute(directory),'QUALIFICATION_ABSOLUTE_DIRECTORY');
    try { mkdirSync(directory,{mode:0o700}); } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')) throw error;
    }
    const stat = lstatSync(directory);
    requireFundamental(stat.isDirectory() && !stat.isSymbolicLink() && (stat.mode & 0o077) === 0,'QUALIFICATION_PRIVATE_DIRECTORY');
    this.directory = realpathSync(directory);
  }
  private location(documentId: string) {
    fundamentalHash(documentId);
    return join(this.directory,documentId + '.json');
  }
  async history(documentId: string): Promise<readonly DocumentQualification[]> {
    return this.readHistory(documentId,false);
  }
  private readHistory(documentId: string, ownLock: boolean): readonly DocumentQualification[] {
    this.location(documentId);
    requireFundamental(ownLock || !existsSync(this.location(documentId) + '.lock'),'QUALIFICATION_WRITER_ACTIVE');
    const entries = readdirSync(this.directory).filter(name => name.startsWith(documentId + '-'));
    const names = entries.filter(name => name.endsWith('.json')).sort();
    const receipts = entries.filter(name => name.endsWith('.receipt')).sort();
    requireFundamental(receipts.length === names.length,'QUALIFICATION_JOURNAL_INCOMPLETE');
    requireFundamental(names.length <= 1000,'QUALIFICATION_HISTORY_LIMIT');
    const records: DocumentQualification[] = [];
    let previousHash: string | null = null;
    for (const [index,name] of names.entries()) {
      requireFundamental(name === `${documentId}-${String(index).padStart(4,'0')}.json`,'QUALIFICATION_JOURNAL_GAP');
      const file = join(this.directory,name), stat = lstatSync(file);
      requireFundamental(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 1_000_000 && (stat.mode & 0o077) === 0,'QUALIFICATION_PRIVATE_FILE');
      const text = readFileSync(file,'utf8');
      const receipt = file + '.receipt', receiptStat = lstatSync(receipt);
      requireFundamental(receiptStat.isFile() && !receiptStat.isSymbolicLink() && receiptStat.size === 64 &&
        (receiptStat.mode & 0o077) === 0 && readFileSync(receipt,'utf8') === hash(text),'QUALIFICATION_COMMIT_RECEIPT');
      const stored = JSON.parse(text);
      requireFundamental(Object.keys(stored).sort().join(' ') === 'body bodyHash previousHash' &&
        typeof stored.body === 'string' && hash(stored.body) === stored.bodyHash && stored.previousHash === previousHash,'QUALIFICATION_STORED_INTEGRITY');
      const q = validateDocumentQualification(JSON.parse(stored.body));
      requireFundamental(q.documentId === documentId,'QUALIFICATION_STORED_IDENTITY');
      records.push(q); previousHash = stored.bodyHash;
    }
    qualificationHead(records);
    requireFundamental(ownLock || !existsSync(this.location(documentId) + '.lock'),'QUALIFICATION_WRITER_ACTIVE');
    return Object.freeze(records);
  }
  async append(raw: DocumentQualification) {
    const q = validateDocumentQualification(raw);
    const lock = this.location(q.documentId) + '.lock';
    // Exclusive writer lock prevents correction forks and stale predecessor appends.
    writeFileSync(lock,'qualification append lock',{flag:'wx',mode:0o600});
    try {
      const history = this.readHistory(q.documentId,true);
      requireFundamental(history.length < 1000,'QUALIFICATION_HISTORY_LIMIT');
      const head = qualificationHead(history);
      requireFundamental(q.supersedesQualificationId === (head?.id ?? null),'QUALIFICATION_STALE_PREDECESSOR');
      qualificationHead([...history,q]);
      const body = JSON.stringify(q), previousHash = head ? hash(JSON.stringify(head)) : null;
      const file = join(this.directory,`${q.documentId}-${String(history.length).padStart(4,'0')}.json`);
      const stored = JSON.stringify({body,bodyHash:hash(body),previousHash});
      writeFileSync(file,stored,{flag:'wx',mode:0o400,flush:true});
      writeFileSync(file + '.receipt',hash(stored),{flag:'wx',mode:0o400,flush:true});
    } finally { unlinkSync(lock); }
  }
}
