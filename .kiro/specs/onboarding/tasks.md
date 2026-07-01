# Tasks: Onboarding

## Task 1: Create onboarding wizard page layout and progress indicator component
- [ ] Create `app/onboarding/page.tsx` with multi-step wizard container
- [ ] Build `ProgressBar` component showing current_screen / total_screens + percentage
- [ ] Implement dynamic total_screens (6 or 7 based on IP rider answer)
- [ ] Add "Back" button on every screen preserving form state
- [ ] Ensure mobile-first responsive layout

## Task 2: Implement Screen 1 — Citizenship radio selection
- [ ] Render three radio options: "Singapore Citizen", "Permanent Resident (PR)", "Foreigner / Work Pass / Dependent"
- [ ] Disable "Next" button until selection made
- [ ] Map selection to `citizenship` field in form state
- [ ] No default selection on load

## Task 3: Implement Screen 2 — Age number input
- [ ] Render number input with placeholder "e.g. 68"
- [ ] Validate: required, integer, 0–120 range
- [ ] Strip non-numeric characters on input
- [ ] Round down decimals on submission
- [ ] Show inline error: "Please enter a valid age between 0 and 120" for invalid values
- [ ] Disable "Next" when empty or invalid

## Task 4: Implement Screen 3 — PCHI number input
- [ ] Render number input with `$` prefix, placeholder "e.g. 1200"
- [ ] Show helper text explaining PCHI calculation
- [ ] Allow blank or 0 without blocking (optional field)
- [ ] Validate: >= 0, max 99999, round decimals
- [ ] Show inline error: "Income cannot be negative" for negative values
- [ ] Map blank/0 → `monthly_pchi = 0`

## Task 5: Implement Screen 4 — Annual Value number input
- [ ] Render number input with `$` prefix, placeholder "e.g. 15000"
- [ ] Show helper text about IRAS property tax notice
- [ ] Validate: required, >= 0, max 999999, round decimals
- [ ] Show inline error: "Annual Value cannot be negative" for negative values
- [ ] Disable "Next" when empty or invalid

## Task 6: Implement Screen 5 — Pioneer/Merdeka/Neither radio
- [ ] Render three radio options with helper text explaining eligibility criteria
- [ ] Single-select only (structurally prevents both-true edge case)
- [ ] Map: pioneer → `{is_pioneer: true, is_merdeka: false}`, merdeka → `{is_pioneer: false, is_merdeka: true}`, neither → `{is_pioneer: false, is_merdeka: false}`
- [ ] Disable "Next" until selection made

## Task 7: Implement Screen 6 & 7 — IP Rider with conditional follow-up
- [ ] Screen 6: Yes/No radio for IP rider ownership
- [ ] If "No" → set `has_ip_rider = false`, `ip_rider_date = 'none'`, skip to submission
- [ ] If "Yes" → set `has_ip_rider = true`, show Screen 7
- [ ] Screen 7: "Before 1 April 2026" / "On or after 1 April 2026" radio
- [ ] Update progress indicator total_screens dynamically
- [ ] Show helper text about April 2026 MOH rule changes

## Task 8: Implement form submission and UserProfile mapping
- [ ] Map `OnboardingFormState` → `UserProfile` using all screen rules
- [ ] Store UserProfile in session state (no persistent storage)
- [ ] Generate session ID on first screen load
- [ ] Ensure form data persists on browser refresh within session

## Task 9: Build Entitlement Dashboard page
- [ ] Create `app/dashboard/page.tsx`
- [ ] Call `checkEligibility(userProfile)` on mount
- [ ] Render three sections: ✅ Already Applied, ⚠️ You May Be Eligible, ❌ Not Applicable
- [ ] Not Applicable section collapsed by default
- [ ] Each scheme card shows: name, reason, action_steps (for unclaimed), source_url, verified_date
- [ ] Sort unclaimed schemes by potential impact (MediFund/ComCare at top)

## Task 10: Add Dashboard supplementary elements
- [ ] Build collapsible Profile Summary card at top with "Edit" link
- [ ] "Edit" link returns to wizard with fields pre-filled
- [ ] Add "Upload Your Hospital Bill" CTA button with subtext
- [ ] Add disclaimer text (always visible): "This is guidance to help you ask the right questions. Always consult a Medical Social Worker before taking action. Eligibility is subject to assessment by the relevant authorities."
- [ ] Handle Foreigner edge case: show "Most Singapore government schemes are only available to Singapore Citizens and Permanent Residents."

## Task 11: Create onboarding session API route
- [ ] Create `app/api/onboarding/route.ts`
- [ ] Accept POST with OnboardingFormState, return mapped UserProfile
- [ ] Store UserProfile in server-side session (no persistent storage, no PII logged)
- [ ] Return session ID for subsequent phase calls (bill-parser, explain-bill, match-schemes)
