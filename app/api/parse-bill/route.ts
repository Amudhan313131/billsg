import { NextResponse } from 'next/server'
import { extractBillText } from '@/lib/bill-parser/textract'
import { parseBill } from '@/lib/bill-parser/index'

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.s3Key || typeof body.s3Key !== 'string') {
    return NextResponse.json({ error: 'Missing s3Key' }, { status: 400 })
  }

  try {
    const sessionId = body.s3Key.split('/')[1] ?? crypto.randomUUID()
    const { text, confidence } = await extractBillText(body.s3Key)
    const { bill, warnings } = parseBill(text, sessionId, confidence)
    return NextResponse.json({ bill, warnings }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Failed to parse bill. Please try again.' }, { status: 500 })
  }
}
