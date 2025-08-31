<<<<<<< HEAD
// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: 'khalilca1620@gmail.com', // Your Gmail address
    pass: 'wkoa mmec ethv kmam'     // Your Gmail App Password
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000      // 60 seconds
});

async function sendResetEmail(to, resetLink) {
  const mailOptions = {
    from: 'khalilca1620@gmail.com', // Use the same email here
    to,
    subject: 'SynergyPark Password Reset',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">SynergyPark Password Reset</h2>
        <p>You requested a password reset for your SynergyPark account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p><strong>Note:</strong> This link will expire in 15 minutes for security reasons.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated message from SynergyPark. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    console.log(`📧 Attempting to send reset email to: ${to}`);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Reset email sent successfully:', result.messageId);
    return result;
  } catch (err) {
    console.error('❌ Failed to send reset email:', err);
    throw err;
  }
}

// Test email connection
async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (err) {
    console.error('❌ Email service configuration error:', err);
    return false;
  }
}

module.exports = { sendResetEmail, testEmailConnection };
=======
// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail App Password
  }
});

// To send real emails, set EMAIL_USER and EMAIL_PASS in your environment.
// EMAIL_USER should be your Gmail address (or SMTP user), EMAIL_PASS should be a Gmail App Password (not your Gmail login password).
// In development, if these are not set, the reset link will be logged to the console for testing.
async function sendResetEmail(to, resetLink) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // Fallback for development: log the reset link
    console.log('\n==============================');
    console.log('[DEV] Password reset link for', to, ':');
    console.log(resetLink);
    console.log('==============================\n');
    return Promise.resolve();
  }
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'SynergyPark Password Reset',
    html: `<p>You requested a password reset for your SynergyPark account.</p>
           <p>Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>If you did not request this, please ignore this email.</p>`
  };
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send reset email:', err);
    // In development, do not throw, just log
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] (Email not sent) Password reset link for ${to}: ${resetLink}`);
      return Promise.resolve();
    }
    throw err;
  }
}

module.exports = { sendResetEmail };
>>>>>>> khalil
