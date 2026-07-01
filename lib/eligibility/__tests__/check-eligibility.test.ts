import { describe, it, expect } from 'vitest'
import { checkEligibility } from '../index'
import type { UserProfile } from '../types'

/** Helper to create a minimal valid UserProfile with sensible defaults */
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

/** Helper to find a scheme result by scheme_id */
function findScheme(results: ReturnType<typeof checkEligibility>, schemeId: string) {
  return results.find((r) => r.scheme_id === schemeId)
}

describe('checkEligibility — Integration Tests', () => {
  describe('1. Uncle Tan: SC, age 68, Pioneer, PCHI $1,200', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      age: 68,
      monthly_pchi: 1200,
      is_pioneer: true,
      difficulty_paying: true,
    })
    const results = checkEligibility(profile)

    it('Pioneer Generation is unclaimed', () => {
      const pioneer = findScheme(results, 'pioneer-generation')
      expect(pioneer?.status).toBe('unclaimed')
    })

    it('CHAS Blue is unclaimed', () => {
      const chasBlue = findScheme(results, 'chas-blue')
      expect(chasBlue?.status).toBe('unclaimed')
    })

    it('MediFund Silver is unclaimed (with difficulty_paying)', () => {
      const medifundSilver = findScheme(results, 'medifund-silver')
      expect(medifundSilver?.status).toBe('unclaimed')
    })

    it('Government Subsidy is auto_applied at 80%', () => {
      const govSubsidy = findScheme(results, 'government-subsidy')
      expect(govSubsidy?.status).toBe('auto_applied')
      expect(govSubsidy?.reason).toContain('80%')
    })
  })

  describe('2. Merdeka: SC, age 72, is_merdeka, PCHI $3,000', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      age: 72,
      monthly_pchi: 3000,
      is_merdeka: true,
    })
    const results = checkEligibility(profile)

    it('Merdeka Generation is unclaimed', () => {
      const merdeka = findScheme(results, 'merdeka-generation')
      expect(merdeka?.status).toBe('unclaimed')
    })

    it('CHAS Green is unclaimed', () => {
      const chasGreen = findScheme(results, 'chas-green')
      expect(chasGreen?.status).toBe('unclaimed')
    })

    it('Government Subsidy at 65% tier', () => {
      const govSubsidy = findScheme(results, 'government-subsidy')
      expect(govSubsidy?.status).toBe('auto_applied')
      expect(govSubsidy?.reason).toContain('65%')
    })
  })

  describe('3. PCHI = 0 with AV $15,000 (SC)', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      monthly_pchi: 0,
      annual_value: 15000,
    })
    const results = checkEligibility(profile)

    it('Government Subsidy at lowest bracket (80%)', () => {
      const govSubsidy = findScheme(results, 'government-subsidy')
      expect(govSubsidy?.status).toBe('auto_applied')
      expect(govSubsidy?.reason).toContain('80%')
    })

    it('CHAS Blue is unclaimed', () => {
      const chasBlue = findScheme(results, 'chas-blue')
      expect(chasBlue?.status).toBe('unclaimed')
    })
  })

  describe('4. PCHI = 0 with AV $25,000 (SC)', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      monthly_pchi: 0,
      annual_value: 25000,
    })
    const results = checkEligibility(profile)

    it('Government Subsidy at bottom tier (50%)', () => {
      const govSubsidy = findScheme(results, 'government-subsidy')
      expect(govSubsidy?.status).toBe('auto_applied')
      expect(govSubsidy?.reason).toContain('50%')
    })
  })

  describe('5. Foreigner — all not_applicable', () => {
    const profile = makeProfile({
      citizenship: 'Foreigner',
      age: 40,
      monthly_pchi: 2000,
    })
    const results = checkEligibility(profile)

    it('all schemes are not_applicable', () => {
      for (const result of results) {
        expect(result.status).toBe('not_applicable')
      }
    })

    it('MediShield Life explains coverage is for SC/PR only', () => {
      const medishield = findScheme(results, 'medishield-life')
      expect(medishield?.status).toBe('not_applicable')
      expect(medishield?.reason).toContain('Singapore Citizens and Permanent Residents')
    })
  })

  describe('6. PR, age 45, PCHI $2,000', () => {
    const profile = makeProfile({
      citizenship: 'PR',
      age: 45,
      monthly_pchi: 2000,
    })
    const results = checkEligibility(profile)

    it('Government Subsidy is auto_applied (PR tier 50%)', () => {
      const govSubsidy = findScheme(results, 'government-subsidy')
      expect(govSubsidy?.status).toBe('auto_applied')
      expect(govSubsidy?.reason).toContain('50%')
    })

    it('MediShield Life is auto_applied', () => {
      const medishield = findScheme(results, 'medishield-life')
      expect(medishield?.status).toBe('auto_applied')
    })

    it('CHAS schemes are not_applicable for PR', () => {
      expect(findScheme(results, 'chas-blue')?.status).toBe('not_applicable')
      expect(findScheme(results, 'chas-orange')?.status).toBe('not_applicable')
      expect(findScheme(results, 'chas-green')?.status).toBe('not_applicable')
    })

    it('MediFund is not_applicable for PR', () => {
      expect(findScheme(results, 'medifund')?.status).toBe('not_applicable')
      expect(findScheme(results, 'medifund-silver')?.status).toBe('not_applicable')
      expect(findScheme(results, 'medifund-junior')?.status).toBe('not_applicable')
    })
  })

  describe('7. PR ComCare SMTA with/without SC family member', () => {
    it('PR with PCHI $700 and has_sc_family_member → ComCare unclaimed', () => {
      const profile = makeProfile({
        citizenship: 'PR',
        monthly_pchi: 700,
        has_sc_family_member: true,
      })
      const results = checkEligibility(profile)
      const comcare = findScheme(results, 'comcare')
      expect(comcare?.status).toBe('unclaimed')
    })

    it('PR with PCHI $700 and no SC family member → ComCare not_applicable', () => {
      const profile = makeProfile({
        citizenship: 'PR',
        monthly_pchi: 700,
        has_sc_family_member: false,
      })
      const results = checkEligibility(profile)
      const comcare = findScheme(results, 'comcare')
      expect(comcare?.status).toBe('not_applicable')
    })
  })

  describe('8. Age < 18: SC, age 16, difficulty_paying', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      age: 16,
      difficulty_paying: true,
    })
    const results = checkEligibility(profile)

    it('MediFund Junior is unclaimed', () => {
      const junior = findScheme(results, 'medifund-junior')
      expect(junior?.status).toBe('unclaimed')
    })

    it('MediFund Silver is not_applicable', () => {
      const silver = findScheme(results, 'medifund-silver')
      expect(silver?.status).toBe('not_applicable')
    })
  })

  describe('9. Age = 18 boundary: SC, age 18, difficulty_paying', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      age: 18,
      difficulty_paying: true,
    })
    const results = checkEligibility(profile)

    it('MediFund Junior is not_applicable (age >= 18)', () => {
      const junior = findScheme(results, 'medifund-junior')
      expect(junior?.status).toBe('not_applicable')
    })

    it('MediFund is unclaimed', () => {
      const medifund = findScheme(results, 'medifund')
      expect(medifund?.status).toBe('unclaimed')
    })
  })

  describe('10. ElderFund eligible: SC, age 35, PCHI $1,200, MediSave $8,000, ADL assistance, no CareShield', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      age: 35,
      monthly_pchi: 1200,
      medisave_balance: 8000,
      adl_needs_assistance: true,
      is_careshield_or_eldershield: false,
    })
    const results = checkEligibility(profile)

    it('ElderFund is unclaimed', () => {
      const elderfund = findScheme(results, 'elderfund')
      expect(elderfund?.status).toBe('unclaimed')
    })
  })

  describe('11. ElderFund fail: MediSave too high ($12,000)', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      age: 35,
      monthly_pchi: 1200,
      medisave_balance: 12000,
      adl_needs_assistance: true,
      is_careshield_or_eldershield: false,
    })
    const results = checkEligibility(profile)

    it('ElderFund is not_applicable', () => {
      const elderfund = findScheme(results, 'elderfund')
      expect(elderfund?.status).toBe('not_applicable')
    })
  })

  describe('12. ElderFund fail: CareShield policyholder', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      age: 35,
      monthly_pchi: 1200,
      medisave_balance: 8000,
      adl_needs_assistance: true,
      is_careshield_or_eldershield: true,
    })
    const results = checkEligibility(profile)

    it('ElderFund is not_applicable', () => {
      const elderfund = findScheme(results, 'elderfund')
      expect(elderfund?.status).toBe('not_applicable')
    })
  })

  describe('13. IP rider after_april_2026', () => {
    const profile = makeProfile({
      has_ip_rider: true,
      ip_rider_date: 'after_april_2026',
    })
    const results = checkEligibility(profile)

    it('IP Rider Flag is unclaimed with $6,000 co-payment cap in reason', () => {
      const ipRider = findScheme(results, 'ip-rider-flag')
      expect(ipRider?.status).toBe('unclaimed')
      expect(ipRider?.reason).toContain('6,000')
    })
  })

  describe('14. IP rider before_april_2026', () => {
    const profile = makeProfile({
      has_ip_rider: true,
      ip_rider_date: 'before_april_2026',
    })
    const results = checkEligibility(profile)

    it('IP Rider Flag is auto_applied with grandfathering in reason', () => {
      const ipRider = findScheme(results, 'ip-rider-flag')
      expect(ipRider?.status).toBe('auto_applied')
      expect(ipRider?.reason).toContain('grandfathering')
    })
  })

  describe('15. IP rider none (has_ip_rider = false)', () => {
    const profile = makeProfile({
      has_ip_rider: false,
      ip_rider_date: 'none',
    })
    const results = checkEligibility(profile)

    it('IP Rider Flag is not_applicable', () => {
      const ipRider = findScheme(results, 'ip-rider-flag')
      expect(ipRider?.status).toBe('not_applicable')
    })
  })

  describe('16. Pioneer + Merdeka both true — data error', () => {
    const profile = makeProfile({
      citizenship: 'SC',
      is_pioneer: true,
      is_merdeka: true,
    })
    const results = checkEligibility(profile)

    it('ALL schemes return not_applicable', () => {
      for (const result of results) {
        expect(result.status).toBe('not_applicable')
      }
    })

    it('ALL schemes have data error message in reason', () => {
      for (const result of results) {
        expect(result.reason).toContain('Data error')
      }
    })
  })

  describe('17. All SC PCHI bracket boundaries', () => {
    const testCases: Array<{ pchi: number; av?: number; expectedRate: string }> = [
      { pchi: 0, av: 15000, expectedRate: '80%' },
      { pchi: 2100, expectedRate: '80%' },
      { pchi: 2300, expectedRate: '75%' },
      { pchi: 2600, expectedRate: '70%' },
      { pchi: 3000, expectedRate: '65%' },
      { pchi: 3300, expectedRate: '60%' },
      { pchi: 3600, expectedRate: '55%' },
      { pchi: 3601, expectedRate: '50%' },
    ]

    for (const { pchi, av, expectedRate } of testCases) {
      it(`PCHI $${pchi}${av ? ` (AV $${av})` : ''} → ${expectedRate} subsidy`, () => {
        const profile = makeProfile({
          citizenship: 'SC',
          monthly_pchi: pchi,
          ...(av !== undefined && { annual_value: av }),
        })
        const results = checkEligibility(profile)
        const govSubsidy = findScheme(results, 'government-subsidy')
        expect(govSubsidy?.status).toBe('auto_applied')
        expect(govSubsidy?.reason).toContain(expectedRate)
      })
    }
  })

  describe('18. CHAS tiers', () => {
    it('SC, PCHI $1,800 → CHAS Orange unclaimed', () => {
      const profile = makeProfile({ citizenship: 'SC', monthly_pchi: 1800 })
      const results = checkEligibility(profile)
      const chasOrange = findScheme(results, 'chas-orange')
      expect(chasOrange?.status).toBe('unclaimed')
    })

    it('SC, PCHI $1,400 → CHAS Blue unclaimed', () => {
      const profile = makeProfile({ citizenship: 'SC', monthly_pchi: 1400 })
      const results = checkEligibility(profile)
      const chasBlue = findScheme(results, 'chas-blue')
      expect(chasBlue?.status).toBe('unclaimed')
    })

    it('SC, any PCHI → CHAS Green unclaimed', () => {
      const profile = makeProfile({ citizenship: 'SC', monthly_pchi: 5000 })
      const results = checkEligibility(profile)
      const chasGreen = findScheme(results, 'chas-green')
      expect(chasGreen?.status).toBe('unclaimed')
    })
  })
})
