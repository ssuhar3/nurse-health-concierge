const crypto = require('crypto');
const { appendRow } = require('./utils/sheets');
const { insertRecord } = require('./utils/supabase');
const { sendNotification, sendEmail, formatSection } = require('./utils/email');
const { validateRequired, sanitizeAll, respond } = require('./utils/validate');

const REQUIRED_FIELDS = ['contactName', 'phone', 'email', 'relationship'];

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

    // Validate
    const { valid, missing } = validateRequired(data, REQUIRED_FIELDS);
    if (!valid) {
      return respond(400, {
        error: 'Missing required fields',
        missing,
      });
    }

    // Collect health needs checkboxes
    const healthNeeds = [];
    if (data.need_multiDoc) healthNeeds.push('Multiple Doctors / Specialists');
    if (data.need_hospital) healthNeeds.push('Recent Hospitalization');
    if (data.need_diagnosis) healthNeeds.push('New Diagnosis / Treatment Plan');
    if (data.need_insurance) healthNeeds.push('Insurance / Medicare Navigation');
    if (data.need_coordination) healthNeeds.push('Care Coordination');
    if (data.need_safety) healthNeeds.push('Home Safety Concerns');
    if (data.need_endOfLife) healthNeeds.push('End-of-Life Planning');
    if (data.need_wellness) healthNeeds.push('General Wellness Check');
    if (data.need_counseling) healthNeeds.push('Counseling Services');
    if (data.need_fiduciary) healthNeeds.push('Fiduciary Services');
    if (data.need_transport) healthNeeds.push('Transportation Services');
    if (data.need_medDevice) healthNeeds.push('Medical Device Management');
    if (data.need_mobility) healthNeeds.push('Mobility or Balance Concerns');
    if (data.need_physTherapy) healthNeeds.push('Physical Therapy Needs');
    if (data.need_crisis) healthNeeds.push('Acute Episode / Crises Intervention');
    if (data.need_tech) healthNeeds.push('Technology Services');
    if (data.need_handyman) healthNeeds.push('Handyman Services');
    if (data.need_cleaning) healthNeeds.push('Cleaning Services');

    const timestamp = new Date().toISOString();

    // --- Google Sheet --- (17 columns: 14 original + Status + Notes + Record ID)
    const sheetRow = [
      timestamp,
      data.contactName,
      data.relationship,
      data.phone,
      data.email,
      data.contactMethod || '',
      data.contactTime || '',
      data.seniorName || '',
      data.ageRange || '',
      data.seniorLocation || '',
      data.livingSituation || '',
      healthNeeds.join(', '),
      data.story || '',
      data.referralSource || '',
      data.timeframe || '',
      'New', // Status
      '', // Internal Notes
      crypto.randomUUID(), // Record ID
    ];

    await appendRow('Client Inquiries', sheetRow);

    // --- Supabase (dual-write for new portal) ---
    await insertRecord('client_inquiries', {
      contact_name: data.contactName,
      relationship: data.relationship,
      phone: data.phone,
      email: data.email,
      contact_method: data.contactMethod || '',
      contact_time: data.contactTime || '',
      senior_name: data.seniorName || '',
      age_range: data.ageRange || '',
      senior_location: data.seniorLocation || '',
      living_situation: data.livingSituation || '',
      health_needs: healthNeeds.join(', '),
      story: data.story || '',
      referral_source: data.referralSource || '',
      timeframe: data.timeframe || '',
      status: 'New',
    });

    // --- Email Notification ---
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
        <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">New Consultation Request</h2>
          <p style="margin:4px 0 0;opacity:0.85">${timestamp}</p>
        </div>
        <div style="padding:16px 24px;background:#f9f7f2;border-radius:0 0 8px 8px">
          ${formatSection('Contact Information', {
            'Name': data.contactName,
            'Relationship': data.relationship,
            'Phone': data.phone,
            'Email': data.email,
            'Preferred Contact': data.contactMethod || 'Not specified',
            'Preferred Time': data.contactTime || 'Not specified',
          })}
          ${formatSection('About the Senior', {
            'Senior Name': data.seniorName,
            'Age Range': data.ageRange,
            'Location': data.seniorLocation,
            'Living Situation': data.livingSituation,
          })}
          ${healthNeeds.length ? formatSection('Health Situation', {
            'Challenges': healthNeeds.join(', '),
          }) : ''}
          ${data.story ? formatSection('Their Story', {
            'Details': data.story,
          }) : ''}
          ${formatSection('Additional', {
            'Referral Source': data.referralSource,
            'Timeframe': data.timeframe,
          })}
        </div>
      </div>
    `;

    await sendNotification(
      `New Consultation Request — ${data.contactName}`,
      html
    );

    // --- Confirmation Email to Submitter ---
    const confirmationHtml = `
      <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #f9f7f2;">
        <div style="background: #1a365d; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px; font-weight: bold;">Nurse Health Concierge</h1>
        </div>
        <div style="padding: 32px 24px; background: white;">
          <p style="color: #333; line-height: 1.6; margin: 0 0 12px 0;">Dear ${data.contactName},</p>
          <p style="color: #333; line-height: 1.6; margin: 0 0 12px 0;">Thank you for reaching out to Nurse Health Concierge. We have received your consultation request and are grateful you chose us to help with your family's care needs.</p>
          <p style="color: #333; line-height: 1.6; margin: 0 0 12px 0;">A member of our team will review your request and reach out to you within <strong>3 business days</strong> to discuss how we can best support you.</p>
          <p style="color: #333; line-height: 1.6; margin: 0 0 12px 0;">If you have any urgent questions in the meantime, please don't hesitate to contact us directly at <a href="mailto:nursehealthconcierge@gmail.com" style="color: #1a365d;">nursehealthconcierge@gmail.com</a>.</p>
          <p style="color: #333; line-height: 1.6; margin: 0 0 12px 0;">Warm regards,<br/>Pat Dobbins<br/>Founder, Nurse Health Concierge</p>
        </div>
        <div style="padding: 16px 24px; text-align: center; color: #999; font-size: 12px;">
          Nurse Health Concierge &bull; Caring for those who matter most
        </div>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: 'Thank You for Your Inquiry - Nurse Health Concierge',
      html: confirmationHtml,
      replyTo: process.env.SMTP_USER || 'nursehealthconcierge@gmail.com',
    });

    return respond(200, {
      success: true,
      message: 'Your consultation request has been submitted. We will be in touch soon!',
    });

  } catch (err) {
    console.error('submit-inquiry error:', err);
    return respond(500, {
      error: 'Something went wrong. Please try again or email us directly at nursehealthconcierge@gmail.com.',
    });
  }
};
