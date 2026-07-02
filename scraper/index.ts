import axios from 'axios'
import * as fs from 'fs/promises'
import * as path from 'path'
import { SOURCES } from './sources'
import {
  parseGovernmentSubsidy,
  parseMediShieldLife,
  parseCHAS,
  parseMediFund,
  parsePioneerGeneration,
  parseMerdekaGeneration,
  parseElderFund,
  parseComCare,
  parseFlexiMediSave,
  parseIPRider,
  parseMAF,
} from './parsers/index'

const DATA_PATH = path.join(process.cwd(), 'data/schemes.json')

const USER_AGENT = 'Mozilla/5.0 (compatible; BillSG/1.0; +https://github.com/billsg)'

const PARSER_MAP: Record<string, (html: string) => object | null> = {
  'government-subsidy': parseGovernmentSubsidy,
  'medishield-life': parseMediShieldLife,
  'chas-blue': (html) => { const r = parseCHAS(html) as Record<string, object> | null; return r?.blue ?? null },
  'chas-orange': (html) => { const r = parseCHAS(html) as Record<string, object> | null; return r?.orange ?? null },
  'chas-green': (html) => { const r = parseCHAS(html) as Record<string, object> | null; return r?.green ?? null },
  'medifund': (html) => { const r = parseMediFund(html) as Record<string, object> | null; return r?.medifund ?? null },
  'medifund-silver': (html) => { const r = parseMediFund(html) as Record<string, object> | null; return r?.medifund_silver ?? null },
  'medifund-junior': (html) => { const r = parseMediFund(html) as Record<string, object> | null; return r?.medifund_junior ?? null },
  'pioneer-generation': parsePioneerGeneration,
  'merdeka-generation': parseMerdekaGeneration,
  'elderfund': parseElderFund,
  'comcare': parseComCare,
  'flexi-medisave': parseFlexiMediSave,
  'ip-rider-flag': parseIPRider,
  'maf': parseMAF,
}

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  const delays = [1000, 2000, 4000]
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000,
      })
      return response.data
    } catch (err) {
      if (attempt === retries - 1) throw err
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`)
}

function hasSignificantChange(oldData: Record<string, unknown>, newData: Record<string, unknown>): string[] {
  const changed: string[] = []
  for (const key of Object.keys(newData)) {
    const oldVal = oldData[key]
    const newVal = newData[key]
    if (typeof oldVal === 'number' && typeof newVal === 'number' && oldVal !== 0) {
      const pctChange = Math.abs((newVal - oldVal) / oldVal)
      if (pctChange > 0.2) {
        changed.push(`${key}: ${oldVal} → ${newVal} (${(pctChange * 100).toFixed(1)}% change)`)
      }
    }
  }
  return changed
}

function log(schemeId: string, status: string, details: string) {
  console.log(`[scraper] ${schemeId} | ${status} | ${details} | ${new Date().toISOString()}`)
}

export async function runScraper(): Promise<{ updated: number; failed: number; errors: string[] }> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8')
  const store = JSON.parse(raw)

  let updated = 0
  let failed = 0
  const errors: string[] = []

  for (const source of SOURCES) {
    const schemeIds = Array.isArray(source.scheme_id) ? source.scheme_id : [source.scheme_id]
    let html: string

    try {
      html = await fetchWithRetry(source.url)
    } catch (err) {
      for (const id of schemeIds) {
        const scheme = store.schemes.find((s: { scheme_id: string }) => s.scheme_id === id)
        if (scheme) scheme.data_freshness = 'stale'
        const msg = `Failed to fetch ${source.url}: ${err instanceof Error ? err.message : String(err)}`
        errors.push(msg)
        log(id, 'FAILED', msg)
        failed++
      }
      continue
    }

    for (const id of schemeIds) {
      const parser = PARSER_MAP[id]
      if (!parser) {
        errors.push(`No parser for ${id}`)
        log(id, 'FAILED', 'No parser found')
        failed++
        continue
      }

      const parsed = parser(html)
      const scheme = store.schemes.find((s: { scheme_id: string }) => s.scheme_id === id)

      if (!parsed || !scheme) {
        if (scheme) scheme.data_freshness = 'stale'
        const msg = parsed ? `Scheme ${id} not found in store` : `Parser returned null for ${id}`
        errors.push(msg)
        log(id, 'FAILED', msg)
        failed++
        continue
      }

      const significantChanges = hasSignificantChange(
        scheme.data as Record<string, unknown>,
        parsed as Record<string, unknown>
      )
      if (significantChanges.length > 0) {
        log(id, 'WARNING', `Significant changes: ${significantChanges.join('; ')}`)
      }

      scheme.data = parsed
      scheme.last_scraped = new Date().toISOString()
      scheme.data_freshness = 'current'
      log(id, 'UPDATED', significantChanges.length > 0 ? significantChanges.join(', ') : 'no significant changes')
      updated++
    }
  }

  store.last_full_scrape = new Date().toISOString()
  await fs.writeFile(DATA_PATH, JSON.stringify(store, null, 2), 'utf-8')

  console.log(`[scraper] Complete: ${updated} updated, ${failed} failed`)
  return { updated, failed, errors }
}

if (typeof require !== 'undefined' && require.main === module) {
  runScraper().catch(console.error)
}
