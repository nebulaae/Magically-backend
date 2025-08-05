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
import userRoutes from './routes/user';
import klingRoutes from './routes/kling';
import galleryRoutes from './routes/gallery';
import commentRoutes from './routes/comment';
import higgsfieldRoutes from './routes/higgsfield';
import publicationRoutes from './routes/publication';

dotenv.config()

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/kling', klingRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/higgsfield', higgsfieldRoutes);
app.use('/api/publications', publicationRoutes);

// Initialize database and start server
const startServer = async () => {
  try {
    // Setup model associations
    setupAssociations();

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