const { PDFDocument, StandardFonts, rgb, PDFTextField } = require('pdf-lib');

// Brand colors (RGB 0-1 scale)
const NAVY  = rgb(11/255, 29/255, 58/255);
const GOLD  = rgb(201/255, 165/255, 78/255);
const GRAY  = rgb(85/255, 85/255, 85/255);
const LIGHT = rgb(247/255, 245/255, 241/255);
const WHITE = rgb(1, 1, 1);
const BLACK = rgb(0, 0, 0);

const PAGE_W = 612;  // Letter
const PAGE_H = 792;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * Generate a fillable 8-page application packet
 * @param {Object} data - Applicant data from web form
 * @returns {Promise<Buffer>} PDF as Buffer
 */
async function generateFillablePacket(data) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const form = doc.getForm();

  const ctx = { doc, font, fontBold, fontItalic, form, data };

  buildPage1_CoverAndCredentials(ctx);
  buildPage2_EducationAndEmployment(ctx);
  buildPage3_ExperienceAndAvailability(ctx);
  buildPage4_BackgroundCheck(ctx);
  buildPage5_HIPAA(ctx);
  buildPage6_ContractorAgreement(ctx);
  buildPage7_References(ctx);
  buildPage8_SkillsAssessment(ctx);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

/* ─── HELPERS ──────────────────────────────────────────── */

function addPage(ctx) {
  const page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  return page;
}

function drawHeader(page, ctx, title, subtitle) {
  // Navy banner
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: NAVY });
  page.drawText('Nurse Health Concierge', {
    x: MARGIN, y: PAGE_H - 32, size: 16, font: ctx.fontBold, color: WHITE,
  });
  page.drawText(title, {
    x: MARGIN, y: PAGE_H - 52, size: 11, font: ctx.font, color: rgb(0.8, 0.8, 0.8),
  });
  // Gold accent
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
  page.drawText(`Page ${pageNum} of 8  |  Nurse Health Concierge  |  Confidential`, {
    x: MARGIN, y: 25, size: 7, font: ctx.fontItalic, color: GRAY,
  });
}

/* ─── PAGE 1: COVER + PROFESSIONAL CREDENTIALS ─────────── */

function buildPage1_CoverAndCredentials(ctx) {
  const page = addPage(ctx);
  const d = ctx.data;
  drawHeader(page, ctx, 'Health Advocate Application Packet', `Submitted: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`);

  let y = PAGE_H - 100;

  // Pre-filled applicant info box
  page.drawRectangle({ x: MARGIN, y: y - 110, width: CONTENT_W, height: 110, color: LIGHT, borderWidth: 0.5, borderColor: GOLD });
  page.drawText('Applicant Information (from web submission)', {
    x: MARGIN + 10, y: y - 16, size: 9, font: ctx.fontBold, color: NAVY,
  });

  const leftCol = MARGIN + 10;
  const rightCol = MARGIN + CONTENT_W / 2 + 10;

  y -= 34;
  page.drawText(`Name: ${d.fullName || ''}`, { x: leftCol, y, size: 9, font: ctx.font, color: BLACK });
  page.drawText(`Title: ${d.profTitle || ''}`, { x: rightCol, y, size: 9, font: ctx.font, color: BLACK });
  y -= 16;
  page.drawText(`Email: ${d.email || ''}`, { x: leftCol, y, size: 9, font: ctx.font, color: BLACK });
  page.drawText(`Phone: ${d.phone || ''}`, { x: rightCol, y, size: 9, font: ctx.font, color: BLACK });
  y -= 16;
  const addr = [d.address, d.city, d.state, d.zip].filter(Boolean).join(', ');
  page.drawText(`Address: ${addr}`, { x: leftCol, y, size: 9, font: ctx.font, color: BLACK });
  y -= 16;
  const avail = [d.empType, d.geoAreas, d.startDate ? `Start: ${d.startDate}` : ''].filter(Boolean).join('  |  ');
  page.drawText(`Availability: ${avail}`, { x: leftCol, y, size: 9, font: ctx.font, color: BLACK });

  y -= 30;

  // Professional Credentials section
  y = drawSectionTitle(page, ctx, y, 'Form 1 — Professional Credentials');

  const halfW = (CONTENT_W - 16) / 2;

  y = drawLabel(page, ctx, MARGIN, y, 'Professional Title');
  y = addTextField(ctx, page, 'f1_profTitle', MARGIN, y, CONTENT_W, 22, d.profTitle || '', true);

  y = drawLabel(page, ctx, MARGIN, y, 'State License Number');
  const tempY = y;
  y = addTextField(ctx, page, 'f1_licenseNumber', MARGIN, y, halfW, 22);
  y = drawLabel(page, ctx, MARGIN + halfW + 16, tempY + 14, 'States Licensed In');
  addTextField(ctx, page, 'f1_statesLicensed', MARGIN + halfW + 16, tempY, halfW, 22);

  y = drawLabel(page, ctx, MARGIN, y, 'License Expiration Date');
  const tempY2 = y;
  y = addTextField(ctx, page, 'f1_licenseExpiration', MARGIN, y, halfW, 22);
  drawLabel(page, ctx, MARGIN + halfW + 16, tempY2 + 14, 'Certifications');
  addTextField(ctx, page, 'f1_certifications', MARGIN + halfW + 16, tempY2, halfW, 22);

  drawFooter(page, ctx, 1);
}

