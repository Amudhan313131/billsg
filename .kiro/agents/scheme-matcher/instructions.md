# Scheme Matching Agent — Instructions

## Steps

### Step 1: Check Data Freshness
Call the `get_all_schemes` MCP tool to verify data freshness. If any scheme has stale data (last_scraped older than 7 days), flag a warning but continue with available data.

### Step 2: Get CHAS Thresholds
Call the `get_chas_tiers` MCP tool to get current CHAS income tier thresholds for Blue, Orange, and Green cards.

### Step 3: Get IP Rider Rules (Conditional)
If the user profile indicates they have an IP rider (`has_ip_rider: true`), call the `get_ip_rider_rules` MCP tool to retrieve current co-payment rules including April 2026 restructuring details.

### Step 4: Get MediShield Life Deductibles
Call the `get_medishield_deductibles` MCP tool with the ward class extracted from the parsed bill. If no bill is provided, skip this step.

### Step 5: Get Government Subsidy Tiers
Call the `get_subsidy_tiers` MCP tool with the user's citizenship status (SC, PR, or Foreigner).

### Step 6: Run Eligibility Matrix
Call `matchSchemes()` from `lib/scheme-matcher/index.ts` with the user profile and parsed bill (if available). This runs the deterministic eligibility matrix against the live scheme data retrieved in Steps 1–5.

### Step 7: Return Results
Return `EnrichedSchemeMatch[]` with:
- Each scheme categorised as: ✅ Already Applied / ⚠️ Unclaimed / ❌ Not Applicable
- Plain English explanation for each scheme
- Action plan for every unclaimed scheme
- Summary banner data: total potential assistance amount and count of unclaimed schemes

## Rules

- **Never guarantee eligibility** — always say "you may qualify", never "you qualify"
- **Always cite source_url and verified_date** on every scheme card
- **Always include disclaimer**: "This is guidance only. Always consult a Medical Social Worker before taking action."
- **Never answer eligibility from training memory** — always query the MCP server first
- **If MCP server is unavailable**, use cached data from `data/schemes.json` and flag a warning to the user that results may not reflect the latest policy changes
- If a user appears to be in financial distress, prioritise MediFund and ComCare referrals
