/**
 * Action Plan Templates — Core Types
 *
 * Defines the ActionPlan interface used by the Scheme Matching Agent (Phase 4)
 * to provide patients with concrete next steps for unclaimed schemes.
 */

/** Structured action plan for a single unclaimed scheme */
export interface ActionPlan {
  /** Where the patient should go (office, website, clinic) */
  where_to_go: string

  /** Documents/items the patient should bring */
  what_to_bring: string[]

  /** Exact phrase the patient can say (literal, quotable) */
  what_to_say: string

  /** Contact information (hotline, email, website) */
  contact: string

  /** Indicative processing time (never a guarantee) */
  estimated_processing_time: string
}

/** Disclaimer shown on every action plan card */
export const DISCLAIMER =
  'This is guidance only. Always consult a Medical Social Worker before taking action.'