/* ─── PAGE 2: EDUCATION + EMPLOYMENT HISTORY ───────────── */

function buildPage2_EducationAndEmployment(ctx) {
  const page = addPage(ctx);
  drawHeader(page, ctx, 'Education & Employment History', 'Form 1 (continued)');

  let y = PAGE_H - 100;
  const halfW = (CONTENT_W - 16) / 2;
  const thirdW = (CONTENT_W - 32) / 3;

  // Education
  y = drawSectionTitle(page, ctx, y, 'Education');

  for (let i = 1; i <= 2; i++) {
    if (i > 1) y -= 6;
    page.drawText(`Education ${i}`, { x: MARGIN, y, size: 8, font: ctx.fontItalic, color: GRAY });
    y -= 14;

    y = drawLabel(page, ctx, MARGIN, y, 'School / Institution');
    y = addTextField(ctx, page, `f1_school${i}`, MARGIN, y, CONTENT_W, 22);

    const rowY = y;
    y = drawLabel(page, ctx, MARGIN, y, 'Degree / Program');
    y = addTextField(ctx, page, `f1_degree${i}`, MARGIN, y, halfW, 22);
    drawLabel(page, ctx, MARGIN + halfW + 16, rowY, 'Graduation Year');
    addTextField(ctx, page, `f1_gradYear${i}`, MARGIN + halfW + 16, rowY - 14, halfW, 22);
  }

  y -= 10;

  // Employment History
  y = drawSectionTitle(page, ctx, y, 'Employment History');

  for (let i = 1; i <= 3; i++) {
    if (y < 150) break; // safety: don't overflow page
    if (i > 1) y -= 4;
    page.drawText(`Position ${i}`, { x: MARGIN, y, size: 8, font: ctx.fontItalic, color: GRAY });
    y -= 14;

    const rowY1 = y;
    y = drawLabel(page, ctx, MARGIN, y, 'Employer');
    y = addTextField(ctx, page, `f1_employer${i}`, MARGIN, y, halfW, 22);
    drawLabel(page, ctx, MARGIN + halfW + 16, rowY1, 'Job Title');
    addTextField(ctx, page, `f1_jobTitle${i}`, MARGIN + halfW + 16, rowY1 - 14, halfW, 22);

    const rowY2 = y;
    drawLabel(page, ctx, MARGIN, y, 'Start Date');
    y = addTextField(ctx, page, `f1_startDate${i}`, MARGIN, y - 14, thirdW, 22);
    drawLabel(page, ctx, MARGIN + thirdW + 16, rowY2, 'End Date');
    addTextField(ctx, page, `f1_endDate${i}`, MARGIN + thirdW + 16, rowY2 - 14, thirdW, 22);

    y = drawLabel(page, ctx, MARGIN, y, 'Key Responsibilities');
    y = addMultiLineField(ctx, page, `f1_duties${i}`, MARGIN, y, CONTENT_W, 40);
  }

  drawFooter(page, ctx, 2);
}

