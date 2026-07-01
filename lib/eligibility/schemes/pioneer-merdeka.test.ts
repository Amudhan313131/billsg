import { describe, it, expect } from 'vitest'
import { checkPioneer, checkMerdeka } from './pioneer-merdeka'
import type { UserProfile } from '../types'

/** Helper to create a base UserProfile with sensible defaults */
function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    citizenship: 'SC',
    age: 68,
    monthly_pchi: 1200,
    annual_value: 15000,
    is_pioneer: false,
    is_merdeka: false,
    has_ip_rider: false,
    ip_rider_date: 'none',
    ...overrides,
  }
}

describe('checkPioneer', () => {
  it('returns unclaimed for SC pioneer with action to call hotline', () => {
    const result = checkPioneer(makeProfile({ is_pioneer: true }))
    expect(result.scheme_id).toBe('pioneer-generation')
    expect(result.scheme_name).toBe('Pioneer Generation Package')
    expect(result.status).toBe('unclaimed')
    expect(result.action_steps).toContain(
      'Call 1800-2222-888 to verify your Pioneer Generation benefits are applied'
    )
    expect(result.source_url).toBe('https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/pioneer-generation-package')
    expect(result.verified_date).toBe('2024-10-01')
  })

  it('returns not_applicable for SC non-pioneer', () => {
    const result = checkPioneer(makeProfile({ is_pioneer: false }))
    expect(result.status).toBe('not_applicable')
    expect(result.action_steps).toEqual([])
  })

  it('returns not_applicable for PR', () => {
    const result = checkPioneer(makeProfile({ citizenship: 'PR', is_pioneer: true }))
    expect(result.status).toBe('not_applicable')
    expect(result.reason).toContain('Singapore Citizens')
  })

  it('returns not_applicable for Foreigner', () => {
    const result = checkPioneer(makeProfile({ citizenship: 'Foreigner', is_pioneer: true }))
    expect(result.status).toBe('not_applicable')
    expect(result.reason).toContain('Singapore Citizens')
  })
})

describe('checkMerdeka', () => {
  it('returns unclaimed for SC merdeka with action to call hotline', () => {
    const result = checkMerdeka(makeProfile({ is_merdeka: true }))
    expect(result.scheme_id).toBe('merdeka-generation')
    expect(result.scheme_name).toBe('Merdeka Generation Package')
    expect(result.status).toBe('unclaimed')
    expect(result.action_steps).toContain(
      'Call 1800-2222-888 to verify your Merdeka Generation benefits are applied'
    )
    expect(result.source_url).toBe('https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/merdeka-generation-package')
    expect(result.verified_date).toBe('2024-10-01')
  })

  it('returns not_applicable for SC non-merdeka', () => {
    const result = checkMerdeka(makeProfile({ is_merdeka: false }))
    expect(result.status).toBe('not_applicable')
    expect(result.action_steps).toEqual([])
  })

  it('returns not_applicable for PR', () => {
    const result = checkMerdeka(makeProfile({ citizenship: 'PR', is_merdeka: true }))
    expect(result.status).toBe('not_applicable')
    expect(result.reason).toContain('Singapore Citizens')
  })

  it('returns not_applicable for Foreigner', () => {
    const result = checkMerdeka(makeProfile({ citizenship: 'Foreigner', is_merdeka: true }))
    expect(result.status).toBe('not_applicable')
    expect(result.reason).toContain('Singapore Citizens')
  })
})
