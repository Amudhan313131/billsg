# Scheme Matcher Spec

## Overview
The Scheme Matching Agent is the core AI feature of BillSG. It takes the user profile from onboarding and the parsed bill from bill_parser, queries the MCP server for live scheme data, and returns a categorised list of schemes with explanations and action plans.

This is Phase 4 of the BillSG flow. Triggered by the "Match Schemes" button, which only becomes available after Phase 3 (Explain My Bill) is complete.

## Inputs

### From Onboarding (always available)
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

### From Bill Parser (Path B only)
```typescript
interface ParsedBill {
  ward_class: 'A' | 'B1' | 'B2' | 'B2+' | 'C' | 'unknown'
  line_items: LineItem[]
  subtotal_before_subsidies: number
  government_subsidy: number
  medishield_deduction: number
  medisave_withdrawal: number
  pioneer_merdeka_discount: number
  final_payable: number
}
```

### From MCP Server (always queried)
Current live scheme data including:
- CHAS income thresholds
- MediFund criteria
- Pioneer/Merdeka benefits
- Government subsidy tiers
- All source URLs and last_verified dates

## Output
```typescript
interface SchemeMatchResult {
  schemes: SchemeCard[]
  summary: SummaryBanner
  ip_rider_flag: IPRiderFlag | null
  matched_at: string            // ISO timestamp
  data_source: 'profile_only' | 'profile_and_bill'
}

interface SchemeCard {
  scheme_id: string
  scheme_name: string
  status: 'auto_applied' | 'unclaimed' | 'not_applicable'
  reason: string                // Plain English reason
  potential_savings: number | null
  action_plan: ActionPlan | null  // Only for unclaimed schemes
  source_url: string
  verified_date: string
}

interface ActionPlan {
  where_to_go: string
  what_to_bring: string[]
  what_to_say: string
  contact: string
  estimated_processing_time: string
}

interface SummaryBanner {
  total_potential_savings: number
  unclaimed_scheme_count: number
  message: string               // "You may be eligible to claim up to $X across N schemes"
  disclaimer: string            // Always shown
}

interface IPRiderFlag {
  type: 'warning' | 'info'
  message: string
  source_url: string
}
```

## Agent Workflow — Step by Step

### Step 1 — Query MCP Server
Agent queries MCP server for current scheme data.
- GET /schemes — all schemes with current eligibility rules
- GET /chas-tiers — current income thresholds
- GET /ip-rider-rules — April 2026 changes
- GET /medisave-limits — current limits
If MCP server is unavailable → fall back to last known cached data → flag in output

### Step 2 — Determine Data Source
IF ParsedBill exists AND confidence_score >= 0.5
data_source = 'profile_and_bill'
Use both profile AND bill for matching
ELSE
data_source = 'profile_only'
Use profile only
Show banner: "Upload your bill for more accurate scheme matching"

### Step 3 — Run Eligibility Matrix
Run every scheme against user profile using rules from eligibility_matrix.md.
This is deterministic — no AI involved in this step.
FOR each scheme in eligibility_matrix:
result = checkEligibility(userProfile, scheme)
IF result.eligible → add to candidates[]
IF result.not_eligible → add to not_applicable[] with reason

### Step 4 — Cross-Reference With Bill (Path B only)
If data_source = 'profile_and_bill', enhance matching with bill data:

**Check 1 — Government Subsidy tier correct:**
- Calculate expected subsidy % from PCHI bracket in eligibility_matrix
- Compare with actual government_subsidy amount on bill
- If mismatch > 5% → flag as potential error

**Check 2 — Pioneer/Merdeka discount applied:**
- IF is_pioneer = true AND pioneer_merdeka_discount = 0 on bill
- THEN Pioneer discount was NOT applied → move to unclaimed
- IF is_merdeka = true AND pioneer_merdeka_discount = 0 on bill
- THEN Merdeka discount was NOT applied → move to unclaimed

**Check 3 — MediShield deductible correct:**
- Expected deductible based on ward_class:
  - Class C → $1,500
  - Class B2 → $2,000
  - Class B1 → $2,500
  - Class A → $3,500
