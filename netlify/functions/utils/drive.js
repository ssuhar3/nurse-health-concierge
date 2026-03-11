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
 * Upload a PDF buffer to a Google Drive folder
 * @param {string} fileName - Name for the file in Drive
 * @param {Buffer} pdfBuffer - PDF content as a Buffer
 * @returns {{ fileId: string, webViewLink: string }}
 */
async function uploadPdf(fileName, pdfBuffer) {
  const drive = await getClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Upload the file
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
  });

  // Make the file viewable by anyone with the link
  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: {
      type: 'anyone',
      role: 'reader',
    },
  });

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink,
  };
}

module.exports = { uploadPdf };
