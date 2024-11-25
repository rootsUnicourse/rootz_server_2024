import Wallet from "../modules/wallet.js";
import Transaction from "../modules/transaction.js";
import User from "../modules/User.js";
import Shop from "../modules/Shop.js";
import mongoose from 'mongoose';
import Decimal from 'decimal.js';

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

export const simulatePurchase = async (req, res) => {
  try {
    const userId = req.user.userId; // Authenticated user
    const { shopId } = req.body; // Shop ID from request body

    // Find user and shop
    const user = await User.findById(userId).populate('parent');
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Simulate a $10 purchase
    const purchaseAmount = new Decimal(10.00);

    // Extract discount percentage (e.g., "8%")
    const discountMatch = shop.discount.match(/([\d.]+)%/);
    if (!discountMatch) {
      return res.status(400).json({ message: "Invalid shop discount format" });
    }
    const discountPercentage = new Decimal(discountMatch[1]);

    // Calculate total cashback
    const totalCashback = purchaseAmount.mul(discountPercentage).div(100);

    // Distribute commissions
    const buyerCommission = totalCashback.mul(0.5);
    const fatherCommission = totalCashback.mul(0.25);
    const grandfatherCommission = totalCashback.mul(0.125);
    const companyCommission = totalCashback.mul(0.125);

    // Fetch father and grandfather
    let father = user.parent;
    let grandfather = null;
    if (father) {
      grandfather = await User.findById(father.parent);
    }

    // Fetch Rootz user
    const rootzUser = await User.findOne({ email: 'amit@rootz.website' });
    if (!rootzUser) {
      return res.status(500).json({ message: "Rootz user not found" });
    }

    // If father doesn't exist, Rootz is the father
    if (!father) {
      father = rootzUser;
    }

    // If grandfather doesn't exist, Rootz is the grandfather
    if (!grandfather) {
      grandfather = rootzUser;
    }

    // Fetch wallets
    const buyerWallet = await Wallet.findOne({ user: user._id });
    const fatherWallet = await Wallet.findOne({ user: father._id });
    const grandfatherWallet = await Wallet.findOne({ user: grandfather._id });
    const companyWallet = await Wallet.findOne({ user: rootzUser._id });

    // Ensure wallets exist
    if (!buyerWallet || !fatherWallet || !grandfatherWallet || !companyWallet) {
      return res.status(500).json({ message: "One or more wallets not found" });
    }

    // Update wallets
    // We'll use mongoose session to handle transactions
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Update buyer's wallet
      buyerWallet.moneyEarned = new Decimal(buyerWallet.moneyEarned.toString()).add(buyerCommission).toString();
      await buyerWallet.save({ session });

      // Update father's wallet
      fatherWallet.moneyEarned = new Decimal(fatherWallet.moneyEarned.toString()).add(fatherCommission).toString();
      await fatherWallet.save({ session });

      // Update grandfather's wallet
      grandfatherWallet.moneyEarned = new Decimal(grandfatherWallet.moneyEarned.toString()).add(grandfatherCommission).toString();
      await grandfatherWallet.save({ session });

      // Update company's wallet
      companyWallet.moneyEarned = new Decimal(companyWallet.moneyEarned.toString()).add(companyCommission).toString();
      await companyWallet.save({ session });

      // Create transaction for buyer
      const transaction = new Transaction({
        wallet: buyerWallet._id,
        type: 'earned',
        amount: mongoose.Types.Decimal128.fromString(buyerCommission.toFixed(2)),
        description: `Cashback from purchase at ${shop.title}`,
        commissions: {
          buyer: mongoose.Types.Decimal128.fromString(buyerCommission.toFixed(2)),
          father: mongoose.Types.Decimal128.fromString(fatherCommission.toFixed(2)),
          grandfather: mongoose.Types.Decimal128.fromString(grandfatherCommission.toFixed(2)),
          company: mongoose.Types.Decimal128.fromString(companyCommission.toFixed(2)),
        },
        shop: shop._id,
      });

      await transaction.save({ session });

      // Add transaction to buyer's wallet
      buyerWallet.transactions.push(transaction._id);
      await buyerWallet.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ message: "Purchase simulated successfully", transaction });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

  } catch (error) {
    console.error('simulatePurchase error:', error);
    res.status(500).json({ message: 'Error simulating purchase', error: error.message });
  }
};

export default {
  getWallet,
  updateWallet,
  getTransactions,
  addTransaction,
  simulatePurchase, 
};
