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
const authController = __importStar(require("../controllers/authController"));
const router = express_1.default.Router();
// Helper to wrap async route handlers
const asyncHandler = (fn) => (req, res, next) => {
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
router.get('/me', auth_1.auth, asyncHandler(authController.getMe));
// Password Management
router.post('/forgot-password', asyncHandler(authController.forgotPassword));
router.post('/reset-password/:token', asyncHandler(authController.resetPassword));
exports.default = router;
//# sourceMappingURL=auth.js.map