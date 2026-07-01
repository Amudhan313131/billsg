# Design: Action Plan Templates

## Overview
Static templates filled by the scheme matcher for every unclaimed scheme. Templates are keyed by scheme_id.

## Binding Interface

```typescript
interface ActionPlan {
  where_to_go: string
  what_to_bring: string[]
  what_to_say: string
  contact: string
  estimated_processing_time: string
}
```

## Schemes That Never Need Templates
- Government Subsidy — always auto_applied
- MediShield Life — always auto_applied
- MediSave — always auto_applied

## All 13 Templates

### CHAS Blue
- where_to_go: "Apply online at chas.sg or visit any CHAS GP clinic"
- what_to_bring: ["NRIC", "Proof of household income (latest payslip or CPF contribution statement)"]
- what_to_say: "I would like to apply for a CHAS Blue card. I believe my household per capita income qualifies me for the Blue tier."
- contact: "chas.sg | Hotline: 1800-275-2427"
- estimated_processing_time: "Same-day approval online; physical card arrives by mail within 2 weeks"

### CHAS Orange
- where_to_go: "Apply online at chas.sg or visit any CHAS GP clinic"
- what_to_bring: ["NRIC", "Proof of household income (latest payslip or CPF contribution statement)"]
- what_to_say: "I would like to apply for a CHAS Orange card. My household per capita income is between $1,501 and $2,300."
- contact: "chas.sg"
- estimated_processing_time: "Same-day approval online; physical card arrives by mail within 2 weeks"

### CHAS Green
- where_to_go: "Apply online at chas.sg or visit any CHAS GP clinic"
- what_to_bring: ["NRIC"]
- what_to_say: "I would like to apply for a CHAS Green card. I understand all Singapore Citizens are eligible regardless of income."
- contact: "chas.sg"
- estimated_processing_time: "Same-day approval online; physical card arrives by mail within 2 weeks"

### Pioneer Generation Package
- where_to_go: "Call the Pioneer Generation hotline or visit any CHAS GP clinic / polyclinic"
- what_to_bring: ["NRIC", "Pioneer Generation card (if issued previously)"]
- what_to_say: "I am a Pioneer Generation member and I would like to check that my Pioneer Generation benefits are being applied to my hospital bill."
- contact: "Hotline: 1800-2222-888"
- estimated_processing_time: "Same-day verification by phone; benefits applied on next visit or retrospectively within 1–2 weeks"

### Merdeka Generation Package
- where_to_go: "Call the Merdeka Generation hotline or visit any CHAS GP clinic / polyclinic"
- what_to_bring: ["NRIC", "Merdeka Generation card (if issued previously)"]
- what_to_say: "I am a Merdeka Generation member and I would like to check that my Merdeka Generation benefits are being applied to my hospital bill."
- contact: "Hotline: 1800-2222-888"
- estimated_processing_time: "Same-day verification by phone; benefits applied on next visit or retrospectively within 1–2 weeks"

### MediFund
- where_to_go: "Medical Social Worker's office at the hospital where you received treatment"
- what_to_bring: ["NRIC", "Hospital bill", "Proof of income (CPF statement or payslip)"]
- what_to_say: "I would like to apply for MediFund"
- contact: "Ask hospital reception to direct you to the Medical Social Worker"
- estimated_processing_time: "Same-day assessment; approval typically within 1–3 working days"

### MediFund Silver
- where_to_go: "Medical Social Worker's office at the hospital where you received treatment"
- what_to_bring: ["NRIC", "Hospital bill", "Proof of income (CPF statement or payslip)"]
- what_to_say: "I would like to apply for MediFund Silver"
- contact: "Ask hospital reception to direct you to the Medical Social Worker"
- estimated_processing_time: "Same-day assessment; approval typically within 1–3 working days"

### MediFund Junior
- where_to_go: "Medical Social Worker's office at the hospital where the child received treatment"
- what_to_bring: ["Child's NRIC or Birth Certificate", "Parent/Guardian NRIC", "Hospital bill", "Proof of household income (CPF statement or payslip)"]
- what_to_say: "I would like to apply for MediFund Junior"
- contact: "Ask hospital reception to direct you to the Medical Social Worker"
- estimated_processing_time: "Same-day assessment; approval typically within 1–3 working days"

### Medication Assistance Fund (MAF)
- where_to_go: "Hospital pharmacy where your medications were dispensed"
- what_to_bring: ["NRIC", "Hospital bill showing medication charges"]
- what_to_say: "I would like to check if any of my medications are on the Medication Assistance Fund list, and if I qualify for subsidies."
- contact: "Hospital pharmacy counter"
- estimated_processing_time: "Same-day check at pharmacy; subsidy applied immediately if eligible"

### ElderFund
- where_to_go: "Apply online via AIC eFASS at aic.sg, or email apply@aic.sg"
- what_to_bring: ["NRIC", "Proof of income", "Medical report confirming Activities of Daily Living (ADL) limitations", "CPF MediSave statement showing balance"]
- what_to_say: "I would like to apply for ElderFund. I need assistance with daily living activities and would like to be assessed for the monthly payout."
- contact: "aic.sg | Email: apply@aic.sg"
- estimated_processing_time: "Application acknowledgement within 1 week; full assessment and approval typically 4–6 weeks"

### ComCare SMTA
- where_to_go: "Apply online via SupportGoWhere (supportgowhere.life.gov.sg) or visit your nearest Social Service Office"
- what_to_bring: ["NRIC", "Proof of household income (payslips, CPF statements)", "Hospital bill or medical documents", "Proof of housing (HDB lease or tenancy agreement)"]
- what_to_say: "I am temporarily unable to meet my household expenses including medical bills, and I would like to apply for ComCare Short-to-Medium-Term Assistance."
- contact: "Hotline: 1800 222 0000 | supportgowhere.life.gov.sg"
- estimated_processing_time: "Initial appointment within 1 week; assessment and approval typically 2–4 weeks"

### ComCare LTA
- where_to_go: "Visit any Social Service Office"
- what_to_bring: ["NRIC", "Proof of household income", "Medical report confirming permanent inability to work (if applicable)", "Hospital bill or medical documents"]
- what_to_say: "I am permanently unable to work due to old age, illness, or disability, and I would like to apply for ComCare Long-Term Assistance."
- contact: "Visit any Social Service Office | Hotline: 1800 222 0000"
- estimated_processing_time: "Initial appointment within 1 week; assessment and approval typically 3–6 weeks"

### Flexi-MediSave
- where_to_go: "Any polyclinic, public Specialist Outpatient Clinic (SOC), or CHAS GP clinic"
- what_to_bring: ["NRIC"]
- what_to_say: "I am aged 60 or above and I would like to use my Flexi-MediSave withdrawal for this visit."
- contact: "Clinic reception counter"
- estimated_processing_time: "Immediate — applied at point of payment during the visit"

## Template Selection Logic

```typescript
function getActionPlan(scheme_id: string, userProfile: UserProfile): ActionPlan | null {
  if (['government_subsidy', 'medishield_life', 'medisave'].includes(scheme_id)) return null
  if (scheme_id === 'medifund_silver' && userProfile.age < 18) return TEMPLATES['medifund_junior']
  return TEMPLATES[scheme_id] ?? null
}
```

## Notes
- `estimated_processing_time` values are illustrative only — never a guarantee
- All contact details sourced from eligibility_matrix and scraper specs
- `what_to_say` strings are literal quotable phrases
- Disclaimer on every card: "This is guidance only. Always consult a Medical Social Worker before taking action."
- Templates are static — scheme matcher fills them verbatim, does not modify based on bill data
