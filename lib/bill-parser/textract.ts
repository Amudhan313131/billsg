import {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from '@aws-sdk/client-textract'
import type { Block, GetDocumentTextDetectionCommandOutput } from '@aws-sdk/client-textract'

const textract = new TextractClient({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

function extractLinesFromBlocks(blocks: Block[]): { text: string; confidence: number } {
  const lines = blocks.filter((b) => b.BlockType === 'LINE')
  const text = lines.map((b) => b.Text ?? '').join('\n')
  const confidence =
    lines.length > 0
      ? lines.reduce((sum, b) => sum + (b.Confidence ?? 0), 0) / lines.length / 100
      : 0
  return { text, confidence }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function extractPdf(s3Key: string): Promise<{ text: string; confidence: number }> {
  const startResponse = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: {
        S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: s3Key },
      },
    })
  )

  const jobId = startResponse.JobId!
  let attempts = 0
  let allBlocks: Block[] = []

  while (attempts < 30) {
    await sleep(2000)
    attempts++

    let nextToken: string | undefined = undefined
    let firstRequest = true

    while (firstRequest || nextToken) {
      firstRequest = false
      const getResponse: GetDocumentTextDetectionCommandOutput = await textract.send(
        new GetDocumentTextDetectionCommand({
          JobId: jobId,
          ...(nextToken && { NextToken: nextToken }),
        })
      )

      if (getResponse.JobStatus === 'FAILED') {
        throw new Error('Textract PDF extraction failed')
      }

      if (getResponse.JobStatus === 'SUCCEEDED') {
        if (getResponse.Blocks) {
          allBlocks = allBlocks.concat(getResponse.Blocks)
        }
        nextToken = getResponse.NextToken
        if (!nextToken) {
          return extractLinesFromBlocks(allBlocks)
        }
      } else {
        break
      }
    }

    if (allBlocks.length > 0) {
      return extractLinesFromBlocks(allBlocks)
    }
  }

  throw new Error('Textract PDF extraction timed out')
}

async function extractImage(s3Key: string): Promise<{ text: string; confidence: number }> {
  const response = await textract.send(
    new DetectDocumentTextCommand({
      Document: {
        S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: s3Key },
      },
    })
  )

  return extractLinesFromBlocks(response.Blocks ?? [])
}

export async function extractBillText(s3Key: string): Promise<{ text: string; confidence: number }> {
  if (s3Key.toLowerCase().endsWith('.pdf')) {
    return extractPdf(s3Key)
  }
  return extractImage(s3Key)
}
