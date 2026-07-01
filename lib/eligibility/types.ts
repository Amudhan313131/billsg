/**
 * Eligibility Matrix — Core Types
 *
 * Types used by the deterministic rules engine to evaluate
 * scheme eligibility against a user's profile.
 */

/** Singapore citizenship/residency status */
export type Citizenship = 'SC' | 'PR' | 'Foreigner'

/** Result status for a scheme eligibility check */
export type SchemeStatus = 'auto_applied' | 'unclaimed' | 'not_applicable'

/** When an IP rider policy was purchased relative to April 2026 changes */
export type IpRiderDate = 'before_april_2026' | 'after_april_2026' | 'none'

/**
 * Ward class for hospital admission.
 * Exported for use by ParsedBill and scheme checkers that need ward context.
 * Note: ward_class belongs to ParsedBill, NOT UserProfile.
 */
export type WardClass = 'A' | 'B1' | 'B2' | 'C'

/**
 * User profile collected during onboarding (Phase 1).
 *
 * Does NOT include ward_class — that belongs to ParsedBill and is
 * detected from the uploaded bill, not collected during onboarding.
 */
export interface UserProfile {
  /** Singapore citizenship/residency status */
  citizenship: Citizenship

  /** User's age in years */
  age: number

  /** Per Capita Household Income in SGD per month */
  monthly_pchi: number

  /** Annual Value of home in SGD (used when PCHI = 0) */
  annual_value: number

  /**
   * Pioneer Generation flag.
   * True if born before 1 Jan 1950 and obtained SC before 31 Dec 1986.
   */
  is_pioneer: boolean

  /**
   * Merdeka Generation flag.
   * True if: (a) Born 1 Jan 1950 – 31 Dec 1959 AND SC by 31 Dec 1996, OR
   * (b) Born before 1 Jan 1950, not Pioneer Generation, AND SC by 31 Dec 1996.
   */
  is_merdeka: boolean

  /** Whether the user has an Integrated Shield Plan rider */
  has_ip_rider: boolean

  /** When the IP rider was purchased relative to April 2026 changes */
  ip_rider_date: IpRiderDate

  // --- Additional fields for specific scheme checkers ---
  // These may be collected via follow-up questions or derived from bill data.

  /** MediSave account balance in SGD (needed by ElderFund) */
  medisave_balance?: number

  /**
   * Whether the user requires full ADL (Activities of Daily Living) assistance.
   * True if impaired in at least 3 of 6 ADLs (needed by ElderFund).
   */
  adl_needs_assistance?: boolean

  /** Whether the user is a CareShield Life or ElderShield policyholder (needed by ElderFund) */
  is_careshield_or_eldershield?: boolean

  /** Whether the user has at least one SC family member in household (needed by ComCare PR path) */
  has_sc_family_member?: boolean

  /** Whether the user has a permanent inability to work (needed by ComCare LTA) */
  permanent_inability_to_work?: boolean

  /** Whether the user has difficulty paying remaining bill (needed by MediFund) */
  difficulty_paying?: boolean

  /** Whether the bill contains medication charges (needed by MAF) */
  has_medication_charges?: boolean
}

/**
 * Result of evaluating a single scheme against a UserProfile.
 * Every SchemeMatch must include all fields per Requirement 1.3:
 * scheme_id, scheme_name, status, reason, action_steps, source_url, verified_date.
 */
export interface SchemeMatch {
  /** Unique identifier for the scheme (e.g. 'government-subsidy', 'chas-blue') */
  scheme_id: string

  /** Human-readable scheme name */
  scheme_name: string

  /** Eligibility status: auto_applied, unclaimed, or not_applicable */
  status: SchemeStatus

  /** Plain English explanation of why this status was assigned */
  reason: string

  /** Ordered list of steps the user should take (empty if auto_applied or not_applicable) */
  action_steps: string[]

  /** Official MOH/government source URL for this scheme */
  source_url: string

  /** ISO date string (YYYY-MM-DD) when the scheme rules were last verified */
  verified_date: string
}
