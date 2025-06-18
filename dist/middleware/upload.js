"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = void 0;
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
//# sourceMappingURL=upload.js.map