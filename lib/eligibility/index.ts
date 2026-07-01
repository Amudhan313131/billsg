/**
 * Eligibility Matrix — Rules Engine Entry Point
 *
 * Single entry point that evaluates all scheme checkers against a UserProfile
 * and returns a complete SchemeMatch[] array. Pure, deterministic, never throws.
 */

import type { UserProfile, SchemeMatch } from './types'

// Scheme checker imports — files created in subsequent tasks
import { checkGovernmentSubsidy } from './schemes/government-subsidy'
import { checkMediShieldLife } from './schemes/medishield-life'
import { checkMediSave } from './schemes/medisave'
import { checkChasBlue, checkChasOrange, checkChasGreen } from './schemes/chas'
import { checkPioneer, checkMerdeka } from './schemes/pioneer-merdeka'
import { checkMediFund, checkMediFundSilver, checkMediFundJunior } from './schemes/medifund'
import { checkMaf } from './schemes/maf'
import { checkElderFund } from './schemes/elderfund'
import { checkComCare } from './schemes/comcare'
import { checkFlexiMediSave } from './schemes/flexi-medisave'
import { checkIpRiderFlag } from './schemes/ip-rider-flag'

/** All scheme checker functions in evaluation order */
const schemeCheckers: Array<{
  id: string
  name: string
  fn: (profile: UserProfile) => SchemeMatch
}> = [
  { id: 'government-subsidy', name: 'Government Subsidy', fn: checkGovernmentSubsidy },
  { id: 'medishield-life', name: 'MediShield Life', fn: checkMediShieldLife },
  { id: 'medisave', name: 'MediSave', fn: checkMediSave },
  { id: 'chas-blue', name: 'CHAS Blue', fn: checkChasBlue },
  { id: 'chas-orange', name: 'CHAS Orange', fn: checkChasOrange },
  { id: 'chas-green', name: 'CHAS Green', fn: checkChasGreen },
  { id: 'pioneer-generation', name: 'Pioneer Generation Package', fn: checkPioneer },
  { id: 'merdeka-generation', name: 'Merdeka Generation Package', fn: checkMerdeka },
  { id: 'medifund', name: 'MediFund', fn: checkMediFund },
  { id: 'medifund-silver', name: 'MediFund Silver', fn: checkMediFundSilver },
  { id: 'medifund-junior', name: 'MediFund Junior', fn: checkMediFundJunior },
  { id: 'maf', name: 'Medication Assistance Fund (MAF)', fn: checkMaf },
  { id: 'elderfund', name: 'ElderFund', fn: checkElderFund },
  { id: 'comcare', name: 'ComCare', fn: checkComCare },
  { id: 'flexi-medisave', name: 'Flexi-MediSave', fn: checkFlexiMediSave },
  { id: 'ip-rider-flag', name: 'IP Rider Flag', fn: checkIpRiderFlag },
]

/**
 * Evaluate all scheme eligibility rules against a user profile.
 *
 * - Never throws: errors from individual checkers are caught and returned
 *   as not_applicable with a generic reason.
 * - Halts early with a data error if Pioneer AND Merdeka are both true
 *   (per Requirement 17.6).
 * - Returns one SchemeMatch per scheme — no scheme is ever skipped.
 */
export function checkEligibility(profile: UserProfile): SchemeMatch[] {
  // Edge case: Pioneer + Merdeka both true is a data error (Requirement 17.6)
  if (profile.is_pioneer && profile.is_merdeka) {
    return schemeCheckers.map(({ id, name }) => ({
      scheme_id: id,
      scheme_name: name,
      status: 'not_applicable' as const,
      reason: 'Data error: profile has both Pioneer and Merdeka Generation flags set. Please correct your profile.',
      action_steps: [],
      source_url: '',
      verified_date: new Date().toISOString().split('T')[0],
    }))
  }

  const results: SchemeMatch[] = []

  for (const { id, name, fn } of schemeCheckers) {
    try {
      results.push(fn(profile))
    } catch {
      // Never throw — return a safe fallback for any checker that errors
      results.push({
        scheme_id: id,
        scheme_name: name,
        status: 'not_applicable',
        reason: 'Could not evaluate this scheme.',
        action_steps: [],
        source_url: '',
        verified_date: new Date().toISOString().split('T')[0],
      })
    }
  }

  return results
}
