// models/Transaction.js
import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  wallet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Wallet', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['earned', 'waiting', 'approved', 'withdrawn'], 
    required: true 
  },
  amount: { type: mongoose.Types.Decimal128, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // New field
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
}, { 
  timestamps: true 
});

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

export default Transaction;
