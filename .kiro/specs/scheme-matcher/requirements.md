# Requirements: Scheme Matcher

## Overview
The Scheme Matching Agent is the core AI feature of BillSG. It takes the user profile from onboarding and the parsed bill from bill-parser, queries the MCP server for live scheme data, and returns a categorised list of schemes with explanations and action plans. This is Phase 4 of the BillSG flow, triggered by the "Match Schemes" button (only available after Phase 3 completes).

## Requirements

### Requirement 1: Query MCP Server for Live Data
**User Story:** As the system, I want to query the MCP server for current scheme rules so results reflect the latest policy changes.

#### Acceptance Criteria
1. GIVEN the agent starts WHEN it queries the MCP server THEN it retrieves: all schemes, CHAS tiers, IP rider rules, MediSave limits
2. GIVEN MCP server is unavailable WHEN agent queries THEN it falls back to last cached data and flags in output
3. GIVEN cached data is used THEN warning shown: "Scheme data may not reflect the latest updates. Last verified: {cached_date}"

### Requirement 2: Data Source Determination
**User Story:** As the system, I want to use bill data when available for more accurate matching.

#### Acceptance Criteria
1. GIVEN ParsedBill exists AND confidence_score >= 0.5 THEN data_source = 'profile_and_bill'
2. GIVEN no ParsedBill OR confidence_score < 0.5 THEN data_source = 'profile_only'
3. GIVEN profile_only THEN banner shown: "Upload your bill for more accurate scheme matching"

### Requirement 3: Run Eligibility Matrix
**User Story:** As the system, I want deterministic eligibility checking as the foundation of scheme matching.

#### Acceptance Criteria
1. GIVEN a UserProfile WHEN eligibility matrix runs THEN every scheme is checked deterministically
2. GIVEN eligibility results WHEN produced THEN they are never overridden by AI — matrix is ground truth
3. GIVEN scheme_matcher WHEN running THEN it uses live thresholds from MCP server (not hardcoded values)

### Requirement 4: Bill Cross-Reference (Path B)
**User Story:** As a patient who uploaded a bill, I want the system to detect missing subsidies on my actual bill.

#### Acceptance Criteria
1. GIVEN data_source = 'profile_and_bill' WHEN subsidy % on bill mismatches expected by > 5% THEN flag as potential error
2. GIVEN is_pioneer = true AND pioneer_merdeka_discount = 0 on bill THEN Pioneer → unclaimed
3. GIVEN is_merdeka = true AND pioneer_merdeka_discount = 0 on bill THEN Merdeka → unclaimed
4. GIVEN ward_class detected THEN verify MediShield deductible (C=$1500, B2=$2000, B1=$2500, A=$3500)
5. GIVEN medication line items AND citizenship IN (SC, PR) THEN flag MAF as unclaimed
6. GIVEN final_payable > 1000 AND SC THEN flag MediFund with high priority
7. GIVEN final_payable > 500 AND monthly_pchi <= 1000 THEN flag ComCare with high priority
8. GIVEN monthly_pchi slightly above $800 (up to ~$1,000) THEN still flag ComCare as unclaimed — ComCare eligibility is assessed case-by-case; patients near the threshold should still apply

### Requirement 5: Scheme Categorisation
**User Story:** As a patient, I want every scheme clearly categorised so I know what was applied and what I'm missing.

#### Acceptance Criteria
1. GIVEN scheme results WHEN categorised THEN every scheme has exactly one status: auto_applied, unclaimed, or not_applicable
2. GIVEN auto_applied THEN scheme was correctly applied on bill
3. GIVEN unclaimed THEN user qualifies but scheme not applied
4. GIVEN not_applicable THEN user does not meet eligibility criteria

### Requirement 6: Plain English Reasons via LLM
**User Story:** As a patient, I want a clear reason for why I qualify or don't qualify for each scheme.

