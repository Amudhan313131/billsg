'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

type Citizenship = 'SC' | 'PR' | 'Foreigner'
type Generation = 'pioneer' | 'merdeka' | 'neither'
type IpRiderAnswer = 'yes' | 'no' | ''
type IpRiderDate = 'before_april_2026' | 'after_april_2026' | ''

interface WizardState {
  citizenship: Citizenship | ''
  age: string
  monthly_pchi: string
  annual_value: string
  generation: Generation | ''
  has_ip_rider: IpRiderAnswer
  ip_rider_date: IpRiderDate
}

const INITIAL: WizardState = {
  citizenship: '',
  age: '',
  monthly_pchi: '',
  annual_value: '',
  generation: '',
  has_ip_rider: '',
  ip_rider_date: '',
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.875rem', color: '#4B5563' }}>
          Question {current} of {total}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0D9488' }}>{pct}%</span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '9999px',
          background: '#E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #0D9488, #0F766E)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  )
}

function RadioOption({
  value,
  selected,
  label,
  sublabel,
  onChange,
}: {
  value: string
  selected: boolean
  label: string
  sublabel?: string
  onChange: (v: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        padding: '16px 20px',
        borderRadius: '0.875rem',
        border: selected ? '2px solid #0D9488' : '2px solid #E5E7EB',
        background: selected ? '#F0FDFA' : '#FFFFFF',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
        boxShadow: selected ? '0 2px 12px rgba(13,148,136,0.15)' : 'none',
      }}
    >
      <div
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: selected ? '2px solid #0D9488' : '2px solid #D1D5DB',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {selected && (
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#0D9488',
            }}
          />
        )}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1C1917' }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '2px' }}>{sublabel}</div>
        )}
      </div>
    </button>
  )
}

