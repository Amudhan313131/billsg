/**
 * MediSave — Scheme Checker
 *
 * MediSave is a national medical savings scheme that helps CPF members
 * save for hospitalisation expenses and approved medical insurance.
 *
 * Key rules:
 * - SC/PR → auto_applied (withdrawal is automatic for hospital bills)
 * - Foreigner → not_applicable
 * - Withdrawal limits apply (shown as informational)
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medisave/'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check MediSave eligibility.
 * SC/PR → auto_applied with withdrawal limit info.
 * Foreigner → not_applicable.
 */
export function checkMediSave(profile: UserProfile): SchemeMatch {
  if (profile.citizenship === 'Foreigner') {
    return {
      scheme_id: 'medisave',
      scheme_name: 'MediSave',
      status: 'not_applicable',
      reason: 'MediSave is only available to Singapore Citizens and Permanent Residents with CPF accounts.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'medisave',
    scheme_name: 'MediSave',
    status: 'auto_applied',
    reason:
      'MediSave is automatically used to pay for hospitalisation expenses. ' +
      'Withdrawal limits apply depending on the type of treatment and ward class. ' +
      'The hospital will deduct the applicable amount directly from your MediSave account.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
