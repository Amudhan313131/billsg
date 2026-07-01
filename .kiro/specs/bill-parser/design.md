# Design: Bill Parser

## Overview
The bill parser processes uploaded hospital bills through AWS S3 storage and AWS Textract OCR, then maps raw text into a standardised ParsedBill JSON schema.

## Data Types

```typescript
interface ParsedBill {
  hospital_name: string
  bill_reference: string
  admission_date: string         // ISO format: YYYY-MM-DD
  discharge_date: string         // ISO format: YYYY-MM-DD
  ward_class: 'A' | 'B1' | 'B2' | 'B2+' | 'C' | 'unknown'
  line_items: LineItem[]
  subtotal_before_subsidies: number
  government_subsidy: number
  medishield_deduction: number
  medisave_withdrawal: number
  other_deductions: number
  final_payable: number
  currency: 'SGD'
  parsed_at: string              // ISO timestamp
  confidence_score: number       // 0-1, Textract confidence
}

interface LineItem {
  id: string
  category: LineItemCategory
  description: string            // Original text from bill
  amount: number                 // In SGD
  plain_english: string          // AI-generated explanation (empty at parse time)
  is_deduction: boolean          // true if this reduces the bill
}

type LineItemCategory =
  | 'ward_charges'
  | 'surgical_fees'
  | 'medication'
  | 'consultation'
  | 'investigations'
  | 'implants'
  | 'government_subsidy'
  | 'medishield_deduction'
  | 'medisave_withdrawal'
  | 'pioneer_merdeka_discount'
  | 'other_deduction'
  | 'miscellaneous'
```

## Supported Hospitals
SGH, TTSH, NUH, SKH, NTFGH, CGH

## Parsing Pipeline

### Step 1 — Upload to S3
- Key format: `bills/{session_id}/{timestamp}.{ext}`
- Max 10MB, JPG/PNG/PDF only

### Step 2 — AWS Textract
- Images: DetectDocumentText API
- PDFs: StartDocumentAnalysis (async)
- Flag blocks with confidence < 0.8

### Step 3 — Line Item Extraction (Keyword Matching)
| Keywords | Category |
|---|---|
| "ward", "bed", "accommodation" | ward_charges |
| "surgery", "operation", "procedure", "table" | surgical_fees |
| "medication", "drug", "pharmacy", "medicine" | medication |
| "consultation", "visit", "attendance" | consultation |
| "lab", "test", "scan", "x-ray", "MRI", "CT" | investigations |
| "implant", "prosthesis", "device" | implants |
| "subsidy", "government" | government_subsidy |
| "MediShield", "MSL", "MSHL" | medishield_deduction |
| "MediSave", "MSV", "CPF" | medisave_withdrawal |
| "Pioneer", "PG", "Merdeka", "MG" | pioneer_merdeka_discount |
| "MediFund", "MAF", "assistance" | other_deduction |

### Step 4 — Amount Extraction
- Regex: `/\$?[\d,]+\.?\d{0,2}/`
- Remove `$` and `,` → convert to number
- Negative amounts or amounts in brackets → `is_deduction = true`

### Step 5 — Ward Class Detection
- "Class C" / "Ward C" → 'C'
- "Class B2+" → 'B2+'
- "Class B2" → 'B2'
- "Class B1" → 'B1'
- "Class A" → 'A'
- Not found → 'unknown'

### Step 6 — Validation
- `final_payable = subtotal_before_subsidies - all deductions` (validate ± 5%)
- At least one line item extracted
- Ward class not 'unknown' (warn if so)
- Confidence = average of all Textract block scores

## Error Handling
| Error | Response |
|---|---|
| File > 10MB | "File too large. Please upload a file under 10MB." |
| Unsupported format | "Please upload a JPG, PNG, or PDF file." |
| Confidence < 0.5 | Warning (non-blocking) |
| No line items | "Could not read bill. Please ensure the bill is flat and well-lit." |
| Amount mismatch > 5% | Warning (non-blocking) |
| Non-bill document | "This does not appear to be a hospital bill." |

## Notes
- `plain_english` field populated by LLM in bill-explainer step, not here
- Parser is stateless — same bill always produces same output
- Session ID ties parsed bill to user's onboarding profile
