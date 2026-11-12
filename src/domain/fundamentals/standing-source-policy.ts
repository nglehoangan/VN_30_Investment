import {FINANCIAL_SOURCE_POLICY} from './source-authority';
/** New current-use governance layer; historical policies and selected facts are not rewritten. */
export const UNIFIED_SOURCE_POLICY={
 version:'unified-standing-current-v1',
 financial:{version:'standing-financial-current-v1',purpose:'CURRENT_FORMAL_VALUATION',
  roles:FINANCIAL_SOURCE_POLICY.accountingVerificationAuthority,
  documentTypes:['FINANCIAL_STATEMENT','DIVIDEND_NOTICE','CAPITAL_DISCLOSURE'],
  structuredRole:'CAFEF_STRUCTURED',structuredRequiresExistingContractCertification:true,
  extractionVersion:'retained-qualified-extraction-v1',normalizerVersion:'financial-normalize-lexical-v1',
  currentAvailability:'MAX_ORIGINAL_RECEIPT_REVIEW_INGESTION',
  historicalAvailability:'EXISTING_CANONICAL_PUBLICATION_CONTRACT_REQUIRED',
  excludesPendingVnm17FactProposal:true},
 market:{policyVersion:'cafef-vn30-standing-raw-close-v1',field:'GiaDongCua',purpose:'VALUATION'},
 requalification:['SOURCE_IDENTITY','SCHEMA','ADAPTER','NORMALIZER','MAPPING','POLICY','CODE'],
 productionActivation:false,
} as const;
