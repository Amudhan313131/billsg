import { NextResponse } from 'next/server'
import { uploadBill } from '@/lib/bill-parser/s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Please upload a JPG, PNG, or PDF file.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Please upload a file under 10MB.' }, { status: 400 })
  }

  try {
    const sessionId = crypto.randomUUID()
    const s3Key = await uploadBill(file, sessionId)
    return NextResponse.json({ s3Key, sessionId }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
