import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Existing fields...
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Always convert email to lowercase
    trim: true, // Remove whitespace from both ends
  },
  password: { type: String, required: true },
  profilePicture: { type: String, default: '' }, // Field for the profile image path, optional
  verificationCode: { type: String }, // Field for the email verification code
  emailVerified: { type: Boolean, default: false }, // Field to indicate if the email has been verified
  resetPasswordToken: { type: String }, // Field for the password reset token
  resetPasswordExpire: { type: Date }, // Field for the expiration time of the password reset token
  createdAt: { type: Date, default: Date.now },
  likedShops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }], // Reference to the Shop model
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },

  // New field for hierarchical representation
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

// Virtual field for children
UserSchema.virtual('children', {
  ref: 'User',
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
});

// Include virtuals in JSON and object outputs
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', UserSchema);

export default User;
