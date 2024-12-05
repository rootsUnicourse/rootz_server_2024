import User from '../modules/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Transaction from '../modules/transaction.js';


const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enrichUserWithEarnings = async (user, walletId) => {
  // Calculate earnings from this user
  const earnings = await Transaction.aggregate([
    {
      $match: {
        wallet: new mongoose.Types.ObjectId(walletId),
        fromUser: new mongoose.Types.ObjectId(user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalEarned: { $sum: '$amount' },
      },
    },
  ]);

  const totalEarned =
    earnings.length > 0
      ? earnings[0].totalEarned
      : mongoose.Types.Decimal128.fromString('0');

  // Recursively enrich children
  let enrichedChildren = [];
  if (user.children && user.children.length > 0) {
    enrichedChildren = await Promise.all(
      user.children.map(async (child) => {
        // Populate child's children
        const populatedChild = await User.findById(child._id).populate('children');
        return await enrichUserWithEarnings(populatedChild, walletId);
      })
    );
  }

  // Return enriched user
  return {
    ...user.toObject(),
    amountEarnedFromChild: totalEarned,
    children: enrichedChildren,
  };
};

// Get user profile with family tree
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user and populate immediate children
    const user = await User.findById(userId)
      .populate('wallet')
      .populate('children');

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Enrich user with earnings from descendants
    const enrichedUser = await enrichUserWithEarnings(user, user.wallet._id);

    res.json({ user: enrichedUser });
  } catch (error) {
    console.error('getProfile error:', error);
    res
      .status(500)
      .json({ message: 'Error fetching profile', error: error.message });
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
      from: "Rootz", // Sender address
      to: user.email, // Recipient address
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested a password reset. Please click on the following link, or paste this into your browser to complete the process:</p>
        <a href="${process.env.BASE_URL}/password-reset/${resetToken}">Reset Password</a>
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

const likeShop = async (req, res) => {
  try {
    const userId = req.user.userId; // Get user ID from the authenticated user
    const { shopId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.likedShops.includes(shopId)) {
      // If the shop is already liked, unlike it
      user.likedShops = user.likedShops.filter(
        (id) => id.toString() !== shopId.toString()
      );
      await user.save();
      return res.status(200).json({ message: 'Shop unliked successfully', likedShops: user.likedShops });
    }

    // If the shop is not liked, add it to the liked shops
    user.likedShops.push(shopId);
    await user.save();

    res.status(200).json({ message: 'Shop liked successfully', likedShops: user.likedShops });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLikedShops = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate('likedShops');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.likedShops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAllUsers,
  getProfile, // Export the new getProfile function
  requestPasswordReset,
  submitNewPassword,
  getLikedShops,
  likeShop,
};
