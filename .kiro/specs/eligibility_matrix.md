# Eligibility Matrix Spec

## Overview
This spec defines the deterministic eligibility logic for all 12 Singapore healthcare schemes relevant to acute inpatient care at public hospitals. The rules engine implements this matrix exactly — no AI involved in eligibility decisions.

## How It Works
1. User completes onboarding — provides profile fields
2. Rules engine runs profile against every scheme in this matrix
3. Returns array of matched schemes with status and reason
4. Scheme Matching Agent uses this as ground truth — never overrides it

## Data Types
```typescript
type Citizenship = 'SC' | 'PR' | 'Foreigner'
type SchemeStatus = 'auto_applied' | 'unclaimed' | 'not_applicable'

interface UserProfile {
  citizenship: Citizenship
  age: number
  monthly_pchi: number        // Per Capita Household Income
  annual_value: number        // Annual Value of home
  is_pioneer: boolean         // Born before 1 Jan 1950, SC before 31 Dec 1986
  is_merdeka: boolean         // Born 1950-1959, SC before 31 Dec 1986
  has_ip_rider: boolean       // Has Integrated Shield Plan rider
  ip_rider_date: 'before_april_2026' | 'after_april_2026' | 'none'
}

interface SchemeMatch {
  scheme_id: string
  scheme_name: string
  status: SchemeStatus
  reason: string
  action_steps: string[]
  source_url: string
  verified_date: string
}
```

## Scheme 1 — Government Subsidy
**What it is:** Means-tested subsidy applied automatically on admission to subsidised ward. No application required.
**Effective: 1 October 2024**

**B2/C Ward — Singapore Citizen:**
| PCHI | Subsidy Rate |
|---|---|
| No PCHI, AV ≤ $21,000 | 80% |
| No PCHI, AV > $21,000 | 50% |
| $0 < PCHI ≤ $2,100 | 80% |
| $2,100 < PCHI ≤ $2,300 | 75% |
| $2,300 < PCHI ≤ $2,600 | 70% |
| $2,600 < PCHI ≤ $3,000 | 65% |
| $3,000 < PCHI ≤ $3,300 | 60% |
| $3,300 < PCHI ≤ $3,600 | 55% |
| PCHI > $3,600 | 50% |

**B2/C Ward — Permanent Resident:**
| PCHI | Subsidy Rate |
|---|---|
| No PCHI, AV ≤ $21,000 | 50% |
| No PCHI, AV > $21,000 | 25% |
| $0 < PCHI ≤ $2,100 | 50% |
| $2,100 < PCHI ≤ $2,300 | 42.5% |
| $2,300 < PCHI ≤ $2,600 | 35% |
| $2,600 < PCHI ≤ $3,000 | 32.5% |
| $3,000 < PCHI ≤ $3,300 | 30% |
| $3,300 < PCHI ≤ $3,600 | 27.5% |
| PCHI > $3,600 | 25% |

**Foreigners:** No subsidy.

**Acceptance Criteria:**
- GIVEN citizenship IN (SC, PR) AND ward_class IN (B2, C)
- THEN status = auto_applied
- AND subsidy rate shown based on PCHI bracket and citizenship
- AND if PCHI = 0, use Annual Value of home to determine tier
- AND source: moh.gov.sg/managing-expenses/subsidies-in-public-healthcare

---

## Scheme 2 — MediShield Life
**What it is:** Basic health insurance for all SC and PR. Covers large hospital bills. Premiums paid via MediSave.

**Deductible (verified from CPF, June 2026):**
- Class C ward, age ≤ 80: $1,500 per policy year
- Class B2 ward: to be verified from hospital bill directly
- Payable once per policy year only

**Co-insurance (verified from CPF, June 2026):**
- 10% on first $5,000 of claimable amount (inclusive of deductible)
- 5% on next $5,000
- 3% above $10,000

**Acceptance Criteria:**
- GIVEN citizenship IN (SC, PR)
- THEN status = auto_applied
- AND explain deductible amount based on ward class from bill
- AND explain tiered co-insurance breakdown
- AND note: deductible paid only once per policy year regardless of number of admissions
- AND source: cpf.gov.sg/member/healthcare-financing/medishield-life/what-medishield-life-covers-you-for
---

## Scheme 3 — MediSave
**What it is:** National medical savings account. Used to pay hospital bills directly.

**Acceptance Criteria:**
- GIVEN citizenship IN (SC, PR)
- THEN status = auto_applied
- AND show withdrawal limit applied to this bill
- AND source: cpf.gov.sg/medisave

---

## Scheme 4 — CHAS Blue
**What it is:** Subsidies for medical and dental care at CHAS GP clinics. Highest subsidy tier.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND (monthly_pchi <= 1500 OR annual_value <= 21000)
- THEN status = unclaimed (if not already on bill)
- AND action: Apply at chas.sg or call 1800-275-2427
- AND source: moh.gov.sg/chas

---

## Scheme 5 — CHAS Orange
**What it is:** Mid-tier CHAS subsidies for medical and dental care.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND monthly_pchi >= 1501 AND monthly_pchi <= 2300
- THEN status = unclaimed
- AND action: Apply at chas.sg
- AND source: moh.gov.sg/chas

---

