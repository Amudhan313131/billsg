# Requirements: Eligibility Matrix

## Overview
This spec defines the deterministic eligibility logic for all 14 Singapore healthcare schemes relevant to acute inpatient care at public hospitals. The rules engine implements this matrix exactly — no AI involved in eligibility decisions. Note: product.md originally referenced "12+ schemes" — the count expanded to 14 during spec refinement.

## Requirements

### Requirement 1: Rules Engine Core
**User Story:** As BillSG, I want a deterministic rules engine that evaluates all schemes against a UserProfile so that eligibility decisions are always consistent and explainable.

#### Acceptance Criteria
1. GIVEN a completed UserProfile WHEN `checkEligibility` is called THEN it returns a `SchemeMatch[]` array covering all 14 schemes
2. GIVEN the rules engine WHEN it runs THEN every scheme is assigned exactly one status: auto_applied, unclaimed, or not_applicable
3. GIVEN the rules engine WHEN it produces results THEN every SchemeMatch includes scheme_id, scheme_name, status, reason, action_steps, source_url, verified_date
4. GIVEN the Scheme Matching Agent (Phase 4) WHEN it uses eligibility results THEN it never overrides the rules engine — matrix is always ground truth

### Requirement 2: Government Subsidy (Scheme 1)
**User Story:** As a patient, I want to know my government subsidy tier so I understand how much of my bill was automatically reduced.

**Effective: 1 October 2024** (current subsidy tier structure)

#### Acceptance Criteria
1. GIVEN citizenship IN (SC, PR) AND ward_class IN (B2, C) THEN status = auto_applied
2. GIVEN SC with PCHI ≤ $2,100 THEN subsidy rate = 80%
3. GIVEN SC with PCHI $2,100–$2,300 THEN subsidy rate = 75%
4. GIVEN SC with PCHI $2,300–$2,600 THEN subsidy rate = 70%
5. GIVEN SC with PCHI $2,600–$3,000 THEN subsidy rate = 65%
6. GIVEN SC with PCHI $3,000–$3,300 THEN subsidy rate = 60%
7. GIVEN SC with PCHI $3,300–$3,600 THEN subsidy rate = 55%
8. GIVEN SC with PCHI > $3,600 THEN subsidy rate = 50%
9. GIVEN PR THEN same tiers but rates are: 50%, 42.5%, 35%, 32.5%, 30%, 27.5%, 25%
10. GIVEN Foreigner THEN no subsidy (not_applicable)
11. GIVEN PCHI = 0 THEN use Annual Value: AV ≤ $21,000 → lowest bracket, AV > $21,000 → 50%/25%

### Requirement 3: MediShield Life (Scheme 2)
**User Story:** As a patient, I want to understand my MediShield Life coverage including deductible and co-insurance tiers.

#### Acceptance Criteria
1. GIVEN citizenship IN (SC, PR) THEN status = auto_applied
2. GIVEN Class C ward THEN deductible = $1,500 per policy year
3. GIVEN Class B2 ward THEN deductible = $2,000
4. GIVEN Class B1 ward THEN deductible = $2,500
5. GIVEN Class A ward THEN deductible = $3,500
6. GIVEN claimable amount THEN co-insurance = 10% on first $5,000, 5% on next $5,000, 3% above $10,000
7. GIVEN MediShield Life deductible WHEN same policy year AND multiple hospital admissions THEN deductible is paid only once per policy year (not per admission)

### Requirement 4: MediSave (Scheme 3)
**User Story:** As a patient, I want to know how much MediSave was used for my bill.

#### Acceptance Criteria
1. GIVEN citizenship IN (SC, PR) THEN status = auto_applied
2. GIVEN a bill WHEN MediSave is applied THEN withdrawal limit is shown

### Requirement 5: CHAS Blue (Scheme 4)
**User Story:** As a lower-income patient, I want to know if I qualify for CHAS Blue subsidies.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND (monthly_pchi <= 1500 OR annual_value <= 21000) THEN status = unclaimed
2. GIVEN status = unclaimed THEN action_steps include: Apply at chas.sg or call 1800-275-2427

### Requirement 6: CHAS Orange (Scheme 5)
**User Story:** As a mid-income patient, I want to know if I qualify for CHAS Orange subsidies.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND monthly_pchi >= 1501 AND monthly_pchi <= 2300 THEN status = unclaimed
2. GIVEN status = unclaimed THEN action_steps include: Apply at chas.sg

### Requirement 7: CHAS Green (Scheme 6)
**User Story:** As a Singapore Citizen, I want to know that I qualify for CHAS Green regardless of income.

