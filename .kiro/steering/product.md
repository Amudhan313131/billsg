# BillSG — Product Steering

## What BillSG Is
BillSG is an AI-powered Singapore hospital bill navigator. It helps patients understand their hospital bills and identify unclaimed government financial assistance schemes. It is not a financial advisor, legal advisor, or medical advisor.

## The Problem
Singapore has 12+ overlapping healthcare schemes. Most patients receive only what the hospital automatically applies. MediFund, MediFund Silver, Pioneer Generation additional subsidies, CHAS benefits, and Medication Assistance Fund are almost always missed because patients don't know they exist or how to apply.

## Target User
Any Singaporean who has received a public hospital bill they don't understand. Primary persona: Uncle Tan, 68 years old, Pioneer Generation, just discharged from SGH with a $12,000 bill, no idea what any of it means.

## Core User Flow

### Phase 1 — Onboarding
User answers 4-5 questions: citizenship, age, monthly PCHI, annual value of home, Pioneer/Merdeka status, IP rider status.
Rules engine runs eligibility_matrix.md against profile.
Output: Entitlement Dashboard showing all schemes user qualifies for based on profile alone.
This is Path A complete — user can stop here if they only want eligibility information.

### Phase 2 — Bill Upload
User uploads photo or PDF of Singapore public hospital bill.
AWS S3 stores the file. AWS Textract extracts all text.
Bill parser maps Textract output to standardised JSON schema.
Output: ParsedBill object with all line items, ward class, totals. plain_english fields empty at this point.

### Phase 3 — Explain My Bill
Triggered by "Explain My Bill" button.
LLM (Amazon Bedrock) reads each line item and fills plain_english field.
April 2026 IP rider check runs — flags restructuring impact if user has IP rider.
Output: Every line item displayed as before/after card with plain English explanation.

### Phase 4 — Match Schemes
Triggered by "Match Schemes" button — only available after Phase 3.
Scheme Matching Agent:
1. Queries MCP Server for current live scheme rules
2. Runs eligibility_matrix.md logic against user profile
3. Cross-references with parsed bill — detects missing subsidies
4. Categorises every scheme: ✅ Already Applied / ⚠️ Unclaimed / ❌ Not Applicable
5. LLM generates plain English explanation for each scheme
6. Fills action_plan.md templates for every unclaimed scheme
7. Calculates total potential assistance amount

Output: Three columns of scheme cards.

### Phase 5 — Summary Banner + Action Plan
Auto-appears after scheme matching completes.
Shows: "You may be eligible to claim up to $X across N schemes."
User taps to expand — sees full action plan per unclaimed scheme.
Every output shows disclaimer: "This is guidance only. Always consult a Medical Social Worker before taking action."

## LLM Usage — Two Separate Calls
Phase 3 (Explain Bill): LLM explains each line item in plain English. Never gives advice.
Phase 4 (Scheme Matching): LLM generates scheme explanations and fills action plan templates.

## Technology Per Phase
- Phase 1: Next.js + TypeScript Rules Engine
- Phase 2: AWS S3 + AWS Textract + Bill Parser
- Phase 3: Amazon Bedrock (LLM) + Pre-Generation Hook
- Phase 4: Kiro Scheme Matching Agent + MCP Server + Amazon Bedrock
- Phase 5: Next.js UI + Action Plan Templates
- Background: Scraper keeps MCP Server data current from live MOH sources

### Why This Matters
Path A users get real value without any AI. Path B users get significantly more accurate and personalised results. AI enhances the product — it is not the entire product. The rules engine is always the source of truth for eligibility. The LLM never overrides it.

## Key Design Decisions
- No login required — session-based only, no sensitive data stored
- Sequential in Path B — Match Schemes only unlocks after bill is explained
- Dashboard is a natural exit point — Path A users get value without uploading anything
- Match Schemes without bill = profile-only matching with banner prompting bill upload

## AI Behaviour Rules — The Agent Must Always Follow These
1. Never guarantee eligibility for any scheme — always say "you may qualify" not "you qualify"
2. Always cite the live MOH source URL and verification date for every scheme recommendation
3. Always recommend the user confirm with a Medical Social Worker before taking any action
4. Never answer scheme eligibility questions from training memory — always query the MCP server first
5. If a user appears to be in financial distress, prioritise MediFund and ComCare referrals
6. Always display this disclaimer on every output: "This is guidance to help you ask the right questions. Always consult a Medical Social Worker before taking action."

## Scope — What BillSG Covers

### In Scope
BillSG focuses exclusively on acute inpatient care at Singapore's public hospitals (SGH, TTSH, NUH, SKH, NTFGH). This is where bill confusion is highest and financial stakes are largest.

The 12 schemes BillSG covers:

**Automatically applied by hospital — we explain these:**
- Government Subsidy (income-based, up to 80% for citizens)
- MediShield Life
- MediSave

**Application-based — what patients almost always miss:**
- CHAS (Blue / Orange / Green tiers)
- Pioneer Generation Package
- Merdeka Generation Package
- MediFund
- MediFund Silver (for elderly)
- MediFund Junior (for children)
- Medication Assistance Fund (MAF)
- ElderFund
- ComCare
- Flexi-MediSave (for patients aged 60+)

### Out of Scope for v1
- Private hospital bills
- Outpatient/polyclinic bills
- Dental bills
- Long-term care / nursing home bills
- Non-healthcare government schemes (Baby Bonus, HDB grants, Workfare etc.)

We acknowledge these exist. They are planned for future versions. Judges should note that focused scope is intentional — one thing done excellently beats many things done poorly.

## What BillSG Is Not
- Not a financial advisor
- Not a legal advisor
- Not a replacement for a Medical Social Worker
- Not a guarantee of eligibility for any scheme
- Not a tool for private hospital bills
- Not a tool for outpatient or dental bills