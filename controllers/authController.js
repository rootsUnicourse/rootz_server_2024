import User from '../modules/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import Wallet from "../modules/wallet.js";

const client = new OAuth2Client(process.env.CLIENT_ID);

const register = async (req, res) => {
  try {
    const { name, email, password, parentId } = req.body; // Accept parentId
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a random verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit code

    let parentUser;

    // Check if the user being registered is the root user
    if (email.toLowerCase().trim() === 'amit@rootz.website') {
      // Root user does not have a parent
      parentUser = null;
    } else if (parentId) {
      // Find the parent user by parentId
      parentUser = await User.findById(parentId);
      if (!parentUser) {
        return res.status(400).json({ message: 'Invalid parent ID.' });
      }
    } else {
      // Assign rootz as the parent
      parentUser = await User.findOne({ email: 'amit@rootz.website' });
      if (!parentUser) {
        // Create the rootz user if it doesn't exist
        parentUser = new User({
          name: 'Rootz',
          email: 'amit@rootz.website',
          password: await bcrypt.hash('rootzpassword', 12), // Use a secure password
          emailVerified: true,
        });
        await parentUser.save();
      }
    }

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      verificationCode, // Store this code with the user record
      emailVerified: false, // Initially, the user is not verified
      parent: parentUser ? parentUser._id : undefined, // Set the parent if not null
    });

    await newUser.save();

    // Create an empty wallet for the new user
    const newWallet = await Wallet.create({
      user: newUser._id, // Link wallet to the new user
      moneyEarned: 0,
      moneyWaiting: 0,
      moneyApproved: 0,
      cashWithdrawn: 0,
      transactions: [],
    });

    // Link the wallet to the user
    newUser.wallet = newWallet._id;
    await newUser.save();

    // Send the verification email with the code
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ message: 'User registered. Please check your email to verify your account.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendVerificationEmail = async (userEmail, verificationCode) => {
  try {
    // Set up mail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // For Gmail, or use another service
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.APP_PASSWORD, // Your email account password
      },
    });

    const mailOptions = {
      from: "Rootz", // Sender address
      to: userEmail, // Recipient address
      subject: 'Verify Your Email Address',
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for registering. Please verify your email address by entering the following code in the application:</p>
        <p><b>${verificationCode}</b></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    // Send verification email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('sendVerificationEmail error:', error);
    throw error; // Ensure this error is caught or handled where the function is called
  }
};

// Email verification
const verifyEmail = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.verificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.emailVerified = true; // Mark the user as verified
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials!' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Google login
const googleLogin = async (req, res) => {
  const { tokenId, parentId } = req.body; // Accept parentId

  try {
    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });

    const payload = ticket.getPayload(); // Get user info from the payload

    // Normalize the email
    const email = payload['email'].toLowerCase().trim();

    // Check if the user exists in the database
    let user = await User.findOne({ email });

    if (!user) {
      // If the user does not exist, proceed to create a new user

      let parentUser;

      // Determine the parent user
      if (parentId) {
        parentUser = await User.findById(parentId);
        if (!parentUser) {
          return res.status(400).json({ message: 'Invalid parent ID.' });
        }
      } else if (email === 'amit@rootz.website') {
        // Root user does not have a parent
        parentUser = null;
      } else {
        // Assign rootz as the parent
        parentUser = await User.findOne({ email: 'amit@rootz.website' });
        if (!parentUser) {
          // Create the rootz user if it doesn't exist
          parentUser = new User({
            name: 'Rootz',
            email: 'amit@rootz.website',
            password: await bcrypt.hash('rootzpassword', 12),
            emailVerified: true,
          });
          await parentUser.save();
        }
      }

      // Create a new user with information from Google
      user = new User({
        name: `${payload['given_name']} ${payload['family_name']}`,
        email: email,
        emailVerified: true, // Email is verified by Google
        profilePicture: payload['picture'], // Use Google profile picture if available
        password: 'google auth',
        parent: parentUser ? parentUser._id : undefined, // Set the parent if not null
      });

      await user.save();

      // Create an empty wallet for the new user
      const newWallet = await Wallet.create({
        user: user._id, // Link wallet to the new user
        moneyEarned: 0,
        moneyWaiting: 0,
        moneyApproved: 0,
        cashWithdrawn: 0,
        transactions: [],
      });

      // Link the wallet to the user
      user.wallet = newWallet._id;
      await user.save();
    } else {
      // If the user exists, proceed with login

      // Update user's profile picture if it's not already set
      if (!user.profilePicture) {
        user.profilePicture = payload['picture'];
        await user.save();
      }

      // Ensure the user has a wallet; if not, create one
      if (!user.wallet) {
        const existingWallet = await Wallet.findOne({ user: user._id });
        if (existingWallet) {
          user.wallet = existingWallet._id;
          await user.save();
        } else {
          const newWallet = await Wallet.create({
            user: user._id,
            moneyEarned: 0,
            moneyWaiting: 0,
            moneyApproved: 0,
            cashWithdrawn: 0,
            transactions: [],
          });
          user.wallet = newWallet._id;
          await user.save();
        }
      }
    }

    // Generate a token for the session
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '2h' });

    // Respond with the token and user information
    res.json({ token, user });
  } catch (error) {
    console.error('googleLogin error:', error);
    res.status(500).json({ message: error.message });
  }
};



export default {
  register,
  googleLogin,
  login,
  verifyEmail,
};
