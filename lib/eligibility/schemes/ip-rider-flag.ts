/**
 * IP Rider Flag — Scheme Checker
 *
 * Checks the user's Integrated Shield Plan rider status relative to
 * the April 2026 regulatory changes. This is informational — it flags
 * how the policy restructuring affects their coverage.
 *
 * Key rules (Requirement 16):
 * - has_ip_rider = true AND ip_rider_date = 'after_april_2026'
 *   → warning about deductible coverage ban, co-payment cap $6,000
 * - has_ip_rider = true AND ip_rider_date = 'before_april_2026'
 *   → info about grandfathering (existing policies retain current benefits)
 * - has_ip_rider = false OR ip_rider_date = 'none'
 *   → not_applicable (skip entirely)
 */

import type { UserProfile, SchemeMatch } from '../types'

const SOURCE_URL = 'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans'
const VERIFIED_DATE = '2024-10-01'

/**
 * Check IP Rider flag status.
 * Returns a warning, info, or not_applicable based on the rider date.
 */
export function checkIpRiderFlag(profile: UserProfile): SchemeMatch {
  // No IP rider → skip entirely
  if (!profile.has_ip_rider || profile.ip_rider_date === 'none') {
    return {
      scheme_id: 'ip-rider-flag',
      scheme_name: 'IP Rider Flag',
      status: 'not_applicable',
      reason: 'No IP rider detected.',
      action_steps: [],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  // IP rider purchased after April 2026 — new rules apply
  if (profile.ip_rider_date === 'after_april_2026') {
    return {
      scheme_id: 'ip-rider-flag',
      scheme_name: 'IP Rider Flag',
      status: 'unclaimed',
      reason:
        'Warning: Your IP rider was purchased after April 2026. Under the new rules, ' +
        'riders can no longer cover the MediShield Life deductible or co-insurance. ' +
        'Your co-payment is capped at $6,000 per policy year.',
      action_steps: [
        'Review your IP rider policy terms with your insurer.',
        'Check if your insurer offers transitional benefits or top-up plans.',
        'Budget for up to $6,000 co-payment per policy year.',
      ],
      source_url: SOURCE_URL,
      verified_date: VERIFIED_DATE,
    }
  }

  // IP rider purchased before April 2026 — grandfathered
  return {
    scheme_id: 'ip-rider-flag',
    scheme_name: 'IP Rider Flag',
    status: 'auto_applied',
    reason:
      'Your IP rider was purchased before April 2026. Existing policies retain their ' +
      'current benefits under grandfathering provisions. Your rider continues to cover ' +
      'the deductible and co-insurance as per your original policy terms.',
    action_steps: [],
    source_url: SOURCE_URL,
    verified_date: VERIFIED_DATE,
  }
}
