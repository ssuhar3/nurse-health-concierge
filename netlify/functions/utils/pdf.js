const PDFDocument = require('pdfkit');

const NAVY = '#0B1D3A';
const GOLD = '#C9A54E';
const GRAY = '#555555';

/**
 * Generate a branded PDF for a Health Advocate application
 * @param {Object} data - Sanitized form data
 * @returns {Promise<Buffer>} PDF as a Buffer
 */
function generateApplicationPdf(data) {
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
      doc
        .rect(0, 0, doc.page.width, 110)
        .fill(NAVY);

      doc
        .fillColor('#FFFFFF')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Nurse Health Concierge', 60, 30, { width: pageWidth });

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Health Advocate Application', 60, 58, { width: pageWidth });

      // Gold accent line
      doc
        .moveTo(60, 85)
        .lineTo(200, 85)
        .lineWidth(3)
        .strokeColor(GOLD)
        .stroke();

      doc
        .fillColor('#CCCCCC')
        .fontSize(9)
        .text(`Submitted: ${new Date(data.timestamp || Date.now()).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`, 60, 92, { width: pageWidth });

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

      // ── Applicant Information ───────────────────────
      sectionHeading('Applicant Information');
      fieldRow('Full Name', data.fullName);
      fieldRow('Email', data.email);
      fieldRow('Phone', data.phone);

      const address = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');
      fieldRow('Address', address);

      // ── Professional Title ──────────────────────────
      sectionHeading('Professional Title');
      fieldRow('Title', data.profTitle);

      // ── Availability ────────────────────────────────
      sectionHeading('Availability');
      fieldRow('Employment Type', data.empType);
      fieldRow('Geographic Areas', data.geoAreas);
      fieldRow('Earliest Start Date', data.startDate);

      // ── Footer ──────────────────────────────────────
      doc.moveDown(3);
      doc
        .moveTo(60, doc.y)
        .lineTo(60 + pageWidth, doc.y)
        .lineWidth(0.5)
        .strokeColor('#CCCCCC')
        .stroke();

      doc.moveDown(0.5);
      doc
        .fillColor(GRAY)
        .fontSize(8)
        .font('Helvetica')
        .text('Nurse Health Concierge — Confidential Application', 60, doc.y, {
          width: pageWidth,
          align: 'center',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateApplicationPdf };
