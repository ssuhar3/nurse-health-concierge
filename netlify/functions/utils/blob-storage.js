const { getStore } = require('@netlify/blobs');

const STORE_NAME = 'client-packets';

/**
 * Upload a PDF to Netlify Blobs
 * @param {string} fileName - Name/key for the file
 * @param {Buffer} pdfBuffer - PDF content as a Buffer
 * @returns {{ key: string, url: string }}
 */
async function uploadPdfToBlobs(fileName, pdfBuffer) {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });

  await store.set(fileName, pdfBuffer, {
    metadata: {
      contentType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
    },
  });

  // URL served by our get-pdf function
  const siteUrl = process.env.URL || '';
  const url = `${siteUrl}/.netlify/functions/get-pdf?key=${encodeURIComponent(fileName)}`;

  return { key: fileName, url };
}

/**
 * Retrieve a PDF from Netlify Blobs
 * @param {string} key - File key/name
 * @returns {Buffer|null}
 */
async function getPdfFromBlobs(key) {
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const data = await store.get(key, { type: 'arrayBuffer' });
  if (!data) return null;
  return Buffer.from(data);
}

module.exports = { uploadPdfToBlobs, getPdfFromBlobs };
