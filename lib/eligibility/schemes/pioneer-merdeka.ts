/**
 * Pioneer Generation & Merdeka Generation Scheme Checkers
 *
 * Pioneer Generation Package:
 * - SC AND is_pioneer = true → unclaimed (user should verify benefits are applied)
 * - PR/Foreigner → not applicable
 *
 * Merdeka Generation Package:
 * - SC AND is_merdeka = true → unclaimed (user should verify benefits are applied)
 * - PR/Foreigner → not applicable
 *
 * Since UserProfile does not include a "registered" flag, we default to
 * status = 'unclaimed' when eligible — the user hasn't confirmed registration.
 *
 * If unclaimed → action: Call 1800-2222-888
 */

import type { UserProfile, SchemeMatch } from '../types'

const PIONEER_SOURCE_URL = 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/pioneer-generation-package'
const MERDEKA_SOURCE_URL = 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/merdeka-generation-package'
const VERIFIED_DATE = '2024-10-01'

const PIONEER_ACTION_STEPS = [
  'Call 1800-2222-888 to verify your Pioneer Generation benefits are applied',
]

const MERDEKA_ACTION_STEPS = [
  'Call 1800-2222-888 to verify your Merdeka Generation benefits are applied',
]

/**
 * Check Pioneer Generation Package eligibility.
 *
 * - SC AND is_pioneer → unclaimed (should verify benefits)
 * - SC AND NOT is_pioneer → not_applicable
 * - PR/Foreigner → not_applicable
 */
export function checkPioneer(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'pioneer-generation',
      scheme_name: 'Pioneer Generation Package',
      status: 'not_applicable',
      reason: 'Pioneer Generation Package is only available to Singapore Citizens.',
      action_steps: [],
      source_url: PIONEER_SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (!profile.is_pioneer) {
    return {
      scheme_id: 'pioneer-generation',
      scheme_name: 'Pioneer Generation Package',
      status: 'not_applicable',
      reason: 'You are not identified as a Pioneer Generation member. This package applies to Singapore Citizens born before 1 Jan 1950 who obtained citizenship before 31 Dec 1986.',
      action_steps: [],
      source_url: PIONEER_SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'pioneer-generation',
    scheme_name: 'Pioneer Generation Package',
    status: 'unclaimed',
    reason: 'As a Pioneer Generation member, you may qualify for additional subsidies and benefits. Call to verify your benefits are applied to this bill.',
    action_steps: PIONEER_ACTION_STEPS,
    source_url: PIONEER_SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}

/**
 * Check Merdeka Generation Package eligibility.
 *
 * - SC AND is_merdeka → unclaimed (should verify benefits)
 * - SC AND NOT is_merdeka → not_applicable
 * - PR/Foreigner → not_applicable
 */
export function checkMerdeka(profile: UserProfile): SchemeMatch {
  if (profile.citizenship !== 'SC') {
    return {
      scheme_id: 'merdeka-generation',
      scheme_name: 'Merdeka Generation Package',
      status: 'not_applicable',
      reason: 'Merdeka Generation Package is only available to Singapore Citizens.',
      action_steps: [],
      source_url: MERDEKA_SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  if (!profile.is_merdeka) {
    return {
      scheme_id: 'merdeka-generation',
      scheme_name: 'Merdeka Generation Package',
      status: 'not_applicable',
      reason: 'You are not identified as a Merdeka Generation member. This package applies to Singapore Citizens born between 1 Jan 1950 and 31 Dec 1959 who obtained citizenship by 31 Dec 1996, or those born before 1950 who are not Pioneer Generation members and obtained citizenship by 31 Dec 1996.',
      action_steps: [],
      source_url: MERDEKA_SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  return {
    scheme_id: 'merdeka-generation',
    scheme_name: 'Merdeka Generation Package',
    status: 'unclaimed',
    reason: 'As a Merdeka Generation member, you may qualify for additional subsidies and benefits. Call to verify your benefits are applied to this bill.',
    action_steps: MERDEKA_ACTION_STEPS,
    source_url: MERDEKA_SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
