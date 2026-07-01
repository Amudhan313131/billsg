# Tasks: Scheme Matcher

## Task 1: Create MCP server client
- [ ] Create `lib/scheme-matcher/mcp-client.ts`
- [ ] Implement GET /schemes, /chas-tiers, /ip-rider-rules, /medisave-limits
- [ ] Implement fallback to cached data when MCP server unavailable
- [ ] Store last_cached timestamp for warning display
- [ ] Handle timeout (10s) and retry logic

## Task 2: Implement data source determination
- [ ] Create `lib/scheme-matcher/data-source.ts`
- [ ] Check if ParsedBill exists with confidence >= 0.5
- [ ] Return 'profile_and_bill' or 'profile_only' flag
- [ ] Generate "Upload your bill" banner message when profile_only

## Task 3: Implement bill cross-reference checks (Path B)
- [ ] Create `lib/scheme-matcher/bill-crossref.ts`
- [ ] Check 1: Compare expected subsidy % with actual (flag if mismatch > 5%)
- [ ] Check 2: Pioneer/Merdeka discount = 0 when expected → move to unclaimed
- [ ] Check 3: Verify MediShield deductible by ward class
- [ ] Check 4: Flag MAF if medication items present + SC/PR
- [ ] Check 5: Flag MediFund/ComCare based on final_payable thresholds

## Task 4: Implement LLM reason generation
- [ ] Create `lib/scheme-matcher/reason-generator.ts`
- [ ] Integrate with Amazon Bedrock for plain English reason per scheme
- [ ] Enforce rules: never guarantee eligibility, always cite source
- [ ] Handle batch generation for all schemes in single call
- [ ] Include potential_savings estimation where calculable

## Task 5: Implement action plan template filling
- [ ] Create `lib/scheme-matcher/action-plan-filler.ts`
- [ ] Import all 13 templates from action-plan spec
- [ ] Select correct template by scheme_id
- [ ] Handle age-based MediFund selection (Junior for < 18)
- [ ] Handle ComCare SMTA vs LTA selection
- [ ] Return null for auto_applied and not_applicable schemes

## Task 6: Implement IP rider flag and summary banner
- [ ] Create `lib/scheme-matcher/ip-rider-flag.ts`
- [ ] Generate warning/info IPRiderFlag based on ip_rider_date
- [ ] Create `lib/scheme-matcher/summary.ts`
- [ ] Calculate total_potential_savings and unclaimed_scheme_count
- [ ] For MediFund/ComCare: use final_payable as potential_savings
- [ ] Generate summary message and disclaimer

## Task 7: Implement all edge case handling
- [ ] Foreigner: all not_applicable + message
- [ ] PR: restrict to eligible schemes only
- [ ] Age < 18: MediFund Junior instead of Silver
- [ ] PCHI = 0: use annual_value
- [ ] Pioneer+Merdeka both true: halt with data error
- [ ] Unknown ward class: profile-only + warning
- [ ] Private hospital: message + profile-only
- [ ] Final payable = 0: skip MediFund/ComCare + "fully covered"
- [ ] Final payable > $10,000: urgent callout + prioritise
- [ ] MCP unavailable: use cached + warning

## Task 8: Create main orchestrator and API endpoint
- [ ] Create `lib/scheme-matcher/index.ts` orchestrating all steps
- [ ] Create API route `app/api/match-schemes/route.ts`
- [ ] Implement session-based caching (don't re-run on repeat)
- [ ] Ensure total execution within 10 seconds
- [ ] Return complete SchemeMatchResult object

## Task 9: Build Match Schemes results page
- [ ] Create `app/match/page.tsx` (scheme-matcher owns this task for API/lib; ui-flow/tasks.md Task 4 owns the page UI layout — coordinate to avoid duplication)
- [ ] Render three-column layout: Already Applied / Unclaimed / Not Applicable
- [ ] Not Applicable collapsed by default
- [ ] Each card shows: scheme name, status badge, reason, source_url, verified_date, potential_savings
- [ ] Show IP rider flag card at top if applicable
- [ ] Show system messages (foreigner, private hospital, fully covered, urgent callout, cached data warning, profile-only banner)
- [ ] Render Summary Banner (sticky/fixed) with expand functionality
- [ ] Show disclaimer on page and every card
- [ ] Mobile responsive (stack columns on phone)
