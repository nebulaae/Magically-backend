import express from 'express';
import { auth } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

// Register new user
router.post('/register', asyncHandler(authController.register));

// Login user
router.post('/login', asyncHandler(authController.login));

// Logout user
router.post('/logout', asyncHandler(authController.logout));

// Get current authenticated user
router.get('/me', auth, asyncHandler(authController.getMe));

export default router;