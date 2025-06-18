import express from 'express';
import { auth } from '../middleware/auth';
import { uploadAvatar } from '../middleware/upload';
import * as userController from '../controllers/userController';

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Public Route ---
// Get a user's profile by username
router.get('/:username', asyncHandler(userController.getProfile));

// Search for users
router.get('/search/users', asyncHandler(userController.searchUsers));


// --- Authenticated Routes ---
// Get your profile data
router.get('/me/profile', auth, asyncHandler(userController.getMe));

// Update the current user's profile (bio, fullname, interests)
router.put('/me/profile', auth, asyncHandler(userController.updateProfile));

// Update the current user's avatar
router.put('/me/avatar', auth, uploadAvatar, asyncHandler(userController.updateAvatar));

// Subscribe to (follow) a user
router.post('/:userId/subscribe', auth, asyncHandler(userController.subscribe));

// Unsubscribe from (unfollow) a user
router.delete('/:userId/unsubscribe', auth, asyncHandler(userController.unsubscribe));


export default router;