# Tasks: Action Plan Templates

## Task 1: Create action plan types and template data structure
- [ ] Create `lib/action-plans/types.ts` with ActionPlan interface
- [ ] Create `lib/action-plans/templates.ts` with all 13 templates as a keyed object
- [ ] Export template lookup by scheme_id
- [ ] Include disclaimer constant string

## Task 2: Implement template selection logic
- [ ] Create `lib/action-plans/select.ts` with `getActionPlan(scheme_id, userProfile)` function
- [ ] Return null for government_subsidy, medishield_life, medisave
- [ ] Handle age < 18: return medifund_junior instead of medifund_silver
- [ ] Handle age >= 18: return medifund instead of medifund_junior
- [ ] Handle ComCare SMTA vs LTA based on user context

## Task 3: Write unit tests for template selection
- [ ] Test auto_applied schemes return null
- [ ] Test age 15 with MediFund → Junior template
- [ ] Test age 68 with MediFund Silver → Silver template
- [ ] Test ComCare temporary → SMTA template
- [ ] Test ComCare permanent → LTA template
- [ ] Test Foreigner → no templates generated
- [ ] Test PR → only MAF and Flexi-MediSave templates available
