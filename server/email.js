import nodemailer from 'nodemailer';

// Create transporter using environment variables
const createTransporter = () => {
  // Use Gmail SMTP or another service
  // For Gmail, you'll need to use an App Password (not your regular password)
  // Go to Google Account > Security > 2-Step Verification > App passwords
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export async function sendAnalyticsAccessNotification() {
  // Skip if email not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping analytics access notification');
    return;
  }

  try {
    const transporter = createTransporter();

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'long',
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'sgellman@gmail.com',
      subject: 'RepairCoach Analytics Access',
      text: `Someone just accessed repaircoach.ai analytics\n\nTime: ${timestamp}`,
      html: `
        <h2>Analytics Access Notification</h2>
        <p>Someone just accessed repaircoach.ai analytics</p>
        <p><strong>Time:</strong> ${timestamp}</p>
      `,
    });

    console.log('Analytics access notification email sent');
  } catch (error) {
    console.error('Error sending analytics notification email:', error);
  }
}
