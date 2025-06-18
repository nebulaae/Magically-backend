import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';

import db from './config/database';

// Import model associations setup
import { setupAssociations } from './models/associations';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user'; // <-- IMPORT NEW USER ROUTES

dotenv.config()

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the 'public' directory
// This is crucial for making avatars accessible via URL
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // <-- USE NEW USER ROUTES

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Setup model associations
    setupAssociations();

    // Sync database models
    // Using { alter: true } is good for development as it will add new columns
    // without dropping tables. For production, consider using migrations.
    await db.sync({ alter: true });
    console.log('Database synchronized');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();