import { test } from 'node:test';
import assert from 'node:assert/strict';
import { marketFrame, digest } from './capture-market.mjs';
test('retains only market frame candidates, excludes auth and heartbeat',()=>{
 for(const text of ['d|a|||EXAMPLE','d|0|{"success":true}','d|p|||'])assert.equal(marketFrame(text),null);
 assert.deepEqual(marketFrame('s|38|{"symbol":"TCB","matchPrice":"10000"}'),{channel:'38',payload:{symbol:'TCB',matchPrice:'10000'}});
 assert.throws(()=>marketFrame('s|38|not-json'));
});
test('raw byte hash is deterministic and content-sensitive',()=>{
 assert.equal(digest(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 assert.notEqual(digest(Buffer.from('abc')),digest(Buffer.from('abd')));
});