## Scheme 6 — CHAS Green
**What it is:** Basic CHAS subsidies. Available to all Singapore Citizens regardless of income.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- THEN status = unclaimed (if user doesn't already have CHAS card)
- AND note: All SCs are eligible regardless of income
- AND action: Apply at chas.sg
- AND source: moh.gov.sg/chas

---

## Scheme 7 — Pioneer Generation Package
**What it is:** Additional subsidies for Singaporeans who contributed to nation-building. Extra 50% off subsidised bill at polyclinics and public SOCs.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND is_pioneer = true (born before 1 Jan 1950, SC before 31 Dec 1986)
- THEN status = auto_applied (if registered) OR unclaimed (if not registered)
- AND show: additional 50% off subsidised bill
- AND action if not registered: Call 1800-2222-888
- AND source: moh.gov.sg/pioneer-generation

---

## Scheme 8 — Merdeka Generation Package
**What it is:** Additional subsidies for Singaporeans born 1950-1959. Extra 25% off subsidised bill.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND (
    (born 1950-1959 AND became SC on or before 31 Dec 1996)
    OR
    (born on or before 31 Dec 1949 AND became SC on or before 31 Dec 1996 AND is_pioneer = false)
  )
- THEN status = auto_applied (if registered) OR unclaimed (if not registered)
- AND show: additional 25% off subsidised bill
- AND action if not registered: Call 1800-2222-888
- AND source: moh.gov.sg/merdeka-generation

---

## Scheme 9 — MediFund
**What it is:** Safety net endowment fund for Singaporeans who cannot afford bills after all other schemes.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND user indicates difficulty paying remaining bill
- THEN status = unclaimed
- AND action: Approach Medical Social Worker at hospital
- AND bring: NRIC, hospital bill, proof of income (CPF statement or payslip)
- AND say: "I would like to apply for MediFund"
- AND source: moh.gov.sg/medifund

---

## Scheme 10 — MediFund Silver
**What it is:** MediFund specifically for elderly Singaporeans aged 65 and above.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND age >= 65
- AND user indicates difficulty paying remaining bill
- THEN status = unclaimed
- AND action: Approach Medical Social Worker at hospital
- AND bring: NRIC, hospital bill, proof of income
- AND say: "I would like to apply for MediFund Silver"
- AND source: moh.gov.sg/medifund

---

## Scheme 11 — Medication Assistance Fund (MAF)
**What it is:** Subsidies for specific high-cost medications on the MAF list at public hospitals.

**Acceptance Criteria:**
- GIVEN citizenship IN (SC, PR)
- AND bill contains medication charges at public hospital
- THEN status = unclaimed
- AND action: Ask pharmacist if medications are on MAF list
- AND bring: Hospital bill, NRIC
- AND source: moh.gov.sg/medication-assistance-fund

---

## Scheme 12 — ElderFund
**What it is:** Discretionary assistance for lower-income, severely disabled Singapore Citizens aged 30+ for long-term care needs. Payout up to $250/month.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND age >= 30
- AND monthly_pchi <= 1500
- AND MediSave balance < $10,000
- AND requires full assistance with at least 3 of 6 Activities of Daily Living
- AND NOT a CareShield Life or ElderShield policyholder
- THEN status = unclaimed
- AND note: Applications considered case-by-case even if income criteria not met
- AND action: Apply online via AIC eFASS at aic.sg or email apply@aic.sg
- AND source: aic.sg/financial-assistance/elderfund

---

## Scheme 13 — ComCare
**What it is:** Short-to-medium term assistance for low-income Singaporeans who cannot pay bills.

**Acceptance Criteria:**
- GIVEN citizenship = SC
- AND monthly_pchi <= 1900
- THEN status = unclaimed
- AND action: Approach Medical Social Worker OR visit any SSO office
- AND source: msf.gov.sg/comcare

---

## Scheme 14 — Flexi-MediSave
**What it is:** Additional MediSave withdrawal limit for patients aged 60 and above for outpatient care.

**Acceptance Criteria:**
- GIVEN citizenship IN (SC, PR)
- AND age >= 60
- THEN status = unclaimed (if not already claimed)
- AND withdrawal limit: $400/year (raised from $300, effective Oct 2025)
- AND source: cpf.gov.sg/flexi-medisave

---

## April 2026 IP Rider Flag
**Separate from scheme matching — triggers as a dedicated callout.**

**Acceptance Criteria:**
- GIVEN has_ip_rider = true
- AND ip_rider_date = 'after_april_2026'
- THEN show warning: "Your IP rider purchased after April 2026 cannot cover MOH minimum deductibles. Your annual co-payment cap is $6,000."
- GIVEN has_ip_rider = true
- AND ip_rider_date = 'before_april_2026'
- THEN show info: "Your existing IP rider is grandfathered. However, new riders on your policy purchased after April 2026 are subject to the new rules."
- AND source: moh.gov.sg/integrated-shield-plans

---

## Edge Cases
- Foreigner → show only MediShield Life explanation, all other schemes not_applicable
- PR → eligible for MediShield Life, MediSave, MAF, Flexi-MediSave only
- Age < 18 → flag MediFund Junior instead of MediFund Silver
- PCHI = 0 → treat as lowest income bracket, maximise subsidy matching
- No IP rider → skip April 2026 flag entirely
- Pioneer AND Merdeka → only flag as error if is_pioneer = true AND is_merdeka = true simultaneously