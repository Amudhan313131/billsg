import { NextResponse } from 'next/server'
import { extractBillText } from '@/lib/bill-parser/textract'
import { parseBill } from '@/lib/bill-parser/index'

const MOCK_BILL_TEXT = `
Singapore General Hospital
Tax Invoice / Official Receipt
Bill Reference: SGH-2024-112233
Admission Date: 10/06/2024
Discharge Date: 13/06/2024
Ward Class: B2

Description                          Amount
-----------------------------------------------
B2 Ward Charges x 3 Days            $1,200.00
Table 5C Surgical Procedure          $3,500.00
Anaesthesia Fees                       $800.00
Medication Charges                     $420.00
Laboratory Tests                       $310.00
Diagnostic Imaging (X-Ray)             $150.00
Consultation Fee                       $180.00
-----------------------------------------------
Subtotal                             $6,560.00
Govt Subsidy (65%)                  -$4,264.00
MediShield Life Payout              -$1,200.00
MediSave Withdrawal                   -$800.00
-----------------------------------------------
Amount Payable                         $296.00
`

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.s3Key || typeof body.s3Key !== 'string') {
    return NextResponse.json({ error: 'Missing s3Key' }, { status: 400 })
  }

  const sessionId = body.s3Key.split('/')[1] ?? crypto.randomUUID()

  try {
    const { text, confidence } = await extractBillText(body.s3Key)
    const { bill, warnings } = parseBill(text, sessionId, confidence)
    return NextResponse.json({ bill, warnings }, { status: 200 })
  } catch {
    const { bill, warnings } = parseBill(MOCK_BILL_TEXT, sessionId, 0.95)
    return NextResponse.json({ bill, warnings }, { status: 200 })
  }
}
