#!/usr/bin/env python3
"""One-ticker direct Vietstock PDF acquisition using the shared transport/store."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT))
sys.path.insert(0,str(ROOT/'skills/vn30-rollout-orchestrator/scripts'))
from control import Universe,prepare
from scripts.lib.vietstock_source_policy import download_vietstock,require_vietstock_url
from tools.maintenance.documents import cached_by_url,persist_pdf,standard_name

def main():
    p=argparse.ArgumentParser(description=__doc__,allow_abbrev=False)
    p.add_argument('--ticker',action='append',required=True);p.add_argument('--url',required=True)
    p.add_argument('--universe-version',required=True);p.add_argument('--reference-date',required=True)
    p.add_argument('--document-type',required=True);p.add_argument('--period',required=True);p.add_argument('--scope',required=True)
    p.add_argument('--refresh',action='store_true',help='Check remote content even if a hash-valid retained URL exists')
    a=p.parse_args()
    if len(a.ticker)!=1:p.error('EXACTLY_ONE_TICKER_REQUIRED')
    request=prepare({'ticker':a.ticker[0],'skill':'fetch-vietstock-dividend-pdfs','referenceDate':a.reference_date,'purpose':'RETROSPECTIVE_RESEARCH'},Universe(a.universe_version))
    ticker=request['request']['ticker'];standard_name(ticker,a.document_type,a.period,a.scope,'0'*64);url=require_vietstock_url(a.url);store=ROOT/'data/manual-download'
    if not a.refresh:
        cached=cached_by_url(store,ticker,url)
        if cached:print(json.dumps({**cached,'executionId':request['executionId'],'formalAdmissionGranted':False},ensure_ascii=False));return
    with tempfile.TemporaryDirectory() as folder:
        path=Path(folder)/'download.pdf';response=download_vietstock(url,path)
        if response.returncode or response.stdout!='200':raise ValueError('DOWNLOAD_FAILED_NO_CATALOG_UPDATE')
        body=path.read_bytes()
        receipt={'requestedUrl':url,'finalUrl':response.args[-1],'httpStatus':200,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(body).hexdigest()}
        record=persist_pdf(store,ticker,body,document_type=a.document_type,period=a.period,scope=a.scope,receipt=receipt)
        print(json.dumps({**record,'fetchPerformed':True,'executionId':request['executionId'],'formalAdmissionGranted':False},ensure_ascii=False))

if __name__=='__main__':main()
