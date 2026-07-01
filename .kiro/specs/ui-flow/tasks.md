# Tasks: UI Flow

## Task 1: Build Landing page
- [ ] Create `app/page.tsx` (replace boilerplate) with landing layout
- [ ] Add headline: "Know Your Bill. Claim What's Yours."
- [ ] Add subheadline with Uncle Tan story
- [ ] Add "Get Started" CTA button linking to `/onboarding`
- [ ] Add footer with "What is BillSG?" + disclaimer link
- [ ] Ensure fully static (no data fetching, no loading state)
- [ ] Mobile-responsive layout

## Task 2: Build Bill Upload page with all states
- [ ] Create `app/upload/page.tsx`
- [ ] Build drag-and-drop zone with "Browse files" button
- [ ] Show accepted format hints (JPG, PNG, PDF, max 10MB)
- [ ] Implement progress bar for loading state
- [ ] Show cancel button during upload
- [ ] On success: display hospital name + ward class confirmation
- [ ] On error: show inline error message above upload zone
- [ ] "Explain My Bill" button: disabled until parse success
- [ ] Handle all 6 error messages from bill-parser spec
- [ ] Handle 2 warning messages (non-blocking)
- [ ] Back link to Dashboard

## Task 3: Build Explain My Bill results page
- [ ] Create `app/explain/page.tsx` (ui-flow owns the page UI; bill-explainer spec owns `app/api/explain-bill/route.ts` and all `lib/bill-explainer/` logic)
- [ ] Loading state: skeleton cards + "Explaining your bill…"
- [ ] Success state: line item cards (description + amount | plain_english)
- [ ] Highlight deduction items in green
- [ ] Show IP rider callout banner above cards (conditional on profile)
- [ ] Show unknown ward class warning banner (conditional)
- [ ] "Match Schemes" button: disabled until all explanations complete
- [ ] Show disclaimer below cards
- [ ] Handle per-item failures gracefully
- [ ] Back link to Upload page

## Task 4: Build Match Schemes results page with three-column layout
- [ ] Create `app/match/page.tsx` (ui-flow owns the page UI; scheme-matcher spec owns `app/api/match-schemes/route.ts` and all `lib/scheme-matcher/` logic)
- [ ] Three columns: Already Applied / Unclaimed / Not Applicable
- [ ] Not Applicable collapsed by default
- [ ] Each card: name, status badge, reason, source_url link, verified_date, potential_savings
- [ ] Colour-coded badges with icons (not colour-only for accessibility)
- [ ] IP rider flag card at top if applicable
- [ ] Mobile: stack columns vertically
- [ ] Show all system messages in correct placements per design

## Task 5: Build Summary Banner with expandable action plans
- [ ] Implement sticky/fixed banner at bottom of Match page
- [ ] Banner text: "You may be eligible to claim up to $X across N schemes"
- [ ] "See Action Plans" expand button
- [ ] Expanded panel: list each unclaimed scheme's ActionPlan fields
- [ ] what_to_say in callout/quote box styling
- [ ] "Collapse" button to return to banner
- [ ] Hide banner if no unclaimed schemes or final_payable = 0
- [ ] Disclaimer on banner and each action plan card

## Task 6: Implement global navigation and breadcrumb
- [ ] Add BillSG logo to nav bar linking to Landing
- [ ] Implement breadcrumb: Dashboard → Upload → Explain → Match
- [ ] Completed steps are clickable, future steps greyed out
- [ ] No login/account UI anywhere
- [ ] Ensure session-based navigation works without auth

## Task 7: Implement all system message components
- [ ] Create reusable `Banner` component (warning/info/error/success variants)
- [ ] Wire bill-parser errors to Bill Upload page error state
- [ ] Wire scheme_matcher edge case messages to Match page correct placements
- [ ] Handle Foreigner message (replaces columns entirely)
- [ ] Handle urgent callout for > $10K (red, top of Unclaimed column)
- [ ] Handle profile-only banner with "Upload Bill" link
- [ ] Handle MCP unavailable warning with cached_date
