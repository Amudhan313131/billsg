/**
 * CHAS (Community Health Assist Scheme) Checkers
 *
 * Three tiers: Blue (lowest income), Orange (mid income), Green (all SCs).
 * All CHAS schemes are not_applicable for PR and Foreigners.
 *
 * Source: https://www.chas.sg
 * Verified: 2024-10-01
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://www.chas.sg'
const VERIFIED_DATE = '2024-10-01'

/**
 * CHAS Blue — for lower-income Singapore Citizens.
 *
 * Eligible if SC AND (monthly PCHI ≤ $1,500 OR annual value ≤ $21,000).
 * Requirement 5.
 */
export function checkChasBlue(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'chas-blue',
      scheme_name: 'CHAS Blue',
      status: 'not_applicable',
      reason: 'CHAS Blue is only available to Singapore Citizens.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  const eligible =
    profile.monthly_pchi <= 1500 || profile.annual_value <= 21000

  if (eligible) {
    return {
      scheme_id: 'chas-blue',
      scheme_name: 'CHAS Blue',
      status: 'unclaimed',
      reason:
        'You may qualify for CHAS Blue subsidies based on your household income or property annual value.',
      action_steps: [
        'Apply online at chas.sg',
        'Or call the CHAS hotline at 1800-275-2427',
      ],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'chas-blue',
    scheme_name: 'CHAS Blue',
    status: 'not_applicable',
    reason:
      'Your monthly PCHI exceeds $1,500 and annual value exceeds $21,000. You do not meet CHAS Blue criteria.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}

/**
 * CHAS Orange — for mid-income Singapore Citizens.
 *
 * Eligible if SC AND monthly PCHI between $1,501 and $2,300.
 * Requirement 6.
 */
export function checkChasOrange(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'chas-orange',
      scheme_name: 'CHAS Orange',
      status: 'not_applicable',
      reason: 'CHAS Orange is only available to Singapore Citizens.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  const eligible =
    profile.monthly_pchi >= 1501 && profile.monthly_pchi <= 2300

  if (eligible) {
    return {
      scheme_id: 'chas-orange',
      scheme_name: 'CHAS Orange',
      status: 'unclaimed',
      reason:
        'You may qualify for CHAS Orange subsidies based on your household income.',
      action_steps: ['Apply online at chas.sg'],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'chas-orange',
    scheme_name: 'CHAS Orange',
    status: 'not_applicable',
    reason:
      'Your monthly PCHI is outside the $1,501–$2,300 range for CHAS Orange.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}

/**
 * CHAS Green — for all Singapore Citizens regardless of income.
 *
 * Eligible if SC (no income or AV criteria).
 * Requirement 7.
 */
export function checkChasGreen(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'chas-green',
      scheme_name: 'CHAS Green',
      status: 'not_applicable',
      reason: 'CHAS Green is only available to Singapore Citizens.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'chas-green',
    scheme_name: 'CHAS Green',
    status: 'unclaimed',
    reason:
      'All Singapore Citizens are eligible for CHAS Green regardless of income.',
    action_steps: ['Apply online at chas.sg'],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
