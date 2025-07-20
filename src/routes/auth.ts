import express from 'express';
import { auth } from '../middleware/auth';
import * as authController from '../controllers/authController';

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

// Multi-step registration routes
router.post('/register-step-1', asyncHandler(authController.registerStep1));
router.post('/register-step-2', asyncHandler(authController.registerStep2));
router.post('/register-step-3', asyncHandler(authController.registerStep3));

// Register new user
// router.post('/register', asyncHandler(authController.register));

// Login user
router.post('/login', asyncHandler(authController.login));

// Logout user
router.post('/logout', asyncHandler(authController.logout));

// Get current authenticated user
router.get('/me', auth, asyncHandler(authController.getMe));

// Password Management
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password/:token', asyncHandler(authController.resetPassword));


export default router;