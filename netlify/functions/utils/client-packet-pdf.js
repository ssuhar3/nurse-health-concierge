const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Brand colors (RGB 0-1 scale)
const NAVY  = rgb(11/255, 29/255, 58/255);
const GOLD  = rgb(201/255, 165/255, 78/255);
const GRAY  = rgb(85/255, 85/255, 85/255);
const LIGHT = rgb(247/255, 245/255, 241/255);
const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0, 0, 0);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOTAL_PAGES = 5;

/**
 * Generate a fillable 5-page client onboarding agreement packet
 * Forms: HIPAA Authorization, Service Agreement, Payment Authorization,
 *        Emergency Protocol, Family Communication Authorization
 * @param {Object} data - Client data from web intake form
 * @returns {Promise<Buffer>} PDF as Buffer
 */
async function generateClientPacket(data) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const form = doc.getForm();

  const ctx = { doc, font, fontBold, fontItalic, form, data };

  buildPage1_HIPAA(ctx);
  buildPage2_ServiceAgreement(ctx);
  buildPage3_PaymentAuth(ctx);
  buildPage4_EmergencyProtocol(ctx);
  buildPage5_FamilyCommunication(ctx);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

/* ─── HELPERS ──────────────────────────────────────────── */

function addPage(ctx) {
  return ctx.doc.addPage([PAGE_W, PAGE_H]);
}

function drawHeader(page, ctx, title, subtitle) {
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: NAVY });
  page.drawText('Nurse Health Concierge', {
    x: MARGIN, y: PAGE_H - 32, size: 16, font: ctx.fontBold, color: WHITE,
  });
  page.drawText(title, {
    x: MARGIN, y: PAGE_H - 52, size: 11, font: ctx.font, color: rgb(0.8, 0.8, 0.8),
  });
  page.drawRectangle({ x: MARGIN, y: PAGE_H - 68, width: 120, height: 2.5, color: GOLD });
  if (subtitle) {
    page.drawText(subtitle, {
      x: MARGIN, y: PAGE_H - 78, size: 8, font: ctx.fontItalic, color: rgb(0.65, 0.65, 0.65),
    });
  }
}

function drawSectionTitle(page, ctx, y, title) {
  page.drawRectangle({ x: MARGIN, y: y - 1, width: CONTENT_W, height: 1, color: GOLD });
  page.drawText(title, {
    x: MARGIN, y: y + 5, size: 13, font: ctx.fontBold, color: NAVY,
  });
  return y - 22;
}

function drawLabel(page, ctx, x, y, text) {
  page.drawText(text, { x, y, size: 8, font: ctx.fontBold, color: GRAY });
  return y - 14;
}

function addTextField(ctx, page, name, x, y, w, h, value, readOnly) {
  const field = ctx.form.createTextField(name);
  field.addToPage(page, { x, y: y - h, width: w, height: h, borderWidth: 0.5 });
  if (value) field.setText(value);
  if (readOnly) field.enableReadOnly();
  field.setFontSize(10);
  return y - h - 6;
}

function addMultiLineField(ctx, page, name, x, y, w, h, value) {
  const field = ctx.form.createTextField(name);
  field.enableMultiline();
  field.addToPage(page, { x, y: y - h, width: w, height: h, borderWidth: 0.5 });
  if (value) field.setText(value);
  field.setFontSize(9);
  return y - h - 6;
}

function drawFooter(page, ctx, pageNum) {
  page.drawText(`Page ${pageNum} of ${TOTAL_PAGES}  |  Nurse Health Concierge  |  Confidential`, {
    x: MARGIN, y: 25, size: 7, font: ctx.fontItalic, color: GRAY,
  });
}

function drawLegalText(page, ctx, y, text) {
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { y -= 8; continue; }
    page.drawText(trimmed, {
      x: MARGIN, y, size: 8.5, font: ctx.font, color: BLACK,
      maxWidth: CONTENT_W, lineHeight: 12,
    });
    const lineCount = Math.ceil(ctx.font.widthOfTextAtSize(trimmed, 8.5) / CONTENT_W);
    y -= (12 * Math.max(lineCount, 1) + 2);
  }
  return y;
}

