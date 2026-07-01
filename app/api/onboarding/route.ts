import { NextResponse } from 'next/server'
import { checkEligibility } from '@/lib/eligibility/index'
import type { UserProfile, Citizenship } from '@/lib/eligibility/types'

const VALID_CITIZENSHIPS: Citizenship[] = ['SC', 'PR', 'Foreigner']

/**
 * POST /api/onboarding
 *
 * Receives a UserProfile JSON body, validates required fields,
 * runs the deterministic eligibility rules engine, and returns
 * the complete scheme eligibility results.
 *
 * No AI or external calls — pure rules engine only.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate citizenship
  if (!body.citizenship || !VALID_CITIZENSHIPS.includes(body.citizenship as Citizenship)) {
    return NextResponse.json(
      { error: "citizenship must be one of: 'SC', 'PR', 'Foreigner'" },
      { status: 400 }
    )
  }

  // Validate age
  const age = body.age
  if (age === undefined || age === null || typeof age !== 'number' || !Number.isInteger(age) || age < 0 || age > 120) {
    return NextResponse.json(
      { error: 'age must be an integer between 0 and 120' },
      { status: 400 }
    )
  }

  // Validate monthly_pchi
  const pchi = body.monthly_pchi
  if (pchi === undefined || pchi === null || typeof pchi !== 'number' || pchi < 0) {
    return NextResponse.json(
      { error: 'monthly_pchi must be a non-negative number' },
      { status: 400 }
    )
  }

  // Validate annual_value
  const av = body.annual_value
  if (av === undefined || av === null || typeof av !== 'number' || av < 0) {
    return NextResponse.json(
      { error: 'annual_value must be a non-negative number' },
      { status: 400 }
    )
  }

  // Build the UserProfile from validated + optional fields
  const profile: UserProfile = {
    citizenship: body.citizenship as Citizenship,
    age: age as number,
    monthly_pchi: pchi as number,
    annual_value: av as number,
    is_pioneer: Boolean(body.is_pioneer),
    is_merdeka: Boolean(body.is_merdeka),
    has_ip_rider: Boolean(body.has_ip_rider),
    ip_rider_date: (['before_april_2026', 'after_april_2026', 'none'].includes(body.ip_rider_date as string)
      ? (body.ip_rider_date as UserProfile['ip_rider_date'])
      : 'none'),
    // Optional scheme-specific fields
    ...(typeof body.medisave_balance === 'number' && { medisave_balance: body.medisave_balance }),
    ...(typeof body.adl_needs_assistance === 'boolean' && { adl_needs_assistance: body.adl_needs_assistance }),
    ...(typeof body.is_careshield_or_eldershield === 'boolean' && { is_careshield_or_eldershield: body.is_careshield_or_eldershield }),
    ...(typeof body.has_sc_family_member === 'boolean' && { has_sc_family_member: body.has_sc_family_member }),
    ...(typeof body.permanent_inability_to_work === 'boolean' && { permanent_inability_to_work: body.permanent_inability_to_work }),
    ...(typeof body.difficulty_paying === 'boolean' && { difficulty_paying: body.difficulty_paying }),
    ...(typeof body.has_medication_charges === 'boolean' && { has_medication_charges: body.has_medication_charges }),
  }

  const schemes = checkEligibility(profile)

  return NextResponse.json({ schemes, profile }, { status: 200 })
}
