import fs from 'fs';
import path from 'path';

import { Op } from 'sequelize';
import { User } from '../models/User';
import { Request, Response } from 'express';
import { Publication } from '../models/Publication';
import { Subscription } from '../models/Subscription';
import { LikedPublication } from '../models/LikedPublication';
import { classifyContent, getSimilarCategories, PublicationCategory } from '../services/classificationService';

// Ensure the directory for publication images exists
const publicationImageDir = path.join(__dirname, '../../public/publications');
if (!fs.existsSync(publicationImageDir)) {
    fs.mkdirSync(publicationImageDir, { recursive: true });
}

// Helper function to add isFollowing and isLiked flags
const addExtraInfoToPublications = async (publications: Publication[], userId: string) => {
    const authorIds = publications.map(p => p.userId);
    const publicationIds = publications.map(p => p.id);

    // Find which authors the user is following
    const following = await Subscription.findAll({
        where: {
            followerId: userId,
            followingId: {
                [Op.in]: authorIds,
            },
        },
    });
    const followingIds = new Set(following.map(sub => sub.followingId));

    // Find which publications the user has liked
    const liked = await LikedPublication.findAll({
        where: {
            userId: userId,
            publicationId: {
                [Op.in]: publicationIds,
            },
        },
    });
    const likedPublicationIds = new Set(liked.map(like => like.publicationId));

    // Return publications with the new fields
    return publications.map(p => {
        const publicationJson = p.toJSON();
        return {
            ...publicationJson,
            isFollowing: followingIds.has(p.userId),
            isLiked: likedPublicationIds.has(p.id),
        };
    });
};


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
        const userId = req.user.id;
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

        const publicationsWithInfo = await addExtraInfoToPublications(publications, userId);
        res.json(publicationsWithInfo);

    } catch (error) {
        console.error('Get all publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Get Single Publication by ID ---
export const getPublicationById = async (req: Request, res: Response) => {
    try {
        const { publicationId } = req.params;
        const userId = req.user.id;
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

        const publicationsWithInfo = await addExtraInfoToPublications([publication], userId);
        res.json(publicationsWithInfo[0]);

    } catch (error) {
        console.error('Get publication by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- [NEW] Update a Publication ---
export const updatePublication = async (req: Request, res: Response) => {
    try {
        const { publicationId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const publication = await Publication.findByPk(publicationId);

        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }

        // Check if the user is the author of the publication
        if (publication.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to edit this publication' });
        }

        publication.content = content || publication.content;

        // Re-classify content if it has changed
        if (content) {
            publication.category = await classifyContent(content, publication.imageUrl);
        }

        await publication.save();

        res.json({ message: 'Publication updated successfully', publication });

    } catch (error) {
        console.error('Update publication error:', error);
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

        const publicationsWithInfo = await addExtraInfoToPublications(likedPublications, userId);
        res.json(publicationsWithInfo);

    } catch (error) {
        console.error('Get liked publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- Get Recommended Publications based on interests ---
export const getRecommendedPublications = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId, {
            include: [{
                model: Publication,
                as: 'likedPublications'
            }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userInterests = user.interests || [];
        const likedPublicationIds = ((user as any).likedPublications || []).map((p: any) => p.id);
        const myPublicationIds = (await user.getPublications()).map(p => p.id);
        const excludedPublicationIds = [...new Set([...likedPublicationIds, ...myPublicationIds])];


        let recommendations: Publication[] = [];

        if (userInterests && userInterests.length > 0) {
            const allRelevantCategories = new Set<string>(userInterests);

            userInterests.forEach(interest => {
                const similarCategories = getSimilarCategories(interest as PublicationCategory);
                similarCategories.forEach(cat => allRelevantCategories.add(cat));
            });

            recommendations = await Publication.findAll({
                where: {
                    category: {
                        [Op.in]: Array.from(allRelevantCategories)
                    },
                    userId: {
                        [Op.ne]: userId // Exclude own publications
                    },
                    // [FIX] Exclude already liked publications
                    id: {
                        [Op.notIn]: excludedPublicationIds
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
                limit: 20
            });
        }

        // Fallback for more content
        if (recommendations.length < 20) {
            const generalPublications = await Publication.findAll({
                where: {
                    id: {
                        [Op.notIn]: [...excludedPublicationIds, ...recommendations.map(p => p.id)]
                    },
                    userId: {
                        [Op.ne]: userId
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
                limit: 20 - recommendations.length
            });
            recommendations.push(...generalPublications);
        }

        const finalRecommendations = await addExtraInfoToPublications(recommendations, userId);

        // Shuffle for variety
        finalRecommendations.sort(() => Math.random() - 0.5);

        res.json(finalRecommendations);
    } catch (error) {
        console.error('Get recommended publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
