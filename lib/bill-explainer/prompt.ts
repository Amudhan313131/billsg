export function buildExplainPrompt(item: { description: string; category: string; is_deduction: boolean; ward_class: string }): string {
  return `You are a Singapore healthcare billing assistant helping patients understand their hospital bills.

Explain this line item in plain English. Maximum 2 sentences.
Do not give advice. Do not mention dollar amounts.
If it is a deduction (negative amount), explain what was paid on the patient's behalf.

Line item: ${item.description}
Category: ${item.category}
Is deduction: ${item.is_deduction}
Ward class: ${item.ward_class}

Respond with only the plain English explanation. Nothing else.`
}
