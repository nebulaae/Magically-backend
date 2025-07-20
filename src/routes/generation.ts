import express from 'express';
import { auth } from '../middleware/auth';
import { uploadPrivateImage } from '../middleware/upload';
import * as generationController from '../controllers/generationController';

const router = express.Router();

const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Generate an AI image from a user's private upload
router.post('/generate', auth, uploadPrivateImage, asyncHandler(generationController.generateAiImage));

// Publish a generated image to the public feed
router.post('/publish', auth, asyncHandler(generationController.publishGeneratedImage));

export default router;