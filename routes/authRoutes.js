import express from 'express';
import authController from '../controllers/authController.js'; // Ensure file extension is included

const router = express.Router();

// Register a new user
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Email verification
router.post('/verify-email', authController.verifyEmail);

// New route for Google authentication
router.post('/google-login', authController.googleLogin);

export default router;
