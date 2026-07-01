# Design: Onboarding

## Overview
This document defines the technical design for the onboarding flow — a one-question-per-screen wizard that collects user profile data and produces the `UserProfile` interface consumed by the eligibility rules engine.

## Data Types

```typescript
// Raw form state before mapping to UserProfile
interface OnboardingFormState {
  citizenship: 'SC' | 'PR' | 'Foreigner' | null
  age: number | null
  monthly_pchi: number | null
  annual_value: number | null
  generation: 'pioneer' | 'merdeka' | 'neither' | null
  has_ip_rider: boolean | null
  ip_rider_date: 'before_april_2026' | 'after_april_2026' | null
}

// Progress indicator state
interface ProgressState {
  current_screen: number      // 1-based
  total_screens: number       // 6 or 7 depending on IP rider answer
  percent_complete: number    // 0-100
}

// Output — matches eligibility_matrix.md exactly
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

## Screen Definitions

### Screen 1 — Citizenship
- **Question text:** "What is your residency status?"
- **Input type:** Radio buttons (single select, required)
- **Options:** "Singapore Citizen" → SC | "Permanent Resident (PR)" → PR | "Foreigner / Work Pass / Dependent" → Foreigner
- **Validation:** Required — "Next" button disabled until selection made. No default selection.
- **Mapping:** Selected value → `UserProfile.citizenship`

### Screen 2 — Age
- **Question text:** "How old are you?"
- **Input type:** Number input (integer)
- **Placeholder:** "e.g. 68"
- **Validation:** Required. Integer only. Min: 0, Max: 120. Strip non-numeric. Round down decimals.
- **Error message:** "Please enter a valid age between 0 and 120"
- **Mapping:** Parsed integer → `UserProfile.age`

### Screen 3 — Monthly Household PCHI
- **Question text:** "What is your monthly Per Capita Household Income (PCHI)?"
- **Helper text:** "PCHI = total household income ÷ number of household members. If you are unsure or have no income, enter 0 or leave blank."
- **Input type:** Number input with `$` prefix
- **Placeholder:** "e.g. 1200"
- **Validation:** Optional. If provided, must be >= 0. Max: 99999. Decimals rounded to nearest dollar.
- **Error message:** "Income cannot be negative"
- **Mapping:** Blank → `monthly_pchi = 0` | 0 → `monthly_pchi = 0` | Otherwise → parsed number

### Screen 4 — Annual Value of Home
- **Question text:** "What is the Annual Value (AV) of your home?"
- **Helper text:** "You can find this on your IRAS property tax notice, or search at iras.gov.sg. If unsure, enter your best estimate."
- **Input type:** Number input with `$` prefix
- **Placeholder:** "e.g. 15000"
- **Validation:** Required. Must be >= 0. Max: 999999. Decimals rounded.
- **Error message:** "Annual Value cannot be negative"
- **Mapping:** Parsed number → `UserProfile.annual_value`

### Screen 5 — Pioneer / Merdeka Generation
- **Question text:** "Are you part of the Pioneer Generation or Merdeka Generation?"
- **Helper text:** "Pioneer Generation: Born before 1 Jan 1950 and became a Singapore Citizen on or before 31 Dec 1986. Merdeka Generation: Born 1950–1959 and became a Singapore Citizen on or before 31 Dec 1996."
- **Input type:** Radio buttons (single select, required)
- **Options:** "Yes — Pioneer Generation" → pioneer | "Yes — Merdeka Generation" → merdeka | "Neither / Not sure" → neither
- **Mapping:** pioneer → `{is_pioneer: true, is_merdeka: false}` | merdeka → `{is_pioneer: false, is_merdeka: true}` | neither → `{is_pioneer: false, is_merdeka: false}`
- **Structural safety:** Single-select radio makes `is_pioneer = true AND is_merdeka = true` impossible through UI.

### Screen 6 — IP Rider
- **Question text:** "Do you have an Integrated Shield Plan (IP) rider?"
- **Helper text:** "An IP rider is additional private insurance on top of MediShield Life, purchased through insurers like AIA, Great Eastern, NTUC Income, or Prudential."
- **Input type:** Radio buttons (single select, required)
- **Options:** "Yes" → true | "No / Not sure" → false
- **Mapping (No):** `has_ip_rider = false`, `ip_rider_date = 'none'`, skip Screen 7
- **Mapping (Yes):** `has_ip_rider = true`, proceed to Screen 7

### Screen 7 — IP Rider Purchase Date (Conditional)
- **Only shown if Screen 6 = "Yes"**
- **Question text:** "Was your IP rider purchased before or after 1 April 2026?"
- **Helper text:** "From April 2026, new MOH rules changed what IP riders can cover. If you're unsure, check your policy start date with your insurer."
- **Input type:** Radio buttons (single select, required)
- **Options:** "Before 1 April 2026" → before_april_2026 | "On or after 1 April 2026" → after_april_2026
- **Mapping:** Selected value → `UserProfile.ip_rider_date`

## Form Submission Flow
1. Map `OnboardingFormState` → `UserProfile` using rules above
2. Store `UserProfile` in session state (no persistent storage — no login per product.md)
3. Call `checkEligibility(userProfile)` from eligibility_matrix rules engine
4. Navigate to Entitlement Dashboard with results

## Entitlement Dashboard Design

### Output Type
`SchemeMatch[]` array as defined in eligibility_matrix:
```typescript
interface SchemeMatch {
  scheme_id: string
  scheme_name: string
  status: 'auto_applied' | 'unclaimed' | 'not_applicable'
  reason: string
  action_steps: string[]
  source_url: string
  verified_date: string
}
```

### Display — Grouped by Status
- **Section 1: ✅ Already Applied** — Government Subsidy, MediShield Life, MediSave, Pioneer/Merdeka (if registered). Each card: scheme name, reason, source URL.
- **Section 2: ⚠️ You May Be Eligible** — Unclaimed schemes. Cards sorted by potential impact. Each card: scheme name, reason, action_steps, contact info, source URL, verified date.
- **Section 3: ❌ Not Applicable** — Collapsed by default. Each card: scheme name, brief reason.

### Upload Bill CTA
- Button text: "Upload Your Hospital Bill"
- Subtext: "Get a detailed breakdown and more accurate scheme matching by uploading your bill."

### Profile Summary
- Collapsible card at top showing: Citizenship, Age, PCHI, AV, Generation status, IP rider status
- "Edit" link returns to wizard with fields pre-filled

### Disclaimer
Always shown: "This is guidance to help you ask the right questions. Always consult a Medical Social Worker before taking action. Eligibility is subject to assessment by the relevant authorities."

## Edge Cases (Deferred to Downstream)
- **PCHI = 0:** Allow submission. Eligibility matrix uses `annual_value`.
- **Pioneer AND Merdeka both true:** Cannot occur via UI. Only via direct API — eligibility matrix halts.
- **Foreigner:** All schemes → not_applicable except MediShield Life explanation.
- **Age < 18:** Eligibility matrix replaces MediFund Silver with Junior.
- **Age ≥ 65:** Triggers MediFund Silver and Flexi-MediSave checks.
- **No IP rider:** Skip Screen 7, `ip_rider_date = 'none'`. Eligibility matrix skips IP flag.

## Technical Notes
- No login required — session-based only
- Session ID generated on first screen load
- Mobile-first responsive layout
- "Back" button on every screen preserves data
- Form data persists in browser session
- Helper text uses plain English appropriate for 65-year-old
- Rules engine completes in < 100ms (pure computation)
