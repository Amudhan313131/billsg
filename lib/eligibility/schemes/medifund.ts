/**
 * MediFund, MediFund Silver, and MediFund Junior Scheme Checkers
 *
 * MediFund provides financial assistance for patients who cannot afford
 * their remaining hospital bill after government subsidies and MediShield Life.
 *
 * Rules:
 * - MediFund: SC + difficulty paying → unclaimed
 * - MediFund Silver: SC + age ≥ 65 + difficulty paying → unclaimed
 * - MediFund Junior: SC + age < 18 + difficulty paying → unclaimed (replaces Silver)
 * - PR/Foreigner: not_applicable for all three
 *
 * Source: MOH MediFund page
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medifund'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check MediFund eligibility.
 *
 * - SC + difficulty_paying → unclaimed
 * - SC + no difficulty → not_applicable (with note it's available if needed)
 * - PR/Foreigner → not_applicable
 */
export function checkMediFund(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'medifund',
      scheme_name: 'MediFund',
      status: 'not_applicable',
      reason: 'MediFund is only available to Singapore Citizens.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.difficulty_paying) {
    return {
      scheme_id: 'medifund',
      scheme_name: 'MediFund',
      status: 'unclaimed',
      reason: 'As a Singapore Citizen who has difficulty paying your remaining hospital bill, you may qualify for MediFund assistance.',
      action_steps: [
        'Approach the Medical Social Worker at the hospital.',
        'Bring your NRIC, hospital bill, and proof of income.',
        'Say: "I would like to apply for MediFund"',
      ],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'medifund',
    scheme_name: 'MediFund',
    status: 'not_applicable',
    reason: 'MediFund is available if you have difficulty paying your remaining hospital bill. You can apply anytime if your financial situation changes.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}

/**
 * Check MediFund Silver eligibility.
 *
 * - SC + age ≥ 65 + difficulty_paying → unclaimed
 * - SC + age < 65 → not_applicable
 * - PR/Foreigner → not_applicable
 */
export function checkMediFundSilver(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'medifund-silver',
      scheme_name: 'MediFund Silver',
      status: 'not_applicable',
      reason: 'MediFund Silver is only available to Singapore Citizens.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.age < 65) {
    return {
      scheme_id: 'medifund-silver',
      scheme_name: 'MediFund Silver',
      status: 'not_applicable',
      reason: 'MediFund Silver is for Singapore Citizens aged 65 and above.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.difficulty_paying) {
    return {
      scheme_id: 'medifund-silver',
      scheme_name: 'MediFund Silver',
      status: 'unclaimed',
      reason: 'As a Singapore Citizen aged 65 or above who has difficulty paying your remaining hospital bill, you may qualify for MediFund Silver.',
      action_steps: [
        'Approach the Medical Social Worker at the hospital.',
        'Bring your NRIC, hospital bill, and proof of income.',
        'Say: "I would like to apply for MediFund Silver"',
      ],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'medifund-silver',
    scheme_name: 'MediFund Silver',
    status: 'not_applicable',
    reason: 'MediFund Silver is available for citizens aged 65+ who have difficulty paying their remaining hospital bill. You can apply anytime if your financial situation changes.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}

/**
 * Check MediFund Junior eligibility.
 *
 * - SC + age < 18 + difficulty_paying → unclaimed
 * - SC + age ≥ 18 → not_applicable
 * - PR/Foreigner → not_applicable
 *
 * Note: MediFund Junior replaces MediFund Silver for patients under 18
 * (per Requirement 17, edge case 3).
 */
export function checkMediFundJunior(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'medifund-junior',
      scheme_name: 'MediFund Junior',
      status: 'not_applicable',
      reason: 'MediFund Junior is only available to Singapore Citizens.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.age >= 18) {
    return {
      scheme_id: 'medifund-junior',
      scheme_name: 'MediFund Junior',
      status: 'not_applicable',
      reason: 'MediFund Junior is for Singapore Citizens under 18 years old.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.difficulty_paying) {
    return {
      scheme_id: 'medifund-junior',
      scheme_name: 'MediFund Junior',
      status: 'unclaimed',
      reason: 'As a Singapore Citizen under 18 whose family has difficulty paying the remaining hospital bill, you may qualify for MediFund Junior.',
      action_steps: [
        'Approach the Medical Social Worker at the hospital.',
        'Bring your NRIC, hospital bill, and proof of income.',
        'Say: "I would like to apply for MediFund Junior"',
      ],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'medifund-junior',
    scheme_name: 'MediFund Junior',
    status: 'not_applicable',
    reason: 'MediFund Junior is available for citizens under 18 whose family has difficulty paying the remaining hospital bill. You can apply anytime if your financial situation changes.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
