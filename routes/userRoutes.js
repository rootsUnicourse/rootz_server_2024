import express from 'express';
import userController from '../controllers/userController.js'; // Ensure file extension is included
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to request a password reset
router.post('/request-password-reset', userController.requestPasswordReset);

// Route to submit a new password
router.post('/submit-new-password', userController.submitNewPassword);

// Route to like a shop
router.post('/like-shop', isAuthenticated, userController.likeShop);

// Route to get liked shops
router.get('/liked-shops', isAuthenticated, userController.getLikedShops);

// Get user profile
router.get('/profile', isAuthenticated, userController.getProfile);

export default router;
