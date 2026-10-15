import {it,expect} from 'vitest';
import {auditCafeFRefresh} from '@/infrastructure/fundamentals/cafef-refresh';
const payload=(value:number,year=2025,name='Doanh thu thuần',unit:unknown=null)=>JSON.stringify({isSuccess:true,value:{templace:[{code:'10',name,lever:1}],count:1,unit,type:'KQKD',timeType:'NAM',data:[{symbol:'HPG',year,quater:0,type:'HK',content:'Đã kiểm toán',time:String(year),data:[{code:'10',value}]}]}});
const audit=(a:string,b:string)=>auditCafeFRefresh(a,b,'GetReportDetail','HPG','NAM','STANDARD_CORPORATE');
it('same retained vintage is compatible without inventing revision chronology',()=>expect(audit(payload(10),payload(10))).toMatchObject({state:'COMPATIBLE',revisions:[],newCells:0}));
it('same-period value changes require independent revision evidence',()=>expect(audit(payload(10),payload(12))).toMatchObject({state:'COMPATIBLE',revisions:[{beforeValue:'10',afterValue:'12',state:'UNEXPLAINED_CHANGE'}]}));
it('new period is an addition rather than an unexplained restatement',()=>expect(audit(payload(10),payload(12,2026))).toMatchObject({state:'COMPATIBLE',revisions:[],newCells:1}));
it('label drift requires review even with unchanged accounting numbers',()=>expect(audit(payload(10),payload(10,2025,'Khái niệm khác')).state).toBe('REVIEW_REQUIRED'));
it('provider unit behavior drift requires review',()=>expect(audit(payload(10),payload(10,2025,'Doanh thu thuần','million VND')).state).toBe('REVIEW_REQUIRED'));
