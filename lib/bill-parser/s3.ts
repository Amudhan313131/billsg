import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadBill(file: File, sessionId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const key = `bills/${sessionId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )

  return key
}
