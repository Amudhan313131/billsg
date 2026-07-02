import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
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

    const command = new InvokeModelCommand({
      modelId: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-sonnet-4-6-20250731-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    try {
      const response = await bedrockClient.send(command)
      const result = JSON.parse(new TextDecoder().decode(response.body))
      item.plain_english = result.content[0].text.trim()
    } catch {
      item.plain_english = 'Could not explain this item. Please check your original bill.'
    }
  }

  return bill
}
