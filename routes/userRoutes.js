import express from 'express';
import userController from '../controllers/userController.js'; // Ensure file extension is included

const router = express.Router();

// Route to request a password reset
router.post('/request-password-reset', userController.requestPasswordReset);

// Route to submit a new password
router.post('/submit-new-password', userController.submitNewPassword);

export default router;
