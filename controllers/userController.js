import User from '../modules/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import CompanyObject from '../modules/company.js';

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    // Set token validity for 1 hour
    const resetTokenExpire = Date.now() + 3600000; // 1 hour in milliseconds
    // Update user with reset token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    // Set up mail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // For Gmail, or use another service
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.APP_PASSWORD, // Your email account password
      },
    });

    // Define mail options
    const mailOptions = {
      from: process.env.EMAIL, // Sender address
      to: user.email, // Recipient address
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested a password reset. Please click on the following link, or paste this into your browser to complete the process:</p>
        <a href="http://localhost:3001/password-reset/${resetToken}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending password reset email: ', error);
        throw error;
      } else {
        console.log('Password reset email sent: ' + info.response);
        res.status(200).json({ message: 'Password reset email sent.' });
      }
    });
  } catch (error) {
    console.error('requestPasswordReset error:', error);
    res.status(500).json({ message: 'Error requesting password reset.' });
  }
};

const submitNewPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    // Find user by resetPasswordToken
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }, // Check if the token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear the resetPasswordToken and resetPasswordExpire fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been updated successfully.' });
  } catch (error) {
    console.error('submitNewPassword error:', error);
    res.status(500).json({ message: 'Error resetting password.' });
  }
};

const likeCompany = async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from the authenticated user
    const { companyId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.likedCompanies.includes(companyId)) {
      console.log("yes");

      // If the company is already liked, unlike it
      console.log('Before filter:', user.likedCompanies);
      user.likedCompanies = user.likedCompanies.filter(
        (id) => id.toString() !== companyId.toString()
      );
      console.log('After filter:', user.likedCompanies);


      await user.save();
      return res.status(200).json({ message: 'Company unliked successfully', likedCompanies: user.likedCompanies });
    }

    // If the company is not liked, add it to the liked companies
    user.likedCompanies.push(companyId);
    await user.save();

    res.status(200).json({ message: 'Company liked successfully', likedCompanies: user.likedCompanies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getLikedCompanies = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate('likedCompanies');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.likedCompanies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAllUsers,
  requestPasswordReset,
  submitNewPassword,
  getLikedCompanies,
  likeCompany
};
