/**
 * ComCare Scheme Checker
 *
 * ComCare provides financial assistance to lower-income Singaporeans
 * through Short-to-Medium Term Assistance (SMTA) and Long-Term Assistance (LTA).
 *
 * Rules:
 * - SC AND (monthly PCHI ≤ $800 OR permanent inability to work) → unclaimed
 *   - PCHI ≤ $800 qualifies for SMTA
 *   - Permanent inability to work qualifies for LTA (SC only)
 * - PR AND monthly PCHI ≤ $800 AND has SC family member in household → unclaimed (SMTA only)
 * - Foreigner → not_applicable
 *
 * Source: MSF ComCare page
 * Verified: 2024-10-01
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://supportgowhere.life.gov.sg/schemes/'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check ComCare eligibility.
 *
 * SC path:
 * - PCHI ≤ $800 → SMTA eligible
 * - Permanent inability to work → LTA eligible
 * - Both may apply simultaneously
 *
 * PR path:
 * - PCHI ≤ $800 AND at least one SC family member in household → SMTA only
 */
export function checkComCare(profile: UserProfile): SchemeMatch {
  if (profile.citizenship === 'Foreigner') {
    return {
      scheme_id: 'comcare',
      scheme_name: 'ComCare',
      status: 'not_applicable',
      reason: 'ComCare is not available to Foreigners.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.citizenship === 'SC') {
    const smtaEligible = profile.monthly_pchi <= 800
    const ltaEligible = profile.permanent_inability_to_work === true

    if (smtaEligible && ltaEligible) {
      return {
        scheme_id: 'comcare',
        scheme_name: 'ComCare',
        status: 'unclaimed',
        reason: 'You may qualify for both ComCare Short-to-Medium Term Assistance (SMTA) and Long-Term Assistance (LTA) based on your income and work capacity.',
        action_steps: [
          'For SMTA: Apply at SupportGoWhere or visit any Social Service Office.',
          'For LTA: Visit any Social Service Office. Cash assistance of $760–$2,230/month (from April 2025, based on household size and income).',
          'ComCare hotline: 1800 222 0000',
        ],
        source_url: SOURCE_URL,
        verified_date: VERIFIED_DATE,
      }
    }

    if (smtaEligible) {
      return {
        scheme_id: 'comcare',
        scheme_name: 'ComCare',
        status: 'unclaimed',
        reason: 'You may qualify for ComCare Short-to-Medium Term Assistance (SMTA) based on your household income.',
        action_steps: [
          'Apply at SupportGoWhere or visit any Social Service Office.',
          'ComCare hotline: 1800 222 0000',
        ],
        source_url: SOURCE_URL,
        verified_date: VERIFIED_DATE,
      }
    }

    if (ltaEligible) {
      return {
        scheme_id: 'comcare',
        scheme_name: 'ComCare',
        status: 'unclaimed',
        reason: 'You may qualify for ComCare Long-Term Assistance (LTA) based on permanent inability to work.',
        action_steps: [
          'Visit any Social Service Office.',
          'Cash assistance of $760–$2,230/month (from April 2025, based on household size and income).',
          'ComCare hotline: 1800 222 0000',
        ],
        source_url: SOURCE_URL,
        verified_date: VERIFIED_DATE,
      }
    }

    return {
      scheme_id: 'comcare',
      scheme_name: 'ComCare',
      status: 'not_applicable',
      reason: 'Your monthly PCHI exceeds $800 and you do not have a permanent inability to work. ComCare assistance requires either low income or permanent work incapacity.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  // PR path: SMTA only, requires SC family member in household
  if (profile.citizenship === 'PR') {
    if (profile.monthly_pchi <= 800 && profile.has_sc_family_member) {
      return {
        scheme_id: 'comcare',
        scheme_name: 'ComCare',
        status: 'unclaimed',
        reason: 'As a Permanent Resident with a Singapore Citizen family member in your household and low income, you may qualify for ComCare Short-to-Medium Term Assistance (SMTA).',
        action_steps: [
          'Apply at SupportGoWhere or visit any Social Service Office.',
          'ComCare hotline: 1800 222 0000',
        ],
        source_url: SOURCE_URL,
        verified_date: VERIFIED_DATE,
      }
    }

    return {
      scheme_id: 'comcare',
      scheme_name: 'ComCare',
      status: 'not_applicable',
      reason: 'As a Permanent Resident, ComCare SMTA requires monthly PCHI of $800 or below and at least one Singapore Citizen family member in your household.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  // Fallback (shouldn't reach here given Citizenship type)
  return {
    scheme_id: 'comcare',
    scheme_name: 'ComCare',
    status: 'not_applicable',
    reason: 'ComCare eligibility could not be determined.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
