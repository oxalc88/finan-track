import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function createR2Client(): S3Client {
	const accountId = process.env.R2_ACCOUNT_ID;
	if (!accountId) {
		throw new Error("R2_ACCOUNT_ID environment variable is not set");
	}

	return new S3Client({
		endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
		region: "auto",
		credentials: {
			accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
			secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
		},
	});
}

export function generateR2Key(
	date: Date,
	documentId: string,
	extension: string
): string {
	const year = date.getUTCFullYear().toString();
	const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
	return `${year}/${month}/doc_${documentId}.${extension}`;
}

export async function uploadToR2(
	client: S3Client,
	key: string,
	body: Buffer | Uint8Array,
	contentType: string
): Promise<void> {
	const bucket = process.env.R2_BUCKET_NAME;
	if (!bucket) {
		throw new Error("R2_BUCKET_NAME environment variable is not set");
	}

	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: contentType,
		})
	);
}

export async function deleteFromR2(
	client: S3Client,
	key: string
): Promise<void> {
	const bucket = process.env.R2_BUCKET_NAME;
	if (!bucket) {
		throw new Error("R2_BUCKET_NAME environment variable is not set");
	}

	await client.send(
		new DeleteObjectCommand({
			Bucket: bucket,
			Key: key,
		})
	);
}

export async function generatePresignedUrl(
	client: S3Client,
	key: string,
	expiresInSeconds = 3600
): Promise<string> {
	const bucket = process.env.R2_BUCKET_NAME;
	if (!bucket) {
		throw new Error("R2_BUCKET_NAME environment variable is not set");
	}

	return await getSignedUrl(
		client,
		new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		}),
		{ expiresIn: expiresInSeconds }
	);
}
