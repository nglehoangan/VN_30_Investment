import {validateCafeFResponse, payloadHash, type CafeFEndpoint, type CafeFMode} from './cafef';
import {cafeFRecordSchema, cafeFGroupSchema, type CafeFTemplateRow} from '@/shared/validation/cafef';

export const CAFEF_DISPLAY_REPORTS = {
  GetReportSummary: {key:'bao-cao-tom-tat', label:'BCTC tóm tắt'},
  GetReportCDKT: {key:'can-doi-ke-toan', label:'Cân đối kế toán'},
  GetReportDetail: {key:'ket-qua-kinh-doanh', label:'Kết quả kinh doanh'},
  GetReportLCTT: {key:'luu-chuyen-tien-te', label:'Lưu chuyển tiền tệ'},
} as const;

/** Presentation mapping of retained provider data; no accounting admission or inferred hierarchy. */
export function mapCafeFDisplay(body:string, endpoint:CafeFEndpoint, ticker:string, requestMode:CafeFMode) {
  const parsed = validateCafeFResponse(body, endpoint, ticker, requestMode);
  const sourceHash = payloadHash(body);
  const template = parsed.rawValue.templace;
  const groups = template.map((entry, index) => ({
    id:Array.isArray(entry.data) ? entry.code : '__ungrouped',
    label:Array.isArray(entry.data) ? entry.name : null,
    order:index,
    providerOrder:entry.number ?? null,
    rows:(Array.isArray(entry.data) ? entry.data : [entry]) as CafeFTemplateRow[],
  }));
  // Flat templates form one group. Array order is authoritative; `lever` is not
  // a reliable nesting depth (income templates contain values such as 10, 20, 30).
  const displayGroups = template.some(entry => 'data' in entry) ? groups : [{
    id:'__ungrouped', label:null, order:0, providerOrder:null, rows:parsed.templates,
  }];
  const columns = new Map<string, {
    id:string; periodKey:string; year:number; quarter:number|null; periodType:string;
    label:string; providerType:string; providerContent:string; requestMode:CafeFMode;
    modeMismatch:boolean; groups:Array<{
      id:string; label:string|null; order:number; providerOrder:number|null;
      rows:Array<{id:string; code:string; rawCode:string; label:string; order:number;
        providerOrder:number|null; providerLevel:number|null; static:boolean|null;
        value:string|null; status:string; duplicateTemplateCode:boolean; rawLocator:string|null}>;
      unmappedCells:Array<{code:string; value:string|null; rawLocator:string}>;
    }>;
  }>();
  let rejectedRecordCount = 0;
  const collect = (record:typeof parsed.records[number], groupCode:string|null, locator:string) => {
    if (record.year < 1900 || record.year > 2200 || record.quater < 0 || record.quater > 4) {
      rejectedRecordCount++; return;
    }
    const quarter = record.quater || null;
    const periodType = quarter === null ? 'ANNUAL' : requestMode === 'QUY' ? 'QUARTER' : 'YTD';
    const periodKey = quarter === null ? String(record.year) : `${record.year}-${periodType === 'QUARTER' ? 'Q' : 'YTD'}${quarter}`;
    const key = JSON.stringify([periodKey, record.type, record.content, record.time]);
    let column = columns.get(key);
    if (!column) {
      column = {id:payloadHash(`${sourceHash}:${requestMode}:${key}`), periodKey, year:record.year,
        quarter, periodType, label:record.time, providerType:record.type,
        providerContent:record.content, requestMode,
        modeMismatch:requestMode === 'NAM' ? quarter !== null : quarter === null, groups:[]};
      columns.set(key, column);
    }
    const matched = displayGroups.filter(g => groupCode === null ? g.id === '__ungrouped' : g.id === groupCode);
    if (matched.length !== 1) throw Error('DISPLAY_TEMPLATE_GROUP_AMBIGUOUS');
    const g = matched[0];
    if (column.groups.some(existing => existing.id === g.id)) throw Error('DISPLAY_DUPLICATE_RECORD_GROUP');
    const codes = new Set<string>();
    const rows = g.rows.map((row, order) => {
      const code = row.code.trim();
      codes.add(code);
      const cellIndex = record.data.findIndex(c => c.code.trim() === code);
      const cell = record.data[cellIndex];
      const value = cell?.value === null || cell === undefined ? null : String(cell.value);
      return {id:`${g.id}:${code}:${order}`, code, rawCode:row.code, label:row.name, order,
        duplicateTemplateCode:g.rows.filter(other => other.code.trim() === code).length > 1,
        providerOrder:row.number ?? null, providerLevel:row.lever ?? null, static:row.static ?? null,
        value, status:cell === undefined ? 'MISSING_CELL' : value === null ? 'NULL' : /^-?0+(?:\.0+)?$/.test(value) ? 'ZERO' : 'VALUE',
        rawLocator:cell === undefined ? null : `${locator}/data/${cellIndex}/value`};
    });
    column.groups.push({id:g.id, label:g.label, order:g.order, providerOrder:g.providerOrder, rows,
      unmappedCells:record.data.flatMap((cell, i) => codes.has(cell.code.trim()) ? [] : [{
        code:cell.code, value:cell.value === null ? null : String(cell.value), rawLocator:`${locator}/data/${i}/value`,
      }])});
    column.groups.sort((a,b) => a.order-b.order);
  };
  parsed.rawValue.data.forEach((entry, i) => {
    if (typeof entry.symbol === 'string') collect({...cafeFRecordSchema.parse(entry), group:null}, null, `/value/data/${i}`);
    else {
      const group = cafeFGroupSchema.parse(entry);
      group.data.forEach((record, j) => collect({...record, group:group.code}, group.code, `/value/data/${i}/data/${j}`));
    }
  });
  return {schemaVersion:'cafef-display-v1', ticker, report:CAFEF_DISPLAY_REPORTS[endpoint], endpoint,
    sourceHash, requestMode, providerUnit:parsed.unit, unitStatus:parsed.unit === null ? 'UNDECLARED' : 'PROVIDER_DECLARED',
    status:'PROVIDER_DISPLAY_ONLY', productionAdmissible:false,
    rejectedRecordCount, columns:[...columns.values()]};
}
