const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export async function sendEnquiryNotification(data) {
  try {
    const { name, email, phone, message, program, studentAge, preferredTime, formType } = data;
    const isGeneral = program === 'General Enquiry' || formType === 'General Enquiry';

    const { BREVO_API_KEY: apiKey, BREVO_SENDER_EMAIL: senderEmail, BREVO_SENDER_NAME: senderName } = process.env;
    const to = process.env.CONTACT_RECEIVER_EMAIL || senderEmail;
    if (!apiKey || !senderEmail || /your_|changeme/i.test(`${apiKey}${senderEmail}`)) {
      return { skipped: 'Brevo is not configured; enquiry saved without notification email' };
    }
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName || 'Global EduTech Website' },
        to: [{ email: to }],
        replyTo: email ? { email } : undefined,
        subject: isGeneral ? `New General Enquiry - ${name}` : `New Program Enquiry - ${program}`,
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2485C4; border-bottom: 2px solid #2485C4; padding-bottom: 10px;">
            ${isGeneral ? 'New General Enquiry' : 'New Program Enquiry'}
          </h2>
          <p><strong>Type:</strong> ${esc(formType || 'Program Enquiry')}</p>
          <p><strong>Program:</strong> ${esc(program)}</p>
          <p><strong>Name:</strong> ${esc(name)}</p>
          <p><strong>Email:</strong> ${esc(email)}</p>
          <p><strong>Phone:</strong> ${esc(phone)}</p>
          ${studentAge ? `<p><strong>Student Age:</strong> ${esc(studentAge)}</p>` : ''}
          ${preferredTime ? `<p><strong>Preferred Time:</strong> ${esc(preferredTime)}</p>` : ''}
          <p><strong>Message:</strong></p>
          <div style="background-color: #f7f7f7; padding: 15px; border-left: 4px solid #2485C4; margin: 10px 0;">
            ${esc(message).replace(/\n/g, '<br>')}
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">Sent automatically from the Global EduTech website enquiry form.</p>
        </div>`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status}`);
    return { sent: true };
  } catch (error) {
    // Never fail the form submission because of email problems
    console.error('Failed to send email notification:', error);
    return { error: 'Email notification failed but form data was saved' };
  }
}