- Compare with medishield_deduction on bill
- If deductible not yet met → explain remaining deductible

**Check 4 — MAF eligibility:**
- IF medication line items exist on bill
- AND citizenship IN (SC, PR)
- THEN flag MAF as unclaimed
- Note: Agent cannot verify if specific drugs are on MAF list → tell user to ask pharmacist

**Check 5 — MediFund/ComCare trigger:**
- IF final_payable > 1000 AND citizenship = SC
- THEN flag MediFund as unclaimed with high priority
- IF final_payable > 500 AND monthly_pchi <= 1000
- THEN flag ComCare as unclaimed with high priority
- NOTE: ComCare assesses each case individually — flag for anyone near the threshold even if slightly above $800

### Step 5 — Categorise Every Scheme
Every scheme must be assigned exactly one status:

**auto_applied:** Scheme appears correctly on bill and was applied
**unclaimed:** User qualifies but scheme not on bill OR was not applied correctly
**not_applicable:** User does not meet eligibility criteria

### Step 6 — Generate Plain English Reasons
LLM generates reason for each scheme card:
- Why user qualifies (or doesn't)
- What the scheme covers
- How much they might save (if estimable)
- Source cited

LLM must follow these rules:
- Never guarantee eligibility
- Always say "you may qualify" not "you qualify"
- Never give a specific dollar guarantee for MediFund/ComCare (holistic assessment)
- Always cite source URL and verified date
- Always end with disclaimer

### Step 7 — Fill Action Plan Templates
For every unclaimed scheme, fill action_plan.md template.
Action plans are scheme-specific — see action_plan.md for templates.

### Step 8 — Run IP Rider Flag
Separate from scheme matching. Always runs if has_ip_rider = true.
See bill_explainer.md for IP rider flag logic.

### Step 9 — Calculate Summary Banner
total_potential_savings = sum of potential_savings for all unclaimed schemes
unclaimed_scheme_count = count of unclaimed schemes
message = "You may be eligible to claim up to $${total_potential_savings} across ${unclaimed_scheme_count} schemes"
disclaimer = "This is guidance only. Always consult a Medical Social Worker before taking action."

Note: For MediFund and ComCare, potential_savings = final_payable (conservative estimate — they may cover the full remaining bill)

## Edge Cases

### Edge Case 1 — Foreigner
IF citizenship = 'Foreigner'
THEN:
All schemes → not_applicable except MediShield Life explanation
Show message: "Most Singapore government schemes are only available to Singapore Citizens and Permanent Residents."
Recommend: "Please speak to a Medical Social Worker about available options."

### Edge Case 2 — PR
IF citizenship = 'PR'
THEN eligible schemes:
Government Subsidy (lower tier — up to 50%)
MediShield Life
MediSave
MAF
Flexi-MediSave (if age >= 60)
All other schemes → not_applicable with reason: "This scheme is only available to Singapore Citizens"
ComCare SMTA → unclaimed if monthly_pchi <= 800 AND at least one SC family member in household

### Edge Case 3 — Age < 18
IF age < 18
THEN:
Replace MediFund Silver → MediFund Junior
Flag ElderFund → not_applicable (age < 30)

### Edge Case 4 — PCHI = 0
IF monthly_pchi = 0
THEN:
Use annual_value to determine subsidy tier
AV ≤ $21,000 → treat as lowest income bracket
AV > $21,000 → treat as middle income bracket

### Edge Case 5 — Pioneer AND Merdeka both true
IF is_pioneer = true AND is_merdeka = true
THEN:
Flag as data error
Show: "Please check your Pioneer/Merdeka Generation status — a person cannot hold both packages simultaneously."
Do not proceed with matching until resolved

### Edge Case 6 — Unknown Ward Class
IF ward_class = 'unknown'
THEN:
Cannot verify MediShield deductible
Cannot confirm subsidy tier
Show warning: "We could not detect your ward class from the bill. Some results may be less accurate."
Proceed with profile-only matching

### Edge Case 7 — Private Hospital Bill
IF hospital_name NOT IN supported_hospitals
THEN:
Show message: "BillSG currently supports bills from SGH, TTSH, NUH, SKH, NTFGH and CGH only."
Still run profile-only scheme matching
Note: Government subsidies do not apply to private hospital bills

### Edge Case 8 — Final Payable = $0
IF final_payable = 0
THEN:
Skip MediFund and ComCare matching
Show message: "Your bill appears to be fully covered. No further financial assistance appears needed."
Still show all auto_applied schemes for information

### Edge Case 9 — MCP Server Unavailable
IF MCP server returns error
THEN:
Fall back to last cached scheme data
Flag in output: "Scheme data may not reflect the latest updates. Last verified: {cached_date}"
Do not block matching — proceed with cached data

### Edge Case 10 — Very High Final Payable (> $10,000)
IF final_payable > 10000
THEN:
Prioritise MediFund Silver (if eligible) at top of unclaimed list
Show urgent callout: "Your remaining bill is significant. A Medical Social Worker can help explore all available assistance options."

## Acceptance Criteria

- GIVEN SC, age 68, Pioneer Generation, PCHI $1,200, Class C bill, pioneer_merdeka_discount = 0
- WHEN scheme matcher runs
- THEN Pioneer Generation → unclaimed (discount missing from bill)
- AND MediFund Silver → unclaimed (age >= 65, SC)
- AND CHAS Blue → unclaimed (PCHI <= $1,500)
- AND Government Subsidy → auto_applied
- AND MediShield Life → auto_applied
- AND summary banner shows correct total

- GIVEN PR, age 45, PCHI $2,000
- WHEN scheme matcher runs
- THEN Pioneer Generation → not_applicable
- AND MediFund → not_applicable
- AND CHAS → not_applicable
- AND Government Subsidy → auto_applied (lower PR tier)
- AND MediShield Life → auto_applied

- GIVEN Foreigner
- WHEN scheme matcher runs
- THEN all schemes → not_applicable
- AND foreigner message shown

- GIVEN is_pioneer = true AND is_merdeka = true
- WHEN scheme matcher runs
- THEN data error flagged
- AND matching halted until resolved

- GIVEN MCP server unavailable
- WHEN scheme matcher runs
- THEN cached data used
- AND warning shown to user
- AND matching still completes

- GIVEN final_payable = 0
- WHEN scheme matcher runs
- THEN MediFund and ComCare skipped
- AND "fully covered" message shown

- GIVEN SC, age 45, PCHI $900, Class B2 bill, medication charges present
- WHEN scheme matcher runs
- THEN CHAS Blue → unclaimed (PCHI $900 <= $1,500)
- AND MAF → unclaimed (medication charges on bill, SC)
- AND MediFund → unclaimed (SC, difficulty paying)
- AND ComCare → unclaimed (PCHI $900 > $800, but still flagged for assessment)
- AND Government Subsidy → auto_applied
- AND MediShield deductible shown as $2,000 (Class B2)

- GIVEN SC, age 72, Merdeka Generation, PCHI $3,000, Class C bill, pioneer_merdeka_discount = 0
- WHEN scheme matcher runs
- THEN Merdeka Generation → unclaimed (discount missing from bill)
- AND MediFund Silver → unclaimed (age >= 65)
- AND CHAS Green → unclaimed (all SCs eligible)
- AND government subsidy shown as 65% tier (PCHI $3,000)

- GIVEN SC, age 25, PCHI $500, Class C bill, final_payable = $4,500
- WHEN scheme matcher runs
- THEN MediFund Junior → not_applicable (age >= 18)
- AND MediFund → unclaimed (SC, high final payable)
- AND ComCare SMTA → unclaimed (PCHI $500 <= $800)
- AND CHAS Blue → unclaimed (PCHI $500 <= $1,500)
- AND ElderFund → not_applicable (age < 30)
- AND Flexi-MediSave → not_applicable (age < 60)

- GIVEN SC, age 15, PCHI $600, Class C bill
- WHEN scheme matcher runs
- THEN MediFund Junior → unclaimed (age < 18)
- AND MediFund Silver → not_applicable (age < 65)
- AND ElderFund → not_applicable (age < 30)
- AND Flexi-MediSave → not_applicable (age < 60)

- GIVEN SC, age 68, PCHI $0, annual_value $15,000, Class C bill
- WHEN scheme matcher runs
- THEN PCHI = 0 edge case triggered
- AND annual_value $15,000 <= $21,000 → treated as lowest income bracket
- AND CHAS Blue → unclaimed
- AND Government Subsidy → auto_applied at 80% tier
- AND MediFund Silver → unclaimed

- GIVEN SC, age 80, Pioneer Generation, PCHI $800, Class C bill, final_payable = $15,000
- WHEN scheme matcher runs
- THEN final_payable > $10,000 → urgent callout shown
- AND MediFund Silver → unclaimed at TOP of list (highest priority)
- AND Pioneer Generation → unclaimed if discount missing
- AND ElderFund → flagged for assessment (age >= 30, PCHI <= $1,500)
- AND urgent message shown: "Your remaining bill is significant. A Medical Social Worker can help."

- GIVEN SC, age 55, has_ip_rider = true, ip_rider_date = 'after_april_2026', Class B2 bill
- WHEN scheme matcher runs
- THEN IP rider warning shown: "Your IP rider cannot cover your minimum deductible of $2,000"
- AND MediShield deductible shown as $2,000 (Class B2)
- AND normal scheme matching continues alongside

- GIVEN SC, age 40, PCHI $5,000, Class A bill
- WHEN scheme matcher runs
- THEN Government Subsidy → not_applicable (Class A is non-subsidised)
- AND CHAS Green → unclaimed (all SCs eligible)
- AND MediShield Life → auto_applied
- AND MediFund → not_applicable (not a subsidised patient)
- AND note shown: "Most government schemes apply to subsidised wards (B2/C). Consider Class B2 for future admissions."

- GIVEN Path A user (no bill uploaded)
- WHEN scheme matcher runs with profile only
- THEN data_source = 'profile_only'
- AND bill cross-reference checks skipped
- AND banner shown: "Upload your bill for more accurate scheme matching"
- AND all scheme matching based on profile fields only
- AND no pioneer_merdeka_discount check (no bill to check against)

- GIVEN SC, age 35, PCHI $2,000, bill from Gleneagles (private hospital)
- WHEN scheme matcher runs
- THEN private hospital message shown
- AND Government Subsidy → not_applicable (private hospital)
- AND MediFund → not_applicable (not a subsidised patient)
- AND profile-only matching still runs for information
- AND CHAS → unclaimed (still applicable at GP clinics regardless)

- GIVEN SC, age 68, Class C bill, final_payable = $0
- WHEN scheme matcher runs
- THEN MediFund → skipped
- AND ComCare → skipped
- AND "fully covered" message shown
- AND auto_applied schemes still displayed for user information

- GIVEN valid profile, MCP server returns 503 error
- WHEN scheme matcher runs
- THEN cached data used automatically
- AND warning shown: "Scheme data may not reflect latest updates. Last verified: {cached_date}"
- AND matching completes normally with cached data
- AND all scheme cards show cached verified_date

- GIVEN SC, age 62, PCHI $1,200, no bill, Flexi-MediSave eligible
- WHEN scheme matcher runs with profile only
- THEN Flexi-MediSave → unclaimed (age >= 60, SC)
- AND withdrawal limit shown: $400/year
- AND action: "You can use Flexi-MediSave at polyclinics, public SOCs and CHAS GP clinics"

- GIVEN SC, age 18, PCHI $600, Class C bill
- WHEN scheme matcher runs
- THEN MediFund Junior → not_applicable (age = 18, no longer a child)
- AND MediFund → unclaimed (SC, difficulty paying)

## Notes
- Scheme matching must complete within 10 seconds
- Results are cached per session — re-clicking Match Schemes does not re-run the agent
- All scheme cards must show source_url and verified_date
- Disclaimer must appear on every scheme card and summary banner
- Agent never overrides eligibility_matrix.md rules — matrix is always ground truth
- Scheme matching runs after bill explainer completes — Match Schemes button disabled until Explain My Bill is done