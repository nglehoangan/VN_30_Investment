import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marketFrame, digest, captureBoard, marketRequests } from './tcbs.mjs';
test('retains only market frame candidates, excludes auth and heartbeat',()=>{
 for(const text of ['d|a|||EXAMPLE','d|0|{"success":true}','d|p|||'])assert.equal(marketFrame(text),null);
 assert.deepEqual(marketFrame('s|38|{"symbol":"TCB","matchPrice":"10000"}'),{channel:'38',payload:{symbol:'TCB',matchPrice:'10000'}});
 assert.throws(()=>marketFrame('s|38|not-json'));
});
test('raw byte hash is deterministic and content-sensitive',()=>{
 assert.equal(digest(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.notEqual(digest(Buffer.from('abc')),digest(Buffer.from('abd')));
});

function socketFactory(script){
 return class FakeSocket extends EventTarget{
  readyState=1;sent=[];
  constructor(){super();queueMicrotask(()=>{this.dispatchEvent(new Event('open'));script(this);});}
  send(text){this.sent.push(text);}
  receive(text){this.dispatchEvent(new MessageEvent('message',{data:text}));}
  close(){this.readyState=3;this.dispatchEvent(new Event('close'));}
 };
}
test('5.2 authenticates before subscribing; keeps exact raw decimals and cleans up at frame limit',async()=>{
 let socket;
 const raw='s|6|{"symbol":"FPT","matchPrice":1234567890123456789.123456789,"matchQtty":100}';
 const result=await captureBoard('test-only-token',['FPT'],{maxFrames:1,WebSocketImpl:socketFactory(ws=>{
  socket=ws;assert.equal(ws.sent.length,1);
  assert.equal(ws.sent[0],'d|a|||'+Buffer.from('test-only-token').toString('base64'));
  ws.receive('d|0|{ "success": true }');
  assert.deepEqual(ws.sent.slice(1),['d|s|tk|bp+bi+tm+mp+op+fe|FPT','d|p|||']);
  ws.receive(raw);
 })});
 assert.equal(result.state,'CAPTURED_NOT_QUALIFIED');assert.equal(result.completion,'FRAME_LIMIT_REACHED');
 assert.equal(result.frames[0].raw,raw);assert.equal(result.frames[0].sha256,digest(raw));
 assert.deepEqual(result.missingSymbols,[]);assert.equal(socket.readyState,3);
 assert.ok(!JSON.stringify(result).includes('test-only-token'));
});
test('auth rejection never subscribes and returns no auth/control frame',async()=>{
 let socket;
 await assert.rejects(captureBoard('test-only-token',['FPT'],{WebSocketImpl:socketFactory(ws=>{socket=ws;ws.receive('d|0|{"success":false}');})}),error=>{
  assert.equal(error.message,'WEBSOCKET_AUTH_REJECTED');assert.deepEqual(error.capture.frames,[]);return true;
 });
 assert.equal(socket.sent.length,1);assert.equal(socket.readyState,3);
});
test('quiet stream is explicitly missing, never a fabricated quote',async()=>{
 const result=await captureBoard('test-only-token',['FPT'],{durationMs:5,WebSocketImpl:socketFactory(ws=>ws.receive('d|0|{"success":true}'))});
 assert.equal(result.state,'NO_MARKET_FRAMES');assert.deepEqual(result.missingSymbols,['FPT']);
});
test('batch identity coverage and partial disconnect are preserved',async()=>{
 await assert.rejects(captureBoard('test-only-token',['FPT','VNM','HPG'],{WebSocketImpl:socketFactory(ws=>{
  ws.receive('d|0|{"success":true}');
  ws.receive('s|38|{"data":[{"symbol":"FPT"},{"symbol":"VNM"}]}');ws.close();
 })}),error=>{
  assert.equal(error.capture.frames.length,1);assert.deepEqual(error.capture.missingSymbols,['HPG']);return true;
 });
});
test('auth timeout and data before auth fail closed',async()=>{
 await assert.rejects(captureBoard('test-only-token',['FPT'],{authTimeoutMs:5,WebSocketImpl:socketFactory(()=>{})}),/AUTH_TIMEOUT/);
 await assert.rejects(captureBoard('test-only-token',['FPT'],{WebSocketImpl:socketFactory(ws=>ws.receive('s|6|{"symbol":"FPT"}'))}),/DATA_BEFORE_AUTH/);
});
test('one plan covers full30 EOD inventory plus all former market REST reads',()=>{
 const members=Array.from({length:30},(_,i)=>({ticker:'T'+i,securityId:'security-'+i}));
 const plan=marketRequests(members,'123',{extended:true});
 assert.equal(plan.core.length,61);assert.equal(plan.extra.length,183);
 assert.deepEqual([...new Set([...plan.core,...plan.extra].map(r=>r.apiId))].sort(),['5.1','5.11','5.12','5.13','5.3','5.4','5.5','5.6','5.7','5.8'].sort());
 for(const id of ['5.11','5.13'])assert.equal(plan.core.filter(r=>r.apiId===id).length,30);
 for(const id of ['5.5','5.6','5.7','5.8','5.12'])assert.equal(plan.extra.filter(r=>r.apiId===id).length,30);
});
test('default capture keeps EOD replay distinct from history and index observations',()=>{
 const plan=marketRequests([{ticker:'FPT',securityId:'fpt'}],'123');
 assert.equal(plan.core.find(r=>r.apiId==='5.13').parameters.countBack,'2');
 assert.equal(plan.extra.find(r=>r.variant==='history').parameters.countBack,'252');
 assert.equal(plan.extra.find(r=>r.variant==='benchmark').parameters.type,'index');
 assert.ok(!plan.extra.some(r=>['5.4','5.5','5.6','5.7','5.8','5.12'].includes(r.apiId)));
});
