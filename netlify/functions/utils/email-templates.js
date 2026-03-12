/**
 * Pre-built email templates for the staff dashboard.
 * Each template has a name, subject generator, and HTML body generator.
 * All generators receive a `data` object with the record's fields.
 */

function wrap(title, body) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#1a365d;color:white;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">${title}</h2>
        <p style="margin:4px 0 0;opacity:0.85">Nurse Health Concierge</p>
      </div>
      <div style="padding:24px;background:#f9f7f2;border-radius:0 0 8px 8px">
        ${body}
        <p style="font-size:14px;color:#1a365d;margin-top:24px">
          Warm regards,<br>
          <strong>Pat Dobbins</strong><br>
          <span style="color:#4a4e5c">Founder, Nurse Health Concierge</span>
        </p>
      </div>
    </div>`;
}

const TEMPLATES = {
  application_received: {
    name: 'Application Received',
    subject: (d) => `Application Received — ${d.name || 'Applicant'}`,
    html: (d) => wrap('Application Received', `
      <p style="font-size:15px;color:#1a1e2c">Dear ${d.name || 'Applicant'},</p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        Thank you for your interest in joining Nurse Health Concierge as a Health Advocate.
        We have received your completed application packet and our team is now reviewing your qualifications.
      </p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We will be in touch within the next few business days regarding next steps.
        If you have any questions in the meantime, please don't hesitate to reply to this email.
      </p>
    `),
  },

  schedule_interview: {
    name: 'Schedule Interview',
    subject: (d) => `Interview Invitation — Nurse Health Concierge`,
    html: (d) => wrap('Interview Invitation', `
      <p style="font-size:15px;color:#1a1e2c">Dear ${d.name || 'Applicant'},</p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We were impressed with your application and would like to schedule an interview to discuss
        the Health Advocate position further.
      </p>
      <div style="background:#fff;border:1px solid #c9a54e;border-radius:8px;padding:20px;margin:20px 0">
        <p style="font-size:14px;color:#1a365d;margin:0"><strong>Next Steps:</strong></p>
        <p style="font-size:14px;color:#4a4e5c;margin:8px 0 0;line-height:1.7">
          Please reply to this email with your availability for the coming week and we will confirm a time that works.
        </p>
      </div>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We look forward to speaking with you!
      </p>
    `),
  },

  approved: {
    name: 'Approved',
    subject: (d) => `Congratulations! You've Been Approved — NHC`,
    html: (d) => wrap('Welcome to the Team!', `
      <p style="font-size:15px;color:#1a1e2c">Dear ${d.name || 'Applicant'},</p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We are pleased to inform you that your application to become a Health Advocate
        with Nurse Health Concierge has been <strong style="color:#2f855a">approved</strong>!
      </p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We will be sending you onboarding materials shortly. In the meantime, please
        ensure all your credentials and certifications are up to date.
      </p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        Welcome to the team — we're excited to have you!
      </p>
    `),
  },

  denied: {
    name: 'Denied',
    subject: (d) => `Application Update — Nurse Health Concierge`,
    html: (d) => wrap('Application Update', `
      <p style="font-size:15px;color:#1a1e2c">Dear ${d.name || 'Applicant'},</p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        Thank you for your interest in Nurse Health Concierge. After careful review of your
        application, we have decided not to move forward at this time.
      </p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We encourage you to apply again in the future as our needs evolve.
        We appreciate your time and wish you the best in your career.
      </p>
    `),
  },

  follow_up: {
    name: 'Follow-up',
    subject: (d) => `Following Up — Nurse Health Concierge`,
    html: (d) => wrap('Following Up', `
      <p style="font-size:15px;color:#1a1e2c">Dear ${d.name || 'there'},</p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We wanted to follow up regarding your recent submission to Nurse Health Concierge.
        If you have any questions or need any assistance, please don't hesitate to reach out.
      </p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        We're here to help and look forward to hearing from you.
      </p>
    `),
  },

  inquiry_response: {
    name: 'Inquiry Response',
    subject: (d) => `Re: Your Consultation Request — NHC`,
    html: (d) => wrap('Thank You for Reaching Out', `
      <p style="font-size:15px;color:#1a1e2c">Dear ${d.name || 'there'},</p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        Thank you for contacting Nurse Health Concierge about care for your loved one.
        We have reviewed your consultation request and would like to discuss how we can help.
      </p>
      <p style="font-size:14px;color:#4a4e5c;line-height:1.7">
        One of our team members will be reaching out to you shortly at your preferred contact method.
        If you need to reach us sooner, please reply to this email or call us directly.
      </p>
    `),
  },
};

function getTemplate(key) {
  return TEMPLATES[key] || null;
}

function listTemplates() {
  return Object.entries(TEMPLATES).map(([key, t]) => ({
    key,
    name: t.name,
  }));
}

module.exports = { getTemplate, listTemplates };
