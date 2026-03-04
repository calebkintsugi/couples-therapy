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

export async function sendSubscriptionConfirmation({ email, coupleCode, trialEndDate }) {
  // Skip if email not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured - skipping subscription confirmation');
    return;
  }

  if (!email) {
    console.log('No email provided - skipping subscription confirmation');
    return;
  }

  try {
    const transporter = createTransporter();

    const trialEndFormatted = new Date(trialEndDate).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const manageUrl = 'https://repaircoach.ai';

    await transporter.sendMail({
      from: `"RepairCoach" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to RepairCoach - Your Free Trial Has Started',
      text: `
Welcome to RepairCoach!

Your 24-hour free trial has started. You won't be charged today.

Your couple code: ${coupleCode}
Save this code to return to your results anytime.

Your trial ends: ${trialEndFormatted}
After your trial, you'll be charged $4.90/month.

To cancel anytime, visit ${manageUrl} and click "Manage Subscription" on your results page.

Questions? Reply to this email.

— The RepairCoach Team
      `.trim(),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7c5c6b; margin-bottom: 24px;">Welcome to RepairCoach!</h1>

          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your 24-hour free trial has started. <strong>You won't be charged today.</strong>
          </p>

          <div style="background: #f9f5f7; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Your couple code:</p>
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #7c5c6b; letter-spacing: 2px;">${coupleCode}</p>
            <p style="margin: 8px 0 0 0; color: #666; font-size: 13px;">Save this code to return to your results anytime.</p>
          </div>

          <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Your trial ends:</p>
            <p style="margin: 0; font-size: 16px; color: #333;"><strong>${trialEndFormatted}</strong></p>
            <p style="margin: 12px 0 0 0; color: #666; font-size: 14px;">After your trial, you'll be charged $4.90/month.</p>
          </div>

          <div style="margin: 32px 0; padding: 20px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Need to cancel?</strong><br>
              Visit <a href="${manageUrl}" style="color: #7c5c6b;">repaircoach.ai</a>, go to your results page, and click "Manage Subscription" to cancel anytime — no questions asked.
            </p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 32px;">
            Questions? Just reply to this email.
          </p>

          <p style="font-size: 14px; color: #999; margin-top: 24px;">
            — The RepairCoach Team
          </p>
        </div>
      `,
    });

    console.log(`Subscription confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
  }
}

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
