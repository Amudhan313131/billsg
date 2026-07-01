import { describe, it, expect } from 'vitest'
import { checkGovernmentSubsidy } from './government-subsidy'
import type { UserProfile } from '../types'

/** Helper to create a minimal valid UserProfile with overrides */
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

describe('checkGovernmentSubsidy', () => {
  describe('Foreigner', () => {
    it('returns not_applicable for Foreigners', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'Foreigner' }))
      expect(result.status).toBe('not_applicable')
      expect(result.scheme_id).toBe('government-subsidy')
      expect(result.reason).toContain('Singapore Citizens and Permanent Residents')
    })
  })

  describe('Singapore Citizen PCHI brackets', () => {
    it('PCHI ≤ $2,100 → 80% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 2100 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('80%')
    })

    it('PCHI $2,100 < x ≤ $2,300 → 75% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 2200 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('75%')
    })

    it('PCHI $2,300 < x ≤ $2,600 → 70% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 2500 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('70%')
    })

    it('PCHI $2,600 < x ≤ $3,000 → 65% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 2800 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('65%')
    })

    it('PCHI $3,000 < x ≤ $3,300 → 60% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 3200 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('60%')
    })

    it('PCHI $3,300 < x ≤ $3,600 → 55% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 3500 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('55%')
    })

    it('PCHI > $3,600 → 50% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 5000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('50%')
    })

    it('boundary: PCHI exactly $2,100 → 80%', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 2100 }))
      expect(result.reason).toContain('80%')
    })

    it('boundary: PCHI exactly $2,300 → 75%', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 2300 }))
      expect(result.reason).toContain('75%')
    })

    it('boundary: PCHI exactly $2,600 → 70%', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 2600 }))
      expect(result.reason).toContain('70%')
    })

    it('boundary: PCHI exactly $3,000 → 65%', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 3000 }))
      expect(result.reason).toContain('65%')
    })

    it('boundary: PCHI exactly $3,300 → 60%', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 3300 }))
      expect(result.reason).toContain('60%')
    })

    it('boundary: PCHI exactly $3,600 → 55%', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 3600 }))
      expect(result.reason).toContain('55%')
    })

    it('boundary: PCHI = $3,601 → 50%', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 3601 }))
      expect(result.reason).toContain('50%')
    })
  })

  describe('Permanent Resident PCHI brackets', () => {
    it('PCHI ≤ $2,100 → 50% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 2000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('50%')
    })

    it('PCHI $2,100 < x ≤ $2,300 → 42.5% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 2200 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('42.5%')
    })

    it('PCHI $2,300 < x ≤ $2,600 → 35% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 2500 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('35%')
    })

    it('PCHI $2,600 < x ≤ $3,000 → 32.5% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 2800 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('32.5%')
    })

    it('PCHI $3,000 < x ≤ $3,300 → 30% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 3200 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('30%')
    })

    it('PCHI $3,300 < x ≤ $3,600 → 27.5% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 3500 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('27.5%')
    })

    it('PCHI > $3,600 → 25% subsidy', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 5000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('25%')
    })
  })

  describe('PCHI = 0 edge case (use Annual Value)', () => {
    it('SC with PCHI = 0 and AV ≤ $21,000 → 80% (lowest bracket)', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 0, annual_value: 15000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('80%')
    })

    it('SC with PCHI = 0 and AV = $21,000 → 80% (boundary)', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 0, annual_value: 21000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('80%')
    })

    it('SC with PCHI = 0 and AV > $21,000 → 50% (bottom tier)', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 0, annual_value: 25000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('50%')
    })

    it('PR with PCHI = 0 and AV ≤ $21,000 → 50% (lowest bracket)', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 0, annual_value: 15000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('50%')
    })

    it('PR with PCHI = 0 and AV > $21,000 → 25% (bottom tier)', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR', monthly_pchi: 0, annual_value: 25000 }))
      expect(result.status).toBe('auto_applied')
      expect(result.reason).toContain('25%')
    })
  })

  describe('SchemeMatch output fields', () => {
    it('includes correct scheme_id and scheme_name', () => {
      const result = checkGovernmentSubsidy(makeProfile())
      expect(result.scheme_id).toBe('government-subsidy')
      expect(result.scheme_name).toBe('Government Subsidy')
    })

    it('includes source_url pointing to MOH website', () => {
      const result = checkGovernmentSubsidy(makeProfile())
      expect(result.source_url).toContain('moh.gov.sg')
    })

    it('includes verified_date as 2024-10-01', () => {
      const result = checkGovernmentSubsidy(makeProfile())
      expect(result.verified_date).toBe('2024-10-01')
    })

    it('auto_applied status has empty action_steps', () => {
      const result = checkGovernmentSubsidy(makeProfile())
      expect(result.action_steps).toEqual([])
    })

    it('not_applicable status has empty action_steps', () => {
      const result = checkGovernmentSubsidy(makeProfile({ citizenship: 'Foreigner' }))
      expect(result.action_steps).toEqual([])
    })

    it('reason includes subsidy rate for eligible users', () => {
      const result = checkGovernmentSubsidy(makeProfile({ monthly_pchi: 1200 }))
      expect(result.reason).toMatch(/\d+%/)
    })

    it('reason includes citizenship label', () => {
      const scResult = checkGovernmentSubsidy(makeProfile({ citizenship: 'SC' }))
      expect(scResult.reason).toContain('Singapore Citizen')

      const prResult = checkGovernmentSubsidy(makeProfile({ citizenship: 'PR' }))
      expect(prResult.reason).toContain('Permanent Resident')
    })
  })
})
