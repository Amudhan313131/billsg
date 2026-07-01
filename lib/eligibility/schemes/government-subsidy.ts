/**
 * Government Subsidy Scheme Checker
 *
 * Determines the government subsidy rate for B2/C ward hospital stays
 * based on citizenship status and Per Capita Household Income (PCHI).
 *
 * Effective: 1 October 2024
 * Source: MOH website — means-testing subsidies
 *
 * Rules:
 * - SC: 80%–50% subsidy based on PCHI bracket
 * - PR: 50%–25% subsidy based on PCHI bracket
 * - Foreigner: not applicable
 * - PCHI = 0: use Annual Value (AV ≤ $21,000 → lowest bracket; AV > $21,000 → bottom tier)
 */

import type { UserProfile, SchemeMatch } from '../types'

/** PCHI bracket thresholds in SGD */
const PCHI_THRESHOLDS = [2100, 2300, 2600, 3000, 3300, 3600] as const

/** Subsidy rates for Singapore Citizens by PCHI bracket (lowest to highest PCHI) */
const SC_RATES = [80, 75, 70, 65, 60, 55, 50] as const

/** Subsidy rates for Permanent Residents by PCHI bracket (lowest to highest PCHI) */
const PR_RATES = [50, 42.5, 35, 32.5, 30, 27.5, 25] as const

/** Annual Value threshold for PCHI = 0 fallback */
const AV_THRESHOLD = 21000

const SOURCE_URL = 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-acute-inpatient-care-at-public-healthcare-institutions/'
const VERIFIED_DATE = '2024-10-01'

/**
 * Determine subsidy rate index from PCHI value.
 * Returns index into the rates arrays (0 = lowest PCHI bracket, 6 = highest).
 */
function getSubsidyTierIndex(pchi: number): number {
  for (let i = 0; i < PCHI_THRESHOLDS.length; i++) {
    if (pchi <= PCHI_THRESHOLDS[i]) {
      return i
    }
  }
  // PCHI > $3,600 → bottom tier (last index)
  return PCHI_THRESHOLDS.length
}

/**
 * Get the subsidy rate for a user based on citizenship, PCHI, and Annual Value.
 * Returns the subsidy percentage (e.g. 80 for 80%).
 */
function getSubsidyRate(profile: UserProfile): number {
  const rates = profile.citizenship === 'SC' ? SC_RATES : PR_RATES

  // PCHI = 0 edge case: use Annual Value as proxy
  if (profile.monthly_pchi === 0) {
    if (profile.annual_value <= AV_THRESHOLD) {
      // Lowest bracket (highest subsidy)
      return rates[0]
    }
    // Bottom tier (lowest subsidy)
    return rates[rates.length - 1]
  }

  const tierIndex = getSubsidyTierIndex(profile.monthly_pchi)
  return rates[tierIndex]
}

/**
 * Check Government Subsidy eligibility for a user profile.
 *
 * - SC/PR → auto_applied with subsidy rate
 * - Foreigner → not_applicable
 */
export function checkGovernmentSubsidy(profile: UserProfile): SchemeMatch {
  if (profile.citizenship === 'Foreigner') {
    return {
      scheme_id: 'government-subsidy',
      scheme_name: 'Government Subsidy',
      status: 'not_applicable',
      reason: 'Government hospital subsidies are only available to Singapore Citizens and Permanent Residents.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  const rate = getSubsidyRate(profile)
  const citizenshipLabel = profile.citizenship === 'SC' ? 'Singapore Citizen' : 'Permanent Resident'

  return {
    scheme_id: 'government-subsidy',
    scheme_name: 'Government Subsidy',
    status: 'auto_applied',
    reason: `As a ${citizenshipLabel}, you receive a ${rate}% government subsidy on B2/C ward hospital charges. This is automatically applied to your bill.`,
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
