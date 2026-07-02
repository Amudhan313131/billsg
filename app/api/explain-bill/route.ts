import { NextResponse } from 'next/server'
import { explainBill } from '@/lib/bill-explainer/index'

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.bill || !Array.isArray(body.bill.line_items)) {
    return NextResponse.json({ error: 'Missing bill data' }, { status: 400 })
  }

  try {
    const explainedBill = await explainBill(body.bill)
    return NextResponse.json({ bill: explainedBill }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to explain bill.' }, { status: 500 })
  }
}
