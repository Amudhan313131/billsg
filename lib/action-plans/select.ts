/**
 * Action Plan Templates — Selection Logic
 *
 * Selects the correct action plan template for a given scheme_id and user profile.
 * Returns null for schemes that are always auto_applied.
 */

import type { UserProfile } from '../eligibility/types'
import type { ActionPlan } from './types'
import { TEMPLATES } from './templates'

/** Schemes that are always auto_applied and never produce an action plan */
const AUTO_APPLIED_SCHEMES = [
  'government_subsidy',
  'medishield_life',
  'medisave',
]

/**
 * Returns the appropriate ActionPlan template for a given scheme, or null
 * if the scheme is auto_applied or has no matching template.
 *
 * Special rules:
 * - government_subsidy, medishield_life, medisave → always null
 * - medifund_silver + age < 18 → returns medifund_junior template
 */
export function getActionPlan(
  scheme_id: string,
  userProfile: UserProfile
): ActionPlan | null {
  if (AUTO_APPLIED_SCHEMES.includes(scheme_id)) {
    return null
  }

  // Age-based MediFund routing: children get Junior, not Silver
  if (scheme_id === 'medifund_silver' && userProfile.age < 18) {
    return TEMPLATES['medifund_junior'] ?? null
  }

  return TEMPLATES[scheme_id] ?? null
}
