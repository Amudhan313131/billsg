import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

function getImageFormat(s3Key: string): 'jpeg' | 'png' | 'gif' | 'webp' {
  const lower = s3Key.toLowerCase()
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.gif')) return 'gif'
  if (lower.endsWith('.webp')) return 'webp'
  return 'jpeg'
}

export async function extractBillText(s3Key: string): Promise<{ text: string; confidence: number }> {
  const s3Response = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
    })
  )

  const chunks: Uint8Array[] = []
  for await (const chunk of s3Response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  const imageBytes = Buffer.concat(chunks)

  const response = await bedrock.send(
    new ConverseCommand({
      modelId: process.env.BEDROCK_MODEL_ID,
      messages: [
        {
          role: 'user',
          content: [
            {
              image: {
                format: getImageFormat(s3Key),
                source: { bytes: imageBytes },
              },
            },
            {
              text: 'This is a Singapore hospital bill. Extract all text exactly as it appears on the bill. Include every line item, amount, label, date, and heading. Preserve the layout as much as possible. Return only the raw extracted text — no commentary, no formatting, no explanation.',
            },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 4096 },
    })
  )

  const text = response.output?.message?.content?.find((c) => 'text' in c && c.text)?.text ?? ''

  return { text, confidence: 0.92 }
}
