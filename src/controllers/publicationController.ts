import db from '../config/database';
import { Op } from 'sequelize';
import { User } from '../models/User';
import { Request, Response } from 'express';
import { Publication } from '../models/Publication';
import { Subscription } from '../models/Subscription';
import { LikedPublication } from '../models/LikedPublication';
import { Comment } from '../models/Comment'; // Import Comment
import { classifyContent, getSimilarCategories, PublicationCategory } from '../services/classificationService';

// --- Get Single Publication by ID with full comment tree ---
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
            ],
        });

        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }

        // Fetch comments separately with full hierarchy
        const topLevelComments = await Comment.findAll({
            where: { publicationId: publication.id, parentId: null },
            include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
            order: [['createdAt', 'ASC']],
        });

        const fetchReplies = async (comment: Comment) => {
            const replies = await Comment.findAll({
                where: { parentId: comment.id },
                include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
                order: [['createdAt', 'ASC']]
            });

            for (const reply of replies) {
                (reply as any).dataValues.replies = await fetchReplies(reply);
            }
            return replies;
        };

        for (const comment of topLevelComments) {
            (comment as any).dataValues.replies = await fetchReplies(comment);
        }

        const publicationJson = publication.toJSON();

        // Add isLiked and isFollowing info
        const isFollowing = await Subscription.findOne({ where: { followerId: userId, followingId: publication.userId } });
        const isLiked = await LikedPublication.findOne({ where: { userId, publicationId: publication.id } });

        const publicationWithExtras = {
            ...publicationJson,
            isFollowing: !!isFollowing,
            isLiked: !!isLiked
        };

        res.json(publicationWithExtras);

    } catch (error) {
        console.error('Get publication by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// --- The rest of the publication controller remains largely the same ---
// Helper function to add extra info (likeCount and commentCount are now on the model)
const addExtraInfoToPublications = async (publications: Publication[], userId: string) => {
    if (publications.length === 0) return [];
    const authorIds = publications.map(p => p.userId);
    const publicationIds = publications.map(p => p.id);

    const following = await Subscription.findAll({
        where: { followerId: userId, followingId: { [Op.in]: authorIds } },
    });
    const followingIds = new Set(following.map(sub => sub.followingId));

    const liked = await LikedPublication.findAll({
        where: { userId, publicationId: { [Op.in]: publicationIds } },
    });
    const likedPublicationIds = new Set(liked.map(like => like.publicationId));

    return publications.map(p => {
        const publicationJson = p.toJSON();
        return {
            ...publicationJson,
            isFollowing: followingIds.has(p.userId),
            isLiked: likedPublicationIds.has(p.id),
        };
    });
};

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

        const category = await classifyContent(content, imageUrl);

        const publication = await Publication.create({
            userId,
            content,
            imageUrl,
            category,
            likeCount: 0,
            commentCount: 0
        });

        res.status(201).json({ message: 'Publication created successfully', publication });
    } catch (error) {
        console.error('Create publication error:', error);
        res.status(500).json({ message: 'Server error during publication creation' });
    }
};

