// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserRole = Object.freeze({
  STARTUP: 'STARTUP',
  EXPERT: 'EXPERT',
  S2T: 'S2T'
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.STARTUP },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  profilePhoto: { type: String, default: '' },
  
  // ✅ Password Reset Fields
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  passwordResetAttempts: { type: Number, default: 0 },
  lastPasswordResetRequest: { type: Date, default: null }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to generate reset token
userSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  this.passwordResetAttempts += 1;
  this.lastPasswordResetRequest = new Date();
  
  return resetToken;
};

// Method to verify reset token
userSchema.methods.verifyResetToken = function(token) {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.resetPasswordToken === hashedToken && 
         this.resetPasswordExpires > Date.now();
};

const User = mongoose.model('User', userSchema);
module.exports = { User, UserRole };
