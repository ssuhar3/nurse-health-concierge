const PDFDocument = require('pdfkit');

const NAVY = '#0B1D3A';
const GOLD = '#C9A54E';
const GRAY = '#555555';

/**
 * Generate a branded read-only PDF summary for a client onboarding intake
 * @param {Object} data - Sanitized form data
 * @returns {Promise<Buffer>} PDF as a Buffer
 */
function generateOnboardingSummaryPdf(data) {
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

      doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
        .text('Senior Health Concierge', 60, 30, { width: pageWidth });

      doc.fontSize(14).font('Helvetica')
        .text('Client Onboarding Intake', 60, 58, { width: pageWidth });

      doc.moveTo(60, 85).lineTo(200, 85).lineWidth(3).strokeColor(GOLD).stroke();

      doc.fillColor('#CCCCCC').fontSize(9)
        .text(`Submitted: ${new Date(data.timestamp || Date.now()).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`, 60, 92, { width: pageWidth });

      doc.moveDown(3);

      // ── Helpers ────────────────────────────────────
      function sectionHeading(title) {
        const y = doc.y + 14;
        doc.moveTo(60, y).lineTo(60 + pageWidth, y).lineWidth(1).strokeColor(GOLD).stroke();
        doc.fillColor(NAVY).fontSize(13).font('Helvetica-Bold')
          .text(title, 60, y + 8, { width: pageWidth });
        doc.moveDown(0.5);
      }

      function fieldRow(label, value) {
        if (!value) return;
        const currentY = doc.y;
        doc.fillColor(GRAY).fontSize(9).font('Helvetica-Bold')
          .text(label, 60, currentY, { width: 180, continued: false });
        doc.fillColor('#222222').fontSize(10).font('Helvetica')
          .text(String(value), 240, currentY, { width: pageWidth - 180 });
        doc.moveDown(0.3);
      }

      function checkPageBreak() {
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }
      }

      // ── Client Information ────────────────────────
      sectionHeading('Client Information');
      fieldRow('Client Name', data.clientName);
      fieldRow('Date of Birth', data.dob);
      const address = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ');
      fieldRow('Address', address);
      fieldRow('Phone', data.phone);
      fieldRow('Email', data.email);

      // ── Primary Contact ───────────────────────────
      checkPageBreak();
      sectionHeading('Primary Contact');
      fieldRow('Name', data.primaryContactName);
      fieldRow('Relationship', data.primaryContactRelationship);
      fieldRow('Phone', data.primaryContactPhone);
      fieldRow('Email', data.primaryContactEmail);

      // ── Emergency Contact ─────────────────────────
      sectionHeading('Emergency Contact');
      fieldRow('Name', data.emergencyContactName);
      fieldRow('Phone', data.emergencyContactPhone);

      // ── Medical Information ───────────────────────
      checkPageBreak();
      sectionHeading('Medical Information');
      fieldRow('Primary Care Physician', data.pcp);
      fieldRow('Specialists', data.specialists);
      fieldRow('Medical Conditions', data.medicalConditions);
      fieldRow('Current Medications', data.medications);
      fieldRow('Allergies', data.allergies);
      fieldRow('Hospital Preference', data.hospitalPreference);

      // ── Insurance ─────────────────────────────────
      checkPageBreak();
      sectionHeading('Insurance Information');
      fieldRow('Medicare / Medicaid', data.medicareMedicaid);
      fieldRow('Supplemental Insurance', data.supplementalInsurance);
      fieldRow('Pharmacy', data.pharmacy);

      // ── Care Needs ────────────────────────────────
      checkPageBreak();
      sectionHeading('Care Needs');
      fieldRow('Selected Services', data.careNeeds);

      // ── Care Goals ────────────────────────────────
      if (data.goalConcerns || data.goalIndependence || data.goalChallenges) {
        checkPageBreak();
        sectionHeading('Care Goals');
        fieldRow('Health Concerns', data.goalConcerns);
        fieldRow('Independence Goals', data.goalIndependence);
        fieldRow('Healthcare Challenges', data.goalChallenges);
      }

      // ── Footer ────────────────────────────────────
      doc.moveDown(3);
      doc.moveTo(60, doc.y).lineTo(60 + pageWidth, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
      doc.moveDown(0.5);
      doc.fillColor(GRAY).fontSize(8).font('Helvetica')
        .text('Senior Health Concierge \u2014 Confidential Client Intake', 60, doc.y, {
          width: pageWidth, align: 'center',
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateOnboardingSummaryPdf };
