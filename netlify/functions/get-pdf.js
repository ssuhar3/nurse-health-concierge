const { getPdfFromBlobs } = require('./utils/blob-storage');

exports.handler = async (event) => {
  const key = event.queryStringParameters?.key;

  if (!key) {
    return { statusCode: 400, body: 'Missing key parameter' };
  }

  try {
    const pdfBuffer = await getPdfFromBlobs(key);

    if (!pdfBuffer) {
      return { statusCode: 404, body: 'PDF not found' };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${key}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
      body: pdfBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('get-pdf error:', err);
    return { statusCode: 500, body: 'Error retrieving PDF' };
  }
};
