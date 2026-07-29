const { google } = require('googleapis');
const { Readable } = require('stream');
const { getAuth } = require('./auth');

let driveClient = null;

/**
 * Get authenticated Google Drive client (cached)
 */
async function getClient() {
  if (driveClient) return driveClient;

  const auth = await getAuth();
  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

/**
 * Upload a PDF buffer into a Google Drive folder.
 * The service account must have Editor access to the folder.
 * Files stay private to the folder's members (no public link sharing).
 * @param {string} folderId - Destination Drive folder ID
 * @param {string} fileName - Name for the file in Drive
 * @param {Buffer} pdfBuffer - PDF content as a Buffer
 * @returns {{ fileId: string, webViewLink: string }}
 */
async function uploadPdfToDrive(folderId, fileName, pdfBuffer) {
  const drive = await getClient();

  const file = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: Readable.from(pdfBuffer),
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true,
  });

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink,
  };
}

module.exports = { uploadPdfToDrive };
