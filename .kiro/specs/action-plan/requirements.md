# Requirements: Action Plan Templates

## Overview
This spec defines the concrete action plan templates used by the Scheme Matching Agent (Phase 4) to populate the `ActionPlan` object for every scheme that reaches `status = 'unclaimed'`. Each template provides a patient with exactly what they need: where to go, what to bring, what to say, who to contact, and how long it typically takes.

**Important distinction:** This spec serves Phase 4 — the full AI-powered Match Schemes flow. It is separate from the simpler `action_steps: string[]` field on the Phase 1 Entitlement Dashboard (sourced from eligibility_matrix's SchemeMatch interface). Phase 1 shows lightweight bullet-point steps. This spec's richer ActionPlan templates are for Phase 4 only.

## Requirements

### Requirement 1: ActionPlan Interface Compliance
**User Story:** As the scheme matcher, I want templates that produce the exact ActionPlan interface shape.

#### Acceptance Criteria
1. GIVEN any action plan template WHEN produced THEN it has exactly: where_to_go (string), what_to_bring (string[]), what_to_say (string), contact (string), estimated_processing_time (string)
2. GIVEN Government Subsidy, MediShield Life, or MediSave THEN action_plan = null (always auto_applied)

### Requirement 2: CHAS Templates (Blue, Orange, Green)
**User Story:** As a patient eligible for CHAS, I want to know exactly how to apply.

#### Acceptance Criteria
1. GIVEN CHAS Blue unclaimed THEN template includes: chas.sg, hotline 1800-275-2427, NRIC + proof of income
2. GIVEN CHAS Orange unclaimed THEN template includes: chas.sg, NRIC + proof of income
3. GIVEN CHAS Green unclaimed THEN template includes: chas.sg, NRIC only
4. GIVEN any CHAS template THEN what_to_say is a literal quotable phrase

### Requirement 3: Pioneer/Merdeka Templates
**User Story:** As a Pioneer/Merdeka member, I want to know how to verify my benefits.

#### Acceptance Criteria
1. GIVEN Pioneer Generation unclaimed THEN contact = hotline 1800-2222-888
2. GIVEN Merdeka Generation unclaimed THEN contact = hotline 1800-2222-888
3. GIVEN either template THEN what_to_say mentions checking benefits are applied to hospital bill

### Requirement 4: MediFund Templates (Standard, Silver, Junior)
**User Story:** As a patient needing MediFund, I want the exact words to say to the Medical Social Worker.

#### Acceptance Criteria
1. GIVEN MediFund unclaimed THEN what_to_say = "I would like to apply for MediFund" (exact quote from eligibility_matrix)
2. GIVEN MediFund Silver unclaimed THEN what_to_say = "I would like to apply for MediFund Silver" (exact quote)
3. GIVEN MediFund Junior unclaimed THEN what_to_say = "I would like to apply for MediFund Junior"
4. GIVEN any MediFund variant THEN what_to_bring includes: NRIC, Hospital bill, Proof of income (CPF statement or payslip)
5. GIVEN age < 18 THEN MediFund Junior template is used instead of Silver

### Requirement 5: MAF Template
**User Story:** As a patient with medication charges, I want to know how to check MAF eligibility.

#### Acceptance Criteria
1. GIVEN MAF unclaimed THEN where_to_go = hospital pharmacy
2. GIVEN MAF unclaimed THEN what_to_bring includes: NRIC, Hospital bill showing medication charges
3. GIVEN MAF unclaimed THEN what_to_say mentions checking if medications are on MAF list

### Requirement 6: ElderFund Template
**User Story:** As an elderly patient needing long-term care assistance, I want to know how to apply.

#### Acceptance Criteria
1. GIVEN ElderFund unclaimed THEN where_to_go includes aic.sg and apply@aic.sg
2. GIVEN ElderFund unclaimed THEN what_to_bring includes medical report for ADL limitations

### Requirement 7: ComCare Templates (SMTA and LTA)
**User Story:** As a lower-income patient, I want the correct ComCare application path.

#### Acceptance Criteria
1. GIVEN temporary inability to work THEN ComCare SMTA template used with supportgowhere.life.gov.sg
2. GIVEN permanent inability to work THEN ComCare LTA template used with Social Service Office
3. GIVEN either ComCare THEN hotline 1800 222 0000 included

### Requirement 8: Flexi-MediSave Template
**User Story:** As a patient aged 60+, I want to know where to use Flexi-MediSave.

#### Acceptance Criteria
1. GIVEN Flexi-MediSave unclaimed THEN where_to_go includes: polyclinic, public SOC, CHAS GP clinic
2. GIVEN Flexi-MediSave unclaimed THEN estimated_processing_time = "Immediate"

### Requirement 9: Disclaimer on Every Template
**User Story:** As a patient, I want to know action plans are guidance only.

#### Acceptance Criteria
1. GIVEN any action plan card WHEN displayed THEN disclaimer shown: "This is guidance only. Always consult a Medical Social Worker before taking action."

### Requirement 10: Template Selection Edge Cases
**User Story:** As the system, I want correct template selection for boundary conditions.

#### Acceptance Criteria
1. GIVEN age < 18 WHEN MediFund is unclaimed THEN MediFund Junior template selected (not Silver)
2. GIVEN temporary vs permanent inability WHEN ComCare unclaimed THEN correct SMTA/LTA template selected
3. GIVEN is_pioneer = true AND is_merdeka = true THEN no action plan generated (matching halts per scheme_matcher Edge Case 5)
4. GIVEN Foreigner THEN no action plans generated (all schemes not_applicable)
