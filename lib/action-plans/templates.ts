/**
 * Action Plan Templates — Static Template Data
 *
 * All 13 templates keyed by scheme_id. These are filled verbatim by the
 * scheme matcher for every scheme with status = 'unclaimed'.
 *
 * Schemes that are always auto_applied (government_subsidy, medishield_life,
 * medisave) do NOT have templates — they return null from getActionPlan().
 */

import type { ActionPlan } from './types'

export const TEMPLATES: Record<string, ActionPlan> = {
  chas_blue: {
    where_to_go: 'Apply online at chas.sg or visit any CHAS GP clinic',
    what_to_bring: [
      'NRIC',
      'Proof of household income (latest payslip or CPF contribution statement)',
    ],
    what_to_say:
      'I would like to apply for a CHAS Blue card. I believe my household per capita income qualifies me for the Blue tier.',
    contact: 'chas.sg | Hotline: 1800-275-2427',
    estimated_processing_time:
      'Same-day approval online; physical card arrives by mail within 2 weeks',
  },

  chas_orange: {
    where_to_go: 'Apply online at chas.sg or visit any CHAS GP clinic',
    what_to_bring: [
      'NRIC',
      'Proof of household income (latest payslip or CPF contribution statement)',
    ],
    what_to_say:
      'I would like to apply for a CHAS Orange card. My household per capita income is between $1,501 and $2,300.',
    contact: 'chas.sg',
    estimated_processing_time:
      'Same-day approval online; physical card arrives by mail within 2 weeks',
  },

  chas_green: {
    where_to_go: 'Apply online at chas.sg or visit any CHAS GP clinic',
    what_to_bring: ['NRIC'],
    what_to_say:
      'I would like to apply for a CHAS Green card. I understand all Singapore Citizens are eligible regardless of income.',
    contact: 'chas.sg',
    estimated_processing_time:
      'Same-day approval online; physical card arrives by mail within 2 weeks',
  },

  pioneer_generation: {
    where_to_go:
      'Call the Pioneer Generation hotline or visit any CHAS GP clinic / polyclinic',
    what_to_bring: ['NRIC', 'Pioneer Generation card (if issued previously)'],
    what_to_say:
      'I am a Pioneer Generation member and I would like to check that my Pioneer Generation benefits are being applied to my hospital bill.',
    contact: 'Hotline: 1800-2222-888',
    estimated_processing_time:
      'Same-day verification by phone; benefits applied on next visit or retrospectively within 1–2 weeks',
  },

  merdeka_generation: {
    where_to_go:
      'Call the Merdeka Generation hotline or visit any CHAS GP clinic / polyclinic',
    what_to_bring: ['NRIC', 'Merdeka Generation card (if issued previously)'],
    what_to_say:
      'I am a Merdeka Generation member and I would like to check that my Merdeka Generation benefits are being applied to my hospital bill.',
    contact: 'Hotline: 1800-2222-888',
    estimated_processing_time:
      'Same-day verification by phone; benefits applied on next visit or retrospectively within 1–2 weeks',
  },

  medifund: {
    where_to_go:
      "Medical Social Worker's office at the hospital where you received treatment",
    what_to_bring: [
      'NRIC',
      'Hospital bill',
      'Proof of income (CPF statement or payslip)',
    ],
    what_to_say: 'I would like to apply for MediFund',
    contact:
      'Ask hospital reception to direct you to the Medical Social Worker',
    estimated_processing_time:
      'Same-day assessment; approval typically within 1–3 working days',
  },

  medifund_silver: {
    where_to_go:
      "Medical Social Worker's office at the hospital where you received treatment",
    what_to_bring: [
      'NRIC',
      'Hospital bill',
      'Proof of income (CPF statement or payslip)',
    ],
    what_to_say: 'I would like to apply for MediFund Silver',
    contact:
      'Ask hospital reception to direct you to the Medical Social Worker',
    estimated_processing_time:
      'Same-day assessment; approval typically within 1–3 working days',
  },

  medifund_junior: {
    where_to_go:
      "Medical Social Worker's office at the hospital where the child received treatment",
    what_to_bring: [
      "Child's NRIC or Birth Certificate",
      'Parent/Guardian NRIC',
      'Hospital bill',
      'Proof of household income (CPF statement or payslip)',
    ],
    what_to_say: 'I would like to apply for MediFund Junior',
    contact:
      'Ask hospital reception to direct you to the Medical Social Worker',
    estimated_processing_time:
      'Same-day assessment; approval typically within 1–3 working days',
  },

  maf: {
    where_to_go: 'Hospital pharmacy where your medications were dispensed',
    what_to_bring: ['NRIC', 'Hospital bill showing medication charges'],
    what_to_say:
      'I would like to check if any of my medications are on the Medication Assistance Fund list, and if I qualify for subsidies.',
    contact: 'Hospital pharmacy counter',
    estimated_processing_time:
      'Same-day check at pharmacy; subsidy applied immediately if eligible',
  },

  elderfund: {
    where_to_go:
      'Apply online via AIC eFASS at aic.sg, or email apply@aic.sg',
    what_to_bring: [
      'NRIC',
      'Proof of income',
      'Medical report confirming Activities of Daily Living (ADL) limitations',
      'CPF MediSave statement showing balance',
    ],
    what_to_say:
      'I would like to apply for ElderFund. I need assistance with daily living activities and would like to be assessed for the monthly payout.',
    contact: 'aic.sg | Email: apply@aic.sg',
    estimated_processing_time:
      'Application acknowledgement within 1 week; full assessment and approval typically 4–6 weeks',
  },

  comcare_smta: {
    where_to_go:
      'Apply online via SupportGoWhere (supportgowhere.life.gov.sg) or visit your nearest Social Service Office',
    what_to_bring: [
      'NRIC',
      'Proof of household income (payslips, CPF statements)',
      'Hospital bill or medical documents',
      'Proof of housing (HDB lease or tenancy agreement)',
    ],
    what_to_say:
      'I am temporarily unable to meet my household expenses including medical bills, and I would like to apply for ComCare Short-to-Medium-Term Assistance.',
    contact: 'Hotline: 1800 222 0000 | supportgowhere.life.gov.sg',
    estimated_processing_time:
      'Initial appointment within 1 week; assessment and approval typically 2–4 weeks',
  },

  comcare_lta: {
    where_to_go: 'Visit any Social Service Office',
    what_to_bring: [
      'NRIC',
      'Proof of household income',
      'Medical report confirming permanent inability to work (if applicable)',
      'Hospital bill or medical documents',
    ],
    what_to_say:
      'I am permanently unable to work due to old age, illness, or disability, and I would like to apply for ComCare Long-Term Assistance.',
    contact: 'Visit any Social Service Office | Hotline: 1800 222 0000',
    estimated_processing_time:
      'Initial appointment within 1 week; assessment and approval typically 3–6 weeks',
  },

  flexi_medisave: {
    where_to_go:
      'Any polyclinic, public Specialist Outpatient Clinic (SOC), or CHAS GP clinic',
    what_to_bring: ['NRIC'],
    what_to_say:
      'I am aged 60 or above and I would like to use my Flexi-MediSave withdrawal for this visit.',
    contact: 'Clinic reception counter',
    estimated_processing_time:
      'Immediate — applied at point of payment during the visit',
  },
}
