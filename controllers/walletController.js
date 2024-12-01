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

    // Start a mongoose session
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Map to store wallet updates
      const walletUpdates = {};

      // Helper function to accumulate commissions
      const accumulateCommission = (walletId, commission) => {
        if (!walletUpdates[walletId]) {
          walletUpdates[walletId] = {
            commission: new Decimal(0),
            wallet: null,
            transactions: [],
          };
        }
        walletUpdates[walletId].commission = walletUpdates[walletId].commission.plus(commission);
      };

      // Accumulate commissions for each wallet
      accumulateCommission(buyerWallet._id.toString(), buyerCommission);
      accumulateCommission(fatherWallet._id.toString(), fatherCommission);
      accumulateCommission(grandfatherWallet._id.toString(), grandfatherCommission);
      accumulateCommission(companyWallet._id.toString(), companyCommission);

      // Prepare transaction data
      const transactionData = [];

      // Buyer transaction
      transactionData.push({
        walletId: buyerWallet._id.toString(),
        transaction: {
          type: 'earned',
          amount: buyerCommission,
          description: `Cashback from purchase at ${shop.title}`,
          shop: shop._id,
          status: 'Completed',
        },
      });

      // Father transaction
      transactionData.push({
        walletId: fatherWallet._id.toString(),
        transaction: {
          type: 'earned',
          amount: fatherCommission,
          description: `Commission from your child ${user.name}'s purchase at ${shop.title}`,
          fromUser: user._id,
          shop: shop._id,
          status: 'Completed',
        },
      });

      // Grandfather transaction
      transactionData.push({
        walletId: grandfatherWallet._id.toString(),
        transaction: {
          type: 'earned',
          amount: grandfatherCommission,
          description: `Commission from your grandchild ${user.name}'s purchase at ${shop.title}`,
          fromUser: user._id,
          shop: shop._id,
          status: 'Completed',
        },
      });

      // Company transaction
      transactionData.push({
        walletId: companyWallet._id.toString(),
        transaction: {
          type: 'earned',
          amount: companyCommission,
          description: `Commission from user ${user.name}'s purchase at ${shop.title}`,
          fromUser: user._id,
          shop: shop._id,
          status: 'Completed',
        },
      });

      // Fetch all unique wallets involved
      const uniqueWalletIds = [...new Set(Object.keys(walletUpdates))];
      const wallets = await Wallet.find({ _id: { $in: uniqueWalletIds } }).session(session);

      // Map wallets by their IDs
      wallets.forEach((wallet) => {
        walletUpdates[wallet._id.toString()].wallet = wallet;
      });

      // Update wallets and create transactions
      for (const data of transactionData) {
        const { walletId, transaction } = data;
        const walletUpdate = walletUpdates[walletId];

        // Create transaction
        const newTransaction = new Transaction({
          wallet: walletId,
          ...transaction,
          amount: mongoose.Types.Decimal128.fromString(transaction.amount.toFixed(2)),
        });
        await newTransaction.save({ session });

        // Add transaction to wallet
        walletUpdate.wallet.transactions.push(newTransaction._id);
        walletUpdate.transactions.push(newTransaction);
      }

      // Update moneyEarned for each wallet
      for (const walletId of uniqueWalletIds) {
        const walletUpdate = walletUpdates[walletId];
        const wallet = walletUpdate.wallet;
        const currentMoneyEarned = wallet.moneyEarned
          ? new Decimal(wallet.moneyEarned.toString())
          : new Decimal(0);
        const newMoneyEarned = currentMoneyEarned.plus(walletUpdate.commission);
        wallet.moneyEarned = mongoose.Types.Decimal128.fromString(newMoneyEarned.toFixed(2));

        await wallet.save({ session });
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ message: "Purchase simulated successfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('simulatePurchase transaction error:', error);
      res.status(500).json({ message: 'Error during transaction', error: error.message });
    }
  } catch (error) {
    console.error('simulatePurchase error:', error);
    res.status(500).json({ message: 'Error simulating purchase', error: error.message });
  }
};

export const getTransactionsByPage = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Extract page and limit from query params
    const wallet = await Wallet.findOne({ user: req.user.userId }).populate({
      path: 'transactions',
      options: {
        sort: { date: -1 }, // Sort transactions by date in descending order
        skip: (page - 1) * limit, // Skip documents for pagination
        limit: parseInt(limit), // Limit the number of documents
      },
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    const totalTransactions = await Transaction.countDocuments({ wallet: wallet._id }); // Count total transactions
    res.json({
      transactions: wallet.transactions,
      total: totalTransactions,
      page: parseInt(page),
      pages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



export default {
  getWallet,
  updateWallet,
  getTransactions,
  addTransaction,
  simulatePurchase,
  getTransactionsByPage
};
