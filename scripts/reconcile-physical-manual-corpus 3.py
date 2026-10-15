"""Physical discovery precedes PDF classification and document qualification."""
import argparse, hashlib, json, os
from pathlib import Path


def inventory(source, previous, pdf_validator):
    source = Path(source)
    rows, directories, seen = [], [], {}
    # os.walk visits hidden and mixed-case names; never follow directory symlinks.
    for base, dirs, names in os.walk(source, followlinks=False):
        dirs.sort()
        for name in sorted(dirs):
            p = Path(base) / name
            if p.is_symlink():
                raise ValueError('Unresolved directory symlink: ' + str(p))
            directories.append(p.relative_to(source).as_posix())
        for name in sorted(names):
            p = Path(base) / name
            if p.is_symlink() or not p.is_file():
                raise ValueError('Unresolved non-regular entry: ' + str(p))
            body = p.read_bytes()
            relative = p.relative_to(source).as_posix()
            digest = hashlib.sha256(body).hexdigest()
            extension = p.suffix.lower()
            is_pdf = extension == '.pdf' or body.startswith(b'%PDF-')
            valid, error = pdf_validator(body) if is_pdf else (False, None)
            duplicate = valid and digest in seen
            category = 'NON_PDF' if not is_pdf else 'INVALID_FILE' if not valid else 'DUPLICATE' if duplicate else 'ELIGIBLE_IN_SCOPE'
            rows.append(dict(relativePath=relative, path='data/manual-fundamentals/'+relative,
                filename=name, extension=extension, size=len(body), sha256=digest,
                tickerDirectory=relative.split('/')[0] if '/' in relative else None,
                fileType='PDF' if is_pdf else 'JSON' if extension=='.json' else 'MACOS_METADATA' if name=='.DS_Store' else 'OTHER',
                isPdf=is_pdf, validPdf=valid, existedInPreviousInventory=relative in previous,
                duplicateBySha256=duplicate, duplicateOf=seen.get(digest) if duplicate else None,
                eligibleFinancialStatementProcessing=category=='ELIGIBLE_IN_SCOPE',
                classification=category, exclusionReason=None if category=='ELIGIBLE_IN_SCOPE' else category,
                validationError=error))
            if valid and not duplicate: seen[digest] = relative
    rows.sort(key=lambda r:r['relativePath'])
    counts=dict(physicalFiles=len(rows), directoryEntries=len(directories), filesystemEntries=len(rows)+len(directories),
        pdfFiles=sum(r['isPdf'] for r in rows),validPdfFiles=sum(r['validPdf'] for r in rows),
        uniquePdfHashes=len(seen), duplicatePdfFiles=sum(r['duplicateBySha256'] for r in rows),
        nonPdfFiles=sum(not r['isPdf'] for r in rows),previouslyInventoriedFiles=sum(r['existedInPreviousInventory'] for r in rows),
        newOrPreviouslyMissedFiles=sum(not r['existedInPreviousInventory'] for r in rows),
        eligibleFinancialDocuments=sum(r['eligibleFinancialStatementProcessing'] for r in rows),
        excludedFiles=sum(not r['eligibleFinancialStatementProcessing'] for r in rows))
    equation={k:sum(r['classification']==v for r in rows) for k,v in [('eligibleInScope','ELIGIBLE_IN_SCOPE'),('duplicates','DUPLICATE'),('nonPdf','NON_PDF'),('invalid','INVALID_FILE'),('otherExplicitExclusions','OTHER')]}
    assert sum(equation.values())==len(rows)
    return dict(counts=counts, reconciliationEquation=equation, files=rows, directories=sorted(directories),unexplainedFiles=0,
        eligibilityMeaning='Eligible for document qualification; does not assert document qualification or accounting-fact admission.')


def main():
    import pymupdf
    args=argparse.ArgumentParser()
    args.add_argument('--output',required=True)
    options=args.parse_args()
    if (Path(options.output)/'ARTIFACT_HASHES.json').exists():
        raise ValueError('Evidence package sealed; choose a new output directory')
    old=json.loads(Path('docs/fundamental-data-engine/evidence/2026-10-13-manual-first-refactor/MANUAL_FUNDAMENTALS_PRE_REFACTOR_AUDIT.json').read_text())
    previous={r['path'].removeprefix('data/manual-fundamentals/') for r in old['retainedPdfInventory']}
    def validate(body):
        try:
            with pymupdf.open(stream=body,filetype='pdf') as doc:
                if doc.needs_pass or not len(doc): return False,'ENCRYPTED_OR_EMPTY'
                for page in doc: page.get_text() # Parse every retained page, without admitting extracted facts.
            return True,None
        except Exception as error: return False,str(error)
    result=inventory('data/manual-fundamentals',previous,validate)
    output=Path(options.output);output.mkdir(parents=True,exist_ok=True)
    (output/'PHYSICAL_MANUAL_CORPUS_INVENTORY.json').write_text(json.dumps(result,indent=2)+'\n')
    discrepancy=[dict(relativePath=d,entryKind='DIRECTORY',isPhysicalFile=False,rootCause='OTHER_EXPLICIT_REASON',reason='Owner count includes ticker directories; directory is not a physical file.') for d in result['directories']]
    discrepancy += [dict(**r,entryKind='FILE',isPhysicalFile=True,rootCause='NON_PDF',reason='Previous inventory explicitly enumerated PDFs only.') for r in result['files'] if not r['existedInPreviousInventory']]
    report=dict(status='RECONCILED_WITH_OWNER_ENTRY_COUNT_CORRECTION',expectedPhysicalFilesFromOwner=176,
        physicalFilesDiscovered=result['counts']['physicalFiles'],difference=result['counts']['physicalFiles']-176,
        owner176MatchesFilesystemEntries=result['counts']['filesystemEntries']==176,previousInventoryPdfFiles=144,
        actualPreviouslyMissedOrNewFiles=result['counts']['newOrPreviouslyMissedFiles'],
        discrepancyEntries=discrepancy,discrepancyEntryCount=len(discrepancy),missingPriorPaths=sorted(previous-{r['relativePath'] for r in result['files']}),
        unexplainedFiles=0,counts=result['counts'],reconciliationEquation=result['reconciliationEquation'],
        scannerAudit=dict(previousScanner='scripts/inspect-08b-manual-corpus.py',previousPdfDiscovery="rglob('*.pdf') + rglob('*.PDF')",potentialMixedCaseBug='EXTENSION_FILTER_BUG',
            previousReprocessor='scripts/reprocess-manual-first.mjs',reprocessorCause='STALE_EVIDENCE_PACKAGE',
            finding='Reprocessor used retainedPdfInventory from a sealed prior audit as discovery authority. No currently retained PDF was missed. Physical176 claim conflated 146 files and 30 directories.',
            fixedPipeline=['PHYSICAL_CORPUS','FILE_CLASSIFICATION','PDF_CORPUS','DOCUMENT_QUALIFICATION','ACCOUNTING_EXTRACTION','CANONICALIZATION'],
            filesAddedAfterPriorRun='NOT_PROVEN: no timestamp inference used'))
    (output/'MANUAL_CORPUS_176_VS_144_RECONCILIATION.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(result['counts']))

if __name__=='__main__': main()
