import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getS3Config, getS3KeyPrefix } from './env.server'

let client: S3Client | null = null

function getClient(): S3Client {
  const config = getS3Config()
  if (!config) {
    throw new Error('S3 is not configured')
  }
  if (!client) {
    client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      // Virtual-hosted URLs match Scaleway CORS (bucket.s3.region.scw.cloud).
      forcePathStyle: false,
      // Avoid x-amz-checksum-* on presigned PUTs — browsers can't send them →
      // S3 403 without CORS headers, which looks like a CORS failure.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    })
  }
  return client
}

export function isS3Configured(): boolean {
  return getS3Config() != null
}

export async function createPresignedPutUrl(options: {
  objectKey: string
  contentType: string
  expiresInSeconds?: number
}): Promise<string> {
  const config = getS3Config()
  if (!config) throw new Error('S3 is not configured')
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: options.objectKey,
    ContentType: options.contentType,
  })
  return getSignedUrl(getClient(), command, {
    expiresIn: options.expiresInSeconds ?? 60 * 15,
  })
}

export async function createPresignedGetUrl(options: {
  objectKey: string
  expiresInSeconds?: number
}): Promise<string> {
  const config = getS3Config()
  if (!config) throw new Error('S3 is not configured')
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: options.objectKey,
  })
  return getSignedUrl(getClient(), command, {
    expiresIn: options.expiresInSeconds ?? 60 * 60,
  })
}

export async function headObject(objectKey: string): Promise<{
  contentLength?: number
  contentType?: string
} | null> {
  const config = getS3Config()
  if (!config) throw new Error('S3 is not configured')
  try {
    const result = await getClient().send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
      }),
    )
    return {
      contentLength: result.ContentLength,
      contentType: result.ContentType,
    }
  } catch {
    return null
  }
}

/** Delete every object under `{prefix}/{userId}/` (account purge for this env). */
export async function deleteAllObjectsForUser(userId: string): Promise<void> {
  const config = getS3Config()
  if (!config) return

  const prefix = `${getS3KeyPrefix()}/${userId}/`
  let continuationToken: string | undefined

  do {
    const listed = await getClient().send(
      new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    )
    const keys = (listed.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key))

    if (keys.length > 0) {
      await getClient().send(
        new DeleteObjectsCommand({
          Bucket: config.bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      )
    }
    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)
}

export async function deleteObjectsByKeys(keys: string[]): Promise<void> {
  const config = getS3Config()
  if (!config || keys.length === 0) return

  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000)
    await getClient().send(
      new DeleteObjectsCommand({
        Bucket: config.bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    )
  }
}