/* ─── PAGE 3: EXPERIENCE + AVAILABILITY ────────────────── */

function buildPage3_ExperienceAndAvailability(ctx) {
  const page = addPage(ctx);
  const d = ctx.data;
  drawHeader(page, ctx, 'Experience & Availability', 'Form 1 (continued)');

  let y = PAGE_H - 100;
  const halfW = (CONTENT_W - 16) / 2;

  // Experience
  y = drawSectionTitle(page, ctx, y, 'Experience');

  y = drawLabel(page, ctx, MARGIN, y, 'Total Years Working with Seniors');
  y = addTextField(ctx, page, 'f1_yearsWithSeniors', MARGIN, y, 200, 22);

  y -= 6;
  page.drawText('Rate your experience in each area (years or level of expertise):', {
    x: MARGIN, y, size: 9, font: ctx.fontItalic, color: GRAY,
  });
  y -= 18;

  const expAreas = [
    ['f1_exp_careCoord', 'Care Coordination'],
    ['f1_exp_hospitalDischarge', 'Hospital Discharge Planning'],
    ['f1_exp_insuranceNav', 'Insurance Navigation'],
    ['f1_exp_medicationMgmt', 'Medication Management'],
    ['f1_exp_familySupport', 'Family Support & Communication'],
  ];

  for (const [name, label] of expAreas) {
    const rowY = y;
    page.drawText(label, { x: MARGIN, y: y + 4, size: 9, font: ctx.font, color: BLACK });
    addTextField(ctx, page, name, MARGIN + 260, rowY - 4, 200, 20);
    y -= 28;
  }

  y -= 10;

  // Availability (pre-filled)
  y = drawSectionTitle(page, ctx, y, 'Availability');

  y = drawLabel(page, ctx, MARGIN, y, 'Employment Type');
  y = addTextField(ctx, page, 'f1_empType', MARGIN, y, halfW, 22, d.empType || '', true);

  const rowY = y;
  y = drawLabel(page, ctx, MARGIN, y, 'Geographic Areas Served');
  y = addTextField(ctx, page, 'f1_geoAreas', MARGIN, y, halfW, 22, d.geoAreas || '', true);
  drawLabel(page, ctx, MARGIN + halfW + 16, rowY, 'Earliest Start Date');
  addTextField(ctx, page, 'f1_startDate', MARGIN + halfW + 16, rowY - 14, halfW, 22, d.startDate || '', true);

  y -= 6;
  y = drawLabel(page, ctx, MARGIN, y, 'Weekly Hours Available');
  y = addTextField(ctx, page, 'f1_weeklyHours', MARGIN, y, 200, 22);

  y = drawLabel(page, ctx, MARGIN, y, 'Additional Notes on Availability');
  y = addMultiLineField(ctx, page, 'f1_availNotes', MARGIN, y, CONTENT_W, 60);

  drawFooter(page, ctx, 3);
}

/* ─── PAGE 4: BACKGROUND CHECK AUTHORIZATION ───────────── */