function drawClientInfoBox(page, ctx, y) {
  const d = ctx.data;
  page.drawRectangle({ x: MARGIN, y: y - 80, width: CONTENT_W, height: 80, color: LIGHT, borderWidth: 0.5, borderColor: GOLD });
  page.drawText('Client Information (from intake form)', {
    x: MARGIN + 10, y: y - 16, size: 9, font: ctx.fontBold, color: NAVY,
  });

  const leftCol = MARGIN + 10;
  const rightCol = MARGIN + CONTENT_W / 2 + 10;
  let infoY = y - 34;

  page.drawText(`Name: ${d.clientName || ''}`, { x: leftCol, y: infoY, size: 9, font: ctx.font, color: BLACK });
  page.drawText(`DOB: ${d.dob || ''}`, { x: rightCol, y: infoY, size: 9, font: ctx.font, color: BLACK });
  infoY -= 16;
  const addr = [d.address, d.city, d.state, d.zip].filter(Boolean).join(', ');
  page.drawText(`Address: ${addr}`, { x: leftCol, y: infoY, size: 9, font: ctx.font, color: BLACK });
  infoY -= 16;
  page.drawText(`Phone: ${d.phone || ''}`, { x: leftCol, y: infoY, size: 9, font: ctx.font, color: BLACK });
  page.drawText(`Email: ${d.email || ''}`, { x: rightCol, y: infoY, size: 9, font: ctx.font, color: BLACK });

  return y - 95;
}

function drawSignatureBlock(page, ctx, y, prefix) {
  const halfW = (CONTENT_W - 36) / 2;
  page.drawRectangle({ x: MARGIN, y: y - 100, width: CONTENT_W, height: 100, color: LIGHT, borderWidth: 0.5, borderColor: GOLD });
  y -= 10;

  y = drawLabel(page, ctx, MARGIN + 10, y, 'Printed Name');
  y = addTextField(ctx, page, `${prefix}_printedName`, MARGIN + 10, y, halfW, 22, ctx.data.clientName || '', true);

  const sigY = y;
  y = drawLabel(page, ctx, MARGIN + 10, y, 'Signature (type your full name)');
  y = addTextField(ctx, page, `${prefix}_signature`, MARGIN + 10, y, halfW, 22);
  drawLabel(page, ctx, MARGIN + halfW + 26, sigY, 'Date');
  addTextField(ctx, page, `${prefix}_date`, MARGIN + halfW + 26, sigY - 14, 180, 22);

  return y;
}

/* ─── PAGE 1: HIPAA AUTHORIZATION ─────────────────────── */

function buildPage1_HIPAA(ctx) {
  const page = addPage(ctx);
  drawHeader(page, ctx, 'HIPAA Authorization', 'Form 2 \u2014 Client Onboarding Packet');

  let y = PAGE_H - 100;

  y = drawClientInfoBox(page, ctx, y);

  y = drawSectionTitle(page, ctx, y, 'Authorization to Use and Disclose Health Information');

  y = drawLegalText(page, ctx, y, `I hereby authorize Nurse Health Concierge and its assigned Health Advocate to access and discuss my medical information with healthcare providers for the purpose of coordinating my care. This authorization includes:

  \u2022  Speaking with my physicians and healthcare providers on my behalf
  \u2022  Accessing my medical records as needed for care coordination
  \u2022  Communicating with my insurance providers regarding coverage and claims
  \u2022  Sharing relevant health information with my designated family contacts
  \u2022  Coordinating care between multiple healthcare providers

This authorization is voluntary. I understand that I may revoke this authorization at any time by providing written notice to Nurse Health Concierge. Revocation will not affect actions already taken in reliance on this authorization.

This authorization expires one (1) year from the date of signature and may be renewed. I understand that information disclosed under this authorization may be subject to re-disclosure and no longer protected by HIPAA.

I understand that Nurse Health Concierge will not condition my treatment or services on whether I sign this authorization.`);

  y -= 20;
  drawSignatureBlock(page, ctx, y, 'f2');

  drawFooter(page, ctx, 1);
}

