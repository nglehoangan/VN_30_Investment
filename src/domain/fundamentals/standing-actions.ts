import {normalizeLexical,DECLARED_UNITS} from './normalization';
import {dateOnly,instant} from '@/shared/time';
import {decimal} from '@/domain/portfolio/values';
export interface ReviewedStandingAction {
 id:string;ticker:string;kind:'CASH_DIVIDEND'|'OUTSTANDING_SHARES';eventId:string;economicDate:string;
 sourceRole:'ISSUER_DISCLOSURE'|'ISSUER_FINANCIAL_STATEMENT';documentType:'DIVIDEND_NOTICE'|'CAPITAL_DISCLOSURE'|'FINANCIAL_STATEMENT';
 nativeValue:string;nativeUnit:string;format:'CANONICAL'|'VI'|'EN';sourceHash:string;
 sourcePointer:string;originalReceivedAt:string;reviewedAt:string;reviewReference:string;
 admissionStatus:'SEPARATELY_REVIEWED'|'PENDING_EXPLICIT_OWNER_APPROVAL';
 /** Reuse the existing reviewed carry-forward output. This adapter does not repeat the document search. */
 carryForward:null|{status:'CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS'|'CONFIRMED_CHANGE'|'CONFLICTING_EVIDENCE';reviewReference:string;endingShares:string;coverageLimitation:string|null};
}
export function normalizeStandingAction(a:ReviewedStandingAction,ticker:string,economicAsOf:string,knownAt:string){
 const must=(c:unknown,r:string)=>{if(!c)throw Error(r);};dateOnly(a.economicDate);dateOnly(economicAsOf);[a.originalReceivedAt,a.reviewedAt,knownAt].forEach(instant);
 must(a.ticker===ticker&&/^[A-Z0-9]{2,8}$/.test(ticker),'CROSS_TICKER_ACTION');
 must(a.admissionStatus==='SEPARATELY_REVIEWED','ACTION_PROPOSAL_NOT_APPROVED');
 must(a.economicDate<=economicAsOf&&a.originalReceivedAt<=knownAt&&a.reviewedAt<=knownAt,'FUTURE_ACTION_KNOWLEDGE');
 must(a.id&&a.eventId&&a.reviewReference&&a.sourcePointer&&/^[a-f0-9]{64}$/.test(a.sourceHash),'ACTION_IDENTITY_REQUIRED');
 must(['ISSUER_DISCLOSURE','ISSUER_FINANCIAL_STATEMENT'].includes(a.sourceRole),'ACTION_SOURCE_ROLE');
 const share=a.kind==='OUTSTANDING_SHARES';must(share||a.kind==='CASH_DIVIDEND','ACTION_KIND');
 must(share?['CAPITAL_DISCLOSURE','FINANCIAL_STATEMENT'].includes(a.documentType):a.documentType==='DIVIDEND_NOTICE','ACTION_DOCUMENT_TYPE');
 must(DECLARED_UNITS[a.nativeUnit]?.[0]===(share?'SHARES':'CURRENCY_PER_SHARE'),'ACTION_UNIT_DIMENSION');
 const n=normalizeLexical(a.nativeValue,{format:a.format,unit:a.nativeUnit,sign:'IDENTITY',missingTokens:[]});
 must(n.state==='AVAILABLE'&&n.value!==null&&!decimal(n.value).negative&&(!share||decimal(n.value).integer&&decimal(n.value).positive),'INVALID_ACTION_VALUE');
 if(a.carryForward)must(share&&a.carryForward.status==='CARRIED_FORWARD_NO_CHANGE_FOUND_IN_REVIEWED_DOCUMENTS'&&a.carryForward.reviewReference&&a.carryForward.endingShares===n.value,'UNQUALIFIED_SHARE_CARRY_FORWARD');
 return {id:a.id,ticker,kind:a.kind,eventId:a.eventId,economicDate:a.economicDate,value:n.value!,unit:share?'SHARES' as const:'VND_PER_SHARE' as const,coverageLimitation:a.carryForward?.coverageLimitation??null};
}
