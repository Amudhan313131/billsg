# Requirements: UI Flow

## Overview
This spec defines the page-level UI structure, navigation, states, and message placement for BillSG. It follows product.md's 5-phase structure: Onboarding → Bill Upload → Explain My Bill → Match Schemes → Summary Banner + Action Plan. It defines UI/UX structure only — no business logic or eligibility rules.

The Onboarding wizard and Entitlement Dashboard are fully specified in the onboarding spec — this spec covers Landing, Bill Upload, Explain My Bill, Match Schemes, and Summary Banner pages.

## Requirements

### Requirement 1: Landing Page
**User Story:** As a first-time visitor, I want to understand what BillSG does and get started quickly.

#### Acceptance Criteria
1. GIVEN a visitor lands on BillSG THEN headline shown: "Know Your Bill. Claim What's Yours."
2. GIVEN the landing page THEN subheadline references Uncle Tan's story
3. GIVEN the landing page THEN single CTA button labeled "Get Started"
4. GIVEN the landing page THEN no login, signup, or account creation required
5. GIVEN the landing page THEN it is fully static with no server interaction

### Requirement 2: Bill Upload Page
**User Story:** As a patient, I want to upload my hospital bill and see it processed.

#### Acceptance Criteria
1. GIVEN the Bill Upload page WHEN empty state THEN drag-and-drop zone shown with format hints (JPG, PNG, PDF, max 10MB)
2. GIVEN the Bill Upload page WHEN empty state THEN "Explain My Bill" button visible but disabled
3. GIVEN a file is uploading THEN progress bar animates with "Uploading and reading your bill…" text
4. GIVEN bill parsed successfully THEN confirmation shows hospital name and ward class
5. GIVEN bill parsed successfully THEN "Explain My Bill" button becomes enabled
6. GIVEN a parsing error THEN error message shown inline (per bill-parser error handling table)
7. GIVEN a warning (low confidence, amount mismatch) THEN warning shown but "Explain My Bill" still enabled (non-blocking)

### Requirement 3: Explain My Bill Results Page
**User Story:** As a patient, I want to see every charge explained in plain English.

#### Acceptance Criteria
1. GIVEN Explain My Bill triggered WHEN loading THEN skeleton cards shown with "Explaining your bill…"
2. GIVEN explanations complete THEN each line item card shows original description + amount alongside plain_english
3. GIVEN a deduction item THEN card highlighted in green with positive framing
4. GIVEN has_ip_rider = true THEN IP rider callout banner shown ABOVE line items
5. GIVEN explanations complete THEN "Match Schemes" button becomes enabled
6. GIVEN ward_class = 'unknown' THEN yellow warning banner shown below page title
7. GIVEN the page THEN disclaimer shown: "These explanations are for informational purposes only..."

### Requirement 4: Match Schemes Results Page
**User Story:** As a patient, I want to see all schemes categorised clearly.

#### Acceptance Criteria
1. GIVEN scheme matching complete THEN three columns rendered: ✅ Already Applied / ⚠️ Unclaimed / ❌ Not Applicable
2. GIVEN Not Applicable column THEN collapsed by default, expandable
3. GIVEN each scheme card THEN shows: name, status badge, reason, source_url, verified_date, potential_savings
4. GIVEN IP rider flag THEN standalone card at top of results (warning or info style)
5. GIVEN data_source = 'profile_only' THEN "Upload your bill for more accurate scheme matching" banner shown
6. GIVEN every scheme card THEN source_url and verified_date displayed
7. GIVEN the page THEN disclaimer shown: "This is guidance only. Always consult a Medical Social Worker before taking action."

### Requirement 5: System Messages Placement
**User Story:** As a patient, I want clear feedback for all error and edge-case conditions.

#### Acceptance Criteria
1. GIVEN file too large / unsupported format / no line items / non-bill document THEN error on Bill Upload page (source: bill-parser)
2. GIVEN unknown ward class THEN warning on Explain My Bill page (source: scheme_matcher Edge Case 6)
3. GIVEN private hospital bill THEN message on Match Schemes page (source: scheme_matcher Edge Case 7)
4. GIVEN final_payable = 0 THEN "fully covered" on Match Schemes page (source: scheme_matcher Edge Case 8)
5. GIVEN MCP server unavailable THEN cached-data warning on Match Schemes page (source: scheme_matcher Edge Case 9)
6. GIVEN final_payable > $10,000 THEN urgent callout at TOP of Unclaimed column (source: scheme_matcher Edge Case 10)
7. GIVEN Foreigner THEN message replacing columns on Match Schemes page (source: scheme_matcher Edge Case 1)

### Requirement 6: Summary Banner + Expandable Action Plans
**User Story:** As a patient, I want to see my total potential savings and actionable next steps.

#### Acceptance Criteria
1. GIVEN scheme matching complete THEN Summary Banner auto-appears below columns
2. GIVEN the banner THEN text: "You may be eligible to claim up to ${total} across ${count} schemes"
3. GIVEN user clicks expand THEN action plans shown for each unclaimed scheme (from action-plan spec)
4. GIVEN each action plan THEN shows: where_to_go, what_to_bring, what_to_say, contact, estimated_processing_time
5. GIVEN no unclaimed schemes THEN banner does not appear
6. GIVEN final_payable = 0 THEN banner replaced with "fully covered" message

### Requirement 7: Navigation and Global Elements
**User Story:** As a patient, I want to navigate back and forth through the flow easily.

#### Acceptance Criteria
1. GIVEN any page after onboarding THEN breadcrumb shows: Dashboard → Upload → Explain → Match
2. GIVEN completed steps THEN they are clickable to return
3. GIVEN the nav bar THEN BillSG logo links to Landing, no login UI
4. GIVEN all pages THEN mobile-first responsive, usable on phone
5. GIVEN three-column Match layout THEN stacks vertically on mobile

### Requirement 8: Button Gating Rules
**User Story:** As a patient, I want buttons enabled/disabled based on where I am in the flow.

#### Acceptance Criteria
1. GIVEN "Get Started" on Landing THEN always enabled
2. GIVEN "Upload Your Hospital Bill" on Dashboard THEN always enabled
3. GIVEN "Explain My Bill" on Bill Upload THEN disabled until bill successfully parsed
4. GIVEN "Match Schemes" on Explain page THEN disabled until all explanations complete (per scheme_matcher Notes)
5. GIVEN results cached per session THEN re-clicking Explain or Match does NOT re-call LLM/agent

### Requirement 9: IP Rider Callout Design Decision
**User Story:** As the system, I want a clear rule for where the IP rider callout appears.

#### Acceptance Criteria
1. GIVEN the IP rider callout THEN it renders on Explain My Bill page as a banner (per bill_explainer)
2. GIVEN the Match Schemes page THEN IP rider info renders as a separate IPRiderFlag card (per scheme_matcher output interface)
3. GIVEN this design decision THEN it avoids showing the same warning twice in identical visual treatment
