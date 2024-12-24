import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true, // Ensure one wallet per user
  },
  moneyEarned: { type: mongoose.Types.Decimal128, default: '0.00' },
  moneyWaiting: { type: mongoose.Types.Decimal128, default: '0.00' },
  moneyApproved: { type: mongoose.Types.Decimal128, default: '0.00' },
  cashWithdrawn: { type: mongoose.Types.Decimal128, default: '0.00' },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt fields
});

// Avoid overwriting the model if it already exists
const Wallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);

export default Wallet;
