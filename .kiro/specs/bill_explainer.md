# Bill Explainer Spec

## Overview
The bill explainer takes the parsed bill from bill_parser.md and generates plain English explanations for every line item. This is Phase 3 of the BillSG flow. Triggered by the "Explain My Bill" button. Uses Amazon Bedrock (Claude) to generate explanations.

## Input
Parsed bill JSON from bill_parser.md:
- All line items with category, description, amount
- Ward class
- All deduction amounts
- final_payable

## Output
Same ParsedBill JSON with plain_english field filled for every line item.

## LLM Prompt Rules
The LLM must follow these rules when explaining each line item:

1. Maximum 2 sentences per explanation
2. Use plain English understandable by a 65-year-old with no medical knowledge
3. Never give financial or medical advice
4. Never say "you should" or "you must"
5. Always explain what the charge IS, not what to do about it
6. If the line item is a deduction, explain what was paid on the user's behalf
7. Never mention specific dollar amounts from the bill in the explanation
8. Always end deduction explanations positively — "this reduced your bill"

## Prompt Template
You are a Singapore healthcare billing assistant helping patients understand their hospital bills.
Explain this line item in plain English. Maximum 2 sentences.

Do not give advice. Do not mention dollar amounts.

If it is a deduction (negative amount), explain what was paid on the patient's behalf.
Line item: {description}

Category: {category}

Is deduction: {is_deduction}

Ward class: {ward_class}
Respond with only the plain English explanation. Nothing else.

## Example Explanations Per Category

| Category | Original Text | Plain English |
|---|---|---|
| ward_charges | "B2 Ward Charges x 3D" | "This is the daily cost of your hospital bed and nursing care for 3 nights in a Class B2 subsidised ward." |
| surgical_fees | "Table 5C Surgical Procedure" | "This is the fee for your surgical operation, categorised by complexity under Singapore's standard surgical fee table." |
| medication | "Medication Charges" | "These are the charges for medicines prescribed during your hospital stay." |
| investigations | "Laboratory Tests" | "These are the fees for blood tests, scans, or other diagnostic tests done during your stay." |
| government_subsidy | "Govt Subsidy" | "This is the government subsidy automatically applied to your bill based on your income level — it reduced what you owe." |
| medishield_deduction | "MSL Payout" | "This is the amount your MediShield Life national health insurance paid towards your bill — it reduced what you owe." |
| medisave_withdrawal | "MediSave Withdrawal" | "This is the amount withdrawn from your CPF MediSave savings account to pay part of your bill." |
| pioneer_merdeka_discount | "PG Discount" | "This is the additional subsidy applied because you are a Pioneer Generation member — it reduced your bill by an extra 50%." |

## April 2026 IP Rider Check
Runs alongside bill explanation. Separate from line item explanations.

Trigger conditions:
- GIVEN user.has_ip_rider = true AND user.ip_rider_date = 'after_april_2026'
- THEN show callout: "Your IP rider was purchased after April 2026. Under new MOH rules, it cannot cover your minimum deductible of ${deductible_amount}. This means you are responsible for this amount before your insurance pays out."

- GIVEN user.has_ip_rider = true AND user.ip_rider_date = 'before_april_2026'
- THEN show callout: "Your existing IP rider is grandfathered under the old rules. However, be aware that from April 2026, new riders can no longer cover the minimum deductible. Contact your insurer if you plan to change your rider."

- GIVEN user.has_ip_rider = false
- THEN skip IP rider check entirely

## Pre-Generation Hook
Before sending any line item to the LLM, the validation hook checks:
- line_item.description is not empty
- line_item.amount is a valid number
- ward_class is not 'unknown'
- ParsedBill has at least 3 line items

If any check fails → skip that line item and flag it with plain_english = "Could not explain this item. Please check your original bill."

## Acceptance Criteria

- GIVEN a parsed bill with 10 line items
- WHEN Explain My Bill is triggered
- THEN all 10 plain_english fields are filled
- AND each explanation is maximum 2 sentences
- AND no explanation contains dollar amounts
- AND no explanation contains advice language ("you should", "you must")

- GIVEN a ward_charges line item
- WHEN explained
- THEN explanation mentions ward class and number of nights

- GIVEN a government_subsidy line item (is_deduction = true)
- WHEN explained
- THEN explanation ends positively — mentions bill reduction

- GIVEN user.has_ip_rider = true AND ip_rider_date = 'after_april_2026'
- WHEN Explain My Bill runs
- THEN April 2026 IP rider callout appears above line items

- GIVEN a line item with empty description
- WHEN hook runs
- THEN that line item is skipped
- AND plain_english = "Could not explain this item. Please check your original bill."

## Notes
- This step must complete before Match Schemes button is enabled
- All explanations generated in a single Bedrock API call (batch) for efficiency
- plain_english fields are cached — re-clicking Explain My Bill does not re-call the LLM
- Disclaimer shown below all explanations: "These explanations are for informational purposes only. Always consult a Medical Social Worker or healthcare professional for advice."