# BillSG — Product Steering

## What BillSG Is
BillSG is an AI-powered Singapore hospital bill navigator. It helps patients understand their hospital bills and identify unclaimed government financial assistance schemes. It is not a financial advisor, legal advisor, or medical advisor.

## The Problem
Singapore has 12+ overlapping healthcare schemes. Most patients receive only what the hospital automatically applies. MediFund, MediFund Silver, Pioneer Generation additional subsidies, CHAS benefits, and Medication Assistance Fund are almost always missed because patients don't know they exist or how to apply.

## Target User
Any Singaporean who has received a public hospital bill they don't understand. Primary persona: Uncle Tan, 68 years old, Pioneer Generation, just discharged from SGH with a $12,000 bill, no idea what any of it means.

## Core User Flow

### Path A — Eligibility Check Only
1. Onboarding — 4-5 fields to build entitlement profile
2. Dashboard — shows all schemes user qualifies for based on profile alone
3. User reads and leaves — no bill upload required

### Path B — Full Bill Analysis
1. Onboarding — 4-5 fields to build entitlement profile
2. Dashboard — shows all schemes user qualifies for based on profile alone
3. Explain My Bill — upload bill → Textract → every line item explained in plain English
4. Match Schemes — unlocks after bill is explained. Scheme Matching Agent queries MCP Server → personalised scheme cards in 3 columns: ✅ Already Applied / ⚠️ Unclaimed / ❌ Not Applicable
5. Summary Banner — auto-appears after matching: "You may be eligible to claim up to $X across N schemes"
6. Action Plan — exactly where to go, what to bring, what to say
7. Disclaimer — shown on every output: "This is guidance only. Always consult a Medical Social Worker before taking action."

## AI vs Non-AI Features

### Path A — Rules Engine Only (No AI)
Profile fields → deterministic TypeScript eligibility logic → scheme cards displayed on dashboard.
No LLM involved. Fast, accurate, fully testable. Every result is deterministic.

### Path B — Rules Engine + AI
Adds the following AI features on top of Path A:

- **AWS Textract** — OCR reads the uploaded hospital bill and extracts all line items
- **LLM (Amazon Bedrock/Claude)** — explains each line item in plain English
- **Scheme Matching Agent** — Kiro agent that cross-references parsed bill + user profile against MCP Server for personalised scheme matching
- **Action Plan Generator** — LLM writes specific instructions per unclaimed scheme based on action_plan.md template

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