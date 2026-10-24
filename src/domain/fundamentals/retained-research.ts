/** Presentation-only contract. Deliberately incompatible with admitted/manual scoring snapshots. */
export interface RetainedResearch {
 contract: 'retained-financial-research-v1'; classification: 'RETAINED_RESEARCH_DATA';
 productionAdmissible: false; scoringAuthorized: false; historicalAsKnownSupported: false;
 viewedAt: string; manifestPath: string; manifestHash: string;
 catalog: {ticker:string; selections:Record<string,number>}[];
 quarantines: {ticker:string; endpoint:string; mode:string; path:string; reason:string}[];
 ticker?: string; fileHash?: string; variants: ResearchVariant[]; selected?: ResearchVariant;
 rows: ResearchRow[]; totalRows:number; page:number; pageSize:number; warnings:string[];
}
export interface ResearchVariant {
 index:number; id:string; report:string; periodKey:string; periodType:string; label:string;
 reportingScope:string; scopeStatus:string; sourcePath:string; sourceHash:string;
 provider:string; retrievedAt:string|null; publicationAt:null; periodEnd:string|null;
}
export interface ResearchRow {
 id:string; code:string|null; label:string; group:string; value:string|null; source:string;
 status:string; unit:string|null; currency:string|null; scale:string|null; reportingScope:string;
 reasons:string[]; pointer:string; evidencePath:string|null; evidencePointer:string|null;
 pdfPath:string|null; page:number|null; sourceHash:string; rawLocator:string|null;
}
