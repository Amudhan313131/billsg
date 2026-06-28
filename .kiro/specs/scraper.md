# Scraper Spec

## Overview
The scraper automatically fetches live scheme data from official Singapore government sources and updates the MCP server. It extracts specific data points (numbers, thresholds, criteria) — not free-form text. This ensures BillSG always uses current eligibility thresholds and policy rules.

The scraper does NOT relate data to bills. It only keeps the MCP server current with the latest numbers. The rules engine and scheme matcher handle the logic.

The scraper runs on a weekly schedule and can also be triggered manually via the `/api/scraper` endpoint.

## What the Scraper Extracts
The scraper extracts specific structured data points from each page — not paragraphs or sentences. Example:

```json
{
  "chas_blue_pchi_max": 1500,
  "chas_orange_pchi_min": 1501,
  "chas_orange_pchi_max": 2300,
  "chas_blue_av_max": 21000,
  "last_scraped": "2026-06-29T02:00:00Z",
  "source_url": "https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/chas"
}
```

## Why This Exists
Singapore healthcare schemes change regularly:
- CHAS income thresholds updated January 2025
- MediSave limits raised October 2025 and January 2026
- IP rider rules restructured April 2026
- LTC subsidies enhanced July 2026

Without a scraper, these changes require manual code updates. With the scraper, the MCP server updates automatically and the rules engine always uses current data.

## Data Sources — Verified Working URLs

| Scheme | Primary URL | Additional URLs |
|---|---|---|
| Government Subsidy | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-acute-inpatient-care-at-public-healthcare-institutions/ | — |
| MediShield Life | https://www.cpf.gov.sg/member/healthcare-financing/medishield-life/what-medishield-life-covers-you-for | — |
| MediSave | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medisave/ | https://www.cpf.gov.sg/member/healthcare-financing/using-your-medisave-savings, https://www.healthhub.sg/support-and-tools/costs-and-financing/medisave |
| CHAS | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/chas | — |
| Pioneer Generation | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/pioneer-generation-package | — |
| Merdeka Generation | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/merdeka-generation-package | — |
| MediFund / Silver / Junior | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/medifund | — |
| MAF | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/subsidies-for-drugs-on-the-medication-assistance-fund-(maf)-list-at-public-healthcare-institutions/ | — |
| ElderFund | https://www.aic.sg/financial-assistance/elderfund | — |
| ComCare SMTA | https://supportgowhere.life.gov.sg/schemes/COMCARE-SMTA/comcare-short-to-medium-term-assistance-smta | — |
| ComCare LTA | https://supportgowhere.life.gov.sg/schemes/COMCARE-LTA/comcare-long-term-assistance-lta | — |
| Flexi-MediSave | https://www.moh.gov.sg/newsroom/introduction-of-outpatient-flexi-medisave-for-the-elderly-from-1-april-2015/ | — |
| IP Rider Rules | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans | https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans/about-integrated-shield-plans/, https://www.moh.gov.sg/managing-expenses/schemes-and-subsidies/integrated-shield-plans/comparision-of-integrated-shield-plans/ |

## Exact Data Points Extracted Per Scheme

### Government Subsidy
```json
{
  "sc_subsidy_tiers": [
    { "pchi_max": 2100, "subsidy_pct": 80 },
    { "pchi_min": 2101, "pchi_max": 2300, "subsidy_pct": 75 },
    { "pchi_min": 2301, "pchi_max": 2600, "subsidy_pct": 70 },
    { "pchi_min": 2601, "pchi_max": 3000, "subsidy_pct": 65 },
    { "pchi_min": 3001, "pchi_max": 3300, "subsidy_pct": 60 },
    { "pchi_min": 3301, "pchi_max": 3600, "subsidy_pct": 55 },
    { "pchi_min": 3601, "subsidy_pct": 50 }
  ],
  "pr_subsidy_tiers": [
    { "pchi_max": 2100, "subsidy_pct": 50 },
    { "pchi_min": 2101, "pchi_max": 2300, "subsidy_pct": 42.5 },
    { "pchi_min": 2301, "pchi_max": 2600, "subsidy_pct": 35 },
    { "pchi_min": 2601, "pchi_max": 3000, "subsidy_pct": 32.5 },
    { "pchi_min": 3001, "pchi_max": 3300, "subsidy_pct": 30 },
    { "pchi_min": 3301, "pchi_max": 3600, "subsidy_pct": 27.5 },
    { "pchi_min": 3601, "subsidy_pct": 25 }
  ],
  "no_income_av_threshold": 21000
}
```

### MediShield Life
```json
{
  "deductible_class_c": 1500,
  "deductible_class_b2": 2000,
  "deductible_class_b1": 2500,
  "deductible_class_a": 3500,
  "coinsurance_tier_1_pct": 10,
  "coinsurance_tier_1_max": 5000,
  "coinsurance_tier_2_pct": 5,
  "coinsurance_tier_2_max": 10000,
  "coinsurance_tier_3_pct": 3,
  "annual_claim_limit": 200000
}
```

### CHAS
```json
{
  "blue_pchi_max": 1500,
  "blue_av_max": 21000,
  "orange_pchi_min": 1501,
  "orange_pchi_max": 2300,
  "orange_av_min": 21001,
  "orange_av_max": 31000,
  "green_pchi_min": 2301,
  "applies_to": ["SC"]
}
```

