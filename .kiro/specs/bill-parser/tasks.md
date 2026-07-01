# Tasks: Bill Parser

## Task 1: Set up S3 upload infrastructure
- [ ] Create API route `app/api/upload/route.ts`
- [ ] Validate file type (JPG, PNG, PDF) and size (≤ 10MB) before upload
- [ ] Upload to S3 with key format `bills/{session_id}/{timestamp}.{ext}`
- [ ] Return S3 key and presigned URL on success
- [ ] Return appropriate error messages for invalid files

## Task 2: Integrate AWS Textract for text extraction
- [ ] Create `lib/bill-parser/textract.ts`
- [ ] Call DetectDocumentText API for image files
- [ ] Call StartDocumentAnalysis for PDF files (handle async polling)
- [ ] Extract all text blocks with confidence scores
- [ ] Flag blocks with confidence < 0.8
- [ ] Calculate overall confidence_score as average of all blocks

## Task 3: Implement line item extraction and categorisation
- [ ] Create `lib/bill-parser/categorise.ts`
- [ ] Implement keyword matching table for all 12 categories
- [ ] Handle case-insensitive matching
- [ ] Assign `miscellaneous` category for unmatched items
- [ ] Extract amounts using regex `/\$?[\d,]+\.?\d{0,2}/`
- [ ] Mark negative amounts / bracketed amounts as `is_deduction = true`

## Task 4: Implement ward class detection
- [ ] Create `lib/bill-parser/ward-class.ts`
- [ ] Search bill header and room descriptions for ward class indicators
- [ ] Map detected text to ward_class enum values
- [ ] Default to 'unknown' if not found

## Task 5: Implement validation and ParsedBill assembly
- [ ] Create `lib/bill-parser/validate.ts`
- [ ] Verify final_payable = subtotal - deductions (± 5% tolerance)
- [ ] Verify at least one line item extracted
- [ ] Generate confidence_score from Textract block averages
- [ ] Assemble complete ParsedBill object with all fields
- [ ] Set `plain_english = ''` for all line items (filled later by explainer)

## Task 6: Create main parser orchestrator and API endpoint
- [ ] Create `lib/bill-parser/index.ts` orchestrating steps 1-5
- [ ] Create API route `app/api/parse-bill/route.ts`
- [ ] Handle all error cases with correct error messages
- [ ] Return warnings as non-blocking alongside successful parse
- [ ] Store parsed bill in session tied to user's profile
