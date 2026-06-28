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

## What BillSG Is Not
- Not a financial advisor
- Not a legal advisor
- Not a replacement for a Medical Social Worker
- Not a guarantee of eligibility for any scheme