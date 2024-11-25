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
  // New fields to store commission breakdown
  commissions: {
    buyer: { type: mongoose.Types.Decimal128, required: true },
    father: { type: mongoose.Types.Decimal128, default: '0.00' },
    grandfather: { type: mongoose.Types.Decimal128, default: '0.00' },
    company: { type: mongoose.Types.Decimal128, required: true },
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
}, { 
  timestamps: true 
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
