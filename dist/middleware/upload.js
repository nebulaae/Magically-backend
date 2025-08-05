"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadHiggsfieldImage = exports.uploadKlingImage = exports.uploadPublicationImage = exports.uploadAvatar = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
// Define the destinations for directories
const klingDir = path_1.default.join(__dirname, '../../public/ai/kling');
const avatarDir = path_1.default.join(__dirname, '../../public/users/avatars');
const privateDir = path_1.default.join(__dirname, '../../private/user_uploads');
const higgsfieldDir = path_1.default.join(__dirname, '../../public/ai/higgsfield');
const publicationDir = path_1.default.join(__dirname, '../../public/publications');
// Ensure directories exist
[klingDir, avatarDir, privateDir, higgsfieldDir, publicationDir].forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
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
// File filter to accept both image and video files
const imageAndVideoFileFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif/;
    const allowedVideoTypes = /mp4|mov|avi|webm|mkv/;
    const ext = path_1.default.extname(file.originalname).toLowerCase().replace('.', '');
    const mimetype = file.mimetype;
    if (allowedImageTypes.test(ext) ||
        allowedVideoTypes.test(ext) ||
        mimetype.startsWith('image/') ||
        mimetype.startsWith('video/')) {
        return cb(null, true);
    }
    cb(new Error('Error: File upload only supports image and video filetypes - jpeg, jpg, png, gif, mp4, mov, avi, webm, mkv'));
};
// Avatar upload storage
exports.uploadAvatar = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, avatarDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, `${userId}-${uniqueSuffix}${extension}`);
        },
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: fileFilter
}).single('avatar');
// Storage to upload publications
exports.uploadPublicationImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, publicationDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, `${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
    fileFilter: imageAndVideoFileFilter
}).single('publicationMedia');
// Storage to upload image to kling
exports.uploadKlingImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, klingDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, `kling-${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: fileFilter
}).single('klingImage');
// Storage to upload images to higgsfield
exports.uploadHiggsfieldImage = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, higgsfieldDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path_1.default.extname(file.originalname);
            cb(null, `higgsfield-${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: fileFilter
}).array('higgsfieldImage', 10);
//# sourceMappingURL=upload.js.map