function buildPage4_BackgroundCheck(ctx) {
  const page = addPage(ctx);
  const d = ctx.data;
  drawHeader(page, ctx, 'Background Check Authorization', 'Form 2');

  let y = PAGE_H - 110;

  y = drawSectionTitle(page, ctx, y, 'Authorization for Background Investigation');

  const legalText = `I hereby authorize Nurse Health Concierge to conduct a background investigation as part of my application for a Health Advocate position. This investigation may include, but is not limited to:

  \u2022  Criminal background check (federal and state)
  \u2022  Verification of professional licensing and certifications
  \u2022  Verification of employment history
  \u2022  Reference checks from professional contacts
  \u2022  Verification of educational credentials

I understand that this information will be used solely for the purpose of evaluating my suitability for the Health Advocate position and will be handled in accordance with applicable federal and state laws.

I release Nurse Health Concierge and its agents from any liability arising from the collection and use of this information. I understand that any misrepresentation or omission of facts in my application or during the background check process may result in disqualification from consideration or termination of any subsequent engagement.

This authorization remains valid for the duration of my application process and, if engaged, for the duration of my relationship with Nurse Health Concierge.`;

  const lines = legalText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { y -= 10; continue; }
    page.drawText(trimmed, { x: MARGIN, y, size: 9, font: ctx.font, color: BLACK, maxWidth: CONTENT_W, lineHeight: 13 });
    y -= (trimmed.startsWith('\u2022') ? 14 : 13);
  }

  y -= 30;

  // Signature area
  page.drawRectangle({ x: MARGIN, y: y - 100, width: CONTENT_W, height: 100, color: LIGHT, borderWidth: 0.5, borderColor: GOLD });
  y -= 10;

  const halfW = (CONTENT_W - 36) / 2;

  y = drawLabel(page, ctx, MARGIN + 10, y, 'Printed Name');
  y = addTextField(ctx, page, 'f2_printedName', MARGIN + 10, y, halfW, 22, d.fullName || '', true);

  const sigY = y;
  y = drawLabel(page, ctx, MARGIN + 10, y, 'Signature (type your full name)');
  y = addTextField(ctx, page, 'f2_signature', MARGIN + 10, y, halfW, 22);
  drawLabel(page, ctx, MARGIN + halfW + 26, sigY, 'Date');
  addTextField(ctx, page, 'f2_date', MARGIN + halfW + 26, sigY - 14, 180, 22);

  drawFooter(page, ctx, 4);
}

/* ─── PAGE 5: HIPAA & CONFIDENTIALITY ──────────────────── */

function buildPage5_HIPAA(ctx) {
  const page = addPage(ctx);
  const d = ctx.data;
  drawHeader(page, ctx, 'HIPAA & Confidentiality Agreement', 'Form 3');

  let y = PAGE_H - 110;

  y = drawSectionTitle(page, ctx, y, 'Confidentiality & HIPAA Compliance Agreement');

  const legalText = `As a Health Advocate with Nurse Health Concierge, I understand that I may have access to Protected Health Information (PHI) and other confidential information regarding clients and their families. By signing below, I agree to the following:

1. HIPAA Compliance: I will comply with all applicable provisions of the Health Insurance Portability and Accountability Act (HIPAA) and its implementing regulations regarding the privacy and security of PHI.

2. Confidentiality: I will maintain strict confidentiality of all client information, medical records, personal data, and any proprietary information belonging to Nurse Health Concierge.

3. No Unauthorized Disclosure: I will not access, use, or disclose any PHI or confidential information except as necessary to perform my duties as a Health Advocate and as permitted by law.

4. Security Measures: I will take all reasonable steps to safeguard PHI and confidential information from unauthorized access, use, or disclosure.

5. Reporting: I will immediately report any known or suspected breach of PHI or confidential information to Nurse Health Concierge management.

6. Return of Information: Upon termination of my engagement, I will return all documents, files, and materials containing PHI or confidential information.

I understand that violation of this agreement may result in immediate termination of my engagement and may also result in civil and criminal penalties under applicable law.`;

  const lines = legalText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { y -= 8; continue; }
    page.drawText(trimmed, { x: MARGIN, y, size: 8.5, font: ctx.font, color: BLACK, maxWidth: CONTENT_W, lineHeight: 12 });
    const lineCount = Math.ceil(ctx.font.widthOfTextAtSize(trimmed, 8.5) / CONTENT_W);
    y -= (12 * Math.max(lineCount, 1) + 2);
  }

  y -= 20;

  // Signature area
  page.drawRectangle({ x: MARGIN, y: y - 100, width: CONTENT_W, height: 100, color: LIGHT, borderWidth: 0.5, borderColor: GOLD });
  y -= 10;

  const halfW = (CONTENT_W - 36) / 2;

  y = drawLabel(page, ctx, MARGIN + 10, y, 'Printed Name');
  y = addTextField(ctx, page, 'f3_printedName', MARGIN + 10, y, halfW, 22, d.fullName || '', true);

  const sigY = y;
  y = drawLabel(page, ctx, MARGIN + 10, y, 'Signature (type your full name)');
  y = addTextField(ctx, page, 'f3_signature', MARGIN + 10, y, halfW, 22);
  drawLabel(page, ctx, MARGIN + halfW + 26, sigY, 'Date');
  addTextField(ctx, page, 'f3_date', MARGIN + halfW + 26, sigY - 14, 180, 22);

  drawFooter(page, ctx, 5);
}

