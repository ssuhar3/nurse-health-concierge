const { getAuth } = require('./utils/auth');
const { google } = require('googleapis');

exports.handler = async () => {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const results = { folderId };

    // Check folder
    try {
      const folder = await drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,owners,permissions',
        supportsAllDrives: true,
      });
      results.folder = folder.data;
    } catch (err) {
      results.folderError = { message: err.message, code: err.code };
    }

    // Try to create a tiny test file
    try {
      const { Readable } = require('stream');
      const file = await drive.files.create({
        requestBody: {
          name: 'test-upload.txt',
          mimeType: 'text/plain',
          parents: [folderId],
        },
        media: {
          mimeType: 'text/plain',
          body: Readable.from(Buffer.from('test')),
        },
        fields: 'id,name',
        supportsAllDrives: true,
      });
      results.uploadSuccess = file.data;
      // Clean up test file
      await drive.files.delete({ fileId: file.data.id, supportsAllDrives: true });
      results.cleaned = true;
    } catch (err) {
      results.uploadError = { message: err.message, code: err.code };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(results, null, 2),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
