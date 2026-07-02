import { checkEligibility } from '@/lib/eligibility/index'
import type { UserProfile } from '@/lib/eligibility/types'
import type { ParsedBill } from '@/lib/bill-parser/types'
import { getActionPlan } from '@/lib/action-plans/select'
import type { ActionPlan } from '@/lib/action-plans/types'
import { DISCLAIMER } from '@/lib/action-plans/types'
import { getAllSchemes } from './mcp-client'

export interface EnrichedSchemeMatch {
  scheme_id: string
  scheme_name: string
  status: 'auto_applied' | 'unclaimed' | 'not_applicable'
  reason: string
  action_plan: ActionPlan | null
  source_url: string
  verified_date: string
}

export interface MatchResult {
  schemes: EnrichedSchemeMatch[]
  summary: {
    unclaimed_count: number
    message: string
    disclaimer: string
  }
  data_source: 'profile_and_bill' | 'profile_only'
  data_freshness_warning?: string
  ip_rider_warning?: string
  bill_crossref_flags?: string[]
}

const WARD_DEDUCTIBLES: Record<string, number> = {
  A: 3500,
  B1: 2500,
  B2: 2000,
  'B2+': 2000,
  C: 1500,
}

export async function matchSchemes(
  profile: UserProfile,
  bill?: ParsedBill
): Promise<MatchResult> {
  // 1. Determine data source (Req 2)
  const data_source: 'profile_and_bill' | 'profile_only' =
    bill && bill.confidence_score >= 0.5 ? 'profile_and_bill' : 'profile_only'

  // 2. Query MCP for live freshness data — fallback is built into mcp-client
  let dataFreshnessWarning: string | undefined
  let lastScraped: string | undefined
  try {
    const allSchemesRaw = await getAllSchemes()
    const allSchemes = allSchemesRaw as { last_full_scrape?: string; _fallback?: boolean }
    if (allSchemes._fallback) {
      dataFreshnessWarning = 'Scheme data may not reflect the latest updates. Using cached data.'
    } else if (allSchemes.last_full_scrape) {
      lastScraped = new Date(allSchemes.last_full_scrape).toLocaleDateString('en-SG', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    }
  } catch {
    dataFreshnessWarning = 'Could not verify scheme data freshness. Using last known values.'
  }

  // 3. Eligibility matrix — deterministic ground truth (Req 3)
  const baseResults = checkEligibility(profile)

  // 4. Bill cross-reference flags (Req 4)
  const crossrefFlags: string[] = []
  if (data_source === 'profile_and_bill' && bill) {
    crossrefFlags.push(...buildCrossrefFlags(profile, bill))
  }

  // 5. Status upgrades from bill cross-reference
  const upgradeMap = buildUpgradeMap(profile, bill)

  // 6. IP rider warning (Req 13 from scheme-matcher spec)
  let ipRiderWarning: string | undefined
  if (profile.has_ip_rider) {
    if (profile.ip_rider_date === 'after_april_2026') {
      const wardClass = bill?.ward_class
      const deductible = wardClass ? WARD_DEDUCTIBLES[wardClass] : null
      ipRiderWarning = deductible
        ? `Your IP rider (purchased on or after 1 April 2026) cannot cover your MediShield Life deductible of $${deductible.toLocaleString()} for ${wardClass} ward. A minimum co-payment applies.`
        : 'Your IP rider (purchased on or after 1 April 2026) is subject to the new minimum co-payment rules — it cannot cover the MediShield Life deductible.'
    } else if (profile.ip_rider_date === 'before_april_2026') {
      ipRiderWarning =
        'Your IP rider was purchased before 1 April 2026 and is grandfathered — the new minimum co-payment rules do not apply to your existing rider.'
    }
  }

  // 7. Enrich each scheme — add action plan, apply upgrades
  const enrichedSchemes: EnrichedSchemeMatch[] = baseResults.map((base) => {
    const overriddenStatus = upgradeMap[base.scheme_id]
    const status = overriddenStatus ?? base.status

    const templateKey = base.scheme_id.replace(/-/g, '_')
    const actionPlanKey = templateKey === 'comcare'
      ? (profile.permanent_inability_to_work ? 'comcare_lta' : 'comcare_smta')
      : templateKey

    const action_plan = status === 'unclaimed'
      ? getActionPlan(actionPlanKey, profile)
      : null

    return {
      scheme_id: base.scheme_id,
      scheme_name: base.scheme_name,
      status,
      reason: base.reason,
      action_plan,
      source_url: base.source_url,
      verified_date: lastScraped ?? base.verified_date,
    }
  })

  // 8. Summary banner (Req 8)
  const unclaimed = enrichedSchemes.filter((s) => s.status === 'unclaimed')
  const summary = {
    unclaimed_count: unclaimed.length,
    message:
      unclaimed.length > 0
        ? `You may be eligible for assistance across ${unclaimed.length} scheme${unclaimed.length > 1 ? 's' : ''}`
        : 'All applicable schemes appear to have been applied to your bill.',
    disclaimer: DISCLAIMER,
  }

  return {
    schemes: enrichedSchemes,
    summary,
    data_source,
    ...(dataFreshnessWarning ? { data_freshness_warning: dataFreshnessWarning } : {}),
    ...(ipRiderWarning ? { ip_rider_warning: ipRiderWarning } : {}),
    ...(crossrefFlags.length > 0 ? { bill_crossref_flags: crossrefFlags } : {}),
  }
}

function buildCrossrefFlags(profile: UserProfile, bill: ParsedBill): string[] {
  const flags: string[] = []

  // Pioneer/Merdeka discount missing (Req 4.2 / 4.3)
  const hasPioneerMerdekaDiscount = bill.line_items.some(
    (item) => item.category === 'pioneer_merdeka_discount' && item.amount > 0
  )
  if (profile.is_pioneer && !hasPioneerMerdekaDiscount) {
    flags.push(
      'Your Pioneer Generation discount does not appear on this bill — it may be unclaimed.'
    )
  }
  if (profile.is_merdeka && !hasPioneerMerdekaDiscount) {
    flags.push(
      'Your Merdeka Generation discount does not appear on this bill — it may be unclaimed.'
    )
  }

  // MediShield deductible display (Req 4.4)
  if (bill.ward_class !== 'unknown') {
    const deductible = WARD_DEDUCTIBLES[bill.ward_class]
    if (deductible) {
      flags.push(
        `MediShield Life deductible for ${bill.ward_class} ward: $${deductible.toLocaleString()} per policy year.`
      )
    }
  }

  // Medication charges → MAF (Req 4.5)
  const hasMedication = bill.line_items.some(
    (item) => item.category === 'medication' && item.amount > 0
  )
  if (hasMedication && (profile.citizenship === 'SC' || profile.citizenship === 'PR')) {
    flags.push(
      'Medication charges detected — ask the hospital pharmacist if your medications qualify for MAF subsidies.'
    )
  }

  return flags
}

function buildUpgradeMap(
  profile: UserProfile,
  bill: ParsedBill | undefined
): Record<string, 'auto_applied' | 'unclaimed' | 'not_applicable'> {
  const upgrades: Record<string, 'auto_applied' | 'unclaimed' | 'not_applicable'> = {}

  if (!bill) return upgrades

  // Edge case: fully covered — skip MediFund and ComCare (Req 8 / 10.8)
  if (bill.final_payable === 0) {
    upgrades['medifund'] = 'not_applicable'
    upgrades['medifund-silver'] = 'not_applicable'
    upgrades['medifund-junior'] = 'not_applicable'
    upgrades['comcare'] = 'not_applicable'
    return upgrades
  }

  // High final_payable → prioritise MediFund (Req 4.6)
  if (bill.final_payable > 1000 && profile.citizenship === 'SC') {
    upgrades['medifund'] = 'unclaimed'
    if (profile.age >= 65) upgrades['medifund-silver'] = 'unclaimed'
  }

  // ComCare flag near threshold (Req 4.7 / 4.8)
  if (bill.final_payable > 500 && profile.monthly_pchi <= 1000 && profile.citizenship === 'SC') {
    upgrades['comcare'] = 'unclaimed'
  }

  return upgrades
}
