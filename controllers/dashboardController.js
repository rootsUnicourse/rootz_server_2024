import Wallet from '../modules/wallet.js';
import Transaction from '../modules/transaction.js';
import Shop from '../modules/shop.js';
import User from '../modules/User.js';
import SiteStats from "../modules/siteStats.js";
import geoip from "geoip-lite"; // For location tracking
import os from "os"; // For fetching computer name (optional)

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
    const sessionId = req.headers["x-session-id"];
    const { userId } = req.body;
    console.log(userId);
    
    let visitor = {};

    // Check if the session is already tracked
    if (sessionId) {
      const sessionExists = await SiteStats.findOne({ "visitors.sessionId": sessionId });
      if (sessionExists) {
        return res.status(200).json({ message: "Visit already tracked for this session." });
      }
    }

    // Collect visitor details
    if (userId) {
      const user = await User.findById(userId);
      visitor = { userId: user._id, userName: user.name, userEmail: user.email };
    } else {
      // Handle guest user
      visitor = { userName: "Guest" };
    }

    const siteStats = await SiteStats.findOneAndUpdate(
      { key: "siteVisits" },
      {
        $inc: { value: 1 },
        $push: { visitors: { ...visitor, timestamp: new Date(), sessionId } },
      },
      { new: true, upsert: true }
    );

    res.status(200).json(siteStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getVisitors = async (req, res) => {
  try {
    const siteStats = await SiteStats.findOne({ key: "siteVisits" }).select("visitors");
    res.status(200).json(siteStats?.visitors || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