### MediFund Silver
```json
{
  "min_age": 65,
  "applies_to": ["SC"],
  "application": "Medical Social Worker at hospital"
}
```

### ElderFund
```json
{
  "min_age": 30,
  "max_pchi": 1500,
  "max_medisave_balance": 10000,
  "monthly_payout_max": 250,
  "applies_to": ["SC"]
}
```

### ComCare SMTA
```json
{
  "max_pchi": 800,
  "applies_to": ["SC", "PR"],
  "sc_family_member_required": true,
  "application_url": "https://supportgowhere.life.gov.sg"
}
```

### Flexi-MediSave
```json
{
  "min_age": 60,
  "annual_limit": 400,
  "applies_to": ["SC", "PR"]
}
```

### IP Rider Rules
```json
{
  "restructuring_date": "2026-04-01",
  "new_copayment_cap": 6000,
  "minimum_copayment_pct": 5,
  "deductible_coverage_banned": true,
  "grandfathered_cutoff": "2026-03-31"
}
```

## Output — MCP Server Data Format

```typescript
interface SchemeData {
  scheme_id: string
  scheme_name: string
  last_scraped: string          // ISO timestamp
  source_url: string
  data: object                  // Scheme-specific extracted data points
  data_freshness: 'current' | 'recently_changed' | 'stale'
}
```

## Scraper Architecture

### Technology
- Runtime: Node.js + TypeScript
- HTML parsing: Cheerio
- HTTP client: Axios
- Scheduler: node-cron

### File Structure
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

└── updater.ts            # Updates MCP server with scraped data

### Scraping Logic — Step by Step

**Step 1 — Fetch page**
GET {source_url}

Headers: { 'User-Agent': 'BillSG/1.0 (Educational Tool)' }
Timeout: 10 seconds
Retry: 3 times with exponential backoff

**Step 2 — Parse HTML**
Use Cheerio to extract specific data points using CSS selectors defined in sources.ts.
Each parser extracts only the specific numbers it needs — not full page text.

**Step 3 — Validate extracted data**
Before updating MCP server:
- Check extracted values are numbers where expected
- Check values are within reasonable ranges:
  - PCHI thresholds: between $0 and $10,000
  - Subsidy percentages: between 0% and 100%
  - Age thresholds: between 0 and 120
- Flag if values changed significantly from last scrape (> 20% change)
- If validation fails → keep existing data, log error

**Step 4 — Update MCP server**
POST scraped data to MCP server internal update endpoint.
MCP server updates in-memory data and writes to data/schemes.json.
Sets last_scraped timestamp.

**Step 5 — Log result**
Log: scheme_id, changed fields, old values, new values, timestamp.

## Scheduler

```typescript
// Run every Sunday at 2am Singapore time
cron.schedule('0 2 * * 0', () => {
  runScraper()
}, {
  timezone: 'Asia/Singapore'
})
```

## Manual Trigger
API endpoint: POST /api/scraper
Use case: Trigger after known policy change

## Change Detection
IF abs(new_value - old_value) / old_value > 0.20
THEN:
Log: "SIGNIFICANT CHANGE: {scheme_id}.{field} changed from {old} to {new}"
Update MCP server with new value
Set data_freshness = 'recently_changed'

## Error Handling

| Error | Response |
|---|---|
| Page not found (404) | Keep existing data. Log error. |
| Timeout after 3 retries | Keep existing data. Log error. |
| Selector not found | Keep existing data. Log: "Selector changed — manual update needed." |
| Value out of range | Keep existing data. Log: "Suspicious value detected." |
| MCP server unreachable | Queue update. Retry when MCP server recovers. |

## Acceptance Criteria

- GIVEN scraper runs on schedule
- WHEN CHAS page is fetched
- THEN chas_blue_pchi_max extracted as number
- AND stored in MCP server
- AND last_scraped timestamp updated
- AND source_url recorded

- GIVEN MOH page structure changes (selector not found)
- WHEN scraper runs
- THEN existing data kept unchanged
- AND error logged: "Selector changed — manual update needed"
- AND MCP server continues serving old data

- GIVEN scraped value differs from stored value by > 20%
- WHEN scraper detects change
- THEN significant change logged
- AND MCP server updated with new value
- AND data_freshness = 'recently_changed'

- GIVEN manual trigger via POST /api/scraper
- WHEN request received
- THEN all 11 scheme pages scraped immediately
- AND MCP server updated
- AND response: { success: true, schemes_updated: 11, timestamp: ... }

- GIVEN page fetch times out
- WHEN retry logic runs
- THEN 3 retries with exponential backoff
- AND if all fail → existing data kept, error logged
- AND other schemes continue scraping normally

- GIVEN extracted PCHI value is $50,000 (out of range)
- WHEN validation runs
- THEN value rejected
- AND existing data kept
- AND log: "Suspicious value detected for chas_blue_pchi_max: 50000"

## Notes
- Scraper extracts specific data points only — not free-form text
- Scraper does NOT relate data to bills — that is the rules engine's job
- All source URLs are publicly available government pages — no authentication needed
- No raw HTML stored — only extracted structured data
- For hackathon demo: trigger manually via POST /api/scraper to show live data fetching
- Cheerio selectors for each page defined in sources.ts — update selectors there if page structure changes