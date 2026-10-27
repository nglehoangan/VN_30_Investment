import { describe,it,expect } from "vitest";
import { classifyForwardRecord } from "@/domain/portfolio/forward-intake";
import { intakeHash } from "@/infrastructure/repositories/forward-intake-storage";
import { forwardRecord,syntheticGrant } from "../fixtures/portfolio/forward-intake";
import { deposit,buy,input,at,P,A,NOW } from "../fixtures/portfolio/history";
const sample=()=>forwardRecord(deposit("d","5",3));
const classify=(r=sample(),g=r.command?syntheticGrant(r):null)=>classifyForwardRecord(r,at(1),P,NOW,intakeHash,g);
describe("Phase2.2 deterministic classification (synthetic only)",()=>{
 it("verified explicit category is supported; hashes alone are not authority",()=>{
  const r=sample();expect(classify(r).status).toBe("SUPPORTED_EVENT");expect(classifyForwardRecord(r,at(1),P,NOW,intakeHash,null).status).toBe("BLOCKED_SOURCE");
 });
 it("source identity, provenance and raw content hash are mandatory",()=>{
  const r=sample();expect(classify({...r,source:{...r.source,documentId:""}}).status).toBe("BLOCKED_SOURCE");expect(classify({...r,source:{...r.source,provenance:[]}}).status).toBe("BLOCKED_SOURCE");expect(classify({...r,source:{...r.source,originalValues:{changed:true}}}).status).toBe("BLOCKED_SOURCE");
 });
 it("unknown category and ambiguous description never infer a financial event",()=>{
  expect(classify({...sample(),category:"Bank interest maybe"}).status).toBe("UNSUPPORTED");expect(classify({...sample(),command:null}).status).toBe("NEEDS_REVIEW");expect(classify({...sample(),category:"BUY"}).status).toBe("NEEDS_REVIEW");
 });
 it("opening equality, prior events and date-only evidence are blocked",()=>{
  expect(classify(forwardRecord(deposit("old","5",1))).status).toBe("BLOCKED_OPENING_BOUNDARY");
  const r=sample();expect(classify({...r,source:{...r.source,effective:{precision:"DATE",value:"2026-01-03"}}}).reason).toBe("EXACT_EFFECTIVE_INSTANT_REQUIRED");
  expect(classify({...r,source:{...r.source,effective:{precision:"INSTANT",value:at(4)}}}).status).toBe("BLOCKED_OPENING_BOUNDARY");
 });
 it("accepted account, portfolio and exact signed content scopes cannot be expanded",()=>{
  const r=sample(),g=syntheticGrant(r);for(const altered of [{...g,accountId:"wrong"},{...g,portfolioId:"wrong"},{...g,recordHash:"0".repeat(64)},{...g,commandHash:"0".repeat(64)},{...g,sourceAuthorityReference:""}])expect(classify(r,altered).status).toBe("BLOCKED_SOURCE");
 });
 it("producer cannot independently accept its own event",()=>{
  const r=sample(),g=syntheticGrant(r);expect(classify(r,{...g,independentValidatorReference:g.producerReference}).status).toBe("BLOCKED_SOURCE");
 });
 it("ticker-only/missing security reference and wrong accepted identity are blocked",()=>{
  const r=forwardRecord(buy("b","1","10",3)),g=syntheticGrant(r);expect(classify({...r,security:null}).status).toBe("BLOCKED_IDENTITY");expect(classify({...r,security:{ledgerSecurityId:A,evidenceReference:""}}).status).toBe("BLOCKED_IDENTITY");expect(classify(r,{...g,identityAcceptanceReference:null}).status).toBe("BLOCKED_IDENTITY");
 });
 it("future knowledge/retrieval is not backdated",()=>{
  const r=sample();expect(classify({...r,source:{...r.source,knownAt:at(5),retrievedAt:at(4)}}).reason).toBe("FUTURE_OR_INCONSISTENT_KNOWLEDGE");
 });
 it("unsupported corporate action fails closed even with source qualification",()=>{
  const r=forwardRecord(input("ca","CORPORATE_ACTION",3,{securityId:A,quantity:"1",corporateAction:{id:"ca",subtype:"UNKNOWN_CREDIT",numerator:"1",denominator:"1",evidence:"fixture",stage:"EFFECTIVE"}}));expect(classify(r).status).toBe("UNSUPPORTED");
 });
 it("unknown transport contract cannot fall through to legacy posting",()=>{const r=sample();expect(classify({...r,version:"unknown" as typeof r.version}).status).toBe("UNSUPPORTED");});
});
