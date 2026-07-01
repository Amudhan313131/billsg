# Design: UI Flow

## Overview
Page-level UI structure, navigation flow, states, and message placement for BillSG. Follows product.md's 5-phase structure. Defines UI/UX only — all business logic referenced by upstream spec.

## Pages This Spec Owns

| Page | Route | Phase |
|---|---|---|
| Landing | `/` | Entry |
| Bill Upload | `/upload` | Phase 2 |
| Explain My Bill | `/explain` | Phase 3 |
| Match Schemes | `/match` | Phase 4 |
| Summary Banner | Part of `/match` | Phase 5 |

Pages NOT owned (see onboarding spec): `/onboarding`, `/dashboard`

## Page States (4 per page)

### Landing (`/`)
| State | Behaviour |
|---|---|
| Initial | Static render. Headline + CTA. No data fetching. |
| Loading | N/A |
| Success | N/A |
| Error | N/A |

**Layout:**
- Headline: "Know Your Bill. Claim What's Yours."
- Subheadline: Uncle Tan story one-liner
- CTA: "Get Started" → `/onboarding`

### Bill Upload (`/upload`)
| State | Behaviour |
|---|---|
| Initial | Upload zone + disabled "Explain My Bill" button |
| Loading | Progress bar + "Uploading and reading your bill…" + cancel button |
| Success | Hospital name + ward class shown + "Explain My Bill" enabled |
| Error | Error inline above upload zone, zone remains for retry |

### Explain My Bill (`/explain`)
| State | Behaviour |
|---|---|
| Initial | Not reachable (requires "Explain My Bill" click) |
| Loading | Skeleton cards + "Explaining your bill…" + disabled "Match Schemes" |
| Success | All cards rendered + "Match Schemes" enabled + IP callout if applicable |
| Error | Failed items show fallback message; total failure → retry button |

### Match Schemes (`/match`)
| State | Behaviour |
|---|---|
| Initial | Not reachable (requires "Match Schemes" click) |
| Loading | Skeleton cards in 3 columns + "Matching schemes…" |
| Success | All cards in columns + Summary Banner + IP flag card |
| Error | MCP unavailable → cached results + warning; total failure → retry |

## System Message Placement Map

| Message | Page | Placement | Source |
|---|---|---|---|
| File too large | Bill Upload | Error state, inline | bill-parser |
| Unsupported format | Bill Upload | Error state, inline | bill-parser |
| Low confidence | Bill Upload | Warning (non-blocking) | bill-parser |
| No line items | Bill Upload | Error state, inline | bill-parser |
| Amount mismatch | Bill Upload | Warning (non-blocking) | bill-parser |
| Non-bill document | Bill Upload | Error state, inline | bill-parser |
| Unknown ward class | Explain | Yellow banner below title | scheme_matcher EC6 |
| IP rider callout | Explain | Banner above line items | bill_explainer |
| Private hospital | Match | Yellow banner above columns | scheme_matcher EC7 |
| Fully covered | Match | Green banner above columns | scheme_matcher EC8 |
| MCP unavailable | Match | Orange warning below title | scheme_matcher EC9 |
| Urgent (>$10K) | Match | Red callout top of Unclaimed | scheme_matcher EC10 |
| Foreigner | Match | Replaces columns entirely | scheme_matcher EC1 |
| PR restriction | Match | Note on not_applicable cards | scheme_matcher EC2 |
| Pioneer+Merdeka error | Match | Blocks render (API only) | scheme_matcher EC5 |
| Profile-only | Match | Blue banner above columns | scheme_matcher Step2 |
| IP rider flag card | Match | Standalone card at top | scheme_matcher output |

## IP Rider Callout Decision
- Explain page: renders as a banner (visual warning/info from bill_explainer)
- Match page: renders as an `IPRiderFlag` card (from scheme_matcher output interface)
- These are different visual treatments of the same information — not a duplicate
- Rationale: each page has its own data source (bill_explainer vs scheme_matcher output)

## Disclaimers (per page)
- Dashboard: "...Eligibility is subject to assessment by the relevant authorities." (from onboarding spec)
- Explain: "These explanations are for informational purposes only..." (from bill_explainer)
- Match + Summary: "This is guidance only. Always consult a Medical Social Worker before taking action." (from scheme_matcher)

Note: The three disclaimer variants are intentionally different — each is sourced from its respective spec and calibrated to that page's context. Do not consolidate into a single disclaimer.

## Global Elements
- Nav bar: BillSG logo → Landing, no login/account
- Breadcrumb: Dashboard → Upload → Explain → Match (completed steps clickable)
- Session-based, no persistent data
- Mobile-first, responsive
- WCAG 2.1 AA: colour never sole indicator, badges use icons + text

## Caching Behaviour
- Explain My Bill: cached per session, re-click does not re-call LLM
- Match Schemes: cached per session, re-click does not re-run agent
