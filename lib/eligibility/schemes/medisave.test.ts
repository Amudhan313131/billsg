import { describe, it, expect } from 'vitest'
import { checkMediSave } from './medisave'
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

describe('checkMediSave', () => {
  it('returns auto_applied for Singapore Citizen', () => {
    const result = checkMediSave(makeProfile({ citizenship: 'SC' }))
    expect(result.status).toBe('auto_applied')
    expect(result.scheme_id).toBe('medisave')
    expect(result.scheme_name).toBe('MediSave')
    expect(result.source_url).toBe('https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medisave/')
    expect(result.verified_date).toBe('2024-10-01')
  })

  it('returns auto_applied for Permanent Resident', () => {
    const result = checkMediSave(makeProfile({ citizenship: 'PR' }))
    expect(result.status).toBe('auto_applied')
  })

  it('returns not_applicable for Foreigner', () => {
    const result = checkMediSave(makeProfile({ citizenship: 'Foreigner' }))
    expect(result.status).toBe('not_applicable')
    expect(result.reason).toContain('only available to Singapore Citizens and Permanent Residents')
  })

  it('includes withdrawal limit info in reason for SC/PR', () => {
    const result = checkMediSave(makeProfile({ citizenship: 'SC' }))
    expect(result.reason).toContain('Withdrawal limits')
  })

  it('has empty action_steps for auto_applied', () => {
    const result = checkMediSave(makeProfile({ citizenship: 'SC' }))
    expect(result.action_steps).toEqual([])
  })

  it('has empty action_steps for not_applicable', () => {
    const result = checkMediSave(makeProfile({ citizenship: 'Foreigner' }))
    expect(result.action_steps).toEqual([])
  })
})
