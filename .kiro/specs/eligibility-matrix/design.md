# Design: Eligibility Matrix

## Overview
The eligibility matrix is a pure TypeScript rules engine that runs deterministically against a UserProfile to produce scheme eligibility results. No AI, no network calls, no side effects.

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
  is_merdeka: boolean         // Born 1950-1959, SC before 31 Dec 1996 (or Born ≤ 1949, not Pioneer, SC before 31 Dec 1996)
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

## Subsidy Tier Tables

### B2/C Ward — Singapore Citizen
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

### B2/C Ward — Permanent Resident
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

## MediShield Life Deductibles & Co-insurance
- Class C: $1,500 deductible
- Class B2: $2,000 deductible
- Class B1: $2,500 deductible
- Class A: $3,500 deductible
- Co-insurance: 10% on first $5,000, 5% on next $5,000, 3% above $10,000
- Annual claim limit: $200,000

## Scheme Eligibility Rules

Each scheme function takes `UserProfile` and returns `SchemeMatch`:

1. **Government Subsidy** — auto_applied for SC/PR in B2/C wards; rate by PCHI bracket
2. **MediShield Life** — auto_applied for SC/PR
3. **MediSave** — auto_applied for SC/PR
4. **CHAS Blue** — unclaimed if SC AND (PCHI ≤ 1500 OR AV ≤ 21000)
5. **CHAS Orange** — unclaimed if SC AND PCHI 1501–2300
6. **CHAS Green** — unclaimed if SC (all eligible)
7. **Pioneer Generation** — auto_applied/unclaimed if SC AND is_pioneer
8. **Merdeka Generation** — auto_applied/unclaimed if SC AND is_merdeka
9. **MediFund** — unclaimed if SC and difficulty paying
10. **MediFund Silver** — unclaimed if SC AND age ≥ 65
11. **MAF** — unclaimed if SC/PR AND medication charges present
12. **ElderFund** — unclaimed if SC AND age ≥ 30 AND PCHI ≤ 1500 AND MediSave balance < $10,000 AND NOT CareShield Life or ElderShield policyholder AND requires full ADL assistance (at least 3 of 6 Activities of Daily Living); payout up to $250/month
13. **ComCare** — unclaimed if SC AND PCHI ≤ 800 or permanent inability to work; for PR: SMTA only, requires at least one SC family member in household
14. **Flexi-MediSave** — unclaimed if SC/PR AND age ≥ 60

## IP Rider Flag (Separate)
- after_april_2026 → warning about deductible coverage ban, co-payment cap $6,000
- before_april_2026 → info about grandfathering
- none → skip entirely

## Edge Case Handling
- Foreigner → only MediShield Life explanation
- PR → MediShield Life, MediSave, MAF, Flexi-MediSave only
- Age < 18 → MediFund Junior instead of Silver
- PCHI = 0 → use AV (≤21000 = lowest bracket, >21000 = middle)
- Pioneer AND Merdeka both true → data error, halt
- No IP rider → skip flag

## Architecture
- Pure functions, no side effects
- Single entry point: `checkEligibility(profile: UserProfile): SchemeMatch[]`
- Completes in < 100ms
- File location: `lib/eligibility/index.ts`
- Individual scheme checkers in `lib/eligibility/schemes/`