/* ─── PAGE 2: CLIENT SERVICE AGREEMENT ────────────────── */

function buildPage2_ServiceAgreement(ctx) {
  const page = addPage(ctx);
  drawHeader(page, ctx, 'Client Service Agreement', 'Form 3 \u2014 Client Onboarding Packet');

  let y = PAGE_H - 100;

  y = drawSectionTitle(page, ctx, y, 'Services Provided');

  const sections = [
    ['Services Included', 'Nurse Health Concierge provides the following health advocacy and coordination services:\n\n  \u2022  Medical appointment accompaniment and advocacy\n  \u2022  Hospital advocacy and discharge planning support\n  \u2022  Medication coordination and oversight\n  \u2022  Care coordination between multiple providers\n  \u2022  Insurance and Medicare/Medicaid navigation\n  \u2022  Family communication and health status updates\n  \u2022  Wellness monitoring and check-ins'],
    ['Services NOT Provided', 'Nurse Health Concierge does NOT provide:\n\n  \u2022  Medical diagnosis or treatment\n  \u2022  Prescribing or administering medication\n  \u2022  Home health aide or personal care services\n  \u2022  Transportation services\n  \u2022  Legal or financial advice'],
    ['Fees & Payment', 'Fee schedule and payment terms will be discussed and agreed upon during your initial consultation. A separate Payment Authorization form (Form 4) is included in this packet.'],
    ['Termination', 'Either party may terminate this agreement with fourteen (14) days written notice. In cases of emergency or safety concerns, Nurse Health Concierge reserves the right to discontinue services immediately. Upon termination, NHC will provide reasonable assistance with care transition.'],
  ];

  for (const [title, text] of sections) {
    page.drawText(title, { x: MARGIN, y, size: 10, font: ctx.fontBold, color: NAVY });
    y -= 14;
    y = drawLegalText(page, ctx, y, text);
    y -= 6;
  }

  y -= 10;
  drawSignatureBlock(page, ctx, y, 'f3');

  drawFooter(page, ctx, 2);
}

/* ─── PAGE 3: PAYMENT AUTHORIZATION ───────────────────── */

function buildPage3_PaymentAuth(ctx) {
  const page = addPage(ctx);
  drawHeader(page, ctx, 'Payment Authorization', 'Form 4 \u2014 Client Onboarding Packet');

  let y = PAGE_H - 100;
  const halfW = (CONTENT_W - 16) / 2;
  const thirdW = (CONTENT_W - 32) / 3;

  y = drawSectionTitle(page, ctx, y, 'Payment Method');

  page.drawText('Please select and complete your preferred payment method below.', {
    x: MARGIN, y, size: 9, font: ctx.fontItalic, color: GRAY,
  });
  y -= 22;

  // Credit/Debit Card section
  page.drawText('Credit / Debit Card', { x: MARGIN, y, size: 10, font: ctx.fontBold, color: NAVY });
  y -= 18;

  y = drawLabel(page, ctx, MARGIN, y, 'Name on Card');
  y = addTextField(ctx, page, 'f4_cardName', MARGIN, y, CONTENT_W, 22);

  const cardRow1 = y;
  y = drawLabel(page, ctx, MARGIN, y, 'Card Number');
  y = addTextField(ctx, page, 'f4_cardNumber', MARGIN, y, halfW + 60, 22);
  drawLabel(page, ctx, MARGIN + halfW + 76, cardRow1, 'Card Type (Visa/MC/Amex)');
  addTextField(ctx, page, 'f4_cardType', MARGIN + halfW + 76, cardRow1 - 14, halfW - 60, 22);

  const cardRow2 = y;
  y = drawLabel(page, ctx, MARGIN, y, 'Expiration Date');
  y = addTextField(ctx, page, 'f4_expDate', MARGIN, y, thirdW, 22);
  drawLabel(page, ctx, MARGIN + thirdW + 16, cardRow2, 'CVV');
  addTextField(ctx, page, 'f4_cvv', MARGIN + thirdW + 16, cardRow2 - 14, 80, 22);

  y -= 12;

  // ACH section
  page.drawText('ACH / Bank Transfer (alternative)', { x: MARGIN, y, size: 10, font: ctx.fontBold, color: NAVY });
  y -= 18;

  const achRow = y;
  y = drawLabel(page, ctx, MARGIN, y, 'Bank Name');
  y = addTextField(ctx, page, 'f4_bankName', MARGIN, y, CONTENT_W, 22);

  const achRow2 = y;
  y = drawLabel(page, ctx, MARGIN, y, 'Routing Number');
  y = addTextField(ctx, page, 'f4_routingNumber', MARGIN, y, halfW, 22);
  drawLabel(page, ctx, MARGIN + halfW + 16, achRow2, 'Account Number');
  addTextField(ctx, page, 'f4_accountNumber', MARGIN + halfW + 16, achRow2 - 14, halfW, 22);

  y -= 12;

  // Billing authorization
  y = drawSectionTitle(page, ctx, y, 'Billing Authorization');

  y = drawLegalText(page, ctx, y, `I authorize Nurse Health Concierge to charge the payment method indicated above for services rendered in accordance with the agreed-upon fee schedule. I understand that:

  \u2022  Charges will be processed on a monthly basis unless otherwise agreed
  \u2022  I will receive an itemized statement prior to each charge
  \u2022  I may cancel this authorization with 14 days written notice
  \u2022  Disputed charges must be reported within 30 days`);

  y -= 20;
  drawSignatureBlock(page, ctx, y, 'f4');

  drawFooter(page, ctx, 3);
}