#### Acceptance Criteria
1. GIVEN each scheme card WHEN reason is generated THEN LLM never guarantees eligibility (uses "you may qualify")
2. GIVEN each scheme card WHEN reason is generated THEN source URL and verified date are always cited
3. GIVEN MediFund/ComCare WHEN savings estimated THEN no specific dollar guarantee (holistic assessment)

### Requirement 7: Action Plans for Unclaimed Schemes
**User Story:** As a patient, I want a step-by-step action plan for every scheme I may be eligible for.

#### Acceptance Criteria
1. GIVEN an unclaimed scheme WHEN action plan is generated THEN it uses templates from action-plan spec
2. GIVEN an auto_applied scheme THEN action_plan = null
3. GIVEN a not_applicable scheme THEN action_plan = null

### Requirement 8: Summary Banner
**User Story:** As a patient, I want a clear summary showing my total potential savings.

#### Acceptance Criteria
1. GIVEN unclaimed schemes WHEN summary calculated THEN total_potential_savings = sum of all potential_savings
2. GIVEN summary WHEN displayed THEN message = "You may be eligible to claim up to ${total} across ${count} schemes"
3. GIVEN summary WHEN displayed THEN disclaimer always shown: "This is guidance only. Always consult a Medical Social Worker before taking action."
4. GIVEN every scheme card WHEN displayed THEN source_url and verified_date are shown

### Requirement 9: Performance and Caching
**User Story:** As a patient, I want fast results that don't re-run unnecessarily.

#### Acceptance Criteria
1. GIVEN scheme matching WHEN it runs THEN it completes within 10 seconds
2. GIVEN results are cached per session WHEN user re-clicks "Match Schemes" THEN agent is NOT re-run

### Requirement 10: Edge Cases
**User Story:** As the system, I want correct handling of all boundary conditions.

#### Acceptance Criteria
1. GIVEN Foreigner THEN all schemes → not_applicable; show foreigner message
2. GIVEN PR THEN only Government Subsidy, MediShield, MediSave, MAF, Flexi-MediSave eligible
3. GIVEN age < 18 THEN MediFund Junior replaces MediFund Silver
4. GIVEN PCHI = 0 THEN use annual_value for tier determination
5. GIVEN is_pioneer = true AND is_merdeka = true THEN data error — halt matching
6. GIVEN ward_class = 'unknown' THEN proceed with profile-only matching + warning
7. GIVEN unsupported hospital THEN show private hospital message + profile-only matching
8. GIVEN final_payable = 0 THEN skip MediFund/ComCare + show "fully covered" message
9. GIVEN final_payable > $10,000 THEN prioritise MediFund Silver at top + urgent callout
10. GIVEN scheme threshold changed since last session THEN use new MCP data, show notice with last_scraped date; never cache scheme results across sessions

### Requirement 11: Acceptance Test Scenarios
**User Story:** As a developer, I want verified end-to-end scenarios so the agent produces correct output for real patient profiles.

