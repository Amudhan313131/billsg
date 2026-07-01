import { describe, it, expect } from 'vitest'
import {
  checkMediShieldLife,
  calculateCoInsurance,
  getDeductible,
  DEDUCTIBLES,
} from './medishield-life'
import type { UserProfile } from '../types'

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

describe('checkMediShieldLife', () => {
  it('returns auto_applied for Singapore Citizen', () => {
    const result = checkMediShieldLife(makeProfile({ citizenship: 'SC' }))
    expect(result.status).toBe('auto_applied')
    expect(result.scheme_id).toBe('medishield-life')
    expect(result.scheme_name).toBe('MediShield Life')
    expect(result.source_url).toBe('https://www.cpf.gov.sg/member/healthcare-financing/medishield-life/what-medishield-life-covers-you-for')
    expect(result.verified_date).toBe('2024-10-01')
  })

  it('returns auto_applied for Permanent Resident', () => {
    const result = checkMediShieldLife(makeProfile({ citizenship: 'PR' }))
    expect(result.status).toBe('auto_applied')
  })

  it('returns not_applicable for Foreigner', () => {
    const result = checkMediShieldLife(makeProfile({ citizenship: 'Foreigner' }))
    expect(result.status).toBe('not_applicable')
    expect(result.reason).toContain('only available to Singapore Citizens and Permanent Residents')
  })

  it('includes deductible info in reason for SC/PR', () => {
    const result = checkMediShieldLife(makeProfile({ citizenship: 'SC' }))
    expect(result.reason).toContain('$1,500')
    expect(result.reason).toContain('$2,000')
    expect(result.reason).toContain('$2,500')
    expect(result.reason).toContain('$3,500')
  })

  it('includes once-per-policy-year rule in reason', () => {
    const result = checkMediShieldLife(makeProfile({ citizenship: 'SC' }))
    expect(result.reason).toContain('only once per policy year')
  })

  it('includes co-insurance tiers in reason', () => {
    const result = checkMediShieldLife(makeProfile({ citizenship: 'PR' }))
    expect(result.reason).toContain('10%')
    expect(result.reason).toContain('5%')
    expect(result.reason).toContain('3%')
  })

  it('has empty action_steps for auto_applied', () => {
    const result = checkMediShieldLife(makeProfile({ citizenship: 'SC' }))
    expect(result.action_steps).toEqual([])
  })
})

describe('getDeductible', () => {
  it('returns $1,500 for Class C', () => {
    expect(getDeductible('C')).toBe(1500)
  })

  it('returns $2,000 for Class B2', () => {
    expect(getDeductible('B2')).toBe(2000)
  })

  it('returns $2,500 for Class B1', () => {
    expect(getDeductible('B1')).toBe(2500)
  })

  it('returns $3,500 for Class A', () => {
    expect(getDeductible('A')).toBe(3500)
  })
})

describe('calculateCoInsurance', () => {
  it('returns 0 for claimable amount of 0', () => {
    expect(calculateCoInsurance(0)).toBe(0)
  })

  it('returns 0 for negative amounts', () => {
    expect(calculateCoInsurance(-100)).toBe(0)
  })

  it('calculates 10% on amounts within first $5,000', () => {
    expect(calculateCoInsurance(1000)).toBe(100)
    expect(calculateCoInsurance(5000)).toBe(500)
  })

  it('calculates 10% on first $5,000 + 5% on next portion up to $10,000', () => {
    // $5,000 * 10% + $3,000 * 5% = $500 + $150 = $650
    expect(calculateCoInsurance(8000)).toBe(650)
    // $5,000 * 10% + $5,000 * 5% = $500 + $250 = $750
    expect(calculateCoInsurance(10000)).toBe(750)
  })

  it('calculates all three tiers for amounts above $10,000', () => {
    // $5,000 * 10% + $5,000 * 5% + $5,000 * 3% = $500 + $250 + $150 = $900
    expect(calculateCoInsurance(15000)).toBe(900)
    // $5,000 * 10% + $5,000 * 5% + $10,000 * 3% = $500 + $250 + $300 = $1050
    expect(calculateCoInsurance(20000)).toBe(1050)
  })
})

describe('DEDUCTIBLES constant', () => {
  it('covers all ward classes', () => {
    expect(Object.keys(DEDUCTIBLES).sort()).toEqual(['A', 'B1', 'B2', 'C'])
  })
})
