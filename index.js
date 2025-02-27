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


config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

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