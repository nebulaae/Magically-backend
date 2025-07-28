"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadTempImage = exports.uploadPrivateImage = exports.uploadPublicationImage = exports.uploadAvatar = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
// Define the destination directory for avatars
const avatarDir = path_1.default.join(__dirname, '../../public/users/avatars');
// Ensure the directory exists
if (!fs_1.default.existsSync(avatarDir)) {
    fs_1.default.mkdirSync(avatarDir, { recursive: true });
}
// Configure multer storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename to prevent overwrites
        // format: userId-timestamp.extension
        const userId = req.user.id;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${userId}-${uniqueSuffix}${extension}`);
    }
});
// File filter to only accept image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
};
// Initialize multer with the storage and file filter configurations
exports.uploadAvatar = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
    fileFilter: fileFilter
}).single('avatar'); // 'avatar' is the name of the form field
// Upload publication image
exports.uploadPublicationImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const publicationDir = path_1.default.join(__dirname, '../../public/publications');
            if (!fs_1.default.existsSync(publicationDir)) {
                fs_1.default.mkdirSync(publicationDir, { recursive: true });
            }
            cb(null, publicationDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, `${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports image filetypes - ' + allowedTypes));
    }
}).single('publicationImage'); // 'publicationImage' is the name of the form field
const privateDir = path_1.default.join(__dirname, '../../private/user_uploads');
if (!fs_1.default.existsSync(privateDir)) {
    fs_1.default.mkdirSync(privateDir, { recursive: true });
}
// --- New: Configure multer for private image uploads for AI generation ---
exports.uploadPrivateImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, privateDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, `private-${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter // You can reuse the existing image fileFilter
}).single('privateImage');
// --- New: Configure multer for temporary public image uploads for AI generation ---
const tempDir = path_1.default.join(__dirname, '../../public/temp');
if (!fs_1.default.existsSync(tempDir)) {
    fs_1.default.mkdirSync(tempDir, { recursive: true });
}
exports.uploadTempImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, tempDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, `temp-${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter // Reuse the existing image fileFilter
}).single('image');
//# sourceMappingURL=upload.js.map