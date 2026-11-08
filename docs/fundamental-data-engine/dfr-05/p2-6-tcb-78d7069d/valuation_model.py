"""Unactivated research model specification: approved RI/justified-PB principles.
No TCB economic defaults. Production is never an output authority.
"""
from decimal import Decimal,localcontext
from copy import deepcopy
import normalize as n
D=n.d2.number

def justified_pb(roe,ke,g):
 r,k,h=map(D,[roe,ke,g])
 if k<=0 or k<=h or r<=h:raise ValueError('POSITIVE_TERMINAL_DISTRIBUTION_AND_KE_ABOVE_G_REQUIRED')
 with localcontext() as c:c.prec=70;return (r-h)/(k-h)

def residual_income(book,roe,ke,g,horizon):
 b,r,k,h=map(D,[book,roe,ke,g])
 if b<=0 or not isinstance(horizon,int) or isinstance(horizon,bool) or horizon<1:raise ValueError('MODEL_DIMENSIONS')
 if k<=0 or k<=h or r<=h:raise ValueError('TERMINAL_COMPATIBILITY')
 with localcontext() as c:
  c.prec=70;start=b;pv=Decimal(0);discount=Decimal(1)
  for year in range(1,horizon+1):
   ri=(r-k)*b;discount*=1+k;pv+=ri/discount;b*=1+h
  terminal_ri=(r-k)*b;terminal=terminal_ri/(k-h)
  return start+pv+terminal/discount

REQUIRED=['valuationCutoff','researchBasis','sourcePolicyApproved','commonBookQualified','commonBook','normalizedRoe','costOfEquity','terminalGrowth','payout','commonShares','shareActionCompatibilityQualified','capitalFeasibilityCertified','independentCrosscheckQualified','caseAssumptionsApproved','approvalReferences','newShares','netNewCommonCash']
def evaluate_case(case):
 missing=[k for k in REQUIRED if case.get(k) is None or case.get(k) is False or case.get(k)==[]]
 if missing:return dict(status='BLOCKED_INPUTS_OR_APPROVAL',missing=missing,intrinsicRange=None,marginOfSafety=None,expectedReturn=None,classification='RESEARCH_PROVISIONAL',productionAdmissible=False)
 if case.get('costOfEquityBasis')=='POLICY_FORWARD_RETURN_HURDLE':raise ValueError('RETURN_HURDLE_IS_NOT_DISCOUNT_RATE')
 if case.get('issuer') not in ('TCB','SYNTHETIC_TEST'):raise ValueError('TCB_ONLY')
 if case.get('price') is not None:
  if case.get('priceCutoff')!=case['valuationCutoff'] or case.get('adjustmentStatus') in (None,'UNKNOWN','PROVIDER_UNDECLARED'):raise ValueError('PRICE_SHARE_CUTOFF_ADJUSTMENT_INCOMPATIBLE')
 r,k,g,p,b,shares=map(D,[case['normalizedRoe'],case['costOfEquity'],case['terminalGrowth'],case['payout'],case['commonBook'],case['commonShares']])
 if not (0<=p<=1) or b<=0 or shares<=0:raise ValueError('MODEL_DIMENSIONS')
 if abs(g-r*(1-p))>Decimal('0.000000000001'):raise ValueError('GROWTH_PAYOUT_CLEAN_SURPLUS_INCONSISTENT')
 if D(case['newShares'])!=0 or D(case['netNewCommonCash'])!=0:raise ValueError('SEPARATE_POST_ISSUANCE_CASE_REQUIRED')
 # Single constant-state mathematical case, not an approved range: all three
 # approved scenario cases and the independent crosscheck must be assembled outside.
 with localcontext() as c:
  c.prec=70;value=justified_pb(case['normalizedRoe'],case['costOfEquity'],case['terminalGrowth'])*b
  return dict(status='CONDITIONAL_RESEARCH_CASE_ONLY',equityValue=n.d2.text(value),perShare=n.d2.text(value/shares),intrinsicRange=None,marginOfSafety=None,expectedReturn=None,classification='RESEARCH_PROVISIONAL',productionAdmissible=False,scoringAuthorized=False)

