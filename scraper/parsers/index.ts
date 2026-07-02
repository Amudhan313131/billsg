import * as cheerio from 'cheerio'

function extractAmount(text: string): number | null {
  const match = text.match(/\$?([\d,]+)/)
  if (!match) return null
  return parseInt(match[1].replace(/,/g, ''), 10)
}

function extractPercentage(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)%/)
  if (!match) return null
  return parseFloat(match[1])
}

export function parseGovernmentSubsidy(html: string): object | null {
  const $ = cheerio.load(html)
  const rows = $('table tr')
  if (rows.length < 2) return null

  const tiers: Array<{ pchi_max: number | null; av_max?: number; subsidy_pct: number }> = []

  rows.each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 2) return
    const text = cells.first().text()
    const pctText = cells.last().text()
    const pct = extractPercentage(pctText)
    if (pct === null) return

    const amountMatch = text.match(/\$?([\d,]+)/)
    const pchiMax = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : null

    const tier: { pchi_max: number | null; av_max?: number; subsidy_pct: number } = { pchi_max: pchiMax, subsidy_pct: pct }
    if (text.toLowerCase().includes('annual value') || text.toLowerCase().includes('av')) {
      const avMatch = text.match(/\$?([\d,]+)/)
      if (avMatch) tier.av_max = parseInt(avMatch[1].replace(/,/g, ''), 10)
    }
    tiers.push(tier)
  })

  if (tiers.length === 0) return null
  return { sc_tiers: tiers, pr_subsidy_pct: 50, foreigner_subsidy_pct: 0 }
}

export function parseMediShieldLife(html: string): object | null {
  const $ = cheerio.load(html)
  const rows = $('table tr')
  if (rows.length < 2) return null

  const deductibles: Record<string, number> = {}

  rows.each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 2) return
    const wardText = cells.first().text().trim()
    const amount = extractAmount(cells.last().text())
    if (!amount) return

    if (wardText.includes('C')) deductibles['C'] = amount
    if (wardText.includes('B2+')) deductibles['B2+'] = amount
    else if (wardText.includes('B2')) deductibles['B2'] = amount
    if (wardText.includes('B1')) deductibles['B1'] = amount
    if (wardText.includes('A') && !wardText.includes('MA')) deductibles['A'] = amount
  })

  if (Object.keys(deductibles).length === 0) return null
  return {
    deductibles,
    coinsurance_pct: 10,
    annual_claim_limit: 200000,
    applies_to: ['SC', 'PR'],
  }
}

export function parseCHAS(html: string): object | null {
  const $ = cheerio.load(html)
  const rows = $('table tr')
  if (rows.length < 2) return null

  let blueMax: number | null = null
  let orangeMin: number | null = null
  let orangeMax: number | null = null

  rows.each((_, row) => {
    const text = $(row).text().toLowerCase()
    if (text.includes('blue')) {
      const amount = extractAmount($(row).find('td').last().text())
      if (amount) blueMax = amount
    }
    if (text.includes('orange')) {
      const cells = $(row).find('td')
      cells.each((_, cell) => {
        const amt = extractAmount($(cell).text())
        if (amt && !orangeMin) orangeMin = amt
        else if (amt) orangeMax = amt
      })
    }
  })

  if (!blueMax && !orangeMax) return null
  return {
    blue: { pchi_max: blueMax ?? 1500, av_max: 21000 },
    orange: { pchi_min: orangeMin ?? 1501, pchi_max: orangeMax ?? 2300 },
    green: { note: 'All SC eligible regardless of income' },
  }
}

export function parseMediFund(html: string): object | null {
  const $ = cheerio.load(html)
  const content = $('.content-body').text() || $('main').text()
  if (!content || content.length < 50) return null

  return {
    medifund: { min_age: 18, applies_to: ['SC'], requires_difficulty_paying: true },
    medifund_silver: { min_age: 65, applies_to: ['SC'], requires_difficulty_paying: true },
    medifund_junior: { max_age: 17, applies_to: ['SC'], requires_difficulty_paying: true },
  }
}

export function parsePioneerGeneration(html: string): object | null {
  const $ = cheerio.load(html)
  const text = $('body').text()
  if (!text || text.length < 50) return null

  const pct = extractPercentage(text)
  return {
    additional_subsidy_pct: pct ?? 50,
    applies_to: ['SC'],
    birth_year_max: 1949,
  }
}

export function parseMerdekaGeneration(html: string): object | null {
  const $ = cheerio.load(html)
  const text = $('body').text()
  if (!text || text.length < 50) return null

  const pct = extractPercentage(text)
  return {
    additional_subsidy_pct: pct ?? 25,
    applies_to: ['SC'],
    birth_year_range: [1950, 1959],
  }
}

export function parseElderFund(html: string): object | null {
  const $ = cheerio.load(html)
  const text = $('body').text()
  if (!text || text.length < 50) return null

  const amounts = text.match(/\$?([\d,]+)/g)
  const medisaveMax = amounts ? parseInt(amounts[0].replace(/[$,]/g, ''), 10) : null

  return {
    medisave_balance_max: medisaveMax ?? 10000,
    requires_adl_assistance: true,
    excludes_careshield_eldershield: true,
    pchi_max: 1800,
    applies_to: ['SC', 'PR'],
  }
}

export function parseComCare(html: string): object | null {
  const $ = cheerio.load(html)
  const text = $('body').text()
  if (!text || text.length < 50) return null

  const amount = extractAmount(text)
  return {
    pchi_max: amount ?? 800,
    applies_to: ['SC', 'PR'],
    pr_requires_sc_family_member: true,
  }
}

export function parseFlexiMediSave(html: string): object | null {
  const $ = cheerio.load(html)
  const text = $('body').text()
  if (!text || text.length < 50) return null

  const amount = extractAmount(text)
  return {
    min_age: 60,
    annual_limit: amount ?? 400,
    applies_to: ['SC', 'PR'],
  }
}

export function parseIPRider(html: string): object | null {
  const $ = cheerio.load(html)
  const text = $('body').text()
  if (!text || text.length < 50) return null

  const capMatch = text.match(/\$?([\d,]+)/)
  const cap = capMatch ? parseInt(capMatch[1].replace(/,/g, ''), 10) : null

  return {
    restructuring_date: '2026-04-01',
    new_copayment_cap: cap ?? 6000,
    minimum_copayment_pct: 5,
    grandfathered_cutoff: '2026-03-31',
  }
}

export function parseMAF(html: string): object | null {
  const $ = cheerio.load(html)
  const text = $('main').text() || $('body').text()
  if (!text || text.length < 50) return null

  return {
    applies_to: ['SC', 'PR'],
    requires_medication_charges: true,
  }
}
