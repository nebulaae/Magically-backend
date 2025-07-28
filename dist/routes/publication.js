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
const publicationController = __importStar(require("../controllers/publicationController"));
const auth_1 = require("../middleware/auth");
const utils_1 = require("../lib/utils");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// Get all publications (feed)
router.get('/', auth_1.auth, (0, utils_1.asyncHandler)(publicationController.getAllPublications));
// Get current user's liked publications
router.get('/me/liked', auth_1.auth, (0, utils_1.asyncHandler)(publicationController.getMyLikedPublications));
// Create a new publication
router.post('/', auth_1.auth, upload_1.uploadPublicationImage, (0, utils_1.asyncHandler)(publicationController.createPublication));
// Get a single publication by ID
router.get('/:publicationId', auth_1.auth, (0, utils_1.asyncHandler)(publicationController.getPublicationById));
// Update a publication
router.put('/:publicationId', auth_1.auth, (0, utils_1.asyncHandler)(publicationController.updatePublication));
// Like a publication
router.post('/:publicationId/like', auth_1.auth, (0, utils_1.asyncHandler)(publicationController.likePublication));
// Unlike a publication
router.delete('/:publicationId/unlike', auth_1.auth, (0, utils_1.asyncHandler)(publicationController.unlikePublication));
exports.default = router;
//# sourceMappingURL=publication.js.map