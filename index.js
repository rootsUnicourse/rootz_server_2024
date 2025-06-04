import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from 'dotenv';
import shopRoutes from './routes/shopRoutes.js';
import usersRoute from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from "./routes/walletRoutes.js";
import { isAuthenticated } from './middleware/authMiddleware.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limiters configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 requests per hour
  message: 'Too many requests from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

// Prevent directory listing
app.use((req, res, next) => {
  if (req.path.endsWith('/') && req.path !== '/') {
    res.status(403).send('Directory listing is not allowed');
  } else {
    next();
  }
});

// Serve static files with directory listing disabled
app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'deny',
  index: false,
  redirect: false
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Apply rate limiting to routes
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/request-password-reset', authLimiter);

// Apply general rate limiting to API routes
app.use('/shops', apiLimiter);
app.use('/users', apiLimiter);
app.use('/wallet', apiLimiter);
app.use('/dashboard', apiLimiter);

// Apply stricter limits to sensitive operations
app.use('/wallet/withdraw', strictLimiter);
app.use('/users/profile/update', strictLimiter);

// Define routes
app.use('/shops', shopRoutes);
app.use('/users', usersRoute);
app.use('/auth', authRoutes);
app.use("/wallet", isAuthenticated, walletRoutes);
app.use('/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Hello, Rootz!');
});