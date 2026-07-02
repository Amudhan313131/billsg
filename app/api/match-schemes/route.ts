import { NextResponse } from 'next/server'
import { matchSchemes } from '@/lib/scheme-matcher/index'
import type { UserProfile, Citizenship } from '@/lib/eligibility/types'
import type { ParsedBill } from '@/lib/bill-parser/types'

const VALID_CITIZENSHIPS: Citizenship[] = ['SC', 'PR', 'Foreigner']

export async function POST(request: Request) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate profile
  const { profile: rawProfile, bill: rawBill } = body as {
    profile?: Record<string, unknown>
    bill?: Record<string, unknown>
  }

  if (!rawProfile || typeof rawProfile !== 'object') {
    return NextResponse.json({ error: 'profile is required' }, { status: 400 })
  }

  if (!VALID_CITIZENSHIPS.includes(rawProfile.citizenship as Citizenship)) {
    return NextResponse.json(
      { error: "profile.citizenship must be 'SC', 'PR', or 'Foreigner'" },
      { status: 400 }
    )
  }

  const profile: UserProfile = {
    citizenship: rawProfile.citizenship as Citizenship,
    age: Number(rawProfile.age) || 0,
    monthly_pchi: Number(rawProfile.monthly_pchi) || 0,
    annual_value: Number(rawProfile.annual_value) || 0,
    is_pioneer: Boolean(rawProfile.is_pioneer),
    is_merdeka: Boolean(rawProfile.is_merdeka),
    has_ip_rider: Boolean(rawProfile.has_ip_rider),
    ip_rider_date: (['before_april_2026', 'after_april_2026', 'none'].includes(
      rawProfile.ip_rider_date as string
    )
      ? (rawProfile.ip_rider_date as UserProfile['ip_rider_date'])
      : 'none'),
    ...(typeof rawProfile.medisave_balance === 'number' && {
      medisave_balance: rawProfile.medisave_balance,
    }),
    ...(typeof rawProfile.adl_needs_assistance === 'boolean' && {
      adl_needs_assistance: rawProfile.adl_needs_assistance,
    }),
    ...(typeof rawProfile.is_careshield_or_eldershield === 'boolean' && {
      is_careshield_or_eldershield: rawProfile.is_careshield_or_eldershield,
    }),
    ...(typeof rawProfile.has_sc_family_member === 'boolean' && {
      has_sc_family_member: rawProfile.has_sc_family_member,
    }),
    ...(typeof rawProfile.permanent_inability_to_work === 'boolean' && {
      permanent_inability_to_work: rawProfile.permanent_inability_to_work,
    }),
    ...(typeof rawProfile.difficulty_paying === 'boolean' && {
      difficulty_paying: rawProfile.difficulty_paying,
    }),
    ...(typeof rawProfile.has_medication_charges === 'boolean' && {
      has_medication_charges: rawProfile.has_medication_charges,
    }),
  }

  const bill = rawBill ? (rawBill as unknown as ParsedBill) : undefined

  try {
    const result = await matchSchemes(profile, bill)
    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to match schemes'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
