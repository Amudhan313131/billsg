/**
 * MediShield Life — Scheme Checker
 *
 * MediShield Life is a basic health insurance plan that covers all
 * Singapore Citizens and Permanent Residents automatically.
 *
 * Key rules:
 * - SC/PR → auto_applied
 * - Foreigner → not_applicable
 * - Deductible varies by ward class (C=$1500, B2=$2000, B1=$2500, A=$3500)
 * - Deductible is paid only once per policy year regardless of admissions
 * - Co-insurance: 10% on first $5,000, 5% on next $5,000, 3% above $10,000
 *
 * Note: ward_class is on ParsedBill, not UserProfile. Deductible/co-insurance
 * details are included in the reason string as general coverage info.
 * Actual ward-specific calculation happens when bill data is available.
 */

import type { UserProfile, SchemeMatch, WardClass } from '../types'

/** Deductible amounts by ward class */
export const DEDUCTIBLES: Record<WardClass, number> = {
  C: 1500,
  B2: 2000,
  B1: 2500,
  A: 3500,
}

/** Co-insurance tier thresholds and rates */
export const CO_INSURANCE_TIERS = [
  { upTo: 5000, rate: 0.10 },
  { upTo: 10000, rate: 0.05 },
  { upTo: Infinity, rate: 0.03 },
] as const

/**
 * Calculate co-insurance amount for a given claimable amount.
 * - 10% on first $5,000
 * - 5% on next $5,000
 * - 3% above $10,000
 */
export function calculateCoInsurance(claimableAmount: number): number {
  if (claimableAmount <= 0) return 0

  let remaining = claimableAmount
  let coInsurance = 0
  let previousThreshold = 0

  for (const tier of CO_INSURANCE_TIERS) {
    const tierSize = tier.upTo === Infinity
      ? remaining
      : tier.upTo - previousThreshold
    const amountInTier = Math.min(remaining, tierSize)
    coInsurance += amountInTier * tier.rate
    remaining -= amountInTier
    previousThreshold = tier.upTo === Infinity ? previousThreshold : tier.upTo
    if (remaining <= 0) break
  }

  return Math.round(coInsurance * 100) / 100
}

/**
 * Get the deductible amount for a given ward class.
 * Deductible is paid only once per policy year regardless of number of admissions.
 */
export function getDeductible(wardClass: WardClass): number {
  return DEDUCTIBLES[wardClass]
}

const SOURCE_URL = 'https://www.cpf.gov.sg/member/healthcare-financing/medishield-life/what-medishield-life-covers-you-for'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check MediShield Life eligibility.
 * SC/PR → auto_applied with coverage info in reason.
 * Foreigner → not_applicable.
 */
export function checkMediShieldLife(profile: UserProfile): SchemeMatch {
  if (profile.citizenship === 'Foreigner') {
    return {
      scheme_id: 'medishield-life',
      scheme_name: 'MediShield Life',
      status: 'not_applicable',
      reason: 'MediShield Life is only available to Singapore Citizens and Permanent Residents.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'medishield-life',
    scheme_name: 'MediShield Life',
    status: 'auto_applied',
    reason:
      'MediShield Life is automatically applied for all Singapore Citizens and Permanent Residents. ' +
      'Deductible per policy year: Class C = $1,500, Class B2 = $2,000, Class B1 = $2,500, Class A = $3,500. ' +
      'The deductible is paid only once per policy year regardless of the number of admissions. ' +
      'Co-insurance: 10% on the first $5,000, 5% on the next $5,000, 3% on amounts above $10,000.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