function NumberInput({
  value,
  placeholder,
  prefix,
  onChange,
  error,
}: {
  value: string
  placeholder: string
  prefix?: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span
            style={{
              position: 'absolute',
              left: '16px',
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#6B7280',
              pointerEvents: 'none',
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: prefix ? '16px 16px 16px 40px' : '16px',
            fontSize: '1.1rem',
            border: error ? '2px solid #DC2626' : '2px solid #E5E7EB',
            borderRadius: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#1C1917',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = error ? '#DC2626' : '#0D9488' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? '#DC2626' : '#E5E7EB' }}
          min="0"
        />
      </div>
      {error && (
        <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#DC2626' }}>{error}</p>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [screen, setScreen] = useState(1)
  const [state, setState] = useState<WizardState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof WizardState, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const totalScreens = state.has_ip_rider === 'yes' ? 7 : 6

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validateAndNext() {
    const errs: Partial<Record<keyof WizardState, string>> = {}

    if (screen === 1 && !state.citizenship) {
      errs.citizenship = 'Please select your citizenship status.'
    }
    if (screen === 2) {
      const age = Number(state.age)
      if (!state.age) errs.age = 'Please enter your age.'
      else if (!Number.isInteger(age) || age < 0 || age > 120)
        errs.age = 'Please enter a valid age between 0 and 120.'
    }
    if (screen === 3) {
      if (state.monthly_pchi === '') errs.monthly_pchi = 'Please enter a value (0 if none).'
      else if (Number(state.monthly_pchi) < 0) errs.monthly_pchi = 'Income cannot be negative.'
    }
    if (screen === 4) {
      if (!state.annual_value) errs.annual_value = 'Please enter your home Annual Value.'
      else if (Number(state.annual_value) < 0) errs.annual_value = 'Annual Value cannot be negative.'
    }
    if (screen === 5 && !state.generation) {
      errs.generation = 'Please make a selection.'
    }
    if (screen === 6 && !state.has_ip_rider) {
      errs.has_ip_rider = 'Please make a selection.'
    }
    if (screen === 7 && !state.ip_rider_date) {
      errs.ip_rider_date = 'Please select when your IP rider was purchased.'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    if (screen === totalScreens) {
      submitProfile()
    } else {
      // Skip screen 7 if no IP rider
      if (screen === 6 && state.has_ip_rider === 'no') {
        submitProfile()
      } else {
        setScreen((s) => s + 1)
      }
    }
  }

  async function submitProfile() {
    setSubmitting(true)
    const generation: Generation = (state.generation as Generation) || 'neither'
    const profile = {
      citizenship: state.citizenship as Citizenship,
      age: Number(state.age),
      monthly_pchi: Number(state.monthly_pchi),
      annual_value: Number(state.annual_value),
      is_pioneer: generation === 'pioneer',
      is_merdeka: generation === 'merdeka',
      has_ip_rider: state.has_ip_rider === 'yes',
      ip_rider_date:
        state.has_ip_rider === 'yes' && state.ip_rider_date
          ? state.ip_rider_date
          : 'none',
    }

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      sessionStorage.setItem('userProfile', JSON.stringify(data.profile ?? profile))
      sessionStorage.setItem('schemeResults', JSON.stringify(data.schemes ?? []))
      router.push('/dashboard')
    } catch {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    if (screen === 1) return !!state.citizenship
    if (screen === 2) {
      const age = Number(state.age)
      return state.age !== '' && Number.isInteger(age) && age >= 0 && age <= 120
    }
    if (screen === 3) return state.monthly_pchi !== '' && Number(state.monthly_pchi) >= 0
    if (screen === 4) return state.annual_value !== '' && Number(state.annual_value) >= 0
    if (screen === 5) return !!state.generation
    if (screen === 6) return !!state.has_ip_rider
    if (screen === 7) return !!state.ip_rider_date
    return false
  }

  return (
    <div
      className={inter.className}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(160deg, #F0FDFA 0%, #FFFFFF 60%, #F0FDFA 100%)',
      }}
    >
      {/* Nav */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #99F6E4', padding: '16px 24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D9488', textDecoration: 'none' }}>
            BillSG
          </Link>
        </div>
      </nav>

      <main
        style={{
          flex: 1,
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        <ProgressBar current={screen} total={totalScreens} />

        {/* Screen 1: Citizenship */}
        {screen === 1 && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              What is your citizenship status?
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '28px' }}>
              This determines which healthcare schemes apply to you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <RadioOption
                value="SC"
                selected={state.citizenship === 'SC'}
                label="Singapore Citizen"
                onChange={(v) => update('citizenship', v as Citizenship)}
              />
              <RadioOption
                value="PR"
                selected={state.citizenship === 'PR'}
                label="Permanent Resident (PR)"
                onChange={(v) => update('citizenship', v as Citizenship)}
              />
              <RadioOption
                value="Foreigner"
                selected={state.citizenship === 'Foreigner'}
                label="Foreigner / Work Pass / Dependent"
                onChange={(v) => update('citizenship', v as Citizenship)}
              />
            </div>
            {errors.citizenship && (
              <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#DC2626' }}>
                {errors.citizenship}
              </p>
            )}
          </div>
        )}

        {/* Screen 2: Age */}
        {screen === 2 && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              How old are you?
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '28px' }}>
              Some schemes have age-based eligibility (e.g. MediFund Silver for 65+, Flexi-MediSave for 60+).
            </p>
            <NumberInput
              value={state.age}
              placeholder="e.g. 45"
              onChange={(v) => update('age', v)}
              error={errors.age}
            />
          </div>
        )}

        {/* Screen 3: Monthly PCHI */}
        {screen === 3 && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              What is your household&apos;s monthly Per Capita Income (PCHI)?
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '8px' }}>
              Total household income divided by number of people living in the same home. Enter 0 if none.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '28px' }}>
              This is used to determine subsidy levels and CHAS tier eligibility.
            </p>
            <NumberInput
              value={state.monthly_pchi}
              placeholder="e.g. 2100"
              prefix="$"
              onChange={(v) => update('monthly_pchi', v)}
              error={errors.monthly_pchi}
            />
          </div>
        )}

        {/* Screen 4: Annual Value */}
        {screen === 4 && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              What is the Annual Value (AV) of your home?
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '8px' }}>
              The Annual Value is set by IRAS and shown on your property tax notice or at myinfo.gov.sg.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '28px' }}>
              Used as a fallback when PCHI is zero to determine subsidy eligibility.
            </p>
            <NumberInput
              value={state.annual_value}
              placeholder="e.g. 12000"
              prefix="$"
              onChange={(v) => update('annual_value', v)}
              error={errors.annual_value}
            />
          </div>
        )}

        {/* Screen 5: Pioneer / Merdeka */}
        {screen === 5 && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              Are you a Pioneer or Merdeka Generation member?
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '28px' }}>
              These packages provide additional healthcare subsidies for older Singaporeans.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <RadioOption
                value="pioneer"
                selected={state.generation === 'pioneer'}
                label="Yes — Pioneer Generation"
                sublabel="Born before 1 Jan 1950 and obtained SC before 31 Dec 1986"
                onChange={(v) => update('generation', v as Generation)}
              />
              <RadioOption
                value="merdeka"
                selected={state.generation === 'merdeka'}
                label="Yes — Merdeka Generation"
                sublabel="Born 1 Jan 1950 – 31 Dec 1959 and obtained SC by 31 Dec 1996"
                onChange={(v) => update('generation', v as Generation)}
              />
              <RadioOption
                value="neither"
                selected={state.generation === 'neither'}
                label="Neither / Not sure"
                onChange={(v) => update('generation', v as Generation)}
              />
            </div>
            {errors.generation && (
              <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#DC2626' }}>
                {errors.generation}
              </p>
            )}
          </div>
        )}

        {/* Screen 6: IP Rider */}
        {screen === 6 && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              Do you have an Integrated Shield Plan (IP) rider?
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '8px' }}>
              An IP rider tops up your MediShield Life to cover ward upgrades and reduce out-of-pocket costs.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '28px' }}>
              From 1 April 2026, new IP riders must include a minimum co-payment — important if you have one.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <RadioOption
                value="yes"
                selected={state.has_ip_rider === 'yes'}
                label="Yes, I have an IP rider"
                onChange={(v) => update('has_ip_rider', v as IpRiderAnswer)}
              />
              <RadioOption
                value="no"
                selected={state.has_ip_rider === 'no'}
                label="No / Not sure"
                onChange={(v) => {
                  update('has_ip_rider', v as IpRiderAnswer)
                  update('ip_rider_date', '')
                }}
              />
            </div>
            {errors.has_ip_rider && (
              <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#DC2626' }}>
                {errors.has_ip_rider}
              </p>
            )}
          </div>
        )}

        {/* Screen 7: IP Rider Date (conditional) */}
        {screen === 7 && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
              When was your IP rider purchased?
            </h1>
            <p style={{ color: '#6B7280', marginBottom: '28px' }}>
              The April 2026 rule changes apply differently depending on when your rider was taken out.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <RadioOption
                value="before_april_2026"
                selected={state.ip_rider_date === 'before_april_2026'}
                label="Before 1 April 2026"
                sublabel="Grandfathered — existing rules apply"
                onChange={(v) => update('ip_rider_date', v as IpRiderDate)}
              />
              <RadioOption
                value="after_april_2026"
                selected={state.ip_rider_date === 'after_april_2026'}
                label="On or after 1 April 2026"
                sublabel="New minimum co-payment rules apply"
                onChange={(v) => update('ip_rider_date', v as IpRiderDate)}
              />
            </div>
            {errors.ip_rider_date && (
              <p style={{ marginTop: '12px', fontSize: '0.875rem', color: '#DC2626' }}>
                {errors.ip_rider_date}
              </p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {screen > 1 ? (
            <button
              type="button"
              onClick={() => setScreen((s) => s - 1)}
              style={{
                color: '#0D9488',
                background: 'none',
                border: 'none',
                fontSize: '1.125rem',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '0',
              }}
            >
              ← Back
            </button>
          ) : (
            <Link
              href="/"
              style={{ color: '#0D9488', fontSize: '1.125rem', fontWeight: 500, textDecoration: 'none' }}
            >
              ← Back
            </Link>
          )}

          <button
            type="button"
            onClick={validateAndNext}
            disabled={!canProceed() || submitting}
            style={{
              background:
                canProceed() && !submitting
                  ? 'linear-gradient(135deg, #0D9488, #0F766E)'
                  : '#E5E7EB',
              color: canProceed() && !submitting ? '#FFFFFF' : '#A8A29E',
              borderRadius: '9999px',
              padding: '14px 44px',
              fontSize: '1.1rem',
              fontWeight: 700,
              border: 'none',
              cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed',
              boxShadow:
                canProceed() && !submitting
                  ? '0 4px 16px rgba(13,148,136,0.35)'
                  : 'none',
              transition: 'all 0.2s ease',
              minWidth: '140px',
            }}
          >
            {submitting
              ? 'Checking…'
              : screen === totalScreens || (screen === 6 && state.has_ip_rider === 'no')
              ? 'See My Results'
              : 'Next →'}
          </button>
        </div>
      </main>

      <footer
        style={{
          background: '#F0FDFA',
          borderTop: '1px solid #99F6E4',
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#78716C',
        }}
      >
        BillSG is a guidance tool only. Always consult a Medical Social Worker before taking action.
      </footer>
    </div>
  )
}
