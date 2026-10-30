import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {requireSupportedNode} from './tcbs.mjs';

test('TCBS runtime enforces the project Node range before SQLite or authentication',()=>{
 for(const version of ['20.19.0','22.12.0','22.23.1','23.0.0','24.0.0'])assert.throws(()=>requireSupportedNode(version),/UNSUPPORTED_NODE_VERSION/);
 for(const version of ['22.23.2','22.24.0'])assert.doesNotThrow(()=>requireSupportedNode(version));
});

test('help works without opening SQLite or requiring local credentials',()=>{
 const run=spawnSync(process.execPath,['api/tcbs.mjs','--help'],{encoding:'utf8'});
 assert.equal(run.status,0);assert.match(run.stdout,/--market-only/);assert.doesNotMatch(run.stderr,/ERR_UNKNOWN_BUILTIN_MODULE/);
});