/* ─── PAGE 4: EMERGENCY PROTOCOL AUTHORIZATION ────────── */

function buildPage4_EmergencyProtocol(ctx) {
  const page = addPage(ctx);
  const d = ctx.data;
  drawHeader(page, ctx, 'Emergency Protocol Authorization', 'Form 5 \u2014 Client Onboarding Packet');

  let y = PAGE_H - 100;

  y = drawClientInfoBox(page, ctx, y);

  y = drawSectionTitle(page, ctx, y, 'Emergency Authorization');

  y = drawLegalText(page, ctx, y, `In the event of a medical emergency or safety concern, I authorize my assigned Health Advocate from Nurse Health Concierge to take the following actions on my behalf:

  \u2022  Call 911 or Emergency Medical Services (EMS) if I am in immediate danger or experiencing a medical emergency
  \u2022  Contact my designated emergency contact(s) listed below
  \u2022  Contact my Primary Care Physician or treating specialist
  \u2022  Accompany me to the hospital and advocate on my behalf
  \u2022  Share relevant medical information with emergency responders and hospital staff
  \u2022  Make reasonable decisions regarding my immediate safety if I am unable to communicate

I understand that my Health Advocate is not a medical provider and will defer to medical professionals for all clinical decisions. This authorization is intended to ensure my safety and well-being in urgent situations.`);

  y -= 16;

  // Emergency contact info (pre-filled)
  y = drawSectionTitle(page, ctx, y, 'Emergency Contacts');

  page.drawRectangle({ x: MARGIN, y: y - 60, width: CONTENT_W, height: 60, color: LIGHT, borderWidth: 0.5, borderColor: GOLD });
  y -= 16;
  page.drawText(`Emergency Contact: ${d.emergencyContactName || ''}`, {
    x: MARGIN + 10, y, size: 9, font: ctx.font, color: BLACK,
  });
  page.drawText(`Phone: ${d.emergencyContactPhone || ''}`, {
    x: MARGIN + CONTENT_W / 2, y, size: 9, font: ctx.font, color: BLACK,
  });
  y -= 16;
  page.drawText(`Primary Contact: ${d.primaryContactName || ''} (${d.primaryContactRelationship || ''})`, {
    x: MARGIN + 10, y, size: 9, font: ctx.font, color: BLACK,
  });
  page.drawText(`Phone: ${d.primaryContactPhone || ''}`, {
    x: MARGIN + CONTENT_W / 2, y, size: 9, font: ctx.font, color: BLACK,
  });

  y -= 40;

  // Additional emergency contact (fillable)
  y = drawLabel(page, ctx, MARGIN, y, 'Additional Emergency Contact (optional)');
  const halfW = (CONTENT_W - 16) / 2;
  const addlRow = y;
  y = addTextField(ctx, page, 'f5_addlEmergencyName', MARGIN, y, halfW, 22);
  drawLabel(page, ctx, MARGIN + halfW + 16, addlRow + 14, 'Phone');
  addTextField(ctx, page, 'f5_addlEmergencyPhone', MARGIN + halfW + 16, addlRow, halfW, 22);

  y -= 20;
  drawSignatureBlock(page, ctx, y, 'f5');

  drawFooter(page, ctx, 4);
}

