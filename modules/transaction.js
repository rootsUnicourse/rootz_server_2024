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
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
