# Bill Parser Spec

## Overview
The bill parser takes a Singapore public hospital bill (uploaded as image or PDF) and extracts all line items into a standardised JSON schema. AWS Textract handles the OCR. The parser then maps the raw text output into structured data.

## Supported Bill Formats
- SGH (Singapore General Hospital)
- TTSH (Tan Tock Seng Hospital)
- NUH (National University Hospital)
- SKH (Sengkang General Hospital)
- NTFGH (Ng Teng Fong General Hospital)
- CGH (Changi General Hospital)

## Input
- File type: JPG, PNG, or PDF
- Max file size: 10MB
- Single bill per upload

## Output — Standardised JSON Schema
```typescript
interface ParsedBill {
  // Hospital Info
  hospital_name: string
  bill_reference: string
  admission_date: string         // ISO format: YYYY-MM-DD
  discharge_date: string         // ISO format: YYYY-MM-DD
  ward_class: 'A' | 'B1' | 'B2' | 'B2+' | 'C' | 'unknown'

  // Line Items
  line_items: LineItem[]

  // Summary Totals
  subtotal_before_subsidies: number
  government_subsidy: number
  medishield_deduction: number
  medisave_withdrawal: number
  other_deductions: number
  final_payable: number

  // Metadata
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
  | 'investigations'             // Lab tests, scans
  | 'implants'
  | 'government_subsidy'
  | 'medishield_deduction'
  | 'medisave_withdrawal'
  | 'pioneer_merdeka_discount'
  | 'other_deduction'
  | 'miscellaneous'
```

## Parsing Logic

### Step 1 — Upload to S3
- User uploads bill image/PDF
- File stored in S3 bucket with unique key
- Key format: `bills/{session_id}/{timestamp}.{ext}`

### Step 2 — AWS Textract
- Call Textract DetectDocumentText API for images
- Call Textract StartDocumentAnalysis for PDFs (async)
- Extract raw text blocks with confidence scores
- Flag any blocks with confidence < 0.8 for review

### Step 3 — Line Item Extraction
Map raw Textract output to LineItem categories using keyword matching:

| Keywords in text | Category |
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
- Extract dollar amounts using regex: `/\$?[\d,]+\.?\d{0,2}/`
- Convert to number: remove `$` and `,`
- Negative amounts or amounts in brackets = deductions (is_deduction: true)

### Step 5 — Ward Class Detection
Extract ward class from bill header or room description:
- "Class C" or "Ward C" → 'C'
- "Class B2+" → 'B2+'
- "Class B2" → 'B2'
- "Class B1" → 'B1'
- "Class A" → 'A'
- Not found → 'unknown'

### Step 6 — Validation
Before returning parsed bill, validate:
- final_payable = subtotal_before_subsidies - all deductions
- At least one line item extracted
- Ward class is not 'unknown' (warn if so)
- Confidence score calculated as average of all Textract block scores

## Error Handling

| Error | Response |
|---|---|
| File too large (>10MB) | Return error: "File too large. Please upload a file under 10MB." |
| Unsupported format | Return error: "Please upload a JPG, PNG, or PDF file." |
| Textract confidence < 0.5 | Return warning: "Bill image may be unclear. Results may be inaccurate." |
| No line items extracted | Return error: "Could not read bill. Please ensure the bill is flat and well-lit." |
| Amount mismatch > 5% | Return warning: "Some amounts may be inaccurate. Please verify against your original bill." |

## Acceptance Criteria

- GIVEN a clear photo of a Class C bill
- WHEN bill is uploaded and parsed
- THEN ward_class = 'C'
- AND government_subsidy reflects up to 80% reduction
- AND confidence_score >= 0.8
- AND final_payable matches original bill ± $0.10

- GIVEN a clear photo of a Class B2 bill
- WHEN bill is uploaded and parsed
- THEN ward_class = 'B2'
- AND MediShield deductible = $2,000
- AND confidence_score >= 0.8

- GIVEN a clear photo of a Class B1 bill
- WHEN bill is uploaded and parsed
- THEN ward_class = 'B1'
- AND MediShield deductible = $2,500
- AND confidence_score >= 0.8

- GIVEN a clear photo of a Class A bill
- WHEN bill is uploaded and parsed
- THEN ward_class = 'A'
- AND MediShield deductible = $3,500
- AND confidence_score >= 0.8

- GIVEN a blurry or unclear photo
- WHEN bill is uploaded
- THEN warning is shown to user
- AND partial results returned with low confidence score flagged

- GIVEN a non-bill document (e.g. prescription, letter)
- WHEN uploaded
- THEN error returned: "This does not appear to be a hospital bill"

## Notes
- plain_english field is populated by the LLM in the explain-bill step, not by the parser
- Parser is stateless — same bill always produces same output
- Session ID ties the parsed bill to the user's onboarding profile