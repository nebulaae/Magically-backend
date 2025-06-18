import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';

// Define the destination directory for avatars
const avatarDir = path.join(__dirname, '../../public/users/avatars');

// Ensure the directory exists
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarDir);
    },
    filename: (req: Request, file, cb) => {
        // Create a unique filename to prevent overwrites
        // format: userId-timestamp.extension
        const userId = req.user.id;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${userId}-${uniqueSuffix}${extension}`);
    }
});

// File filter to only accept image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + allowedTypes));
};

// Initialize multer with the storage and file filter configurations
export const uploadAvatar = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
    fileFilter: fileFilter
}).single('avatar'); // 'avatar' is the name of the form field