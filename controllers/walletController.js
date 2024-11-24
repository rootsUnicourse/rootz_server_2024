// controllers/walletController.js
import Wallet from "../modules/wallet.js";
import Transaction from "../modules/transaction.js";

// Get wallet details for the logged-in user
export const getWallet = async (req, res) => {
  try {
    
    const wallet = await Wallet.findOne({ user: req.user.userId }).populate("transactions");
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update wallet (e.g., add money, withdraw money)
export const updateWallet = async (req, res) => {
  try {
    const { moneyEarned, moneyWaiting, moneyApproved, cashWithdrawn } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Update the wallet fields
    wallet.moneyEarned += moneyEarned || 0;
    wallet.moneyWaiting += moneyWaiting || 0;
    wallet.moneyApproved += moneyApproved || 0;
    wallet.cashWithdrawn += cashWithdrawn || 0;

    await wallet.save();
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get transactions for the logged-in user's wallet
export const getTransactions = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.userId }).populate("transactions");
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    res.json(wallet.transactions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Add a new transaction
export const addTransaction = async (req, res) => {
  try {
    const { date, description, amount, status } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Create a new transaction
    const transaction = new Transaction({
      date,
      description,
      amount,
      status,
    });

    await transaction.save();

    // Add transaction to wallet
    wallet.transactions.push(transaction);
    await wallet.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export default {
  getWallet,
  updateWallet,
  getTransactions,
  addTransaction,
};
