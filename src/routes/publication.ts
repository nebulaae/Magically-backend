import express from "express";
import * as commentController from '../controllers/commentController';
import * as publicationController from '../controllers/publicationController';

import { auth } from '../middleware/auth';
import { uploadPublicationImage } from '../middleware/upload';

const router = express.Router();

// Helper to wrap async route handlers
const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- Publication Routes ---

// Get recommended publications
// IMPORTANT: This route must come before '/:publicationId' to avoid 'recommendations' being treated as an ID.
router.get('/fyp/recommendations', auth, asyncHandler(publicationController.getRecommendedPublications));

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

// --- Comment Routes ---

// Create a comment
router.post('/:publicationId/comments', auth, asyncHandler(commentController.createComment));

// Get all comments for a publication (can be used for a separate comments page/section)
router.get('/:publicationId/comments', auth, asyncHandler(commentController.getCommentsForPublication));

// Reply to an existing comment
router.post('/comments/:commentId/reply', auth, asyncHandler(commentController.replyToComment));

// Update a comment
router.put('/comments/:commentId', auth, asyncHandler(commentController.updateComment));

// Delete a comment
router.delete('/comments/:commentId', auth, asyncHandler(commentController.deleteComment));

// Like a comment
router.post('/comments/:commentId/like', auth, asyncHandler(commentController.likeComment));

// Unlike a comment
router.delete('/comments/:commentId/unlike', auth, asyncHandler(commentController.unlikeComment));


export default router;