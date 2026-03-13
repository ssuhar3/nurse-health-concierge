const { getAuth } = require('./utils/auth');
const { google } = require('googleapis');

exports.handler = async () => {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const results = { folderId };

    // Try to access the folder
    try {
      const folder = await drive.files.get({ fileId: folderId, fields: 'id,name,mimeType' });
      results.folder = folder.data;
    } catch (err) {
      results.folderError = { message: err.message, code: err.code };
    }

    // List files visible to service account
    const res = await drive.files.list({ pageSize: 10, fields: 'files(id,name,mimeType)' });
    results.visibleFiles = res.data.files;

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
