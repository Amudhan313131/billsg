# Requirements: Bill Parser

## Overview
The bill parser takes a Singapore public hospital bill (uploaded as image or PDF) and extracts all line items into a standardised JSON schema. AWS Textract handles the OCR. The parser then maps the raw text output into structured data.

## Requirements

### Requirement 1: File Upload
**User Story:** As a patient, I want to upload my hospital bill as a photo or PDF so that BillSG can read it.

#### Acceptance Criteria
1. GIVEN a file upload WHEN type is JPG, PNG, or PDF THEN it is accepted
2. GIVEN a file upload WHEN size is ≤ 10MB THEN it is accepted
3. GIVEN a file upload WHEN size > 10MB THEN error: "File too large. Please upload a file under 10MB."
4. GIVEN a file upload WHEN format is unsupported THEN error: "Please upload a JPG, PNG, or PDF file."
5. GIVEN a valid file WHEN uploaded THEN it is stored in S3 at `bills/{session_id}/{timestamp}.{ext}`

### Requirement 2: Text Extraction via AWS Textract
**User Story:** As the system, I want to extract all text from the uploaded bill using OCR.

#### Acceptance Criteria
1. GIVEN an image file WHEN processed THEN Textract DetectDocumentText API is called
2. GIVEN a PDF file WHEN processed THEN Textract StartDocumentAnalysis is used (async)
3. GIVEN extracted text blocks WHEN confidence < 0.8 THEN blocks are flagged for review
4. GIVEN overall confidence < 0.5 THEN warning: "Bill image may be unclear. Results may be inaccurate."

### Requirement 3: Line Item Extraction and Categorisation
**User Story:** As a patient, I want my bill broken down into understandable categories.

#### Acceptance Criteria
1. GIVEN raw Textract output WHEN parsed THEN line items are categorised by keyword matching (ward_charges, surgical_fees, medication, consultation, investigations, implants, government_subsidy, medishield_deduction, medisave_withdrawal, pioneer_merdeka_discount, other_deduction, miscellaneous)
2. GIVEN a line item WHEN amount is negative or in brackets THEN `is_deduction = true`
3. GIVEN the parsed bill WHEN at least one line item is extracted THEN parsing succeeds
4. GIVEN the parsed bill WHEN no line items are extracted THEN error: "Could not read bill. Please ensure the bill is flat and well-lit."

### Requirement 4: Ward Class Detection
**User Story:** As the system, I want to detect the ward class to determine correct subsidy tiers and deductibles.

#### Acceptance Criteria
1. GIVEN bill text containing "Class C" or "Ward C" THEN ward_class = 'C'
2. GIVEN bill text containing "Class B2+" THEN ward_class = 'B2+'
3. GIVEN bill text containing "Class B2" THEN ward_class = 'B2'
4. GIVEN bill text containing "Class B1" THEN ward_class = 'B1'
5. GIVEN bill text containing "Class A" THEN ward_class = 'A'
6. GIVEN no ward class detected THEN ward_class = 'unknown' (with warning)

### Requirement 5: Amount Extraction and Validation
**User Story:** As the system, I want to accurately extract dollar amounts and validate totals.

#### Acceptance Criteria
1. GIVEN bill text WHEN amounts match regex `/\$?[\d,]+\.?\d{0,2}/` THEN they are extracted and converted to numbers
2. GIVEN the parsed bill WHEN final_payable ≠ subtotal - deductions (± 5%) THEN warning: "Some amounts may be inaccurate. Please verify against your original bill."
3. GIVEN a non-bill document WHEN no recognisable bill structure found THEN error: "This does not appear to be a hospital bill."

### Requirement 6: Supported Hospitals
**User Story:** As a patient at a Singapore public hospital, I want my specific hospital's bill format to be recognised.

#### Acceptance Criteria
1. GIVEN a bill from SGH, TTSH, NUH, SKH, NTFGH, or CGH WHEN uploaded THEN it is processed normally
2. GIVEN a bill from an unsupported hospital WHEN detected THEN private hospital handling per scheme_matcher Edge Case 7

### Requirement 7: Output Schema
**User Story:** As downstream systems, I want a standardised ParsedBill JSON object.

#### Acceptance Criteria
1. GIVEN successful parsing THEN output includes: hospital_name, bill_reference, admission_date, discharge_date, ward_class, line_items[], subtotal_before_subsidies, government_subsidy, medishield_deduction, medisave_withdrawal, other_deductions, final_payable, currency ('SGD'), parsed_at, confidence_score
2. GIVEN each line item THEN it includes: id, category, description, amount, plain_english (empty at parse time), is_deduction
3. GIVEN confidence_score THEN it equals the average of all Textract block confidence scores
