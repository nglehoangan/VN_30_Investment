import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {adapterEvidence} from '../../../../../tests/fixtures/nav-adapter-evidence.ts';
import {isolatedNavAdapters} from '../../../../../tests/fixtures/nav-adapter-composition.ts';
import {ImmutableBrokerEvidenceReader} from '../../../../../src/infrastructure/current-nav/broker-evidence-reader.ts';
import {NP,NI,NC,NT,nh} from '../../../../../tests/fixtures/current-nav.ts';
const e=await adapterEvidence();
try {
 const source={async read(){return {watermark:'1',inceptionAt:NI,transactions:e.fixture.history};}};
 const app=isolatedNavAdapters(source,new ImmutableBrokerEvidenceReader(e.directory),{portfolioId:NP,accountId:e.observation.accountId,perimeterId:e.observation.perimeterId,valuationAt:NT,evidence:[e.pin]},{now:()=>NC},nh);
 const actual=await app.read(e.fixture.request),second=await app.read(e.fixture.request);
 assert.equal(actual.nav.navState,'NAV_BLOCKED');assert.equal(actual.nav.totalNav,null);assert.equal(actual.nav.indicativeValue,null);assert.equal(actual.preparation.status,'BLOCKED');assert.equal(actual.preparation.completePlanAvailable,false);assert.equal(nh(actual),nh(second));
 assert(actual.preparation.reasons.includes('SOURCE_AUTHORITY_MISSING'));assert(actual.preparation.reasons.includes('INDEPENDENT_ACCEPTANCE_MISSING'));
 writeFileSync(new URL('./synthetic-expected-actual.json',import.meta.url),JSON.stringify({classification:'SYNTHETIC_ISOLATED_ADAPTER_NOT_REAL_ACCEPTANCE',expected:{navState:'NAV_BLOCKED',totalNav:null,indicativeValue:null,completePlanAvailable:false,sourceAccepted:false,deterministicReplay:true},actual,repeatHash:nh(second)},null,2));
 console.log('PASS synthetic adapter output/hash and explicit missing authority/acceptance, no complete plan');
} finally {await e.close();}
