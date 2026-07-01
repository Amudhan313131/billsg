/**
 * Flexi-MediSave Scheme Checker
 *
 * Flexi-MediSave allows patients aged 60 and above to withdraw up to
 * $400/year from their MediSave for outpatient treatments at CHAS
 * GP clinics and polyclinics.
 *
 * Rules:
 * - SC/PR AND age ≥ 60 → unclaimed
 * - SC/PR AND age < 60 → not_applicable
 * - Foreigner → not_applicable
 *
 * Withdrawal limit: $400/year
 *
 * Source: CPF Flexi-MediSave page
 * Verified: 2024-10-01
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://www.cpf.gov.sg/member/healthcare-financing/medisave/flexi-medisave'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check Flexi-MediSave eligibility.
 *
 * - SC/PR + age ≥ 60 → unclaimed
 * - SC/PR + age < 60 → not_applicable
 * - Foreigner → not_applicable
 */
export function checkFlexiMediSave(profile: UserProfile): SchemeMatch {
  if (profile.citizenship === 'Foreigner') {
    return {
      scheme_id: 'flexi-medisave',
      scheme_name: 'Flexi-MediSave',
      status: 'not_applicable',
      reason: 'Flexi-MediSave is only available to Singapore Citizens and Permanent Residents.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.age < 60) {
    return {
      scheme_id: 'flexi-medisave',
      scheme_name: 'Flexi-MediSave',
      status: 'not_applicable',
      reason: 'Flexi-MediSave is for patients aged 60 and above.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'flexi-medisave',
    scheme_name: 'Flexi-MediSave',
    status: 'unclaimed',
    reason: 'As a patient aged 60 or above, you may withdraw up to $400/year from your MediSave under the Flexi-MediSave scheme.',
    action_steps: [
      'Flexi-MediSave withdrawal limit is $400 per year.',
      'Use at CHAS GP clinics or polyclinics for outpatient treatments.',
      'Check your balance and usage at cpf.gov.sg',
    ],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
