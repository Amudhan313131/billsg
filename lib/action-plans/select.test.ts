import { describe, it, expect } from 'vitest'
import { getActionPlan } from './select'
import { TEMPLATES } from './templates'
import type { UserProfile } from '../eligibility/types'

/** Helper to build a minimal UserProfile with overrides */
function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    citizenship: 'SC',
    age: 45,
    monthly_pchi: 1200,
    annual_value: 15000,
    is_pioneer: false,
    is_merdeka: false,
    has_ip_rider: false,
    ip_rider_date: 'none',
    ...overrides,
  }
}

describe('getActionPlan', () => {
  describe('auto_applied schemes return null', () => {
    it('returns null for government_subsidy', () => {
      expect(getActionPlan('government_subsidy', makeProfile())).toBeNull()
    })

    it('returns null for medishield_life', () => {
      expect(getActionPlan('medishield_life', makeProfile())).toBeNull()
    })

    it('returns null for medisave', () => {
      expect(getActionPlan('medisave', makeProfile())).toBeNull()
    })
  })

  describe('MediFund age-based routing', () => {
    it('returns MediFund Junior template when age < 18 and scheme_id is medifund_silver', () => {
      const plan = getActionPlan('medifund_silver', makeProfile({ age: 15 }))
      expect(plan).toEqual(TEMPLATES['medifund_junior'])
      expect(plan?.what_to_say).toBe(
        'I would like to apply for MediFund Junior'
      )
    })

    it('returns MediFund Silver template when age >= 18', () => {
      const plan = getActionPlan('medifund_silver', makeProfile({ age: 68 }))
      expect(plan).toEqual(TEMPLATES['medifund_silver'])
      expect(plan?.what_to_say).toBe(
        'I would like to apply for MediFund Silver'
      )
    })
  })

  describe('ComCare template selection', () => {
    it('returns SMTA template for comcare_smta (temporary inability)', () => {
      const plan = getActionPlan('comcare_smta', makeProfile())
      expect(plan).toEqual(TEMPLATES['comcare_smta'])
      expect(plan?.what_to_say).toContain(
        'temporarily unable to meet my household expenses'
      )
    })

    it('returns LTA template for comcare_lta (permanent inability)', () => {
      const plan = getActionPlan(
        'comcare_lta',
        makeProfile({ permanent_inability_to_work: true })
      )
      expect(plan).toEqual(TEMPLATES['comcare_lta'])
      expect(plan?.what_to_say).toContain('permanently unable to work')
    })
  })

  describe('Foreigner gets no templates', () => {
    it('returns null for unknown scheme_id (Foreigner has all schemes not_applicable)', () => {
      // When citizenship is Foreigner, the eligibility engine marks all schemes
      // as not_applicable, so getActionPlan is never called with a valid scheme_id.
      // If somehow called with an invalid id, it returns null.
      const profile = makeProfile({ citizenship: 'Foreigner' })
      expect(getActionPlan('government_subsidy', profile)).toBeNull()
      expect(getActionPlan('medishield_life', profile)).toBeNull()
      expect(getActionPlan('medisave', profile)).toBeNull()
      // Any unrecognised scheme also returns null
      expect(getActionPlan('nonexistent_scheme', profile)).toBeNull()
    })
  })

  describe('PR-restricted template access', () => {
    it('returns MAF and Flexi-MediSave templates for PRs (only schemes they qualify for)', () => {
      const profile = makeProfile({ citizenship: 'PR', age: 65 })
      // PRs can access MAF
      expect(getActionPlan('maf', profile)).toEqual(TEMPLATES['maf'])
      // PRs aged 60+ can access Flexi-MediSave
      expect(getActionPlan('flexi_medisave', profile)).toEqual(
        TEMPLATES['flexi_medisave']
      )
    })
  })
})
