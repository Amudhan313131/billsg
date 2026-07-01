# Design: Bill Explainer

## Overview
The bill explainer uses Amazon Bedrock (Claude) to generate plain English explanations for each line item on a parsed hospital bill. It includes a pre-generation validation hook and the April 2026 IP rider callout.

## Input
ParsedBill JSON from bill-parser: all line items with category, description, amount, ward class, deduction amounts, final_payable.

## Output
Same ParsedBill JSON with `plain_english` field filled for every line item.

## LLM Prompt Template

```
You are a Singapore healthcare billing assistant helping patients understand their hospital bills.
Explain this line item in plain English. Maximum 2 sentences.

Do not give advice. Do not mention dollar amounts.

If it is a deduction (negative amount), explain what was paid on the patient's behalf.

Line item: {description}
Category: {category}
Is deduction: {is_deduction}
Ward class: {ward_class}

Respond with only the plain English explanation. Nothing else.
```

## Example Explanations Per Category

| Category | Original | Plain English |
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

- `has_ip_rider = true AND ip_rider_date = 'after_april_2026'` → warning callout with deductible amount
- `has_ip_rider = true AND ip_rider_date = 'before_april_2026'` → info callout about grandfathering
- `has_ip_rider = false` → skip entirely

## Pre-Generation Hook

Before sending any line item to LLM, validate:
- `line_item.description` is not empty
- `line_item.amount` is a valid number
- `ward_class` is not 'unknown'
- ParsedBill has at least 3 line items

If any check fails → skip item with `plain_english = "Could not explain this item. Please check your original bill."`

## Architecture
- All explanations generated in a single Bedrock API call (batch) for efficiency
- Results cached per session — re-clicking does not re-call LLM
- File location: `lib/bill-explainer/index.ts`
- Prompt template: `lib/bill-explainer/prompt.ts`
- Hook validation: `lib/bill-explainer/validate.ts`

## Gating
This step must complete before "Match Schemes" button is enabled (per scheme_matcher spec).
