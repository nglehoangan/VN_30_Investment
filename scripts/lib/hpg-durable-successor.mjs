// Retention-only projection. No numeric, period, scope or debt semantics are rewritten.
export const HPG_DURABLE_PROJECTION='hpg-durable-provenance-v1';
export const disposableExtractionPath=path=>/(?:^|\/)manual-extracted\/|\.(?:png|jpe?g|txt)$/i.test(path)||/^\/(?:private\/)?tmp\//.test(path);
export function omitReaderProof(value){
 if(Array.isArray(value))return value.map(omitReaderProof);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>key!=='retainedReaderProof').map(([key,v])=>[key,omitReaderProof(v)]));
 return value;
}
export function compactHPGInput(input){
 if(input.universe.length!==1||input.universe[0].ticker!=='HPG')throw new Error('HPG_SCOPED_ACTIVATED_INPUT_REQUIRED');
 const compact=omitReaderProof(input);
 compact.sourceBindings=compact.sourceBindings.filter(b=>!disposableExtractionPath(b.path));
 if(/retainedReaderProof|manual-extracted|\.png"|\.jpg"|\/private\/tmp\//.test(JSON.stringify(compact)))throw new Error('EXTRACTION_REFERENCE_REMAINS');
 return compact;
}
export function semanticSnapshot(snapshot){
 const content=omitReaderProof(snapshot);
 delete content.sourceBindings;delete content.contentHash;
 return content;
}
