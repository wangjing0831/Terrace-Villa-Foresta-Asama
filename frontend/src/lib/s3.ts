import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const REGION     = process.env.AWS_REGION   || 'ap-northeast-1';
const BUCKET     = process.env.S3_BUCKET    || 'terrace-villa-foresta-asama-prod';
const CDN        = process.env.CDN_DOMAIN   || 'd143jkdkye8i79.cloudfront.net';
// S3_KEY_PREFIX: "test/" for test env, "" for prod. Set as ECS env var.
const KEY_PREFIX = process.env.S3_KEY_PREFIX || '';

const client = new S3Client({ region: REGION });

export function s3Url(key: string): string {
  return `https://${CDN}/${key}`;
}

// Convert old direct S3 URLs (any bucket) to CloudFront URLs
export function normalizeUrl(url: string): string {
  if (!url) return url;
  const match = url.match(/^https?:\/\/[^/]+\.amazonaws\.com\/(uploads\/.+)$/);
  if (match) return `https://${CDN}/${match[1]}`;
  return url;
}

export async function putS3(
  key: string,
  body: Buffer,
  contentType: string,
  _isTest = false,
): Promise<string> {
  const finalKey = KEY_PREFIX + key;
  await client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: finalKey, Body: body, ContentType: contentType }),
  );
  return s3Url(finalKey);
}

export async function deleteS3(key: string, _isTest = false): Promise<void> {
  // key stored in DB already includes KEY_PREFIX (e.g. "test/uploads/...")
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
