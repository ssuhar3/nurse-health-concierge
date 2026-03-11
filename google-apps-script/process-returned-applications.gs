/**
 * NHC — Auto-Process Returned Application Packets
 *
 * This Google Apps Script monitors Gmail for returned filled-out PDFs
 * from advocate applicants, saves them to Google Drive, and updates
 * the Google Sheet tracking spreadsheet.
 *
 * SETUP:
 * 1. Create a new Google Apps Script project at script.google.com
 * 2. Paste this code
 * 3. Set Script Properties (Project Settings > Script Properties):
 *    - DRIVE_FOLDER_ID: Your Google Drive folder ID
 *    - SHEET_ID: Your Google Sheet ID
 *    - ADMIN_EMAIL: nursehealthconcierge@gmail.com (for notifications)
 * 4. Authorize the script when prompted
 *
 * ON-DEMAND USAGE (no auto-trigger needed):
 *   - Run processReturnedApplications() manually from the Apps Script editor
 *   - Or use testRun() which adds logging around the main function
 *   - When ready to go live, you can optionally add a time-driven trigger
 *     (Triggers > Add Trigger > processReturnedApplications > Time-driven > Every 15 min)
 */

// ── Configuration ─────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    driveFolderId: props.getProperty('DRIVE_FOLDER_ID'),
    sheetId: props.getProperty('SHEET_ID'),
    adminEmail: props.getProperty('ADMIN_EMAIL') || 'nursehealthconcierge@gmail.com',
    sheetTabName: 'Advocate Applications',
    processedLabel: 'nhc-processed',
    searchQuery: 'has:attachment filename:pdf subject:"NHC Application" -label:nhc-processed',
  };
}

// ── Main Function (run on-demand or via optional trigger) ──
function processReturnedApplications() {
  const config = getConfig();

  if (!config.driveFolderId || !config.sheetId) {
    Logger.log('ERROR: Missing DRIVE_FOLDER_ID or SHEET_ID in script properties');
    return;
  }

  // Get or create the "processed" label
  var label = GmailApp.getUserLabelByName(config.processedLabel);
  if (!label) {
    label = GmailApp.createLabel(config.processedLabel);
  }

  // Search for unprocessed emails with PDF attachments
  var threads = GmailApp.search(config.searchQuery, 0, 20);

  if (threads.length === 0) {
    Logger.log('No new returned applications found.');
    return;
  }

  var folder = DriveApp.getFolderById(config.driveFolderId);
  var sheet = SpreadsheetApp.openById(config.sheetId).getSheetByName(config.sheetTabName);

  if (!sheet) {
    Logger.log('ERROR: Sheet tab "' + config.sheetTabName + '" not found');
    return;
  }

  var processed = 0;

  for (var t = 0; t < threads.length; t++) {
    try {
      var messages = threads[t].getMessages();
      var message = messages[messages.length - 1]; // Most recent message
      var senderEmail = extractEmail(message.getFrom());
      var attachments = message.getAttachments();

      // Find the PDF attachment
      var pdfAttachment = null;
      for (var a = 0; a < attachments.length; a++) {
        if (attachments[a].getContentType() === 'application/pdf' ||
            attachments[a].getName().toLowerCase().endsWith('.pdf')) {
          pdfAttachment = attachments[a];
          break;
        }
      }

      if (!pdfAttachment) {
        Logger.log('No PDF found in email from: ' + senderEmail);
        threads[t].addLabel(label); // Skip in future
        continue;
      }

      // Save PDF to Drive
      var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
      var safeName = senderEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
      var fileName = 'Completed_' + safeName + '_' + timestamp + '.pdf';

      var file = folder.createFile(pdfAttachment.copyBlob().setName(fileName));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var fileUrl = file.getUrl();

      // Find applicant's row in the sheet by email
      var updated = updateSheetRow(sheet, senderEmail, fileUrl, timestamp);

      // Label the thread as processed
      threads[t].addLabel(label);
      processed++;

      Logger.log('Processed application from: ' + senderEmail + ' -> ' + fileUrl);

      // Notify admin
      if (config.adminEmail) {
        var subject = 'Completed Application Received — ' + senderEmail;
        var body = 'A completed application packet has been received and processed.\n\n' +
                   'Applicant: ' + senderEmail + '\n' +
                   'PDF: ' + fileUrl + '\n' +
                   'Sheet updated: ' + (updated ? 'Yes' : 'No — email not found in sheet, please check manually');

        GmailApp.sendEmail(config.adminEmail, subject, body);
      }

    } catch (err) {
      Logger.log('Error processing thread: ' + err.message);
    }
  }

  Logger.log('Processed ' + processed + ' returned application(s).');
}

// ── Update the applicant's row in the sheet ───────────────
function updateSheetRow(sheet, email, completedPdfLink, timestamp) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  // Find column indices
  var emailCol = headers.indexOf('Email');
  var statusCol = headers.indexOf('Status');
  var completedLinkCol = headers.indexOf('Completed Packet Link');
  var receivedDateCol = headers.indexOf('Packet Received Date');

  if (emailCol === -1) {
    Logger.log('ERROR: "Email" column not found in sheet');
    return false;
  }

  // Search for the applicant's row (start from row 2, index 1)
  for (var i = 1; i < data.length; i++) {
    if (data[i][emailCol] && data[i][emailCol].toString().toLowerCase() === email.toLowerCase()) {
      var row = i + 1; // Sheet rows are 1-indexed

      // Update Status column
      if (statusCol !== -1) {
        sheet.getRange(row, statusCol + 1).setValue('Packet Received');
      }

      // Update Completed Packet Link
      if (completedLinkCol !== -1) {
        sheet.getRange(row, completedLinkCol + 1).setValue(completedPdfLink);
      }

      // Update Received Date
      if (receivedDateCol !== -1) {
        sheet.getRange(row, receivedDateCol + 1).setValue(timestamp);
      }

      Logger.log('Updated row ' + row + ' for: ' + email);
      return true;
    }
  }

  Logger.log('WARNING: No row found for email: ' + email);
  return false;
}

// ── Extract email address from "Name <email>" format ──────
function extractEmail(fromString) {
  var match = fromString.match(/<(.+?)>/);
  return match ? match[1].toLowerCase() : fromString.toLowerCase().trim();
}

// ── Manual test function ──────────────────────────────────
function testRun() {
  Logger.log('Starting manual test run...');
  processReturnedApplications();
  Logger.log('Test run complete. Check the Execution Log for details.');
}