#### Acceptance Criteria
1. GIVEN citizenship = SC THEN status = unclaimed (if user doesn't already have CHAS card)
2. GIVEN status = unclaimed THEN note: All SCs eligible regardless of income

### Requirement 8: Pioneer Generation Package (Scheme 7)
**User Story:** As a Pioneer Generation member, I want to verify my additional 50% discount is applied.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND is_pioneer = true THEN status = auto_applied (if registered) OR unclaimed (if not registered)
2. GIVEN unclaimed THEN action: Call 1800-2222-888

### Requirement 9: Merdeka Generation Package (Scheme 8)
**User Story:** As a Merdeka Generation member, I want to verify my additional 25% discount is applied.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND is_merdeka = true THEN status = auto_applied (if registered) OR unclaimed (if not registered)
2. GIVEN unclaimed THEN action: Call 1800-2222-888
3. GIVEN is_merdeka = true THEN the flag applies to: (a) Born 1 Jan 1950 – 31 Dec 1959 AND SC by 31 Dec 1996, OR (b) Born before 1 Jan 1950, not Pioneer Generation, AND SC by 31 Dec 1996

### Requirement 10: MediFund (Scheme 9)
**User Story:** As a patient who cannot afford my remaining bill, I want to know about MediFund assistance.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND difficulty paying remaining bill THEN status = unclaimed
2. GIVEN unclaimed THEN action: Approach Medical Social Worker; bring NRIC, hospital bill, proof of income; say "I would like to apply for MediFund"

### Requirement 11: MediFund Silver (Scheme 10)
**User Story:** As an elderly patient aged 65+, I want to know about MediFund Silver specifically for seniors.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND age >= 65 AND difficulty paying THEN status = unclaimed
2. GIVEN unclaimed THEN action: Approach Medical Social Worker; say "I would like to apply for MediFund Silver"

### Requirement 12: MAF (Scheme 11)
**User Story:** As a patient with medication charges, I want to know if my medications qualify for MAF subsidies.

#### Acceptance Criteria
1. GIVEN citizenship IN (SC, PR) AND bill contains medication charges THEN status = unclaimed
2. GIVEN unclaimed THEN action: Ask pharmacist if medications are on MAF list; bring hospital bill, NRIC

### Requirement 13: ElderFund (Scheme 12)
**User Story:** As a lower-income disabled patient aged 30+, I want to know about ElderFund monthly payouts.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND age >= 30 AND monthly_pchi <= 1500 AND MediSave balance < $10,000 AND requires full assistance with at least 3 of 6 Activities of Daily Living AND NOT a CareShield Life or ElderShield policyholder THEN status = unclaimed
2. GIVEN unclaimed THEN action: Apply at aic.sg or email apply@aic.sg
3. GIVEN ElderFund unclaimed THEN payout up to $250/month (subject to assessment)

### Requirement 14: ComCare (Scheme 13)
**User Story:** As a lower-income patient, I want to know about ComCare financial assistance.

#### Acceptance Criteria
1. GIVEN citizenship = SC AND monthly_pchi <= 800 OR permanent inability to work THEN status = unclaimed
2. GIVEN citizenship = PR AND monthly_pchi <= 800 AND at least one SC family member in household THEN status = unclaimed (SMTA only)
3. GIVEN SMTA type THEN action: Apply at SupportGoWhere or visit Social Service Office; hotline 1800 222 0000
4. GIVEN LTA type THEN action: Visit any Social Service Office; cash assistance $760–$2,230/month (from April 2025, based on household size and income)

### Requirement 15: Flexi-MediSave (Scheme 14)
**User Story:** As a patient aged 60+, I want to know about additional Flexi-MediSave withdrawals.

#### Acceptance Criteria
1. GIVEN citizenship IN (SC, PR) AND age >= 60 THEN status = unclaimed
2. GIVEN unclaimed THEN withdrawal limit = $400/year

### Requirement 16: April 2026 IP Rider Flag
**User Story:** As a patient with an IP rider, I want to understand how April 2026 rule changes affect my coverage.

#### Acceptance Criteria
1. GIVEN has_ip_rider = true AND ip_rider_date = 'after_april_2026' THEN show warning about deductible coverage ban
2. GIVEN has_ip_rider = true AND ip_rider_date = 'before_april_2026' THEN show info about grandfathering
3. GIVEN has_ip_rider = false THEN skip IP rider flag entirely

### Requirement 17: Edge Cases
**User Story:** As a system, I want well-defined behavior for boundary conditions.

#### Acceptance Criteria
1. GIVEN Foreigner THEN only MediShield Life explanation shown, all others not_applicable
2. GIVEN PR THEN eligible for MediShield Life, MediSave, MAF, Flexi-MediSave only
3. GIVEN age < 18 THEN flag MediFund Junior instead of MediFund Silver
4. GIVEN PCHI = 0 THEN treat as lowest income bracket using annual_value
5. GIVEN no IP rider THEN skip April 2026 flag
6. GIVEN is_pioneer = true AND is_merdeka = true THEN flag as data error — halt matching
