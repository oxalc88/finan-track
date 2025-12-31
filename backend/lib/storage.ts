/**
 * Cloud-agnostic storage library
 * Supports AWS S3, Cloudflare R2, MinIO, and any S3-compatible storage
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getConfig } from '../config/env.js';

let s3Client: S3Client;

/**
 * Initialize the S3 client
 */
export function initStorage(): S3Client {
  if (s3Client) {
    return s3Client;
  }

  const config = getConfig();

  s3Client = new S3Client({
    region: config.storage.region,
    endpoint: config.storage.endpoint,
    credentials: {
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
    },
    forcePathStyle: config.storage.forcePathStyle,
  });

  return s3Client;
}

/**
 * Get the S3 client instance
 */
function getClient(): S3Client {
  if (!s3Client) {
    initStorage();
  }
  return s3Client;
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
  }
): Promise<string> {
  const config = getConfig();
  const client = getClient();

  const command = new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
    Body: buffer,
    ContentType: options?.contentType,
    Metadata: options?.metadata,
  });

  await client.send(command);

  // Return the file key (can be used to construct URL)
  return key;
}

/**
 * Download a file from storage
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const config = getConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getConfig();
  const client = getClient();

  const command = new DeleteObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Generate a storage key for an invoice file
 */
export function generateInvoiceKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `invoices/${userId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Get the public URL for a file (if storage is publicly accessible)
 * Note: This assumes the bucket is configured for public read access
 * For private buckets, you would generate a signed URL instead
 */
export function getFileUrl(key: string): string {
  const config = getConfig();

  if (config.storage.endpoint) {
    // For MinIO or custom S3-compatible services
    const endpoint = config.storage.endpoint.replace(/\/$/, '');
    return `${endpoint}/${config.storage.bucket}/${key}`;
  }

  // For AWS S3
  return `https://${config.storage.bucket}.s3.${config.storage.region}.amazonaws.com/${key}`;
}
