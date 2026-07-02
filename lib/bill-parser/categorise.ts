import { LineItem, LineItemCategory } from './types';

const CATEGORY_KEYWORDS: { keywords: string[]; category: LineItemCategory }[] = [
  { keywords: ['ward', 'bed', 'accommodation'], category: 'ward_charges' },
  { keywords: ['surgery', 'operation', 'procedure', 'table'], category: 'surgical_fees' },
  { keywords: ['medication', 'drug', 'pharmacy', 'medicine'], category: 'medication' },
  { keywords: ['consultation', 'visit', 'attendance'], category: 'consultation' },
  { keywords: ['lab', 'test', 'scan', 'x-ray', 'mri', 'ct'], category: 'investigations' },
  { keywords: ['implant', 'prosthesis', 'device'], category: 'implants' },
  { keywords: ['subsidy', 'government'], category: 'government_subsidy' },
  { keywords: ['medishield', 'msl', 'mshl'], category: 'medishield_deduction' },
  { keywords: ['medisave', 'msv', 'cpf'], category: 'medisave_withdrawal' },
  { keywords: ['pioneer', 'pg', 'merdeka', 'mg'], category: 'pioneer_merdeka_discount' },
  { keywords: ['medifund', 'maf', 'assistance'], category: 'other_deduction' },
];

function matchCategory(description: string): LineItemCategory {
  const lower = description.toLowerCase();
  for (const { keywords, category } of CATEGORY_KEYWORDS) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'miscellaneous';
}

function extractAmount(text: string): number {
  const match = text.match(/\(?-?\s*\$?[\d,]+\.?\d{0,2}\)?/);
  if (!match) return 0;
  const cleaned = match[0].replace(/[()$,\-\s]/g, '');
  return parseFloat(cleaned) || 0;
}

function isDeduction(text: string, amount: number): boolean {
  // Check if the line contains a minus sign before the amount e.g. "-1234.00"
  const minusMatch = text.match(/-\s*\$?[\d,]+\.?\d{0,2}/);
  if (minusMatch) return true;
  // Check if the amount is wrapped in brackets e.g. (1234.00)
  const bracketMatch = text.match(/\([\$\s]*[\d,]+\.?\d{0,2}\s*\)/);
  return bracketMatch !== null;
}

export function categoriseLineItems(rawText: string): LineItem[] {
  const lines = rawText.split('\n').filter((line) => line.trim().length > 0);
  const items: LineItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line contains an amount
    const amountMatch = line.match(/\(?(\$?[\d,]+\.?\d{0,2})\)?/);
    if (!amountMatch) continue;

    const amount = extractAmount(line);
    if (amount === 0) continue;

    const category = matchCategory(line);
    const deduction = isDeduction(line, amount);

    // Remove the amount portion to get description
    const description = line
      .replace(/\(?(\$?[\d,]+\.?\d{0,2})\)?/, '')
      .trim()
      .replace(/[\s-]+$/, '')
      .trim();

    if (!description) continue;

    items.push({
      id: `item-${i}`,
      category,
      description,
      amount: deduction ? -Math.abs(amount) : amount,
      plain_english: '',
      is_deduction: deduction,
    });
  }

  return items;
}
