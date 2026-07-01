# Design: Scheme Matcher

## Overview
The Scheme Matching Agent orchestrates: MCP server query → eligibility matrix run → bill cross-reference → LLM reason generation → action plan filling → summary calculation. It produces a `SchemeMatchResult` object for the UI.

## Data Types

```typescript
interface SchemeMatchResult {
  schemes: SchemeCard[]
  summary: SummaryBanner
  ip_rider_flag: IPRiderFlag | null
  matched_at: string
  data_source: 'profile_only' | 'profile_and_bill'
}

interface SchemeCard {
  scheme_id: string
  scheme_name: string
  status: 'auto_applied' | 'unclaimed' | 'not_applicable'
  reason: string
  potential_savings: number | null
  action_plan: ActionPlan | null
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
  message: string
  disclaimer: string
}

interface IPRiderFlag {
  type: 'warning' | 'info'
  message: string
  source_url: string
}
```

## Agent Workflow — 9 Steps

### Step 1 — Query MCP Server
- GET /schemes, /chas-tiers, /ip-rider-rules, /medisave-limits
- If unavailable → fall back to cached data → flag in output

### Step 2 — Determine Data Source
- ParsedBill exists AND confidence >= 0.5 → profile_and_bill
- Otherwise → profile_only → show "Upload your bill" banner

### Step 3 — Run Eligibility Matrix
- Deterministic, no AI
- For each scheme: `checkEligibility(userProfile, scheme)`

### Step 4 — Cross-Reference With Bill (Path B only)
- Check 1: Government Subsidy tier correct (mismatch > 5% → flag)
- Check 2: Pioneer/Merdeka discount applied (if 0 on bill → unclaimed)
- Check 3: MediShield deductible correct by ward class
- Check 4: MAF eligibility (medication items + SC/PR)
- Check 5: MediFund/ComCare triggers (final_payable > thresholds)

### Step 5 — Categorise Every Scheme
- auto_applied / unclaimed / not_applicable (exactly one per scheme)

### Step 6 — Generate Plain English Reasons (LLM)
- Never guarantee eligibility
- Always cite source_url and verified_date
- Always end with disclaimer

### Step 7 — Fill Action Plan Templates
- From action-plan spec templates
- Only for unclaimed schemes

### Step 8 — Run IP Rider Flag
- Separate from scheme matching
- Runs if has_ip_rider = true

### Step 9 — Calculate Summary Banner
- `total_potential_savings = sum(unclaimed.potential_savings)`
- For MediFund/ComCare: potential_savings = final_payable (conservative)
- Message: "You may be eligible to claim up to ${total} across ${count} schemes"
- Disclaimer: "This is guidance only. Always consult a Medical Social Worker before taking action."

## Edge Cases (11 defined)
1. Foreigner → all not_applicable + message
2. PR → limited schemes + SC-only messaging
3. Age < 18 → MediFund Junior
4. PCHI = 0 → use annual_value
5. Pioneer+Merdeka both true → data error, halt
6. Unknown ward class → profile-only matching + warning
7. Private hospital → message + profile-only
8. Final payable = $0 → skip MediFund/ComCare + "fully covered"
9. MCP unavailable → cached data + warning
10. Final payable > $10,000 → urgent callout + prioritise MediFund Silver
11. Threshold changed since last visit → use new data, show notice

## Architecture
- File location: `lib/scheme-matcher/index.ts`
- MCP client: `lib/scheme-matcher/mcp-client.ts`
- LLM integration: `lib/scheme-matcher/reason-generator.ts`
- Action plan filler: `lib/scheme-matcher/action-plan-filler.ts`
- Completes within 10 seconds
- Results cached per session