/* ─── PAGE 6: INDEPENDENT CONTRACTOR AGREEMENT ─────────── */

function buildPage6_ContractorAgreement(ctx) {
  const page = addPage(ctx);
  const d = ctx.data;
  drawHeader(page, ctx, 'Independent Contractor Agreement', 'Form 4');

  let y = PAGE_H - 110;

  y = drawSectionTitle(page, ctx, y, 'Independent Contractor Agreement');

  const sections = [
    ['Scope of Services', 'The Contractor agrees to provide health advocacy services to clients of Nurse Health Concierge as assigned, including but not limited to care coordination, medical appointment accompaniment, insurance navigation, and family communication support.'],
    ['Compensation', 'The Contractor will be compensated at a rate mutually agreed upon prior to commencement of services. Payment will be made on a bi-weekly basis for services rendered during the preceding period.'],
    ['Non-Solicitation', 'During the term of this agreement and for a period of twelve (12) months following termination, the Contractor shall not directly solicit or provide independent services to any client of Nurse Health Concierge.'],
    ['Confidentiality', 'The Contractor acknowledges and agrees that all client information, business practices, and proprietary methodologies of Nurse Health Concierge are strictly confidential and shall not be disclosed to any third party.'],
    ['Liability Insurance', 'The Contractor shall maintain professional liability insurance with minimum coverage as specified by Nurse Health Concierge and shall provide proof of such coverage upon request.'],
    ['Termination', 'Either party may terminate this agreement with fourteen (14) days written notice. Nurse Health Concierge may terminate immediately in cases of misconduct, breach of confidentiality, or failure to maintain required credentials.'],
  ];

  for (const [title, text] of sections) {
    page.drawText(title, { x: MARGIN, y, size: 9, font: ctx.fontBold, color: NAVY });
    y -= 13;
    page.drawText(text, { x: MARGIN, y, size: 8, font: ctx.font, color: BLACK, maxWidth: CONTENT_W, lineHeight: 11 });
    const lineCount = Math.ceil(ctx.font.widthOfTextAtSize(text, 8) / CONTENT_W);
    y -= (11 * Math.max(lineCount, 1) + 10);
  }

  y -= 10;

  // Signature area
  const sigBoxH = Math.min(100, y - 40);
  if (sigBoxH > 60) {
    page.drawRectangle({ x: MARGIN, y: y - sigBoxH, width: CONTENT_W, height: sigBoxH, color: LIGHT, borderWidth: 0.5, borderColor: GOLD });
    y -= 10;

    const halfW = (CONTENT_W - 36) / 2;

    y = drawLabel(page, ctx, MARGIN + 10, y, 'Printed Name');
    y = addTextField(ctx, page, 'f4_printedName', MARGIN + 10, y, halfW, 22, d.fullName || '', true);

    const sigY = y;
    drawLabel(page, ctx, MARGIN + 10, y, 'Signature (type your full name)');
    addTextField(ctx, page, 'f4_signature', MARGIN + 10, y - 14, halfW, 22);
    drawLabel(page, ctx, MARGIN + halfW + 26, sigY, 'Date');
    addTextField(ctx, page, 'f4_date', MARGIN + halfW + 26, sigY - 14, 180, 22);
  }

  drawFooter(page, ctx, 6);
}

/* ─── PAGE 7: PROFESSIONAL REFERENCES ──────────────────── */