/* ─── PAGE 5: FAMILY COMMUNICATION AUTHORIZATION ──────── */

function buildPage5_FamilyCommunication(ctx) {
  const page = addPage(ctx);
  const d = ctx.data;
  drawHeader(page, ctx, 'Family Communication Authorization', 'Form 6 \u2014 Client Onboarding Packet');

  let y = PAGE_H - 100;

  y = drawSectionTitle(page, ctx, y, 'Authorized Contacts for Health Updates');

  y = drawLegalText(page, ctx, y, `I authorize Nurse Health Concierge and my assigned Health Advocate to share information about my health status, care plans, and medical updates with the individuals listed below. I understand that I may modify this list at any time by providing written notice.`);

  y -= 10;

  // Table header
  const colWidths = [160, 110, 110, 90];
  const colStarts = [MARGIN];
  for (let i = 1; i < colWidths.length; i++) {
    colStarts.push(colStarts[i - 1] + colWidths[i - 1] + 8);
  }

  page.drawRectangle({ x: MARGIN, y: y - 16, width: CONTENT_W, height: 18, color: NAVY });
  const headers = ['Name', 'Relationship', 'Phone', 'Authorized?'];
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], {
      x: colStarts[i] + 4, y: y - 12, size: 8, font: ctx.fontBold, color: WHITE,
    });
  }
  y -= 20;

  // 5 rows — first pre-filled with primary contact
  for (let row = 1; row <= 5; row++) {
    const isFirst = row === 1;
    const nameVal = isFirst ? (d.primaryContactName || '') : '';
    const relVal = isFirst ? (d.primaryContactRelationship || '') : '';
    const phoneVal = isFirst ? (d.primaryContactPhone || '') : '';
    const authVal = isFirst ? 'Yes' : '';

    addTextField(ctx, page, `f6_name${row}`, colStarts[0], y, colWidths[0], 22, nameVal, isFirst);
    addTextField(ctx, page, `f6_relationship${row}`, colStarts[1], y, colWidths[1], 22, relVal, isFirst);
    addTextField(ctx, page, `f6_phone${row}`, colStarts[2], y, colWidths[2], 22, phoneVal, isFirst);
    addTextField(ctx, page, `f6_auth${row}`, colStarts[3], y, colWidths[3], 22, authVal, isFirst);
    y -= 30;
  }

  y -= 10;

  page.drawText('Enter "Yes" or "No" in the Authorized column for each contact.', {
    x: MARGIN, y, size: 8, font: ctx.fontItalic, color: GRAY,
  });
  y -= 20;

  // Special instructions
  y = drawLabel(page, ctx, MARGIN, y, 'Special Instructions or Restrictions on Communication');
  y = addMultiLineField(ctx, page, 'f6_specialInstructions', MARGIN, y, CONTENT_W, 60);

  y -= 20;
  drawSignatureBlock(page, ctx, y, 'f6');

  // Thank you note
  page.drawText('Thank you for completing this onboarding packet!', {
    x: MARGIN, y: 60, size: 10, font: ctx.fontBold, color: NAVY,
  });
  page.drawText('Please save this PDF and reply to the email you received with the completed form attached.', {
    x: MARGIN, y: 48, size: 8, font: ctx.font, color: GRAY,
  });

  drawFooter(page, ctx, 5);
}

module.exports = { generateClientPacket };
