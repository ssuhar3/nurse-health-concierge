const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');

exports.handler = async () => {
  // Show which env vars are actually available
  const envCheck = {
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '(not set)',
    AWS_S3_REGION: process.env.AWS_S3_REGION || '(not set)',
    S3_BUCKET: process.env.S3_BUCKET || '(not set)',
    S3_REGION: process.env.S3_REGION || '(not set)',
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ? 'SET ✓' : '(not set)',
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ? 'SET ✓' : '(not set)',
  };

  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;
  const region = process.env.AWS_S3_REGION || process.env.S3_REGION || 'us-east-2';

  if (!bucket || !process.env.S3_ACCESS_KEY_ID) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing env vars', envCheck }, null, 2),
    };
  }

  try {
    const client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    // Test 1: List objects
    const listResult = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 5,
    }));

    // Test 2: Upload a tiny test file
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: 'test/hello.txt',
      Body: Buffer.from('S3 test at ' + new Date().toISOString()),
      ContentType: 'text/plain',
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        envCheck,
        bucket,
        region,
        existingObjects: listResult.KeyCount,
        keys: (listResult.Contents || []).map(o => o.Key),
        testUpload: 'SUCCESS — wrote test/hello.txt',
      }, null, 2),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        envCheck,
        bucket,
        region,
        error: err.message,
        code: err.name,
      }, null, 2),
    };
  }
};