def specification():
 params=[
 ('A-CUTOFF','Valuation cutoff/basis','Choose explicitly retrospective FY2025 balance date versus later available evidence; no as-known certification from audit date.',[], 'OWNER_DECISION_REQUIRED'),
 ('A-BOOK','Common and tangible common capital','Parent book170044504million is mapped, but other-equity nature and intangible/NCI/common allocation must be reviewed.', ['PARENT_EQUITY','OTHER_EQUITY','INTANGIBLE_ASSETS'],'EVIDENCE_AND_APPROVAL_REQUIRED'),
 ('A-NORMALIZE','Sustainable common earnings/credit and fees','Use explicit EPS common numerator as reported starting fact; normalize credit cycle, fees, acquisition and non-P&L capital events with owner attribution.', ['COMMON_EPS_NUMERATOR','CUSTOMER_CREDIT_COST_REPORTED','PARENT_RETAINED_CAPITAL_TRANSACTION'],'ANALYST_REVIEW_REQUIRED'),
 ('A-ROE','Sustainable ROE','Historical group or parent-book proxy cannot be used automatically; coherent normalized numerator and common denominator required.', ['EPS_NUMERATOR_PARENT_BOOK_RETURN_PROXY'],'ANALYST_APPROVAL_REQUIRED'),
 ('A-KE','Cost of equity','Evidence-supported capital-risk/discount basis and explicit approval;15%/12% portfolio forward-return hurdles are not selected discount rates.', [],'OWNER_ANALYST_APPROVAL_REQUIRED'),
 ('A-GROWTH','Sustainable growth','Constrain by normalized return, retention and qualified regulatory capital needs; history is not forecast.', ['BANK_CORE_LOANS_GROWTH'],'ANALYST_APPROVAL_REQUIRED'),
 ('A-PAYOUT','Payout/retention','Use declared distributions as history only; enforce g=ROE×(1−payout) in constant-state model and capital feasibility.', ['PARENT_DIVIDEND_MOVEMENT'],'ANALYST_APPROVAL_REQUIRED'),
 ('A-TERMINAL','Terminal economics','Require ke>g and ROE>g, stable distributions and transparent finite-horizon transition; no arbitrary terminal multiple.', [],'ANALYST_APPROVAL_REQUIRED'),
 ('A-STRESS','Credit/property/funding/repricing stress','Property business exposure and behavioural maturity gaps are starting facts; no arbitrary outflow/loss/haircut chosen.', ['REAL_ESTATE_BUSINESS_SHARE','LIQ_GAP_LT1M','LIQ_GAP_1_5Y'],'RISK_APPROVAL_REQUIRED'),
 ('A-CAPITAL','Capital requirements and response','Regulatory TT41 scope and deductions stay separate from common book; confirm target buffers, credit RWA migration and funding/capital responses.', ['REGULATORY_CAPITAL','TOTAL_RWA','TIER1_RATIO'],'EVIDENCE_AND_RISK_APPROVAL_REQUIRED'),
 ('A-ACTIONS','Shares/actions/dilution','FY2025closing7,086,240,414 ordinary and weighted7,069,481,069 are explicit. Later2026issuer actions/price adjustment not inferred from personal pending shares. Constant-state kernel requires explicitly approved zero newShares and zero netNewCommonCash; any nonzero action requires a separate post-issuance case and is rejected here.', ['CLOSING_SHARES','WEIGHTED_BASIC_SHARES','ISSUED_SHARES'],'CUTOFF_COMPATIBILITY_REQUIRED'),
 ('A-XCHECK','Economically independent crosscheck','Own-history normalized P/E only with qualified normalized common earnings and dated compatible prices/actions; no other issuer processed. DDM/Gordon and RI sharing ROE/ke/g are consistency checks, not independent evidence.', ['COMMON_EPS_NUMERATOR'],'INDEPENDENT_CROSSCHECK_MISSING'),
 ('A-SOURCE','Nonfinancial source scope','Industry, peer/franchise and governance-control evidence outside retained approved scope stops at SOURCE_AUTHORITY_REQUIRED; no acquisition executed.', [],'SOURCE_AUTHORITY_REQUIRED')]
 register=[dict(id=i,parameter=p,value=None,unit=None,kind='UNSELECTED_CASE_ASSUMPTION_OR_DEPENDENCY',rationale=r,evidenceSupport=e,ownerApprovalStatus='NOT_APPROVED',analystApprovalStatus='NOT_APPROVED_OR_NOT_QUALIFIED',status=s,sensitivity='See model formulas and linked parameter; no numeric case grid selected.',downsideImplication='Unqualified parameter can change sustainable return, capital needs, payout or terminal value; no economic default.') for i,p,r,e,s in params]
 sensitivity={
 'A-CUTOFF':('Rebind price, shares, book and availableAt to every proposed cutoff; no interpolation.','Later price/actions without later common capital can reverse apparent cheapness.'),
 'A-BOOK':('V scales with qualified B0 at fixed justified P/B; test each separately supported other-equity/intangible allocation.','Overstated common book overstates both capital available for distributions and value.'),
 'A-NORMALIZE':('Credit-cost earnings effect uses matched average core loans and qualified tax/common allocation; fee recurrence and acquisition effects separate.','Understated expected losses or temporary fees inflate sustainable owner earnings.'),
 'A-ROE':('d(P/B)/dROE=1/(ke-g); reconcile ROE with common capital, earnings and payout.','Lower sustainable return compresses justified book multiple, even when reported EPS grows.'),
 'A-KE':('d(P/B)/dke=-(ROE-g)/(ke-g)^2; retain ke>0 and ke>g.','Higher common risk premium reduces value; policy return hurdle is not a substitute.'),
 'A-GROWTH':('d(P/B)/dg=(ROE-ke)/(ke-g)^2 with payout/capital consistency.','Growth can destroy value if sustainable ROE falls below ke; no automatic growth premium.'),
 'A-PAYOUT':('Change g consistently through g=ROE*(1-payout); recalculate regulatory funding feasibility.','Distributions unsupported by common/regulatory capital imply issuance or reduced growth.'),
 'A-TERMINAL':('Vary only approved terminal economics/transition paths; test sensitivity near ke-g boundary.','A narrow unsubstantiated ke-g spread can dominate value and invalidate a stable terminal case.'),
 'A-STRESS':('Separate property default/severity, collateral, deposit outflow and repricing shocks; quantify only with approved calibrated bounds.','Correlated credit and funding shocks can exhaust reported buffers; positive gross maturity gap offers no assurance.'),
 'A-CAPITAL':('Reconcile target capital, RWA mix, retained common earnings and distributions for each approved scenario.','Regulatory constraints can force dilution or reduce growth/payout despite accounting profits.'),
 'A-ACTIONS':('Kernel requires explicit zero new shares/net cash; any nonzero action is rejected for separately qualified post-issuance B and shares.','Ignoring issuance price, cash proceeds or rights changes can materially overstate per-share value.'),
 'A-XCHECK':('Compare independently calibrated own-history earnings/price economics; do not count algebraic RI/DDM equivalence as confirmation.','Correlated weak methods cannot narrow the uncertainty range.'),
 'A-SOURCE':('Track which specific topic/assumption fails if authority, revision or document content is unqualified.','Unapproved industry/governance content cannot supply favorable topic evidence.')}
 for a in register:a['sensitivity'],a['downsideImplication']=sensitivity[a['id']]
 scenarios=[]
 for label,reason in [('BEAR','Higher expected credit losses/property stress, adverse NIM/funding and capital constraints; approved bounds required.'),('BASE','Evidence-bounded through-cycle common economics, not current reported earnings carried forward.'),('BULL','Improved sustainable common economics and funded growth; no automatic multiple expansion or lower discount rate.')]:
  scenarios.append(dict(name=label,status='ASSUMPTIONS_NOT_APPROVED',rationale=reason,normalizedRoe=None,costOfEquity=None,growth=None,payout=None,creditCost=None,tax=None,capitalTargets=None,dilution=None,terminal=None,intrinsicValue=None,evidenceIds=['A-NORMALIZE','A-ROE','A-KE','A-GROWTH','A-PAYOUT','A-STRESS','A-CAPITAL','A-ACTIONS','A-TERMINAL'],ownerApproval=None,analystApproval=None))
 case=dict(issuer='TCB',**{k:None for k in REQUIRED},price=None,priceCutoff=None,adjustmentStatus=None,costOfEquityBasis=None)
 return dict(status='EXECUTABLE_SPECIFICATION_READY_CASE_INPUTS_BLOCKED',primary='M3 bank sustainable ROE/cost-of-equity residual income and justified P/B',assumptions=register,scenarios=scenarios,case=case,evaluation=evaluate_case(case),formulas=dict(justifiedPB='(ROE−g)/(ke−g) under g=ROE×(1−payout), common capital and no new issuance',finiteRI='B0 + Σ[(ROEt−ke)×B(t−1)/(1+ke)^t] + terminal residual income discounted consistently',bookEvolution='Bt=B(t−1)+common earnings−distributions; separately qualified capital actions required',creditCostSensitivity='Δnet common earnings=−ΔcreditCost×qualified average bank loans×(1−qualified tax), then reflect common attribution and capital; tax not assumed',dPBdROE='1/(ke−g)',dPBdKe='−(ROE−g)/(ke−g)^2',dPBdGrowth='(ROE−ke)/(ke−g)^2; growth and payout not independently varied without clean-surplus reconciliation',dilution='For a separately qualified immediate issuance: B0_post=B0+net common cash raised; shares_post=shares+new shares. Recompute sustainable common return, capital and value, including issue terms/rights; no constant-EPS assumption.',marginOfSafety='Requires qualified conservative per-share value and compatible price/share/action cutoff; not executed',expectedReturn='Requires approved initial price, action-adjusted distributions and terminal scenario; not executed'),crosscheckStatus='MISSING: independent own-history price/normalized earnings calibration; no peer issuer processing',syntheticMathTestsOnly=True,productionAdmissible=False)
