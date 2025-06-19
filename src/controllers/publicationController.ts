import fs from 'fs';
import path from 'path';

import { Op } from 'sequelize';
import { User } from '../models/User';
import { Request, Response } from 'express';
import { Publication } from '../models/Publication';
import { classifyContent, getSimilarCategories, PublicationCategory } from '../services/classificationService';

// Ensure the directory for publication images exists
const publicationImageDir = path.join(__dirname, '../../public/publications');
if (!fs.existsSync(publicationImageDir)) {
    fs.mkdirSync(publicationImageDir, { recursive: true });
}

// --- Create Publication ---
export const createPublication = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        let imageUrl: string | undefined;

        if (req.file) {
            imageUrl = `/publications/${req.file.filename}`;
        }

        if (!content && !imageUrl) {
            return res.status(400).json({ message: 'Publication must have content or an image.' });
        }

        // Classify the content/image using the new classification service
        const category = await classifyContent(content, imageUrl);

        const publication = await Publication.create({
            userId,
            content,
            imageUrl,
            category, // Save the classified category
        });

        res.status(201).json({ message: 'Publication created successfully', publication });
    } catch (error) {
        console.error('Create publication error:', error);
        res.status(500).json({ message: 'Server error during publication creation' });
    }
};

// --- Get All Publications (Feed) ---
export const getAllPublications = async (req: Request, res: Response) => {
    try {
        const publications = await Publication.findAll({
            order: [['createdAt', 'DESC']], // Latest first
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullname', 'avatar']
                }
            ]
        });
        res.json(publications);
    } catch (error) {
        console.error('Get all publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Get Single Publication by ID ---
export const getPublicationById = async (req: Request, res: Response) => {
    try {
        const { publicationId } = req.params;
        const publication = await Publication.findByPk(publicationId, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullname', 'avatar']
                }
            ]
        });

        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        res.json(publication);
    } catch (error) {
        console.error('Get publication by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Like a Publication ---
export const likePublication = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;

        const publication = await Publication.findByPk(publicationId);
        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add the publication to the user's liked publications
        await user.addLikedPublication(publication);

        // Add the publication's category to user's interests if not already present
        if (publication.category) {
            const currentInterests = user.interests || [];
            if (!currentInterests.includes(publication.category)) {
                user.interests = [...currentInterests, publication.category];
                await user.save();
            }
        }

        res.status(200).json({ message: 'Publication liked successfully' });
    } catch (error) {
        console.error('Like publication error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'You have already liked this publication.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Unlike a Publication ---
export const unlikePublication = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;

        const publication = await Publication.findByPk(publicationId);
        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const result = await user.removeLikedPublication(publication);

        if (result === null) { // Sequelize returns 0 if no row was deleted
            return res.status(404).json({ message: 'You have not liked this publication.' });
        }

        res.status(200).json({ message: 'Publication unliked successfully' });
    } catch (error) {
        console.error('Unlike publication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Get Liked Publications for Current User ---
export const getMyLikedPublications = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const likedPublications = await user.getLikedPublications({
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullname', 'avatar']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(likedPublications);
    } catch (error) {
        console.error('Get liked publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Get Recommended Publications based on interests ---
export const getRecommendedPublications = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userInterests = user.interests;
        let recommendations: Publication[] = [];

        if (userInterests && userInterests.length > 0) {
            // Get similar categories for better recommendations
            const allRelevantCategories = new Set<string>();

            // Add user's direct interests
            userInterests.forEach(interest => allRelevantCategories.add(interest));

            // Add similar categories for each interest
            userInterests.forEach(interest => {
                const similarCategories = getSimilarCategories(interest as PublicationCategory);
                similarCategories.forEach(cat => allRelevantCategories.add(cat));
            });

            // Find publications matching user's interests and similar categories
            recommendations = await Publication.findAll({
                where: {
                    category: {
                        [Op.in]: Array.from(allRelevantCategories)
                    },
                    userId: {
                        [Op.ne]: userId // Exclude own publications
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['id', 'username', 'fullname', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: 20 // Limit recommendations
            });

            // Sort recommendations by relevance (direct interests first)
            recommendations.sort((a, b) => {
                const aIsDirect = userInterests.includes(a.category || '');
                const bIsDirect = userInterests.includes(b.category || '');

                if (aIsDirect && !bIsDirect) return -1;
                if (!aIsDirect && bIsDirect) return 1;
                return 0; // Keep original order for same relevance level
            });
        }

        // If no specific recommendations or not enough, fill with general popular posts
        if (recommendations.length < 10) { // Ensure a minimum number of recommendations
            const generalPublications = await Publication.findAll({
                where: {
                    id: {
                        [Op.notIn]: recommendations.map(p => p.id) // Avoid duplicates
                    },
                    userId: {
                        [Op.ne]: userId // Exclude own publications
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'author',
                        attributes: ['id', 'username', 'fullname', 'avatar']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: 10 - recommendations.length // Fill up to 10 total
            });
            recommendations = [...recommendations, ...generalPublications];
        }

        // Add some randomization to provide variety while maintaining relevance
        const directInterestPosts = recommendations.filter(p => userInterests?.includes(p.category || ''));
        const similarInterestPosts = recommendations.filter(p => !userInterests?.includes(p.category || ''));

        // Shuffle each group separately
        directInterestPosts.sort(() => Math.random() - 0.5);
        similarInterestPosts.sort(() => Math.random() - 0.5);

        // Combine with direct interests first
        const finalRecommendations = [...directInterestPosts, ...similarInterestPosts];

        res.json(finalRecommendations);
    } catch (error) {
        console.error('Get recommended publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};