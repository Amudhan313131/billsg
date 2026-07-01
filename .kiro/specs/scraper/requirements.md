# Requirements: Scraper

## Overview
The scraper automatically fetches live scheme data from official Singapore government sources and updates the MCP server. It extracts specific data points (numbers, thresholds, criteria) — not free-form text. This ensures BillSG always uses current eligibility thresholds and policy rules.

## Requirements

### Requirement 1: Scheduled Data Fetching
**User Story:** As the system, I want to automatically fetch scheme data weekly so thresholds stay current.

#### Acceptance Criteria
1. GIVEN the scheduler WHEN Sunday 2am SGT arrives THEN all scheme pages are scraped
2. GIVEN a manual trigger via POST /api/scraper WHEN received THEN all pages are scraped immediately
3. GIVEN a page fetch WHEN initiated THEN User-Agent is "BillSG/1.0 (Educational Tool)" with 10s timeout

### Requirement 2: Specific Data Point Extraction
**User Story:** As the system, I want to extract only structured numbers and thresholds, not free-form text.

#### Acceptance Criteria
1. GIVEN Government Subsidy page WHEN scraped THEN SC/PR subsidy tier arrays and AV threshold extracted
2. GIVEN MediShield Life page WHEN scraped THEN deductibles per ward class and co-insurance tiers extracted
3. GIVEN CHAS page WHEN scraped THEN Blue/Orange/Green PCHI thresholds extracted
4. GIVEN IP Rider page WHEN scraped THEN restructuring_date, copayment_cap, deductible_coverage_banned extracted
5. GIVEN Flexi-MediSave page WHEN scraped THEN min_age and annual_limit extracted

### Requirement 3: Validation Before Update
**User Story:** As the system, I want to validate scraped data before updating to prevent corrupted thresholds.

#### Acceptance Criteria
1. GIVEN extracted values WHEN validated THEN numbers checked within reasonable ranges (PCHI 0–10000, subsidy 0–100%, age 0–120)
2. GIVEN a value change > 20% from last scrape THEN log as "SIGNIFICANT CHANGE" and set data_freshness = 'recently_changed'
3. GIVEN validation fails THEN existing data kept unchanged and error logged

### Requirement 4: Error Resilience
**User Story:** As the system, I want scraping failures to never corrupt existing data.

#### Acceptance Criteria
1. GIVEN page returns 404 THEN existing data kept, error logged
2. GIVEN timeout after 3 retries THEN existing data kept, error logged
3. GIVEN CSS selector not found THEN existing data kept, log "Selector changed — manual update needed"
4. GIVEN suspicious value (out of range) THEN value rejected, existing data kept
5. GIVEN MCP server unreachable THEN queue update, retry when recovered
6. GIVEN one scheme fails THEN other schemes continue scraping normally

### Requirement 5: MCP Server Update
**User Story:** As downstream systems, I want the MCP server always serving the latest verified data.

#### Acceptance Criteria
1. GIVEN valid scraped data WHEN posted to MCP server THEN in-memory data updated and written to data/schemes.json
2. GIVEN successful update THEN last_scraped timestamp set
3. GIVEN all schemes scraped WHEN manual trigger response sent THEN { success: true, schemes_updated: 11, timestamp: ... }

### Requirement 6: Data Sources
**User Story:** As the system, I want to scrape only official government URLs.

#### Acceptance Criteria
1. GIVEN data sources THEN all URLs are publicly accessible government pages (moh.gov.sg, cpf.gov.sg, aic.sg, supportgowhere.life.gov.sg)
2. GIVEN source URLs THEN no authentication needed
3. GIVEN scraped data THEN source_url and last_scraped timestamp recorded for each scheme