export const getAllPublications = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { sortBy, category } = req.query;

        let order: any = [['createdAt', 'DESC']];
        if (sortBy === 'mostLiked') {
            order = [['likeCount', 'DESC']];
        } else if (sortBy === 'mostCommented') {
            order = [['commentCount', 'DESC']];
        }

        let whereClause: any = {};
        if (category) {
            whereClause.category = category;
        }

        const publications = await Publication.findAll({
            where: whereClause,
            order: order,
            include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }]
        });

        const publicationsWithInfo = await addExtraInfoToPublications(publications, userId);

        res.json(publicationsWithInfo);
    } catch (error) {
        console.error('Get all publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getRecommendedPublications = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const myPublicationIds = (await user.getPublications({ attributes: ['id'] })).map(p => p.id);
        const likedPublicationIds = (await user.getLikedPublications({ attributes: ['id'] })).map(p => p.id);
        const excludedPublicationIds = [...new Set([...myPublicationIds, ...likedPublicationIds])];
        const userInterests = user.interests || [];
        let recommendedCategories: string[] = [];
        if (userInterests.length > 0) {
            const allRelevantCategories = new Set<string>(userInterests);
            userInterests.forEach(interest => {
                const similar = getSimilarCategories(interest as PublicationCategory);
                similar.forEach(cat => allRelevantCategories.add(cat));
            });
            recommendedCategories = Array.from(allRelevantCategories);
        }
        let recommendations: Publication[] = [];
        if (recommendedCategories.length > 0) {
            recommendations = await Publication.findAll({
                where: {
                    category: { [Op.in]: recommendedCategories },
                    id: { [Op.notIn]: excludedPublicationIds },
                    userId: { [Op.ne]: userId }
                },
                include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
                order: [
                    ['likeCount', 'DESC'], // Prioritize most liked
                    ['createdAt', 'DESC']
                ],
                limit,
                offset
            });
        }
        if (recommendations.length < limit) {
            const existingIds = recommendations.map(p => p.id);
            const fallbackLimit = limit - recommendations.length;
            const fallbackOffset = offset > 0 ? 0 : offset;
            const fallbackPublications = await Publication.findAll({
                where: {
                    id: { [Op.notIn]: [...excludedPublicationIds, ...existingIds] },
                    userId: { [Op.ne]: userId }
                },
                include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
                order: [['createdAt', 'DESC'], ['likeCount', 'DESC']],
                limit: fallbackLimit, offset: fallbackOffset
            });
            recommendations.push(...fallbackPublications);
        }
        const finalRecommendations = await addExtraInfoToPublications(recommendations, userId);
        res.json(finalRecommendations);
    } catch (error) {
        console.error('Get recommended publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updatePublication = async (req: Request, res: Response) => {
    try {
        const { publicationId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const publication = await Publication.findByPk(publicationId);
        if (!publication) return res.status(404).json({ message: 'Publication not found' });
        if (publication.userId !== userId) return res.status(403).json({ message: 'You are not authorized to edit this publication' });
        publication.content = content || publication.content;
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

export const likePublication = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;
        const publication = await Publication.findByPk(publicationId);
        if (!publication) return res.status(404).json({ message: 'Publication not found' });
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await db.transaction(async (t) => {
            await LikedPublication.create({ userId, publicationId }, { transaction: t });
            await publication.increment('likeCount', { transaction: t });
            if (publication.category) {
                const currentInterests = user.interests || [];
                if (!currentInterests.includes(publication.category)) {
                    user.interests = [...currentInterests, publication.category];
                    await user.save({ transaction: t });
                }
            }
        });
        res.status(200).json({ message: 'Publication liked successfully' });
    } catch (error) {
        console.error('Like publication error:', error);
        if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'You have already liked this publication.' });
        res.status(500).json({ message: 'Server error' });
    }
};

export const unlikePublication = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;
        const publication = await Publication.findByPk(publicationId);
        if (!publication) return res.status(404).json({ message: 'Publication not found' });

        await db.transaction(async (t) => {
            const result = await LikedPublication.destroy({ where: { userId, publicationId }, transaction: t });
            if (result === 0) throw new Error("Not liked");
            if (publication.likeCount > 0) {
                await publication.decrement('likeCount', { transaction: t });
            }
        });
        res.status(200).json({ message: 'Publication unliked successfully' });
    } catch (error) {
        if (error.message === 'Not liked') return res.status(404).json({ message: 'You have not liked this publication.' });
        console.error('Unlike publication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMyLikedPublications = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const likedPublications = await user.getLikedPublications({
            include: [{ model: User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
            order: [['createdAt', 'DESC']]
        });
        const publicationsWithInfo = await addExtraInfoToPublications(likedPublications, userId);
        res.json(publicationsWithInfo);
    } catch (error) {
        console.error('Get liked publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};