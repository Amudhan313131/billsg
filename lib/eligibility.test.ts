import { describe, it, expect } from 'vitest'
import { checkEligibility } from './eligibility/index'
import type { UserProfile, SchemeMatch } from './eligibility/types'

/**
 * Unit tests for checkEligibility() — the deterministic eligibility rules engine.
 *
 * Test cases derived from:
 * - .kiro/specs/eligibility-matrix/requirements.md
 * - UserProfile fields as defined in onboarding spec
 *
 * Test names describe scenarios in plain English for documentation readability.
 */

/** Helper to create a UserProfile with sensible defaults */
function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    citizenship: 'SC',
    age: 45,
    monthly_pchi: 2000,
    annual_value: 15000,
    is_pioneer: false,
    is_merdeka: false,
    has_ip_rider: false,
    ip_rider_date: 'none',
    ...overrides,
  }
}

/** Helper to find a scheme result by its ID */
function findScheme(results: SchemeMatch[], schemeId: string): SchemeMatch | undefined {
  return results.find((r) => r.scheme_id === schemeId)
}

describe('checkEligibility — Core Scenarios', () => {
  it('Singapore Citizen aged 68 with Pioneer status and PCHI $1,200 qualifies for Pioneer Generation, MediFund Silver, and CHAS Blue as unclaimed', () => {
    const results = checkEligibility(makeProfile({
      citizenship: 'SC',
      age: 68,
      monthly_pchi: 1200,
      is_pioneer: true,
      difficulty_paying: true,
    }))

    expect(findScheme(results, 'pioneer-generation')?.status).toBe('unclaimed')
    expect(findScheme(results, 'medifund-silver')?.status).toBe('unclaimed')
    expect(findScheme(results, 'chas-blue')?.status).toBe('unclaimed')
  })

  it('Permanent Resident aged 45 with PCHI $2,000 does not qualify for Pioneer Generation or MediFund Silver', () => {
    const results = checkEligibility(makeProfile({
      citizenship: 'PR',
      age: 45,
      monthly_pchi: 2000,
    }))

    expect(findScheme(results, 'pioneer-generation')?.status).toBe('not_applicable')
    expect(findScheme(results, 'medifund-silver')?.status).toBe('not_applicable')
  })

  it('Foreigner receives not_applicable for all schemes', () => {
    const results = checkEligibility(makeProfile({
      citizenship: 'Foreigner',
      age: 40,
      monthly_pchi: 2000,
    }))

    for (const result of results) {
      expect(result.status).toBe('not_applicable')
    }
  })

  it('Singapore Citizen aged 15 with difficulty paying qualifies for MediFund Junior as unclaimed', () => {
    const results = checkEligibility(makeProfile({
      citizenship: 'SC',
      age: 15,
      monthly_pchi: 1000,
      difficulty_paying: true,
    }))

    expect(findScheme(results, 'medifund-junior')?.status).toBe('unclaimed')
  })

  it('Singapore Citizen with PCHI $0 and annual value $15,000 receives 80% government subsidy tier', () => {
    const results = checkEligibility(makeProfile({
      citizenship: 'SC',
      monthly_pchi: 0,
      annual_value: 15000,
    }))

    const govSubsidy = findScheme(results, 'government-subsidy')
    expect(govSubsidy?.status).toBe('auto_applied')
    expect(govSubsidy?.reason).toContain('80%')
  })
})

describe('checkEligibility — Edge Cases', () => {
  it('Profile with both is_pioneer and is_merdeka set to true triggers a data error and returns not_applicable for all schemes', () => {
    const results = checkEligibility(makeProfile({
      citizenship: 'SC',
      age: 70,
      is_pioneer: true,
      is_merdeka: true,
    }))

    for (const result of results) {
      expect(result.status).toBe('not_applicable')
      expect(result.reason).toContain('Data error')
    }
  })

  it('Permanent Resident does not match SC-only schemes like CHAS, Pioneer, Merdeka, and MediFund', () => {
    const results = checkEligibility(makeProfile({
      citizenship: 'PR',
      age: 55,
      monthly_pchi: 1000,
      is_pioneer: false,
      is_merdeka: false,
    }))

    // All CHAS schemes are SC-only
    expect(findScheme(results, 'chas-blue')?.status).toBe('not_applicable')
    expect(findScheme(results, 'chas-orange')?.status).toBe('not_applicable')
    expect(findScheme(results, 'chas-green')?.status).toBe('not_applicable')

    // Pioneer and Merdeka are SC-only
    expect(findScheme(results, 'pioneer-generation')?.status).toBe('not_applicable')
    expect(findScheme(results, 'merdeka-generation')?.status).toBe('not_applicable')

    // MediFund variants are SC-only
    expect(findScheme(results, 'medifund')?.status).toBe('not_applicable')
    expect(findScheme(results, 'medifund-silver')?.status).toBe('not_applicable')
    expect(findScheme(results, 'medifund-junior')?.status).toBe('not_applicable')

    // ElderFund is SC-only
    expect(findScheme(results, 'elderfund')?.status).toBe('not_applicable')
  })
})
