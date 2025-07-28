"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyLikedPublications = exports.unlikePublication = exports.likePublication = exports.updatePublication = exports.getAllPublications = exports.createPublication = exports.getPublicationById = void 0;
const database_1 = __importDefault(require("../config/database"));
const sequelize_1 = require("sequelize");
const User_1 = require("../models/User");
const Comment_1 = require("../models/Comment");
const Publication_1 = require("../models/Publication");
const Subscription_1 = require("../models/Subscription");
const LikedPublication_1 = require("../models/LikedPublication");
const utils_1 = require("../lib/utils");
// --- Get Single Publication by ID with full comment tree ---
const getPublicationById = async (req, res) => {
    try {
        const { publicationId } = req.params;
        const userId = req.user.id;
        const publication = await Publication_1.Publication.findByPk(publicationId, {
            include: [
                {
                    model: User_1.User,
                    as: 'author',
                    attributes: ['id', 'username', 'fullname', 'avatar']
                }
            ],
        });
        if (!publication) {
            return res.status(404).json({ message: 'Publication not found' });
        }
        // Fetch comments separately with full hierarchy
        const topLevelComments = await Comment_1.Comment.findAll({
            where: { publicationId: publication.id, parentId: null },
            include: [{ model: User_1.User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
            order: [['createdAt', 'ASC']],
        });
        for (const comment of topLevelComments) {
            comment.dataValues.replies = await (0, utils_1.fetchReplies)(comment);
        }
        const publicationJson = publication.toJSON();
        // Add isLiked and isFollowing info
        const isFollowing = await Subscription_1.Subscription.findOne({ where: { followerId: userId, followingId: publication.userId } });
        const isLiked = await LikedPublication_1.LikedPublication.findOne({ where: { userId, publicationId: publication.id } });
        const publicationWithExtras = Object.assign(Object.assign({}, publicationJson), { isFollowing: !!isFollowing, isLiked: !!isLiked });
        res.json(publicationWithExtras);
    }
    catch (error) {
        console.error('Get publication by ID error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getPublicationById = getPublicationById;
// --- The rest of the publication controller remains largely the same ---
const addExtraInfoToPublications = async (publications, userId) => {
    if (publications.length === 0)
        return [];
    const authorIds = publications.map(p => p.userId);
    const publicationIds = publications.map(p => p.id);
    const following = await Subscription_1.Subscription.findAll({
        where: { followerId: userId, followingId: { [sequelize_1.Op.in]: authorIds } },
    });
    const followingIds = new Set(following.map(sub => sub.followingId));
    const liked = await LikedPublication_1.LikedPublication.findAll({
        where: { userId, publicationId: { [sequelize_1.Op.in]: publicationIds } },
    });
    const likedPublicationIds = new Set(liked.map(like => like.publicationId));
    return publications.map(p => {
        const publicationJson = p.toJSON();
        return Object.assign(Object.assign({}, publicationJson), { isFollowing: followingIds.has(p.userId), isLiked: likedPublicationIds.has(p.id) });
    });
};
const createPublication = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.id;
        let imageUrl;
        if (req.file) {
            imageUrl = `/publications/${req.file.filename}`;
        }
        if (!content && !imageUrl) {
            return res.status(400).json({ message: 'Publication must have content or an image.' });
        }
        const publication = await Publication_1.Publication.create({
            userId,
            content,
            imageUrl,
            category: "Not defined",
            likeCount: 0,
            commentCount: 0
        });
        res.status(201).json({ message: 'Publication created successfully', publication });
    }
    catch (error) {
        console.error('Create publication error:', error);
        res.status(500).json({ message: 'Server error during publication creation' });
    }
};
exports.createPublication = createPublication;
const getAllPublications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sortBy, category } = req.query;
        let order = [['createdAt', 'DESC']];
        if (sortBy === 'mostLiked') {
            order = [['likeCount', 'DESC']];
        }
        else if (sortBy === 'mostCommented') {
            order = [['commentCount', 'DESC']];
        }
        let whereClause = {};
        if (category) {
            whereClause.category = category;
        }
        const publications = await Publication_1.Publication.findAll({
            where: whereClause,
            order: order,
            include: [{ model: User_1.User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }]
        });
        const publicationsWithInfo = await addExtraInfoToPublications(publications, userId);
        res.json(publicationsWithInfo);
    }
    catch (error) {
        console.error('Get all publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllPublications = getAllPublications;
const updatePublication = async (req, res) => {
    try {
        const { publicationId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const publication = await Publication_1.Publication.findByPk(publicationId);
        if (!publication)
            return res.status(404).json({ message: 'Publication not found' });
        if (publication.userId !== userId)
            return res.status(403).json({ message: 'You are not authorized to edit this publication' });
        publication.content = content || publication.content;
        await publication.save();
        res.json({ message: 'Publication updated successfully', publication });
    }
    catch (error) {
        console.error('Update publication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updatePublication = updatePublication;
const likePublication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;
        const publication = await Publication_1.Publication.findByPk(publicationId);
        if (!publication)
            return res.status(404).json({ message: 'Publication not found' });
        const user = await User_1.User.findByPk(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        await database_1.default.transaction(async (t) => {
            await LikedPublication_1.LikedPublication.create({ userId, publicationId }, { transaction: t });
            await publication.increment('likeCount', { transaction: t });
            if (publication.category) {
                const currentInterests = user.interests || [];
                if (!currentInterests.includes(publication.category)) {
                    user.interests = [...currentInterests, publication.category];
                    await user.save({ transaction: t });
                }
            }
            await (0, utils_1.handleUserAction)(user, 10, t);
        });
        res.status(200).json({ message: 'Publication liked successfully' });
    }
    catch (error) {
        console.error('Like publication error:', error);
        if (error.name === 'SequelizeUniqueConstraintError')
            return res.status(409).json({ message: 'You have already liked this publication.' });
        res.status(500).json({ message: 'Server error' });
    }
};
exports.likePublication = likePublication;
const unlikePublication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { publicationId } = req.params;
        const publication = await Publication_1.Publication.findByPk(publicationId);
        if (!publication)
            return res.status(404).json({ message: 'Publication not found' });
        await database_1.default.transaction(async (t) => {
            const result = await LikedPublication_1.LikedPublication.destroy({ where: { userId, publicationId }, transaction: t });
            if (result === 0)
                throw new Error("Not liked");
            if (publication.likeCount > 0) {
                await publication.decrement('likeCount', { transaction: t });
            }
        });
        res.status(200).json({ message: 'Publication unliked successfully' });
    }
    catch (error) {
        if (error.message === 'Not liked')
            return res.status(404).json({ message: 'You have not liked this publication.' });
        console.error('Unlike publication error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.unlikePublication = unlikePublication;
const getMyLikedPublications = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User_1.User.findByPk(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const likedPublications = await user.getLikedPublications({
            include: [{ model: User_1.User, as: 'author', attributes: ['id', 'username', 'fullname', 'avatar'] }],
            order: [['createdAt', 'DESC']]
        });
        const publicationsWithInfo = await addExtraInfoToPublications(likedPublications, userId);
        res.json(publicationsWithInfo);
    }
    catch (error) {
        console.error('Get liked publications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getMyLikedPublications = getMyLikedPublications;
//# sourceMappingURL=publicationController.js.map