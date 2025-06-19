import express from 'express';
import { auth } from '../middleware/auth';
import { uploadPublicationImage } from '../middleware/upload'; // Re-using avatar upload middleware for publications, or create a specific one
import * as publicationController from '../controllers/publicationController';

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Authenticated Routes for Publications ---
// Create a new publication (text or image)
router.post('/', auth, uploadPublicationImage, asyncHandler(publicationController.createPublication));

// Get all publications (feed)
router.get('/', auth, asyncHandler(publicationController.getAllPublications));

// Get a single publication by ID
router.get('/:publicationId', auth, asyncHandler(publicationController.getPublicationById));

// Like a publication
router.post('/:publicationId/like', auth, asyncHandler(publicationController.likePublication));

// Unlike a publication
router.delete('/:publicationId/unlike', auth, asyncHandler(publicationController.unlikePublication));

// Get current user's liked publications
router.get('/me/liked', auth, asyncHandler(publicationController.getMyLikedPublications));

// Get recommended publications
router.get('/recommendations', auth, asyncHandler(publicationController.getRecommendedPublications));

export default router;

