import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Always convert email to lowercase
    trim: true, // Remove whitespace from both ends
  },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' }, // New field for the profile image path, optional
  verificationCode: { type: String, required: false }, // Field for the email verification code
  emailVerified: { type: Boolean, default: false }, // Field to indicate if the email has been verified
  resetPasswordToken: { type: String, required: false }, // Field for the password reset token
  resetPasswordExpire: { type: Date, required: false }, // Field for the expiration time of the password reset token
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

export default User;
