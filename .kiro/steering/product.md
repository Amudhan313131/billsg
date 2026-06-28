# BillSG — Product Steering

## What BillSG Is
BillSG is an AI-powered Singapore hospital bill navigator. It helps patients understand their hospital bills and identify unclaimed government financial assistance schemes. It is not a financial advisor, legal advisor, or medical advisor.

## The Problem
Singapore has 12+ overlapping healthcare schemes. Most patients receive only what the hospital automatically applies. MediFund, MediFund Silver, Pioneer Generation additional subsidies, CHAS benefits, and Medication Assistance Fund are almost always missed because patients don't know they exist or how to apply.

## Target User
Any Singaporean who has received a public hospital bill they don't understand. Primary persona: Uncle Tan, 68 years old, Pioneer Generation, just discharged from SGH with a $12,000 bill, no idea what any of it means.

## Core User Flow
1. Onboarding — 4-5 fields to build entitlement profile
2. Upload Bill — photo or PDF of Singapore public hospital bill
3. Explain My Bill — every line item explained in plain English
4. Match Schemes — unclaimed schemes identified and matched
5. Summary Banner — "You may be eligible to claim up to $X across N schemes"
6. Action Plan — exactly where to go, what to bring, what to say

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