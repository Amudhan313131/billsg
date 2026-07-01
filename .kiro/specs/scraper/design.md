# Design: Scraper

## Overview
Node.js + TypeScript scraper using Cheerio for HTML parsing, Axios for HTTP, and node-cron for scheduling. Fetches specific data points from 11 government pages and updates the MCP server.

## Architecture

```
scraper/
├── index.ts              # Main entry point
├── sources.ts            # URL and selector config per scheme
├── scheduler.ts          # Cron job setup
├── parsers/              # One parser per scheme
│   ├── government-subsidy.ts
│   ├── medishield-life.ts
│   ├── chas.ts
│   ├── medifund.ts
│   ├── pioneer.ts
│   ├── merdeka.ts
│   ├── elderfund.ts
│   ├── comcare.ts
│   ├── flexi-medisave.ts
│   ├── ip-rider.ts
│   └── maf.ts
└── updater.ts            # Updates MCP server
```

## Data Sources (11 Verified URLs)

| Scheme | URL |
|---|---|
| Government Subsidy | moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-acute-inpatient-care-at-public-healthcare-institutions/ |
| MediShield Life | cpf.gov.sg/member/healthcare-financing/medishield-life/what-medishield-life-covers-you-for |
| MediSave | moh.gov.sg/managing-expenses/schemes-and-subsidies/medisave/ |
| CHAS | moh.gov.sg/managing-expenses/schemes-and-subsidies/chas |
| Pioneer Generation | moh.gov.sg/managing-expenses/schemes-and-subsidies/pioneer-generation-package |
| Merdeka Generation | moh.gov.sg/managing-expenses/schemes-and-subsidies/merdeka-generation-package |
| MediFund | moh.gov.sg/managing-expenses/schemes-and-subsidies/medifund |
| MAF | moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-drugs-on-the-medication-assistance-fund-(maf)-list-at-public-healthcare-institutions/ |
| ElderFund | aic.sg/financial-assistance/elderfund |
| ComCare SMTA/LTA | supportgowhere.life.gov.sg/schemes/ |
| IP Rider | moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans |

## Extracted Data Points Per Scheme

### Government Subsidy
```json
{ "sc_subsidy_tiers": [...], "pr_subsidy_tiers": [...], "no_income_av_threshold": 21000 }
```

### MediShield Life
```json
{ "deductible_class_c": 1500, "deductible_class_b2": 2000, "deductible_class_b1": 2500, "deductible_class_a": 3500, "coinsurance_tier_1_pct": 10, "coinsurance_tier_1_max": 5000, "coinsurance_tier_2_pct": 5, "coinsurance_tier_2_max": 10000, "coinsurance_tier_3_pct": 3, "annual_claim_limit": 200000 }
```

### CHAS
```json
{ "blue_pchi_max": 1500, "blue_av_max": 21000, "orange_pchi_min": 1501, "orange_pchi_max": 2300, "orange_av_min": 21001, "orange_av_max": 31000, "green_pchi_min": 2301, "applies_to": ["SC"] }
```

### IP Rider Rules
```json
{ "restructuring_date": "2026-04-01", "new_copayment_cap": 6000, "minimum_copayment_pct": 5, "deductible_coverage_banned": true, "grandfathered_cutoff": "2026-03-31" }
```

### Flexi-MediSave
```json
{ "min_age": 60, "annual_limit": 400, "applies_to": ["SC", "PR"] }
```

## Scraping Pipeline (per scheme)

1. **Fetch:** GET source_url, headers with User-Agent, 10s timeout, 3 retries with exponential backoff
2. **Parse:** Cheerio extracts specific data points via CSS selectors from sources.ts
3. **Validate:** Check types, ranges (PCHI 0–10000, subsidy 0–100%, age 0–120). Detect > 20% changes.
4. **Update:** POST to MCP server internal endpoint. Write to data/schemes.json. Set last_scraped.
5. **Log:** scheme_id, changed fields, old/new values, timestamp.

## Scheduler
```typescript
cron.schedule('0 2 * * 0', () => runScraper(), { timezone: 'Asia/Singapore' })
```

## Change Detection
- `abs(new - old) / old > 0.20` → log significant change, update, set freshness = 'recently_changed'

## MCP Server Data Format
```typescript
interface SchemeData {
  scheme_id: string
  scheme_name: string
  last_scraped: string
  source_url: string
  data: object
  data_freshness: 'current' | 'recently_changed' | 'stale'
}
```

## MediSave Data Points
```json
{ "withdrawal_limits": {...}, "applies_to": ["SC", "PR"] }
```
Primary source: moh.gov.sg/managing-expenses/schemes-and-subsidies/medisave/
Secondary source: cpf.gov.sg/member/healthcare-financing/medisave (for withdrawal limit tables)

## Notes
- Scraper does NOT relate data to bills — only keeps MCP server current
- No raw HTML stored — only extracted structured data
- Selectors defined in sources.ts — update there if page structure changes
- For hackathon demo: trigger manually via POST /api/scraper
- `schemes_updated: 11` in the scraper response refers to the number of government pages scraped (11 URLs), not the total count of healthcare schemes (14)
