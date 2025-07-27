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
