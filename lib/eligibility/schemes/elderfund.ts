/**
 * ElderFund Scheme Checker
 *
 * ElderFund provides monthly cash payouts for lower-income disabled
 * Singaporeans who require full assistance with daily living activities.
 *
 * Rules:
 * - SC AND age ≥ 30 AND monthly PCHI ≤ $1,500 AND MediSave < $10,000
 *   AND requires full ADL assistance (at least 3 of 6 ADLs)
 *   AND NOT CareShield Life or ElderShield policyholder → unclaimed
 * - All other cases → not_applicable
 *
 * Payout: Up to $250/month (subject to assessment)
 *
 * Source: AIC ElderFund page
 * Verified: 2024-10-01
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://www.aic.sg/financial-assistance/elderfund'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check ElderFund eligibility.
 *
 * All six criteria must be met:
 * 1. Citizenship = SC
 * 2. Age ≥ 30
 * 3. Monthly PCHI ≤ $1,500
 * 4. MediSave balance < $10,000
 * 5. Requires full ADL assistance (at least 3 of 6 ADLs)
 * 6. NOT a CareShield Life or ElderShield policyholder
 */
export function checkElderFund(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'elderfund',
      scheme_name: 'ElderFund',
      status: 'not_applicable',
      reason: 'ElderFund is only available to Singapore Citizens.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.age < 30) {
    return {
      scheme_id: 'elderfund',
      scheme_name: 'ElderFund',
      status: 'not_applicable',
      reason: 'ElderFund is for Singapore Citizens aged 30 and above.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.monthly_pchi > 1500) {
    return {
      scheme_id: 'elderfund',
      scheme_name: 'ElderFund',
      status: 'not_applicable',
      reason: 'Your monthly PCHI exceeds $1,500. ElderFund requires PCHI of $1,500 or below.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  const medisaveBalance = profile.medisave_balance ?? Infinity
  if (medisaveBalance >= 10000) {
    return {
      scheme_id: 'elderfund',
      scheme_name: 'ElderFund',
      status: 'not_applicable',
      reason: 'Your MediSave balance is $10,000 or above. ElderFund requires a MediSave balance below $10,000.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (!profile.adl_needs_assistance) {
    return {
      scheme_id: 'elderfund',
      scheme_name: 'ElderFund',
      status: 'not_applicable',
      reason: 'ElderFund requires full assistance with at least 3 of 6 Activities of Daily Living (ADLs).',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (profile.is_careshield_or_eldershield) {
    return {
      scheme_id: 'elderfund',
      scheme_name: 'ElderFund',
      status: 'not_applicable',
      reason: 'ElderFund is not available to CareShield Life or ElderShield policyholders.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'elderfund',
    scheme_name: 'ElderFund',
    status: 'unclaimed',
    reason: 'You may qualify for ElderFund monthly payouts of up to $250/month based on your age, income, MediSave balance, and care needs.',
    action_steps: [
      'Apply online at aic.sg',
      'Or email apply@aic.sg',
    ],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
