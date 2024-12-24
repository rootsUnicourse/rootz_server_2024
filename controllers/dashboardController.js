import Wallet from '../modules/Wallet.js';
import Transaction from '../modules/transaction.js';
import Shop from '../modules/shop.js';
import User from '../modules/User.js';
import SiteStats from "../modules/siteStats.js"; // Ensure this model exists

// Fetch dashboard data
export const getDashboardData = async (req, res) => {
  try {
    // Fetch site visits from the database
    const siteStats = await SiteStats.findOne({ key: "siteVisits" });
    const siteVisits = siteStats?.value || 0; // Default to 0 if not found

    // Wallet statistics
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalEarned: { $sum: "$moneyEarned" },
          totalWaiting: { $sum: "$moneyWaiting" },
          totalApproved: { $sum: "$moneyApproved" },
          totalWithdrawn: { $sum: "$cashWithdrawn" },
        },
      },
    ]);

    // Top-performing shops
    const topShops = await Shop.find().sort({ clickCount: -1 }).limit(5);

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ date: -1 })
      .limit(10);

    // User growth
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Respond with the data
    res.status(200).json({
      siteVisits,
      walletStats: walletStats[0] || {},
      topShops,
      recentTransactions,
      userGrowth,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const incrementSiteVisits = async (req, res) => {
    try {
      // Increment siteVisits without session tracking
      const siteStats = await SiteStats.findOneAndUpdate(
        { key: "siteVisits" }, // Find the document with key "siteVisits"
        { $inc: { value: 1 } }, // Increment the value by 1
        { new: true, upsert: true } // Create the document if it doesn't exist
      );
  
      res.status(200).json(siteStats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

  