function buildPage7_References(ctx) {
  const page = addPage(ctx);
  drawHeader(page, ctx, 'Professional References', 'Form 5');

  let y = PAGE_H - 100;
  const halfW = (CONTENT_W - 16) / 2;

  y = drawSectionTitle(page, ctx, y, 'Please provide three (3) professional references');

  page.drawText('References should be professional contacts (supervisors, colleagues, or mentors) who can speak to your clinical skills and work ethic.', {
    x: MARGIN, y, size: 9, font: ctx.fontItalic, color: GRAY,
  });
  y -= 22;

  for (let i = 1; i <= 3; i++) {
    page.drawText(`Reference ${i}`, { x: MARGIN, y, size: 10, font: ctx.fontBold, color: NAVY });
    y -= 18;

    const rowY1 = y;
    y = drawLabel(page, ctx, MARGIN, y, 'Full Name');
    y = addTextField(ctx, page, `f5_ref${i}Name`, MARGIN, y, halfW, 22);
    drawLabel(page, ctx, MARGIN + halfW + 16, rowY1, 'Relationship');
    addTextField(ctx, page, `f5_ref${i}Relationship`, MARGIN + halfW + 16, rowY1 - 14, halfW, 22);

    y = drawLabel(page, ctx, MARGIN, y, 'Organization / Company');
    y = addTextField(ctx, page, `f5_ref${i}Org`, MARGIN, y, CONTENT_W, 22);

    const rowY2 = y;
    y = drawLabel(page, ctx, MARGIN, y, 'Phone');
    y = addTextField(ctx, page, `f5_ref${i}Phone`, MARGIN, y, halfW, 22);
    drawLabel(page, ctx, MARGIN + halfW + 16, rowY2, 'Email');
    addTextField(ctx, page, `f5_ref${i}Email`, MARGIN + halfW + 16, rowY2 - 14, halfW, 22);

    y -= 12;
  }

  drawFooter(page, ctx, 7);
}

/* ─── PAGE 8: SKILLS & CLIENT MATCHING ─────────────────── */

function buildPage8_SkillsAssessment(ctx) {
  const page = addPage(ctx);
  drawHeader(page, ctx, 'Skills & Client Matching Self-Assessment', 'Form 6');

  let y = PAGE_H - 100;

  y = drawSectionTitle(page, ctx, y, 'Skills Self-Assessment');

  page.drawText('Please rate your experience level in each area below (1 = Beginner, 5 = Expert).', {
    x: MARGIN, y, size: 9, font: ctx.fontItalic, color: GRAY,
  });
  y -= 12;
  page.drawText('Enter a number from 1 to 5 in each field.', {
    x: MARGIN, y, size: 9, font: ctx.fontItalic, color: GRAY,
  });
  y -= 24;

  const skills = [
    ['f6_dementia', 'Dementia & Alzheimer\'s Patient Care'],
    ['f6_hospitalAdvocacy', 'Hospital Advocacy & Navigation'],
    ['f6_medicationMgmt', 'Medication Management & Oversight'],
    ['f6_endOfLife', 'End-of-Life & Palliative Care'],
    ['f6_familyMediation', 'Family Communication & Mediation'],
    ['f6_medicareNav', 'Medicare / Insurance Navigation'],
  ];

  for (const [name, label] of skills) {
    page.drawText(label, { x: MARGIN, y: y + 4, size: 10, font: ctx.font, color: BLACK });
    addTextField(ctx, page, name, MARGIN + 340, y - 2, 60, 22);
    y -= 36;
  }

  y -= 16;

  y = drawSectionTitle(page, ctx, y, 'Additional Information');

  page.drawText('Please share anything else that would help us match you with the right clients:', {
    x: MARGIN, y, size: 9, font: ctx.fontItalic, color: GRAY,
  });
  y -= 18;

  addMultiLineField(ctx, page, 'f6_additionalInfo', MARGIN, y, CONTENT_W, 120);

  y -= 140;

  // Thank you note
  page.drawText('Thank you for completing this application packet!', {
    x: MARGIN, y, size: 11, font: ctx.fontBold, color: NAVY,
  });
  y -= 16;
  page.drawText('Please save this PDF and reply to the email you received with the completed form attached.', {
    x: MARGIN, y, size: 9, font: ctx.font, color: GRAY,
  });
  y -= 13;
  page.drawText('We will review your application and be in touch within 5-7 business days.', {
    x: MARGIN, y, size: 9, font: ctx.font, color: GRAY,
  });

  drawFooter(page, ctx, 8);
}

module.exports = { generateFillablePacket };
