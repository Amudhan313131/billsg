# Tasks: Bill Explainer

## Task 1: Create prompt template and LLM integration
- [ ] Create `lib/bill-explainer/prompt.ts` with the exact prompt template
- [ ] Create `lib/bill-explainer/bedrock.ts` for Amazon Bedrock API integration
- [ ] Implement batch calling — send all line items in a single API call
- [ ] Parse LLM response and map explanations back to line items

## Task 2: Implement pre-generation validation hook
- [ ] Create `lib/bill-explainer/validate.ts`
- [ ] Check: description not empty, amount is valid number
- [ ] Check: ward_class is not 'unknown'
- [ ] Check: ParsedBill has at least 3 line items
- [ ] Return fallback message for failed items: "Could not explain this item. Please check your original bill."

## Task 3: Implement April 2026 IP rider callout logic
- [ ] Create `lib/bill-explainer/ip-rider-check.ts`
- [ ] If after_april_2026: generate warning with deductible amount based on ward class
- [ ] If before_april_2026: generate info callout about grandfathering
- [ ] If has_ip_rider = false: return null (skip)
- [ ] Return structured callout object for UI rendering

## Task 4: Create main explainer orchestrator and API endpoint
- [ ] Create `lib/bill-explainer/index.ts` orchestrating validation → LLM call → IP check
- [ ] Create API route `app/api/explain-bill/route.ts`
- [ ] Implement session-based caching (don't re-call LLM on repeat requests)
- [ ] Return updated ParsedBill with plain_english fields filled
- [ ] Include IP rider callout in response if applicable

## Task 5: Build Explain My Bill results page
- [ ] Create `app/explain/page.tsx` (bill-explainer owns the API route and lib logic; ui-flow/tasks.md Task 3 owns the page UI layout — coordinate to avoid duplication)
- [ ] Render each line item as a card (original description + amount | plain_english)
- [ ] Highlight deductions in green with positive framing
- [ ] Show IP rider callout banner above line items (if applicable)
- [ ] Show "Match Schemes" button (disabled until all explanations loaded, enabled after)
- [ ] Show disclaimer: "These explanations are for informational purposes only..."
- [ ] Handle loading state with skeleton cards
- [ ] Handle individual item failures gracefully
