# Requirements: Onboarding

## Overview
The onboarding flow collects the minimum profile data needed to run BillSG's deterministic eligibility engine. It produces a `UserProfile` object (defined in eligibility_matrix requirements) through a guided, one-question-per-screen wizard with a progress indicator. On completion, the rules engine runs immediately and the user lands on the Entitlement Dashboard — the Phase 1 / Path A exit point per product.md.

No AI, no MCP server call, and no bill data are involved in this phase. The rules engine is the sole source of truth.

## Binding Constraint
This spec MUST produce the exact `UserProfile` interface from eligibility_matrix with no renamed or added fields:

```typescript
interface UserProfile {
  citizenship: 'SC' | 'PR' | 'Foreigner'
  age: number
  monthly_pchi: number
  annual_value: number
  is_pioneer: boolean
  is_merdeka: boolean
  has_ip_rider: boolean
  ip_rider_date: 'before_april_2026' | 'after_april_2026' | 'none'
}
```

## Requirements

### Requirement 1: Citizenship Screen
**User Story:** As a patient, I want to indicate my residency status so that BillSG can determine which schemes apply to me.

#### Acceptance Criteria
1. GIVEN the citizenship screen is displayed WHEN the user views it THEN three radio options are shown: "Singapore Citizen" (SC), "Permanent Resident (PR)", "Foreigner / Work Pass / Dependent" (Foreigner)
2. GIVEN no selection is made WHEN the user tries to proceed THEN the "Next" button remains disabled
3. GIVEN a selection is made WHEN the form is submitted THEN the value maps directly to `UserProfile.citizenship`

### Requirement 2: Age Screen
**User Story:** As a patient, I want to enter my age so that age-dependent schemes can be evaluated.

#### Acceptance Criteria
1. GIVEN the age input WHEN the user enters a valid integer between 0 and 120 THEN the value maps directly to `UserProfile.age`
2. GIVEN the age input WHEN the user enters a value < 0 or > 120 THEN an inline error is shown: "Please enter a valid age between 0 and 120"
3. GIVEN the age input WHEN non-numeric characters are entered THEN they are stripped and only digits shown
4. GIVEN the age input is empty WHEN the user tries to proceed THEN the "Next" button remains disabled

### Requirement 3: Monthly Household PCHI Screen
**User Story:** As a patient, I want to provide my household income so that means-tested schemes can be evaluated.

#### Acceptance Criteria
1. GIVEN the PCHI input WHEN the user enters a number >= 0 THEN it maps to `UserProfile.monthly_pchi`
2. GIVEN the PCHI input WHEN left blank or entered as 0 THEN submission is NOT blocked and `monthly_pchi = 0`
3. GIVEN the PCHI input WHEN a negative number is entered THEN an inline error is shown: "Income cannot be negative"
4. GIVEN PCHI = 0 WHEN the rules engine runs THEN it defers to eligibility_matrix's PCHI=0 edge case using `annual_value`

### Requirement 4: Annual Value of Home Screen
**User Story:** As a patient, I want to provide my home's Annual Value so that fallback subsidy determination works when PCHI is zero.

#### Acceptance Criteria
1. GIVEN the AV input WHEN the user enters a number >= 0 THEN it maps directly to `UserProfile.annual_value`
2. GIVEN the AV input is empty WHEN the user tries to proceed THEN the "Next" button remains disabled (required field)
3. GIVEN the AV input WHEN a negative number is entered THEN an inline error is shown: "Annual Value cannot be negative"

### Requirement 5: Pioneer/Merdeka Generation Screen
**User Story:** As a patient, I want to indicate my generation status so that additional subsidies can be identified.

#### Acceptance Criteria
1. GIVEN the generation screen WHEN displayed THEN three radio options are shown: "Yes — Pioneer Generation", "Yes — Merdeka Generation", "Neither / Not sure"
2. GIVEN "Pioneer" is selected THEN `is_pioneer = true, is_merdeka = false`
3. GIVEN "Merdeka" is selected THEN `is_pioneer = false, is_merdeka = true`
4. GIVEN "Neither" is selected THEN `is_pioneer = false, is_merdeka = false`
5. GIVEN the single-select radio WHEN the user interacts THEN it is structurally impossible to select both Pioneer and Merdeka simultaneously — the "both true" data-error edge case from eligibility_matrix cannot occur through this UI

### Requirement 6: IP Rider Screen
**User Story:** As a patient, I want to indicate whether I have an IP rider so that the April 2026 rule changes can be flagged.

#### Acceptance Criteria
1. GIVEN IP rider question WHEN user selects "No / Not sure" THEN `has_ip_rider = false`, `ip_rider_date = 'none'`, and Screen 7 is skipped
2. GIVEN IP rider question WHEN user selects "Yes" THEN `has_ip_rider = true` and conditional follow-up Screen 7 is shown
3. GIVEN Screen 7 is shown WHEN user selects "Before 1 April 2026" THEN `ip_rider_date = 'before_april_2026'`
4. GIVEN Screen 7 is shown WHEN user selects "On or after 1 April 2026" THEN `ip_rider_date = 'after_april_2026'`
5. GIVEN IP rider = No WHEN progress indicator renders THEN total screens = 6
6. GIVEN IP rider = Yes WHEN progress indicator renders THEN total screens = 7

### Requirement 7: Entitlement Dashboard
**User Story:** As a patient, I want to see which schemes I qualify for immediately after answering the questions, so that I get value without uploading a bill.

#### Acceptance Criteria
1. GIVEN a completed UserProfile WHEN the rules engine runs THEN it produces a `SchemeMatch[]` array grouped by status (auto_applied, unclaimed, not_applicable)
2. GIVEN the dashboard WHEN rendered THEN three sections are shown: ✅ Already Applied, ⚠️ You May Be Eligible, ❌ Not Applicable (collapsed by default)
3. GIVEN the dashboard WHEN rendered THEN an "Upload Your Hospital Bill" CTA button is shown as entry to Path B
4. GIVEN the dashboard WHEN rendered THEN disclaimer is always shown: "This is guidance to help you ask the right questions. Always consult a Medical Social Worker before taking action. Eligibility is subject to assessment by the relevant authorities."
5. GIVEN the dashboard WHEN rendered THEN a collapsible Profile Summary card with "Edit" link is shown
6. GIVEN the rules engine WHEN it completes THEN it finishes in < 100ms (pure computation, no network calls) — no loading state needed

### Requirement 8: Progress Indicator
**User Story:** As a patient, I want to see my progress through the onboarding wizard so I know how many questions remain.

#### Acceptance Criteria
1. GIVEN the user is on any screen WHEN progress indicator renders THEN it shows current_screen / total_screens and a percentage bar
2. GIVEN total_screens starts at 6 WHEN user answers "Yes" to IP rider THEN total_screens updates to 7
3. GIVEN user is on Screen 3 with IP rider not yet answered THEN progress shows "3 / 6" and 50%
