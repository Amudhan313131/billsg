import { describe, it, expect } from 'vitest'
import { checkIpRiderFlag } from './ip-rider-flag'
import type { UserProfile } from '../types'

/** Helper to create a base profile with defaults */
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

describe('checkIpRiderFlag', () => {
  describe('after_april_2026', () => {
    it('returns unclaimed with warning about deductible coverage ban and $6,000 cap', () => {
      const profile = makeProfile({
        has_ip_rider: true,
        ip_rider_date: 'after_april_2026',
      })
      const result = checkIpRiderFlag(profile)

      expect(result.scheme_id).toBe('ip-rider-flag')
      expect(result.scheme_name).toBe('IP Rider Flag')
      expect(result.status).toBe('unclaimed')
      expect(result.reason).toContain('after April 2026')
      expect(result.reason).toContain('deductible')
      expect(result.reason).toContain('$6,000')
      expect(result.action_steps.length).toBeGreaterThan(0)
      expect(result.action_steps[0]).toContain('insurer')
      expect(result.source_url).toBe(
        'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans'
      )
      expect(result.verified_date).toBe('2024-10-01')
    })
  })

  describe('before_april_2026', () => {
    it('returns auto_applied with info about grandfathering', () => {
      const profile = makeProfile({
        has_ip_rider: true,
        ip_rider_date: 'before_april_2026',
      })
      const result = checkIpRiderFlag(profile)

      expect(result.scheme_id).toBe('ip-rider-flag')
      expect(result.scheme_name).toBe('IP Rider Flag')
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('before April 2026')
      expect(result.reason).toContain('grandfathering')
      expect(result.reason).toContain('retain')
      expect(result.action_steps).toEqual([])
      expect(result.source_url).toBe(
        'https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans'
      )
      expect(result.verified_date).toBe('2024-10-01')
    })
  })

  describe('none (no IP rider)', () => {
    it('returns not_applicable when has_ip_rider is false', () => {
      const profile = makeProfile({
        has_ip_rider: false,
        ip_rider_date: 'none',
      })
      const result = checkIpRiderFlag(profile)

      expect(result.scheme_id).toBe('ip-rider-flag')
      expect(result.scheme_name).toBe('IP Rider Flag')
      expect(result.status).toBe('not_applicable')
      expect(result.reason).toBe('No IP rider detected.')
      expect(result.action_steps).toEqual([])
    })

    it('returns not_applicable when has_ip_rider is true but ip_rider_date is none', () => {
      const profile = makeProfile({
        has_ip_rider: true,
        ip_rider_date: 'none',
      })
      const result = checkIpRiderFlag(profile)

      expect(result.status).toBe('not_applicable')
      expect(result.reason).toBe('No IP rider detected.')
    })

    it('returns not_applicable when has_ip_rider is false even with a date set', () => {
      const profile = makeProfile({
        has_ip_rider: false,
        ip_rider_date: 'after_april_2026',
      })
      const result = checkIpRiderFlag(profile)

      expect(result.status).toBe('not_applicable')
      expect(result.reason).toBe('No IP rider detected.')
    })
  })

  describe('edge cases from Requirement 17', () => {
    it('works for Foreigner with IP rider (still returns the flag)', () => {
      const profile = makeProfile({
        citizenship: 'Foreigner',
        has_ip_rider: true,
        ip_rider_date: 'after_april_2026',
      })
      const result = checkIpRiderFlag(profile)

      // IP rider flag is citizenship-agnostic — it flags anyone with a rider
      expect(result.status).toBe('unclaimed')
      expect(result.reason).toContain('$6,000')
    })

    it('works for PR with IP rider before April 2026', () => {
      const profile = makeProfile({
        citizenship: 'PR',
        has_ip_rider: true,
        ip_rider_date: 'before_april_2026',
      })
      const result = checkIpRiderFlag(profile)

      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('grandfathering')
    })
  })
})
