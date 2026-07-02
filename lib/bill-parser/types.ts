export type LineItemCategory =
  | 'ward_charges'
  | 'surgical_fees'
  | 'medication'
  | 'consultation'
  | 'investigations'
  | 'implants'
  | 'government_subsidy'
  | 'medishield_deduction'
  | 'medisave_withdrawal'
  | 'pioneer_merdeka_discount'
  | 'other_deduction'
  | 'miscellaneous';

export interface LineItem {
  id: string;
  category: LineItemCategory;
  description: string;
  amount: number;
  plain_english: string;
  is_deduction: boolean;
}

export interface ParsedBill {
  hospital_name: string;
  bill_reference: string;
  admission_date: string;
  discharge_date: string;
  ward_class: 'A' | 'B1' | 'B2' | 'B2+' | 'C' | 'unknown';
  line_items: LineItem[];
  subtotal_before_subsidies: number;
  government_subsidy: number;
  medishield_deduction: number;
  medisave_withdrawal: number;
  other_deductions: number;
  final_payable: number;
  currency: 'SGD';
  parsed_at: string;
  confidence_score: number;
}
