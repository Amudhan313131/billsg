# Requirements: Bill Explainer

## Overview
The bill explainer takes the parsed bill from the bill parser and generates plain English explanations for every line item. This is Phase 3 of the BillSG flow. Triggered by the "Explain My Bill" button. Uses Amazon Bedrock (Claude) to generate explanations.

## Requirements

### Requirement 1: Plain English Explanations
**User Story:** As a patient, I want every line item on my bill explained in plain English so I understand what I'm being charged for.

#### Acceptance Criteria
1. GIVEN a parsed bill with N line items WHEN "Explain My Bill" is triggered THEN all N `plain_english` fields are filled
2. GIVEN any explanation WHEN generated THEN it is maximum 2 sentences
3. GIVEN any explanation WHEN generated THEN it uses plain English understandable by a 65-year-old with no medical knowledge
4. GIVEN any explanation WHEN generated THEN it never contains dollar amounts from the bill
5. GIVEN any explanation WHEN generated THEN it never contains advice language ("you should", "you must")
6. GIVEN a deduction line item WHEN explained THEN the explanation ends positively — mentions bill reduction

### Requirement 2: LLM Prompt Rules
**User Story:** As the system, I want strict LLM guardrails so explanations are safe and consistent.

#### Acceptance Criteria
1. GIVEN the LLM WHEN explaining THEN it always explains what the charge IS, not what to do about it
2. GIVEN a deduction WHEN explained THEN it explains what was paid on the user's behalf
3. GIVEN a ward_charges item WHEN explained THEN explanation mentions ward class and number of nights
4. GIVEN a government_subsidy item WHEN explained THEN explanation mentions bill reduction positively

### Requirement 3: April 2026 IP Rider Check
**User Story:** As a patient with an IP rider, I want to be warned about how new rules affect my coverage.

#### Acceptance Criteria
1. GIVEN has_ip_rider = true AND ip_rider_date = 'after_april_2026' WHEN Explain My Bill runs THEN warning callout appears: "Your IP rider was purchased after April 2026. Under new MOH rules, it cannot cover your minimum deductible..."
2. GIVEN has_ip_rider = true AND ip_rider_date = 'before_april_2026' WHEN Explain My Bill runs THEN info callout appears about grandfathering
3. GIVEN has_ip_rider = false WHEN Explain My Bill runs THEN IP rider check is skipped entirely

### Requirement 4: Pre-Generation Validation Hook
**User Story:** As the system, I want to validate line items before sending to the LLM to avoid wasted API calls.

#### Acceptance Criteria
1. GIVEN a line item with empty description WHEN hook runs THEN that item is skipped with `plain_english = "Could not explain this item. Please check your original bill."`
2. GIVEN a line item with invalid amount WHEN hook runs THEN that item is skipped
3. GIVEN ward_class = 'unknown' WHEN hook runs THEN skip all items with `plain_english = "Could not explain this item. Please check your original bill."`
4. GIVEN ParsedBill has fewer than 3 line items WHEN hook runs THEN all items are skipped with fallback message

### Requirement 5: Caching and Gating
**User Story:** As a patient, I want to not be charged twice if I re-click the button, and I want the next step unlocked.

#### Acceptance Criteria
1. GIVEN explanations are cached WHEN user re-clicks "Explain My Bill" THEN LLM is NOT re-called
2. GIVEN Explain My Bill completes WHEN page renders THEN "Match Schemes" button becomes enabled
3. GIVEN Explain My Bill has NOT completed WHEN page renders THEN "Match Schemes" button remains disabled

### Requirement 6: Disclaimer
**User Story:** As a patient, I want to know these explanations are informational only.

#### Acceptance Criteria
1. GIVEN the Explain My Bill page WHEN rendered THEN disclaimer shown: "These explanations are for informational purposes only. Always consult a Medical Social Worker or healthcare professional for advice."
