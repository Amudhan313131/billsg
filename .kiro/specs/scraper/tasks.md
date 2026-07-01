# Tasks: Scraper

## Task 1: Set up scraper project structure and dependencies
- [ ] Create `scraper/` directory with TypeScript config
- [ ] Install dependencies: cheerio, axios, node-cron
- [ ] Create `scraper/sources.ts` with all 11 URLs and CSS selectors
- [ ] Create `scraper/index.ts` main entry point

## Task 2: Implement individual scheme parsers
- [ ] Create `scraper/parsers/government-subsidy.ts` — extract SC/PR tier arrays + AV threshold
- [ ] Create `scraper/parsers/medishield-life.ts` — extract deductibles + co-insurance tiers
- [ ] Create `scraper/parsers/chas.ts` — extract Blue/Orange/Green PCHI thresholds
- [ ] Create `scraper/parsers/medifund.ts` — extract min_age, applies_to
- [ ] Create `scraper/parsers/pioneer.ts` and `merdeka.ts`
- [ ] Create `scraper/parsers/elderfund.ts` — extract min_age, max_pchi, max_medisave
- [ ] Create `scraper/parsers/comcare.ts` — extract max_pchi, application_url
- [ ] Create `scraper/parsers/flexi-medisave.ts` — extract min_age, annual_limit
- [ ] Create `scraper/parsers/ip-rider.ts` — extract restructuring_date, copayment_cap
- [ ] Create `scraper/parsers/maf.ts`

## Task 3: Implement validation layer
- [ ] Create `scraper/validate.ts`
- [ ] Check extracted values are numbers where expected
- [ ] Check ranges: PCHI 0–10000, subsidy 0–100%, age 0–120
- [ ] Detect > 20% change from last scrape and log as SIGNIFICANT CHANGE
- [ ] If validation fails: keep existing data, return error

## Task 4: Implement MCP server updater
- [ ] Create `scraper/updater.ts`
- [ ] POST scraped data to MCP server internal update endpoint
- [ ] Write to data/schemes.json
- [ ] Set last_scraped timestamp
- [ ] Handle MCP server unreachable: queue and retry
- [ ] Log: scheme_id, changed fields, old values, new values

## Task 5: Implement scheduler and manual trigger API
- [ ] Create `scraper/scheduler.ts` with cron: Sunday 2am SGT
- [ ] Create API route `app/api/scraper/route.ts` for manual trigger
- [ ] Implement retry logic: 3 retries with exponential backoff per page
- [ ] Ensure one scheme failure doesn't block others
- [ ] Return response: { success, schemes_updated, timestamp }

## Task 6: Implement error handling and logging
- [ ] Handle 404: keep existing data, log error
- [ ] Handle timeout: retry 3x, then keep existing, log
- [ ] Handle selector not found: log "Selector changed — manual update needed"
- [ ] Handle out-of-range values: reject, keep existing, log suspicious value
- [ ] Create structured log output for all scrape runs
