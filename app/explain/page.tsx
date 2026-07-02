'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ParsedBill } from '@/lib/bill-parser/types'

function formatSGD(amount: number): string {
  return amount.toLocaleString('en-SG', { style: 'currency', currency: 'SGD', minimumFractionDigits: 2 })
}

export default function ExplainBillPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [explainedBill, setExplainedBill] = useState<ParsedBill | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    const raw = sessionStorage.getItem('parsedBill')
    const parsedBill: ParsedBill | null = raw ? JSON.parse(raw) : null

    if (!parsedBill) {
      setError('No bill data found. Please upload your bill first.')
      setLoading(false)
      return
    }

    const rawWarnings = sessionStorage.getItem('billWarnings')
    if (rawWarnings) {
      setWarnings(JSON.parse(rawWarnings))
    }

    fetch('/api/explain-bill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bill: parsedBill }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to explain bill')
        return res.json()
      })
      .then((data) => {
        setExplainedBill(data.bill)
        sessionStorage.setItem('parsedBill', JSON.stringify(data.bill))
      })
      .catch(() => {
        setError('Something went wrong while explaining your bill. Please try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <Link href="/upload" className="text-blue-600 underline">
          ← Back to Upload
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-gray-600 text-lg">Explaining your bill...</p>
      </div>
    )
  }

  if (!explainedBill) return null

  const totalDeductions =
    (explainedBill.government_subsidy ?? 0) +
    (explainedBill.medishield_deduction ?? 0) +
    (explainedBill.medisave_withdrawal ?? 0) +
    (explainedBill.other_deductions ?? 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Understanding Your Bill</h1>
        <p className="text-gray-600 mb-6">
          {explainedBill.hospital_name} &middot; Ward Class {explainedBill.ward_class}
        </p>

        {warnings.length > 0 && (
          <div className="mb-6 space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                {w}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">What This Means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {explainedBill.line_items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className={`px-4 py-3 text-right font-mono ${item.is_deduction ? 'text-green-700' : 'text-red-700'}`}>
                    {item.is_deduction ? `-${formatSGD(Math.abs(item.amount))}` : formatSGD(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs leading-relaxed">{item.plain_english}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6 space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal before subsidies</span>
            <span className="font-mono">{formatSGD(explainedBill.subtotal_before_subsidies)}</span>
          </div>
          <div className="flex justify-between text-green-700">
            <span>Total deductions</span>
            <span className="font-mono">-{formatSGD(Math.abs(totalDeductions))}</span>
          </div>
          <div className="border-t pt-3 flex justify-between text-gray-900 font-bold text-lg">
            <span>Amount Payable</span>
            <span className="font-mono">{formatSGD(explainedBill.final_payable)}</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/schemes"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Next: Match Schemes →
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          This is guidance to help you ask the right questions. Always consult a Medical Social Worker before taking action.
        </p>
      </div>
    </div>
  )
}
