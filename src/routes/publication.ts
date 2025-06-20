import express from "express";
import { auth } from '../middleware/auth';
import { uploadPublicationImage } from '../middleware/upload';
import * as publicationController from '../controllers/publicationController';

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Publication Routes ---

// Get recommended publications
// IMPORTANT: This route must come before '/:publicationId' to avoid 'recommendations' being treated as an ID.
router.get('/recommendations', auth, asyncHandler(publicationController.getRecommendedPublications));

// Get current user's liked publications
router.get('/me/liked', auth, asyncHandler(publicationController.getMyLikedPublications));

// Create a new publication
router.post('/', auth, uploadPublicationImage, asyncHandler(publicationController.createPublication));

// Get all publications (feed)
router.get('/', auth, asyncHandler(publicationController.getAllPublications));

// Get a single publication by ID
router.get('/:publicationId', auth, asyncHandler(publicationController.getPublicationById));

// Update a publication
router.put('/:publicationId', auth, asyncHandler(publicationController.updatePublication));

// Like a publication
router.post('/:publicationId/like', auth, asyncHandler(publicationController.likePublication));

// Unlike a publication
router.delete('/:publicationId/unlike', auth, asyncHandler(publicationController.unlikePublication));


export default router;