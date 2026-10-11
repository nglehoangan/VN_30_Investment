"""Apply only the response decoder shipped in HDBank's public report frontend."""
import base64,datetime,hashlib,json,pathlib,re,subprocess
B=pathlib.Path('data/initialization-08b-remediation-work/targeted-indexes')
client=B/'HDB-public-report-dependency-0.js';text=client.read_text()
module=text[text.index('74904:function'):text.index('43210:function',text.index('74904:function'))]
assert 'AES.decrypt(t,e' in module and 'mode.ECB' in module and 'pad.Pkcs7' in module
key=re.search(r'Utf8.parse\("([^\"]+)"\)',module)[1].encode()
source=B/'HDB-public-financial-category.body';receipt=json.loads(source.with_suffix('.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert receipt['httpStatus']=='200' and receipt['curlExit']==0 and sha(source)==receipt['bodySha256']
result=subprocess.run(['openssl','enc','-d','-aes-192-ecb','-K',key.hex()],input=base64.b64decode(source.read_bytes()),capture_output=True)
assert result.returncode==0
data=json.loads(result.stdout);out=B/'HDB-public-financial-category-decoded.json'
decoded=json.dumps(data,indent=2,ensure_ascii=False)+'\n'
if out.exists():assert out.read_text()==decoded
else:out.write_text(decoded)
proofFile=out.with_suffix('.receipt.json')
if proofFile.exists():
 proof=json.loads(proofFile.read_text());assert proof['sourceBodySha256']==sha(source) and proof['decoderSourceSha256']==sha(client) and proof['decodedBodySha256']==sha(out)
else:
 proof={'method':'EXACT_PUBLIC_FRONTEND_RESPONSE_DECODER','sourceBodyFile':str(source),'sourceBodySha256':sha(source),'decoderModule':74904,'decoderSourceFile':str(client),'decoderSourceSha256':sha(client),'algorithm':'AES192_ECB_PKCS7_UTF8_JSON_AS_EXPLICITLY_SHIPPED_IN_ISSUER_PUBLIC_FRONTEND','decodedBodySha256':sha(out),'decodedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'authenticationUsed':False,'accessControlBypassed':False}
 proofFile.write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps({'status':'SOURCE_DECODER_REPLAY_PASS','menuEntries':len(data['menuList']),'decodedBodySha256':sha(out)}))
