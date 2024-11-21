// models/Wallet.js
import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // Ensure one wallet per user
  },
  moneyEarned: { type: Number, default: 0 },
  moneyWaiting: { type: Number, default: 0 },
  moneyApproved: { type: Number, default: 0 },
  cashWithdrawn: { type: Number, default: 0 },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }]
}, {
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

const Wallet = mongoose.model('Wallet', WalletSchema);

export default Wallet;
