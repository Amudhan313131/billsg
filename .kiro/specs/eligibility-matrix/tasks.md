# Tasks: Eligibility Matrix

## Task 1: Create core types and rules engine entry point
- [x] Create `lib/eligibility/types.ts` with UserProfile, SchemeMatch, SchemeStatus types
- [x] Create `lib/eligibility/index.ts` with `checkEligibility(profile: UserProfile): SchemeMatch[]`
- [x] Ensure function iterates all scheme checkers and returns complete array
- [x] Add source_url and verified_date to every SchemeMatch output

## Task 2: Implement Government Subsidy scheme checker
- [x] Create `lib/eligibility/schemes/government-subsidy.ts`
- [x] Implement SC subsidy tiers (80%–50% by PCHI bracket)
- [x] Implement PR subsidy tiers (50%–25% by PCHI bracket)
- [x] Handle PCHI = 0 edge case using annual_value (AV ≤ 21000 → lowest bracket 80%/50%, AV > 21000 → bottom tier 50%/25%)
- [x] Return not_applicable for Foreigners
- [x] Set status = auto_applied for eligible SC/PR

## Task 3: Implement MediShield Life and MediSave scheme checkers
- [x] Create `lib/eligibility/schemes/medishield-life.ts`
- [x] Implement deductible by ward class: C=$1500, B2=$2000, B1=$2500, A=$3500
- [x] Enforce once-per-policy-year rule: deductible is paid only once regardless of number of admissions in the same policy year
- [x] Implement co-insurance tiers: 10%/5%/3%
- [x] Create `lib/eligibility/schemes/medisave.ts`
- [x] Both return auto_applied for SC/PR, not_applicable for Foreigners

## Task 4: Implement CHAS scheme checkers (Blue, Orange, Green)
- [x] Create `lib/eligibility/schemes/chas.ts`
- [x] CHAS Blue: SC AND (PCHI ≤ 1500 OR AV ≤ 21000) → unclaimed
- [x] CHAS Orange: SC AND PCHI 1501–2300 → unclaimed
- [x] CHAS Green: SC → unclaimed (all citizens eligible)
- [x] All CHAS → not_applicable for PR and Foreigners
- [x] Include action_steps with chas.sg and hotline 1800-275-2427 for Blue

## Task 5: Implement Pioneer and Merdeka Generation checkers
- [x] Create `lib/eligibility/schemes/pioneer-merdeka.ts`
- [x] Pioneer: SC AND is_pioneer → auto_applied or unclaimed
- [x] Merdeka: SC AND is_merdeka → auto_applied or unclaimed
- [x] Include action: Call 1800-2222-888 if unclaimed
- [x] Both not_applicable for PR/Foreigners

## Task 6: Implement MediFund, MediFund Silver, MediFund Junior checkers
- [x] Create `lib/eligibility/schemes/medifund.ts`
- [x] MediFund: SC only, unclaimed when difficulty paying
- [x] MediFund Silver: SC AND age ≥ 65
- [x] MediFund Junior: SC AND age < 18 (replaces Silver)
- [x] Include exact what_to_say phrases from spec
- [x] All not_applicable for PR/Foreigners

## Task 7: Implement MAF, ElderFund, ComCare, Flexi-MediSave checkers
- [x] Create `lib/eligibility/schemes/maf.ts` — SC/PR, medication charges present
- [x] Create `lib/eligibility/schemes/elderfund.ts` — SC, age ≥ 30, PCHI ≤ 1500, MediSave balance < $10,000, NOT CareShield Life or ElderShield policyholder, requires full ADL assistance (at least 3 of 6 Activities of Daily Living)
- [x] Create `lib/eligibility/schemes/comcare.ts` — SC: PCHI ≤ 800 or permanent inability to work (SMTA + LTA); PR: SMTA only AND requires at least one SC family member in household
- [x] Create `lib/eligibility/schemes/flexi-medisave.ts` — SC/PR, age ≥ 60, limit $400/year
- [x] Include correct source_urls for each

## Task 8: Implement IP Rider flag and edge case handling
- [x] Create `lib/eligibility/schemes/ip-rider-flag.ts`
- [x] after_april_2026 → warning with co-payment cap $6,000
- [x] before_april_2026 → info about grandfathering
- [x] none → skip entirely
- [x] Implement Pioneer+Merdeka both-true data error detection
- [x] Implement Foreigner handling (all not_applicable except MediShield)
- [x] Implement PR restrictions

## Task 9: Write unit tests for all scheme checkers
- [x] Test Uncle Tan: SC, age 68, Pioneer, PCHI $1,200 — expect Pioneer unclaimed, CHAS Blue unclaimed, MediFund Silver unclaimed, Govt Subsidy auto_applied
- [x] Test Merdeka: SC, age 72, is_merdeka = true, PCHI $3,000 — expect Merdeka unclaimed, CHAS Green unclaimed, Govt Subsidy at 65% tier
- [x] Test PCHI = 0 with AV $15,000 — expect lowest bracket (80% SC), CHAS Blue unclaimed
- [x] Test PCHI = 0 with AV $25,000 — expect bottom tier (50% SC)
- [x] Test Foreigner — expect all not_applicable except MediShield Life explanation
- [x] Test PR, age 45, PCHI $2,000 — expect Govt Subsidy auto_applied (PR tier), MediShield auto_applied, CHAS not_applicable, MediFund not_applicable
- [x] Test PR ComCare SMTA with SC family member — expect unclaimed; without SC family member — expect not_applicable
- [x] Test age < 18 — expect MediFund Junior unclaimed, MediFund Silver not_applicable
- [x] Test age = 18 boundary — expect MediFund Junior not_applicable, MediFund unclaimed
- [x] Test ElderFund: SC, age 35, PCHI $1,200, MediSave $8,000, ADL impaired, no CareShield — expect unclaimed
- [x] Test ElderFund fail: same profile but MediSave $12,000 — expect not_applicable
- [x] Test ElderFund fail: same profile but is CareShield policyholder — expect not_applicable
- [x] Test IP rider after_april_2026 — expect warning callout with $6,000 co-payment cap
- [x] Test IP rider before_april_2026 — expect info callout about grandfathering
- [x] Test IP rider none — expect no callout
- [x] Test Pioneer+Merdeka both true — expect data error, halt
- [x] Test all SC PCHI bracket boundaries: $0/$2,100/$2,300/$2,600/$3,000/$3,300/$3,600/$3,601 — expect correct subsidy rate at each boundary
- [x] Test CHAS Orange: SC, PCHI $1,800 — unclaimed; CHAS Blue: SC, PCHI $1,400 — unclaimed; CHAS Green: SC any PCHI — unclaimed
