'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import type { SchemeMatch, UserProfile } from '@/lib/eligibility/types'

const inter = Inter({ subsets: ['latin'] })

const STEPS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Upload', href: '/upload' },
  { label: 'Explain', href: '/explain' },
  { label: 'Match', href: '/match' },
]

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ maxWidth: '768px', width: '100%', margin: '0 auto', padding: '32px 24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '16px', left: '32px', right: '32px', height: '2px', background: '#E5E7EB', zIndex: 0 }} aria-hidden="true" />
        <div style={{ position: 'absolute', top: '16px', left: '32px', width: 'calc((100% - 64px) * 0.0)', height: '2px', background: '#0D9488', zIndex: 0 }} aria-hidden="true" />
        {STEPS.map((step, idx) => (
          <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.875rem', fontWeight: idx === current ? 700 : 500,
              color: idx <= current ? '#FFFFFF' : '#4B5563',
              background: idx <= current ? '#0D9488' : '#E7E5E4',
            }}>
              {idx + 1}
            </div>
            <span style={{
              marginTop: '8px', fontSize: '0.875rem',
              fontWeight: idx === current ? 700 : 400,
              color: idx === current ? '#1C1917' : '#4B5563',
            }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SchemeCard({ scheme }: { scheme: SchemeMatch }) {
  const [expanded, setExpanded] = useState(false)

  const statusConfig = {
    auto_applied: { label: 'Already Applied', color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC', icon: '✓' },
    unclaimed: { label: 'May Be Eligible', color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: '⚠' },
    not_applicable: { label: 'Not Applicable', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: '✕' },
  }

  const cfg = statusConfig[scheme.status]

  return (
    <div
      style={{
        border: `1px solid ${cfg.border}`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: '0.875rem',
        background: cfg.bg,
        overflow: 'hidden',
      }}
    >
      <div
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}
      >
        <span
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: cfg.color,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            flexShrink: 0,
            marginTop: '2px',
          }}
        >
          {cfg.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#1C1917', margin: 0 }}>
                {scheme.scheme_name}
              </p>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: cfg.color, margin: '2px 0 0' }}>
                {cfg.label}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280',
                fontSize: '0.875rem',
                padding: '4px 8px',
                borderRadius: '4px',
                flexShrink: 0,
              }}
              aria-expanded={expanded}
            >
              {expanded ? 'Less ▲' : 'More ▼'}
            </button>
          </div>

          {expanded && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                {scheme.reason}
              </p>
              {scheme.action_steps.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1C1917', marginBottom: '8px' }}>
                    Steps to claim:
                  </p>
                  <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {scheme.action_steps.map((step, i) => (
                      <li key={i} style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5 }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {scheme.source_url && (
                <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#6B7280' }}>
                  Source:{' '}
                  <a href={scheme.source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0D9488' }}>
                    {scheme.source_url.replace('https://', '').split('/')[0]}
                  </a>
                  {scheme.verified_date && ` · Verified ${scheme.verified_date}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileSummary({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false)

  const citizenshipLabel = { SC: 'Singapore Citizen', PR: 'Permanent Resident', Foreigner: 'Foreigner' }

  return (
    <div
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '0.875rem',
        background: '#FFFFFF',
        marginBottom: '24px',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1C1917' }}>
          Your Profile Summary
        </span>
        <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          {open ? '▲ Hide' : '▼ Show'}
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '0 20px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '0.875rem',
          }}
        >
          {[
            ['Citizenship', citizenshipLabel[profile.citizenship]],
            ['Age', `${profile.age}`],
            ['Monthly PCHI', `$${profile.monthly_pchi.toLocaleString()}`],
            ['Annual Value', `$${profile.annual_value.toLocaleString()}`],
            ['Pioneer Generation', profile.is_pioneer ? 'Yes' : 'No'],
            ['Merdeka Generation', profile.is_merdeka ? 'Yes' : 'No'],
            ['IP Rider', profile.has_ip_rider ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <div key={label}>
              <span style={{ color: '#6B7280' }}>{label}: </span>
              <span style={{ fontWeight: 600, color: '#1C1917' }}>{value}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '0 20px 14px' }}>
        <Link
          href="/onboarding"
          style={{ fontSize: '0.875rem', color: '#0D9488', textDecoration: 'underline' }}
        >
          Edit profile →
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [schemes, setSchemes] = useState<SchemeMatch[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notApplicableOpen, setNotApplicableOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const rawProfile = sessionStorage.getItem('userProfile')
    const rawSchemes = sessionStorage.getItem('schemeResults')

    if (!rawProfile || !rawSchemes) {
      router.replace('/onboarding')
      return
    }

    setProfile(JSON.parse(rawProfile))
    setSchemes(JSON.parse(rawSchemes))
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F9FAFB',
        }}
      >
        <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Loading…</p>
      </div>
    )
  }

  const autoApplied = schemes.filter((s) => s.status === 'auto_applied')
  const unclaimed = schemes.filter((s) => s.status === 'unclaimed')
  const notApplicable = schemes.filter((s) => s.status === 'not_applicable')

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
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D9488', textDecoration: 'none' }}>
            BillSG
          </Link>
        </div>
      </nav>

      <Stepper current={0} />

      <main
        style={{
          maxWidth: '768px',
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px',
          flex: 1,
        }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1C1917', marginBottom: '8px' }}>
          Your Scheme Eligibility
        </h1>
        <p style={{ color: '#4B5563', fontSize: '1rem', marginBottom: '32px' }}>
          Based on your profile, here is a quick overview of which schemes apply to you.
        </p>

        {/* Profile summary */}
        {profile && <ProfileSummary profile={profile} />}

        {/* Unclaimed (highlighted first) */}
        {unclaimed.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
                borderRadius: '1rem',
                padding: '20px',
                marginBottom: '16px',
              }}
            >
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#D97706', margin: '0 0 4px' }}>
                ⚠ You may be eligible for {unclaimed.length} unclaimed scheme{unclaimed.length > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#92400E', margin: 0 }}>
                These were not applied to your last bill. Take action to claim them.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {unclaimed.map((s) => (
                <SchemeCard key={s.scheme_id} scheme={s} />
              ))}
            </div>
          </div>
        )}

        {/* Auto applied */}
        {autoApplied.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1C1917', marginBottom: '12px' }}>
              ✅ Already Applied ({autoApplied.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {autoApplied.map((s) => (
                <SchemeCard key={s.scheme_id} scheme={s} />
              ))}
            </div>
          </div>
        )}

        {/* Not applicable (collapsed) */}
        {notApplicable.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <button
              type="button"
              onClick={() => setNotApplicableOpen(!notApplicableOpen)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                marginBottom: '12px',
              }}
            >
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6B7280', margin: 0 }}>
                ❌ Not Applicable ({notApplicable.length})
              </h2>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {notApplicableOpen ? '▲ Collapse' : '▼ Expand'}
              </span>
            </button>
            {notApplicableOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notApplicable.map((s) => (
                  <SchemeCard key={s.scheme_id} scheme={s} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload CTA */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #99F6E4',
            borderRadius: '1rem',
            padding: '28px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', margin: 0 }}>
            Get a more accurate picture
          </h2>
          <p style={{ color: '#4B5563', margin: 0, lineHeight: 1.6 }}>
            Upload your actual hospital bill to check for missing subsidies, verify your MediShield
            deductible, and get a line-by-line explanation in plain English.
          </p>
          <Link
            href="/upload"
            style={{
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '14px 36px',
              fontSize: '1rem',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(13,148,136,0.35)',
              textDecoration: 'none',
              display: 'inline-block',
              alignSelf: 'flex-start',
            }}
          >
            Upload Your Hospital Bill →
          </Link>
        </div>

        {/* Disclaimer */}
        <div
          style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '0.875rem',
            padding: '16px 20px',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>
            <strong>Disclaimer:</strong> This is guidance to help you ask the right questions. Always
            consult a Medical Social Worker before taking action. Eligibility is subject to assessment
            by the relevant authorities.
          </p>
        </div>
      </main>

      <footer
        style={{
          background: '#F0FDFA',
          borderTop: '1px solid #99F6E4',
          padding: '24px',
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
