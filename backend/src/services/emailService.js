// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS  // Your Gmail App Password
  }
});

async function sendResetEmail(to, resetLink) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'SynergyPark Password Reset',
    html: `<p>You requested a password reset for your SynergyPark account.</p>
           <p>Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>If you did not request this, please ignore this email.</p>`
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendResetEmail };
