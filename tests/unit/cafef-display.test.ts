import {describe, it, expect} from 'vitest';
import {mapCafeFDisplay} from '@/infrastructure/fundamentals/cafef-display';

function body(values:unknown[] = [{code:'A',value:'9007199254740993123'},{code:'B',value:0},{code:'C',value:null}]) {
  return JSON.stringify({isSuccess:true,value:{count:1,unit:null,templace:[{code:'HDKD',name:'Hoạt động kinh doanh',data:
    ['A','B','C','D'].map((code,i)=>({code,name:`${i+1}. Chỉ tiêu`,number:i,lever:1}))}],data:[{
      code:'HDKD',name:'Hoạt động kinh doanh',data:[{symbol:'VNM',year:2025,quater:0,type:'HK',content:'Đã kiểm toán',time:'2025',data:values}],
    }]}});
}
describe('CafeF presentation mapping',()=>{
  it('joins by code, retains labels/order, large numeric tokens, zero, null and absent cells',()=>{
    const raw = body().replace('"9007199254740993123"','9007199254740993123');
    const mapped=mapCafeFDisplay(raw,'GetReportLCTT','VNM','NAM');
    const rows=mapped.columns[0].groups[0].rows;
    expect(rows.map(r=>r.value)).toEqual(['9007199254740993123','0',null,null]);
    expect(rows.map(r=>r.status)).toEqual(['VALUE','ZERO','NULL','MISSING_CELL']);
    expect(rows[0].label).toBe('1. Chỉ tiêu');
    expect(rows[0].rawLocator).toBe('/value/data/0/data/0/data/0/value');
    expect(mapped.unitStatus).toBe('UNDECLARED');
    expect(mapped.productionAdmissible).toBe(false);
  });
  it('retains unknown cells instead of silently dropping them',()=>{
    const mapped=mapCafeFDisplay(body([{code:'X',value:'-12'}]),'GetReportLCTT','VNM','NAM');
    expect(mapped.columns[0].groups[0].unmappedCells[0]).toMatchObject({code:'X',value:'-12'});
  });
  it('separates year, quarter and YTD and flags an annual response to a quarterly request',()=>{
    const raw=body().replace('"quater":0','"quater":2');
    expect(mapCafeFDisplay(raw,'GetReportLCTT','VNM','QUY').columns[0].periodKey).toBe('2025-Q2');
    expect(mapCafeFDisplay(raw,'GetReportLCTT','VNM','LUYKE').columns[0].periodKey).toBe('2025-YTD2');
    expect(mapCafeFDisplay(body(),'GetReportLCTT','VNM','QUY').columns[0].modeMismatch).toBe(true);
  });
  it('rejects duplicate codes rather than selecting an arbitrary value',()=>{
    expect(()=>mapCafeFDisplay(body([{code:'A',value:'1'},{code:' A',value:'2'}]),'GetReportLCTT','VNM','NAM')).toThrow('DUPLICATE_PROVIDER_CODE');
  });
  it('preserves duplicate template rows with distinct IDs and an explicit flag',()=>{
    const raw=body().replace('"code":"D"','"code":"A"');
    const rows=mapCafeFDisplay(raw,'GetReportLCTT','VNM','NAM').columns[0].groups[0].rows;
    expect(rows).toHaveLength(4);
    expect(rows[0].duplicateTemplateCode).toBe(true);
    expect(rows[3].value).toBe(rows[0].value);
    expect(rows[3].id).not.toBe(rows[0].id);
  });
});
