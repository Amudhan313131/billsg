'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ActionPlan {
  scheme_name: string
  where_to_go: string
  what_to_bring: string[]
  what_to_say: string
  contact: string
  estimated_processing_time: string
}

interface SchemeCard {
  scheme_id: string
  scheme_name: string
  status: 'auto_applied' | 'unclaimed' | 'not_applicable'
  reason: string
  action_plan: ActionPlan | null
  source_url: string
  verified_date: string
}

interface MatchResult {
  schemes: SchemeCard[]
  summary: {
    unclaimed_count: number
    message: string
    disclaimer: string
  }
  data_source?: string
  data_freshness_warning?: string
  ip_rider_warning?: string
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((col) => (
        <div key={col} className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          {[1, 2].map((card) => (
            <div key={card} className="bg-white rounded-xl shadow p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: SchemeCard['status'] }) {
  const config = {
    auto_applied: { icon: '✅', label: 'Already Applied', classes: 'bg-green-100 text-green-800' },
    unclaimed: { icon: '⚠️', label: 'Unclaimed', classes: 'bg-amber-100 text-amber-800' },
    not_applicable: { icon: '❌', label: 'Not Applicable', classes: 'bg-gray-100 text-gray-600' },
  }
  const { icon, label, classes } = config[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${classes}`}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  )
}

function SchemeCardComponent({ scheme }: { scheme: SchemeCard }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">{scheme.scheme_name}</h3>
      <StatusBadge status={scheme.status} />
      <p className="text-gray-700 text-base">{scheme.reason}</p>
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <a
          href={scheme.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 underline hover:text-teal-800 min-h-[44px] flex items-center"
        >
          Source
        </a>
        <span>Verified: {scheme.verified_date}</span>
      </div>
    </div>
  )
}

function BillSummary() {
  const billRaw = typeof window !== 'undefined' ? sessionStorage.getItem('parsedBill') : null
  if (!billRaw) return null
  const bill = JSON.parse(billRaw)

  return (
    <div className="bg-teal-50 rounded-xl p-5 mb-6 border border-teal-200">
      <h3 className="text-lg font-bold text-teal-900 mb-3">📋 Your Bill Summary</h3>
      <div className="space-y-2 text-base text-gray-700">
        <p><span className="font-medium">Hospital:</span> {bill.hospital_name || 'Singapore Public Hospital'}</p>
        <p><span className="font-medium">Ward:</span> Class {bill.ward_class}</p>
        <p><span className="font-medium">Total before subsidies:</span> ${bill.subtotal_before_subsidies?.toLocaleString()}</p>
        <p><span className="font-medium">Government subsidy applied:</span> <span className="text-green-700">-${bill.government_subsidy?.toLocaleString()}</span></p>
        <p><span className="font-medium">MediShield Life paid:</span> <span className="text-green-700">-${bill.medishield_deduction?.toLocaleString()}</span></p>
        <p><span className="font-medium">MediSave withdrawn:</span> <span className="text-green-700">-${bill.medisave_withdrawal?.toLocaleString()}</span></p>
        <hr className="border-teal-200" />
        <p className="text-lg font-bold text-gray-900"><span>Amount you owe:</span> ${bill.final_payable?.toLocaleString()}</p>
      </div>
    </div>
  )
}

function ActionPlanPanel({
  plans,
  onCollapse,
}: {
  plans: ActionPlan[]
  onCollapse: () => void
}) {
  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-2xl max-h-[70vh] overflow-y-auto z-40 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Action Plans</h2>
          <button
            onClick={onCollapse}
            className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 min-h-[44px] font-medium"
          >
            Collapse
          </button>
        </div>
        <BillSummary />
        {plans.map((plan) => (
          <div key={plan.scheme_name} className="bg-gray-50 rounded-xl p-5 space-y-3">
            <h3 className="text-xl font-bold text-teal-700 mb-4">{plan.scheme_name}</h3>
            <p className="text-base text-gray-700">
              <span className="font-medium">Where to go:</span> {plan.where_to_go}
            </p>
            <div>
              <span className="font-medium text-gray-700">What to bring:</span>
              <ul className="list-disc list-inside mt-1 text-gray-700 text-base">
                {plan.what_to_bring.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <blockquote className="border-l-4 border-teal-500 bg-teal-50 pl-4 py-3 text-base text-gray-800 italic">
              <span className="font-medium not-italic">What to say:</span><br />
              &ldquo;{plan.what_to_say}&rdquo;
            </blockquote>
            <p className="text-base text-gray-700">
              <span className="font-medium">Contact:</span> {plan.contact}
            </p>
            <p className="text-base text-gray-700">
              <span className="font-medium">Estimated processing time:</span> {plan.estimated_processing_time}
            </p>
            <p className="text-sm text-gray-500 italic">
              This is guidance only. Always consult a Medical Social Worker before taking action.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MatchPage() {
  const [result, setResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNotApplicable, setShowNotApplicable] = useState(false)
  const [showActionPlans, setShowActionPlans] = useState(false)

  async function fetchMatch() {
    setLoading(true)
    setError(null)

    try {
      // Check cache first
      const cached = sessionStorage.getItem('matchResult')
      if (cached) {
        setResult(JSON.parse(cached))
        setLoading(false)
        return
      }

      const profileRaw = sessionStorage.getItem('userProfile')
      if (!profileRaw) {
        setError('No user profile found. Please complete onboarding first.')
        setLoading(false)
        return
      }

      const profile = JSON.parse(profileRaw)
      const billRaw = sessionStorage.getItem('parsedBill')
      const bill = billRaw ? JSON.parse(billRaw) : null

      const res = await fetch('/api/match-schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, bill }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed with status ${res.status}`)
      }

      const data: MatchResult = await res.json()
      sessionStorage.setItem('matchResult', JSON.stringify(data))
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatch()
  }, [])

  const alreadyApplied = result?.schemes.filter((s) => s.status === 'auto_applied') ?? []
  const unclaimed = result?.schemes.filter((s) => s.status === 'unclaimed') ?? []
  const notApplicable = result?.schemes.filter((s) => s.status === 'not_applicable') ?? []
  const actionPlans = result?.schemes
    .filter((s) => s.status === 'unclaimed' && s.action_plan !== null)
    .map((s) => s.action_plan as ActionPlan) ?? []

  // Check if foreigner
  const profileRaw = typeof window !== 'undefined' ? sessionStorage.getItem('userProfile') : null
  const profile = profileRaw ? JSON.parse(profileRaw) : null
  const isForeigner = profile?.citizenship === 'Foreigner'
  const isPioneerMerdekaConflict = profile?.is_pioneer === true && profile?.is_merdeka === true

  // Check bill amounts for edge cases
  const billRaw = typeof window !== 'undefined' ? sessionStorage.getItem('parsedBill') : null
  const bill = billRaw ? JSON.parse(billRaw) : null
  const finalPayable = bill?.final_payable ?? null
  const isHighBill = finalPayable !== null && finalPayable > 10000
  const isZeroBill = finalPayable !== null && finalPayable === 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-teal-600 min-h-[44px] flex items-center">
            BillSG
          </Link>
        </div>
      </header>

      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, padding: '16px 24px', background: 'white', borderBottom: '1px solid #F0FDFA' }}>
        {[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Upload', href: '/upload' },
          { label: 'Explain', href: '/explain' },
          { label: 'Match', href: '/match' },
        ].map((step, i) => {
          const currentStep = 3
          const isCompleted = i < currentStep
          const isCurrent = i === currentStep
          return (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: i <= currentStep ? '#0D9488' : '#E7E5E4',
                  color: i <= currentStep ? 'white' : '#A8A29E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}>
                  {i + 1}
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  marginTop: '6px',
                  color: isCurrent ? '#1C1917' : '#A8A29E',
                  fontWeight: isCurrent ? 700 : 400,
                }}>
                  {step.label}
                </span>
              </div>
              {i < 3 && (
                <div style={{
                  height: '2px',
                  width: '120px',
                  backgroundColor: isCompleted ? '#0D9488' : '#E5E7EB',
                  marginBottom: '20px',
                }} />
              )}
            </div>
          )
        })}
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6" style={{ fontSize: '18px' }}>
        {/* Back link */}
        <Link
          href="/explain"
          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 font-medium min-h-[44px]"
        >
          ← Back to Explain
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Match Schemes</h1>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <p className="text-teal-600 font-medium text-lg animate-pulse">Matching schemes…</p>
            <SkeletonCards />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
            <p className="text-red-800 text-base font-medium">{error}</p>
            <button
              onClick={fetchMatch}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 min-h-[44px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Success */}
        {result && !loading && !error && (
          <>
            {/* Foreigner message */}
            {isForeigner ? (
              <div className="bg-gray-100 rounded-xl p-8 text-center">
                <p className="text-lg text-gray-700">
                  Most Singapore government schemes are only available to Singapore Citizens and Permanent Residents.
                  Please speak to a Medical Social Worker about available options.
                </p>
              </div>
            ) : (
              <>
                {/* System messages */}
                <div className="space-y-3">
                  {isPioneerMerdekaConflict && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800 text-base font-medium">
                      ⚠️ Please check your Pioneer/Merdeka Generation status — a person cannot hold both packages simultaneously.
                    </div>
                  )}
                  {result.data_source === 'profile_only' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-base">
                      ℹ️ Upload your bill for more accurate scheme matching
                    </div>
                  )}
                  {result.data_freshness_warning && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-800 text-base">
                      ⚠️ {result.data_freshness_warning}
                    </div>
                  )}
                </div>

                {/* IP Rider Warning */}
                {result.ip_rider_warning && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
                    <h2 className="text-lg font-bold text-amber-900 mb-2">⚠️ IP Rider Alert</h2>
                    <p className="text-amber-800 text-base">{result.ip_rider_warning}</p>
                  </div>
                )}

                {/* Three columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Already Applied */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-green-700 bg-green-50 rounded-lg px-4 py-2">
                      ✅ Already Applied
                    </h2>
                    {alreadyApplied.length === 0 && (
                      <p className="text-gray-500 text-base px-2">None detected</p>
                    )}
                    {alreadyApplied.map((s) => (
                      <SchemeCardComponent key={s.scheme_name} scheme={s} />
                    ))}
                  </div>

                  {/* Unclaimed */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-amber-700 bg-amber-50 rounded-lg px-4 py-2">
                      ⚠️ Unclaimed
                    </h2>
                    {isHighBill && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-red-800 text-base font-medium">
                        🚨 Your remaining bill is significant. A Medical Social Worker can help explore all available options.
                      </div>
                    )}
                    {unclaimed.length === 0 && (
                      <p className="text-gray-500 text-base px-2">None detected</p>
                    )}
                    {unclaimed.map((s) => (
                      <SchemeCardComponent key={s.scheme_name} scheme={s} />
                    ))}
                  </div>

                  {/* Not Applicable */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2">
                      <h2 className="text-lg font-bold text-gray-600">
                        ❌ Not Applicable
                      </h2>
                      <button
                        onClick={() => setShowNotApplicable(!showNotApplicable)}
                        className="text-sm text-teal-600 hover:text-teal-800 font-medium min-h-[44px] px-3"
                        aria-expanded={showNotApplicable}
                      >
                        {showNotApplicable ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    {showNotApplicable && (
                      <>
                        {notApplicable.length === 0 && (
                          <p className="text-gray-500 text-base px-2">None</p>
                        )}
                        {notApplicable.map((s) => (
                          <SchemeCardComponent key={s.scheme_name} scheme={s} />
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-sm text-gray-500 italic text-center pt-4">
                  This is guidance only. Always consult a Medical Social Worker before taking action.
                </p>

                {/* Zero bill message */}
                {isZeroBill && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                    <p className="text-lg text-green-800 font-medium">
                      ✅ Your bill appears to be fully covered. No further financial assistance appears needed.
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Action Plans Panel */}
      {showActionPlans && result && result.summary.unclaimed_count > 0 && (
        <ActionPlanPanel
          plans={actionPlans}
          onCollapse={() => setShowActionPlans(false)}
        />
      )}

      {/* Summary Banner */}
      {result && !loading && !error && result.summary.unclaimed_count > 0 && !isForeigner && !isZeroBill && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0D9488] text-white z-50 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <p className="text-base md:text-lg font-medium">
              You may be eligible for assistance across {result.summary.unclaimed_count} schemes
            </p>
            <button
              onClick={() => setShowActionPlans(!showActionPlans)}
              className="px-5 py-2.5 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50 min-h-[44px]"
            >
              {showActionPlans ? 'Hide Action Plans' : 'See Action Plans'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
