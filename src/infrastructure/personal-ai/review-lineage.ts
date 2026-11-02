import { readFile, realpath, lstat } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { instant } from '@/shared/time';
import { check } from '@/domain/scoring/validation';
import { financialRulesHash } from '@/domain/personal-ai/provenance';
import { lineageSemantic, validateReviewLineageGraph, type ReviewLineageGraph } from '@/domain/personal-ai/review-lineage';
import { snapshotHash } from '@/infrastructure/fundamentals/snapshot-hash';
import { pinnedAiBytes, type AiArtifactPin } from './pinned-review';
export interface LineageAcceptanceSnapshot {
  readonly contract: 'personal-ai-lineage-acceptance-snapshot-v1'; readonly scope: 'REVIEW_CANDIDATE';
  readonly reviewMode: 'OWNER_AUTHORIZED_AI_SELF_REVIEW'; readonly independentHumanReviewClaimed: false;
  readonly knownAt: string; readonly ownerAuthorizationReference: string; readonly financialRulesHash: string;
  readonly universeScope: string; readonly universeHash: string;
  readonly members: readonly { readonly ticker: string; readonly securityId: string; readonly path: string; readonly sha256: string; readonly contentHash: string; readonly sourceConflicts: readonly string[]; readonly nodeCount: number }[];
  readonly counts: Readonly<Record<string, number>>; readonly sourcePins: Readonly<Record<string, string>>;
  readonly technicalAcceptance: 'REQUIRES_TRUSTED_REPLAY'; readonly financialAcceptance: 'BLOCKED';
  readonly productionScoringAuthorized: false; readonly navAuthorized: false; readonly tradingAuthorized: false;
  readonly contentHash: string;
}
export function jsonPointer(root: unknown, pointer: string): unknown {
  check(pointer === '' || pointer.startsWith('/'), 'LINEAGE_INVALID_JSON_POINTER');
  let value = root;
  for (const token of pointer.split('/').slice(1)) {
    check(!/~(?![01])/u.test(token), 'LINEAGE_INVALID_POINTER_ESCAPE');
    const key = token.replace(/~1/g,'/').replace(/~0/g,'~');
    check(value !== null && typeof value === 'object' && Object.hasOwn(value,key), 'LINEAGE_POINTER_TARGET_MISSING');
    value = (value as Record<string,unknown>)[key];
  }
  return value;
}
/** Explicit pinned read-only review entry point. Never registers DI acceptance or appends scores. */
export async function verifyLineageAcceptanceSnapshot(root: string, pin: AiArtifactPin) {
  const s = await pinnedAiBytes(root,pin) as LineageAcceptanceSnapshot;
  check(Object.keys(s).sort().join(' ') === 'contract scope reviewMode independentHumanReviewClaimed knownAt ownerAuthorizationReference financialRulesHash universeScope universeHash members counts sourcePins technicalAcceptance financialAcceptance productionScoringAuthorized navAuthorized tradingAuthorized contentHash'.split(' ').sort().join(' '), 'LINEAGE_SNAPSHOT_EXACT_FIELDS');
  instant(s.knownAt);
  check(s.contract === 'personal-ai-lineage-acceptance-snapshot-v1' && s.scope === 'REVIEW_CANDIDATE' && s.reviewMode === 'OWNER_AUTHORIZED_AI_SELF_REVIEW' && s.independentHumanReviewClaimed === false, 'LINEAGE_SNAPSHOT_REVIEW_CONTRACT');
  check(s.contentHash === snapshotHash(lineageSemantic(s)) && s.financialRulesHash === financialRulesHash(snapshotHash), 'LINEAGE_SNAPSHOT_HASH_OR_RULES_MISMATCH');
  check(s.financialAcceptance === 'BLOCKED' && [s.productionScoringAuthorized,s.navAuthorized,s.tradingAuthorized].every(x => x === false) && s.technicalAcceptance === 'REQUIRES_TRUSTED_REPLAY', 'LINEAGE_SNAPSHOT_NOT_PRODUCTION_ACCEPTANCE');
  check(s.members.length === 30 && new Set(s.members.map(m => m.ticker)).size === 30 && new Set(s.members.map(m => m.securityId)).size === 30, 'LINEAGE_EXACT_THIRTY_UNIQUE_MEMBERS');
  check(s.universeHash === snapshotHash(s.members.map(m => ({ticker:m.ticker,securityId:m.securityId}))), 'LINEAGE_UNIVERSE_MISMATCH');
  const base = await realpath(root), jsonCache = new Map<string,unknown>();
  async function bytes(path: string, expected: string) {
    check(s.sourcePins[path] === expected, 'LINEAGE_UNPINNED_SOURCE');
    const target = resolve(base,path), rel = relative(base,target);
    check(rel.length > 0 && !rel.startsWith('..') && !isAbsolute(rel), 'LINEAGE_SOURCE_PATH_ESCAPE');
    const stat = await lstat(target), actual = await realpath(target), actualRel = relative(base,actual);
    check(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 100000000 && !actualRel.startsWith('..') && !isAbsolute(actualRel), 'LINEAGE_SOURCE_FILE_REQUIRED');
    const raw = await readFile(target);
    check(createHash('sha256').update(raw).digest('hex') === expected, 'LINEAGE_SOURCE_BYTES_MISMATCH'); return raw;
  }
  // Pin the source universe and identity set, not just a self-consistent caller list.
  const inputPath = Object.keys(s.sourcePins).find(p => p.endsWith('/vn30-lineage-v1/inputs.json'));
  check(inputPath, 'LINEAGE_POLICY_INPUT_PIN_REQUIRED');
  const inputs = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await bytes(inputPath,s.sourcePins[inputPath]))) as { universe?: readonly {ticker:string;securityId:string}[]; ownerAuthorizationReference:string; financialRulesHash:string; reviewedAt:string; universeScope:string; locatorRepairs:readonly {observationId:string;pdfPath:string;pdfSha256:string;physicalPage:number;periodEnd:string;valueVnd:string;fullPageImageInspected:boolean}[] };
  check(inputs.ownerAuthorizationReference === s.ownerAuthorizationReference && inputs.financialRulesHash === s.financialRulesHash && inputs.reviewedAt === s.knownAt && inputs.universeScope === s.universeScope, 'LINEAGE_OWNER_POLICY_OR_REVIEW_BINDING');
  check(inputs.universe && snapshotHash(inputs.universe) === s.universeHash, 'LINEAGE_RETAINED_UNIVERSE_BINDING');
  for (const [path,expected] of Object.entries(s.sourcePins)) {
    const raw = await bytes(path,expected);
    if (path.endsWith('.json')) jsonCache.set(path,JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw)));
  }
  const contextPath=Object.keys(s.sourcePins).find(p=>p.endsWith('/b6-comparability-r2/native-review-sources.json'));
  check(contextPath, 'LINEAGE_ORIGINAL_CONTEXTS_REQUIRED');
  const contexts = new Map((jsonCache.get(contextPath) as {contexts:readonly {observationId:string;sourcePath:string;sourceHash:string}[]}).contexts.map(c=>[c.observationId,c]));
  const results=[];
  const counts: Record<string,number> = {source:0,normalized:0,derived:0,evidence:0,rubric:0,retainedAssessedRubrics:0,stalePriorFactBindings:0,invalidLegacyPageLocators:0,repairedLegacyPageLocators:0};
  for (const member of s.members) {
    const g = await pinnedAiBytes(root,{reference:member.ticker,path:member.path,sha256:member.sha256}) as ReviewLineageGraph;
    check(g.ticker === member.ticker && g.securityId === member.securityId && g.contentHash === member.contentHash && g.knownAt === s.knownAt && g.nodes.length === member.nodeCount, 'LINEAGE_MEMBER_IDENTITY_OR_VERSION_MISMATCH');
    const nativePath=Object.keys(s.sourcePins).find(p=>p.endsWith(`/b6-comparability-r2/native-inputs/${g.ticker}.json`));
    check(nativePath, 'LINEAGE_ORIGINAL_NATIVE_INPUT_REQUIRED');
    const native=jsonCache.get(nativePath) as {bridgePlan:{facts:readonly {observationId:string;validThrough:string}[]}};
    check(snapshotHash(native.bridgePlan.facts.filter(b=>b.validThrough<s.knownAt).map(b=>b.observationId))===snapshotHash(g.stalePriorFactBindings), 'LINEAGE_STALE_BINDINGS_RELABELED');
    check(snapshotHash(g.sourceConflicts) === snapshotHash(member.sourceConflicts), 'LINEAGE_CONFLICT_DISPOSITION_MISMATCH');
    for (const n of g.nodes) {
      counts[n.kind.toLowerCase()]++;
      if (n.kind === 'RUBRIC') {
        if (n.value !== null) counts.retainedAssessedRubrics++;
        const original = jsonCache.get(String(n.details.retainedAssessmentPath)) as {ticker:string;scoreInput:{assessments:readonly {subcategory:string}[]}} | undefined;
        const assessment = original?.scoreInput.assessments.find(a => a.subcategory === n.details.rubricId);
        check(original?.ticker === g.ticker && assessment && snapshotHash(assessment) === n.details.retainedAssessmentHash, 'LINEAGE_ORIGINAL_ASSESSMENT_CHANGED');
      }
      if (n.details.invalidLegacyPageLocator === true) counts.invalidLegacyPageLocators++;
      if (n.details.locatorRepair) counts.repairedLegacyPageLocators++;
    }
    counts.stalePriorFactBindings += g.stalePriorFactBindings.length;
    for (const n of g.nodes) if (n.source !== null) {
      const src = n.source; check(s.sourcePins[src.path] === src.sha256 && jsonCache.has(src.path), 'LINEAGE_SOURCE_ARTIFACT_BINDING');
      const document = jsonCache.get(src.path);
      let cursor = document, subject: string | null = null;
      if (document && typeof document === 'object' && 'ticker' in document) subject = String((document as {ticker:unknown}).ticker);
      for (const token of src.pointer.split('/').slice(1)) {
        cursor = jsonPointer(cursor,'/'+token);
        if (cursor && typeof cursor === 'object' && 'ticker' in cursor) subject = String((cursor as {ticker:unknown}).ticker);
      }
      if (src.path.endsWith('/conflict-readings.json')) subject = src.pointer.split('/')[1];
      check(subject === g.ticker, 'LINEAGE_SOURCE_ISSUER_MISMATCH');
      if (document && typeof document === 'object' && 'securityId' in document) check((document as {securityId:unknown}).securityId === g.securityId, 'LINEAGE_SOURCE_SECURITY_MISMATCH');
      const observationMatch=/^\/observations\/(\d+)\/raw\/lexicalValue$/.exec(src.pointer);
      if (observationMatch) {
        const o=jsonPointer(document,`/observations/${observationMatch[1]}`) as {id:string;periodStart:string;periodEnd:string;reportingScope:string;normalized:{value:string}};
        const context=contexts.get(o.id);
        check(n.id==='source:'+o.id && snapshotHash(o)===n.details.observationHash && context?.sourcePath===src.pdfPath && context?.sourceHash===src.pdfSha256, 'LINEAGE_ORIGINAL_OBSERVATION_BINDING');
        if (n.details.locatorRepair) {
          const repair=inputs.locatorRepairs.find(r=>r.observationId===o.id);
          check(repair && snapshotHash(repair)===snapshotHash(n.details.locatorRepair) && repair.fullPageImageInspected && repair.pdfPath===src.pdfPath && repair.pdfSha256===src.pdfSha256 && repair.physicalPage===src.physicalPage && repair.periodEnd===o.periodEnd && repair.valueVnd===o.normalized.value, 'LINEAGE_CHECKED_LOCATOR_REPAIR_BINDING');
        }
        check(n.periodStart===o.periodStart && n.periodEnd===o.periodEnd && n.reportingScope===o.reportingScope, 'LINEAGE_ORIGINAL_OBSERVATION_DIMENSIONS');
      }
      const noteMatch=/^(.*\/checkedNoteReadings\/\d+)\/valueVnd$/.exec(src.pointer);
      if (noteMatch) {
        const note=jsonPointer(document,noteMatch[1]) as {sourcePdf:string;sourceHash:string;physicalPage:number};
        check(note.sourcePdf===src.pdfPath && note.sourceHash===src.pdfSha256 && note.physicalPage===src.physicalPage, 'LINEAGE_CHECKED_NOTE_DOCUMENT_BINDING');
      }
      const factMatch=/^(\/facts\/\d+)\/(reportedCommonProfit|weightedAverageShares)$/.exec(src.pointer);
      if (factMatch) {
        const fact=jsonPointer(document,factMatch[1]) as {source:{pdfPath:string;sha256:string;page:number}};
        check(fact.source.pdfPath===src.pdfPath && fact.source.sha256===src.pdfSha256 && fact.source.page===src.physicalPage, 'LINEAGE_COMMON_NOTE_DOCUMENT_BINDING');
      }
      const conflictMatch=/^(\/(?:BSR|GVR)\/readings\/\d+)\/valueVnd$/.exec(src.pointer);
      if (conflictMatch) {
        const reading=jsonPointer(document,conflictMatch[1]) as {pdfPath:string;pdfSha256:string;page:number};
        check(reading.pdfPath===src.pdfPath && reading.pdfSha256===src.pdfSha256 && reading.page===src.physicalPage, 'LINEAGE_CONFLICT_READING_DOCUMENT_BINDING');
      }
      const payload = jsonPointer(document,src.pointer);
      check(snapshotHash(payload) === src.payloadHash && (n.value === null || payload === n.value), 'LINEAGE_SOURCE_POINTER_VALUE_MISMATCH');
      if (src.pdfPath !== null) check(s.sourcePins[src.pdfPath] === src.pdfSha256, 'LINEAGE_PDF_IDENTITY_MISMATCH');
    }
    results.push(validateReviewLineageGraph(g,snapshotHash));
  }
  check(snapshotHash(counts) === snapshotHash(s.counts), 'LINEAGE_SNAPSHOT_COUNTS_MISMATCH');
  return Object.freeze({ contract:'personal-ai-lineage-validation-v1', snapshotHash:s.contentHash, technicalMappingAccepted:true, issuers:results.length, rubricMappings:results.length*23, sourcePins:Object.keys(s.sourcePins).length, financialAcceptance:'BLOCKED', personalAiAcceptanceEligible:false, productionScoringAuthorized:false, navAuthorized:false, tradingAuthorized:false, results });
}
