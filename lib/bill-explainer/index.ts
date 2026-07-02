import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import type { ParsedBill } from '@/lib/bill-parser/types'
import { buildExplainPrompt } from './prompt'
import { shouldExplainItem } from './validate'

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function explainBill(bill: ParsedBill): Promise<ParsedBill> {
  for (const item of bill.line_items) {
    if (!shouldExplainItem(item, bill)) {
      item.plain_english = 'Could not explain this item. Please check your original bill.'
      continue
    }

    const prompt = buildExplainPrompt({
      description: item.description,
      category: item.category,
      is_deduction: item.is_deduction,
      ward_class: bill.ward_class,
    })

    try {
      const response = await bedrockClient.send(
        new ConverseCommand({
          modelId: process.env.BEDROCK_MODEL_ID,
          messages: [{ role: 'user', content: [{ text: prompt }] }],
          inferenceConfig: { maxTokens: 200 },
        })
      )
      const text = response.output?.message?.content?.find((c) => 'text' in c && c.text)?.text ?? ''
      item.plain_english = text.trim() || 'Could not explain this item. Please check your original bill.'
    } catch {
      item.plain_english = 'Could not explain this item. Please check your original bill.'
    }
  }

  return bill
}
