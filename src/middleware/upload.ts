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

// Upload publication image
export const uploadPublicationImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const publicationDir = path.join(__dirname, '../../public/publications');
            if (!fs.existsSync(publicationDir)) { fs.mkdirSync(publicationDir, { recursive: true }); }
            cb(null, publicationDir);
        },
        filename: (req: Request, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, `${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) { return cb(null, true); }
        cb(new Error('Error: File upload only supports image filetypes - ' + allowedTypes));
    }
}).single('publicationImage'); // 'publicationImage' is the name of the form field


const privateDir = path.join(__dirname, '../../private/user_uploads');
if (!fs.existsSync(privateDir)) {
    fs.mkdirSync(privateDir, { recursive: true });
}

// --- New: Configure multer for private image uploads for AI generation ---
export const uploadPrivateImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, privateDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, `private-${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter // You can reuse the existing image fileFilter
}).single('privateImage');

// --- New: Configure multer for temporary public image uploads for AI generation ---
const tempDir = path.join(__dirname, '../../public/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

export const uploadTempImage = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, tempDir);
        },
        filename: (req, file, cb) => {
            const userId = req.user.id;
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = path.extname(file.originalname);
            cb(null, `temp-${userId}-${uniqueSuffix}${extension}`);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter // Reuse the existing image fileFilter
}).single('image');