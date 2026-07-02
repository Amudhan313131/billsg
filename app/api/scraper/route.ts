import { NextResponse } from 'next/server'
import { runScraper } from '@/scraper/index'

export async function POST() {
  try {
    const result = await runScraper()
    return NextResponse.json(
      { ...result, completed_at: new Date().toISOString() },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scraper failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
