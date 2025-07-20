import fs from 'fs/promises';
import { User } from '../models/User';
import { Request, Response } from 'express';
import { Publication } from '../models/Publication';
import { generateImage } from '../services/aiGenerationService';
import { classifyContent } from '../services/classificationService';

// --- Generate AI Image from Private Upload ---
export const generateAiImage = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { prompt, style } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'An image file is required.' });
        }
        if (!prompt || !style) {
            return res.status(400).json({ message: 'Prompt and style are required.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const imageBuffer = await fs.readFile(req.file.path);
        const result = await generateImage(imageBuffer, prompt, style);

        if (!result.success || !result.imageUrl) {
            return res.status(500).json({ message: result.error || 'Failed to generate image.' });
        }

        // Add the generated image to the user's gallery
        const newGalleryItem = {
            originalPath: req.file.path,
            generatedUrl: result.imageUrl,
            prompt,
            style,
            createdAt: new Date(),
        };

        const updatedGallery = [...(user.gallery || []), newGalleryItem];
        user.gallery = updatedGallery;
        await user.save();

        res.status(200).json({ message: 'Image generated successfully!', galleryItem: newGalleryItem });

    } catch (error) {
        console.error('AI Image Generation Error:', error);
        res.status(500).json({ message: 'Server error during image generation.' });
    }
};

// --- Publish a Generated Image ---
export const publishGeneratedImage = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { imageUrl, description } = req.body;

        if (!imageUrl || !description) {
            return res.status(400).json({ message: 'Image URL and description are required.' });
        }

        const category = await classifyContent(description, imageUrl);

        const publication = await Publication.create({
            userId,
            content: description,
            imageUrl: imageUrl,
            category,
            likeCount: 0,
            commentCount: 0
        });

        res.status(201).json({ message: 'Image published successfully!', publication });

    } catch (error) {
        console.error('Publish Generated Image Error:', error);
        res.status(500).json({ message: 'Server error during publication.' });
    }
};