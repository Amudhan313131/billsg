import { LineItem, ParsedBill } from './types';

interface ValidateParams {
  hospital_name: string;
  bill_reference: string;
  admission_date: string;
  discharge_date: string;
  ward_class: string;
  line_items: LineItem[];
  parsed_at: string;
  confidence_score: number;
}

export function validateAndAssemble(params: ValidateParams): { bill: ParsedBill; warnings: string[] } {
  const warnings: string[] = [];
  const { hospital_name, bill_reference, admission_date, discharge_date, ward_class, line_items, parsed_at, confidence_score } = params;

  // Calculate subtotal from non-deduction items
  const subtotal_before_subsidies = line_items
    .filter((item) => !item.is_deduction)
    .reduce((sum, item) => sum + item.amount, 0);

  // Calculate deductions by category
  const government_subsidy = Math.abs(
    line_items
      .filter((item) => item.category === 'government_subsidy' && item.is_deduction)
      .reduce((sum, item) => sum + item.amount, 0)
  );

  const medishield_deduction = Math.abs(
    line_items
      .filter((item) => item.category === 'medishield_deduction' && item.is_deduction)
      .reduce((sum, item) => sum + item.amount, 0)
  );

  const medisave_withdrawal = Math.abs(
    line_items
      .filter((item) => item.category === 'medisave_withdrawal' && item.is_deduction)
      .reduce((sum, item) => sum + item.amount, 0)
  );

  // Other deductions: all remaining deduction items not in the above categories
  const other_deductions = Math.abs(
    line_items
      .filter(
        (item) =>
          item.is_deduction &&
          item.category !== 'government_subsidy' &&
          item.category !== 'medishield_deduction' &&
          item.category !== 'medisave_withdrawal'
      )
      .reduce((sum, item) => sum + item.amount, 0)
  );

  const total_deductions = government_subsidy + medishield_deduction + medisave_withdrawal + other_deductions;
  const final_payable = subtotal_before_subsidies - total_deductions;

  // Warnings
  if (line_items.length === 0) {
    warnings.push('Could not read bill. Please ensure the bill is flat and well-lit.');
  }

  if (ward_class === 'unknown') {
    warnings.push('Ward class could not be detected. Some results may be less accurate.');
  }

  const bill: ParsedBill = {
    hospital_name,
    bill_reference,
    admission_date,
    discharge_date,
    ward_class: ward_class as ParsedBill['ward_class'],
    line_items: line_items.map((item) => ({ ...item, plain_english: '' })),
    subtotal_before_subsidies,
    government_subsidy,
    medishield_deduction,
    medisave_withdrawal,
    other_deductions,
    final_payable,
    currency: 'SGD',
    parsed_at,
    confidence_score,
  };

  return { bill, warnings };
}
