import { ParsedBill } from './types';
import { categoriseLineItems } from './categorise';
import { detectWardClass } from './ward-class';
import { validateAndAssemble } from './validate';

export function parseBill(
  rawText: string,
  sessionId: string,
  confidence_score: number
): { bill: ParsedBill; warnings: string[] } {
  // Step 1: Extract and categorise line items
  const line_items = categoriseLineItems(rawText);

  // Step 2: Detect ward class
  const ward_class = detectWardClass(rawText);

  // Step 3: Assemble and validate
  const { bill, warnings } = validateAndAssemble({
    hospital_name: '',
    bill_reference: sessionId,
    admission_date: '',
    discharge_date: '',
    ward_class,
    line_items,
    parsed_at: new Date().toISOString(),
    confidence_score,
  });

  // Additional confidence warning
  if (confidence_score < 0.5) {
    warnings.push('Bill image may be unclear. Results may be inaccurate.');
  }

  return { bill, warnings };
}

export { parseBill as default };
export type { ParsedBill, LineItem, LineItemCategory } from './types';
