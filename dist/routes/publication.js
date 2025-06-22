"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController = __importStar(require("../controllers/commentController"));
const publicationController = __importStar(require("../controllers/publicationController"));
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// Helper to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// --- Publication Routes ---
// Get recommended publications
// IMPORTANT: This route must come before '/:publicationId' to avoid 'recommendations' being treated as an ID.
router.get('/fyp/recommendations', auth_1.auth, asyncHandler(publicationController.getRecommendedPublications));
// Get current user's liked publications
router.get('/me/liked', auth_1.auth, asyncHandler(publicationController.getMyLikedPublications));
// Create a new publication
router.post('/', auth_1.auth, upload_1.uploadPublicationImage, asyncHandler(publicationController.createPublication));
// Get all publications (feed)
router.get('/', auth_1.auth, asyncHandler(publicationController.getAllPublications));
// Get a single publication by ID
router.get('/:publicationId', auth_1.auth, asyncHandler(publicationController.getPublicationById));
// Update a publication
router.put('/:publicationId', auth_1.auth, asyncHandler(publicationController.updatePublication));
// Like a publication
router.post('/:publicationId/like', auth_1.auth, asyncHandler(publicationController.likePublication));
// Unlike a publication
router.delete('/:publicationId/unlike', auth_1.auth, asyncHandler(publicationController.unlikePublication));
// --- Comment Routes ---
// Create a comment
router.post('/:publicationId/comments', auth_1.auth, asyncHandler(commentController.createComment));
// Get all comments for a publication (can be used for a separate comments page/section)
router.get('/:publicationId/comments', auth_1.auth, asyncHandler(commentController.getCommentsForPublication));
// Reply to an existing comment
router.post('/comments/:commentId/reply', auth_1.auth, asyncHandler(commentController.replyToComment));
// Update a comment
router.put('/comments/:commentId', auth_1.auth, asyncHandler(commentController.updateComment));
// Delete a comment
router.delete('/comments/:commentId', auth_1.auth, asyncHandler(commentController.deleteComment));
// Like a comment
router.post('/comments/:commentId/like', auth_1.auth, asyncHandler(commentController.likeComment));
// Unlike a comment
router.delete('/comments/:commentId/unlike', auth_1.auth, asyncHandler(commentController.unlikeComment));
exports.default = router;
//# sourceMappingURL=publication.js.map