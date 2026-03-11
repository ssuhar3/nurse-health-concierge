const { appendRow } = require('./utils/sheets');
const { sendNotification, formatSection } = require('./utils/email');
const { validateRequired, sanitizeAll, respond } = require('./utils/validate');

const REQUIRED_FIELDS = ['fullName', 'email', 'phone', 'profTitle', 'licenseNum'];

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return respond(200, { message: 'OK' });
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' });
  }

  try {
    const raw = JSON.parse(event.body || '{}');
    const data = sanitizeAll(raw);
    const ratings = raw.ratings || {};

    // Validate
    const { valid, missing } = validateRequired(data, REQUIRED_FIELDS);
    if (!valid) {
      return respond(400, {
        error: 'Missing required fields',
        missing,
      });
    }

    // Collect experience checkboxes
    const experience = [];
    if (data.exp_careCoord) experience.push('Care Coordination');
    if (data.exp_discharge) experience.push('Hospital Discharge');
    if (data.exp_insurance) experience.push('Insurance Navigation');
    if (data.exp_medication) experience.push('Medication Management');
    if (data.exp_family) experience.push('Family Support');

    const timestamp = new Date().toISOString();

    // --- Google Sheet ---
    const sheetRow = [
      timestamp,
      // Step 1 - Application
      data.fullName,
      data.email,
      data.phone,
      data.address || '',
      data.city || '',
      data.state || '',
      data.zip || '',
      data.emergencyContact || '',
      data.profTitle,
      data.licenseNum,
      data.statesLicensed || '',
      data.licenseExp || '',
      data.certifications || '',
      data.school || '',
      data.degree || '',
      data.gradYear || '',
      data.employer1 || '',
      data.jobTitle1 || '',
      data.dates1 || '',
      data.duties1 || '',
      data.employer2 || '',
      data.jobTitle2 || '',
      data.dates2 || '',
      data.duties2 || '',
      data.yearsWithSeniors || '',
      experience.join(', '),
      data.empType || '',
      data.geoAreas || '',
      data.startDate || '',
      // Step 2 - Background Check
      data.bgCheckAuth ? 'Yes' : 'No',
      data.bgCheckSig || '',
      data.bgCheckDate || '',
      // Step 3 - HIPAA
      data.hipaaAuth ? 'Yes' : 'No',
      data.hipaaSig || '',
      data.hipaaDate || '',
      // Step 4 - Contractor Agreement
      data.contractorAuth ? 'Yes' : 'No',
      data.contractorSig || '',
      data.contractorDate || '',
      // Step 5 - References
      data.ref1Name || '', data.ref1Relationship || '', data.ref1Org || '', data.ref1Phone || '', data.ref1Email || '',
      data.ref2Name || '', data.ref2Relationship || '', data.ref2Org || '', data.ref2Phone || '', data.ref2Email || '',
      data.ref3Name || '', data.ref3Relationship || '', data.ref3Org || '', data.ref3Phone || '', data.ref3Email || '',
      // Step 6 - Skills
      ratings.dementia || '',
      ratings.hospitalAdvocacy || '',
      ratings.medicationMgmt || '',
      ratings.endOfLife || '',
      ratings.familyMediation || '',
      ratings.medicareNav || '',
      data.additionalInfo || '',
    ];

    await appendRow('Advocate Applications', sheetRow);

    // --- Email Notification ---
    const ratingLabel = (val) => val ? `${'★'.repeat(val)}${'☆'.repeat(5 - val)} (${val}/5)` : 'Not rated';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">New Advocate Application</h2>
          <p style="margin:4px 0 0;opacity:0.85">${data.fullName} &mdash; ${data.profTitle}</p>
          <p style="margin:4px 0 0;opacity:0.7">${timestamp}</p>
        </div>
        <div style="padding:16px 24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          ${formatSection('Basic Information', {
            'Name': data.fullName,
            'Email': data.email,
            'Phone': data.phone,
            'Address': [data.address, data.city, data.state, data.zip].filter(Boolean).join(', '),
            'Emergency Contact': data.emergencyContact,
          })}
          ${formatSection('Professional Credentials', {
            'Title': data.profTitle,
            'License #': data.licenseNum,
            'States Licensed': data.statesLicensed,
            'License Expiration': data.licenseExp,
            'Certifications': data.certifications,
          })}
          ${formatSection('Education', {
            'School': data.school,
            'Degree': data.degree,
            'Graduation Year': data.gradYear,
          })}
          ${formatSection('Employment History', {
            'Employer 1': data.employer1 ? `${data.employer1} — ${data.jobTitle1} (${data.dates1})` : '',
            'Duties 1': data.duties1,
            'Employer 2': data.employer2 ? `${data.employer2} — ${data.jobTitle2} (${data.dates2})` : '',
            'Duties 2': data.duties2,
          })}
          ${formatSection('Experience', {
            'Years with Seniors': data.yearsWithSeniors,
            'Areas': experience.join(', ') || 'None selected',
            'Employment Type': data.empType,
            'Geographic Areas': data.geoAreas,
            'Available Start': data.startDate,
          })}
          ${formatSection('Agreements Signed', {
            'Background Check': data.bgCheckAuth ? `Authorized (${data.bgCheckSig}, ${data.bgCheckDate})` : 'Not authorized',
            'HIPAA': data.hipaaAuth ? `Acknowledged (${data.hipaaSig}, ${data.hipaaDate})` : 'Not acknowledged',
            'Contractor Agreement': data.contractorAuth ? `Signed (${data.contractorSig}, ${data.contractorDate})` : 'Not signed',
          })}
          ${formatSection('References', {
            'Reference 1': data.ref1Name ? `${data.ref1Name} (${data.ref1Relationship}) — ${data.ref1Phone}, ${data.ref1Email}` : '',
            'Reference 2': data.ref2Name ? `${data.ref2Name} (${data.ref2Relationship}) — ${data.ref2Phone}, ${data.ref2Email}` : '',
            'Reference 3': data.ref3Name ? `${data.ref3Name} (${data.ref3Relationship}) — ${data.ref3Phone}, ${data.ref3Email}` : '',
          })}
          ${formatSection('Skills Self-Assessment', {
            'Dementia Patients': ratingLabel(ratings.dementia),
            'Hospital Advocacy': ratingLabel(ratings.hospitalAdvocacy),
            'Medication Mgmt': ratingLabel(ratings.medicationMgmt),
            'End-of-Life Care': ratingLabel(ratings.endOfLife),
            'Family Mediation': ratingLabel(ratings.familyMediation),
            'Medicare Navigation': ratingLabel(ratings.medicareNav),
          })}
          ${data.additionalInfo ? formatSection('Additional Information', {
            'Notes': data.additionalInfo,
          }) : ''}
        </div>
      </div>
    `;

    await sendNotification(
      `New Advocate Application — ${data.fullName} (${data.profTitle})`,
      html
    );

    return respond(200, {
      success: true,
      message: 'Your application has been submitted successfully! We will review it and be in touch.',
    });

  } catch (err) {
    console.error('submit-application error:', err);
    return respond(500, {
      error: 'Something went wrong. Please try again or email us directly at pdobbers@aol.com.',
    });
  }
};
