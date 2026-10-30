"""Checked annual source columns, comparative flows and issuer-reported NPL basis."""
from decimal import Decimal
import datetime
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/fundamental-data-engine/scoring-dataset-acceptance/2026-10-30/b6-close-inputs-r1'
HPG = {
 2022:{'CURRENT_ASSETS':(7,'80514710854456'),'INVENTORY':(7,'34491111096123'),'CURRENT_LIABILITIES':(9,'62385392809685'),'TOTAL_EQUITY':(10,'96112939615783'),'RECEIVABLES':(7,'9892869502309'),
       'NET_INCOME_ATTRIBUTABLE_PARENT':(12,'8483510554031'),'REVENUE':(11,'141409274460632'),'GROSS_PROFIT':(11,'16763426239552'),'NET_INCOME':(11,'8444429054516'),'CFO':(13,'12277636676507')},
 2023:{'CURRENT_ASSETS':(7,'82716439173043'),'INVENTORY':(7,'34504487406261'),'CURRENT_LIABILITIES':(9,'71513492904733'),'TOTAL_EQUITY':(10,'102836419239379'),
       'NET_INCOME_ATTRIBUTABLE_PARENT':(12,'6835064334356'),'REVENUE':(11,'118953027893654'),'GROSS_PROFIT':(11,'12937840695572'),'CFO':(13,'8643030777026')},
 2024:{'INVENTORY':(7,'46091222189472'),'TOTAL_EQUITY':(10,'114647457983699'),'REVENUE':(11,'138855112131387'),'NET_INCOME_ATTRIBUTABLE_PARENT':(12,'12021443836074'),'TOTAL_ASSETS':(8,'224489707553981')},
 2025:{'INVENTORY':(7,'52828227344442')},
}


def main():
    at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    gaps = json.loads((OUT/'source-reconciliation-candidates.json').read_text())['rows']
    facts=[]
    def append(ticker,item,end,page,raw,scale,doc,caption,flow=False,unit='CURRENCY'):
        prior=[r for r in gaps if r['ticker']==ticker and r['itemId']==item and r['periodEnd']==end]
        assert prior
        value=format(Decimal(raw)*Decimal(scale),'f')
        facts.append({'id':f'checked-history-{ticker}-{item}-{end}','ticker':ticker,'itemId':item,'value':value,'rawValue':raw,
          'rawUnit':'PERCENT' if unit=='RATIO' else 'CURRENCY_PER_SHARE' if unit=='CURRENCY_PER_SHARE' else 'MILLION_CURRENCY' if scale=='1000000' else 'CURRENCY',
          'multiplier':scale,'unit':unit,'currency':None if unit=='RATIO' else 'VND','period':{'start':end[:4]+'-01-01' if flow else end,'end':end},
          'reportingScope':'CONSOLIDATED','sourcePdfPath':doc['pdfPaths'][0],'sourceHash':doc['sourceHash'],'page':page,
          'captionAndColumn':caption,'method':'CHATGPT_FULL_SOURCE_IMAGE_REVIEW','reviewedAt':at,
          'priorObservationIds':[r['observationId'] for r in prior],
          'comparison':'MATCH' if all(Decimal(r['oldValue'])==Decimal(value) for r in prior) else 'CONFLICT','productionAdmissible':False})
    notes=json.loads((ROOT/'data/manual-extracted-pdf/notes/HPG.json').read_text())
    for year,items in HPG.items():
        doc=next(d for d in notes['documents'] if f'_{year}_Kiemtoan_Hopnhat' in d['pdfPaths'][0] or (year==2024 and 'source-recovery' in d['pdfPaths'][0] and '2024' in d['pdfPaths'][0] and len(d['pages'])>10))
        assert hashlib.sha256((ROOT/doc['pdfPaths'][0]).read_bytes()).hexdigest()==doc['sourceHash']
        for item,(page,value) in items.items():
            append('HPG',item,f'{year}-12-31',page,value,'1',doc,item+f'; checked current {year} column, consolidated, declared VND; inventory total net allowance',flow=item in ['REVENUE','GROSS_PROFIT','NET_INCOME','NET_INCOME_ATTRIBUTABLE_PARENT','CFO'])
    notes=json.loads((ROOT/'data/manual-extracted-pdf/notes/VPL.json').read_text())
    doc=next(d for d in notes['documents'] if '2023_Kiemtoan_Hopnhat' in d['pdfPaths'][0])
    for item,page,value in [('REVENUE',11,'7172730'),('OPERATING_PROFIT',11,'4413020'),('NET_INCOME_ATTRIBUTABLE_PARENT',12,'4230214'),('BASIC_EPS',12,'1595'),('CFO',13,'-7765100'),('CASH_CAPEX_REPORTED',13,'4856234')]:
        append('VPL',item,'2022-12-31',page,value,'1' if item=='BASIC_EPS' else '1000000',doc,
          item+'; explicit comparative FY2022 flow column in FY2023 audited consolidated PDF; stock opening balances not relabelled as FY2022 closing',flow=True,unit='CURRENCY_PER_SHARE' if item=='BASIC_EPS' else 'CURRENCY')
        if item=='CASH_CAPEX_REPORTED':facts[-1]['sourcePrintedSignedValue']='-'+value
    notes=json.loads((ROOT/'data/manual-extracted-pdf/notes/VIB.json').read_text())
    doc=next(d for d in notes['documents'] if '6T_2026_Soatxet_Hopnhat' in d['pdfPaths'][0])
    for end,percentage in [('2026-06-30','2.10'),('2025-12-31','2.16')]:
        append('VIB','BANK_REPORTED_NPL',end,63,percentage,'0.01',doc,
          '44.1 Tỷ lệ nợ xấu theo tình trạng nợ của khách hàng tại Ngân hàng; issuer-reported ratio over total classified credit-risk population, not customer-loans-only NPL',unit='RATIO')
        facts[-1]['populationBasis']='OWNER_ACCEPTED_REPORTED_TOTAL_CREDIT_RISK_ASSETS';facts[-1]['customerLoanOnlySubstitutionProhibited']=True
    (OUT/'checked-history-sources.json').write_text(json.dumps({'contract':'b6-checked-history-sources-v1','facts':facts,'amountEqualityUsedToChooseMapping':False},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'facts':len(facts),'conflicts':[f['id'] for f in facts if f['comparison']=='CONFLICT']}))


if __name__=='__main__':
    main()
