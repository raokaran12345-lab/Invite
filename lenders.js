/* ============================================================
   DebtIQ — Australian Lender Credit-Policy Database
   ------------------------------------------------------------
   Loaded as a classic <script> before the main app script.
   Exposes a global `LENDERS` (+ window.LENDERS) and pure helper
   lookups. A module.exports guard lets Node tests require it.

   `base_rate` is an INDICATIVE contract rate only (the policy
   spec carries no per-lender pricing) — a production deployment
   would feed live rates from a pricing engine. Majors sit lowest,
   non-banks higher to reflect their documented risk premium.
   ============================================================ */
const LENDERS = {

  /* ---------- Major banks (APRA, 3% buffer) ---------- */
  CBA: {
    label:'Commonwealth Bank', type:'major_bank', apra_regulated:true, base_rate:6.04,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80,
    max_lvr_investment_pi:90, max_lvr_investment_io:80, max_lvr_investment_no_lmi:80,
    max_loan_amount:5000000, min_loan_amount:10000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, freelance:0.90,
      overtime:0.80, bonus:0.80, commission:0.80, rental_res:0.80, rental_com:0.75,
      dividends:0.75, trust_dist:0.80, pension:1.00, family_ben:1.00, foreign:0.60,
      boarder:0.60, interest:1.00, hecs:'exclude_if_12mo' },
    self_employed_min_years:2,
    self_employed_docs:['2yr personal tax returns','2yr business tax returns','2yr NOAs','accountant letter'],
    lmi_waiver_professions:['doctor','dentist','lawyer','accountant','vet'], lmi_waiver_max_lvr:90,
    submission_channel:'CommBroker portal', sla_conditional:3,
    notes:['Genuine savings required >85% LVR','HECS ignored if repayable within 12 months',
      'Offset account available on variable loans','CommBroker portal — mandatory online lodgement'],
    checklist_standard:['Last 2 payslips (computerised, shows YTD)','Most recent PAYG summary or tax return',
      '3 months bank statements (all accounts)','Primary photo ID (licence or passport)',
      'Council rates notice (if refinance)','Existing loan statements (6 months)','CBA privacy consent form'],
    checklist_self_employed:['2 years personal tax returns','2 years business tax returns',
      '2 years Notices of Assessment','Accountant letter confirming business viability','BAS statements (last 4 quarters)'],
    checklist_investment:['Current lease agreement or rental statement','Property manager statement (if applicable)'],
    lender_color:'#FFD700'
  },

  ANZ: {
    label:'ANZ', type:'major_bank', apra_regulated:true, base_rate:6.09,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment_pi:90, max_lvr_investment_io:80,
    max_loan_amount:5000000, min_loan_amount:10000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      commission:0.80, rental_res:0.80, rental_com:0.75, dividends:0.75, trust_dist:0.80,
      pension:1.00, family_ben:1.00, foreign:0.60, boarder:0.60, interest:1.00 },
    self_employed_min_years:2,
    self_employed_docs:['2yr personal tax returns','2yr business tax returns','2yr NOAs'],
    lmi_waiver_professions:['doctor','dentist','lawyer','accountant'], lmi_waiver_max_lvr:90,
    submission_channel:'ANZ Broker portal', sla_conditional:3,
    notes:['ANZ serviceability declaration required','6 months statements required if self-employed',
      'ANZ privacy consent form mandatory','Suncorp Bank acquired by ANZ July 2024 — now same entity'],
    checklist_standard:['Last 2 payslips','Latest tax return or PAYG summary','3 months bank statements',
      'Primary photo ID','ANZ privacy consent form','ANZ serviceability declaration'],
    checklist_self_employed:['2 years personal + business tax returns','2 years NOAs',
      '6 months business bank statements','Accountant letter'],
    lender_color:'#007DC6'
  },

  NAB: {
    label:'NAB', type:'major_bank', apra_regulated:true, base_rate:6.14,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment_pi:90, max_lvr_investment_io:80,
    max_loan_amount:5000000, min_loan_amount:20000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      commission:0.80, rental_res:0.80, rental_com:0.75, dividends:0.75, trust_dist:0.80,
      pension:1.00, family_ben:1.00, foreign:0.60, boarder:0.60, interest:1.00, hecs:'exclude_under_20k' },
    self_employed_min_years:2,
    lmi_waiver_professions:['doctor','dentist','lawyer','accountant','vet'], lmi_waiver_max_lvr:90,
    submission_channel:'NAB Broker Connect portal', sla_conditional:2,
    notes:['NAB digital consent form required','Statutory declaration required if name mismatch',
      'Online application must be lodged first via Broker Connect','HECS debts under $20,000 disregarded',
      'Minimum floor size 50sqm (incl. balcony and car park)'],
    checklist_standard:['Last 2 payslips (computerised)','Latest NOA or tax return','3 months bank statements',
      'Primary photo ID','NAB digital consent form'],
    checklist_self_employed:['2 years personal tax returns + NOAs','2 years business financial statements',
      'Accountant letter confirming trading status','BAS statements (2 most recent)'],
    lender_color:'#E60000'
  },

  Westpac: {
    label:'Westpac', type:'major_bank', apra_regulated:true, base_rate:6.19,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment_pi:95, max_lvr_investment_io:80,
    max_loan_amount:5000000, min_loan_amount:25000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:1.00, overtime_standard:0.80,
      bonus:0.80, commission:0.80, rental_res:0.80, rental_com:0.75, dividends:0.75, trust_dist:0.80,
      pension:1.00, family_ben:1.00, foreign:0.60, boarder:0.60, interest:1.00 },
    self_employed_min_years:2,
    lmi_waiver_professions:['doctor','dentist','nurse','midwife','paramedic','firefighter','police','lawyer','accountant'],
    lmi_waiver_max_lvr_standard:90, lmi_waiver_max_lvr_medical:95, lmi_waiver_min_income:90000,
    submission_channel:'Westpac Broker portal', sla_conditional:3,
    notes:['Westpac income declaration required','Payslips must show YTD figures',
      'Westpac Premier Advantage Package: $395 annual fee','Emergency services: 100% overtime assessed',
      '95% LVR now available for investors (2026 policy)','IO investment up to 90% LVR',
      'Negative gearing calculator available on BrokerHub'],
    checklist_standard:['Last 2 computerised payslips (with YTD)','Most recent NOA','3 months bank statements',
      'Primary photo ID','Westpac income declaration form'],
    lender_color:'#D5002B'
  },

  Macquarie: {
    label:'Macquarie Bank', type:'major_bank', apra_regulated:true, base_rate:5.99,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment_pi:90, max_lvr_investment_io:80,
    max_lvr_equity_release:80, max_loan_amount:10000000, min_loan_amount:150000, max_loan_term:30, max_io_term:5,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      commission:0.80, rental_res:0.80, rental_com:0.75, dividends:0.75, trust_dist:0.80,
      pension:1.00, family_ben:1.00, foreign:0.60, boarder:0.60, interest:1.00 },
    self_employed_min_years:2,
    self_employed_docs:['2yr personal tax returns','2yr business tax returns','2yr NOAs','accountant letter optional'],
    submission_channel:'Macquarie Broker Portal (live chat available)',
    conditional_approval_validity:90, formal_approval_validity:90, sla_conditional:2,
    notes:['Minimum loan $150,000','Max aggregate exposure per borrower: $10M','Conditional approval valid 90 days',
      'Formal approval can be extended to 180 days max','No second mortgages behind other lenders',
      'High density apartments capped at 80% LVR (P&I) or 70% (IO)',
      'CCR RHI reviewed — any 30+ day late payment in 24mo = decline',
      'Non-spousal co-borrowers: min 20% ownership each on security',
      'Macquarie privacy consent required','Broker login to Macquarie Portal mandatory'],
    checklist_standard:['Last 2 computerised payslips (YTD must cover 3+ months)','Most recent NOA',
      '3 months bank statements','Primary photo ID','Macquarie privacy consent form','Loan purpose declaration (for equity release)'],
    checklist_self_employed:['2 years personal tax returns + NOAs','2 years business financial statements',
      '2 years business tax returns','Accountant letter (if income complex)'],
    lender_color:'#002F6C'
  },

  /* ---------- Other ADIs (APRA, 3% buffer) ---------- */
  ING: {
    label:'ING', type:'bank', apra_regulated:true, base_rate:6.14,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment:90,
    max_loan_amount:3000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:80,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60, boarder:0.60 },
    submission_channel:'ING online application (must be lodged first)', sla_conditional:3,
    notes:['ING online application must be lodged BEFORE broker submission',
      'Clean 90-day bank statements required — no dishonours','No gifted deposits accepted',
      'Orange Advantage package: offset account with annual fee','Digital-only bank — no branches'],
    checklist_standard:['ING online application (borrower to complete)','Last 2 payslips','Latest NOA',
      '90-day bank statements (clean — no dishonours)','Primary photo ID'],
    lender_color:'#FF6600'
  },

  Bankwest: {
    label:'Bankwest', type:'bank', apra_regulated:true, base_rate:6.09,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment:90,
    max_loan_amount:5000000, min_loan_amount:20000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'Bankwest broker portal', sla_conditional:3,
    notes:['Subsidiary of CBA since 2008','Often has competitive 95% LVR rates vs peers',
      'WA-focused heritage but national lending now','Bankwest broker portal for submissions'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID','Bankwest broker portal submission'],
    lender_color:'#003D7C'
  },

  'St George': {
    label:'St George Bank', type:'bank', apra_regulated:true, base_rate:6.24,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment:90,
    max_loan_amount:5000000, min_loan_amount:20000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'St George Broker portal', sla_conditional:3,
    notes:['Subsidiary of Westpac — same underlying credit policy','NSW/VIC focus historically',
      'St George Broker portal for submissions','Similar LMI waiver policy to Westpac for professionals'],
    checklist_standard:['Last 2 payslips (with YTD)','Latest NOA','3 months bank statements','Primary photo ID','St George income declaration'],
    lender_color:'#CE2127'
  },

  AMP: {
    label:'AMP Bank', type:'bank', apra_regulated:true, base_rate:6.29,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:90, max_lvr_owner_occ_no_lmi:80, max_lvr_investment:80, max_land_size_hectares:40,
    max_loan_amount:3000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:80,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'AMP Bank broker portal', sla_conditional:3,
    notes:['Returned to SMSF lending Q1 2026 after multi-year withdrawal','Max land size 40 hectares with dwelling',
      'Vacant land max 2 hectares (5 acres)','AMP Bank broker portal required'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#1A1A1A'
  },

  BOQ: {
    label:'Bank of Queensland', type:'bank', apra_regulated:true, base_rate:6.34,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment:90, max_land_size_hectares:40,
    max_loan_amount:3000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'BOQ broker portal', sla_conditional:3,
    notes:['Also underwrites Virgin Money home loans','Queensland-focused but national lending',
      'BOQ Specialist for medical/professional lending','Max land size 40 hectares'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#8B1A4B'
  },

  Bendigo: {
    label:'Bendigo Bank', type:'bank', apra_regulated:true, base_rate:6.29,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_owner_occ_no_lmi:80, max_lvr_investment:90,
    max_loan_amount:3000000, min_loan_amount:20000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'Bendigo e-banking portal', sla_conditional:3,
    notes:['Community-owned bank model','Strong regional/rural presence','Adelaide Bank is subsidiary',
      'Bendigo e-banking portal for submissions'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#E31837'
  },

  HSBC: {
    label:'HSBC Australia', type:'bank', apra_regulated:true, base_rate:6.19,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:90, max_lvr_owner_occ_no_lmi:80, max_lvr_investment:80,
    max_loan_amount:5000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:80,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.80 },
    submission_channel:'HSBC broker portal', sla_conditional:3,
    notes:['Stronger foreign income acceptance than peers (0.80 vs 0.60)','Good for expats and foreign nationals',
      'HSBC Premier for high net worth clients','Part of CCR mandatory reporting'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements',
      'Passport (primary ID for non-residents)','Visa documentation if applicable'],
    lender_color:'#DB0011'
  },

  Suncorp: {
    label:'Suncorp Bank', type:'bank', apra_regulated:true, base_rate:6.24,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90,
    max_loan_amount:3000000, min_loan_amount:10000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'Suncorp broker portal', sla_conditional:3,
    notes:['Acquired by ANZ on 31 July 2024','Still operating as separate brand under ANZ ownership',
      'Queensland and northern Australia focus','Bundling home insurance can unlock rate discounts'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#FF9900'
  },

  'Great Southern': {
    label:'Great Southern Bank', type:'credit_union', apra_regulated:true, base_rate:6.34,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90,
    max_loan_amount:2500000, min_loan_amount:20000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'Great Southern Bank broker portal', sla_conditional:3,
    notes:['Formerly CUA — rebranded Great Southern Bank 2021','Customer-owned mutual bank model',
      'Part of CCR mandatory reporting (Large ADI)','Good for first home buyers'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#00A651'
  },

  'Newcastle Permanent': {
    label:'Newcastle Permanent', type:'mutual_bank', apra_regulated:true, base_rate:6.39,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90,
    max_loan_amount:2000000, min_loan_amount:20000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00 },
    submission_channel:'Newcastle Permanent broker portal', sla_conditional:3,
    notes:['Merged with Greater Bank 2023','NSW-focused mutual bank','Strong first home buyer products'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#004B8D'
  },

  Unloan: {
    label:'Unloan', type:'bank', apra_regulated:true, base_rate:5.99,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:80, max_lvr_investment:80,
    max_loan_amount:5000000, min_loan_amount:100000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:80,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, dividends:0.75, pension:1.00 },
    submission_channel:'Unloan app (direct)', sla_conditional:2,
    notes:['CBA-backed digital lender','Refinance product primarily — not for purchases >80% LVR',
      'Rate reduces by 0.01% every year you stay (loyalty discount)','No offset account',
      'Direct to consumer — limited broker channel'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#3B0764'
  },

  /* ---------- Non-banks (own buffer) ---------- */
  Pepper: {
    label:'Pepper Money', type:'non_bank', apra_regulated:false, base_rate:6.99,
    buffer:0.02, dsr_max:50,
    max_lvr_owner_occ_pi:95, max_lvr_investment_pi:90, max_lvr_investment_io:85,
    max_loan_amount:3000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:false, genuine_savings_threshold_lvr:90,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, trust_dist:0.80, pension:1.00,
      family_ben:1.00, foreign:0.70, boarder:0.60, interest:1.00 },
    self_employed_min_years:1, credit_impaired:true, credit_defaults_acceptable:true,
    submission_channel:'Pepper broker portal', sla_conditional:2,
    notes:['Non-bank — NOT subject to APRA 3% buffer (uses 2%)','Accepts credit-impaired borrowers (paid defaults OK)',
      'Good for near-prime and specialist lending','Self-employed: 1 year trading acceptable in some products',
      'Alt-doc and low-doc options available','Higher rates than major banks — reflects risk premium',
      'SMSF loans available up to 90% LVR residential'],
    checklist_standard:['Last 2 payslips','Latest NOA or BAS (self-employed)','3 months bank statements',
      'Primary photo ID','Credit history explanation letter (if adverse)'],
    checklist_self_employed:['1-2 years business tax returns','BAS statements (if available)',
      'Accountant letter or bank statements as alt-doc'],
    lender_color:'#E5001A'
  },

  Liberty: {
    label:'Liberty Financial', type:'non_bank', apra_regulated:false, base_rate:6.89,
    buffer:0.01, dsr_max:55,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90,
    max_loan_amount:5000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:false,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, trust_dist:0.80, pension:1.00,
      family_ben:1.00, foreign:0.70, boarder:0.60, interest:1.00 },
    self_employed_min_years:1, credit_impaired:true,
    submission_channel:'LibertyCentral broker portal', sla_conditional:2,
    notes:['Non-bank — uses only 1% serviceability buffer','Most flexible buffer in Australian market',
      'Excellent for complex income structures','Strong for self-employed and business owners',
      'SMSF loans available up to 90% LVR','Custom loan structures available',
      'LibertyCentral broker portal for submissions'],
    checklist_standard:['Last 2 payslips or alt-doc equivalent','Latest NOA (or BAS for self-employed)',
      '3 months bank statements','Primary photo ID'],
    lender_color:'#F7941D'
  },

  Resimac: {
    label:'Resimac', type:'non_bank', apra_regulated:false, base_rate:6.79,
    buffer:0.02, dsr_max:50,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90,
    max_loan_amount:3000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:false, genuine_savings_threshold_lvr:90,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.70, boarder:0.60 },
    self_employed_min_years:1, credit_impaired:true,
    submission_channel:'Resimac broker portal', sla_conditional:2,
    notes:['Non-bank — 2% buffer','Strong alt-doc and low-doc products','Accepts near-prime borrowers',
      'Resimac broker portal for submissions'],
    checklist_standard:['Last 2 payslips or alt-doc','NOA or BAS','3 months bank statements','Primary photo ID'],
    lender_color:'#0070C0'
  },

  'La Trobe': {
    label:'La Trobe Financial', type:'non_bank', apra_regulated:false, base_rate:7.19,
    buffer:0.02, dsr_max:50,
    max_lvr_owner_occ_pi:95, max_lvr_investment:85,
    max_loan_amount_80lvr:5000000, max_loan_amount_75lvr:10000000,
    max_loan_amount_70lvr:25000000, max_loan_amount_65lvr:50000000, max_loan_term:30,
    genuine_savings_required:false,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.70 },
    self_employed_min_years:1,
    submission_channel:'La Trobe Financial portal', sla_conditional:3,
    notes:['Specialist lender founded 1952','Invented Lite Doc in Australia (1999)','Blackstone/Brookfield owned',
      'Excellent for self-employed alt-doc','No application or ongoing fees on some products',
      'Average LVR portfolio: 64.1% (low risk book)','SMSF lending specialist','La Trobe Financial portal for submissions'],
    checklist_standard:['Last 2 payslips or alt-doc','BAS statements (self-employed alt-doc)','3 months bank statements','Primary photo ID'],
    lender_color:'#00B04F'
  },

  Firstmac: {
    label:'Firstmac', type:'non_bank', apra_regulated:false, base_rate:6.49,
    buffer:0.02, dsr_max:48,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90,
    max_loan_amount:3000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    self_employed_min_years:2,
    submission_channel:'Firstmac portal', sla_conditional:3,
    notes:['Non-bank — 2% buffer (more realistic per Firstmac CFO, 2024)','Parent of loans.com.au and InfoChoice Group',
      'SMSF lending available','Competitive rates for standard borrowers','Fast online application via Firstmac portal'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#0066CC'
  },

  Bluestone: {
    label:'Bluestone Mortgages', type:'non_bank', apra_regulated:false, base_rate:7.29,
    buffer:0.02, dsr_max:50,
    max_lvr_owner_occ_pi:95, max_lvr_investment:85,
    max_loan_amount:3000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:false,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.70 },
    self_employed_min_years:1, credit_impaired:true,
    submission_channel:'Bluestone broker portal', sla_conditional:3,
    notes:['Specialist near-prime and alt-doc lender','Accepts paid defaults and credit events',
      'Strong for self-employed with limited documentation','SMSF lending available'],
    checklist_standard:['Last 2 payslips or alt-doc','NOA or BAS statements','3 months bank statements',
      'Primary photo ID','Credit event explanation letter if applicable'],
    lender_color:'#004B8D'
  },

  'Mortgage House': {
    label:'Mortgage House', type:'non_bank', apra_regulated:false, base_rate:6.59,
    buffer:0.02, dsr_max:50,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90,
    max_loan_amount:5000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:false, genuine_savings_threshold_lvr:90,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00, foreign:0.60 },
    submission_channel:'Mortgage House broker portal', sla_conditional:3,
    notes:['Direct lender and broker channel','Competitive rates for standard applications','Flexible policy for investors'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#8B0000'
  },

  Athena: {
    label:'Athena Home Loans', type:'non_bank', apra_regulated:false, base_rate:6.09,
    buffer:0.03, dsr_max:45,
    max_lvr_owner_occ_pi:95, max_lvr_investment:80, max_land_size_hectares:6,
    max_loan_amount:3000000, min_loan_amount:100000, max_loan_term:30,
    genuine_savings_required:true, genuine_savings_months:3, genuine_savings_threshold_lvr:85,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, pension:1.00, family_ben:1.00 },
    submission_channel:'Athena (direct to consumer)', sla_conditional:2,
    notes:['Digital-first — no branches, fast approval','Automatically reduces rate as LVR drops (unique feature)',
      'Best for refinancers — no discharge fees','Max land size 6 hectares','No broker channel — direct to consumer only',
      'Standard borrowers only — no complex income or credit issues'],
    checklist_standard:['Last 2 payslips','Latest NOA','3 months bank statements','Primary photo ID'],
    lender_color:'#6B21A8'
  },

  WLTH: {
    label:'WLTH', type:'non_bank', apra_regulated:false, base_rate:6.69,
    buffer:0.02, dsr_max:50,
    max_lvr_owner_occ_pi:95, max_lvr_investment:90, max_lvr_smsf_residential:90, max_lvr_smsf_commercial:75,
    max_loan_amount:5000000, min_loan_amount:50000, max_loan_term:30,
    genuine_savings_required:false,
    income_shading:{ salary_ft:1.00, salary_pt:1.00, self_emp:1.00, overtime:0.80, bonus:0.80,
      rental_res:0.80, rental_com:0.75, dividends:0.75, trust_dist:0.80, pension:1.00, family_ben:1.00, foreign:0.70 },
    self_employed_min_years:1,
    submission_channel:'WLTH broker portal', sla_conditional:3,
    notes:['Newer non-bank specialist lender','90% LVR SMSF loans available (one of few)',
      'Strong for investors and SMSF','B-Corp certified lender','WLTH broker portal for submissions'],
    checklist_standard:['Last 2 payslips or alt-doc','NOA or BAS','3 months bank statements','Primary photo ID'],
    lender_color:'#059669'
  }
};

/* Pure lookups (no app state) */
function getLenderPolicy(id){ return (typeof window!=='undefined' && window.LENDERS ? window.LENDERS : LENDERS)[id] || null; }
function getAssessmentRate(contractRate, id){ const l=getLenderPolicy(id); return contractRate + (l ? l.buffer : 0.03)*100; }

if(typeof window!=='undefined'){ window.LENDERS = LENDERS; window.getLenderPolicy = getLenderPolicy; window.getAssessmentRate = getAssessmentRate; }
if(typeof module!=='undefined' && module.exports){ module.exports = { LENDERS, getLenderPolicy, getAssessmentRate }; }