#### Acceptance Criteria
1. GIVEN SC, age 68, Pioneer, PCHI $1,200, Class C bill, pioneer_merdeka_discount = 0 WHEN scheme matcher runs THEN Pioneer Generation → unclaimed AND MediFund Silver → unclaimed AND CHAS Blue → unclaimed AND Government Subsidy → auto_applied AND MediShield Life → auto_applied AND summary banner shows correct total
2. GIVEN PR, age 45, PCHI $2,000 WHEN scheme matcher runs THEN Pioneer Generation → not_applicable AND MediFund → not_applicable AND CHAS → not_applicable AND Government Subsidy → auto_applied (PR tier) AND MediShield Life → auto_applied
3. GIVEN Foreigner WHEN scheme matcher runs THEN all schemes → not_applicable AND foreigner message shown
4. GIVEN is_pioneer = true AND is_merdeka = true WHEN scheme matcher runs THEN data error flagged AND matching halted until resolved
5. GIVEN MCP server unavailable WHEN scheme matcher runs THEN cached data used AND warning shown AND matching still completes
6. GIVEN final_payable = 0 WHEN scheme matcher runs THEN MediFund and ComCare skipped AND "fully covered" message shown
7. GIVEN SC, age 45, PCHI $900, Class B2 bill, medication charges present WHEN scheme matcher runs THEN CHAS Blue → unclaimed AND MAF → unclaimed AND MediFund → unclaimed AND ComCare → unclaimed (PCHI $900 flagged for case-by-case assessment) AND Government Subsidy → auto_applied AND MediShield deductible shown as $2,000
8. GIVEN SC, age 72, Merdeka, PCHI $3,000, Class C bill, pioneer_merdeka_discount = 0 WHEN scheme matcher runs THEN Merdeka Generation → unclaimed AND MediFund Silver → unclaimed AND CHAS Green → unclaimed AND Government Subsidy shown at 65% tier
9. GIVEN SC, age 25, PCHI $500, Class C bill, final_payable = $4,500 WHEN scheme matcher runs THEN MediFund Junior → not_applicable (age ≥ 18) AND MediFund → unclaimed AND ComCare SMTA → unclaimed AND CHAS Blue → unclaimed AND ElderFund → not_applicable (age < 30) AND Flexi-MediSave → not_applicable (age < 60)
10. GIVEN SC, age 15, PCHI $600, Class C bill WHEN scheme matcher runs THEN MediFund Junior → unclaimed AND MediFund Silver → not_applicable (age < 65) AND ElderFund → not_applicable AND Flexi-MediSave → not_applicable
11. GIVEN SC, age 68, PCHI = 0, annual_value $15,000, Class C bill WHEN scheme matcher runs THEN PCHI = 0 edge case triggered AND AV $15,000 ≤ $21,000 → treated as lowest bracket AND CHAS Blue → unclaimed AND Government Subsidy → auto_applied at 80% AND MediFund Silver → unclaimed
12. GIVEN SC, age 80, Pioneer, PCHI $800, Class C bill, final_payable = $15,000 WHEN scheme matcher runs THEN final_payable > $10,000 → urgent callout shown AND MediFund Silver → unclaimed at top AND Pioneer Generation → unclaimed if discount missing AND ElderFund → flagged for assessment
13. GIVEN SC, age 55, has_ip_rider = true, ip_rider_date = 'after_april_2026', Class B2 bill WHEN scheme matcher runs THEN IP rider warning shown: "Your IP rider cannot cover your minimum deductible of $2,000" AND MediShield deductible shown as $2,000 AND normal scheme matching continues
14. GIVEN SC, age 40, PCHI $5,000, Class A bill WHEN scheme matcher runs THEN Government Subsidy → not_applicable (Class A non-subsidised) AND CHAS Green → unclaimed AND MediShield Life → auto_applied AND MediFund → not_applicable
15. GIVEN Path A user (no bill uploaded) WHEN scheme matcher runs THEN data_source = 'profile_only' AND bill cross-reference checks skipped AND "Upload your bill" banner shown AND all matching based on profile fields only
16. GIVEN SC, age 35, PCHI $2,000, bill from Gleneagles (private hospital) WHEN scheme matcher runs THEN private hospital message shown AND Government Subsidy → not_applicable AND MediFund → not_applicable AND CHAS → unclaimed (still applicable at GP clinics)
17. GIVEN SC, age 68, Class C bill, final_payable = $0 WHEN scheme matcher runs THEN MediFund → skipped AND ComCare → skipped AND "fully covered" message shown AND auto_applied schemes still displayed
18. GIVEN valid profile, MCP server returns 503 WHEN scheme matcher runs THEN cached data used AND warning shown with cached_date AND matching completes AND all scheme cards show cached verified_date
19. GIVEN SC, age 62, PCHI $1,200, no bill WHEN scheme matcher runs THEN Flexi-MediSave → unclaimed AND withdrawal limit $400/year shown AND data_source = 'profile_only'
20. GIVEN SC, age 18, PCHI $600, Class C bill WHEN scheme matcher runs THEN MediFund Junior → not_applicable (age = 18, boundary) AND MediFund → unclaimed
