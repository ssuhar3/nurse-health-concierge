const PDFDocument = require('pdfkit');

const NAVY = '#0B1D3A';
const GOLD = '#C9A54E';
const GRAY = '#555555';

/**
 * Generate a branded PDF summary of a client consultation request
 * @param {Object} data - Sanitized form data
 * @param {string[]} healthNeeds - Selected health challenge labels
 * @param {string} timestamp - ISO timestamp of the submission
 * @returns {Promise<Buffer>} PDF as a Buffer
 */
function generateInquiryPdf(data, healthNeeds, timestamp) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // ── Header ──────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 110).fill(NAVY);

      doc
        .fillColor('#FFFFFF')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Legacy Senior Advocates', 60, 30, { width: pageWidth });

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Client Consultation Request', 60, 58, { width: pageWidth });

      doc
        .moveTo(60, 85)
        .lineTo(200, 85)
        .lineWidth(3)
        .strokeColor(GOLD)
        .stroke();

      doc
        .fillColor('#CCCCCC')
        .fontSize(9)
        .text(`Submitted: ${new Date(timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/New_York' })} ET`, 60, 92, { width: pageWidth });

      doc.moveDown(3);
      let y = 130;

      // ── Helper: Section heading ─────────────────────
      function sectionHeading(title) {
        y = doc.y + 14;
        doc
          .moveTo(60, y)
          .lineTo(60 + pageWidth, y)
          .lineWidth(1)
          .strokeColor(GOLD)
          .stroke();

        y += 8;
        doc
          .fillColor(NAVY)
          .fontSize(13)
          .font('Helvetica-Bold')
          .text(title, 60, y, { width: pageWidth });

        doc.moveDown(0.5);
      }

      // ── Helper: Field row ───────────────────────────
      function fieldRow(label, value) {
        if (!value) return;
        const currentY = doc.y;
        doc
          .fillColor(GRAY)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(label, 60, currentY, { width: 150, continued: false });

        doc
          .fillColor('#222222')
          .fontSize(10)
          .font('Helvetica')
          .text(String(value), 210, currentY, { width: pageWidth - 150 });

        doc.moveDown(0.3);
      }

      // ── Helper: Paragraph block ─────────────────────
      function paragraph(text) {
        if (!text) return;
        doc
          .fillColor('#222222')
          .fontSize(10)
          .font('Helvetica')
          .text(String(text), 60, doc.y, { width: pageWidth });
        doc.moveDown(0.3);
      }

      // ── Contact Information ─────────────────────────
      sectionHeading('Contact Information');
      fieldRow('Name', data.contactName);
      fieldRow('Relationship to Senior', data.relationship);
      fieldRow('Phone', data.phone);
      fieldRow('Email', data.email);
      fieldRow('Preferred Contact', data.contactMethod);
      fieldRow('Preferred Time', data.contactTime);

      // ── About the Senior ────────────────────────────
      sectionHeading('About the Senior');
      fieldRow('Senior Name', data.seniorName);
      fieldRow('Age Range', data.ageRange);
      fieldRow('Area', data.seniorLocation);
      fieldRow('Living Situation', data.livingSituation);

      // ── Health Situation ────────────────────────────
      if (healthNeeds && healthNeeds.length) {
        sectionHeading('Health Situation');
        fieldRow('Challenges', healthNeeds.join(', '));
      }

      // ── Their Story ─────────────────────────────────
      if (data.story) {
        sectionHeading('Their Story');
        paragraph(data.story);
      }

      // ── Additional ──────────────────────────────────
      sectionHeading('Additional');
      fieldRow('Referral Source', data.referralSource);
      fieldRow('Timeframe', data.timeframe);

      // ── Footer ──────────────────────────────────────
      doc.moveDown(3);
      doc
        .moveTo(60, doc.y)
        .lineTo(60 + pageWidth, doc.y)
        .lineWidth(1)
        .strokeColor(GOLD)
        .stroke();
      doc.moveDown(0.5);
      doc
        .fillColor(GRAY)
        .fontSize(8)
        .text('Legacy Senior Advocates | Confidential', 60, doc.y, { width: pageWidth });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInquiryPdf };
