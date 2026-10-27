import { NOW } from "./history";
import type { TransactionInput } from "@/domain/portfolio/transaction";
import type { ForwardRecord, IntakeGrant } from "@/domain/portfolio/forward-intake";
import type { ForwardIntakeAuthority } from "@/infrastructure/repositories/forward-intake";
import { intakeHash } from "@/infrastructure/repositories/forward-intake-storage";
export function forwardRecord(command:TransactionInput,options:{economicId?:string;revision?:string;corrects?:string;document?:string;component?:string}={}):ForwardRecord{
 const originalValues={economicId:options.economicId??command.id,revision:options.revision??"1",corrects:options.corrects??null,component:options.component??"EVENT",financialValues:command};
 return {version:"forward-event-intake-v1",category:command.type,command,security:command.securityId?{ledgerSecurityId:command.securityId,evidenceReference:"SYNTHETIC_IDENTITY_ONLY"}:null,source:{namespace:"SYNTHETIC_FORMAT",documentId:options.document??"document-a",documentHash:"b".repeat(64),eventId:command.id,reference:"/rows/1",accountId:"SYNTHETIC_ACCOUNT",portfolioId:command.portfolioId,contentHash:intakeHash(originalValues),originalValues,effective:{precision:"INSTANT",value:command.effectiveAt},knownAt:NOW,retrievedAt:NOW,provenance:[{reference:"SYNTHETIC_ONLY",sha256:"b".repeat(64),pointer:"/rows/1"}]}};
}
/** Synthetic accepted-record provider ONLY for isolated validation. No operational authority. */
export function syntheticGrant(record:ForwardRecord):IntakeGrant {
  const raw=record.source.originalValues as {economicId:string;revision:string;corrects:string|null;component:string};
  const f=record.command!;
  const grant:IntakeGrant={status:"QUALIFIED",recordHash:intakeHash(record),commandHash:intakeHash(f),portfolioId:f.portfolioId,accountId:record.source.accountId,securityId:f.securityId??null,category:f.type,sourceAuthorityReference:"SYNTHETIC_NOT_PRODUCTION",identityAcceptanceReference:f.securityId?"SYNTHETIC_NOT_PRODUCTION":null,producerReference:"SYNTHETIC_PRODUCER",independentValidatorReference:"SYNTHETIC_DISTINCT_VALIDATOR",identity:{namespace:"SYNTHETIC_BROKER",eventId:raw.economicId,component:raw.component,revision:raw.revision},correctsTransactionId:raw.corrects};return grant;
}
export const syntheticIntakeAuthority:ForwardIntakeAuthority={
 async qualify(_tx,record){ return syntheticGrant(record); },
 async legacyIdentity(_tx,event){return {namespace:"SYNTHETIC_BROKER",eventId:event.facts.id,component:"EVENT",revision:"1"};},
};
