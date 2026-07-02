import cron from 'node-cron'
import { runScraper } from './index'

cron.schedule('0 2 * * 0', () => {
  console.log(`[scheduler] Starting weekly scrape at ${new Date().toISOString()}`)
  runScraper().catch((err) => {
    console.error('[scheduler] Scrape failed:', err)
  })
}, { timezone: 'Asia/Singapore' })

console.log('[scheduler] BillSG scraper scheduled: every Sunday 2:00 AM SGT')

export { runScraper }
