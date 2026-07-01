/**
 * Medication Assistance Fund (MAF) Scheme Checker
 *
 * MAF provides subsidies for medications that are not on the standard
 * drug list but are clinically necessary.
 *
 * Rules:
 * - SC/PR + bill contains medication charges → unclaimed
 * - SC/PR + no medication charges → not_applicable
 * - Foreigner → not_applicable
 *
 * Source: MOH MAF page
 * Verified: 2024-10-01
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-drugs-on-the-medication-assistance-fund-(maf)-list-at-public-healthcare-institutions/'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check MAF eligibility.
 *
 * - SC/PR + has_medication_charges → unclaimed
 * - SC/PR + no medication charges → not_applicable
 * - Foreigner → not_applicable
 */
export function checkMaf(profile: UserProfile): SchemeMatch {
  if (profile.citizenship === 'Foreigner') {
    return {
      scheme_id: 'maf',
      scheme_name: 'Medication Assistance Fund (MAF)',
      status: 'not_applicable',
      reason: 'MAF is only available to Singapore Citizens and Permanent Residents.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.has_medication_charges) {
    return {
      scheme_id: 'maf',
      scheme_name: 'Medication Assistance Fund (MAF)',
      status: 'unclaimed',
      reason: 'Your bill contains medication charges. You may qualify for MAF subsidies if your medications are on the MAF list.',
      action_steps: [
        'Ask the pharmacist if your medications are on the MAF list.',
        'Bring your hospital bill and NRIC.',
      ],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'maf',
    scheme_name: 'Medication Assistance Fund (MAF)',
    status: 'not_applicable',
    reason: 'No medication charges detected on your bill. MAF applies when you have qualifying medication costs.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
