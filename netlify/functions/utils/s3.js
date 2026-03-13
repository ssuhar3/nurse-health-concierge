const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let s3Client = null;

/**
 * Get S3 client (cached)
 */
function getClient() {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION || process.env.S3_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });

  return s3Client;
}

/**
 * Upload a PDF to S3 with server-side encryption
 * @param {string} fileName - Object key (file name) in S3
 * @param {Buffer} pdfBuffer - PDF content
 * @param {Object} [metadata] - Optional metadata tags
 * @returns {{ key: string, url: string }} Presigned URL valid for 7 days
 */
async function uploadPdf(fileName, pdfBuffer, metadata = {}) {
  const client = getClient();
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;

  // Upload with AES-256 encryption
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
    ServerSideEncryption: 'AES256',
    Metadata: metadata,
  }));

  // Generate a presigned URL (valid for 7 days)
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: fileName }),
    { expiresIn: 7 * 24 * 60 * 60 } // 7 days in seconds
  );

  return { key: fileName, url };
}

/**
 * Get a presigned download URL for an existing file
 * @param {string} key - S3 object key
 * @param {number} [expiresIn=604800] - Seconds until URL expires (default 7 days)
 * @returns {string} Presigned URL
 */
async function getPresignedUrl(key, expiresIn = 7 * 24 * 60 * 60) {
  const client = getClient();
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}

module.exports = { uploadPdf, getPresignedUrl };
