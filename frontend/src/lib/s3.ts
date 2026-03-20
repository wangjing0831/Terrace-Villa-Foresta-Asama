import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const BUCKET  = process.env.S3_BUCKET  || 'terrace-villa-foresta-asama-prod';
const CDN     = process.env.CDN_DOMAIN  || 'd143jkdkye8i79.cloudfront.net';

const client = new S3Client({ region: REGION });

export function s3Url(key: string): string {
  return `https://${CDN}/${key}`;
}

export async function putS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }),
  );
  return s3Url(key);
}

export async function deleteS3(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
