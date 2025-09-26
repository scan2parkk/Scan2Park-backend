const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
   // OTP-related fields
  otp: { type: String },             // store generated OTP
  otpExpiry: { type: Date },         // OTP expiry time
  isVerified: { type: Boolean, default: false }, // whether email is verified
});

module.exports = mongoose.model('User', userSchema);