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
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const userController = __importStar(require("../controllers/userController"));
const router = express_1.default.Router();
// Helper to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// --- Public Routes ---
// Search for users
router.get('/search/users', auth_1.auth, asyncHandler(userController.searchUsers));
// --- Authenticated Routes ---
// Get your own detailed profile
router.get('/me/profile', auth_1.auth, asyncHandler(userController.getMe));
// Get your own followings
router.get('/me/profile/followers', auth_1.auth, asyncHandler(userController.getMyFollowers));
// Get your own followers
router.get('/me/profile/following', auth_1.auth, asyncHandler(userController.getMyFollowings));
// Update your profile
router.put('/me/profile', auth_1.auth, asyncHandler(userController.updateProfile));
// Update your avatar
router.put('/me/avatar', auth_1.auth, upload_1.uploadAvatar, asyncHandler(userController.updateAvatar));
// --- User specific routes (by username or ID) ---
// Get a user's profile by username (must be after /me and /search routes)
router.get('/:username', auth_1.auth, asyncHandler(userController.getProfile));
// Get a user's followers
router.get('/:username/followers', auth_1.auth, asyncHandler(userController.getFollowers));
// Get a user's following
router.get('/:username/following', auth_1.auth, asyncHandler(userController.getFollowing));
// Subscribe to (follow) a user by their ID
router.post('/:userId/subscribe', auth_1.auth, asyncHandler(userController.subscribe));
// Unsubscribe from (unfollow) a user by their ID
router.delete('/:userId/unsubscribe', auth_1.auth, asyncHandler(userController.unsubscribe));
exports.default = router;
//# sourceMappingURL=user.js.map