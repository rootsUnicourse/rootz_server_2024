// routes/walletRoutes.js
import express from "express";
import walletController from "../controllers/walletController.js"; // Ensure file extension is included

const router = express.Router();

// Get wallet by user ID
router.get("/", walletController.getWallet);

// Update wallet (e.g., add money, withdraw)
router.put("/", walletController.updateWallet);

// Get transactions for a wallet
router.get("/transactions", walletController.getTransactions);

// Add a new transaction
router.post("/transactions", walletController.addTransaction);

// Simulate a purchase
router.post("/purchase", walletController.simulatePurchase);

export default router;
